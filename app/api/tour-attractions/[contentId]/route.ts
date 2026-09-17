import { NextRequest, NextResponse } from "next/server";
import pool from "@/src/lib/db/pool";

export const runtime = "nodejs";

// pet_tursm_info columns are NOT NULL DEFAULT '': a row whose content
// columns are all empty/blank is treated as absent (petInfo: null).
const petInfoPresentExpression = `(
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const { contentId } = await params;

  if (typeof contentId !== "string" || !/^[A-Za-z0-9_-]{1,20}$/.test(contentId)) {
    return NextResponse.json({ error: "contentId must be 1-20 alphanumeric characters" }, { status: 400 });
  }

  const dateValue = request.nextUrl.searchParams.get("date");
  if (dateValue !== null && !/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return NextResponse.json({ error: "date must be in YYYY-MM-DD format" }, { status: 400 });
  }
  const dateYYYYMMDD = dateValue === null ? null : dateValue.replace(/-/g, "");

  try {
    const queryParams: string[] = [contentId];
    const addParam = (value: string) => {
      queryParams.push(value);
      return `$${queryParams.length}`;
    };
    const cnctrFilter =
      dateYYYYMMDD === null
        ? "WHERE f.content_id = a.content_id\n         ORDER BY f.base_ymd DESC LIMIT 1"
        : `WHERE f.content_id = a.content_id AND f.base_ymd = ${addParam(dateYYYYMMDD)}`;
    const { rows } = await pool.query(
      `SELECT to_jsonb(a) AS attraction,
              CASE WHEN b.content_id IS NULL THEN NULL
                ELSE to_jsonb(b) - 'created_at' - 'updated_at' END AS "barrierFree",
              CASE WHEN p.content_id IS NULL OR NOT ${petInfoPresentExpression} THEN NULL
                ELSE to_jsonb(p) - 'created_at' - 'updated_at' END AS "petInfo",
              CASE WHEN c.cnctr_rate IS NULL THEN NULL
                ELSE jsonb_build_object('cnctrRate', c.cnctr_rate, 'baseYmd', c.base_ymd) END AS congestion
       FROM tour_attraction AS a
       LEFT JOIN barrier_free_info AS b ON b.content_id = a.content_id
       LEFT JOIN pet_tursm_info AS p ON p.content_id = a.content_id
       LEFT JOIN LATERAL (
         SELECT f.cnctr_rate, f.base_ymd FROM tourist_visitor_forecast AS f
         ${cnctrFilter}
       ) AS c ON true
       WHERE a.content_id = $1`,
      queryParams
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Attraction not found" }, { status: 404 });
    }

    const { attraction, barrierFree, petInfo, congestion } = rows[0];
    // jsonb_build_object emits cnctr_rate as a JSON number, but coerce
    // defensively so the contract type (number) always holds.
    const safeCongestion =
      congestion == null
        ? null
        : { cnctrRate: Number(congestion.cnctrRate), baseYmd: String(congestion.baseYmd) };
    return NextResponse.json({ attraction, barrierFree, petInfo, congestion: safeCongestion });
  } catch (e) {
    console.error("Failed to fetch tour attraction detail", e);
    return NextResponse.json({ error: "Failed to fetch tour attraction detail" }, { status: 500 });
  }
}
