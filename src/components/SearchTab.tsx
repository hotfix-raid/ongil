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
import { MockDestination, mockDestinations, generate30DaysCongestion } from "../data/destinations";

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

const next30Days = generate30DaysCongestion();

export default function SearchTab({
  onSelectDestination,
  likedDestinations,
  onToggleLike,
  accessibilityDefaults
}: SearchTabProps) {
  // Main Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  
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
  const [filteredResults, setFilteredResults] = useState<MockDestination[]>([]);
  const [searchMessage, setSearchMessage] = useState("");
  const [locationMocked, setLocationMocked] = useState(false);
  const [showSyncAlert, setShowSyncAlert] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Suggested keywords
  const popularKeywords = [
    { text: "고성 능파대", badge: "인구감소 한산지" },
    { text: "태백 바람의 언덕", badge: "미세먼지 안심" },
    { text: "정선 동강 소금강길", badge: "무장애 안심길" },
    { text: "삼척 초곡용굴", badge: "열린관광 데크" },
    { text: "해파랑길 46코스", badge: "두루누비 평지" },
    { text: "강릉 안목 커피거리", badge: "인파 과밀지" }
  ];

  const recentSearches = ["정선 민둥산", "고성 아야진 댕수욕장", "두루누비"];

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
    handleSearchExecution();
  }, [avoidCongestion, filterPetFriendly, filterPetConditions, filterWheelchair, filterStroller, filterParking, filterSenior]);

  const handleLocationDetection = () => {
    setLocationMocked(true);
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

  const handleSearchExecution = () => {
    setSearchTriggered(true);
    let results = [...mockDestinations];

    if (searchQuery && !searchQuery.includes("(내 주변)")) {
      const q = searchQuery.toLowerCase().trim();
      results = results.filter(
        d => 
          d.name.toLowerCase().includes(q) || 
          d.region.toLowerCase().includes(q) || 
          d.regionFull.toLowerCase().includes(q) || 
          d.description.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q)
      );
    } else if (searchQuery.includes("(내 주변)")) {
      results = results.filter(d => d.region === "삼척");
    }

    if (filterPetFriendly || pets > 0) {
      results = results.filter(d => d.petFriendly.allowed === true);
      if (filterPetConditions === "indoor") {
        results = results.filter(d => d.petFriendly.details.indoor);
      } else if (filterPetConditions === "large") {
        results = results.filter(d => d.petFriendly.details.largeDog);
      }
    }

    if (filterWheelchair) {
      results = results.filter(d => d.accessibility.wheelchair);
    }
    if (filterStroller || children > 0) {
      results = results.filter(d => d.accessibility.stroller);
    }
    if (filterSenior) {
      results = results.filter(d => d.accessibility.senior);
    }
    if (filterParking) {
      results = results.filter(d => d.accessibility.parking);
    }

    if (avoidCongestion) {
      // Prioritize low congestion
      results.sort((a, b) => a.congestionLevel - b.congestionLevel);
    } else {
      // Standard descending congestion level
      results.sort((a, b) => b.congestionLevel - a.congestionLevel);
    }

    setFilteredResults(results);

    let msg = `검색 결과 ${results.length}개의 안심 보행 코스가 발견되었습니다.`;
    if (avoidCongestion) {
      const containsHigh = results.some(d => d.congestionStatus === "high");
      if (containsHigh) {
        msg = "⚠️ 붐비는 유명 명소가 포함되어 있습니다. 온길의 대안 스팟과 함께 한산한 정취를 비교해보세요.";
      } else {
        msg = "🌿 혼잡도가 낮고 차별 없는 무장애 안심 코스 위주로 순위를 자동 정렬했습니다.";
      }
    }
    setSearchMessage(msg);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
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
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* 1. Sync Alert Banner */}
      <AnimatePresence>
        {showSyncAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-3 bg-bento-green text-white text-xs font-bold rounded-2xl flex items-center justify-between shadow-md"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-white shrink-0 animate-pulse" />
              <span>MY 설정의 보행 약자 기본값이 검색 조건에 안전하게 로드되었습니다!</span>
            </div>
            <button onClick={() => setShowSyncAlert(false)} className="text-white/60 hover:text-white font-mono shrink-0 font-bold px-2">X</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Headline */}
      <div className="text-center md:text-left">
        <span className="text-xs font-mono font-bold tracking-widest text-bento-green uppercase block mb-1">
          Smart Congestion-Avoidance Query
        </span>
        <h2 className="text-2xl font-display font-black text-bento-dark tracking-tight leading-none mb-1.5 flex items-center gap-1.5">
          <span>한산 여정 조건별 탐색</span> <Search size={20} className="text-bento-green" />
        </h2>
        <p className="text-bento-dark/60 text-xs leading-relaxed max-w-2xl">
          나이, 보행 약자 동반, 반려견 크기까지. 원하는 필터를 켜면 실시간 붐빔 예측 데이터를 매칭해
          인기 밀집지 대신 가장 쾌적하게 힐링할 수 있는 강원의 골목 안심 코스를 그려냅니다.
        </p>
      </div>

      {/* 3. Weather Broadcast Banner */}
      <div className={`p-4 rounded-3xl border text-xs flex items-start gap-3 transition-all duration-300 ${
        weatherInfo.status === "warning" 
          ? "bg-amber-50 border-amber-200 text-amber-800"
          : weatherInfo.status === "danger"
          ? "bg-red-50 border-red-200 text-red-800"
          : weatherInfo.status === "success"
          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
          : "bg-white border-bento-dark/10 text-bento-dark/80"
      }`}>
        <div className="mt-0.5 shrink-0">
          {weatherInfo.status === "warning" ? <AlertTriangle size={15} className="text-amber-600 animate-bounce" /> :
           weatherInfo.status === "danger" ? <Flame size={15} className="text-red-600" /> :
           weatherInfo.status === "success" ? <Check size={15} className="text-emerald-600" /> :
           <Info size={15} className="text-bento-green" />}
        </div>
        <div>
          <span className="font-bold block mb-0.5">실시간 날씨 & 미세먼지 환경 보정</span>
          <p className="leading-relaxed text-[11px] font-sans">{weatherInfo.text}</p>
        </div>
      </div>

      {/* ==================== SEARCH CONTAINER ==================== */}
      <div className="bg-white rounded-[2rem] border border-bento-dark/10 p-5 shadow-sm relative z-30">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Query Block */}
          <div className="col-span-1 md:col-span-5 relative">
            <label className="block text-[10px] font-mono font-bold uppercase text-bento-dark/40 mb-1 pl-1">목적지 (군 또는 관광지)</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-bento-dark/40" size={16} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="어디로 가시나요? (정선, 고성, 삼척...)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-11 pr-12 py-3 bg-bento-bg/50 border border-bento-dark/5 rounded-2xl text-xs font-bold text-bento-dark focus:outline-none focus:border-bento-green focus:bg-white transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-12 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-bento-bg flex items-center justify-center text-bento-dark/40 hover:text-bento-dark cursor-pointer"
                >
                  <X size={10} />
                </button>
              )}
              <button
                type="button"
                onClick={handleLocationDetection}
                title="내 주변 한산스팟 찾기"
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl transition-all cursor-pointer ${
                  locationMocked ? "bg-bento-green text-white" : "bg-bento-bg text-bento-green hover:bg-bento-green/10"
                }`}
              >
                <Navigation size={12} className={locationMocked ? "animate-pulse" : ""} />
              </button>
            </div>

            {/* Suggestions drop container */}
            <AnimatePresence>
              {showSuggestions && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-bento-dark/10 shadow-lg z-50 p-4 max-h-[300px] overflow-y-auto"
                  >
                    <div className="mb-3">
                      <h4 className="text-[10px] font-bold text-bento-dark/40 uppercase mb-2">최근 검색</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {recentSearches.map((term, i) => (
                          <button
                            key={i}
                            onClick={() => {
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
                      <h4 className="text-[10px] font-bold text-bento-dark/40 uppercase mb-2">시범 안심지 추천</h4>
                      <div className="space-y-1">
                        {popularKeywords.map((item, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setSearchQuery(item.text);
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-2 py-1.5 hover:bg-bento-bg rounded-lg flex items-center justify-between text-xs text-bento-dark transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <MapPin size={10} className="text-bento-green" />
                              <span className="font-bold">{item.text}</span>
                            </div>
                            <span className="text-[8px] font-bold text-bento-green bg-bento-green/15 px-1.5 py-0.5 rounded-full">
                              {item.badge}
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
            <label className="block text-[10px] font-mono font-bold uppercase text-bento-dark/40 mb-1 pl-1">일정 (일자별 혼잡 예보)</label>
            <button
              onClick={() => {
                setActiveDateSelector(true);
                setActiveSheet("date");
              }}
              className="w-full px-4 py-3 bg-bento-bg/50 hover:bg-bento-bg border border-bento-dark/5 rounded-2xl text-xs font-bold text-bento-dark flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2 text-left min-w-0">
                <Calendar size={14} className="text-bento-green shrink-0" />
                <span className="truncate">
                  {selectedStartDate ? `${selectedStartDate.slice(5)}` : "날짜 선택"}
                  {selectedEndDate && selectedEndDate !== selectedStartDate ? ` ~ ${selectedEndDate.slice(5)}` : ""}
                </span>
              </div>
              <ChevronDown size={12} className="text-bento-dark/40 shrink-0" />
            </button>
          </div>

          {/* Guest Selector */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-[10px] font-mono font-bold uppercase text-bento-dark/40 mb-1 pl-1">동반 유형</label>
            <button
              onClick={() => {
                setActiveGuestSelector(true);
                setActiveSheet("guests");
              }}
              className="w-full px-4 py-3 bg-bento-bg/50 hover:bg-bento-bg border border-bento-dark/5 rounded-2xl text-xs font-bold text-bento-dark flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2 text-left min-w-0">
                <Users size={14} className="text-bento-green shrink-0" />
                <span className="truncate">
                  성인 {adults}
                  {children > 0 ? `, 아동 ${children}` : ""}
                  {pets > 0 ? `, 🐾 ${pets}` : ""}
                </span>
              </div>
              <ChevronDown size={12} className="text-bento-dark/40 shrink-0" />
            </button>
          </div>

          {/* Accessibility Filter */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-[10px] font-mono font-bold uppercase text-bento-dark/40 mb-1 pl-1">배리어프리 필터</label>
            <button
              onClick={() => {
                setActiveFilterSheet(true);
                setActiveSheet("filters");
              }}
              className={`w-full px-4 py-3 border rounded-2xl text-xs font-bold flex items-center justify-between cursor-pointer ${
                filterWheelchair || filterStroller || filterPetFriendly || filterSenior || filterParking
                  ? "bg-bento-green/15 border-bento-green text-bento-green"
                  : "bg-bento-bg/50 hover:bg-bento-bg border-bento-dark/5 text-bento-dark"
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
              <ChevronDown size={12} className="shrink-0 opacity-60" />
            </button>
          </div>

        </div>

        {/* Filters Quick Line & Switch */}
        <div className="mt-4 pt-4 border-t border-bento-dark/5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[9px] font-bold text-bento-dark/40 uppercase tracking-wider mr-1">
              빠른 필터:
            </span>
            <button
              onClick={() => applyPreset("pet")}
              className="px-2.5 py-1 bg-bento-bg hover:bg-bento-green/10 border border-bento-dark/5 rounded-full text-[11px] font-bold text-bento-dark/80 flex items-center gap-1 transition-all cursor-pointer"
            >
              <PawPrint size={11} className="text-orange-500" />
              <span>반려견</span>
            </button>
            <button
              onClick={() => applyPreset("wheelchair")}
              className="px-2.5 py-1 bg-bento-bg hover:bg-bento-green/10 border border-bento-dark/5 rounded-full text-[11px] font-bold text-bento-dark/80 flex items-center gap-1 transition-all cursor-pointer"
            >
              <Accessibility size={11} className="text-bento-green" />
              <span>휠체어데크</span>
            </button>
            <button
              onClick={() => applyPreset("stroller")}
              className="px-2.5 py-1 bg-bento-bg hover:bg-bento-green/10 border border-bento-dark/5 rounded-full text-[11px] font-bold text-bento-dark/80 flex items-center gap-1 transition-all cursor-pointer"
            >
              <Baby size={11} className="text-amber-500" />
              <span>유모차통행</span>
            </button>
          </div>

          {/* Smart Avoidance Switch */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-bold text-bento-dark block leading-none mb-0.5">
                과밀 관광지 자동 우회
              </span>
              <span className="text-[10px] text-bento-dark/50 block leading-none">
                인기 과밀지를 후순위 조정하고 한산지 코스를 선매칭합니다.
              </span>
            </div>
            <button
              onClick={() => setAvoidCongestion(!avoidCongestion)}
              className={`w-10 h-5.5 rounded-full transition-all relative cursor-pointer ${
                avoidCongestion ? "bg-bento-green" : "bg-bento-dark/20"
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-0.75 transition-all ${
                avoidCongestion ? "left-5.25" : "left-0.75"
              }`} />
            </button>
          </div>
        </div>

        {/* Submit CTA */}
        <div className="mt-5">
          <button
            onClick={handleSearchExecution}
            className="w-full py-3.5 bg-bento-green hover:bg-bento-green/95 active:scale-[0.99] text-white font-display font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Search size={16} />
            <span>한산한 보행 안심지 조건 탐색</span>
          </button>
        </div>

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
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white rounded-t-[2rem] border-t border-bento-dark/10 shadow-2xl z-[101] overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="px-5 py-3.5 border-b border-bento-dark/5 flex items-center justify-between shrink-0">
                <h3 className="text-xs font-display font-black text-bento-dark uppercase">
                  {activeSheet === "date" ? "📅 일자별 관광 혼잡지표 예측캘린더" :
                   activeSheet === "guests" ? "👥 동반 여행 인원수" :
                   "♿ 배리어프리 보행 장애 인프라 지표"}
                </h3>
                <button
                  onClick={() => {
                    setActiveSheet(null);
                    setActiveDateSelector(false);
                    setActiveGuestSelector(false);
                    setActiveFilterSheet(false);
                  }}
                  className="w-7 h-7 rounded-full bg-bento-bg flex items-center justify-center text-bento-dark/60 hover:text-bento-dark cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1">
                {/* 1. Date Calendar */}
                {activeSheet === "date" && (
                  <div className="space-y-4">
                    <div className="flex bg-bento-bg rounded-xl p-0.5">
                      <button
                        onClick={() => {
                          setIsPeriod(false);
                          setSelectedEndDate(selectedStartDate);
                        }}
                        className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                          !isPeriod ? "bg-white text-bento-green shadow-xs" : "text-bento-dark/60"
                        }`}
                      >
                        당일치기
                      </button>
                      <button
                        onClick={() => setIsPeriod(true)}
                        className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                          isPeriod ? "bg-white text-bento-green shadow-xs" : "text-bento-dark/60"
                        }`}
                      >
                        숙박/기간
                      </button>
                    </div>

                    <div className="bg-bento-bg/50 p-2.5 rounded-xl border border-bento-dark/5 flex items-center justify-around text-[9px] font-bold">
                      <span className="text-bento-dark/50">예측 혼잡도 범례:</span>
                      <span className="flex items-center gap-1 text-emerald-700">● 쾌적(월~목)</span>
                      <span className="flex items-center gap-1 text-amber-700">● 보통(금요일)</span>
                      <span className="flex items-center gap-1 text-red-700">● 혼잡(주말)</span>
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
                            className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all text-xs font-bold cursor-pointer ${
                              isSelected 
                                ? "bg-bento-green text-white" 
                                : inRange 
                                ? "bg-bento-green/15 text-bento-green" 
                                : "bg-bento-bg hover:bg-bento-dark/5 text-bento-dark"
                            }`}
                          >
                            <span>{d.day}</span>
                            <div className={`w-1.25 h-1.25 rounded-full absolute bottom-1 ${
                              d.level === "high" ? "bg-red-500" : d.level === "medium" ? "bg-amber-400" : "bg-emerald-400"
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
                        <button onClick={() => setAdults(Math.max(1, adults - 1))} className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-bento-dark/10 font-bold text-sm cursor-pointer shadow-xs">-</button>
                        <span className="text-xs font-bold w-4 text-center">{adults}</span>
                        <button onClick={() => setAdults(adults + 1)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-bento-dark/10 font-bold text-sm cursor-pointer shadow-xs">+</button>
                      </div>
                    </div>

                    {/* Children */}
                    <div className="flex items-center justify-between p-2.5 bg-bento-bg rounded-xl">
                      <div>
                        <span className="text-xs font-bold block text-bento-dark">아동 및 영유아</span>
                        <span className="text-[10px] text-bento-dark/50 block">휠체어, 유모차 보호자 필요 가능</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setChildren(Math.max(0, children - 1))} className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-bento-dark/10 font-bold text-sm cursor-pointer shadow-xs">-</button>
                        <span className="text-xs font-bold w-4 text-center">{children}</span>
                        <button onClick={() => setChildren(children + 1)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-bento-dark/10 font-bold text-sm cursor-pointer shadow-xs">+</button>
                      </div>
                    </div>

                    {/* Pets */}
                    <div className="flex items-center justify-between p-2.5 bg-bento-bg rounded-xl">
                      <div>
                        <span className="text-xs font-bold block text-bento-dark">반려견 동반</span>
                        <span className="text-[10px] text-bento-dark/50 block">대형견/소형견 야외 구역 매칭 지원</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setPets(Math.max(0, pets - 1))} className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-bento-dark/10 font-bold text-sm cursor-pointer shadow-xs">-</button>
                        <span className="text-xs font-bold w-4 text-center">{pets}</span>
                        <button onClick={() => setPets(pets + 1)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-bento-dark/10 font-bold text-sm cursor-pointer shadow-xs">+</button>
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
                        className={`w-10 h-5.5 rounded-full transition-all relative cursor-pointer ${
                          filterWheelchair ? "bg-bento-green" : "bg-bento-dark/20"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-0.75 transition-all ${
                          filterWheelchair ? "left-5.25" : "left-0.75"
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
                        className={`w-10 h-5.5 rounded-full transition-all relative cursor-pointer ${
                          filterStroller ? "bg-bento-green" : "bg-bento-green" // keep synced or toggle
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-0.75 transition-all ${
                          filterStroller ? "left-5.25" : "left-0.75"
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
                        className={`w-10 h-5.5 rounded-full transition-all relative cursor-pointer ${
                          filterPetFriendly ? "bg-bento-green" : "bg-bento-dark/20"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-0.75 transition-all ${
                          filterPetFriendly ? "left-5.25" : "left-0.75"
                        }`} />
                      </button>
                    </div>

                    {/* Large dog / Indoor option (conditional) */}
                    {filterPetFriendly && (
                      <div className="p-3 border border-dashed border-bento-dark/10 rounded-xl bg-bento-bg/30 space-y-2">
                        <span className="text-[9px] font-bold text-bento-dark/40 uppercase block">반려견 크기 및 실내 조건:</span>
                        <div className="flex gap-2">
                          {(["any", "indoor", "large"] as const).map((opt) => (
                            <button
                                key={opt}
                                onClick={() => setFilterPetConditions(opt)}
                                className={`flex-1 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                  filterPetConditions === opt 
                                    ? "bg-bento-green border-bento-green text-white" 
                                    : "bg-white border-bento-dark/10 text-bento-dark/60"
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
                        className={`w-10 h-5.5 rounded-full transition-all relative cursor-pointer ${
                          filterSenior ? "bg-bento-green" : "bg-bento-dark/20"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-0.75 transition-all ${
                          filterSenior ? "left-5.25" : "left-0.75"
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
                        className={`w-10 h-5.5 rounded-full transition-all relative cursor-pointer ${
                          filterParking ? "bg-bento-green" : "bg-bento-dark/20"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-0.75 transition-all ${
                          filterParking ? "left-5.25" : "left-0.75"
                        }`} />
                      </button>
                    </div>

                  </div>
                )}
              </div>

              {/* Sheet Save action */}
              <div className="p-4 bg-bento-bg border-t border-bento-dark/5 shrink-0">
                <button
                  onClick={() => {
                    setActiveSheet(null);
                    setActiveDateSelector(false);
                    setActiveGuestSelector(false);
                    setActiveFilterSheet(false);
                    handleSearchExecution();
                  }}
                  className="w-full py-3 bg-bento-green hover:bg-bento-green/90 text-white font-display font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  조건 변경 완료
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
            <div className="p-3 bg-bento-olive/15 border border-bento-green/10 rounded-2xl flex items-center justify-between text-xs font-semibold text-bento-dark shadow-xs">
              <span className="flex items-center gap-2">
                <Leaf size={14} className="text-bento-green animate-pulse" />
                <span>{searchMessage}</span>
              </span>
              <button 
                onClick={handleClearSearch}
                className="text-[10px] font-mono text-red-700 bg-red-100 hover:bg-red-200 px-2.5 py-1 rounded-full cursor-pointer transition-colors"
              >
                검색 초기화
              </button>
            </div>

            {/* Results Grid - responsive 3 columns on tablet/desktop */}
            {filteredResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {filteredResults.map((dest) => {
                  const isAlternative = dest.congestionStatus === "high";

                  return (
                    <motion.div
                      key={dest.id}
                      whileHover={{ y: -3 }}
                      onClick={() => onSelectDestination(dest)}
                      className={`bg-white rounded-3xl border overflow-hidden flex flex-col justify-between hover:shadow-md transition-all cursor-pointer ${
                        isAlternative ? "border-amber-400 ring-2 ring-amber-400/20" : "border-bento-dark/5"
                      }`}
                    >
                      <div className="relative h-44">
                        <img
                          src={dest.image}
                          alt={dest.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-bento-dark/70 via-transparent to-transparent" />

                        {/* Top indicators */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold text-white flex items-center gap-1 ${
                            dest.congestionStatus === "high" 
                              ? "bg-red-500 animate-pulse" 
                              : dest.congestionStatus === "medium" 
                              ? "bg-amber-500" 
                              : "bg-emerald-500"
                          }`}>
                            ● 혼잡도 {dest.congestionLevel}%
                          </span>
                          {dest.isDepopulationArea && (
                            <span className="bg-bento-green/95 text-white text-[8px] font-bold px-2 py-0.5 rounded-full">
                              시범안심지역
                            </span>
                          )}
                        </div>

                        {/* Pinned/Liked */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleLike(dest.id);
                          }}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center hover:bg-white text-bento-dark/80 transition-colors cursor-pointer"
                        >
                          <Heart size={14} className={likedDestinations.includes(dest.id) ? "fill-red-500 text-red-500" : "text-bento-dark/40"} />
                        </button>

                        <div className="absolute bottom-3 left-3 text-white">
                          <span className="text-[8px] font-bold tracking-widest text-bento-olive uppercase block">
                            {dest.region} · {dest.category}
                          </span>
                          <h4 className="font-display font-black text-sm tracking-tight leading-none mt-1">
                            {dest.name}
                          </h4>
                        </div>
                      </div>

                      <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                        <p className="text-[11px] text-bento-dark/60 leading-relaxed line-clamp-2">
                          {dest.description}
                        </p>

                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-bento-dark/40 uppercase block">보행 약자 시설</span>
                          <div className="flex flex-wrap gap-1">
                            {dest.accessibility.wheelchair && (
                              <span className="bg-bento-bg text-bento-dark/80 text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Accessibility size={10} className="text-bento-green" />
                                <span>경사로완비</span>
                              </span>
                            )}
                            {dest.accessibility.stroller && (
                              <span className="bg-bento-bg text-bento-dark/80 text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Baby size={10} className="text-amber-500" />
                                <span>유모차안심</span>
                              </span>
                            )}
                            {dest.petFriendly.allowed && (
                              <span className="bg-bento-bg text-bento-dark/80 text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                <PawPrint size={10} className="text-orange-500" />
                                <span>반려견동반</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Alternative link notification */}
                        {isAlternative && dest.alternativeId && (
                          <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-[10px] text-amber-800 leading-normal flex items-start gap-1">
                            <AlertTriangle size={12} className="text-amber-600 shrink-0 mt-0.5" />
                            <span><strong>주말 집중지 경고:</strong> 대안 여행지인 <strong>고성 능파대</strong>로 쾌적한 우회 코스가 준비되어 있습니다. 클릭하여 대안을 조망하세요.</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* No Results state */
              <div className="text-center py-12 bg-white rounded-3xl border border-bento-dark/10 shadow-xs max-w-md mx-auto space-y-3 flex flex-col items-center justify-center">
                <Search size={32} className="text-bento-dark/40" />
                <h4 className="font-display font-black text-bento-dark text-sm mt-2">일치하는 안심 코스가 없습니다.</h4>
                <p className="text-xs text-bento-dark/50 px-6 leading-relaxed">
                  필터 조건이 너무 많거나, 해당 지자체에 실시간 대기 안전기준을 충족하는 코스가 아직 등록되지 않았습니다. 
                  보행 필터를 한 단계 완화하거나 '내 주변'preset을 다시 선택해 보세요!
                </p>
                <button
                  onClick={handleClearSearch}
                  className="px-4 py-2 bg-bento-green text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  필터 전체 초기화
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Display default suggestions before any search query executed */}
      {!searchTriggered && (
        <div className="space-y-4 pt-4 border-t border-bento-dark/5">
          <h3 className="text-xs font-mono font-bold tracking-widest text-bento-dark/40 uppercase pl-1 flex items-center gap-1.5">
            <span>강원 소멸 대응 시범지구 실시간 혼잡 예측</span> <Sparkles size={12} className="text-bento-green animate-pulse" />
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {mockDestinations.slice(0, 4).map((dest) => (
              <div
                key={dest.id}
                onClick={() => onSelectDestination(dest)}
                className="bg-white rounded-2xl border border-bento-dark/5 p-3 flex items-center gap-3 hover:shadow-md transition-all cursor-pointer"
              >
                <img
                  src={dest.image}
                  alt={dest.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-bento-dark truncate leading-none mb-1">{dest.name}</h4>
                  <div className="flex items-center justify-between text-[10px] text-bento-dark/40 font-mono">
                    <span>{dest.region}</span>
                    <span className="text-bento-green font-bold">혼잡 {dest.congestionLevel}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
