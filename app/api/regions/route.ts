import { NextResponse } from "next/server";
import pool from "@/src/lib/db/pool";

export async function GET() {
  try {
    const { rows } = await pool.query(
      "SELECT ldong_regn_cd, regn_name FROM region ORDER BY ldong_regn_cd"
    );
    return NextResponse.json({ count: rows.length, rows });
  } catch (e) {
    console.error("Failed to fetch regions", e);
    return NextResponse.json({ error: "Failed to fetch regions" }, { status: 500 });
  }
}