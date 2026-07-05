import { motion } from "motion/react";
import { TrendingDown, MapPin, Footprints, CloudSun, ShieldCheck } from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      icon: <TrendingDown className="text-white" size={20} />,
      badge: "빅데이터 예측",
      title: "혼잡도 회피 추천",
      description: "향후 30일 동안의 인구 밀집도와 방문자 집중률 데이터를 기계 학습 기반 모델로 예측합니다. 휴일 교통 체증과 인파 지수를 완벽히 피해 '덜 붐비는 가장 여유로운 시점'을 제안합니다.",
      bulletPoints: ["30일 밀집 흐름 예측", "대기 시간 60% 단축", "실시간 인파 분산"]
    },
    {
      icon: <MapPin className="text-white" size={20} />,
      badge: "지역 상생 매칭",
      title: "인근 대안 추천",
      description: "소셜 미디어나 지도 앱에서 포화 상태인 핫플레이스를 탐색할 때, 동일한 미학적·경험적 만족도를 보장하면서 훨씬 쾌적한 인근 인구감소 시군의 저활용 관광지를 맞춤 큐레이션합니다.",
      bulletPoints: ["유사 가치 알고리즘", "소멸 우려 시군 우선", "로컬 상권 활성화"]
    },
    {
      icon: <Footprints className="text-white" size={20} />,
      badge: "이동 장벽 해소",
      title: "맞춤형 접근성 필터",
      description: "반려가구, 휠체어 이용 고령자, 유모차 동반 가족이 편안히 여행할 수 있는 인프라를 보장합니다. 한국관광공사의 두루누비 및 열린 관광지 데이터베이스와 융합해 실시간 휠체어 전용 코스를 자동 설계합니다.",
      bulletPoints: ["무장애 목재 덱 안내", "반려동물 규정 검증", "유모차 완경사 경로"]
    },
    {
      icon: <CloudSun className="text-white" size={20} />,
      badge: "기후 환경 자동 제어",
      title: "날씨·체감환경 보정",
      description: "기상청 초단기 예보와 에어코리아 대기오염 정보를 즉시 연동합니다. 여행 예정 시점에 심각한 폭염, 강풍, 폭우 또는 초미세먼지가 감지되면, 해당 권역의 맞춤형 실내 문화 시설 및 숲그늘 대안으로 자동 매칭합니다.",
      bulletPoints: ["대기 수치 연동 보정", "위험 기후 자동 대피", "실내 문화재 매칭"]
    }
  ];

  return (
    <section id="features" className="py-24 bg-bento-dark text-white relative">
      {/* Decorative backdrop glow */}
      <div className="absolute top-1/3 right-10 w-80 h-80 bg-bento-green/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-10 w-80 h-80 bg-bento-moss/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-xs font-mono font-bold tracking-widest text-bento-sand uppercase block mb-3">
            Core Engine & Capabilities
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-black text-white tracking-tight leading-snug mb-6">
            관광의 흐름을 재설계하는 <br />
            <span className="text-bento-olive">온길의 4가지 지능형 기술</span>
          </h2>
          <p className="text-bento-olive/80 text-base sm:text-lg leading-relaxed">
            단순히 여행 경로를 기록하거나 조회하는 데 그치지 않습니다. 
            온길은 독자적인 데이터 파이프라인을 통과시켜, 환경적·물리적 한계를 넘어선 
            <strong> '모두를 위한 균형 잡힌 숨쉬는 지도'</strong>를 가시화합니다.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="bg-white/5 border border-white/10 hover:border-bento-moss/40 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 shadow-xs group flex flex-col justify-between"
            >
              <div>
                {/* Icon & Badge */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 rounded-full bg-bento-green border border-white/10 flex items-center justify-center text-white shadow-xs">
                    {feat.icon}
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-bento-sand bg-white/10 border border-white/15 px-3 py-1 rounded-full uppercase">
                    {feat.badge}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-display font-black text-white mb-4 group-hover:text-bento-olive transition-colors">
                  {feat.title}
                </h3>

                {/* Description */}
                <p className="text-bento-olive/80 text-sm sm:text-base leading-relaxed mb-6">
                  {feat.description}
                </p>
              </div>

              {/* Bullets List */}
              <div className="border-t border-white/10 pt-5 mt-auto">
                <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {feat.bulletPoints.map((bullet, bIdx) => (
                    <li key={bIdx} className="flex items-center gap-1.5 text-xs text-bento-sand/70">
                      <ShieldCheck size={12} className="text-bento-moss shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
