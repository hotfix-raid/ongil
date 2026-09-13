import { randomBytes, createHash } from "crypto";
import pool from "../db/pool";

/** Cookie name the login/callback/logout/me routes all read and write. */
export const SESSION_COOKIE = "ongil_session";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface SessionUser {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
}

/** Inserts a session row; caller sets the returned token as the cookie value. */
export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await pool.query(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)",
    [hashToken(token), userId, expiresAt]
  );
  return { token, expiresAt };
}

export async function getSessionUser(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  const { rows } = await pool.query(
    `SELECT u.id, u.nickname, u.avatar_url AS "avatarUrl"
     FROM sessions AS s
     JOIN users AS u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [hashToken(token)]
  );
  return rows[0] ?? null;
}

// ponytail: expired rows are only filtered out (expires_at > now()), never
// deleted, so the table grows unbounded — add a cleanup cron if it matters.
export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  await pool.query("DELETE FROM sessions WHERE token_hash = $1", [hashToken(token)]);
}
