# Database Schema — 온길(Ongil)

Supabase PostgreSQL (region: ap-northeast-2, DB: `postgres`, public schema)의 전체 테이블 명세.
AI 에이전트가 개발 시 이 문서를 스키마의 단일 소스로 사용할 것.

- 연결: pooler(session mode) `aws-0-ap-northeast-2.pooler.supabase.com:5432`, 사용자 `postgres.<project-ref>` (값은 `.env`의 `SUPABASE_DB_*`)
- direct 호스트(`db.*.supabase.co`)는 IPv6 전용이므로 로컬/IPv4 환경에서 사용 금지
- 행 수 기준: 2026-09-11

## 개요

| 테이블 | 행 수 | PK | 용도 |
|---|---|---|---|
| `region` | 1 | `ldong_regn_cd` | 시도 (법정동 지역코드 체계) |
| `sigungu` | 4 | (`ldong_regn_cd`,`ldong_signgu_cd`) | 시군구 |
| `tour_attraction` | 306 | `content_id` | 관광지 기본 정보 (한국관광공사 API) |
| `barrier_free_info` | 45 | `content_id` | 무장애(배리어프리) 정보 — 관광공사 API |
| `pet_tursm_info` | 23 | `content_id` | 애견동반 관광 정보 — 관광공사 API |
| `dulle_course` | 141 | `crs_idx` | 둘레길/걷기 코스 |
| `walking_trail_theme` | 4 | `route_idx` | 걷기 라인(테마) 메타 |
| `tourist_visitor_forecast` | 4,380 | (`base_ymd`,`area_cd`,`signgu_cd`,`tats_nm`) | 관광지별 방문자 예측(혼잡도) |
| `users` | 0 (신규) | `id` | 회원 (카카오 OAuth) |
| `sessions` | 0 (신규) | `token_hash` | 로그인 세션 |
| `user_likes` | 0 (신규) | (`user_id`,`target_type`,`target_id`) | 회원 좋아요(찜) — 관광지/코스 |

## 관계 (ERD)

```
region (1) ──< sigungu            -- FK: sigungu.ldong_regn_cd → region.ldong_regn_cd

tour_attraction (content_id, VARCHAR(20))
  ├── barrier_free_info.content_id      -- 논리적 1:1, FK 제약 없음
  ├── pet_tursm_info.content_id         -- 논리적 1:1, FK 제약 없음
  └── tourist_visitor_forecast.content_id -- 논리적 1:N, FK 제약 없음, PK에도 포함 안 됨

walking_trail_theme (route_idx) ──< dulle_course.route_idx  -- 논리적 1:N, FK 제약 없음

users (id) ──< sessions.user_id    -- 실제 FK, ON DELETE CASCADE
users (id) ──< user_likes.user_id  -- 실제 FK, ON DELETE CASCADE
```

**주의**: 관광 데이터 8개 테이블 사이의 실제 FK 제약은 `sigungu→region` 하나뿐이며, 나머지는 논리적 관계일 뿐이므로 조인 시 존재하지 않는 `content_id`/`route_idx`가 있어도 DB가 막아주지 않는다. `users`/`sessions`는 별도 도메인(인증)이라 `sessions.user_id → users.id`에 실제 FK가 걸려 있다.

## 공통 컨벤션

- `content_id`: 한국관광공사 콘텐츠 ID. **모든 테이블에서 `VARCHAR(20)`로 통일** (과거 `barrier_free_info`가 INTEGER였으나 VARCHAR로 변경됨)
- 관광공사 API 유래 컬럼(`acmpy_*`, `rela_*`, `chk*` 등): 값은 대부분 한글 문자열(예: "가능"/"불가능"/"가능(소형견)") 또는 빈 문자열. boolean 아님
- `created_at`/`updated_at`: DB 기본값 `now()`, `timestamptz`(barrier_free_info)와 `timestamp`(pet_tursm_info, tourist_visitor_forecast)가 섞여 있음
- 지역 코드(`ldong_regn_cd` 등): 앞 2자리 시도, 다음 3자리 시군구 (법정동 코드 체계, 문자열)

---

## region — 시도

| 컬럼 | 타입 | NULL | 설명 |
|---|---|---|---|
| `ldong_regn_cd` | `CHAR(2)` | NOT NULL, **PK** | 시도 코드 (예: `51` 강원도) |
| `regn_name` | `VARCHAR(50)` | NOT NULL | 시도명 |

## sigungu — 시군구

| 컬럼 | 타입 | NULL | 설명 |
|---|---|---|---|
| `ldong_regn_cd` | `CHAR(2)` | NOT NULL, **PK(1st)**, FK→`region.ldong_regn_cd` | 소속 시도 코드 |
| `ldong_signgu_cd` | `CHAR(3)` | NOT NULL, **PK(2nd)** | 시군구 코드 |
| `signgu_name` | `VARCHAR(50)` | NOT NULL | 시군구명 |

현재 데이터: 태백시(190), 삼척시(230), 정선군(770), 고성군(820) — 모두 강원도(51).

## tour_attraction — 관광지 (306행)

관광공사 API 기반. PK: `content_id`.

| 컬럼 | 타입 | NULL | 설명 |
|---|---|---|---|
| `content_id` | `VARCHAR(20)` | NOT NULL, **PK** | 관광공사 콘텐츠 ID |
| `content_type_id` | `VARCHAR(2)` | NOT NULL, 기본 `'12'` | 콘텐츠 유형 ID (12=관광지) |
| `title` | `VARCHAR(200)` | NOT NULL | 관광지명 |
| `addr1` / `addr2` | `VARCHAR(255)` | NULL | 주소 / 상세주소 |
| `zipcode` | `VARCHAR(10)` | NULL | 우편번호 |
| `tel` | `VARCHAR(100)` | NULL | 전화번호 |
| `firstimage` / `firstimage2` | `text` | NULL | 대표이미지 URL (원본/썸네일) |
| `cpyrht_div_cd` | `VARCHAR(10)` | NULL | 저작권 유형 코드 |
| `mapx` / `mapy` | `numeric` | NULL | 경도 / 위도 (GS24 좌표계 문자열이 아닌 numeric) |
| `mlevel` | `smallint` | NULL | 지도 확대 레벨 |
| `content_created_at` / `content_modified_at` | `timestamp` | NULL | 원본 콘텐츠 등록/수정일 |
| `ldong_regn_cd` | `VARCHAR(10)` | NULL | 시도 코드 — **FK 아님, `region`의 CHAR(2)와 길이 불일치** |
| `ldong_signgu_cd` | `VARCHAR(10)` | NULL | 시군구 코드 — FK 아님 |
| `lcls_systm1`~`3` | `VARCHAR(10)` | NULL | 관광공사 3단 분류체계 (대/중/소) |
| `heritage1`~`3` | `CHAR(1)` | NULL | 문화재 유무 (1=해당) |
| `infocenter` | `text` | NULL | 안내소 |
| `opendate` | `VARCHAR(200)` | NULL | 개장일 |
| `restdate` | `VARCHAR(200)` | NULL | 쉬는 날 |
| `expguide` | `text` | NULL | 체험 안내 |
| `expagerange` | `VARCHAR(200)` | NULL | 체험 가능 연령 |
| `accomcount` | `VARCHAR(100)` | NULL | 수용인원 |
| `useseason` / `usetime` | `VARCHAR(200)` | NULL | 이용 가능 계절 / 시간 |
| `parking` | `VARCHAR(200)` | NULL | 주차 시설 (한글 문자열) |
| `chkbabycarriage` / `chkpet` / `chkcreditcard` | `VARCHAR(200)` | NULL | 유모차대여 / 애견동반 / 신용카드 가능 여부 (한글 문자열) |
| `intro_synced_at` | `timestamptz` | NULL | 상세 소개(intro) 동기화 시각 |
| `row_created_at` / `row_updated_at` | `timestamptz` | NOT NULL, 기본 `now()` | 로우 관리용 타임스탬프 |

## barrier_free_info — 무장애 정보 (45행)

관광공사 무장애 여행 API. `tour_attraction`과 1:1. PK: `content_id` (VARCHAR로 통일됨).

**지체·거동 불편 계열**: `parking`(주차), `publictransport`(대중교통), `route`(접근로), `ticketoffice`(매표소), `promotion`(홍보물), `wheelchair`(휠체어), `exit`(출입통로), `elevator`(엘리베이터), `restroom`(화장실), `auditorium`(관람석), `room`(객실), `handicapetc`(기타) — 전부 `text`, NULL 허용

**시각 장애 계열**: `braileblock`(점자블록), `helpdog`(안내견), `guidehuman`(안내인), `audioguide`(오디오가이드), `bigprint`(큰활자 홍보물), `brailepromotion`(점자 홍보물/점자 표지판), `guidesystem`(유도안내 시스템), `blindhandicapetc`(기타) — 전부 `text`, NULL 허용

**청각 장애 계열**: `signguide`(수화 안내), `videoguide`(자막·비디오가이드), `hearingroom`(청각 보조기구), `hearinghandicapetc`(기타) — 전부 `text`, NULL 허용

**영유아·가족 계열**: `stroller`(유모차), `lactationroom`(수유실), `babysparechair`(유아용 보조의자), `infantsfamilyetc`(기타) — 전부 `text`, NULL 허용

| 컬럼 | 타입 | NULL | 설명 |
|---|---|---|---|
| `content_id` | `VARCHAR(20)` | NOT NULL, **PK** | `tour_attraction.content_id`와 조인 |
| 위 28개 정보 컬럼 | `text` | NULL | API 원문 그대로 (한글 또는 빈 값) |
| `has_physical_disability_info` | `smallint` | NOT NULL, 기본 0 | 지체 계열 정보 존재 플래그 (0/1) |
| `has_visual_disability_info` | `smallint` | NOT NULL, 기본 0 | 시각 계열 정보 존재 플래그 |
| `has_hearing_disability_info` | `smallint` | NOT NULL, 기본 0 | 청각 계열 정보 존재 플래그 |
| `has_infant_family_info` | `smallint` | NOT NULL, 기본 0 | 영유아 계열 정보 존재 플래그 |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL, 기본 `now()` | |

`has_*` 플래그는 해당 계열 컬럼 중 값이 채워진 것이 있는지 나타내는 파생 플래그로 추정 — 조회 필터링용. 원문 컬럼 수정 시 일관성 유지 필요.

## pet_tursm_info — 애견동반 정보 (23행)

관광공사 애견동반 여행 API. `tour_attraction`과 1:1. PK: `content_id`.
모든 컬럼이 `NOT NULL`이고 기본값 `''` (API가 빈 값으로 내려오면 빈 문자열로 저장).

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `content_id` | `VARCHAR(20)` PK | |
| `acmpy_psbl_cpam` | `text` | 동반 가능 반려동물 (한글, 예: "소형견(10kg 미만)") |
| `acmpy_type_cd` | `VARCHAR(50)` | 동반 가능 유형 코드 |
| `acmpy_need_mtr` | `text` | 동반 시 준수사항 |
| `rela_rntl_prdlst` | `text` | 관련 대여품목 |
| `rela_frnsh_prdlst` | `text` | 관련 비치품목 |
| `rela_purc_prdlst` | `text` | 관련 구매품목 |
| `rela_acdnt_risk_mtr` | `text` | 사고 대비 주의사항 |
| `rela_poses_fclty` | `text` | 관련 구비시설 |
| `etc_acmpy_info` | `text` | 기타 동반 정보 |
| `pet_tursm_info` | `text` NULL | 애견동반 여행 안내 (컬럼명=테이블명 주의) |
| `created_at` / `updated_at` | `timestamp` 기본 `now()` | timestamp(시간대 없음) |

## walking_trail_theme — 걷기 라인(테마) (4행)

둘레길/테마걷기 라인의 메타 정보. `dulle_course`의 부모 개념. PK: `route_idx`.

| 컬럼 | 타입 | NULL | 설명 |
|---|---|---|---|
| `route_idx` | `VARCHAR(30)` | NOT NULL, **PK** | 라인(테마) ID |
| `theme_nm` | `VARCHAR(100)` | NOT NULL | 테마명 (예: "강원 둘레길") |
| `line_msg` | `VARCHAR(300)` | NULL | 라인 슬로건/소개 |
| `theme_descs` | `text` | NULL | 테마 설명 |
| `brd_div` | `VARCHAR(10)` | NOT NULL | 노선 구분 (예: "둘레길", "테마걷기") — `dulle_course.brd_div`와 매칭 |
| `created_time` / `modified_time` | `timestamp` | NOT NULL | 시간대 없음 |

## dulle_course — 걷기 코스 (141행)

소속 라인(`route_idx`)의 개별 코스. PK: `crs_idx`. **`route_idx`는 PK가 아니며 한 라인에 여러 코스가 존재 (1:N)**.

| 컬럼 | 타입 | NULL | 설명 |
|---|---|---|---|
| `crs_idx` | `VARCHAR(30)` | NOT NULL, **PK** | 코스 ID |
| `route_idx` | `VARCHAR(30)` | NOT NULL | 소속 라인 — `walking_trail_theme.route_idx` 조인 (FK 아님) |
| `crs_kor_nm` | `VARCHAR(300)` | NOT NULL | 코스명 |
| `crs_dstnc` | `smallint` | NULL | 코스 거리 (km) |
| `crs_totl_rqrm_hour` | `smallint` | NULL | 총 소요시간 (시간 단위) |
| `crs_level` | `CHAR(1)` | NULL | 난이도 코드 |
| `crs_cycle` | `VARCHAR(20)` | NULL | 코스 형태 (순환/비순환 등) |
| `crs_contents` / `crs_summary` / `crs_tour_info` / `travel_info` | `text` | NULL | 상세설명 / 요약 / 주변관광 info / 여행자 info |
| `sigun` | `VARCHAR(100)` | NULL | 시군 정보 (코드 아닌 명칭 문자열) |
| `brd_div` | `VARCHAR(10)` | NULL | 노선 구분 |
| `gpxpath` | `VARCHAR(1000)` | NULL | GPX 파일 경로 |
| `createdtime` / `modifiedtime` | `VARCHAR(14)` | NULL | 원본 등록/수정일시 (YYYYMMDDHHMMSS 문자열 — 타임스탬프 아님) |

## tourist_visitor_forecast — 방문자 예측/혼잡도 (4,380행)

관광지·날짜별 방문 예측. **PK: (`base_ymd`, `area_cd`, `signgu_cd`, `tats_nm`)** — `content_id`는 PK에 포함되지 않음에 유의 (같은 관광지가 여러 기준일에 걸쳐 N행).

| 컬럼 | 타입 | NULL | 설명 |
|---|---|---|---|
| `base_ymd` | `CHAR(8)` | NOT NULL, **PK(1st)** | 기준일 (YYYYMMDD) |
| `area_cd` | `VARCHAR(10)` | NOT NULL, **PK(2nd)** | 지역 코드 |
| `area_nm` | `VARCHAR(100)` | NULL | 지역명 |
| `signgu_cd` | `VARCHAR(10)` | NOT NULL, **PK(3rd)** | 시군구 코드 |
| `signgu_nm` | `VARCHAR(100)` | NULL | 시군구명 |
| `tats_nm` | `VARCHAR(200)` | NOT NULL, **PK(4th)** | 관광지명 (명칭 기반 키 — `tour_attraction.title`과 매칭) |
| `content_id` | `VARCHAR(20)` | NOT NULL | 관광공사 콘텐츠 ID — `tour_attraction.content_id` 조인 (FK 아님) |
| `cnctr_rate` | `numeric` | NOT NULL | 혼잡도/집중률 (예측 지표) |
| `created_at` | `timestamp` | NOT NULL, 기본 `now()` | 시간대 없음 |

## users — 회원 (카카오 OAuth)

카카오 로그인으로 생성/갱신되는 회원 레코드. PK: `id`. 마이그레이션: [`docs/migrations/001_users_and_sessions.sql`](migrations/001_users_and_sessions.sql).

| 컬럼 | 타입 | NULL | 설명 |
|---|---|---|---|
| `id` | `uuid` | NOT NULL, **PK**, 기본 `gen_random_uuid()` | 내부 회원 ID |
| `kakao_id` | `bigint` | NOT NULL, UNIQUE | 카카오 회원번호 (`GET /v2/user/me`의 `id`) |
| `nickname` | `VARCHAR(100)` | NULL | 카카오 프로필 닉네임 (로그인마다 최신값으로 갱신) |
| `avatar_url` | `text` | NULL | 카카오 프로필 이미지 URL |
| `accessibility_defaults` | `jsonb` | NOT NULL, 기본 `'{}'` | 마이페이지 "나의 안심보행 기본값". `{petFriendly, wheelchair, stroller, senior, parking}` 모두 boolean. 저장 전이면 `{}` (클라이언트가 전부 false로 채움). 마이그레이션 002 |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL, 기본 `now()` | |

## sessions — 로그인 세션

브라우저 쿠키(`ongil_session`)가 가리키는 서버 세션. PK: `token_hash`.

| 컬럼 | 타입 | NULL | 설명 |
|---|---|---|---|
| `token_hash` | `CHAR(64)` | NOT NULL, **PK** | 세션 토큰의 SHA-256 해시(hex). 원본 토큰은 쿠키에만 존재 |
| `user_id` | `uuid` | NOT NULL, FK→`users.id` (CASCADE) | 세션 소유 회원 |
| `created_at` | `timestamptz` | NOT NULL, 기본 `now()` | |
| `expires_at` | `timestamptz` | NOT NULL | 만료 시각 (기본 발급 시점 + 30일) |

만료된 행은 물리적으로 삭제되지 않고 조회 시 `expires_at > now()`로만 걸러진다 — 트래픽이 늘면 만료 행을 정리하는 배치가 필요.

## user_likes — 회원 좋아요(찜)

로그인 회원의 좋아요 목록. 게스트는 브라우저 localStorage에만 저장된다. 마이그레이션: [`docs/migrations/002_user_likes_and_settings.sql`](migrations/002_user_likes_and_settings.sql). API: `GET/PUT/DELETE /api/likes`.

| 컬럼 | 타입 | NULL | 설명 |
|---|---|---|---|
| `user_id` | `uuid` | NOT NULL, **PK(1st)**, FK→`users.id` (CASCADE) | 회원 |
| `target_type` | `VARCHAR(10)` | NOT NULL, **PK(2nd)**, CHECK `place`/`course` | `place`=관광지, `course`=걷기 코스 |
| `target_id` | `VARCHAR(30)` | NOT NULL, **PK(3rd)** | `place`면 `tour_attraction.content_id` 또는 목업 id(`d001` 등), `course`면 `dulle_course.crs_idx` — FK 아님 |
| `created_at` | `timestamptz` | NOT NULL, 기본 `now()` | 좋아요 시각 |

---

## 알려진 이슈 / 개선 후보

1. **타입 불일치**: `tour_attraction.ldong_regn_cd/ldong_signgu_cd`가 `VARCHAR(10)`이라 `region.CHAR(2)`/`sigungu.CHAR(3)`과 조인하려면 길이 정규화 필요
2. **FK 미설정**: `barrier_free_info`, `pet_tursm_info`, `tourist_visitor_forecast` → `tour_attraction`, `dulle_course` → `walking_trail_theme` 관계에 FK 제약 없음
3. **timestamp 타입 혼재**: `timestamptz`(barrier_free_info, tour_attraction) vs `timestamp`(pet_tursm_info, tourist_visitor_forecast, walking_trail_theme) — 시간 비교 시 시간대 주의
4. **이름 혼동**: `pet_tursm_info` 테이블에 `pet_tursm_info` 컬럼이 존재 (`select *` 결과 혼동 주의)
5. **관리용 vs 원본용 타임스탬프**: `row_created_at`/`row_updated_at`(로우 관리)와 `content_created_at`/`createdtime`(원본 데이터)을 구분해서 사용할 것
