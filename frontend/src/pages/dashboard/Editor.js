import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAuth, api, fileUrl } from "@/lib/auth";
import { renderBioText, stripEffectSyntax, USERNAME_EFFECTS_LIST } from "@/lib/textEffects";
import { BADGE_DEFS } from "@/pages/dashboard/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import * as Icons from "lucide-react";
import {
  Image as ImageIcon, MousePointer2, Music, Save,
  Upload, Trash2, Plus, ExternalLink, Sparkles, Eye,
  LayoutGrid, Sliders, Check, Palette, Layers, Wand2, Flame,
  Edit3, Shield, Star, Gamepad2, ArrowRight, Wand, X,
  Radio, Volume2, VolumeX, ListMusic, Music2, Play, Pause,
  Disc, SlidersHorizontal, Share2, MoveHorizontal, MoveVertical,
  AlignLeft, AlignCenter, AlignRight, FileText, DoorOpen, Lock, KeyRound, Monitor,
  CloudSun, Clock, AppWindow, Bot, Globe, Code, User, Award, Users, ShieldCheck
} from "lucide-react";
import { SiSpotify, SiDiscord } from "react-icons/si";
import CustomColorPicker from "@/components/ColorPicker";
import { MediaAssetModal } from "@/components/MediaAssetModal";
import { AvatarEffectsModal } from "@/components/AvatarEffectsModal";
import { BackgroundEffectsModal } from "@/components/BackgroundEffectsModal";
import { BannerEffectsModal } from "@/components/BannerEffectsModal";
import { CursorEffectsModal } from "@/components/CursorEffectsModal";
import { NameEffectsModal } from "@/components/NameEffectsModal";
import { BioEffectsModal } from "@/components/BioEffectsModal";
import { LocationEffectsModal } from "@/components/LocationEffectsModal";
import { RoleEffectsModal } from "@/components/RoleEffectsModal";
import { SlideshowManager } from "@/components/SlideshowManager";

// Exported Layout list
export const CARD_LAYOUTS = [
  { v: "classic", l: "Classic", desc: "Centered avatar, bio, badges & clean link stack" },
  { v: "minimal", l: "Minimal", desc: "Ultra-clean compact link stack with minimalist typography" },
  { v: "mini_banner", l: "Mini Banner", desc: "Compact header banner with smooth bottom fade" },
  { v: "banner_left", l: "Cover Banner", desc: "Top header banner with left-docked identity" },
  { v: "slideshow", l: "Slideshow Deck", desc: "Interactive scrolling deck with Discord & project embeds" },
  { v: "bento_grid", l: "Bento Grid", desc: "Modern multi-tile responsive bento blocks" },
  { v: "split_left", l: "2-Column Split", desc: "Profile identity on left, links on right" },
  { v: "floating_glass", l: "Floating Glass", desc: "Decoupled floating frosted glass tiles" },
  { v: "grid_tiles", l: "2×2 Grid Tiles", desc: "Square interactive icon & link tiles" },
  { v: "split_reverse", l: "Reverse Split", desc: "Links first, profile identity alongside" },
  { v: "sidebar_dock", l: "Sidebar Dock", desc: "Docked profile with compact link column" },
  { v: "compact", l: "Compact Stack", desc: "Tight, compact identity and link stack" },
  { v: "profile_header", l: "Profile Header", desc: "Wide header with an editorial profile card" },
  { v: "showcase_grid", l: "Showcase Grid", desc: "Wide grid focused on projects and links" },
];

export const CARD_SHAPES = [
  { v: "rounded", l: "Rounded (24px)" },
  { v: "squircle", l: "Squircle (36px)" },
  { v: "sharp", l: "Sharp (Tactical)" },
  { v: "chamfer", l: "Chamfered corners" },
  { v: "tech_corner", l: "Tech Bevel Cut" },
  { v: "pill", l: "Pill (44px)" },
];

export const CARD_STYLES = [
  { v: "classic", l: "Classic Noir" },
  { v: "frosted_square", l: "Frosted Square (Glass)" },
  { v: "frosted_soft", l: "Frosted Soft (Silk Blur)" },
  { v: "outlined", l: "Outlined (Wireframe)" },
  { v: "aurora", l: "Aurora (Chromatic Glow)" },
  { v: "transparent", l: "Transparent (0% Background)" },
  { v: "solid", l: "Stealth Solid" },
  { v: "neon", l: "Neon Edge Glow" },
];

export const CARD_RADIUS_OPTIONS = [
  { v: "0", l: "0px (Sharp Square)" },
  { v: "8", l: "8px (Subtle Rounded)" },
  { v: "16", l: "16px (Standard Rounded)" },
  { v: "24", l: "24px (Soft Curved)" },
  { v: "32", l: "32px (Full Pill Curve)" },
];

export const CARD_WIDTHS = [
  { v: "sm", l: "Compact (380px)" },
  { v: "md", l: "Standard (460px)" },
  { v: "lg", l: "Large (540px)" },
  { v: "wide", l: "Ultra-Wide (680px)" },
];

export const PFP_FRAME_SHAPES = [
  { v: "circle", l: "Circle (Default)" },
  { v: "squircle", l: "Squircle (28%)" },
  { v: "rounded", l: "Rounded (20px)" },
  { v: "square", l: "Tactical Square (4px)" },
  { v: "hexagon", l: "Hexagon (6-Sided)" },
  { v: "diamond", l: "Diamond (4-Point)" },
  { v: "star", l: "Star (10-Point)" },
  { v: "octagon", l: "Octagon (8-Sided)" },
];

export const BADGE_TOOLTIP_STYLES = [
  { v: "normal", l: "Normal (Rich Glowing Card)" },
  { v: "basic", l: "Basic (Dark Pill)" },
  { v: "mini", l: "Mini (Pure Text - No Background)" },
];

export const SPOTIFY_PRESENCE_FORMATS = [
  { v: "card", l: "Rich Card (Full Artwork & Timeline)" },
  { v: "compact", l: "Compact Player (Horizontal Row)" },
  { v: "pill", l: "Minimalist Pill (Glowing Status)" },
  { v: "ticker", l: "Marquee Ticker (Animated Marquee)" },
];

export const ENTRY_SCREEN_STYLES = [
  { v: "minimal", l: "Minimal Pill", desc: "Pill badge with pulsing accent beacon" },
  { v: "glass", l: "Frosted Glass Card", desc: "Interactive frosted card with glowing icon" },
  { v: "cyber", l: "Cyberpunk Tactical HUD", desc: "Corner-bracketed HUD with glowing neon border" },
  { v: "hologram", l: "Sci-Fi Hologram Beacon", desc: "Circular pulsating holographic emitter" },
  { v: "terminal", l: "Hacker Console", desc: "Monospace CLI prompt with interactive prompt" },
  { v: "fingerprint", l: "Biometric Touch Sensor", desc: "Tactile biometric scanner with radar ring" },
  { v: "gate", l: "Security Vault Gate", desc: "Shield gate with restricted access status" },
];

export const ENTRY_EXIT_ANIMATIONS = [
  { v: "fade_out", l: "Smooth Fade (Default)" },
  { v: "zoom_out", l: "Deep Warp Zoom Out" },
  { v: "slide_up", l: "Cinematic Slide Up" },
  { v: "glitch_exit", l: "Cyber Matrix Glitch" },
  { v: "curtain_split", l: "Curtain Split Open" },
];

export const ENTRY_PARTICLES = [
  { v: "none", l: "None (Clean Background)" },
  { v: "stars", l: "Stars Particles" },
  { v: "matrix", l: "Matrix Code Rain" },
  { v: "snow", l: "Soft Snowfall" },
  { v: "sparks", l: "Electric Sparks" },
  { v: "sakura", l: "Sakura Petals" },
];

export const AUDIO_PLAYER_STYLES = [
  { v: "bottom_dock", l: "Bottom Dock (Fixed Floating Bar)" },
  { v: "top_dock", l: "Top Dock (Fixed Floating Bar)" },
  { v: "incard", l: "Incard (Embedded In Bio Card)" },
  { v: "compact_pill", l: "Compact Floating Pill" },
  { v: "floating_widget", l: "Floating Draggable Widget" },
  { v: "none", l: "Invisible (Background Audio Only)" },
];

export const SOCIAL_ICON_STYLES = [
  { v: "glass", l: "Glass Circle (Default)" },
  { v: "clean", l: "Clean Floating (No Background)" },
  { v: "solid", l: "Dark Solid Circle" },
  { v: "neon", l: "Glowing Neon Aura" },
  { v: "minimal", l: "Minimalist Borderless" },
];

export const LINK_DISPLAY_OPTIONS = [
  { v: "both", l: "Both (Social Icons & Link Cards)" },
  { v: "cards", l: "Link Cards Only (Hide top duplicate icons)" },
  { v: "icons", l: "Social Icons Only (Clean icons row only)" },
];

export const LINK_LAYOUT_STYLES = [
  { v: "list", l: "Vertical List Stack" },
  { v: "grid_2col", l: "2-Column Compact Grid" },
  { v: "bento", l: "Asymmetric Bento Blocks" },
  { v: "pill", l: "Rounded Glass Pills" },
];

export const LINK_ANIMATIONS = [
  { v: "none", l: "None (Static)" },
  { v: "glow_pulse", l: "Glow Pulse (Breathing neon glow)" },
  { v: "neon_border", l: "Neon Border (Edge highlight pulse)" },
  { v: "shimmer", l: "Light Shimmer (Continuous metallic sheen)" },
  { v: "float_3d", l: "Floating 3D (Subtle floating wave)" },
  { v: "glass_lift", l: "Glass Lift (Smooth breathing zoom)" },
];

export const LINK_BTN_OPTIONS = [
  { v: "arrow", l: "External Arrow Icon" },
  { v: "copy", l: "Copy Link Button" },
  { v: "presence", l: "Live Presence Status Pill" },
  { v: "none", l: "Clean Minimal" },
];

// Helper UI primitives
export function Header({ title, subtitle, action }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-[#E5E7EB]/60 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Panel({ title, children, className = "" }) {
  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-[#0c0e15] border border-white/10 shadow-lg space-y-4 ${className}`}>
      {title && (
        <div className="text-xs font-bold uppercase tracking-wider text-[#5B8DB8] border-b border-white/5 pb-2 flex items-center justify-between">
          <span>{title}</span>
        </div>
      )}
      {children}
    </div>
  );
}

export function ToggleRow({ label, description, checked, onChange, testid }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <div>
        <span className="text-xs text-[#E5E7EB]/85 font-medium block">{label}</span>
        {description && <span className="text-[10px] text-[#E5E7EB]/45 block mt-0.5">{description}</span>}
      </div>
      <Switch data-testid={testid} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function SliderRow({ label, value, onChange, min = 0, max = 100, step = 1, suffix = "%" }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-[#E5E7EB]/70 font-medium">
        <span>{label}</span>
        <span className="font-mono text-white text-[11px]">{Math.round(value)}{suffix}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="cursor-pointer"
      />
    </div>
  );
}

export function SelectRow({ label, value, onChange, options }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-xs text-[#E5E7EB]/70 font-medium shrink-0">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs bg-[#080a10] border-white/10 text-white w-52 rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#0c0e15] border-white/10 text-white text-xs rounded-xl">
          {options.map((o) => (
            <SelectItem key={o.v} value={o.v} className="text-xs cursor-pointer">
              {o.l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ColorRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-xs text-[#E5E7EB]/70 font-medium">{label}</span>
      <div className="w-52">
        <CustomColorPicker value={value} onChange={onChange} label={label} />
      </div>
    </div>
  );
}

function DiscordProfilePreview({ user, settings }) {
  const discord = user?.connections?.discord || {};
  const status = settings.discord_presence_status || "online";
  const statusColor = { online: "#23a55a", idle: "#f0b232", dnd: "#f23f43", offline: "#80848e" }[status] || "#23a55a";
  const avatar = settings.discord_avatar_override
    ? fileUrl(settings.discord_avatar_override)
    : discord.avatar || (discord.id && discord.avatar_hash ? `https://cdn.discordapp.com/avatars/${discord.id}/${discord.avatar_hash}.png?size=128` : null);
  const displayName = settings.discord_custom_name || discord.global_name || discord.username || user?.display_name || user?.username || "Your Discord name";
  const username = discord.username ? `@${discord.username}` : "@discord-user";
  const viewStyle = settings.discord_style || "discord";
  const banner = settings.discord_larp_banner;
  const activity = settings.discord_activity_name;

  return (
    <div className={`mx-auto w-full max-w-[380px] overflow-hidden rounded-xl border text-[#dbdee1] shadow-xl ${viewStyle === "ghost" ? "border-white/15 bg-white/[0.04] backdrop-blur-xl" : viewStyle === "nobg" ? "border-white/10 bg-transparent" : "border-[#3f4147] bg-[#232428]"}`} data-testid="discord-profile-preview">
      {viewStyle === "discord" && <div className="h-20 bg-cover bg-center" style={{ backgroundImage: banner ? `url(${banner})` : "linear-gradient(120deg, #5865f2 0%, #353a8a 48%, #252641 100%)" }} />}
      <div className="px-4 pb-4">
        <div className={`${viewStyle === "discord" ? "-mt-9" : "mt-3"} mb-3 flex items-end justify-between`}>
          <div className="relative rounded-full border-[5px] border-[#232428] bg-[#36373d]">
            {avatar ? <img src={avatar} alt="Discord avatar preview" className="h-[76px] w-[76px] rounded-full object-cover" /> : <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full text-3xl font-bold text-white">{displayName.slice(0, 1).toUpperCase()}</div>}
            <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full border-[4px] border-[#232428]" style={{ background: statusColor }} />
          </div>
          <span className="mb-1 rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] font-semibold capitalize text-white/75">{status === "dnd" ? "Do Not Disturb" : status}</span>
        </div>
        <div className="text-base font-bold text-white">{displayName}</div>
        <div className="text-xs text-[#b5bac1]">{username}</div>
        {viewStyle === "discord" && <>
          <div className="my-3 border-t border-white/10" />
          <div className="text-[10px] font-bold uppercase tracking-wide text-[#b5bac1]">About me</div>
          <div className="mt-1 text-xs text-[#dbdee1]">{settings.discord_custom_status || "Set a custom status to show what you’re up to."}</div>
        </>}
        {viewStyle === "discord" && <div className="mt-3 rounded-lg bg-[#1e1f22] p-3">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[#b5bac1]">{activity ? "Playing a game" : "Activity"}</div>
          <div className="text-xs font-semibold text-white">{activity || "No activity yet"}</div>
          {settings.discord_activity_details && <div className="mt-0.5 text-[11px] text-[#b5bac1]">{settings.discord_activity_details}</div>}
        </div>}
        {!discord.id && <div className="mt-3 text-center text-[10px] text-amber-200/70">Preview uses your saved overrides. Connect Discord for your real avatar and live presence.</div>}
      </div>
    </div>
  );
}

function RealLayoutPreview({ layout, isSelected, pfpUrl }) {
  return (
    <div className="w-full h-24 rounded-xl bg-[#050609] border border-white/10 relative overflow-hidden flex flex-col justify-between p-2">
      {layout === "classic" && (
        <div className="flex flex-col items-center justify-center h-full gap-1.5">
          <div className="w-6 h-6 rounded-full bg-[#5B8DB8]/30 border border-[#5B8DB8]" />
          <div className="w-16 h-1.5 rounded-full bg-white/20" />
          <div className="w-24 h-2.5 rounded bg-white/10 border border-white/5" />
        </div>
      )}
      {layout === "minimal" && (
        <div className="flex flex-col justify-center h-full gap-1 px-3">
          <div className="w-14 h-1.5 rounded-full bg-[#5B8DB8]" />
          <div className="w-full h-2 rounded bg-white/10 border border-white/5" />
          <div className="w-full h-2 rounded bg-white/10 border border-white/5" />
        </div>
      )}
      {layout === "banner_left" && (
        <div className="h-full flex flex-col justify-between">
          <div className="h-8 rounded bg-[#5B8DB8]/20 border border-white/10 relative">
            <div className="absolute -bottom-2 left-2 w-5 h-5 rounded-full bg-[#5B8DB8] border border-white/20" />
          </div>
          <div className="w-full h-3 rounded bg-white/10 border border-white/5" />
        </div>
      )}
      {layout === "slideshow" && (
        <div className="flex items-center justify-between h-full gap-1 px-1">
          <div className="w-2 h-8 rounded bg-white/10" />
          <div className="flex-1 h-16 rounded-lg bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 flex flex-col items-center justify-center gap-1">
            <div className="w-5 h-5 rounded bg-[#5B8DB8]/40" />
            <div className="w-12 h-1 rounded bg-white/30" />
          </div>
          <div className="w-2 h-8 rounded bg-white/10" />
        </div>
      )}
      {layout === "bento_grid" && (
        <div className="grid grid-cols-2 gap-1 h-full">
          <div className="rounded bg-[#5B8DB8]/20 border border-[#5B8DB8]/30" />
          <div className="rounded bg-white/10 border border-white/5" />
          <div className="rounded bg-white/10 border border-white/5" />
          <div className="rounded bg-[#5B8DB8]/10 border border-white/5" />
        </div>
      )}
      {layout === "split_left" && (
        <div className="flex gap-1.5 h-full">
          <div className="w-1/3 rounded bg-[#5B8DB8]/20 border border-[#5B8DB8]/30 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-[#5B8DB8]" />
          </div>
          <div className="flex-1 flex flex-col justify-between gap-1">
            <div className="h-4 rounded bg-white/10 border border-white/5" />
            <div className="h-4 rounded bg-white/10 border border-white/5" />
          </div>
        </div>
      )}
      {layout === "floating_glass" && (
        <div className="flex flex-col items-center justify-center h-full gap-1.5">
          <div className="w-7 h-7 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-md" />
          <div className="w-20 h-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20" />
        </div>
      )}
      {layout === "grid_tiles" && (
        <div className="grid grid-cols-2 gap-1 w-full px-1 h-full items-center">
          <div className="h-7 rounded bg-white/10 border border-white/10" />
          <div className="h-7 rounded bg-white/10 border border-white/10" />
        </div>
      )}
    </div>
  );
}

export default function Editor({ initialTab = "profile" }) {
  const { user, setUser } = useAuth();
  const [editorCategory, setEditorCategory] = useState(initialTab || "profile");
  const editorTabsRef = useRef(null);
  const [s, setS] = useState(user?.settings || {});
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [description, setDescription] = useState(user?.description || "");
  const [saving, setSaving] = useState(false);

  // Modals state
  const [mediaModal, setMediaModal] = useState({ open: false, type: "pfp" });
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [bgModalOpen, setBgModalOpen] = useState(false);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [cursorModalOpen, setCursorModalOpen] = useState(false);
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [bioModalOpen, setBioModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setS(user.settings || {});
      setDisplayName(user.display_name || "");
      setUsername(user.username || "");
      setDescription(user.description || "");
    }
  }, [user]);

  useEffect(() => {
    if (initialTab) setEditorCategory(initialTab);
  }, [initialTab]);

  const patch = (k, v) => setS((p) => ({ ...p, [k]: v }));

  const patchAudio = (key, val) => {
    setS((p) => ({
      ...p,
      audio: {
        ...(p.audio || {}),
        [key]: val,
      },
    }));
  };

  const patchPresence = (key, val) => {
    setS((p) => ({
      ...p,
      presence: {
        ...(p.presence || {}),
        [key]: val,
      },
    }));
  };

  const patchEnterScreen = (key, val) => {
    setS((p) => ({
      ...p,
      enter_screen: {
        ...(p.enter_screen || {}),
        [key]: val,
      },
    }));
  };

  const patchWidgets = (widgetKey, field, val) => {
    setS((p) => ({
      ...p,
      widgets: {
        ...(p.widgets || {}),
        [widgetKey]: {
          ...((p.widgets && p.widgets[widgetKey]) || {}),
          [field]: val,
        },
      },
    }));
  };

  const uploadFile = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
    return data.url;
  };

  // Audio Track Manager Helpers
  const audioTracks = Array.isArray(s.audio?.tracks) ? s.audio.tracks : [];

  const handleAddAudioTrack = () => {
    const newTr = {
      id: `track_${Date.now()}`,
      name: "New Audio Track",
      artist: displayName || username || "Artist",
      url: "",
      cover: "",
      lyrics: "",
    };
    patchAudio("tracks", [...audioTracks, newTr]);
    toast.success("Added new audio track!");
  };

  const handleUpdateAudioTrack = (index, field, val) => {
    const updated = [...audioTracks];
    updated[index] = { ...updated[index], [field]: val };
    patchAudio("tracks", updated);
  };

  const handleRemoveAudioTrack = (index) => {
    const updated = audioTracks.filter((_, i) => i !== index);
    patchAudio("tracks", updated);
    toast.success("Track removed");
  };

  const handleUploadTrackFile = async (index, file) => {
    try {
      const url = await uploadFile(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      handleUpdateAudioTrack(index, "url", url);
      if (!audioTracks[index]?.name || audioTracks[index]?.name === "New Audio Track") {
        handleUpdateAudioTrack(index, "name", cleanName);
      }
      toast.success("Audio file uploaded successfully!");
    } catch {
      toast.error("Failed to upload audio file");
    }
  };

  const handleUploadTrackCover = async (index, file) => {
    try {
      const url = await uploadFile(file);
      handleUpdateAudioTrack(index, "cover", url);
      toast.success("Cover art uploaded!");
    } catch {
      toast.error("Failed to upload cover art");
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/profile", { display_name: displayName, username, description, settings: s });
      setUser(data);
      toast.success("Profile saved successfully!");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const pfpSrc = fileUrl(s.pfp) || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
  const bgSrc = fileUrl(s.banner);
  const bannerSrc = fileUrl(s.header_banner || s.banner);
  const cursorSrc = fileUrl(s.cursor);

  const openMediaModal = (type) => {
    setMediaModal({ open: true, type });
  };

  const handleSaveMediaAsset = ({ url, config }) => {
    if (mediaModal.type === "pfp") {
      setS((p) => ({ ...p, pfp: url, pfp_config: config }));
    } else if (mediaModal.type === "background") {
      setS((p) => ({ ...p, banner: url, bg_config: config }));
    } else if (mediaModal.type === "banner") {
      setS((p) => ({ ...p, header_banner: url, header_banner_config: config, header_banner_invisible: config.invisible }));
    } else if (mediaModal.type === "cursor") {
      setS((p) => ({ ...p, cursor: url, cursor_config: config }));
    }
  };

  const applyEffectToTarget = (eff, target) => {
    const currentVal = target === "name" ? (displayName || username || "swats") : (description || "Bio description");
    const clean = currentVal.replace(/^:[a-zA-Z0-9_#-]+:(.*?)(?::[a-zA-Z0-9_#-]+)?:$/g, "$1").trim();
    const wrapped = eff.wrap(clean, s.sparkle_color || s.accent_color || "#5B8DB8");
    if (target === "name") {
      setDisplayName(wrapped);
      toast.success(`Applied ${eff.name} to Display Name!`);
    } else {
      setDescription(wrapped);
      toast.success(`Applied ${eff.name} to Bio Description!`);
    }
    setActiveFxTarget(null);
  };

  const activeLayout = s.card_layout || "classic";

  return (
    <div className="w-full max-w-[1900px] mx-auto space-y-5">
      {/* Top Header & Save Bar */}
      <Header
        title="Customization Studio"
        subtitle="Visuals, animations, positioning, audio player, Spotify presence & badge tooltips."
        action={
          <div className="flex items-center gap-3">
            <a
              href={`/${encodeURIComponent(username)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/15 px-3.5 text-xs text-white/80 hover:bg-white/5 transition-all font-semibold"
            >
              <Eye size={14} /> View Live Bio
            </a>
            <Button
              onClick={save}
              disabled={saving}
              className="bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white text-xs font-bold px-5 h-9 rounded-xl shadow-[0_0_15px_rgba(91,141,184,0.35)] gap-1.5 cursor-pointer"
            >
              <Save size={14} /> {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        }
      />

      {/* Subtabs Bar */}
      <div ref={editorTabsRef} className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setEditorCategory("profile")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            editorCategory === "profile"
              ? "bg-[#5B8DB8] text-white shadow-md shadow-[#5B8DB8]/20"
              : "bg-white/5 text-[#E5E7EB]/70 hover:text-white hover:bg-white/10"
          }`}
        >
          <Palette size={14} /> Main Profile & Assets
        </button>
        <button
          type="button"
          onClick={() => setEditorCategory("layout")}
          aria-pressed={editorCategory === "layout"}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            editorCategory === "layout"
              ? "bg-[#5B8DB8] text-white shadow-md shadow-[#5B8DB8]/20"
              : "bg-white/5 text-[#E5E7EB]/70 hover:text-white hover:bg-white/10"
          }`}
        >
          <Layers size={14} /> Layout & Positioning
        </button>
        <button
          type="button"
          onClick={() => setEditorCategory("audio")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            editorCategory === "audio"
              ? "bg-[#5B8DB8] text-white shadow-md shadow-[#5B8DB8]/20"
              : "bg-white/5 text-[#E5E7EB]/70 hover:text-white hover:bg-white/10"
          }`}
        >
          <Music size={14} /> Audio Player Studio
        </button>
        <button
          type="button"
          onClick={() => setEditorCategory("discord")}
          aria-pressed={editorCategory === "discord"}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            editorCategory === "discord"
              ? "bg-[#5865F2] text-white shadow-md shadow-[#5865F2]/20"
              : "bg-white/5 text-[#E5E7EB]/70 hover:text-white hover:bg-white/10"
          }`}
        >
          <SiDiscord size={14} className="text-[#5865F2]" /> Discord Presence
        </button>
        <button
          type="button"
          onClick={() => setEditorCategory("spotify")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            editorCategory === "spotify"
              ? "bg-[#1DB954] text-white shadow-md shadow-[#1DB954]/20"
              : "bg-white/5 text-[#E5E7EB]/70 hover:text-white hover:bg-white/10"
          }`}
        >
          <SiSpotify size={14} className="text-[#1DB954]" /> Spotify Integration
        </button>
        <button
          type="button"
          onClick={() => setEditorCategory("widgets")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            editorCategory === "widgets"
              ? "bg-[#F59E0B] text-white shadow-md shadow-[#F59E0B]/20"
              : "bg-white/5 text-[#E5E7EB]/70 hover:text-white hover:bg-white/10"
          }`}
        >
          <AppWindow size={14} className="text-[#F59E0B]" /> Live Widgets Studio
        </button>
        <button
          type="button"
          onClick={() => setEditorCategory("lander")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            editorCategory === "lander"
              ? "bg-[#5B8DB8] text-white shadow-md shadow-[#5B8DB8]/20"
              : "bg-white/5 text-[#E5E7EB]/70 hover:text-white hover:bg-white/10"
          }`}
        >
          <DoorOpen size={14} className="text-[#5B8DB8]" /> Lander & Entry Screen
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: MAIN PROFILE & ASSETS                                           */}
      {/* ========================================================================= */}
      {editorCategory === "profile" && (
        <div className="space-y-6">
          {/* Main Visual Assets Box (4 Preview Boxes Stacked 165x165) */}
          <Panel title="Profile Visual Assets & Effects Studios">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 justify-items-center sm:justify-items-start">
              {/* 1. Profile Picture Box */}
              <div className="w-[165px] flex flex-col gap-1.5">
                <div
                  onClick={() => openMediaModal("pfp")}
                  className="group relative w-[165px] h-[165px] rounded-2xl border-2 border-white/10 hover:border-[#5B8DB8] bg-[#07090e] cursor-pointer overflow-hidden flex flex-col items-center justify-center transition-all shadow-md hover:shadow-[0_0_20px_rgba(91,141,184,0.3)]"
                >
                  <div className="w-full h-full flex items-center justify-center p-3 group-hover:blur-[2px] group-hover:scale-105 transition-all duration-300">
                    <img
                      src={pfpSrc}
                      alt="PFP"
                      className="w-24 h-24 rounded-full object-cover border-2 border-white/20 shadow-inner"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-2 text-center transition-all duration-200">
                    <Upload size={18} className="text-[#5B8DB8] mb-1 animate-bounce" />
                    <span className="text-xs font-bold text-white leading-tight">Change Image</span>
                    <span className="text-[10px] text-[#5B8DB8] font-mono mt-0.5">Upload / URL</span>
                  </div>
                  <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-white/70 border border-white/10 pointer-events-none">
                    PFP (165×165)
                  </div>
                </div>
                <div className="flex gap-1 w-full">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => openMediaModal("pfp")}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-[11px] h-7 rounded-lg font-medium cursor-pointer"
                  >
                    <Upload size={11} className="mr-1" /> Upload
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setAvatarModalOpen(true)}
                    className="flex-1 bg-[#5B8DB8]/15 hover:bg-[#5B8DB8]/30 text-[#5B8DB8] hover:text-white border border-[#5B8DB8]/30 text-[11px] h-7 rounded-lg font-bold cursor-pointer"
                  >
                    <Sparkles size={11} className="mr-1" /> PFP FX
                  </Button>
                </div>
              </div>

              {/* 2. Background Media Box */}
              <div className="w-[165px] flex flex-col gap-1.5">
                <div
                  onClick={() => openMediaModal("background")}
                  className="group relative w-[165px] h-[165px] rounded-2xl border-2 border-white/10 hover:border-[#5B8DB8] bg-[#07090e] cursor-pointer overflow-hidden flex flex-col items-center justify-center transition-all shadow-md hover:shadow-[0_0_20px_rgba(91,141,184,0.3)]"
                >
                  <div className="w-full h-full flex items-center justify-center group-hover:blur-[2px] group-hover:scale-105 transition-all duration-300">
                    {bgSrc ? (
                      <img src={bgSrc} alt="Background" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-3 text-white/40">
                        <ImageIcon size={28} className="mx-auto mb-1 opacity-50" />
                        <span className="text-[10px]">Clean Solid</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-2 text-center transition-all duration-200">
                    <Upload size={18} className="text-[#5B8DB8] mb-1 animate-bounce" />
                    <span className="text-xs font-bold text-white leading-tight">Change Background</span>
                    <span className="text-[10px] text-[#5B8DB8] font-mono mt-0.5">Upload / URL</span>
                  </div>
                  <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-white/70 border border-white/10 pointer-events-none truncate max-w-[145px]">
                    {s.bg_effect && s.bg_effect !== "none" ? `FX: ${s.bg_effect}` : "Background"}
                  </div>
                </div>
                <div className="flex gap-1 w-full">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => openMediaModal("background")}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-[11px] h-7 rounded-lg font-medium cursor-pointer"
                  >
                    <Upload size={11} className="mr-1" /> Upload
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setBgModalOpen(true)}
                    className="flex-1 bg-[#5B8DB8]/15 hover:bg-[#5B8DB8]/30 text-[#5B8DB8] hover:text-white border border-[#5B8DB8]/30 text-[11px] h-7 rounded-lg font-bold cursor-pointer"
                  >
                    <Wand2 size={11} className="mr-1" /> BG FX
                  </Button>
                </div>
              </div>

              {/* 3. Banner Box */}
              <div className="w-[165px] flex flex-col gap-1.5">
                <div
                  onClick={() => openMediaModal("banner")}
                  className="group relative w-[165px] h-[165px] rounded-2xl border-2 border-white/10 hover:border-[#5B8DB8] bg-[#07090e] cursor-pointer overflow-hidden flex flex-col items-center justify-center transition-all shadow-md hover:shadow-[0_0_20px_rgba(91,141,184,0.3)]"
                >
                  <div className="w-full h-full flex items-center justify-center group-hover:blur-[2px] group-hover:scale-105 transition-all duration-300">
                    {bannerSrc ? (
                      <img src={bannerSrc} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-3 text-white/40">
                        <Layers size={28} className="mx-auto mb-1 opacity-50" />
                        <span className="text-[10px]">No Banner</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-2 text-center transition-all duration-200">
                    <Upload size={18} className="text-[#5B8DB8] mb-1 animate-bounce" />
                    <span className="text-xs font-bold text-white leading-tight">Change Banner</span>
                    <span className="text-[10px] text-[#5B8DB8] font-mono mt-0.5">Upload / URL</span>
                  </div>
                  <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-white/70 border border-white/10 pointer-events-none truncate max-w-[145px]">
                    {s.banner_fx && s.banner_fx !== "none" ? `FX: ${s.banner_fx}` : "Banner"}
                  </div>
                </div>
                <div className="flex gap-1 w-full">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => openMediaModal("banner")}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-[11px] h-7 rounded-lg font-medium cursor-pointer"
                  >
                    <Upload size={11} className="mr-1" /> Upload
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setBannerModalOpen(true)}
                    className="flex-1 bg-[#5B8DB8]/15 hover:bg-[#5B8DB8]/30 text-[#5B8DB8] hover:text-white border border-[#5B8DB8]/30 text-[11px] h-7 rounded-lg font-bold cursor-pointer"
                  >
                    <Layers size={11} className="mr-1" /> Banner FX
                  </Button>
                </div>
              </div>

              {/* 4. Cursor Box */}
              <div className="w-[165px] flex flex-col gap-1.5">
                <div
                  onClick={() => openMediaModal("cursor")}
                  className="group relative w-[165px] h-[165px] rounded-2xl border-2 border-white/10 hover:border-[#5B8DB8] bg-[#07090e] cursor-pointer overflow-hidden flex flex-col items-center justify-center transition-all shadow-md hover:shadow-[0_0_20px_rgba(91,141,184,0.3)]"
                >
                  <div className="w-full h-full flex items-center justify-center group-hover:blur-[2px] group-hover:scale-105 transition-all duration-300">
                    {cursorSrc ? (
                      <img src={cursorSrc} alt="Cursor" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(91,141,184,0.5)]" />
                    ) : (
                      <div className="text-center p-3 text-white/40">
                        <MousePointer2 size={28} className="mx-auto mb-1 opacity-50" />
                        <span className="text-[10px]">Default Cursor</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-2 text-center transition-all duration-200">
                    <Upload size={18} className="text-[#5B8DB8] mb-1 animate-bounce" />
                    <span className="text-xs font-bold text-white leading-tight">Change Cursor</span>
                    <span className="text-[10px] text-[#5B8DB8] font-mono mt-0.5">Custom Image</span>
                  </div>
                  <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-white/70 border border-white/10 pointer-events-none truncate max-w-[145px]">
                    {s.cursor_fx && s.cursor_fx !== "none" ? `FX: ${s.cursor_fx}` : "Cursor"}
                  </div>
                </div>
                <div className="flex gap-1 w-full">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => openMediaModal("cursor")}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-[11px] h-7 rounded-lg font-medium cursor-pointer"
                  >
                    <Upload size={11} className="mr-1" /> Custom
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setCursorModalOpen(true)}
                    className="flex-1 bg-[#5B8DB8]/15 hover:bg-[#5B8DB8]/30 text-[#5B8DB8] hover:text-white border border-[#5B8DB8]/30 text-[11px] h-7 rounded-lg font-bold cursor-pointer"
                  >
                    <MousePointer2 size={11} className="mr-1" /> Cursor FX
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick-Access Effect Studios Bar */}
            <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#5B8DB8]">
                Visual & Ambient Effects Studios
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <Button
                  type="button"
                  onClick={() => setAvatarModalOpen(true)}
                  className="bg-[#080a10] hover:bg-[#5B8DB8]/20 text-white hover:text-[#5B8DB8] border border-white/10 hover:border-[#5B8DB8]/50 h-9 rounded-xl text-xs font-bold gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <Sparkles size={14} className="text-[#5B8DB8]" /> PFP & Frame FX
                </Button>
                <Button
                  type="button"
                  onClick={() => setBgModalOpen(true)}
                  className="bg-[#080a10] hover:bg-[#5B8DB8]/20 text-white hover:text-[#5B8DB8] border border-white/10 hover:border-[#5B8DB8]/50 h-9 rounded-xl text-xs font-bold gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <Wand2 size={14} className="text-[#5B8DB8]" /> Background FX
                </Button>
                <Button
                  type="button"
                  onClick={() => setBannerModalOpen(true)}
                  className="bg-[#080a10] hover:bg-[#5B8DB8]/20 text-white hover:text-[#5B8DB8] border border-white/10 hover:border-[#5B8DB8]/50 h-9 rounded-xl text-xs font-bold gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <Layers size={14} className="text-[#5B8DB8]" /> Banner FX
                </Button>
                <Button
                  type="button"
                  onClick={() => setCursorModalOpen(true)}
                  className="bg-[#080a10] hover:bg-[#5B8DB8]/20 text-white hover:text-[#5B8DB8] border border-white/10 hover:border-[#5B8DB8]/50 h-9 rounded-xl text-xs font-bold gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <MousePointer2 size={14} className="text-[#5B8DB8]" /> Cursor FX
                </Button>
              </div>
            </div>

            {/* 4 Dedicated Identity Effect Navigation Controls */}
            <div className="pt-2 border-t border-white/5 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#E5E7EB]/50">
                Identity & Text Effects Studios
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <Button
                  type="button"
                  onClick={() => setNameModalOpen(true)}
                  className="bg-[#080a10] hover:bg-[#5B8DB8]/20 text-white hover:text-[#5B8DB8] border border-white/10 hover:border-[#5B8DB8]/50 h-9 rounded-xl text-xs font-bold gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <Sparkles size={14} className="text-[#5B8DB8]" /> Name Effects
                </Button>
                <Button
                  type="button"
                  onClick={() => setBioModalOpen(true)}
                  className="bg-[#080a10] hover:bg-[#5B8DB8]/20 text-white hover:text-[#5B8DB8] border border-white/10 hover:border-[#5B8DB8]/50 h-9 rounded-xl text-xs font-bold gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <FileText size={14} className="text-[#5B8DB8]" /> Bio Effects
                </Button>
                <Button
                  type="button"
                  onClick={() => setLocationModalOpen(true)}
                  className="bg-[#080a10] hover:bg-[#5B8DB8]/20 text-white hover:text-[#5B8DB8] border border-white/10 hover:border-[#5B8DB8]/50 h-9 rounded-xl text-xs font-bold gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <Icons.MapPin size={14} className="text-[#5B8DB8]" /> Location Effects
                </Button>
                <Button
                  type="button"
                  onClick={() => setRoleModalOpen(true)}
                  className="bg-[#080a10] hover:bg-[#5B8DB8]/20 text-white hover:text-[#5B8DB8] border border-white/10 hover:border-[#5B8DB8]/50 h-9 rounded-xl text-xs font-bold gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <Award size={14} className="text-[#5B8DB8]" /> Role Effects
                </Button>
              </div>
            </div>
          </Panel>

          {/* PFP Shape & Badge Tooltip Styling */}
          <Panel title="Avatar Frame Shape & Accolade Tooltips">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <SelectRow
                  label="PFP Frame Shape"
                  value={s.avatar_style || s.pfp_shape || "circle"}
                  onChange={(v) => {
                    patch("avatar_style", v);
                    patch("pfp_shape", v);
                  }}
                  options={PFP_FRAME_SHAPES}
                />
                <div className="text-[11px] text-[#E5E7EB]/50">
                  Select your profile frame silhouette. Applies clean geometrical clipping with glowing borders.
                </div>
              </div>

              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <SelectRow
                  label="Badge Tooltip Mode"
                  value={s.badge_tooltip_style || s.badge_style?.tooltip_style || "normal"}
                  onChange={(v) => {
                    patch("badge_tooltip_style", v);
                    setS((p) => ({ ...p, badge_style: { ...(p.badge_style || {}), tooltip_style: v } }));
                  }}
                  options={BADGE_TOOLTIP_STYLES}
                />
                <div className="text-[11px] text-[#E5E7EB]/50">
                  • <b>Normal:</b> Glowing card with description & icon.<br />
                  • <b>Basic:</b> Minimal dark badge pill.<br />
                  • <b>Mini:</b> Zero background, pure crisp glowing text only.
                </div>
              </div>
            </div>
          </Panel>

          {/* Profile Identity Text Inputs - Clean, direct, minimal */}
          <Panel title="Profile Identity">
            <div className="space-y-3.5">
              <div className="space-y-1">
                <Label className="text-xs text-[#E5E7EB]/80 font-semibold">Display Name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display Name"
                  className="bg-[#080a10] border-white/10 text-white h-9 text-xs rounded-xl focus:border-[#5B8DB8]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-[#E5E7EB]/80 font-semibold">Username</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="bg-[#080a10] border-white/10 text-white h-9 text-xs rounded-xl focus:border-[#5B8DB8]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-[#E5E7EB]/80 font-semibold">Bio</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Biography or description"
                  className="bg-[#080a10] border-white/10 text-white text-xs rounded-xl focus:border-[#5B8DB8] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-[#E5E7EB]/80 font-semibold">Occupation</Label>
                  <Input
                    value={s.occupation || ""}
                    onChange={(e) => patch("occupation", e.target.value)}
                    placeholder="Occupation / Role"
                    className="bg-[#080a10] border-white/10 text-white h-9 text-xs rounded-xl focus:border-[#5B8DB8]"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-[#E5E7EB]/80 font-semibold">Location</Label>
                  <Input
                    value={s.location || ""}
                    onChange={(e) => patch("location", e.target.value)}
                    placeholder="Location"
                    className="bg-[#080a10] border-white/10 text-white h-9 text-xs rounded-xl focus:border-[#5B8DB8]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-[#E5E7EB]/80 font-semibold">Tags</Label>
                <Input
                  value={s.tags || ""}
                  onChange={(e) => patch("tags", e.target.value)}
                  placeholder="Tags (comma-separated, e.g. dev, web3, design)"
                  className="bg-[#080a10] border-white/10 text-white h-9 text-xs rounded-xl focus:border-[#5B8DB8]"
                />
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: LAYOUT & POSITIONING                                            */}
      {/* ========================================================================= */}
      {editorCategory === "layout" && (
        <div className="space-y-6" data-testid="layout-editor">
          {/* Layout Selector Panel */}
          <Panel title="Profile View Type & Layout">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3 rounded-xl border border-[#5B8DB8]/25 bg-[#5B8DB8]/[0.07] p-3">
                <div>
                  <Label className="text-white text-xs font-bold block">View type</Label>
                  <span className="text-[10px] text-white/50">Choose how visitors see your profile. Preview and save when ready.</span>
                </div>
                <Select value={activeLayout} onValueChange={(value) => patch("card_layout", value)}>
                  <SelectTrigger aria-label="Profile view type" className="w-56 bg-[#080a10] border-white/10 text-white text-xs h-9">
                    <SelectValue placeholder="Choose a profile view" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0c0e15] border-white/10 text-white text-xs">
                    {CARD_LAYOUTS.map((layout) => <SelectItem key={layout.v} value={layout.v}>{layout.l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-[#E5E7EB]/70 text-xs font-semibold">All layouts</Label>
                <span className="text-xs text-[#5B8DB8] font-bold font-mono" aria-live="polite">
                  {CARD_LAYOUTS.find((cl) => cl.v === activeLayout)?.l || "Classic"} selected
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {CARD_LAYOUTS.map((layout) => {
                  const active = activeLayout === layout.v;
                  return (
                    <button
                      key={layout.v}
                      type="button"
                      onClick={() => patch("card_layout", layout.v)}
                      className={`flex flex-col gap-2 p-2.5 rounded-2xl border text-left transition-all relative group cursor-pointer ${
                        active
                          ? "border-[#5B8DB8] bg-[#5B8DB8]/20 ring-2 ring-[#5B8DB8]/50 shadow-[0_0_16px_rgba(91,141,184,0.3)]"
                          : "border-white/10 bg-[#080a10] hover:border-[#5B8DB8]/50 hover:bg-[#111624]"
                      }`}
                    >
                      <RealLayoutPreview
                        layout={layout.v}
                        isSelected={active}
                        pfpUrl={pfpSrc}
                      />
                      <div>
                        <div className={`text-xs font-bold truncate ${active ? "text-[#5B8DB8]" : "text-white"}`}>
                          {layout.l}
                        </div>
                        <div className="text-[10px] text-[#E5E7EB]/50 line-clamp-1 mt-0.5">
                          {layout.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </Panel>

          {/* DEDICATED CUSTOM POSITIONING & ALIGNMENT CONTROLS */}
          <Panel title="Element Positioning & Alignment Overrides">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Avatar Positioning */}
              <div className="p-4 rounded-xl bg-[#080a10] border border-white/5 space-y-3">
                <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-1 border-b border-white/5">
                  <MoveVertical size={13} className="text-[#5B8DB8]" /> Avatar Dimensions & Alignment
                </div>
                <SelectRow
                  label="Avatar Alignment"
                  value={s.avatar_alignment || "center"}
                  onChange={(v) => patch("avatar_alignment", v)}
                  options={[
                    { v: "left", l: "Left Aligned" },
                    { v: "center", l: "Centered" },
                    { v: "right", l: "Right Aligned" },
                  ]}
                />
                <SliderRow
                  label="Avatar Size Scale"
                  value={s.avatar_size || 96}
                  min={48}
                  max={140}
                  suffix="px"
                  onChange={(v) => patch("avatar_size", v)}
                />
                <SliderRow
                  label="Avatar Vertical Offset (Y)"
                  value={s.avatar_offset_y || 0}
                  min={-40}
                  max={40}
                  suffix="px"
                  onChange={(v) => patch("avatar_offset_y", v)}
                />
              </div>

              {/* Title & Name Positioning */}
              <div className="p-4 rounded-xl bg-[#080a10] border border-white/5 space-y-3">
                <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-1 border-b border-white/5">
                  <MoveHorizontal size={13} className="text-[#5B8DB8]" /> Title & Typography Alignment
                </div>
                <SelectRow
                  label="Display Name Alignment"
                  value={s.title_alignment || "center"}
                  onChange={(v) => patch("title_alignment", v)}
                  options={[
                    { v: "left", l: "Left Aligned" },
                    { v: "center", l: "Centered" },
                    { v: "right", l: "Right Aligned" },
                  ]}
                />
                <SelectRow
                  label="Bio Description Alignment"
                  value={s.desc_alignment || "center"}
                  onChange={(v) => patch("desc_alignment", v)}
                  options={[
                    { v: "left", l: "Left Aligned" },
                    { v: "center", l: "Centered" },
                    { v: "right", l: "Right Aligned" },
                  ]}
                />
                <SliderRow
                  label="Title Font Size"
                  value={s.title_size || 24}
                  min={16}
                  max={42}
                  suffix="px"
                  onChange={(v) => patch("title_size", v)}
                />
                <SliderRow
                  label="Title Vertical Offset (Y)"
                  value={s.title_offset_y || 0}
                  min={-30}
                  max={30}
                  suffix="px"
                  onChange={(v) => patch("title_offset_y", v)}
                />
              </div>

              {/* Badges & Social Placement */}
              <div className="p-4 rounded-xl bg-[#080a10] border border-white/5 space-y-3">
                <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-1 border-b border-white/5">
                  <Sparkles size={13} className="text-[#5B8DB8]" /> Badges Placement & Align
                </div>
                <SelectRow
                  label="Badges Alignment"
                  value={s.badges_alignment || "center"}
                  onChange={(v) => patch("badges_alignment", v)}
                  options={[
                    { v: "left", l: "Left Aligned" },
                    { v: "center", l: "Centered" },
                    { v: "right", l: "Right Aligned" },
                  ]}
                />
                <SelectRow
                  label="Badges Placement"
                  value={s.badges_position || "below_name"}
                  onChange={(v) => patch("badges_position", v)}
                  options={[
                    { v: "below_name", l: "Below Name & Username" },
                    { v: "next_to_name", l: "Next to Name (Inline)" },
                    { v: "below_desc", l: "Below Bio Description" },
                    { v: "above_avatar", l: "Above Avatar" },
                  ]}
                />
              </div>

              {/* Social Icons & Views Counter */}
              <div className="p-4 rounded-xl bg-[#080a10] border border-white/5 space-y-3">
                <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-1 border-b border-white/5">
                  <Share2 size={13} className="text-[#5B8DB8]" /> Social Icons & Views Placement
                </div>
                <SelectRow
                  label="Social Icons Alignment"
                  value={s.icons_alignment || "center"}
                  onChange={(v) => patch("icons_alignment", v)}
                  options={[
                    { v: "left", l: "Left Aligned" },
                    { v: "center", l: "Centered" },
                    { v: "right", l: "Right Aligned" },
                  ]}
                />
                <SelectRow
                  label="Views Badge Placement"
                  value={s.views_position || "below_name"}
                  onChange={(v) => patch("views_position", v)}
                  options={[
                    { v: "below_name", l: "Below Name" },
                    { v: "above_avatar", l: "Above Avatar" },
                    { v: "bottom_card", l: "Bottom of Card" },
                    { v: "none", l: "Hidden" },
                  ]}
                />
              </div>

              {/* Profile Card Style & Corner Radius */}
              <div className="p-4 rounded-xl bg-[#080a10] border border-white/5 space-y-3">
                <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-1 border-b border-white/5">
                  <Palette size={13} className="text-[#5B8DB8]" /> Profile Card Style & Radius
                </div>
                <SelectRow
                  label="Card Style Preset"
                  value={s.card_style || "classic"}
                  onChange={(v) => patch("card_style", v)}
                  options={CARD_STYLES}
                />
                <SelectRow
                  label="Corner Radius"
                  value={s.card_radius !== undefined ? String(s.card_radius) : "16"}
                  onChange={(v) => patch("card_radius", v)}
                  options={CARD_RADIUS_OPTIONS}
                />
                <SliderRow
                  label="Card Opacity"
                  value={s.card_opacity !== undefined ? Number(s.card_opacity) : 75}
                  min={0}
                  max={100}
                  suffix="%"
                  onChange={(v) => patch("card_opacity", v)}
                />
                <SliderRow
                  label="Card Backdrop Blur"
                  value={s.bg_blur !== undefined ? Number(s.bg_blur) : 12}
                  min={0}
                  max={40}
                  suffix="px"
                  onChange={(v) => patch("bg_blur", v)}
                />
              </div>
            </div>
          </Panel>

          {/* Slideshow Deck Manager */}
          {(activeLayout === "slideshow" || s.slideshow_enabled) && (
            <Panel title="Slideshow Deck System">
              <SlideshowManager
                slideshowConfig={s.slideshow || { slides: [] }}
                onChange={(newSlideshow) => patch("slideshow", newSlideshow)}
                uploadFile={uploadFile}
              />
            </Panel>
          )}

          {/* Deck HUD & Overlay Widgets */}
          {(activeLayout === "slideshow" || s.slideshow_enabled) && (
            <Panel title="Deck HUD & Overlay Widgets">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ToggleRow label="Show Deck HUD Overlay" description="Master switch for every floating deck overlay" checked={s.slideshow_hud_enabled !== false} onChange={(v) => patch("slideshow_hud_enabled", v)} />
                <ToggleRow label="Top-Left Audio Pill" description="Now-playing pill with full elapsed / total time" checked={s.slideshow_audio_enabled !== false} onChange={(v) => patch("slideshow_audio_enabled", v)} />
                <ToggleRow label="Bottom-Left Stats" description="Views & location indicator" checked={s.slideshow_stats_enabled !== false} onChange={(v) => patch("slideshow_stats_enabled", v)} />
                <ToggleRow label="Right-Side Slide Dots" description="Jump-to-slide indicator (stays pinned while scrolling)" checked={s.slideshow_dots_enabled !== false} onChange={(v) => patch("slideshow_dots_enabled", v)} />
                <ToggleRow label="Scroll Hint" description="Bottom-center prompt on the first slide" checked={s.slideshow_scroll_hint_enabled !== false} onChange={(v) => patch("slideshow_scroll_hint_enabled", v)} />
                <ToggleRow label="Smooth Scroll Lag" description="HUD gently trails the scroll instead of snapping" checked={s.slideshow_smooth_scroll !== false} onChange={(v) => patch("slideshow_smooth_scroll", v)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <SelectRow label="Slide Transition" value={s.slideshow_transition || "fade"} onChange={(v) => patch("slideshow_transition", v)} options={[{ v: "fade", l: "Fade" }, { v: "slide", l: "None (snap)" }]} />
                <SliderRow label="Slide Height" value={s.slideshow_slide_height || 85} min={65} max={110} suffix="vh" onChange={(v) => patch("slideshow_slide_height", v)} />
              </div>
            </Panel>
          )}

          {/* Global Visual Parameters */}
          <Panel title="Global Surface Parameters (Alpha, Colors & Sizes)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <SliderRow
                  label="Card Surface Opacity (Alpha)"
                  value={(s.card_alpha !== undefined ? s.card_alpha : 0.9) * 100}
                  onChange={(v) => patch("card_alpha", v / 100)}
                />
                <SliderRow
                  label="Card Backdrop Blur"
                  value={s.bg_blur !== undefined ? s.bg_blur : 16}
                  max={40}
                  suffix="px"
                  onChange={(v) => patch("bg_blur", v)}
                />
              </div>

              <div className="space-y-2 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <SelectRow
                  label="Card Width Preset"
                  value={s.card_width || "md"}
                  onChange={(v) => patch("card_width", v)}
                  options={CARD_WIDTHS}
                />
                <ColorRow
                  label="Accent & Glow Color"
                  value={s.accent_color || "#5B8DB8"}
                  onChange={(v) => patch("accent_color", v)}
                />
              </div>
            </div>
          </Panel>

          {/* Global Badge Color & Glow Overlap */}
          <Panel title="Global Badge Color & Glow Overlap (Override All Badges)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <ColorRow
                  label="Override All Badge Colors"
                  value={s.badge_color_overlap || ""}
                  onChange={(v) => patch("badge_color_overlap", v)}
                />
                <div className="text-[10px] text-[#E5E7EB]/50">
                  Overrides the primary icon/border color for all displayed badges uniformly. Leave empty for original badge colors.
                </div>
              </div>

              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <ColorRow
                  label="Override All Badge Glow Colors"
                  value={s.badge_glow_overlap || ""}
                  onChange={(v) => patch("badge_glow_overlap", v)}
                />
                <div className="text-[10px] text-[#E5E7EB]/50">
                  Custom glowing shadow color applied behind every badge icon and container.
                </div>
              </div>
            </div>
          </Panel>

          {/* Global Link Color & Glow Overlap */}
          <Panel title="Global Link Color & Glow Overlap (Override All Links)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <ColorRow
                  label="Override All Link Button Colors"
                  value={s.link_color_overlap || ""}
                  onChange={(v) => patch("link_color_overlap", v)}
                />
                <div className="text-[10px] text-[#E5E7EB]/50">
                  Forces all link cards and tiles to use this uniform background color/glass overlay.
                </div>
              </div>

              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <ColorRow
                  label="Override All Link Glow Colors"
                  value={s.link_glow_overlap || ""}
                  onChange={(v) => patch("link_glow_overlap", v)}
                />
                <div className="text-[10px] text-[#E5E7EB]/50">
                  Ambient box-shadow and hover glow color across all social buttons and link cards.
                </div>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: AUDIO PLAYER STUDIO                                             */}
      {/* ========================================================================= */}
      {editorCategory === "audio" && (
        <div className="space-y-6">
          <Panel title="Audio Player Controls & Style Settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <ToggleRow
                  label="Enable Audio Player"
                  description="Stream custom background music on profile load"
                  checked={s.audio?.display !== false}
                  onChange={(v) => patchAudio("display", v)}
                />
                <SelectRow
                  label="Audio Player Style"
                  value={s.audio?.style || s.audio?.card_style || "bottom_dock"}
                  onChange={(v) => {
                    patchAudio("style", v);
                    patchAudio("card_style", v);
                  }}
                  options={AUDIO_PLAYER_STYLES}
                />
                <SliderRow
                  label="Default Volume"
                  value={s.audio?.volume !== undefined ? s.audio.volume : 65}
                  min={0}
                  max={100}
                  suffix="%"
                  onChange={(v) => patchAudio("volume", v)}
                />
              </div>

              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <ToggleRow
                  label="Autoplay on Load"
                  description="Attempts instant playback upon page visit"
                  checked={s.audio?.autoplay !== false}
                  onChange={(v) => patchAudio("autoplay", v)}
                />
                <ToggleRow
                  label="Loop Playlist"
                  description="Continuous playback loop"
                  checked={s.audio?.loop !== false}
                  onChange={(v) => patchAudio("loop", v)}
                />
                <ToggleRow
                  label="Shuffle / Random Order"
                  description="Randomize track order upon load"
                  checked={s.audio?.randomize === true}
                  onChange={(v) => patchAudio("randomize", v)}
                />
                <ToggleRow
                  label="Show Synced Lyrics Button"
                  description="Enable animated lyrics popup"
                  checked={s.audio?.show_lyrics !== false}
                  onChange={(v) => patchAudio("show_lyrics", v)}
                />
              </div>
            </div>
          </Panel>

          {/* Audio Playlist Manager */}
          <Panel title={`Audio Tracks Playlist (${audioTracks.length})`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#E5E7EB]/70">
                  Upload MP3 files or paste direct audio streaming URLs.
                </span>
                <Button
                  type="button"
                  onClick={handleAddAudioTrack}
                  className="bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white text-xs font-bold px-3.5 h-8 rounded-xl gap-1.5 shadow-sm"
                >
                  <Plus size={14} /> Add Audio Track
                </Button>
              </div>

              {audioTracks.length === 0 ? (
                <div className="text-center py-8 rounded-2xl border border-dashed border-white/10 bg-[#080a10]/50 space-y-2">
                  <Music2 size={32} className="mx-auto text-white/30" />
                  <div className="text-xs font-semibold text-white/70">No Audio Tracks Configured</div>
                  <p className="text-[11px] text-white/40 max-w-sm mx-auto">
                    Click "Add Audio Track" to upload custom MP3 background music with synchronized lyrics.
                  </p>
                  <Button
                    type="button"
                    onClick={handleAddAudioTrack}
                    className="mt-2 bg-white/10 hover:bg-white/20 text-white text-xs rounded-xl"
                  >
                    <Plus size={13} className="mr-1" /> Add First Track
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {audioTracks.map((tr, idx) => (
                    <div
                      key={tr.id || idx}
                      className="p-4 rounded-2xl bg-[#080a10] border border-white/10 space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#5B8DB8]/20 text-[#5B8DB8] text-[10px] font-bold font-mono flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-white truncate max-w-[200px]">
                            {tr.name || "Untitled Track"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAudioTrack(idx)}
                          className="text-white/40 hover:text-red-400 p-1 transition-colors"
                          title="Remove Track"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[11px] text-[#E5E7EB]/70">Track Title</Label>
                          <Input
                            value={tr.name || ""}
                            onChange={(e) => handleUpdateAudioTrack(idx, "name", e.target.value)}
                            placeholder="Song name"
                            className="bg-[#050609] border-white/10 text-white h-8 text-xs rounded-xl"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-[#E5E7EB]/70">Artist Name</Label>
                          <Input
                            value={tr.artist || ""}
                            onChange={(e) => handleUpdateAudioTrack(idx, "artist", e.target.value)}
                            placeholder="Artist / Composer"
                            className="bg-[#050609] border-white/10 text-white h-8 text-xs rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] text-[#E5E7EB]/70">Audio File (MP3 Upload or URL)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={tr.url || ""}
                            onChange={(e) => handleUpdateAudioTrack(idx, "url", e.target.value)}
                            placeholder="https://...mp3"
                            className="bg-[#050609] border-white/10 text-white h-8 text-xs rounded-xl flex-1"
                          />
                          <label className="h-8 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0">
                            <Upload size={12} />
                            <span>Upload MP3</span>
                            <input
                              type="file"
                              accept="audio/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) handleUploadTrackFile(idx, e.target.files[0]);
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] text-[#E5E7EB]/70">Synced Lyrics (.LRC format or lines)</Label>
                        <Textarea
                          value={tr.lyrics || ""}
                          onChange={(e) => handleUpdateAudioTrack(idx, "lyrics", e.target.value)}
                          rows={2}
                          placeholder="[00:12.00] Line 1&#10;[00:18.50] Line 2"
                          className="bg-[#050609] border-white/10 text-white text-xs rounded-xl resize-none font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Panel>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: DISCORD LIVE PRESENCE                                           */}
      {/* ========================================================================= */}
      {editorCategory === "discord" && (
        <div className="space-y-6" data-testid="discord-editor">
          <Panel title="Discord Live Presence (Real Status & Rich Activity)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <ToggleRow
                  label="Enable Live Discord Widget"
                  description="Real-time WebSocket streaming of your online status, game, and rich activity"
                  checked={s.presence?.discord !== false}
                  onChange={(v) => patchPresence("discord", v)}
                />
                <ToggleRow
                  label="Use Discord PFP as Profile Avatar"
                  description="Keep profile avatar synchronized with your active Discord avatar"
                  checked={s.presence?.use_discord_pfp === true}
                  onChange={(v) => patchPresence("use_discord_pfp", v)}
                />
                <ToggleRow
                  label="Show Verified Discord Member Badge"
                  description="Display official badge next to presence widget"
                  checked={s.presence?.show_discord_badge !== false}
                  onChange={(v) => patchPresence("show_discord_badge", v)}
                />
                <ToggleRow
                  label="Display Rich Game & Streaming Activities"
                  description="Show currently playing game details and timestamps"
                  checked={s.presence?.show_activities !== false}
                  onChange={(v) => patchPresence("show_activities", v)}
                />
              </div>

              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <div className="space-y-1">
                  <Label className="text-[11px] text-[#E5E7EB]/70">Discord User ID (Snowflake Override)</Label>
                  <Input
                    value={s.presence?.discord_user_id || s.discord_user_id || ""}
                    onChange={(e) => {
                      patchPresence("discord_user_id", e.target.value.trim());
                      patch("discord_user_id", e.target.value.trim());
                    }}
                    placeholder="e.g. 102938475610293847"
                    className="bg-[#050609] border-white/10 text-white h-8 text-xs rounded-xl font-mono"
                  />
                  <div className="text-[10px] text-[#E5E7EB]/45">
                    Connects directly to Lanyard WebSocket for zero-lag live presence without requiring OAuth.
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <Label className="text-[11px] text-[#E5E7EB]/70">Custom Discord Banner Cover URL</Label>
                  <Input
                    value={s.discord_larp_banner || ""}
                    onChange={(e) => patch("discord_larp_banner", e.target.value)}
                    placeholder="https://...banner.png"
                    className="bg-[#050609] border-white/10 text-white h-8 text-xs rounded-xl"
                  />
                  <div className="text-[10px] text-[#E5E7EB]/45">
                    Header banner displayed inside the interactive Discord presence modal.
                  </div>
                </div>
                <SelectRow
                  label="Presence card style"
                  value={s.discord_style || "discord"}
                  onChange={(value) => patch("discord_style", value)}
                  options={[
                    { v: "discord", l: "Discord Profile Card" },
                    { v: "ghost", l: "Glass / Ghost" },
                    { v: "nobg", l: "Minimal / No Fill" },
                  ]}
                />
                <SelectRow
                  label="Preview status"
                  value={s.discord_presence_status || "online"}
                  onChange={(value) => patch("discord_presence_status", value)}
                  options={[
                    { v: "online", l: "Online" },
                    { v: "idle", l: "Idle" },
                    { v: "dnd", l: "Do Not Disturb" },
                    { v: "offline", l: "Offline" },
                  ]}
                />
                <div className="space-y-1">
                  <Label className="text-[11px] text-[#E5E7EB]/70">Display name override</Label>
                  <Input value={s.discord_custom_name || ""} onChange={(e) => patch("discord_custom_name", e.target.value)} placeholder="Use linked Discord name" className="bg-[#050609] border-white/10 text-white h-8 text-xs rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-[#E5E7EB]/70">Custom status</Label>
                  <Input value={s.discord_custom_status || ""} onChange={(e) => patch("discord_custom_status", e.target.value)} placeholder="What are you up to?" className="bg-[#050609] border-white/10 text-white h-8 text-xs rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-[#E5E7EB]/70">Activity / game name</Label>
                  <Input value={s.discord_activity_name || ""} onChange={(e) => patch("discord_activity_name", e.target.value)} placeholder="Game or activity" className="bg-[#050609] border-white/10 text-white h-8 text-xs rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-[#E5E7EB]/70">Activity details</Label>
                  <Input value={s.discord_activity_details || ""} onChange={(e) => patch("discord_activity_details", e.target.value)} placeholder="Optional activity details" className="bg-[#050609] border-white/10 text-white h-8 text-xs rounded-xl" />
                </div>
              </div>
            </div>
          </Panel>
          <Panel title="Live preview · Discord profile card">
            <DiscordProfilePreview user={user} settings={s} />
          </Panel>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 5: SPOTIFY INTEGRATION                                             */}
      {/* ========================================================================= */}
      {editorCategory === "spotify" && (
        <div className="space-y-6">
          <Panel title="Spotify Playback & Profile Integration">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <ToggleRow
                  label="Show Spotify Live Playback"
                  description="Display currently playing song from active Spotify session"
                  checked={s.presence?.spotify !== false}
                  onChange={(v) => patchPresence("spotify", v)}
                />
                <SelectRow
                  label="Playback Display Mode"
                  value={s.spotify_mode || "live_song"}
                  onChange={(v) => patch("spotify_mode", v)}
                  options={[
                    { v: "live_song", l: "Real-Time Playing Song" },
                    { v: "profile_embed", l: "Spotify Artist / User Profile Embed" },
                    { v: "pinned_song", l: "Pinned Favorite Track / Album" },
                  ]}
                />
                <SelectRow
                  label="Player Card Visual Format"
                  value={s.spotify_presence_format || s.spotify_presence_style || s.presence?.spotify_format || "card"}
                  onChange={(v) => {
                    patch("spotify_presence_format", v);
                    patch("spotify_presence_style", v);
                    patchPresence("spotify_format", v);
                  }}
                  options={SPOTIFY_PRESENCE_FORMATS}
                />
              </div>

              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <div className="space-y-1">
                  <Label className="text-[11px] text-[#E5E7EB]/70">Pinned Spotify Track or Playlist URL</Label>
                  <Input
                    value={s.spotify_embed_url || ""}
                    onChange={(e) => patch("spotify_embed_url", e.target.value)}
                    placeholder="https://open.spotify.com/track/..."
                    className="bg-[#050609] border-white/10 text-white h-8 text-xs rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-1 pt-1">
                  <Label className="text-[11px] text-[#E5E7EB]/70">Spotify Profile URL</Label>
                  <Input
                    value={s.spotify_profile_url || ""}
                    onChange={(e) => patch("spotify_profile_url", e.target.value)}
                    placeholder="https://open.spotify.com/user/..."
                    className="bg-[#050609] border-white/10 text-white h-8 text-xs rounded-xl font-mono"
                  />
                </div>
                <ToggleRow
                  label="Show Synced Lyrics Button"
                  description="Enable expandable real-time lyrics viewer"
                  checked={s.presence?.show_lyrics !== false}
                  onChange={(v) => patchPresence("show_lyrics", v)}
                />
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 6: LIVE WIDGETS STUDIO                                             */}
      {/* ========================================================================= */}
      {editorCategory === "widgets" && (
        <div className="space-y-6">
          {/* 1. Discord Server Invite Widget */}
          <Panel title="Discord Server Invite Widget">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <ToggleRow
                  label="Enable Discord Server Widget"
                  description="Display live online member counts, server icon & join button"
                  checked={s.widgets?.discord_server?.enabled === true}
                  onChange={(v) => patchWidgets("discord_server", "enabled", v)}
                />
                <div className="space-y-1">
                  <Label className="text-[11px] text-[#E5E7EB]/70">Server Invite Link or Code</Label>
                  <Input
                    value={s.widgets?.discord_server?.invite_url || ""}
                    onChange={(e) => patchWidgets("discord_server", "invite_url", e.target.value.trim())}
                    placeholder="https://discord.gg/your-server or invite-code"
                    className="bg-[#050609] border-white/10 text-white h-8 text-xs rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <SelectRow
                  label="Server Widget Theme"
                  value={s.widgets?.discord_server?.style || "discord"}
                  onChange={(v) => patchWidgets("discord_server", "style", v)}
                  options={[
                    { v: "discord", l: "Discord 1:1 (Authentic Dark)" },
                    { v: "square", l: "Square Modern Card" },
                    { v: "minibanner", l: "Mini Banner (Faded Cover)" },
                    { v: "ghost", l: "Ghost Translucent (Frosted Glass)" },
                    { v: "nobg", l: "No Background (Clean Minimal)" },
                    { v: "aurora", l: "Aurora Glow" },
                  ]}
                />
                <div className="text-[11px] text-[#949ba4] leading-relaxed pt-1">
                  Automatically queries Discord API to fetch live verified/community badge, guild icon, online green-dot members, and join button.
                </div>
              </div>
            </div>
          </Panel>

          {/* 2. Multi-Platform Music Player Widget (Spotify, SoundCloud, Apple Music) */}
          <Panel title="Music Player Widget (SoundCloud, Spotify, Apple Music)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <ToggleRow
                  label="Enable Embedded Music Player"
                  description="Embed tracks from Spotify, SoundCloud, or Apple Music"
                  checked={s.widgets?.music_player?.enabled === true}
                  onChange={(v) => patchWidgets("music_player", "enabled", v)}
                />
                <SelectRow
                  label="Music Platform"
                  value={s.widgets?.music_player?.type || "spotify"}
                  onChange={(v) => patchWidgets("music_player", "type", v)}
                  options={[
                    { v: "spotify", l: "Spotify Track / Playlist" },
                    { v: "soundcloud", l: "SoundCloud Track / Playlist" },
                    { v: "apple", l: "Apple Music Track / Album" },
                  ]}
                />
                <div className="space-y-1">
                  <Label className="text-[11px] text-[#E5E7EB]/70">Track or Playlist URL</Label>
                  <Input
                    value={s.widgets?.music_player?.url || ""}
                    onChange={(e) => patchWidgets("music_player", "url", e.target.value.trim())}
                    placeholder="https://open.spotify.com/track/... or soundcloud.com/..."
                    className="bg-[#050609] border-white/10 text-white h-8 text-xs rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <div className="space-y-1">
                  <Label className="text-[11px] text-[#E5E7EB]/70">Custom Track Title (Supports Text Effects)</Label>
                  <Input
                    value={s.widgets?.music_player?.title || ""}
                    onChange={(e) => patchWidgets("music_player", "title", e.target.value)}
                    placeholder="e.g. [glow]Midnight Echoes[/glow]"
                    className="bg-[#050609] border-white/10 text-white h-8 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-[#E5E7EB]/70">Custom Artist Name (Supports Text Effects)</Label>
                  <Input
                    value={s.widgets?.music_player?.artist || ""}
                    onChange={(e) => patchWidgets("music_player", "artist", e.target.value)}
                    placeholder="e.g. [typewriter]Cyberwave Records[/typewriter]"
                    className="bg-[#050609] border-white/10 text-white h-8 text-xs rounded-xl"
                  />
                </div>
                <div className="text-[10px] text-white/40 italic">
                  Music players fully render text effects like [glow], [typewriter], [stack], [grain], [sparkle], and [neon].
                </div>
              </div>
            </div>
          </Panel>

          {/* 3. Account Stats & Creation Date Widget */}
          <Panel title="Account Creation Date & Stats Widget">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <ToggleRow
                  label="Enable Account Stats Widget"
                  description="Showcase how long ago your profile was made, views count & badges count"
                  checked={s.widgets?.account_stats?.enabled === true}
                  onChange={(v) => patchWidgets("account_stats", "enabled", v)}
                />
                <SelectRow
                  label="Stats Layout Style"
                  value={s.widgets?.account_stats?.style || "square"}
                  onChange={(v) => patchWidgets("account_stats", "style", v)}
                  options={[
                    { v: "square", l: "Square Stat Tiles (Modern Grid)" },
                    { v: "classic", l: "Classic Stats Card" },
                    { v: "pill", l: "Minimal Stats Bar" },
                  ]}
                />
                <div className="space-y-1">
                  <Label className="text-[11px] text-[#E5E7EB]/70">Custom Stats Title / Label</Label>
                  <Input
                    value={s.widgets?.account_stats?.label ?? "Account Stats"}
                    onChange={(e) => patchWidgets("account_stats", "label", e.target.value)}
                    placeholder="e.g. Verified Stats"
                    className="bg-[#050609] border-white/10 text-white h-8 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <ToggleRow
                  label="Show Profile Views Count"
                  description="Show your dynamic profile view counter"
                  checked={s.widgets?.account_stats?.show_views !== false}
                  onChange={(v) => patchWidgets("account_stats", "show_views", v)}
                />
                <ToggleRow
                  label="Show Badges Earned Count"
                  description="Display number of badges unlocked on your profile"
                  checked={s.widgets?.account_stats?.show_badges !== false}
                  onChange={(v) => patchWidgets("account_stats", "show_badges", v)}
                />
                <ToggleRow
                  label="Show Account Age & Join Date"
                  description="Show how long you've been a member"
                  checked={s.widgets?.account_stats?.show_age !== false}
                  onChange={(v) => patchWidgets("account_stats", "show_age", v)}
                />
              </div>
            </div>
          </Panel>

          {/* 4. Enhanced Timezone & Real Clock Widget */}
          <Panel title="Real Clock & Timezone Widget">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <ToggleRow
                  label="Enable Real Clock Widget"
                  description="Display real-time ticking clock with live seconds"
                  checked={s.widgets?.clock?.enabled === true}
                  onChange={(v) => patchWidgets("clock", "enabled", v)}
                />
                <SelectRow
                  label="Timezone Offset"
                  value={s.widgets?.clock?.timezone || "local"}
                  onChange={(v) => patchWidgets("clock", "timezone", v)}
                  options={[
                    { v: "local", l: "Visitor's Local Time" },
                    { v: "UTC", l: "UTC (Coordinated Universal Time)" },
                    { v: "America/New_York", l: "New York (EST/EDT)" },
                    { v: "America/Los_Angeles", l: "Los Angeles (PST/PDT)" },
                    { v: "Europe/London", l: "London (GMT/BST)" },
                    { v: "Asia/Tokyo", l: "Tokyo (JST)" },
                    { v: "Australia/Sydney", l: "Sydney (AEST)" },
                  ]}
                />
              </div>

              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <SelectRow
                  label="Clock Face Style"
                  value={s.widgets?.clock?.style || "analog"}
                  onChange={(v) => patchWidgets("clock", "style", v)}
                  options={[
                    { v: "analog", l: "Authentic Analog Clock (Rotating Hands)" },
                    { v: "digital", l: "Cyber Digital Glow HUD" },
                  ]}
                />
                <SelectRow
                  label="Digital Time Format"
                  value={s.widgets?.clock?.format || "12h"}
                  onChange={(v) => patchWidgets("clock", "format", v)}
                  options={[
                    { v: "12h", l: "12-Hour (AM / PM)" },
                    { v: "24h", l: "24-Hour (Military Time)" },
                  ]}
                />
              </div>
            </div>
          </Panel>

          {/* 5. Roblox Profile & Avatar Widget */}
          <Panel title="Roblox Profile & Avatar Widget">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <ToggleRow
                  label="Enable Roblox Profile Card"
                  description="Showcase your Roblox avatar and profile badges"
                  checked={s.widgets?.roblox?.enabled === true}
                  onChange={(v) => patchWidgets("roblox", "enabled", v)}
                />
                <div className="space-y-1">
                  <Label className="text-[11px] text-[#E5E7EB]/70">Roblox Username or User ID</Label>
                  <Input
                    value={s.widgets?.roblox?.username || ""}
                    onChange={(e) => patchWidgets("roblox", "username", e.target.value.trim())}
                    placeholder="e.g. Builderman"
                    className="bg-[#050609] border-white/10 text-white h-8 text-xs rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <ToggleRow
                  label="Display 3D Rendered Avatar"
                  description="Fetch official Roblox 3D avatar headshot / bust"
                  checked={s.widgets?.roblox?.show_avatar !== false}
                  onChange={(v) => patchWidgets("roblox", "show_avatar", v)}
                />
                <ToggleRow
                  label="Show Activity & Online Status"
                  description="Live status badge on Roblox card"
                  checked={s.widgets?.roblox?.show_presence !== false}
                  onChange={(v) => patchWidgets("roblox", "show_presence", v)}
                />
              </div>
            </div>
          </Panel>

          {/* 6. Live Weather Widget */}
          <Panel title="Live Weather & Atmospheric Widget">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <ToggleRow
                  label="Enable Weather Widget"
                  description="Display real-time temperature, sky condition & location"
                  checked={s.widgets?.weather?.enabled === true}
                  onChange={(v) => patchWidgets("weather", "enabled", v)}
                />
                <div className="space-y-1">
                  <Label className="text-[11px] text-[#E5E7EB]/70">City & Country Location</Label>
                  <Input
                    value={s.widgets?.weather?.location || ""}
                    onChange={(e) => patchWidgets("weather", "location", e.target.value)}
                    placeholder="e.g. Tokyo, JP or New York, US"
                    className="bg-[#050609] border-white/10 text-white h-8 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <SelectRow
                  label="Temperature Unit"
                  value={s.widgets?.weather?.unit || "celsius"}
                  onChange={(v) => patchWidgets("weather", "unit", v)}
                  options={[
                    { v: "celsius", l: "Celsius (°C)" },
                    { v: "fahrenheit", l: "Fahrenheit (°F)" },
                  ]}
                />
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 5: LANDER / ENTRY SCREEN STUDIO                                    */}
      {/* ========================================================================= */}
      {editorCategory === "lander" && (
        <div className="space-y-6">
          <Panel title="Lander & Entry Gate Settings">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ToggleRow
                label="Enable Lander / Entry Screen"
                description="Prompt visitors with an interactive entrance screen"
                checked={s.enter_screen?.enabled === true}
                onChange={(v) => patchEnterScreen("enabled", v)}
              />
              <ToggleRow
                label="Audio Chime on Entrance"
                description="Play a subtle synth harmonic chime when entering"
                checked={s.enter_screen?.sound === true}
                onChange={(v) => patchEnterScreen("sound", v)}
              />
              <ToggleRow
                label="Stealth Pure Black Background"
                description="Hide profile wallpaper until visitor enters"
                checked={s.enter_screen?.no_bg === true}
                onChange={(v) => patchEnterScreen("no_bg", v)}
              />
            </div>
          </Panel>

          {/* Entry Style Selector */}
          <Panel title="Entrance Style & Visual Interface">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {ENTRY_SCREEN_STYLES.map((st) => {
                const isSelected = (s.enter_screen?.style || "minimal") === st.v;
                return (
                  <button
                    key={st.v}
                    type="button"
                    onClick={() => patchEnterScreen("style", st.v)}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-[#5B8DB8]/15 border-[#5B8DB8] shadow-[0_0_20px_rgba(91,141,184,0.25)] ring-1 ring-[#5B8DB8]"
                        : "bg-[#080a10] border-white/5 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white">{st.l}</span>
                        {isSelected && <Check size={14} className="text-[#5B8DB8]" />}
                      </div>
                      <p className="text-[11px] text-[#E5E7EB]/60 leading-relaxed">{st.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#E5E7EB]/80 font-semibold">Exit Transition Animation</Label>
                <Select
                  value={s.enter_screen?.exit_animation || "fade_out"}
                  onValueChange={(v) => patchEnterScreen("exit_animation", v)}
                >
                  <SelectTrigger className="bg-[#07090e] border-white/10 text-white rounded-xl text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0b0e14] border-white/10 text-white">
                    {ENTRY_EXIT_ANIMATIONS.map((ea) => (
                      <SelectItem key={ea.v} value={ea.v} className="text-xs">{ea.l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-[#E5E7EB]/80 font-semibold">Lander Ambient Particle Effect</Label>
                <Select
                  value={s.enter_screen?.particle_effect || "none"}
                  onValueChange={(v) => patchEnterScreen("particle_effect", v)}
                >
                  <SelectTrigger className="bg-[#07090e] border-white/10 text-white rounded-xl text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0b0e14] border-white/10 text-white">
                    {ENTRY_PARTICLES.map((ep) => (
                      <SelectItem key={ep.v} value={ep.v} className="text-xs">{ep.l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Panel>

          {/* Typography & Copy */}
          <Panel title="Lander Typography & Custom Copy">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#E5E7EB]/80">Header Title (Supports Effects)</Label>
                <Input
                  value={s.enter_screen?.header || ""}
                  onChange={(e) => patchEnterScreen("header", e.target.value)}
                  placeholder="e.g. SWATS.BIO // ACCESS"
                  className="bg-[#07090e] border-white/10 text-white rounded-xl text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-[#E5E7EB]/80">Subtitle / Instruction Prompt</Label>
                <Input
                  value={s.enter_screen?.subtitle || ""}
                  onChange={(e) => patchEnterScreen("subtitle", e.target.value)}
                  placeholder="e.g. Click anywhere or press enter to proceed"
                  className="bg-[#07090e] border-white/10 text-white rounded-xl text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-[#E5E7EB]/80">Enter Button Trigger Text</Label>
                <Input
                  value={s.enter_screen?.text || ""}
                  onChange={(e) => patchEnterScreen("text", e.target.value)}
                  placeholder="e.g. ENTER BIO"
                  className="bg-[#07090e] border-white/10 text-white rounded-xl text-xs h-9"
                />
              </div>
            </div>
          </Panel>

          {/* Blur & Dim Sliders */}
          <Panel title="Lander Blur & Dimming Filters">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">Background Blur</span>
                  <span className="text-[#5B8DB8] font-mono">{s.enter_screen?.blur ?? 12}px</span>
                </div>
                <Slider
                  min={0}
                  max={40}
                  step={1}
                  value={[Number(s.enter_screen?.blur ?? 12)]}
                  onValueChange={([v]) => patchEnterScreen("blur", v)}
                />
                <p className="text-[10px] text-[#E5E7EB]/50">Amount of backdrop blur applied behind the entrance screen.</p>
              </div>

              <div className="space-y-2 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">Background Darkness / Dim</span>
                  <span className="text-[#5B8DB8] font-mono">{s.enter_screen?.dim ?? 50}%</span>
                </div>
                <Slider
                  min={0}
                  max={95}
                  step={5}
                  value={[Number(s.enter_screen?.dim ?? 50)]}
                  onValueChange={([v]) => patchEnterScreen("dim", v)}
                />
                <p className="text-[10px] text-[#E5E7EB]/50">Opacity overlay dimming the wallpaper while on the lander screen.</p>
              </div>
            </div>
          </Panel>
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0b0d12]/95 p-2 shadow-2xl backdrop-blur-xl sm:bottom-6 sm:right-6">
        <span className="hidden text-[10px] text-white/50 sm:block">Unsaved changes apply to preview</span>
        <a href={`/${encodeURIComponent(username)}`} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-white/15 px-3 text-[11px] font-semibold text-white/80 hover:bg-white/10">
          <Eye size={13} /> Preview
        </a>
        <Button type="button" onClick={save} disabled={saving} className="h-8 rounded-xl bg-[#5B8DB8] px-3 text-[11px] font-bold text-white hover:bg-[#4A6B8A]">
          <Save size={13} className="mr-1" /> {saving ? "Saving…" : "Save"}
        </Button>
      </div>

      {/* Media Asset Modal */}
      <MediaAssetModal
        open={mediaModal.open}
        type={mediaModal.type}
        currentValue={
          mediaModal.type === "pfp"
            ? s.pfp
            : mediaModal.type === "background"
            ? s.banner
            : mediaModal.type === "banner"
            ? s.header_banner || s.banner
            : s.cursor
        }
        currentConfig={
          mediaModal.type === "pfp"
            ? s.pfp_config || {}
            : mediaModal.type === "background"
            ? s.bg_config || {}
            : mediaModal.type === "banner"
            ? s.header_banner_config || {}
            : s.cursor_config || {}
        }
        onSave={handleSaveMediaAsset}
        onClose={() => setMediaModal({ open: false, type: "pfp" })}
        uploadFile={uploadFile}
      />

      {/* Avatar Effects Modal */}
      <AvatarEffectsModal
        open={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        settings={s}
        patch={patch}
        pfpUrl={pfpSrc}
      />

      {/* Background Effects Modal */}
      <BackgroundEffectsModal
        open={bgModalOpen}
        onClose={() => setBgModalOpen(false)}
        settings={s}
        patch={patch}
      />

      {/* Banner Effects Modal */}
      <BannerEffectsModal
        open={bannerModalOpen}
        onClose={() => setBannerModalOpen(false)}
        settings={s}
        patch={patch}
      />

      {/* Cursor Effects Modal */}
      <CursorEffectsModal
        open={cursorModalOpen}
        onClose={() => setCursorModalOpen(false)}
        settings={s}
        patch={patch}
      />

      {/* Name Effects Modal */}
      <NameEffectsModal
        open={nameModalOpen}
        onClose={() => setNameModalOpen(false)}
        displayName={displayName}
        setDisplayName={setDisplayName}
        username={username}
        settings={s}
        patch={patch}
      />

      {/* Bio Effects Modal */}
      <BioEffectsModal
        open={bioModalOpen}
        onClose={() => setBioModalOpen(false)}
        description={description}
        setDescription={setDescription}
        settings={s}
        patch={patch}
      />

      {/* Location Effects Modal */}
      <LocationEffectsModal
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        location={s.location}
        settings={s}
        patch={patch}
      />

      {/* Role Effects Modal */}
      <RoleEffectsModal
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        occupation={s.occupation}
        settings={s}
        patch={patch}
      />
    </div>
  );
}
