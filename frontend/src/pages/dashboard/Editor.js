import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAuth, api, fileUrl } from "@/lib/auth";
import { renderBioText, stripEffectSyntax, USERNAME_EFFECTS_LIST } from "@/lib/textEffects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Image as ImageIcon, MousePointer2, Music, Save,
  Upload, Trash2, Plus, ExternalLink, Sparkles, Eye,
  LayoutGrid, Sliders, Check, Palette, Layers, Wand2, Flame,
  Edit3, Shield, Star, Gamepad2, ArrowRight, Wand, X,
  Radio, Volume2, VolumeX, ListMusic, Music2, Play, Pause,
  Disc, SlidersHorizontal, Share2, MoveHorizontal, MoveVertical,
  AlignLeft, AlignCenter, AlignRight, FileText, DoorOpen, Lock, KeyRound, Monitor,
  CloudSun, Clock, AppWindow, Bot, Globe, Code
} from "lucide-react";
import { SiSpotify, SiDiscord } from "react-icons/si";
import CustomColorPicker from "@/components/ColorPicker";
import { MediaAssetModal } from "@/components/MediaAssetModal";
import { AvatarEffectsModal } from "@/components/AvatarEffectsModal";
import { BackgroundEffectsModal } from "@/components/BackgroundEffectsModal";
import { BannerEffectsModal } from "@/components/BannerEffectsModal";
import { CursorEffectsModal } from "@/components/CursorEffectsModal";
import { NameEffectsModal } from "@/components/NameEffectsModal";
import { SlideshowManager } from "@/components/SlideshowManager";

// Exported Layout list
export const CARD_LAYOUTS = [
  { v: "classic", l: "Classic", desc: "Centered avatar, bio, badges & clean link stack" },
  { v: "minimal", l: "Minimal", desc: "Ultra-clean compact link stack with minimalist typography" },
  { v: "banner_left", l: "Cover Banner", desc: "Top header banner with left-docked identity" },
  { v: "slideshow", l: "Slideshow Deck", desc: "Interactive scrolling deck with Discord & project embeds" },
  { v: "bento_grid", l: "Bento Grid", desc: "Modern multi-tile responsive bento blocks" },
  { v: "split_left", l: "2-Column Split", desc: "Profile identity on left, links on right" },
  { v: "floating_glass", l: "Floating Glass", desc: "Decoupled floating frosted glass tiles" },
  { v: "grid_tiles", l: "2×2 Grid Tiles", desc: "Square interactive icon & link tiles" },
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
  { v: "solid", l: "Stealth Solid (Opaque)" },
  { v: "glass", l: "Frosted Glass" },
  { v: "outline", l: "Wireframe Outline" },
  { v: "neon", l: "Neon Edge Glow" },
  { v: "cyber", l: "Precision Overlay" },
  { v: "none", l: "Invisible (0% Background)" },
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
  const [s, setS] = useState(user.settings || {});
  const [displayName, setDisplayName] = useState(user.display_name || "");
  const [username, setUsername] = useState(user.username || "");
  const [description, setDescription] = useState(user.description || "");
  const [saving, setSaving] = useState(false);

  // FX Quick Dropdown State
  const [activeFxTarget, setActiveFxTarget] = useState(null); // "name" | "bio" | null

  // Modals state
  const [mediaModal, setMediaModal] = useState({ open: false, type: "pfp" });
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [bgModalOpen, setBgModalOpen] = useState(false);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [cursorModalOpen, setCursorModalOpen] = useState(false);
  const [nameModalOpen, setNameModalOpen] = useState(false);

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
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-2">
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
          <Panel title="Profile Visual Assets (PFP, Background, Banner, Cursor)">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 justify-items-center sm:justify-items-start">
              {/* 1. Profile Picture Box */}
              <div
                onClick={() => openMediaModal("pfp")}
                className="group relative w-[165px] h-[165px] rounded-2xl border-2 border-white/10 hover:border-[#5B8DB8] bg-[#07090e] cursor-pointer overflow-hidden flex flex-col items-center justify-center transition-all shadow-md hover:shadow-[0_0_20px_rgba(91,141,184,0.3)]"
              >
                <div className="w-full h-full flex items-center justify-center p-3 group-hover:blur-[3px] group-hover:scale-105 transition-all duration-300">
                  <img
                    src={pfpSrc}
                    alt="PFP"
                    className="w-24 h-24 rounded-full object-cover border-2 border-white/20 shadow-inner"
                  />
                </div>
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-2 text-center transition-all duration-200">
                  <Edit3 size={20} className="text-[#5B8DB8] mb-1 animate-bounce" />
                  <span className="text-xs font-bold text-white leading-tight">Click to customize</span>
                  <span className="text-[10px] text-[#5B8DB8] font-mono mt-0.5">Profile Picture</span>
                </div>
                <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-white/70 border border-white/10 pointer-events-none">
                  PFP (165×165)
                </div>
              </div>

              {/* 2. Background Media Box */}
              <div
                onClick={() => openMediaModal("background")}
                className="group relative w-[165px] h-[165px] rounded-2xl border-2 border-white/10 hover:border-[#5B8DB8] bg-[#07090e] cursor-pointer overflow-hidden flex flex-col items-center justify-center transition-all shadow-md hover:shadow-[0_0_20px_rgba(91,141,184,0.3)]"
              >
                <div className="w-full h-full flex items-center justify-center group-hover:blur-[3px] group-hover:scale-105 transition-all duration-300">
                  {bgSrc ? (
                    <img src={bgSrc} alt="Background" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-3 text-white/40">
                      <ImageIcon size={28} className="mx-auto mb-1 opacity-50" />
                      <span className="text-[10px]">Clean Solid</span>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-2 text-center transition-all duration-200">
                  <Edit3 size={20} className="text-[#5B8DB8] mb-1 animate-bounce" />
                  <span className="text-xs font-bold text-white leading-tight">Click to customize</span>
                  <span className="text-[10px] text-[#5B8DB8] font-mono mt-0.5">Background</span>
                </div>
                <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-white/70 border border-white/10 pointer-events-none">
                  Background
                </div>
              </div>

              {/* 3. Banner Box */}
              <div
                onClick={() => openMediaModal("banner")}
                className="group relative w-[165px] h-[165px] rounded-2xl border-2 border-white/10 hover:border-[#5B8DB8] bg-[#07090e] cursor-pointer overflow-hidden flex flex-col items-center justify-center transition-all shadow-md hover:shadow-[0_0_20px_rgba(91,141,184,0.3)]"
              >
                <div className="w-full h-full flex items-center justify-center group-hover:blur-[3px] group-hover:scale-105 transition-all duration-300">
                  {bannerSrc ? (
                    <img src={bannerSrc} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-3 text-white/40">
                      <Layers size={28} className="mx-auto mb-1 opacity-50" />
                      <span className="text-[10px]">No Banner</span>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-2 text-center transition-all duration-200">
                  <Edit3 size={20} className="text-[#5B8DB8] mb-1 animate-bounce" />
                  <span className="text-xs font-bold text-white leading-tight">Click to customize</span>
                  <span className="text-[10px] text-[#5B8DB8] font-mono mt-0.5">Banner</span>
                </div>
                <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-white/70 border border-white/10 pointer-events-none">
                  Banner
                </div>
              </div>

              {/* 4. Cursor Box */}
              <div
                onClick={() => openMediaModal("cursor")}
                className="group relative w-[165px] h-[165px] rounded-2xl border-2 border-white/10 hover:border-[#5B8DB8] bg-[#07090e] cursor-pointer overflow-hidden flex flex-col items-center justify-center transition-all shadow-md hover:shadow-[0_0_20px_rgba(91,141,184,0.3)]"
              >
                <div className="w-full h-full flex items-center justify-center group-hover:blur-[3px] group-hover:scale-105 transition-all duration-300">
                  {cursorSrc ? (
                    <img src={cursorSrc} alt="Cursor" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(91,141,184,0.5)]" />
                  ) : (
                    <div className="text-center p-3 text-white/40">
                      <MousePointer2 size={28} className="mx-auto mb-1 opacity-50" />
                      <span className="text-[10px]">Default Cursor</span>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-2 text-center transition-all duration-200">
                  <Edit3 size={20} className="text-[#5B8DB8] mb-1 animate-bounce" />
                  <span className="text-xs font-bold text-white leading-tight">Click to customize</span>
                  <span className="text-[10px] text-[#5B8DB8] font-mono mt-0.5">Cursor</span>
                </div>
                <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-white/70 border border-white/10 pointer-events-none">
                  Cursor
                </div>
              </div>
            </div>

            {/* 4 Dedicated Effect Buttons below the 4 boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10">
              <Button
                type="button"
                onClick={() => setAvatarModalOpen(true)}
                className="bg-[#080a10] hover:bg-[#5B8DB8]/20 text-white hover:text-[#5B8DB8] border border-white/10 hover:border-[#5B8DB8]/50 h-10 rounded-xl text-xs font-bold gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Sparkles size={15} className="text-[#5B8DB8]" /> Avatar Effects
              </Button>
              <Button
                type="button"
                onClick={() => setBgModalOpen(true)}
                className="bg-[#080a10] hover:bg-[#5B8DB8]/20 text-white hover:text-[#5B8DB8] border border-white/10 hover:border-[#5B8DB8]/50 h-10 rounded-xl text-xs font-bold gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Wand2 size={15} className="text-[#5B8DB8]" /> Background Effects
              </Button>
              <Button
                type="button"
                onClick={() => setBannerModalOpen(true)}
                className="bg-[#080a10] hover:bg-[#5B8DB8]/20 text-white hover:text-[#5B8DB8] border border-white/10 hover:border-[#5B8DB8]/50 h-10 rounded-xl text-xs font-bold gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Layers size={15} className="text-[#5B8DB8]" /> Banner Effects
              </Button>
              <Button
                type="button"
                onClick={() => setCursorModalOpen(true)}
                className="bg-[#080a10] hover:bg-[#5B8DB8]/20 text-white hover:text-[#5B8DB8] border border-white/10 hover:border-[#5B8DB8]/50 h-10 rounded-xl text-xs font-bold gap-2 transition-all shadow-sm cursor-pointer"
              >
                <MousePointer2 size={15} className="text-[#5B8DB8]" /> Cursor Effects
              </Button>
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

          {/* Profile Identity Text Inputs with Integrated [ ✨ FX ] Trigger */}
          <Panel title="Profile Identity & Typography">
            <div className="space-y-4">
              {/* Display Name Input with FX Trigger */}
              <div className="space-y-1.5 relative">
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-[#E5E7EB]/70 font-semibold">Display Name</Label>
                  <span className="text-[11px] font-mono text-[#5B8DB8]">Text FX</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveFxTarget(activeFxTarget === "name" ? null : "name")}
                    className={`h-9 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                      activeFxTarget === "name"
                        ? "bg-[#5B8DB8] text-white border-[#5B8DB8] shadow-[0_0_12px_rgba(91,141,184,0.4)]"
                        : "bg-[#080a10] border-white/15 text-[#5B8DB8] hover:bg-[#5B8DB8]/10 hover:border-[#5B8DB8]/50"
                    }`}
                    title="Choose Animated Text Effect"
                  >
                    <Sparkles size={13} />
                    <span>FX</span>
                  </button>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your Name"
                    className="bg-[#080a10] border-white/10 text-white h-9 text-xs rounded-xl focus:border-[#5B8DB8] flex-1"
                  />
                </div>

                {/* Popover FX selector for Name */}
                {activeFxTarget === "name" && (
                  <div className="p-3 rounded-2xl bg-[#0c0e18] border border-[#5B8DB8]/50 shadow-2xl space-y-2 z-20">
                    <div className="flex items-center justify-between text-xs font-bold text-white pb-1 border-b border-white/10">
                      <span>Select Name Effect</span>
                      <button onClick={() => setActiveFxTarget(null)} className="text-white/50 hover:text-white"><X size={12} /></button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {USERNAME_EFFECTS_LIST.map((ue) => (
                        <button
                          key={ue.id}
                          type="button"
                          onClick={() => applyEffectToTarget(ue, "name")}
                          className="p-2 rounded-xl bg-[#080a10] hover:bg-[#5B8DB8]/20 border border-white/10 hover:border-[#5B8DB8] text-left text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-2"
                        >
                          <span className="font-display text-sm">{renderBioText(ue.wrap("S", s.accent_color || "#5B8DB8"))}</span>
                          <span className="text-[11px] truncate">{ue.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bio Description Input with FX Trigger */}
              <div className="space-y-1.5 relative">
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-[#E5E7EB]/70 font-semibold">Bio Description</Label>
                  <span className="text-[11px] font-mono text-[#E5E7EB]/40">Markdown formatting enabled</span>
                </div>
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveFxTarget(activeFxTarget === "bio" ? null : "bio")}
                    className={`h-9 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 mt-0.5 ${
                      activeFxTarget === "bio"
                        ? "bg-[#5B8DB8] text-white border-[#5B8DB8] shadow-[0_0_12px_rgba(91,141,184,0.4)]"
                        : "bg-[#080a10] border-white/15 text-[#5B8DB8] hover:bg-[#5B8DB8]/10 hover:border-[#5B8DB8]/50"
                    }`}
                    title="Choose Animated Text Effect for Bio"
                  >
                    <Sparkles size={13} />
                    <span>FX</span>
                  </button>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Tell visitors about yourself, discord servers, or creative projects..."
                    className="bg-[#080a10] border-white/10 text-white text-xs rounded-xl focus:border-[#5B8DB8] flex-1 resize-none"
                  />
                </div>

                {/* Popover FX selector for Bio */}
                {activeFxTarget === "bio" && (
                  <div className="p-3 rounded-2xl bg-[#0c0e18] border border-[#5B8DB8]/50 shadow-2xl space-y-2 z-20">
                    <div className="flex items-center justify-between text-xs font-bold text-white pb-1 border-b border-white/10">
                      <span>Select Bio Effect</span>
                      <button onClick={() => setActiveFxTarget(null)} className="text-white/50 hover:text-white"><X size={12} /></button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {USERNAME_EFFECTS_LIST.map((ue) => (
                        <button
                          key={ue.id}
                          type="button"
                          onClick={() => applyEffectToTarget(ue, "bio")}
                          className="p-2 rounded-xl bg-[#080a10] hover:bg-[#5B8DB8]/20 border border-white/10 hover:border-[#5B8DB8] text-left text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-2"
                        >
                          <span className="font-display text-sm">{renderBioText(ue.wrap("S", s.accent_color || "#5B8DB8"))}</span>
                          <span className="text-[11px] truncate">{ue.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Live Preview of Styled Name & Bio */}
              <div className="p-3.5 rounded-xl bg-[#07090e] border border-white/10 text-center">
                <div className="text-[10px] uppercase font-bold tracking-widest text-[#5B8DB8] mb-1">
                  Live Typography Preview
                </div>
                <div className="font-display text-xl font-black text-white min-h-[30px] flex items-center justify-center">
                  {renderBioText(displayName || username || "swats")}
                </div>
                {description && (
                  <div className="text-xs text-white/70 mt-1 max-w-lg mx-auto">
                    {renderBioText(description)}
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: LAYOUT & POSITIONING                                            */}
      {/* ========================================================================= */}
      {editorCategory === "layout" && (
        <div className="space-y-6">
          {/* Layout Selector Panel */}
          <Panel title="Profile Card Layout Selection">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-[#E5E7EB]/70 text-xs font-semibold">Active Layout</Label>
                <span className="text-xs text-[#5B8DB8] font-bold font-mono">
                  {CARD_LAYOUTS.find((cl) => cl.v === activeLayout)?.l || "Classic"}
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
        <div className="space-y-6">
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
              </div>
            </div>
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
          {/* 1. Spotify Favorite Playlist / Song Widget */}
          <Panel title="Spotify Favorite Playlist & Library Widget">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <ToggleRow
                  label="Enable Spotify Library Widget"
                  description="Embed your favorite curated playlist on your profile"
                  checked={s.widgets?.spotify?.enabled === true}
                  onChange={(v) => patchWidgets("spotify", "enabled", v)}
                />
                <div className="space-y-1">
                  <Label className="text-[11px] text-[#E5E7EB]/70">Favorite Playlist URL / Embed</Label>
                  <Input
                    value={s.widgets?.spotify?.playlist_url || ""}
                    onChange={(e) => patchWidgets("spotify", "playlist_url", e.target.value)}
                    placeholder="https://open.spotify.com/playlist/..."
                    className="bg-[#050609] border-white/10 text-white h-8 text-xs rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <div className="space-y-1">
                  <Label className="text-[11px] text-[#E5E7EB]/70">Favorite Song Track URL</Label>
                  <Input
                    value={s.widgets?.spotify?.fav_song_url || ""}
                    onChange={(e) => patchWidgets("spotify", "fav_song_url", e.target.value)}
                    placeholder="https://open.spotify.com/track/..."
                    className="bg-[#050609] border-white/10 text-white h-8 text-xs rounded-xl font-mono"
                  />
                </div>
                <SelectRow
                  label="Widget Frame Theme"
                  value={s.widgets?.spotify?.theme || "glass"}
                  onChange={(v) => patchWidgets("spotify", "theme", v)}
                  options={[
                    { v: "glass", l: "Frosted Glass" },
                    { v: "compact", l: "Compact Card" },
                    { v: "neon", l: "Cyber Neon" },
                  ]}
                />
              </div>
            </div>
          </Panel>

          {/* 2. Roblox Profile & Avatar Widget */}
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

          {/* 3. Live Weather Widget */}
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

          {/* 4. Live Clock & Timezone Widget */}
          <Panel title="Live Timezone & Clock Widget">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <ToggleRow
                  label="Enable Live Clock Widget"
                  description="Display real-time ticking clock with seconds"
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
                  label="Clock Format"
                  value={s.widgets?.clock?.format || "12h"}
                  onChange={(v) => patchWidgets("clock", "format", v)}
                  options={[
                    { v: "12h", l: "12-Hour (AM / PM)" },
                    { v: "24h", l: "24-Hour (Military Time)" },
                  ]}
                />
                <SelectRow
                  label="Clock Face Style"
                  value={s.widgets?.clock?.style || "digital"}
                  onChange={(v) => patchWidgets("clock", "style", v)}
                  options={[
                    { v: "digital", l: "Cyber Digital Glow HUD" },
                    { v: "minimal", l: "Minimal Monospace Pill" },
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
    </div>
  );
}
