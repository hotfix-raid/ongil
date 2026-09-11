# 온길 (Ongil)

강원도 일부 지역의 관광지와 걷기 코스를 탐색하는 Next.js 애플리케이션입니다. 반려동물·무장애 정보는 실제 이용 가능 여부를 단정하지 않고, **등록된 안내 정보**를 기준으로 검색합니다.

## 주요 기능

- 관광지와 걷기 코스 분리 탐색
- 관광지명·주소, 코스명·테마 검색
- 시군구, 반려동물 안내, 이동·시각·청각·영유아 가족 편의 정보 필터
- 거리·소요 시간·노선 구분·코스 형태 기반 걷기 코스 필터
- 관련도·이름·최신 정보순 정렬 및 URL 검색 상태 복원

## 시작하기

```bash
npm install
npm run dev
```

개발 서버는 `http://localhost:3000`에서 실행됩니다.

## 환경 변수

`.env`에 Supabase PostgreSQL 연결 정보를 설정합니다.

```bash
SUPABASE_DB_HOST=aws-0-ap-northeast-2.pooler.supabase.com
SUPABASE_DB_USER=postgres.<project-ref>
SUPABASE_DB_PASSWORD=<password>
```

DB 스키마와 데이터 범위는 [`docs/database-schema.md`](docs/database-schema.md)를 참고하세요. 로컬 IPv4 환경에서는 direct 호스트 대신 Supabase pooler를 사용합니다.

## API

| 경로 | 설명 |
|---|---|
| `GET /api/sigungu` | 제공 시군구 목록 |
| `GET /api/tour-attractions` | 관광지 검색. `q`, `regionCode`, `sigunguCode`, 무장애·반려동물 필터, `sort`, 페이지네이션 지원 |
| `GET /api/dulle-courses` | 걷기 코스 검색. `q`, `region`, `boardDivision`, `distance`, `duration`, `cycle`, `sort`, 페이지네이션 지원 |

자세한 필터 정책과 단계별 확장 계획은 [`docs/travel-search-filter-plan.md`](docs/travel-search-filter-plan.md)에 정리되어 있습니다.

## 검증

```bash
npm run lint
npm run build
```
