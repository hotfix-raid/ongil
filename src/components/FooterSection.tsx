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
    <section id="beta" className="bg-bento-bg text-bento-dark border-t border-bento-dark/10">
      
      {/* Contact & Beta Form Container */}
      <div className="py-24 max-w-4xl mx-auto px-6">
        
        <div className="bg-white rounded-3xl border border-bento-dark/10 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-12 items-stretch">
          
          {/* Left panel info (5 cols) */}
          <div className="md:col-span-5 bg-bento-dark text-white p-8 sm:p-10 flex flex-col justify-between relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-bento-green/10 rounded-full blur-[40px] pointer-events-none" />
            
            <div className="space-y-6 relative z-10">
              <span className="text-[10px] font-mono font-bold tracking-widest text-bento-sand uppercase block">
                Join our beta program
              </span>
              <h3 className="text-xl sm:text-2xl font-display font-black text-white">
                지금, 온길의 <br />
                첫걸음과 함께하세요
              </h3>
              <p className="text-bento-olive/80 text-xs sm:text-sm leading-relaxed">
                파일럿 시범 구역인 정선·태백·삼척·고성의 열린 무장애 대안 안심 코스 
                GPX 트래킹 파일 및 전용 모바일 앱 베타 다운로드 링크를 송부해 드립니다.
              </p>
            </div>

            <div className="space-y-4 pt-12 border-t border-white/10 text-xs text-bento-olive relative z-10">
              <div className="flex gap-2 items-center">
                <Shield size={14} className="text-bento-moss" />
                <span>기재해주신 개인정보는 철저히 암호화됩니다.</span>
              </div>
              <p className="text-[10px]">
                © 2026 Ongil, inc. All rights reserved. <br />
                KTO 오픈 관광 정보 연동 인증 필함.
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
                    베타 테스터 신청 & 제휴 문의
                  </h4>
                  <p className="text-bento-dark/60 text-xs">
                    개인 여행 희망자 및 유관 부처/지자체 관계자 분들의 소중한 관심에 감사드립니다.
                  </p>

                  {/* Input Email */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-bento-dark/50 mb-1.5">
                      이메일 주소 <span className="text-bento-green">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@domain.com"
                      className="w-full px-4 py-2.5 rounded-2xl border border-bento-dark/10 bg-bento-bg/50 text-sm text-bento-dark placeholder-bento-dark/30 focus:outline-none focus:border-bento-green focus:bg-white transition-all duration-300"
                      required
                    />
                  </div>

                  {/* Select User type */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-bento-dark/50 mb-1.5">
                      참여 유형 <span className="text-bento-green">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { id: "traveler", label: "일반/교통약자 여행자" },
                        { id: "government", label: "지자체/RTO 관계자" },
                        { id: "business", label: "로컬 상인 및 제휴" }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setUserType(item.id)}
                          className={`px-3 py-2.5 rounded-2xl border text-xs font-medium transition-all text-center cursor-pointer ${
                            userType === item.id
                              ? "bg-bento-green/15 border-bento-green text-bento-green font-bold shadow-xs"
                              : "bg-bento-bg/50 border-bento-dark/10 text-bento-dark/60 hover:bg-bento-bg"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message (Optional) */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-bento-dark/50 mb-1.5">
                      문의 및 건의 사항 (선택)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      placeholder="온길에 하실 말씀이 있다면 자유롭게 남겨주세요."
                      className="w-full px-4 py-2.5 rounded-2xl border border-bento-dark/10 bg-bento-bg/50 text-sm text-bento-dark placeholder-bento-dark/30 focus:outline-none focus:border-bento-green focus:bg-white transition-all duration-300 resize-none"
                    />
                  </div>

                  {errors && (
                    <p className="text-xs text-bento-green font-medium">
                      ⚠️ {errors}
                    </p>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-bento-green hover:bg-bento-green/90 active:bg-bento-green text-white font-display font-black rounded-2xl text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send size={14} />
                    <span>온길 베타 신청 완료하기</span>
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
                      작성해주신 메일(<strong>{email}</strong>)로 강원도 4개 군의 배리어 프리 테마 경로 자료 및 테스트 가이드라인을 수 분 내로 발송하겠습니다.
                    </p>
                  </div>

                  <div className="bg-bento-dark text-bento-sand rounded-2xl p-4 max-w-xs mx-auto text-[11px] font-mono tracking-widest border border-white/10">
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
                    새로운 정보로 다시 접수하기
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
              <span className="font-display font-black text-lg text-white tracking-widest">온길 (Ongil)</span>
              <span className="text-white/10">|</span>
              <p className="text-bento-olive/80 text-left">덜 붐비는 여행, 더 넓은 발견</p>
            </div>
            
            <div className="flex flex-wrap gap-4 text-[11px]">
              <a href="#problem" className="hover:text-white transition-colors duration-300">소개</a>
              <a href="#features" className="hover:text-white transition-colors duration-300">핵심 기술</a>
              <a href="#simulator" className="hover:text-white transition-colors duration-300">시뮬레이션</a>
              <a href="#comparison" className="hover:text-white transition-colors duration-300">차별성</a>
              <a href="#regions" className="hover:text-white transition-colors duration-300">강원 4군</a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px]">
            <p className="text-left leading-relaxed max-w-xl text-bento-olive/60">
              본 서비스는 한국관광공사 국문 관광정보 OpenAPI 및 공공빅데이터 포털 데이터를 결합하여 설계되었습니다. 
              관광지 혼잡 예측 결과는 실시간 기상 상태에 따라 최대 ±15%의 편차가 존재할 수 있습니다.
            </p>
            <div className="flex gap-1.5 text-bento-olive/40 font-bold">
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
