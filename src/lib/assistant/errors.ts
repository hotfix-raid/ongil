type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null ? value as UnknownRecord : null;
}

function safeString(value: unknown, maxLength = 240): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/\bsk-[A-Za-z0-9_-]+\b/g, "[redacted]")
    .slice(0, maxLength);
}

function sourceCode(error: unknown): string | null {
  return safeString(record(error)?.code, 80);
}

function postgresDiagnostic(error: unknown, field: "message" | "hint"): string | null {
  const value = safeString(record(error)?.[field], 320);
  if (!value) return null;
  return value
    .replace(/'(?:''|[^'])*'/g, "'[redacted]'")
    .replace(/"(?:""|[^"])*"/g, '"[redacted]"');
}

export class AssistantConfigurationError extends Error {
  readonly code = "OPENAI_API_KEY_UNSET";

  constructor() {
    super("OpenAI configuration is missing");
    this.name = "AssistantConfigurationError";
  }
}

export class AssistantDatabaseError extends Error {
  readonly code: string | null;
  readonly postgresMessage: string | null;
  readonly postgresHint: string | null;

  constructor(cause: unknown) {
    super("Assistant database lookup failed");
    this.name = "AssistantDatabaseError";
    this.code = sourceCode(cause);
    this.postgresMessage = postgresDiagnostic(cause, "message");
    this.postgresHint = postgresDiagnostic(cause, "hint");
  }
}

export class AssistantQuotaMigrationError extends Error {
  readonly code = "ASSISTANT_USAGE_MIGRATION_REQUIRED";

  constructor() {
    super("Assistant quota migration is required");
    this.name = "AssistantQuotaMigrationError";
  }
}

export class AssistantQuotaDatabaseError extends Error {
  readonly code: string | null;
  readonly postgresMessage: string | null;
  readonly postgresHint: string | null;

  constructor(cause: unknown) {
    super("Assistant quota database is unavailable");
    this.name = "AssistantQuotaDatabaseError";
    this.code = sourceCode(cause);
    this.postgresMessage = postgresDiagnostic(cause, "message");
    this.postgresHint = postgresDiagnostic(cause, "hint");
  }
}

export type OpenAIErrorDetails = {
  type: string | null;
  code: string | null;
  message: string | null;
  incompleteReason?: string | null;
};

export class AssistantOpenAIError extends Error {
  readonly status: number;
  readonly upstreamRequestId: string | null;
  readonly upstreamType: string | null;
  readonly upstreamCode: string | null;
  readonly upstreamMessage: string | null;
  readonly upstreamIncompleteReason: string | null;
  readonly upstreamStatus: number | null;

  constructor(
    status: number,
    upstreamRequestId: string | null,
    details: OpenAIErrorDetails = { type: null, code: null, message: null, incompleteReason: null },
    upstreamStatus: number | null = status
  ) {
    super("OpenAI Responses API request failed");
    this.name = "AssistantOpenAIError";
    this.status = status;
    this.upstreamRequestId = safeString(upstreamRequestId, 160);
    this.upstreamType = details.type;
    this.upstreamCode = details.code;
    this.upstreamMessage = details.message;
    this.upstreamIncompleteReason = details.incompleteReason ?? null;
    this.upstreamStatus = upstreamStatus;
  }
}

export function isMissingAssistantQuotaTable(error: unknown): boolean {
  const source = record(error);
  const message = safeString(source?.message, 300) ?? "";
  return source?.code === "42P01" && /assistant_(usage_user|request_usage)/.test(message);
}

export function logAssistantError(errorId: string, stage: string, error: unknown): void {
  const source = record(error);
  const entry: UnknownRecord = {
    event: "assistant_error",
    errorId,
    stage,
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorCode: sourceCode(error),
    status: typeof source?.status === "number" ? source.status : null,
    message: "assistant request failed",
  };

  if (error instanceof AssistantOpenAIError) {
    entry.message = "OpenAI Responses API request failed";
    entry.upstreamRequestId = error.upstreamRequestId;
    entry.upstreamStatus = error.upstreamStatus;
    entry.upstreamType = error.upstreamType;
    entry.upstreamCode = error.upstreamCode;
    entry.upstreamMessage = error.upstreamMessage;
    entry.upstreamIncompleteReason = error.upstreamIncompleteReason;
  } else if (error instanceof AssistantConfigurationError) {
    entry.message = "OpenAI configuration is missing";
  } else if (error instanceof AssistantDatabaseError) {
    entry.message = "Assistant database lookup failed";
    entry.postgresMessage = error.postgresMessage;
    entry.postgresHint = error.postgresHint;
  } else if (error instanceof AssistantQuotaMigrationError) {
    entry.message = "Assistant quota migration is required";
  } else if (error instanceof AssistantQuotaDatabaseError) {
    entry.message = "Assistant quota database is unavailable";
    entry.postgresMessage = error.postgresMessage;
    entry.postgresHint = error.postgresHint;
  }

  console.error(JSON.stringify(entry));
}
