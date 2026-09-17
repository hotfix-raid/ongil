// 임시: sigungu 테이블 조회 API — 개발 확인용, 추후 제거 예정
import { NextRequest, NextResponse } from "next/server";
import pool from "@/src/lib/db/pool";

export async function GET(request: NextRequest) {
  const regionCode = request.nextUrl.searchParams.get("regionCode");
  if (regionCode !== null && !/^\d{2}$/.test(regionCode)) {
    return NextResponse.json({ error: "regionCode must be exactly 2 digits" }, { status: 400 });
  }
  try {
    const { rows } = await pool.query(
      `SELECT ldong_regn_cd, ldong_signgu_cd, signgu_name FROM sigungu${regionCode ? " WHERE TRIM(ldong_regn_cd) = TRIM($1)" : ""} ORDER BY ldong_regn_cd, ldong_signgu_cd`,
      regionCode ? [regionCode] : []
    );
    return NextResponse.json({ count: rows.length, rows });
  } catch (e) {
    console.error("Failed to fetch sigungu", e);
    return NextResponse.json({ error: "Failed to fetch sigungu" }, { status: 500 });
  }
}
