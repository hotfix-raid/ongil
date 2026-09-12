// DB row types + API response contracts for the walking-course domain.
// Single source for Lane A (API) and Lane B (front). Column semantics follow
// docs/database-schema.md; mapping semantics follow docs/walking-course-plan.md.

// ---------------------------------------------------------------------------
// DB rows
// ---------------------------------------------------------------------------

export interface DBCourse {
  crs_idx: string;
  route_idx: string;
  crs_kor_nm: string;
  crs_dstnc: number | null;
  /** Column name says "hour" but measured values are minutes (150~540). */
  crs_totl_rqrm_hour: number | null;
  crs_level: "1" | "2" | "3" | null;
  crs_cycle: string | null;
  crs_contents: string | null;
  crs_summary: string | null;
  crs_tour_info: string | null;
  traveler_info: string | null;
  /** Administrative name string, e.g. "강원 고성군" (not a code). */
  sigun: string | null;
  brd_div: string | null;
  gpxpath: string | null;
  /** YYYYMMDDHHMMSS strings, not timestamps. */
  createdtime: string | null;
  modifiedtime: string | null;
  /** Present when joined with walking_trail_theme. */
  theme_nm?: string | null;
  line_msg?: string | null;
}

export interface DBTheme {
  route_idx: string;
  theme_nm: string;
  line_msg: string | null;
  /** May contain HTML. */
  theme_descs: string | null;
  brd_div: string;
  created_time: string;
  modified_time: string;
}

// ---------------------------------------------------------------------------
// UI (CourseTab) model produced by src/lib/adapters/course.ts
// ---------------------------------------------------------------------------

export type DifficultyLabel = "쉬움" | "보통" | "어려움";

export interface UICourseSegment {
  title: string;
  description: string;
}

export interface UICourseAccessibility {
  wheelchair: boolean;
  stroller: boolean;
  petFriendly: boolean;
  details: string;
}

export interface UICourse {
  id: string;
  name: string;
  distanceKm: number | null;
  /** Minutes, taken as-is from crs_totl_rqrm_hour. */
  timeMins: number | null;
  difficulty: DifficultyLabel | null;
  difficultyLevel: "1" | "2" | "3" | null;
  /** Parsed short region, e.g. "고성" (see parseSigun). */
  region: string | null;
  sigun: string | null;
  routeIdx: string;
  themeNm: string | null;
  lineMsg: string | null;
  /** v1: always false (no depopulation mapping table yet). */
  isDepopulationArea: boolean;
  /** v1: booleans always false, details excerpted from traveler_info. */
  accessibility: UICourseAccessibility;
  /** Raw HTML possible — Lane B sanitizes before render. */
  summary: string | null;
  /** Theme-level fallback image (no per-course image column). */
  image: string;
  segments: UICourseSegment[];
  gpxpath: string | null;
  cycle: string | null;
  boardDivision: string | null;
}

// ---------------------------------------------------------------------------
// API responses
// ---------------------------------------------------------------------------

export interface DulleCourseFilters {
  themes: Array<{ route_idx: string; theme_nm: string | null }>;
  regions: string[];
  levels: string[];
  /** Unit contracts: distances in km, durations in minutes. */
  distanceDefinitions: { short: string; medium: string; long: string };
  durationDefinitions: { short: string; medium: string; long: string };
}

export interface DulleCoursesResponse {
  count: number;
  page: number;
  limit: number;
  rows: DBCourse[];
  /** DISTINCT over the full dataset, independent of LIMIT/OFFSET. */
  filters: DulleCourseFilters;
}

export interface WalkingThemeRow {
  route_idx: string;
  theme_nm: string;
  line_msg: string | null;
  /** Raw HTML. */
  theme_descs: string | null;
  courseCount: number;
  totalDistanceKm: number;
}

export type WalkingThemesResponse = WalkingThemeRow[];

export interface RelatedAttraction {
  content_id: string;
  title: string;
  addr1: string | null;
  addr2: string | null;
  firstimage: string | null;
  firstimage2: string | null;
  mapx: number | null;
  mapy: number | null;
}

export interface CourseDetailResponse {
  course: DBCourse;
  theme: {
    route_idx: string;
    theme_nm: string;
    line_msg: string | null;
    theme_descs: string | null;
  } | null;
  relatedAttractions: RelatedAttraction[];
}
