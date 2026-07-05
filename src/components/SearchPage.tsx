import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  SlidersHorizontal, 
  Navigation, 
  Sun, 
  CloudRain, 
  Cloud, 
  Wind, 
  Info, 
  Plus, 
  Minus, 
  Check, 
  ChevronDown, 
  X, 
  ArrowRight, 
  Sparkles, 
  Compass, 
  AlertTriangle, 
  Flame, 
  Trees, 
  Accessibility, 
  Footprints,
  Maximize2
} from "lucide-react";

// Types for search results
interface MockDestination {
  id: string;
  name: string;
  region: "고성" | "정선" | "태백" | "삼척" | "강릉" | "속초";
  regionFull: string;
  isDepopulationArea: boolean; // 인구감소지역 여부
  category: "자연/해안" | "산림/계곡" | "역사/문화" | "체험/랜드마크";
  congestionLevel: number; // 0 to 100
  congestionStatus: "low" | "medium" | "high";
  petFriendly: {
    allowed: boolean;
    conditions: string;
    details: { indoor: boolean; outdoor: boolean; largeDog: boolean };
  };
  accessibility: {
    wheelchair: boolean;
    stroller: boolean;
    senior: boolean;
    parking: boolean;
    note: string;
  };
  walkingCourse?: {
    name: string;
    distanceKm: number;
    difficulty: "쉬움" | "보통" | "어려움";
  };
  weatherAdjustedRecommendation: string;
  image: string;
  alternativeId?: string; // If this is a crowded spot, link to alternative ID
  description: string;
}

// 10 Mock Destinations (as specified in prompt data model guidelines)
const mockDestinations: MockDestination[] = [
  {
    id: "d001",
    name: "고성 능파대",
    region: "고성",
    regionFull: "강원 고성군 토성면",
    isDepopulationArea: true,
    category: "자연/해안",
    congestionLevel: 14,
    congestionStatus: "low",
    petFriendly: {
      allowed: true,
      conditions: "실외 동반 가능, 목줄 및 배변봉투 필수",
      details: { indoor: false, outdoor: true, largeDog: true }
    },
    accessibility: {
      wheelchair: true,
      stroller: true,
      senior: true,
      parking: true,
      note: "평평한 나무 데크 보행로 연결로 바다 위 기암괴석을 눈앞에서 조망"
    },
    walkingCourse: {
      name: "해파랑길 46코스 (안심 연결로)",
      distanceKm: 2.1,
      difficulty: "쉬움"
    },
    weatherAdjustedRecommendation: "야외 보행 적합 (해안 바닷바람 주의)",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    description: "바다 위에 신비롭게 서 있는 풍화혈 바위 군락입니다. 턱이 전혀 없는 완만한 고원 데크길이 개설되어 휠체어와 유모차 이동에 아주 적합합니다."
  },
  {
    id: "d002",
    name: "정선 동강 소금강길",
    region: "정선",
    regionFull: "강원 정선군 화암면",
    isDepopulationArea: true,
    category: "산림/계곡",
    congestionLevel: 11,
    congestionStatus: "low",
    petFriendly: {
      allowed: true,
      conditions: "실내외 동반 및 소형견 가능",
      details: { indoor: true, outdoor: true, largeDog: false }
    },
    accessibility: {
      wheelchair: true,
      stroller: true,
      senior: true,
      parking: true,
      note: "경사율 3% 미만의 평탄화 흙길, 보행 약자를 위한 황토 쉼터 완비"
    },
    walkingCourse: {
      name: "동강 에코트레일 1구간",
      distanceKm: 3.5,
      difficulty: "쉬움"
    },
    weatherAdjustedRecommendation: "울창한 산림 그늘로 한여름 피서지 적합",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80",
    description: "동강의 기암절벽을 감상하며 걷는 명품 숲길입니다. 자연경관이 매우 수려하며 보도 폭이 2.5m 이상으로 넉넉해 교행이 자유롭습니다."
  },
  {
    id: "d003",
    name: "태백 바람의 언덕",
    region: "태백",
    regionFull: "강원 태백시 삼수동",
    isDepopulationArea: true,
    category: "체험/랜드마크",
    congestionLevel: 18,
    congestionStatus: "low",
    petFriendly: {
      allowed: true,
      conditions: "전 구역 목줄 동반 가능, 넓은 야외 잔디밭",
      details: { indoor: false, outdoor: true, largeDog: true }
    },
    accessibility: {
      wheelchair: true,
      stroller: true,
      senior: true,
      parking: true,
      note: "전망대까지 경사 무장애 전용 전동 셔틀버스 정기 운행"
    },
    walkingCourse: {
      name: "낙동정맥 트레일 우회길",
      distanceKm: 1.8,
      difficulty: "보통"
    },
    weatherAdjustedRecommendation: "기온이 매우 시원하나 미세먼지 나쁜 날은 마스크 필수",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    description: "해발 1,200m에 펼쳐진 푸른 고랭지 밭과 웅장한 풍력발전기들이 조화를 이룹니다. 한여름에도 열대야가 없어 쾌적한 야외 힐링을 선사합니다."
  },
  {
    id: "d004",
    name: "삼척 초곡용굴촛대바위길",
    region: "삼척",
    regionFull: "강원 삼척시 근덕면",
    isDepopulationArea: true,
    category: "자연/해안",
    congestionLevel: 22,
    congestionStatus: "low",
    petFriendly: {
      allowed: false,
      conditions: "반려동물 출입 전면 제한 (군사지역 및 천연 환경 보호 구역)",
      details: { indoor: false, outdoor: false, largeDog: false }
    },
    accessibility: {
      wheelchair: true,
      stroller: true,
      senior: true,
      parking: true,
      note: "바다 위에 계단 없이 평평하게 이어진 660m 안심 목재 데크길"
    },
    walkingCourse: {
      name: "해파랑길 29코스 열린 안심 노선",
      distanceKm: 0.7,
      difficulty: "쉬움"
    },
    weatherAdjustedRecommendation: "우천 시 다소 미끄러울 수 있으니 주의",
    image: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=600&q=80",
    description: "초곡항 인근에 숨겨진 기암괴석과 바다 동굴 초곡용굴을 한눈에 누릴 수 있는 바다 산책로입니다. 흔들림 없는 완벽한 철골 기둥 데크가 조성되어 누구나 안전합니다."
  },
  {
    id: "d005",
    name: "강릉 안목 커피거리 & 경포해변",
    region: "강릉",
    regionFull: "강원 강릉시 창해로",
    isDepopulationArea: false,
    category: "자연/해안",
    congestionLevel: 94,
    congestionStatus: "high",
    petFriendly: {
      allowed: false,
      conditions: "해변 다수 구역 반려견 제한, 인근 카페 85% 이상 노펫존",
      details: { indoor: false, outdoor: false, largeDog: false }
    },
    accessibility: {
      wheelchair: false,
      stroller: false,
      senior: false,
      parking: false,
      note: "주말 주차 대기 평균 45분 이상, 고운 모래사장 내 경사 진입로 태부족"
    },
    weatherAdjustedRecommendation: "과밀 및 폭염 시 온열 질환 우려",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80",
    alternativeId: "d001", // Links to 고성 능파대 or 고성 아야진
    description: "매우 유명한 강릉의 명소이지만, 주말과 성수기에는 엄청난 차량 정체와 소음으로 힐링과는 거리가 멉니다. 인도 폭이 좁고 휠체어가 모래에 빠지기 쉬운 구조입니다."
  },
  {
    id: "d006",
    name: "속초 청초호 & 속초해수욕장",
    region: "속초",
    regionFull: "강원 속초시 조양동",
    isDepopulationArea: false,
    category: "체험/랜드마크",
    congestionLevel: 88,
    congestionStatus: "high",
    petFriendly: {
      allowed: true,
      conditions: "야외 잔디공원은 리드줄 필수, 실내 해수욕장은 일부 금지",
      details: { indoor: false, outdoor: true, largeDog: false }
    },
    accessibility: {
      wheelchair: false,
      stroller: false,
      senior: false,
      parking: false,
      note: "유동 인파 폭증으로 주말 전동 휠체어/유모차 추돌 우려"
    },
    weatherAdjustedRecommendation: "인파 과밀로 주말 야간 도보 혼잡 극심",
    image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=600&q=80",
    alternativeId: "d004", // Links to 삼척 초곡용굴 or 고성 능파대
    description: "관광 자원과 편의시설은 잘 조성되어 있으나, 집중도가 매우 높아 주차 대기 및 식음료 매장 대기가 기본 1시간에 달해 보행 피로도가 극도로 높습니다."
  },
  {
    id: "d007",
    name: "고성 아야진 해변",
    region: "고성",
    regionFull: "강원 고성군 토성면 아야진리",
    isDepopulationArea: true,
    category: "자연/해안",
    congestionLevel: 19,
    congestionStatus: "low",
    petFriendly: {
      allowed: true,
      conditions: "아야진 북단 댕수욕장(반려견 전용 모래사장) 지정 운영",
      details: { indoor: false, outdoor: true, largeDog: true }
    },
    accessibility: {
      wheelchair: true,
      stroller: true,
      senior: true,
      parking: true,
      note: "아야진항 넓은 무료주차장 및 장애인 공중 화장실 바로 연결"
    },
    weatherAdjustedRecommendation: "바람이 순하여 여름철 한산한 수영 및 산책에 적합",
    image: "https://images.unsplash.com/photo-1473116763269-25541579ffb7?auto=format&fit=crop&w=600&q=80",
    description: "알록달록한 무지개 해안 블록과 투명하고 맑은 수심을 구비한 한산한 바닷가입니다. 댕가족 전용 구역이 공식 선포되어 반려견과 함께 수영할 수 있습니다."
  },
  {
    id: "d008",
    name: "정선 민둥산 억새 평원",
    region: "정선",
    regionFull: "강원 정선군 남면",
    isDepopulationArea: true,
    category: "산림/계곡",
    congestionLevel: 15,
    congestionStatus: "low",
    petFriendly: {
      allowed: true,
      conditions: "등산로 전 구간 반려견 등반 가능",
      details: { indoor: false, outdoor: true, largeDog: true }
    },
    accessibility: {
      wheelchair: true,
      stroller: false,
      senior: true,
      parking: true,
      note: "증산초등학교 기점 임도 구간은 장애인 이동 보조 차량 사전 신청 시 진입 허용"
    },
    weatherAdjustedRecommendation: "가을철 억새 개화 시기에도 평일에는 매우 한적함",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80",
    description: "전국 5대 억새 명소 중 하나이지만 온길 특유의 요일 분산 큐레이션을 적용하면 붐비지 않게 올라갈 수 있습니다. 산상이 완만하여 노약자들도 경치를 조망하기 편합니다."
  },
  {
    id: "d009",
    name: "태백 자작나무 숲길",
    region: "태백",
    regionFull: "강원 태백시 황지동",
    isDepopulationArea: true,
    category: "산림/계곡",
    congestionLevel: 8,
    congestionStatus: "low",
    petFriendly: {
      allowed: true,
      conditions: "숲길 산책 가능, 평탄 구역 다수",
      details: { indoor: false, outdoor: true, largeDog: true }
    },
    accessibility: {
      wheelchair: true,
      stroller: true,
      senior: true,
      parking: true,
      note: "숲 초입 1.2km 구간은 휠체어 매트가 깔려 있어 턱이 없음"
    },
    weatherAdjustedRecommendation: "피톤치드 함량이 매우 높아 대기 환경 최적",
    image: "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=600&q=80",
    description: "속초와 달리 관광객이 듬문 황지동 자작나무 숲길입니다. 하얀 자작나무 수백 그루가 내뿜는 음이온과 새소리가 스트레스를 시원하게 날려줍니다."
  },
  {
    id: "d010",
    name: "삼척 삼척해변 솔숲길",
    region: "삼척",
    regionFull: "강원 삼척시 갈천동",
    isDepopulationArea: true,
    category: "자연/해안",
    congestionLevel: 25,
    congestionStatus: "low",
    petFriendly: {
      allowed: true,
      conditions: "솔밭길 산책 전용 코스 리드줄 필수",
      details: { indoor: false, outdoor: true, largeDog: false }
    },
    accessibility: {
      wheelchair: true,
      stroller: true,
      senior: true,
      parking: true,
      note: "장애인 관람 데크 존 및 백사장 바퀴 넓은 유모차 무상 대여"
    },
    walkingCourse: {
      name: "해파랑길 32코스 일부",
      distanceKm: 1.5,
      difficulty: "쉬움"
    },
    weatherAdjustedRecommendation: "비가 오면 솔향이 짙어져 한층 서정적임",
    image: "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=600&q=80",
    description: "경포대와 비교하여 1/4의 붐빔 수준을 자랑하는 청량한 바다 솔숲길입니다. 해송이 뿜어내는 깊은 솔향기와 함께 평평하게 조성된 무장애 바다 테라스를 즐기실 수 있습니다."
  }
];

// Helper to generate next 30 days starting from July 5, 2026 (the specified metadata date)
const generate30DaysCongestion = () => {
  const dates = [];
  const startYear = 2026;
  const startMonth = 6; // 0-indexed, July is 6
  const startDate = 5;

  for (let i = 0; i < 30; i++) {
    const current = new Date(startYear, startMonth, startDate + i);
    const dayOfWeek = current.getDay(); // 0: Sun, 6: Sat
    const dayStr = current.getDate();
    const dateKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;

    // Saturdays & Sundays = High, Fridays & Holidays = Medium, Mon-Thu = Low
    let level: "low" | "medium" | "high" = "low";
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      level = "high";
    } else if (dayOfWeek === 5) {
      level = "medium";
    }

    dates.push({
      dateStr: dateKey,
      day: dayStr,
      dayOfWeek,
      level,
      month: current.getMonth() + 1,
      year: current.getFullYear()
    });
  }
  return dates;
};

const next30Days = generate30DaysCongestion();

export default function SearchPage() {
  // Main Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Date selection state
  const [isPeriod, setIsPeriod] = useState(true); // Toggle Single Day vs Period
  const [selectedStartDate, setSelectedStartDate] = useState<string>("2026-07-06");
  const [selectedEndDate, setSelectedEndDate] = useState<string>("2026-07-08");
  const [activeDateSelector, setActiveDateSelector] = useState(false);

  // Guest count state
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [pets, setPets] = useState(0);
  const [activeGuestSelector, setActiveGuestSelector] = useState(false);

  // Filters state
  const [filterPetFriendly, setFilterPetFriendly] = useState(false);
  const [filterPetConditions, setFilterPetConditions] = useState<"any" | "indoor" | "large">("any");
  const [filterWheelchair, setFilterWheelchair] = useState(false);
  const [filterStroller, setFilterStroller] = useState(false);
  const [filterParking, setFilterParking] = useState(false);
  const [filterSenior, setFilterSenior] = useState(false);
  const [activeFilterSheet, setActiveFilterSheet] = useState(false);

  // Congestion Avoidance Swtich (Crucial: Default ON)
  const [avoidCongestion, setAvoidCongestion] = useState(true);

  // Interactive UI helpers
  const [activeSheet, setActiveSheet] = useState<"date" | "guests" | "filters" | null>(null);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [filteredResults, setFilteredResults] = useState<MockDestination[]>([]);
  const [searchMessage, setSearchMessage] = useState("");
  const [locationMocked, setLocationMocked] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Suggested keywords (focused list)
  const popularKeywords = [
    { text: "고성 능파대", badge: "인구감소 한산지" },
    { text: "태백 바람의 언덕", badge: "미세먼지 안심" },
    { text: "정선 동강 소금강길", badge: "무장애 안심길" },
    { text: "삼척 초곡용굴", badge: "열린관광 데크" },
    { text: "해파랑길 46코스", badge: "두루누비 평지" },
    { text: "강릉 안목 커피거리", badge: "인파 과밀지" }
  ];

  const recentSearches = ["정선 민둥산", "고성 아야진 댕수욕장", "두루누비"];

  // Run initial or filter-dependent updates
  useEffect(() => {
    if (searchTriggered) {
      handleSearchExecution();
    }
  }, [avoidCongestion, filterPetFriendly, filterPetConditions, filterWheelchair, filterStroller, filterParking, filterSenior]);

  // Handle Location click
  const handleLocationDetection = () => {
    setLocationMocked(true);
    setSearchQuery("삼척시 근덕면 (내 주변)");
    setShowSuggestions(false);
  };

  // Weather correction banner logic based on query or selection
  const getWeatherMessage = () => {
    const q = searchQuery.toLowerCase();
    if (q.includes("고성") || q.includes("능파대") || q.includes("아야진")) {
      return {
        text: "고성군 기상 정보: 맑음 (24°C) | 초미세먼지 좋음(8㎍/㎡). 해안 보행로와 댕수욕장 산책에 완벽한 무장애 기후 조건입니다. ☀️",
        status: "success"
      };
    }
    if (q.includes("정선") || q.includes("소금강") || q.includes("민둥산")) {
      return {
        text: "정선군 기상 정보: 구름 조금 (22°C) | 초미세먼지 보통(18㎍/㎡). 고원지대의 시원한 바람이 불어 야외 숲길 걷기에 알맞습니다. 🌲",
        status: "info"
      };
    }
    if (q.includes("태백") || q.includes("바람의 언덕") || q.includes("자작나무")) {
      return {
        text: "태백시 대기주의보 연동: 미세먼지 나쁨(45㎍/㎡) 예상 | 기온 23°C. 가급적 마스크를 착용하시거나, 국립석탄박물관 등 실내 코스 우선 방문을 추천합니다. 😷",
        status: "warning"
      };
    }
    if (q.includes("삼척") || q.includes("초곡") || q.includes("촛대바위")) {
      return {
        text: "삼척시 기상 정보: 흐리고 한때 약한 소나기 (21°C) | 미세먼지 좋음. 초곡용굴 촛대바위길 등 해상 데크는 보행이 원활하나 바닥 미끄럼에 유의하세요. ☔",
        status: "info"
      };
    }
    if (q.includes("강릉") || q.includes("안목") || q.includes("경포")) {
      return {
        text: "강릉시 실시간 과밀 경보: 주말 해안가 불쾌지수 높음 예상 (28°C) | 주차 정체 극심. 차량 흐름 제어를 위해 고성/삼척 등 인근 대안 노선을 제안합니다. 🚗",
        status: "danger"
      };
    }
    return {
      text: "강원도 소멸위기 4개 시군(정선·태백·삼척·고성) 실시간 기상/미세먼지 데이터 및 보행 장애 인프라 안전 가동 중 📡",
      status: "info"
    };
  };

  const weatherInfo = getWeatherMessage();

  // One-Tap Quick presets
  const applyPreset = (preset: "pet" | "wheelchair" | "stroller" | "forest") => {
    if (preset === "pet") {
      setPets(1);
      setFilterPetFriendly(true);
      setFilterPetConditions("any");
    } else if (preset === "wheelchair") {
      setFilterWheelchair(true);
      // Ensure separate toggle
    } else if (preset === "stroller") {
      setFilterStroller(true);
      setChildren(1);
    } else if (preset === "forest") {
      setSearchQuery("정선");
      setFilterSenior(true);
      setFilterParking(true);
    }
    setSearchTriggered(true);
    setTimeout(() => handleSearchExecution(), 50);
  };

  // Perform search filtering
  const handleSearchExecution = () => {
    setSearchTriggered(true);
    let results = [...mockDestinations];

    // Filter by query (region or name or walking course)
    if (searchQuery && !searchQuery.includes("(내 주변)")) {
      const q = searchQuery.toLowerCase().trim();
      results = results.filter(
        d => 
          d.name.toLowerCase().includes(q) || 
          d.region.toLowerCase().includes(q) || 
          d.regionFull.toLowerCase().includes(q) || 
          d.description.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q)
      );
    } else if (searchQuery.includes("(내 주변)")) {
      // Mock location filters (primarily shows 삼척 since mock location is 삼척시)
      results = results.filter(d => d.region === "삼척");
    }

    // Filter by pet friendliness
    if (filterPetFriendly || pets > 0) {
      results = results.filter(d => d.petFriendly.allowed === true);
      if (filterPetConditions === "indoor") {
        results = Array.from(results).filter(d => d.petFriendly.details.indoor === true);
      } else if (filterPetConditions === "large") {
        results = Array.from(results).filter(d => d.petFriendly.details.largeDog === true);
      }
    }

    // Filter by Accessibility parameters
    if (filterWheelchair) {
      results = results.filter(d => d.accessibility.wheelchair === true);
    }
    if (filterStroller || children > 0) {
      results = results.filter(d => d.accessibility.stroller === true);
    }
    if (filterSenior) {
      results = results.filter(d => d.accessibility.senior === true);
    }
    if (filterParking) {
      results = results.filter(d => d.accessibility.parking === true);
    }

    // Handle congestion avoidance layout logic
    if (avoidCongestion) {
      // Move HIGH congestion level down, and put LOW congestion level at top
      results.sort((a, b) => a.congestionLevel - b.congestionLevel);
    } else {
      // Standard alphabetical or static order
      results.sort((a, b) => b.congestionLevel - a.congestionLevel);
    }

    setFilteredResults(results);

    // Set responsive search summary message
    let msg = `검색 결과 ${results.length}개의 안심 보행 코스가 발견되었습니다.`;
    if (avoidCongestion) {
      const containsHigh = results.some(d => d.congestionStatus === "high");
      if (containsHigh) {
        msg = "⚠️ 붐비는 유명 명소가 포함되어 있습니다. 온길의 대안 스팟과 함께 한산한 정취를 비교해보세요.";
      } else {
        msg = "🌿 혼잡도가 매우 낮고 차별 없는 무장애 안심 코스 위주로 순위를 자동 보정했습니다.";
      }
    }
    setSearchMessage(msg);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchTriggered(false);
    setLocationMocked(false);
    // Reset counters
    setAdults(2);
    setChildren(0);
    setPets(0);
    setFilterPetFriendly(false);
    setFilterWheelchair(false);
    setFilterStroller(false);
    setFilterParking(false);
    setFilterSenior(false);
  };

  // Date selections helper
  const handleDateClick = (dateStr: string) => {
    if (!isPeriod) {
      setSelectedStartDate(dateStr);
      setSelectedEndDate(dateStr);
    } else {
      // Period logic: set start if start is empty or both are set.
      if (selectedStartDate && selectedEndDate && selectedStartDate !== selectedEndDate) {
        setSelectedStartDate(dateStr);
        setSelectedEndDate("");
      } else if (selectedStartDate && !selectedEndDate) {
        if (dateStr >= selectedStartDate) {
          setSelectedEndDate(dateStr);
        } else {
          setSelectedStartDate(dateStr);
        }
      } else {
        setSelectedStartDate(dateStr);
      }
    }
  };

  return (
    <section id="ongil-search" className="py-12 bg-bento-bg text-bento-dark relative">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Decorative Grid Mesh */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a2f2305_1px,transparent_1px),linear-gradient(to_bottom,#1a2f2305_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* Section Title */}
        <div className="mb-10 text-center md:text-left">
          <span className="text-xs font-mono font-bold tracking-widest text-bento-green uppercase block mb-2">
            AI-Driven Tranquil Discovery
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-black text-bento-dark tracking-tight leading-none mb-3">
            한산한 안심 여정 찾기
          </h2>
          <p className="text-bento-dark/60 text-xs sm:text-sm max-w-2xl leading-relaxed">
            나이, 유모차, 휠체어, 반려동물 동반까지. 모든 걸림돌을 제거하고 
            실시간 예측 인파와 지형을 보정해 가장 쾌적하게 여행할 수 있는 대안 루트를 만납니다.
          </p>
        </div>

        {/* Weather Auto-correction banner - Dynamic Alert Badge */}
        <div className={`mb-6 p-4 rounded-3xl border text-xs flex items-start gap-3 transition-all duration-300 ${
          weatherInfo.status === "warning" 
            ? "bg-amber-50 border-amber-200 text-amber-800"
            : weatherInfo.status === "danger"
            ? "bg-red-50 border-red-200 text-red-800"
            : weatherInfo.status === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-white border-bento-dark/10 text-bento-dark/80"
        }`}>
          <div className="mt-0.5 shrink-0">
            {weatherInfo.status === "warning" ? <AlertTriangle size={16} className="text-amber-600 animate-bounce" /> :
             weatherInfo.status === "danger" ? <Flame size={16} className="text-red-600" /> :
             weatherInfo.status === "success" ? <Check size={16} className="text-emerald-600" /> :
             <Info size={16} className="text-bento-green" />}
          </div>
          <div>
            <span className="font-bold block mb-0.5">실시간 날씨 & 공공 안전 대기 보정</span>
            <p className="leading-relaxed text-[11px] font-sans">{weatherInfo.text}</p>
          </div>
        </div>

        {/* ==================== SEARCH BAR MAIN CONTROLLER (RESPONSIVE) ==================== */}
        <div className="bg-white rounded-[2rem] border border-bento-dark/10 p-4 md:p-6 shadow-md relative z-30 mb-8">
          
          {/* Main search blocks layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            
            {/* Block 1: Keyword query with Autocomplete */}
            <div className="col-span-1 md:col-span-5 relative">
              <label className="block text-[10px] font-mono font-bold uppercase text-bento-dark/40 mb-1 pl-1">어디로 (지역 또는 관광명소)</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-bento-dark/40" size={18} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="예: 정선, 아야진, 해파랑길..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full pl-11 pr-12 py-3 bg-bento-bg/50 border border-bento-dark/5 rounded-2xl text-sm font-semibold text-bento-dark focus:outline-none focus:border-bento-green focus:bg-white transition-all duration-300"
                />
                
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-12 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-bento-bg flex items-center justify-center text-bento-dark/40 hover:text-bento-dark transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleLocationDetection}
                  title="내 주변 검색"
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl transition-all cursor-pointer ${
                    locationMocked ? "bg-bento-green text-white" : "bg-bento-bg text-bento-green hover:bg-bento-green/10"
                  }`}
                >
                  <Navigation size={14} className={locationMocked ? "animate-pulse" : ""} />
                </button>
              </div>

              {/* Autocomplete & Popular searches dropdown (Absolute container) */}
              <AnimatePresence>
                {showSuggestions && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl border border-bento-dark/10 shadow-lg z-50 p-5 max-h-[360px] overflow-y-auto"
                    >
                      {/* Recent searches */}
                      <div className="mb-4">
                        <h4 className="text-[10px] font-mono font-bold text-bento-dark/40 uppercase tracking-widest mb-2 pl-1">최근 검색</h4>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map((term, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setSearchQuery(term);
                                setShowSuggestions(false);
                              }}
                              className="px-3 py-1.5 bg-bento-bg hover:bg-bento-green/10 text-xs text-bento-dark/80 rounded-full transition-colors cursor-pointer"
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Popular / Curated counties */}
                      <div>
                        <h4 className="text-[10px] font-mono font-bold text-bento-dark/40 uppercase tracking-widest mb-2 pl-1">인기 검색 & 시범 안심 구역</h4>
                        <div className="space-y-1.5">
                          {popularKeywords.map((item, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setSearchQuery(item.text);
                                setShowSuggestions(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-bento-bg rounded-xl flex items-center justify-between text-xs font-semibold text-bento-dark transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <MapPin size={12} className="text-bento-green" />
                                <span>{item.text}</span>
                              </div>
                              <span className="text-[9px] font-mono font-bold text-bento-green bg-bento-green/15 px-2 py-0.5 rounded-full">
                                {item.badge}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Block 2: Date picker triggers bottom sheet (mobile) / popover (desktop) */}
            <div className="col-span-1 md:col-span-3 relative">
              <label className="block text-[10px] font-mono font-bold uppercase text-bento-dark/40 mb-1 pl-1">언제 (날짜 및 혼잡 예보)</label>
              <button
                type="button"
                onClick={() => {
                  setActiveDateSelector(true);
                  setActiveSheet("date");
                }}
                className="w-full px-4 py-3 bg-bento-bg/50 hover:bg-bento-bg border border-bento-dark/5 rounded-2xl text-sm font-semibold text-bento-dark flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-bento-green shrink-0" />
                  <span className="truncate">
                    {selectedStartDate ? `${selectedStartDate.slice(5)}` : "날짜 선택"}
                    {selectedEndDate && selectedEndDate !== selectedStartDate ? ` ~ ${selectedEndDate.slice(5)}` : ""}
                  </span>
                </div>
                <ChevronDown size={14} className="text-bento-dark/40 shrink-0" />
              </button>
            </div>

            {/* Block 3: Guest counter triggers bottom sheet / popover */}
            <div className="col-span-1 md:col-span-2 relative">
              <label className="block text-[10px] font-mono font-bold uppercase text-bento-dark/40 mb-1 pl-1">몇 명이 (동반 조건)</label>
              <button
                type="button"
                onClick={() => {
                  setActiveGuestSelector(true);
                  setActiveSheet("guests");
                }}
                className="w-full px-4 py-3 bg-bento-bg/50 hover:bg-bento-bg border border-bento-dark/5 rounded-2xl text-sm font-semibold text-bento-dark flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-bento-green shrink-0" />
                  <span className="truncate">
                    성인 {adults}
                    {children > 0 ? `, 아동 ${children}` : ""}
                    {pets > 0 ? `, 🐾 ${pets}` : ""}
                  </span>
                </div>
                <ChevronDown size={14} className="text-bento-dark/40 shrink-0" />
              </button>
            </div>

            {/* Block 4: Accessibility Sliders & Conditions Button */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-[10px] font-mono font-bold uppercase text-bento-dark/40 mb-1 pl-1">배리어프리 보행 필터</label>
              <button
                type="button"
                onClick={() => {
                  setActiveFilterSheet(true);
                  setActiveSheet("filters");
                }}
                className={`w-full px-4 py-3 border rounded-2xl text-sm font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  filterWheelchair || filterStroller || filterPetFriendly || filterSenior || filterParking
                    ? "bg-bento-green/15 border-bento-green text-bento-green"
                    : "bg-bento-bg/50 hover:bg-bento-bg border-bento-dark/5 text-bento-dark"
                }`}
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={16} className="shrink-0" />
                  <span className="truncate">
                    {filterWheelchair || filterStroller || filterPetFriendly || filterSenior || filterParking
                      ? "필터 켜짐"
                      : "보행 세부필터"}
                  </span>
                </div>
                <ChevronDown size={14} className="shrink-0 opacity-65" />
              </button>
            </div>

          </div>

          {/* Quick preset chips below search bar */}
          <div className="mt-4 pt-4 border-t border-bento-dark/5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-bento-dark/40 uppercase tracking-wider mr-1">
                원탭 빠른 조건:
              </span>
              <button
                onClick={() => applyPreset("pet")}
                className="px-3 py-1.5 bg-bento-bg hover:bg-bento-green/15 border border-bento-dark/5 hover:border-bento-green/25 rounded-full text-xs font-semibold text-bento-dark/80 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>🐾 반려동물 동반</span>
              </button>
              <button
                onClick={() => applyPreset("wheelchair")}
                className="px-3 py-1.5 bg-bento-bg hover:bg-bento-green/15 border border-bento-dark/5 hover:border-bento-green/25 rounded-full text-xs font-semibold text-bento-dark/80 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>♿ 휠체어 전용데크</span>
              </button>
              <button
                onClick={() => applyPreset("stroller")}
                className="px-3 py-1.5 bg-bento-bg hover:bg-bento-green/15 border border-bento-dark/5 hover:border-bento-green/25 rounded-full text-xs font-semibold text-bento-dark/80 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>🚼 아동/유모차 맞춤</span>
              </button>
              <button
                onClick={() => applyPreset("forest")}
                className="px-3 py-1.5 bg-bento-bg hover:bg-bento-green/15 border border-bento-dark/5 hover:border-bento-green/25 rounded-full text-xs font-semibold text-bento-dark/80 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>🌲 평화로운 고원 숲길</span>
              </button>
            </div>

            {/* Switch 1: CONGESTION AVOIDANCE (CRITICAL: MUST HAVE ON BY DEFAULT) */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs font-bold text-bento-dark block">
                  실시간 관광지 혼잡도 회피 제어
                </span>
                <span className="text-[10px] text-bento-dark/50 block">
                  과밀 명소를 후순위 배정하고 한산한 로컬 대안을 자동 매칭합니다.
                </span>
              </div>
              <button
                onClick={() => setAvoidCongestion(!avoidCongestion)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  avoidCongestion ? "bg-bento-green" : "bg-bento-dark/20"
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                  avoidCongestion ? "left-7" : "left-1"
                }`} />
              </button>
            </div>
          </div>

          {/* Core Submit CTA Button */}
          <div className="mt-6">
            <button
              onClick={handleSearchExecution}
              className="w-full py-4 bg-bento-green hover:bg-bento-green/90 active:scale-[0.99] text-white font-display font-black text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search size={18} />
              <span>한산한 안심 여행지 찾기</span>
            </button>
          </div>

        </div>

        {/* ==================== ACTIVE SHEET OVERLAYS (BOTTOM SHEETS ON MOBILE, MODALS ON TABLET/DESKTOP) ==================== */}
        <AnimatePresence>
          {activeSheet !== null && (
            <>
              {/* Dark backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setActiveSheet(null);
                  setActiveDateSelector(false);
                  setActiveGuestSelector(false);
                  setActiveFilterSheet(false);
                }}
                className="fixed inset-0 bg-bento-dark z-[100]"
              />

              {/* Dynamic Bottom Sheet / Dialog container */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white rounded-t-[2.5rem] border-t border-bento-dark/10 shadow-2xl z-[101] overflow-hidden max-h-[85vh] flex flex-col"
              >
                
                {/* Header with notch & close */}
                <div className="px-6 py-4 border-b border-bento-dark/5 flex items-center justify-between shrink-0">
                  <div className="w-12 h-1 bg-bento-dark/10 rounded-full absolute top-2.5 left-1/2 -translate-x-1/2" />
                  <h3 className="text-base font-display font-black text-bento-dark">
                    {activeSheet === "date" ? "📅 날짜 및 일자별 혼잡도 예측" :
                     activeSheet === "guests" ? "👥 동반 인원 & 반려동물 설정" :
                     "♿ 무장애 보행 조건 세부 설정"}
                  </h3>
                  <button
                    onClick={() => {
                      setActiveSheet(null);
                      setActiveDateSelector(false);
                      setActiveGuestSelector(false);
                      setActiveFilterSheet(false);
                    }}
                    className="w-8 h-8 rounded-full bg-bento-bg flex items-center justify-center text-bento-dark/60 hover:text-bento-dark cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Content Area with custom scroll */}
                <div className="p-6 overflow-y-auto flex-1">
                  
                  {/* ================= SHEET 1: DATE SELECTOR & CALENDAR WITH CONGESTION DOTS ================= */}
                  {activeSheet === "date" && (
                    <div className="space-y-6">
                      {/* Day/Period toggle */}
                      <div className="flex bg-bento-bg rounded-2xl p-1">
                        <button
                          onClick={() => {
                            setIsPeriod(false);
                            setSelectedEndDate(selectedStartDate);
                          }}
                          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                            !isPeriod ? "bg-white text-bento-green shadow-xs" : "text-bento-dark/60"
                          }`}
                        >
                          당일 여정 (Single Day)
                        </button>
                        <button
                          onClick={() => setIsPeriod(true)}
                          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                            isPeriod ? "bg-white text-bento-green shadow-xs" : "text-bento-dark/60"
                          }`}
                        >
                          기간 여정 (Period Schedule)
                        </button>
                      </div>

                      {/* Predicted Congestion Level Legends */}
                      <div className="bg-bento-bg/50 p-3 rounded-2xl border border-bento-dark/5 flex items-center justify-around text-[10px]">
                        <span className="font-bold text-bento-dark/60">예상 혼잡 지표:</span>
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" />
                          <span className="font-semibold text-bento-dark/80">한산 (Mon-Thu)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 block" />
                          <span className="font-semibold text-bento-dark/80">보통 (Friday)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 block animate-pulse" />
                          <span className="font-semibold text-bento-dark/80">혼잡 (Weekend)</span>
                        </div>
                      </div>

                      {/* Custom Calendar Month Grid (July 2026 - 30 days forecast) */}
                      <div>
                        <div className="text-center mb-3">
                          <span className="text-sm font-display font-black text-bento-dark">2026년 7월 / 8월 예측 가동</span>
                        </div>

                        {/* Calendar Header Weekdays */}
                        <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[10px] font-mono font-bold text-bento-dark/40">
                          <span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>
                        </div>

                        {/* Month Grid */}
                        <div className="grid grid-cols-7 gap-1.5">
                          {/* July 1 to 4 empty spacer to match Wed July 1 */}
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square" />
                          ))}

                          {/* Render next 30 days with congestion dots */}
                          {next30Days.map((dayItem, i) => {
                            const isSelected = dayItem.dateStr === selectedStartDate || dayItem.dateStr === selectedEndDate;
                            const isInRange = isPeriod && dayItem.dateStr > selectedStartDate && dayItem.dateStr < selectedEndDate;

                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleDateClick(dayItem.dateStr)}
                                className={`aspect-square rounded-xl flex flex-col items-center justify-between p-1.5 transition-all cursor-pointer relative ${
                                  isSelected 
                                    ? "bg-bento-green text-white font-extrabold shadow-sm scale-105"
                                    : isInRange
                                    ? "bg-bento-green/10 text-bento-green font-semibold"
                                    : "bg-bento-bg/40 hover:bg-bento-bg text-bento-dark/90"
                                }`}
                              >
                                {/* Date number */}
                                <span className="text-xs leading-none">{dayItem.day}</span>
                                
                                {/* Congestion Status dot */}
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  dayItem.level === "high" 
                                    ? "bg-red-500 animate-pulse" 
                                    : dayItem.level === "medium" 
                                    ? "bg-amber-400" 
                                    : "bg-emerald-400"
                                }`} />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Selected recap info */}
                      <div className="bg-bento-bg p-4 rounded-2xl border border-bento-dark/5 text-xs flex items-center justify-between">
                        <div>
                          <span className="text-bento-dark/50 block">선택한 일정</span>
                          <span className="font-extrabold text-bento-dark">
                            {selectedStartDate} {selectedEndDate && selectedEndDate !== selectedStartDate ? ` ~ ${selectedEndDate}` : ""}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono bg-white px-2.5 py-1 rounded-full border border-bento-dark/10 font-bold text-bento-green">
                          {isPeriod ? "연속 예약" : "당일 안심 방문"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ================= SHEET 2: GUEST COUNT CONTROLLERS ================= */}
                  {activeSheet === "guests" && (
                    <div className="space-y-6">
                      
                      {/* Guest Row 1: Adult */}
                      <div className="flex items-center justify-between pb-4 border-b border-bento-dark/5">
                        <div>
                          <span className="text-sm font-bold text-bento-dark block">성인 (Adults)</span>
                          <span className="text-xs text-bento-dark/50 block">만 13세 이상 보호자</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setAdults(Math.max(1, adults - 1))}
                            className="w-10 h-10 rounded-full border border-bento-dark/10 bg-bento-bg hover:bg-bento-dark/5 flex items-center justify-center text-bento-dark transition-colors cursor-pointer"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-base font-display font-black text-bento-dark w-6 text-center">{adults}</span>
                          <button
                            onClick={() => setAdults(adults + 1)}
                            className="w-10 h-10 rounded-full border border-bento-dark/10 bg-bento-bg hover:bg-bento-dark/5 flex items-center justify-center text-bento-dark transition-colors cursor-pointer"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Guest Row 2: Children */}
                      <div className="flex items-center justify-between pb-4 border-b border-bento-dark/5">
                        <div>
                          <span className="text-sm font-bold text-bento-dark block">아동 및 유아 (Children)</span>
                          <span className="text-xs text-bento-dark/50 block">유모차 및 어린이 보행 동반</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setChildren(Math.max(0, children - 1))}
                            className="w-10 h-10 rounded-full border border-bento-dark/10 bg-bento-bg hover:bg-bento-dark/5 flex items-center justify-center text-bento-dark transition-colors cursor-pointer"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-base font-display font-black text-bento-dark w-6 text-center">{children}</span>
                          <button
                            onClick={() => setChildren(children + 1)}
                            className="w-10 h-10 rounded-full border border-bento-dark/10 bg-bento-bg hover:bg-bento-dark/5 flex items-center justify-center text-bento-dark transition-colors cursor-pointer"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Guest Row 3: Pets (🐾 CRITICAL DEMAND) */}
                      <div className="flex items-center justify-between pb-4">
                        <div>
                          <span className="text-sm font-bold text-bento-green flex items-center gap-1.5">
                            <span>🐾 반려동물 (Pets)</span>
                          </span>
                          <span className="text-xs text-bento-dark/50 block">대형견 전용 구역 및 이동 조건 필터 자동 연동</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setPets(Math.max(0, pets - 1))}
                            className="w-10 h-10 rounded-full border border-bento-dark/10 bg-bento-bg hover:bg-bento-dark/5 flex items-center justify-center text-bento-dark transition-colors cursor-pointer"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-base font-display font-black text-bento-dark w-6 text-center">{pets}</span>
                          <button
                            onClick={() => {
                              setPets(pets + 1);
                              setFilterPetFriendly(true); // Auto-toggle pet allowed
                            }}
                            className="w-10 h-10 rounded-full border border-bento-dark/10 bg-bento-bg hover:bg-bento-dark/5 flex items-center justify-center text-bento-dark transition-colors cursor-pointer"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Note for Pet accessibility info */}
                      {pets > 0 && (
                        <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl text-[11px] text-emerald-800 leading-relaxed">
                          🐾 반려동물 동반 조건이 설정되었습니다. 반려견 전용 백사장(댕수욕장), 동반 허용 해솔 산책로 위주의 결과가 매칭됩니다.
                        </div>
                      )}
                    </div>
                  )}

                  {/* ================= SHEET 3: BARRIER-FREE ACCESSIBILITY FILTERS ================= */}
                  {activeSheet === "filters" && (
                    <div className="space-y-6">
                      
                      {/* Section 1: Accessibility requirements (Wheelchair & Stroller separate) */}
                      <div>
                        <h4 className="text-[10px] font-mono font-bold text-bento-dark/40 uppercase tracking-widest mb-3 pl-1">
                          물리적 장벽 제거 (Separate Toggles)
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          
                          {/* Wheelchair toggle */}
                          <button
                            type="button"
                            onClick={() => setFilterWheelchair(!filterWheelchair)}
                            className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-28 cursor-pointer transition-all duration-300 ${
                              filterWheelchair
                                ? "bg-bento-green/15 border-bento-green text-bento-green"
                                : "bg-bento-bg/50 border-bento-dark/5 text-bento-dark hover:bg-bento-bg"
                            }`}
                          >
                            <span className="text-xl">♿</span>
                            <div>
                              <span className="text-xs font-black block">휠체어 보행 가능</span>
                              <span className="text-[9px] opacity-70 block mt-0.5">경사로 완비, 턱 없음</span>
                            </div>
                          </button>

                          {/* Stroller toggle */}
                          <button
                            type="button"
                            onClick={() => setFilterStroller(!filterStroller)}
                            className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-28 cursor-pointer transition-all duration-300 ${
                              filterStroller
                                ? "bg-bento-green/15 border-bento-green text-bento-green"
                                : "bg-bento-bg/50 border-bento-dark/5 text-bento-dark hover:bg-bento-bg"
                            }`}
                          >
                            <span className="text-xl">🚼</span>
                            <div>
                              <span className="text-xs font-black block">유모차 통행 가능</span>
                              <span className="text-[9px] opacity-70 block mt-0.5">평탄 목재 데크로 연결</span>
                            </div>
                          </button>

                        </div>
                      </div>

                      {/* Section 2: Pet conditions */}
                      <div className="pt-4 border-t border-bento-dark/5">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-[10px] font-mono font-bold text-bento-dark/40 uppercase tracking-widest pl-1">
                            반려동물 상세 동반 조건
                          </h4>
                          <button
                            onClick={() => setFilterPetFriendly(!filterPetFriendly)}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-full border transition-all ${
                              filterPetFriendly 
                                ? "bg-bento-green text-white border-bento-green" 
                                : "bg-bento-bg text-bento-dark/60 border-bento-dark/10"
                            }`}
                          >
                            동반 필수 적용
                          </button>
                        </div>

                        {filterPetFriendly && (
                          <div className="bg-bento-bg p-3 rounded-2xl border border-bento-dark/5 grid grid-cols-3 gap-2">
                            {[
                              { id: "any", label: "상관 없음" },
                              { id: "indoor", label: "실내 허용" },
                              { id: "large", label: "대형견 안심" }
                            ].map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => setFilterPetConditions(opt.id as any)}
                                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                  filterPetConditions === opt.id
                                    ? "bg-white text-bento-green shadow-xs border border-bento-green/30"
                                    : "text-bento-dark/60 border border-transparent"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Section 3: Optional conveniences */}
                      <div className="pt-4 border-t border-bento-dark/5 space-y-3">
                        <h4 className="text-[10px] font-mono font-bold text-bento-dark/40 uppercase tracking-widest pl-1">
                          보행 약자 편의 사양
                        </h4>
                        
                        {/* Senior friendly toggle */}
                        <label className="flex items-center justify-between p-3.5 bg-bento-bg/50 border border-bento-dark/5 rounded-2xl cursor-pointer hover:bg-bento-bg transition-colors">
                          <div>
                            <span className="text-xs font-bold text-bento-dark block">👵 고령자 전용 완만한 안심 코스</span>
                            <span className="text-[10px] text-bento-dark/50 block">경사도가 낮고 쉼터 간격이 좁은 안전길</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={filterSenior}
                            onChange={(e) => setFilterSenior(e.target.checked)}
                            className="w-4.5 h-4.5 accent-bento-green"
                          />
                        </label>

                        {/* Parking toggle */}
                        <label className="flex items-center justify-between p-3.5 bg-bento-bg/50 border border-bento-dark/5 rounded-2xl cursor-pointer hover:bg-bento-bg transition-colors">
                          <div>
                            <span className="text-xs font-bold text-bento-dark block">🅿️ 장애인 전용 주차구역 구비</span>
                            <span className="text-[10px] text-bento-dark/50 block">주차장에서 보행 동선까지 턱 없는 슬로프 구비</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={filterParking}
                            onChange={(e) => setFilterParking(e.target.checked)}
                            className="w-4.5 h-4.5 accent-bento-green"
                          />
                        </label>
                      </div>

                    </div>
                  )}

                </div>

                {/* Footer Apply Button inside Sheet */}
                <div className="px-6 py-4 border-t border-bento-dark/5 bg-bento-bg/40 shrink-0">
                  <button
                    onClick={() => {
                      setActiveSheet(null);
                      setActiveDateSelector(false);
                      setActiveGuestSelector(false);
                      setActiveFilterSheet(false);
                      handleSearchExecution();
                    }}
                    className="w-full py-3.5 bg-bento-green hover:bg-bento-green/95 text-white font-display font-black text-sm rounded-2xl shadow-md transition-all cursor-pointer"
                  >
                    이 조건으로 검색 적용하기
                  </button>
                </div>

              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ==================== SEARCH RESULTS SECTION ==================== */}
        <div>
          
          {!searchTriggered ? (
            /* EMPTY / INITIAL STATE SCREEN: "지금 한산한 인구감소지역" (Prompt Rule 3) */
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-bento-green animate-pulse" />
                  <h3 className="text-lg font-display font-black text-bento-dark">
                    지금 가장 한산한 강원도 인구감소지 명소
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold bg-bento-green/15 text-bento-green px-2.5 py-1 rounded-full border border-bento-green/20">
                  관광빅데이터 예측 연동
                </span>
              </div>

              {/* Horizontal scroll cards on mobile, 3-column grid on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {mockDestinations.filter(d => d.congestionStatus === "low").slice(0, 3).map((spot) => (
                  <div 
                    key={spot.id} 
                    className="bg-white rounded-[2rem] border border-bento-dark/10 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300 group"
                  >
                    <div>
                      {/* Image banner with overlay */}
                      <div className="relative h-44 overflow-hidden bg-bento-bg">
                        <img 
                          src={spot.image} 
                          alt={spot.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 left-3 bg-bento-dark/85 text-white text-[9px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>혼잡도 {spot.congestionLevel}% (매우 한산)</span>
                        </div>
                        {spot.isDepopulationArea && (
                          <div className="absolute top-3 right-3 bg-bento-green text-white text-[9px] font-sans font-bold px-2.5 py-1 rounded-full">
                            인구감소 대응지역 🌿
                          </div>
                        )}
                      </div>

                      {/* Info body */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-bento-dark/50">
                          <span>{spot.regionFull}</span>
                          <span>·</span>
                          <span>{spot.category}</span>
                        </div>

                        <h4 className="text-base font-display font-black text-bento-dark group-hover:text-bento-green transition-colors">
                          {spot.name}
                        </h4>

                        <p className="text-xs text-bento-dark/70 leading-relaxed line-clamp-2">
                          {spot.description}
                        </p>
                      </div>
                    </div>

                    {/* Footer accessibility chips */}
                    <div className="px-5 pb-5 pt-3 border-t border-bento-dark/5 bg-bento-bg/30 space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        {spot.accessibility.wheelchair && (
                          <span className="text-[9px] bg-white border border-bento-dark/10 text-bento-dark px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <span>♿</span><span>휠체어</span>
                          </span>
                        )}
                        {spot.accessibility.stroller && (
                          <span className="text-[9px] bg-white border border-bento-dark/10 text-bento-dark px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <span>🚼</span><span>유모차</span>
                          </span>
                        )}
                        {spot.petFriendly.allowed && (
                          <span className="text-[9px] bg-white border border-bento-dark/10 text-bento-green px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <span>🐾</span><span>반려동물</span>
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setSearchQuery(spot.name);
                          setSearchTriggered(true);
                          setTimeout(() => handleSearchExecution(), 50);
                        }}
                        className="w-full py-2 bg-bento-dark hover:bg-bento-green text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>이 코스 안심 선택하기</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          ) : (
            
            /* FILTERED SEARCH RESULTS CONTAINER */
            <div className="space-y-6">
              
              {/* Result Summary Bar */}
              <div className="bg-white rounded-2xl border border-bento-dark/10 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-bento-bg flex items-center justify-center text-bento-green shrink-0">
                    <Compass size={20} className="animate-spin-slow" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-bento-dark block">{searchMessage}</span>
                    <span className="text-[10px] text-bento-dark/50 block">
                      일정: {selectedStartDate} ~ {selectedEndDate} | 인원: 성인 {adults}, 아동 {children}, 반려동물 {pets}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleClearSearch}
                    className="px-4 py-2 bg-bento-bg hover:bg-bento-dark/5 text-bento-dark text-xs font-semibold rounded-xl border border-bento-dark/10 transition-colors cursor-pointer"
                  >
                    필터 초기화
                  </button>
                </div>
              </div>

              {/* Grid lists of results */}
              {filteredResults.length === 0 ? (
                /* Empty state of search */
                <div className="bg-white rounded-[2.5rem] border border-bento-dark/10 py-16 px-6 text-center max-w-xl mx-auto">
                  <div className="w-16 h-16 bg-bento-bg rounded-full flex items-center justify-center text-bento-dark/40 mx-auto mb-4">
                    <Search size={32} />
                  </div>
                  <h4 className="text-lg font-display font-black text-bento-dark mb-2">
                    해당 조건에 만족하는 코스가 없습니다
                  </h4>
                  <p className="text-xs text-bento-dark/60 leading-relaxed mb-6">
                    날씨 지수 및 반려동물 세부 동반 조건 또는 휠체어 턱 제거 덱 등의 
                    배리어프리 정밀 조율로 인해 검색 조건을 만족하는 군락이 없습니다. 조건을 조금 넉넉히 설정해 보세요!
                  </p>
                  <button
                    onClick={handleClearSearch}
                    className="px-6 py-3 bg-bento-green hover:bg-bento-green/90 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer"
                  >
                    기본 추천 목록으로 돌아가기
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredResults.map((spot) => {
                    const isCrowded = spot.congestionStatus === "high";
                    const alternativeSpot = isCrowded && avoidCongestion 
                      ? mockDestinations.find(d => d.id === spot.alternativeId)
                      : null;

                    return (
                      <div key={spot.id} className="space-y-4">
                        
                        {/* SIDE-BY-SIDE RECOMMENDATION FOR OVERCROWDED SPOTS (Crucial Brand Logic) */}
                        {isCrowded && avoidCongestion && (
                          <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="text-amber-600 mt-1 shrink-0 animate-pulse" size={20} />
                              <div>
                                <h4 className="text-sm font-bold text-amber-950">
                                  [{spot.name}] 과밀 주의 경보! (혼잡 지수 {spot.congestionLevel}%)
                                </h4>
                                <p className="text-xs text-amber-900/80 leading-relaxed mt-1">
                                  해당 관광지는 선택하신 일자에 심각한 인파 밀집 및 극심한 교통 약자 보행 정체가 예상됩니다. 
                                  온길이 준비한 **동일 권역의 무장애·한산 대안 웰니스 스팟**을 제안합니다.
                                </p>
                              </div>
                            </div>
                            {alternativeSpot && (
                              <button
                                onClick={() => {
                                  setSearchQuery(alternativeSpot.name);
                                  handleSearchExecution();
                                }}
                                className="px-4 py-2.5 bg-bento-green hover:bg-bento-green/95 text-white text-xs font-extrabold rounded-xl shrink-0 transition-colors shadow-xs cursor-pointer"
                              >
                                {alternativeSpot.name} 대안 바로 가기 →
                              </button>
                            )}
                          </div>
                        )}

                        {/* Standard/Alternative Result Card */}
                        <div className={`bg-white rounded-[2.5rem] border overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 grid grid-cols-1 md:grid-cols-12 ${
                          isCrowded 
                            ? "border-red-200/60 opacity-80" 
                            : "border-bento-dark/10"
                        }`}>
                          
                          {/* Col 1: Visual banner (4 cols) */}
                          <div className="md:col-span-4 relative h-52 md:h-full bg-bento-bg">
                            <img 
                              src={spot.image} 
                              alt={spot.name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            
                            {/* Congestion Level Indicator */}
                            <div className={`absolute top-4 left-4 text-white text-[9px] font-mono font-bold px-2.5 py-1.5 rounded-full uppercase tracking-wider backdrop-blur-xs flex items-center gap-1.5 ${
                              isCrowded ? "bg-red-600/90" : "bg-bento-dark/85"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                isCrowded ? "bg-white" : "bg-emerald-400"
                              }`} />
                              <span>
                                {isCrowded ? `인파 극심 (${spot.congestionLevel}%)` : `한산 지수 (${spot.congestionLevel}%)`}
                              </span>
                            </div>

                            {/* Depopulation county badge */}
                            {spot.isDepopulationArea && (
                              <div className="absolute bottom-4 left-4 bg-bento-green text-white text-[9px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                강원 파일럿 지자체 🌿
                              </div>
                            )}
                          </div>

                          {/* Col 2: Text descriptions & specifications (8 cols) */}
                          <div className="md:col-span-8 p-6 md:p-8 flex flex-col justify-between space-y-4">
                            
                            <div className="space-y-2">
                              {/* Meta information */}
                              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono font-bold text-bento-dark/40 uppercase tracking-widest">
                                <span>{spot.regionFull}</span>
                                <span>•</span>
                                <span>{spot.category}</span>
                                {spot.walkingCourse && (
                                  <>
                                    <span>•</span>
                                    <span className="text-bento-green font-sans">{spot.walkingCourse.name} ({spot.walkingCourse.distanceKm}km)</span>
                                  </>
                                )}
                              </div>

                              {/* Title */}
                              <div className="flex items-center gap-2">
                                <h3 className="text-xl font-display font-black text-bento-dark">
                                  {spot.name}
                                </h3>
                                {isCrowded && (
                                  <span className="bg-red-50 text-red-600 text-[9px] font-bold border border-red-200 px-2 py-0.5 rounded-full">
                                    주차 난조 예상
                                  </span>
                                )}
                              </div>

                              <p className="text-xs sm:text-sm text-bento-dark/80 leading-relaxed">
                                {spot.description}
                              </p>
                            </div>

                            {/* Detailed Accessibility specs */}
                            <div className="bg-bento-bg/50 rounded-2xl border border-bento-dark/5 p-4 space-y-3">
                              <div className="flex items-start gap-2.5 text-xs">
                                <span className="text-bento-green font-bold shrink-0">♿ 보행로 특성:</span>
                                <span className="text-bento-dark/85 text-[11px] font-semibold">{spot.accessibility.note}</span>
                              </div>

                              <div className="flex items-start gap-2.5 text-xs pt-2 border-t border-bento-dark/5">
                                <span className="text-bento-green font-bold shrink-0">🐾 댕가족 요건:</span>
                                <span className="text-bento-dark/85 text-[11px] font-semibold">{spot.petFriendly.conditions}</span>
                              </div>
                            </div>

                            {/* Actions bar */}
                            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-bento-dark/5">
                              
                              {/* Tags indicators */}
                              <div className="flex flex-wrap gap-1.5">
                                {spot.accessibility.wheelchair && (
                                  <span className="text-[9px] font-bold bg-bento-bg text-bento-dark px-2.5 py-1 rounded-full border border-bento-dark/10">
                                    휠체어 데크
                                  </span>
                                )}
                                {spot.accessibility.stroller && (
                                  <span className="text-[9px] font-bold bg-bento-bg text-bento-dark px-2.5 py-1 rounded-full border border-bento-dark/10">
                                    유모차 평평
                                  </span>
                                )}
                                {spot.accessibility.senior && (
                                  <span className="text-[9px] font-bold bg-bento-bg text-bento-dark px-2.5 py-1 rounded-full border border-bento-dark/10">
                                    경사도 5% 미만
                                  </span>
                                )}
                              </div>

                              {/* Button */}
                              <div className="flex gap-2">
                                <a 
                                  href="#beta"
                                  className="px-5 py-2.5 bg-bento-dark hover:bg-bento-green text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                                >
                                  <span>안심 이동 가이드 받기</span>
                                  <ArrowRight size={12} />
                                </a>
                              </div>

                            </div>

                          </div>

                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </section>
  );
}
