'use client';

import React, { useState, useEffect, useRef } from "react";
import LandingPage from "./components/LandingPage";

import HomeTab from "./components/HomeTab";
import SearchTab from "./components/SearchTab";
import CourseTab from "./components/CourseTab";
import MyTab from "./components/MyTab";
import FavoritesTab from "./components/FavoritesTab";
import AssistantTab from "./components/AssistantTab";
import KakaoLoginModal from "./components/KakaoLoginModal";
import DestinationDetail from "./components/DestinationDetail";
import SearchDestinationDetail from "./components/SearchDestinationDetail";
import CourseDetail from "./components/CourseDetail";

import { MockDestination, mockDestinations } from "./data/destinations";
import { 
  Compass, 
  Search, 
  Footprints, 
  User, 
  Heart, 
  Sparkles,
  Home as HomeIcon,
  Menu,
  X,
  Layers,
  Smartphone,
  Accessibility,
  MessageCircle
} from "lucide-react";
import { AnimatePresence } from "motion/react";

/** Used when a logged-in user's Kakao profile has no profile image. */
const DEFAULT_AVATAR_URL = "https://api.dicebear.com/7.x/adventurer/svg?seed=ongil_user";

const DEFAULT_ACCESSIBILITY = {
  petFriendly: false,
  wheelchair: false,
  stroller: false,
  senior: false,
  parking: false
};
const DEFAULT_LIKES = ["d001", "d004"]; // Pre-fill with Goseong & Samcheok for a vibrant start

type AccessibilityDefaults = typeof DEFAULT_ACCESSIBILITY;
type Tab = "home" | "search" | "course" | "assistant" | "my" | "favorites";

/** Main-menu routes mirrored as URL hashes (#/home, #/search, ...) for browser history. */
const TAB_ROUTES: readonly Tab[] = ["home", "search", "course", "assistant", "my", "favorites"];

function tabFromHash(): Tab | null {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return (TAB_ROUTES as readonly string[]).includes(hash) ? (hash as Tab) : null;
}

// Guests keep likes/defaults in localStorage; logged-in users use the DB via /api/likes and /api/settings/accessibility.
function loadLocal<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    // Keep the deterministic default when storage is unavailable or invalid.
    return fallback;
  }
}

export default function App() {
  // Navigation & View Mode states
  const [viewMode, setViewMode] = useState<"app" | "intro">("intro");
  const [activeTab, setActiveTab] = useState<Tab>("home");

  // User authentication state (Kakao OAuth session, via /api/auth/*)
  const [user, setUser] = useState<{ id: string; name: string; avatarUrl: string } | null>(null);
  // Hide GNB auth buttons until /api/auth/me resolves, so logged-in users don't see 로그인/회원가입 flash.
  const [authChecked, setAuthChecked] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalMode, setModalMode] = useState<"login" | "signup">("login");
  const [isAssistantRoomDrawerOpen, setIsAssistantRoomDrawerOpen] = useState(false);
  const assistantRoomTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (viewMode !== "app" || activeTab !== "assistant") setIsAssistantRoomDrawerOpen(false);
  }, [activeTab, viewMode]);

  const handleLogout = () => {
    setUser(null);
    // Drop the account's likes/defaults from screen; fall back to this device's guest data.
    setLikedDestinations(loadLocal("ongil_liked_v1", DEFAULT_LIKES));
    setLikedCourses(loadLocal("ongil_liked_courses", []));
    setAccessibilityDefaults(loadLocal("ongil_accessibility_v1", DEFAULT_ACCESSIBILITY));
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {
      // Best-effort: client-side state is already cleared regardless.
    });
  };

  // Global states
  const [likedDestinations, setLikedDestinations] = useState<string[]>(DEFAULT_LIKES);
  const [likedCourses, setLikedCourses] = useState<string[]>([]);

  const [accessibilityDefaults, setAccessibilityDefaults] = useState<AccessibilityDefaults>(DEFAULT_ACCESSIBILITY);
  const [storageHydrated, setStorageHydrated] = useState(false);

  // Selected destination to showcase in the unified detail modal
  const [selectedDestination, setSelectedDestination] = useState<MockDestination | null>(null);

  // Selected search result destination (real DB data by content_id)
  const [selectedSearchContentId, setSelectedSearchContentId] = useState<string | null>(null);
  const [searchForecastDate, setSearchForecastDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Selected walking course detail sheet
  const [selectedCrsIdx, setSelectedCrsIdx] = useState<string | null>(null);
  const [courseSheetReady, setCourseSheetReady] = useState(false);

  useEffect(() => {
    if (!selectedCrsIdx) {
      setCourseSheetReady(false);
      return;
    }
    setCourseSheetReady(false);
    const timer = setTimeout(() => setCourseSheetReady(true), 260);
    return () => clearTimeout(timer);
  }, [selectedCrsIdx]);

  // Hydrate the logged-in user from the server session (Kakao OAuth), if any.
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data: { user: { id: string; nickname: string | null; avatarUrl: string | null } | null }) => {
        if (data.user) {
          setUser({
            id: data.user.id,
            name: data.user.nickname || "온길러",
            avatarUrl: data.user.avatarUrl || DEFAULT_AVATAR_URL,
          });
          fetch("/api/likes?type=place")
            .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
            .then((likes: { ids: string[] }) => setLikedDestinations(likes.ids))
            .catch((e) => console.error("Failed to load likes", e));
          fetch("/api/likes?type=course")
            .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
            .then((likes: { ids: string[] }) => setLikedCourses(likes.ids))
            .catch((e) => console.error("Failed to load course likes", e));
          fetch("/api/settings/accessibility")
            .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
            .then((settings: { accessibilityDefaults: Partial<AccessibilityDefaults> }) =>
              setAccessibilityDefaults({ ...DEFAULT_ACCESSIBILITY, ...settings.accessibilityDefaults })
            )
            .catch((e) => console.error("Failed to load accessibility defaults", e));
        }
      })
      .catch(() => {
        // Keep the signed-out default when the session check fails.
      })
      .finally(() => setAuthChecked(true));
  }, []);

  // Hydrate browser-only state after the first render so SSR and hydration match.
  useEffect(() => {
    setLikedDestinations(loadLocal("ongil_liked_v1", DEFAULT_LIKES));
    setLikedCourses(loadLocal("ongil_liked_courses", []));
    setAccessibilityDefaults(loadLocal("ongil_accessibility_v1", DEFAULT_ACCESSIBILITY));
    setStorageHydrated(true);
  }, []);

  // Sync guest state to local storage after browser state has been hydrated.
  // Logged-in state lives in the DB, so it must not overwrite this device's guest data.
  useEffect(() => {
    if (!storageHydrated || user) return;
    localStorage.setItem("ongil_liked_v1", JSON.stringify(likedDestinations));
  }, [likedDestinations, storageHydrated]);

  useEffect(() => {
    if (!storageHydrated || user) return;
    localStorage.setItem("ongil_liked_courses", JSON.stringify(likedCourses));
  }, [likedCourses, storageHydrated, user]);

  useEffect(() => {
    if (!storageHydrated || user) return;
    localStorage.setItem("ongil_accessibility_v1", JSON.stringify(accessibilityDefaults));
  }, [accessibilityDefaults, storageHydrated]);

  // Browser history sync for main-menu navigation: popstate (back/forward)
  // restores the tab encoded in the URL hash, defaulting to home for the
  // un-hashed root entry. Also restores the tab when landing on a hashed URL.
  useEffect(() => {
    const onPopState = () => {
      setActiveTab(tabFromHash() ?? "home");
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("popstate", onPopState);

    const initialTab = tabFromHash();
    if (initialTab) setActiveTab(initialTab);

    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Global Handlers
  const handleToggleLike = (id: string) => {
    const liked = !likedDestinations.includes(id);
    const apply = (on: boolean) =>
      setLikedDestinations(prev => (on ? [...prev.filter(item => item !== id), id] : prev.filter(item => item !== id)));
    apply(liked);
    if (!user) return;
    fetch("/api/likes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "place", id, liked })
    })
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); })
      .catch((e) => {
        console.error("Failed to save like", e);
        apply(!liked); // Roll back so the UI never shows an unsaved like.
      });
  };

  const handleToggleCourseLike = (crsIdx: string) => {
    const liked = !likedCourses.includes(crsIdx);
    const apply = (on: boolean) =>
      setLikedCourses((prev) => (on ? [...prev.filter((item) => item !== crsIdx), crsIdx] : prev.filter((item) => item !== crsIdx)));
    apply(liked);
    if (!user) return;
    fetch("/api/likes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "course", id: crsIdx, liked })
    })
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); })
      .catch((e) => {
        console.error("Failed to save course like", e);
        apply(!liked);
      });
  };

  const handleUpdateAccessibilityDefaults = (newDefaults: AccessibilityDefaults) => {
    const previous = accessibilityDefaults;
    setAccessibilityDefaults(newDefaults);
    if (!user) return;
    fetch("/api/settings/accessibility", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newDefaults)
    })
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); })
      .catch((e) => {
        console.error("Failed to save accessibility defaults", e);
        setAccessibilityDefaults(previous);
      });
  };

  const handleSelectAlternative = (altId: string) => {
    const found = mockDestinations.find(d => d.id === altId);
    if (found) {
      setSelectedDestination(found);
    }
  };

  const handleNavigateToTab = (tab: Tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Stack a history entry per main-menu move (skipped when the menu is
    // already current) so the browser back button returns to the previous menu.
    if (tabFromHash() !== tab) {
      window.history.pushState({ tab }, "", `#/${tab}`);
    }
  };

  return (
    <div className="min-h-full bg-bento-bg font-sans antialiased text-bento-dark selection:bg-bento-green selection:text-white flex flex-col">
      
      {/* 1. TOP GLOBAL STICKY HEADER */}
      <header className="sticky top-0 z-[100] bg-bento-bg/95 backdrop-blur-md border-b border-border-default shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <button 
            onClick={() => {
              setViewMode("intro");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }} 
            className="flex items-center gap-2 text-bento-dark hover:opacity-90 transition-opacity duration-fast cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-bento-green flex items-center justify-center text-white">
              <Compass size={18} className="animate-spin-slow" />
            </div>
            <span className="font-display font-black tracking-tight text-sm sm:text-base">
              온길 <span className="text-bento-green font-normal">Ongil</span>
            </span>
          </button>

          {/* Quick status badge / Action */}
          <div className="flex items-center gap-2">

            {viewMode === "app" && activeTab === "assistant" && (
              <button
                ref={assistantRoomTriggerRef}
                type="button"
                onClick={() => setIsAssistantRoomDrawerOpen(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border-default bg-white px-2.5 py-2 text-xs font-bold text-bento-dark shadow-sm transition hover:border-bento-green/40 hover:text-bento-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-green focus-visible:ring-offset-2 md:hidden"
                aria-label="대화방 열기"
              >
                <MessageCircle size={15} aria-hidden="true" />
                <span>대화방</span>
              </button>
            )}

            {!authChecked ? (
              <div className="w-32 h-8 rounded-sm bg-bento-dark/5 animate-pulse" aria-hidden="true" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white border border-border-default px-2.5 py-1.5 rounded-md">
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-5 h-5 rounded-full object-cover border border-border-subtle"
                  />
                  <span className="text-xs font-semibold text-bento-dark hidden sm:inline">
                    {user.name}님
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setModalMode("login");
                    setShowLoginModal(true);
                  }}
                  className="px-3 py-1.5 bg-bento-cream hover:bg-bento-dark/5 text-bento-dark border border-border-default text-xs font-medium rounded-sm transition-colors duration-fast cursor-pointer"
                >
                  로그인
                </button>
                <button
                  onClick={() => {
                    setModalMode("signup");
                    setShowLoginModal(true);
                  }}
                  className="px-3 py-1.5 bg-bento-green hover:bg-bento-ink text-white text-xs font-semibold rounded-sm shadow-sm hover:shadow-md transition-all duration-base cursor-pointer"
                >
                  회원가입
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* 2. BODY CONTENT */}
      {viewMode === "app" ? (
        
        /* ==================== 5-TAB APP EXPERIENCE ==================== */
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 flex flex-col md:flex-row gap-6 pb-24 md:pb-12">
          
          {/* A. DESKTOP SIDEBAR NAVIGATION (Hidden on Mobile) */}
          <aside className="hidden md:flex md:w-56 shrink-0 flex-col gap-2">
            <div className="bg-white p-4 rounded-lg border border-border-subtle shadow-sm space-y-1 sticky top-22">

              {/* Home */}
              <button
                onClick={() => handleNavigateToTab("home")}
                className={`w-full px-4 py-2.5 rounded-md text-sm font-medium text-left flex items-center gap-3 transition-colors duration-fast cursor-pointer relative ${
                  activeTab === "home"
                    ? "bg-bento-green/10 text-bento-green before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-5 before:rounded-full before:bg-bento-green"
                    : "text-bento-dark/70 hover:bg-bento-cream/60 hover:text-bento-dark"
                }`}
              >
                <Compass size={16} strokeWidth={activeTab === "home" ? 2.5 : 2} />
                <span>추천 홈</span>
              </button>

              {/* Search */}
              <button
                onClick={() => handleNavigateToTab("search")}
                className={`w-full px-4 py-2.5 rounded-md text-sm font-medium text-left flex items-center gap-3 transition-colors duration-fast cursor-pointer relative ${
                  activeTab === "search"
                    ? "bg-bento-green/10 text-bento-green before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-5 before:rounded-full before:bg-bento-green"
                    : "text-bento-dark/70 hover:bg-bento-cream/60 hover:text-bento-dark"
                }`}
              >
                <Search size={16} strokeWidth={activeTab === "search" ? 2.5 : 2} />
                <span>여정 탐색</span>
              </button>

              {/* Course */}
              <button
                onClick={() => handleNavigateToTab("course")}
                className={`w-full px-4 py-2.5 rounded-md text-sm font-medium text-left flex items-center gap-3 transition-colors duration-fast cursor-pointer relative ${
                  activeTab === "course"
                    ? "bg-bento-green/10 text-bento-green before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-5 before:rounded-full before:bg-bento-green"
                    : "text-bento-dark/70 hover:bg-bento-cream/60 hover:text-bento-dark"
                }`}
              >
                <Footprints size={16} strokeWidth={activeTab === "course" ? 2.5 : 2} />
                <span>걷기 코스</span>
              </button>

              {/* AI assistant */}
              <button
                onClick={() => handleNavigateToTab("assistant")}
                className={`w-full px-4 py-2.5 rounded-md text-sm font-medium text-left flex items-center gap-3 transition-colors duration-fast cursor-pointer relative ${
                  activeTab === "assistant"
                    ? "bg-bento-green/10 text-bento-green before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-5 before:rounded-full before:bg-bento-green"
                    : "text-bento-dark/70 hover:bg-bento-cream/60 hover:text-bento-dark"
                }`}
              >
                <Sparkles size={16} strokeWidth={activeTab === "assistant" ? 2.5 : 2} />
                <span>AI 어시스턴트</span>
              </button>

              {/* Favorites */}
              <button
                onClick={() => handleNavigateToTab("favorites")}
                className={`w-full px-4 py-2.5 rounded-md text-sm font-medium text-left flex items-center gap-3 transition-colors duration-fast cursor-pointer relative ${
                  activeTab === "favorites"
                    ? "bg-bento-green/10 text-bento-green before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-5 before:rounded-full before:bg-bento-green"
                    : "text-bento-dark/70 hover:bg-bento-cream/60 hover:text-bento-dark"
                }`}
              >
                <Heart size={16} strokeWidth={activeTab === "favorites" ? 2.5 : 2} />
                <span>즐겨찾기</span>
              </button>

              {/* MY Profile */}
              <button
                onClick={() => handleNavigateToTab("my")}
                className={`w-full px-4 py-2.5 rounded-md text-sm font-medium text-left flex items-center gap-3 transition-colors duration-fast cursor-pointer relative ${
                  activeTab === "my"
                    ? "bg-bento-green/10 text-bento-green before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-5 before:rounded-full before:bg-bento-green"
                    : "text-bento-dark/70 hover:bg-bento-cream/60 hover:text-bento-dark"
                }`}
              >
                <User size={16} strokeWidth={activeTab === "my" ? 2.5 : 2} />
                <span>마이 페이지</span>
                
                {/* Visual indicator when defaults are saved */}
                {/*{Object.values(accessibilityDefaults).some(Boolean) && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-bento-green animate-pulse" />
                )}*/}
              </button>

            </div>
          </aside>

          {/* B. TAB AREA CONTAINER */}
          <main className="flex-1 min-w-0">
            {activeTab === "home" && (
              <HomeTab
                onSelectAttraction={setSelectedSearchContentId}
                likedDestinations={likedDestinations}
                onToggleLike={handleToggleLike}
                accessibilityDefaults={accessibilityDefaults}
                onNavigateToTab={handleNavigateToTab}
              />
            )}
            
            {activeTab === "search" && (
              <SearchTab
                onSelectDestination={(id) => setSelectedSearchContentId(String(id))}
                forecastDate={searchForecastDate}
                onForecastDateChange={setSearchForecastDate}
                likedDestinations={likedDestinations}
                onToggleLike={handleToggleLike}
                accessibilityDefaults={accessibilityDefaults}
              />
            )}

            {activeTab === "course" && (
              <CourseTab
                likedCourses={likedCourses}
                onToggleCourseLike={handleToggleCourseLike}
                onSelectCourse={setSelectedCrsIdx}
              />
            )}

            {activeTab === "assistant" && (
              <AssistantTab
                user={user}
                isRoomDrawerOpen={isAssistantRoomDrawerOpen}
                onRoomDrawerOpenChange={setIsAssistantRoomDrawerOpen}
                roomTriggerRef={assistantRoomTriggerRef}
                onLoginClick={() => {
                  setModalMode("login");
                  setShowLoginModal(true);
                }}
              />
            )}

            {activeTab === "my" && (
              <MyTab
                likedDestinations={likedDestinations}
                onToggleLike={handleToggleLike}
                accessibilityDefaults={accessibilityDefaults}
                onUpdateAccessibilityDefaults={handleUpdateAccessibilityDefaults}
                user={user}
                onLoginClick={() => {
                  setModalMode("login");
                  setShowLoginModal(true);
                }}
                onLogout={handleLogout}
              />
            )}

            {activeTab === "favorites" && (
              <FavoritesTab
                likedPlaces={likedDestinations}
                onToggleLike={handleToggleLike}
                onSelectDestination={setSelectedDestination}
                onSelectSearchDestination={(id: string) => setSelectedSearchContentId(String(id))}
                onSelectCourse={setSelectedCrsIdx}
                user={user}
                likedCourses={likedCourses}
                onToggleCourseLike={handleToggleCourseLike}
              />
            )}
          </main>

          {/* C. MOBILE BOTTOM NAVIGATION BAR (Hidden on Desktop) */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-border-default px-2 py-2 flex justify-around items-center z-[90] shadow-md">
            
            {/* Home */}
            <button
              onClick={() => handleNavigateToTab("home")}
              className={`flex flex-col items-center justify-center w-14 py-2 rounded-lg transition-colors duration-fast cursor-pointer ${
                activeTab === "home" ? "text-bento-green bg-bento-green/[0.06] font-semibold" : "text-bento-dark/50 hover:text-bento-dark/70"
              }`}
            >
              <Compass size={20} strokeWidth={activeTab === "home" ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-medium leading-none">추천홈</span>
            </button>

            {/* Search */}
            <button
              onClick={() => handleNavigateToTab("search")}
              className={`flex flex-col items-center justify-center w-14 py-2 rounded-lg transition-colors duration-fast cursor-pointer ${
                activeTab === "search" ? "text-bento-green bg-bento-green/[0.06] font-semibold" : "text-bento-dark/50 hover:text-bento-dark/70"
              }`}
            >
              <Search size={20} strokeWidth={activeTab === "search" ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-medium leading-none">탐색</span>
            </button>

            {/* Course */}
            <button
              onClick={() => handleNavigateToTab("course")}
              className={`flex flex-col items-center justify-center w-14 py-2 rounded-lg transition-colors duration-fast cursor-pointer ${
                activeTab === "course" ? "text-bento-green bg-bento-green/[0.06] font-semibold" : "text-bento-dark/50 hover:text-bento-dark/70"
              }`}
            >
              <Footprints size={20} strokeWidth={activeTab === "course" ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-medium leading-none">걷기길</span>
            </button>

            {/* AI assistant */}
            <button
              onClick={() => handleNavigateToTab("assistant")}
              className={`flex flex-col items-center justify-center w-14 py-2 rounded-lg transition-colors duration-fast cursor-pointer ${
                activeTab === "assistant" ? "text-bento-green bg-bento-green/[0.06] font-semibold" : "text-bento-dark/50 hover:text-bento-dark/70"
              }`}
            >
              <Sparkles size={20} strokeWidth={activeTab === "assistant" ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-medium leading-none">AI</span>
            </button>

            {/* Favorites */}
            <button
              onClick={() => handleNavigateToTab("favorites")}
              className={`flex flex-col items-center justify-center w-14 py-2 rounded-lg transition-colors duration-fast cursor-pointer ${
                activeTab === "favorites" ? "text-bento-green bg-bento-green/[0.06] font-semibold" : "text-bento-dark/50 hover:text-bento-dark/70"
              }`}
            >
              <Heart size={20} strokeWidth={activeTab === "favorites" ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-medium leading-none">즐겨찾기</span>
            </button>

            {/* MY */}
            <button
              onClick={() => handleNavigateToTab("my")}
              className={`flex flex-col items-center justify-center w-14 py-2 rounded-lg transition-colors duration-fast cursor-pointer relative ${
                activeTab === "my" ? "text-bento-green bg-bento-green/[0.06] font-semibold" : "text-bento-dark/50 hover:text-bento-dark/70"
              }`}
            >
              <User size={20} strokeWidth={activeTab === "my" ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-medium leading-none">MY</span>
              
              {/* Micro dot on Mobile bottom bar if filters are saved */}
              {/*{Object.values(accessibilityDefaults).some(Boolean) && (
                <span className="absolute top-2 right-3 w-1.5 h-1.5 rounded-full bg-bento-green animate-pulse" />
              )}*/}
            </button>

          </nav>

        </div>
      ) : (
        
        /* ==================== LANDING PAGE ==================== */
        <div className="animate-fadeIn">
          <LandingPage
            onExploreClick={() => {
              setViewMode("app");
              setActiveTab("search");
            }}
            onAssistantClick={() => {
              setViewMode("app");
              handleNavigateToTab("assistant");
            }}
          />
        </div>

      )}

      {/* 3. UNIVERSAL DETAILED OVERLAY MODAL */}
      <AnimatePresence>
        {selectedDestination && (
          <DestinationDetail
            destination={selectedDestination}
            onClose={() => setSelectedDestination(null)}
            isLiked={likedDestinations.includes(selectedDestination.id)}
            onToggleLike={handleToggleLike}
            onSelectAlternative={handleSelectAlternative}
          />
        )}
      </AnimatePresence>

      {/* 4. SEARCH RESULT DETAIL MODAL (real DB data) */}
      <AnimatePresence>
        {selectedSearchContentId && (
          <SearchDestinationDetail
            contentId={selectedSearchContentId}
            forecastDate={searchForecastDate}
            onClose={() => setSelectedSearchContentId(null)}
            isLiked={likedDestinations.includes(selectedSearchContentId)}
            onToggleLike={handleToggleLike}
          />
        )}
      </AnimatePresence>

      {/* 5. COURSE DETAIL SHEET */}
      <AnimatePresence>
        {selectedCrsIdx && (
          <CourseDetail
            crsIdx={selectedCrsIdx}
            variant="sheet"
            onClose={() => setSelectedCrsIdx(null)}
            ready={courseSheetReady}
            isLiked={likedCourses.includes(selectedCrsIdx)}
            onToggleLike={handleToggleCourseLike}
          />
        )}
      </AnimatePresence>

      {/* 6. KAKAO MOCK LOGIN MODAL */}
      <AnimatePresence>
        {showLoginModal && (
          <KakaoLoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            initialMode={modalMode}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
