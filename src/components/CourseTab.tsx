'use client';

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Footprints,
  ArrowLeft,
  Search,
  RefreshCw,
  Sparkles,
  Check,
  Accessibility,
  Baby,
  PawPrint,
  Clock,
  MapPin,
  Route,
  Heart
} from "lucide-react";
import { adaptCourse, parseSigun } from "@/src/lib/adapters/course";
import { formatMinutes, htmlToLines } from "@/src/lib/format";
import { themeAccent } from "@/src/lib/theme";
import type { DulleCoursesResponse, UICourse, WalkingThemeRow } from "@/src/types/database";

function regionLabel(sigun: string | null): string {
  return parseSigun(sigun) ?? "지역 미상";
}

// ---------------------------------------------------------------------------

interface CourseTabProps {
  likedCourses: string[];
  onToggleCourseLike: (crsIdx: string) => void;
  onSelectCourse: (crsIdx: string) => void;
}

type SortKey = "distance" | "duration" | "course";
type Preset = "all" | "short" | "medium" | "long";

const LEVEL_OPTIONS = [
  { value: "1", label: "쉬움" },
  { value: "2", label: "보통" },
  { value: "3", label: "어려움" }
] as const;

const DISTANCE_OPTIONS: Array<{ value: Preset; label: string }> = [
  { value: "all", label: "전체 거리" },
  { value: "short", label: "5km 미만" },
  { value: "medium", label: "5–10km" },
  { value: "long", label: "10km 초과" }
];

const DURATION_OPTIONS: Array<{ value: Preset; label: string }> = [
  { value: "all", label: "전체 시간" },
  { value: "short", label: "1시간 이하" },
  { value: "medium", label: "2–3시간" },
  { value: "long", label: "4시간 이상" }
];

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "course", label: "코스순" },
  { value: "distance", label: "거리순" },
  { value: "duration", label: "소요시간순" }
];

const PAGE_LIMIT = 20;
const WALKING_THEME_NAMES = ["남파랑길", "서해랑길", "DMZ 평화의 길", "해파랑길"] as const;

export default function CourseTab({
  likedCourses,
  onToggleCourseLike,
  onSelectCourse
}: CourseTabProps) {
  // 검색/필터 상태 (탭 내 상태만 — URL 동기화 생략)
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [distance, setDistance] = useState<Preset>("all");
  const [duration, setDuration] = useState<Preset>("all");
  const [sort, setSort] = useState<SortKey>("course");
  const [showThemeLanding, setShowThemeLanding] = useState(true);

  // 데이터 상태
  const [themes, setThemes] = useState<WalkingThemeRow[] | null>(null);
  const [courses, setCourses] = useState<UICourse[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  const controller = useRef<AbortController | null>(null);
  const pageRef = useRef(1);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // 테마 카드 섹션
  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/walking-themes", { signal: abort.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("themes failed"))))
      .then((data: WalkingThemeRow[]) => {
        if (!abort.signal.aborted && Array.isArray(data)) setThemes(data);
      })
      .catch(() => {
        // 테마 API 미구현 시 섹션만 숨기고 코스 목록은 정상 동작
        if (!abort.signal.aborted) setThemes(null);
      });
    return () => abort.abort();
  }, []);

  const buildParams = useCallback(
    (page: number) => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_LIMIT),
        sort
      });
      if (appliedQuery) params.set("q", appliedQuery);
      if (selectedThemes.length > 0) params.set("theme", selectedThemes.join(","));
      if (selectedRegion !== "all") params.set("region", selectedRegion);
      if (selectedLevels.length > 0) params.set("level", selectedLevels.join(","));
      if (distance !== "all") params.set("distance", distance);
      if (duration !== "all") params.set("duration", duration);
      return params;
    },
    [appliedQuery, selectedThemes, selectedRegion, selectedLevels, distance, duration, sort]
  );

  const fetchCourses = useCallback(
    async (page: number, append: boolean) => {
      controller.current?.abort();
      const abort = new AbortController();
      controller.current = abort;
      if (append) setLoadingMore(true);
      else {
        setLoading(true);
        setError(false);
      }
      try {
        const response = await fetch(`/api/dulle-courses?${buildParams(page)}`, { signal: abort.signal });
        if (!response.ok) throw new Error("request failed");
        const data = (await response.json()) as DulleCoursesResponse;
        if (abort.signal.aborted) return;
        const adapted = (Array.isArray(data.rows) ? data.rows : []).map(adaptCourse);
        setCourses((current) => (append ? [...current, ...adapted] : adapted));
        setCount(Number(data.count) || 0);
        if (data.filters && Array.isArray(data.filters.regions)) setRegions(data.filters.regions);
        pageRef.current = page;
      } catch {
        if (!abort.signal.aborted && !append) {
          setCourses([]);
          setCount(0);
          setError(true);
        }
      } finally {
        if (!abort.signal.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [buildParams]
  );

  // 필터 변경 시 1페이지부터 재조회
  useEffect(() => {
    fetchCourses(1, false);
    return () => controller.current?.abort();
  }, [fetchCourses]);

  // 무한스크롤
  const loadMore = useCallback(() => {
    if (loading || loadingMore || courses.length >= count) return;
    fetchCourses(pageRef.current + 1, true);
  }, [loading, loadingMore, courses.length, count, fetchCourses]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, courses.length]);

  const toggleLevel = (level: string) =>
    setSelectedLevels((current) => (current.includes(level) ? current.filter((l) => l !== level) : [...current, level]));

  const resetFilters = () => {
    setQuery("");
    setAppliedQuery("");
    setSelectedThemes([]);
    setSelectedRegion("all");
    setSelectedLevels([]);
    setDistance("all");
    setDuration("all");
    setSort("course");
  };

  const activeFilterCount =
    selectedThemes.length + (selectedRegion !== "all" ? 1 : 0) + selectedLevels.length + (distance !== "all" ? 1 : 0) + (duration !== "all" ? 1 : 0);

  const themeForName = (name: string) => themes?.find((theme) => theme.theme_nm.includes(name));
  const selectedTheme = themes?.find((theme) => selectedThemes.includes(theme.route_idx));
  const selectedThemeName = selectedTheme
    ? WALKING_THEME_NAMES.find((name) => selectedTheme.theme_nm.includes(name)) ?? selectedTheme.theme_nm
    : null;

  if (showThemeLanding) {
    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        <header>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-bento-green">둘레길 걷기 코스</p>
          <h2 className="font-display text-3xl font-black tracking-tight text-bento-dark flex items-center gap-2">
            <span>어떤 길을 걸어볼까요?</span>
            <span className="w-8 h-8 rounded-full bg-bento-green/10 flex items-center justify-center"><Footprints size={18} className="text-bento-green" /></span>
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-bento-dark/55">걷고 싶은 테마를 고르면 그 길에 맞는 코스를 바로 찾아볼 수 있어요.</p>
        </header>
        {themes ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {WALKING_THEME_NAMES.map((name) => {
              const theme = themeForName(name);
              if (!theme) return null;
              const accent = themeAccent(theme.theme_nm);
              return (
                <motion.button
                  key={name}
                  type="button"
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => { setSelectedThemes([theme.route_idx]); setShowThemeLanding(false); }}
                  className={`group relative overflow-hidden rounded-2xl border border-border-default bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-lg ${accent.inactiveHoverBorder}`}
                  aria-label={`${name} 코스 찾아보기`}
                >
                  <div className={`absolute -right-8 -top-10 h-32 w-32 rounded-full opacity-10 ${accent.primaryBg}`} />
                  <div className="relative flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-xl font-black tracking-tight text-bento-dark">{name}</h3>
                    </div>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${accent.softBg} ${accent.primaryText} transition-transform group-hover:translate-x-1`} aria-hidden="true">→</span>
                  </div>
                  <p className="relative mt-4 min-h-[3.25rem] text-xs leading-relaxed text-bento-dark/60 line-clamp-3 whitespace-pre-line">{htmlToLines(theme.theme_descs) || "이 테마의 걷기 코스를 만나보세요."}</p>
                  <div className="relative mt-4 flex items-center gap-3 border-t border-border-subtle pt-3 text-[10px] font-medium text-bento-dark/50" aria-label={`${theme.courseCount}개 코스, 총 ${theme.totalDistanceKm.toLocaleString()}킬로미터`}>
                    <span className="inline-flex items-center gap-1.5">
                      <Footprints size={12} className={accent.primaryText} aria-hidden="true" />
                      <span><strong className="font-bold text-bento-dark">{theme.courseCount}</strong>개 코스</span>
                    </span>
                    <span className="h-3.5 border-l border-border-subtle" aria-hidden="true" />
                    <span className="inline-flex items-center gap-1.5">
                      <Route size={12} className={accent.primaryText} aria-hidden="true" />
                      <span>총 <strong className="font-bold text-bento-dark">{theme.totalDistanceKm.toLocaleString()}</strong>km</span>
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" aria-label="테마 불러오는 중">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-44 rounded-2xl border border-border-default bg-white shadow-sm animate-pulse" />)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header */}
      <header className="relative pt-10 pl-12 text-left md:pt-0">
        <button
          type="button"
          onClick={() => { resetFilters(); setShowThemeLanding(true); }}
          className="absolute left-0 top-0 inline-flex h-8 w-8 items-center justify-center rounded-full text-bento-dark/55 transition hover:bg-bento-bg hover:text-bento-green cursor-pointer"
          aria-label="테마 선택으로 돌아가기"
          title="테마 선택으로 돌아가기"
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </button>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-bento-green">둘레길 걷기 코스</p>
        <h2 className="font-display text-3xl font-black tracking-tight text-bento-dark flex items-center gap-2">
          <span>{selectedThemeName ? `${selectedThemeName} 코스 탐색` : "걷기 코스 전용 탐색"}</span>
          <span className="w-8 h-8 rounded-full bg-bento-green/10 flex items-center justify-center">
            <Footprints size={18} className="text-bento-green" />
          </span>
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-bento-dark/55">
          지자체 및 문화체육관광부 두루누비 GPS 자료를 기반으로,
          휠체어 교행 안전 수치 및 반려견 출입 기준을 정밀 매칭한 &lsquo;열린 안심 길&rsquo;을 제안합니다.
        </p>
      </header>

      {/* 2. Filter Control Panel */}
      <div className="bg-white p-4 rounded-xl border border-border-default shadow-sm space-y-3">
        {/* 검색어 */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bento-dark/30" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") setAppliedQuery(query.trim());
            }}
            placeholder="코스명·시군·테마로 검색하세요"
            className="w-full rounded-lg border border-border-default bg-bento-bg/40 py-2.5 pl-10 pr-4 text-xs text-bento-dark outline-none transition focus:border-bento-green focus:bg-white"
          />
        </div>

        {/* 시군 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold text-bento-dark/50 w-14 shrink-0">시군</span>
          {["all", ...regions].map((reg) => (
            <button
              key={reg}
              onClick={() => setSelectedRegion(reg)}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all duration-base cursor-pointer ${
                selectedRegion === reg ? "bg-bento-green text-white shadow-sm" : "bg-bento-bg text-bento-dark/60 hover:bg-bento-dark/5"
              }`}
            >
              {reg === "all" ? "전체" : parseSigun(reg)}
            </button>
          ))}
        </div>

        {/* 난이도 (복수) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold text-bento-dark/50 w-14 shrink-0">난이도</span>
          {LEVEL_OPTIONS.map((opt) => {
            const active = selectedLevels.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggleLevel(opt.value)}
                aria-pressed={active}
                className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all duration-base cursor-pointer flex items-center gap-1 ${
                  active ? "bg-bento-green text-white shadow-sm" : "bg-bento-bg text-bento-dark/60 hover:bg-bento-dark/5"
                }`}
              >
                {opt.label}
                {active && <Check size={12} />}
              </button>
            );
          })}
        </div>

        {/* 거리 프리셋 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold text-bento-dark/50 w-14 shrink-0">거리</span>
          {DISTANCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDistance(opt.value)}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all duration-base cursor-pointer ${
                distance === opt.value ? "bg-bento-green text-white shadow-sm" : "bg-bento-bg text-bento-dark/60 hover:bg-bento-dark/5"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 시간 프리셋 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold text-bento-dark/50 w-14 shrink-0">시간</span>
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDuration(opt.value)}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all duration-base cursor-pointer ${
                duration === opt.value ? "bg-bento-green text-white shadow-sm" : "bg-bento-bg text-bento-dark/60 hover:bg-bento-dark/5"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 정렬 */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border-subtle">
          <span className="text-[10px] font-semibold text-bento-dark/50 w-14 shrink-0">정렬</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all duration-base cursor-pointer ${
                sort === opt.value ? "bg-bento-green text-white shadow-sm" : "bg-bento-bg text-bento-dark/60 hover:bg-bento-dark/5"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setAppliedQuery(query.trim())}
              className="px-4 py-1.5 bg-bento-green hover:bg-bento-green/90 text-white text-xs font-semibold rounded-sm transition-all duration-base cursor-pointer"
            >
              검색
            </button>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="px-3 py-1.5 text-xs font-medium text-bento-dark/50 underline underline-offset-4 hover:text-bento-dark cursor-pointer"
              >
                초기화
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Curation Summary Banner */}
      <div className="p-3.5 bg-bento-olive/15 border border-bento-green/10 rounded-lg text-xs text-bento-dark font-medium flex items-center gap-2.5">
        <Sparkles size={14} className="text-bento-green shrink-0" />
        <span>
          탐색 조건:{" "}
          <strong>
            {selectedRegion === "all" ? "전체 시군" : parseSigun(selectedRegion)}
            {selectedThemes.length > 0 ? ` · 테마 ${selectedThemes.length}개` : ""}
            {selectedLevels.length > 0 ? ` · 난이도 ${selectedLevels.length}개` : ""}
          </strong>{" "}
          → <strong>{loading ? "검색 중…" : `${count.toLocaleString()}개 코스 매칭`}</strong>
        </span>
      </div>

      {/* 5. Course Cards List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="bg-white rounded-lg border border-border-default overflow-hidden shadow-sm animate-pulse">
              <div className="h-44 bg-bento-bg" />
              <div className="p-4 space-y-3">
                <div className="h-3 w-2/3 rounded bg-bento-bg" />
                <div className="h-3 w-full rounded bg-bento-bg" />
                <div className="h-6 w-1/3 rounded bg-bento-bg" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-border-default bg-white px-6 py-14 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bento-bg text-bento-green">
            <RefreshCw size={20} />
          </div>
          <h4 className="font-display text-base font-black text-bento-dark">코스 목록을 불러오지 못했어요</h4>
          <p className="mt-2 text-xs text-bento-dark/50">잠시 후 다시 시도해 주세요.</p>
          <button
            onClick={() => fetchCourses(1, false)}
            className="mt-5 rounded-lg bg-bento-green px-4 py-2.5 text-xs font-bold text-white cursor-pointer"
          >
            다시 시도
          </button>
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-xl border border-border-default bg-white px-6 py-14 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bento-bg text-bento-green">
            <Footprints size={20} />
          </div>
          <h4 className="font-display text-base font-black text-bento-dark">조건에 맞는 코스가 없어요</h4>
          <p className="mt-2 text-xs text-bento-dark/50">필터를 조금 줄여 다시 찾아보세요.</p>
          <button
            onClick={resetFilters}
            className="mt-5 rounded-lg bg-bento-green px-4 py-2.5 text-xs font-bold text-white cursor-pointer"
          >
            필터 모두 지우기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {courses.map((course) => {
            const hasAccessibility =
              course.accessibility.wheelchair || course.accessibility.stroller || course.accessibility.petFriendly;
            const accent = themeAccent(course.themeNm);
            return (
              <motion.div
                key={course.id}
                whileHover={{
                  y: -3,
                  boxShadow: "0 4px 6px -1px color-mix(in srgb, #1A2F23 6%, transparent)"
                }}
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative bg-white rounded-lg border border-border-default overflow-hidden flex flex-col justify-between shadow-sm"
              >
                <button
                  type="button"
                  aria-label={likedCourses.includes(course.id) ? `${course.name} 좋아요 취소` : `${course.name} 좋아요`}
                  onClick={(event) => { event.stopPropagation(); onToggleCourseLike(course.id); }}
                  className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-bento-dark/50 shadow-sm"
                >
                  <Heart size={16} className={likedCourses.includes(course.id) ? "fill-red-500 text-red-500" : ""} />
                </button>
                <button
                  type="button"
                  onClick={() => onSelectCourse(course.id)}
                  className="flex flex-col flex-1 text-left cursor-pointer"
                >
                  <div className={`relative h-44 shrink-0 ${accent.gradientClass}`}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Footprints size={44} className="text-white/30" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-bento-dark/80 via-transparent to-transparent" />

                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
                      <span className={`text-[10px] font-semibold ${accent.primaryBg} text-white px-2.5 py-0.5 rounded-sm`}>
                        {course.region}
                      </span>
                      <span className={`text-[10px] font-semibold bg-white/90 text-bento-dark px-2.5 py-0.5 rounded-sm backdrop-blur-xs border ${accent.softBorder}`}>
                        {course.distanceKm != null ? `${course.distanceKm}km` : "거리 미상"} ·{" "}
                        {course.timeMins != null ? formatMinutes(course.timeMins) : "시간 미상"}
                      </span>
                      {course.difficulty && (
                        <span className={`text-[10px] font-semibold ${accent.softBg} ${accent.primaryText} px-2.5 py-0.5 rounded-sm border ${accent.softBorder}`}>
                          {course.difficulty}
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3.5 left-4 right-4 text-white">
                      <span className="text-[9px] font-semibold text-white/90 block">
                          {course.themeNm ?? "두루누비 걷기노선"}
                      </span>
                      <h3 className="font-display font-bold text-sm md:text-base tracking-tight leading-snug mt-1 line-clamp-2">
                        {course.name}
                      </h3>
                    </div>
                  </div>

                  <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-[9px] font-semibold text-bento-dark/50 block">코스 소개</span>
                      <p className="text-[11px] text-bento-dark/60 leading-relaxed line-clamp-2 whitespace-pre-line">
                        {htmlToLines(course.summary) || "코스 소개가 준비 중입니다."}
                      </p>
                    </div>

                    {hasAccessibility && (
                      <div className="space-y-1.5 pt-2 border-t border-border-subtle">
                        <span className="text-[9px] font-semibold text-bento-dark/50 block">보행 지표</span>
                        <div className="flex flex-wrap gap-1">
                          {course.accessibility.wheelchair && (
                            <span className="bg-bento-bg text-bento-dark text-[9px] font-medium px-2.5 py-1 rounded-sm border border-border-subtle flex items-center gap-1">
                              <Accessibility size={10} className="text-bento-green" />
                              <span>휠체어 안심</span>
                            </span>
                          )}
                          {course.accessibility.stroller && (
                            <span className="bg-bento-bg text-bento-dark text-[9px] font-medium px-2.5 py-1 rounded-sm border border-border-subtle flex items-center gap-1">
                              <Baby size={10} className="text-amber-500" />
                              <span>유모차 가능</span>
                            </span>
                          )}
                          {course.accessibility.petFriendly && (
                            <span className="bg-bento-bg text-bento-dark text-[9px] font-medium px-2.5 py-1 rounded-sm border border-border-subtle flex items-center gap-1">
                              <PawPrint size={10} className="text-orange-500" />
                              <span>반려동물 환영</span>
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-1 text-[10px] text-bento-dark/40 font-mono">
                      {course.distanceKm != null && (
                        <span className="flex items-center gap-1">
                          <MapPin size={10} />
                          {course.distanceKm}km
                        </span>
                      )}
                      {course.timeMins != null && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {formatMinutes(course.timeMins)}
                        </span>
                      )}
                      <span className={`ml-auto ${accent.primaryText} font-sans font-semibold`}>상세 보기 →</span>
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 6. 무한스크롤 센티넬 */}
      <div ref={sentinelRef} className="py-3 text-center text-xs font-semibold text-bento-dark/45">
        {loadingMore ? "불러오는 중…" : !loading && !error && courses.length >= count && count > 0 ? "모두 불러왔어요" : ""}
      </div>

    </div>
  );
}
