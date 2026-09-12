'use client';

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Footprints,
  Search,
  RefreshCw,
  Sparkles,
  Check,
  Accessibility,
  Baby,
  PawPrint,
  Clock,
  MapPin,
  Route
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
  onSelectDestination: (destination: never) => void;
  likedDestinations: string[];
  onToggleLike: (id: string) => void;
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

export default function CourseTab({
  onSelectDestination: _onSelectDestination,
  likedDestinations: _liked,
  onToggleLike: _onToggleLike,
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

  const toggleTheme = (routeIdx: string) =>
    setSelectedThemes((current) => (current.includes(routeIdx) ? current.filter((t) => t !== routeIdx) : [...current, routeIdx]));

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

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header */}
      <div className="text-center md:text-left">
        <span className="text-sm font-semibold text-bento-green block mb-1">두루누비 무장애 걷기 코스</span>
        <h2 className="text-2xl font-display font-black text-bento-dark tracking-tight leading-none mb-1.5 flex items-center gap-2 justify-center md:justify-start">
          <span>걷기 코스 전용 탐색</span>
          <span className="w-8 h-8 rounded-full bg-bento-green/10 flex items-center justify-center">
            <Footprints size={18} className="text-bento-green" />
          </span>
        </h2>
        <p className="text-bento-dark/60 text-xs leading-relaxed max-w-2xl">
          지자체 및 문화체육관광부 두루누비 GPS 자료를 기반으로,
          휠체어 교행 안전 수치 및 반려견 출입 기준을 정밀 매칭한 &lsquo;열린 안심 길&rsquo;을 제안합니다.
        </p>
      </div>

      {/* 2. 테마 카드 섹션 */}
      {themes && themes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {themes.map((theme) => {
            const active = selectedThemes.includes(theme.route_idx);
            const accent = themeAccent(theme.theme_nm);
            return (
              <button
                key={theme.route_idx}
                onClick={() => toggleTheme(theme.route_idx)}
                aria-pressed={active}
                className={`p-3.5 rounded-xl border text-left transition-all duration-base cursor-pointer ${
                  active
                    ? `${accent.activeBg} text-white ${accent.activeBorder} shadow-md`
                    : `bg-white border-border-default shadow-sm ${accent.inactiveHoverBorder}`
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Route size={13} className={active ? "text-white" : accent.inactiveIcon} />
                  {active && <Check size={13} />}
                </div>
                <p className={`text-xs font-bold leading-tight ${active ? "text-white" : "text-bento-dark"}`}>{theme.theme_nm}</p>
                <p className={`text-[10px] mt-1 font-mono ${active ? "text-white/80" : "text-bento-dark/50"}`}>
                  {theme.courseCount}개 코스 · {theme.totalDistanceKm.toLocaleString()}km
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Filter Control Panel */}
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
                className="bg-white rounded-lg border border-border-default overflow-hidden flex flex-col justify-between shadow-sm"
              >
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
