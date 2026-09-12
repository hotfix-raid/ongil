import { NextRequest, NextResponse } from "next/server";
import pool from "../../../../../src/lib/db/pool";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ crsIdx: string }> }
) {
  const { crsIdx } = await params;

  if (typeof crsIdx !== "string" || crsIdx.length < 1 || crsIdx.length > 30) {
    return NextResponse.json({ error: "crsIdx must be 1-30 characters" }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      `SELECT c.gpxpath FROM dulle_course AS c WHERE c.crs_idx = $1`,
      [crsIdx]
    );
    if (rows.length === 0 || rows[0].gpxpath == null || String(rows[0].gpxpath).trim() === "") {
      return NextResponse.json({ error: "GPX not found" }, { status: 404 });
    }

    const gpxUrl = String(rows[0].gpxpath).trim();
    if (!/^https?:\/\//i.test(gpxUrl)) {
      return NextResponse.json({ error: "Failed to fetch GPX" }, { status: 502 });
    }

    let upstream: Response;
    try {
      upstream = await fetch(gpxUrl, { signal: AbortSignal.timeout(15000) });
    } catch (e) {
      console.error("Failed to fetch GPX upstream", e);
      return NextResponse.json({ error: "Failed to fetch GPX" }, { status: 502 });
    }
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Failed to fetch GPX" }, { status: 502 });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "application/gpx+xml",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (e) {
    console.error("Failed to serve course GPX", e);
    return NextResponse.json({ error: "Failed to serve course GPX" }, { status: 500 });
  }
}
