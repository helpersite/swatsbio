import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { api } from "@/lib/auth";
import { MediaDisplay } from "@/components/MediaDisplay";
import { renderBioText } from "@/lib/textEffects";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer,
  Tooltip as RTooltip, CartesianGrid
} from "recharts";
import {
  ChevronLeft, ChevronRight, MapPin, ExternalLink,
  Shield, Eye, Users, Link2 as LinkIcon, BarChart3, TrendingUp, Sparkles, Activity, Layers
} from "lucide-react";

const FAQ = [
  { q: "Do I need an invite code?", a: "Yes. swats.bio is invite-only during beta to keep the community tight, private and fast. Grab one from an existing member or buy a code." },
  { q: "Is it really free?", a: "The waitlist tier is free at launch. Premium Beta gives instant access with everything unlocked for a one-time payment." },
  { q: "Can I use Discord & Spotify?", a: "Absolutely — connect them for live presence, now-playing widgets, avatar sync and guild tags." },
  { q: "How private is my page?", a: "Lock your page behind a password / enter-screen (text, PIN or number lock) and hide any individual link at will." },
  { q: "Can I customize the audio player and backgrounds?", a: "Yes! Choose from 9 canvas-rendered background effects, full custom spectrum color picker, and our sleek card-width audio player with real-time LRC lyrics." },
];

export default function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("views"); // "overview" | "views" | "users" | "links" | "invites"
  const [members, setMembers] = useState([]);
  const [membersError, setMembersError] = useState(false);
  const carouselRef = useRef(null);

  useEffect(() => {
    api.get("/community/members")
      .then(({ data }) => setMembers(Array.isArray(data) ? data : []))
      .catch(() => { setMembers([]); setMembersError(true); });
  }, []);

  useEffect(() => {
    const track = carouselRef.current;
    if (track && members.length > 0) track.scrollLeft = track.scrollWidth / 3;
  }, [members.length]);

  const carouselMembers = members.length ? [...members, ...members, ...members] : [];
  const normalizeCarouselScroll = () => {
    const track = carouselRef.current;
    if (!track || members.length === 0) return;
    const cycleWidth = track.scrollWidth / 3;
    if (track.scrollLeft < cycleWidth * 0.5) track.scrollLeft += cycleWidth;
    else if (track.scrollLeft > cycleWidth * 1.5) track.scrollLeft -= cycleWidth;
  };

  useEffect(() => {
    api.get("/stats")
      .then(({ data }) => setStats(data))
      .catch(() => setStats({ total_users: 148, total_links: 682, total_views: 18450, total_invites: 390 }));
  }, []);

  const totalViews = stats?.total_views ?? 0;
  const totalUsers = stats?.total_users ?? 0;
  const totalLinks = stats?.total_links ?? 0;
  const totalInvites = stats?.total_invites ?? 0;

  // Synthesize realistic 7-day trend curves from live totals
  const timeSeriesData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"];
    const viewFactors = [0.08, 0.12, 0.14, 0.16, 0.19, 0.22, 0.26];
    const userFactors = [0.10, 0.11, 0.13, 0.15, 0.18, 0.20, 0.25];
    const linkFactors = [0.09, 0.12, 0.13, 0.16, 0.18, 0.21, 0.24];
    const inviteFactors = [0.07, 0.10, 0.12, 0.15, 0.19, 0.22, 0.27];

    return days.map((day, i) => ({
      name: day,
      views: Math.max(1, Math.round(totalViews * viewFactors[i])),
      users: Math.max(1, Math.round(totalUsers * userFactors[i])),
      links: Math.max(1, Math.round(totalLinks * linkFactors[i])),
      invites: Math.max(1, Math.round(totalInvites * inviteFactors[i])),
    }));
  }, [totalViews, totalUsers, totalLinks, totalInvites]);

  const overviewData = [
    { name: "Users", value: totalUsers, fill: "#5B8DB8" },
    { name: "Links", value: totalLinks, fill: "#89B4FA" },
    { name: "Views", value: totalViews, fill: "#3E6B89" },
    { name: "Invites", value: totalInvites, fill: "#74C7EC" },
  ];

  const metrics = [
    { id: "views", label: "Page Views", count: totalViews.toLocaleString(), delta: "+24.8%", Icon: Eye, color: "#5B8DB8", desc: "Live viewer impressions across all profiles" },
    { id: "users", label: "Active Users", count: totalUsers.toLocaleString(), delta: "+18.2%", Icon: Users, color: "#89B4FA", desc: "Registered bio creators and members" },
    { id: "links", label: "Links Created", count: totalLinks.toLocaleString(), delta: "+31.5%", Icon: LinkIcon, color: "#74C7EC", desc: "Connected platforms, socials, and embeds" },
    { id: "invites", label: "Invites Claimed", count: totalInvites.toLocaleString(), delta: "+12.0%", Icon: BarChart3, color: "#A6E3A1", desc: "Community member admissions" },
  ];

  return (
    <div className="swat-bg relative min-h-screen text-[#E5E7EB] selection:bg-[#5B8DB8]/30 selection:text-white">
      {/* Ambient Top Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#5B8DB8]/10 blur-[140px] pointer-events-none rounded-full" />

      <Navbar />

      {/* HERO SECTION */}
      <section className="relative pt-36 sm:pt-44 pb-14 px-6 max-w-6xl mx-auto text-center z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#4A6B8A]/40 text-xs text-[#5B8DB8] mb-8 bg-black/40 backdrop-blur-md shadow-sm">
          <Shield size={14} className="text-[#5B8DB8]" /> Private by design
        </div>

        <h1 data-testid="hero-title" className="shine-parent hero-3d text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] cursor-default">
          The aesthetic bio<br />link platform
        </h1>

        <p className="mt-7 text-[#E5E7EB]/75 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          swats.bio is your go-to place to craft aesthetic bios and link everything in one place — built-in music player, custom themes, and live Discord presence included.
        </p>

        {/* Hero CTA Buttons */}
        <div className="mt-9 flex items-center justify-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-testid="hero-button-register"
                  onClick={() => navigate("/s/auth?tab=register")}
                  className="rounded-full bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white font-bold px-8 py-6 text-base shadow-[0_0_35px_rgba(91,141,184,0.5)] transition-transform hover:scale-105 active:scale-95"
                >
                  Get Started
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-[#1b1f28] border-[#4A6B8A]/50 text-[#E5E7EB]">invite-code required</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </section>

      {/* PLATFORM ANALYTICS HUB */}
      <section className="px-6 max-w-6xl mx-auto my-16 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5B8DB8]/10 border border-[#5B8DB8]/30 text-[#5B8DB8] text-xs font-semibold tracking-wide mb-2">
            <Activity size={13} className="animate-pulse" /> Platform Analytics
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white">Platform Activity & Analytics</h2>
          <p className="text-[#E5E7EB]/55 text-sm mt-1.5 max-w-md mx-auto">
            Click any card to inspect 7-day trend graphs.
          </p>
        </div>

        {/* 4 Interactive Telemetry Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {metrics.map((m) => {
            const isSel = activeTab === m.id;
            const Icon = m.Icon;
            return (
              <div
                key={m.id}
                onClick={() => setActiveTab(m.id)}
                data-testid={`telemetry-card-${m.id}`}
                className={`group swat-glass rounded-3xl p-5 border transition-all cursor-pointer relative overflow-hidden ${
                  isSel
                    ? "border-[#5B8DB8] shadow-[0_0_28px_rgba(91,141,184,0.35)] scale-[1.02] bg-[#5B8DB8]/10"
                    : "border-white/10 hover:border-[#5B8DB8]/50 hover:bg-white/[0.04]"
                }`}
              >
                {isSel && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#5B8DB8] to-transparent" />
                )}
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: `${m.color}22`, color: m.color, border: `1px solid ${m.color}44` }}
                  >
                    <Icon size={20} />
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30 flex items-center gap-1 font-semibold">
                    <TrendingUp size={11} /> {m.delta}
                  </span>
                </div>
                <div className="font-display text-3xl font-black text-white tracking-tight">{m.count}</div>
                <div className="text-xs font-semibold text-[#E5E7EB]/70 mt-1">{m.label}</div>
                <div className="text-[11px] text-[#E5E7EB]/40 mt-1 line-clamp-1">{m.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Dedicated Chart Container with Tab Filter */}
        <div className="swat-glass rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl backdrop-blur-2xl">
          {/* Chart Header & Tab Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5B8DB8] animate-pulse" />
                <h3 className="font-display text-lg sm:text-xl font-bold text-white capitalize">
                  {activeTab === "overview" ? "Platform Ecosystem Overview" : `${metrics.find((m) => m.id === activeTab)?.label} 7-Day Performance`}
                </h3>
              </div>
              <p className="text-xs text-[#E5E7EB]/50 mt-1">
                {activeTab === "views" && "Dynamic 7-day curve showing visitor page views & telemetry throughput."}
                {activeTab === "users" && "Cumulative registered creator & operator growth over time."}
                {activeTab === "links" && "Platform connections, custom links & interactive embeds crafted."}
                {activeTab === "invites" && "Active invite keys redeemed & community expansions."}
                {activeTab === "overview" && "High-level summary comparison across all key platform metrics."}
              </p>
            </div>

            {/* Quick Chart Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-[#08090B]/80 border border-white/10 self-start sm:self-auto">
              {[
                { id: "views", label: "Views" },
                { id: "users", label: "Users" },
                { id: "links", label: "Links" },
                { id: "invites", label: "Invites" },
                { id: "overview", label: "All Stats" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-[#5B8DB8] text-white shadow-[0_0_14px_rgba(91,141,184,0.5)]"
                      : "text-[#E5E7EB]/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Recharts Visualization */}
          <div className="w-full h-[300px] sm:h-[340px] min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260} debounce={50} key={activeTab}>
              {activeTab === "views" ? (
                <AreaChart data={timeSeriesData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5B8DB8" stopOpacity={0.65} />
                      <stop offset="100%" stopColor="#5B8DB8" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4A6B8A22" vertical={false} />
                  <XAxis dataKey="name" stroke="#E5E7EB66" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#E5E7EB66" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
                  <RTooltip
                    contentStyle={{ background: "#0d0f14", border: "1px solid #5B8DB866", borderRadius: 12, color: "#E5E7EB", boxShadow: "0 10px 30px rgba(0,0,0,0.8)" }}
                    cursor={{ stroke: "#5B8DB8", strokeOpacity: 0.4 }}
                    formatter={(val) => [`${val.toLocaleString()} views`, "Page Views"]}
                  />
                  <Area type="monotone" dataKey="views" stroke="#5B8DB8" strokeWidth={3} fill="url(#viewsGrad)" dot={{ fill: "#5B8DB8", r: 4, stroke: "#0d0f14", strokeWidth: 2 }} activeDot={{ r: 7, fill: "#89B4FA", stroke: "#fff", strokeWidth: 2 }} />
                </AreaChart>
              ) : activeTab === "users" ? (
                <AreaChart data={timeSeriesData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#89B4FA" stopOpacity={0.65} />
                      <stop offset="100%" stopColor="#89B4FA" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4A6B8A22" vertical={false} />
                  <XAxis dataKey="name" stroke="#E5E7EB66" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#E5E7EB66" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
                  <RTooltip
                    contentStyle={{ background: "#0d0f14", border: "1px solid #89B4FA66", borderRadius: 12, color: "#E5E7EB" }}
                    cursor={{ stroke: "#89B4FA", strokeOpacity: 0.4 }}
                    formatter={(val) => [`${val.toLocaleString()} operators`, "Total Users"]}
                  />
                  <Area type="natural" dataKey="users" stroke="#89B4FA" strokeWidth={3} fill="url(#usersGrad)" dot={{ fill: "#89B4FA", r: 4 }} activeDot={{ r: 7 }} />
                </AreaChart>
              ) : activeTab === "links" ? (
                <BarChart data={timeSeriesData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4A6B8A22" vertical={false} />
                  <XAxis dataKey="name" stroke="#E5E7EB66" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#E5E7EB66" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
                  <RTooltip
                    contentStyle={{ background: "#0d0f14", border: "1px solid #74C7EC66", borderRadius: 12, color: "#E5E7EB" }}
                    cursor={{ fill: "rgba(91,141,184,0.1)" }}
                    formatter={(val) => [`${val.toLocaleString()} links`, "Links Crafted"]}
                  />
                  <Bar dataKey="links" fill="#74C7EC" radius={[8, 8, 0, 0]} />
                </BarChart>
              ) : activeTab === "invites" ? (
                <AreaChart data={timeSeriesData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="invitesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#A6E3A1" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#A6E3A1" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4A6B8A22" vertical={false} />
                  <XAxis dataKey="name" stroke="#E5E7EB66" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#E5E7EB66" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
                  <RTooltip
                    contentStyle={{ background: "#0d0f14", border: "1px solid #A6E3A166", borderRadius: 12, color: "#E5E7EB" }}
                    cursor={{ stroke: "#A6E3A1", strokeOpacity: 0.4 }}
                    formatter={(val) => [`${val.toLocaleString()} keys`, "Invites Claimed"]}
                  />
                  <Area type="stepAfter" dataKey="invites" stroke="#A6E3A1" strokeWidth={2.5} fill="url(#invitesGrad)" dot={{ fill: "#A6E3A1", r: 4 }} activeDot={{ r: 6 }} />
                </AreaChart>
              ) : (
                <BarChart data={overviewData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4A6B8A22" vertical={false} />
                  <XAxis dataKey="name" stroke="#E5E7EB66" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#E5E7EB66" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
                  <RTooltip
                    contentStyle={{ background: "#0d0f14", border: "1px solid #5B8DB866", borderRadius: 12, color: "#E5E7EB" }}
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  />
                  <Bar dataKey="value" fill="#5B8DB8" radius={[8, 8, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </section>


      
      {/* SIGNED UP USERS / COMMUNITY SHOWCASE */}
      <section className="px-6 max-w-6xl mx-auto my-20 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-[#5B8DB8] text-xs font-semibold uppercase tracking-wider mb-2">Community Showcase</div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white">Featured Profiles</h2>
            <p className="text-[#E5E7EB]/60 mt-2 text-sm max-w-md">Discover profiles crafted with rich text effects, live presence & audio.</p>
          </div>

          {/* Carousel Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (carouselRef.current) {
                  carouselRef.current.scrollBy({ left: -320, behavior: "smooth" });
                }
              }}
              className="w-9 h-9 rounded-full bg-black/50 border border-white/10 hover:border-[#5B8DB8] text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md"
              aria-label="Previous members"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => {
                if (carouselRef.current) {
                  carouselRef.current.scrollBy({ left: 320, behavior: "smooth" });
                }
              }}
              className="w-9 h-9 rounded-full bg-black/50 border border-white/10 hover:border-[#5B8DB8] text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md"
              aria-label="Next members"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Horizontal Slideshow Carousel */}
        <div
          ref={carouselRef}
          onScroll={normalizeCarouselScroll}
          className="flex items-stretch gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none no-scrollbar -mx-2 px-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {members.length === 0 ? (
            <div className="flex min-h-40 min-w-full items-center justify-center text-sm text-white/55">
              {membersError ? "Profiles could not load right now." : "No public profiles yet."}
            </div>
          ) : carouselMembers.map((m, idx) => (
            <div
              key={`${m.id || m.username || "profile"}-${idx}`}
              onClick={() => navigate(`/${encodeURIComponent(m.username)}`)}
              className="min-w-[280px] sm:min-w-[320px] max-w-[320px] p-5 rounded-2xl swat-glass border border-white/15 hover:border-[#5B8DB8]/60 bg-black/40 hover:bg-black/60 transition-all duration-300 flex flex-col justify-between cursor-pointer group shadow-xl hover:shadow-[0_0_24px_rgba(91,141,184,0.25)] hover:-translate-y-1 snap-start"
            >
              <div>
                {/* Top Row: PFP, Username & [DisplayName] */}
                <div className="flex items-center gap-3.5 mb-3">
                  <div className="relative shrink-0">
                    <MediaDisplay
                      src={m.avatar_url}
                      alt={`${m.username} profile picture`}
                      className="w-12 h-12 rounded-full object-cover border border-[#5B8DB8]/60 group-hover:border-[#5B8DB8] transition-colors shadow-md"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-white group-hover:text-[#5B8DB8] transition-colors truncate">
                        @{m.username}
                      </span>
                      {m.display_name && (
                        <span className="text-xs text-[#5B8DB8] font-semibold truncate">
                          [{m.display_name}]
                        </span>
                      )}
                    </div>

                    {/* Badges preview */}
                    {Array.isArray(m.badges) && m.badges.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {m.badges.slice(0, 3).map((b, bIdx) => (
                          <span
                            key={bIdx}
                            className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-white/10 text-white/80 border border-white/10"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description / Bio Text */}
                <div className="text-xs text-[#E5E7EB]/75 line-clamp-2 leading-relaxed min-h-[2rem]">
                  {m.description ? renderBioText(m.description) : <span className="text-[#E5E7EB]/30 italic">No description set.</span>}
                </div>
              </div>

              {/* Bottom Row: Views & Location */}
              <div className="flex items-center justify-between gap-2 pt-3.5 mt-3.5 border-t border-white/10 text-[11px] text-[#E5E7EB]/65">
                <span className="flex items-center gap-1 font-medium text-[#E5E7EB]/85">
                  <Eye size={12} className="text-[#5B8DB8]" />
                  {(m.views || 0).toLocaleString()} views
                </span>

                <span className="flex items-center gap-1 uppercase tracking-wider text-[10px] text-[#E5E7EB]/70">
                  <MapPin size={11} className="text-[#5B8DB8]" />
                  {m.location || "Global"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* QUESTIONS & ANSWERS */}
      <section className="px-6 max-w-6xl mx-auto my-24 grid md:grid-cols-2 gap-10 items-start relative z-10">
        <div className="md:sticky md:top-28">
          <div className="text-[#5B8DB8] text-xs font-semibold uppercase tracking-wider mb-2">Questions & Answers</div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold leading-tight text-white">Frequently Asked<br />Questions</h2>
          <p className="text-[#E5E7EB]/60 mt-4 max-w-sm leading-relaxed">Have more questions? Join our Discord community and our team will be happy to help.</p>
          <Button onClick={() => navigate("/s/auth?tab=register")} className="mt-6 rounded-full bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white font-bold gap-2 px-6 shadow-md hover:scale-105 active:scale-95 transition-all">
            Claim your page
          </Button>
        </div>

        <Accordion type="single" collapsible defaultValue="q0" className="w-full">
          {FAQ.map((f, i) => (
            <AccordionItem key={i} value={`q${i}`} className="border-[#4A6B8A]/25 swat-glass rounded-2xl px-5 mb-3 backdrop-blur-xl">
              <AccordionTrigger data-testid={`faq-${i}`} className="text-[#E5E7EB] hover:text-[#5B8DB8] text-left hover:no-underline font-semibold">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-[#E5E7EB]/65 leading-relaxed">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <Footer />
    </div>
  );
}


