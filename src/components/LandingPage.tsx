'use client';

import {
  Accessibility,
  ArrowDownRight,
  ArrowRight,
  Bookmark,
  Check,
  Compass,
  Dog,
  Flag,
  Footprints,
  Landmark,
  Map,
  Search,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";
import ongilHero from "../assets/images/ongil_hero_1783066591711.jpg";

interface LandingPageProps {
  onExploreClick: () => void;
  onAssistantClick: () => void;
}

const steps = [
  {
    number: "01",
    icon: Search,
    title: "찾고 싶은 곳을 검색해요",
    body: "관광지명, 주소, 코스명과 테마로 강원 일부 지역의 여행지를 찾아보세요.",
  },
  {
    number: "02",
    icon: Accessibility,
    title: "내게 필요한 조건을 골라요",
    body: "반려동물 동반, 이동·시각·청각·영유아 가족 편의 정보를 기준으로 좁혀볼 수 있어요.",
  },
  {
    number: "03",
    icon: Bookmark,
    title: "다음 여행을 위해 남겨요",
    body: "마음에 드는 장소와 걷기 코스를 저장하고, 나만의 목록으로 다시 확인하세요.",
  },
];

const walkingThemes = [
  {
    name: "해파랑길",
    route: "부산 오륙도해맞이공원 ~ 강원 고성 통일전망대",
    description: "동해안 경관과 지역 문화를 잇는 동쪽 구간",
    icon: Waves,
    tone: "bg-[#dcebed] text-[#126d7a]",
  },
  {
    name: "남파랑길",
    route: "부산 오륙도해맞이공원 ~ 전남 해남 땅끝탑",
    description: "남해안의 풍경·항구·마을을 잇는 남쪽 구간",
    icon: Flag,
    tone: "bg-[#f3e2d0] text-[#9c5a1f]",
  },
  {
    name: "서해랑길",
    route: "인천 강화 ~ 전남 해남 땅끝탑",
    description: "서해안 갯벌·섬·포구를 잇는 서쪽 구간",
    icon: Landmark,
    tone: "bg-[#f5e7c9] text-[#8f641d]",
  },
  {
    name: "DMZ 평화의 길",
    route: "DMZ·접경지역을 따라 걷는 구간",
    description: "자연·역사·평화 자원을 만나는 길",
    icon: ShieldCheck,
    tone: "bg-[#e1e6d8] text-[#5f6b52]",
  },
];

const congestionBands = [
  { label: "여유", rule: "20 이하", tone: "bg-[#5d9b72]", width: "w-[28%]" },
  { label: "보통", rule: "21–50", tone: "bg-[#d8a545]", width: "w-[53%]" },
  { label: "높음", rule: "50 초과", tone: "bg-[#c86c5b]", width: "w-[82%]" },
];

export default function LandingPage({ onExploreClick, onAssistantClick }: LandingPageProps) {
  return (
    <div className="overflow-hidden bg-[#f7f5ef] text-[#19332b]">
      <main>
        <section className="relative isolate min-h-[min(780px,calc(100vh-4rem))] border-b border-[#19332b]/10 px-5 pb-16 pt-14 sm:px-8 lg:px-12 lg:pb-24 lg:pt-20">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_76%_24%,rgba(204,213,174,0.46),transparent_30%),linear-gradient(120deg,#f7f5ef_0%,#f7f5ef_52%,#eef0e3_100%)]" />
          <div className="mx-auto grid max-w-7xl items-end gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
            <div className="max-w-2xl animate-fadeIn">
              <p className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#2d5a27]/20 bg-white/60 px-3.5 py-2 text-xs font-semibold tracking-[0.08em] text-[#2d5a27]">
                <span className="h-2 w-2 rounded-full bg-[#d46c45]" />
                강원 지역 여행 탐색 서비스
              </p>
              <h1 className="font-display text-[clamp(3.2rem,8vw,7.5rem)] font-black leading-[0.94] tracking-[-0.065em] text-[#19332b]">
                여행의 방향을
                <br />
                <span className="text-[#2d5a27]">조금 다르게.</span>
              </h1>
              <p className="mt-8 max-w-lg text-base leading-8 text-[#19332b]/70 sm:text-lg">
                온길은 강원 일부 지역의 관광지와 걷기 코스를 한곳에서 살펴보고,
                내게 필요한 여행 조건으로 더 편하게 고르는 서비스예요.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={onExploreClick}
                  className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#19332b] px-6 py-4 text-sm font-bold text-white shadow-[0_12px_30px_rgba(25,51,43,0.16)] transition duration-300 hover:-translate-y-1 hover:bg-[#2d5a27] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#d46c45]"
                >
                  여행지 둘러보기
                  <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
                </button>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-4 text-sm font-semibold text-[#19332b]/70 transition hover:text-[#19332b]"
                >
                  온길은 이렇게 써요 <ArrowDownRight size={16} />
                </a>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[560px] lg:mb-0 lg:justify-self-end">
              <div className="absolute -left-5 -top-5 z-10 hidden rounded-2xl border border-[#19332b]/10 bg-[#fbfaf5]/90 p-4 shadow-xl backdrop-blur sm:block lg:-left-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d46c45]">today&apos;s note</p>
                <p className="mt-2 text-sm font-semibold leading-5">사람보다 풍경이<br />먼저 보이는 길</p>
              </div>
              <div className="aspect-[0.84] overflow-hidden rounded-[2rem] rounded-bl-[5rem] border-8 border-white/70 shadow-[0_25px_70px_rgba(25,51,43,0.18)] sm:aspect-[0.92]">
                <img
                  src={ongilHero.src}
                  alt="강원도의 바다와 산을 따라 이어지는 산책길"
                  className="h-full w-full object-cover transition duration-700 hover:scale-105"
                />
              </div>
              <div className="absolute -bottom-5 -right-2 flex items-center gap-3 rounded-2xl bg-[#dfe6c7] px-5 py-4 shadow-lg sm:-right-7">
                <Compass size={23} className="text-[#2d5a27]" />
                <div>
                  <p className="text-[10px] font-bold tracking-[0.14em] text-[#2d5a27]/70">ONGIL</p>
                  <p className="text-sm font-bold">내 속도의 여행</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#19332b]/10 bg-[#19332b] px-5 py-5 text-white sm:px-8 lg:px-12">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm">
            <p className="font-semibold text-[#e5ebcf]">검색부터 저장까지, 여행을 고르는 데 필요한 것만</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/65">
              <span className="flex items-center gap-1.5"><Map size={14} /> 관광지 탐색</span>
              <span className="flex items-center gap-1.5"><Footprints size={14} /> 걷기 코스</span>
              <span className="flex items-center gap-1.5"><Dog size={14} /> 반려동물 안내</span>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <p className="mb-4 text-xs font-bold tracking-[0.18em] text-[#d46c45]">A SMALLER WAY TO PLAN</p>
                <h2 className="font-display text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">
                  많이 알려진 곳보다
                  <br />
                  <span className="text-[#2d5a27]">나에게 맞는 곳.</span>
                </h2>
                <p className="mt-6 max-w-sm leading-7 text-[#19332b]/60">
                  온길은 하나의 정답을 밀어붙이지 않아요. 검색하고, 조건을 확인하고, 내 여행에 맞는지 천천히 살펴볼 수 있도록 만들었습니다.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {steps.map(({ number, icon: Icon, title, body }) => (
                  <article key={number} className="group rounded-3xl border border-[#19332b]/10 bg-white/60 p-6 transition duration-300 hover:-translate-y-2 hover:border-[#2d5a27]/30 hover:bg-white hover:shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#d46c45]">{number}</span>
                      <Icon size={19} className="text-[#2d5a27] transition-transform group-hover:scale-110" />
                    </div>
                    <h3 className="mt-14 text-lg font-bold leading-7">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#19332b]/60">{body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="ai-assistant" className="border-b border-[#19332b]/10 bg-[#e7ebd8] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
            <div>
              <p className="mb-4 text-xs font-bold tracking-[0.18em] text-[#d46c45]">A MORE PERSONAL WAY TO CHOOSE</p>
              <h2 className="font-display text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">
                조건을 말하면,
                <br />
                <span className="text-[#2d5a27]">여행지를 찾아드려요.</span>
              </h2>
              <p className="mt-6 max-w-lg leading-7 text-[#19332b]/65">
                AI 어시스턴트가 좋아하는 풍경과 여행 방식 같은 취향을 듣고, 이동·접근성 정보를 함께 살펴 나에게 맞는 여행지를 추천해드려요.
              </p>
              <button
                onClick={onAssistantClick}
                className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#19332b] px-6 py-4 text-sm font-bold text-white shadow-[0_12px_30px_rgba(25,51,43,0.14)] transition duration-300 hover:-translate-y-1 hover:bg-[#2d5a27] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#d46c45]"
              >
                AI 어시스턴트에게 물어보기 <ArrowRight size={17} />
              </button>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] bg-[#19332b] p-8 text-white shadow-[0_20px_50px_rgba(25,51,43,0.14)] sm:p-10">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[24px] border-white/10" />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#dfe6c7] text-[#2d5a27]">
                    <Sparkles size={21} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.16em] text-[#dfe6c7]">ONGIL AI</p>
                    <p className="mt-1 text-lg font-bold">나에게 맞는 여행 찾기</p>
                  </div>
                </div>
                <div className="mt-10 rounded-2xl bg-white/10 p-5">
                  <p className="text-sm leading-6 text-white/85">“사람이 많지 않고, 휠체어로 이동하기 편한 바닷가 산책지를 추천해줘.”</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[#dfe6c7]">
                  <span className="rounded-full border border-white/15 px-3 py-2">여행 취향</span>
                  <span className="rounded-full border border-white/15 px-3 py-2">이동 편의</span>
                  <span className="rounded-full border border-white/15 px-3 py-2">접근성 안내</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="walking-themes" className="bg-[#19332b] px-5 py-24 text-white sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <p className="mb-4 text-xs font-bold tracking-[0.18em] text-[#dfe6c7]">KOREA DULLE-GIL</p>
                <h2 className="font-display text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">
                  길의 결이 다른
                  <br />
                  <span className="text-[#dfe6c7]">네 가지 테마.</span>
                </h2>
                <p className="mt-6 max-w-xl leading-7 text-white/65">
                  온길의 걷기 코스는 코리아둘레길 네 가지 테마를 기준으로 살펴볼 수 있어요. 현재 DB에 연결된 141개 코스의 거리·시간·노선 정보를 함께 확인해보세요.
                </p>
              </div>
              <div className="shrink-0 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-[#dfe6c7]">4 themes · 141 courses</div>
            </div>

            <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {walkingThemes.map(({ name, route, description, icon: Icon, tone }) => (
                <article key={name} className="group relative flex min-h-[270px] flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.1]">
                  <div>
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
                      <Icon size={21} />
                    </div>
                    <h3 className="mt-8 text-xl font-bold">{name}</h3>
                    <p className="mt-3 text-sm font-medium leading-6 text-white/85">{description}</p>
                  </div>
                  <p className="border-t border-white/10 pt-4 text-xs leading-5 text-white/45">{route}</p>
                </article>
              ))}
            </div>
            <p className="mt-6 text-xs leading-5 text-white/45">
              DMZ 평화의 길은 예약·운영 일정에 따라 이용이 달라질 수 있으며, 군사·안보·기상 상황에 따라 운영이 바뀔 수 있어요.
            </p>
          </div>
        </section>

        <section id="congestion" className="bg-[#f1e9dc] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
            <div>
              <p className="mb-4 text-xs font-bold tracking-[0.18em] text-[#c15b38]">A DATE-SPECIFIC REFERENCE</p>
              <h2 className="font-display text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">
                같은 관광지도,
                <br />
                <span className="text-[#c15b38]">날짜에 따라 다르게.</span>
              </h2>
              <p className="mt-6 max-w-lg leading-7 text-[#19332b]/65">
                관광지 상세 화면에서 날짜를 선택하면, 해당 관광지에 저장된 숫자형 예측 지표를 확인할 수 있어요. 온길은 이 정보를 세 구간으로 읽기 쉽게 보여줍니다.
              </p>
              <button onClick={onExploreClick} className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#19332b] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#2d5a27]">
                날짜를 골라 찾아보기 <ArrowRight size={16} />
              </button>
            </div>

            <div className="rounded-[2rem] border border-[#19332b]/10 bg-[#fbfaf5] p-6 shadow-[0_20px_50px_rgba(25,51,43,0.08)] sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#19332b]/10 pb-5">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.14em] text-[#c15b38]">DESTINATION DETAIL</p>
                  <h3 className="mt-1 text-lg font-bold">관광지별·선택 날짜 기준 혼잡도</h3>
                </div>
                <span className="rounded-lg border border-[#19332b]/10 bg-white px-3 py-2 text-xs font-semibold text-[#19332b]/65">선택 날짜</span>
              </div>
              <div className="mt-7 space-y-5">
                {congestionBands.map(({ label, rule, tone, width }) => (
                  <div key={label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-bold">{label}</span>
                      <span className="font-mono text-xs text-[#19332b]/55">{rule}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-[#19332b]/[0.07]">
                      <div className={`h-full rounded-full ${tone} ${width}`} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-2xl bg-[#f1e9dc] px-4 py-3 text-xs leading-5 text-[#19332b]/65">
                혼잡도는 이용 가능한 과거·저장 데이터를 바탕으로 한 참고 정보예요. 실제 현장 상황과 다를 수 있으니 방문 전 현장 및 공식 안내를 꼭 확인해주세요.
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#e7ebd8] px-5 py-24 sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-24">
            <div className="relative overflow-hidden rounded-[2rem] bg-[#2d5a27] p-8 text-white sm:p-12">
              <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[28px] border-white/10" />
              <div className="absolute -bottom-20 -left-12 h-48 w-48 rounded-full border-[22px] border-[#dfe6c7]/20" />
              <div className="relative">
                <p className="text-xs font-bold tracking-[0.18em] text-[#dfe6c7]">CHECK WHAT MATTERS</p>
                <h2 className="mt-5 max-w-md font-display text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl">
                  여행의 조건도
                  <br />
                  여행의 일부니까.
                </h2>
                <div className="mt-10 grid gap-3 sm:grid-cols-2">
                  {["반려동물 안내", "이동 편의 정보", "시각·청각 편의", "영유아 가족 편의"].map((label) => (
                    <div key={label} className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white/90">
                      <Check size={15} className="text-[#dfe6c7]" /> {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-[#d46c45]">정보를 볼 때 한 가지 약속</p>
              <h2 className="mt-4 font-display text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl">확인된 안내를<br />있는 그대로 보여드려요.</h2>
              <p className="mt-6 leading-7 text-[#19332b]/65">
                반려동물·무장애 정보는 실제 이용 가능 여부를 단정하지 않고, 등록된 안내 정보를 기준으로 제공합니다. 방문 전 상세 내용을 한 번 더 확인할 수 있게 돕는 것이 온길의 역할입니다.
              </p>
              <button onClick={onExploreClick} className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#19332b]/20 px-5 py-3 text-sm font-bold transition hover:border-[#2d5a27] hover:bg-white">
                조건을 넣어 찾아보기 <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>

        <section className="px-5 py-24 text-center sm:px-8 lg:px-12 lg:py-32">
          <p className="text-xs font-bold tracking-[0.18em] text-[#d46c45]">START WITH A PLACE</p>
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-4xl font-black leading-tight tracking-[-0.05em] sm:text-6xl">이번 여행은,<br /><span className="text-[#2d5a27]">어디서 시작할까요?</span></h2>
          <p className="mx-auto mt-6 max-w-md text-sm leading-7 text-[#19332b]/60">관광지와 걷기 코스를 살펴보고, 당신의 여행에 맞는 정보를 직접 확인해보세요.</p>
          <button onClick={onExploreClick} className="group mt-9 inline-flex items-center gap-3 rounded-full bg-[#d46c45] px-7 py-4 text-sm font-bold text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-[#c15b38]">
            온길에서 찾아보기 <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
          </button>
          <p className="mt-8 text-xs text-[#19332b]/40">현재 강원 일부 지역부터 만나볼 수 있어요.</p>
        </section>
      </main>
      <footer className="border-t border-[#19332b]/10 px-5 py-7 text-xs text-[#19332b]/45 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <span className="font-display text-sm font-black text-[#19332b]/70">온길 Ongil</span>
          <span>등록된 안내 정보를 바탕으로 여행지를 탐색합니다.</span>
        </div>
      </footer>
    </div>
  );
}
