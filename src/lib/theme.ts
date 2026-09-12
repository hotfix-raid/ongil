/**
 * Theme color tokens for the four national walking-trail themes.
 *
 * Colors are intentionally muted and nature-anchored so they stay in
 * harmony with the existing bento-green brand palette while making the
 * four themes instantly distinguishable.
 *
 * IMPORTANT: Tailwind classes are stored as complete literal strings so
 * the JIT compiler can discover arbitrary-value utilities. Do not build
 * Tailwind class names dynamically from these hex values.
 */

export interface ThemeAccent {
  id: "namhae" | "seohae" | "dmz" | "haean" | "default";
  label: string;
  /** Primary accent hex. Used for polylines, solid badges, and active states. */
  primary: string;
  /** Lighter companion tone for soft backgrounds / badges. */
  soft: string;
  /** Darker shade for gradients and end-marker accents. */
  deep: string;
  /** Mid tone for gradient via stops. */
  mid: string;
  /** Text color placed directly on top of `primary`. */
  textOnPrimary: string;
  /** Pre-computed Tailwind gradient class for course-card hero overlays. */
  gradientClass: string;
  /** Pre-computed Tailwind classes for solid primary backgrounds. */
  primaryBg: string;
  /** Pre-computed Tailwind classes for the theme-card active state. */
  activeBg: string;
  activeBorder: string;
  /** Pre-computed Tailwind classes for the theme-card inactive state. */
  inactiveIcon: string;
  inactiveHoverBorder: string;
  /** Primary text color for icons / labels. */
  primaryText: string;
  /** Soft background class for subtle badges. */
  softBg: string;
  /** Subtle border for white badges. */
  softBorder: string;
}

const BENTO_GREEN = "#2D5A27";
const BENTO_BG = "#F9F7F2";

const DEFAULT_ACCENT: ThemeAccent = {
  id: "default",
  label: "두루누비 걷기노선",
  primary: BENTO_GREEN,
  soft: BENTO_BG,
  deep: "#1A2F23",
  mid: "#4A7C42",
  textOnPrimary: "#FFFFFF",
  gradientClass: "bg-gradient-to-br from-[#2D5A27]/80 via-[#4A7C42]/60 to-[#1A2F23]/70",
  primaryBg: "bg-[#2D5A27]",
  activeBg: "bg-[#2D5A27]",
  activeBorder: "border-[#2D5A27]",
  inactiveIcon: "text-[#2D5A27]",
  inactiveHoverBorder: "hover:border-[#2D5A27]/40",
  primaryText: "text-[#2D5A27]",
  softBg: "bg-[#F9F7F2]",
  softBorder: "border-[#2D5A27]/12",
};

const THEME_ACCENTS: ThemeAccent[] = [
  {
    id: "namhae",
    label: "남파랑길",
    primary: "#126D7A",
    soft: "#E6F3F5",
    deep: "#0F5A64",
    mid: "#1A8A99",
    textOnPrimary: "#FFFFFF",
    gradientClass: "bg-gradient-to-br from-[#126D7A]/80 via-[#1A8A99]/60 to-[#0F5A64]/70",
    primaryBg: "bg-[#126D7A]",
    activeBg: "bg-[#126D7A]",
    activeBorder: "border-[#126D7A]",
    inactiveIcon: "text-[#126D7A]",
    inactiveHoverBorder: "hover:border-[#126D7A]/40",
    primaryText: "text-[#126D7A]",
    softBg: "bg-[#E6F3F5]",
    softBorder: "border-[#126D7A]/12",
  },
  {
    id: "seohae",
    label: "서해랑길",
    primary: "#9C5A1F",
    soft: "#FDF3E7",
    deep: "#7A4618",
    mid: "#D4822E",
    textOnPrimary: "#FFFFFF",
    gradientClass: "bg-gradient-to-br from-[#9C5A1F]/80 via-[#D4822E]/60 to-[#7A4618]/70",
    primaryBg: "bg-[#9C5A1F]",
    activeBg: "bg-[#9C5A1F]",
    activeBorder: "border-[#9C5A1F]",
    inactiveIcon: "text-[#9C5A1F]",
    inactiveHoverBorder: "hover:border-[#9C5A1F]/40",
    primaryText: "text-[#9C5A1F]",
    softBg: "bg-[#FDF3E7]",
    softBorder: "border-[#9C5A1F]/12",
  },
  {
    id: "dmz",
    label: "DMZ 평화의 길",
    primary: "#5F6B52",
    soft: "#F0F2EB",
    deep: "#4A5440",
    mid: "#8B9978",
    textOnPrimary: "#FFFFFF",
    gradientClass: "bg-gradient-to-br from-[#5F6B52]/80 via-[#8B9978]/60 to-[#4A5440]/70",
    primaryBg: "bg-[#5F6B52]",
    activeBg: "bg-[#5F6B52]",
    activeBorder: "border-[#5F6B52]",
    inactiveIcon: "text-[#5F6B52]",
    inactiveHoverBorder: "hover:border-[#5F6B52]/40",
    primaryText: "text-[#5F6B52]",
    softBg: "bg-[#F0F2EB]",
    softBorder: "border-[#5F6B52]/12",
  },
  {
    id: "haean",
    label: "해파랑길",
    primary: "#B05252",
    soft: "#FBEFEF",
    deep: "#8A4242",
    mid: "#D06E6E",
    textOnPrimary: "#FFFFFF",
    gradientClass: "bg-gradient-to-br from-[#B05252]/80 via-[#D06E6E]/60 to-[#8A4242]/70",
    primaryBg: "bg-[#B05252]",
    activeBg: "bg-[#B05252]",
    activeBorder: "border-[#B05252]",
    inactiveIcon: "text-[#B05252]",
    inactiveHoverBorder: "hover:border-[#B05252]/40",
    primaryText: "text-[#B05252]",
    softBg: "bg-[#FBEFEF]",
    softBorder: "border-[#B05252]/12",
  },
];

/**
 * Resolve a theme accent by Korean theme name.
 *
 * Matching uses substring inclusion so variants like "DMZ 평화의 길" are
 * handled without an exhaustive list. Unknown themes fall back to the
 * brand green.
 */
export function themeAccent(themeNm: string | null | undefined): ThemeAccent {
  if (!themeNm) return DEFAULT_ACCENT;
  for (const accent of THEME_ACCENTS) {
    if (themeNm.includes(accent.label)) return accent;
  }
  // DMZ theme names may contain "DMZ" rather than the full label.
  if (themeNm.includes("DMZ")) {
    return THEME_ACCENTS.find((a) => a.id === "dmz") ?? DEFAULT_ACCENT;
  }
  return DEFAULT_ACCENT;
}
