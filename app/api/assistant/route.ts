import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, SESSION_COOKIE } from "@/src/lib/auth/session";
import { assistantLimits, parseAssistantMessages, runAssistantStream } from "@/src/lib/assistant/assistant";
import {
  AssistantConfigurationError,
  AssistantDatabaseError,
  AssistantOpenAIError,
  AssistantQuotaDatabaseError,
  AssistantQuotaMigrationError,
  logAssistantError,
} from "@/src/lib/assistant/errors";
import {
  AssistantUsageLimitError,
  releaseAssistantRequest,
  reserveAssistantRequest,
  type AssistantReservation,
} from "@/src/lib/assistant/usage";

export const runtime = "nodejs";

class RequestBodyTooLargeError extends Error {}

function internalError(message: string, status: number, errorId: string, headers?: HeadersInit) {
  return NextResponse.json(
    { error: message, errorId },
    { status, headers: { "X-Assistant-Error-Id": errorId, ...headers } }
  );
}

function assistantErrorClassification(error: unknown): string {
  if (error instanceof AssistantDatabaseError) return "database";
  if (error instanceof AssistantOpenAIError) return "openai";
  if (error instanceof AssistantUsageLimitError) return "usage_limit";
  if (error instanceof AssistantQuotaMigrationError) return "quota_migration";
  if (error instanceof AssistantQuotaDatabaseError) return "quota_database";
  if (error instanceof RequestBodyTooLargeError) return "body_too_large";
  if (error instanceof SyntaxError) return "invalid_json";
  if (error instanceof Error && /^(Request body|messages|history|message|The final|message history)/.test(error.message)) {
    return "invalid_request";
  }
  return "unknown";
}

function logAssistantLifecycle(errorId: string, startedAt: number, stage: string, details?: Record<string, unknown>): void {
  console.log(JSON.stringify({
    event: "assistant_request_lifecycle",
    errorId,
    stage,
    elapsedMs: Math.max(0, Date.now() - startedAt),
    ...details,
  }));
}

function streamErrorMessage(error: unknown): string {
  if (error instanceof AssistantDatabaseError) return "AI assistant data lookup failed.";
  return "AI assistant request failed.";
}

async function readBoundedJson(request: NextRequest): Promise<unknown> {
  if (!request.body) throw new SyntaxError("Request body is empty");
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > assistantLimits.maxRequestBytes) {
        await reader.cancel();
        throw new RequestBodyTooLargeError("Request body is too large");
      }
      chunks.push(decoder.decode(value, { stream: true }));
    }
    chunks.push(decoder.decode());
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(chunks.join(""));
}

export async function POST(request: NextRequest) {
  const errorId = randomUUID();
  const startedAt = Date.now();
  logAssistantLifecycle(errorId, startedAt, "started");
  let user;
  try {
    user = await getSessionUser(request.cookies.get(SESSION_COOKIE)?.value);
  } catch (error) {
    logAssistantError(errorId, "auth", error);
    logAssistantLifecycle(errorId, startedAt, "failed", { classification: "auth" });
    return internalError("Unable to verify login", 500, errorId);
  }
  if (!user) {
    logAssistantLifecycle(errorId, startedAt, "failed", { classification: "auth" });
    return NextResponse.json(
      { error: "Login required" },
      { status: 401, headers: { "X-Assistant-Error-Id": errorId } }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new AssistantConfigurationError();
    logAssistantError(errorId, "openai", error);
    logAssistantLifecycle(errorId, startedAt, "failed", { classification: "configuration" });
    return internalError("AI assistant is not configured: OPENAI_API_KEY is unset.", 503, errorId);
  }

  let reservation: AssistantReservation | undefined;
  let stage: "body_validation" | "quota" | "openai" = "body_validation";
  try {
    const body = await readBoundedJson(request);
    const messages = parseAssistantMessages(body);
    logAssistantLifecycle(errorId, startedAt, "request_validated");
    stage = "quota";
    reservation = await reserveAssistantRequest(user.id);
    logAssistantLifecycle(errorId, startedAt, "quota_reserved");
    stage = "openai";
    const activeReservation = reservation;
    const encoder = new TextEncoder();
    const abortController = new AbortController();
    let cancelled = false;
    let releasePromise: Promise<void> | undefined;
    const releaseOnce = () => {
      if (!releasePromise) releasePromise = releaseAssistantRequest(activeReservation);
      return releasePromise;
    };
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        logAssistantLifecycle(errorId, startedAt, "stream_started");
        const enqueueEvent = (event: unknown) => {
          if (!cancelled) controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        };

        void (async () => {
          try {
            const result = await runAssistantStream(messages, apiKey, (delta) => {
              enqueueEvent({ type: "delta", delta });
            }, abortController.signal, errorId);
            enqueueEvent({ type: "completed", message: result.message, sources: result.sources });
            logAssistantLifecycle(errorId, startedAt, "stream_completed");
          } catch (error) {
            if (!cancelled) {
              logAssistantError(errorId, error instanceof AssistantDatabaseError ? "db_tool" : "openai", error);
              logAssistantLifecycle(errorId, startedAt, "stream_failed", {
                classification: assistantErrorClassification(error),
              });
              enqueueEvent({
                type: "error",
                error: streamErrorMessage(error),
                errorId,
                classification: assistantErrorClassification(error),
              });
            }
          } finally {
            await releaseOnce();
            logAssistantLifecycle(errorId, startedAt, "released");
            if (!cancelled) controller.close();
          }
        })();
      },
      cancel() {
        cancelled = true;
        abortController.abort();
        logAssistantLifecycle(errorId, startedAt, "stream_cancelled");
        return releaseOnce();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
        "X-Assistant-Error-Id": errorId,
      },
    });
  } catch (error) {
    logAssistantLifecycle(errorId, startedAt, "failed", { classification: assistantErrorClassification(error) });
    if (error instanceof AssistantUsageLimitError) {
      return NextResponse.json(
        { error: "Assistant usage limit reached. Please try again later.", errorId },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds), "X-Assistant-Error-Id": errorId } }
      );
    }
    if (error instanceof AssistantQuotaMigrationError) {
      logAssistantError(errorId, "quota", error);
      return internalError(
        "AI assistant quota is not configured. Apply docs/migrations/003_assistant_usage.sql.",
        503,
        errorId
      );
    }
    if (error instanceof RequestBodyTooLargeError) {
      logAssistantError(errorId, "body_validation", error);
      return internalError(error.message, 413, errorId);
    }
    if (error instanceof SyntaxError) {
      logAssistantError(errorId, "body_validation", error);
      return internalError("Request body must be valid JSON", 400, errorId);
    }
    if (error instanceof Error && /^(Request body|messages|history|message|The final|message history)/.test(error.message)) {
      logAssistantError(errorId, "body_validation", error);
      return internalError(error.message, 400, errorId);
    }
    if (error instanceof AssistantQuotaDatabaseError || stage === "quota") {
      logAssistantError(errorId, "quota", error);
      return internalError("AI assistant quota service is unavailable.", 503, errorId);
    }
    if (error instanceof AssistantDatabaseError) {
      logAssistantError(errorId, "db_tool", error);
      return internalError("AI assistant data lookup failed.", 502, errorId);
    }
    if (error instanceof AssistantOpenAIError) {
      logAssistantError(errorId, "openai", error);
      return internalError("AI assistant request failed.", error.status === 429 ? 503 : 502, errorId);
    }
    if (stage === "body_validation") {
      logAssistantError(errorId, "body_validation", error);
      return internalError("Request body could not be processed.", 400, errorId);
    }
    logAssistantError(errorId, "openai", error);
    return internalError("AI assistant request failed.", 502, errorId);
  }
}
