import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth, fileUrl } from "@/lib/auth";
import { MediaDisplay } from "@/components/MediaDisplay";
import { renderBioText } from "@/lib/textEffects";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Loader2, LogOut, Settings, Link2, Shield, Award, LayoutDashboard,
  Trophy, BarChart3, Users, KeyRound, Activity, ChevronRight,
  ExternalLink, Palette, Globe, Sparkles, MessageSquare, Wrench, Home,
  Layers, ShieldCheck, UserCheck
} from "lucide-react";
import Editor from "@/pages/dashboard/Editor";
import { OverviewSection } from "@/pages/dashboard/OverviewSection";
import {
  SettingsSection, ConnectionsSection, SecuritySection,
  BadgesSection, LeaderboardSection, MyStatsSection, LinksSection
} from "@/pages/dashboard/Sections";
import ProfileTemplatesSection from "@/pages/dashboard/ProfileTemplatesSection";
import ToolsSection from "@/pages/dashboard/ToolsSection";
import { AdminUsers, AdminInvites, AdminStats, AdminSiteSettings, AdminBotSection, AdminOAuthInspector } from "@/pages/dashboard/Admin";
import ErrorBoundary from "@/components/ErrorBoundary";
import { toast } from "sonner";

const SIDEBAR_CATEGORIES = [
  {
    group: "Overview",
    icon: Home,
    items: [
      { id: "home", label: "Overview", icon: Home },
    ],
  },
  {
    group: "Main",
    icon: Palette,
    items: [
      { id: "profile", label: "Profile", icon: Palette },
      { id: "layout", label: "Layout", icon: Layers },
      { id: "badges", label: "Badges", icon: Award },
      { id: "links", label: "Links", icon: Link2 },
    ],
  },
  {
    group: "Community",
    icon: Users,
    items: [
      { id: "templates", label: "Templates", icon: Sparkles },
      { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    ],
  },
  {
    group: "Settings",
    icon: Settings,
    items: [
      { id: "tools", label: "Tools", icon: Wrench },
      { id: "analytics", label: "Analytics", icon: BarChart3 },
      { id: "settings", label: "Settings", icon: Settings },
      { id: "connections", label: "Connected Apps", icon: Link2 },
      { id: "security", label: "Security & 2FA", icon: ShieldCheck },
    ],
  },
];

const ADMIN_CATEGORY = {
  group: "Admin & Control",
  icon: Shield,
  items: [
    { id: "admin-bot", label: "Bot Manager", icon: Shield },
    { id: "admin-oauth", label: "OAuth & Spotify", icon: Link2 },
    { id: "admin-users", label: "Manage Users", icon: Users },
    { id: "admin-invites", label: "Invite Codes", icon: KeyRound },
    { id: "admin-stats", label: "Platform Stats", icon: Activity },
    { id: "admin-site", label: "Site Settings", icon: Globe },
  ],
};

const TUTORIAL_STEPS = [
  {
    title: "Customize Visuals & Assets",
    category: "Step 1 · Profile & Media",
    text: "Upload your profile picture, background wallpaper, banner cover, and custom cursor. Equip live animated perimeter effects.",
    section: "profile",
    action: "Explore Profile",
    icon: Palette,
  },
  {
    title: "Card Layout & Slideshow Deck",
    category: "Step 2 · Layout System",
    text: "Choose from classic, minimal, banner, or slideshow deck layouts with Discord server embeds and software/cheat project showcases.",
    section: "layout",
    action: "Choose Layout",
    icon: Layers,
  },
  {
    title: "Links & Social Integrations",
    category: "Step 3 · Links & Live Presence",
    text: "Connect Discord and Spotify to stream real-time track info and status. Add custom link buttons and platform icons.",
    section: "links",
    action: "Configure Links",
    icon: Link2,
  },
  {
    title: "Audio Studio & Visual Effects",
    category: "Step 4 · Audio & Effects",
    text: "Upload MP3 background music with synchronized LRC lyrics, and customize background ambient particle effects.",
    section: "tools",
    action: "Finish Tour",
    icon: Sparkles,
  },
];

export default function Dashboard() {
  const { user, setUser, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { section } = useParams();

  // Normalize active section
  let active = section || "home";
  if (active === "editor") active = "profile";
  if (active === "stats") active = "analytics";
  if (active === "social" || active === "friends") active = "home";
  if (active === "overview") active = "home";

  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const isImpersonating = typeof window !== "undefined" && Boolean(localStorage.getItem("admin_impersonator_token"));
  const returnToAdmin = () => {
    const adminToken = localStorage.getItem("admin_impersonator_token");
    const adminUser = localStorage.getItem("admin_impersonator_user");
    if (adminToken) {
      localStorage.setItem("swats_token", adminToken);
      localStorage.setItem("token", adminToken);
      if (adminUser) {
        localStorage.setItem("swats_user", adminUser);
        localStorage.setItem("user", adminUser);
      }
      localStorage.removeItem("admin_impersonator_token");
      localStorage.removeItem("admin_impersonator_user");
      localStorage.removeItem("admin_impersonating_target");
      toast.success("Returned to Admin Control Panel!");
      window.location.href = "/dashboard/admin-users";
    }
  };

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#08090d] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#5B8DB8]" size={32} />
      </div>
    );
  }

  const navCategories = user.role === "admin"
    ? [...SIDEBAR_CATEGORIES, ADMIN_CATEGORY]
    : SIDEBAR_CATEGORIES;

  const renderSection = () => {
    switch (active) {
      case "home":
        return <OverviewSection />;
      case "profile":
        return <Editor initialTab="profile" />;
      case "layout":
        return <Editor initialTab="layout" />;
      case "badges":
        return <BadgesSection />;
      case "links":
        return <LinksSection />;
      case "templates":
        return <ProfileTemplatesSection />;
      case "leaderboard":
        return <LeaderboardSection />;
      case "tools":
        return <ToolsSection />;
      case "analytics":
        return <MyStatsSection />;
      case "settings":
        return <SettingsSection />;
      case "connections":
        return <ConnectionsSection />;
      case "security":
        return <SecuritySection />;
      case "admin-bot":
      case "bot":
        return <AdminBotSection />;
      case "admin-oauth":
      case "admin-connections":
        return <AdminOAuthInspector />;
      case "admin-users":
        return <AdminUsers />;
      case "admin-invites":
        return <AdminInvites />;
      case "admin-stats":
        return <AdminStats />;
      case "admin-site":
        return <AdminSiteSettings />;
      default:
        return <OverviewSection />;
    }
  };

  const pfp = fileUrl(user?.settings?.pfp) || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`;

  return (
    <div className="min-h-screen bg-[#08090d] flex text-[#E5E7EB] selection:bg-[#5B8DB8]/30">
      {/* ========================================================================= */}
      {/* SIDEBAR: EXACTLY 243px WIDTH                                              */}
      {/* ========================================================================= */}
      <aside className="w-[243px] shrink-0 hidden lg:flex flex-col bg-[#0c0e15] border-r border-[#1a2230] h-screen sticky top-0 p-3.5 select-none z-30">
        {/* Top Logo & Dashboard Header */}
        <div className="px-2 pt-1 pb-3 mb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-black tracking-tight text-white">
              feds<span className="text-[#5B8DB8]">.lol</span>
            </span>
          </div>
          <div className="text-[11px] uppercase font-bold tracking-widest text-[#E5E7EB]/50 mt-0.5 pl-0.5">
            Dashboard
          </div>
        </div>

        {/* User Quick Identity Pill */}
        <div className="p-2.5 rounded-xl bg-[#07080c] border border-white/5 flex items-center gap-2.5 mb-3">
          <MediaDisplay
            src={pfp}
            alt={user.username}
            className="w-8 h-8 rounded-lg object-cover border border-[#5B8DB8]/40 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate">
              {renderBioText(user.display_name || user.username)}
            </div>
            <div className="text-[10px] text-[#5B8DB8] font-mono truncate">
              @{user.username}
            </div>
          </div>
          <a
            href={`/${encodeURIComponent(user.username)}`}
            target="_blank"
            rel="noreferrer"
            className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center transition-all shrink-0"
            title="View Live Bio"
          >
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Categories Navigation */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-0.5 scrollbar-thin">
          {navCategories.map((cat) => (
            <div key={cat.group}>
              <div className="px-2 mb-1.5 text-[11px] uppercase font-bold tracking-wider text-[#5B8DB8] flex items-center gap-1.5">
                <cat.icon size={12} className="text-[#5B8DB8]" />
                <span>{cat.group}</span>
              </div>

              <div className="space-y-1">
                {cat.items.map((item) => {
                  const isSelected = active === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`nav-${item.id}`}
                      onClick={() => navigate(`/dashboard/${item.id}`)}
                      className={`w-[175px] h-[30px] flex items-center gap-2.5 px-3 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#5B8DB8] text-white shadow-md shadow-[#5B8DB8]/30 font-bold"
                          : "text-[#E5E7EB]/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <item.icon size={14} className={isSelected ? "text-white" : "text-[#5B8DB8]"} />
                      <span className="truncate">{item.label}</span>
                      {isSelected && <ChevronRight size={12} className="ml-auto text-white/90" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Customization Actions */}
        <div className="border-t border-white/10 pt-2.5 mt-2 space-y-1">
          <button
            type="button"
            onClick={() => { setTutorialStep(0); setTutorialOpen(true); }}
            className="w-full flex items-center gap-2 px-2.5 h-7 rounded-lg text-xs font-semibold text-white/70 hover:bg-white/5 hover:text-white transition-all"
          >
            <Sparkles size={13} className="text-[#5B8DB8]" />
            <span>Guide & Tour</span>
          </button>
          <a
            href={`/${encodeURIComponent(user.username)}`}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center gap-2 px-2.5 h-7 rounded-lg text-xs font-semibold text-[#5B8DB8] bg-[#5B8DB8]/10 hover:bg-[#5B8DB8]/20 transition-all"
          >
            <ExternalLink size={13} />
            <span>Live Bio URL</span>
          </a>
          <button
            type="button"
            onClick={async () => { await logout(); navigate("/"); }}
            data-testid="logout-btn"
            className="w-full flex items-center gap-2 px-2.5 h-7 rounded-lg text-xs font-semibold text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut size={13} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Navbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0c0e15] px-4 py-3 flex items-center justify-between border-b border-white/10">
        <span className="font-display text-base font-black tracking-tight text-white">
          feds<span className="text-[#5B8DB8]">.lol</span>
        </span>
        <select
          value={active}
          onChange={(e) => navigate(`/dashboard/${e.target.value}`)}
          className="bg-[#07080c] border border-white/15 rounded-lg text-xs px-3 py-1.5 text-white font-semibold"
        >
          {navCategories.flatMap((c) => c.items).map((it) => (
            <option key={it.id} value={it.id}>
              {it.label}
            </option>
          ))}
        </select>
      </div>

      {/* Main Workspace Stage (Solid Background, wide container) */}
      <main className="flex-1 p-3 sm:p-6 lg:p-8 pt-18 lg:pt-6 overflow-x-hidden min-h-screen bg-[#08090d]">
        <div className="w-full max-w-[1900px] mx-auto">
          {/* Admin Impersonation Floating Notification */}
          {isImpersonating && (
            <div className="mb-5 p-3.5 px-4.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-emerald-600/10 to-transparent border border-emerald-500/40 flex flex-wrap items-center justify-between gap-3 shadow-[0_0_25px_rgba(16,185,129,0.15)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                  <UserCheck size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Admin Impersonation Mode</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 font-mono text-[10px] uppercase font-bold">
                      ACTIVE
                    </span>
                  </div>
                  <div className="text-xs text-emerald-200/70 mt-0.5">
                    Currently managing and editing the dashboard for <strong className="text-white">@{user.username}</strong> ({user.email}).
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                onClick={returnToAdmin}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs h-8 px-4 rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer transition-all hover:scale-105"
              >
                Return to Admin Panel &rarr;
              </Button>
            </div>
          )}

          <div id={`section-${active}`} className="w-full bg-[#0c0e18]/90 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl shadow-black/80">
            <ErrorBoundary key={active}>
              {renderSection()}
            </ErrorBoundary>
          </div>
        </div>
      </main>

      {/* Quick-Start Tour Modal */}
      <Dialog open={tutorialOpen} onOpenChange={setTutorialOpen}>
        <DialogContent className="max-w-md border border-[#2b384e] bg-[#0c0e15] text-white p-5 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.95)]">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 flex items-center justify-center text-[#5B8DB8]">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-[#5B8DB8]">
                  {TUTORIAL_STEPS[tutorialStep]?.category}
                </div>
                <DialogTitle className="text-base font-bold text-white font-display">
                  {TUTORIAL_STEPS[tutorialStep]?.title}
                </DialogTitle>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs text-[#E5E7EB]/80 leading-relaxed">
              {TUTORIAL_STEPS[tutorialStep]?.text}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <div className="flex gap-1">
                {TUTORIAL_STEPS.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTutorialStep(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === tutorialStep ? "w-6 bg-[#5B8DB8]" : "w-1.5 bg-white/20"
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                {tutorialStep > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTutorialStep((s) => s - 1)}
                    className="text-xs h-7 rounded-lg border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                  >
                    Back
                  </Button>
                )}
                {tutorialStep < TUTORIAL_STEPS.length - 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      navigate(`/dashboard/${TUTORIAL_STEPS[tutorialStep]?.section}`);
                      setTutorialStep((s) => s + 1);
                    }}
                    className="text-xs h-7 px-3 rounded-lg bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white font-bold"
                  >
                    {TUTORIAL_STEPS[tutorialStep]?.action} &rarr;
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setTutorialOpen(false);
                      navigate("/dashboard/profile");
                    }}
                    className="text-xs h-7 px-4 rounded-lg bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white font-bold"
                  >
                    Launch Studio 🚀
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
