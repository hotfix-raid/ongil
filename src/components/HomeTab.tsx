import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Compass, 
  Sun, 
  CloudRain, 
  Wind, 
  ShieldAlert, 
  ArrowRight, 
  Heart, 
  TrendingDown, 
  Eye, 
  Sparkles,
  Accessibility,
  Info,
  Calendar,
  Leaf,
  Star,
  Baby,
  PawPrint,
  Lightbulb,
  CloudSun
} from "lucide-react";
import { MockDestination, mockDestinations } from "../data/destinations";

interface HomeTabProps {
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
  onNavigateToTab: (tab: "home" | "search" | "map" | "course" | "my") => void;
}

export default function HomeTab({
  onSelectDestination,
  likedDestinations,
  onToggleLike,
  accessibilityDefaults,
  onNavigateToTab
}: HomeTabProps) {
  // Simulated Weather state: Let the user change weather to see real-time curation shift!
  const [weatherPreset, setWeatherPreset] = useState<"sunny" | "rainy" | "dusty">("sunny");
  const [showWeatherDetails, setShowWeatherDetails] = useState(false);

  // Filter 1: Tranquil Depopulated Areas (지금 한산한 인구감소지역)
  const depopulatedTranquil = mockDestinations.filter(
    d => d.isDepopulationArea && d.congestionStatus === "low"
  );

  // Filter 2: Climate-Adaptive Recommendations (오늘 날씨엔 이런 코스)
  const getClimateRecommendations = () => {
    if (weatherPreset === "sunny") {
      // Best outdoor trails and coastlines
      return mockDestinations.filter(d => d.category === "자연/해안" || d.category === "체험/랜드마크").slice(0, 3);
    } else if (weatherPreset === "rainy") {
      // Forest paths with thick shelters or coastal deck paths with caves, or sheltered forests
      return mockDestinations.filter(d => d.category === "산림/계곡" || d.name.includes("용굴")).slice(0, 3);
    } else {
      // Dusty: High forest cover or clean high-altitude mountain trails where air is pure
      return mockDestinations.filter(d => d.region === "태백" || d.category === "산림/계곡").slice(0, 3);
    }
  };

  const climateFeed = getClimateRecommendations();

  // Filter 3: Personalized Accessibility Recommendations
  const hasProfileDefaults = Object.values(accessibilityDefaults).some(Boolean);
  const getPersonalizedRecommendations = () => {
    let list = [...mockDestinations];
    if (accessibilityDefaults.wheelchair) {
      list = list.filter(d => d.accessibility.wheelchair);
    }
    if (accessibilityDefaults.stroller) {
      list = list.filter(d => d.accessibility.stroller);
    }
    if (accessibilityDefaults.petFriendly) {
      list = list.filter(d => d.petFriendly.allowed);
    }
    if (accessibilityDefaults.senior) {
      list = list.filter(d => d.accessibility.senior);
    }
    return list.slice(0, 2);
  };

  const personalizedFeed = getPersonalizedRecommendations();

  const weatherDetailsMap = {
    sunny: {
      temp: "24°C",
      dust: "8㎍/㎡ (좋음)",
      rain: "10%",
      wind: "북서풍 1.5m/s",
      icon: <Sun className="text-amber-500 animate-spin-slow" size={20} />,
      desc: "맑고 파란 하늘이 열렸습니다. 자외선이 조금 강하니 모자와 썬크림을 준비하세요. 보행 데크길과 해변 산책에 최상의 대기 질입니다."
    },
    rainy: {
      temp: "21°C",
      dust: "12㎍/㎡ (좋음)",
      rain: "85%",
      wind: "동풍 4.2m/s",
      icon: <CloudRain className="text-blue-500 animate-bounce" size={20} />,
      desc: "흐리고 잔잔한 소나기가 뿌립니다. 울창한 소나무 그늘 숲길이나 바다 동굴길을 걸으며 진한 자연의 향기와 빗소리를 즐기기 좋은 타이밍입니다."
    },
    dusty: {
      temp: "23°C",
      dust: "45㎍/㎡ (나쁨)",
      rain: "20%",
      wind: "남풍 2.1m/s",
      icon: <Wind className="text-teal-600" size={20} />,
      desc: "수도권 발 미세먼지 영향이 다소 높습니다. 음이온과 피톤치드가 사방을 에워싸 공기 정화율이 높은 해발 1,000m 고원 침엽수림 코스로 우회하세요."
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn pb-12">
      
      {/* 1. Header with Title + Climate Widget */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-bento-dark/5 pb-6">
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-display font-black tracking-tight text-bento-dark mb-1">
            모두를 위한 안심 길벗
          </h2>
          <p className="text-[11px] text-bento-dark/50">지속 가능한 로컬 지원과 포용적인 맞춤형 관광 큐레이터</p>
        </div>

        {/* Climate Widget Trigger Badge */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-bento-dark/40 uppercase hidden md:inline">
            기상 연동:
          </span>
          <button
            onClick={() => setShowWeatherDetails(!showWeatherDetails)}
            className="px-4 py-2 bg-white hover:bg-bento-bg border border-bento-dark/10 rounded-full text-xs font-semibold text-bento-dark flex items-center gap-2.5 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            {weatherDetailsMap[weatherPreset].icon}
            <span className="font-bold">강원 소멸지역 예보: {weatherPreset === "sunny" ? "맑음" : weatherPreset === "rainy" ? "소나기" : "미세먼지 나쁨"}</span>
            <span className="text-[10px] font-mono bg-bento-green/10 text-bento-green px-2 py-0.5 rounded-full font-black">자세히</span>
          </button>
        </div>
      </div>

      {/* Weather Overlay Details Dropdown Drawer */}
      <AnimatePresence>
        {showWeatherDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-white rounded-3xl border border-bento-dark/10 p-5 shadow-inner"
          >
            <div className="flex items-start justify-between mb-4">
              <h4 className="text-sm font-display font-black text-bento-dark flex items-center gap-2">
                <span>실시간 강원 4군 기후 종합관측망</span>
                <span className="text-[10px] font-mono bg-bento-green text-white px-2 py-0.5 rounded-md">Live API</span>
              </h4>
              <button 
                onClick={() => setShowWeatherDetails(false)} 
                className="text-xs font-bold text-bento-dark/40 hover:text-bento-dark cursor-pointer"
              >
                닫기
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-bento-bg p-3.5 rounded-2xl">
                <span className="text-[10px] text-bento-dark/40 font-mono block mb-1">체감 기온</span>
                <strong className="text-lg font-display text-bento-dark">{weatherDetailsMap[weatherPreset].temp}</strong>
              </div>
              <div className="bg-bento-bg p-3.5 rounded-2xl">
                <span className="text-[10px] text-bento-dark/40 font-mono block mb-1">미세먼지 지수</span>
                <strong className="text-lg font-display text-bento-dark">{weatherDetailsMap[weatherPreset].dust}</strong>
              </div>
              <div className="bg-bento-bg p-3.5 rounded-2xl">
                <span className="text-[10px] text-bento-dark/40 font-mono block mb-1">강수 확률</span>
                <strong className="text-lg font-display text-bento-dark">{weatherDetailsMap[weatherPreset].rain}</strong>
              </div>
              <div className="bg-bento-bg p-3.5 rounded-2xl">
                <span className="text-[10px] text-bento-dark/40 font-mono block mb-1">풍속 및 방향</span>
                <strong className="text-sm font-display text-bento-dark">{weatherDetailsMap[weatherPreset].wind}</strong>
              </div>
            </div>

            <div className="bg-bento-olive/15 p-4 rounded-2xl text-xs text-bento-dark/80 leading-relaxed border border-bento-green/10 mb-4">
              {weatherDetailsMap[weatherPreset].desc}
            </div>

            {/* Simulated Weather Presets Controller for judges/demoers */}
            <div className="pt-3 border-t border-bento-dark/5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-bento-dark/40 flex items-center gap-1.5">
                <Info size={12} className="text-bento-green" />
                <span>시연용 날씨 강제 변환:</span>
              </span>
              <div className="flex gap-1.5">
                {(["sunny", "rainy", "dusty"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setWeatherPreset(p)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                      weatherPreset === p
                        ? "bg-bento-green text-white shadow-xs"
                        : "bg-bento-bg text-bento-dark/60 hover:bg-bento-dark/5"
                    }`}
                  >
                    {p === "sunny" ? (
                      <span className="flex items-center gap-1"><Sun size={12} className="text-amber-500" /> 맑음</span>
                    ) : p === "rainy" ? (
                      <span className="flex items-center gap-1"><CloudRain size={12} className="text-blue-500" /> 우천</span>
                    ) : (
                      <span className="flex items-center gap-1"><Wind size={12} className="text-teal-600" /> 미세먼지</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Section: 지금 한산한 인구감소지역 (Tranquil Depopulated Area Picks) */}
      <div className="bg-gradient-to-br from-[#F3F6F0]/90 to-[#E8ECE2]/50 border border-bento-green/10 p-6 sm:p-8 rounded-[2.5rem] space-y-6 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-lg font-display font-black text-bento-dark tracking-tight flex items-center gap-1.5">
                지금 한산한 인구감소지역 추천 <Leaf size={18} className="text-bento-green animate-pulse" />
              </h3>
            </div>
            <p className="text-[11px] text-bento-dark/50">
              관광 집중도가 낮고 혼잡도가 20% 미만인 강원 4개 군의 숨겨진 힐링 명소
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab("search")}
            className="text-xs font-bold text-bento-green flex items-center gap-1 hover:underline cursor-pointer bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-full border border-bento-green/5 shadow-xs"
          >
            <span>전체보기</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Horizontal Card Track on mobile, Grid on desktop */}
        <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-thin scrollbar-thumb-bento-dark/10 md:grid md:grid-cols-3 md:overflow-x-visible md:pb-0">
          {depopulatedTranquil.map((dest) => (
            <motion.div
              key={dest.id}
              whileHover={{ y: -4 }}
              onClick={() => onSelectDestination(dest)}
              className="min-w-[270px] bg-white rounded-3xl border border-bento-dark/5 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all cursor-pointer shrink-0"
            >
              <div className="relative h-40">
                <img
                  src={dest.image}
                  alt={dest.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bento-dark/70 via-transparent to-transparent" />
                
                {/* Congestion indicator badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-emerald-500/90 text-white rounded-full text-[10px] font-bold flex items-center gap-1">
                  <TrendingDown size={10} />
                  <span>혼잡도 {dest.congestionLevel}% (한산)</span>
                </div>

                <div className="absolute bottom-3 left-3 text-white">
                  <span className="text-[9px] uppercase font-mono bg-white/20 px-2 py-0.5 rounded-md block w-max font-bold mb-1">
                    {dest.region}
                  </span>
                  <h4 className="font-display font-black text-base tracking-tight leading-none">
                    {dest.name}
                  </h4>
                </div>

                {/* Like Button */}
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
              </div>

              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <p className="text-xs text-bento-dark/60 leading-relaxed line-clamp-2">
                  {dest.description}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-bento-dark/5">
                  {dest.accessibility.wheelchair && (
                    <span className="text-[10px] font-bold bg-bento-bg text-bento-dark/70 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      ♿ 휠체어 데크
                    </span>
                  )}
                  {dest.petFriendly.allowed && (
                    <span className="text-[10px] font-bold bg-bento-bg text-bento-dark/70 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      🐾 반려견 환영
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 3. Section: 오늘 날씨엔 이런 코스 (Climate-Adaptive Feed) */}
      <div className="bg-gradient-to-br from-[#ECF2F6]/90 to-[#DFE9F1]/50 border border-blue-900/5 p-6 sm:p-8 rounded-[2.5rem] space-y-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-blue-900/10 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="text-lg font-display font-black text-bento-dark tracking-tight flex items-center gap-1.5">
                오늘 날씨엔 이런 코스 <CloudSun size={18} className="text-blue-500 animate-pulse" />
              </h3>
            </div>
            <p className="text-[11px] text-bento-dark/50">
              실시간 기상 센서에 맞춰 오늘의 대기 상태에 가장 이상적인 무장애 노선을 매칭합니다.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-xs border border-blue-200 px-4.5 py-3 rounded-2xl max-w-xl self-stretch lg:self-auto flex items-start gap-2.5 shadow-xs">
            <Sparkles size={14} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-bento-dark/75 font-semibold leading-relaxed">
              {weatherPreset === "sunny" ? "맑고 상쾌한 햇살 아래, 장애물 없이 푸른 해안 보행 데크를 즐기세요." :
               weatherPreset === "rainy" ? "솔향이 울창하고 비를 가려주는 자작나무 숲길이나 안심 동굴 산책로가 제격입니다." :
               "미세먼지가 도심을 습격할 땐 공기 정화율이 우수한 1,200m 고원 침엽수림으로 대피해 숨을 쉬어보세요."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {climateFeed.map((dest) => (
            <motion.div
              key={dest.id}
              whileHover={{ y: -4 }}
              onClick={() => onSelectDestination(dest)}
              className="bg-white rounded-3xl border border-bento-dark/5 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all cursor-pointer h-full"
            >
              <div className="relative h-40">
                <img
                  src={dest.image}
                  alt={dest.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bento-dark/75 via-transparent to-transparent" />
                
                <span className="absolute top-3 left-3 text-[9px] uppercase font-mono bg-white/20 px-2 py-0.5 rounded-md text-white font-bold">
                  {dest.region}
                </span>

                <div className="absolute bottom-3 left-3 text-white">
                  <h4 className="font-display font-black text-base tracking-tight leading-none">
                    {dest.name}
                  </h4>
                </div>
              </div>
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <p className="text-xs text-bento-dark/60 leading-relaxed line-clamp-2">
                  {dest.description}
                </p>
                <div className="pt-2 border-t border-bento-dark/5">
                  <span className="text-[10px] text-bento-green font-bold flex items-center gap-1.5 leading-relaxed bg-bento-green/10 px-2.5 py-1.5 rounded-xl">
                    <Lightbulb size={12} className="shrink-0 text-bento-green" />
                    <span>{dest.weatherAdjustedRecommendation}</span>
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 4. Section: 당신을 위한 접근성 추천 (Accessibility Personalized Feed) */}
      <div className="bg-gradient-to-br from-[#FAF3E8]/90 to-[#F2E7D5]/50 border border-bento-sand/60 p-6 sm:p-8 rounded-[2.5rem] space-y-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="text-lg font-display font-black text-bento-dark tracking-tight flex items-center gap-1.5">
              당신을 위한 접근성 추천 <Star size={18} className="text-amber-500 fill-amber-500" />
            </h3>
          </div>
          <p className="text-[11px] text-bento-dark/50">
            {hasProfileDefaults 
              ? "MY 설정에 저장하신 배리어프리 조건을 반영한 맞춤 힐링 노선입니다."
              : "동반 반려동물, 유모차 사용, 휠체어 여부에 맞춰 무장애 걷기길을 자동으로 큐레이션합니다."}
          </p>
        </div>

        {hasProfileDefaults ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {personalizedFeed.map((dest) => (
              <div
                key={dest.id}
                onClick={() => onSelectDestination(dest)}
                className="bg-white p-4.5 rounded-3xl border border-bento-dark/5 flex gap-4 hover:shadow-md transition-all cursor-pointer items-center"
              >
                <img
                  src={dest.image}
                  alt={dest.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-2xl object-cover shrink-0"
                />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-bento-green font-mono">{dest.region}</span>
                    {dest.isDepopulationArea && (
                      <span className="text-[8px] font-bold bg-bento-olive text-bento-dark px-1.5 py-0.5 rounded-sm">인구감소지</span>
                    )}
                  </div>
                  <h4 className="font-display font-black text-sm text-bento-dark tracking-tight truncate leading-none">
                    {dest.name}
                  </h4>
                  <p className="text-[11px] text-bento-dark/50 truncate leading-relaxed">
                    {dest.accessibility.note}
                  </p>
                  <div className="flex items-center gap-1.5 pt-1">
                    {accessibilityDefaults.wheelchair && (
                      <span className="text-[9px] bg-bento-green/15 text-bento-green font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Accessibility size={10} />
                        <span>휠체어 최적</span>
                      </span>
                    )}
                    {accessibilityDefaults.stroller && (
                      <span className="text-[9px] bg-bento-green/15 text-bento-green font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Baby size={10} />
                        <span>유모차 통행</span>
                      </span>
                    )}
                    {accessibilityDefaults.petFriendly && (
                      <span className="text-[9px] bg-bento-green/15 text-bento-green font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <PawPrint size={10} />
                        <span>반려가족</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Profile Empty Call-to-Action Card */
          <div className="p-6 bg-white rounded-3xl border border-bento-dark/10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-left">
            <div className="space-y-1.5 max-w-lg">
              <div className="flex items-center justify-center md:justify-start gap-1.5">
                <div className="w-5 h-5 rounded-full bg-bento-green/15 text-bento-green flex items-center justify-center">
                  <Accessibility size={12} />
                </div>
                <span className="text-xs font-bold text-bento-green">포용적 맞춤 필터 제안</span>
              </div>
              <h4 className="font-display font-black text-base text-bento-dark tracking-tight">
                나만의 맞춤 보행 보조 조건(배리어프리)을 설정해 보세요!
              </h4>
              <p className="text-xs text-bento-dark/60 leading-relaxed">
                반려동물 동반 여부, 휠체어 소지, 유모차 사용 등 나만의 특수 기준을 프로필에 한 번만 등록하시면, 
                홈 화면의 실시간 추천과 검색 피드가 나만을 위해 완전히 자동으로 동기화됩니다.
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab("my")}
              className="px-5 py-3 bg-bento-dark hover:bg-bento-dark/90 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer whitespace-nowrap shadow-xs"
            >
              내 맞춤 기본값 설정하러 가기
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
