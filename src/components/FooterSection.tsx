import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, CheckCircle, Shield } from "lucide-react";

export default function FooterSection() {
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState("traveler");
  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrors("올바른 이메일 형식을 기입해 주세요.");
      return;
    }
    setErrors(null);
    setIsSubmitted(true);
  };

  return (
    <section id="beta" className="bg-bento-bg text-bento-dark border-t border-border-default">
      
      {/* Contact & Beta Form Container */}
      <div className="py-24 max-w-4xl mx-auto px-6">
        
        <div className="bg-white rounded-xl border border-border-default shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 items-stretch">
          
          {/* Left panel info (5 cols) */}
          <div className="md:col-span-5 bg-bento-dark text-white p-8 sm:p-10 flex flex-col justify-between relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-bento-green/10 rounded-full blur-[40px] pointer-events-none" />
            
            <div className="space-y-6 relative z-10">
              <span className="text-[10px] font-sans font-semibold tracking-wider text-bento-sand block">
                Beta Program
              </span>
              <h3 className="text-xl sm:text-2xl font-display font-black text-white">
                지금, 온길의 <br />
                첫걸음과 함께하세요
              </h3>
              <p className="text-bento-olive/80 text-xs sm:text-sm leading-relaxed">
                정선·태백·삼척·고성의 무장애 안심 코스 GPX 파일과 
                모바일 앱 베타 링크를 보내드립니다.
              </p>
            </div>

            <div className="space-y-4 pt-12 border-t border-white/10 text-xs text-bento-olive relative z-10">
              <div className="flex gap-2 items-center">
                <Shield size={14} className="text-bento-moss" />
                <span>개인정보는 암호화되어 보호됩니다.</span>
              </div>
              <p className="text-[10px]">
                © 2026 Ongil, inc. All rights reserved.
              </p>
            </div>
          </div>

          {/* Right panel form (7 cols) */}
          <div className="md:col-span-7 p-8 sm:p-10">
            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <motion.form 
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit} 
                  className="space-y-5"
                >
                  <h4 className="font-display font-black text-lg text-bento-dark mb-1">
                    베타 테스터 신청
                  </h4>
                  <p className="text-bento-dark/60 text-xs">
                    개인 여행자, 지자체 관계자, 로컬 상인 모두 환영합니다.
                  </p>

                  {/* Input Email */}
                  <div>
                    <label className="block text-[11px] font-sans font-semibold text-bento-dark/50 mb-1.5">
                      이메일 <span className="text-bento-green">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@domain.com"
                      className="w-full px-4 py-2.5 rounded-md border border-border-default bg-bento-bg/50 text-sm text-bento-dark placeholder-bento-dark/30 focus:outline-none focus:border-bento-green focus:bg-white transition-all duration-base ease-out-soft"
                      required
                    />
                  </div>

                  {/* Select User type */}
                  <div>
                    <label className="block text-[11px] font-sans font-semibold text-bento-dark/50 mb-1.5">
                      참여 유형 <span className="text-bento-green">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { id: "traveler", label: "여행자" },
                        { id: "government", label: "지자체/RTO" },
                        { id: "business", label: "로컬 상인/제휴" }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setUserType(item.id)}
                          className={`px-3 py-2.5 rounded-md border text-xs font-medium transition-all duration-base ease-out-soft text-center cursor-pointer ${
                            userType === item.id
                              ? "bg-bento-green/15 border-bento-green text-bento-green font-bold shadow-sm"
                              : "bg-bento-bg/50 border-border-default text-bento-dark/60 hover:bg-bento-bg"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message (Optional) */}
                  <div>
                    <label className="block text-[11px] font-sans font-semibold text-bento-dark/50 mb-1.5">
                      문의 사항 (선택)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      placeholder="온길에 하실 말씀을 자유롭게 남겨주세요."
                      className="w-full px-4 py-2.5 rounded-md border border-border-default bg-bento-bg/50 text-sm text-bento-dark placeholder-bento-dark/30 focus:outline-none focus:border-bento-green focus:bg-white transition-all duration-base ease-out-soft resize-none"
                    />
                  </div>

                  {errors && (
                    <p className="text-xs text-bento-green font-medium">
                      {errors}
                    </p>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-bento-green hover:bg-bento-green/90 active:bg-bento-green text-white font-display font-black rounded-md text-sm transition-all duration-base ease-out-soft shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send size={14} />
                    <span>베타 신청하기</span>
                  </button>
                </motion.form>
              ) : (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6 text-center py-8"
                >
                  <div className="w-16 h-16 bg-bento-bg text-bento-green rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} />
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xl font-display font-black text-bento-dark">
                      신청이 정상 접수되었습니다!
                    </h4>
                    <p className="text-bento-dark/60 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                      <strong>{email}</strong>로 강원도 4개 군의 무장애 경로 자료와 테스트 가이드를 보내드립니다.
                    </p>
                  </div>

                  <div className="bg-bento-dark text-bento-sand rounded-md p-4 max-w-xs mx-auto text-[11px] font-mono border border-white/10">
                    MOCK CODE: <span className="text-white font-bold">ONGIL-TESTER-2026</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail("");
                      setMessage("");
                    }}
                    className="text-xs text-bento-green font-bold hover:underline cursor-pointer"
                  >
                    다시 신청하기
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>

      {/* Footer copyright and credit rail */}
      <footer className="bg-bento-dark text-bento-olive/60 border-t border-white/5 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/5 pb-8 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-display font-black text-lg text-white">온길 (Ongil)</span>
              <span className="text-white/10">|</span>
              <p className="text-bento-olive/80 text-left">덜 붐비는 여행, 더 넓은 발견</p>
            </div>
            
            <div className="flex flex-wrap gap-4 text-[11px]">
              <a href="#problem" className="hover:text-white transition-colors duration-fast">소개</a>
              <a href="#features" className="hover:text-white transition-colors duration-fast">핵심 기능</a>
              <a href="#simulator" className="hover:text-white transition-colors duration-fast">시뮬레이션</a>
              <a href="#comparison" className="hover:text-white transition-colors duration-fast">차별성</a>
              <a href="#regions" className="hover:text-white transition-colors duration-fast">강원 4군</a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px]">
            <p className="text-left leading-relaxed max-w-xl text-bento-olive/60">
              본 서비스는 한국관광공사 OpenAPI 및 공공빅데이터 포털 데이터를 기반으로 설계되었습니다.
            </p>
            <div className="flex gap-1.5 text-bento-olive/40 font-semibold">
              <span>Open Data Compliant</span>
              <span>·</span>
              <span>Security Guarded</span>
            </div>
          </div>
        </div>
      </footer>

    </section>
  );
}
