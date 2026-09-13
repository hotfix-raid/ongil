// Kakao OAuth (REST API / 서버 사이드 인가 코드 방식).
// https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api

const KAKAO_AUTHORIZE_URL = "https://kauth.kakao.com/oauth/authorize";
const KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token";
const KAKAO_USER_URL = "https://kapi.kakao.com/v2/user/me";

function requiredEnv(name: "KAKAO_REST_API_KEY" | "KAKAO_REDIRECT_URI"): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function kakaoAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requiredEnv("KAKAO_REST_API_KEY"),
    redirect_uri: requiredEnv("KAKAO_REDIRECT_URI"),
    response_type: "code",
    // 카카오 개발자 콘솔 > 카카오 로그인 > 동의항목에 닉네임/프로필 사진이
    // 활성화되어 있어야 실제로 값이 내려온다.
    scope: "profile_nickname,profile_image",
    state,
  });
  return `${KAKAO_AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeKakaoCode(code: string): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: requiredEnv("KAKAO_REST_API_KEY"),
    redirect_uri: requiredEnv("KAKAO_REDIRECT_URI"),
    code,
  });
  // 카카오 콘솔에서 "Client Secret"을 활성화한 경우에만 필요.
  if (process.env.KAKAO_CLIENT_SECRET) {
    body.set("client_secret", process.env.KAKAO_CLIENT_SECRET);
  }

  const response = await fetch(KAKAO_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    throw new Error(`Kakao token exchange failed: ${response.status} ${await response.text()}`);
  }
  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

export interface KakaoProfile {
  id: number;
  nickname: string | null;
  avatarUrl: string | null;
}

export async function fetchKakaoProfile(accessToken: string): Promise<KakaoProfile> {
  const response = await fetch(KAKAO_USER_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`Kakao profile fetch failed: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  const profile = data?.kakao_account?.profile;
  return {
    id: data.id,
    nickname: profile?.nickname ?? null,
    avatarUrl: profile?.profile_image_url ?? null,
  };
}
