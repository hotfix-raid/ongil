import { motion } from "motion/react";
import { AlertTriangle, Map, NavigationOff, HeartHandshake } from "lucide-react";

export default function ProblemSection() {
  const problems = [
    {
      icon: <Map className="text-bento-green" size={24} />,
      title: "01. 공간적 불균형",
      subtitle: "Overcrowding",
      tagline: "인기 지역만 비정상적인 초밀집",
      description: "황리단길, 홍대, 애월 등 특정 명소에만 해마다 관광객이 폭발적으로 유입됩니다. 이로 인해 극심한 쓰레기 문제, 젠트리피케이션, 극심한 차량 적체가 유발되며, 바로 근처에 위치한 우수한 역사·경관 자원은 완전히 소외되고 있습니다.",
      bgClass: "bg-white"
    },
    {
      icon: <NavigationOff className="text-bento-dark" size={24} />,
      title: "02. 지역적 소멸",
      subtitle: "Demographic Decline",
      tagline: "행안부 지정 89개 인구감소지역",
      description: "로컬 경제를 살릴 수 있는 풍부한 테마와 둘레길을 가졌음에도, 기존 플랫폼의 검색 알고리즘 노출에서 제외되어 관광 실수요로 전환되지 못합니다. 이 불균형은 소멸 위기 지역의 영세 상권을 더욱 위축시킵니다.",
      bgClass: "bg-bento-sand/40"
    },
    {
      icon: <HeartHandshake className="text-bento-green" size={24} />,
      title: "03. 접근성 사각지대",
      subtitle: "Inaccessibility",
      tagline: "이동권 보장이 절실한 1,500만 가구",
      description: "약 1,500만 반려동물 양육 가구를 비롯해 휠체어 이용 고령자, 유모차 동행 가족 등 교통 약자들에게 '갈 수 있는 여행지' 정보는 극단적으로 부족합니다. 기존 추천 시스템은 이들의 특별한 필요조건을 전혀 거르지 못합니다.",
      bgClass: "bg-bento-olive/30"
    }
  ];

  return (
    <section id="problem" className="py-24 bg-bento-bg text-bento-dark overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <span className="text-xs font-sans font-semibold tracking-wider text-bento-green block mb-3">
            Why We Need Ongil
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-black text-bento-dark tracking-tight leading-snug mb-6">
            한국 관광이 직면한 <br />
            <span className="text-bento-green">3가지 구조적 불균형</span>
          </h2>
          <p className="text-bento-dark/80 text-base sm:text-lg leading-relaxed">
            기존 추천 방식은 오직 '개인 만족도'만 좇습니다. 
            그 결과, 인기 지역은 더 붐비고 소외된 곳은 영원히 숨겨집니다. 
            온길은 관광지의 가치와 <strong>지속가능성·포용성</strong>을 함께 설계합니다.
          </p>
        </div>

        {/* Problems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {problems.map((prob, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className={`${prob.bgClass} p-8 rounded-xl border border-border-subtle shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-bento-green/30 transition-all duration-base ease-out-soft relative flex flex-col justify-between`}
            >
              <div>
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm border border-border-subtle">
                  {prob.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-display font-extrabold text-bento-dark mb-1">
                  {prob.title}
                </h3>
                <span className="text-xs font-sans text-bento-dark/50 block mb-2">
                  {prob.subtitle}
                </span>
                <span className="text-xs font-bold text-bento-green block mb-4">
                  {prob.tagline}
                </span>
                <p className="text-bento-dark/80 text-sm sm:text-base leading-relaxed">
                  {prob.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Traditional vs Ideal Recommender Highlight */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12 bg-bento-moss/20 border border-bento-green/15 rounded-xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        >
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-white rounded-full text-bento-green shadow-sm border border-border-subtle mt-1">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 className="text-bento-dark font-display font-extrabold text-base sm:text-lg mb-1">
                악순환을 부르는 기존 추천 방식
              </h4>
              <p className="text-bento-dark/80 text-sm sm:text-base leading-relaxed max-w-3xl">
                블로그 검색, 인스타그램 핫플 지도, 일반 지도 앱의 평점 랭킹은 
                관광객 밀집 현상을 무한대로 순환시킵니다. 인구가 감소하는 시군에는 기회가 돌아가지 않고, 
                이동약자들은 매번 실시간 정보 부족으로 걸음을 돌립니다.
              </p>
            </div>
          </div>
          <div className="text-bento-dark/60 text-xs font-sans self-end md:self-auto shrink-0 bg-white/85 px-3 py-1.5 rounded-full border border-bento-green/15">
            KTO 빅데이터 팩트
          </div>
        </motion.div>

      </div>
    </section>
  );
}
