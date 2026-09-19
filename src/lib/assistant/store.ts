import type { PoolClient } from "pg";
import pool from "@/src/lib/db/pool";
import { AssistantDatabaseError } from "@/src/lib/assistant/errors";
import type { AssistantCitation } from "@/src/lib/assistant/assistant";

const MAX_SOURCE_COUNT = 20;
const MAX_SOURCE_TITLE = 240;
const MAX_SOURCE_URL = 2_048;
const MAX_PARTIAL_CONTENT = 3_000;
const GENERATION_TTL_MS = 90_000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type StoredMessage = {
  id: string;
  roomId: string;
  ordinal: number;
  role: "user" | "assistant";
  status: "in_progress" | "complete" | "failed" | "cancelled";
  content: string;
  sources: AssistantCitation[];
  clientRequestId: string | null;
  errorCode: string | null;
  errorId: string | null;
  generationExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PreparedAssistantRequest = {
  duplicate: boolean;
  roomId: string;
  userMessageId: string;
  assistantMessageId: string;
  userMessage: string;
  assistant: StoredMessage;
  history: Array<{ role: "user" | "assistant"; content: string }>;
};

export type AssistantRequestState = {
  roomId: string;
  userMessageId: string;
  assistantMessageId: string;
  userMessage: string;
  assistant: StoredMessage;
};

export class AssistantRoomNotFoundError extends Error {
  constructor() {
    super("Assistant room not found");
    this.name = "AssistantRoomNotFoundError";
  }
}

function isUniqueClientRequestError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "23505";
}

function rollback(client: PoolClient): Promise<void> {
  return client.query("ROLLBACK").then(() => undefined).catch(() => undefined);
}

function uuid(value: string, field: string): string {
  if (!UUID_RE.test(value)) throw new Error(`${field} must be a valid UUID`);
  return value;
}

function iso(value: unknown): string {
  return new Date(value as string | number | Date).toISOString();
}

function parseSources(value: unknown): AssistantCitation[] {
  if (!Array.isArray(value)) return [];
  const sources: AssistantCitation[] = [];
  for (const item of value.slice(0, MAX_SOURCE_COUNT)) {
    if (typeof item !== "object" || item === null) continue;
    const record = item as Record<string, unknown>;
    const urlValue = typeof record.url === "string" ? record.url.trim() : "";
    if (urlValue.length === 0 || urlValue.length > MAX_SOURCE_URL) continue;
    try {
      const parsed = new URL(urlValue);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") continue;
    } catch {
      continue;
    }
    const title = typeof record.title === "string" && record.title.trim().length > 0
      ? record.title.trim().slice(0, MAX_SOURCE_TITLE)
      : null;
    if (!sources.some((source) => source.url === urlValue)) sources.push({ title, url: urlValue });
  }
  return sources;
}

export function normalizeAssistantSources(value: unknown): AssistantCitation[] {
  return parseSources(value);
}

function messageFromRow(row: Record<string, unknown>): StoredMessage {
  return {
    id: row.id as string,
    roomId: row.roomId as string,
    ordinal: Number(row.ordinal),
    role: row.role as StoredMessage["role"],
    status: row.status as StoredMessage["status"],
    content: typeof row.content === "string" ? row.content : "",
    sources: parseSources(row.sources),
    clientRequestId: row.clientRequestId as string | null,
    errorCode: row.errorCode as string | null,
    errorId: row.errorId as string | null,
    generationExpiresAt: row.generationExpiresAt ? iso(row.generationExpiresAt) : null,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

async function requestState(userId: string, clientRequestId: string): Promise<AssistantRequestState | null> {
  const { rows } = await pool.query(
    `SELECT r.id AS "roomId", u.id AS "userMessageId", u.content AS "userMessage",
            a.id AS "assistantMessageId", a.status, a.content, a.sources,
            a.client_request_id AS "clientRequestId", a.error_code AS "errorCode",
            a.error_id AS "errorId", a.generation_expires_at AS "generationExpiresAt",
            a.created_at AS "createdAt", a.updated_at AS "updatedAt", a.room_id AS "assistantRoomId",
            a.ordinal, a.role
     FROM assistant_messages AS u
     JOIN assistant_rooms AS r ON r.id = u.room_id AND r.user_id = $1
     LEFT JOIN assistant_messages AS a ON a.room_id = u.room_id AND a.ordinal = u.ordinal + 1
     WHERE u.client_request_id = $2 AND u.role = 'user'
     LIMIT 1`,
    [userId, clientRequestId]
  );
  if (rows.length === 0 || !rows[0].assistantMessageId) return null;
  const row = rows[0] as Record<string, unknown>;
  return {
    roomId: row.roomId as string,
    userMessageId: row.userMessageId as string,
    assistantMessageId: row.assistantMessageId as string,
    userMessage: row.userMessage as string,
    assistant: messageFromRow({
      ...row,
      id: row.assistantMessageId,
      roomId: row.assistantRoomId,
    }),
  };
}

export async function findAssistantRequest(userId: string, clientRequestId: string): Promise<AssistantRequestState | null> {
  uuid(userId, "userId");
  uuid(clientRequestId, "clientRequestId");
  try {
    return await requestState(userId, clientRequestId);
  } catch (error) {
    throw new AssistantDatabaseError(error);
  }
}

async function expireGenerations(client: PoolClient, userId: string, roomId: string): Promise<void> {
  await client.query(
    `UPDATE assistant_messages AS m
     SET status = 'failed', error_code = 'generation_expired', error_id = NULL,
         generation_expires_at = NULL, content = LEFT(m.content, $3), updated_at = now()
     FROM assistant_rooms AS r
     WHERE m.room_id = r.id AND r.id = $1 AND r.user_id = $2
       AND m.role = 'assistant' AND m.status = 'in_progress'
       AND m.generation_expires_at IS NOT NULL AND m.generation_expires_at <= now()`,
    [roomId, userId, MAX_PARTIAL_CONTENT]
  );
}

export async function reconcileExpiredAssistantGenerations(userId: string, roomId?: string): Promise<void> {
  uuid(userId, "userId");
  if (roomId) uuid(roomId, "roomId");
  try {
    await pool.query(
      `UPDATE assistant_messages AS m
       SET status = 'failed', error_code = 'generation_expired', error_id = NULL,
           generation_expires_at = NULL, content = LEFT(m.content, $2), updated_at = now()
       FROM assistant_rooms AS r
       WHERE m.room_id = r.id AND r.user_id = $1
         AND ($3::uuid IS NULL OR r.id = $3::uuid)
         AND m.role = 'assistant' AND m.status = 'in_progress'
         AND m.generation_expires_at IS NOT NULL AND m.generation_expires_at <= now()`,
      [userId, MAX_PARTIAL_CONTENT, roomId ?? null]
    );
  } catch (error) {
    throw new AssistantDatabaseError(error);
  }
}

export async function prepareAssistantRequest(
  userId: string,
  roomId: string | null,
  message: string,
  clientRequestId: string
): Promise<PreparedAssistantRequest> {
  uuid(userId, "userId");
  if (roomId) uuid(roomId, "roomId");
  uuid(clientRequestId, "clientRequestId");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL statement_timeout = '2000ms'");

    const existing = await client.query(
      `SELECT r.id AS "roomId", u.id AS "userMessageId", u.content AS "userMessage",
              a.id AS "assistantMessageId", a.status, a.content, a.sources,
              a.client_request_id AS "clientRequestId", a.error_code AS "errorCode",
              a.error_id AS "errorId", a.generation_expires_at AS "generationExpiresAt",
              a.created_at AS "createdAt", a.updated_at AS "updatedAt", a.room_id AS "assistantRoomId",
              a.ordinal, a.role
       FROM assistant_messages AS u
       JOIN assistant_rooms AS r ON r.id = u.room_id AND r.user_id = $1
       LEFT JOIN assistant_messages AS a ON a.room_id = u.room_id AND a.ordinal = u.ordinal + 1
       WHERE u.client_request_id = $2 AND u.role = 'user'
       FOR UPDATE OF u
       LIMIT 1`,
      [userId, clientRequestId]
    );
    if (existing.rows.length > 0 && existing.rows[0].assistantMessageId) {
      await client.query("COMMIT");
      const row = existing.rows[0] as Record<string, unknown>;
      return {
        duplicate: true,
        roomId: row.roomId as string,
        userMessageId: row.userMessageId as string,
        assistantMessageId: row.assistantMessageId as string,
        userMessage: row.userMessage as string,
        assistant: messageFromRow({ ...row, id: row.assistantMessageId, roomId: row.assistantRoomId }),
        history: [],
      };
    }

    let actualRoomId = roomId;
    if (actualRoomId) {
      const room = await client.query(
        "SELECT id FROM assistant_rooms WHERE id = $1 AND user_id = $2 FOR UPDATE",
        [actualRoomId, userId]
      );
      if (room.rows.length === 0) throw new AssistantRoomNotFoundError();
    } else {
      const room = await client.query(
        `INSERT INTO assistant_rooms (user_id, title)
         VALUES ($1, LEFT($2, 200))
         RETURNING id`,
        [userId, message.trim() || "New chat"]
      );
      actualRoomId = room.rows[0].id as string;
    }

    await expireGenerations(client, userId, actualRoomId);
    const historyRows = await client.query(
      `SELECT u.content AS "userContent", a.content AS "assistantContent", u.ordinal
       FROM assistant_messages AS u
       JOIN assistant_messages AS a
         ON a.room_id = u.room_id AND a.ordinal = u.ordinal + 1
        AND a.role = 'assistant' AND a.status = 'complete'
       WHERE u.room_id = $1 AND u.role = 'user' AND u.status = 'complete'
       ORDER BY u.ordinal DESC
       LIMIT 6`,
      [actualRoomId]
    );
    const historyPairs = historyRows.rows.reverse();
    const history: Array<{ role: "user" | "assistant"; content: string }> = [];
    let historyCharacters = 0;
    for (let index = historyPairs.length - 1; index >= 0; index -= 1) {
      const pair = historyPairs[index];
      const pairLength = String(pair.userContent).length + String(pair.assistantContent).length;
      if (historyCharacters + pairLength + message.length > 12_000) continue;
      historyCharacters += pairLength;
      history.unshift(
        { role: "user", content: String(pair.userContent) },
        { role: "assistant", content: String(pair.assistantContent) }
      );
    }

    const ordinalResult = await client.query(
      "SELECT COALESCE(MAX(ordinal), 0)::int AS ordinal FROM assistant_messages WHERE room_id = $1",
      [actualRoomId]
    );
    const userOrdinal = Number(ordinalResult.rows[0].ordinal) + 1;
    const assistantOrdinal = userOrdinal + 1;
    const userResult = await client.query(
      `INSERT INTO assistant_messages (room_id, ordinal, role, status, content, client_request_id)
       VALUES ($1, $2, 'user', 'complete', $3, $4)
       RETURNING id`,
      [actualRoomId, userOrdinal, message, clientRequestId]
    );
    const assistantResult = await client.query(
      `INSERT INTO assistant_messages
         (room_id, ordinal, role, status, content, sources, generation_expires_at)
       VALUES ($1, $2, 'assistant', 'in_progress', '', '[]'::jsonb, $3)
       RETURNING id`,
      [actualRoomId, assistantOrdinal, new Date(Date.now() + GENERATION_TTL_MS)]
    );
    await client.query("UPDATE assistant_rooms SET updated_at = now() WHERE id = $1 AND user_id = $2", [actualRoomId, userId]);
    await client.query("COMMIT");
    return {
      duplicate: false,
      roomId: actualRoomId,
      userMessageId: userResult.rows[0].id as string,
      assistantMessageId: assistantResult.rows[0].id as string,
      userMessage: message,
      assistant: {
        id: assistantResult.rows[0].id as string,
        roomId: actualRoomId,
        ordinal: assistantOrdinal,
        role: "assistant",
        status: "in_progress",
        content: "",
        sources: [],
        clientRequestId: null,
        errorCode: null,
        errorId: null,
        generationExpiresAt: new Date(Date.now() + GENERATION_TTL_MS).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      history,
    };
  } catch (error) {
    await rollback(client);
    if (error instanceof AssistantRoomNotFoundError) throw error;
    if (isUniqueClientRequestError(error)) {
      try {
        const duplicate = await requestState(userId, clientRequestId);
        if (duplicate) {
          return { ...duplicate, duplicate: true, history: [] };
        }
      } catch (lookupError) {
        throw new AssistantDatabaseError(lookupError);
      }
    }
    throw new AssistantDatabaseError(error);
  } finally {
    client.release();
  }
}

export async function markAssistantComplete(
  userId: string,
  roomId: string,
  assistantMessageId: string,
  content: string,
  sources: unknown
): Promise<boolean> {
  try {
    const result = await pool.query(
      `UPDATE assistant_messages AS m
       SET status = 'complete', content = LEFT($4, $5), sources = $6::jsonb,
           generation_expires_at = NULL, updated_at = now()
       FROM assistant_rooms AS r
       WHERE m.id = $1 AND m.room_id = r.id AND r.id = $2 AND r.user_id = $3
         AND m.role = 'assistant' AND m.status = 'in_progress'`,
      [assistantMessageId, roomId, userId, content, MAX_PARTIAL_CONTENT, JSON.stringify(parseSources(sources))]
    );
    if (result.rowCount !== 1) return false;
    await pool.query("UPDATE assistant_rooms SET updated_at = now() WHERE id = $1 AND user_id = $2", [roomId, userId]);
    return true;
  } catch (error) {
    throw new AssistantDatabaseError(error);
  }
}

export async function markAssistantTerminal(
  userId: string,
  roomId: string,
  assistantMessageId: string,
  status: "failed" | "cancelled",
  content: string,
  errorCode: string,
  errorId: string
): Promise<boolean> {
  try {
    const result = await pool.query(
      `UPDATE assistant_messages AS m
       SET status = $4, content = LEFT($5, $6), error_code = $7, error_id = $8,
           generation_expires_at = NULL, updated_at = now()
       FROM assistant_rooms AS r
       WHERE m.id = $1 AND m.room_id = r.id AND r.id = $2 AND r.user_id = $3
         AND m.role = 'assistant' AND m.status = 'in_progress'`,
      [assistantMessageId, roomId, userId, status, content, MAX_PARTIAL_CONTENT, errorCode.slice(0, 80), errorId.slice(0, 160)]
    );
    return result.rowCount === 1;
  } catch (error) {
    throw new AssistantDatabaseError(error);
  }
}

function cursorEncode(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function cursorDecode(value: string | null, field: string): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const decoded = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Record<string, unknown>;
    if (!decoded || typeof decoded !== "object") throw new Error();
    return decoded;
  } catch {
    throw new Error(`${field} is invalid`);
  }
}

export async function listAssistantRooms(userId: string, cursor: string | null, requestedLimit: number): Promise<{
  rooms: Array<Record<string, unknown>>;
  nextCursor: string | null;
}> {
  uuid(userId, "userId");
  const limit = Math.max(1, Math.min(50, Number.isSafeInteger(requestedLimit) ? requestedLimit : 20));
  const parsed = cursorDecode(cursor, "cursor");
  const cursorDate = parsed?.updatedAt;
  const cursorId = parsed?.id;
  if ((cursorDate === undefined) !== (cursorId === undefined)) throw new Error("cursor is invalid");
  if (cursorDate !== undefined && (typeof cursorDate !== "string" || Number.isNaN(Date.parse(cursorDate)))) throw new Error("cursor is invalid");
  if (cursorId !== undefined) uuid(String(cursorId), "cursor");
  try {
    await reconcileExpiredAssistantGenerations(userId);
    const values: Array<string | number | null> = [userId];
    let condition = "";
    if (cursorDate && cursorId) {
      values.push(String(cursorDate), String(cursorId));
      condition = `AND (r.updated_at, r.id) < ($2::timestamptz, $3::uuid)`;
    }
    values.push(limit + 1);
    const { rows } = await pool.query(
      `SELECT r.id, r.title, r.created_at AS "createdAt", r.updated_at AS "updatedAt",
              latest.content AS snippet
       FROM assistant_rooms AS r
       LEFT JOIN LATERAL (
         SELECT LEFT(m.content, 180) AS content
         FROM assistant_messages AS m
         WHERE m.room_id = r.id
         ORDER BY m.ordinal DESC, m.id DESC
         LIMIT 1
       ) AS latest ON true
       WHERE r.user_id = $1 ${condition}
       ORDER BY r.updated_at DESC, r.id DESC
       LIMIT $${values.length}`,
      values
    );
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
      snippet: (row.snippet as string | null) ?? null,
    }));
    const last = page[page.length - 1];
    return {
      rooms: page,
      nextCursor: hasMore && last ? cursorEncode({ updatedAt: last.updatedAt, id: last.id }) : null,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "cursor is invalid") throw error;
    throw new AssistantDatabaseError(error);
  }
}

export async function listAssistantMessages(userId: string, roomId: string, cursor: string | null, requestedLimit: number): Promise<{
  messages: StoredMessage[];
  nextCursor: string | null;
}> {
  uuid(userId, "userId");
  uuid(roomId, "roomId");
  const limit = Math.max(1, Math.min(100, Number.isSafeInteger(requestedLimit) ? requestedLimit : 50));
  const parsed = cursorDecode(cursor, "cursor");
  const cursorOrdinal = parsed?.ordinal;
  const cursorId = parsed?.id;
  if ((cursorOrdinal === undefined) !== (cursorId === undefined)) throw new Error("cursor is invalid");
  if (cursorOrdinal !== undefined && (!Number.isSafeInteger(cursorOrdinal) || Number(cursorOrdinal) < 1)) throw new Error("cursor is invalid");
  if (cursorId !== undefined) uuid(String(cursorId), "cursor");
  try {
    const room = await pool.query("SELECT id FROM assistant_rooms WHERE id = $1 AND user_id = $2", [roomId, userId]);
    if (room.rows.length === 0) throw new AssistantRoomNotFoundError();
    await reconcileExpiredAssistantGenerations(userId, roomId);
    const values: Array<string | number> = [roomId, userId];
    let condition = "";
    if (cursorOrdinal !== undefined && cursorId) {
      values.push(Number(cursorOrdinal), String(cursorId));
      condition = `AND (m.ordinal, m.id) < ($3::int, $4::uuid)`;
    }
    values.push(limit + 1);
    const { rows } = await pool.query(
      `SELECT m.id, m.room_id AS "roomId", m.ordinal, m.role, m.status, m.content, m.sources,
              m.client_request_id AS "clientRequestId", m.error_code AS "errorCode",
              m.error_id AS "errorId", m.generation_expires_at AS "generationExpiresAt",
              m.created_at AS "createdAt", m.updated_at AS "updatedAt"
       FROM assistant_messages AS m
       JOIN assistant_rooms AS r ON r.id = m.room_id AND r.user_id = $2
       WHERE m.room_id = $1 ${condition}
       ORDER BY m.ordinal DESC, m.id DESC
       LIMIT $${values.length}`,
      values
    );
    const hasMore = rows.length > limit;
    const page = rows
      .slice(0, limit)
      .map((row) => messageFromRow(row as Record<string, unknown>))
      .reverse();
    const oldest = page[0];
    return {
      messages: page,
      nextCursor: hasMore && oldest ? cursorEncode({ ordinal: oldest.ordinal, id: oldest.id }) : null,
    };
  } catch (error) {
    if (error instanceof AssistantRoomNotFoundError) throw error;
    if (error instanceof Error && error.message === "cursor is invalid") throw error;
    throw new AssistantDatabaseError(error);
  }
}

export async function deleteAssistantRoom(userId: string, roomId: string): Promise<boolean> {
  uuid(userId, "userId");
  uuid(roomId, "roomId");
  try {
    const result = await pool.query("DELETE FROM assistant_rooms WHERE id = $1 AND user_id = $2", [roomId, userId]);
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    throw new AssistantDatabaseError(error);
  }
}
