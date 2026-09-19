'use client';

import { useEffect, useRef, useState } from "react";
import { Loader2, TriangleAlert, ExternalLink } from "lucide-react";
// NOTE: togeojson은 DOMParser가 필요하므로 이 클라이언트 컴포넌트에서만 실행됨
import { gpx as gpxToGeoJSON } from "@tmcw/togeojson";
import { themeAccent } from "@/src/lib/theme";
import { loadKakaoMaps } from "@/src/lib/kakao-maps";

interface CourseMapProps {
  crsIdx: string;
  gpxPath: string | null;
  name: string;
  themeNm?: string | null;
  ready?: boolean;
}

type Position = [number, number]; // [lat, lng]

function extractPositions(geojson: unknown): Position[] {
  const positions: Position[] = [];
  const features =
    typeof geojson === "object" && geojson !== null && "features" in geojson && Array.isArray((geojson as { features: unknown[] }).features)
      ? (geojson as { features: Array<{ geometry?: { type?: string; coordinates?: unknown } }> }).features
      : [];
  const pushCoord = (coord: unknown) => {
    if (Array.isArray(coord) && typeof coord[0] === "number" && typeof coord[1] === "number") {
      positions.push([coord[1], coord[0]]); // GeoJSON [lng, lat] → [lat, lng]
    }
  };
  for (const feature of features) {
    const geometry = feature.geometry;
    if (!geometry) continue;
    if (geometry.type === "LineString" && Array.isArray(geometry.coordinates)) {
      geometry.coordinates.forEach(pushCoord);
    } else if (geometry.type === "MultiLineString" && Array.isArray(geometry.coordinates)) {
      for (const line of geometry.coordinates) {
        if (Array.isArray(line)) line.forEach(pushCoord);
      }
    }
  }
  return positions;
}

// 기존 Leaflet CircleMarker의 radius는 픽셀 단위(화면 고정 크기)였지만,
// kakao.maps.Circle의 radius는 미터 단위이므로 setBounds 이후 화면 크기가
// 비슷해지도록 트랙 범위에 비례해 환산한다.
function markerRadius(positions: Position[]): number {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const [lat, lng] of positions) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  const spanMeters = Math.max(maxLat - minLat, maxLng - minLng) * 111000;
  return Math.min(500, Math.max(30, spanMeters * 0.012));
}

function KakaoSearchLink({ name }: { name: string }) {
  return (
    <a
      href={`https://map.kakao.com/link/search/${encodeURIComponent(name)}`}
      target="_blank"
      rel="noreferrer"
      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-bento-green px-4 py-2.5 text-xs font-bold text-white"
    >
      카카오맵에서 &lsquo;{name.length > 18 ? `${name.slice(0, 18)}…` : name}&rsquo; 검색
      <ExternalLink size={12} />
    </a>
  );
}

export default function CourseMap({ crsIdx, gpxPath, name, themeNm, ready = true }: CourseMapProps) {
  const accent = themeAccent(themeNm);
  const [positions, setPositions] = useState<Position[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [sdkFailed, setSdkFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasJsKey = Boolean(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);

  // Rules of Hooks: 모든 훅은 조기 return보다 위에서 호출되어야 함.
  // ready=false(시트 열림 애니메이션 중)에는 fetch를 시작하지 않고, true가 되면 조회.
  useEffect(() => {
    if (!ready) return;
    if (!gpxPath) {
      setFailed(true);
      return;
    }
    const abort = new AbortController();
    setPositions(null);
    setFailed(false);
    fetch(`/api/dulle-courses/${encodeURIComponent(crsIdx)}/gpx`, { signal: abort.signal })
      .then((response) => {
        if (!response.ok) throw new Error("gpx fetch failed");
        return response.text();
      })
      .then((xmlText) => {
        if (abort.signal.aborted) return;
        const doc = new DOMParser().parseFromString(xmlText, "application/xml");
        if (doc.querySelector("parsererror")) throw new Error("gpx parse failed");
        const geojson = gpxToGeoJSON(doc);
        const coords = extractPositions(geojson);
        if (coords.length === 0) throw new Error("empty track");
        setPositions(coords);
      })
      .catch(() => {
        if (!abort.signal.aborted) setFailed(true);
      });
    return () => abort.abort();
  }, [ready, crsIdx, gpxPath]);

  // GPX 트랙이 준비되면 Kakao 지도에 폴리라인 + 시점/종점 원을 그린다.
  useEffect(() => {
    if (!ready || !hasJsKey || !positions) return;
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    loadKakaoMaps()
      .then((maps) => {
        if (cancelled) return;
        const path = positions.map(([lat, lng]) => new maps.LatLng(lat, lng));
        const map = new maps.Map(container, { center: path[0], level: 8 });
        const track = new maps.Polyline({
          path,
          strokeWeight: 4,
          strokeColor: accent.primary,
          strokeOpacity: 0.9,
          strokeStyle: "solid",
        });
        track.setMap(map);
        const bounds = new maps.LatLngBounds();
        for (const point of path) bounds.extend(point);
        const radius = markerRadius(positions);
        const start = new maps.Circle({
          center: path[0],
          radius,
          strokeWeight: 2,
          strokeColor: accent.primary,
          strokeOpacity: 1,
          fillColor: accent.primary,
          fillOpacity: 1,
        });
        start.setMap(map);
        const end = new maps.Circle({
          center: path[path.length - 1],
          radius,
          strokeWeight: 2,
          strokeColor: accent.deep,
          strokeOpacity: 1,
          fillColor: accent.deep,
          fillOpacity: 1,
        });
        end.setMap(map);
        map.setBounds(bounds);
      })
      .catch(() => {
        if (!cancelled) setSdkFailed(true);
      });
    return () => {
      cancelled = true;
      container.innerHTML = "";
    };
  }, [ready, hasJsKey, positions, accent.primary, accent.deep]);

  if (!ready) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-xl border border-border-default bg-bento-bg/50">
        <div className="flex items-center gap-2 text-xs font-semibold text-bento-dark/50">
          <Loader2 size={16} className="animate-spin" />
          지도 경로를 준비하는 중…
        </div>
      </div>
    );
  }

  if (!hasJsKey) {
    return (
      <div className="rounded-xl border border-border-default bg-white p-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <TriangleAlert size={18} />
        </div>
        <p className="text-xs font-bold text-bento-dark">지도 키가 설정되지 않았습니다</p>
        <p className="mt-1 text-[11px] text-bento-dark/50">외부 지도에서 코스명을 검색해 확인해 보세요.</p>
        <KakaoSearchLink name={name} />
      </div>
    );
  }

  if (failed || sdkFailed) {
    return (
      <div className="rounded-xl border border-border-default bg-white p-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <TriangleAlert size={18} />
        </div>
        <p className="text-xs font-bold text-bento-dark">GPX 경로를 불러오지 못했어요</p>
        <p className="mt-1 text-[11px] text-bento-dark/50">외부 지도에서 코스명을 검색해 확인해 보세요.</p>
        <KakaoSearchLink name={name} />
      </div>
    );
  }

  if (!positions) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-xl border border-border-default bg-bento-bg/50">
        <div className="flex items-center gap-2 text-xs font-semibold text-bento-dark/50">
          <Loader2 size={16} className="animate-spin" />
          지도 경로를 불러오는 중…
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-default shadow-sm">
      <div ref={containerRef} className="h-[400px] w-full bg-bento-bg/50" />
    </div>
  );
}
