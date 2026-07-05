import { motion } from "motion/react";
import { Compass, ChevronDown, Sparkles } from "lucide-react";
// @ts-ignore
import ongilHero from "../assets/images/ongil_hero_1783066591711.jpg";

interface HeroProps {
  onExploreClick: () => void;
}

export default function Hero({ onExploreClick }: HeroProps) {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 bg-bento-bg text-bento-dark">
      
      {/* Decorative background grid subtle overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a2f2305_1px,transparent_1px),linear-gradient(to_bottom,#1a2f2305_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      {/* Hero Bento Grid Layout */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Bento Box: Text Content & Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-8 bg-bento-olive p-8 md:p-12 rounded-3xl border border-bento-green/15 shadow-sm flex flex-col justify-between relative overflow-hidden"
          id="hero-main-box"
        >
          {/* Subtle decoration inside bento */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-bento-moss/20 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-bento-green/10 border border-bento-green/20 text-bento-green px-4 py-1.5 rounded-full text-xs font-semibold mb-8 backdrop-blur-xs">
              <Sparkles size={14} className="animate-pulse" />
              <span>공공데이터 기반 지능형 관광 흐름 설계 엔진</span>
            </div>

            {/* Title / Slogan */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-black tracking-tight text-bento-dark mb-6 leading-[1.15]">
              덜 붐비는 여행, <br className="sm:hidden" />
              <span className="text-bento-green">
                더 넓은 발견
              </span>
            </h1>

            {/* Definition */}
            <p className="text-base sm:text-lg text-bento-dark/85 max-w-2xl mb-12 leading-relaxed">
              기존 서비스가 단순히 인기 명소를 답습할 때, 온길은 다른 길을 제시합니다.{" "}
              <br className="hidden md:inline" />
              혼잡도 예측 데이터, 접근성 필터, 그리고 지역 상생 균형을 결합해{" "}
              <span className="text-bento-green font-bold">진정한 상생형 맞춤형 관광 흐름</span>을 설계합니다.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onExploreClick}
              className="w-full sm:w-auto px-8 py-4 bg-bento-green hover:bg-bento-dark text-white font-semibold rounded-full shadow-xs transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-base cursor-pointer"
              id="hero-explore-btn"
            >
              <Compass size={18} className="animate-spin-slow" />
              온길 살펴보기
            </button>
            
            <a
              href="#simulator"
              className="w-full sm:w-auto px-8 py-4 bg-bento-dark hover:bg-bento-green text-white font-medium rounded-full transition-all flex items-center justify-center gap-2 text-base shadow-xs"
              id="hero-simulator-link"
            >
              대안 추천 체험하기
            </a>
          </div>
        </motion.div>

        {/* Side Bento Box: Large Scenic Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-4 h-[320px] lg:h-auto rounded-3xl overflow-hidden relative group border border-bento-green/15 shadow-sm bg-bento-sand flex flex-col justify-end"
          id="hero-image-box"
        >
          {/* Background Image with elegant overlay */}
          <img
            src={ongilHero}
            alt="온길 강원도 고요한 경관"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            style={{ filter: "brightness(0.9) contrast(1.05)" }}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bento-dark/80 via-bento-dark/20 to-transparent" />
          
          {/* Badge overlays on image */}
          <div className="relative z-10 p-6 text-white">
            <p className="text-xs font-mono tracking-widest uppercase text-bento-sand/80 mb-1">Scenic Pilot Region</p>
            <h3 className="text-xl font-bold tracking-tight">강원도 인구감소지역</h3>
            <p className="text-xs text-white/70 mt-1">영월 · 정선 · 삼척 · 태백</p>
          </div>
        </motion.div>

      </div>

      {/* Bottom Scroll Cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 cursor-pointer hidden lg:flex"
        onClick={onExploreClick}
      >
        <span className="text-[10px] text-bento-dark/50 font-mono tracking-widest uppercase">Scroll</span>
        <ChevronDown size={16} className="text-bento-green" />
      </motion.div>
    </section>
  );
}
