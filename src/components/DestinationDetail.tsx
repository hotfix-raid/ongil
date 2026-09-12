import React, { useState, useEffect } from "react";
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const getCongestionStyle = (level: number) => {
    if (level <= 20) {
      return {
        bg: "bg-emerald-50 border-emerald-150 text-emerald-800",
        badge: "bg-emerald-500",
        text: "쾌적·한산",
        desc: "유모차, 휠체어, 반려동물과 여유로운 교행이 가능합니다."
      };
    } else if (level <= 50) {
      return {
        bg: "bg-amber-50 border-amber-150 text-amber-800",
        badge: "bg-amber-500",
        text: "보통",
        desc: "일부 구간에 약한 밀집이 예상되나, 보행에는 무리가 없습니다."
      };
    } else {
      return {
        bg: "bg-red-50 border-red-150 text-red-800",
        badge: "bg-red-500",
        text: "혼잡·밀집",
        desc: "보행 정체와 주차 대기가 예상되니, 보행 약자는 유의하세요."
      };
    }
  };

  const cStyle = getCongestionStyle(destination.congestionLevel);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-4 overflow-hidden">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={onClose}
        className="fixed inset-0 bg-bento-ink/60 backdrop-blur-xs"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ y: "100%", opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0.5 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative bg-bento-bg w-full h-full md:h-[90vh] md:max-w-2xl md:rounded-lg shadow-lg flex flex-col overflow-hidden z-10"
      >
        {/* Hero Image */}
        <div className="relative h-64 md:h-72 shrink-0">
          <img
            src={destination.image}
            alt={destination.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bento-ink/80 via-bento-ink/20 to-transparent" />

          {/* Header Buttons */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-xs hover:bg-white text-bento-dark flex items-center justify-center shadow-sm transition-all duration-fast active:scale-95 cursor-pointer"
              aria-label="닫기"
            >
              <X size={18} />
            </button>
            <button
              onClick={() => onToggleLike(destination.id)}
              className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-xs hover:bg-white text-bento-dark flex items-center justify-center shadow-sm transition-all duration-fast active:scale-95 cursor-pointer"
              aria-label={isLiked ? "좋아요 취소" : "좋아요"}
            >
              <Heart size={18} className={isLiked ? "fill-red-500 text-red-500" : "text-bento-dark/60"} />
            </button>
          </div>

          {/* Title Layer */}
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-sans font-semibold bg-bento-green text-white px-2.5 py-0.5 rounded-sm">
                {destination.category}
              </span>
              {destination.isDepopulationArea && (
                <span className="text-xs font-sans font-medium bg-white/20 backdrop-blur-md text-bento-olive px-2.5 py-0.5 rounded-sm border border-white/20 flex items-center gap-1">
                  <Leaf size={11} className="text-bento-green" />
                  <span>인구감소 위기지역</span>
                </span>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-black tracking-tight drop-shadow-sm">
              {destination.name}
            </h2>
            <p className="text-sm text-white/80 font-sans mt-1 flex items-center gap-1.5">
              <MapPin size={14} className="text-bento-moss" />
              <span>{destination.regionFull}</span>
            </p>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Congestion Banner */}
          <div className={`p-4 rounded-lg border flex items-start gap-3.5 transition-all ${cStyle.bg}`}>
            <div className="mt-1 shrink-0">
              <div className={`w-3 h-3 rounded-full ${cStyle.badge} shadow-sm`} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm tracking-tight">
                  예상 혼잡도 {destination.congestionLevel}% — {cStyle.text}
                </span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">{cStyle.desc}</p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-display font-bold text-bento-dark/50">소개</h3>
            <p className="text-sm text-bento-dark/80 leading-relaxed font-sans">{destination.description}</p>
          </div>

          {/* Weather Guide */}
          <div className="p-4 bg-white rounded-md border border-border-subtle flex gap-3">
            <div className="w-8 h-8 rounded-full bg-bento-dark/5 flex items-center justify-center shrink-0">
              <Compass size={16} className="text-bento-green" />
            </div>
            <div>
              <span className="text-xs font-bold text-bento-dark block mb-0.5">오늘의 추천</span>
              <p className="text-xs text-bento-dark/60 leading-relaxed">
                <strong className="text-bento-green font-bold">{destination.weatherAdjustedRecommendation}</strong>
              </p>
            </div>
          </div>

          {/* Accessibility */}
          <div className="space-y-3">
            <h3 className="text-sm font-display font-bold text-bento-dark/50">배리어프리 정보</h3>

            <div className="grid grid-cols-2 gap-2.5">
              <div className={`p-3 rounded-md border flex items-center gap-2.5 ${
                destination.accessibility.wheelchair
                  ? "bg-bento-green/5 border-bento-green/20 text-bento-dark"
                  : "bg-bento-dark/[0.02] border-border-subtle text-bento-dark/40"
              }`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  destination.accessibility.wheelchair ? "bg-bento-green text-white" : "bg-bento-dark/10 text-bento-dark/60"
                }`}>
                  <Accessibility size={12} />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold block leading-none mb-0.5">휠체어</span>
                  <span className="text-[10px] leading-none block text-bento-stone">
                    {destination.accessibility.wheelchair ? "이동 안심" : "이동 제한"}
                  </span>
                </div>
              </div>

              <div className={`p-3 rounded-md border flex items-center gap-2.5 ${
                destination.accessibility.stroller
                  ? "bg-bento-green/5 border-bento-green/20 text-bento-dark"
                  : "bg-bento-dark/[0.02] border-border-subtle text-bento-dark/40"
              }`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  destination.accessibility.stroller ? "bg-bento-green text-white" : "bg-bento-dark/10 text-bento-dark/60"
                }`}>
                  <Baby size={12} />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold block leading-none mb-0.5">유모차</span>
                  <span className="text-[10px] leading-none block text-bento-stone">
                    {destination.accessibility.stroller ? "통행 원활" : "비포장/계단"}
                  </span>
                </div>
              </div>

              <div className={`p-3 rounded-md border flex items-center gap-2.5 ${
                destination.petFriendly.allowed
                  ? "bg-bento-green/5 border-bento-green/20 text-bento-dark"
                  : "bg-bento-dark/[0.02] border-border-subtle text-bento-dark/40"
              }`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  destination.petFriendly.allowed ? "bg-bento-green text-white" : "bg-bento-dark/10 text-bento-dark/60"
                }`}>
                  <PawPrint size={12} />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold block leading-none mb-0.5">반려동물</span>
                  <span className="text-[10px] leading-none block text-bento-stone">
                    {destination.petFriendly.allowed ? "동반 가능" : "출입 제한"}
                  </span>
                </div>
              </div>

              <div className={`p-3 rounded-md border flex items-center gap-2.5 ${
                destination.accessibility.parking
                  ? "bg-bento-green/5 border-bento-green/20 text-bento-dark"
                  : "bg-bento-dark/[0.02] border-border-subtle text-bento-dark/40"
              }`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  destination.accessibility.parking ? "bg-bento-green text-white" : "bg-bento-dark/10"
                }`}>
                  <ParkingCircle size={14} />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold block leading-none mb-0.5">주차</span>
                  <span className="text-[10px] leading-none block text-bento-stone">
                    {destination.accessibility.parking ? "전용면 확보" : "주차난 심각"}
                  </span>
                </div>
              </div>
            </div>

            {/* Accessibility Note */}
            <div className="p-4 bg-bento-dark/[0.03] border border-border-subtle rounded-md text-xs leading-relaxed text-bento-dark/70 flex gap-2.5">
              <Info size={14} className="text-bento-green shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-bento-dark block mb-0.5">보행 인프라 정보</span>
                <p>{destination.accessibility.note}</p>
                {destination.petFriendly.allowed && (
                  <p className="mt-2 pt-2 border-t border-border-subtle flex items-start gap-1">
                    <PawPrint size={12} className="text-orange-500 shrink-0 mt-0.5" />
                    <span><strong>반려동물 허용 기준:</strong> {destination.petFriendly.conditions} </span>
                    <span className="block mt-0.5 opacity-80">
                      (실내: {destination.petFriendly.details.indoor ? "가능" : "불가"} | 야외: {destination.petFriendly.details.outdoor ? "가능" : "불가"} | 대형견: {destination.petFriendly.details.largeDog ? "가능" : "불가"})
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Walking Course */}
          {destination.walkingCourse && (
            <div className="p-4 bg-bento-olive/15 border border-bento-green/10 rounded-md space-y-2">
              <span className="text-[10px] font-sans font-semibold text-bento-green bg-bento-green/15 px-2.5 py-0.5 rounded-sm inline-block">
                두루누비 연계 코스
              </span>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-bento-dark">{destination.walkingCourse.name}</h4>
                <div className="flex gap-2 text-[10px] font-sans">
                  <span className="bg-bento-bg px-2 py-0.5 rounded-sm border border-border-subtle">
                    {destination.walkingCourse.distanceKm} km
                  </span>
                  <span className="bg-bento-bg px-2 py-0.5 rounded-sm border border-border-subtle font-bold">
                    난이도 {destination.walkingCourse.difficulty}
                  </span>
                </div>
              </div>
              <p className="text-xs text-bento-dark/60">
                본 관광지는 문화체육관광부 두루누비 공식 걷기길과 무장애 연결통로로 연계되어 있습니다.
              </p>
            </div>
          )}

          {/* Alternative Suggestion */}
          {destination.congestionLevel > 80 && destination.alternativeId && onSelectAlternative && (
            <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-3">
              <div className="flex gap-2 items-center text-amber-800">
                <AlertTriangle size={18} className="shrink-0" />
                <h4 className="font-display font-bold text-sm">한산한 대안 명소 추천</h4>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                현재 이 장소는 매우 혼잡한 상태입니다. 인근의 <strong>한산한 로컬 보행 안심지</strong>로 우회해 보세요.
              </p>
              <button
                onClick={() => onSelectAlternative(destination.alternativeId!)}
                className="w-full py-3 bg-bento-green hover:bg-bento-green/90 text-white text-xs font-bold rounded-sm shadow-sm transition-all duration-base flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                <Compass size={14} />
                <span>대안 명소 탐색하기</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-border-subtle shrink-0 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              setToastMessage(`${destination.name} 경로가 카카오맵 및 두루누비 GPS로 전송되었습니다.`);
            }}
            className="flex-1 py-3.5 bg-bento-green hover:bg-bento-green/90 active:scale-98 text-white text-xs font-bold rounded-sm shadow-md transition-all duration-base flex items-center justify-center gap-2 cursor-pointer"
          >
            <Navigation size={14} />
            <span>길찾기 및 음성 안내</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-3.5 bg-bento-dark hover:bg-bento-dark/90 active:scale-98 text-white text-xs font-bold rounded-sm transition-all duration-base cursor-pointer"
          >
            닫기
          </button>
        </div>
      </motion.div>

      {/* Toast notification (outside modal card to avoid overflow-hidden) */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] bg-bento-ink text-white rounded-lg shadow-lg px-5 py-3 flex items-center gap-3"
        >
          <p className="text-xs font-semibold">{toastMessage}</p>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white transition-colors duration-fast cursor-pointer shrink-0"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </div>
  );
}
