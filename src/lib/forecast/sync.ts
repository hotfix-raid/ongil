// 관광공사 TatsCnctrRateService → tourist_visitor_forecast 직접 동기화 로직.
// 사용처: /api/cron/forecast-sync (Vercel Cron), scripts/forecast-sync.mjs(로컬 수동 실행, 별도 파일)
// 규칙:
//   1) TARGETS(4개 시군구) 전체 조회 (최대 30일 데이터)
//   2) DB에 이미 존재하는 base_ymd는 생략, 없는 날짜만 INSERT
//   3) 단일 트랜잭션 — 중간 실패 시 전체 롤백(다음 실행이 재시도)
//   4) ON CONFLICT DO NOTHING — 동시/재실행 안전

import type { PoolClient } from "pg";

import pool from "../db/pool";
import contentMapJson from "./tats-content-map.json";

const CONTENT_MAP: Record<string, string> = contentMapJson;

const SERVICE_KEY =
  process.env.SERVICE_KEY ||
  "7rsiXgK3JvxQbO8j1%2FPt%2B1NQqtORMhgvqQUDT6j%2BcV%2BfWMD2Fc2%2BLt2k6cx2Lkiu1nuyhmAHMa4ltgLNsavQbA%3D%3D";
const BASE_URL =
  "https://apis.data.go.kr/B551011/TatsCnctrRateService/tatsCnctrRatedList";

const TARGETS = [
  { areaCd: "51", signguCd: "51190" }, // 태백
  { areaCd: "51", signguCd: "51230" }, // 삼척
  { areaCd: "51", signguCd: "51770" }, // 정선
  { areaCd: "51", signguCd: "51820" }, // 고성
] as const;

const BATCH_SIZE = 500; // 한 INSERT 문당 행 수 (파라미터 8 × 500 = 4,000 < 65,535)

export interface ForecastRow {
  base_ymd: string;
  area_cd: string;
  area_nm: string;
  signgu_cd: string;
  signgu_nm: string;
  tats_nm: string;
  content_id: string;
  cnctr_rate: number;
}

export interface ForecastSyncResult {
  fetched: number;
  skippedExistingDates: number;
  inserted: number;
  newDates: string[];
  unmatchedCount: number;
  invalidCount: number;
  dryRun: boolean;
}

interface ApiItem {
  tAtsNm?: string;
  tatsNm?: string;
  baseYmd?: string;
  areaCd?: string;
  areaNm?: string;
  signguCd?: string;
  signguNm?: string;
  cnctrRate?: string;
}

async function fetchAll(areaCd: string, signguCd: string): Promise<ApiItem[]> {
  const all: ApiItem[] = [];
  let pageNo = 1;
  const numOfRows = 3000;
  for (;;) {
    const url = `${BASE_URL}?serviceKey=${SERVICE_KEY}&pageNo=${pageNo}&numOfRows=${numOfRows}&MobileOS=WEB&MobileApp=test&areaCd=${areaCd}&signguCd=${signguCd}&_type=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${areaCd}/${signguCd} p${pageNo}`);
    const j = (await res.json()) as {
      response?: {
        header?: { resultCode?: string; resultMsg?: string };
        body?: { items?: { item?: ApiItem | ApiItem[] } | null; totalCount?: string | number };
      };
    };
    const header = j?.response?.header;
    if (header?.resultCode !== "0000") {
      throw new Error(`API err ${areaCd}/${signguCd}: ${JSON.stringify(header)}`);
    }
    let items = j?.response?.body?.items?.item ?? [];
    if (!Array.isArray(items)) items = items ? [items] : [];
    all.push(...items);
    const total = Number(j?.response?.body?.totalCount ?? 0);
    if (all.length >= total || items.length < numOfRows) break;
    pageNo++;
    if (pageNo > 20) break;
  }
  return all;
}

/** API 응답 → insert 대상 행 정규화(매핑 필터, 유효성 검사, 런 내부 PK 중복 제거) */
export function normalizeItems(items: ApiItem[]): { rows: ForecastRow[]; unmatched: Set<string>; invalid: number } {
  const rows: ForecastRow[] = [];
  const unmatched = new Set<string>();
  const seen = new Set<string>();
  let invalid = 0;
  for (const it of items) {
    const tatsNm = String(it.tAtsNm ?? it.tatsNm ?? "").trim();
    const baseYmd = String(it.baseYmd ?? "").trim();
    const rate = String(it.cnctrRate ?? "").trim();
    if (!/^\d{8}$/.test(baseYmd) || rate === "" || !Number.isFinite(Number(rate))) {
      invalid++;
      continue;
    }
    const cid = CONTENT_MAP[tatsNm];
    if (!cid) {
      unmatched.add(tatsNm);
      continue;
    }
    const key = `${baseYmd}|${it.areaCd ?? ""}|${it.signguCd ?? ""}|${tatsNm}`;
    if (seen.has(key)) continue;
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
  return { rows, unmatched, invalid };
}

async function insertRows(client: PoolClient, rows: ForecastRow[]): Promise<number> {
  let inserted = 0;
  const COLS = "base_ymd, area_cd, area_nm, signgu_cd, signgu_nm, tats_nm, content_id, cnctr_rate";
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const values: string[] = [];
    const params: (string | number)[] = [];
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

/** 동기화 실행. dryRun=true면 DB 기록 없이 통계만 반환 */
export async function runForecastSync(opts: { dryRun?: boolean } = {}): Promise<ForecastSyncResult> {
  const apiItems: ApiItem[] = [];
  for (const t of TARGETS) {
    const items = await fetchAll(t.areaCd, t.signguCd);
    apiItems.push(...items);
  }
  const { rows: fetched, unmatched, invalid } = normalizeItems(apiItems);

  const { rows: existingRows } = await pool.query<{ base_ymd: string }>(
    "SELECT DISTINCT base_ymd FROM tourist_visitor_forecast"
  );
  const existing = new Set(existingRows.map((r) => String(r.base_ymd).trim()));
  const toInsert = fetched.filter((r) => !existing.has(r.base_ymd));

  const result: ForecastSyncResult = {
    fetched: fetched.length,
    skippedExistingDates: fetched.length - toInsert.length,
    inserted: 0,
    newDates: [...new Set(toInsert.map((r) => r.base_ymd))].sort(),
    unmatchedCount: unmatched.size,
    invalidCount: invalid,
    dryRun: opts.dryRun === true,
  };

  if (result.dryRun) return result;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    try {
      result.inserted = await insertRows(client, toInsert);
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    }
  } finally {
    client.release();
  }
  return result;
}
