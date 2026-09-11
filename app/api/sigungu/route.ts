// 임시: sigungu 테이블 조회 API — 개발 확인용, 추후 제거 예정
import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  host: process.env.SUPABASE_DB_HOST ?? "aws-0-ap-northeast-2.pooler.supabase.com",
  port: 5432,
  database: "postgres",
  user: process.env.SUPABASE_DB_USER ?? "postgres.trhyuntncdckzrqbkdwa",
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

export async function GET() {
  try {
    const { rows } = await pool.query(
      "SELECT ldong_regn_cd, ldong_signgu_cd, signgu_name FROM sigungu ORDER BY ldong_regn_cd, ldong_signgu_cd"
    );
    return NextResponse.json({ count: rows.length, rows });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
