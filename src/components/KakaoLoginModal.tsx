import { useState } from "react";
import { motion } from "motion/react";
import { X, MessageCircle, ShieldCheck, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";

interface KakaoLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
}

export default function KakaoLoginModal({
  isOpen,
  onClose,
  initialMode = "login"
}: KakaoLoginModalProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");

  // Sign up form state — Kakao supplies nickname/profile image itself, so
  // signup only needs consent, not a separate identity form.
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [formError, setFormError] = useState("");

  if (!isOpen) return null;

  const handleKakaoAction = () => {
    if (mode === "signup" && (!agreedTerms || !agreedPrivacy)) {
      setFormError("필수 약관에 동의해 주세요.");
      return;
    }

    setFormError("");
    setIsLoading(true);
    setLoadingStep("카카오 로그인 페이지로 이동 중...");
    // Full-page redirect into Kakao's OAuth authorize screen; the callback
    // route creates the session and sends the browser back to "/".
    window.location.href = "/api/auth/kakao/login";
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={onClose}
        className="absolute inset-0 bg-bento-ink/60 backdrop-blur-xs"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="bg-white rounded-lg border border-border-default w-full max-w-md shadow-lg relative overflow-hidden z-10 flex flex-col text-center"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-bento-bg hover:bg-bento-dark/5 flex items-center justify-center text-bento-dark/60 transition-colors duration-fast cursor-pointer"
          aria-label="닫기"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="pt-8 pb-6 px-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-bento-green flex items-center justify-center text-white mb-3 shadow-md">
            <MessageCircle size={24} className="fill-white text-bento-green" />
          </div>
          <h3 className="font-display font-black text-xl text-bento-dark tracking-tight leading-none">
            온길 <span className="text-bento-green font-normal">안심 연동</span>
          </h3>
          <p className="text-xs text-bento-dark/50 mt-2">
            {mode === "login" ? "카카오 계정으로 간편하게 시작하세요." : "새로운 안심 여정을 함께 시작합니다."}
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="px-6 mb-4">
          <div className="flex bg-bento-bg rounded-sm p-1">
            <button
              onClick={() => { setMode("login"); setFormError(""); }}
              className={`flex-1 py-2 text-xs font-bold rounded-sm transition-all duration-fast cursor-pointer ${
                mode === "login"
                  ? "bg-white text-bento-dark shadow-sm"
                  : "text-bento-dark/40 hover:text-bento-dark/60"
              }`}
            >
              로그인
            </button>
            <button
              onClick={() => { setMode("signup"); setFormError(""); }}
              className={`flex-1 py-2 text-xs font-bold rounded-sm transition-all duration-fast cursor-pointer ${
                mode === "signup"
                  ? "bg-white text-bento-dark shadow-sm"
                  : "text-bento-dark/40 hover:text-bento-dark/60"
              }`}
            >
              회원가입
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-8">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <Loader2 size={28} className="text-bento-green animate-spin" />
              <span className="text-xs font-bold text-bento-dark">{loadingStep}</span>
              <span className="text-[10px] text-bento-dark/40">카카오 로그인으로 안전하게 연결됩니다.</span>
            </div>
          ) : (
            <div className="space-y-5 text-left">
              {mode === "signup" && (
                <div className="space-y-4">
                  {/* Consent */}
                  <div className="bg-bento-bg p-3.5 rounded-md border border-border-subtle space-y-2 text-xs text-bento-dark/60">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => { setAgreedTerms(!agreedTerms); setFormError(""); }}
                        className="text-bento-dark/40 hover:text-bento-green transition-colors duration-fast cursor-pointer shrink-0"
                      >
                        <CheckCircle2 size={16} className={agreedTerms ? "text-bento-green fill-bento-green/20" : ""} />
                      </button>
                      <span>[필수] 온길 서비스 이용약관 동의</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => { setAgreedPrivacy(!agreedPrivacy); setFormError(""); }}
                        className="text-bento-dark/40 hover:text-bento-green transition-colors duration-fast cursor-pointer shrink-0"
                      >
                        <CheckCircle2 size={16} className={agreedPrivacy ? "text-bento-green fill-bento-green/20" : ""} />
                      </button>
                      <span>[필수] 개인정보 수집 및 이용 동의</span>
                    </div>
                  </div>

                  {/* Inline error message */}
                  {formError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs font-semibold text-red-500 flex items-center gap-1.5"
                    >
                      <AlertTriangle size={14} />
                      <span>{formError}</span>
                    </motion.p>
                  )}
                </div>
              )}

              {/* Kakao CTA */}
              <button
                onClick={handleKakaoAction}
                className="w-full py-3 rounded-sm bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] font-bold text-sm flex items-center justify-center gap-2 transition-all duration-base shadow-sm cursor-pointer active:scale-98"
              >
                <MessageCircle size={16} className="fill-[#191919]" />
                <span>{mode === "login" ? "카카오 계정으로 로그인" : "카카오로 가입 및 로그인"}</span>
              </button>

              {/* Safe indicator */}
              <div className="pt-2 border-t border-border-subtle flex items-center justify-center gap-1.5 text-[10px] text-bento-dark/40 font-sans">
                <ShieldCheck size={12} />
                <span>안전한 로컬 보안 인증 세션</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
