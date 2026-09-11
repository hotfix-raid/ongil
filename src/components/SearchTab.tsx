import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  MapPin,
  Calendar,
  Users,
  SlidersHorizontal,
  Navigation,
  Sun,
  CloudRain,
  Cloud,
  Wind,
  Info,
  Plus,
  Minus,
  Check,
  ChevronDown,
  X,
  ArrowRight,
  Sparkles,
  Compass,
  AlertTriangle,
  Flame,
  Trees,
  Accessibility,
  Footprints,
  Maximize2,
  Heart,
  Leaf,
  Baby,
  PawPrint,
  Car
} from "lucide-react";
import { MockDestination, generate30DaysCongestion } from "../data/destinations";

interface SearchTabProps {
  onSelectDestination: (destination: MockDestination) => void;
  likedDestinations: string[];
  onToggleLike: (id: string) => void;
  accessibilityDefaults: {
    petFriendly: boolean;
    wheelchair: boolean;
    stroller: boolean;
    senior: boolean;
    parking: boolean;
  };
}

interface Sigungu {
  ldong_regn_cd: string;
  ldong_signgu_cd: string;
  signgu_name: string;
}

interface SigunguResponse {
  count: number;
  rows: Sigungu[];
}

interface TourAttraction {
  content_id: string | number;
  title: string;
  addr1?: string | null;
  addr2?: string | null;
  firstimage?: string | null;
  firstimage2?: string | null;
  lcls_systm1?: string | null;
  lcls_systm2?: string | null;
  lcls_systm3?: string | null;
  parking?: string | null;
  chkbabycarriage?: string | null;
  chkpet?: string | null;
  mapx?: string | number | null;
  mapy?: string | number | null;
  ldong_regn_cd: string;
  ldong_signgu_cd: string;
}

interface TourAttractionsResponse {
  count: number;
  rows: TourAttraction[];
}

const next30Days = generate30DaysCongestion();

export default function SearchTab({
  onSelectDestination,
  likedDestinations,
  onToggleLike,
  accessibilityDefaults
}: SearchTabProps) {
  // Main Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSigungu, setSelectedSigungu] = useState<Sigungu | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sigunguRows, setSigunguRows] = useState<Sigungu[]>([]);
  const [isSigunguLoading, setIsSigunguLoading] = useState(true);
  const [sigunguLoadFailed, setSigunguLoadFailed] = useState(false);

  // Date selection state
  const [isPeriod, setIsPeriod] = useState(true);
  const [selectedStartDate, setSelectedStartDate] = useState<string>("2026-07-06");
  const [selectedEndDate, setSelectedEndDate] = useState<string>("2026-07-08");
  const [activeDateSelector, setActiveDateSelector] = useState(false);

  // Guest count state
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [pets, setPets] = useState(0);
  const [activeGuestSelector, setActiveGuestSelector] = useState(false);

  // Filters state
  const [filterPetFriendly, setFilterPetFriendly] = useState(false);
  const [filterPetConditions, setFilterPetConditions] = useState<"any" | "indoor" | "large">("any");
  const [filterWheelchair, setFilterWheelchair] = useState(false);
  const [filterStroller, setFilterStroller] = useState(false);
  const [filterParking, setFilterParking] = useState(false);
  const [filterSenior, setFilterSenior] = useState(false);
  const [activeFilterSheet, setActiveFilterSheet] = useState(false);

  // Congestion Avoidance Switch (Default ON)
  const [avoidCongestion, setAvoidCongestion] = useState(true);

  // Overlay state
  const [activeSheet, setActiveSheet] = useState<"date" | "guests" | "filters" | null>(null);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [tourAttractions, setTourAttractions] = useState<TourAttraction[]>([]);
  const [isTourAttractionsLoading, setIsTourAttractionsLoading] = useState(false);
  const [tourAttractionsError, setTourAttractionsError] = useState(false);
  const [imageErrorIds, setImageErrorIds] = useState<Set<string>>(new Set());
  const [searchMessage, setSearchMessage] = useState("");
  const [locationMocked, setLocationMocked] = useState(false);
  const [showSyncAlert, setShowSyncAlert] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const tourRequestControllerRef = useRef<AbortController | null>(null);

  const recentSearches = ["정선 민둥산", "고성 아야진 댕수욕장", "두루누비"];

  useEffect(() => {
    const controller = new AbortController();

    const loadSigungu = async () => {
      try {
        const response = await fetch("/api/sigungu", { signal: controller.signal });
        if (!response.ok) throw new Error("시군구 목록을 불러오지 못했습니다.");

        const data = (await response.json()) as SigunguResponse;
        if (!controller.signal.aborted) {
          setSigunguRows(Array.isArray(data.rows) ? data.rows : []);
        }
      } catch {
        if (!controller.signal.aborted) setSigunguLoadFailed(true);
      } finally {
        if (!controller.signal.aborted) setIsSigunguLoading(false);
      }
    };

    loadSigungu();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    return () => tourRequestControllerRef.current?.abort();
  }, []);

  // 1. Live Sync on Mount: Read from Profile Settings and pre-fill search filters!
  useEffect(() => {
    let synced = false;
    if (accessibilityDefaults.petFriendly) {
      setFilterPetFriendly(true);
      setPets(1);
      synced = true;
    }
    if (accessibilityDefaults.wheelchair) {
      setFilterWheelchair(true);
      synced = true;
    }
    if (accessibilityDefaults.stroller) {
      setFilterStroller(true);
      setChildren(1);
      synced = true;
    }
    if (accessibilityDefaults.senior) {
      setFilterSenior(true);
      synced = true;
    }
    if (accessibilityDefaults.parking) {
      setFilterParking(true);
      synced = true;
    }

    if (synced) {
      setShowSyncAlert(true);
      setTimeout(() => setShowSyncAlert(false), 4500);
    }

    // Execute initial search on mount with the defaults
    handleSearchExecution();
  }, [accessibilityDefaults]);

  // Execute search whenever toggling congestion or filters directly
  useEffect(() => {
    if (!selectedSigungu) handleSearchExecution();
  }, [avoidCongestion, filterPetFriendly, filterPetConditions, filterWheelchair, filterStroller, filterParking, filterSenior]);

  const handleLocationDetection = () => {
    resetTourAttractionResults();
    setLocationMocked(true);
    setSelectedSigungu(null);
    setSearchQuery("삼척시 근덕면 (내 주변)");
    setShowSuggestions(false);
  };

  const getWeatherMessage = () => {
    const q = searchQuery.toLowerCase();
    if (q.includes("고성") || q.includes("능파대") || q.includes("아야진")) {
      return {
        text: "고성군 기상 정보: 맑음 (24°C) | 초미세먼지 좋음(8㎍/㎡). 해안 보행로와 댕수욕장 산책에 완벽한 무장애 기후 조건입니다. ☀️",
        status: "success"
      };
    }
    if (q.includes("정선") || q.includes("소금강") || q.includes("민둥산")) {
      return {
        text: "정선군 기상 정보: 구름 조금 (22°C) | 초미세먼지 보통(18㎍/㎡). 고원지대의 시원한 바람이 불어 야외 숲길 걷기에 알맞습니다. 🌲",
        status: "info"
      };
    }
    if (q.includes("태백") || q.includes("바람의 언덕") || q.includes("자작나무")) {
      return {
        text: "태백시 대기주의보 연동: 미세먼지 나쁨(45㎍/㎡) 예상 | 기온 23°C. 가급적 마스크를 착용하시거나, 실내 코스 우선 방문을 추천합니다. 😷",
        status: "warning"
      };
    }
    if (q.includes("삼척") || q.includes("초곡") || q.includes("촛대바위")) {
      return {
        text: "삼척시 기상 정보: 흐리고 한때 약한 소나기 (21°C) | 미세먼지 좋음. 초곡용굴 촛대바위길 등 해상 데크는 보행이 원활하나 바닥 미끄럼에 유의하세요. ☔",
        status: "info"
      };
    }
    if (q.includes("강릉") || q.includes("안목") || q.includes("경포")) {
      return {
        text: "강릉시 실시간 과밀 경보: 주말 해안가 불쾌지수 높음 예상 (28°C) | 주차 정체 극심. 차량 흐름 제어를 위해 고성/삼척 등 인근 대안 노선을 제안합니다. 🚗",
        status: "danger"
      };
    }
    return {
      text: "강원도 소멸위기 4개 시군(정선·태백·삼척·고성) 실시간 기상 데이터 및 보행 약자 보호 인프라 가동 중 📡",
      status: "info"
    };
  };

  const weatherInfo = getWeatherMessage();

  const applyPreset = (preset: "pet" | "wheelchair" | "stroller" | "forest") => {
    if (preset === "pet") {
      setPets(1);
      setFilterPetFriendly(true);
      setFilterPetConditions("any");
    } else if (preset === "wheelchair") {
      setFilterWheelchair(true);
    } else if (preset === "stroller") {
      setFilterStroller(true);
      setChildren(1);
    } else if (preset === "forest") {
      setSearchQuery("정선");
      setFilterSenior(true);
      setFilterParking(true);
    }
    setSearchTriggered(true);
  };

  const resetTourAttractionResults = () => {
    tourRequestControllerRef.current?.abort();
    setTourAttractions([]);
    setIsTourAttractionsLoading(false);
    setTourAttractionsError(false);
  };

  const handleSearchExecution = async () => {
    setSearchTriggered(true);
    setTourAttractionsError(false);
    setImageErrorIds(new Set());

    if (!selectedSigungu) {
      tourRequestControllerRef.current?.abort();
      setTourAttractions([]);
      setIsTourAttractionsLoading(false);
      setSearchMessage("목적지 추천 목록에서 시군구를 먼저 선택한 뒤 검색해 주세요.");
      return;
    }

    tourRequestControllerRef.current?.abort();
    const controller = new AbortController();
    tourRequestControllerRef.current = controller;
    setIsTourAttractionsLoading(true);

    try {
      const params = new URLSearchParams({
        ldong_regn_cd: selectedSigungu.ldong_regn_cd,
        ldong_signgu_cd: selectedSigungu.ldong_signgu_cd
      });
      const response = await fetch(`/api/tour-attractions?${params.toString()}`, { signal: controller.signal });
      if (!response.ok) throw new Error("관광지 목록을 불러오지 못했습니다.");

      const data = (await response.json()) as TourAttractionsResponse;
      if (!controller.signal.aborted) {
        const rows = Array.isArray(data.rows) ? data.rows : [];
        setTourAttractions(rows);
        setSearchMessage(`${selectedSigungu.signgu_name} 관광지 ${rows.length}곳을 찾았습니다.`);
      }
    } catch {
      if (!controller.signal.aborted) {
        setTourAttractions([]);
        setTourAttractionsError(true);
        setSearchMessage("관광지 목록을 불러오지 못했습니다. 잠시 후 다시 검색해 주세요.");
      }
    } finally {
      if (!controller.signal.aborted) setIsTourAttractionsLoading(false);
    }
  };

  const handleClearSearch = () => {
    resetTourAttractionResults();
    setSearchQuery("");
    setSelectedSigungu(null);
    setSearchTriggered(false);
    setLocationMocked(false);
    setAdults(2);
    setChildren(0);
    setPets(0);
    setFilterPetFriendly(false);
    setFilterWheelchair(false);
    setFilterStroller(false);
    setFilterParking(false);
    setFilterSenior(false);
  };

  const handleDateClick = (dateStr: string) => {
    if (!isPeriod) {
      setSelectedStartDate(dateStr);
      setSelectedEndDate(dateStr);
    } else {
      if (selectedStartDate && selectedEndDate && selectedStartDate !== selectedEndDate) {
        setSelectedStartDate(dateStr);
        setSelectedEndDate("");
      } else if (selectedStartDate && !selectedEndDate) {
        if (dateStr >= selectedStartDate) {
          setSelectedEndDate(dateStr);
        } else {
          setSelectedStartDate(dateStr);
        }
      } else {
        setSelectedStartDate(dateStr);
      }
    }
  };

  return (
    <>
    <div className="space-y-6 animate-fadeIn pb-12">

      {/* 1. Sync Alert Banner */}
      <AnimatePresence>
        {showSyncAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-3 bg-bento-green text-white text-xs font-bold rounded-lg flex items-center justify-between shadow-md"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-white shrink-0" />
              <span>MY 설정의 보행 약자 기본값이 검색 조건에 안전하게 로드되었습니다!</span>
            </div>
            <button onClick={() => setShowSyncAlert(false)} className="text-white/60 hover:text-white font-mono shrink-0 font-bold px-2">X</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Headline */}
      <div className="text-center md:text-left">
        <span className="text-xs font-semibold text-bento-green block mb-1">
          맞춤형 혼잡 회피 여정 검색
        </span>
        <h2 className="text-2xl font-display font-black text-bento-dark tracking-tight leading-none mb-1.5 flex items-center gap-2">
          <span>한산 여정 조건별 탐색</span>
          <span className="w-8 h-8 rounded-full bg-bento-green/10 flex items-center justify-center">
            <Search size={18} className="text-bento-green" />
          </span>
        </h2>
        <p className="text-bento-dark/60 text-xs leading-relaxed max-w-2xl">
          나이, 보행 약자 동반, 반려견 크기까지. 원하는 필터를 켜면 실시간 붐빔 예측 데이터를 매칭해
          인기 밀집지 대신 가장 쾌적하게 힐링할 수 있는 강원의 골목 안심 코스를 그려냅니다.
        </p>
      </div>

      {/* 3. Weather Broadcast Banner */}
      {!selectedSigungu && <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 duration-base ease-out-soft ${weatherInfo.status === "warning"
          ? "bg-amber-50 border-amber-200 text-amber-800"
          : weatherInfo.status === "danger"
            ? "bg-red-50 border-red-200 text-red-800"
            : weatherInfo.status === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-white border-border-default text-bento-dark/80"
        }`}>
        <div className="mt-0.5 shrink-0">
          {weatherInfo.status === "warning" ? <AlertTriangle size={15} className="text-amber-600" /> :
            weatherInfo.status === "danger" ? <Flame size={15} className="text-red-600" /> :
              weatherInfo.status === "success" ? <Check size={15} className="text-emerald-600" /> :
                <Info size={15} className="text-bento-green" />}
        </div>
        <div>
          <span className="font-bold block mb-0.5">실시간 날씨 & 미세먼지 환경 보정</span>
          <p className="leading-relaxed text-[11px]">{weatherInfo.text}</p>
        </div>
      </div>}

      {/* ==================== SEARCH CONTAINER ==================== */}
      <div className="bg-white rounded-xl border border-border-default p-5 shadow-md relative z-30">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">

          {/* Query Block */}
          <div className="col-span-1 md:col-span-5 relative">
            <label className="block text-[11px] font-semibold text-bento-dark/50 mb-1 pl-1">목적지</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-bento-dark/30" size={16} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="정선, 고성, 삼척... 어디로 가시나요?"
                value={searchQuery}
                onChange={(e) => {
                  resetTourAttractionResults();
                  setSelectedSigungu(null);
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-11 pr-12 py-3 bg-bento-bg/50 border border-border-default rounded-md text-xs font-medium text-bento-dark focus:outline-none focus:border-bento-green focus:bg-white focus:shadow-sm transition-all duration-base ease-out-soft"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    resetTourAttractionResults();
                    setSelectedSigungu(null);
                    setSearchQuery("");
                  }}
                  className="absolute right-12 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-bento-bg hover:bg-bento-dark/5 flex items-center justify-center text-bento-dark/40 hover:text-bento-dark cursor-pointer transition-colors duration-fast"
                >
                  <X size={11} />
                </button>
              )}
              <button
                type="button"
                onClick={handleLocationDetection}
                title="내 주변 한산스팟 찾기"
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all duration-fast cursor-pointer ${locationMocked ? "bg-bento-green text-white" : "bg-bento-bg text-bento-green hover:bg-bento-green/10"
                  }`}
              >
                <Navigation size={12} />
              </button>
            </div>

            {/* Suggestions drop container */}
            <AnimatePresence>
              {showSuggestions && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border border-border-default shadow-lg z-50 p-4 max-h-[300px] overflow-y-auto"
                  >
                    <div className="mb-3">
                      <h4 className="text-[10px] font-bold text-bento-dark/50 mb-2">최근 검색</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {recentSearches.map((term, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              resetTourAttractionResults();
                              setSelectedSigungu(null);
                              setSearchQuery(term);
                              setShowSuggestions(false);
                            }}
                            className="px-2.5 py-1.5 bg-bento-bg hover:bg-bento-green/10 text-[11px] text-bento-dark/80 rounded-full transition-colors cursor-pointer"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold text-bento-dark/50 mb-2">시군구 선택</h4>
                      <div className="space-y-1">
                        {isSigunguLoading && (
                          <p className="px-3 py-2 text-[11px] text-bento-dark/40">지역 목록을 불러오는 중입니다.</p>
                        )}
                        {!isSigunguLoading && sigunguLoadFailed && (
                          <p className="px-3 py-2 text-[11px] text-bento-dark/40">지역 목록을 잠시 불러오지 못했습니다.</p>
                        )}
                        {!isSigunguLoading && !sigunguLoadFailed && sigunguRows.map((sigungu) => (
                          <button
                            key={`${sigungu.ldong_regn_cd}-${sigungu.ldong_signgu_cd}`}
                            aria-pressed={selectedSigungu?.ldong_regn_cd === sigungu.ldong_regn_cd && selectedSigungu.ldong_signgu_cd === sigungu.ldong_signgu_cd}
                            onClick={() => {
                              resetTourAttractionResults();
                              setSelectedSigungu(sigungu);
                              setSearchQuery(sigungu.signgu_name);
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-bento-bg rounded-md flex items-center justify-between text-xs text-bento-dark transition-colors duration-fast cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <MapPin size={10} className="text-bento-green" />
                              <span className="font-bold">{sigungu.signgu_name}</span>
                            </div>
                            <span className="text-[8px] font-bold text-bento-green bg-bento-green/15 px-1.5 py-0.5 rounded-full">
                              시군구
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Date Selector */}
          <div className="col-span-1 md:col-span-3">
            <label className="block text-[11px] font-semibold text-bento-dark/50 mb-1 pl-1">일정</label>
            <button
              onClick={() => {
                setActiveDateSelector(true);
                setActiveSheet("date");
              }}
              className="w-full px-4 py-3 bg-bento-bg/50 hover:bg-bento-bg border border-border-default rounded-md text-xs font-medium text-bento-dark flex items-center justify-between cursor-pointer transition-colors duration-base"
            >
              <div className="flex items-center gap-2 text-left min-w-0">
                <Calendar size={14} className="text-bento-green shrink-0" />
                <span className="truncate font-medium">
                  {selectedStartDate ? `${selectedStartDate.slice(5)}` : "날짜 선택"}
                  {selectedEndDate && selectedEndDate !== selectedStartDate ? ` ~ ${selectedEndDate.slice(5)}` : ""}
                </span>
              </div>
              <ChevronDown size={12} className="text-bento-dark/30 shrink-0" />
            </button>
          </div>

          {/* Guest Selector */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-[11px] font-semibold text-bento-dark/50 mb-1 pl-1">동반 인원</label>
            <button
              onClick={() => {
                setActiveGuestSelector(true);
                setActiveSheet("guests");
              }}
              className="w-full px-4 py-3 bg-bento-bg/50 hover:bg-bento-bg border border-border-default rounded-md text-xs font-medium text-bento-dark flex items-center justify-between cursor-pointer transition-colors duration-base"
            >
              <div className="flex items-center gap-2 text-left min-w-0">
                <Users size={14} className="text-bento-green shrink-0" />
                <span className="truncate font-medium">
                  성인 {adults}
                  {children > 0 ? `, 아동 ${children}` : ""}
                  {pets > 0 ? <><PawPrint size={11} className="inline text-orange-500" /> {pets}</> : ""}
                </span>
              </div>
              <ChevronDown size={12} className="text-bento-dark/30 shrink-0" />
            </button>
          </div>

          {/* Accessibility Filter */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-[11px] font-semibold text-bento-dark/50 mb-1 pl-1">보행 필터</label>
            <button
              onClick={() => {
                setActiveFilterSheet(true);
                setActiveSheet("filters");
              }}
              className={`w-full px-4 py-3 border rounded-md text-xs font-medium flex items-center justify-between cursor-pointer transition-colors duration-base ${filterWheelchair || filterStroller || filterPetFriendly || filterSenior || filterParking
                  ? "bg-bento-green/15 border-bento-green text-bento-green"
                  : "bg-bento-bg/50 hover:bg-bento-bg border-border-default text-bento-dark"
                }`}
            >
              <div className="flex items-center gap-2 text-left min-w-0">
                <SlidersHorizontal size={14} className="shrink-0" />
                <span className="truncate">
                  {filterWheelchair || filterStroller || filterPetFriendly || filterSenior || filterParking
                    ? "필터 가동 중"
                    : "세부 필터"}
                </span>
              </div>
              <ChevronDown size={12} className="shrink-0 text-bento-dark/30" />
            </button>
          </div>

        </div>

        {/* Filters Quick Line & Switch */}
        <div className="mt-4 pt-4 border-t border-border-subtle flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold text-bento-dark/50 mr-1">
              빠른 필터:
            </span>
            <button
              onClick={() => applyPreset("pet")}
              className="px-3 py-1.5 bg-bento-bg hover:bg-bento-green/10 border border-border-subtle hover:border-bento-green/30 rounded-md text-[11px] font-medium text-bento-dark/80 flex items-center gap-1.5 transition-all duration-base cursor-pointer"
            >
              <PawPrint size={12} className="text-orange-500" />
              <span>반려견</span>
            </button>
            <button
              onClick={() => applyPreset("wheelchair")}
              className="px-3 py-1.5 bg-bento-bg hover:bg-bento-green/10 border border-border-subtle hover:border-bento-green/30 rounded-md text-[11px] font-medium text-bento-dark/80 flex items-center gap-1.5 transition-all duration-base cursor-pointer"
            >
              <Accessibility size={12} className="text-bento-green" />
              <span>휠체어 데크</span>
            </button>
            <button
              onClick={() => applyPreset("stroller")}
              className="px-3 py-1.5 bg-bento-bg hover:bg-bento-green/10 border border-border-subtle hover:border-bento-green/30 rounded-md text-[11px] font-medium text-bento-dark/80 flex items-center gap-1.5 transition-all duration-base cursor-pointer"
            >
              <Baby size={12} className="text-amber-500" />
              <span>유모차 통행</span>
            </button>
          </div>

          {/* Smart Avoidance Switch */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-semibold text-bento-dark block leading-none mb-0.5">
                과밀 관광지 자동 우회
              </span>
              <span className="text-[10px] text-bento-dark/50 block leading-none">
                인기 과밀지를 후순위 조정하고 한산지 코스를 선매칭합니다.
              </span>
            </div>
            <button
              onClick={() => setAvoidCongestion(!avoidCongestion)}
              className={`w-10 h-5.5 rounded-full transition-all duration-base ease-in-out-soft relative cursor-pointer ${avoidCongestion ? "bg-bento-green" : "bg-bento-stone"
                }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-[3px] transition-all duration-base ease-in-out-soft ${avoidCongestion ? "left-[22px]" : "left-1"
                }`} />
            </button>
          </div>
        </div>

        {/* Submit CTA */}
        <div className="mt-5">
          <button
            onClick={handleSearchExecution}
            className="w-full py-3.5 bg-bento-green hover:bg-bento-green/90 active:scale-[0.98] text-white font-display font-bold text-sm rounded-lg shadow-md transition-all duration-base ease-out-soft flex items-center justify-center gap-2 cursor-pointer"
          >
            <Search size={16} />
            <span>한산한 보행 안심지 조건 탐색</span>
          </button>
        </div>

      </div>

      {/* ==================== SEARCH RESULTS INTERACTIVE AREA ==================== */}
      <AnimatePresence>
        {searchTriggered && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="space-y-4"
          >
            {/* Results Title Alert Badge */}
            <div className="p-3 bg-bento-olive/15 border border-bento-green/10 rounded-lg flex items-center justify-between text-xs font-medium text-bento-dark shadow-sm">
              <span className="flex items-center gap-2">
                <Leaf size={14} className="text-bento-green" />
                <span>{searchMessage}</span>
              </span>
              <button
                onClick={handleClearSearch}
                className="text-[10px] font-medium text-red-700 bg-red-100 hover:bg-red-200 px-2.5 py-1 rounded-sm cursor-pointer transition-colors duration-fast"
              >
                검색 초기화
              </button>
            </div>

            {/* Results Grid - responsive 3 columns on tablet/desktop */}
            {isTourAttractionsLoading ? (
              <div className="text-center py-12 bg-white rounded-lg border border-border-default shadow-sm max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 rounded-full bg-bento-bg flex items-center justify-center mx-auto">
                  <Search size={24} className="text-bento-green animate-pulse" />
                </div>
                <h4 className="font-display font-bold text-bento-dark text-sm">관광지를 불러오는 중입니다</h4>
                <p className="text-xs text-bento-dark/50 px-6 leading-relaxed">선택한 시군구의 관광지 정보를 확인하고 있어요.</p>
              </div>
            ) : tourAttractions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {tourAttractions.map((attraction) => {
                  const attractionId = String(attraction.content_id);
                  const image = attraction.firstimage || attraction.firstimage2;
                  const categoryCodes = [attraction.lcls_systm1, attraction.lcls_systm2, attraction.lcls_systm3].filter(Boolean);
                  const address = [attraction.addr1, attraction.addr2].filter(Boolean).join(" ");
                  const amenities = [
                    attraction.parking && { label: "주차", value: attraction.parking, icon: <Car size={10} className="text-bento-green" /> },
                    attraction.chkbabycarriage && { label: "유모차", value: attraction.chkbabycarriage, icon: <Baby size={10} className="text-amber-500" /> },
                    attraction.chkpet && { label: "반려동물", value: attraction.chkpet, icon: <PawPrint size={10} className="text-orange-500" /> }
                  ].filter(Boolean) as { label: string; value: string; icon: React.ReactNode }[];

                  return (
                    <motion.div
                      key={attractionId}
                      whileHover={{
                        y: -4,
                        boxShadow: "0 4px 6px -1px color-mix(in srgb, #1A2F23 6%, transparent)"
                      }}
                      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="bg-white rounded-lg border border-border-default overflow-hidden flex flex-col justify-between"
                    >
                      <div className="relative h-44">
                        {image && !imageErrorIds.has(attractionId) ? (
                          <img
                            src={image}
                            alt={attraction.title}
                            referrerPolicy="no-referrer"
                            onError={() => setImageErrorIds((ids) => new Set(ids).add(attractionId))}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-bento-bg flex items-center justify-center text-xs text-bento-dark/40">이미지 없음</div>
                        )}
                        {image && !imageErrorIds.has(attractionId) && <div className="absolute inset-0 bg-gradient-to-t from-bento-dark/70 via-transparent to-transparent" />}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleLike(attractionId);
                          }}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center hover:bg-white text-bento-dark/80 transition-colors cursor-pointer"
                        >
                          <Heart size={14} className={likedDestinations.includes(attractionId) ? "fill-red-500 text-red-500" : "text-bento-dark/40"} />
                        </button>

                        <div className={`absolute bottom-3 left-3 right-3 ${image && !imageErrorIds.has(attractionId) ? "text-white" : "text-bento-dark"}`}>
                          {categoryCodes.length > 0 && (
                            <span className="text-[9px] font-semibold text-bento-olive/90 block truncate">
                              {categoryCodes.join(" · ")}
                            </span>
                          )}
                          <h4 className="font-display font-black text-sm tracking-tight leading-none mt-1">
                            {attraction.title}
                          </h4>
                        </div>
                      </div>

                      <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                        <p className="text-[11px] text-bento-dark/60 leading-relaxed line-clamp-2">
                          {address || "주소 정보 없음"}
                        </p>

                        {amenities.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[9px] font-semibold text-bento-dark/50 block">제공 정보</span>
                            <div className="flex flex-wrap gap-1">
                              {amenities.map((amenity) => (
                                <span key={amenity.label} className="bg-bento-bg text-bento-dark/80 text-[9px] font-medium px-2 py-0.5 rounded-sm flex items-center gap-1 border border-border-subtle">
                                  {amenity.icon}
                                  <span>{amenity.label}: {amenity.value}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* No Results state */
              <div className="text-center py-12 bg-white rounded-lg border border-border-default shadow-sm max-w-md mx-auto space-y-3 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-bento-bg flex items-center justify-center">
                  <Search size={24} className="text-bento-dark/30" />
                </div>
                <h4 className="font-display font-bold text-bento-dark text-sm mt-2">
                  {tourAttractionsError ? "관광지 정보를 불러오지 못했어요" : selectedSigungu ? "등록된 관광지가 없어요" : "목적지를 먼저 선택해 주세요"}
                </h4>
                <p className="text-xs text-bento-dark/50 px-6 leading-relaxed">
                  {tourAttractionsError
                    ? "네트워크 상태를 확인한 뒤 검색 버튼을 다시 눌러주세요."
                    : selectedSigungu
                      ? "선택한 시군구에 등록된 관광지 정보가 아직 없습니다."
                      : "목적지 입력창에서 시군구를 선택하면 해당 지역의 관광지를 확인할 수 있습니다."}
                </p>
                <button
                  onClick={selectedSigungu ? handleSearchExecution : () => searchInputRef.current?.focus()}
                  className="px-4 py-2 bg-bento-green hover:bg-bento-green/90 text-white text-xs font-medium rounded-sm transition-colors duration-base cursor-pointer"
                >
                  {selectedSigungu ? "다시 검색" : "목적지 선택하기"}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Guidance before any search query executed */}
      {!searchTriggered && (
        <div className="space-y-4 pt-4 border-t border-border-subtle">
          <h3 className="text-xs font-semibold text-bento-dark/50 pl-1 flex items-center gap-1.5">
            <span>관광지 검색 안내</span>
          </h3>
          <div className="bg-white rounded-xl border border-border-subtle p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-bento-bg flex items-center justify-center shrink-0">
                <MapPin size={17} className="text-bento-green" />
              </div>
              <p className="text-xs text-bento-dark/60 leading-relaxed">
                목적지 입력창에서 시군구를 선택하면 해당 지역의 관광지를 확인할 수 있습니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => searchInputRef.current?.focus()}
              className="shrink-0 px-3 py-2 bg-bento-green/10 hover:bg-bento-green/15 text-bento-green text-[11px] font-semibold rounded-md transition-colors cursor-pointer"
            >
              시군구 선택
            </button>
          </div>
        </div>
      )}

    </div>

    {/* ==================== BOTTOM SHEETS (DATE/GUESTS/FILTERS OVERLAYS) ==================== */}
    <AnimatePresence>
      {activeSheet !== null && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setActiveSheet(null);
              setActiveDateSelector(false);
              setActiveGuestSelector(false);
              setActiveFilterSheet(false);
            }}
            className="fixed inset-0 bg-bento-dark z-[100]"
            style={{ marginBottom: 0 }}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 260 }}
            className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white rounded-t-2xl border-t border-border-default shadow-lg z-[101] overflow-hidden max-h-[80vh] flex flex-col"
            style={{ marginBottom: 0 }}
          >
            <div className="px-5 py-3.5 border-b border-border-subtle flex items-center justify-between shrink-0">
              <h3 className="text-xs font-display font-bold text-bento-dark">
                {activeSheet === "date" ? "일자별 혼잡 예측 캘린더" :
                  activeSheet === "guests" ? "동반 인원 설정" :
                    "배리어프리 보행 조건"}
              </h3>
              <button
                onClick={() => {
                  setActiveSheet(null);
                  setActiveDateSelector(false);
                  setActiveGuestSelector(false);
                  setActiveFilterSheet(false);
                }}
                className="w-7 h-7 rounded-full bg-bento-bg hover:bg-bento-dark/5 flex items-center justify-center text-bento-dark/60 hover:text-bento-dark cursor-pointer transition-colors duration-fast"
              >
                <X size={12} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {/* 1. Date Calendar */}
              {activeSheet === "date" && (
                <div className="space-y-4">
                  <div className="flex bg-bento-bg rounded-md p-0.5">
                    <button
                      onClick={() => {
                        setIsPeriod(false);
                        setSelectedEndDate(selectedStartDate);
                      }}
                      className={`flex-1 py-1.5 text-[11px] font-medium rounded-sm transition-all duration-fast cursor-pointer ${!isPeriod ? "bg-white text-bento-green shadow-sm" : "text-bento-dark/60 hover:text-bento-dark"
                        }`}
                    >
                      당일치기
                    </button>
                    <button
                      onClick={() => setIsPeriod(true)}
                      className={`flex-1 py-1.5 text-[11px] font-medium rounded-sm transition-all duration-fast cursor-pointer ${isPeriod ? "bg-white text-bento-green shadow-sm" : "text-bento-dark/60 hover:text-bento-dark"
                        }`}
                    >
                      숙박/기간
                    </button>
                  </div>

                  <div className="bg-bento-bg/50 p-2.5 rounded-md border border-border-subtle flex items-center justify-center gap-3 text-[10px] font-medium">
                    <span className="text-bento-dark/50">혼잡도:</span>
                    <span className="flex items-center gap-1 text-emerald-700"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 한산</span>
                    <span className="flex items-center gap-1 text-amber-700"><span className="w-2 h-2 rounded-full bg-amber-400" /> 보통</span>
                    <span className="flex items-center gap-1 text-red-700"><span className="w-2 h-2 rounded-full bg-red-500" /> 혼잡</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-bento-dark/50 mb-1">
                    <span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {/* Blank days spacing */}
                    <div className="aspect-square" />
                    <div className="aspect-square" />
                    <div className="aspect-square" />
                    <div className="aspect-square" />
                    <div className="aspect-square" />

                    {next30Days.map((d, index) => {
                      const isSelected = selectedStartDate === d.dateStr || selectedEndDate === d.dateStr;
                      const inRange = selectedStartDate && selectedEndDate && d.dateStr > selectedStartDate && d.dateStr < selectedEndDate;

                      return (
                        <button
                          key={index}
                          onClick={() => handleDateClick(d.dateStr)}
                          className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all text-xs font-bold cursor-pointer ${isSelected
                              ? "bg-bento-green text-white"
                              : inRange
                                ? "bg-bento-green/15 text-bento-green"
                                : "bg-bento-bg hover:bg-bento-dark/5 text-bento-dark"
                            }`}
                        >
                          <span>{d.day}</span>
                          <div className={`w-1.25 h-1.25 rounded-full absolute bottom-1 ${d.level === "high" ? "bg-red-500" : d.level === "medium" ? "bg-amber-400" : "bg-emerald-400"
                            }`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Guest Controls */}
              {activeSheet === "guests" && (
                <div className="space-y-4">
                  {/* Adults */}
                  <div className="flex items-center justify-between p-2.5 bg-bento-bg rounded-xl">
                    <div>
                      <span className="text-xs font-bold block text-bento-dark">성인 (만 19세 이상)</span>
                      <span className="text-[10px] text-bento-dark/50 block">보행 약자 및 안내 포함</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setAdults(Math.max(1, adults - 1))} className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-border-default font-bold text-sm cursor-pointer shadow-sm">-</button>
                      <span className="text-xs font-bold w-4 text-center">{adults}</span>
                      <button onClick={() => setAdults(adults + 1)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-border-default font-bold text-sm cursor-pointer shadow-sm">+</button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between p-2.5 bg-bento-bg rounded-xl">
                    <div>
                      <span className="text-xs font-bold block text-bento-dark">아동 및 영유아</span>
                      <span className="text-[10px] text-bento-dark/50 block">휠체어, 유모차 보호자 필요 가능</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setChildren(Math.max(0, children - 1))} className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-border-default font-bold text-sm cursor-pointer shadow-sm">-</button>
                      <span className="text-xs font-bold w-4 text-center">{children}</span>
                      <button onClick={() => setChildren(children + 1)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-border-default font-bold text-sm cursor-pointer shadow-sm">+</button>
                    </div>
                  </div>

                  {/* Pets */}
                  <div className="flex items-center justify-between p-2.5 bg-bento-bg rounded-xl">
                    <div>
                      <span className="text-xs font-bold block text-bento-dark">반려견 동반</span>
                      <span className="text-[10px] text-bento-dark/50 block">대형견/소형견 야외 구역 매칭 지원</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setPets(Math.max(0, pets - 1))} className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-border-default font-bold text-sm cursor-pointer shadow-sm">-</button>
                      <span className="text-xs font-bold w-4 text-center">{pets}</span>
                      <button onClick={() => setPets(pets + 1)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-border-default font-bold text-sm cursor-pointer shadow-sm">+</button>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Filters Sheet */}
              {activeSheet === "filters" && (
                <div className="space-y-4">

                  {/* Wheelchair */}
                  <div className="flex items-center justify-between p-2.5 bg-bento-bg rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-bento-green/10 text-bento-green flex items-center justify-center font-bold">
                        <Accessibility size={14} />
                      </div>
                      <div>
                        <span className="text-xs font-bold block text-bento-dark">휠체어 안심 보행길 전용</span>
                        <span className="text-[10px] text-bento-dark/50 block">경사도 5% 미만, 턱 없는 완벽 나무데크길</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setFilterWheelchair(!filterWheelchair)}
                      className={`w-10 h-5.5 rounded-full transition-all relative cursor-pointer ${filterWheelchair ? "bg-bento-green" : "bg-bento-dark/20"
                        }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-0.75 transition-all ${filterWheelchair ? "left-5.25" : "left-0.75"
                        }`} />
                    </button>
                  </div>

                  {/* Stroller */}
                  <div className="flex items-center justify-between p-2.5 bg-bento-bg rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-bento-green/10 text-bento-green flex items-center justify-center font-bold">
                        <Baby size={14} />
                      </div>
                      <div>
                        <span className="text-xs font-bold block text-bento-dark">유모차 통행 가능</span>
                        <span className="text-[10px] text-bento-dark/50 block">비포장 비탈길 제외, 수변/공원 데크길 위주</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setFilterStroller(!filterStroller)}
                      className={`w-10 h-5.5 rounded-full transition-all relative cursor-pointer ${filterStroller ? "bg-bento-green" : "bg-bento-green" // keep synced or toggle
                        }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-0.75 transition-all ${filterStroller ? "left-5.25" : "left-0.75"
                        }`} />
                    </button>
                  </div>

                  {/* Pet friendly */}
                  <div className="flex items-center justify-between p-2.5 bg-bento-bg rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-bento-green/10 text-bento-green flex items-center justify-center font-bold">
                        <PawPrint size={14} />
                      </div>
                      <div>
                        <span className="text-xs font-bold block text-bento-dark">반려동물 출입 공식 허용</span>
                        <span className="text-[10px] text-bento-dark/50 block">목줄 통행 가능 코스 및 전용 해변(댕수욕장)</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setFilterPetFriendly(!filterPetFriendly)}
                      className={`w-10 h-5.5 rounded-full transition-all relative cursor-pointer ${filterPetFriendly ? "bg-bento-green" : "bg-bento-dark/20"
                        }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-0.75 transition-all ${filterPetFriendly ? "left-5.25" : "left-0.75"
                        }`} />
                    </button>
                  </div>

                  {/* Large dog / Indoor option (conditional) */}
                  {filterPetFriendly && (
                    <div className="p-3 border border-dashed border-border-default rounded-xl bg-bento-bg/30 space-y-2">
                      <span className="text-[9px] font-bold text-bento-dark/40 uppercase block">반려견 크기 및 실내 조건:</span>
                      <div className="flex gap-2">
                        {(["any", "indoor", "large"] as const).map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setFilterPetConditions(opt)}
                            className={`flex-1 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${filterPetConditions === opt
                                ? "bg-bento-green border-bento-green text-white"
                                : "bg-white border-border-default text-bento-dark/60"
                              }`}
                          >
                            {opt === "any" ? "상관없음" : opt === "indoor" ? "실내 허용 우선" : "대형견 안심"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Senior */}
                  <div className="flex items-center justify-between p-2.5 bg-bento-bg rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-bento-green/10 text-bento-green flex items-center justify-center font-bold">
                        <Users size={14} />
                      </div>
                      <div>
                        <span className="text-xs font-bold block text-bento-dark">실버 케어 스마트 쉼터 인접</span>
                        <span className="text-[10px] text-bento-dark/50 block">중간중간 벤치 및 지붕 대기 쉘터가 구비된 완만지</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setFilterSenior(!filterSenior)}
                      className={`w-10 h-5.5 rounded-full transition-all relative cursor-pointer ${filterSenior ? "bg-bento-green" : "bg-bento-dark/20"
                        }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-0.75 transition-all ${filterSenior ? "left-5.25" : "left-0.75"
                        }`} />
                    </button>
                  </div>

                  {/* Parking */}
                  <div className="flex items-center justify-between p-2.5 bg-bento-bg rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-bento-green/10 text-bento-green flex items-center justify-center font-bold">
                        <Car size={14} />
                      </div>
                      <div>
                        <span className="text-xs font-bold block text-bento-dark">교통 약자 주차 주말 원활</span>
                        <span className="text-[10px] text-bento-dark/50 block">휠체어 이동 여유 폭이 있는 넓은 무료 공영주차장</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setFilterParking(!filterParking)}
                      className={`w-10 h-5.5 rounded-full transition-all relative cursor-pointer ${filterParking ? "bg-bento-green" : "bg-bento-dark/20"
                        }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-0.75 transition-all ${filterParking ? "left-5.25" : "left-0.75"
                        }`} />
                    </button>
                  </div>

                </div>
              )}
            </div>

            {/* Sheet Save action */}
            <div className="p-4 bg-bento-bg border-t border-border-subtle shrink-0">
              <button
                onClick={() => {
                  setActiveSheet(null);
                  setActiveDateSelector(false);
                  setActiveGuestSelector(false);
                  setActiveFilterSheet(false);
                  handleSearchExecution();
                }}
                className="w-full py-3 bg-bento-green hover:bg-bento-green/90 text-white font-display font-bold text-xs rounded-sm shadow-sm transition-all duration-base cursor-pointer"
              >
                조건 변경 완료
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}
