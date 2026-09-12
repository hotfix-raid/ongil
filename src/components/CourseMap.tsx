'use client';

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, TriangleAlert, ExternalLink } from "lucide-react";
// NOTE: togeojson은 DOMParser가 필요하므로 이 클라이언트 컴포넌트에서만 실행됨
import { gpx as gpxToGeoJSON } from "@tmcw/togeojson";
import { themeAccent } from "@/src/lib/theme";

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
      positions.push([coord[1], coord[0]]); // GeoJSON [lng, lat] → Leaflet [lat, lng]
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

function FitBounds({ positions }: { positions: Position[] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    map.fitBounds(positions as LatLngBoundsExpression, { padding: [24, 24] });
  }, [map, positions]);
  return null;
}

export default function CourseMap({ crsIdx, gpxPath, name, themeNm, ready = true }: CourseMapProps) {
  const accent = themeAccent(themeNm);
  const [positions, setPositions] = useState<Position[] | null>(null);
  const [failed, setFailed] = useState(false);

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

  if (failed) {
    return (
      <div className="rounded-xl border border-border-default bg-white p-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <TriangleAlert size={18} />
        </div>
        <p className="text-xs font-bold text-bento-dark">GPX 경로를 불러오지 못했어요</p>
        <p className="mt-1 text-[11px] text-bento-dark/50">외부 지도에서 코스명을 검색해 확인해 보세요.</p>
        <a
          href={`https://map.kakao.com/link/search/${encodeURIComponent(name)}`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-bento-green px-4 py-2.5 text-xs font-bold text-white"
        >
          카카오맵에서 &lsquo;{name.length > 18 ? `${name.slice(0, 18)}…` : name}&rsquo; 검색
          <ExternalLink size={12} />
        </a>
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

  const start = positions[0];
  const end = positions[positions.length - 1];
  const center = start as LatLngExpression;

  return (
    <div className="overflow-hidden rounded-xl border border-border-default shadow-sm">
      <MapContainer center={center} zoom={13} scrollWheelZoom={false} style={{ height: 400, width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds positions={positions} />
        <Polyline positions={positions} pathOptions={{ color: accent.primary, weight: 4, opacity: 0.9 }} />
        <CircleMarker center={start} radius={8} pathOptions={{ color: accent.primary, fillColor: accent.primary, fillOpacity: 1 }}>
          <Popup>시점</Popup>
        </CircleMarker>
        <CircleMarker center={end} radius={8} pathOptions={{ color: accent.deep, fillColor: accent.deep, fillOpacity: 1 }}>
          <Popup>종점</Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}
