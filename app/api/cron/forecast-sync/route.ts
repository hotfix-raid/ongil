import { NextRequest, NextResponse } from "next/server";
import { runForecastSync } from "@/src/lib/forecast/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vercel Cron이 매일 호출 (vercel.json: 0 20 * * * = 05:00 KST).
// 인증: Vercel 프로젝트 환경변수 CRON_SECRET 설정 시 크론 요청에 자동으로
// `Authorization: Bearer <CRON_SECRET>` 헤더가 붙는다. 미설정 시 x-vercel-cron 헤더만 확인.
function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (secret) return auth === `Bearer ${secret}`;
  return req.headers.get("x-vercel-cron") !== null;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dryRun = req.nextUrl.searchParams.get("dryRun") === "true";
  try {
    const result = await runForecastSync({ dryRun });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("forecast-sync cron failed", e);
    return NextResponse.json({ ok: false, error: "forecast sync failed" }, { status: 500 });
  }
}
