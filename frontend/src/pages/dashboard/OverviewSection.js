import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, fileUrl } from "@/lib/auth";
import { renderBioText } from "@/lib/textEffects";
import { MediaDisplay } from "@/components/MediaDisplay";
import { Button } from "@/components/ui/button";
import {
  Eye, ExternalLink, Sparkles, LayoutDashboard, Link2,
  ShieldCheck, Award, MessageSquare, Wrench, BarChart3,
  TrendingUp, Users, CheckCircle2, ArrowUpRight, Palette
} from "lucide-react";
import { SiDiscord, SiSpotify } from "react-icons/si";

export function OverviewSection() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const pfp = fileUrl(user?.settings?.pfp) || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`;
  const views = user?.views || user?.settings?.views || 0;
  const dc = user?.connections?.discord;
  const sp = user?.connections?.spotify;

  const quickStats = [
    { label: "Profile Views", value: Number(views).toLocaleString(), icon: Eye, color: "text-[#5B8DB8]", bg: "bg-[#5B8DB8]/15" },
    { label: "Badges Earned", value: (user?.badges?.length || 0), icon: Award, color: "text-amber-400", bg: "bg-amber-400/15" },
    { label: "Active Links", value: (user?.settings?.links?.length || Object.keys(user?.settings?.socials || {}).length || 0), icon: Link2, color: "text-emerald-400", bg: "bg-emerald-400/15" },
    { label: "Account Tier", value: user?.role === "admin" ? "Admin" : (user?.is_premium ? "VIP Elite" : "Standard"), icon: ShieldCheck, color: "text-purple-400", bg: "bg-purple-400/15" },
  ];

  const quickActions = [
    { title: "Edit Main Profile", desc: "Change avatar, banner, cursor & background media", icon: Palette, path: "/dashboard/profile" },
    { title: "Customize Layout", desc: "Select classic, minimal, banner, or slideshow deck", icon: LayoutDashboard, path: "/dashboard/layout" },
    { title: "Manage Badges", desc: "Display Discord Nitro & custom platform achievements", icon: Award, path: "/dashboard/badges" },
    { title: "Links & Socials", desc: "Configure Discord, Spotify, Telegram & custom buttons", icon: Link2, path: "/dashboard/links" },
    { title: "Studio & Tools", desc: "Background MP3 tracks, LRC lyrics & audio visualizer", icon: Wrench, path: "/dashboard/tools" },
    { title: "Analytics & Traffic", desc: "Inspect visitor referrers, devices & weekly growth", icon: BarChart3, path: "/dashboard/analytics" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome Hero Card */}
      <div className="p-6 rounded-2xl bg-[#0c0e15] border border-white/10 relative overflow-hidden shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <MediaDisplay
              src={pfp}
              alt={user?.username}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-[#5B8DB8]/60 shadow-[0_0_20px_rgba(91,141,184,0.3)]"
            />
            <div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-[#5B8DB8] mb-0.5">
                Dashboard Overview
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-display flex items-center gap-2">
                <span>Welcome back,</span>
                <span className="text-[#5B8DB8]">{renderBioText(user?.display_name || user?.username)}</span>
              </h2>
              <div className="text-xs text-[#E5E7EB]/60 font-mono mt-0.5">
                swats.bio/{user?.username}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <a
              href={`/${encodeURIComponent(user?.username)}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 h-9 rounded-xl bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(91,141,184,0.35)]"
            >
              <ExternalLink size={14} /> View Public Bio
            </a>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/profile")}
              className="border-white/15 bg-white/5 text-white hover:bg-white/10 text-xs h-9 rounded-xl font-semibold"
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {quickStats.map((st) => (
          <div
            key={st.label}
            className="p-4 rounded-2xl bg-[#0c0e15] border border-white/10 flex items-center justify-between"
          >
            <div>
              <div className="text-[11px] text-[#E5E7EB]/55 font-medium">{st.label}</div>
              <div className="text-xl font-black text-white font-mono mt-0.5">{st.value}</div>
            </div>
            <div className={`w-10 h-10 rounded-xl ${st.bg} ${st.color} flex items-center justify-center shrink-0`}>
              <st.icon size={20} />
            </div>
          </div>
        ))}
      </div>

      {/* Connected Integrations Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Discord Card */}
        <div className="p-4 rounded-2xl bg-[#0c0e15] border border-white/10 flex items-center justify-between">
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
            className="text-xs h-7 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/10"
          >
            Manage
          </Button>
        </div>

        {/* Spotify Card */}
        <div className="p-4 rounded-2xl bg-[#0c0e15] border border-white/10 flex items-center justify-between">
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
            className="text-xs h-7 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/10"
          >
            Manage
          </Button>
        </div>
      </div>

      {/* Quick Access Shortcuts Grid */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-[#E5E7EB]/50">
          Quick Customization Shortcuts
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((qa) => (
            <button
              key={qa.title}
              type="button"
              onClick={() => navigate(qa.path)}
              className="p-4 rounded-2xl bg-[#0c0e15] border border-white/10 hover:border-[#5B8DB8]/50 hover:bg-[#111624] text-left transition-all group flex flex-col justify-between h-28 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#5B8DB8]/15 text-[#5B8DB8] flex items-center justify-center group-hover:scale-110 transition-transform">
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
    </div>
  );
}
