import { trustAPIs } from "../data/simulationData";
import { ShieldCheck } from "lucide-react";

export default function DataTrustSection() {
  return (
    <section id="trust" className="py-20 bg-bento-dark text-white relative overflow-hidden border-y border-white/5">
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-bento-green/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-sans font-semibold tracking-wider text-bento-sand/80 block mb-3">
            Data Sources
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight leading-snug mb-4">
            공공·민간 오픈 API 기반의 높은 신뢰도
          </h2>
          <p className="text-bento-olive/80 text-xs sm:text-sm leading-relaxed">
            온길은 공식 부처와 민간 데이터의 실시간 정보를 가공하여 신뢰할 수 있는 추천을 제공합니다.
          </p>
        </div>

        {/* Logo/Badge Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {trustAPIs.map((api, idx) => (
            <div 
              key={idx} 
              className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-bento-moss hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-base ease-out-soft shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Simulated Logo Emblem */}
                <div className="flex items-center justify-between mb-4">
                  <div className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-sm text-[10px] font-semibold tracking-wider text-bento-sand">
                    {api.logoText}
                  </div>
                  <span className="text-[9px] text-bento-olive font-sans font-semibold">
                    {api.badge}
                  </span>
                </div>
                
                <h3 className="text-sm font-display font-black text-white mb-2">
                  {api.name}
                </h3>
              </div>
              
              <p className="text-[11px] text-bento-olive/90 leading-normal mt-2 border-t border-white/10 pt-4">
                {api.description}
              </p>
            </div>
          ))}
        </div>

        {/* Trust Footer Bullet */}
        <div className="mt-12 max-w-xl mx-auto bg-white/5 border border-white/10 rounded-md px-5 py-3 flex items-center justify-center gap-2 text-center text-[11px] text-bento-olive">
          <ShieldCheck size={14} className="text-bento-moss shrink-0" />
          <span>온길은 매 10분 주기로 실시간 데이터를 동기화합니다.</span>
        </div>

      </div>
    </section>
  );
}
