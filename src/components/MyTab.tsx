import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Sliders,
  Info,
  Sparkles,
  Baby,
  PawPrint,
  Accessibility,
  Car,
  Lock
} from "lucide-react";

interface MyTabProps {
  likedDestinations: string[];
  onToggleLike: (id: string) => void;
  accessibilityDefaults: {
    petFriendly: boolean;
    wheelchair: boolean;
    stroller: boolean;
    senior: boolean;
    parking: boolean;
  };
  onUpdateAccessibilityDefaults: (newDefaults: any) => void;
  user: { name: string; avatarUrl: string } | null;
  onLoginClick: () => void;
}

export default function MyTab({
  likedDestinations,
  onToggleLike,
  accessibilityDefaults,
  onUpdateAccessibilityDefaults,
  user,
  onLoginClick
}: MyTabProps) {
  const [toastMessage, setToastMessage] = useState("");

  // Handle toggle updates with a beautiful toast notification
  const handleToggle = (key: string, value: boolean) => {
    const updated = { ...accessibilityDefaults, [key]: value };
    onUpdateAccessibilityDefaults(updated);

    const koreanNameMap: Record<string, string> = {
      petFriendly: "반려동물 동반 동행",
      wheelchair: "휠체어 안전보행로 전용",
      stroller: "유모차 통행 보강",
      senior: "실버 케어 쉼터 연동",
      parking: "교통약자 넓은 주차면"
    };

    setToastMessage(`${koreanNameMap[key]} 설정이 ${value ? "활성화" : "비활성화"}되었습니다. 홈/검색 화면이 연계 업데이트됩니다.`);
    setTimeout(() => setToastMessage(""), 4000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">

      {/* 1. Header & Profile Banner */}
      <div className="bg-white rounded-xl border border-border-default p-6 flex flex-col sm:flex-row items-center gap-5 shadow-sm relative overflow-hidden">

        {user ? (
          <>
            {/* User profile picture */}
            <div className="relative">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-20 h-20 rounded-full border-2 border-bento-green object-cover shrink-0"
              />
              <span className="absolute bottom-1 right-1 w-5.5 h-5.5 rounded-full bg-bento-green border-2 border-white text-white text-[10px] font-bold flex items-center justify-center">
                Lv.1
              </span>
            </div>

            {/* User name & summary */}
            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1.5 justify-center sm:justify-start">
                <h3 className="font-display font-black text-lg text-bento-dark tracking-tight leading-none">
                  {user.name} 님
                </h3>
                {/*<span className="bg-bento-olive text-bento-dark text-[9px] font-semibold px-2 py-0.5 rounded-sm w-max mx-auto sm:mx-0">
                  안심 보행 보조단
                </span>*/}
              </div>
              <p className="text-xs text-bento-dark/50 leading-relaxed mb-3">
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-4 text-xs font-mono">
                {/*<div>
                  <span className="text-bento-dark/40">찜한 코스</span>{" "}
                  <strong className="text-bento-dark font-black">{likedDestinations.length}개</strong>
                </div>*/}
                {/*<div className="w-1.25 h-1.25 rounded-full bg-bento-dark/10" />*/}
                {/*<div className="flex items-center gap-1">
                  <span className="text-bento-dark/40 font-sans">인구소멸 기여</span>{" "}
                  <strong className="text-bento-green font-black flex items-center gap-0.5">2회 안심 <Leaf size={11} className="inline text-bento-green" /></strong>
                </div>*/}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Anonymous Profile */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-bento-dark/5 border-2 border-dashed border-border-strong flex items-center justify-center text-bento-dark/40 shrink-0">
                <User size={36} className="text-bento-dark/30" />
              </div>
            </div>

            {/* Request login summary */}
            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1.5 justify-center sm:justify-start">
                <h3 className="font-display font-black text-lg text-bento-dark tracking-tight leading-none">
                  로그인이 필요합니다
                </h3>
              </div>
              <p className="text-xs text-bento-dark/50 leading-relaxed mb-3">
                로그인하시면 나만의 안심 동반 기준 설정과 찜한 명소·코스 연동을 관리하실 수 있습니다.
              </p>
              <button
                onClick={onLoginClick}
                className="px-4 py-2 bg-bento-green hover:bg-bento-green/90 text-white text-xs font-semibold rounded-sm transition-all duration-base cursor-pointer shadow-sm active:scale-[0.98]"
              >
                카카오 로그인으로 시작하기
              </button>
            </div>
          </>
        )}

        {/* Small subtle background dot graphic */}
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-[radial-gradient(#1a2f2303_1.5px,transparent_1.5px)] bg-[size:12px_12px] opacity-60 hidden md:block" />
      </div>

      {/* 2. Sync Toast Message Panel */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            role="status"
            className="fixed left-1/2 -translate-x-1/2 bottom-24 z-50 w-[calc(100%-32px)] max-w-md p-3.5 bg-bento-green text-white text-xs font-semibold rounded-lg flex items-center gap-2.5 shadow-lg pointer-events-none"
          >
            <Sparkles size={14} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. DETAIL RENDERING */}
      <div className="relative">
        {!user && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs rounded-xl z-50 flex flex-col items-center justify-center space-y-3 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-bento-dark/5 flex items-center justify-center text-bento-dark/60">
              <Lock size={20} />
            </div>
            <span className="text-xs font-semibold text-bento-dark">안심 기준 설정 잠김</span>
            <p className="text-[11px] text-bento-dark/50 max-w-xs leading-relaxed">
              카카오 계정 연동 후에 나만의 안심보행 기본값 저장 기능을 이용하실 수 있습니다.
            </p>
            <button
              onClick={onLoginClick}
              className="px-4 py-2 bg-bento-dark text-white text-xs font-semibold rounded-sm hover:bg-bento-dark/95 transition-all duration-base cursor-pointer shadow-sm active:scale-[0.98]"
            >
              로그인 잠금해제
            </button>
          </div>
        )}

        <div className={!user ? "pointer-events-none select-none filter blur-[1.5px]" : ""}>
            <div className="space-y-6">

              {/* A. 나만의 안심 보행 디폴트 필터값 설정 (Accessibility defaults editor) */}
              <div className="bg-white rounded-xl border border-border-default p-5 space-y-4 shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sliders size={16} className="text-bento-green" />
                    <h4 className="font-display font-bold text-sm text-bento-dark">
                      나의 안심보행 기본값 설정
                    </h4>
                  </div>
                  <p className="text-[11px] text-bento-dark/50">
                    여기서 설정한 기준은 앱 실행 시 검색 필터에 자동 동기화되어 매번 수동 선택할 필요가 없습니다.
                  </p>
                </div>

                <div className="space-y-2.5">

                  {/* Wheelchair */}
                  <div className="flex items-center justify-between p-3.5 bg-bento-bg rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-bento-green/10 text-bento-green flex items-center justify-center shrink-0">
                        <Accessibility size={16} />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-semibold block text-bento-dark">휠체어 안전보행로</span>
                        <span className="text-[10px] text-bento-dark/50 block">계단 제거, 경사도 5% 미만, 안전난간 기준</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle("wheelchair", !accessibilityDefaults.wheelchair)}
                      className={`w-10 h-5.5 rounded-full transition-all duration-base ease-in-out-soft relative cursor-pointer ${
                        accessibilityDefaults.wheelchair ? "bg-bento-green" : "bg-bento-stone"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-[3px] transition-all duration-base ease-in-out-soft ${
                        accessibilityDefaults.wheelchair ? "left-[22px]" : "left-1"
                      }`} />
                    </button>
                  </div>

                  {/* Stroller */}
                  <div className="flex items-center justify-between p-3.5 bg-bento-bg rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                        <Baby size={16} />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-semibold block text-bento-dark">유모차 동반 통로</span>
                        <span className="text-[10px] text-bento-dark/50 block">비포장 비탈길 우회, 기저귀 갈이대 구비처</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle("stroller", !accessibilityDefaults.stroller)}
                      className={`w-10 h-5.5 rounded-full transition-all duration-base ease-in-out-soft relative cursor-pointer ${
                        accessibilityDefaults.stroller ? "bg-bento-green" : "bg-bento-stone"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-[3px] transition-all duration-base ease-in-out-soft ${
                        accessibilityDefaults.stroller ? "left-[22px]" : "left-1"
                      }`} />
                    </button>
                  </div>

                  {/* Pet Friendly */}
                  <div className="flex items-center justify-between p-3.5 bg-bento-bg rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                        <PawPrint size={16} />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-semibold block text-bento-dark">반려동물 동반 산책</span>
                        <span className="text-[10px] text-bento-dark/50 block">목줄 착용, 공식 허용 관광지 우선 추천</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle("petFriendly", !accessibilityDefaults.petFriendly)}
                      className={`w-10 h-5.5 rounded-full transition-all duration-base ease-in-out-soft relative cursor-pointer ${
                        accessibilityDefaults.petFriendly ? "bg-bento-green" : "bg-bento-stone"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-[3px] transition-all duration-base ease-in-out-soft ${
                        accessibilityDefaults.petFriendly ? "left-[22px]" : "left-1"
                      }`} />
                    </button>
                  </div>

                  {/* Senior */}
                  <div className="flex items-center justify-between p-3.5 bg-bento-bg rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                        <User size={16} />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-semibold block text-bento-dark">실버 케어 쉼터</span>
                        <span className="text-[10px] text-bento-dark/50 block">도보 200m 이내 등받이 벤치 및 차양막 완비</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle("senior", !accessibilityDefaults.senior)}
                      className={`w-10 h-5.5 rounded-full transition-all duration-base ease-in-out-soft relative cursor-pointer ${
                        accessibilityDefaults.senior ? "bg-bento-green" : "bg-bento-stone"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-[3px] transition-all duration-base ease-in-out-soft ${
                        accessibilityDefaults.senior ? "left-[22px]" : "left-1"
                      }`} />
                    </button>
                  </div>

                  {/* Parking */}
                  <div className="flex items-center justify-between p-3.5 bg-bento-bg rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                        <Car size={16} />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-semibold block text-bento-dark">장애인 전용 주차</span>
                        <span className="text-[10px] text-bento-dark/50 block">평지 무료 공영주차장, 휠체어 하차 지원</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle("parking", !accessibilityDefaults.parking)}
                      className={`w-10 h-5.5 rounded-full transition-all duration-base ease-in-out-soft relative cursor-pointer ${
                        accessibilityDefaults.parking ? "bg-bento-green" : "bg-bento-stone"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-[3px] transition-all duration-base ease-in-out-soft ${
                        accessibilityDefaults.parking ? "left-[22px]" : "left-1"
                      }`} />
                    </button>
                  </div>

                </div>
              </div>

            </div>
        </div>
      </div>

      {/* 5. General Utility settings cards (Safe encryption indicator) */}
      <div className="p-4 bg-bento-dark/[0.03] border border-border-subtle rounded-lg text-[10px] text-bento-dark/50 leading-relaxed flex gap-2.5 items-start">
        <Info size={12} className="text-bento-green shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-bento-dark block mb-0.5">찜 목록 및 안심 기준 저장 안내</span>
          <p>
            로그인하면 찜한 명소·코스와 안심보행 기본값이 온길 계정에 저장되어 다른 기기에서도 유지됩니다. 로그인하지 않은 경우에는 이 기기 브라우저에만 저장됩니다.
          </p>
        </div>
      </div>

    </div>
  );
}
