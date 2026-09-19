'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Accessibility, Baby, Clock, Footprints, Heart, MapPin, PawPrint, RefreshCw } from "lucide-react";
import { mockDestinations, type MockDestination } from "@/src/data/destinations";
import { adaptCourse } from "@/src/lib/adapters/course";
import { formatMinutes, htmlToLines } from "@/src/lib/format";
import { themeAccent } from "@/src/lib/theme";
import type { DBCourse, UICourse } from "@/src/types/database";

interface Attraction {
  content_id: string | number;
  title: string;
  addr1?: string | null;
  addr2?: string | null;
  firstimage?: string | null;
  firstimage2?: string | null;
  cnctrRate?: number | null;
}

interface FavoritesTabProps {
  likedPlaces: string[];
  onToggleLike: (id: string) => void;
  onSelectDestination: (destination: MockDestination) => void;
  onSelectSearchDestination: (id: string) => void;
  onSelectCourse: (id: string) => void;
  user: { name: string; avatarUrl: string } | null;
  likedCourses: string[];
  onToggleCourseLike: (crsIdx: string) => void;
}

export default function FavoritesTab({ likedPlaces, onToggleLike, onSelectDestination, onSelectSearchDestination, onSelectCourse, user, likedCourses, onToggleCourseLike }: FavoritesTabProps) {
  const mockIds = useMemo(() => new Set(mockDestinations.map((destination) => destination.id)), []);
  const mockLiked = useMemo(() => mockDestinations.filter((destination) => likedPlaces.includes(destination.id)), [likedPlaces]);
  const realIds = useMemo(() => likedPlaces.filter((id) => !mockIds.has(id)).slice(0, 100), [likedPlaces, mockIds]);
  const likedCoursesKey = likedCourses.slice(0, 100).join(",");
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [placeLoading, setPlaceLoading] = useState(true);
  const [placeError, setPlaceError] = useState(false);
  const [courses, setCourses] = useState<UICourse[]>([]);
  const [courseLoading, setCourseLoading] = useState(true);
  const [courseError, setCourseError] = useState(false);
  const placeController = useRef<AbortController | null>(null);
  const courseController = useRef<AbortController | null>(null);

  const fetchPlaces = useCallback(async () => {
    placeController.current?.abort();
    const abort = new AbortController();
    placeController.current = abort;
    setPlaceLoading(true);
    setPlaceError(false);
    if (realIds.length === 0) {
      setAttractions([]);
      setPlaceLoading(false);
      return;
    }
    try {
      const response = await fetch(`/api/tour-attractions?ids=${encodeURIComponent(realIds.join(","))}&limit=100`, { signal: abort.signal });
      if (!response.ok) throw new Error("request failed");
      const data = await response.json() as { rows?: Attraction[] };
      if (!abort.signal.aborted) setAttractions(Array.isArray(data.rows) ? data.rows : []);
    } catch {
      if (!abort.signal.aborted) { setAttractions([]); setPlaceError(true); }
    } finally {
      if (!abort.signal.aborted) setPlaceLoading(false);
    }
  }, [realIds]);

  const fetchCourses = useCallback(async () => {
    courseController.current?.abort();
    const abort = new AbortController();
    courseController.current = abort;
    setCourseLoading(true);
    setCourseError(false);
    try {
      if (!likedCoursesKey) { setCourses([]); return; }
      const response = await fetch(`/api/dulle-courses?ids=${encodeURIComponent(likedCoursesKey)}&limit=100`, { signal: abort.signal });
      if (!response.ok) throw new Error("request failed");
      const data = await response.json() as { rows?: DBCourse[] };
      if (!abort.signal.aborted) setCourses((Array.isArray(data.rows) ? data.rows : []).map(adaptCourse));
    } catch {
      if (!abort.signal.aborted) { setCourses([]); setCourseError(true); }
    } finally {
      if (!abort.signal.aborted) setCourseLoading(false);
    }
  }, [likedCoursesKey]);

  useEffect(() => { fetchPlaces(); return () => placeController.current?.abort(); }, [fetchPlaces]);
  useEffect(() => { fetchCourses(); return () => courseController.current?.abort(); }, [fetchCourses]);

  const total = mockLiked.length + attractions.length + likedCourses.length;
  const everythingEmpty = !placeLoading && !courseLoading && !placeError && !courseError && total === 0;
  return (
    <div className="space-y-7 pb-12 animate-fadeIn">
      <header>
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-bento-green">온길 보관함</span>
        <h2 className="flex items-center gap-2 font-display text-2xl font-black tracking-tight text-bento-dark md:text-3xl">즐겨찾기 <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50"><Heart size={17} className="fill-red-400 text-red-400" /></span></h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-bento-dark/55">다시 걷고 싶은 장소와 코스를 한곳에 모아두었어요.</p>
      </header>

      <section className="space-y-4">
        <SectionTitle title={`저장한 명소 (${mockLiked.length + attractions.length}개)`} />
        {placeLoading ? <PlaceSkeleton /> : placeError ? <ErrorCard title="명소 목록을 불러오지 못했어요" onRetry={fetchPlaces} /> : mockLiked.length + attractions.length === 0 ? (everythingEmpty ? null : <SmallEmpty text="추천 홈과 탐색에서 하트 버튼을 눌러 명소를 저장해 보세요." />) : <div className="grid gap-4 sm:grid-cols-2">{mockLiked.map((destination) => <MockCard key={destination.id} destination={destination} onSelect={onSelectDestination} onLike={onToggleLike} />)}{attractions.map((attraction) => <AttractionCard key={String(attraction.content_id)} attraction={attraction} onSelect={onSelectSearchDestination} onLike={onToggleLike} />)}</div>}
      </section>

      <section className="space-y-4">
        <SectionTitle title={`찜한 걷기 코스 (${likedCourses.length}개)`} />
        {courseLoading ? <CourseSkeleton /> : courseError ? <ErrorCard title="코스 목록을 불러오지 못했어요" onRetry={fetchCourses} /> : courses.length === 0 ? (everythingEmpty ? null : <SmallEmpty text="걷기 코스에서 하트 버튼을 눌러 나만의 길을 담아 보세요." />) : <div className="grid gap-5 md:grid-cols-2">{courses.map((course) => <CourseCard key={course.id} course={course} onSelect={onSelectCourse} onLike={onToggleCourseLike} />)}</div>}
      </section>

      {total === 0 && !placeLoading && !courseLoading && <div className="rounded-xl border border-border-default bg-white px-6 py-10 text-center shadow-sm"><Heart size={22} className="mx-auto mb-3 text-red-400" /><h3 className="font-display text-base font-black text-bento-dark">아직 담아둔 곳이 없어요</h3><p className="mt-2 text-xs leading-relaxed text-bento-dark/50">추천 홈·탐색·걷기 코스의 하트 버튼으로 다시 걷고 싶은 곳을 저장해 보세요.</p></div>}
      {!user && <p className="text-[10px] leading-relaxed text-bento-dark/45">로그인하면 찜한 명소와 코스가 다른 기기에서도 유지됩니다.</p>}
    </div>
  );
}

function SectionTitle({ title }: { title: string }) { return <h3 className="pl-1 text-xs font-semibold text-bento-dark/50">{title}</h3>; }
function SmallEmpty({ text }: { text: string }) { return <div className="rounded-xl border border-dashed border-border-default bg-white px-5 py-7 text-center text-[11px] text-bento-dark/45">{text}</div>; }
function ErrorCard({ title, onRetry }: { title: string; onRetry: () => void }) { return <div className="rounded-xl border border-border-default bg-white px-6 py-10 text-center shadow-sm"><RefreshCw size={20} className="mx-auto mb-3 text-bento-green" /><h4 className="font-display text-base font-black text-bento-dark">{title}</h4><p className="mt-2 text-xs text-bento-dark/50">잠시 후 다시 시도해 주세요.</p><button onClick={onRetry} className="mt-4 rounded-lg bg-bento-green px-4 py-2.5 text-xs font-bold text-white">다시 시도</button></div>; }
function PlaceSkeleton() { return <div className="grid gap-4 sm:grid-cols-2">{[1, 2].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl border border-border-default bg-white"><div className="h-24 rounded-t-2xl bg-bento-bg" /></div>)}</div>; }
function CourseSkeleton() { return <div className="grid gap-5 md:grid-cols-2">{[1, 2].map((item) => <div key={item} className="h-80 animate-pulse rounded-lg border border-border-default bg-white"><div className="h-44 bg-bento-bg" /></div>)}</div>; }

function MockCard({ destination, onSelect, onLike }: { destination: MockDestination; onSelect: (destination: MockDestination) => void; onLike: (id: string) => void }) {
  return <motion.article whileHover={{ y: -4 }} onClick={() => onSelect(destination)} className="group relative overflow-hidden rounded-2xl border border-border-default bg-white shadow-sm transition-shadow hover:shadow-lg"><div className="relative h-36 bg-bento-bg"><img src={destination.image} alt={destination.name} className="h-full w-full object-cover" /><button aria-label={`${destination.name} 좋아요 취소`} onClick={(event) => { event.stopPropagation(); onLike(destination.id); }} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-sm"><Heart size={16} className="fill-red-500" /></button></div><div className="space-y-2 p-4"><div className="flex items-center justify-between gap-2"><span className="text-[9px] font-semibold text-bento-green">{destination.region} · {destination.category}</span><span className="text-[9px] text-bento-dark/50">혼잡 {destination.congestionLevel}%</span></div><h4 className="font-display text-base font-black tracking-tight text-bento-dark">{destination.name}</h4><p className="line-clamp-1 text-[10px] text-bento-dark/45">{destination.accessibility.note}</p></div></motion.article>;
}

function AttractionCard({ attraction, onSelect, onLike }: { attraction: Attraction; onSelect: (id: string) => void; onLike: (id: string) => void }) {
  const id = String(attraction.content_id); const image = attraction.firstimage || attraction.firstimage2;
  return <motion.article whileHover={{ y: -4 }} onClick={() => onSelect(id)} className="overflow-hidden rounded-2xl border border-border-default bg-white shadow-sm transition-shadow hover:shadow-lg"><div className="relative h-36 bg-bento-bg">{image ? <img src={image} alt={attraction.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-bento-dark/35">이미지 없음</div>}<button aria-label={`${attraction.title} 좋아요 취소`} onClick={(event) => { event.stopPropagation(); onLike(id); }} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-sm"><Heart size={16} className="fill-red-500" /></button></div><div className="space-y-2 p-4"><h4 className="line-clamp-1 font-display text-base font-black text-bento-dark">{attraction.title}</h4><p className="line-clamp-2 text-xs leading-relaxed text-bento-dark/55">{[attraction.addr1, attraction.addr2].filter(Boolean).join(" ") || "주소 정보 없음"}</p></div></motion.article>;
}

function CourseCard({ course, onSelect, onLike }: { course: UICourse; onSelect: (id: string) => void; onLike: (id: string) => void }) {
  const accent = themeAccent(course.themeNm); const hasAccessibility = course.accessibility.wheelchair || course.accessibility.stroller || course.accessibility.petFriendly;
  return <motion.div whileHover={{ y: -3, boxShadow: "0 4px 6px -1px color-mix(in srgb, #1A2F23 6%, transparent)" }} className="relative overflow-hidden rounded-lg border border-border-default bg-white shadow-sm"><button type="button" aria-label={`${course.name} 좋아요 취소`} onClick={(event) => { event.stopPropagation(); onLike(course.id); }} className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-sm"><Heart size={16} className="fill-red-500 text-red-500" /></button><button type="button" onClick={() => onSelect(course.id)} className="flex w-full flex-col text-left"><div className={`relative h-44 ${accent.gradientClass}`}><div className="absolute inset-0 flex items-center justify-center"><Footprints size={44} className="text-white/30" /></div><div className="absolute inset-0 bg-gradient-to-t from-bento-dark/80 via-transparent to-transparent" /><div className="absolute left-3 top-3 flex flex-wrap gap-1.5"><span className={`rounded-sm px-2.5 py-0.5 text-[10px] font-semibold text-white ${accent.primaryBg}`}>{course.region ?? "지역 미상"}</span><span className="rounded-sm bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold text-bento-dark">{course.distanceKm != null ? `${course.distanceKm}km` : "거리 미상"} · {course.timeMins != null ? formatMinutes(course.timeMins) : "시간 미상"}</span></div><div className="absolute bottom-3.5 left-4 right-4 text-white"><span className="block text-[9px] font-semibold text-white/90">{course.themeNm ?? "두루누비 걷기노선"}</span><h4 className="mt-1 line-clamp-2 font-display text-base font-bold leading-snug">{course.name}</h4></div></div><div className="space-y-3 p-4"><p className="line-clamp-2 text-[11px] leading-relaxed text-bento-dark/60">{htmlToLines(course.summary) || "코스 소개가 준비 중입니다."}</p>{hasAccessibility && <div className="flex flex-wrap gap-1 border-t border-border-subtle pt-2">{course.accessibility.wheelchair && <Chip icon={<Accessibility size={10} />} text="휠체어 안심" />}{course.accessibility.stroller && <Chip icon={<Baby size={10} />} text="유모차 가능" />}{course.accessibility.petFriendly && <Chip icon={<PawPrint size={10} />} text="반려동물 환영" />}</div>}<div className="flex items-center gap-3 pt-1 text-[10px] text-bento-dark/40"><span className="flex items-center gap-1"><MapPin size={10} />{course.distanceKm ?? "-"}km</span><span className="flex items-center gap-1"><Clock size={10} />{course.timeMins != null ? formatMinutes(course.timeMins) : "시간 미상"}</span><span className={`ml-auto font-semibold ${accent.primaryText}`}>상세 보기 →</span></div></div></button></motion.div>;
}
function Chip({ icon, text }: { icon: React.ReactNode; text: string }) { return <span className="flex items-center gap-1 rounded-sm border border-border-subtle bg-bento-bg px-2.5 py-1 text-[9px] font-medium text-bento-dark">{icon}<span>{text}</span></span>; }
