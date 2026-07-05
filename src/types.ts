export interface AccessibilityInfo {
  petFriendly: boolean;
  wheelchair: boolean;
  stroller: boolean;
  senior: boolean;
  details: string;
}

export interface Destination {
  id: string;
  name: string;
  regionName: string;
  description: string;
  category: string;
  popularity: "crowded" | "moderate" | "tranquil";
  congestionLevel: number; // 0 to 100
  alternativeId?: string; // Links crowded spot to quieter Ongil alternative
  imageUrl: string;
  accessibility: AccessibilityInfo;
  tagline: string;
  weatherIndoorAlt?: string; // Indoor alternative name if weather is bad
}

export interface AlternativeDestination {
  id: string;
  name: string;
  regionName: string;
  originalName: string; // The popular crowded destination this replaces
  description: string;
  valueProposition: string; // Why this is a great alternative
  congestionLevel: number; // Low, e.g. 12%
  accessibility: AccessibilityInfo;
  imageUrl: string;
  recommendedTime: string;
  duorunubiPathName?: string; // Associated Duorunubi trail
}

export interface PilotRegion {
  id: string;
  name: string;
  slogan: string;
  description: string;
  reasons: string[];
  keySpots: { name: string; desc: string; icon: string }[];
  accessibilityScore: number; // percentage
  duorunubiCount: number;
  imageUrl: string;
}

export interface RoadmapItem {
  period: string;
  title: string;
  items: string[];
  status: "completed" | "active" | "planned";
}
