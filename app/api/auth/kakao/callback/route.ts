import { NextRequest, NextResponse } from "next/server";
import pool from "@/src/lib/db/pool";
import { exchangeKakaoCode, fetchKakaoProfile } from "@/src/lib/auth/kakao";
import { createSession, SESSION_COOKIE } from "@/src/lib/auth/session";

export const runtime = "nodejs";

const STATE_COOKIE = "ongil_oauth_state";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const kakaoError = searchParams.get("error");
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;

  // Not request.nextUrl.origin: with `next dev --hostname 0.0.0.0` that can
  // resolve to 0.0.0.0, sending the browser to a host that doesn't share
  // cookies with the one Kakao's redirect_uri (and our cookies) use.
  const home = new URL("/", process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000");
  const failed = () => {
    const response = NextResponse.redirect(home);
    response.cookies.delete(STATE_COOKIE);
    return response;
  };

  if (kakaoError || !code || !state || !expectedState || state !== expectedState) {
    console.error(
      kakaoError ? `Kakao login denied or errored: ${kakaoError}` : "Kakao OAuth state mismatch (CSRF check failed or attempt expired)"
    );
    return failed();
  }

  try {
    const accessToken = await exchangeKakaoCode(code);
    const profile = await fetchKakaoProfile(accessToken);

    const { rows } = await pool.query(
      `INSERT INTO users (kakao_id, nickname, avatar_url)
       VALUES ($1, $2, $3)
       ON CONFLICT (kakao_id) DO UPDATE
         SET nickname = EXCLUDED.nickname, avatar_url = EXCLUDED.avatar_url, updated_at = now()
       RETURNING id`,
      [profile.id, profile.nickname, profile.avatarUrl]
    );
    const userId = rows[0].id as string;
    const { token, expiresAt } = await createSession(userId);

    const response = NextResponse.redirect(home);
    response.cookies.delete(STATE_COOKIE);
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
    return response;
  } catch (e) {
    console.error("Kakao OAuth callback failed", e);
    return failed();
  }
}
