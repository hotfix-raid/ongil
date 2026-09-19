import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";import {
  ArrowRight,
  Heart,
  TrendingDown,
  Accessibility,
  Leaf,
  Star,
  Baby,
  PawPrint
} from "lucide-react";

// Subset of a /api/tour-attractions row used by the home recommendation cards.
interface HomeAttraction {
  content_id: string;
  title: string;
  addr1: string | null;
  firstimage: string | null;
  firstimage2: string | null;
  hasPetInfo: boolean;
  hasPhysicalInfo: boolean;
  hasInfantFamilyInfo: boolean;
  cnctrRate: string | number | null;
}

const QUIET_COUNT = 3;
const PERSONAL_COUNT = 2;

interface HomeTabProps {
  onSelectAttraction: (contentId: string) => void;
  likedDestinations: string[];
  onToggleLike: (id: string) => void;
  accessibilityDefaults: {
    petFriendly: boolean;
    wheelchair: boolean;
    stroller: boolean;
    senior: boolean;
    parking: boolean;
  };
  onNavigateToTab: (tab: "home" | "search" | "course" | "my") => void;
}

export default function HomeTab({
  onSelectAttraction,
  likedDestinations,
  onToggleLike,
  accessibilityDefaults,
  onNavigateToTab
}: HomeTabProps) {
  const { petFriendly, wheelchair, stroller } = accessibilityDefaults;

  // Real DB recommendations: user's MY filters (same mapping as SearchTab), emptiest forecast first.
  // ponytail: senior/parking defaults have no DB-backed filter yet, so they don't narrow results.
  const [attractions, setAttractions] = useState<HomeAttraction[] | null>(null); // null = loading
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams({
      date: new Date().toISOString().slice(0, 10),
      sort: "congestion",
      limit: String(QUIET_COUNT + PERSONAL_COUNT)
    });
    if (petFriendly) params.set("petInfo", "true");
    if (wheelchair) params.set("physicalInfo", "true");
    if (stroller) params.set("infantFamilyInfo", "true");

    const abort = new AbortController();
    setAttractions(null);
    setLoadError(false);
    fetch(`/api/tour-attractions?${params}`, { signal: abort.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data: { rows: HomeAttraction[] }) => setAttractions(data.rows))
      .catch((e) => {
        if (abort.signal.aborted) return;
        console.error("Failed to load home recommendations", e);
        setAttractions([]);
        setLoadError(true);
      });
    return () => abort.abort();
  }, [petFriendly, wheelchair, stroller]);

  const hasDbFilters = petFriendly || wheelchair || stroller;
  const quietFeed = attractions?.slice(0, QUIET_COUNT) ?? [];
  const personalizedFeed = attractions?.slice(QUIET_COUNT) ?? [];
  const feedStatus = attractions === null
    ? "추천 명소를 불러오는 중이에요…"
    : loadError
      ? "추천 명소를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
      : hasDbFilters
        ? "MY 안심 기준에 맞는 명소가 아직 없어요. 기준을 조금 줄여보세요."
        : "추천할 명소가 없어요.";
  const hasProfileDefaults = Object.values(accessibilityDefaults).some(Boolean);

  return (
    <div className="space-y-12 animate-fadeIn pb-12">

      {/* 1. Header with Title + Climate Widget */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-display font-black tracking-tight text-bento-dark mb-1">
            온길 추천 여행지
          </h2>
          <p className="text-xs text-bento-stone">지속 가능한 로컬 지원과 포용적인 맞춤형 관광 큐레이터</p>
        </div>

        {/* Climate Widget Trigger Badge */}
        {/*<div className="flex items-center gap-2">
          <span className="text-xs font-medium text-bento-stone hidden md:inline">
            기상 연동
          </span>
          <button
            onClick={() => setShowWeatherDetails(!showWeatherDetails)}
            className="px-4 py-2 bg-white hover:bg-bento-cream border border-border-default rounded-full text-xs font-semibold text-bento-dark flex items-center gap-2.5 shadow-sm transition-all duration-fast ease-out-soft active:scale-95 cursor-pointer"
          >
            {weatherDetailsMap[weatherPreset].icon}
            <span className="font-bold">강원 소멸지역 예보: {weatherPreset === "sunny" ? "맑음" : weatherPreset === "rainy" ? "소나기" : "미세먼지 나쁨"}</span>
            <span className="text-xs font-bold bg-bento-green/10 text-bento-green px-2 py-0.5 rounded-full">{showWeatherDetails ? "닫기" : "자세히"}</span>
          </button>
        </div>*/}
      </div>

      {/* 2. Section: 지금 한산한 인구감소지역 (Tranquil Depopulated Area Picks) */}
      <div className="bg-bento-olive/25 border border-bento-moss/30 p-6 sm:p-8 rounded-xl space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h3 className="text-lg font-display font-black text-bento-dark tracking-tight flex items-center gap-1.5">
                지금 한산한 여행지 추천 <Leaf size={18} className="text-bento-green" />
              </h3>
            </div>
            <p className="text-xs text-bento-stone leading-relaxed">
              {hasDbFilters
                ? "MY 안심 기준을 반영해, 오늘 혼잡 예측이 가장 낮은 강원 4개 군의 명소"
                : "오늘 혼잡 예측이 가장 낮은 강원 4개 군의 숨겨진 힐링 명소"}
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab("search")}
            className="text-xs font-bold text-bento-green flex items-center gap-1 hover:underline cursor-pointer bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-full border border-bento-green/10 shadow-sm transition-all duration-fast"
          >
            <span>전체보기</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Horizontal Card Track on mobile, Grid on desktop */}
        <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-thin scrollbar-thumb-bento-dark/10 md:grid md:grid-cols-3 md:overflow-x-visible md:pb-0">
          {quietFeed.length === 0 && (
            <p className="text-xs text-bento-stone py-6">{feedStatus}</p>
          )}
          {quietFeed.map((row) => {
            const id = String(row.content_id);
            const image = row.firstimage || row.firstimage2;
            return (
            <motion.div
              key={id}
              whileHover={{ scale: 1.01, y: -2 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              onClick={() => onSelectAttraction(id)}
              className="min-w-[270px] bg-white rounded-xl border border-border-subtle overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow duration-base cursor-pointer shrink-0"
            >
              <div className="relative h-40 bg-bento-cream">
                {image ? (
                  <img
                    src={image}
                    alt={row.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-bento-dark/35">이미지 없음</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-bento-dark/70 via-transparent to-transparent" />

                {/* Congestion indicator badge */}
                {row.cnctrRate != null && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-emerald-500/90 text-white rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                    <TrendingDown size={10} />
                    <span>혼잡 예측 {Math.round(Number(row.cnctrRate))}%</span>
                  </div>
                )}

                <div className="absolute bottom-3 left-3 text-white">
                  {row.addr1 && (
                    <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-md block w-max mb-1">
                      {row.addr1.split(" ")[1]}
                    </span>
                  )}
                  <h4 className="font-display font-black text-base tracking-tight leading-tight">
                    {row.title}
                  </h4>
                </div>

                {/* Like Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLike(id);
                  }}
                  aria-label={`${row.title} 좋아요`}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white hover:scale-105 transition-all duration-fast cursor-pointer"
                >
                  <Heart size={14} className={likedDestinations.includes(id) ? "fill-red-500 text-red-500" : "text-bento-stone"} />
                </button>
              </div>

              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <p className="text-xs text-bento-dark/60 leading-relaxed line-clamp-2">
                  {row.addr1 || "주소 정보 없음"}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-border-subtle">
                  {row.hasPhysicalInfo && (
                    <span className="text-xs font-bold bg-bento-cream text-bento-dark/70 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Accessibility size={10} />
                      이동 편의 정보
                    </span>
                  )}
                  {row.hasInfantFamilyInfo && (
                    <span className="text-xs font-bold bg-bento-cream text-bento-dark/70 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Baby size={10} />
                      영유아·가족 편의
                    </span>
                  )}
                  {row.hasPetInfo && (
                    <span className="text-xs font-bold bg-bento-cream text-bento-dark/70 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <PawPrint size={10} />
                      반려동물 안내
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>
      </div>

      {/* 4. Section: 당신을 위한 접근성 추천 (Accessibility Personalized Feed) */}
      <div className="bg-bento-sand/35 border border-bento-clay/40 p-6 sm:p-8 rounded-xl space-y-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <h3 className="text-lg font-display font-black text-bento-dark tracking-tight flex items-center gap-1.5">
              당신을 위한 접근성 추천 <Star size={18} className="text-amber-500" />
            </h3>
          </div>
          <p className="text-xs text-bento-stone leading-relaxed">
            {hasProfileDefaults
              ? "MY 설정에 저장하신 배리어프리 조건을 반영한 맞춤 힐링 노선입니다."
              : "동반 반려동물, 유모차 사용, 휠체어 여부에 맞춰 무장애 걷기길을 자동으로 큐레이션합니다."}
          </p>
        </div>

        {hasProfileDefaults ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {personalizedFeed.length === 0 && (
              <p className="text-xs text-bento-stone py-4">
                {attractions === null || loadError || quietFeed.length === 0
                  ? feedStatus
                  : "위 추천 외에 MY 안심 기준에 맞는 명소가 더 없어요."}
              </p>
            )}
            {personalizedFeed.map((row) => {
              const id = String(row.content_id);
              const image = row.firstimage || row.firstimage2;
              return (
              <motion.div
                key={id}
                whileHover={{ y: -1 }}
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                onClick={() => onSelectAttraction(id)}
                className="bg-white p-4 rounded-xl border border-border-subtle flex gap-4 hover:shadow-md hover:border-border-strong transition-all duration-base cursor-pointer items-center"
              >
                {image ? (
                  <img
                    src={image}
                    alt={row.title}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-bento-cream shrink-0" />
                )}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {row.addr1 && <span className="text-xs font-bold text-bento-green">{row.addr1.split(" ")[1]}</span>}
                    <span className="text-xs font-bold bg-bento-olive text-bento-dark px-1.5 py-0.5 rounded-sm">인구감소지</span>
                  </div>
                  <h4 className="font-display font-black text-sm text-bento-dark tracking-tight truncate leading-tight">
                    {row.title}
                  </h4>
                  <p className="text-xs text-bento-stone truncate leading-relaxed">
                    {row.addr1 || "주소 정보 없음"}
                  </p>
                  <div className="flex items-center gap-1.5 pt-1">
                    {wheelchair && row.hasPhysicalInfo && (
                      <span className="text-xs bg-bento-green/15 text-bento-green font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Accessibility size={10} />
                        이동 편의
                      </span>
                    )}
                    {stroller && row.hasInfantFamilyInfo && (
                      <span className="text-xs bg-bento-green/15 text-bento-green font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Baby size={10} />
                        유모차·가족
                      </span>
                    )}
                    {petFriendly && row.hasPetInfo && (
                      <span className="text-xs bg-bento-green/15 text-bento-green font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <PawPrint size={10} />
                        반려가족
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
              );
            })}
          </div>
        ) : (
          /* Profile Empty Call-to-Action Card */
          <div className="p-6 bg-white rounded-xl border border-border-default shadow-sm flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-left">
            <div className="space-y-2 max-w-lg">
              <div className="flex items-center justify-center md:justify-start gap-1.5">
                <div className="w-5 h-5 rounded-full bg-bento-green/15 text-bento-green flex items-center justify-center">
                  <Accessibility size={12} />
                </div>
                <span className="text-xs font-bold text-bento-green">맞춤 필터를 설정하면 더 정확한 추천을 받을 수 있어요</span>
              </div>
              <h4 className="font-display font-black text-base text-bento-dark tracking-tight">
                나만의 배리어프리 보행 조건을 설정해 보세요
              </h4>
              <p className="text-xs text-bento-stone leading-relaxed">
                반려동물 동반, 휠체어 사용, 유모차 여부 등 나만의 조건을 프로필에 등록하면
                홈 화면의 추천과 검색 결과가 자동으로 맞춰집니다.
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab("my")}
              className="px-5 py-3 bg-bento-dark hover:bg-bento-ink text-white text-xs font-bold rounded-xl transition-colors duration-fast cursor-pointer whitespace-nowrap shadow-sm"
            >
              내 맞춤 기본값 설정하기
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
