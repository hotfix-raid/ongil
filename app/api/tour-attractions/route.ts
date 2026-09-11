import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";

const pool = new Pool({
  host: process.env.SUPABASE_DB_HOST ?? "aws-0-ap-northeast-2.pooler.supabase.com",
  port: 5432,
  database: "postgres",
  user: process.env.SUPABASE_DB_USER ?? "postgres.trhyuntncdckzrqbkdwa",
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ldongRegnCd = searchParams.get("ldong_regn_cd");
  const ldongSignguCd = searchParams.get("ldong_signgu_cd");

  if (
    !ldongRegnCd ||
    !/^\d{2}$/.test(ldongRegnCd) ||
    !ldongSignguCd ||
    !/^\d{3}$/.test(ldongSignguCd)
  ) {
    return NextResponse.json(
      { error: "ldong_regn_cd must be 2 digits and ldong_signgu_cd must be 3 digits" },
      { status: 400 }
    );
  }

  try {
    const { rows } = await pool.query(
      `SELECT content_id, title, addr1, addr2, firstimage, firstimage2,
              ldong_regn_cd, ldong_signgu_cd, lcls_systm1, lcls_systm2,
              lcls_systm3, parking, chkbabycarriage, chkpet, mapx, mapy
       FROM tour_attraction AS a
       WHERE TRIM(a.ldong_regn_cd) = $1 AND TRIM(a.ldong_signgu_cd) = $2
       ORDER BY title`,
      [ldongRegnCd, ldongSignguCd]
    );
    return NextResponse.json({ count: rows.length, rows });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
