import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Footprints, 
  Map, 
  MapPin, 
  Clock, 
  Navigation, 
  Heart, 
  SlidersHorizontal, 
  Info, 
  Check, 
  X, 
  ChevronRight, 
  ShieldAlert,
  ArrowRight,
  Accessibility,
  CornerDownRight,
  Leaf,
  Baby,
  PawPrint,
  Sparkles
} from "lucide-react";
import { MockDestination, mockDestinations } from "../data/destinations";

interface CourseTabProps {
  onSelectDestination: (destination: MockDestination) => void;
  likedDestinations: string[];
  onToggleLike: (id: string) => void;
}

interface WalkingCourse {
  id: string;
  name: string;
  distanceKm: number;
  timeMins: number;
  difficulty: "쉬움" | "보통" | "어려움";
  region: "고성" | "정선" | "태백" | "삼척";
  isDepopulationArea: boolean;
  accessibility: {
    wheelchair: boolean;
    stroller: boolean;
    petFriendly: boolean;
    details: string;
  };
  summary: string;
  image: string;
  linkedDestIds: string[]; // Associated mock destinations
  segments: {
    name: string;
    distance: string;
    safety: "안전" | "주의" | "우회 필요";
    roadType: string;
    description: string;
  }[];
}

const mockCourses: WalkingCourse[] = [
  {
    id: "c001",
    name: "두루누비 해파랑길 46코스 (고성 안심 연결로)",
    distanceKm: 2.1,
    timeMins: 45,
    difficulty: "쉬움",
    region: "고성",
    isDepopulationArea: true,
    accessibility: {
      wheelchair: true,
      stroller: true,
      petFriendly: true,
      details: "계단과 높은 턱을 전면 배제한 고성 바다 조망 보행 전용 데크길"
    },
    summary: "고성 능파대와 아야진 해변을 잇는 잔잔한 에메랄드빛 해안 데크 노선입니다. 완만한 우회 경사 통로만을 개조해 보행 약자 보호에 최고입니다.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    linkedDestIds: ["d001", "d007"],
    segments: [
      {
        name: "1구간: 아야진항 입구 ~ 해안 쉼터",
        distance: "0.8km",
        safety: "안전",
        roadType: "나무 데크 (평지)",
        description: "폭 3m 이상의 고른 데크 보행로. 전 구간 안전 펜스가 설치되어 있으며 휠체어 전용 쉼터가 위치합니다."
      },
      {
        name: "2구간: 바다 기암절벽지 ~ 능파대 보도교",
        distance: "1.3km",
        safety: "주의",
        roadType: "황토 다짐길 (경사 3%)",
        description: "천연 기암석 조망을 위해 바닥 평탄화 마무리가 잘 된 완만한 흙길입니다. 바람이 다소 많이 부는 지대입니다."
      }
    ]
  },
  {
    id: "c002",
    name: "정선 동강 에코트레일 1구간 (소금강 무장애 숲길)",
    distanceKm: 3.5,
    timeMins: 75,
    difficulty: "쉬움",
    region: "정선",
    isDepopulationArea: true,
    accessibility: {
      wheelchair: true,
      stroller: true,
      petFriendly: true,
      details: "경사도 3% 미만의 평탄 황톳길, 교행 안전폭 2.5m 확보"
    },
    summary: "정선 동강의 웅장한 천연 비경을 편안하게 즐기는 힐링 트레일입니다. 스마트 보행 센서와 스마트 쉼터 6개소가 고르게 배치되어 넉넉한 휴식이 보장됩니다.",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80",
    linkedDestIds: ["d002", "d008"],
    segments: [
      {
        name: "1구간: 소금강 관리소 ~ 할미꽃 군락지",
        distance: "1.5km",
        safety: "안전",
        roadType: "스마트 황토 포장길 (무장애)",
        description: "턱이 완벽히 봉쇄된 친환경 평탄 가옥길. 휠체어와 유모차 이동에 가장 원활한 등급을 자랑합니다."
      },
      {
        name: "2구간: 절벽 수변데크 ~ 종점 쉼터",
        distance: "2.0km",
        safety: "안전",
        roadType: "수변 나무데크 (턱 없음)",
        description: "동강 수면에 인접해 걷는 길. 데크 틈새 간격이 0.5cm 미만으로 설계되어 휠체어 바퀴나 강아지 발톱 끼임이 방지됩니다."
      }
    ]
  },
  {
    id: "c003",
    name: "태백산 침엽수림 안심 산책로 (자작나무 피톤치드 코스)",
    distanceKm: 1.8,
    timeMins: 40,
    difficulty: "보통",
    region: "태백",
    isDepopulationArea: true,
    accessibility: {
      wheelchair: true,
      stroller: true,
      petFriendly: true,
      details: "해발 650m 대기 청정 전용, 숲 초입 1.2km 매트 마감"
    },
    summary: "태백 황지동 자작나무 숲을 가로지르는 건강 코스입니다. 침엽수림이 뿜는 음이온 밀도가 최상급이며, 미세먼지가 심한 날 도시 대피용 힐링처로 선정되었습니다.",
    image: "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=600&q=80",
    linkedDestIds: ["d003", "d009"],
    segments: [
      {
        name: "1구간: 자작나무 숲 초입 ~ 숲속 광장",
        distance: "1.2km",
        safety: "안전",
        roadType: "야자 매트 및 휠체어 전용 매트",
        description: "쿠션감이 좋아 실버 보행자, 무릎 약자에게 최적인 탄성 매트 보강로입니다."
      },
      {
        name: "2구간: 솔향 터널 ~ 산림 조망 쉼터",
        distance: "0.6km",
        safety: "우회 필요",
        roadType: "비탈 계단구간 (임도 대체로 완비)",
        description: "급한 계단 구간(30개)이 나옵니다. 휠체어와 유모차는 좌측 완만 임도(경사 5%) 무장애 대체 경로로 자동 유도됩니다."
      }
    ]
  },
  {
    id: "c004",
    name: "두루누비 해파랑길 29코스 (삼척 옥빛바다 열린길)",
    distanceKm: 1.5,
    timeMins: 35,
    difficulty: "쉬움",
    region: "삼척",
    isDepopulationArea: true,
    accessibility: {
      wheelchair: true,
      stroller: true,
      petFriendly: false,
      details: "해상 출렁다리 기점 계단 우회 안심 엘리베이터 정식 가동"
    },
    summary: "삼척 초곡항의 기암괴석 바다 절경을 관통하는 명품 데크 걷기 노선입니다. 관광약자 배려형 '열린관광지'로 공식 선포되어 계단 턱 제거 및 유모차 대여를 제공합니다.",
    image: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=600&q=80",
    linkedDestIds: ["d004", "d010"],
    segments: [
      {
        name: "1구간: 초곡 해양공원 ~ 해상 출렁다리 기점",
        distance: "0.8km",
        safety: "안전",
        roadType: "해상 철골 데크 (일자형)",
        description: "흔들림과 틈새가 전혀 없는 강력 목재 철골 데크. 바다 위를 공중보행하는 짜릿함을 휠체어 탑승 상태로 누릴 수 있습니다."
      },
      {
        name: "2구간: 출렁다리 구간 ~ 촛대바위 전망대",
        distance: "0.7km",
        safety: "주의",
        roadType: "현수교 교량 및 보도교",
        description: "출렁다리 진입부의 턱을 전면 완만 슬로프로 교체완료. 미풍이 조금 부는 날에는 속도 완화 보행이 좋습니다."
      }
    ]
  }
];

export default function CourseTab({
  onSelectDestination,
  likedDestinations,
  onToggleLike
}: CourseTabProps) {
  // Filters
  const [selectedRegion, setSelectedRegion] = useState<"all" | "고성" | "정선" | "태백" | "삼척">("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"all" | "쉬움" | "보통">("all");
  const [filterWheelchair, setFilterWheelchair] = useState(false);
  const [filterStroller, setFilterStroller] = useState(false);
  const [filterPetFriendly, setFilterPetFriendly] = useState(false);

  const [selectedCourse, setSelectedCourse] = useState<WalkingCourse | null>(null);

  // Filter application
  const filteredCourses = mockCourses.filter(course => {
    if (selectedRegion !== "all" && course.region !== selectedRegion) return false;
    if (selectedDifficulty !== "all" && course.difficulty !== selectedDifficulty) return false;
    if (filterWheelchair && !course.accessibility.wheelchair) return false;
    if (filterStroller && !course.accessibility.stroller) return false;
    if (filterPetFriendly && !course.accessibility.petFriendly) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* 1. Header */}
      <div className="text-center md:text-left">
        <span className="text-xs font-mono font-bold tracking-widest text-bento-green uppercase block mb-1">
          Durunubi Barrier-Free Walking Trails
        </span>
        <h2 className="text-2xl font-display font-black text-bento-dark tracking-tight leading-none mb-1.5 flex items-center gap-1.5 justify-center md:justify-start">
          <span>두루누비 걷기 코스 전용 탐색</span> <Footprints size={22} className="text-bento-green animate-pulse" />
        </h2>
        <p className="text-bento-dark/60 text-xs leading-relaxed max-w-2xl">
          지자체 및 문화체육관광부 두루누비 GPS 자료를 기반으로, 
          휠체어 교행 안전 수치 및 반려견 출입 기준을 정밀 매칭한 '열린 안심 길'을 제안합니다.
        </p>
      </div>

      {/* 2. Interactive Filter Chips Control Panel */}
      <div className="bg-white p-4.5 rounded-[2rem] border border-bento-dark/10 shadow-xs space-y-3">
        
        {/* Row 1: Regions */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-bento-dark/40 uppercase w-14 shrink-0">시군 선택:</span>
          {(["all", "고성", "정선", "태백", "삼척"] as const).map((reg) => (
            <button
              key={reg}
              onClick={() => setSelectedRegion(reg)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRegion === reg 
                  ? "bg-bento-green text-white shadow-xs" 
                  : "bg-bento-bg text-bento-dark/60 hover:bg-bento-dark/5"
              }`}
            >
              {reg === "all" ? "강원 4군 전체" : reg}
            </button>
          ))}
        </div>

        {/* Row 2: Difficulty */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-bento-dark/40 uppercase w-14 shrink-0">난이도:</span>
          {(["all", "쉬움", "보통"] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDifficulty === diff 
                  ? "bg-bento-green text-white shadow-xs" 
                  : "bg-bento-bg text-bento-dark/60 hover:bg-bento-dark/5"
              }`}
            >
              {diff === "all" ? "전체 난이도" : diff}
            </button>
          ))}
        </div>

        {/* Row 3: Accessibility */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-bento-dark/5">
          <span className="text-[10px] font-mono font-bold text-bento-dark/40 uppercase w-14 shrink-0">보조 조치:</span>
          <button
            onClick={() => setFilterWheelchair(!filterWheelchair)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterWheelchair ? "bg-bento-green text-white" : "bg-bento-bg text-bento-dark/60 border border-bento-dark/5"
            }`}
          >
            <Accessibility size={12} />
            <span>휠체어 가능</span>
            {filterWheelchair && <Check size={12} />}
          </button>
          <button
            onClick={() => setFilterStroller(!filterStroller)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterStroller ? "bg-bento-green text-white" : "bg-bento-bg text-bento-dark/60 border border-bento-dark/5"
            }`}
          >
            <Baby size={12} />
            <span>유모차 안심</span>
            {filterStroller && <Check size={12} />}
          </button>
          <button
            onClick={() => setFilterPetFriendly(!filterPetFriendly)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterPetFriendly ? "bg-bento-green text-white" : "bg-bento-bg text-bento-dark/60 border border-bento-dark/5"
            }`}
          >
            <PawPrint size={12} />
            <span>반려동물 동반</span>
            {filterPetFriendly && <Check size={12} />}
          </button>
        </div>
      </div>

      {/* 3. Curation Summary Banner */}
      <div className="p-3.5 bg-bento-olive/15 border border-bento-green/10 rounded-2xl text-xs text-bento-dark font-bold flex items-center gap-2.5">
        <Sparkles size={14} className="text-bento-green shrink-0 animate-pulse" />
        <span>
          오늘의 탐색 조건: <strong>{selectedRegion === "all" ? "강원 4군" : selectedRegion}</strong> + {filterWheelchair ? "휠체어 " : ""}{filterStroller ? "유모차 " : ""}{filterPetFriendly ? "반려가족 " : ""} 
          → <strong>총 {filteredCourses.length}개의 안심 걷기길 매칭완료!</strong>
        </span>
      </div>

      {/* 4. Core Course Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredCourses.map((course) => (
          <motion.div
            key={course.id}
            whileHover={{ y: -3 }}
            onClick={() => setSelectedCourse(course)}
            className="bg-white rounded-3xl border border-bento-dark/5 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all cursor-pointer shadow-xs"
          >
            <div className="relative h-44 shrink-0">
              <img
                src={course.image}
                alt={course.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bento-dark/80 via-transparent to-transparent" />
              
              {/* Region and Distance overlay */}
              <div className="absolute top-3 left-3 flex gap-1.5 items-center">
                <span className="text-[10px] font-bold bg-bento-green text-white px-2.5 py-0.5 rounded-md">
                  {course.region} 코스
                </span>
                <span className="text-[10px] font-bold bg-white text-bento-dark px-2.5 py-0.5 rounded-md">
                  총 {course.distanceKm}km ({course.timeMins}분)
                </span>
              </div>

              <div className="absolute bottom-3.5 left-4 text-white">
                <span className="text-[9px] font-bold text-bento-olive uppercase tracking-wider block">
                  두루누비 걷기노선 연계망
                </span>
                <h3 className="font-display font-black text-sm md:text-base tracking-tight leading-none mt-1">
                  {course.name}
                </h3>
              </div>
            </div>

            <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
              <p className="text-[11px] text-bento-dark/60 leading-relaxed line-clamp-2">
                {course.summary}
              </p>

              <div className="space-y-1.5 pt-2 border-t border-bento-dark/5">
                <span className="text-[9px] font-mono font-bold text-bento-dark/40 block">안심 보행 지표</span>
                <div className="flex flex-wrap gap-1">
                  {course.accessibility.wheelchair && (
                    <span className="bg-bento-bg text-bento-dark text-[9px] font-black px-2.5 py-1 rounded-full border border-bento-dark/5 flex items-center gap-1">
                      <Accessibility size={10} className="text-bento-green" />
                      <span>휠체어 안심</span>
                    </span>
                  )}
                  {course.accessibility.stroller && (
                    <span className="bg-bento-bg text-bento-dark text-[9px] font-black px-2.5 py-1 rounded-full border border-bento-dark/5 flex items-center gap-1">
                      <Baby size={10} className="text-amber-500" />
                      <span>유모차 가능</span>
                    </span>
                  )}
                  {course.accessibility.petFriendly && (
                    <span className="bg-bento-bg text-bento-dark text-[9px] font-black px-2.5 py-1 rounded-full border border-bento-dark/5 flex items-center gap-1">
                      <PawPrint size={10} className="text-orange-500" />
                      <span>반려동물 환영</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 5. COURSE DETAIL MODAL OVERLAY */}
      <AnimatePresence>
        {selectedCourse !== null && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-4 overflow-hidden">
            {/* Dark backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCourse(null)}
              className="fixed inset-0 bg-bento-dark/80 backdrop-blur-xs"
            />

            {/* Course Detail Card Container */}
            <motion.div
              initial={{ y: "100%", opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0.5 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative bg-bento-bg w-full h-full md:h-[90vh] md:max-w-2xl md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden z-10 text-left"
            >
              {/* Header Cover inside Modal */}
              <div className="relative h-48 shrink-0">
                <img
                  src={selectedCourse.image}
                  alt={selectedCourse.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-bento-dark/70" />
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-bento-dark/60 hover:text-bento-dark cursor-pointer"
                >
                  <X size={14} />
                </button>

                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <span className="text-[9px] font-bold text-bento-olive uppercase block mb-1">
                    두루누비 걷기노선 정밀관측지도
                  </span>
                  <h3 className="font-display font-black text-base md:text-lg tracking-tight leading-none">
                    {selectedCourse.name}
                  </h3>
                  <div className="flex gap-2 text-[10px] font-mono mt-2">
                    <span className="bg-white/20 text-white px-2 py-0.5 rounded-md">
                      거리 {selectedCourse.distanceKm} km
                    </span>
                    <span className="bg-white/20 text-white px-2 py-0.5 rounded-md font-bold">
                      소요시간 {selectedCourse.timeMins} 분
                    </span>
                    <span className="bg-bento-green text-white px-2.5 py-0.5 rounded-md font-bold">
                      난이도: {selectedCourse.difficulty}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                
                {/* 5-1. Summary Paragraph */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-bento-dark/40 uppercase block">개요</span>
                  <p className="text-xs text-bento-dark/80 leading-relaxed font-sans">{selectedCourse.summary}</p>
                </div>

                {/* 5-2. Segmented Safety Map Diagram (구간별 보행안전도 및 우회로 안내) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-bento-dark/40 uppercase">구간별 보행 한산안전도 관측선</span>
                    <span className="text-[8px] bg-bento-green/10 text-bento-green px-2 py-0.5 rounded-md font-mono">100% Barrier-Free Target</span>
                  </div>

                  {/* SVG Route Diagram */}
                  <div className="p-4 bg-white rounded-2xl border border-bento-dark/10 shadow-xs relative">
                    <div className="flex items-center justify-between relative z-10">
                      
                      {/* Node Start */}
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-bento-green text-white flex items-center justify-center text-[10px] font-bold font-mono">ST</div>
                        <span className="text-[9px] font-bold text-bento-dark/80 mt-1">출발지</span>
                      </div>

                      {/* Line 1 */}
                      <div className="flex-1 h-1.5 mx-1 relative bg-emerald-500 rounded-full flex items-center justify-center">
                        <span className="text-[7px] text-white font-black bg-emerald-600 px-1.5 rounded-full absolute -top-4 font-mono">0.8km 안전</span>
                      </div>

                      {/* Node Middle */}
                      <div className="flex flex-col items-center">
                        <div className="w-5 h-5 rounded-full bg-amber-400 text-bento-dark flex items-center justify-center text-[10px] font-bold">●</div>
                        <span className="text-[9px] font-bold text-bento-dark/80 mt-1">대피 갈림길</span>
                      </div>

                      {/* Line 2 */}
                      <div className={`flex-1 h-1.5 mx-1 relative rounded-full flex items-center justify-center ${
                        selectedCourse.id === "c003" ? "bg-amber-400" : "bg-emerald-500"
                      }`}>
                        <span className="text-[7px] text-white font-black bg-amber-500 px-1.5 rounded-full absolute -top-4 font-mono">
                          {selectedCourse.id === "c003" ? "우회 슬로프" : "1.3km 안전"}
                        </span>
                      </div>

                      {/* Node End */}
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-bento-dark text-white flex items-center justify-center text-[10px] font-mono font-bold">ED</div>
                        <span className="text-[9px] font-bold text-bento-dark/80 mt-1">도착지</span>
                      </div>

                    </div>

                    {/* Background SVG decorative contour */}
                    <div className="absolute inset-0 bg-[radial-gradient(#1a2f2303_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />
                  </div>
                </div>

                {/* 5-3. Detail Segments Lists */}
                <div className="space-y-3">
                  <span className="text-[9px] font-bold text-bento-dark/40 uppercase block">구간 인프라 정밀 실측 세부</span>
                  
                  <div className="space-y-2.5">
                    {selectedCourse.segments.map((seg, idx) => (
                      <div key={idx} className="p-3 bg-white border border-bento-dark/5 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-bento-dark flex items-center gap-1.5">
                            <CornerDownRight size={12} className="text-bento-green" />
                            <span>{seg.name}</span>
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            seg.safety === "안전" 
                              ? "bg-emerald-50 text-emerald-800" 
                              : seg.safety === "주의" 
                              ? "bg-amber-50 text-amber-800" 
                              : "bg-red-50 text-red-800"
                          }`}>
                            ● {seg.safety} ({seg.distance})
                          </span>
                        </div>
                        <p className="text-[10px] text-bento-dark/60 leading-relaxed font-sans">{seg.description}</p>
                        <div className="text-[9px] text-bento-dark/40 font-mono">
                          바닥 타입: <strong>{seg.roadType}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5-4. Associated Tourist Spots (연계 관광지) */}
                <div className="space-y-3">
                  <span className="text-[9px] font-bold text-bento-dark/40 uppercase block">코스 인근 연계 안심지</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {mockDestinations
                      .filter(d => selectedCourse.linkedDestIds.includes(d.id))
                      .map((dest) => (
                        <div
                          key={dest.id}
                          onClick={() => {
                            setSelectedCourse(null);
                            onSelectDestination(dest);
                          }}
                          className="bg-white p-2.5 rounded-2xl border border-bento-dark/5 flex gap-2.5 items-center cursor-pointer hover:border-bento-green/40 transition-all"
                        >
                          <img
                            src={dest.image}
                            alt={dest.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1 text-left">
                            <h5 className="text-[11px] font-bold text-bento-dark truncate leading-none mb-1">{dest.name}</h5>
                            <span className="text-[9px] font-mono text-bento-green">혼잡도 {dest.congestionLevel}%</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

              </div>

              {/* Action buttons inside overlay */}
              <div className="p-4 bg-white border-t border-bento-dark/5 shrink-0 flex gap-2">
                <button
                  onClick={() => {
                    alert(`${selectedCourse.name}의 오프라인 휠체어 안전지도와 GPS 오프라인 트래킹맵이 두루누비 앱 및 스마트폰 카카오맵 동기화 모의 전송되었습니다!`);
                  }}
                  className="flex-1 py-3 bg-bento-green hover:bg-bento-green/90 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Navigation size={12} />
                  <span>GPS 및 안심 음성 안내 받기</span>
                </button>
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="px-4 py-3 bg-bento-dark hover:bg-bento-dark/90 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
