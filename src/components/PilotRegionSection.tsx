import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { pilotRegions } from "../data/simulationData";
import { 
  CheckCircle, ArrowUpRight, Award, Footprints, 
  Map, Trees, Compass, Eye, Leaf, Wind, Droplet, 
  Navigation, Sparkles, Layers, Cloud
} from "lucide-react";

export default function PilotRegionSection() {
  const [activeRegionId, setActiveRegionId] = useState("goseong");

  const activeRegion = pilotRegions.find(r => r.id === activeRegionId)!;

  // Icon mapping helper
  const getSpotIcon = (iconName: string) => {
    switch (iconName) {
      case "Anchor": return <AnchorIcon />;
      case "Trees": return <Trees className="text-bento-green" size={16} />;
      case "Compass": return <Compass className="text-bento-green" size={16} />;
      case "Leaf": return <Leaf className="text-bento-green" size={16} />;
      case "Eye": return <Eye className="text-bento-green" size={16} />;
      case "Sun": return <Sparkles className="text-bento-green" size={16} />;
      case "Wind": return <Wind className="text-bento-green" size={16} />;
      case "Droplet": return <Droplet className="text-bento-green" size={16} />;
      case "Navigation": return <Navigation className="text-bento-green" size={16} />;
      case "Sparkles": return <Sparkles className="text-bento-green" size={16} />;
      case "Layers": return <Layers className="text-bento-green" size={16} />;
      case "Cloud": return <Cloud className="text-bento-green" size={16} />;
      default: return <Trees className="text-bento-green" size={16} />;
    }
  };

  return (
    <section id="regions" className="py-24 bg-bento-bg text-bento-dark overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <span className="text-xs font-mono font-bold tracking-widest text-bento-green uppercase block mb-3">
            Initial Pilot Counties
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-black text-bento-dark tracking-tight leading-snug mb-6">
            강원도 소멸위기 4개 시군 <br />
            <span className="text-bento-green">초기 실증 및 상생 벨트 구축</span>
          </h2>
          <p className="text-bento-dark/80 text-sm sm:text-base leading-relaxed">
            온길은 데이터 실증 정확도를 확보하고 신속하게 성과를 창출하고자, 
            무장애 인프라 정비 수준이 양호하며 두루누비 걷기 코스가 가장 풍부한 
            <strong>정선, 태백, 삼척, 고성</strong> 4개 인구감소 고원·종단 지역을 파일럿으로 시작합니다.
          </p>
        </div>

        {/* Region Tabs and Display Block */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Tab buttons (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {pilotRegions.map((region) => {
              const isActive = region.id === activeRegionId;
              return (
                <button
                  key={region.id}
                  onClick={() => setActiveRegionId(region.id)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    isActive
                      ? "bg-white border-bento-green shadow-xs translate-x-1"
                      : "bg-white/60 border-bento-dark/10 hover:bg-white text-bento-dark/80"
                  }`}
                >
                  <div>
                    <h3 className={`font-display font-extrabold text-base sm:text-lg ${isActive ? "text-bento-green" : "text-bento-dark"}`}>
                      {region.name}
                    </h3>
                    <p className="text-xs text-bento-dark/50 mt-1 font-normal line-clamp-1">
                      {region.slogan}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono bg-bento-bg px-2.5 py-1 rounded-full border border-bento-dark/5 font-bold text-bento-dark/60">
                      배리어프리 {region.accessibilityScore}%
                    </span>
                    <ArrowUpRight size={16} className={isActive ? "text-bento-green" : "text-bento-dark/40"} />
                  </div>
                </button>
              );
            })}

            {/* Scale Expansion Card */}
            <div className="bg-bento-dark text-bento-sand rounded-3xl p-6 border border-bento-green/20 shadow-xs mt-2 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-mono font-bold tracking-widest text-bento-olive block mb-1">
                  FUTURE SCALING
                </span>
                <h4 className="font-display font-extrabold text-sm text-white mb-2">
                  7개 지자체 RTO 연계 로드맵
                </h4>
                <p className="text-bento-olive/80 text-[11px] leading-relaxed">
                  부산·인천·광주·세종·경북·강원·제주 등 전국 7대 지역관광기관과의 연동 설계를 완료하여, 
                  본 실증을 토대로 남부권 및 영남권 인구소멸 벨트로 단계적으로 즉각 확장해 나갑니다.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] text-bento-olive">
                <span>단계별 확대 기획 완료</span>
                <span className="font-mono">7 RTO Collaborative</span>
              </div>
            </div>
          </div>

          {/* Active Region details panel (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-bento-dark/10 shadow-xs overflow-hidden flex flex-col justify-between">
            
            {/* Image banner with overlay */}
            <div className="relative h-48 sm:h-56 bg-bento-bg">
              <img 
                src={activeRegion.imageUrl} 
                alt={activeRegion.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bento-dark/80 via-bento-dark/20 to-transparent" />
              
              <div className="absolute bottom-5 left-6 text-white">
                <span className="text-[10px] font-mono font-bold tracking-widest text-bento-moss block mb-1 uppercase">
                  PILOT {activeRegion.id.toUpperCase()}
                </span>
                <h3 className="text-xl sm:text-2xl font-display font-black">
                  {activeRegion.name}
                </h3>
              </div>
            </div>

            {/* Details content */}
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between gap-6">
              
              {/* Description and reasons */}
              <div className="space-y-4">
                <p className="text-bento-dark/80 text-xs sm:text-sm leading-relaxed">
                  {activeRegion.description}
                </p>

                {/* Key stats badges */}
                <div className="grid grid-cols-2 gap-3 pb-4 border-b border-bento-dark/10">
                  <div className="bg-bento-bg rounded-2xl p-3 flex items-center gap-3 border border-bento-dark/5">
                    <Award className="text-bento-green" size={20} />
                    <div>
                      <span className="text-[9px] text-bento-dark/40 block uppercase font-mono font-bold">접근성 안심 점수</span>
                      <span className="text-xs sm:text-sm font-extrabold text-bento-dark">{activeRegion.accessibilityScore}% 최우수</span>
                    </div>
                  </div>
                  <div className="bg-bento-bg rounded-2xl p-3 flex items-center gap-3 border border-bento-dark/5">
                    <Footprints className="text-bento-green" size={20} />
                    <div>
                      <span className="text-[9px] text-bento-dark/40 block uppercase font-mono font-bold">무장애 둘레길 코스</span>
                      <span className="text-xs sm:text-sm font-extrabold text-bento-dark">{activeRegion.duorunubiCount}개 안심 경로</span>
                    </div>
                  </div>
                </div>

                {/* Why this region is selected */}
                <div>
                  <h4 className="text-[10px] font-mono font-bold text-bento-dark/50 uppercase tracking-wider mb-2.5">
                    핵심 강점 및 분석 결과
                  </h4>
                  <ul className="space-y-2">
                    {activeRegion.reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-bento-dark/80">
                        <CheckCircle size={12} className="text-bento-green shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Signature spots list */}
              <div>
                <h4 className="text-[10px] font-mono font-bold text-bento-dark/50 uppercase tracking-wider mb-3">
                  온길 전용 추천 대안 스팟
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {activeRegion.keySpots.map((spot, idx) => (
                    <div key={idx} className="bg-bento-bg/50 hover:bg-bento-olive/15 border border-bento-dark/5 hover:border-bento-green/20 rounded-2xl p-3.5 transition-colors duration-300">
                      <div className="flex items-center gap-1.5 mb-1 text-bento-green font-display font-extrabold text-xs sm:text-sm">
                        {getSpotIcon(spot.icon)}
                        <span>{spot.name}</span>
                      </div>
                      <p className="text-[10px] text-bento-dark/60 leading-normal line-clamp-2">
                        {spot.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

// Custom simple fallback anchor icon
function AnchorIcon() {
  return (
    <svg 
      className="text-bento-green" 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="5" r="3" />
      <line x1="12" y1="22" x2="12" y2="8" />
      <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
    </svg>
  );
}
