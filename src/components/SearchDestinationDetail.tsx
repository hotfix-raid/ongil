import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  X,
  MapPin,
  Heart,
  Clock,
  Calendar,
  Phone,
  Car,
  Baby,
  PawPrint,
  Accessibility,
  Info,
  Navigation,
  RefreshCw
} from "lucide-react";

interface SearchDestinationDetailProps {
  contentId: string;
  forecastDate?: string;
  onClose: () => void;
  isLiked: boolean;
  onToggleLike: (id: string) => void;
}

interface AttractionDetail {
  content_id: string;
  content_type_id: string | null;
  title: string;
  addr1: string | null;
  addr2: string | null;
  tel: string | null;
  firstimage: string | null;
  firstimage2: string | null;
  mapx: number | string | null;
  mapy: number | string | null;
  infocenter: string | null;
  opendate: string | null;
  restdate: string | null;
  expguide: string | null;
  expagerange: string | null;
  accomcount: string | null;
  useseason: string | null;
  usetime: string | null;
  parking: string | null;
  chkbabycarriage: string | null;
  chkpet: string | null;
  chkcreditcard: string | null;
  ldong_regn_cd: string | null;
  ldong_signgu_cd: string | null;
}

interface BarrierFreeInfo {
  parking: string | null;
  publictransport: string | null;
  route: string | null;
  ticketoffice: string | null;
  promotion: string | null;
  wheelchair: string | null;
  exit: string | null;
  elevator: string | null;
  restroom: string | null;
  auditorium: string | null;
  room: string | null;
  handicapetc: string | null;
  braileblock: string | null;
  helpdog: string | null;
  guidehuman: string | null;
  audioguide: string | null;
  bigprint: string | null;
  brailepromotion: string | null;
  guidesystem: string | null;
  blindhandicapetc: string | null;
  signguide: string | null;
  videoguide: string | null;
  hearingroom: string | null;
  hearinghandicapetc: string | null;
  stroller: string | null;
  lactationroom: string | null;
  babysparechair: string | null;
  infantsfamilyetc: string | null;
  has_physical_disability_info: number | boolean | null;
  has_visual_disability_info: number | boolean | null;
  has_hearing_disability_info: number | boolean | null;
  has_infant_family_info: number | boolean | null;
}

interface PetInfo {
  acmpy_psbl_cpam: string | null;
  acmpy_type_cd: string | null;
  acmpy_need_mtr: string | null;
  rela_rntl_prdlst: string | null;
  rela_frnsh_prdlst: string | null;
  rela_purc_prdlst: string | null;
  rela_acdnt_risk_mtr: string | null;
  rela_poses_fclty: string | null;
  etc_acmpy_info: string | null;
  pet_tursm_info: string | null;
}

interface Congestion {
  cnctrRate: number;
  baseYmd: string;
}

interface DetailResponse {
  attraction: AttractionDetail | null;
  barrierFree: BarrierFreeInfo | null;
  petInfo: PetInfo | null;
  congestion: Congestion | null;
}

function hasValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return true;
  return false;
}

function isFlagEnabled(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  return false;
}

function formatTravelDate(dateString: string): string {
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return dateString;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${year}년 ${Number(month)}월 ${Number(day)}일 (${days[date.getDay()]})`;
}

function getCongestionStyle(rate: number) {
  if (rate <= 20) {
    return {
      bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
      badge: "bg-emerald-500",
      text: "쾌적·한산",
      desc: "유모차, 휠체어, 반려동물과 여유로운 교행이 가능합니다."
    };
  }
  if (rate <= 50) {
    return {
      bg: "bg-amber-50 border-amber-200 text-amber-800",
      badge: "bg-amber-500",
      text: "보통",
      desc: "일부 구간에 약한 밀집이 예상되나, 보행에는 무리가 없습니다."
    };
  }
  return {
    bg: "bg-red-50 border-red-200 text-red-800",
    badge: "bg-red-500",
    text: "혼잡·밀집",
    desc: "보행 정체와 주차 대기가 예상되니, 보행 약자는 유의하세요."
  };
}

const basicInfoFields: Array<[keyof AttractionDetail, string, React.ElementType]> = [
  ["useseason", "이용 가능 계절", Calendar],
  ["usetime", "이용 시간", Clock],
  ["restdate", "쉬는 날", Calendar],
  ["opendate", "개장일", Calendar],
  ["expguide", "체험 안내", Info],
  ["expagerange", "체험 가능 연령", Info],
  ["accomcount", "수용 인원", Info],
  ["infocenter", "안내소", Phone],
  ["parking", "주차 시설", Car],
  ["chkbabycarriage", "유모차 대여", Baby],
  ["chkpet", "애견동반", PawPrint],
  ["chkcreditcard", "신용카드", Info]
];

const barrierGroups: Array<{
  title: string;
  flagKey: keyof BarrierFreeInfo;
  fields: Array<[keyof BarrierFreeInfo, string]>;
}> = [
  {
    title: "지체·거동 불편",
    flagKey: "has_physical_disability_info",
    fields: [
      ["parking", "주차"],
      ["publictransport", "대중교통"],
      ["route", "접근로"],
      ["ticketoffice", "매표소"],
      ["promotion", "홍보물"],
      ["wheelchair", "휠체어 접근"],
      ["exit", "출입통로"],
      ["elevator", "엘리베이터"],
      ["restroom", "화장실"],
      ["auditorium", "관람석"],
      ["room", "객실"],
      ["handicapetc", "기타"]
    ]
  },
  {
    title: "시각 안내",
    flagKey: "has_visual_disability_info",
    fields: [
      ["braileblock", "점자블록"],
      ["helpdog", "안내견"],
      ["guidehuman", "안내인"],
      ["audioguide", "오디오가이드"],
      ["bigprint", "큰활자 홍보물"],
      ["brailepromotion", "점자 홍보물"],
      ["guidesystem", "유도안내 시스템"],
      ["blindhandicapetc", "기타"]
    ]
  },
  {
    title: "청각 안내",
    flagKey: "has_hearing_disability_info",
    fields: [
      ["signguide", "수화 안내"],
      ["videoguide", "자막·비디오가이드"],
      ["hearingroom", "청각 보조기구"],
      ["hearinghandicapetc", "기타"]
    ]
  },
  {
    title: "영유아·가족 편의",
    flagKey: "has_infant_family_info",
    fields: [
      ["stroller", "유모차"],
      ["lactationroom", "수유실"],
      ["babysparechair", "유아용 보조의자"],
      ["infantsfamilyetc", "기타"]
    ]
  }
];

const petInfoFields: Array<[keyof PetInfo, string]> = [
  ["acmpy_psbl_cpam", "반려동물 동반 가능 여부"],
  ["acmpy_type_cd", "동반 가능 유형"],
  ["acmpy_need_mtr", "동반 시 준수사항"],
  ["rela_rntl_prdlst", "대여 품목"],
  ["rela_frnsh_prdlst", "비치 품목"],
  ["rela_purc_prdlst", "구매 품목"],
  ["rela_acdnt_risk_mtr", "사고 대비 주의사항"],
  ["rela_poses_fclty", "구비 시설"],
  ["etc_acmpy_info", "기타 동반 정보"],
  ["pet_tursm_info", "애견동반 여행 안내"]
];

export default function SearchDestinationDetail({
  contentId,
  forecastDate,
  onClose,
  isLiked,
  onToggleLike
}: SearchDestinationDetailProps) {
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const dateParam =
        forecastDate && /^\d{4}-\d{2}-\d{2}$/.test(forecastDate)
          ? `?date=${encodeURIComponent(forecastDate)}`
          : "";
      const response = await fetch(`/api/tour-attractions/${contentId}${dateParam}`);
      if (!response.ok) throw new Error("request failed");
      const json = (await response.json()) as DetailResponse;
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [contentId, forecastDate]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail, retryCount]);

  useEffect(() => {
    const root = document.getElementById("root");
    const target = root ?? document.body;
    const original = target.style.overflow;
    target.style.overflow = "hidden";
    return () => {
      target.style.overflow = original;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  const attraction = data?.attraction;
  const title = attraction?.title ?? "";
  const address = [attraction?.addr1, attraction?.addr2].filter(hasValue).join(" ");
  const image = attraction?.firstimage || attraction?.firstimage2;

  const visibleBasicInfo = attraction
    ? basicInfoFields.filter(([key]) => hasValue(attraction[key]))
    : [];

  const visibleBarrierGroups = barrierGroups
    .filter((group) => isFlagEnabled(data?.barrierFree?.[group.flagKey]))
    .map((group) => ({
      ...group,
      entries: group.fields.filter(([key]) => hasValue(data?.barrierFree?.[key]))
    }))
    .filter((group) => group.entries.length > 0);

  const visiblePetInfo = data?.petInfo
    ? petInfoFields.filter(([key]) => hasValue(data.petInfo?.[key]))
    : [];

  const hasCoordinates =
    hasValue(attraction?.mapx) && hasValue(attraction?.mapy);

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
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-destination-title"
        initial={{ y: "100%", opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0.5 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative bg-bento-bg w-full h-full md:h-[90vh] md:max-w-2xl md:rounded-lg shadow-lg flex flex-col overflow-hidden z-10"
      >
        {loading ? (
          <DetailSkeleton />
        ) : error || !attraction ? (
          <ErrorState
            onRetry={() => setRetryCount((count) => count + 1)}
            onClose={onClose}
          />
        ) : (
          <>
            {/* Hero Image */}
            <div className="relative h-64 md:h-72 shrink-0">
              {image ? (
                <img
                  src={image}
                  alt={title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-bento-green/30 via-bento-moss/20 to-bento-sand/30" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-bento-ink/80 via-bento-ink/20 to-transparent" />

              {/* Header Buttons */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-xs hover:bg-white text-bento-dark flex items-center justify-center shadow-sm transition-all duration-fast active:scale-95 cursor-pointer"
                  aria-label="닫기"
                >
                  <X size={18} />
                </button>
                <button
                  onClick={() => onToggleLike(contentId)}
                  className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-xs hover:bg-white text-bento-dark flex items-center justify-center shadow-sm transition-all duration-fast active:scale-95 cursor-pointer"
                  aria-label={isLiked ? "좋아요 취소" : "좋아요"}
                >
                  <Heart
                    size={18}
                    className={
                      isLiked ? "fill-red-500 text-red-500" : "text-bento-dark/60"
                    }
                  />
                </button>
              </div>

              {/* Title Layer */}
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <h2
                  id="search-destination-title"
                  className="text-2xl md:text-3xl font-display font-black tracking-tight drop-shadow-sm line-clamp-2"
                >
                  {title}
                </h2>
                {address && (
                  <p className="text-sm text-white/80 font-sans mt-1.5 flex items-start gap-1.5">
                    <MapPin size={14} className="text-bento-moss shrink-0 mt-0.5" />
                    <span>{address}</span>
                  </p>
                )}
                {hasValue(attraction.tel) && (
                  <p className="text-sm text-white/80 font-sans mt-1 flex items-center gap-1.5">
                    <Phone size={14} className="text-bento-moss shrink-0" />
                    <span>{attraction.tel}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Congestion Banner */}
              {data.congestion && data.congestion.cnctrRate != null ? (
                <div className="space-y-1.5">
                  <CongestionBanner rate={data.congestion.cnctrRate} />
                  {forecastDate && (
                    <p className="pl-1 text-[11px] font-medium text-bento-dark/50">
                      {formatTravelDate(forecastDate)} 기준
                    </p>
                  )}
                </div>
              ) : forecastDate ? (
                <p className="text-xs leading-relaxed text-bento-dark/55">
                  선택하신 여행 일자에는 혼잡도 정보가 없어요
                </p>
              ) : null}

              {/* Basic Info */}
              {visibleBasicInfo.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-sm font-display font-bold text-bento-dark/50">
                    기본 정보
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {visibleBasicInfo.map(([key, label, Icon]) => {
                      const value = attraction[key];
                      return (
                        <div
                          key={key}
                          className="p-3 rounded-md border border-border-subtle bg-white flex items-start gap-2.5"
                        >
                          <div className="w-7 h-7 rounded-full bg-bento-dark/5 flex items-center justify-center shrink-0">
                            <Icon size={13} className="text-bento-green" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-bento-dark/40 block">
                              {label}
                            </span>
                            <p className="text-xs text-bento-dark/80 leading-relaxed whitespace-pre-line">
                              {String(value)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Barrier-Free Info */}
              {visibleBarrierGroups.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-sm font-display font-bold text-bento-dark/50">
                    배리어프리 정보
                  </h3>
                  {visibleBarrierGroups.map((group) => (
                    <div
                      key={group.title}
                      className="p-4 bg-white rounded-md border border-border-subtle space-y-3"
                    >
                      <h4 className="text-xs font-bold text-bento-dark flex items-center gap-2">
                        <Accessibility size={14} className="text-bento-green" />
                        {group.title}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {group.entries.map(([key, label]) => {
                          const value = data.barrierFree?.[key];
                          return (
                            <div key={key} className="flex items-start gap-2">
                              <span className="text-[10px] font-bold text-bento-dark/40 shrink-0 w-20">
                                {label}
                              </span>
                              <p className="text-xs text-bento-dark/80 leading-relaxed flex-1">
                                {String(value)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {/* Pet Info */}
              {visiblePetInfo.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-sm font-display font-bold text-bento-dark/50">
                    반려동물 정보
                  </h3>
                  <div className="p-4 bg-white rounded-md border border-border-subtle space-y-3">
                    {visiblePetInfo.map(([key, label]) => {
                      const value = data.petInfo?.[key];
                      return (
                        <div key={key} className="flex items-start gap-2">
                          <span className="text-[10px] font-bold text-bento-dark/40 shrink-0 w-24">
                            {label}
                          </span>
                          <p className="text-xs text-bento-dark/80 leading-relaxed flex-1 whitespace-pre-line">
                            {String(value)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Location */}
              {hasCoordinates && (
                <section className="space-y-3">
                  <h3 className="text-sm font-display font-bold text-bento-dark/50">
                    위치
                  </h3>
                  <a
                    href={`https://map.kakao.com/link/map/${encodeURIComponent(title)},${attraction.mapy},${attraction.mapx}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md bg-bento-dark text-white px-4 py-3 text-xs font-bold shadow-sm transition-all duration-base hover:bg-bento-ink active:scale-98"
                  >
                    <Navigation size={14} />
                    <span>카카오맵에서 위치 보기</span>
                  </a>
                </section>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-border-subtle shrink-0 flex items-center justify-between gap-3">
              {hasCoordinates ? (
                <a
                  href={`https://map.kakao.com/link/to/${encodeURIComponent(title)},${attraction.mapy},${attraction.mapx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3.5 bg-bento-green hover:bg-bento-green/90 active:scale-98 text-white text-xs font-bold rounded-sm shadow-md transition-all duration-base flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Navigation size={14} />
                  <span>길찾기</span>
                </a>
              ) : (
                <div className="flex-1" />
              )}
              <button
                onClick={onClose}
                className="px-5 py-3.5 bg-bento-dark hover:bg-bento-dark/90 active:scale-98 text-white text-xs font-bold rounded-sm transition-all duration-base cursor-pointer"
              >
                닫기
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

function CongestionBanner({ rate }: { rate: number }) {
  const style = getCongestionStyle(rate);
  return (
    <div
      className={`p-4 rounded-lg border flex items-start gap-3.5 transition-all ${style.bg}`}
    >
      <div className="mt-1 shrink-0">
        <div className={`w-3 h-3 rounded-full ${style.badge} shadow-sm`} />
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-sm tracking-tight">
            예상 혼잡도 {rate}% — {style.text}
          </span>
        </div>
        <p className="text-xs leading-relaxed opacity-90">{style.desc}</p>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <>
      <div className="relative h-64 md:h-72 shrink-0 bg-bento-dark/10 animate-pulse">
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <div className="w-10 h-10 rounded-full bg-white/80" />
          <div className="w-10 h-10 rounded-full bg-white/80" />
        </div>
        <div className="absolute bottom-6 left-6 right-6 space-y-3">
          <div className="h-8 w-3/4 rounded bg-white/30" />
          <div className="h-4 w-1/2 rounded bg-white/20" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="h-20 rounded-lg bg-bento-dark/[0.04] animate-pulse" />
        <div className="space-y-3">
          <div className="h-4 w-20 rounded bg-bento-dark/10" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-20 rounded-md bg-bento-dark/[0.04] animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
      <div className="p-4 bg-white border-t border-border-subtle shrink-0 flex justify-end">
        <div className="h-10 w-24 rounded-sm bg-bento-dark/10 animate-pulse" />
      </div>
    </>
  );
}

function ErrorState({
  onRetry,
  onClose
}: {
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-bento-bg text-bento-green flex items-center justify-center mb-4">
        <RefreshCw size={20} />
      </div>
      <h3 className="font-display text-base font-black text-bento-dark">
        정보를 불러오지 못했어요
      </h3>
      <p className="mt-2 text-xs text-bento-dark/50">
        잠시 후 다시 시도해 주세요.
      </p>
      <div className="mt-6 flex items-center gap-2">
        <button
          onClick={onRetry}
          className="rounded-lg bg-bento-green px-4 py-2.5 text-xs font-bold text-white transition-all duration-fast hover:bg-bento-green/90 active:scale-98 cursor-pointer"
        >
          다시 시도
        </button>
        <button
          onClick={onClose}
          className="rounded-lg bg-bento-dark px-4 py-2.5 text-xs font-bold text-white transition-all duration-fast hover:bg-bento-dark/90 active:scale-98 cursor-pointer"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
