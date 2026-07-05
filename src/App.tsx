import React, { useRef, useState, useEffect } from "react";
import Hero from "./components/Hero";
import ProblemSection from "./components/ProblemSection";
import FeaturesSection from "./components/FeaturesSection";
import SimulatorSection from "./components/SimulatorSection";
import ComparisonSection from "./components/ComparisonSection";
import PilotRegionSection from "./components/PilotRegionSection";
import DataTrustSection from "./components/DataTrustSection";
import ImpactSection from "./components/ImpactSection";
import RoadmapSection from "./components/RoadmapSection";
import FooterSection from "./components/FooterSection";

import HomeTab from "./components/HomeTab";
import SearchTab from "./components/SearchTab";
import MapTab from "./components/MapTab";
import CourseTab from "./components/CourseTab";
import MyTab from "./components/MyTab";
import KakaoLoginModal from "./components/KakaoLoginModal";
import DestinationDetail from "./components/DestinationDetail";

import { MockDestination, mockDestinations } from "./data/destinations";
import { 
  Compass, 
  Search, 
  Map as MapIcon, 
  Footprints, 
  User, 
  BookOpen, 
  Heart, 
  Sparkles,
  Home as HomeIcon,
  Menu,
  X,
  Layers,
  Smartphone,
  Accessibility
} from "lucide-react";
import { AnimatePresence } from "motion/react";

export default function App() {
  // Navigation & View Mode states
  const [viewMode, setViewMode] = useState<"app" | "intro">("app");
  const [activeTab, setActiveTab] = useState<"home" | "search" | "map" | "course" | "my">("home");

  // User mock authentication states
  const [user, setUser] = useState<{ name: string; avatarUrl: string } | null>(() => {
    try {
      const saved = localStorage.getItem("ongil_user_v1");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalMode, setModalMode] = useState<"login" | "signup">("login");

  const handleLoginSuccess = (userData: { name: string; avatarUrl: string }) => {
    setUser(userData);
    localStorage.setItem("ongil_user_v1", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("ongil_user_v1");
  };

  // Global states
  const [likedDestinations, setLikedDestinations] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("ongil_liked_v1");
      return saved ? JSON.parse(saved) : ["d001", "d004"]; // Pre-fill with Goseong & Samcheok for a vibrant start
    } catch {
      return ["d001", "d004"];
    }
  });

  const [accessibilityDefaults, setAccessibilityDefaults] = useState(() => {
    try {
      const saved = localStorage.getItem("ongil_accessibility_v1");
      return saved ? JSON.parse(saved) : {
        petFriendly: false,
        wheelchair: false,
        stroller: false,
        senior: false,
        parking: false
      };
    } catch {
      return {
        petFriendly: false,
        wheelchair: false,
        stroller: false,
        senior: false,
        parking: false
      };
    }
  });

  // Selected destination to showcase in the unified detail modal
  const [selectedDestination, setSelectedDestination] = useState<MockDestination | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem("ongil_liked_v1", JSON.stringify(likedDestinations));
  }, [likedDestinations]);

  useEffect(() => {
    localStorage.setItem("ongil_accessibility_v1", JSON.stringify(accessibilityDefaults));
  }, [accessibilityDefaults]);

  // Global Handlers
  const handleToggleLike = (id: string) => {
    setLikedDestinations(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleClearLikes = () => {
    setLikedDestinations([]);
  };

  const handleUpdateAccessibilityDefaults = (newDefaults: any) => {
    setAccessibilityDefaults(newDefaults);
  };

  const handleSelectAlternative = (altId: string) => {
    const found = mockDestinations.find(d => d.id === altId);
    if (found) {
      setSelectedDestination(found);
    }
  };

  const handleNavigateToTab = (tab: "home" | "search" | "map" | "course" | "my") => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Intro Sections scrolling helpers
  const betaRef = useRef<HTMLDivElement>(null);
  const handleBetaClick = () => {
    setViewMode("intro");
    setTimeout(() => {
      betaRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
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

            {user ? (
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
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium rounded-sm border border-red-200/60 transition-colors duration-fast cursor-pointer"
                >
                  로그아웃
                </button>
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

              {/* Map */}
              <button
                onClick={() => handleNavigateToTab("map")}
                className={`w-full px-4 py-2.5 rounded-md text-sm font-medium text-left flex items-center gap-3 transition-colors duration-fast cursor-pointer relative ${
                  activeTab === "map"
                    ? "bg-bento-green/10 text-bento-green before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-5 before:rounded-full before:bg-bento-green"
                    : "text-bento-dark/70 hover:bg-bento-cream/60 hover:text-bento-dark"
                }`}
              >
                <MapIcon size={16} strokeWidth={activeTab === "map" ? 2.5 : 2} />
                <span>안심 관측도</span>
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
                {Object.values(accessibilityDefaults).some(Boolean) && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-bento-green animate-pulse" />
                )}
              </button>

              {/* Direct callout to documentation */}
              <div className="pt-3 mt-3 border-t border-border-subtle">
                <button
                  onClick={() => setViewMode("intro")}
                  className="text-xs font-medium text-bento-stone hover:text-bento-ink flex items-center justify-center gap-1.5 w-full py-2 rounded-md hover:bg-bento-cream/50 transition-colors duration-fast cursor-pointer"
                >
                  <BookOpen size={14} />
                  <span>온길 철학 기획관람가기</span>
                </button>
              </div>

            </div>
          </aside>

          {/* B. TAB AREA CONTAINER */}
          <main className="flex-1 min-w-0">
            {activeTab === "home" && (
              <HomeTab
                onSelectDestination={setSelectedDestination}
                likedDestinations={likedDestinations}
                onToggleLike={handleToggleLike}
                accessibilityDefaults={accessibilityDefaults}
                onNavigateToTab={handleNavigateToTab}
              />
            )}
            
            {activeTab === "search" && (
              <SearchTab
                onSelectDestination={setSelectedDestination}
                likedDestinations={likedDestinations}
                onToggleLike={handleToggleLike}
                accessibilityDefaults={accessibilityDefaults}
              />
            )}

            {activeTab === "map" && (
              <MapTab
                onSelectDestination={setSelectedDestination}
                accessibilityDefaults={accessibilityDefaults}
              />
            )}

            {activeTab === "course" && (
              <CourseTab
                onSelectDestination={setSelectedDestination}
                likedDestinations={likedDestinations}
                onToggleLike={handleToggleLike}
              />
            )}

            {activeTab === "my" && (
              <MyTab
                onSelectDestination={setSelectedDestination}
                likedDestinations={likedDestinations}
                onToggleLike={handleToggleLike}
                accessibilityDefaults={accessibilityDefaults}
                onUpdateAccessibilityDefaults={handleUpdateAccessibilityDefaults}
                onClearLikes={handleClearLikes}
                user={user}
                onLoginClick={() => {
                  setModalMode("login");
                  setShowLoginModal(true);
                }}
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

            {/* Map */}
            <button
              onClick={() => handleNavigateToTab("map")}
              className={`flex flex-col items-center justify-center w-14 py-2 rounded-lg transition-colors duration-fast cursor-pointer ${
                activeTab === "map" ? "text-bento-green bg-bento-green/[0.06] font-semibold" : "text-bento-dark/50 hover:text-bento-dark/70"
              }`}
            >
              <MapIcon size={20} strokeWidth={activeTab === "map" ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-medium leading-none">관측도</span>
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
              {Object.values(accessibilityDefaults).some(Boolean) && (
                <span className="absolute top-2 right-3 w-1.5 h-1.5 rounded-full bg-bento-green animate-pulse" />
              )}
            </button>

          </nav>

        </div>
      ) : (
        
        /* ==================== ORIGINAL HIGH-FIDELITY LANDING PAGES ==================== */
        <div className="animate-fadeIn">
          {/* Hero */}
          <Hero onExploreClick={() => {
            setViewMode("app");
            setActiveTab("search");
          }} />

          {/* Problem Section (3 structural imbalances) */}
          <div id="problem">
            <ProblemSection />
          </div>

          {/* Key Features Section */}
          <div id="features">
            <FeaturesSection />
          </div>

          {/* Interactive Core Virtual Simulator Zone */}
          <div id="simulator">
            <SimulatorSection />
          </div>

          {/* Detailed Matrix Table */}
          <div id="comparison">
            <ComparisonSection />
          </div>

          {/* Focus Pilot Regions */}
          <div id="regions">
            <PilotRegionSection />
          </div>

          {/* Data API Verification details */}
          <DataTrustSection />

          {/* Regional Impact metrics */}
          <ImpactSection />

          {/* Project Timeline Roadmap */}
          <RoadmapSection />

          {/* Contact Footer */}
          <div ref={betaRef}>
            <FooterSection />
          </div>
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

      {/* 4. KAKAO MOCK LOGIN MODAL */}
      <AnimatePresence>
        {showLoginModal && (
          <KakaoLoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onLoginSuccess={handleLoginSuccess}
            initialMode={modalMode}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
