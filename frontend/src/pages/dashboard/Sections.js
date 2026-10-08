import React, { useEffect, useState, useRef, useMemo } from "react";
import { useAuth, api, fileUrl } from "@/lib/auth";
import { Header, Panel, ToggleRow, SliderRow, SelectRow, ColorRow } from "@/components/DashboardUI";
import { BADGE_DEFS, BADGE_CATEGORIES, BADGE_ICON_CATALOG } from "@/pages/dashboard/badges";
import { brandIcon, BRAND_COLORS } from "@/lib/brandIcons";
import { renderBioText, stripEffectSyntax } from "@/lib/textEffects";
import { getDiscordBadges, DISCORD_BADGES_CATALOG, DiscordBadgeIcon } from "@/lib/discordBadges";
import { PLATFORM_FIELDS, FIELD_META, ALL_PLATFORMS, AUTO_FETCH_PLATFORMS } from "@/lib/linkConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip as RTooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import * as Icons from "lucide-react";
import { Eye, EyeOff, X, Plus, Trophy, Lock, Pencil, Upload, Link2, TrendingUp, Sparkles, Loader2, ExternalLink, Award, ShieldCheck, Shield, Check, Copy, Search, Users, Trash2, HelpCircle, Activity, Rocket, Palette, Sun, Disc3 } from "lucide-react";
import CustomColorPicker from "@/components/ColorPicker";

async function uploadFile(file) {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
  return data.url;
}

function Hint({ text, children }) {
  return (
    <TooltipProvider><Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="bg-[#202329] border-[#4A6B8A]/40 text-[#E5E7EB] text-xs max-w-xs">{text}</TooltipContent>
    </Tooltip></TooltipProvider>
  );
}

/* ---------------- Settings & Themes ---------------- */
const DASHBOARD_THEMES = [
  { id: "theme-monochrome-noir", name: "Onyx Noir (Default)", desc: "Fully black background with crisp white/grey gradients and luxury glass accents.", color: "#E5E7EB", bg: "#050608", preview: "linear-gradient(135deg, #050608 0%, #17191e 50%, #050608 100%)", border: "rgba(255,255,255,0.2)", button: "#4B5563", hover: "#374151" },
  { id: "theme-midnight-platinum", name: "Midnight Platinum", desc: "Charcoal tones with restrained silver highlights.", color: "#94A3B8", bg: "#0b0d11", preview: "linear-gradient(135deg, #0b0d11 0%, #1e293b 50%, #0b0d11 100%)", border: "rgba(148,163,184,0.3)", button: "#475569", hover: "#334155" },
  { id: "theme-cyber-abyss", name: "Abyssal Cyan", desc: "Deep black with clear cyan accents.", color: "#06B6D4", bg: "#030712", preview: "linear-gradient(135deg, #030712 0%, #083344 50%, #030712 100%)", border: "rgba(6,182,212,0.4)", button: "#0E7490", hover: "#155E75" },
  { id: "theme-violet-nebula", name: "Violet Nebula", desc: "Dark obsidian with glowing purple and magenta glass reflections.", color: "#A855F7", bg: "#07040d", preview: "linear-gradient(135deg, #07040d 0%, #3b0764 50%, #07040d 100%)", border: "rgba(168,85,247,0.4)", button: "#7E22CE", hover: "#6B21A8" },
  { id: "theme-emerald-matrix", name: "Emerald", desc: "Deep green with mint highlights.", color: "#10B981", bg: "#020b06", preview: "linear-gradient(135deg, #020b06 0%, #064e3b 50%, #020b06 100%)", border: "rgba(16,185,129,0.4)", button: "#047857", hover: "#065F46" },
  { id: "theme-crimson-eclipse", name: "Crimson Eclipse", desc: "Obsidian noir paired with blood ruby and sunset rose glowing accents.", color: "#EF4444", bg: "#0d0406", preview: "linear-gradient(135deg, #0d0406 0%, #4c0519 50%, #0d0406 100%)", border: "rgba(239,68,68,0.4)", button: "#B91C1C", hover: "#991B1B" },
];

const DASHBOARD_THEME_IDS = DASHBOARD_THEMES.map((theme) => theme.id);

export function SettingsSection() {
  const { user, setUser } = useAuth();
  const [displayName, setDisplayName] = useState(user.display_name || "");
  const [location, setLocation] = useState(user.settings?.location || "");
  const themeStorageKey = `dashboard_theme_${user.id}`;
  const [currentTheme, setCurrentTheme] = useState(
    typeof window !== "undefined"
      ? (user.settings?.dashboard_theme || localStorage.getItem(themeStorageKey) || "theme-monochrome-noir")
      : "theme-monochrome-noir"
  );
  const [pw, setPw] = useState(false);

  const applyTheme = (themeId) => {
    setCurrentTheme(themeId);
    if (typeof window !== "undefined") {
      localStorage.setItem(themeStorageKey, themeId);
      document.documentElement.classList.remove(...DASHBOARD_THEME_IDS);
      document.documentElement.classList.add(themeId);
    }
  };

  const save = async () => {
    const payload = {
      display_name: displayName,
      settings: {
        ...(user.settings || {}),
        location: location.trim(),
        dashboard_theme: currentTheme,
      },
    };
    const { data } = await api.put("/profile", payload);
    setUser(data);
    toast.success("Settings and theme preferences saved.");
  };

  return (
    <div>
      <Header title="Dashboard Settings" subtitle="Configure your account preferences, profile details, and dashboard visual themes." />
      <div className="mt-6">
        <Tabs defaultValue="themes">
          <TabsList className="bg-[#08090B]/60 border border-white/10">
            <TabsTrigger value="themes" data-testid="settings-tab-themes">Themes & Appearance</TabsTrigger>
            <TabsTrigger value="account" data-testid="settings-tab-account">Account info</TabsTrigger>
            <TabsTrigger value="locker" data-testid="settings-tab-locker">Password locker</TabsTrigger>
            <TabsTrigger value="stats" data-testid="settings-tab-stats">View stats</TabsTrigger>
          </TabsList>

          <TabsContent value="themes" className="mt-4">
            <Panel title="Dashboard Theme Studio">
              <p className="text-xs text-[#E5E7EB]/60 mb-2">
                Choose your custom dashboard visual styling. The default theme is a deep black background accented with a monochromatic white/grey luxury gradient.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-3">
                {DASHBOARD_THEMES.map((th) => {
                  const active = currentTheme === th.id;
                  return (
                    <button
                      key={th.id}
                      onClick={() => applyTheme(th.id)}
                      type="button"
                      aria-pressed={active}
                      className={`w-full text-left p-4 rounded-lg cursor-pointer transition-all duration-200 relative overflow-hidden border ${active ? "ring-2 ring-white/60 shadow-2xl scale-[1.02]" : "hover:scale-[1.01] hover:border-white/25"}`}
                      style={{
                        background: th.preview,
                        borderColor: active ? th.color : "rgba(255,255,255,0.12)",
                      }}
                    >
                      {active && (
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-md">
                          Active
                        </span>
                      )}
                      <div className="flex items-center gap-2.5 mb-2">
                        <span className="w-4 h-4 rounded-full border border-white/20" style={{ background: th.color, boxShadow: `0 0 10px ${th.color}` }} />
                        <h4 className="text-sm font-bold text-white">{th.name}</h4>
                      </div>
                      <p className="text-[11px] text-[#E5E7EB]/70 leading-relaxed font-normal">{th.desc}</p>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
                <Button onClick={save} className="bg-white/15 hover:bg-white/25 text-white border border-white/20">
                  Save Theme as Default
                </Button>
              </div>
            </Panel>
          </TabsContent>

          <TabsContent value="account" className="mt-4">
            <Panel title="Account info">
              <div><Label className="text-[#E5E7EB]/70 text-xs">Email</Label><Input disabled value={user.email} className="bg-[#08090B]/60 border-white/10 mt-1.5 opacity-60" /></div>
              <div><Label className="text-[#E5E7EB]/70 text-xs">Display name</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-[#08090B]/60 border-white/10 mt-1.5" /></div>
              <div><Label className="text-[#E5E7EB]/70 text-xs">Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. London, UK" className="bg-[#08090B]/60 border-white/10 mt-1.5" /></div>
              <div><Label className="text-[#E5E7EB]/70 text-xs">Username</Label><Input disabled value={"@" + user.username} className="bg-[#08090B]/60 border-white/10 mt-1.5 opacity-60" /></div>
              <Button onClick={save} className="bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white">Save Changes</Button>
            </Panel>
          </TabsContent>

          <TabsContent value="locker" className="mt-4">
            <Panel title="Password locker">
              <p className="text-sm text-[#E5E7EB]/55">Lock your bio behind a password — set it up in the Bio Editor → Enter screen. Visitors must pass it to view your page.</p>
              <ToggleRow label="Enable page lock reminder" checked={pw} onChange={setPw} testid="locker-toggle" />
            </Panel>
          </TabsContent>

          <TabsContent value="stats" className="mt-4">
            <MyStatsSection embed />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ---------------- Connections ---------------- */
export function ConnectionsSection() {
  const { user, refresh, setUser } = useAuth();
  const [checkingBooster, setCheckingBooster] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("spotify");
    const d = params.get("discord");
    if (p === "connected") { toast.success("Spotify connected!"); refresh(); }
    else if (p === "failed") toast.error("Spotify connection failed or isn't configured.");
    if (d === "connected") { toast.success("Discord connected!"); refresh(); }
    else if (d === "failed") toast.error("Discord connection failed or isn't configured.");
    if (p || d) {
      params.delete("spotify");
      params.delete("discord");
      params.delete("token");
      const rem = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (rem ? `?${rem}` : ""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spotify = user.connections?.spotify;
  const discord = user.connections?.discord;
  const isBooster = (user.badges || []).includes("booster");

  const connectSpotify = async () => {
    try {
      const { data } = await api.get("/connect/spotify/login");
      window.location.href = data.url;
    } catch (error) {
      const detail = error.response?.data?.detail || "Spotify connection could not start.";
      toast.error(detail.toLowerCase().includes("not configured")
        ? "Spotify is not enabled on the production server. Configure the Spotify client credentials and register the production callback URL."
        : detail);
    }
  };
  const disconnectSpotify = async () => { await api.post("/connect/spotify/disconnect"); await refresh(); toast.success("Spotify disconnected."); };
  const connectDiscord = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("swats_token") : null;
      const { data } = await api.get(`/auth/discord/login${token ? `?token=${encodeURIComponent(token)}` : ""}`);
      window.location.href = data.url;
    } catch (e) {
      toast.info(e.response?.data?.detail || "Discord login isn't configured yet.");
    }
  };
  const disconnectDiscord = async () => {
    try {
      await api.post("/connect/discord/disconnect");
      await refresh();
      toast.success("Discord disconnected.");
    } catch {
      toast.error("Failed to disconnect Discord.");
    }
  };

  const checkBooster = async () => {
    if (!discord) return toast.info("Connect Discord first to verify booster perks.");
    setCheckingBooster(true);
    try {
      const { data } = await api.post("/connect/discord/check-booster");
      if (data.boosting || data.badge_added || data.has_badge) {
        setUser((u) => ({ ...u, badges: data.badges || [...(u.badges || []), "booster"] }));
        toast.success(data.message || "Discord booster verified! Server booster badge granted 🚀");
      } else {
        toast.info(data.message || "Connected Discord is not currently boosting the server.");
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to verify Discord booster status.");
    } finally {
      setCheckingBooster(false);
    }
  };

  const items = [
    { id: "discord", name: "Discord", color: "#5865F2", desc: "Sync presence, avatar & badges.", connected: !!discord, sub: discord?.username, onConnect: connectDiscord, onDisconnect: disconnectDiscord },
    { id: "spotify", name: "Spotify", color: "#1DB954", desc: "Show your live now-playing track.", connected: !!spotify, sub: spotify?.display_name, onConnect: connectSpotify, onDisconnect: disconnectSpotify },
  ];

  return (
    <div className="space-y-6">
      <Header title="Connections" subtitle="Authenticate accounts to unlock live presence." />
      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((c) => {
          const Ic = brandIcon(c.id);
          return (
            <div key={c.id} className="swat-glass rounded-2xl p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${c.color}22`, color: c.color }}><Ic size={20} /></div>
              <div className="flex-1 min-w-0"><div className="font-semibold">{c.name}</div><div className="text-xs text-[#E5E7EB]/50 truncate">{c.connected ? `Connected${c.sub ? " · " + c.sub : ""}` : c.desc}</div></div>
              {c.connected ? (c.onDisconnect ? <Button data-testid={`disconnect-${c.id}`} onClick={c.onDisconnect} size="sm" variant="outline" className="border-red-500/40 text-red-400 rounded-full">Disconnect</Button> : <span className="text-green-400 text-sm">✓ linked</span>)
                : <Button data-testid={`connect-${c.id}`} onClick={c.onConnect} size="sm" variant="outline" className="border-[#4A6B8A]/40 rounded-full">Connect</Button>}
            </div>
          );
        })}
      </div>

      {/* Discord Server Booster Verification Card */}
      <div className="swat-glass rounded-2xl p-5 border border-[#5865F2]/30 bg-gradient-to-r from-[#5865F2]/10 via-[#a855f7]/10 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#a855f7]/20 border border-[#a855f7]/40 text-[#a855f7] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Rocket size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="font-display font-bold text-white text-sm flex items-center gap-2">
              <span>Discord Server Booster Perk</span>
              {isBooster ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">VERIFIED BOOSTER</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/30 text-[10px] font-mono">AUTOMATIC BADGE</span>
              )}
            </div>
            <div className="text-xs text-[#E5E7EB]/60 mt-0.5">
              Boosting our official Discord server unlocks the exclusive animated Rocket booster badge.
            </div>
          </div>
        </div>
        <Button
          onClick={checkBooster}
          disabled={checkingBooster || !discord}
          className="rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-semibold px-4 py-2 shrink-0 gap-1.5 shadow-[0_0_15px_rgba(88,101,242,0.4)]"
        >
          {checkingBooster ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {isBooster ? "Re-sync Booster" : "Check Booster Status"}
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Security ---------------- */
export function SecuritySection() {
  const [cur, setCur] = useState(""); const [nw, setNw] = useState(""); const [busy, setBusy] = useState(false);
  const change = async () => {
    if (!cur || !nw) return toast.error("Fill both fields");
    setBusy(true);
    try { await api.post("/auth/change-password", { current_password: cur, new_password: nw }); setCur(""); setNw(""); toast.success("Password updated."); }
    catch (e) { toast.error(e.response?.data?.detail || "Failed"); } finally { setBusy(false); }
  };
  return (
    <div>
      <Header title="Security" subtitle="Keep your account locked down." />
      <div className="space-y-4 mt-6">
        <Panel title="Change password">
          <div><Label className="text-[#E5E7EB]/70 text-xs">Current password</Label><Input data-testid="sec-current-pw" type="password" value={cur} onChange={(e) => setCur(e.target.value)} className="bg-[#08090B]/60 border-[#4A6B8A]/30 mt-1.5" /></div>
          <div><Label className="text-[#E5E7EB]/70 text-xs">New password</Label><Input data-testid="sec-new-pw" type="password" value={nw} onChange={(e) => setNw(e.target.value)} className="bg-[#08090B]/60 border-[#4A6B8A]/30 mt-1.5" /></div>
          <Button data-testid="sec-change-pw" onClick={change} disabled={busy} className="bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white gap-2"><Lock size={15} /> {busy ? "..." : "Update password"}</Button>
        </Panel>
        <Panel title="Two-factor authentication">
          <ToggleRow label="Enable 2FA (authenticator app)" checked={false} onChange={() => toast.info("2FA coming soon.")} testid="2fa-toggle" />
        </Panel>
      </div>
    </div>
  );
}

/* ---------------- Links ---------------- */
const PLATFORM_LABELS = {
  discord: "Discord",
  twitter: "Twitter / X",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  twitch: "Twitch",
  kick: "Kick",
  github: "GitHub",
  spotify: "Spotify",
  soundcloud: "SoundCloud",
  apple: "Apple Music",
  steam: "Steam",
  psn: "PlayStation",
  xbox: "Xbox",
  roblox: "Roblox",
  riot: "Riot Games",
  epic: "Epic Games",
  battlenet: "Battle.net",
  telegram: "Telegram",
  snapchat: "Snapchat",
  reddit: "Reddit",
  pinterest: "Pinterest",
  threads: "Threads",
  bluesky: "Bluesky",
  linkedin: "LinkedIn",
  patreon: "Patreon",
  website: "Website",
  shop: "Shop",
  other: "Other / Custom",
};

export function LinksSection() {
  const { user, setUser } = useAuth();
  const [links, setLinks] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [tabFilter, setTabFilter] = useState("all"); // "all" | "cards" | "icons" | "embeds"
  const [showOptions, setShowOptions] = useState(false);
  const [form, setForm] = useState({ platform: "discord", label: "", url: "" });
  const load = () => api.get("/links").then(({ data }) => setLinks(Array.isArray(data) ? data : [])).catch(() => setLinks([]));
  useEffect(() => { load(); }, []);

  const s = user.settings || {};
  const patchSetting = async (key, val) => {
    const nextSettings = { ...(user.settings || {}), [key]: val };
    try {
      const { data } = await api.put("/profile", { settings: nextSettings });
      setUser(data);
      toast.success("Link display settings saved.");
    } catch {
      toast.error("Failed to save settings.");
    }
  };

  const EMBED_PLATFORMS = ["spotify", "soundcloud", "youtube", "twitch", "kick", "apple", "apple_music"];
  const canAutoFetch = AUTO_FETCH_PLATFORMS.includes(form.platform);

  const add = async () => {
    if (!form.url) return toast.error("Enter a username or URL");
    let initialConfig = {};
    let initialLabel = form.label || PLATFORM_LABELS[form.platform] || form.platform;
    let initialUrl = form.url;

    if (canAutoFetch) {
      try {
        const { data } = await api.get(`/links/lookup?platform=${form.platform}&query=${encodeURIComponent(form.url)}`);
        if (data) {
          if (data.url) initialUrl = data.url;
          if (data.label) initialLabel = data.label;
          if (data.username) { initialConfig.username = true; initialConfig.username_text = data.username; }
          if (data.avatar_url) { initialConfig.avatar = true; initialConfig.avatar_url = data.avatar_url; }
          if (data.details?.followers) { initialConfig.followers = true; initialConfig.followers_value = data.details.followers; }
          if (data.details?.karma) { initialConfig.karma = true; initialConfig.karma_value = data.details.karma; }
          if (data.details?.members) { initialConfig.followers = true; initialConfig.followers_value = data.details.members; }
          if (data.details?.status) { initialConfig.status = true; initialConfig.status_value = data.details.status; }
        }
      } catch {
        toast.info("Link added. Fill in its details manually.");
      }
    }

    const { data } = await api.post("/links", { platform: form.platform, label: initialLabel, url: initialUrl, hidden: false, config: initialConfig });
    setOpen(false);
    setForm({ platform: "discord", label: "", url: "" });
    await load();
    setEditing(data);
    toast.success(canAutoFetch ? "Link added with available profile details." : "Link added.");
  };

  const remove = async (id) => { await api.delete(`/links/${id}`); load(); };
  const toggleHide = async (l) => { await api.put(`/links/${l.id}`, { hidden: !l.hidden }); load(); };

  const counts = useMemo(() => {
    return {
      all: links.length,
      cards: links.filter((l) => l.config?.display_as !== "icon").length,
      icons: links.filter((l) => l.config?.display_as === "icon" || l.config?.display_as === "both" || !l.config?.display_as).length,
      embeds: links.filter((l) => EMBED_PLATFORMS.includes(l.platform)).length,
    };
  }, [links]);

  const filteredLinks = useMemo(() => {
    return links.filter((l) => {
      if (tabFilter === "cards" && l.config?.display_as === "icon") return false;
      if (tabFilter === "icons" && l.config?.display_as === "card") return false;
      if (tabFilter === "embeds" && !EMBED_PLATFORMS.includes(l.platform)) return false;

      if (!search) return true;
      return (
        (l.label || "").toLowerCase().includes(search.toLowerCase()) ||
        (l.platform || "").toLowerCase().includes(search.toLowerCase()) ||
        (l.url || "").toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [links, tabFilter, search]);

  return (
    <div className="space-y-6">
      <Header title="Links & Media Blocks" subtitle="Manage link cards, social icon rows, and rich embeds with custom colors & glow." action={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowOptions(!showOptions)}
            className={`rounded-full border-[#4A6B8A]/40 text-xs gap-1.5 transition-all ${
              showOptions ? "bg-[#5B8DB8]/20 border-[#5B8DB8] text-[#5B8DB8]" : "text-[#E5E7EB]"
            }`}
          >
            <Palette size={14} /> Link & Social Styles
          </Button>
          <Button data-testid="bio-editor-add-link-button" onClick={() => setOpen(true)} className="rounded-full bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white gap-2 shadow-[0_0_16px_rgba(91,141,184,0.3)]"><Plus size={16} /> Add link</Button>
        </div>
      } />

      {/* Link Presentation & Social Button Options Panel */}
      {showOptions && (
        <div className="swat-glass rounded-3xl p-6 border border-[#5B8DB8]/35 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#5B8DB8]" />
              <span className="font-display font-bold text-white text-sm">Link Presentation & Social Button Options</span>
            </div>
            <button onClick={() => setShowOptions(false)} className="text-xs text-[#E5E7EB]/50 hover:text-white">Close</button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <SelectRow
              label="Links display mode"
              value={s.links_display || "both"}
              onChange={(v) => patchSetting("links_display", v)}
              options={LINK_DISPLAY_OPTIONS}
            />
            <SelectRow
              label="Link card layout"
              value={s.link_layout_style || "list"}
              onChange={(v) => patchSetting("link_layout_style", v)}
              options={LINK_LAYOUT_STYLES}
            />
            <SelectRow
              label="Link card animation"
              value={s.link_animation || "none"}
              onChange={(v) => patchSetting("link_animation", v)}
              options={LINK_ANIMATIONS}
            />
            <SelectRow
              label="Right button on link cards"
              value={s.link_btn_style || "arrow"}
              onChange={(v) => patchSetting("link_btn_style", v)}
              options={LINK_BTN_OPTIONS}
            />
            <SelectRow
              label="Social icons style"
              value={s.social_icon_style || "glass"}
              onChange={(v) => patchSetting("social_icon_style", v)}
              options={SOCIAL_ICON_STYLES}
            />
          </div>

          <div className="pt-2 border-t border-white/10 space-y-3">
            <ToggleRow
              label="Show icon backgrounds"
              checked={s.icon_background_enabled === true}
              onChange={(v) => patchSetting("icon_background_enabled", v)}
              testid="icon-background-toggle"
            />
            <p className="text-[11px] text-[#E5E7EB]/50 -mt-1">
              Icon backgrounds are off by default. Turn them on here or choose a custom color overlay per link.
            </p>

            <ToggleRow
              label="Enable link popups"
              checked={s.show_presence_modal !== false}
              onChange={(v) => patchSetting("show_presence_modal", v)}
              testid="presence-modal-toggle"
            />
            <p className="text-[11px] text-[#E5E7EB]/50 -mt-1">
              This is the default for links. You can override it for each link below.
            </p>
          </div>
        </div>
      )}

      {/* Quick Add Social Toolbar */}
      <div className="swat-glass rounded-3xl p-5 border border-[#4A6B8A]/25">
        <div className="text-xs font-bold uppercase tracking-wider text-[#E5E7EB]/80 mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5"><Sparkles size={14} className="text-[#5B8DB8]" /> 1-Click Platform Presets</span>
          <span className="text-[11px] text-[#5B8DB8] font-mono">{links.length} Active</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {["discord", "spotify", "twitter", "instagram", "youtube", "tiktok", "twitch", "kick", "github", "steam", "soundcloud", "roblox"].map((plat) => {
            const Ic = brandIcon(plat);
            return (
              <button
                key={plat}
                type="button"
                onClick={() => {
                  setForm({ platform: plat, label: PLATFORM_LABELS[plat] || plat, url: "" });
                  setOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-[#08090B]/60 hover:bg-[#5B8DB8]/20 hover:border-[#5B8DB8]/60 text-xs font-semibold text-[#E5E7EB] transition-all shrink-0 hover:scale-105"
              >
                <Ic size={14} className="text-[#5B8DB8]" />
                <span className="capitalize">{plat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Categorized Filter Tabs (Separating Cards, Social Icons, and Media Embeds) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center p-1 rounded-2xl bg-[#08090B]/70 border border-[#4A6B8A]/30 text-xs">
          {[
            { id: "all", label: "All Links", count: counts.all },
            { id: "cards", label: "Link Cards", count: counts.cards },
            { id: "icons", label: "Social Icons", count: counts.icons },
            { id: "embeds", label: "Media & Embeds", count: counts.embeds },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                tabFilter === tab.id
                  ? "bg-[#5B8DB8] text-white shadow-[0_0_12px_rgba(91,141,184,0.4)]"
                  : "text-[#E5E7EB]/60 hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${tabFilter === tab.id ? "bg-white/20 text-white" : "bg-white/5 text-[#E5E7EB]/40"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search links..."
            className="bg-[#08090B]/60 border-[#4A6B8A]/30 text-xs h-9 pl-8 text-white rounded-xl"
          />
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3.5 mt-2">
        {filteredLinks.length === 0 && (
          <p className="text-[#E5E7EB]/40 text-sm col-span-2 py-10 text-center border border-dashed border-[#4A6B8A]/30 rounded-2xl">
            No links in this category. Click &quot;Add link&quot; above to create one.
          </p>
        )}
        {filteredLinks.map((l) => {
          const Ic = brandIcon(l.platform);
          const iconColor = l.config?.custom_icon_color || BRAND_COLORS[l.platform] || "#5B8DB8";
          const iconGlow = l.config?.custom_icon_glow || (l.config?.glow ? (l.config?.glow_color || iconColor) : null);
          const glowSize = l.config?.glow_size ?? 12;
          const noIconBg = l.config?.no_icon_bg || l.config?.no_bg;

          return (
            <div
              key={l.id}
              data-testid={`link-item-${l.id}`}
              className={`swat-glass rounded-2xl p-4 flex items-center gap-3.5 border border-[#4A6B8A]/25 hover:border-[#5B8DB8]/50 transition-all ${
                l.hidden ? "opacity-50 grayscale" : ""
              }`}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform hover:scale-105"
                style={{
                  background: noIconBg ? "transparent" : `${iconColor}20`,
                  border: noIconBg ? "none" : `1px solid ${iconColor}45`,
                  color: iconColor,
                  boxShadow: iconGlow ? `0 0 ${glowSize}px ${iconGlow}` : "none",
                }}
              >
                <Ic size={noIconBg ? 22 : 20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-bold truncate text-white">{l.label}</span>
                  {l.config?.no_icon_bg && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25 shrink-0">No BG</span>
                  )}
                  {l.config?.display_as === "card" && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-400 border border-blue-500/25 shrink-0">Card Only</span>
                  )}
                  {l.config?.display_as === "icon" && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-400 border border-purple-500/25 shrink-0">Icon Only</span>
                  )}
                  {(!l.config?.display_as || l.config?.display_as === "both") && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shrink-0">Both</span>
                  )}
                  {l.config?.custom_icon_color && (
                    <span className="w-2.5 h-2.5 rounded-full ring-1 ring-white/30" style={{ background: l.config.custom_icon_color }} title="Custom Icon Color" />
                  )}
                </div>
                <div className="text-xs text-[#E5E7EB]/40 truncate mt-0.5">{l.url}</div>
              </div>
              <div className="flex items-center gap-1">
                <a href={l.url.startsWith("http") ? l.url : `https://${l.url}`} target="_blank" rel="noreferrer" className="p-1.5 text-[#E5E7EB]/40 hover:text-white rounded-lg hover:bg-white/5" title="Test link">
                  <ExternalLink size={14} />
                </a>
                <button onClick={() => toggleHide(l)} className="p-1.5 text-[#E5E7EB]/40 hover:text-[#5B8DB8] rounded-lg hover:bg-white/5" title="show/hide">{l.hidden ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                <button data-testid={`link-edit-${l.id}`} onClick={() => setEditing(l)} className="p-1.5 text-[#E5E7EB]/40 hover:text-[#5B8DB8] rounded-lg hover:bg-white/5" title="Edit"><Pencil size={15} /></button>
                <button data-testid={`link-delete-${l.id}`} onClick={() => remove(l.id)} className="p-1.5 text-red-400/70 hover:text-red-400 rounded-lg hover:bg-red-500/10" title="Delete"><X size={16} /></button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0d0f13]/95 backdrop-blur-2xl border-[#4A6B8A]/30 text-[#E5E7EB] rounded-3xl p-6">
          <DialogHeader><DialogTitle className="font-display text-xl font-bold">Add a link</DialogTitle></DialogHeader>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-52 overflow-y-auto pr-1 mt-2">
            {ALL_PLATFORMS.map((p) => {
              const Ic = brandIcon(p);
              return (
                <button key={p} data-testid={`social-pick-${p}`} onClick={() => setForm((f) => ({ ...f, platform: p, label: PLATFORM_LABELS[p] }))}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all ${form.platform === p ? "border-[#5B8DB8] bg-[#5B8DB8]/20 text-[#5B8DB8] scale-105" : "border-[#4A6B8A]/25 text-[#E5E7EB]/60 hover:bg-white/5"}`}>
                  <Ic size={18} /><span className="text-[9px] leading-tight text-center truncate w-full px-1">{PLATFORM_LABELS[p]}</span>
                </button>
              );
            })}
          </div>
          <div className="space-y-3 mt-3">
            <div><Label className="text-[#E5E7EB]/70 text-xs">Button Title / Label</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="bg-[#08090B]/60 border-[#4A6B8A]/30 mt-1 text-xs" /></div>
            <div><Label className="text-[#E5E7EB]/70 text-xs">{canAutoFetch ? "Username or profile URL" : "Profile URL"}</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder={canAutoFetch ? "Username or profile link" : `Paste ${PLATFORM_LABELS[form.platform] || form.platform} URL`} className="bg-[#08090B]/60 border-[#4A6B8A]/30 mt-1 text-xs" /></div>
            <Button data-testid="link-save-btn" onClick={add} className="w-full rounded-2xl bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white gap-2 text-xs font-semibold py-2.5 shadow-[0_0_15px_rgba(91,141,184,0.3)]">{canAutoFetch ? <><Sparkles size={15} /> Add and fetch available details</> : <><Plus size={15} /> Add link</>}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {editing && <LinkEditor link={editing} onClose={() => setEditing(null)} onSaved={(d) => { setLinks((ls) => ls.map((x) => x.id === d.id ? d : x)); setEditing(null); }} />}
    </div>
  );
}

function LinkEditor({ link, onClose, onSaved }) {
  const { user } = useAuth();
  const [cfg, setCfg] = useState(link.config || {});
  const [label, setLabel] = useState(link.label || "");
  const [url, setUrl] = useState(link.url || "");
  const [lookupQuery, setLookupQuery] = useState("");
  const [fetching, setFetching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const fields = PLATFORM_FIELDS[link.platform] || PLATFORM_FIELDS.other;
  const canAutoFetch = AUTO_FETCH_PLATFORMS.includes(link.platform);
  const set = (k, v) => setCfg((p) => ({ ...p, [k]: v }));
  const dc = user?.connections?.discord;

  const applyData = (data) => {
    if (data.url) setUrl(data.url);
    if (data.label) setLabel(data.label);
    setCfg((p) => {
      const next = { ...p };
      if (data.username) {
        next.username = true;
        next.username_text = data.username;
      }
      if (data.avatar_url) {
        next.avatar = true;
        next.avatar_url = data.avatar_url;
      }
      if (data.details) {
        if (data.details.followers) { next.followers = true; next.followers_value = data.details.followers; }
        if (data.details.karma) { next.karma = true; next.karma_value = data.details.karma; }
        if (data.details.members) { next.followers = true; next.followers_value = data.details.members; }
        if (data.details.status) { next.status = true; next.status_value = data.details.status; }
      }
      next.verified = true;
      next.glow = true;
      return next;
    });
  };

  const doLookup = async (manualQ) => {
    if (!canAutoFetch) return toast.info("Automatic lookup is not available for this platform.");
    const q = manualQ || lookupQuery || url;
    if (!q) return toast.info("Enter a handle or URL first");
    setFetching(true);
    try {
      const { data } = await api.get(`/links/lookup?platform=${link.platform}&query=${encodeURIComponent(q)}`);
      applyData(data);
      toast.success("Profile auto-fetched & configured!");
    } catch {
      toast.error("Could not auto-fetch. Please fill in details manually.");
    } finally {
      setFetching(false);
    }
  };

  const save = async () => {
    setBusy(true);
    try { const { data } = await api.put(`/links/${link.id}`, { label, url, config: cfg }); onSaved(data); toast.success("Link saved."); }
    catch { toast.error("Save failed"); } finally { setBusy(false); }
  };

  const doUpload = async (key) => {
    const f = fileRef.current?.files?.[0]; if (!f) return;
    setUploading(true);
    try { const u = await uploadFile(f); set(key, fileUrl(u)); toast.success("Uploaded."); } catch { toast.error("Upload failed"); } finally { setUploading(false); }
  };

  const Toggle = ({ k, label: lb }) => <ToggleRow label={lb} checked={!!cfg[k]} onChange={(v) => set(k, v)} testid={`cfg-${k}`} />;
  const Color = ({ k, label = "Color" }) => <div className="w-48"><CustomColorPicker label={label} value={cfg[k] || "#5B8DB8"} onChange={(val) => set(k, val)} /></div>;

  const renderField = (fkey) => {
    const meta = FIELD_META[fkey]; if (!meta) return null;
    switch (meta.kind) {
      case "select":
        return (
          <div key={fkey} className="flex items-center justify-between"><span className="text-sm text-[#E5E7EB]/75">{meta.label}</span>
            <Select value={cfg[fkey] || meta.options[0]} onValueChange={(v) => set(fkey, v)}><SelectTrigger className="bg-[#08090B]/60 border-[#4A6B8A]/30 w-32 h-8"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#202329] border-[#4A6B8A]/40 text-[#E5E7EB]">{meta.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
          </div>
        );
      case "toggle": return <Toggle key={fkey} k={fkey} label={meta.label} />;
      case "value":
        return (<div key={fkey}><Toggle k={fkey} label={meta.label} />{cfg[fkey] && <Input value={cfg[`${fkey}_value`] || ""} onChange={(e) => set(`${fkey}_value`, e.target.value)} placeholder={meta.label} className="bg-[#08090B]/60 border-[#4A6B8A]/30 mt-1.5 h-8" />}</div>);
      case "color":
        return (<div key={fkey} className="flex items-center justify-between gap-3"><Toggle k={fkey} label={meta.label} />{cfg[fkey] && <Color k={`${fkey}_color`} label={meta.label} />}</div>);
      case "avatar":
        return (<div key={fkey}><Toggle k={fkey} label={meta.label} />{cfg[fkey] && <Input value={cfg.avatar_url || ""} onChange={(e) => set("avatar_url", e.target.value)} placeholder="avatar image URL" className="bg-[#08090B]/60 border-[#4A6B8A]/30 mt-1.5 h-8" />}</div>);
      case "username":
        return (<div key={fkey}><Toggle k={fkey} label={meta.label} />{cfg[fkey] && <div className="space-y-2 mt-1.5"><Input value={cfg.username_text || ""} onChange={(e) => set("username_text", e.target.value)} placeholder="@name" className="bg-[#08090B]/60 border-[#4A6B8A]/30 h-8 flex-1" /><CustomColorPicker label="Username Color" value={cfg.username_color || "#E5E7EB"} onChange={(val) => set("username_color", val)} /></div>}</div>);
      case "glow":
        return (<div key={fkey} className="rounded-lg border border-[#4A6B8A]/20 p-3 space-y-2"><Toggle k="glow" label={meta.label} />{cfg.glow && <><div className="flex justify-between text-xs text-[#E5E7EB]/60"><span>Intensity</span><span className="text-[#5B8DB8]">{cfg.glow_size ?? 12}px</span></div><Slider value={[cfg.glow_size ?? 12]} max={40} step={1} onValueChange={(v) => set("glow_size", v[0])} /><div className="flex items-center justify-between gap-2"><span className="text-xs text-[#E5E7EB]/60">Glow color</span><Color k="glow_color" label="Glow" /></div></>}</div>);
      case "upload":
        return (<div key={fkey}><Toggle k={fkey} label={meta.label} />{cfg[fkey] && <div className="flex gap-2 mt-1.5"><Input value={cfg.custom_icon_url || ""} onChange={(e) => set("custom_icon_url", e.target.value)} placeholder="icon URL or upload →" className="bg-[#08090B]/60 border-[#4A6B8A]/30 h-8 flex-1" /><Button size="sm" variant="outline" className="border-[#4A6B8A]/40 h-8" onClick={() => fileRef.current?.click()}>{uploading ? "..." : <Upload size={14} />}</Button><input ref={fileRef} type="file" accept="image/*" hidden onChange={() => doUpload("custom_icon_url")} /></div>}</div>);
      case "custom": {
        const rows = cfg.custom_fields || [];
        return (
          <div key={fkey} className="rounded-lg border border-[#4A6B8A]/20 p-3 space-y-2">
            <div className="text-sm text-[#E5E7EB]/75">{meta.label}</div>
            {rows.map((r, i) => (
              <div key={i} className="flex gap-2">
                <Input value={r.label} onChange={(e) => { const n = [...rows]; n[i] = { ...n[i], label: e.target.value }; set("custom_fields", n); }} placeholder="label" className="bg-[#08090B]/60 border-[#4A6B8A]/30 h-8" />
                <Input value={r.value} onChange={(e) => { const n = [...rows]; n[i] = { ...n[i], value: e.target.value }; set("custom_fields", n); }} placeholder="value" className="bg-[#08090B]/60 border-[#4A6B8A]/30 h-8" />
                <button onClick={() => set("custom_fields", rows.filter((_, x) => x !== i))} className="text-red-400/70"><X size={14} /></button>
              </div>
            ))}
            <Button size="sm" variant="outline" className="border-[#4A6B8A]/40 h-8 gap-1" onClick={() => set("custom_fields", [...rows, { label: "", value: "" }])}><Plus size={12} /> field</Button>
          </div>
        );
      }
      default: return null;
    }
  };

  const Ic = brandIcon(link.platform);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#0d0f13]/95 backdrop-blur-2xl border-[#4A6B8A]/30 text-[#E5E7EB] max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><Ic size={18} className="text-[#5B8DB8]" /> {PLATFORM_LABELS[link.platform] || link.platform} presence</DialogTitle></DialogHeader>

        {/* Quick Auto-Fetch Profile Box */}
        {canAutoFetch && <div className="rounded-xl p-3 border border-[#5B8DB8]/30 bg-[#5B8DB8]/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5B8DB8] flex items-center gap-1.5"><Sparkles size={13} /> Auto-fetch avatar & profile</span>
            {link.platform === "discord" && dc?.username && (
              <button
                type="button"
                onClick={() => applyData({
                  username: dc.username,
                  avatar_url: dc.avatar,
                  url: `https://discord.com/users/${dc.id}`,
                  label: dc.username,
                })}
                className="text-[11px] text-[#5865F2] hover:text-white underline cursor-pointer"
              >
                Use Connected Discord
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              placeholder={`Enter ${PLATFORM_LABELS[link.platform] || link.platform} handle or link`}
              className="bg-[#08090B]/80 border-[#4A6B8A]/40 text-xs h-8 flex-1"
              onKeyDown={(e) => e.key === "Enter" && doLookup()}
            />
            <Button
              type="button"
              size="sm"
              onClick={() => doLookup()}
              disabled={fetching || (!lookupQuery && !url)}
              className="bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white text-xs h-8 px-3 gap-1 shrink-0"
            >
              {fetching ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              Auto-fetch
            </Button>
          </div>
        </div>}

        <div><Label className="text-[#E5E7EB]/70 text-xs">Label</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} className="bg-[#08090B]/60 border-[#4A6B8A]/30 mt-1.5 h-8" /></div>
        <div><Label className="text-[#E5E7EB]/70 text-xs">URL</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} className="bg-[#08090B]/60 border-[#4A6B8A]/30 mt-1.5 h-8" /></div>
        <div><Label className="text-[#E5E7EB]/70 text-xs">Popup title</Label><Input value={cfg.popup_title || ""} onChange={(e) => set("popup_title", e.target.value)} maxLength={60} placeholder={`${PLATFORM_LABELS[link.platform] || link.platform} profile`} className="bg-[#08090B]/60 border-[#4A6B8A]/30 mt-1.5 h-8" /></div>
        <div><Label className="text-[#E5E7EB]/70 text-xs">Popup description</Label><textarea value={cfg.popup_description || ""} onChange={(e) => set("popup_description", e.target.value)} maxLength={180} rows={2} placeholder="Short description shown in the popup" className="mt-1.5 w-full resize-y rounded-md border border-[#4A6B8A]/30 bg-[#08090B]/60 px-3 py-2 text-xs text-white placeholder:text-white/35" /></div>
        
        <div className="flex items-center justify-between py-1">
          <div>
            <Label className="text-[#E5E7EB]/80 text-xs">Display as</Label>
            <div className="text-[10px] text-[#E5E7EB]/40">Choose where this link appears on profile</div>
          </div>
          <Select value={cfg.display_as || "both"} onValueChange={(v) => set("display_as", v)}>
            <SelectTrigger className="bg-[#08090B]/60 border-[#4A6B8A]/30 w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#202329] border-[#4A6B8A]/40 text-[#E5E7EB]">
              <SelectItem value="both">Both (Icon & Card)</SelectItem>
              <SelectItem value="card">Card Only (No top icon)</SelectItem>
              <SelectItem value="icon">Social Icon Only (No card)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ToggleRow
          label="Open an interactive popup when clicked"
          checked={cfg.popup_enabled !== false}
          onChange={(enabled) => set("popup_enabled", enabled)}
        />

        {/* Custom Link Icon Color & Glow Controls */}
        <div className="rounded-xl border border-[#4A6B8A]/25 p-3.5 bg-[#08090B]/40 space-y-3">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <Palette size={14} className="text-[#5B8DB8]" />
            <span>Custom Icon Color & Glow</span>
          </div>

          <ToggleRow
            label="Tint icon background with platform color"
            checked={!!cfg.icon_color_overlay}
            onChange={(enabled) => set("icon_color_overlay", enabled)}
          />

          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-xs text-[#E5E7EB]/80">Custom Icon Color</span>
              <div className="text-[10px] text-[#E5E7EB]/40">Overrides standard brand color</div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={!!cfg.custom_icon_color}
                onCheckedChange={(enabled) => set("custom_icon_color", enabled ? (BRAND_COLORS[link.platform] || "#5B8DB8") : null)}
                aria-label="Use custom icon color"
              />
              {cfg.custom_icon_color && (
                <div className="w-36">
                <CustomColorPicker
                  label="Color"
                  value={cfg.custom_icon_color || BRAND_COLORS[link.platform] || "#5B8DB8"}
                  onChange={(val) => set("custom_icon_color", val)}
                />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
            <div>
              <span className="text-xs text-[#E5E7EB]/80">Icon Glow Aura</span>
              <div className="text-[10px] text-[#E5E7EB]/40">Ambient shadow around icon</div>
            </div>
            <div className="flex items-center gap-2">
              {cfg.custom_icon_glow && (
                <button
                  type="button"
                  onClick={() => set("custom_icon_glow", null)}
                  className="text-[10px] text-red-400 hover:underline"
                >
                  Reset
                </button>
              )}
              <div className="w-36">
                <CustomColorPicker
                  label="Glow"
                  value={cfg.custom_icon_glow || cfg.custom_icon_color || BRAND_COLORS[link.platform] || "#5B8DB8"}
                  onChange={(val) => set("custom_icon_glow", val)}
                />
              </div>
            </div>
          </div>

          {(cfg.custom_icon_glow || cfg.glow) && (
            <div className="pt-2 border-t border-white/5 space-y-1.5">
              <div className="flex justify-between text-[11px] text-[#E5E7EB]/70">
                <span>Glow Spread / Intensity</span>
                <span className="text-[#5B8DB8] font-mono">{cfg.glow_size ?? 12}px</span>
              </div>
              <Slider
                value={[cfg.glow_size ?? 12]}
                max={40}
                step={1}
                onValueChange={(v) => set("glow_size", v[0])}
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
            <div>
              <span className="text-xs text-[#E5E7EB]/80">Remove Icon Background</span>
              <div className="text-[10px] text-[#E5E7EB]/40">Clean, borderless floating icon</div>
            </div>
            <ToggleRow
              checked={!!cfg.no_icon_bg}
              onChange={(v) => set("no_icon_bg", v)}
            />
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-[#4A6B8A]/20">{fields.map(renderField)}</div>
        <div className="flex justify-end gap-2 pt-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button data-testid="link-config-save" onClick={save} disabled={busy} className="bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white">{busy ? "..." : "Save"}</Button></div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Badges & Custom Badges ---------------- */
export function BadgesSection() {
  const { user, setUser } = useAuth();
  const owned = user.badges || [];
  const [shown, setShown] = useState(Array.isArray(user.settings?.badges_shown) ? user.settings.badges_shown : []);
  const [badgeLayout, setBadgeLayout] = useState(user.settings?.badge_layout || "classic");
  const [customBadges, setCustomBadges] = useState(Array.isArray(user.settings?.custom_badges) ? user.settings.custom_badges : []);
  const [badgeStyle, setBadgeStyle] = useState({
    size: 28,
    shape: "circle",
    background: true,
    outline: true,
    glow: true,
    ...(user.settings?.badge_style || {}),
  });
  const [saving, setSaving] = useState(false);
  const [checkingBooster, setCheckingBooster] = useState(false);
  const canCreateCustomBadge = user.role === "admin";

  // Custom Badge Creator State
  const [createModal, setCreateModal] = useState(false);
  const [iconSearch, setIconSearch] = useState("");
  const [iconCategory, setIconCategory] = useState("all");
  const [newBadge, setNewBadge] = useState({
    name: "",
    desc: "",
    icon: "Crown",
    color: "#5B8DB8",
    glow_color: "#5B8DB8",
    glow_intensity: 15,
  });

  const toggle = (id) => setShown((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/profile", {
        settings: {
          badges_shown: shown,
          badge_layout: badgeLayout,
          custom_badges: customBadges,
          badge_style: badgeStyle,
        },
      });
      setUser(data);
      toast.success("Badge settings saved!");
    } catch {
      toast.error("Failed to save badges");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCustomBadge = () => {
    if (!canCreateCustomBadge) {
      return toast.error("Custom badges are admin-only.");
    }
    if (!newBadge.name.trim()) return toast.error("Please enter a badge name");
    const badgeObj = {
      id: `custom_${Date.now()}`,
      name: newBadge.name.trim(),
      desc: newBadge.desc.trim() || "Custom creator badge",
      icon: newBadge.icon || "Crown",
      color: newBadge.color || "#5B8DB8",
      glow_color: newBadge.glow_color || newBadge.color || "#5B8DB8",
      glow_intensity: newBadge.glow_intensity ?? 15,
      enabled: true,
      created_at: new Date().toISOString(),
    };
    const updated = [...customBadges, badgeObj];
    setCustomBadges(updated);
    setCreateModal(false);
    setNewBadge({
      name: "",
      desc: "",
      icon: "Crown",
      color: "#5B8DB8",
      glow_color: "#5B8DB8",
      glow_intensity: 15,
    });
    // Auto save
    api.put("/profile", { settings: { custom_badges: updated } })
      .then(({ data }) => { setUser(data); toast.success("Custom badge created!"); })
      .catch(() => toast.success("Badge created locally. Click Save Display to apply."));
  };

  const toggleCustomBadge = (id) => {
    const updated = customBadges.map((cb) => cb.id === id ? { ...cb, enabled: !cb.enabled } : cb);
    setCustomBadges(updated);
  };

  const deleteCustomBadge = (id) => {
    if (!canCreateCustomBadge) {
      return toast.error("Custom badge deletion is admin-only.");
    }
    const updated = customBadges.filter((cb) => cb.id !== id);
    setCustomBadges(updated);
    api.put("/profile", { settings: { custom_badges: updated } })
      .then(({ data }) => { setUser(data); toast.success("Custom badge removed"); });
  };

  const checkBooster = async () => {
    setCheckingBooster(true);
    try {
      const { data } = await api.post("/connect/discord/check-booster");
      if (data.boosting || data.badge_added || data.has_badge) {
        setUser((u) => ({ ...u, badges: data.badges || [...(u.badges || []), "booster"] }));
        if (!shown.includes("booster")) setShown((s) => [...s, "booster"]);
        toast.success(data.message || "Discord booster verified! Server booster badge granted 🚀");
      } else {
        toast.info(data.message || "Connected Discord is not currently boosting the server.");
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Connect Discord under Connections first to verify booster status.");
    } finally {
      setCheckingBooster(false);
    }
  };

  const filteredIcons = useMemo(() => {
    return BADGE_ICON_CATALOG.filter((item) => {
      if (iconCategory !== "all" && item.category !== iconCategory) return false;
      if (!iconSearch) return true;
      return item.icon.toLowerCase().includes(iconSearch.toLowerCase());
    });
  }, [iconCategory, iconSearch]);

  const SelectedIconComp = Icons[newBadge.icon] || Icons.Award;

  return (
    <div className="space-y-6">
      <Header
        title="Badges & Accolades"
        subtitle="Toggle official accolades or craft custom glowing badges with 100+ icons."
        action={
          <div className="flex items-center gap-2">
            {canCreateCustomBadge && (
              <Button
                type="button"
                onClick={() => setCreateModal(true)}
                className="rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white gap-1.5 text-xs"
              >
                <Plus size={15} /> Create Custom Badge
              </Button>
            )}
            <Button
              data-testid="badges-save-btn"
              onClick={save}
              disabled={saving}
              className="rounded-full bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white shadow-[0_0_15px_rgba(91,141,184,0.3)]"
            >
              {saving ? "..." : "Save display"}
            </Button>
          </div>
        }
      />

      <div className="swat-glass rounded-xl p-4 border border-[#4A6B8A]/25 space-y-4">
        <div className="text-xs font-bold text-white">Badge appearance</div>
        <SelectRow
          label="Badge layout"
          value={badgeLayout}
          onChange={setBadgeLayout}
          options={[
            { v: "classic", l: "Individual badges" },
            { v: "all_in_one", l: "All badges in one pill" },
            { v: "grid", l: "Grid" },
            { v: "pills", l: "Separate pills" },
          ]}
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <ToggleRow label="Badge background" checked={badgeStyle.background !== false} onChange={(value) => setBadgeStyle((style) => ({ ...style, background: value }))} />
          <ToggleRow label="Badge outline" checked={badgeStyle.outline !== false} onChange={(value) => setBadgeStyle((style) => ({ ...style, outline: value }))} />
          <ToggleRow label="Badge glow" checked={badgeStyle.glow !== false} onChange={(value) => setBadgeStyle((style) => ({ ...style, glow: value }))} />
          <SelectRow
            label="Badge shape"
            value={badgeStyle.shape || "circle"}
            onChange={(value) => setBadgeStyle((style) => ({ ...style, shape: value }))}
            options={[{ v: "circle", l: "Circle" }, { v: "rounded", l: "Rounded square" }, { v: "square", l: "Square" }]}
          />
          <SelectRow
            label="Tooltip mode"
            value={badgeStyle.tooltip_style || user.settings?.badge_tooltip_style || "normal"}
            onChange={(value) => setBadgeStyle((style) => ({ ...style, tooltip_style: value }))}
            options={[
              { v: "normal", l: "Normal (Rich Glowing Card)" },
              { v: "basic", l: "Basic (Dark Pill)" },
              { v: "mini", l: "Mini (Pure Text - No Background)" },
            ]}
          />
        </div>
        <div>
          <div className="flex justify-between text-xs text-[#E5E7EB]/70 mb-1.5">
            <span>Badge size</span>
            <span className="font-mono text-[#5B8DB8]">{badgeStyle.size ?? 28}px</span>
          </div>
          <Slider value={[badgeStyle.size ?? 28]} min={20} max={44} step={1} onValueChange={(value) => setBadgeStyle((style) => ({ ...style, size: value[0] }))} />
        </div>
      </div>

      {/* Discord Booster Auto-Check Banner */}
      <div className="swat-glass rounded-2xl p-4 border border-[#a855f7]/30 bg-gradient-to-r from-[#a855f7]/15 via-[#5865F2]/10 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#a855f7]/25 text-[#a855f7] border border-[#a855f7]/40 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.4)]">
            <Rocket size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>Discord Server Booster Badge</span>
              {owned.includes("booster") ? (
                <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">UNLOCKED</span>
              ) : (
                <span className="px-2 py-0.2 rounded-full bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/30 text-[10px] font-mono">BOOST TO UNLOCK</span>
              )}
            </div>
            <div className="text-xs text-[#E5E7EB]/60">
              Check if your connected Discord is boosting our server to auto-receive the Rocket badge.
            </div>
          </div>
        </div>
        <Button
          onClick={checkBooster}
          disabled={checkingBooster}
          className="rounded-xl bg-[#a855f7] hover:bg-[#9333ea] text-white text-xs font-semibold px-3.5 py-1.5 shrink-0 gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.35)]"
        >
          {checkingBooster ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          Verify Booster Badge
        </Button>
      </div>

      {/* Custom Badges Section */}
      {customBadges.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#5B8DB8] flex items-center gap-1.5">
            <Sparkles size={14} /> Custom Badges Created ({customBadges.length})
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {customBadges.map((cb) => {
              const Ic = Icons[cb.icon] || Icons.Award;
              const on = cb.enabled !== false;
              return (
                <div
                  key={cb.id}
                  className={`swat-glass rounded-2xl p-4 flex items-start gap-3.5 border transition-all ${
                    on ? "border-[#5B8DB8]/40" : "border-white/10 opacity-50 grayscale"
                  }`}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform hover:scale-110"
                    style={{
                      background: `${cb.color}25`,
                      border: `1px solid ${cb.color}55`,
                      color: cb.color,
                      boxShadow: on ? `0 0 ${cb.glow_intensity ?? 15}px ${cb.glow_color || cb.color}` : "none",
                    }}
                  >
                    <Ic size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-sm text-white truncate">{cb.name}</div>
                    <div className="text-xs text-[#E5E7EB]/50 mt-0.5 line-clamp-1">{cb.desc}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-mono text-[#5B8DB8]">Icon: {cb.icon}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Switch checked={on} onCheckedChange={() => toggleCustomBadge(cb.id)} />
                    <button
                      onClick={() => deleteCustomBadge(cb.id)}
                      className="text-[#E5E7EB]/40 hover:text-red-400 p-1 rounded-lg transition-colors"
                      title="Delete custom badge"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* System Official Badges */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-[#E5E7EB]/70 flex items-center gap-1.5">
          <Award size={14} /> Official Platform Accolades
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BADGE_DEFS.map((b) => {
            const Ic = Icons[b.icon] || Icons.Award;
            const has = owned.includes(b.id);
            const on = shown.includes(b.id);
            return (
              <div
                key={b.id}
                data-testid={`badge-item-${b.id.replace(/[.\s]/g, "-")}`}
                className={`swat-glass rounded-2xl p-5 flex items-start gap-4 transition-all ${
                  has ? "" : "opacity-40 grayscale"
                }`}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform hover:scale-110"
                  style={{
                    background: `${b.color}22`,
                    border: `1px solid ${b.color}44`,
                    color: b.color,
                    boxShadow: has && on ? `0 0 18px ${b.color}55` : "none",
                  }}
                >
                  <Ic size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-semibold text-white">{b.name}</div>
                  <div className="text-xs text-[#E5E7EB]/50 mt-0.5 leading-relaxed">{b.desc}</div>
                </div>
                {has ? (
                  <Switch
                    checked={on}
                    onCheckedChange={() => toggle(b.id)}
                    data-testid={`badge-toggle-${b.id.replace(/[.\s]/g, "-")}`}
                  />
                ) : (
                  <Lock size={14} className="text-[#E5E7EB]/40 mt-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Badge Creation Modal with 100+ Searchable Icons */}
      <Dialog open={createModal} onOpenChange={setCreateModal}>
        <DialogContent className="bg-[#0d0f13]/95 backdrop-blur-2xl border-[#4A6B8A]/30 text-[#E5E7EB] max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold flex items-center gap-2">
              <Sparkles size={20} className="text-[#5B8DB8]" />
              Create Custom Badge (100+ Icons)
            </DialogTitle>
          </DialogHeader>

          {/* Live Badge Preview Card */}
          <div className="rounded-2xl p-4 border border-[#4A6B8A]/30 bg-[#08090B]/60 flex items-center gap-4 mt-2">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all"
              style={{
                background: `${newBadge.color}25`,
                border: `1.5px solid ${newBadge.color}66`,
                color: newBadge.color,
                boxShadow: `0 0 ${newBadge.glow_intensity ?? 15}px ${newBadge.glow_color || newBadge.color}`,
              }}
            >
              <SelectedIconComp size={28} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase font-mono tracking-wider text-[#5B8DB8]">Live Badge Preview</div>
              <div className="font-display font-bold text-white text-base truncate">
                {newBadge.name || "Badge Title"}
              </div>
              <div className="text-xs text-[#E5E7EB]/60 truncate">
                {newBadge.desc || "Tooltip description"}
              </div>
            </div>
          </div>

          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-[#E5E7EB]/70 text-xs">Badge Name / Title</Label>
              <Input
                value={newBadge.name}
                onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })}
                placeholder="e.g. Syndicate Leader, Alpha, Glitch"
                className="bg-[#08090B]/60 border-[#4A6B8A]/30 mt-1 text-xs"
              />
            </div>

            <div>
              <Label className="text-[#E5E7EB]/70 text-xs">Tooltip Description</Label>
              <Input
                value={newBadge.desc}
                onChange={(e) => setNewBadge({ ...newBadge, desc: e.target.value })}
                placeholder="e.g. Master developer & syndicate founder"
                className="bg-[#08090B]/60 border-[#4A6B8A]/30 mt-1 text-xs"
              />
            </div>

            {/* 100+ Searchable Icon Picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[#E5E7EB]/80 text-xs font-semibold">Select Badge Icon (100+ Curated)</Label>
                <span className="text-[11px] text-[#5B8DB8] font-mono">Selected: {newBadge.icon}</span>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {BADGE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setIconCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all ${
                      iconCategory === cat.id
                        ? "bg-[#5B8DB8] text-white"
                        : "bg-white/5 text-[#E5E7EB]/60 hover:text-white"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Input
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  placeholder="Search 100+ icons (e.g. crown, sword, skull, flame, code, diamond)..."
                  className="bg-[#08090B]/80 border-[#4A6B8A]/30 text-xs h-8.5 pl-8 text-white rounded-xl"
                />
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
              </div>

              {/* 100+ Icons Grid */}
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 bg-[#08090B]/50 rounded-2xl border border-[#4A6B8A]/20">
                {filteredIcons.map(({ icon: iconName }) => {
                  const Ic = Icons[iconName] || Icons.Award;
                  const isSelected = newBadge.icon === iconName;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setNewBadge({ ...newBadge, icon: iconName })}
                      title={iconName}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? "bg-[#5B8DB8] text-white scale-110 shadow-[0_0_12px_rgba(91,141,184,0.6)]"
                          : "bg-white/[0.03] text-[#E5E7EB]/60 hover:text-white hover:bg-white/10 hover:scale-105"
                      }`}
                    >
                      <Ic size={18} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colors & Glow */}
            <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
              <div>
                <Label className="text-[#E5E7EB]/70 text-xs mb-1.5 block">Badge Color</Label>
                <CustomColorPicker
                  label="Color"
                  value={newBadge.color}
                  onChange={(col) => setNewBadge({ ...newBadge, color: col, glow_color: col })}
                />
              </div>
              <div>
                <Label className="text-[#E5E7EB]/70 text-xs mb-1.5 block">Glow Aura Color</Label>
                <CustomColorPicker
                  label="Glow"
                  value={newBadge.glow_color}
                  onChange={(col) => setNewBadge({ ...newBadge, glow_color: col })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-[#E5E7EB]/70">
                <span>Glow Intensity</span>
                <span className="text-[#5B8DB8] font-mono">{newBadge.glow_intensity ?? 15}px</span>
              </div>
              <Slider
                value={[newBadge.glow_intensity ?? 15]}
                max={40}
                step={1}
                onValueChange={(v) => setNewBadge({ ...newBadge, glow_intensity: v[0] })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="ghost" onClick={() => setCreateModal(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreateCustomBadge}
                className="bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white rounded-xl gap-1.5"
              >
                <Sparkles size={14} /> Create Badge
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- Leaderboard ---------------- */
export function LeaderboardSection() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // "all" | "verified"
  const [copiedUser, setCopiedUser] = useState(null);

  useEffect(() => {
    api.get("/leaderboard")
      .then(({ data }) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]));
  }, []);

  const myRow = useMemo(() => {
    return rows.find((r) => r.username?.toLowerCase() === user?.username?.toLowerCase());
  }, [rows, user?.username]);

  const medalConfig = (r) => {
    if (r === 1) return { color: "#eab308", border: "#facc15", bg: "rgba(234, 179, 8, 0.15)", glow: "0 0 20px rgba(234, 179, 8, 0.5)", title: "Champion", height: "h-44", order: "order-2" };
    if (r === 2) return { color: "#cbd5e1", border: "#e2e8f0", bg: "rgba(203, 213, 225, 0.15)", glow: "0 0 16px rgba(203, 213, 225, 0.4)", title: "Runner-Up", height: "h-36", order: "order-1" };
    if (r === 3) return { color: "#d97706", border: "#f59e0b", bg: "rgba(217, 119, 6, 0.15)", glow: "0 0 16px rgba(217, 119, 6, 0.4)", title: "3rd Place", height: "h-32", order: "order-3" };
    return { color: "#5B8DB8", border: "#4A6B8A", bg: "rgba(91, 141, 184, 0.1)", glow: "none", title: `#${r}`, height: "h-24", order: "" };
  };

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const matchSearch =
        (r.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.username || "").toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (filter === "verified") {
        return (r.badges || []).some((b) => b.toLowerCase().includes("verified") || b.toLowerCase().includes("admin") || b.toLowerCase().includes("og"));
      }
      return true;
    });
  }, [rows, search, filter]);

  const maxViews = useMemo(() => {
    return rows.reduce((max, r) => Math.max(max, r.views || 0), 1);
  }, [rows]);

  const copyProfileLink = (username, e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/${username}`;
    navigator.clipboard.writeText(url);
    setCopiedUser(username);
    toast.success(`Copied https://swats.bio/${username} to clipboard!`);
    setTimeout(() => setCopiedUser(null), 2000);
  };

  const topThree = rows.slice(0, 3);

  return (
    <div>
      <Header title="Leaderboard" subtitle="Top operators & creators ranked by community views." />

      {/* Your Rank Spotlight (if logged in & ranked) */}
      {myRow && (
        <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#5B8DB8]/20 via-[#4A6B8A]/15 to-transparent border border-[#5B8DB8]/40 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5B8DB8] text-white flex items-center justify-center font-display font-black text-sm shadow-md">
              #{myRow.rank}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Your Ranking</span>
                <span className="px-1.5 py-0.5 rounded bg-[#5B8DB8]/30 text-[#5B8DB8] text-[10px] font-mono">YOU</span>
              </div>
              <div className="text-[11px] text-[#E5E7EB]/60">
                You have <span className="font-semibold text-white">{(myRow.views || 0).toLocaleString()}</span> lifetime views
              </div>
            </div>
          </div>
          <a
            href={`/${encodeURIComponent(user.username)}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/15 transition-all"
          >
            View My Bio
          </a>
        </div>
      )}

      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6">
        <div className="relative flex-1 max-w-md">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by operator handle or display name..."
            className="bg-[#08090B]/80 border-[#4A6B8A]/35 text-xs h-9 pl-8 text-[#E5E7EB] focus:border-[#5B8DB8]"
          />
          <Icons.Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#08090B]/60 border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filter === "all" ? "bg-[#5B8DB8] text-white shadow-sm" : "text-white/60 hover:text-white"
            }`}
          >
            All Operators
          </button>
          <button
            onClick={() => setFilter("verified")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filter === "verified" ? "bg-[#5B8DB8] text-white shadow-sm" : "text-white/60 hover:text-white"
            }`}
          >
            Verified / OG
          </button>
        </div>
      </div>

      {/* TOP 3 PODIUM */}
      {topThree.length >= 3 && !search && filter === "all" && (
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mt-8 pt-4 pb-2 items-end max-w-2xl mx-auto">
          {/* #2 Silver (Left), #1 Gold (Center), #3 Bronze (Right) */}
          {[topThree[1], topThree[0], topThree[2]].map((r) => {
            if (!r) return null;
            const cfg = medalConfig(r.rank);
            const pfp = r.pfp ? fileUrl(r.pfp) : null;
            const initial = ((stripEffectSyntax(r.display_name || r.username) || "U")[0] || "U").toUpperCase();
            return (
              <div key={r.rank} className={`flex flex-col items-center ${cfg.order} group`}>
                {/* Crown / Trophy Icon for #1 */}
                <div className="relative mb-2 flex flex-col items-center">
                  {r.rank === 1 && (
                    <div className="animate-bounce mb-1">
                      <Trophy size={20} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
                    </div>
                  )}
                  {r.rank === 2 && <Shield size={16} className="text-slate-300 mb-1" />}
                  {r.rank === 3 && <Icons.Award size={16} className="text-amber-500 mb-1" />}

                  <a
                    href={`/${encodeURIComponent(r.username)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="relative block rounded-full transition-transform group-hover:scale-105"
                    title={`View @${r.username}`}
                  >
                    {pfp ? (
                      <img
                        src={pfp}
                        alt={r.username}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 shadow-lg"
                        style={{ borderColor: cfg.border, boxShadow: cfg.glow }}
                      />
                    ) : (
                      <div
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 flex items-center justify-center font-bold text-lg text-white shadow-lg"
                        style={{
                          borderColor: cfg.border,
                          boxShadow: cfg.glow,
                          background: `linear-gradient(135deg, ${cfg.color}44, #12151b)`,
                        }}
                      >
                        {initial}
                      </div>
                    )}
                    <span
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center font-display font-black text-xs text-black shadow-md"
                      style={{ background: cfg.border }}
                    >
                      #{r.rank}
                    </span>
                  </a>
                </div>

                <div className="text-center px-1 max-w-full">
                  <div className="text-xs sm:text-sm font-bold text-white truncate max-w-[120px] sm:max-w-[160px]">
                    {renderBioText(r.display_name || r.username)}
                  </div>
                  <a href={`/${encodeURIComponent(r.username)}`} target="_blank" rel="noreferrer" className="text-[11px] text-[#5B8DB8] hover:underline font-mono truncate block">
                    @{r.username}
                  </a>
                  <div className="text-[11px] font-semibold text-white/70 flex items-center justify-center gap-1 mt-0.5">
                    <Eye size={11} className="text-[#5B8DB8]" /> {(r.views || 0).toLocaleString()}
                  </div>
                </div>

                {/* Pedestal block */}
                <div
                  className={`w-full ${cfg.height} rounded-t-2xl mt-3 flex flex-col items-center justify-between p-2.5 transition-all group-hover:brightness-110 border-t border-x`}
                  style={{
                    background: `linear-gradient(180deg, ${cfg.color}33 0%, rgba(8,9,11,0.85) 100%)`,
                    borderColor: `${cfg.border}66`,
                    boxShadow: `0 -4px 20px ${cfg.color}15`,
                  }}
                >
                  <span className="font-display font-black text-lg sm:text-2xl" style={{ color: cfg.border, textShadow: `0 0 12px ${cfg.color}88` }}>
                    #{r.rank}
                  </span>
                  <span className="text-[10px] font-mono tracking-wider uppercase" style={{ color: `${cfg.border}cc` }}>
                    {cfg.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL RANKED LIST */}
      <div className="swat-glass rounded-3xl mt-6 border border-white/10 overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 bg-white/[0.02] border-b border-white/10 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-white/50">
          <span>Rank & Operator</span>
          <div className="flex items-center gap-6">
            <span className="hidden sm:inline">Activity Bar</span>
            <span>Total Views</span>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {filteredRows.length === 0 && (
            <div className="p-8 text-center text-[#E5E7EB]/40 text-sm">
              No matching operators found.
            </div>
          )}

          {filteredRows.map((r) => {
            const isTop3 = r.rank <= 3;
            const cfg = medalConfig(r.rank);
            const pct = Math.max(8, Math.round(((r.views || 0) / maxViews) * 100));
            const pfp = r.pfp ? fileUrl(r.pfp) : null;
            const initial = ((stripEffectSyntax(r.display_name || r.username) || "U")[0] || "U").toUpperCase();
            const isCopied = copiedUser === r.username;

            return (
              <div
                key={r.rank}
                className={`flex items-center justify-between p-4 hover:bg-white/[0.04] transition-all group ${
                  isTop3 ? "bg-white/[0.01]" : ""
                }`}
              >
                {/* Left: Rank, Avatar, Details */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  {/* Rank Badge */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-display font-black text-xs shrink-0 ${
                      isTop3 ? "text-black shadow-md" : "bg-white/5 text-white/60 border border-white/10"
                    }`}
                    style={isTop3 ? { background: cfg.border, boxShadow: cfg.glow } : {}}
                  >
                    #{r.rank}
                  </div>

                  {/* Avatar */}
                  <a href={`/${encodeURIComponent(r.username)}`} target="_blank" rel="noreferrer" className="relative shrink-0">
                    {pfp ? (
                      <img
                        src={pfp}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border"
                        style={{ borderColor: isTop3 ? cfg.border : "rgba(255,255,255,0.15)" }}
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full border flex items-center justify-center font-bold text-xs text-white"
                        style={{
                          borderColor: isTop3 ? cfg.border : "rgba(255,255,255,0.15)",
                          background: `linear-gradient(135deg, ${r.accent_color || "#5B8DB8"}44, #12151b)`,
                        }}
                      >
                        {initial}
                      </div>
                    )}
                    {isTop3 && (
                      <span
                        className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-black"
                        style={{ background: cfg.border }}
                      />
                    )}
                  </a>

                  {/* Name & Badges */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-white truncate">{renderBioText(r.display_name || r.username)}</span>
                      {(r.badges || []).map((b, idx) => (
                        <span
                          key={idx}
                          className="text-[9.5px] px-1.5 py-0.2 rounded-md bg-[#5B8DB8]/15 text-[#5B8DB8] border border-[#5B8DB8]/30 font-mono"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <a
                        href={`/${encodeURIComponent(r.username)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#5B8DB8] hover:underline font-mono truncate"
                      >
                        @{r.username}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Right: Relative Progress Bar & Total Views & Actions */}
                <div className="flex items-center gap-3 sm:gap-6 shrink-0 pl-2">
                  {/* Live Progress Bar relative to #1 */}
                  <div className="hidden sm:flex flex-col items-end w-28 lg:w-36">
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: isTop3 ? cfg.border : "#5B8DB8",
                          boxShadow: isTop3 ? `0 0 8px ${cfg.color}` : "none",
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-white/40 font-mono mt-0.5">{pct}% of top</span>
                  </div>

                  {/* View Count Display */}
                  <div className="text-right min-w-[70px]">
                    <div className="font-display font-bold text-sm sm:text-base text-white flex items-center justify-end gap-1">
                      <Eye size={13} className="text-[#5B8DB8]" />
                      {(r.views || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-white/40 font-mono">views</div>
                  </div>

                  {/* 1-Click Action Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => copyProfileLink(r.username, e)}
                      title="Copy bio link"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      {isCopied ? <Check size={14} className="text-green-400" /> : <Icons.Copy size={14} />}
                    </button>
                    <a
                      href={`/${encodeURIComponent(r.username)}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Open page"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5B8DB8] hover:text-white hover:bg-[#5B8DB8]/20 transition-all"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


/* ---------------- My Stats ---------------- */
export function MyStatsSection({ embed }) {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get("/stats/me").then(({ data }) => setStats(data)); }, []);
  const daily = stats?.daily || [];
  const best = daily.reduce((m, d) => d.views > m ? d.views : m, 0);
  const total7 = daily.reduce((a, d) => a + d.views, 0);
  const cards = [
    { label: "Total views", value: stats?.views ?? "—", Icon: Eye },
    { label: "Links", value: stats?.links ?? "—", Icon: Link2 },
    { label: "Views (7d)", value: total7, Icon: TrendingUp },
    { label: "Best day", value: best, Icon: Trophy },
  ];
  const body = (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="swat-glass rounded-2xl p-5">
            <div className="w-9 h-9 rounded-lg bg-[#5B8DB8]/15 flex items-center justify-center text-[#5B8DB8] mb-3"><c.Icon size={17} /></div>
            <div className="font-display text-3xl font-extrabold text-[#E5E7EB]">{c.value}</div>
            <div className="text-xs text-[#E5E7EB]/45 mt-1">{c.label}</div>
          </div>
        ))}
      </div>
      <div className="swat-glass rounded-2xl p-5 mt-4">
        <div className="font-display font-semibold mb-4">Views · last 7 days</div>
        <ResponsiveContainer width="100%" height={240} minWidth={0} minHeight={240}>
          <AreaChart data={daily} margin={{ left: -12, right: 6 }}>
            <defs><linearGradient id="msg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5B8DB8" stopOpacity={0.5} /><stop offset="100%" stopColor="#5B8DB8" stopOpacity={0.02} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#4A6B8A22" vertical={false} />
            <XAxis dataKey="day" stroke="#E5E7EB66" fontSize={12} tickLine={false} axisLine={false} /><YAxis stroke="#E5E7EB66" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
            <RTooltip contentStyle={{ background: "#202329", border: "1px solid #4A6B8A55", borderRadius: 10, color: "#E5E7EB" }} cursor={{ stroke: "#5B8DB8", strokeOpacity: 0.2 }} />
            <Area type="monotone" dataKey="views" stroke="#5B8DB8" strokeWidth={2.5} fill="url(#msg)" dot={{ fill: "#5B8DB8", r: 3 }} activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>
  );
  if (embed) return <div>{body}</div>;
  return <div><Header title="My Stats" subtitle="Track how your page performs." /><div className="mt-6">{body}</div></div>;
}


