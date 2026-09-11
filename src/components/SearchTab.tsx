import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Baby,
  Check,
  ChevronDown,
  Clock3,
  Footprints,
  Heart,
  MapPin,
  PawPrint,
  RefreshCw,
  Search,
  X
} from "lucide-react";

interface SearchTabProps {
  // Kept for the shared tab contract. Search results intentionally do not invent a mock destination.
  onSelectDestination: (...args: never[]) => void;
  likedDestinations: string[];
  onToggleLike: (id: string) => void;
  accessibilityDefaults: {
    petFriendly: boolean;
    wheelchair: boolean;
    stroller: boolean;
    senior: boolean;
    parking: boolean;
  };
}

interface Sigungu {
  ldong_regn_cd: string;
  ldong_signgu_cd: string;
  signgu_name: string;
}

interface ApiResponse<T> {
  count: number;
  page: number;
  limit: number;
  rows: T[];
}

interface Attraction {
  content_id: string | number;
  title: string;
  addr1?: string | null;
  addr2?: string | null;
  firstimage?: string | null;
  firstimage2?: string | null;
  lcls_systm1?: string | null;
  hasPetInfo?: boolean;
  hasPhysicalInfo?: boolean;
  hasVisualInfo?: boolean;
  hasHearingInfo?: boolean;
  hasInfantFamilyInfo?: boolean;
  content_modified_at?: string | null;
}

interface Course {
  crs_idx: string;
  crs_kor_nm: string;
  crs_dstnc?: number | null;
  crs_totl_rqrm_hour?: number | null;
  crs_cycle?: string | null;
  brd_div?: string | null;
  sigun?: string | null;
  route_idx?: string | null;
  theme_nm?: string | null;
  gpxpath?: string | null;
  crs_summary?: string | null;
}

type Sort = "relevance" | "name" | "updated";
type Tab = "attractions" | "courses";
type Range = "short" | "medium" | "long";

const barrierFilters = [
  ["physicalInfo", "이동 편의 정보"],
  ["visualInfo", "시각 안내 정보"],
  ["hearingInfo", "청각 안내 정보"],
  ["infantFamilyInfo", "영유아·가족 편의 정보"]
] as const;

const infoFilterButtons: Array<[string, string, React.ElementType]> = [
  ["petInfo", "반려동물 안내 있음", PawPrint],
  ["physicalInfo", "이동 편의 정보", Check],
  ["visualInfo", "시각 안내 정보", Check],
  ["hearingInfo", "청각 안내 정보", Check],
  ["infantFamilyInfo", "영유아·가족 편의 정보", Baby]
];

const rangeLabels: Record<Range, string> = { short: "짧은 편", medium: "중간", long: "긴 편" };

export default function SearchTab({
  onSelectDestination: _onSelectDestination,
  likedDestinations,
  onToggleLike,
  accessibilityDefaults
}: SearchTabProps) {
  const [tab, setTab] = useState<Tab>("attractions");
  const [query, setQuery] = useState("");
  const [sigungu, setSigungu] = useState<Sigungu | null>(null);
  const [sigunguRows, setSigunguRows] = useState<Sigungu[]>([]);
  const [showRegions, setShowRegions] = useState(false);
  const [region, setRegion] = useState("");
  const [boardDivision, setBoardDivision] = useState("");
  const [distance, setDistance] = useState<Range | "">("");
  const [duration, setDuration] = useState<Range | "">("");
  const [cycle, setCycle] = useState("");
  const [petInfo, setPetInfo] = useState(accessibilityDefaults.petFriendly);
  const [barrier, setBarrier] = useState<Record<string, boolean>>({
    physicalInfo: accessibilityDefaults.wheelchair,
    visualInfo: false,
    hearingInfo: false,
    infantFamilyInfo: accessibilityDefaults.stroller
  });
  const [sort, setSort] = useState<Sort>("relevance");
  const [rows, setRows] = useState<Array<Attraction | Course>>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searched, setSearched] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const controller = useRef<AbortController | null>(null);
  const [urlReady, setUrlReady] = useState(false);
  const pendingSigungu = useRef<{ regionCode: string; sigunguCode: string } | null>(null);
  const urlStateHydrated = useRef(false);

  const restoreUrlState = useCallback((params: URLSearchParams) => {
    const nextTab = params.get("tab");
    setTab(nextTab === "courses" ? "courses" : "attractions");
    setQuery(params.get("q") || "");
    const regionCode = params.get("regionCode");
    const sigunguCode = params.get("sigunguCode");
    const sigunguMatch = regionCode && sigunguCode
      ? sigunguRows.find((item) => item.ldong_regn_cd.trim().slice(0, 2) === regionCode && item.ldong_signgu_cd.trim().slice(-3) === sigunguCode)
      : null;
    pendingSigungu.current = regionCode && sigunguCode && !sigunguMatch ? { regionCode, sigunguCode } : null;
    urlStateHydrated.current = !pendingSigungu.current;
    setSigungu(sigunguMatch || null);
    setPetInfo(params.has("petInfo") ? params.get("petInfo") === "true" : accessibilityDefaults.petFriendly);
    setBarrier({
      physicalInfo: params.has("physicalInfo") ? params.get("physicalInfo") === "true" : accessibilityDefaults.wheelchair,
      visualInfo: params.get("visualInfo") === "true",
      hearingInfo: params.get("hearingInfo") === "true",
      infantFamilyInfo: params.has("infantFamilyInfo") ? params.get("infantFamilyInfo") === "true" : accessibilityDefaults.stroller
    });
    setRegion(params.get("region") || "");
    setBoardDivision(params.get("boardDivision") || "");
    const nextDistance = params.get("distance");
    const nextDuration = params.get("duration");
    setDistance(nextDistance === "short" || nextDistance === "medium" || nextDistance === "long" ? nextDistance : "");
    setDuration(nextDuration === "short" || nextDuration === "medium" || nextDuration === "long" ? nextDuration : "");
    setCycle(params.get("cycle") || "");
    const nextSort = params.get("sort");
    setSort(nextSort === "name" || nextSort === "updated" ? nextSort : "relevance");
  }, [accessibilityDefaults, sigunguRows]);

  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/sigungu", { signal: abort.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: ApiResponse<Sigungu>) => setSigunguRows(Array.isArray(data.rows) ? data.rows : []))
      .catch(() => undefined)
      .finally(() => setUrlReady(true));
    return () => abort.abort();
  }, []);

  useEffect(() => {
    restoreUrlState(new URLSearchParams(window.location.search));
    const handlePopState = () => restoreUrlState(new URLSearchParams(window.location.search));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [restoreUrlState]);

  useEffect(() => {
    if (!pendingSigungu.current || sigunguRows.length === 0) return;
    const match = sigunguRows.find((item) => item.ldong_regn_cd.trim().slice(0, 2) === pendingSigungu.current?.regionCode && item.ldong_signgu_cd.trim().slice(-3) === pendingSigungu.current?.sigunguCode);
    if (match) setSigungu(match);
    pendingSigungu.current = null;
    urlStateHydrated.current = true;
  }, [sigunguRows]);

  useEffect(() => {
    if (!urlReady || !urlStateHydrated.current) return;
    const url = new URL(window.location.href);
    ["tab", "q", "regionCode", "sigunguCode", "petInfo", "physicalInfo", "visualInfo", "hearingInfo", "infantFamilyInfo", "region", "boardDivision", "distance", "duration", "cycle", "sort"].forEach((key) => url.searchParams.delete(key));
    if (tab === "courses") url.searchParams.set("tab", "courses");
    if (query.trim()) url.searchParams.set("q", query.trim());
    if (tab === "attractions" && sigungu) {
      url.searchParams.set("regionCode", sigungu.ldong_regn_cd.trim().slice(0, 2));
      url.searchParams.set("sigunguCode", sigungu.ldong_signgu_cd.trim().slice(-3));
    }
    if (tab === "attractions") {
      if (petInfo) url.searchParams.set("petInfo", "true");
      barrierFilters.forEach(([key]) => { if (barrier[key]) url.searchParams.set(key, "true"); });
    } else {
      [["region", region], ["boardDivision", boardDivision], ["distance", distance], ["duration", duration], ["cycle", cycle]].forEach(([key, value]) => { if (value) url.searchParams.set(key, value); });
    }
    if (sort !== "relevance") url.searchParams.set("sort", sort);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [barrier, boardDivision, cycle, distance, duration, petInfo, query, region, sigungu, sort, tab, urlReady]);

  const fetchResults = useCallback(async () => {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setLoading(true);
    setError(false);
    setSearched(true);
    const params = new URLSearchParams({ q: query.trim(), sort, page: "1", limit: "20" });
    if (tab === "attractions") {
      if (sigungu) {
        params.set("regionCode", sigungu.ldong_regn_cd.trim().slice(0, 2));
        params.set("sigunguCode", sigungu.ldong_signgu_cd.trim().slice(-3));
      }
      if (petInfo) params.set("petInfo", "true");
      barrierFilters.forEach(([key]) => {
        if (barrier[key]) params.set(key, "true");
      });
    } else {
      if (region) params.set("region", region);
      if (boardDivision) params.set("boardDivision", boardDivision);
      if (distance) params.set("distance", distance);
      if (duration) params.set("duration", duration);
      if (cycle) params.set("cycle", cycle);
    }
    try {
      const endpoint = tab === "attractions" ? "/api/tour-attractions" : "/api/dulle-courses";
      const response = await fetch(`${endpoint}?${params}`, { signal: abort.signal });
      if (!response.ok) throw new Error("request failed");
      const data = (await response.json()) as ApiResponse<Attraction | Course>;
      if (!abort.signal.aborted) {
        setRows(Array.isArray(data.rows) ? data.rows : []);
        setCount(Number(data.count) || 0);
        setImageErrors(new Set());
      }
    } catch {
      if (!abort.signal.aborted) {
        setRows([]);
        setCount(0);
        setError(true);
      }
    } finally {
      if (!abort.signal.aborted) setLoading(false);
    }
  }, [barrier, boardDivision, cycle, distance, duration, petInfo, query, region, sigungu, sort, tab]);

  useEffect(() => {
    if (!urlReady) return;
    fetchResults();
    return () => controller.current?.abort();
  }, [fetchResults, urlReady]);

  const courseOptions = useMemo(() => ({
    regions: [...new Set((rows as Course[]).map((row) => row.sigun).filter(Boolean))] as string[],
    divisions: [...new Set((rows as Course[]).map((row) => row.brd_div).filter(Boolean))] as string[],
    cycles: [...new Set((rows as Course[]).map((row) => row.crs_cycle).filter(Boolean))] as string[]
  }), [rows]);

  const reset = () => {
    setQuery(""); setSigungu(null); setRegion(""); setBoardDivision(""); setDistance(""); setDuration(""); setCycle("");
    setPetInfo(accessibilityDefaults.petFriendly);
    setBarrier({ physicalInfo: accessibilityDefaults.wheelchair, visualInfo: false, hearingInfo: false, infantFamilyInfo: accessibilityDefaults.stroller });
    setSort("relevance");
  };

  const chips = useMemo(() => {
    const values: Array<{ key: string; label: string; remove: () => void }> = [];
    if (sigungu) values.push({ key: "sigungu", label: sigungu.signgu_name, remove: () => setSigungu(null) });
    if (tab === "attractions") {
      if (petInfo) values.push({ key: "petInfo", label: "반려동물 안내 있음", remove: () => setPetInfo(false) });
      barrierFilters.forEach(([key, label]) => { if (barrier[key]) values.push({ key, label, remove: () => setBarrier((current) => ({ ...current, [key]: false })) }); });
    } else {
      [["region", region, setRegion], ["boardDivision", boardDivision, setBoardDivision], ["distance", distance && `거리 ${rangeLabels[distance]}`, setDistance], ["duration", duration && `시간 ${rangeLabels[duration]}`, setDuration], ["cycle", cycle, setCycle]].forEach(([key, value, setter]) => {
        if (value) values.push({ key: String(key), label: String(value), remove: () => (setter as React.Dispatch<React.SetStateAction<string>>)("") });
      });
    }
    return values;
  }, [barrier, boardDivision, cycle, distance, duration, petInfo, region, sigungu, tab]);

  const toggle = (key: string) => setBarrier((current) => ({ ...current, [key]: !current[key] }));

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      <header>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-bento-green">온길 탐색</p>
        <h2 className="font-display text-3xl font-black tracking-tight text-bento-dark">어디로 걸어볼까요?</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-bento-dark/55">등록된 여행 정보만 바탕으로, 지금 찾고 싶은 목적지를 가볍게 좁혀보세요.</p>
      </header>

      <div className="flex gap-1 rounded-xl border border-border-default bg-bento-bg/70 p-1" role="tablist">
        {([["attractions", "관광지", MapPin], ["courses", "걷기 코스", Footprints]] as const).map(([value, label, Icon]) => (
          <button key={value} role="tab" aria-selected={tab === value} onClick={() => setTab(value)} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold transition-all ${tab === value ? "bg-white text-bento-green shadow-sm" : "text-bento-dark/45 hover:text-bento-dark"}`}><Icon size={16} />{label}</button>
        ))}
      </div>

      <section className="relative z-20 rounded-2xl border border-border-default bg-white p-4 shadow-md sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <label className="mb-1.5 block pl-1 text-[11px] font-bold text-bento-dark/50">검색어</label>
            <Search className="absolute left-4 top-[39px] text-bento-dark/30" size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") fetchResults(); }} placeholder={tab === "attractions" ? "관광지명 또는 주소를 검색하세요" : "코스명 또는 테마명을 검색하세요"} className="w-full rounded-xl border border-border-default bg-bento-bg/40 py-3.5 pl-11 pr-4 text-sm text-bento-dark outline-none transition focus:border-bento-green focus:bg-white" />
          </div>
          <button onClick={fetchResults} className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-bento-green px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-bento-green/90 active:scale-[.98]"><Search size={16} />검색</button>
        </div>

        <div className={`mt-4 grid gap-3 sm:grid-cols-2 ${tab === "courses" ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
          {tab === "attractions" && <div className="relative">
            <label className="mb-1.5 block pl-1 text-[11px] font-bold text-bento-dark/50">지역 선택 <span className="font-normal">(선택)</span></label>
            <button onClick={() => setShowRegions((value) => !value)} className="flex w-full items-center justify-between rounded-xl border border-border-default bg-bento-bg/40 px-3.5 py-3 text-left text-xs font-semibold text-bento-dark"><span className="flex items-center gap-2 truncate"><MapPin size={14} className="text-bento-green" />{sigungu?.signgu_name || "강원도 일부 시군"}</span><ChevronDown size={14} /></button>
            {showRegions && <div className="absolute left-0 right-0 top-full mt-2 max-h-56 overflow-auto rounded-xl border border-border-default bg-white p-1.5 shadow-xl">{sigunguRows.map((item) => <button key={`${item.ldong_regn_cd}-${item.ldong_signgu_cd}`} onClick={() => { setSigungu(item); setShowRegions(false); }} className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-xs font-semibold hover:bg-bento-bg">{item.signgu_name}</button>)}</div>}
          </div>}
          <Select label="정렬" value={sort} onChange={(value) => setSort(value as Sort)} options={[["relevance", "관련도순"], ["name", "이름순"], ["updated", "최신 정보순"]]} />
          {tab === "courses" && <Select label="거리" value={distance} onChange={(value) => setDistance(value as Range | "")} options={[["", "거리 전체"], ["short", "짧은 편"], ["medium", "중간"], ["long", "긴 편"]]} />}
          {tab === "courses" && <Select label="소요 시간" value={duration} onChange={(value) => setDuration(value as Range | "")} options={[["", "시간 전체"], ["short", "짧은 편"], ["medium", "중간"], ["long", "긴 편"]]} />}
        </div>

        {tab === "attractions" ? <div className="mt-4 border-t border-border-subtle pt-4"><p className="mb-2 text-[11px] font-bold text-bento-dark/50">정보 등록 조건 <span className="font-normal">· 이용 가능 여부를 보장하지 않아요</span></p><div className="flex flex-wrap gap-2">{infoFilterButtons.map(([key, label, Icon]) => <button key={key} aria-pressed={key === "petInfo" ? petInfo : barrier[key]} onClick={() => key === "petInfo" ? setPetInfo((value) => !value) : toggle(key)} className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${((key === "petInfo" ? petInfo : barrier[key])) ? "border-bento-green bg-bento-green/10 text-bento-green" : "border-border-default bg-white text-bento-dark/60 hover:border-bento-green/40"}`}><Icon size={13} />{label}</button>)}</div></div> : <div className="mt-4 grid gap-3 border-t border-border-subtle pt-4 sm:grid-cols-3"><RawSelect label="지역" value={region} onChange={setRegion} options={courseOptions.regions} placeholder="지역 전체" /><RawSelect label="노선 구분" value={boardDivision} onChange={setBoardDivision} options={courseOptions.divisions} placeholder="노선 전체" /><RawSelect label="코스 형태" value={cycle} onChange={setCycle} options={courseOptions.cycles} placeholder="형태 전체" /></div>}
      </section>

      {chips.length > 0 && <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-bento-dark/50">적용 중</span>{chips.map((chip) => <button key={chip.key} onClick={chip.remove} className="flex items-center gap-1.5 rounded-full bg-bento-green/10 px-3 py-1.5 text-xs font-semibold text-bento-green">{chip.label}<X size={12} /></button>)}<button onClick={reset} className="ml-auto text-xs font-bold text-bento-dark/45 underline underline-offset-4 hover:text-bento-dark">전체 초기화</button></div>}

      <section aria-live="polite" className="space-y-4">
        <div className="flex items-end justify-between"><div><p className="text-xs font-bold text-bento-green">{loading ? "검색 중…" : `${count.toLocaleString()}곳`}</p><h3 className="mt-1 font-display text-xl font-black text-bento-dark">{tab === "attractions" ? "관광지" : "걷기 코스"}</h3></div>{!loading && !error && <span className="text-[11px] text-bento-dark/40">최대 20개 표시</span>}</div>
        {loading ? <Skeletons /> : error ? <State title="목록을 불러오지 못했어요" text="잠시 후 다시 시도해 주세요." action="다시 시도" onClick={fetchResults} /> : rows.length === 0 ? <State title="조건에 맞는 결과가 없어요" text="필터를 조금 줄여 다시 찾아보세요." action="필터 모두 지우기" onClick={reset} /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tab === "attractions" ? (rows as Attraction[]).map((row) => <AttractionCard key={String(row.content_id)} row={row} liked={likedDestinations.includes(String(row.content_id))} onLike={onToggleLike} imageError={imageErrors.has(String(row.content_id))} onImageError={() => setImageErrors((current) => new Set(current).add(String(row.content_id)))} />) : (rows as Course[]).map((row) => <CourseCard key={row.crs_idx} row={row} />)}</div>}
      </section>
      {!searched && <p className="text-center text-xs text-bento-dark/40">검색어 없이도 지역과 조건으로 둘러볼 수 있어요.</p>}
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: ReadonlyArray<readonly [string, string]> }) {
  return <label className="relative block"><span className="mb-1.5 block pl-1 text-[11px] font-bold text-bento-dark/50">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full appearance-none rounded-xl border border-border-default bg-bento-bg/40 px-3.5 py-3 text-xs font-semibold text-bento-dark outline-none focus:border-bento-green">{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select><ChevronDown size={13} className="pointer-events-none absolute bottom-3.5 right-3 text-bento-dark/40" /></label>;
}

function RawSelect({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (value: string) => void; options: string[]; placeholder: string }) {
  return <Select label={label} value={value} onChange={onChange} options={[["", placeholder], ...options.map((option) => [option, option] as const)]} />;
}

function Skeletons() { return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl border border-border-default bg-white"><div className="h-40 rounded-t-2xl bg-bento-bg" /><div className="space-y-3 p-4"><div className="h-3 w-2/3 rounded bg-bento-bg" /><div className="h-3 w-full rounded bg-bento-bg" /><div className="h-6 w-1/3 rounded-full bg-bento-bg" /></div></div>)}</div>; }

function State({ title, text, action, onClick }: { title: string; text: string; action: string; onClick: () => void }) { return <div className="rounded-2xl border border-border-default bg-white px-6 py-14 text-center shadow-sm"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bento-bg text-bento-green"><RefreshCw size={20} /></div><h4 className="font-display text-base font-black text-bento-dark">{title}</h4><p className="mt-2 text-xs text-bento-dark/50">{text}</p><button onClick={onClick} className="mt-5 rounded-lg bg-bento-green px-4 py-2.5 text-xs font-bold text-white">{action}</button></div>; }

function AttractionCard({ row, liked, onLike, imageError, onImageError }: { row: Attraction; liked: boolean; onLike: (id: string) => void; imageError: boolean; onImageError: () => void }) {
  const id = String(row.content_id); const image = row.firstimage || row.firstimage2;
  const badges = [row.hasPetInfo && "반려동물 안내 있음", row.hasPhysicalInfo && "이동 편의 정보 등록", row.hasVisualInfo && "시각 안내 정보 등록", row.hasHearingInfo && "청각 안내 정보 등록", row.hasInfantFamilyInfo && "영유아·가족 정보 등록"].filter(Boolean).slice(0, 3) as string[];
  return <motion.article whileHover={{ y: -4 }} className="overflow-hidden rounded-2xl border border-border-default bg-white shadow-sm transition-shadow hover:shadow-lg"><div className="relative h-44 bg-bento-bg">{image && !imageError ? <img src={image} alt={row.title} onError={onImageError} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-bento-dark/35">이미지 없음</div>}<button aria-label={`${row.title} 좋아요`} onClick={() => onLike(id)} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-bento-dark/50 shadow-sm"><Heart size={16} className={liked ? "fill-red-500 text-red-500" : ""} /></button></div><div className="space-y-3 p-4"><div><p className="text-[10px] font-bold text-bento-green">{row.lcls_systm1 || "관광지"}</p><h4 className="mt-1 line-clamp-1 font-display text-base font-black text-bento-dark">{row.title}</h4></div><p className="line-clamp-2 text-xs leading-relaxed text-bento-dark/55">{[row.addr1, row.addr2].filter(Boolean).join(" ") || "주소 정보 없음"}</p>{badges.length > 0 && <div className="flex flex-wrap gap-1.5">{badges.map((badge) => <span key={badge} className="rounded-full bg-bento-bg px-2 py-1 text-[10px] font-semibold text-bento-dark/65">{badge}</span>)}</div>}</div></motion.article>;
}

function CourseCard({ row }: { row: Course }) { return <motion.article whileHover={{ y: -4 }} className="rounded-2xl border border-border-default bg-white p-5 shadow-sm transition-shadow hover:shadow-lg"><div className="mb-5 flex h-32 items-center justify-center rounded-xl bg-gradient-to-br from-bento-bg to-bento-olive/20 text-bento-green"><Footprints size={36} strokeWidth={1.4} /></div><p className="text-[10px] font-bold text-bento-green">{row.theme_nm || row.brd_div || "걷기 코스"}</p><h4 className="mt-1 line-clamp-2 font-display text-base font-black text-bento-dark">{row.crs_kor_nm}</h4><p className="mt-2 line-clamp-2 min-h-8 text-xs leading-relaxed text-bento-dark/55">{row.crs_summary || "코스 상세 안내가 등록되어 있습니다."}</p><div className="mt-4 flex flex-wrap gap-2 text-[10px] font-semibold text-bento-dark/60">{row.sigun && <span className="flex items-center gap-1"><MapPin size={12} />{row.sigun}</span>}{row.crs_dstnc != null && <span>{row.crs_dstnc}km</span>}{row.crs_totl_rqrm_hour != null && <span className="flex items-center gap-1"><Clock3 size={12} />{row.crs_totl_rqrm_hour}시간</span>}{row.crs_cycle && <span>{row.crs_cycle}</span>}{row.gpxpath && <span className="rounded-full bg-bento-bg px-2 py-1">GPX 제공</span>}</div></motion.article>; }
