import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { popularDestinations, alternativeDestinations } from "../data/simulationData";
import { 
  Flame, CheckCircle2, AlertTriangle, ShieldCheck, 
  Dog, Accessibility, CloudSun, Compass, MapPin, 
  ArrowRight, Thermometer, Wind, RefreshCw, Calendar
} from "lucide-react";

export default function SimulatorSection() {
  const [selectedPopId, setSelectedPopId] = useState("g-beach");
  const [petFilter, setPetFilter] = useState(false);
  const [accessibleFilter, setAccessibleFilter] = useState(false);
  const [weatherCondition, setWeatherCondition] = useState<"sunny" | "heatwave" | "finedust">("sunny");

  // Find selected popular spot and its alternative
  const popularSpot = popularDestinations.find(d => d.id === selectedPopId)!;
  const alternativeSpot = alternativeDestinations.find(alt => alt.id === popularSpot.alternativeId)!;

  // Simulate dynamic weather adjustments
  const getWeatherImpact = () => {
    if (weatherCondition === "heatwave") {
      return {
        title: "☀️ 폭염 경보 발동 (체감 35℃)",
        alert: "고온 환경으로 장시간 야외 대기가 불가능합니다. 그늘막 부족.",
        ongilSolution: `시원한 고원 기후인 [${alternativeSpot.regionName}]을 매칭하고, 폭염 대피 특화 그늘 덱 및 셔틀 동선으로 조정합니다.`,
        altIndoor: popularSpot.weatherIndoorAlt ? `${alternativeSpot.regionName} 기후 치유관 및 산림 휴양관` : "인근 평온한 실내 대안관"
      };
    }
    if (weatherCondition === "finedust") {
      return {
        title: "😷 초미세먼지 '매우 나쁨' (95㎍/㎥)",
        alert: "야외 보행 활동 시 호흡기 질환 우려, 마스크 필수 야외 밀집지.",
        ongilSolution: `에어코리아 청정 지수 분석 결과 우수한 녹지대 및 실내 코스 [${popularSpot.weatherIndoorAlt || "인근 실내 전시관"}]을 연계 추천합니다.`,
        altIndoor: popularSpot.weatherIndoorAlt || "국립 과학전시관"
      };
    }
    return null;
  };

  const weatherImpact = getWeatherImpact();

  return (
    <section id="simulator" className="py-24 bg-bento-bg text-bento-dark border-y border-bento-dark/10">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono font-bold tracking-widest text-bento-green uppercase block mb-3">
            Interactive Experience
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-black text-bento-dark tracking-tight leading-snug mb-6">
            데이터 융합의 차이를 느끼는 <br />
            <span className="text-bento-green">온길 모바일 시뮬레이터</span>
          </h2>
          <p className="text-bento-dark/80 text-sm sm:text-base leading-relaxed">
            가고 싶은 번잡한 대표 관광지를 클릭하고 필터를 작동시켜 보세요. 
            온길의 예측·필터링·환경 보정 엔진이 <strong>실시간으로 대안을 설계하고 교통 약자의 동선을 확보</strong>하는 흐름을 확인하실 수 있습니다.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Panel: Control Center (4 Cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-bento-dark/10 shadow-xs p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-4 mb-6 border-b border-bento-dark/15">
                <Compass className="text-bento-green animate-spin-slow" size={20} />
                <h3 className="font-display font-extrabold text-base text-bento-dark">가상 여행 시뮬레이터</h3>
              </div>

              {/* Step 1: Select Hotspot */}
              <div className="mb-6">
                <label className="block text-[10px] font-mono font-bold text-bento-dark/60 uppercase tracking-wider mb-3">
                  단계 1: 원하는 기존 핫플레이스 선택
                </label>
                <div className="space-y-2">
                  {popularDestinations.map((dest) => (
                    <button
                      key={dest.id}
                      onClick={() => setSelectedPopId(dest.id)}
                      className={`w-full text-left px-4 py-3 rounded-2xl border transition-all text-sm font-medium flex items-center justify-between cursor-pointer ${
                        selectedPopId === dest.id
                          ? "bg-bento-olive border-bento-green/40 text-bento-dark shadow-xs font-bold"
                          : "bg-bento-bg/40 border-bento-dark/10 text-bento-dark/80 hover:bg-bento-olive/20"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-display font-bold">{dest.name}</span>
                        <span className="text-[10px] text-bento-dark/50 font-normal">{dest.regionName} · {dest.category}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Flame size={12} className={dest.congestionLevel > 90 ? "text-red-500 animate-pulse" : "text-amber-500"} />
                        <span className="text-xs font-mono">{dest.congestionLevel}%</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Accessibility Filters */}
              <div className="mb-6 border-t border-bento-dark/10 pt-5">
                <label className="block text-[10px] font-mono font-bold text-bento-dark/60 uppercase tracking-wider mb-3">
                  단계 2: 이동 장벽/취약 요소 선택 (필터)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPetFilter(!petFilter)}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      petFilter
                        ? "bg-bento-dark border-bento-dark text-white"
                        : "bg-bento-bg border-bento-dark/10 text-bento-dark/80 hover:bg-bento-olive/20"
                    }`}
                  >
                    <Dog size={14} />
                    <span>반려동물 동반</span>
                  </button>
                  <button
                    onClick={() => setAccessibleFilter(!accessibleFilter)}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      accessibleFilter
                        ? "bg-bento-dark border-bento-dark text-white"
                        : "bg-bento-bg border-bento-dark/10 text-bento-dark/80 hover:bg-bento-olive/20"
                    }`}
                  >
                    <Accessibility size={14} />
                    <span>무장애 (유모차/휠체어)</span>
                  </button>
                </div>
              </div>

              {/* Step 3: Weather Anomaly Simulation */}
              <div className="border-t border-bento-dark/10 pt-5">
                <label className="block text-[10px] font-mono font-bold text-bento-dark/60 uppercase tracking-wider mb-3">
                  단계 3: 기상 및 미세먼지 환경 제어
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "sunny", label: "맑은 봄날", icon: "☀️" },
                    { id: "heatwave", label: "여름 폭염", icon: "🌡️" },
                    { id: "finedust", label: "미세먼지", icon: "😷" }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setWeatherCondition(item.id as any)}
                      className={`py-2 rounded-xl border text-xs transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        weatherCondition === item.id
                          ? "bg-bento-green border-bento-green text-white font-bold"
                          : "bg-bento-bg border-bento-dark/10 text-bento-dark/70 hover:bg-bento-olive/20"
                      }`}
                    >
                      <span className="text-sm">{item.icon}</span>
                      <span className="text-[10px]">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Simulated reset */}
            <div className="mt-8 pt-4 border-t border-bento-dark/10 flex items-center justify-between text-[10px] text-bento-dark/40">
              <span className="font-mono">Ongil Engine v1.2</span>
              <button 
                onClick={() => {
                  setPetFilter(false);
                  setAccessibleFilter(false);
                  setWeatherCondition("sunny");
                  setSelectedPopId("g-beach");
                }}
                className="flex items-center gap-1 text-bento-green font-bold hover:underline cursor-pointer"
              >
                <RefreshCw size={10} />
                값 초기화
              </button>
            </div>
          </div>

          {/* Right Panel: Interactive Simulator Content (8 Cols) */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            
            {/* Box A: Traditional Recommender (Red Accent) */}
            <div className="bg-white rounded-3xl border border-bento-dark/10 shadow-xs flex flex-col overflow-hidden relative">
              {/* Top Warning header */}
              <div className="bg-red-50/50 border-b border-bento-dark/5 px-5 py-3.5 flex items-center justify-between text-red-950">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase">기존 포털·지도 추천</span>
                <span className="text-[9px] bg-red-100 text-red-800 font-extrabold px-2 py-0.5 rounded-full">과밀 지속</span>
              </div>
              
              {/* Content body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-base font-display font-extrabold text-bento-dark mb-0.5">{popularSpot.name}</h4>
                  <p className="text-xs text-bento-dark/50 mb-4">{popularSpot.regionName} · {popularSpot.category}</p>
                  
                  {/* Image placeholder */}
                  <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 bg-bento-bg">
                    <img 
                      src={popularSpot.imageUrl} 
                      alt={popularSpot.name} 
                      className="w-full h-full object-cover filter grayscale-15 opacity-90"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-red-900/10 mix-blend-multiply" />
                    <div className="absolute bottom-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <Flame size={12} className="animate-pulse" />
                      <span>혼잡 경보: {popularSpot.congestionLevel}%</span>
                    </div>
                  </div>

                  {/* Red flags */}
                  <div className="space-y-2.5">
                    <div className="bg-bento-bg/50 border border-bento-dark/5 rounded-2xl p-3.5 text-xs flex gap-2">
                      <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-bento-dark mb-0.5">실시간 집중 상태</p>
                        <p className="text-bento-dark/70 leading-relaxed">{popularSpot.tagline}</p>
                      </div>
                    </div>

                    <div className="bg-bento-bg/50 border border-bento-dark/5 rounded-2xl p-3.5 text-xs flex gap-2">
                      <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-bento-dark mb-0.5">이동약자 환경 검토</p>
                        <p className="text-bento-dark/70 leading-relaxed">{popularSpot.accessibility.details}</p>
                      </div>
                    </div>

                    {/* Conditional weather prompt inside traditional */}
                    {weatherImpact && (
                      <div className="bg-red-50 border border-red-200/40 rounded-2xl p-3.5 text-xs flex gap-2 text-red-950">
                        <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold mb-0.5">{weatherImpact.title}</p>
                          <p className="opacity-90 leading-relaxed">{weatherImpact.alert}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Footer */}
                <div className="mt-6 pt-4 border-t border-bento-dark/5 text-[10px] text-bento-dark/40 leading-relaxed">
                  ⚠️ 기존 플랫폼은 대안이 없으므로 날씨나 이동약자 여부와 관계없이 계속 방문을 유도해 만족도를 하락시킵니다.
                </div>
              </div>
            </div>

            {/* Box B: Ongil Balance Recommender (Green Accent) */}
            <div className="bg-bento-dark text-white rounded-3xl border border-bento-green/20 shadow-sm flex flex-col overflow-hidden relative">
              {/* Animated connection line effect */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-bento-moss to-bento-olive" />
              
              {/* Top Ongil header */}
              <div className="bg-white/5 border-b border-white/10 px-5 py-3.5 flex items-center justify-between text-bento-olive">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1">
                  <ShieldCheck size={14} className="text-bento-moss" />
                  온길 지능형 대안
                </span>
                <span className="text-[9px] bg-bento-green text-white font-extrabold px-2 py-0.5 rounded-full uppercase animate-pulse">최적 제안</span>
              </div>
              
              {/* Content body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-display font-extrabold text-white mb-0.5">{alternativeSpot.name}</h4>
                      <p className="text-xs text-bento-olive mb-4">{alternativeSpot.regionName} · {popularSpot.category} 테마</p>
                    </div>
                    <span className="text-[9px] font-mono bg-white/10 border border-white/10 text-bento-sand px-2 py-0.5 rounded-full font-bold">
                      {alternativeSpot.regionName}
                    </span>
                  </div>
                  
                  {/* Image placeholder */}
                  <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 bg-bento-dark/50">
                    <img 
                      src={alternativeSpot.imageUrl} 
                      alt={alternativeSpot.name} 
                      className="w-full h-full object-cover opacity-85"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-bento-dark/20 mix-blend-multiply" />
                    <div className="absolute bottom-3 left-3 bg-bento-green text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <CheckCircle2 size={12} className="text-white" />
                      <span>최저 밀집도: {alternativeSpot.congestionLevel}%</span>
                    </div>
                  </div>

                  {/* Safe features based on filters */}
                  <div className="space-y-2.5">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-xs">
                      <p className="font-bold text-bento-moss mb-0.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-bento-moss"></span>
                        상생 균형 가치
                      </p>
                      <p className="text-white/85 leading-relaxed">{alternativeSpot.valueProposition}</p>
                    </div>

                    {/* Dynamic: Pet feature */}
                    {petFilter && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-xs"
                      >
                        <p className="font-bold text-bento-sand mb-0.5 flex items-center gap-1.5">
                          <Dog size={12} />
                          댕댕이 프리 안심 팁
                        </p>
                        <p className="text-white/80 leading-relaxed">
                          {alternativeSpot.accessibility.petFriendly 
                            ? "✅ 이 지역은 공식 반려동물 출입 및 오프리시 댕수욕장 구역을 운영하고 있습니다." 
                            : "⚠️ 야외 보행이 매우 한적하여 반려동물이 안심할 수 있으나, 리드줄 상시 착용 필수 구역입니다."}
                        </p>
                      </motion.div>
                    )}

                    {/* Dynamic: Accessibility feature */}
                    {accessibleFilter && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-xs"
                      >
                        <p className="font-bold text-bento-olive mb-0.5 flex items-center gap-1.5">
                          <Accessibility size={12} />
                          무장애 & 두루누비 정보
                        </p>
                        <p className="text-white/80 leading-relaxed">
                          🛣️ {alternativeSpot.duorunubiPathName || "인접 배리어 프리 덱 로드 연결"}<br />
                          {alternativeSpot.accessibility.details}
                        </p>
                      </motion.div>
                    )}

                    {/* Dynamic: Weather Adjustment */}
                    {weatherImpact && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-bento-olive/10 border border-bento-olive/20 rounded-2xl p-3.5 text-xs text-bento-sand"
                      >
                        <p className="font-bold mb-1 flex items-center gap-1 text-bento-olive">
                          <CloudSun size={12} />
                          온길 실시간 환경 큐레이션
                        </p>
                        <p className="opacity-90 leading-relaxed mb-1.5">
                          {weatherImpact.ongilSolution}
                        </p>
                        <span className="inline-block bg-bento-green/80 text-white text-[9px] px-2.5 py-0.5 rounded-full font-medium">
                          실내 대피처 연계: {weatherImpact.altIndoor}
                        </span>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* CTA / Recommended Time */}
                <div className="mt-6 pt-4 border-t border-white/10 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1 text-bento-olive">
                    <Calendar size={12} />
                    <span>추천 보행 시간: {alternativeSpot.recommendedTime}</span>
                  </div>
                  <a 
                    href="#beta"
                    className="bg-bento-green hover:bg-white hover:text-bento-dark text-white font-bold px-4 py-1.5 rounded-full text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-xs uppercase tracking-wider"
                  >
                    <span>온길 코스 받기</span>
                    <ArrowRight size={10} />
                  </a>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
