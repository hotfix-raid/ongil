#!/usr/bin/env node
// tourist_visitor_forecast 직접 동기화 (SQL 파일 생성 없이 DB에 바로 INSERT)
//
// Usage:
//   node scripts/forecast-sync.mjs [--dry-run]
//
// 동작:
//   1. 관광공사 TatsCnctrRateService API를 TARGETS(4개 시군구) 전체 조회 (최대 30일 데이터)
//   2. DB에 이미 존재하는 base_ymd(날짜)는 생략하고, 없는 날짜만 INSERT
//   3. 전체를 하나의 트랜잭션으로 처리 → 중간 실패 시 전부 롤백되어 다음 실행에서 재시도됨
//   4. INSERT ... ON CONFLICT DO NOTHING → 동시 실행/재실행에도 안전(idempotent)
//
// 환경변수 (없으면 .env.local → .env 순서로 자동 로드, Node 20.12+ 필요):
//   SUPABASE_DB_HOST / SUPABASE_DB_PORT / SUPABASE_DB_USER / SUPABASE_DB_PASSWORD
//   SERVICE_KEY (미설정 시 아래 기본 키 사용 — gen-insert.js와 동일)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

import contentMapJson from "../src/lib/forecast/tats-content-map.json" with { type: "json" };

// --- 설정 --------------------------------------------------------------------

const here = path.dirname(fileURLToPath(import.meta.url));
for (const envFile of [".env.local", ".env"]) {
  const p = path.resolve(here, "..", envFile);
  if (fs.existsSync(p)) {
    try { process.loadEnvFile(p); } catch { /* 파싱 실패 시 무시 */ }
  }
}

const SERVICE_KEY = process.env.SERVICE_KEY || "7rsiXgK3JvxQbO8j1%2FPt%2B1NQqtORMhgvqQUDT6j%2BcV%2BfWMD2Fc2%2BLt2k6cx2Lkiu1nuyhmAHMa4ltgLNsavQbA%3D%3D";
const BASE_URL = "https://apis.data.go.kr/B551011/TatsCnctrRateService/tatsCnctrRatedList";

const TARGETS = [
  { areaCd: "51", signguCd: "51190" },
  { areaCd: "51", signguCd: "51230" },
  { areaCd: "51", signguCd: "51770" },
  { areaCd: "51", signguCd: "51820" },
];

// title -> content_id 매핑 (사용자 제공 리스트) — /api/cron/forecast-sync와 공유
const CONTENT_MAP = contentMapJson;

const BATCH_SIZE = 500; // 한 번의 INSERT 문에 담을 행 수 (8파라미터 × 500 = 4,000 < 65,535)
const DRY_RUN = process.argv.includes("--dry-run");

// --- 유틸 --------------------------------------------------------------------

// 로그는 KST 기준으로 남김 (아시아/서울은 DST가 없으므로 UTC+9 고정)
const fmtKst = (d = new Date()) =>
  new Date(d.getTime() + 9 * 3600_000).toISOString().replace("T", " ").slice(0, 19) + " KST";
const log = (msg) => console.log(`[${fmtKst()}] ${msg}`);

function createPool() {
  if (!process.env.SUPABASE_DB_PASSWORD) throw new Error("SUPABASE_DB_PASSWORD 환경변수가 없습니다 (.env.local 확인)");
  return new Pool({
    host: process.env.SUPABASE_DB_HOST ?? "aws-0-ap-northeast-2.pooler.supabase.com",
    // 트랜잭션 모드 풀러(6543) — 앱(src/lib/db/pool.ts)과 동일 설정
    port: Number(process.env.SUPABASE_DB_PORT ?? 6543),
    database: "postgres",
    user: process.env.SUPABASE_DB_USER ?? "postgres.trhyuntncdckzrqbkdwa",
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
    max: 2,
    connectionTimeoutMillis: 10_000,
  });
}

async function fetchAll(areaCd, signguCd) {
  const all = [];
  let pageNo = 1;
  const numOfRows = 3000;
  for (;;) {
    const url = `${BASE_URL}?serviceKey=${SERVICE_KEY}&pageNo=${pageNo}&numOfRows=${numOfRows}&MobileOS=WEB&MobileApp=test&areaCd=${areaCd}&signguCd=${signguCd}&_type=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${areaCd}/${signguCd} p${pageNo}`);
    const j = await res.json();
    if (j?.response?.header?.resultCode !== "0000") {
      throw new Error(`API err ${areaCd}/${signguCd}: ${JSON.stringify(j?.response?.header)}`);
    }
    const body = j?.response?.body;
    let items = body?.items?.item ?? [];
    if (!Array.isArray(items)) items = items ? [items] : [];
    all.push(...items);
    const total = Number(body?.totalCount ?? 0);
    if (all.length >= total || items.length < numOfRows) break;
    pageNo++;
    if (pageNo > 20) break;
  }
  return all;
}

/** API 응답을 insert 대상 행으로 정규화. { rows, stats } 반환 */
function normalizeItems(items) {
  const rows = [];
  const stats = { unmatched: new Set(), noDate: 0, badRate: 0, dup: 0 };
  const seen = new Set(); // (base_ymd|area_cd|signgu_cd|tats_nm) 런 내부 중복 제거
  for (const it of items) {
    const tatsNm = String(it.tAtsNm ?? it.tatsNm ?? "").trim();
    const baseYmd = String(it.baseYmd ?? "").trim();
    if (!/^\d{8}$/.test(baseYmd)) { stats.noDate++; continue; }
    const cid = CONTENT_MAP[tatsNm];
    if (!cid) { stats.unmatched.add(tatsNm); continue; }
    const rate = String(it.cnctrRate ?? "").trim();
    if (rate === "" || !Number.isFinite(Number(rate))) { stats.badRate++; continue; }
    const key = `${baseYmd}|${it.areaCd}|${it.signguCd}|${tatsNm}`;
    if (seen.has(key)) { stats.dup++; continue; }
    seen.add(key);
    rows.push({
      base_ymd: baseYmd,
      area_cd: String(it.areaCd ?? "").trim(),
      area_nm: String(it.areaNm ?? "").trim(),
      signgu_cd: String(it.signguCd ?? "").trim(),
      signgu_nm: String(it.signguNm ?? "").trim(),
      tats_nm: tatsNm,
      content_id: cid,
      cnctr_rate: Number(rate),
    });
  }
  return { rows, stats };
}

async function insertRows(client, rows) {
  let inserted = 0;
  const COLS = "base_ymd, area_cd, area_nm, signgu_cd, signgu_nm, tats_nm, content_id, cnctr_rate";
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const values = [];
    const params = [];
    batch.forEach((r, j) => {
      const base = j * 8;
      values.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`
      );
      params.push(r.base_ymd, r.area_cd, r.area_nm, r.signgu_cd, r.signgu_nm, r.tats_nm, r.content_id, r.cnctr_rate);
    });
    const { rowCount } = await client.query(
      `INSERT INTO tourist_visitor_forecast (${COLS}) VALUES ${values.join(", ")}
       ON CONFLICT (base_ymd, area_cd, signgu_cd, tats_nm) DO NOTHING`,
      params
    );
    inserted += rowCount ?? 0;
  }
  return inserted;
}

// --- 메인 --------------------------------------------------------------------

export async function runSync() {
  const pool = createPool();
  const client = await pool.connect();
  try {
    // 1) API 조회
    const apiItems = [];
    for (const t of TARGETS) {
      const items = await fetchAll(t.areaCd, t.signguCd);
      log(`API 조회 완료 areaCd=${t.areaCd} signguCd=${t.signguCd} items=${items.length}`);
      apiItems.push(...items);
    }
    const { rows: fetched, stats } = normalizeItems(apiItems);

    // 2) DB에 이미 있는 날짜는 생략
    const { rows: existingRows } = await client.query(
      "SELECT DISTINCT base_ymd FROM tourist_visitor_forecast"
    );
    const existing = new Set(existingRows.map((r) => String(r.base_ymd).trim()));
    const toInsert = fetched.filter((r) => !existing.has(r.base_ymd));
    const skipped = fetched.length - toInsert.length;

    const byDate = new Map();
    for (const r of toInsert) byDate.set(r.base_ymd, (byDate.get(r.base_ymd) ?? 0) + 1);
    const dateRange = toInsert.length
      ? `${[...byDate.keys()].sort().join(", ")}`
      : "(없음)";

    log(
      `조회=${fetched.length}행 (매핑없음=${stats.unmatched.size}, 날짜없음=${stats.noDate}, 혼잡도없음=${stats.badRate}, 런내중복=${stats.dup}) / ` +
        `기존날짜로 생략=${skipped}행 / 신규=${toInsert.length}행, 날짜 ${byDate.size}개: ${dateRange}`
    );
    if (DRY_RUN) {
      log("dry-run: DB 기록 없이 종료");
      return { inserted: 0, dryRun: true, toInsert: toInsert.length };
    }

    // 3) 트랜잭션으로 직접 INSERT
    await client.query("BEGIN");
    try {
      const inserted = await insertRows(client, toInsert);
      await client.query("COMMIT");
      log(`INSERT 완료: ${inserted}행 (TOURIST_VISITOR_FORECAST, 트랜잭션 커밋)`);
      return { inserted };
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    }
  } finally {
    client.release();
    await pool.end().catch(() => {});
  }
}

// 직접 실행될 때만 메인으로 동작 (스케줄러는 자식 프로세스로 호출)
if (import.meta.url === `file://${process.argv[1]}`) {
  runSync()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(`[${fmtKst()}] 동기화 실패: ${e?.stack ?? e}`);
      process.exit(1);
    });
}
