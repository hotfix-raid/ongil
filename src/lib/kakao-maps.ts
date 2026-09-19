// Kakao Maps JavaScript SDK loader (on-demand, client-side only).
//
// - https://apis.map.kakao.com/web/documentation/
// - Uses `autoload=false` + `kakao.maps.load()` so the map initializes
//   exactly when CourseMap mounts (no global <Script> cost on all routes).
// - Idempotent: concurrent callers share one cached promise; the <script>
//   tag is injected at most once. A rejected load clears the cache so a
//   later retry can attempt again.
//
// Env is read via process.env directly (no src/env abstraction in this repo).
// NEXT_PUBLIC_KAKAO_JS_KEY is the JavaScript 키, NOT the REST API 키.

// Minimal declarations for the SDK surface this repo uses.
declare global {
  namespace kakao {
    namespace maps {
      class LatLng {
        constructor(lat: number, lng: number);
        getLat(): number;
        getLng(): number;
      }
      class LatLngBounds {
        constructor();
        extend(latlng: LatLng): void;
      }
      interface MapOptions {
        center: LatLng;
        level?: number;
      }
      class Map {
        constructor(container: HTMLElement, options: MapOptions);
        setBounds(bounds: LatLngBounds): void;
        relayout(): void;
      }
      interface PolylineOptions {
        path: LatLng[];
        strokeWeight?: number;
        strokeColor?: string;
        strokeOpacity?: number;
        strokeStyle?: string;
      }
      class Polyline {
        constructor(options: PolylineOptions);
        setMap(map: Map | null): void;
      }
      interface CircleOptions {
        center: LatLng;
        radius?: number;
        strokeWeight?: number;
        strokeColor?: string;
        strokeOpacity?: number;
        fillColor?: string;
        fillOpacity?: number;
      }
      class Circle {
        constructor(options: CircleOptions);
        setMap(map: Map | null): void;
      }
      function load(callback: () => void): void;
    }
  }
  interface Window {
    kakao?: typeof kakao;
  }
}

const SCRIPT_ID = "kakao-maps-sdk";

let cached: Promise<typeof kakao.maps> | null = null;

export function loadKakaoMaps(): Promise<typeof kakao.maps> {
  if (cached) return cached;
  cached = new Promise((resolve, reject) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      reject(new Error("kakao maps requires a browser environment"));
      return;
    }
    const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    if (!key) {
      reject(new Error("NEXT_PUBLIC_KAKAO_JS_KEY is not configured"));
      return;
    }
    // SDK already present (e.g. HMR remount): just wait for load().
    if (window.kakao?.maps) {
      window.kakao.maps.load(() => resolve(window.kakao!.maps!));
      return;
    }
    // A previous mount started injecting but hasn't finished yet.
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => {
        try {
          if (!window.kakao?.maps) throw new Error("kakao.maps unavailable after load");
          window.kakao.maps.load(() => resolve(window.kakao!.maps!));
        } catch (error) {
          reject(error);
        }
      });
      existing.addEventListener("error", () =>
        reject(new Error("failed to load kakao maps sdk")),
      );
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`;
    script.onload = () => {
      try {
        if (!window.kakao?.maps) throw new Error("kakao.maps unavailable after load");
        window.kakao.maps.load(() => resolve(window.kakao!.maps!));
      } catch (error) {
        reject(error);
      }
    };
    script.onerror = () => reject(new Error("failed to load kakao maps sdk"));
    document.head.appendChild(script);
  });
  // Allow a later retry after failure instead of caching rejection forever.
  cached.then(
    () => {},
    () => {
      cached = null;
    },
  );
  return cached;
}
