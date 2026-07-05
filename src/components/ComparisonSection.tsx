import { motion } from "motion/react";
import { Check, X, ShieldCheck } from "lucide-react";

export default function ComparisonSection() {
  const comparisonData = [
    {
      category: "추천 목적 (Objective)",
      traditional: "단순 사용자 만족 극대화 (개인 선호 중심)",
      ongil: "사용자 만족 + 관광 흐름의 물리적 균형 및 상생",
      isHighlighted: true
    },
    {
      category: "데이터 소스 (Data Utilization)",
      traditional: "지도 좌표, 단순 평점, 리뷰 개수 중심",
      ongil: "위치·평점 + 30일 집중률 예측 + 공공 접근성 검증 데이터",
      isHighlighted: false
    },
    {
      category: "지역 노출 가중치 (Regional Balance)",
      traditional: "상위 5% 초인기 클러스터 무한 노출",
      ongil: "89개 인구감소지역 가중치 우선 배정 및 분산 노출",
      isHighlighted: false
    },
    {
      category: "수용 가능한 세그먼트 (Inclusivity)",
      traditional: "일반 대중 여행자 위주",
      ongil: "일반 + 반려동물 동반 + 유모차·휠체어·고령 피서객",
      isHighlighted: true
    }
  ];

  return (
    <section id="comparison" className="py-24 bg-bento-dark text-white overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-bento-green/10 rounded-full blur-[140px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono font-bold tracking-widest text-bento-sand uppercase block mb-3">
            Why Ongil is Different
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight leading-snug mb-6">
            기존 서비스와 온길의 확실한 차이
          </h2>
          <p className="text-bento-olive/80 text-sm sm:text-base leading-relaxed">
            단순한 '맛집 찾기'나 '대표 명소 순위'는 관광지의 과밀을 악화시키고 여행 만족도를 떨어뜨립니다. 
            온길은 <strong>관광 빅데이터 기반의 상생 흐름 제어</strong>를 통해 완전히 다른 만족을 제공합니다.
          </p>
        </div>

        {/* Comparison Table Desktop */}
        <div className="hidden md:block overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-6 text-xs font-mono font-bold uppercase tracking-wider text-bento-olive w-1/4">구분</th>
                <th className="p-6 text-xs font-mono font-bold uppercase tracking-wider text-white/50 w-3/8 flex items-center gap-2">
                  <X size={14} className="text-white/30" />
                  기존 추천 서비스
                </th>
                <th className="p-6 text-xs font-mono font-bold uppercase tracking-wider text-bento-sand w-3/8">
                  <span className="flex items-center gap-2 text-bento-sand">
                    <ShieldCheck size={16} className="text-bento-sand" />
                    온길(Ongil) 플랫폼
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {comparisonData.map((row, idx) => (
                <tr 
                  key={idx} 
                  className={`transition-colors ${
                    row.isHighlighted ? "bg-white/5 hover:bg-white/10" : "hover:bg-white/2"
                  }`}
                >
                  {/* Category */}
                  <td className="p-6 font-display font-black text-white text-sm sm:text-base">
                    {row.category}
                  </td>
                  
                  {/* Traditional */}
                  <td className="p-6 text-white/60 text-sm leading-relaxed">
                    <div className="flex items-start gap-2.5">
                      <X size={16} className="text-white/30 shrink-0 mt-1" />
                      <span>{row.traditional}</span>
                    </div>
                  </td>

                  {/* Ongil */}
                  <td className={`p-6 text-sm leading-relaxed font-semibold ${row.isHighlighted ? "text-bento-sand" : "text-bento-olive"}`}>
                    <div className="flex items-start gap-2.5">
                      <Check size={16} className="text-bento-moss shrink-0 mt-1" />
                      <span>{row.ongil}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Comparison Cards for Mobile */}
        <div className="md:hidden space-y-6">
          {comparisonData.map((row, idx) => (
            <div 
              key={idx} 
              className={`rounded-3xl border p-6 space-y-4 ${
                row.isHighlighted ? "bg-white/5 border-white/10" : "bg-white/2 border-white/5"
              }`}
            >
              <h3 className="text-white font-display font-black text-sm border-b border-white/5 pb-2.5">
                {row.category}
              </h3>
              
              <div className="space-y-3">
                {/* Traditional */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-white/40 uppercase flex items-center gap-1">
                    <X size={10} /> 기존 서비스
                  </span>
                  <p className="text-xs text-white/60 leading-relaxed pl-3.5 border-l border-white/10">
                    {row.traditional}
                  </p>
                </div>
                
                {/* Ongil */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-bento-sand uppercase flex items-center gap-1">
                    <Check size={10} /> 온길(Ongil)
                  </span>
                  <p className="text-xs text-bento-olive leading-relaxed pl-3.5 border-l border-bento-green">
                    {row.ongil}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
