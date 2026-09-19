import { randomUUID } from "crypto";
import type { PoolClient } from "pg";
import pool from "@/src/lib/db/pool";
import {
  AssistantQuotaDatabaseError,
  AssistantQuotaMigrationError,
  isMissingAssistantQuotaTable,
} from "@/src/lib/assistant/errors";

const ROLLING_LIMIT = 10;
const DAILY_LIMIT = 100;
const CONCURRENT_LIMIT = 2;
const RESERVATION_TTL_MS = 35_000;

export type AssistantReservation = {
  requestId: string;
  userId: string;
};

export class AssistantUsageLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Assistant usage limit reached");
    this.name = "AssistantUsageLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function retrySeconds(value: unknown): number {
  const parsed = typeof value === "number" || typeof value === "string" ? Number(value) : NaN;
  const seconds = Number.isFinite(parsed) ? Math.ceil(parsed) : 1;
  return Math.max(1, Math.min(seconds, 86_400));
}

async function rollback(client: PoolClient): Promise<void> {
  try {
    await client.query("ROLLBACK");
  } catch {
    // The connection is released below; an already aborted transaction is safe to discard.
  }
}

export async function reserveAssistantRequest(userId: string): Promise<AssistantReservation> {
  const client = await pool.connect();
  const requestId = randomUUID();
  const reservationExpiresAt = new Date(Date.now() + RESERVATION_TTL_MS);

  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL statement_timeout = '2000ms'");

    // Ensure a durable per-user lock row, then lock it only for this short reservation transaction.
    await client.query(
      `INSERT INTO assistant_usage_user (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );
    const { rows: lockRows } = await client.query(
      "SELECT user_id FROM assistant_usage_user WHERE user_id = $1 FOR UPDATE",
      [userId]
    );
    if (lockRows.length === 0) {
      throw new AssistantQuotaDatabaseError({ code: "AUTHENTICATED_USER_MISSING" });
    }

    await client.query(
      `DELETE FROM assistant_request_usage
       WHERE user_id = $1
         AND (
           (finished_at IS NOT NULL AND started_at < date_trunc('day', (now() AT TIME ZONE 'UTC')) AT TIME ZONE 'UTC')
           OR (finished_at IS NULL AND reservation_expires_at <= now())
         )`,
      [userId]
    );

    // Keep the one-row aggregate legal even when this user has no usage rows.
    const { rows } = await client.query(
      `WITH bounds AS (
        SELECT now() AS as_of,
               now() - interval '1 hour' AS rolling_start,
               date_trunc('day', (now() AT TIME ZONE 'UTC')) AT TIME ZONE 'UTC' AS day_start,
               date_trunc('day', ((now() AT TIME ZONE 'UTC') + interval '1 day')) AT TIME ZONE 'UTC' AS next_day_start
      )
      SELECT
        COUNT(*) FILTER (WHERE u.started_at >= (SELECT rolling_start FROM bounds))::int AS "rollingCount",
        COUNT(*) FILTER (WHERE u.started_at >= (SELECT day_start FROM bounds))::int AS "dailyCount",
        COUNT(*) FILTER (
          WHERE u.finished_at IS NULL AND u.reservation_expires_at > (SELECT as_of FROM bounds)
        )::int AS "concurrentCount",
        EXTRACT(EPOCH FROM (
          MIN(u.started_at) FILTER (WHERE u.started_at >= (SELECT rolling_start FROM bounds))
          + interval '1 hour' - (SELECT as_of FROM bounds)
        )) AS "rollingRetry",
        EXTRACT(EPOCH FROM (
          MIN(u.reservation_expires_at) FILTER (
            WHERE u.finished_at IS NULL AND u.reservation_expires_at > (SELECT as_of FROM bounds)
          ) - (SELECT as_of FROM bounds)
        )) AS "concurrentRetry",
        EXTRACT(EPOCH FROM (
          (SELECT next_day_start FROM bounds) - (SELECT as_of FROM bounds)
        )) AS "dailyRetry"
      FROM assistant_request_usage AS u
      WHERE u.user_id = $1`,
      [userId]
    );

    const usage = rows[0] as Record<string, unknown>;
    const retryCandidates: number[] = [];
    if (Number(usage.rollingCount) >= ROLLING_LIMIT) retryCandidates.push(retrySeconds(usage.rollingRetry));
    if (Number(usage.dailyCount) >= DAILY_LIMIT) retryCandidates.push(retrySeconds(usage.dailyRetry));
    if (Number(usage.concurrentCount) >= CONCURRENT_LIMIT) {
      retryCandidates.push(retrySeconds(usage.concurrentRetry));
    }
    if (retryCandidates.length > 0) {
      await rollback(client);
      throw new AssistantUsageLimitError(Math.min(...retryCandidates));
    }

    await client.query(
      `INSERT INTO assistant_request_usage
         (request_id, user_id, started_at, reservation_expires_at)
       VALUES ($1, $2, now(), $3)`,
      [requestId, userId, reservationExpiresAt]
    );
    await client.query("COMMIT");
    return { requestId, userId };
  } catch (error) {
    if (error instanceof AssistantUsageLimitError) throw error;
    if (error instanceof AssistantQuotaDatabaseError) {
      await rollback(client);
      throw error;
    }
    await rollback(client);
    if (isMissingAssistantQuotaTable(error)) throw new AssistantQuotaMigrationError();
    if (error instanceof Error) throw new AssistantQuotaDatabaseError(error);
    throw new AssistantQuotaDatabaseError({ code: null });
  } finally {
    client.release();
  }
}

export async function releaseAssistantRequest(reservation: AssistantReservation): Promise<void> {
  try {
    await pool.query(
      `UPDATE assistant_request_usage
       SET finished_at = COALESCE(finished_at, now())
       WHERE request_id = $1 AND user_id = $2 AND finished_at IS NULL`,
      [reservation.requestId, reservation.userId]
    );
  } catch {
    // The reservation expiry is the safe fallback when release races a lost connection.
  }
}
