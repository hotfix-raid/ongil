export interface MockDestination {
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

export const mockDestinations: MockDestination[] = [
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
    id: "d010", // Note: mapped to d010 for consistency with the SearchPage
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
  }
];

export const generate30DaysCongestion = () => {
  const dates = [];
  const startYear = 2026;
  const startMonth = 6; // 0-indexed, July is 6
  const startDate = 5;

  for (let i = 0; i < 30; i++) {
    const current = new Date(startYear, startMonth, startDate + i);
    const dayOfWeek = current.getDay(); // 0: Sun, 6: Sat
    const dayStr = current.getDate();
    const dateKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;

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
