import React, { useState } from "react";
import { motion } from "motion/react";
import { X, MessageCircle, Lock, ShieldCheck, Mail, CheckCircle2 } from "lucide-react";

interface KakaoLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { name: string; avatarUrl: string }) => void;
  initialMode?: "login" | "signup";
}

export default function KakaoLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = "login"
}: KakaoLoginModalProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  
  // Sign up form state
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);

  if (!isOpen) return null;

  const handleKakaoAction = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "signup" && (!email || !nickname || !agreedTerms || !agreedPrivacy)) {
      alert("필수 입력 사항 및 동의가 필요합니다.");
      return;
    }

    setIsLoading(true);
    setLoadingStep(mode === "login" ? "카카오 계정 안전 확인 중..." : "회원 정보 생성 중...");

    // 1st loading state
    setTimeout(() => {
      setLoadingStep("카카오 프로필 정보 동기화 중...");
      
      // 2nd loading state
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess({
          name: mode === "signup" ? nickname : "온길러",
          avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=" + (mode === "signup" ? nickname : "ongil_user")
        });
        onClose();
      }, 800);

    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="bg-white rounded-[2.5rem] border border-bento-dark/10 w-full max-w-md p-6 sm:p-8 shadow-2xl relative overflow-hidden z-10 flex flex-col text-center"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 w-8 h-8 rounded-full bg-bento-bg hover:bg-bento-dark/5 flex items-center justify-center text-bento-dark/60 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Brand / Logo */}
        <div className="mt-4 mb-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-bento-green flex items-center justify-center text-white mb-2.5 shadow-md">
            <MessageCircle size={24} className="fill-white text-bento-green" />
          </div>
          <h3 className="font-display font-black text-xl text-bento-dark tracking-tight leading-none">
            온길 <span className="text-bento-green font-normal">안심 연동</span>
          </h3>
          <p className="text-xs text-bento-dark/50 mt-2">
            {mode === "login" ? "카카오 계정으로 간편하게 시작해 보세요." : "온길의 새로운 안심 여정을 함께 시작합니다."}
          </p>
        </div>

        {/* Loading overlay inside modal */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-amber-100 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-4 border-t-amber-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            </div>
            <span className="text-xs font-bold text-bento-dark">{loadingStep}</span>
            <span className="text-[10px] text-bento-dark/40">이 페이지는 안전한 연동 목업 환경입니다.</span>
          </div>
        ) : (
          /* Normal modal state */
          <div className="space-y-5 text-left">
            {mode === "signup" && (
              <form onSubmit={handleKakaoAction} className="space-y-4">
                {/* Custom input fields */}
                <div>
                  <label className="text-[10px] font-bold text-bento-dark/50 uppercase tracking-wider block mb-1">
                    이메일 주소
                  </label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bento-dark/40" />
                    <input
                      type="email"
                      required
                      placeholder="example@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-bento-bg border border-bento-dark/10 rounded-xl text-xs font-bold focus:outline-none focus:border-bento-green"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-bento-dark/50 uppercase tracking-wider block mb-1">
                    활동 이름 (닉네임)
                  </label>
                  <div className="relative">
                    <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bento-dark/40" />
                    <input
                      type="text"
                      required
                      placeholder="예: 온길동"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-bento-bg border border-bento-dark/10 rounded-xl text-xs font-bold focus:outline-none focus:border-bento-green"
                    />
                  </div>
                </div>

                {/* Consent checklist */}
                <div className="bg-bento-bg p-3.5 rounded-2xl border border-bento-dark/5 space-y-2 text-[10px] text-bento-dark/60">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAgreedTerms(!agreedTerms)}
                      className="text-bento-dark/40 hover:text-bento-green transition-colors cursor-pointer"
                    >
                      <CheckCircle2 size={14} className={agreedTerms ? "text-bento-green fill-bento-green/20" : ""} />
                    </button>
                    <span>[필수] 온길 안심서비스 이용약관 동의</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAgreedPrivacy(!agreedPrivacy)}
                      className="text-bento-dark/40 hover:text-bento-green transition-colors cursor-pointer"
                    >
                      <CheckCircle2 size={14} className={agreedPrivacy ? "text-bento-green fill-bento-green/20" : ""} />
                    </button>
                    <span>[필수] 고유 식별정보 및 민감 사생활 로컬 캐시 사용 동의</span>
                  </div>
                </div>
              </form>
            )}

            {/* Kakao yellow login button */}
            <button
              onClick={mode === "signup" ? handleKakaoAction : (e) => handleKakaoAction(e)}
              className="w-full py-3 rounded-2xl bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98"
            >
              <MessageCircle size={15} className="fill-[#191919]" />
              <span>{mode === "login" ? "카카오 계정으로 로그인" : "카카오로 가입 및 로그인 완료"}</span>
            </button>

            {/* Sub navigation inside modal to toggle Mode */}
            <div className="pt-2 text-center text-xs">
              {mode === "login" ? (
                <span className="text-bento-dark/50">
                  처음 방문하셨나요?{" "}
                  <button
                    onClick={() => setMode("signup")}
                    className="font-bold text-bento-green hover:underline cursor-pointer"
                  >
                    회원가입 하기
                  </button>
                </span>
              ) : (
                <span className="text-bento-dark/50">
                  이미 계정이 있으신가요?{" "}
                  <button
                    onClick={() => setMode("login")}
                    className="font-bold text-bento-green hover:underline cursor-pointer"
                  >
                    로그인 하기
                  </button>
                </span>
              )}
            </div>

            {/* Safe indicators */}
            <div className="pt-4 border-t border-bento-dark/5 flex items-center justify-center gap-1.5 text-[9px] text-bento-dark/30 font-mono">
              <ShieldCheck size={11} />
              <span>안전한 오프라인 로컬 보안 인증 세션</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
