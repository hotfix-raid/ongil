import { NextResponse } from "next/server";
import pool from "../../../src/lib/db/pool";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT t.route_idx, t.theme_nm, t.line_msg, t.theme_descs,
              COUNT(c.crs_idx)::int AS "courseCount",
              COALESCE(SUM(c.crs_dstnc), 0)::int AS "totalDistanceKm"
       FROM walking_trail_theme AS t
       LEFT JOIN dulle_course AS c ON c.route_idx = t.route_idx
       GROUP BY t.route_idx, t.theme_nm, t.line_msg, t.theme_descs
       ORDER BY t.route_idx ASC`
    );
    return NextResponse.json(rows);
  } catch (e) {
    console.error("Failed to fetch walking themes", e);
    return NextResponse.json({ error: "Failed to fetch walking themes" }, { status: 500 });
  }
}
