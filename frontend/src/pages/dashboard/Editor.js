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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Image as ImageIcon, ImagePlus, MousePointer2, Music, Save,
  Upload, Trash2, Plus, ExternalLink, Sparkles, Eye, EyeOff,
  LayoutGrid, Sliders, Check, Palette, Layers, Wand2, Flame,
  HelpCircle, Edit3, Shield, Star, Gamepad2, ArrowRight
} from "lucide-react";
import { MediaDisplay } from "@/components/MediaDisplay";
import CustomColorPicker from "@/components/ColorPicker";
import { MediaAssetModal } from "@/components/MediaAssetModal";
import { AvatarEffectsModal } from "@/components/AvatarEffectsModal";
import { BackgroundEffectsModal } from "@/components/BackgroundEffectsModal";
import { BannerEffectsModal } from "@/components/BannerEffectsModal";
import { CursorEffectsModal } from "@/components/CursorEffectsModal";
import { NameEffectsModal } from "@/components/NameEffectsModal";
import { SlideshowManager } from "@/components/SlideshowManager";
import { AvatarDecoration, PROFILE_AVATAR_EFFECTS } from "@/components/AvatarDecorations";
import { BackgroundEffect, BACKGROUND_EFFECTS_LIST } from "@/components/BackgroundEffects";

// Exported Layout list
export const CARD_LAYOUTS = [
  { v: "classic", l: "Classic", desc: "Centered avatar, bio, badges & clean link stack" },
  { v: "minimal", l: "Minimal", desc: "Ultra-clean compact link stack with minimalist typography" },
  { v: "banner_left", l: "Cover Banner", desc: "Top header banner with left-docked identity" },
  { v: "slideshow", l: "Slideshow Deck", desc: "Interactive scrolling deck with Discord & project embeds" },
  { v: "bento_grid", l: "Bento Grid", desc: "Modern multi-tile responsive bento blocks" },
  { v: "split_left", l: "2-Column Split", desc: "Profile identity on left, links on right" },
  { v: "floating_glass", l: "Floating Glass", desc: "Decoupled floating frosted glass tiles" },
  { v: "magazine", l: "Editorial Hero", desc: "Bold header banner with featured bio hero" },
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

export const SOCIAL_ICON_STYLES = [
  { v: "glass", l: "Glass Circle (Default)" },
  { v: "clean", l: "Clean Floating (No Background)" },
  { v: "solid", l: "Dark Solid Circle" },
  { v: "neon", l: "Glowing Neon Aura" },
  { v: "minimal", l: "Minimalist Borderless" },
];

export const AVATAR_STYLES = [
  { v: "circle", l: "Circle" },
  { v: "squircle", l: "Squircle" },
  { v: "rounded", l: "Rounded Square" },
  { v: "square", l: "Sharp Square" },
  { v: "hexagon", l: "Hexagon Cut" },
];

export const CARD_WIDTHS = [
  { v: "sm", l: "Compact (380px)" },
  { v: "md", l: "Standard (460px)" },
  { v: "lg", l: "Large (540px)" },
  { v: "wide", l: "Ultra-Wide (680px)" },
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

export const TITLE_STYLES = [
  { v: "classic", l: "Classic" },
  { v: "depth_3d", l: "3D Depth" },
  { v: "glass_3d", l: "Glass 3D" },
];

export const ALIGNMENT_OPTIONS = [
  { v: "left", l: "Left" },
  { v: "center", l: "Center" },
  { v: "right", l: "Right" },
];

export const CARD_EFFECTS = [
  { v: "none", l: "None (Clean Surface)" },
  { v: "shimmer", l: "Prism Shimmer (Continuous metallic sheen)" },
  { v: "holographic", l: "Holographic Iridescence" },
  { v: "rgb_border", l: "RGB Spectrum Border (Rainbow glow)" },
  { v: "scanner_line", l: "Scanner Line (Continuous beam)" },
];

export const PFP_EFFECTS = [
  { v: "none", l: "None (Static)" },
  { v: "neon_rim", l: "Neon Rim Glow" },
  { v: "pulse_ripple", l: "Pulse Ripple" },
  { v: "radar_scan", l: "Tactical Radar Scan" },
  { v: "glitch_jitter", l: "Glitch RGB Split" },
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
        <div className="text-xs font-bold uppercase tracking-wider text-[#5B8DB8] border-b border-white/5 pb-2">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

export function ToggleRow({ label, checked, onChange, testid }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-[#E5E7EB]/80 font-medium">{label}</span>
      <Switch data-testid={testid} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function SelectRow({ label, value, onChange, options }) {
  return (
    <div className="flex items-center justify-between py-1 gap-3">
      <span className="text-xs text-[#E5E7EB]/80 font-medium shrink-0">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs bg-black/40 border-white/10 text-white w-48 shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#0b0d13] border-white/15 text-white max-h-60">
          {options.map((op) => (
            <SelectItem key={op.v} value={op.v} className="text-xs">
              {op.l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function SliderRow({ label, value, min = 0, max = 100, step = 1, suffix = "%", onChange }) {
  return (
    <div className="py-1 space-y-1">
      <div className="flex justify-between text-xs text-[#E5E7EB]/75">
        <span>{label}</span>
        <span className="font-mono text-[#5B8DB8] text-[11px]">{Math.round(value)}{suffix}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}

export function ColorRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-1 gap-3">
      <span className="text-xs text-[#E5E7EB]/80 font-medium">{label}</span>
      <div className="w-36">
        <CustomColorPicker value={value} onChange={onChange} label={label} />
      </div>
    </div>
  );
}

// Mini Live Wireframe for Layout Selectors
function RealLayoutPreview({ layout, isSelected, displayName, username, pfpUrl }) {
  const accent = isSelected ? "#5B8DB8" : "#4A6B8A";
  const border = isSelected ? "border-[#5B8DB8]" : "border-[#4A6B8A]/30";
  const bg = isSelected ? "bg-[#5B8DB8]/15" : "bg-[#07090e]";

  return (
    <div className={`w-full aspect-[16/11] rounded-xl border ${border} ${bg} p-2 flex flex-col justify-between overflow-hidden relative transition-all shadow-inner`}>
      {layout === "slideshow" && (
        <div className="flex flex-col justify-between h-full py-0.5 px-1">
          <div className="flex items-center justify-between p-1 rounded-md bg-white/10 border border-white/10">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-[#5B8DB8]" />
              <div className="w-10 h-1 rounded bg-white/60" />
            </div>
            <span className="text-[8px] font-mono text-[#5B8DB8]">SLIDES</span>
          </div>
          <div className="space-y-1">
            <div className="h-3 rounded bg-[#5865F2]/25 border border-[#5865F2]/40 flex items-center px-1.5">
              <span className="text-[7px] text-white font-semibold">Discord Embed</span>
            </div>
            <div className="h-3 rounded bg-[#5B8DB8]/20 border border-[#5B8DB8]/30 flex items-center px-1.5">
              <span className="text-[7px] text-white font-semibold">Project Showcase</span>
            </div>
          </div>
          <div className="flex justify-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#5B8DB8]" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
          </div>
        </div>
      )}

      {layout === "classic" && (
        <div className="flex flex-col items-center justify-between h-full py-1">
          <div className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 rounded-full border border-[#5B8DB8] overflow-hidden bg-white/10 flex items-center justify-center">
              <img src={pfpUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="w-14 h-1 rounded-full bg-white/70" />
            <div className="w-9 h-0.5 rounded-full bg-white/30" />
          </div>
          <div className="w-full space-y-1 px-1">
            <div className="h-2 rounded bg-white/10 border border-white/10" />
            <div className="h-2 rounded bg-white/10 border border-white/10" />
          </div>
        </div>
      )}

      {layout === "minimal" && (
        <div className="flex flex-col items-center justify-between h-full py-1">
          <div className="w-5 h-5 rounded-full border border-[#5B8DB8] bg-[#5B8DB8]/40" />
          <div className="w-12 h-1 rounded bg-white/50" />
          <div className="w-full space-y-1 px-2">
            <div className="h-1.5 rounded-full bg-white/25" />
            <div className="h-1.5 rounded-full bg-white/25" />
            <div className="h-1.5 rounded-full bg-white/25" />
          </div>
        </div>
      )}

      {(layout === "banner_left" || layout === "banner") && (
        <div className="flex flex-col h-full -m-1">
          <div className="h-6 bg-[#5B8DB8]/30 border-b border-[#5B8DB8]/40 relative">
            <div className="absolute -bottom-2 left-2 w-5 h-5 rounded-full border border-[#5B8DB8] bg-[#0c0e15] overflow-hidden">
              <img src={pfpUrl} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="mt-3.5 px-2 space-y-1">
            <div className="w-12 h-1 rounded-full bg-white/60" />
            <div className="w-full h-2 rounded bg-white/10" />
            <div className="w-full h-2 rounded bg-white/10" />
          </div>
        </div>
      )}

      {layout === "bento_grid" && (
        <div className="grid grid-cols-3 gap-1 h-full py-0.5">
          <div className="col-span-2 rounded-lg bg-white/10 border border-[#5B8DB8]/40 p-1 flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-[#5B8DB8]" />
            <div className="w-8 h-1 rounded bg-white/60" />
          </div>
          <div className="rounded-lg bg-white/5 border border-white/10" />
          <div className="rounded-lg bg-white/5 border border-white/10" />
          <div className="col-span-2 rounded-lg bg-white/10 border border-white/10" />
        </div>
      )}

      {layout === "split_left" && (
        <div className="grid grid-cols-[1fr_1.3fr] gap-1.5 items-center h-full px-1">
          <div className="flex flex-col items-center gap-1">
            <div className="w-5 h-5 rounded-full border border-[#5B8DB8] bg-[#5B8DB8]/40" />
            <div className="w-8 h-1 rounded bg-white/50" />
          </div>
          <div className="space-y-1">
            <div className="h-2 rounded bg-white/10 border border-white/10" />
            <div className="h-2 rounded bg-white/10 border border-white/10" />
            <div className="h-2 rounded bg-white/10 border border-white/10" />
          </div>
        </div>
      )}

      {layout === "floating_glass" && (
        <div className="flex flex-col justify-between h-full py-1 px-1 gap-1">
          <div className="h-6 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-[#5B8DB8]" />
            <div className="w-8 h-1 rounded-full bg-white/60" />
          </div>
          <div className="grid grid-cols-2 gap-1 flex-1">
            <div className="rounded bg-white/5 border border-white/10" />
            <div className="rounded bg-white/5 border border-white/10" />
          </div>
        </div>
      )}

      {layout === "magazine" && (
        <div className="flex flex-col items-center justify-between h-full py-1">
          <div className="w-5 h-5 rounded-full border border-[#5B8DB8] bg-[#5B8DB8]/40" />
          <div className="w-14 h-1 rounded-full bg-white/60" />
          <div className="w-full space-y-1 px-1">
            <div className="h-2.5 rounded bg-[#5B8DB8]/20 border border-[#5B8DB8]/30" />
            <div className="h-2 rounded bg-white/10" />
          </div>
        </div>
      )}

      {layout === "grid_tiles" && (
        <div className="flex flex-col items-center justify-between h-full py-0.5">
          <div className="w-4 h-4 rounded-full bg-[#5B8DB8]" />
          <div className="w-10 h-0.5 rounded bg-white/50" />
          <div className="grid grid-cols-2 gap-1 w-full px-1">
            <div className="h-3 rounded bg-white/10 border border-white/10" />
            <div className="h-3 rounded bg-white/10 border border-white/10" />
            <div className="h-3 rounded bg-white/10 border border-white/10" />
            <div className="h-3 rounded bg-white/10 border border-white/10" />
          </div>
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

  const uploadFile = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
    return data.url;
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

  // Quick Effect application on name
  const applyQuickNameEffect = (eff) => {
    const clean = (displayName || username || "swats").replace(/^:[a-zA-Z0-9_#-]+:(.*?)(?::[a-zA-Z0-9_#-]+)?:$/g, "$1").trim();
    const wrapped = eff.wrap(clean, s.sparkle_color || s.accent_color || "#5B8DB8");
    setDisplayName(wrapped);
    toast.success(`${eff.name} applied to Display Name!`);
  };

  return (
    <div className="w-full max-w-[1900px] mx-auto space-y-5">
      {/* Top Header & Save Bar */}
      <Header
        title="Customization Studio"
        subtitle="Full bio customization: profile visuals, animated effects, card layout & slideshow deck."
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
              className="bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white text-xs font-bold px-5 h-9 rounded-xl shadow-[0_0_15px_rgba(91,141,184,0.35)] gap-1.5"
            >
              <Save size={14} /> {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        }
      />

      {/* Subtabs Bar */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setEditorCategory("profile")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            editorCategory === "profile"
              ? "bg-[#5B8DB8] text-white shadow-md shadow-[#5B8DB8]/20"
              : "bg-white/5 text-[#E5E7EB]/70 hover:text-white hover:bg-white/10"
          }`}
        >
          <Palette size={14} /> Main Profile
        </button>
        <button
          type="button"
          onClick={() => setEditorCategory("layout")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            editorCategory === "layout"
              ? "bg-[#5B8DB8] text-white shadow-md shadow-[#5B8DB8]/20"
              : "bg-white/5 text-[#E5E7EB]/70 hover:text-white hover:bg-white/10"
          }`}
        >
          <Layers size={14} /> Layout & Deck
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: MAIN PROFILE                                                    */}
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
                {/* Hover Blur Overlay */}
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
                      <ImagePlus size={28} className="mx-auto mb-1 opacity-50" />
                      <span className="text-[10px]">No Wallpaper</span>
                    </div>
                  )}
                </div>
                {/* Hover Blur Overlay */}
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
                      <ImageIcon size={28} className="mx-auto mb-1 opacity-50" />
                      <span className="text-[10px]">No Banner</span>
                    </div>
                  )}
                </div>
                {/* Hover Blur Overlay */}
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
                {/* Hover Blur Overlay */}
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
                className="bg-[#080a10] hover:bg-[#5B8DB8]/20 text-white hover:text-[#5B8DB8] border border-white/10 hover:border-[#5B8DB8]/50 h-10 rounded-xl text-xs font-bold gap-2 transition-all shadow-sm"
              >
                <Sparkles size={15} className="text-[#5B8DB8]" /> Avatar Effects
              </Button>
              <Button
                type="button"
                onClick={() => setBgModalOpen(true)}
                className="bg-[#080a10] hover:bg-[#5B8DB8]/20 text-white hover:text-[#5B8DB8] border border-white/10 hover:border-[#5B8DB8]/50 h-10 rounded-xl text-xs font-bold gap-2 transition-all shadow-sm"
              >
                <Wand2 size={15} className="text-[#5B8DB8]" /> Background Effects
              </Button>
              <Button
                type="button"
                onClick={() => setBannerModalOpen(true)}
                className="bg-[#080a10] hover:bg-[#5B8DB8]/20 text-white hover:text-[#5B8DB8] border border-white/10 hover:border-[#5B8DB8]/50 h-10 rounded-xl text-xs font-bold gap-2 transition-all shadow-sm"
              >
                <Layers size={15} className="text-[#5B8DB8]" /> Banner Effects
              </Button>
              <Button
                type="button"
                onClick={() => setCursorModalOpen(true)}
                className="bg-[#080a10] hover:bg-[#5B8DB8]/20 text-white hover:text-[#5B8DB8] border border-white/10 hover:border-[#5B8DB8]/50 h-10 rounded-xl text-xs font-bold gap-2 transition-all shadow-sm"
              >
                <MousePointer2 size={15} className="text-[#5B8DB8]" /> Cursor Effects
              </Button>
            </div>
          </Panel>

          {/* Profile Identity Text Inputs & Quick Letter 'S' Effects */}
          <Panel title="Profile Identity & Name Typography">
            <div className="space-y-4">
              {/* Quick Effects Row with Letter 'S' */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs text-[#E5E7EB]/70 font-semibold">
                    Quick Text Effects (Click any &lsquo;S&rsquo; to style display name)
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNameModalOpen(true)}
                    className="text-[11px] h-6 px-2.5 rounded-lg border-[#5B8DB8]/40 text-[#5B8DB8] hover:bg-[#5B8DB8]/10"
                  >
                    <Flame size={12} className="mr-1" /> Open Name Effects Studio
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {USERNAME_EFFECTS_LIST.map((ue) => (
                    <button
                      key={ue.id}
                      type="button"
                      onClick={() => applyQuickNameEffect(ue)}
                      className="px-3 py-1.5 rounded-xl bg-[#080a10] border border-white/10 hover:border-[#5B8DB8] hover:bg-[#111624] text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-sm group"
                      title={ue.desc}
                    >
                      <span className="w-5 h-5 rounded-md bg-black/60 border border-white/10 flex items-center justify-center font-display text-sm font-black group-hover:scale-110 transition-transform">
                        {renderBioText(ue.wrap("S", s.sparkle_color || s.accent_color || "#5B8DB8"))}
                      </span>
                      <span className="text-[11px] text-white/80">{ue.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Name Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-[#E5E7EB]/70 font-semibold">Display Name</Label>
                  <span className="text-[11px] font-mono text-[#5B8DB8]">Supports tags like :waveflow:name: :rgbglow:name:</span>
                </div>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  className="bg-[#080a10] border-white/10 text-white h-9 text-xs rounded-xl focus:border-[#5B8DB8]"
                />
              </div>

              {/* Bio Description Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-[#E5E7EB]/70 font-semibold">Bio Description</Label>
                  <span className="text-[11px] font-mono text-[#E5E7EB]/40">Markdown formatting enabled</span>
                </div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Tell visitors about yourself, discord servers, or creative projects..."
                  className="bg-[#080a10] border-white/10 text-white text-xs rounded-xl focus:border-[#5B8DB8]"
                />
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
      {/* SUBTAB 2: LAYOUT & SLIDESHOW DECK                                         */}
      {/* ========================================================================= */}
      {editorCategory === "layout" && (
        <div className="space-y-6">
          {/* Layout Selector Panel */}
          <Panel title="Profile Card Layout Selection">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-[#E5E7EB]/70 text-xs font-semibold">Active Layout</Label>
                <span className="text-xs text-[#5B8DB8] font-bold font-mono">
                  {CARD_LAYOUTS.find((cl) => cl.v === (s.card_layout || "classic"))?.l || "Classic"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {CARD_LAYOUTS.map((layout) => {
                  const active = (s.card_layout || "classic") === layout.v;
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
                        displayName={displayName}
                        username={username}
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

          {/* Slideshow Deck Manager (When Slideshow Layout is chosen, or for deck configuration) */}
          {(s.card_layout === "slideshow" || s.slideshow_enabled) && (
            <Panel title="Slideshow Deck System">
              <SlideshowManager
                slideshowConfig={s.slideshow || { slides: [] }}
                onChange={(newSlideshow) => patch("slideshow", newSlideshow)}
                uploadFile={uploadFile}
              />
            </Panel>
          )}

          {/* Layout Settings ALWAYS shown below */}
          <Panel title="Card Visual Parameters (Alpha, Blur, Colors & Shapes)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sliders */}
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
                <SliderRow
                  label="Card Border Radius"
                  value={s.card_radius !== undefined ? s.card_radius : 24}
                  max={48}
                  suffix="px"
                  onChange={(v) => patch("card_radius", v)}
                />
              </div>

              {/* Color & Material Selectors */}
              <div className="space-y-2 p-3.5 rounded-xl bg-[#080a10] border border-white/5">
                <SelectRow
                  label="Card Material Style"
                  value={s.card_style || "solid"}
                  onChange={(v) => patch("card_style", v)}
                  options={CARD_STYLES}
                />
                <SelectRow
                  label="Card Corner Shape"
                  value={s.card_shape || "rounded"}
                  onChange={(v) => patch("card_shape", v)}
                  options={CARD_SHAPES}
                />
                <SelectRow
                  label="Card Width Size"
                  value={s.card_width || "md"}
                  onChange={(v) => patch("card_width", v)}
                  options={CARD_WIDTHS}
                />
                <ColorRow
                  label="Card Accent & Glow Color"
                  value={s.accent_color || "#5B8DB8"}
                  onChange={(v) => patch("accent_color", v)}
                />
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* Media Asset Modal (500x500 popup for pfp, background, banner, cursor) */}
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
