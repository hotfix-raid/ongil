-- 001_users_and_sessions.sql
-- 카카오 OAuth 로그인을 위한 회원/세션 테이블.
-- 적용: Supabase 대시보드 SQL Editor에 붙여넣어 실행하거나
--       psql "$SUPABASE_DB_URL" -f docs/migrations/001_users_and_sessions.sql
-- 적용 후 docs/database-schema.md의 users/sessions 섹션을 참고할 것.

CREATE TABLE users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kakao_id    bigint NOT NULL UNIQUE,
  nickname    varchar(100),
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 로그인 세션. 쿠키에는 원본 토큰만 저장하고 DB에는 SHA-256 해시만 저장한다
-- (DB가 유출되어도 세션 토큰 자체는 복구되지 않도록).
CREATE TABLE sessions (
  token_hash  char(64) PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL
);

CREATE INDEX sessions_user_id_idx ON sessions (user_id);
