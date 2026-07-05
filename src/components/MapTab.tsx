import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MapPin, 
  Navigation, 
  Layers, 
  SlidersHorizontal, 
  Info, 
  X, 
  ArrowRight, 
  Compass, 
  TrendingDown, 
  Accessibility, 
  Trees, 
  Check, 
  Search,
  Maximize2,
  Baby,
  PawPrint,
  Radio
} from "lucide-react";
import { MockDestination, mockDestinations } from "../data/destinations";

interface MapTabProps {
  onSelectDestination: (destination: MockDestination) => void;
  accessibilityDefaults: {
    petFriendly: boolean;
    wheelchair: boolean;
    stroller: boolean;
    senior: boolean;
    parking: boolean;
  };
}

// Coordinates map for plotting destinations on our beautiful custom visual map canvas
const coordinateMap: Record<string, { x: number; y: number }> = {
  d001: { x: 30, y: 15 }, // 고성 능파대 (North Coast)
  d007: { x: 26, y: 22 }, // 고성 아야진 해변
  d002: { x: 42, y: 55 }, // 정선 소금강 (Central Mountains)
  d008: { x: 48, y: 64 }, // 정선 민둥산
  d003: { x: 72, y: 58 }, // 태백 바람의 언덕 (East South Mountains)
  d009: { x: 68, y: 68 }, // 태백 자작나무숲
  d004: { x: 82, y: 44 }, // 삼척 초곡용굴 (South Coast)
  d010: { x: 88, y: 36 }, // 삼척 삼척해변 솔숲길
  d005: { x: 58, y: 28 }, // 강릉 안목 해변 (Mid Coast)
  d006: { x: 40, y: 18 }  // 속초 청초호 (North Mid Coast)
};

export default function MapTab({
  onSelectDestination,
  accessibilityDefaults
}: MapTabProps) {
  // Map filter parameters
  const [filterWheelchair, setFilterWheelchair] = useState(false);
  const [filterStroller, setFilterStroller] = useState(false);
  const [filterPetFriendly, setFilterPetFriendly] = useState(false);

  const [activePin, setActivePin] = useState<MockDestination | null>(null);
  const [nearMeActive, setNearMeActive] = useState(false);
  const [radarRipple, setRadarRipple] = useState(false);
  const [mapType, setMapType] = useState<"standard" | "topographical">("topographical");

  // Mobile accessibility view mode
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load defaults on mount
  useEffect(() => {
    if (accessibilityDefaults.wheelchair) setFilterWheelchair(true);
    if (accessibilityDefaults.stroller) setFilterStroller(true);
    if (accessibilityDefaults.petFriendly) setFilterPetFriendly(true);
  }, [accessibilityDefaults]);

  // Toast automatic dismissal
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Reset active pin if it gets filtered out by user filter changes
  useEffect(() => {
    if (activePin && !meetsFilterConditions(activePin)) {
      setActivePin(null);
    }
  }, [filterWheelchair, filterStroller, filterPetFriendly, nearMeActive, activePin]);

  const handleNearMeQuery = () => {
    setNearMeActive(true);
    setRadarRipple(true);
    setTimeout(() => setRadarRipple(false), 2000);
    // Autofocus on first tranquil local spot (e.g. Samcheok Chogokyunggul d004)
    const localSpot = mockDestinations.find(d => d.id === "d004") || null;
    setActivePin(localSpot);
    // Switch to map view to show the result immediately on mobile
    setMobileView("map");
  };

  // Decide if pin meets the filter condition
  const meetsFilterConditions = (dest: MockDestination) => {
    if (filterWheelchair && !dest.accessibility.wheelchair) return false;
    if (filterStroller && !dest.accessibility.stroller) return false;
    if (filterPetFriendly && !dest.petFriendly.allowed) return false;
    if (nearMeActive && dest.congestionStatus === "high") return false;
    return true;
  };

  const getPinColor = (dest: MockDestination) => {
    if (!meetsFilterConditions(dest)) return "bg-gray-300 text-gray-500 border-gray-400 opacity-30";
    if (dest.congestionLevel <= 20) return "bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20";
    if (dest.congestionLevel <= 50) return "bg-amber-500 text-white border-amber-600 shadow-amber-500/20";
    return "bg-red-500 text-white border-red-600 shadow-red-500/20";
  };

  const filteredCount = mockDestinations.filter(meetsFilterConditions).length;

  return (
    <div className="h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)] flex flex-col gap-4 overflow-hidden animate-fadeIn pb-2 relative">
      
      {/* 1. MOBILE RESPONSIVE SEGMENTED TABS (HIGH ACCESSIBILITY TOUCH TARGETS) */}
      <div className="lg:hidden flex bg-white border border-bento-dark/10 p-1 rounded-2xl shadow-xs shrink-0 z-10">
        <button
          onClick={() => setMobileView("list")}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mobileView === "list"
              ? "bg-bento-green text-white shadow-xs"
              : "text-bento-dark/60 hover:text-bento-dark hover:bg-bento-bg"
          }`}
        >
          <SlidersHorizontal size={14} />
          <span>보행 흐름망 목록 ({filteredCount})</span>
        </button>
        <button
          onClick={() => setMobileView("map")}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mobileView === "map"
              ? "bg-bento-green text-white shadow-xs"
              : "text-bento-dark/60 hover:text-bento-dark hover:bg-bento-bg"
          }`}
        >
          <Compass size={14} />
          <span>안심 관측도 지도</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        
        {/* LEFT COLUMN: Scrollable Destination list for Map Syncing */}
        <div className={`w-full lg:w-[35%] xl:w-[30%] shrink-0 flex flex-col bg-white border border-bento-dark/10 rounded-[2rem] overflow-hidden shadow-xs ${
          mobileView === "list" ? "flex h-full" : "hidden lg:flex lg:h-full"
        }`}>
          {/* Title / Mini Filters Header */}
          <div className="p-4 border-b border-bento-dark/5 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold tracking-widest text-bento-dark/40 uppercase">실시간 보행 흐름망</h3>
              <span className="text-[10px] bg-bento-green/10 text-bento-green font-bold px-2.5 py-0.5 rounded-full">
                GPS 연동
              </span>
            </div>
            
            {/* Compact filters - Responsive larger touch targets */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterWheelchair(!filterWheelchair)}
                className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterWheelchair 
                    ? "bg-bento-green text-white shadow-xs" 
                    : "bg-bento-bg text-bento-dark/60 border border-bento-dark/5 hover:bg-bento-dark/5"
                }`}
              >
                <Accessibility size={14} className={filterWheelchair ? "text-white" : "text-bento-green"} />
                <span>휠체어</span>
                {filterWheelchair && <Check size={12} className="ml-0.5" />}
              </button>
              <button
                onClick={() => setFilterStroller(!filterStroller)}
                className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterStroller 
                    ? "bg-bento-green text-white shadow-xs" 
                    : "bg-bento-bg text-bento-dark/60 border border-bento-dark/5 hover:bg-bento-dark/5"
                }`}
              >
                <Baby size={14} className={filterStroller ? "text-white" : "text-amber-500"} />
                <span>유모차</span>
                {filterStroller && <Check size={12} className="ml-0.5" />}
              </button>
              <button
                onClick={() => setFilterPetFriendly(!filterPetFriendly)}
                className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterPetFriendly 
                    ? "bg-bento-green text-white shadow-xs" 
                    : "bg-bento-bg text-bento-dark/60 border border-bento-dark/5 hover:bg-bento-dark/5"
                }`}
              >
                <PawPrint size={14} className={filterPetFriendly ? "text-white" : "text-orange-500"} />
                <span>반려동물</span>
                {filterPetFriendly && <Check size={12} className="ml-0.5" />}
              </button>
            </div>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-bento-dark/10">
            {mockDestinations.filter(meetsFilterConditions).length === 0 ? (
              <div className="text-center py-12 px-4 space-y-2.5 flex flex-col items-center justify-center h-full">
                <Search size={32} className="text-bento-dark/30" />
                <h5 className="text-xs font-bold text-bento-dark">일치하는 안심 코스가 없습니다.</h5>
                <p className="text-[10px] text-bento-dark/50 leading-relaxed text-center">
                  필터 조건에 부합하는 한산한 보행 지표 코스가 이 지역에 없습니다. 다른 보행 지표 필터를 조절해 보세요.
                </p>
              </div>
            ) : (
              mockDestinations.filter(meetsFilterConditions).map((dest) => {
                const isActive = activePin?.id === dest.id;

                return (
                  <div
                    key={dest.id}
                    onClick={() => {
                      setActivePin(dest);
                      setMobileView("map");
                      // Smooth scroll to canvas if on desktop view
                      if (window.innerWidth >= 1024) {
                        const mapCanvas = document.getElementById("visual-map-canvas");
                        if (mapCanvas) {
                          mapCanvas.scrollIntoView({ behavior: "smooth" });
                        }
                      }
                    }}
                    className={`p-3.5 rounded-2xl border transition-all text-left flex gap-4 items-center cursor-pointer ${
                      isActive 
                        ? "border-bento-green bg-bento-green/5 ring-1 ring-bento-green/25" 
                        : "border-bento-dark/5 bg-white hover:bg-bento-bg"
                    }`}
                  >
                    <img
                      src={dest.image}
                      alt={dest.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-bento-dark/5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-bento-green font-mono">{dest.region}</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          dest.congestionLevel <= 20 ? "bg-emerald-500" : dest.congestionLevel <= 50 ? "bg-amber-400" : "bg-red-500"
                        }`} />
                        <span className="text-[9px] font-mono opacity-60">혼잡 {dest.congestionLevel}%</span>
                      </div>
                      <h4 className="font-display font-black text-xs sm:text-sm text-bento-dark tracking-tight truncate leading-tight mt-0.5">
                        {dest.name}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-bento-dark/50 truncate leading-relaxed mt-0.5">
                        {dest.accessibility.note}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: HIGH-FIDELITY GRAPHIC INTERACTIVE MAP CANVAS */}
        <div id="visual-map-canvas" className={`flex-1 bg-bento-dark/5 border border-bento-dark/10 rounded-[2.5rem] relative overflow-hidden flex flex-col justify-end shadow-inner ${
          mobileView === "map" ? "flex h-full" : "hidden lg:flex lg:h-full"
        }`}>
          
          {/* Map Watermark & Control Overlay */}
          <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md border border-bento-dark/10 p-2.5 rounded-2xl max-w-[200px] pointer-events-auto shadow-sm">
              <span className="text-[9px] font-mono font-bold text-bento-green block mb-0.5">MAP VIEWPORT</span>
              <span className="text-[11px] font-bold text-bento-dark block">강원 안심 보행 관측도</span>
              <span className="text-[9px] text-bento-dark/50 block leading-tight mt-0.5">정선·태백·삼척·고성 시범 노선 및 인근 우회도</span>
            </div>

            <div className="flex flex-col gap-2 pointer-events-auto">
              {/* Map layers toggler */}
              <button
                onClick={() => setMapType(mapType === "standard" ? "topographical" : "standard")}
                className="p-2.5 bg-white/90 backdrop-blur-md border border-bento-dark/10 rounded-xl text-bento-dark hover:bg-white shadow-xs cursor-pointer flex items-center justify-center"
                title="지도 보기 전환"
              >
                <Layers size={14} />
              </button>
              {nearMeActive && (
                <button
                  onClick={() => {
                    setNearMeActive(false);
                    setActivePin(null);
                  }}
                  className="px-2.5 py-1.5 bg-red-100 text-red-800 text-[9px] font-bold rounded-lg border border-red-200 cursor-pointer shadow-xs"
                >
                  주변필터 끄기 X
                </button>
              )}
            </div>
          </div>

          {/* Floating radar effect */}
          {radarRipple && (
            <div className="absolute inset-0 bg-bento-green/5 z-20 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 rounded-full border border-bento-green/30 animate-ping absolute" />
              <div className="w-24 h-24 rounded-full border-2 border-bento-green/20 animate-pulse absolute" />
              <span className="text-xs text-bento-green font-bold tracking-widest uppercase font-mono bg-white/95 px-4 py-2 rounded-full border border-bento-green/20 shadow-sm flex items-center gap-2">
                <Radio size={14} className="animate-spin-slow text-bento-green" />
                <span>내 주변 한산 스팟 검색 중...</span>
              </span>
            </div>
          )}

          {/* MAP BACKGROUND CANVAS */}
          <div className="absolute inset-0 z-0 bg-[#E8F0F8] transition-colors duration-500 overflow-hidden">
            
            {/* Visual representations of GANGWON using styled CSS circles/shapes */}
            {/* Sea on right */}
            <div className="absolute right-0 top-0 bottom-0 w-[15%] bg-[#D0E2F5] border-l border-[#A6C4E3]" />
            
            {/* Sea label */}
            <div className="absolute right-[4%] top-[10%] select-none font-mono text-[9px] font-black tracking-widest text-[#5E8BB8] uppercase [writing-mode:vertical-lr]">
              EAST SEA · 동해
            </div>

            {/* Mountains drawing (Topographical Map Preset) */}
            {mapType === "topographical" ? (
              <div className="absolute inset-0 opacity-40">
                {/* Mountain ridge lines */}
                <div className="absolute top-[20%] left-[10%] w-[35%] h-[40%] bg-[#D7E2CD] rounded-full blur-3xl" />
                <div className="absolute top-[40%] left-[30%] w-[45%] h-[50%] bg-[#CCD7BF] rounded-full blur-3xl" />
                <div className="absolute top-[10%] left-[25%] w-[25%] h-[30%] bg-[#E5ECE0] rounded-full blur-2xl" />
                
                {/* Topo line contours simulation */}
                <svg className="w-full h-full text-bento-dark/5" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M 0,20 Q 20,25 35,10 T 70,5" fill="none" stroke="currentColor" strokeWidth="0.2" strokeDasharray="1,1" />
                  <path d="M 0,40 Q 30,45 55,20 T 90,15" fill="none" stroke="currentColor" strokeWidth="0.2" />
                  <path d="M 10,60 Q 40,65 65,40 T 90,35" fill="none" stroke="currentColor" strokeWidth="0.2" />
                  <path d="M 20,80 Q 50,85 75,60 T 100,55" fill="none" stroke="currentColor" strokeWidth="0.2" strokeDasharray="1,1" />
                </svg>
              </div>
            ) : (
              // Standard light clean map representation
              <div className="absolute inset-0 bg-[#F2F6F0]">
                <div className="absolute top-[15%] left-[15%] w-[40%] h-[50%] border border-bento-dark/[0.03] rounded-full" />
                <div className="absolute top-[35%] left-[35%] w-[35%] h-[45%] border border-bento-dark/[0.03] rounded-full" />
              </div>
            )}

            {/* County visual boundaries & text overlays */}
            <div className="absolute top-[12%] left-[18%] opacity-30 select-none pointer-events-none text-center">
              <span className="font-display font-black text-xs text-bento-dark/40 tracking-wider">고성군</span>
            </div>
            <div className="absolute top-[40%] left-[45%] opacity-30 select-none pointer-events-none text-center">
              <span className="font-display font-black text-xs text-bento-dark/40 tracking-wider">정선군</span>
            </div>
            <div className="absolute top-[72%] left-[65%] opacity-30 select-none pointer-events-none text-center">
              <span className="font-display font-black text-xs text-bento-dark/40 tracking-wider">태백시</span>
            </div>
            <div className="absolute top-[48%] left-[78%] opacity-30 select-none pointer-events-none text-center">
              <span className="font-display font-black text-xs text-bento-dark/40 tracking-wider">삼척시</span>
            </div>

            {/* PLOT DESTINATIONS PINS */}
            {mockDestinations.map((dest) => {
              const coords = coordinateMap[dest.id] || { x: 50, y: 50 };
              const isActive = activePin?.id === dest.id;
              const meets = meetsFilterConditions(dest);
              const colorClass = getPinColor(dest);

              return (
                <button
                  key={dest.id}
                  onClick={() => meets && setActivePin(dest)}
                  disabled={!meets}
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-all cursor-pointer group"
                  style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                >
                  {/* Active marker glow ring */}
                  {isActive && (
                    <div className="absolute inset-0 w-8 h-8 -left-1.5 -top-1.5 bg-bento-green/20 border border-bento-green/40 rounded-full animate-ping" />
                  )}

                  {/* Marker body pin */}
                  <div className={`px-2.5 py-1.5 rounded-full border font-bold text-[10px] flex items-center gap-1 shadow-sm transition-all duration-300 ${colorClass} ${
                    isActive ? "scale-115 ring-2 ring-white" : "hover:scale-105"
                  }`}>
                    <MapPin size={10} className={isActive ? "animate-bounce" : ""} />
                    <span className="truncate max-w-[80px] font-display font-black tracking-tight">{dest.name.split(" ")[1] || dest.name}</span>
                  </div>

                  {/* Dimmed indicator diagonal slash icon overlay */}
                  {!meets && (
                    <div className="absolute inset-0 bg-gray-500/20 rounded-full backdrop-blur-[0.5px] border border-gray-400 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-gray-600 block">X</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* BOTTOM FLOATING ACTOR: "내 주변 한산한 곳" RECALCULATOR PRESSET */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
            <button
              onClick={handleNearMeQuery}
              className="px-4.5 py-3.5 bg-bento-dark hover:bg-bento-dark/95 active:scale-95 text-white text-xs font-bold rounded-full shadow-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Navigation size={13} className="animate-pulse text-bento-olive" />
              <span>내 주변 한산한 안심길 재검색</span>
            </button>
          </div>

          {/* SLIDING MAP MINI DRAWER: Clicking on a pin slides up details */}
          <AnimatePresence>
            {activePin !== null && (
              <motion.div
                initial={{ y: "110%", opacity: 0.5 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "110%", opacity: 0.5 }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="relative w-[calc(100%-2rem)] max-w-md mx-auto mb-4 bg-white border border-bento-dark/10 rounded-3xl p-4.5 shadow-xl z-40 flex gap-4 items-center"
              >
                <button
                  onClick={() => setActivePin(null)}
                  className="absolute top-3.5 right-3.5 w-6 h-6 rounded-full bg-bento-bg flex items-center justify-center text-bento-dark/50 hover:text-bento-dark cursor-pointer"
                >
                  <X size={12} />
                </button>

                <img
                  src={activePin.image}
                  alt={activePin.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-bento-dark/5"
                />

                <div className="min-w-0 flex-1 space-y-1.5 text-left">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-mono font-bold text-bento-green uppercase bg-bento-green/10 px-2 py-0.5 rounded-md">
                      {activePin.region}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      activePin.congestionLevel <= 20 
                        ? "bg-emerald-150 text-emerald-800" 
                        : activePin.congestionLevel <= 50 
                        ? "bg-amber-150 text-amber-800" 
                        : "bg-red-150 text-red-800"
                    }`}>
                      ● 혼잡도 {activePin.congestionLevel}%
                    </span>
                  </div>

                  <h4 className="font-display font-black text-sm text-bento-dark tracking-tight leading-none">
                    {activePin.name}
                  </h4>

                  <p className="text-[10px] text-bento-dark/50 truncate leading-relaxed">
                    {activePin.accessibility.note}
                  </p>

                  <div className="pt-1.5 flex gap-2 shrink-0">
                    <button
                      onClick={() => onSelectDestination(activePin)}
                      className="px-3.5 py-2 bg-bento-green hover:bg-bento-green/90 text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>상세정보</span>
                      <ArrowRight size={10} />
                    </button>
                    <button
                      onClick={() => {
                        setToastMessage(`${activePin.name} 안심 대안 경로가 GPS 및 지도 오버레이에 정상 매칭되었습니다. (출발: 삼척시 근덕면 공영주차장)`);
                      }}
                      className="px-3 py-2 bg-bento-dark hover:bg-bento-dark/95 text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>경로 안내</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

      {/* 2. PREMIUM ACCESSIBLE FLOATING TOAST (REPLACES BROWSER ALERTS) */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:max-w-md bg-bento-dark text-white p-4.5 rounded-2xl shadow-xl z-[200] border border-white/10 flex items-start gap-3.5"
          >
            <div className="w-5 h-5 rounded-full bg-bento-green flex items-center justify-center text-white shrink-0 mt-0.5">
              <Check size={12} />
            </div>
            <div className="flex-1 text-left">
              <h5 className="text-xs font-black text-bento-green tracking-wide">실시간 경로 매칭 성공</h5>
              <p className="text-[11px] text-white/80 leading-relaxed mt-1 font-medium">{toastMessage}</p>
            </div>
            <button 
              onClick={() => setToastMessage(null)}
              className="text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
