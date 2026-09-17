import { NextRequest, NextResponse } from "next/server";
import pool from "@/src/lib/db/pool";
import { getSessionUser, SESSION_COOKIE } from "@/src/lib/auth/session";

export const runtime = "nodejs";

const KEYS = ["petFriendly", "wheelchair", "stroller", "senior", "parking"] as const;

const unauthorized = () => NextResponse.json({ error: "login required" }, { status: 401 });

/** GET → { accessibilityDefaults } (keys never saved are omitted; client fills defaults). */
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return unauthorized();

  const { rows } = await pool.query("SELECT accessibility_defaults FROM users WHERE id = $1", [user.id]);
  return NextResponse.json({ accessibilityDefaults: rows[0]?.accessibility_defaults ?? {} });
}

/** PUT { petFriendly, wheelchair, stroller, senior, parking } — all booleans. */
export async function PUT(request: NextRequest) {
  const user = await getSessionUser(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return unauthorized();
  const body = await request.json().catch(() => null);
  if (!body || KEYS.some((k) => typeof body[k] !== "boolean")) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  // Only whitelisted keys reach the DB.
  const value = Object.fromEntries(KEYS.map((k) => [k, body[k]]));
  await pool.query(
    "UPDATE users SET accessibility_defaults = $1, updated_at = now() WHERE id = $2",
    [JSON.stringify(value), user.id]
  );
  return NextResponse.json({ accessibilityDefaults: value });
}
