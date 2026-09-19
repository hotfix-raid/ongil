'use client';

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Footprints,
  Clock,
  MapPin,
  Route,
  RefreshCw,
  Loader2,
  Repeat,
  CornerDownRight,
  Sparkles,
  Download,
  X,
  Heart,
  ExternalLink
} from "lucide-react";
import { difficultyLabel } from "@/src/lib/adapters/course";
import { formatMinutes, htmlToLines, stripHtml } from "@/src/lib/format";
import { themeAccent } from "@/src/lib/theme";
import type { CourseDetailResponse, DBCourse } from "@/src/types/database";

interface CourseDetailProps {
  crsIdx: string;
  variant?: "sheet" | "page";
  onClose?: () => void;
  ready?: boolean;
  isLiked?: boolean;
  onToggleLike?: (crsIdx: string) => void;
}

// Leaflet은 브라우저 전용이므로 ssr:false 동적 import (Next 16: Client 컴포넌트에서만 허용)
const CourseMap = dynamic(() => import("./CourseMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center rounded-xl border border-border-default bg-bento-bg/50">
      <div className="flex items-center gap-2 text-xs font-semibold text-bento-dark/50">
        <Loader2 size={16} className="animate-spin" />
        지도를 준비하는 중…
      </div>
    </div>
  )
});

// traveler_info에서 시점/종점 행을 휴리스틱으로 추출
function parseEndpoints(travelerInfo: string | null): { start: string | null; end: string | null } {
  if (!travelerInfo) return { start: null, end: null };
  const text = stripHtml(travelerInfo);
  const lines = text.split(/(?:\r?\n|[.·|])/).map((line) => line.trim()).filter(Boolean);
  let start: string | null = null;
  let end: string | null = null;
  for (const line of lines) {
    if (!start && /(시점|출발|기점)/.test(line)) start = line.replace(/^(시점|출발지?|기점)\s*[:：-]?\s*/, "").slice(0, 60) || line.slice(0, 60);
    if (!end && /(종점|도착|종료)/.test(line)) end = line.replace(/^(종점|도착지?|종료)\s*[:：-]?\s*/, "").slice(0, 60) || line.slice(0, 60);
  }
  return { start, end };
}

export default function CourseDetail({ crsIdx, variant = "sheet", onClose, ready = true, isLiked = false, onToggleLike }: CourseDetailProps) {
  const router = useRouter();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [data, setData] = useState<CourseDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const controller = useRef<AbortController | null>(null);

  const isSheet = variant === "sheet";

  const fetchDetail = async () => {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`/api/dulle-courses/${encodeURIComponent(crsIdx)}`, { signal: abort.signal });
      if (!response.ok) throw new Error("request failed");
      const json = (await response.json()) as CourseDetailResponse;
      if (!abort.signal.aborted) setData(json);
    } catch {
      if (!abort.signal.aborted) {
        setData(null);
        setError(true);
      }
    } finally {
      if (!abort.signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    return () => controller.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crsIdx]);

  // 시트 전용 인터랙션
  useEffect(() => {
    if (!isSheet) return;
    const root = document.getElementById("root");
    const target = root ?? document.body;
    const original = target.style.overflow;
    target.style.overflow = "hidden";
    return () => {
      target.style.overflow = original;
    };
  }, [isSheet]);

  useEffect(() => {
    if (!isSheet) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSheet, onClose]);

  useEffect(() => {
    if (!isSheet) return;
    closeButtonRef.current?.focus();
  }, [isSheet]);

  const accent = data ? themeAccent(data.theme?.theme_nm ?? data.course.theme_nm) : null;

  const handleClose = () => {
    if (isSheet && onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const toggleLike = () => {
    onToggleLike?.(crsIdx);
  };

  const loadingContent = (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-8 animate-pulse">
      <div className="h-8 w-40 rounded bg-bento-bg" />
      <div className="h-10 w-3/4 rounded bg-bento-bg" />
      <div className="flex gap-2">
        <div className="h-6 w-20 rounded bg-bento-bg" />
        <div className="h-6 w-24 rounded bg-bento-bg" />
        <div className="h-6 w-16 rounded bg-bento-bg" />
      </div>
      <div className="h-[400px] rounded-xl bg-bento-bg" />
      <div className="h-24 rounded-xl bg-bento-bg" />
    </div>
  );

  const errorContent = (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <div className="rounded-2xl border border-border-default bg-white px-6 py-14 shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bento-bg text-bento-green">
          <RefreshCw size={20} />
        </div>
        <h2 className="font-display text-base font-black text-bento-dark">코스 정보를 불러오지 못했어요</h2>
        <p className="mt-2 text-xs text-bento-dark/50">잠시 후 다시 시도해 주세요.</p>
        <div className="mt-5 flex justify-center gap-2">
          <button onClick={fetchDetail} className="rounded-lg bg-bento-green px-4 py-2.5 text-xs font-bold text-white cursor-pointer">
            다시 시도
          </button>
          <button
            onClick={handleClose}
            className="rounded-lg border border-border-default bg-white px-4 py-2.5 text-xs font-bold text-bento-dark cursor-pointer"
          >
            {isSheet ? "닫기" : "돌아가기"}
          </button>
        </div>
      </div>
    </div>
  );

  const detailContent = (() => {
    if (loading) return loadingContent;
    if (error || !data?.course) return errorContent;

    const { course, theme, relatedAttractions } = data;
    const difficulty = difficultyLabel(course.crs_level);
    const summary = htmlToLines(course.crs_summary);
    const contents = htmlToLines(course.crs_contents);
    const tourInfo = htmlToLines(course.crs_tour_info);
    const travelerInfo = htmlToLines(course.traveler_info);
    const { start, end } = parseEndpoints(course.traveler_info);
    const attractions = Array.isArray(relatedAttractions) ? relatedAttractions.slice(0, 5) : [];
    const themeAccentData = themeAccent(theme?.theme_nm ?? course.theme_nm);

    return (
      <div className="space-y-6">
        {/* 헤더 */}
        <header className="space-y-2">
          <span className={`text-xs font-semibold ${themeAccentData.primaryText} block`}>
            {theme?.theme_nm ?? course.theme_nm ?? "두루누비 걷기노선"}
          </span>
          <h1 id="course-detail-title" className="font-display text-2xl font-black tracking-tight text-bento-dark leading-tight">
            {course.crs_kor_nm}
          </h1>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {course.sigun && (
              <span className={`inline-flex items-center gap-1 rounded-sm ${themeAccentData.primaryBg} px-2.5 py-1 text-[10px] font-semibold text-white`}>
                <MapPin size={10} />
                {course.sigun}
              </span>
            )}
            {course.crs_dstnc != null && (
              <span className="inline-flex items-center gap-1 rounded-sm bg-white border border-border-subtle px-2.5 py-1 text-[10px] font-semibold text-bento-dark">
                <Route size={10} className={themeAccentData.primaryText} />
                {course.crs_dstnc}km
              </span>
            )}
            {course.crs_totl_rqrm_hour != null && (
              <span className="inline-flex items-center gap-1 rounded-sm bg-white border border-border-subtle px-2.5 py-1 text-[10px] font-semibold text-bento-dark">
                <Clock size={10} className={themeAccentData.primaryText} />
                {formatMinutes(course.crs_totl_rqrm_hour)}
              </span>
            )}
            {difficulty && (
              <span className="rounded-sm bg-bento-dark px-2.5 py-1 text-[10px] font-bold text-white">난이도 {difficulty}</span>
            )}
            {course.crs_cycle && (
              <span className="inline-flex items-center gap-1 rounded-sm bg-white border border-border-subtle px-2.5 py-1 text-[10px] font-semibold text-bento-dark/60">
                <Repeat size={10} />
                {course.crs_cycle}
              </span>
            )}
          </div>
        </header>

        {/* GPX 지도 */}
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold text-bento-dark/60 flex items-center gap-1.5">
              <Footprints size={13} className={themeAccentData.primaryText} />
              코스 지도
            </h2>
          </div>
          <CourseMap
            crsIdx={course.crs_idx}
            gpxPath={course.gpxpath}
            name={course.crs_kor_nm}
            themeNm={theme?.theme_nm ?? course.theme_nm}
            ready={ready}
          />
        </section>

        {/* 시점/종점 */}
        <section className="rounded-xl border border-border-default bg-white p-4 shadow-sm">
          <h2 className="text-xs font-bold text-bento-dark/60 mb-3">시점 · 종점</h2>
          <div className="flex items-center justify-between relative">
            <div className="flex flex-col items-center max-w-[40%]">
              <div className={`w-7 h-7 rounded-full ${themeAccentData.primaryBg} text-white flex items-center justify-center text-[10px] font-bold font-mono`}>ST</div>
              <span className="text-[11px] font-bold text-bento-dark mt-1.5 text-center leading-snug">{start ?? "시점"}</span>
            </div>
            <div className={`flex-1 h-1 mx-2 rounded-full ${themeAccentData.primaryBg}`} />
            <div className="flex flex-col items-center max-w-[40%]">
              <div className="w-7 h-7 rounded-full bg-bento-dark text-white flex items-center justify-center text-[10px] font-bold font-mono">ED</div>
              <span className="text-[11px] font-bold text-bento-dark mt-1.5 text-center leading-snug">{end ?? "종점"}</span>
            </div>
          </div>
        </section>

        {/* 요약 */}
        {summary && (
          <section className="space-y-1.5">
            <h2 className="text-xs font-bold text-bento-dark/60">코스 소개</h2>
            <p className="text-sm text-bento-dark/80 leading-relaxed whitespace-pre-line">{summary}</p>
          </section>
        )}

        {/* 상세 설명 */}
        {contents && (
          <section className="space-y-1.5">
            <h2 className="text-xs font-bold text-bento-dark/60">상세 설명</h2>
            <p className="text-xs text-bento-dark/70 leading-relaxed whitespace-pre-line">{contents}</p>
          </section>
        )}

        {/* 주변 관광 정보 */}
        {tourInfo && (
          <section className="rounded-xl border border-border-default bg-white p-4 shadow-sm space-y-1.5">
            <h2 className="text-xs font-bold text-bento-dark/60 flex items-center gap-1.5">
              <CornerDownRight size={12} className={themeAccentData.primaryText} />
              주변 관광 정보
            </h2>
            <p className="text-xs text-bento-dark/70 leading-relaxed whitespace-pre-line">{tourInfo}</p>
          </section>
        )}

        {/* 여행자 정보 */}
        {travelerInfo && (
          <section className="rounded-xl border border-border-default bg-white p-4 shadow-sm space-y-1.5">
            <h2 className="text-xs font-bold text-bento-dark/60 flex items-center gap-1.5">
              <Sparkles size={12} className={themeAccentData.primaryText} />
              여행자 정보
            </h2>
            <p className="text-xs text-bento-dark/70 leading-relaxed whitespace-pre-line">{travelerInfo}</p>
          </section>
        )}

        {/* 주변 관광지 */}
        {attractions.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-bento-dark/60">코스 주변 관광지 {attractions.length}곳</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {attractions.map((attraction, index) => {
                const key = String(attraction.content_id ?? `${attraction.title ?? "attraction"}-${index}`);
                const address = [attraction.addr1, attraction.addr2].filter(Boolean).join(" ");
                return (
                  <div key={key} className="bg-white p-3 rounded-xl border border-border-subtle flex gap-3 items-center">
                    {attraction.firstimage ? (
                      <img
                        src={attraction.firstimage}
                        alt={attraction.title ?? "관광지 이미지"}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-bento-bg flex items-center justify-center shrink-0">
                        <MapPin size={18} className="text-bento-dark/25" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-bold text-bento-dark truncate">{attraction.title ?? "이름 없음"}</h3>
                      <p className="text-[10px] text-bento-dark/50 truncate mt-0.5">{address || "주소 정보 없음"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 하단 액션 바 */}
        {!isSheet && (
          <div className="flex items-stretch gap-3 border-t border-border-default bg-bento-bg pt-4 md:pt-5">
            {course.gpxpath && (
              <a
                href={`/api/dulle-courses/${encodeURIComponent(course.crs_idx)}/gpx`}
                download={`${course.crs_kor_nm}.gpx`}
                aria-label={`${course.crs_kor_nm} GPX 파일 다운로드`}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border ${themeAccentData.softBorder} ${themeAccentData.softBg} ${themeAccentData.primaryText} py-3.5 text-xs font-bold shadow-sm transition-all duration-base hover:bg-white`}
              >
                <Download size={16} />
                GPX 다운로드
              </a>
            )}
            <a
              href={`https://map.kakao.com/link/search/${encodeURIComponent(course.crs_kor_nm)}`}
              target="_blank"
              rel="noreferrer"
              aria-label={`${course.crs_kor_nm} 카카오맵에서 열기`}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-bento-green py-3.5 text-xs font-bold text-white shadow-md transition-all duration-base hover:bg-bento-green/90 ${!course.gpxpath ? "basis-full" : ""}`}
            >
              <span className="h-2 w-2 rounded-full bg-[#FEE500]" aria-hidden />
              카카오맵에서 보기
              <ExternalLink size={12} className="opacity-80" />
            </a>
            <button
              onClick={handleClose}
              className="px-5 py-3.5 bg-bento-dark hover:bg-bento-dark/90 active:scale-98 text-white text-xs font-bold rounded-sm transition-all duration-base cursor-pointer"
            >
              닫기
            </button>
          </div>
        )}
      </div>
    );
  })();

  if (isSheet) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-4 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={onClose}
          className="fixed inset-0 bg-bento-ink/60 backdrop-blur-xs"
        />

        {/* Panel */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="course-detail-title"
          initial={{ y: "100%", opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0.5 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative bg-bento-bg w-full h-full md:h-[90vh] md:max-w-2xl md:rounded-lg shadow-lg flex flex-col overflow-hidden z-10"
        >
          {/* Header Buttons */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-xs hover:bg-white text-bento-dark flex items-center justify-center shadow-sm transition-all duration-fast active:scale-95 cursor-pointer"
              aria-label="닫기"
            >
              <X size={18} />
            </button>
            {onToggleLike && (
              <button
                onClick={toggleLike}
                className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-xs hover:bg-white text-bento-dark flex items-center justify-center shadow-sm transition-all duration-fast active:scale-95 cursor-pointer"
                aria-label={isLiked ? "좋아요 취소" : "좋아요"}
              >
                <Heart
                  size={18}
                  className={
                    isLiked ? "fill-red-500 text-red-500" : "text-bento-dark/60"
                  }
                />
              </button>
            )}
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 pt-16">
            {detailContent}
          </div>

          {/* Sticky Bottom Action Bar */}
          {data?.course && accent && (
            <div className="flex items-stretch gap-3 border-t border-border-default bg-bento-bg p-4 md:px-6">
              {data.course.gpxpath && (
                <a
                  href={`/api/dulle-courses/${encodeURIComponent(data.course.crs_idx)}/gpx`}
                  download={`${data.course.crs_kor_nm}.gpx`}
                  aria-label={`${data.course.crs_kor_nm} GPX 파일 다운로드`}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border ${accent.softBorder} ${accent.softBg} ${accent.primaryText} py-3.5 text-xs font-bold shadow-sm transition-all duration-base hover:bg-white`}
                >
                  <Download size={16} />
                  GPX 다운로드
                </a>
              )}
              <a
                href={`https://map.kakao.com/link/search/${encodeURIComponent(data.course.crs_kor_nm)}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`${data.course.crs_kor_nm} 카카오맵에서 열기`}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-bento-green py-3.5 text-xs font-bold text-white shadow-md transition-all duration-base hover:bg-bento-green/90 ${!data.course.gpxpath ? "basis-full" : ""}`}
              >
                <span className="h-2 w-2 rounded-full bg-[#FEE500]" aria-hidden />
                카카오맵에서 보기
                <ExternalLink size={12} className="opacity-80" />
              </a>
              <button
                onClick={handleClose}
                className="px-5 py-3.5 bg-bento-dark hover:bg-bento-dark/90 active:scale-98 text-white text-xs font-bold rounded-sm transition-all duration-base cursor-pointer"
              >
                닫기
              </button>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-16 animate-fadeIn">
      {/* 돌아가기 (히스토리 뒤로가기) */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 rounded-lg border border-border-default bg-white px-3 py-2 text-xs font-semibold text-bento-dark/70 hover:text-bento-dark cursor-pointer"
        >
          <ArrowLeft size={13} />
          돌아가기
        </button>
        <Link href="/" className="rounded-lg px-3 py-2 text-xs font-semibold text-bento-dark/45 underline underline-offset-4 hover:text-bento-dark">
          목록으로
        </Link>
      </div>
      {detailContent}
    </div>
  );
}
