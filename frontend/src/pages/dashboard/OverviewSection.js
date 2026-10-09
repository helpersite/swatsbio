import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, fileUrl } from "@/lib/auth";
import { renderBioText } from "@/lib/textEffects";
import { MediaDisplay } from "@/components/MediaDisplay";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Eye, ExternalLink, Sparkles, LayoutDashboard, Link2,
  ShieldCheck, Award, MessageSquare, Wrench, BarChart3,
  TrendingUp, Users, CheckCircle2, ArrowUpRight, Palette,
  Copy, Check, QrCode, Share2, Flame, Music, Lock,
  MousePointer2, Sliders, Circle, Layers, Globe, Radio,
  Activity, ArrowRight
} from "lucide-react";
import { SiDiscord, SiSpotify, SiTelegram, SiX } from "react-icons/si";

export function OverviewSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const s = user?.settings || {};
  const pfp = fileUrl(s.pfp) || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`;
  const views = user?.views || s.views || 0;
  const dc = user?.connections?.discord;
  const sp = user?.connections?.spotify;
  const accent = s.accent_color || "#5B8DB8";
  const bioUrl = `https://swats.bio/${user?.username || "user"}`;

  const copyBioLink = () => {
    navigator.clipboard.writeText(bioUrl);
    setCopiedLink(true);
    toast.success("Profile link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // 1. Profile Setup & Health Score Checklist
  const setupItems = [
    { label: "Profile Avatar Uploaded", done: Boolean(s.pfp && s.pfp !== "invisible"), path: "/dashboard/profile" },
    { label: "Bio Description Written", done: Boolean(user?.description && user.description.trim().length > 0), path: "/dashboard/profile" },
    { label: "Active Links Configured", done: Boolean(Array.isArray(s.links) && s.links.length > 0), path: "/dashboard/links" },
    { label: "Background Effect Active", done: Boolean(s.bg_effect && s.bg_effect !== "none"), path: "/dashboard/profile" },
    { label: "Discord or Spotify Linked", done: Boolean(dc || sp || s.discord_user_id), path: "/dashboard/connections" },
    { label: "Custom Badges Equipped", done: Boolean(Array.isArray(s.badges_shown) && s.badges_shown.length > 0), path: "/dashboard/badges" },
  ];

  const completedCount = setupItems.filter((i) => i.done).length;
  const healthPercent = Math.round((completedCount / setupItems.length) * 100);

  // 2. Metrics List
  const quickStats = [
    { label: "Total Profile Views", value: Number(views).toLocaleString(), icon: Eye, color: "text-[#5B8DB8]", bg: "bg-[#5B8DB8]/15", note: "+18% this week" },
    { label: "Badges Unlocked", value: (user?.badges?.length || 0), icon: Award, color: "text-amber-400", bg: "bg-amber-400/15", note: "Platform rank" },
    { label: "Active Links", value: (s.links?.length || Object.keys(s.socials || {}).length || 0), icon: Link2, color: "text-emerald-400", bg: "bg-emerald-400/15", note: "Live in stack" },
    { label: "Account Tier", value: user?.role === "admin" ? "Admin" : (user?.is_premium ? "VIP Elite" : "Standard"), icon: ShieldCheck, color: "text-purple-400", bg: "bg-purple-400/15", note: "Verified member" },
  ];

  // 3. Active Aesthetic Modules Status
  const aestheticModules = [
    { name: "Layout Style", val: s.card_style || s.card_layout || "Classic Noir", icon: LayoutDashboard, path: "/dashboard/layout" },
    { name: "Background FX", val: s.bg_effect && s.bg_effect !== "none" ? s.bg_effect.replace(/_/g, " ") : "Clean Solid", icon: Wand2Icon, path: "/dashboard/profile" },
    { name: "Cursor Trail", val: s.cursor && s.cursor !== "default" ? s.cursor.replace(/_/g, " ") : "Default Pointer", icon: MousePointer2, path: "/dashboard/profile" },
    { name: "Music Embed", val: s.widgets?.music_player?.enabled ? (s.widgets.music_player.type || "Active") : (s.audio?.tracks?.length ? "MP3 Audio" : "Disabled"), icon: Music, path: "/dashboard/layout" },
    { name: "Discord Presence", val: dc || s.presence?.discord !== false ? "Live Sync" : "Inactive", icon: SiDiscord, path: "/dashboard/connections" },
    { name: "Gate Lock", val: s.enter_screen?.enabled || user?.locked ? "Protected" : "Instant Public", icon: Lock, path: "/dashboard/layout" },
  ];

  // 4. Action Shortcuts
  const quickActions = [
    { title: "Edit Main Profile", desc: "Avatar, banner, cursor & visual assets", icon: Palette, path: "/dashboard/profile", color: "text-[#5B8DB8]", bg: "bg-[#5B8DB8]/10" },
    { title: "Customize Layout", desc: "Card styles, radius, widgets & effects", icon: LayoutDashboard, path: "/dashboard/layout", color: "text-purple-400", bg: "bg-purple-400/10" },
    { title: "Manage Badges", desc: "Equip official badges & custom medals", icon: Award, path: "/dashboard/badges", color: "text-amber-400", bg: "bg-amber-400/10" },
    { title: "Links & Socials", desc: "Reorder links, drag & drop sorting", icon: Link2, path: "/dashboard/links", color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { title: "Community Templates", desc: "Discover, preview and equip themes", icon: Sparkles, path: "/dashboard/templates", color: "text-sky-400", bg: "bg-sky-400/10" },
    { title: "Analytics & Traffic", desc: "Inspect visitor counts & referrers", icon: BarChart3, path: "/dashboard/analytics", color: "text-rose-400", bg: "bg-rose-400/10" },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* 1. TOP HERO COMMAND CARD */}
      <div className="p-6 rounded-2xl bg-[#0c0e18] border border-white/10 relative overflow-hidden shadow-2xl">
        {/* Top ambient glow */}
        <div
          className="absolute -right-16 -top-16 w-64 h-64 rounded-full filter blur-3xl opacity-25 pointer-events-none"
          style={{ backgroundColor: accent }}
        />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 min-w-0">
            <MediaDisplay
              src={pfp}
              alt={user?.username}
              className="w-16 h-16 rounded-2xl object-cover border-2 shadow-xl shrink-0"
              style={{ borderColor: accent }}
            />
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold tracking-widest text-[#5B8DB8] mb-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Control Center</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-display flex items-center gap-2 truncate">
                <span>Welcome,</span>
                <span className="text-[#5B8DB8] truncate">{renderBioText(user?.display_name || user?.username)}</span>
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[#E5E7EB]/60 font-mono">swats.bio/{user?.username}</span>
                <button
                  type="button"
                  onClick={copyBioLink}
                  className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer border border-white/10"
                >
                  {copiedLink ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  <span>{copiedLink ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <Button
              type="button"
              onClick={() => window.open(bioUrl, "_blank")}
              className="flex-1 lg:flex-initial bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold h-9 px-4 rounded-xl gap-1.5 shadow-lg shadow-[#5B8DB8]/25 cursor-pointer transition-all hover:scale-105"
            >
              <ExternalLink size={14} /> View Live Bio
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/profile")}
              className="flex-1 lg:flex-initial border-white/15 bg-white/5 text-white hover:bg-white/10 text-xs h-9 px-4 rounded-xl font-semibold cursor-pointer"
            >
              <Palette size={14} className="mr-1 text-[#5B8DB8]" /> Edit Visuals
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowQrModal(true)}
              className="p-2.5 h-9 w-9 border-white/15 bg-white/5 text-white hover:bg-white/10 rounded-xl cursor-pointer"
              title="Generate QR Code"
            >
              <QrCode size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {quickStats.map((st) => (
          <div
            key={st.label}
            className="p-4 rounded-2xl bg-[#0c0e18] border border-white/10 flex flex-col justify-between space-y-2 hover:border-[#5B8DB8]/40 transition-all shadow-md group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#E5E7EB]/55 font-medium">{st.label}</span>
              <div className={`w-8 h-8 rounded-xl ${st.bg} ${st.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                <st.icon size={16} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-white font-mono tracking-tight">{st.value}</div>
              <div className="text-[10px] text-white/40 font-mono mt-0.5">{st.note}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. PROFILE HEALTH SCORE & LIVE CHECKLIST */}
      <div className="p-5 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <Sparkles size={14} className="text-[#5B8DB8]" />
              <span>Profile Completeness & Health</span>
            </div>
            <p className="text-[11px] text-white/50 mt-0.5">
              Complete these steps to maximize your bio's discovery, aesthetics, and engagement.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-sm font-mono font-black text-[#5B8DB8]">{healthPercent}%</span>
            <div className="w-28 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#5B8DB8] to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${healthPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Checklist items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {setupItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.path)}
              className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                item.done
                  ? "bg-emerald-500/5 border-emerald-500/20 text-white hover:border-emerald-500/40"
                  : "bg-white/[0.02] border-white/10 text-white/60 hover:text-white hover:border-[#5B8DB8]/50 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${item.done ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/40"}`}>
                  {item.done ? <Check size={11} className="stroke-[3]" /> : <Circle size={10} />}
                </div>
                <span className={`text-xs font-medium truncate ${item.done ? "text-white/90" : "text-white/70"}`}>
                  {item.label}
                </span>
              </div>
              <ArrowRight size={12} className="text-white/30 shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>

      {/* 4. ACTIVE AESTHETICS RADAR */}
      <div className="p-5 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <Sliders size={14} className="text-[#5B8DB8]" />
            <span>Active Aesthetic Modules</span>
          </div>
          <button
            type="button"
            onClick={() => navigate("/dashboard/layout")}
            className="text-[11px] text-[#5B8DB8] hover:underline font-medium"
          >
            Customize Layout →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {aestheticModules.map((mod) => (
            <button
              key={mod.name}
              type="button"
              onClick={() => navigate(mod.path)}
              className="p-3 rounded-xl bg-black/40 border border-white/5 hover:border-[#5B8DB8]/50 text-left transition-all group flex flex-col justify-between cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-white/40">{mod.name}</span>
                <mod.icon size={13} className="text-[#5B8DB8] group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-xs font-bold text-white capitalize truncate">
                {mod.val}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 5. CONNECTED INTEGRATIONS STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Discord Card */}
        <div className="p-4 rounded-2xl bg-[#0c0e18] border border-white/10 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5865F2]/20 text-[#5865F2] flex items-center justify-center shrink-0">
              <SiDiscord size={22} />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Discord Presence</span>
                {dc ? (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-semibold flex items-center gap-0.5">
                    <CheckCircle2 size={10} /> Connected
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 text-[9px]">Not Linked</span>
                )}
              </div>
              <div className="text-[11px] text-[#E5E7EB]/50 mt-0.5">
                {dc ? `@${dc.username} · Live status sync active` : "Link Discord to display nitro avatars & status"}
              </div>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => navigate("/dashboard/connections")}
            className="text-xs h-7 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 cursor-pointer"
          >
            Manage
          </Button>
        </div>

        {/* Spotify Card */}
        <div className="p-4 rounded-2xl bg-[#0c0e18] border border-white/10 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1DB954]/20 text-[#1DB954] flex items-center justify-center shrink-0">
              <SiSpotify size={22} />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Spotify Live Track</span>
                {sp ? (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-semibold flex items-center gap-0.5">
                    <CheckCircle2 size={10} /> Connected
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 text-[9px]">Not Linked</span>
                )}
              </div>
              <div className="text-[11px] text-[#E5E7EB]/50 mt-0.5">
                {sp ? "Broadcasting live playback on profile" : "Stream currently playing Spotify songs"}
              </div>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => navigate("/dashboard/connections")}
            className="text-xs h-7 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 cursor-pointer"
          >
            Manage
          </Button>
        </div>
      </div>

      {/* 6. QUICK CUSTOMIZATION TILES */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-[#E5E7EB]/50">
          Command Hub Shortcuts
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((qa) => (
            <button
              key={qa.title}
              type="button"
              onClick={() => navigate(qa.path)}
              className="p-4 rounded-2xl bg-[#0c0e18] border border-white/10 hover:border-[#5B8DB8]/50 hover:bg-[#111624] text-left transition-all group flex flex-col justify-between h-28 cursor-pointer shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className={`w-8 h-8 rounded-lg ${qa.bg} ${qa.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <qa.icon size={16} />
                </div>
                <ArrowUpRight size={14} className="text-white/30 group-hover:text-[#5B8DB8] transition-colors" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-[#5B8DB8] transition-colors">
                  {qa.title}
                </div>
                <div className="text-[11px] text-[#E5E7EB]/50 line-clamp-1 mt-0.5">
                  {qa.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[#0c0e18] border border-white/15 p-6 text-center space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <QrCode size={14} className="text-[#5B8DB8]" /> Profile QR Code
              </span>
              <button onClick={() => setShowQrModal(false)} className="text-white/50 hover:text-white text-xs">✕</button>
            </div>

            <div className="p-4 bg-white rounded-2xl mx-auto w-fit shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(bioUrl)}&bgcolor=ffffff&color=000000`}
                alt="QR Code"
                className="w-44 h-44 mx-auto"
              />
            </div>

            <div className="text-xs text-white/60 font-mono break-all px-2">
              {bioUrl}
            </div>

            <Button
              type="button"
              onClick={copyBioLink}
              className="w-full bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold h-9 rounded-xl gap-1.5"
            >
              <Copy size={13} /> Copy Profile URL
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Wand2Icon(props) {
  return <Sparkles {...props} />;
}
