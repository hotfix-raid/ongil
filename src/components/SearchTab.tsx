import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Baby,
  Car,
  Check,
  ChevronDown,
  Clock,
  Heart,
  PawPrint,
  RefreshCw,
  Search,
  X
} from "lucide-react";

interface SearchTabProps {
  // Opens the real DB-backed detail modal by content_id.
  onSelectDestination: (contentId: string) => void;
  forecastDate: string;
  onForecastDateChange: (date: string) => void;
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

interface Region {
  ldong_regn_cd: string;
  regn_name: string;
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
  usetime?: string | null;
  parking?: string | null;
  cnctrRate?: number | null;
  content_modified_at?: string | null;
}

type Sort = "congestion" | "name";

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

export default function SearchTab({
  onSelectDestination,
  forecastDate,
  onForecastDateChange,
  likedDestinations,
  onToggleLike,
  accessibilityDefaults
}: SearchTabProps) {
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [searchTick, setSearchTick] = useState(0);
  const [regionRows, setRegionRows] = useState<Region[]>([]);
  const [regionCode, setRegionCode] = useState("");
  const [sigungu, setSigungu] = useState<Sigungu | null>(null);
  const [sigunguRows, setSigunguRows] = useState<Sigungu[]>([]);
  const [petInfo, setPetInfo] = useState(accessibilityDefaults.petFriendly);
  const [barrier, setBarrier] = useState<Record<string, boolean>>({
    physicalInfo: accessibilityDefaults.wheelchair,
    visualInfo: false,
    hearingInfo: false,
    infantFamilyInfo: accessibilityDefaults.stroller
  });
  const [sort, setSort] = useState<Sort>("congestion");
  const [rows, setRows] = useState<Attraction[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [searched, setSearched] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const controller = useRef<AbortController | null>(null);
  const pageRef = useRef(1);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [urlReady, setUrlReady] = useState(false);
  const pendingSigungu = useRef<{ regionCode: string; sigunguCode: string } | null>(null);
  const urlStateHydrated = useRef(false);

  const restoreUrlState = useCallback((params: URLSearchParams) => {
    const nextQuery = params.get("q") || "";
    setQuery(nextQuery);
    setAppliedQuery(nextQuery);
    const regionCode = params.get("regionCode");
    const sigunguCode = params.get("sigunguCode");
    const validRegionCode = regionCode && /^\d{2}$/.test(regionCode) ? regionCode : "";
    // Inline match handles popstate where the URL sigunguCode changes without
    // a regionCode change (so the sigungu fetch wouldn't re-run). The fetch
    // handler below covers the initial-mount case where sigunguRows is still
    // empty here.
    const sigunguMatch = validRegionCode && sigunguCode
      ? sigunguRows.find((item) => item.ldong_regn_cd.trim().slice(0, 2) === validRegionCode && item.ldong_signgu_cd.trim().slice(-3) === sigunguCode) ?? null
      : null;
    pendingSigungu.current = validRegionCode && sigunguCode && !sigunguMatch ? { regionCode: validRegionCode, sigunguCode } : null;
    urlStateHydrated.current = !pendingSigungu.current;
    setRegionCode(validRegionCode);
    setSigungu(sigunguMatch);
    setPetInfo(params.has("petInfo") ? params.get("petInfo") === "true" : accessibilityDefaults.petFriendly);
    setBarrier({
      physicalInfo: params.has("physicalInfo") ? params.get("physicalInfo") === "true" : accessibilityDefaults.wheelchair,
      visualInfo: params.get("visualInfo") === "true",
      hearingInfo: params.get("hearingInfo") === "true",
      infantFamilyInfo: params.has("infantFamilyInfo") ? params.get("infantFamilyInfo") === "true" : accessibilityDefaults.stroller
    });
    const nextDate = params.get("date");
    onForecastDateChange(nextDate && /^\d{4}-\d{2}-\d{2}$/.test(nextDate) ? nextDate : new Date().toISOString().slice(0, 10));
    const nextSort = params.get("sort");
    setSort(nextSort === "name" ? "name" : "congestion");
  }, [accessibilityDefaults, onForecastDateChange, sigunguRows]);

  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/regions", { signal: abort.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: ApiResponse<Region>) => setRegionRows(Array.isArray(data.rows) ? data.rows : []))
      .catch(() => undefined);
    return () => abort.abort();
  }, []);

  useEffect(() => {
    const abort = new AbortController();
    fetch(regionCode ? `/api/sigungu?regionCode=${regionCode}` : "/api/sigungu", { signal: abort.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: ApiResponse<Sigungu>) => {
        if (abort.signal.aborted) return;
        const rows = Array.isArray(data.rows) ? data.rows : [];
        setSigunguRows(rows);
        // Hydrate sigungu from pending URL params in the same batch as
        // setSigunguRows so that fetchResults captures the correct filter
        // on the first call.
        const pending = pendingSigungu.current;
        if (pending) {
          const match = rows.find(
            (item) =>
              item.ldong_regn_cd.trim().slice(0, 2) === pending.regionCode &&
              item.ldong_signgu_cd.trim().slice(-3) === pending.sigunguCode
          );
          if (match) setSigungu(match);
          pendingSigungu.current = null;
        }
        urlStateHydrated.current = true;
      })
      .catch(() => {
        if (!abort.signal.aborted) urlStateHydrated.current = true;
      })
      .finally(() => { if (!abort.signal.aborted) setUrlReady(true); });
    return () => abort.abort();
  }, [regionCode]);

  useEffect(() => {
    restoreUrlState(new URLSearchParams(window.location.search));
    const handlePopState = () => restoreUrlState(new URLSearchParams(window.location.search));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [restoreUrlState]);

  useEffect(() => {
    if (!urlReady || !urlStateHydrated.current) return;
    const url = new URL(window.location.href);
    ["q", "regionCode", "sigunguCode", "petInfo", "physicalInfo", "visualInfo", "hearingInfo", "infantFamilyInfo", "date", "sort"].forEach((key) => url.searchParams.delete(key));
    if (appliedQuery) url.searchParams.set("q", appliedQuery);
    if (regionCode) url.searchParams.set("regionCode", regionCode);
    if (sigungu) url.searchParams.set("sigunguCode", sigungu.ldong_signgu_cd.trim().slice(-3));
    if (petInfo) url.searchParams.set("petInfo", "true");
    barrierFilters.forEach(([key]) => { if (barrier[key]) url.searchParams.set(key, "true"); });
    if (forecastDate) url.searchParams.set("date", forecastDate);
    if (sort !== "congestion") url.searchParams.set("sort", sort);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [appliedQuery, barrier, forecastDate, petInfo, regionCode, sigungu, sort, urlReady]);

  const buildParams = useCallback((page: number, q: string) => {
    const params = new URLSearchParams({ q, sort, page: String(page), limit: "20" });
    if (regionCode) params.set("regionCode", regionCode);
    if (sigungu) params.set("sigunguCode", sigungu.ldong_signgu_cd.trim().slice(-3));
    if (petInfo) params.set("petInfo", "true");
    barrierFilters.forEach(([key]) => {
      if (barrier[key]) params.set(key, "true");
    });
    if (forecastDate) params.set("date", forecastDate);
    return params;
  }, [barrier, forecastDate, petInfo, regionCode, sigungu, sort]);

  const fetchResults = useCallback(async (qOverride?: string) => {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setLoading(true);
    setError(false);
    setSearched(true);
    pageRef.current = 1;
    try {
      const response = await fetch(`/api/tour-attractions?${buildParams(1, qOverride ?? appliedQuery)}`, { signal: abort.signal });
      if (!response.ok) throw new Error("request failed");
      const data = (await response.json()) as ApiResponse<Attraction>;
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
  }, [appliedQuery, buildParams]);

  // Track the latest fetchResults in a ref so the trigger effect below
  // doesn't re-fire every time the callback's closure changes.
  const fetchResultsRef = useRef(fetchResults);
  fetchResultsRef.current = fetchResults;
  const filterKey = `${regionCode}|${sigungu?.ldong_signgu_cd.trim().slice(-3) || ""}|${forecastDate}|${sort}|${petInfo}|${barrierFilters.map(([key]) => barrier[key]).join(",")}`;
  const lastFilterKey = useRef<string | null>(null);
  const lastSearchTick = useRef(searchTick);

  const applySearch = () => {
    setAppliedQuery(query.trim());
    setSearchTick((value) => value + 1);
  };

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    try {
      const response = await fetch(`/api/tour-attractions?${buildParams(nextPage, appliedQuery)}`, { signal: abort.signal });
      if (!response.ok) throw new Error("request failed");
      const data = (await response.json()) as ApiResponse<Attraction>;
      if (!abort.signal.aborted) {
        setRows((current) => [...current, ...(Array.isArray(data.rows) ? data.rows : [])]);
        pageRef.current = nextPage;
      }
    } catch {
      // keep current rows; the observer will retry if the sentinel is still visible
    } finally {
      setLoadingMore(false);
    }
  }, [appliedQuery, buildParams]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && !loadingMore && count > 0 && rows.length < count) loadMore();
    }, { rootMargin: "200px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [count, loadMore, loading, loadingMore, rows.length]);

  useEffect(() => {
    if (!urlReady || !urlStateHydrated.current) return;
    const filterChanged = lastFilterKey.current !== filterKey;
    const searchRequested = lastSearchTick.current !== searchTick;
    const previousRequestAborted = controller.current?.signal.aborted ?? false;
    if (!filterChanged && !searchRequested && !previousRequestAborted) return;
    lastFilterKey.current = filterKey;
    lastSearchTick.current = searchTick;
    fetchResultsRef.current();
    return () => controller.current?.abort();
  }, [filterKey, searchTick, urlReady]);

  const reset = () => {
    setQuery(""); setAppliedQuery(""); setRegionCode(""); setSigungu(null);
    setPetInfo(accessibilityDefaults.petFriendly);
    setBarrier({ physicalInfo: accessibilityDefaults.wheelchair, visualInfo: false, hearingInfo: false, infantFamilyInfo: accessibilityDefaults.stroller });
    setSort("congestion");
  };

  const chips = useMemo(() => {
    const values: Array<{ key: string; label: string; remove: () => void }> = [];
    if (regionCode && !sigungu) values.push({ key: "regionCode", label: regionRows.find((item) => item.ldong_regn_cd.trim() === regionCode)?.regn_name || regionCode, remove: () => setRegionCode("") });
    if (sigungu) values.push({ key: "sigungu", label: sigungu.signgu_name, remove: () => setSigungu(null) });
    if (petInfo) values.push({ key: "petInfo", label: "반려동물 안내 있음", remove: () => setPetInfo(false) });
    barrierFilters.forEach(([key, label]) => { if (barrier[key]) values.push({ key, label, remove: () => setBarrier((current) => ({ ...current, [key]: false })) }); });
    return values;
  }, [barrier, petInfo, regionCode, regionRows, sigungu]);

  const toggle = (key: string) => setBarrier((current) => ({ ...current, [key]: !current[key] }));

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      <header>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-bento-green">온길 탐색</p>
        <h2 className="font-display text-3xl font-black tracking-tight text-bento-dark">어디로 걸어볼까요?</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-bento-dark/55">등록된 여행 정보만 바탕으로, 지금 찾고 싶은 목적지를 가볍게 좁혀보세요.</p>
      </header>

      <section className="relative z-20 rounded-2xl border border-border-default bg-white p-4 shadow-md sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <label className="mb-1.5 block pl-1 text-[11px] font-bold text-bento-dark/50">검색어</label>
            <Search className="absolute left-4 top-[39px] text-bento-dark/30" size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") applySearch(); }} placeholder="관광지명 또는 주소를 검색하세요" className="w-full rounded-xl border border-border-default bg-bento-bg/40 py-3.5 pl-11 pr-4 text-sm text-bento-dark outline-none transition focus:border-bento-green focus:bg-white" />
          </div>
          <button onClick={applySearch} className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-bento-green px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-bento-green/90 active:scale-[.98]"><Search size={16} />검색</button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="시도 선택 (선택)" value={regionCode} onChange={(value) => { setRegionCode(value); setSigungu(null); }} options={[["", "시도 전체"] as const, ...regionRows.map((region) => [region.ldong_regn_cd.trim(), region.regn_name] as const)]} />
          <Select label={<>지역 선택 <span className="font-normal">(선택)</span></>} value={sigungu ? `${sigungu.ldong_regn_cd.trim()}-${sigungu.ldong_signgu_cd.trim().slice(-3)}` : ""} onChange={(value) => { const selected = sigunguRows.find((item) => `${item.ldong_regn_cd.trim()}-${item.ldong_signgu_cd.trim().slice(-3)}` === value); setSigungu(selected ?? null); if (selected) setRegionCode(selected.ldong_regn_cd.trim()); }} options={[ ["", "시군구 전체"] as const, ...sigunguRows.map((item) => [`${item.ldong_regn_cd.trim()}-${item.ldong_signgu_cd.trim().slice(-3)}`, item.signgu_name] as const) ]} />
          <label className="relative block"><span className="mb-1.5 block pl-1 text-[11px] font-bold text-bento-dark/50">여행 일자</span><input type="date" value={forecastDate} onChange={(event) => onForecastDateChange(event.target.value)} className="w-full rounded-xl border border-border-default bg-bento-bg/40 px-3.5 py-3 text-xs font-semibold text-bento-dark outline-none focus:border-bento-green" /></label>
          <Select label="정렬" value={sort} onChange={(value) => setSort(value as Sort)} options={[["congestion", "혼잡도 낮은 순"], ["name", "이름순"]]} />
        </div>

        <div className="mt-4 border-t border-border-subtle pt-4"><p className="mb-2 text-[11px] font-bold text-bento-dark/50">정보 등록 조건 <span className="font-normal">· 이용 가능 여부를 보장하지 않아요</span></p><div className="flex flex-wrap gap-2">{infoFilterButtons.map(([key, label, Icon]) => <button key={key} aria-pressed={key === "petInfo" ? petInfo : barrier[key]} onClick={() => key === "petInfo" ? setPetInfo((value) => !value) : toggle(key)} className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${((key === "petInfo" ? petInfo : barrier[key])) ? "border-bento-green bg-bento-green/10 text-bento-green" : "border-border-default bg-white text-bento-dark/60 hover:border-bento-green/40"}`}><Icon size={13} />{label}</button>)}</div></div>
      </section>

      {chips.length > 0 && <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-bento-dark/50">적용 중</span>{chips.map((chip) => <button key={chip.key} onClick={chip.remove} className="flex items-center gap-1.5 rounded-full bg-bento-green/10 px-3 py-1.5 text-xs font-semibold text-bento-green">{chip.label}<X size={12} /></button>)}<button onClick={reset} className="ml-auto text-xs font-bold text-bento-dark/45 underline underline-offset-4 hover:text-bento-dark">전체 초기화</button></div>}

      <section aria-live="polite" className="space-y-4">
        <div><p className="text-xs font-bold text-bento-green">{loading ? "검색 중…" : `${count.toLocaleString()}곳`}</p><h3 className="mt-1 font-display text-xl font-black text-bento-dark">관광지</h3></div>
        {loading ? <Skeletons /> : error ? <State title="목록을 불러오지 못했어요" text="잠시 후 다시 시도해 주세요." action="다시 시도" onClick={() => fetchResults()} /> : rows.length === 0 ? <State title="조건에 맞는 결과가 없어요" text="필터를 조금 줄여 다시 찾아보세요." action="필터 모두 지우기" onClick={reset} /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rows.map((row) => <AttractionCard key={String(row.content_id)} row={row} liked={likedDestinations.includes(String(row.content_id))} onLike={onToggleLike} onSelect={onSelectDestination} imageError={imageErrors.has(String(row.content_id))} onImageError={() => setImageErrors((current) => new Set(current).add(String(row.content_id)))} />)}</div>}
        <div ref={sentinelRef} className="py-3 text-center text-xs font-semibold text-bento-dark/45">{loadingMore ? "불러오는 중…" : rows.length >= count && count > 0 ? "모두 불러왔어요" : ""}</div>
      </section>
      {!searched && <p className="text-center text-xs text-bento-dark/40">검색어 없이도 지역과 조건으로 둘러볼 수 있어요.</p>}
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: React.ReactNode; value: string; onChange: (value: string) => void; options: ReadonlyArray<readonly [string, string]> }) {
  return <label className="relative block"><span className="mb-1.5 block pl-1 text-[11px] font-bold text-bento-dark/50">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full appearance-none rounded-xl border border-border-default bg-bento-bg/40 px-3.5 py-3 text-xs font-semibold text-bento-dark outline-none focus:border-bento-green">{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select><ChevronDown size={13} className="pointer-events-none absolute bottom-3.5 right-3 text-bento-dark/40" /></label>;
}

function Skeletons() { return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl border border-border-default bg-white"><div className="h-40 rounded-t-2xl bg-bento-bg" /><div className="space-y-3 p-4"><div className="h-3 w-2/3 rounded bg-bento-bg" /><div className="h-3 w-full rounded bg-bento-bg" /><div className="h-6 w-1/3 rounded-full bg-bento-bg" /></div></div>)}</div>; }

function State({ title, text, action, onClick }: { title: string; text: string; action: string; onClick: () => void }) { return <div className="rounded-2xl border border-border-default bg-white px-6 py-14 text-center shadow-sm"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bento-bg text-bento-green"><RefreshCw size={20} /></div><h4 className="font-display text-base font-black text-bento-dark">{title}</h4><p className="mt-2 text-xs text-bento-dark/50">{text}</p><button onClick={onClick} className="mt-5 rounded-lg bg-bento-green px-4 py-2.5 text-xs font-bold text-white">{action}</button></div>; }

function congestionStyle(rate: number) {
  if (rate <= 25) return "bg-emerald-500/90";
  if (rate <= 50) return "bg-yellow-500/90";
  if (rate <= 75) return "bg-orange-500/90";
  return "bg-red-500/90";
}

function AttractionCard({ row, liked, onLike, onSelect, imageError, onImageError }: { row: Attraction; liked: boolean; onLike: (id: string) => void; onSelect: (id: string) => void; imageError: boolean; onImageError: () => void }) {
  const id = String(row.content_id); const image = row.firstimage || row.firstimage2;
  const badges = [row.hasPetInfo && "반려동물 안내 있음", row.hasPhysicalInfo && "이동 편의 정보", row.hasVisualInfo && "시각 안내 정보", row.hasHearingInfo && "청각 안내 정보", row.hasInfantFamilyInfo && "영유아·가족 편의 정보"].filter(Boolean) as string[];
  return <motion.article whileHover={{ y: -4 }} onClick={() => onSelect(id)} className="overflow-hidden rounded-2xl border border-border-default bg-white shadow-sm transition-shadow hover:shadow-lg cursor-pointer"><div className="relative h-44 bg-bento-bg">{image && !imageError ? <img src={image} alt={row.title} onError={onImageError} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-bento-dark/35">이미지 없음</div>}{row.cnctrRate != null && <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm ${congestionStyle(row.cnctrRate)}`}>혼잡 예측 {Math.round(row.cnctrRate)}%</span>}<button aria-label={`${row.title} 좋아요`} onClick={(event) => { event.stopPropagation(); onLike(id); }} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-bento-dark/50 shadow-sm"><Heart size={16} className={liked ? "fill-red-500 text-red-500" : ""} /></button></div><div className="space-y-3 p-4"><div><h4 className="line-clamp-1 font-display text-base font-black text-bento-dark">{row.title}</h4></div><p className="line-clamp-2 text-xs leading-relaxed text-bento-dark/55">{[row.addr1, row.addr2].filter(Boolean).join(" ") || "주소 정보 없음"}</p>{(row.usetime || row.parking) && <div className="space-y-2 rounded-xl bg-bento-bg/60 p-2.5">{row.usetime && <div className="flex items-start gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white shadow-sm"><Clock size={11} className="text-bento-green" aria-hidden="true" /></span><div className="min-w-0"><span className="text-[10px] font-bold text-bento-dark/40">운영시간</span><p className="line-clamp-2 whitespace-pre-line text-xs leading-relaxed text-bento-dark/70">{row.usetime}</p></div></div>}{row.parking && <div className="flex items-start gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white shadow-sm"><Car size={11} className="text-bento-green" aria-hidden="true" /></span><div className="min-w-0"><span className="text-[10px] font-bold text-bento-dark/40">주차</span><p className="line-clamp-1 text-xs leading-relaxed text-bento-dark/70">{row.parking}</p></div></div>}</div>}{badges.length > 0 && <div className="flex flex-wrap gap-1.5">{badges.map((badge) => <span key={badge} className="rounded-full bg-bento-bg px-2 py-1 text-[10px] font-semibold text-bento-dark/65">{badge}</span>)}</div>}</div></motion.article>;
}
