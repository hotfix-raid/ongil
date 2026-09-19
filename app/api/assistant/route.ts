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
  AssistantRoomNotFoundError,
  findAssistantRequest,
  markAssistantComplete,
  markAssistantTerminal,
  normalizeAssistantSources,
  prepareAssistantRequest,
  type AssistantRequestState,
} from "@/src/lib/assistant/store";
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
  if (error instanceof AssistantRoomNotFoundError) return "room_not_found";
  if (error instanceof RequestBodyTooLargeError) return "body_too_large";
  if (error instanceof SyntaxError) return "invalid_json";
  if (error instanceof Error && /^(Request body|clientRequestId|roomId|message|history|messages|The final|message history|cursor)/.test(error.message)) {
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

function sameOrigin(request: NextRequest): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;
  const candidate = request.headers.get("origin") ?? request.headers.get("referer");
  if (!candidate) return fetchSite === "same-origin";
  try {
    return new URL(candidate).origin === new URL(request.url).origin || fetchSite === "same-origin";
  } catch {
    return fetchSite === "same-origin";
  }
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseRequest(body: unknown): { roomId: string | null; message: string; clientRequestId: string } {
  if (!isRecord(body)) throw new Error("Request body must be a JSON object");
  if (body.history !== undefined || body.messages !== undefined) {
    throw new Error("history and messages are not accepted; use roomId");
  }
  const roomIdValue = body.roomId === undefined || body.roomId === null ? null : body.roomId;
  const roomId: string | null = typeof roomIdValue === "string" ? roomIdValue : null;
  if (roomIdValue !== null && typeof roomIdValue !== "string") throw new Error("roomId must be a UUID or null");
  if (typeof body.clientRequestId !== "string" || body.clientRequestId.length > 80) {
    throw new Error("clientRequestId must be a valid UUID");
  }
  const clientRequestId: string = body.clientRequestId;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientRequestId)) {
    throw new Error("clientRequestId must be a valid UUID");
  }
  const messages = parseAssistantMessages({ message: body.message });
  return { roomId, message: messages[0].content, clientRequestId };
}

function duplicateResponse(state: AssistantRequestState, errorId: string): Response {
  if (state.assistant.status === "in_progress") {
    return NextResponse.json(
      {
        error: "Assistant request is already in progress. Retry after it finishes.",
        code: "assistant_request_in_progress",
        roomId: state.roomId,
        userMessageId: state.userMessageId,
        assistantMessageId: state.assistantMessageId,
        errorId,
      },
      {
        status: 409,
        headers: {
          "Retry-After": "2",
          "X-Assistant-Error-Id": errorId,
        },
      }
    );
  }
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const emit = (event: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      emit({
        type: "accepted",
        roomId: state.roomId,
        userMessageId: state.userMessageId,
        assistantMessageId: state.assistantMessageId,
      });
      if (state.assistant.status === "complete") {
        emit({ type: "completed", message: state.assistant.content, sources: state.assistant.sources });
      } else if (state.assistant.status === "failed" || state.assistant.status === "cancelled") {
        emit({
          type: "error",
          error: "AI assistant request failed.",
          errorId: state.assistant.errorId ?? errorId,
          classification: state.assistant.errorCode ?? state.assistant.status,
        });
      }
      controller.close();
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
}

export async function POST(request: NextRequest) {
  const errorId = randomUUID();
  const startedAt = Date.now();
  logAssistantLifecycle(errorId, startedAt, "started");
  let reservation: AssistantReservation | undefined;
  try {
    if (!sameOrigin(request)) return internalError("Same-origin request required", 403, errorId);
    const user = await getSessionUser(request.cookies.get(SESSION_COOKIE)?.value);
    if (!user) return NextResponse.json({ error: "Login required" }, { status: 401, headers: { "X-Assistant-Error-Id": errorId } });

    const parsed = parseRequest(await readBoundedJson(request));
    const prior = await findAssistantRequest(user.id, parsed.clientRequestId);
    if (prior) return duplicateResponse(prior, errorId);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new AssistantConfigurationError();
    reservation = await reserveAssistantRequest(user.id);
    logAssistantLifecycle(errorId, startedAt, "quota_reserved");
    const prepared = await prepareAssistantRequest(user.id, parsed.roomId, parsed.message, parsed.clientRequestId);
    if (prepared.duplicate) {
      await releaseAssistantRequest(reservation);
      reservation = undefined;
      return duplicateResponse(prepared, errorId);
    }

    const messages = parseAssistantMessages({
      messages: [...prepared.history, { role: "user", content: prepared.userMessage }],
    });
    const activeReservation = reservation;
    const encoder = new TextEncoder();
    const abortController = new AbortController();
    let cancelled = false;
    let partialText = "";
    let terminalPromise: Promise<boolean> | undefined;
    let releasePromise: Promise<void> | undefined;
    const releaseOnce = () => {
      if (!releasePromise) releasePromise = releaseAssistantRequest(activeReservation);
      return releasePromise;
    };
    const cancelAndPersist = () => {
      cancelled = true;
      abortController.abort();
      if (!terminalPromise) {
        terminalPromise = markAssistantTerminal(
          user.id,
          prepared.roomId,
          prepared.assistantMessageId,
          "cancelled",
          partialText,
          "cancelled",
          errorId
        ).catch((error) => {
          logAssistantError(errorId, "persistence", error);
          return false;
        });
      }
      return Promise.all([terminalPromise, releaseOnce()]).then(([persisted]) => {
        if (!persisted) logAssistantLifecycle(errorId, startedAt, "persistence_conflict", { status: "cancelled" });
      });
    };
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        logAssistantLifecycle(errorId, startedAt, "stream_started");
        const enqueueEvent = (event: unknown) => {
          if (!cancelled) controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        };
        enqueueEvent({
          type: "accepted",
          roomId: prepared.roomId,
          userMessageId: prepared.userMessageId,
          assistantMessageId: prepared.assistantMessageId,
        });
        void (async () => {
          let result: Awaited<ReturnType<typeof runAssistantStream>> | undefined;
          let failure: unknown;
          try {
            result = await runAssistantStream(messages, apiKey, (delta) => {
              partialText = `${partialText}${delta}`.slice(0, 3_000);
              enqueueEvent({ type: "delta", delta });
            }, abortController.signal, errorId);
          } catch (error) {
            failure = error;
            if (!cancelled) {
              logAssistantError(errorId, error instanceof AssistantDatabaseError ? "db_tool" : "openai", error);
              enqueueEvent({
                type: "error",
                error: streamErrorMessage(error),
                errorId,
                classification: assistantErrorClassification(error),
              });
            }
          } finally {
            if (cancelled || abortController.signal.aborted) {
              await cancelAndPersist();
            } else if (result) {
              let persisted = false;
              try {
                persisted = await markAssistantComplete(user.id, prepared.roomId, prepared.assistantMessageId, result.message, result.sources);
              } catch (error) {
                logAssistantError(errorId, "persistence", error);
              }
              if (persisted) {
                enqueueEvent({ type: "completed", message: result.message, sources: normalizeAssistantSources(result.sources) });
              } else {
                logAssistantLifecycle(errorId, startedAt, "persistence_conflict", { status: "complete" });
                try {
                  const failed = await markAssistantTerminal(
                    user.id,
                    prepared.roomId,
                    prepared.assistantMessageId,
                    "failed",
                    partialText,
                    "persistence_conflict",
                    errorId
                  );
                  if (!failed) logAssistantLifecycle(errorId, startedAt, "persistence_conflict", { status: "failed" });
                } catch (error) {
                  logAssistantError(errorId, "persistence", error);
                }
                if (!cancelled) {
                  enqueueEvent({
                    type: "error",
                    error: "AI assistant response could not be saved.",
                    errorId,
                    classification: "persistence_conflict",
                  });
                }
              }
            } else {
              const classification = assistantErrorClassification(failure);
              let persisted = false;
              try {
                persisted = await markAssistantTerminal(
                  user.id,
                  prepared.roomId,
                  prepared.assistantMessageId,
                  "failed",
                  partialText,
                  classification,
                  errorId
                );
              } catch (error) {
                logAssistantError(errorId, "persistence", error);
              }
              if (!persisted) logAssistantLifecycle(errorId, startedAt, "persistence_conflict", { status: "failed" });
            }
            await releaseOnce();
            request.signal.removeEventListener("abort", cancelAndPersist);
            logAssistantLifecycle(errorId, startedAt, "released");
            if (!cancelled) controller.close();
          }
        })();
      },
      cancel() {
        logAssistantLifecycle(errorId, startedAt, "stream_cancelled");
        request.signal.removeEventListener("abort", cancelAndPersist);
        return cancelAndPersist();
      },
    });
    request.signal.addEventListener("abort", cancelAndPersist, { once: true });
    reservation = undefined;
    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
        "X-Assistant-Error-Id": errorId,
      },
    });
  } catch (error) {
    if (reservation) await releaseAssistantRequest(reservation);
    logAssistantLifecycle(errorId, startedAt, "failed", { classification: assistantErrorClassification(error) });
    if (error instanceof AssistantUsageLimitError) {
      return NextResponse.json(
        { error: "Assistant usage limit reached. Please try again later.", errorId },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds), "X-Assistant-Error-Id": errorId } }
      );
    }
    if (error instanceof AssistantRoomNotFoundError) return internalError("Assistant room not found", 404, errorId);
    if (error instanceof AssistantQuotaMigrationError) {
      logAssistantError(errorId, "quota", error);
      return internalError("AI assistant quota is not configured. Apply docs/migrations/003_assistant_usage.sql.", 503, errorId);
    }
    if (error instanceof RequestBodyTooLargeError) return internalError(error.message, 413, errorId);
    if (error instanceof SyntaxError) return internalError("Request body must be valid JSON", 400, errorId);
    if (error instanceof Error && /^(Request body|clientRequestId|roomId|message|history|messages|The final|message history)/.test(error.message)) {
      return internalError(error.message, 400, errorId);
    }
    if (error instanceof AssistantQuotaDatabaseError) {
      logAssistantError(errorId, "quota", error);
      return internalError("AI assistant quota service is unavailable.", 503, errorId);
    }
    if (error instanceof AssistantDatabaseError) {
      logAssistantError(errorId, "database", error);
      return internalError("AI assistant data lookup failed.", 502, errorId);
    }
    if (error instanceof AssistantOpenAIError) {
      logAssistantError(errorId, "openai", error);
      return internalError("AI assistant request failed.", error.status === 429 ? 503 : 502, errorId);
    }
    logAssistantError(errorId, "request", error);
    return internalError("AI assistant request failed.", 500, errorId);
  }
}
