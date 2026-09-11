import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const SORTS = ["relevance", "name", "updated"] as const;

const pool = new Pool({
  host: process.env.SUPABASE_DB_HOST ?? "aws-0-ap-northeast-2.pooler.supabase.com",
  port: 5432,
  database: "postgres",
  user: process.env.SUPABASE_DB_USER ?? "postgres.trhyuntncdckzrqbkdwa",
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

const petInfoExpression = `(
  NULLIF(BTRIM(COALESCE(p.acmpy_psbl_cpam, '')), '') IS NOT NULL OR
  NULLIF(BTRIM(COALESCE(p.acmpy_type_cd, '')), '') IS NOT NULL OR
  NULLIF(BTRIM(COALESCE(p.acmpy_need_mtr, '')), '') IS NOT NULL OR
  NULLIF(BTRIM(COALESCE(p.rela_rntl_prdlst, '')), '') IS NOT NULL OR
  NULLIF(BTRIM(COALESCE(p.rela_frnsh_prdlst, '')), '') IS NOT NULL OR
  NULLIF(BTRIM(COALESCE(p.rela_purc_prdlst, '')), '') IS NOT NULL OR
  NULLIF(BTRIM(COALESCE(p.rela_acdnt_risk_mtr, '')), '') IS NOT NULL OR
  NULLIF(BTRIM(COALESCE(p.rela_poses_fclty, '')), '') IS NOT NULL OR
  NULLIF(BTRIM(COALESCE(p.etc_acmpy_info, '')), '') IS NOT NULL OR
  NULLIF(BTRIM(COALESCE(p.pet_tursm_info, '')), '') IS NOT NULL
)`;

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
  const regionCode = searchParams.get("regionCode") ?? searchParams.get("ldong_regn_cd");
  const sigunguCode = searchParams.get("sigunguCode") ?? searchParams.get("ldong_signgu_cd");
  const sort = searchParams.get("sort") ?? "relevance";
  const pageValue = searchParams.get("page");
  const limitValue = searchParams.get("limit");

  if (qValue !== null && qValue.length > 200) return badRequest("q must be 200 characters or fewer");
  if (regionCode !== null && !/^\d{2}$/.test(regionCode)) {
    return badRequest("regionCode must be exactly 2 digits");
  }
  if (sigunguCode !== null && !/^\d{3}$/.test(sigunguCode)) {
    return badRequest("sigunguCode must be exactly 3 digits");
  }
  if (!SORTS.includes(sort as (typeof SORTS)[number])) {
    return badRequest("sort must be one of relevance, name, or updated");
  }

  const page = pageValue === null ? DEFAULT_PAGE : Number(pageValue);
  const limit = limitValue === null ? DEFAULT_LIMIT : Number(limitValue);
  if (!/^\d+$/.test(pageValue ?? "1") || !Number.isSafeInteger(page) || page < 1) {
    return badRequest("page must be a positive integer");
  }
  if (!/^\d+$/.test(limitValue ?? String(DEFAULT_LIMIT)) || !Number.isSafeInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return badRequest(`limit must be an integer between 1 and ${MAX_LIMIT}`);
  }

  const filterFlags = ["petInfo", "physicalInfo", "visualInfo", "hearingInfo", "infantFamilyInfo"];
  for (const flag of filterFlags) {
    const value = searchParams.get(flag);
    if (value !== null && value !== "true") return badRequest(`${flag} must be the literal true`);
  }

  try {
    const params: string[] = [];
    const addParam = (value: string | number) => {
      params.push(String(value));
      return `$${params.length}`;
    };
    const conditions: string[] = [];

    if (q) {
      const qParam = addParam(`%${escapeLike(q)}%`);
      conditions.push(`(
        a.title ILIKE ${qParam} ESCAPE '\\' OR
        CONCAT_WS(' ', a.addr1, a.addr2) ILIKE ${qParam} ESCAPE '\\'
      )`);
    }
    if (regionCode) conditions.push(`TRIM(a.ldong_regn_cd) = TRIM(${addParam(regionCode)})`);
    if (sigunguCode) conditions.push(`TRIM(a.ldong_signgu_cd) = TRIM(${addParam(sigunguCode)})`);
    if (searchParams.get("petInfo") === "true") conditions.push(petInfoExpression);
    if (searchParams.get("physicalInfo") === "true") conditions.push("COALESCE(b.has_physical_disability_info, 0) > 0");
    if (searchParams.get("visualInfo") === "true") conditions.push("COALESCE(b.has_visual_disability_info, 0) > 0");
    if (searchParams.get("hearingInfo") === "true") conditions.push("COALESCE(b.has_hearing_disability_info, 0) > 0");
    if (searchParams.get("infantFamilyInfo") === "true") conditions.push("COALESCE(b.has_infant_family_info, 0) > 0");

    const orderBy = sort === "updated"
      ? "a.content_modified_at DESC NULLS LAST, a.title ASC, a.content_id ASC"
      : sort === "name"
        ? "a.title ASC, a.content_id ASC"
        : q
          ? `CASE WHEN a.title ILIKE $1 ESCAPE '\\' THEN 0 ELSE 1 END,
             CASE WHEN CONCAT_WS(' ', a.addr1, a.addr2) ILIKE $1 ESCAPE '\\' THEN 0 ELSE 1 END,
             a.title ASC, a.content_id ASC`
          : "a.title ASC, a.content_id ASC";
    const limitParam = addParam(limit);
    const offsetParam = addParam((page - 1) * limit);

    const { rows } = await pool.query(
      `SELECT a.content_id, a.title, a.addr1, a.addr2, a.firstimage, a.firstimage2,
              a.ldong_regn_cd, a.ldong_signgu_cd, a.lcls_systm1, a.lcls_systm2,
              a.lcls_systm3, a.parking, a.chkbabycarriage, a.chkpet, a.mapx, a.mapy,
              a.content_modified_at,
              ${petInfoExpression} AS "hasPetInfo",
              (COALESCE(b.has_physical_disability_info, 0) > 0) AS "hasPhysicalInfo",
              (COALESCE(b.has_visual_disability_info, 0) > 0) AS "hasVisualInfo",
              (COALESCE(b.has_hearing_disability_info, 0) > 0) AS "hasHearingInfo",
              (COALESCE(b.has_infant_family_info, 0) > 0) AS "hasInfantFamilyInfo",
              COUNT(*) OVER()::int AS "_totalCount"
       FROM tour_attraction AS a
       LEFT JOIN barrier_free_info AS b ON b.content_id = a.content_id
       LEFT JOIN pet_tursm_info AS p ON p.content_id = a.content_id
       ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
       ORDER BY ${orderBy}
       LIMIT ${limitParam} OFFSET ${offsetParam}`,
      params
    );
    const count = rows.length ? Number(rows[0]._totalCount) : 0;
    const cleanRows = rows.map(({ _totalCount, ...row }) => row);
    return NextResponse.json({ count, page, limit, rows: cleanRows });
  } catch (e) {
    console.error("Failed to fetch tour attractions", e);
    return NextResponse.json({ error: "Failed to fetch tour attractions" }, { status: 500 });
  }
}
