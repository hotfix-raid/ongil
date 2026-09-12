import type { Metadata } from "next";
import CourseDetail from "@/src/components/CourseDetail";
import { stripHtml } from "@/src/lib/format";
import type { CourseDetailResponse } from "@/src/types/database";

// 상세 페이지는 코스별 동적 데이터이므로 요청 시 렌더링 (빌드 시 prerender 방지)
export const dynamic = "force-dynamic";

type PageParams = Promise<{ crsIdx: string }>;

function apiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
}

async function fetchCoursePayload(crsIdx: string): Promise<CourseDetailResponse | null> {
  try {
    const response = await fetch(new URL(`/api/dulle-courses/${encodeURIComponent(crsIdx)}`, apiBaseUrl()), {
      cache: "no-store"
    });
    if (!response.ok) return null;
    return (await response.json()) as CourseDetailResponse;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { crsIdx } = await params;
  const payload = await fetchCoursePayload(crsIdx);
  const name = payload?.course?.crs_kor_nm ?? "걷기 코스";
  const sigun = payload?.course?.sigun;
  return {
    title: sigun ? `${name} | ${sigun} — 온길 걷기 코스` : `${name} — 온길 걷기 코스`,
    description: stripHtml(payload?.course?.crs_summary).slice(0, 150) || "두루누비 걷기 코스 상세 정보"
  };
}

export default async function CoursePage({ params }: { params: PageParams }) {
  const { crsIdx } = await params;
  // 본문 데이터 fetch는 클라이언트 컴포넌트(CourseDetail)에 위임
  return <CourseDetail crsIdx={crsIdx} variant="page" />;
}
