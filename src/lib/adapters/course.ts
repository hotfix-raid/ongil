import type {
  DBCourse,
  DifficultyLabel,
  UICourse,
  UICourseSegment,
} from "../../types/database";

const SEGMENT_MAX_LEN = 500;
const DETAILS_MAX_LEN = 200;

/** Fixed fallback image per trail theme (no per-course image column in DB). */
const THEME_IMAGES: Record<string, string> = {
  // 남파랑길 — southern sea
  남파랑길:
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=60",
  // 서해랑길 — tidal-flat sunset
  서해랑길:
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=60",
  // DMZ 평화의 길 — forest / peace
  DMZ: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=60",
  // 해파랑길 — east-sea sunrise
  해파랑길:
    "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1200&q=60",
};

const DEFAULT_IMAGE = THEME_IMAGES["남파랑길"];

export function difficultyLabel(level: string | null | undefined): DifficultyLabel {
  if (level === "1") return "쉬움";
  if (level === "3") return "어려움";
  return "보통";
}

/**
 * "강원 고성군" -> "고성". Takes the last whitespace-separated token and
 * strips a trailing 시/군/구 only for short names (<=4 chars) so longer
 * names like "서울특별시" or "마산합포구" stay intact.
 */
export function parseSigun(sigun: string | null | undefined): string | null {
  if (sigun == null) return null;
  const trimmed = sigun.trim();
  if (!trimmed) return null;
  const token = trimmed.split(/\s+/).pop() as string;
  if (token.length <= 4 && /[시군구]$/.test(token)) {
    return token.slice(0, -1);
  }
  return token;
}

export function themeImage(themeNm: string | null | undefined): string {
  if (themeNm) {
    for (const key of Object.keys(THEME_IMAGES)) {
      if (themeNm.includes(key)) return THEME_IMAGES[key];
    }
  }
  return DEFAULT_IMAGE;
}

/** Excerpt the sentence right before "- 시점" in traveler_info. */
function accessibilityDetails(travelerInfo: string | null | undefined): string {
  if (!travelerInfo) return "";
  const marker = "- 시점";
  const idx = travelerInfo.indexOf(marker);
  const head = (idx >= 0 ? travelerInfo.slice(0, idx) : travelerInfo).trim();
  if (!head) return "";
  const lines = head
    .split(/[\n]+/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return "";
  const picked = idx >= 0 ? lines[lines.length - 1] : lines[0];
  return picked.slice(0, DETAILS_MAX_LEN);
}

function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

/**
 * Split traveler_info at "시점"/"종점" into at most 2 segments.
 * Falls back to the first line of crs_summary when no markers are found.
 */
export function parseSegments(db: DBCourse): UICourseSegment[] {
  const info = db.traveler_info?.trim();
  if (info) {
    const startMatch = /시\s*점/.exec(info);
    const endMatch = /종\s*점/.exec(info);
    if (startMatch && endMatch && startMatch.index < endMatch.index) {
      return [
        { title: "시점", description: truncate(info.slice(startMatch.index, endMatch.index).trim(), SEGMENT_MAX_LEN) },
        { title: "종점", description: truncate(info.slice(endMatch.index).trim(), SEGMENT_MAX_LEN) },
      ].filter((segment) => segment.description);
    }
    const single = startMatch ?? endMatch;
    if (single) {
      const description = truncate(info.slice(single.index).trim(), SEGMENT_MAX_LEN);
      if (description) {
        return [{ title: startMatch ? "시점" : "종점", description }];
      }
    }
  }
  const firstLine = db.crs_summary
    ?.split("\n")
    .map((line) => line.trim())
    .find(Boolean);
  if (firstLine) {
    return [{ title: "코스 안내", description: truncate(firstLine, SEGMENT_MAX_LEN) }];
  }
  return [];
}

export function adaptCourse(db: DBCourse): UICourse {
  return {
    id: db.crs_idx,
    name: db.crs_kor_nm,
    distanceKm: db.crs_dstnc,
    timeMins: db.crs_totl_rqrm_hour,
    difficulty: db.crs_level == null ? null : difficultyLabel(db.crs_level),
    difficultyLevel: db.crs_level,
    region: parseSigun(db.sigun),
    sigun: db.sigun,
    routeIdx: db.route_idx,
    themeNm: db.theme_nm ?? null,
    lineMsg: db.line_msg ?? null,
    isDepopulationArea: false,
    accessibility: {
      wheelchair: false,
      stroller: false,
      petFriendly: false,
      details: accessibilityDetails(db.traveler_info),
    },
    summary: db.crs_summary,
    image: themeImage(db.theme_nm),
    segments: parseSegments(db),
    gpxpath: db.gpxpath,
    cycle: db.crs_cycle,
    boardDivision: db.brd_div,
  };
}
