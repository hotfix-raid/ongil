import { motion } from "motion/react";
import { TrendingUp, Users, Smile } from "lucide-react";

export default function ImpactSection() {
  const stats = [
    {
      value: "30%+",
      label: "노출 가중치 확대",
      metric: "인구감소지역 관광지 노출 빈도",
      description: "기존의 소외받던 강원도 89개 인구 감소 권역 명소들이 온길의 분산 필터 가중에 따라 최상위로 추천되어 지역 상권으로의 방문을 유도합니다.",
      icon: <TrendingUp className="text-bento-green" size={24} />,
      bgColor: "bg-bento-bg"
    },
    {
      value: "15%+",
      label: "자연스러운 교통 분산",
      metric: "과밀지 인근 대안 이동 전환율",
      description: "인파 예측이 경보 수준에 도달할 때, 사용자 10명 중 1.5명 이상이 실시간 팝업 안내를 통해 인근의 평화로운 로컬 명소로 발길을 선회합니다.",
      icon: <Users className="text-bento-green" size={24} />,
      bgColor: "bg-bento-bg"
    },
    {
      value: "96.4%",
      label: "포용적 관광 만족",
      metric: "교통 약자 / 댕댕이 가족 만족 지표",
      description: "더 이상 주차장에서 계단을 목격하고 헛걸음하지 않습니다. 사전에 완벽히 필터링된 두루누비 무장애 코스를 통해 차별 없는 쾌적한 피서를 체감합니다.",
      icon: <Smile className="text-bento-green" size={24} />,
      bgColor: "bg-bento-bg"
    }
  ];

  return (
    <section id="impact" className="py-24 bg-bento-bg text-bento-dark overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono font-bold tracking-widest text-bento-green uppercase block mb-3">
            Expected Socio-Economic Impact
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-black text-bento-dark tracking-tight leading-snug mb-6">
            데이터가 그리는 <span className="text-bento-green">기대 효과</span>
          </h2>
          <p className="text-bento-dark/80 text-sm sm:text-base leading-relaxed">
            온길은 관광객들의 단순 분산을 유도하는 것을 넘어, 
            로컬 상권에는 활력을, 교통 약자들에게는 완전한 보행권을 제공하는 지속 가능한 생태계를 구현합니다.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className="bg-white rounded-3xl border border-bento-dark/10 p-8 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-bento-bg flex items-center justify-center">
                    {stat.icon}
                  </div>
                  <span className="text-[10px] text-bento-dark/40 font-mono font-bold uppercase">
                    {stat.label}
                  </span>
                </div>

                <span className="block text-4xl sm:text-5xl font-display font-black text-bento-green tracking-tight mb-2">
                  {stat.value}
                </span>
                
                <h3 className="text-sm font-display font-black text-bento-dark mb-3">
                  {stat.metric}
                </h3>
              </div>

              <p className="text-bento-dark/60 text-xs sm:text-sm leading-relaxed border-t border-bento-dark/5 pt-4 mt-4">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
