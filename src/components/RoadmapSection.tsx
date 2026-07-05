import { roadmapItems } from "../data/simulationData";
import { CheckCircle2, Play, Hourglass } from "lucide-react";

export default function RoadmapSection() {
  return (
    <section id="roadmap" className="py-24 bg-bento-dark text-white overflow-hidden relative border-t border-white/5">
      {/* Decorative ambient spots */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-bento-green/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <span className="text-xs font-sans font-semibold tracking-wider text-bento-sand/80 block mb-3">
            Timeline
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight leading-snug mb-6">
            서비스 로드맵
          </h2>
          <p className="text-bento-olive/80 text-sm sm:text-base leading-relaxed">
            2026년 강원도 4개 시군에서 데이터 검증을 시작으로, 
            전국으로 균형 있는 발전을 확장해 나갑니다.
          </p>
        </div>

        {/* Timeline List */}
        <div className="relative border-l border-white/10 ml-4 sm:ml-6 space-y-16">
          {roadmapItems.map((phase, idx) => {
            const isActive = phase.status === "active";
            const isCompleted = phase.status === "completed";

            return (
              <div key={idx} className="relative pl-8 sm:pl-10">
                
                {/* Timeline Marker Bullet */}
                <div className="absolute -left-[13px] top-1 z-10">
                  {isCompleted ? (
                    <div className="w-6 h-6 rounded-full bg-bento-moss border-4 border-bento-dark flex items-center justify-center text-bento-dark">
                      <CheckCircle2 size={10} />
                    </div>
                  ) : isActive ? (
                    <div className="w-6 h-6 rounded-full bg-bento-sand border-4 border-bento-dark flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-bento-dark" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/5 border-4 border-bento-dark flex items-center justify-center text-white/20">
                      <Hourglass size={10} />
                    </div>
                  )}

                  {isActive && (
                    <div className="absolute top-0 left-0 w-6 h-6 rounded-full bg-bento-sand border-4 border-bento-dark flex items-center justify-center text-bento-dark shadow-sm">
                      <Play size={8} className="fill-bento-dark text-bento-dark translate-x-px" />
                    </div>
                  )}
                </div>

                {/* Timeline Box */}
                <div className="space-y-4">
                  {/* Period & Badge */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-sm font-sans font-semibold text-bento-sand">
                      {phase.period}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-sans font-bold bg-white/10 text-bento-sand border border-bento-sand/30 px-2.5 py-0.5 rounded-sm">
                        현재 진행 중
                      </span>
                    )}
                    {!isActive && !isCompleted && (
                      <span className="text-[10px] font-sans font-medium bg-white/5 text-white/40 border border-white/5 px-2.5 py-0.5 rounded-sm">
                        예정
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl sm:text-2xl font-display font-black text-white">
                    {phase.title}
                  </h3>

                  {/* Bullet points detailed tasks */}
                  <ul className="space-y-3 pl-1">
                    {phase.items.map((item, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-bento-olive/80 leading-relaxed">
                        <span className="text-bento-sand shrink-0 mt-1">↳</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
