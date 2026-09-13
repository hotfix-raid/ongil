import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { kakaoAuthorizeUrl } from "@/src/lib/auth/kakao";

export const runtime = "nodejs";

/** Short-lived CSRF guard: must match the `state` the callback receives back. */
const STATE_COOKIE = "ongil_oauth_state";

export async function GET() {
  try {
    const state = randomBytes(16).toString("base64url");
    const response = NextResponse.redirect(kakaoAuthorizeUrl(state));
    response.cookies.set(STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    return response;
  } catch (e) {
    console.error("Failed to start Kakao login", e);
    return NextResponse.json({ error: "Failed to start Kakao login" }, { status: 500 });
  }
}
