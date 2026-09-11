import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const SORTS = ["relevance", "name", "updated"] as const;
const DISTANCES = ["short", "medium", "long"] as const;
const DURATIONS = ["short", "medium", "long"] as const;

const pool = new Pool({
  host: process.env.SUPABASE_DB_HOST ?? "aws-0-ap-northeast-2.pooler.supabase.com",
  port: 5432,
  database: "postgres",
  user: process.env.SUPABASE_DB_USER ?? "postgres.trhyuntncdckzrqbkdwa",
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const qValue = searchParams.get("q");
  const q = qValue?.trim() || undefined;
  const regionValue = searchParams.get("region");
  const region = regionValue?.trim() || undefined;
  const boardDivision = searchParams.get("boardDivision")?.trim() || undefined;
  const distance = searchParams.get("distance");
  const duration = searchParams.get("duration");
  const cycle = searchParams.get("cycle")?.trim() || undefined;
  const sort = searchParams.get("sort") ?? "relevance";
  const pageValue = searchParams.get("page");
  const limitValue = searchParams.get("limit");

  if (qValue !== null && qValue.length > 200) return badRequest("q must be 200 characters or fewer");
  if (regionValue !== null && regionValue.length > 100) return badRequest("region must be 100 characters or fewer");
  if (boardDivision !== undefined && boardDivision.length > 10) return badRequest("boardDivision must be 10 characters or fewer");
  if (cycle !== undefined && cycle.length > 20) return badRequest("cycle must be 20 characters or fewer");
  if (!SORTS.includes(sort as (typeof SORTS)[number])) {
    return badRequest("sort must be one of relevance, name, or updated");
  }
  if (distance !== null && !DISTANCES.includes(distance as (typeof DISTANCES)[number])) {
    return badRequest("distance must be one of short, medium, or long");
  }
  if (duration !== null && !DURATIONS.includes(duration as (typeof DURATIONS)[number])) {
    return badRequest("duration must be one of short, medium, or long");
  }

  const page = pageValue === null ? DEFAULT_PAGE : Number(pageValue);
  const limit = limitValue === null ? DEFAULT_LIMIT : Number(limitValue);
  if (!/^\d+$/.test(pageValue ?? "1") || !Number.isSafeInteger(page) || page < 1) {
    return badRequest("page must be a positive integer");
  }
  if (!/^\d+$/.test(limitValue ?? String(DEFAULT_LIMIT)) || !Number.isSafeInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return badRequest(`limit must be an integer between 1 and ${MAX_LIMIT}`);
  }

  try {
    const params: string[] = [];
    const addParam = (value: string | number) => {
      params.push(String(value));
      return `$${params.length}`;
    };
    const conditions: string[] = [];

    let qParam: string | undefined;
    if (q) {
      qParam = addParam(`%${escapeLike(q)}%`);
      conditions.push(`(
        c.crs_kor_nm ILIKE ${qParam} ESCAPE '\\' OR
        c.sigun ILIKE ${qParam} ESCAPE '\\' OR
        c.crs_summary ILIKE ${qParam} ESCAPE '\\' OR
        t.theme_nm ILIKE ${qParam} ESCAPE '\\'
      )`);
    }
    if (region) conditions.push(`TRIM(c.sigun) = TRIM(${addParam(region)})`);
    if (boardDivision) conditions.push(`TRIM(c.brd_div) = TRIM(${addParam(boardDivision)})`);
    if (cycle) conditions.push(`TRIM(c.crs_cycle) = TRIM(${addParam(cycle)})`);

    if (distance === "short") conditions.push(`c.crs_dstnc IS NOT NULL AND c.crs_dstnc < ${addParam(5)}`);
    if (distance === "medium") {
      conditions.push(`c.crs_dstnc IS NOT NULL AND c.crs_dstnc >= ${addParam(5)} AND c.crs_dstnc <= ${addParam(10)}`);
    }
    if (distance === "long") conditions.push(`c.crs_dstnc IS NOT NULL AND c.crs_dstnc > ${addParam(10)}`);
    if (duration === "short") conditions.push(`c.crs_totl_rqrm_hour IS NOT NULL AND c.crs_totl_rqrm_hour <= ${addParam(1)}`);
    if (duration === "medium") {
      conditions.push(`c.crs_totl_rqrm_hour IS NOT NULL AND c.crs_totl_rqrm_hour >= ${addParam(2)} AND c.crs_totl_rqrm_hour <= ${addParam(3)}`);
    }
    if (duration === "long") conditions.push(`c.crs_totl_rqrm_hour IS NOT NULL AND c.crs_totl_rqrm_hour >= ${addParam(4)}`);

    const orderBy = sort === "updated"
      ? "c.modifiedtime DESC NULLS LAST, c.crs_kor_nm ASC, c.crs_idx ASC"
      : sort === "name"
        ? "c.crs_kor_nm ASC, c.crs_idx ASC"
        : qParam
          ? `CASE WHEN c.crs_kor_nm ILIKE ${qParam} ESCAPE '\\' THEN 0
                  WHEN c.sigun ILIKE ${qParam} ESCAPE '\\' THEN 1
                  WHEN t.theme_nm ILIKE ${qParam} ESCAPE '\\' THEN 2
                  ELSE 3 END,
             c.crs_kor_nm ASC, c.crs_idx ASC`
          : "c.crs_kor_nm ASC, c.crs_idx ASC";
    const limitParam = addParam(limit);
    const offsetParam = addParam((page - 1) * limit);

    const { rows } = await pool.query(
      `SELECT c.crs_idx, c.route_idx, c.crs_kor_nm, c.crs_dstnc,
              c.crs_totl_rqrm_hour, c.crs_level, c.crs_cycle,
              c.crs_summary, c.sigun, c.brd_div, c.gpxpath,
              c.createdtime, c.modifiedtime,
              t.theme_nm, t.line_msg,
              COUNT(*) OVER()::int AS "_totalCount"
       FROM dulle_course AS c
       LEFT JOIN walking_trail_theme AS t ON t.route_idx = c.route_idx
       ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
       ORDER BY ${orderBy}
       LIMIT ${limitParam} OFFSET ${offsetParam}`,
      params
    );
    const count = rows.length ? Number(rows[0]._totalCount) : 0;
    const cleanRows = rows.map(({ _totalCount, ...row }) => row);
    return NextResponse.json({ count, page, limit, rows: cleanRows });
  } catch (e) {
    console.error("Failed to fetch dulle courses", e);
    return NextResponse.json({ error: "Failed to fetch dulle courses" }, { status: 500 });
  }
}
