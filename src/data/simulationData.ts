import { Destination, AlternativeDestination, PilotRegion, RoadmapItem } from "../types";

// Popular tourist destinations that suffer from spatial and temporal overcrowding
export const popularDestinations: Destination[] = [
  {
    id: "g-beach",
    name: "강릉 안목 커피거리 & 경포대",
    regionName: "강릉시",
    tagline: "주말 평균 주차 대기 45분, 인파 밀집도 매우 높음",
    description: "아름다운 해안가와 카페들로 유명하지만, 주말과 휴가철에는 심각한 혼잡과 주차난으로 여행 만족도가 하락하고 있습니다.",
    category: "바다/카페",
    popularity: "crowded",
    congestionLevel: 94,
    alternativeId: "alt-goseong",
    imageUrl: "https://picsum.photos/seed/crowdbeach/600/400",
    accessibility: {
      petFriendly: false,
      wheelchair: false,
      stroller: false,
      senior: false,
      details: "백사장 진입로 경사로 부족, 인근 카페 다수가 계단형 구조 및 노키즈/노펫 존 운영"
    },
    weatherIndoorAlt: "강릉 애니메이션 박물관"
  },
  {
    id: "s-lake",
    name: "속초 청초호 & 속초해변",
    regionName: "속초시",
    tagline: "여름 휴가철 집중률 전국 최상위권, 무장애 전용 동선 미흡",
    description: "관광 자원이 풍부하지만 보행 밀도가 높아 휠체어나 유모차 이용자가 여유롭게 풍경을 즐기기 어렵습니다.",
    category: "랜드마크/바다",
    popularity: "crowded",
    congestionLevel: 88,
    alternativeId: "alt-taebaek",
    imageUrl: "https://picsum.photos/seed/crowdlake/600/400",
    accessibility: {
      petFriendly: true,
      wheelchair: false,
      stroller: false,
      senior: false,
      details: "수변 데크 일부 노후화, 주말 야간 점유율 과다로 교통 약자 충돌 우려"
    },
    weatherIndoorAlt: "속초 얼라이브하트"
  },
  {
    id: "j-palace",
    name: "경주 황리단길 & 대릉원",
    regionName: "경주시",
    tagline: "좁은 골목길 차량 혼재, 주말 보행 교통 차단 수준",
    description: "한옥의 미를 느낄 수 있는 대표 핫플레이스이나, 도로와 인도의 경계가 모호하여 유모차 및 노약자의 통행 안전이 위협받고 있습니다.",
    category: "역사/문화거리",
    popularity: "crowded",
    congestionLevel: 96,
    alternativeId: "alt-jeongseon",
    imageUrl: "https://picsum.photos/seed/crowdstreet/600/400",
    accessibility: {
      petFriendly: false,
      wheelchair: false,
      stroller: false,
      senior: false,
      details: "좁고 울퉁불퉁한 보도블록, 휠체어 진입 불가 상점 85% 이상"
    },
    weatherIndoorAlt: "경주 국립박물관"
  },
  {
    id: "jeju-beach",
    name: "제주 협재해수욕장 & 애월",
    regionName: "제주시",
    tagline: "여름철 주차 전쟁, 렌터카 폭증으로 자연 훼손 우려",
    description: "에메랄드빛 바다로 온 국민의 사랑을 받지만, 과밀로 인한 환경오염과 물가 상승으로 지역 갈등이 제기되고 있습니다.",
    category: "바다",
    popularity: "crowded",
    congestionLevel: 91,
    alternativeId: "alt-samcheok",
    imageUrl: "https://picsum.photos/seed/crowdjeju/600/400",
    accessibility: {
      petFriendly: true,
      wheelchair: false,
      stroller: false,
      senior: false,
      details: "주변 화장실 및 편의시설 휠체어 경사로 각도 기준 미달"
    },
    weatherIndoorAlt: "제주 아쿠아플라넷"
  }
];

// Quiet, beautiful alternative destinations in our 4 pilot regions of Gangwon-do
export const alternativeDestinations: AlternativeDestination[] = [
  {
    id: "alt-goseong",
    name: "고성 아야진 해변 & 송지호 둘레길",
    regionName: "고성군",
    originalName: "강릉 안목 커피거리 & 경포대",
    description: "맑고 깨끗한 아야진 해변의 암반 조망과 조용한 송지호 호수 둘레길은 고요함 속에 깊은 정취를 전합니다. 보행 인구가 적당해 조용히 힐링하기 좋습니다.",
    valueProposition: "관광 집중도 78% 감소 | 여유로운 전용 주차 및 반려동물 동반 모래사장 구역 제공",
    congestionLevel: 18,
    accessibility: {
      petFriendly: true,
      wheelchair: true,
      stroller: true,
      senior: true,
      details: "해안가 전용 휠체어 마트 설치, 송지호 관망타워 엘리베이터 완비, 유모차 완만한 데크로드"
    },
    recommendedTime: "오후 2시 ~ 5시 (일몰 감상 최적)",
    imageUrl: "https://picsum.photos/seed/quietgoseong/600/400",
    duorunubiPathName: "두루누비 해파랑길 46코스 (무장애 안심길)"
  },
  {
    id: "alt-taebaek",
    name: "태백 매봉산 바람의 언덕 & 자작나무 숲",
    regionName: "태백시",
    originalName: "속초 청초호 & 속초해변",
    description: "해발 1,200m에 위치한 바람의 언덕은 끝없이 펼쳐진 초록빛 고랭지 배추밭과 풍력발전기가 장관을 이룹니다. 한여름에도 평균 섭씨 22도로 피서에 최적화되어 있습니다.",
    valueProposition: "체감 온도 평균 5℃ 낮음 | 넓은 야외 보행 폭으로 휠체어 교행 완벽 가능",
    congestionLevel: 15,
    accessibility: {
      petFriendly: true,
      wheelchair: true,
      stroller: true,
      senior: true,
      details: "전망대까지 완만한 친환경 전동 셔틀버스 상시 운행, 휠체어 보조 손잡이 데크"
    },
    recommendedTime: "오전 9시 ~ 11시 (아침 안개와 풍차 조망)",
    imageUrl: "https://picsum.photos/seed/quiettaebaek/600/400",
    duorunubiPathName: "낙동정맥 트레일 (정선-태백 무장애 연결구간)"
  },
  {
    id: "alt-jeongseon",
    name: "정선 동강 할미꽃마을 & 소금강길",
    regionName: "정선군",
    originalName: "경주 황리단길 & 대릉원",
    description: "동강의 푸른 물줄기와 기암괴석이 어우러진 정선 소금강길은 인파의 발길이 닿지 않은 태고의 신비를 간직하고 있습니다. 평온한 한옥 가옥과 야생화 숲길이 평화로운 정취를 선물합니다.",
    valueProposition: "평균 밀집도 1/10 수준 | 소음 스트레스 없는 산림 치유 특화 코스",
    congestionLevel: 12,
    accessibility: {
      petFriendly: true,
      wheelchair: true,
      stroller: true,
      senior: true,
      details: "전 코스 턱 없는 완만한 황톳길, 보행 약자를 위한 스마트 쉼터 6개소 운영"
    },
    recommendedTime: "오전 10시 ~ 오후 1시 (자연 채광 속 사진 촬영)",
    imageUrl: "https://picsum.photos/seed/quietjeongseon/600/400",
    duorunubiPathName: "정선 동강 에코트레일 (휠체어/반려동물 허용)"
  },
  {
    id: "alt-samcheok",
    name: "삼척 초곡용굴촛대바위길",
    regionName: "삼척시",
    originalName: "제주 협재해수욕장 & 애월",
    description: "기암괴석과 끝없이 푸른 바다가 만나는 절경을 가로지르는 660m의 명품 바다 길입니다. 출렁다리와 초곡 용굴의 장엄함까지 한 눈에 감상할 수 있습니다.",
    valueProposition: "관광공사 지정 '열린 관광지' | 전 구간 바다 위 배리어 프리 목재 덱",
    congestionLevel: 22,
    accessibility: {
      petFriendly: false,
      wheelchair: true,
      stroller: true,
      senior: true,
      details: "안전 펜스 완벽 구축, 바닥 흔들림 없는 일자형 안심 덱, 휠체어 대여 및 장애인 화장실 인접"
    },
    recommendedTime: "오전 8시 ~ 10시 (가장 투명한 옥빛 바다 관측)",
    imageUrl: "https://picsum.photos/seed/quietsamcheok/600/400",
    duorunubiPathName: "두루누비 해파랑길 29코스 (열린 관광 동선)"
  }
];

// Info for our 4 Gangwon pilot regions
export const pilotRegions: PilotRegion[] = [
  {
    id: "goseong",
    name: "강원도 고성",
    slogan: "동해의 끝에서 만나는 고요한 안식처",
    description: "동해안의 최북단에 위치해 오염되지 않은 자연과 여유롭고 넓은 해수욕장들을 품고 있습니다. 붐비지 않는 조용한 차박과 서핑, 반려동물 동반 가족의 숨겨진 보금자리입니다.",
    reasons: [
      "해파랑길 5개 코스 무장애 보강 인프라 완비",
      "반려동물 동반 가능한 전용 해변(댕수욕장) 보유",
      "인근 속초·강릉의 과밀 관광객 흡수 잠재력 최고"
    ],
    keySpots: [
      { name: "아야진 해변", desc: "고운 모래와 무장애 데크, 완만한 수심", icon: "Anchor" },
      { name: "송지호 둘레길", desc: "송림과 호수가 어우러진 잔잔한 평지 산책길", icon: "Trees" },
      { name: "화진포 호수", desc: "남북 역사적 인물들의 별장이 모여있던 은밀한 절경", icon: "Compass" }
    ],
    accessibilityScore: 92,
    duorunubiCount: 5,
    imageUrl: "https://picsum.photos/seed/goseongregion/800/600"
  },
  {
    id: "jeongseon",
    name: "강원도 정선",
    slogan: "아리랑의 고장, 겹겹이 쌓인 산세와 계곡의 치유",
    description: "첩첩산중 맑은 공기와 조용한 계곡으로 대변되는 힐링의 성지입니다. 문화를 담은 아라리촌과 턱이 없고 울창한 소나무 숲길들이 여행자를 품어줍니다.",
    reasons: [
      "행안부 지정 대표 인구감소지역으로 지역 균형 지원 시급",
      "산악형 휠체어 코스 및 보행 보조 지원책 구축 우수",
      "동강 래프팅 외에 숨겨진 계곡과 숲이 풍부"
    ],
    keySpots: [
      { name: "동강 소금강길", desc: "한국 최고의 절벽 비경과 완만한 치유의 숲길", icon: "Leaf" },
      { name: "병방치 스카이워크", desc: "한반도 모양의 동강 굽이를 휠체어로 감상 가능", icon: "Eye" },
      { name: "민둥산 억새밭", desc: "완만한 덱 로드로 등산 약자도 접근 가능한 억새 평원", icon: "Sun" }
    ],
    accessibilityScore: 89,
    duorunubiCount: 4,
    imageUrl: "https://picsum.photos/seed/jeongseonregion/800/600"
  },
  {
    id: "taebaek",
    name: "강원도 태백",
    slogan: "평균 해발 650m, 구름 위의 맑고 시원한 고원",
    description: "과거 탄광 도시에서 이제는 청정 고원 관광 허브로 거듭났습니다. 열대야 없는 도시, 미세먼지 없는 최고의 기온 환경을 자랑합니다.",
    reasons: [
      "기상청 결합 폭염 대피 특화 데이터 연계 가능",
      "평균 기온이 낮아 노약자 및 심혈관 질환자 피서에 안전",
      "넓고 정돈된 석탄 박물관 등 유모차 친화 시설 다수"
    ],
    keySpots: [
      { name: "바람의 언덕", desc: "풍력발전기 60여 대가 그리는 비현실적 풍광", icon: "Wind" },
      { name: "구문소", desc: "강물이 산을 뚫고 지나간 태고의 신비를 간직한 기암석", icon: "Droplet" },
      { name: "태백산 무장애 나눔길", desc: "울창한 낙엽송 숲을 경사도 5% 미만 데크로 완주", icon: "Navigation" }
    ],
    accessibilityScore: 91,
    duorunubiCount: 3,
    imageUrl: "https://picsum.photos/seed/taebaekregion/800/600"
  },
  {
    id: "samcheok",
    name: "강원도 삼척",
    slogan: "해양 동굴과 황금빛 모래가 펼쳐진 무장애 성지",
    description: "울창한 대나무 숲과 푸른 동해 바다를 동시에 즐기는 매력적인 해양 도시입니다. 무장애 열린관광지 인프라가 강원도 내에서 가장 탄탄히 설계되어 있습니다.",
    reasons: [
      "한국관광공사 선정 '열린관광지' 최다 보유군 중 하나",
      "해양 레일바이크 등 특수 휠체어 수용 인프라 탑재",
      "다양한 보행 수준별 해안 두루누비 코스 완비"
    ],
    keySpots: [
      { name: "초곡용굴 촛대바위길", desc: "바다 위 절벽을 아슬아슬하되 평평하게 걷는 데크길", icon: "Sparkles" },
      { name: "환선굴 (동굴)", desc: "국내 최대 석회동굴로 모노레일을 통한 계단 최소화 진입", icon: "Layers" },
      { name: "맹방해수욕장", desc: "넓고 조용하며 방풍림 속 그늘이 훌륭한 산책로", icon: "Cloud" }
    ],
    accessibilityScore: 94,
    duorunubiCount: 6,
    imageUrl: "https://picsum.photos/seed/samcheokregion/800/600"
  }
];

// Open Data and APIs utilized by Ongil for high credibility
export const trustAPIs = [
  {
    name: "한국관광공사 TourAPI 4.0",
    description: "대한민국 국문 관광정보, 무장애 여행, 반려동물 동반정보 동기화",
    badge: "공공데이터포털",
    logoText: "KTO"
  },
  {
    name: "관광빅데이터 플랫폼",
    description: "전국 주요 관광지 집중률(인파 밀집 추이 및 미래 예측)",
    badge: "빅데이터",
    logoText: "BIGDATA"
  },
  {
    name: "기상청 단기예보 OpenAPI",
    description: "기상 이변(폭염/강수/태풍) 실시간 매칭 및 실내외 대안 제어",
    badge: "기상청",
    logoText: "KMA"
  },
  {
    name: "에어코리아 대기오염정보",
    description: "실시간 미세먼지(PM10, PM2.5) 데이터 기반 실내 큐레이션",
    badge: "환경공단",
    logoText: "AIR"
  },
  {
    name: "카카오모빌리티 & 로컬 API",
    description: "인근 대안 관광지 실시간 길찾기 소요시간 및 혼잡 주차장 회피 경로 안내",
    badge: "민간연계",
    logoText: "KAKAO"
  }
];

// Future Roadmap
export const roadmapItems: RoadmapItem[] = [
  {
    period: "2026년 하반기 (현재)",
    title: "온길 국내 웹/앱 베타 서비스 런칭",
    status: "active",
    items: [
      "강원도 4개 시군(정선, 태백, 삼척, 고성) 특화 파일럿 서비스 오픈",
      "기상청 및 에어코리아 실시간 대기 보정 엔진 고도화",
      "두루누비 걷기길 결합 무장애 전용 경로 큐레이터 정밀화",
      "오픈베타 테스터 모집 및 피드백 반영 알고리즘 조정"
    ]
  },
  {
    period: "2027년 상반기",
    title: "글로벌 확장 및 다국어 런칭",
    status: "planned",
    items: [
      "인바운드 외국인 관광객용 영어·중어·일어 지원 앱 출시",
      "K-관광 교통 패스 연계 대안 대중교통 경로 추천 기능 추가",
      "장애 유형별(시각/청각/발달장애) 맞춤 안내 UX 업그레이드"
    ]
  },
  {
    period: "2027년 하반기 이후",
    title: "7대 RTO 협업 및 지자체 패키지 보급",
    status: "planned",
    items: [
      "부산·인천·광주·세종·경북·제주 등 전국 7개 관광공사(RTO) 협업 확대",
      "지자체용 '관광 흐름 및 혼잡 유도 모니터링' 대시보드 보급",
      "인구감소지역 인근 전통시장, 청년상인 등 친환경 바우처 연계 결제 서비스"
    ]
  }
];
