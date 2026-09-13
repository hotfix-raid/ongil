import { NextRequest, NextResponse } from "next/server";
import { destroySession, SESSION_COOKIE } from "@/src/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  await destroySession(request.cookies.get(SESSION_COOKIE)?.value);
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
