import { NextRequest, NextResponse } from "next/server";
import pool from "../../../src/lib/db/pool";

export const runtime = "nodejs";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const SORTS = ["relevance", "course", "distance", "duration"] as const;
const DISTANCES = ["short", "medium", "long"] as const;
const DURATIONS = ["short", "medium", "long"] as const;
const LEVELS = ["1", "2", "3"] as const;

const DISTANCE_DEFINITIONS = { short: "<5km", medium: "5-10km", long: ">10km" };
const DURATION_DEFINITIONS = { short: "≤120분", medium: "120-300분", long: ">300분" };

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

type AddParam = (value: string | number) => string;

function parseList(value: string | null): string[] {
  if (value === null) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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
  const themes = parseList(searchParams.get("theme"));
  const levels = parseList(searchParams.get("level"));
  const sort = searchParams.get("sort") ?? "relevance";
  const pageValue = searchParams.get("page");
  const limitValue = searchParams.get("limit");

  if (qValue !== null && qValue.length > 200) return badRequest("q must be 200 characters or fewer");
  if (regionValue !== null && regionValue.length > 100) return badRequest("region must be 100 characters or fewer");
  if (boardDivision !== undefined && boardDivision.length > 10) return badRequest("boardDivision must be 10 characters or fewer");
  if (cycle !== undefined && cycle.length > 20) return badRequest("cycle must be 20 characters or fewer");
  for (const theme of themes) {
    if (theme.length > 30) return badRequest("theme must be comma-separated route_idx values of 30 characters or fewer");
  }
  for (const level of levels) {
    if (!LEVELS.includes(level as (typeof LEVELS)[number])) {
      return badRequest("level must be comma-separated values of 1, 2, or 3");
    }
  }
  if (!SORTS.includes(sort as (typeof SORTS)[number])) {
    return badRequest("sort must be one of relevance, course, distance, or duration");
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

  const buildWhere = (addParam: AddParam) => {
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
    if (themes.length) {
      const placeholders = themes.map((theme) => addParam(theme));
      conditions.push(`c.route_idx IN (${placeholders.join(", ")})`);
    }
    if (levels.length) {
      const placeholders = levels.map((level) => addParam(level));
      conditions.push(`c.crs_level IN (${placeholders.join(", ")})`);
    }

    if (distance === "short") conditions.push(`c.crs_dstnc IS NOT NULL AND c.crs_dstnc < ${addParam(5)}`);
    if (distance === "medium") {
      conditions.push(`c.crs_dstnc IS NOT NULL AND c.crs_dstnc >= ${addParam(5)} AND c.crs_dstnc <= ${addParam(10)}`);
    }
    if (distance === "long") conditions.push(`c.crs_dstnc IS NOT NULL AND c.crs_dstnc > ${addParam(10)}`);
    // crs_totl_rqrm_hour holds minutes despite its name.
    if (duration === "short") conditions.push(`c.crs_totl_rqrm_hour IS NOT NULL AND c.crs_totl_rqrm_hour <= ${addParam(120)}`);
    if (duration === "medium") {
      conditions.push(`c.crs_totl_rqrm_hour IS NOT NULL AND c.crs_totl_rqrm_hour >= ${addParam(120)} AND c.crs_totl_rqrm_hour <= ${addParam(300)}`);
    }
    if (duration === "long") conditions.push(`c.crs_totl_rqrm_hour IS NOT NULL AND c.crs_totl_rqrm_hour > ${addParam(300)}`);

    return { conditions, qParam };
  };

  const orderByFor = (sortValue: string, qParam: string | undefined) => {
    if (sortValue === "course") return "c.crs_idx ASC";
    if (sortValue === "distance") return "c.crs_dstnc ASC NULLS LAST, c.crs_idx ASC";
    if (sortValue === "duration") {
      return "c.crs_totl_rqrm_hour ASC NULLS LAST, c.crs_kor_nm ASC, c.crs_idx ASC";
    }
    if (qParam) {
      return `CASE WHEN c.crs_kor_nm ILIKE ${qParam} ESCAPE '\\' THEN 0
              WHEN c.sigun ILIKE ${qParam} ESCAPE '\\' THEN 1
              WHEN t.theme_nm ILIKE ${qParam} ESCAPE '\\' THEN 2
              ELSE 3 END,
         c.crs_kor_nm ASC, c.crs_idx ASC`;
    }
    return "c.crs_kor_nm ASC, c.crs_idx ASC";
  };

  const courseColumns = `c.crs_idx, c.route_idx, c.crs_kor_nm, c.crs_dstnc,
              c.crs_totl_rqrm_hour, c.crs_level, c.crs_cycle,
              c.crs_contents, c.crs_summary, c.crs_tour_info, c.traveler_info,
              c.sigun, c.brd_div, c.gpxpath,
              c.createdtime, c.modifiedtime,
              t.theme_nm, t.line_msg`;

  try {
    const rowsParams: string[] = [];
    const addRowsParam: AddParam = (value) => {
      rowsParams.push(String(value));
      return `$${rowsParams.length}`;
    };
    const { conditions, qParam } = buildWhere(addRowsParam);
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const orderBy = orderByFor(sort, qParam);
    const limitParam = addRowsParam(limit);
    const offsetParam = addRowsParam((page - 1) * limit);

    const countParams: string[] = [];
    const addCountParam: AddParam = (value) => {
      countParams.push(String(value));
      return `$${countParams.length}`;
    };
    const countWhere = buildWhere(addCountParam);
    const countWhereClause = countWhere.conditions.length ? `WHERE ${countWhere.conditions.join(" AND ")}` : "";

    const [rowsResult, countResult, themeResult, regionResult, levelResult] = await Promise.all([
      pool.query(
        `SELECT ${courseColumns}
         FROM dulle_course AS c
         LEFT JOIN walking_trail_theme AS t ON t.route_idx = c.route_idx
         ${whereClause}
         ORDER BY ${orderBy}
         LIMIT ${limitParam} OFFSET ${offsetParam}`,
        rowsParams
      ),
      pool.query(
        `SELECT COUNT(*)::int AS "count"
         FROM dulle_course AS c
         LEFT JOIN walking_trail_theme AS t ON t.route_idx = c.route_idx
         ${countWhereClause}`,
        countParams
      ),
      pool.query(
        `SELECT DISTINCT c.route_idx AS route_idx, t.theme_nm AS theme_nm
         FROM dulle_course AS c
         LEFT JOIN walking_trail_theme AS t ON t.route_idx = c.route_idx
         WHERE c.route_idx IS NOT NULL
         ORDER BY c.route_idx ASC`
      ),
      pool.query(
        `SELECT DISTINCT TRIM(c.sigun) AS sigun
         FROM dulle_course AS c
         WHERE c.sigun IS NOT NULL AND BTRIM(c.sigun) <> ''
         ORDER BY 1 ASC`
      ),
      pool.query(
        `SELECT DISTINCT c.crs_level AS level
         FROM dulle_course AS c
         WHERE c.crs_level IS NOT NULL
         ORDER BY 1 ASC`
      ),
    ]);

    return NextResponse.json({
      count: Number(countResult.rows[0]?.count ?? 0),
      page,
      limit,
      rows: rowsResult.rows,
      filters: {
        themes: themeResult.rows,
        regions: regionResult.rows.map((row) => row.sigun),
        levels: levelResult.rows.map((row) => row.level),
        distanceDefinitions: DISTANCE_DEFINITIONS,
        durationDefinitions: DURATION_DEFINITIONS,
      },
    });
  } catch (e) {
    console.error("Failed to fetch dulle courses", e);
    return NextResponse.json({ error: "Failed to fetch dulle courses" }, { status: 500 });
  }
}
