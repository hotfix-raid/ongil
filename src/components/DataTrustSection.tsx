import { trustAPIs } from "../data/simulationData";
import { ShieldCheck } from "lucide-react";

export default function DataTrustSection() {
  return (
    <section id="trust" className="py-20 bg-bento-dark text-white relative overflow-hidden border-y border-white/5">
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-bento-green/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono font-bold tracking-widest text-bento-sand uppercase block mb-3">
            Trusted Data Integrations
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight leading-snug mb-4">
            공공 및 민간 오픈 API 기반의 높은 신뢰도
          </h2>
          <p className="text-bento-olive/80 text-xs sm:text-sm leading-relaxed">
            온길의 모든 알고리즘은 자체적인 허위 마케팅 점수가 아닌, 
            대한민국 공식 부처와 민간 빅데이터 망에서 송출하는 공인 실시간 데이터를 정제 가공하여 가동됩니다.
          </p>
        </div>

        {/* Logo/Badge Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {trustAPIs.map((api, idx) => (
            <div 
              key={idx} 
              className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-bento-moss hover:bg-white/10 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Simulated Logo Emblem */}
                <div className="flex items-center justify-between mb-4">
                  <div className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-mono font-bold tracking-wider text-bento-sand">
                    {api.logoText}
                  </div>
                  <span className="text-[9px] text-bento-olive font-mono font-bold">
                    {api.badge}
                  </span>
                </div>
                
                <h3 className="text-sm font-display font-black text-white mb-2">
                  {api.name}
                </h3>
              </div>
              
              <p className="text-[11px] text-bento-olive/90 leading-normal mt-2 border-t border-white/5 pt-4">
                {api.description}
              </p>
            </div>
          ))}
        </div>

        {/* Trust Footer Bullet */}
        <div className="mt-12 max-w-xl mx-auto bg-white/5 border border-white/10 rounded-2xl px-5 py-3 flex items-center justify-center gap-2 text-center text-[11px] text-bento-olive">
          <ShieldCheck size={14} className="text-bento-moss shrink-0" />
          <span>온길은 매 10분 주기 스케줄링으로 실시간 동기화 상태를 유지합니다.</span>
        </div>

      </div>
    </section>
  );
}
