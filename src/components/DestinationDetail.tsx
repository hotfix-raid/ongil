import React from "react";
import { motion } from "motion/react";
import { 
  X, 
  MapPin, 
  Heart, 
  Compass, 
  AlertTriangle, 
  Clock, 
  ParkingCircle, 
  Accessibility, 
  Info, 
  Navigation, 
  HelpCircle,
  EyeOff,
  Leaf,
  Baby,
  PawPrint
} from "lucide-react";
import { MockDestination } from "../data/destinations";

interface DestinationDetailProps {
  destination: MockDestination;
  onClose: () => void;
  isLiked: boolean;
  onToggleLike: (id: string) => void;
  onSelectAlternative?: (id: string) => void;
}

export default function DestinationDetail({
  destination,
  onClose,
  isLiked,
  onToggleLike,
  onSelectAlternative
}: DestinationDetailProps) {
  // Congestion Badge style helper
  const getCongestionStyle = (level: number) => {
    if (level <= 20) {
      return {
        bg: "bg-emerald-50 border-emerald-150 text-emerald-800",
        badge: "bg-emerald-500",
        text: "쾌적·한산 (보행 스트레스 매우 낮음)",
        desc: "실시간 밀도가 낮아 유모차, 전동 휠체어, 반려동물과 여유로운 교행이 완벽히 가능합니다."
      };
    } else if (level <= 50) {
      return {
        bg: "bg-amber-50 border-amber-150 text-amber-800",
        badge: "bg-amber-500",
        text: "보통 (쾌적한 교행 가능)",
        desc: "일부 쉼터 인근에 약한 밀집이 예상되나, 보행 및 산책 장애물 간격은 충분히 안전합니다."
      };
    } else {
      return {
        bg: "bg-red-50 border-red-150 text-red-800",
        badge: "bg-red-500",
        text: "혼잡·밀집 경보 (보행 장애 위험)",
        desc: "주말 집중 유입으로 보행 폭 교행 정체, 긴 주차 대기, 보행 약자의 피로 누적이 예상됩니다."
      };
    }
  };

  const cStyle = getCongestionStyle(destination.congestionLevel);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-4 overflow-hidden">
      {/* Dark backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-bento-dark/80 backdrop-blur-xs"
      />

      {/* Main Overlay Card */}
      <motion.div
        initial={{ y: "100%", opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0.5 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative bg-bento-bg w-full h-full md:h-[90vh] md:max-w-2xl md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden z-10"
      >
        {/* Immersive Hero Cover */}
        <div className="relative h-64 md:h-72 shrink-0">
          <img
            src={destination.image}
            alt={destination.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          {/* Subtle vignette gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-bento-dark/80 via-bento-dark/20 to-transparent" />

          {/* Quick Header Buttons inside Image */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-xs hover:bg-white text-bento-dark flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <X size={18} />
            </button>
            <button
              onClick={() => onToggleLike(destination.id)}
              className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-xs hover:bg-white text-bento-dark flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Heart size={18} className={isLiked ? "fill-red-500 text-red-500 animate-pulse" : "text-bento-dark/60"} />
            </button>
          </div>

          {/* Bottom title layer inside image */}
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase font-mono tracking-widest bg-bento-green text-white px-2.5 py-0.5 rounded-full font-bold">
                {destination.category}
              </span>
              {destination.isDepopulationArea && (
                <span className="text-[10px] font-bold bg-white/20 backdrop-blur-md text-bento-olive px-2.5 py-0.5 rounded-full border border-white/20 flex items-center gap-1">
                  <span>인구감소 위기지역</span> <Leaf size={11} className="text-bento-green animate-pulse" />
                </span>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-black tracking-tight drop-shadow-sm flex items-center gap-2">
              {destination.name}
            </h2>
            <p className="text-xs text-white/80 font-sans mt-1 flex items-center gap-1.5">
              <MapPin size={12} className="text-bento-moss" />
              <span>{destination.regionFull}</span>
            </p>
          </div>
        </div>

        {/* Content Body Section (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Real-time Congestion status banner */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3.5 transition-all ${cStyle.bg}`}>
            <div className="mt-1 shrink-0">
              <div className={`w-3.5 h-3.5 rounded-full ${cStyle.badge} animate-pulse shadow-sm`} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-sm tracking-tight">
                  실시간 붐빔: {destination.congestionLevel}% ({cStyle.text})
                </span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">{cStyle.desc}</p>
            </div>
          </div>

          {/* Description Paragraph */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold tracking-widest text-bento-dark/40 uppercase">소개</h3>
            <p className="text-sm text-bento-dark/80 leading-relaxed font-sans">{destination.description}</p>
          </div>

          {/* Climate-Adaptive Curation Note */}
          <div className="p-4 bg-white rounded-2xl border border-bento-dark/5 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-bento-dark/5 flex items-center justify-center shrink-0">
              <Compass size={16} className="text-bento-green animate-spin-slow" />
            </div>
            <div>
              <span className="text-xs font-bold text-bento-dark block mb-0.5">기후 및 환경 보정 가이드</span>
              <p className="text-[11px] text-bento-dark/60 leading-relaxed">
                오늘의 실시간 지표: <strong className="text-bento-green font-bold">{destination.weatherAdjustedRecommendation}</strong>
              </p>
            </div>
          </div>

          {/* Barrier-Free Accessibility Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold tracking-widest text-bento-dark/40 uppercase">배리어프리 보행 무장애 지표</h3>
            
            <div className="grid grid-cols-2 gap-2.5">
              
              {/* Wheelchair */}
              <div className={`p-3 rounded-2xl border flex items-center gap-2.5 ${
                destination.accessibility.wheelchair 
                  ? "bg-bento-green/5 border-bento-green/20 text-bento-dark" 
                  : "bg-bento-dark/[0.02] border-bento-dark/5 text-bento-dark/40"
              }`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  destination.accessibility.wheelchair ? "bg-bento-green text-white" : "bg-bento-dark/10 text-bento-dark/60"
                }`}>
                  <Accessibility size={12} />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold block leading-none mb-0.5">휠체어 보행</span>
                  <span className="text-[10px] leading-none block font-mono">
                    {destination.accessibility.wheelchair ? "이동 안심" : "이동 불가/제한"}
                  </span>
                </div>
              </div>

              {/* Stroller */}
              <div className={`p-3 rounded-2xl border flex items-center gap-2.5 ${
                destination.accessibility.stroller 
                  ? "bg-bento-green/5 border-bento-green/20 text-bento-dark" 
                  : "bg-bento-dark/[0.02] border-bento-dark/5 text-bento-dark/40"
              }`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  destination.accessibility.stroller ? "bg-bento-green text-white" : "bg-bento-dark/10 text-bento-dark/60"
                }`}>
                  <Baby size={12} />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold block leading-none mb-0.5">유모차 동반</span>
                  <span className="text-[10px] leading-none block font-mono">
                    {destination.accessibility.stroller ? "통행 원활" : "비포장/계단 구간"}
                  </span>
                </div>
              </div>

              {/* Pet Friendly */}
              <div className={`p-3 rounded-2xl border flex items-center gap-2.5 ${
                destination.petFriendly.allowed 
                  ? "bg-bento-green/5 border-bento-green/20 text-bento-dark" 
                  : "bg-bento-dark/[0.02] border-bento-dark/5 text-bento-dark/40"
              }`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  destination.petFriendly.allowed ? "bg-bento-green text-white" : "bg-bento-dark/10 text-bento-dark/60"
                }`}>
                  <PawPrint size={12} />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold block leading-none mb-0.5">반려동물 출입</span>
                  <span className="text-[10px] leading-none block font-mono">
                    {destination.petFriendly.allowed ? "동반 환영" : "전면 제한구역"}
                  </span>
                </div>
              </div>

              {/* Parking */}
              <div className={`p-3 rounded-2xl border flex items-center gap-2.5 ${
                destination.accessibility.parking 
                  ? "bg-bento-green/5 border-bento-green/20 text-bento-dark" 
                  : "bg-bento-dark/[0.02] border-bento-dark/5 text-bento-dark/40"
              }`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  destination.accessibility.parking ? "bg-bento-green text-white" : "bg-bento-dark/10"
                }`}>
                  <ParkingCircle size={14} />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold block leading-none mb-0.5">교통 약자 주차</span>
                  <span className="text-[10px] leading-none block font-mono">
                    {destination.accessibility.parking ? "인접 전용면 확보" : "주차난 심각"}
                  </span>
                </div>
              </div>

            </div>

            {/* Accessibility Note text box */}
            <div className="p-4 bg-bento-dark/[0.03] border border-bento-dark/5 rounded-2xl text-[11px] leading-relaxed text-bento-dark/70 flex gap-2.5">
              <Info size={14} className="text-bento-green shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-bento-dark block mb-0.5">보행 구조물 & 인프라 실측 코멘트</span>
                <p>{destination.accessibility.note}</p>
                {destination.petFriendly.allowed && (
                  <p className="mt-1.5 pt-1.5 border-t border-bento-dark/5 flex items-start gap-1">
                    <PawPrint size={12} className="text-orange-500 shrink-0 mt-0.5" />
                    <span><strong>반려동물 허용 기준:</strong> {destination.petFriendly.conditions} </span>
                    <span className="block mt-0.5 opacity-80">
                      (실내 허용: {destination.petFriendly.details.indoor ? "가능" : "불가"} | 야외 넓음: {destination.petFriendly.details.outdoor ? "가능" : "불가"} | 대형견 가능: {destination.petFriendly.details.largeDog ? "가능" : "불가"})
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Integrated Walking Course section */}
          {destination.walkingCourse && (
            <div className="p-4.5 bg-bento-olive/15 border border-bento-green/10 rounded-2xl space-y-2">
              <span className="text-[9px] font-mono font-bold text-bento-green bg-bento-green/15 px-2.5 py-0.5 rounded-full uppercase inline-block">
                Associated Durunubi Track
              </span>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-bento-dark">{destination.walkingCourse.name}</h4>
                <div className="flex gap-2 text-[10px] font-mono">
                  <span className="bg-bento-bg px-2 py-0.5 rounded-md border border-bento-dark/5">
                    {destination.walkingCourse.distanceKm} km
                  </span>
                  <span className="bg-bento-bg px-2 py-0.5 rounded-md border border-bento-dark/5 font-bold">
                    난이도: {destination.walkingCourse.difficulty}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-bento-dark/60">
                본 관광지는 문화체육관광부 두루누비 공식 걷기길과 완벽히 무장애 연결통로로 연계되어 있습니다.
              </p>
            </div>
          )}

          {/* Alternative Suggestion (Highly Congested Spots Show This) */}
          {destination.congestionLevel > 80 && destination.alternativeId && onSelectAlternative && (
            <div className="p-5 bg-amber-500/10 border-2 border-dashed border-amber-500/30 rounded-[2rem] space-y-3">
              <div className="flex gap-2 items-center text-amber-800">
                <AlertTriangle size={18} className="animate-bounce shrink-0" />
                <h4 className="font-display font-black text-sm">실시간 인파 과밀 대피 대안 매칭</h4>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                현재 선택하신 장소는 주말/성수기 정체 지수가 매우 높은 상태입니다. 
                온길의 흐름 조절 알고리즘이 추천하는 인근의 <strong>한산한 로컬 보행 안심지</strong>로 안전하고 조용하게 우회해 보세요!
              </p>
              <button
                onClick={() => onSelectAlternative(destination.alternativeId!)}
                className="w-full py-3 bg-bento-green hover:bg-bento-green/90 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Compass size={14} className="animate-spin-slow" />
                <span>대안 한산 명소로 우회 탐색하기</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer actions bar */}
        <div className="p-4 bg-white border-t border-bento-dark/5 shrink-0 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              alert(`${destination.name} 경로가 스마트폰 카카오맵 및 두루누비 GPS 내비게이션으로 모의 전송되었습니다.`);
            }}
            className="flex-1 py-3.5 bg-bento-green hover:bg-bento-green/90 active:scale-98 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Navigation size={14} />
            <span>길찾기 및 음성 안내 시작</span>
          </button>
          
          <button
            onClick={onClose}
            className="px-5 py-3.5 bg-bento-dark hover:bg-bento-dark/90 active:scale-98 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            창 닫기
          </button>
        </div>
      </motion.div>
    </div>
  );
}
