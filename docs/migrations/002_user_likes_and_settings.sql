-- 002_user_likes_and_settings.sql
-- 좋아요(찜) 목록과 "나의 안심보행 기본값"을 회원 계정에 저장.
-- 적용: Supabase 대시보드 SQL Editor에 붙여넣어 실행하거나
--       psql "$SUPABASE_DB_URL" -f docs/migrations/002_user_likes_and_settings.sql

-- target_type: 'place' = 관광지(tour_attraction.content_id 또는 목업 id),
--              'course' = 걷기 코스(dulle_course.crs_idx)
CREATE TABLE user_likes (
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type  varchar(10) NOT NULL CHECK (target_type IN ('place', 'course')),
  target_id    varchar(30) NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, target_type, target_id)
);

-- {"petFriendly": bool, "wheelchair": bool, "stroller": bool, "senior": bool, "parking": bool}
ALTER TABLE users ADD COLUMN accessibility_defaults jsonb NOT NULL DEFAULT '{}';
