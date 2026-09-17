import { NextRequest, NextResponse } from "next/server";
import pool from "@/src/lib/db/pool";
import { getSessionUser, SESSION_COOKIE } from "@/src/lib/auth/session";

export const runtime = "nodejs";

const TYPES = ["place", "course"];

const unauthorized = () => NextResponse.json({ error: "login required" }, { status: 401 });
const badRequest = () => NextResponse.json({ error: "invalid request" }, { status: 400 });

/** GET /api/likes?type=place|course → { ids: string[] } */
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return unauthorized();
  const type = request.nextUrl.searchParams.get("type");
  if (!type || !TYPES.includes(type)) return badRequest();

  const { rows } = await pool.query(
    "SELECT target_id FROM user_likes WHERE user_id = $1 AND target_type = $2 ORDER BY created_at",
    [user.id, type]
  );
  return NextResponse.json({ ids: rows.map((r) => r.target_id as string) });
}

/** PUT /api/likes { type, id, liked } — idempotent like/unlike. */
export async function PUT(request: NextRequest) {
  const user = await getSessionUser(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return unauthorized();
  const body = await request.json().catch(() => null);
  const { type, id, liked } = body ?? {};
  if (!TYPES.includes(type) || typeof id !== "string" || !id || id.length > 30 || typeof liked !== "boolean") {
    return badRequest();
  }

  if (liked) {
    await pool.query(
      "INSERT INTO user_likes (user_id, target_type, target_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
      [user.id, type, id]
    );
  } else {
    await pool.query(
      "DELETE FROM user_likes WHERE user_id = $1 AND target_type = $2 AND target_id = $3",
      [user.id, type, id]
    );
  }
  return NextResponse.json({ ok: true });
}

/** DELETE /api/likes?type=place|course — clears all likes of that type. */
export async function DELETE(request: NextRequest) {
  const user = await getSessionUser(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return unauthorized();
  const type = request.nextUrl.searchParams.get("type");
  if (!type || !TYPES.includes(type)) return badRequest();

  await pool.query("DELETE FROM user_likes WHERE user_id = $1 AND target_type = $2", [user.id, type]);
  return NextResponse.json({ ok: true });
}
