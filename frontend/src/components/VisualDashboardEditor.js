import React, { useState, useRef, useEffect } from "react";
import {
  X, Move, Plus, Trash2, Eye, EyeOff, Sparkles, Layers,
  Grid, Check, Settings, Play, ArrowRight, ArrowLeft,
  ChevronUp, ChevronDown, Sliders, Palette, Zap, Disc,
  Music, Volume2, ShieldAlert, Monitor, Laptop, Smartphone,
  RotateCcw, Save, Copy
} from "lucide-react";
import { SiDiscord, SiSpotify } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

export const ANIMATION_OPTIONS = [
  { id: "none", name: "None (Static)" },
  { id: "float_smooth", name: "Smooth Floating Hover" },
  { id: "pulse_slow", name: "Subtle Breathing Pulse" },
  { id: "neon_flicker", name: "Cyber Neon Flicker" },
  { id: "glitch_tactical", name: "Tactical Matrix Glitch" },
  { id: "hologram_scan", name: "Sci-Fi Hologram Scanline" },
  { id: "wave_gentle", name: "Gentle Ocean Wave" },
  { id: "bounce_soft", name: "Soft Kinetic Bounce" },
  { id: "glass_shimmer", name: "Frosted Glass Shimmer" },
  { id: "tilt_3d", name: "Dynamic 3D Tilt Orbit" },
  { id: "rotate_slow", name: "Continuous Slow Orbit" },
  { id: "strobe_fast", name: "Cyberpunk Strobe Flash" },
  { id: "slide_reveal", name: "Cinematic Slide Reveal" },
  { id: "zoom_breathing", name: "Warp Zoom Breathing" },
  { id: "color_cycle", name: "RGB Ambient Spectrum Cycle" },
];

export function VisualDashboardEditor({ open, onClose, user, onSaveSettings }) {
  const [settings, setSettings] = useState(() => ({
    ...(user?.settings || {}),
    visual_editor: {
      grid_snap: 16,
      show_grid: true,
      ...(user?.settings?.visual_editor || {}),
    },
  }));

  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [slides, setSlides] = useState(() => {
    const s = user?.settings?.slideshow?.slides;
    return Array.isArray(s) && s.length > 0 ? s : [
      { id: "slide_1", title: "Identity Deck", type: "profile", elements: ["avatar", "title", "badges", "bio", "socials"] },
      { id: "slide_2", title: "Media & Embeds", type: "media", elements: ["spotify", "discord", "widgets"] },
      { id: "slide_3", title: "Links & Showcase", type: "links", elements: ["links"] },
    ];
  });

  const [selectedLayer, setSelectedLayer] = useState("card");
  const [contextMenu, setContextMenu] = useState(null);
  const [gridSnap, setGridSnap] = useState(true);
  const [gridSize, setGridSize] = useState(16);
  const [previewDevice, setPreviewDevice] = useState("desktop"); // desktop, tablet, mobile

  const [elementPositions, setElementPositions] = useState(() => {
    return user?.settings?.advanced_positioning?.elements || {
      avatar: { x: 0, y: 0, scale: 100, rotation: 0, animation: "none", zIndex: 10, visible: true },
      title: { x: 0, y: 0, scale: 100, rotation: 0, animation: "none", zIndex: 9, visible: true },
      badges: { x: 0, y: 0, scale: 100, rotation: 0, animation: "none", zIndex: 8, visible: true },
      bio: { x: 0, y: 0, scale: 100, rotation: 0, animation: "none", zIndex: 7, visible: true },
      socials: { x: 0, y: 0, scale: 100, rotation: 0, animation: "none", zIndex: 6, visible: true },
      links: { x: 0, y: 0, scale: 100, rotation: 0, animation: "none", zIndex: 5, visible: true },
      discord: { x: 0, y: 0, scale: 100, rotation: 0, animation: "none", zIndex: 4, visible: true },
      spotify: { x: 0, y: 0, scale: 100, rotation: 0, animation: "none", zIndex: 3, visible: true },
      widgets: { x: 0, y: 0, scale: 100, rotation: 0, animation: "none", zIndex: 2, visible: true },
    };
  });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const elementStartPosRef = useRef({ x: 0, y: 0 });
  const activeElementRef = useRef(null);

  const handleStartDrag = (e, elemKey) => {
    if (e.button !== 0) return; // only left click
    e.stopPropagation();
    setSelectedLayer(elemKey);
    isDraggingRef.current = true;
    activeElementRef.current = elemKey;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    elementStartPosRef.current = {
      x: elementPositions[elemKey]?.x || 0,
      y: elementPositions[elemKey]?.y || 0,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current || !activeElementRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      let newX = elementStartPosRef.current.x + dx;
      let newY = elementStartPosRef.current.y + dy;

      if (gridSnap) {
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }

      setElementPositions((prev) => ({
        ...prev,
        [activeElementRef.current]: {
          ...(prev[activeElementRef.current] || {}),
          x: newX,
          y: newY,
        },
      }));
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      activeElementRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [gridSnap, gridSize]);

  const handleContextMenu = (e, elemKey) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedLayer(elemKey);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      element: elemKey,
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  const updateSelectedElem = (prop, val) => {
    if (!selectedLayer) return;
    setElementPositions((prev) => ({
      ...prev,
      [selectedLayer]: {
        ...(prev[selectedLayer] || {}),
        [prop]: val,
      },
    }));
  };

  const handleAddSlide = () => {
    const newSlideId = `slide_${Date.now()}`;
    const newSlide = {
      id: newSlideId,
      title: `Deck Slide ${slides.length + 1}`,
      type: "custom",
      elements: ["links", "widgets"],
    };
    setSlides([...slides, newSlide]);
    setActiveSlideIdx(slides.length);
    toast.success("New deck slide added!");
  };

  const handleRemoveSlide = (idx) => {
    if (slides.length <= 1) return toast.error("Must keep at least 1 slide");
    const updated = slides.filter((_, i) => i !== idx);
    setSlides(updated);
    setActiveSlideIdx(Math.max(0, idx - 1));
    toast.success("Slide removed");
  };

  const handleSaveAll = async () => {
    const updatedSettings = {
      ...settings,
      advanced_positioning: {
        ...(settings.advanced_positioning || {}),
        enabled: true,
        elements: elementPositions,
      },
      slideshow: {
        ...(settings.slideshow || {}),
        slides: slides,
      },
      visual_editor: {
        grid_snap: gridSize,
        show_grid: gridSnap,
      },
    };
    await onSaveSettings(updatedSettings);
    toast.success("Visual canvas layout saved successfully!");
  };

  if (!open) return null;

  const currentElemConfig = elementPositions[selectedLayer] || {};

  return (
    <div className="fixed inset-0 z-[99999] bg-[#050608] text-[#E5E7EB] flex flex-col select-none overflow-hidden" onClick={closeContextMenu}>
      {/* Top Studio Bar */}
      <div className="h-14 border-b border-white/10 bg-[#090b10] px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold font-display text-sm tracking-wide">
            <ShieldAlert size={18} className="text-amber-400 animate-pulse" />
            <span>VISUAL SANDBOX ENGINE // LIVE DRAG-AND-DROP CANVAS</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
            TESTING MODE
          </span>
        </div>

        {/* Viewport switcher */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setPreviewDevice("desktop")}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              previewDevice === "desktop" ? "bg-[#5B8DB8] text-white" : "text-[#E5E7EB]/60 hover:text-white"
            }`}
          >
            <Monitor size={14} /> Desktop
          </button>
          <button
            onClick={() => setPreviewDevice("tablet")}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              previewDevice === "tablet" ? "bg-[#5B8DB8] text-white" : "text-[#E5E7EB]/60 hover:text-white"
            }`}
          >
            <Laptop size={14} /> Tablet
          </button>
          <button
            onClick={() => setPreviewDevice("mobile")}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              previewDevice === "mobile" ? "bg-[#5B8DB8] text-white" : "text-[#E5E7EB]/60 hover:text-white"
            }`}
          >
            <Smartphone size={14} /> Mobile
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGridSnap(!gridSnap)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              gridSnap ? "bg-white/15 border-white/30 text-white" : "border-white/10 text-[#E5E7EB]/50"
            }`}
          >
            <Grid size={13} /> Snap Grid ({gridSize}px)
          </button>
          <Button onClick={handleSaveAll} className="bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white text-xs gap-1.5 rounded-xl h-8 px-4 font-bold shadow-lg shadow-[#5B8DB8]/20">
            <Save size={14} /> Save Layout
          </Button>
          <button onClick={onClose} className="p-2 rounded-xl text-[#E5E7EB]/60 hover:text-white hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Studio Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Layers & Slides */}
        <div className="w-64 border-r border-white/10 bg-[#08090d] flex flex-col shrink-0">
          <div className="p-3 border-b border-white/10 font-bold text-xs uppercase tracking-wider text-[#E5E7EB]/80 flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Layers size={14} className="text-[#5B8DB8]" /> Slideshow Decks</span>
            <button onClick={handleAddSlide} className="text-[11px] text-[#5B8DB8] hover:underline flex items-center gap-1 font-bold">
              <Plus size={12} /> Add Deck
            </button>
          </div>

          <div className="p-2 space-y-1.5 max-h-48 overflow-y-auto border-b border-white/10">
            {slides.map((sl, idx) => (
              <div
                key={sl.id || idx}
                onClick={() => setActiveSlideIdx(idx)}
                className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${
                  activeSlideIdx === idx
                    ? "bg-[#5B8DB8]/20 border border-[#5B8DB8] text-white"
                    : "bg-white/5 border border-white/5 text-[#E5E7EB]/70 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-4 h-4 rounded-md bg-black/40 flex items-center justify-center text-[10px] font-mono font-bold text-[#5B8DB8]">
                    {idx + 1}
                  </span>
                  <span className="truncate">{sl.title}</span>
                </div>
                {slides.length > 1 && (
                  <button onClick={(e) => { e.stopPropagation(); handleRemoveSlide(idx); }} className="text-red-400 hover:text-red-300 p-1">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Profile Canvas Layers */}
          <div className="p-3 border-b border-white/10 font-bold text-xs uppercase tracking-wider text-[#E5E7EB]/80 flex items-center gap-1.5">
            <Sliders size={14} className="text-[#5B8DB8]" /> Canvas Elements
          </div>

          <div className="flex-1 p-2 space-y-1 overflow-y-auto">
            {Object.keys(elementPositions).map((k) => {
              const pos = elementPositions[k] || {};
              const isSelected = selectedLayer === k;
              return (
                <div
                  key={k}
                  onClick={() => setSelectedLayer(k)}
                  className={`p-2 rounded-xl text-xs font-medium flex items-center justify-between cursor-pointer transition-all ${
                    isSelected ? "bg-white/15 border border-white/30 text-white shadow-md" : "hover:bg-white/5 text-[#E5E7EB]/70 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 capitalize">
                    <Move size={12} className="text-[#5B8DB8]" />
                    <span>{k}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-[#E5E7EB]/40">
                    <span>X: {pos.x || 0}</span>
                    <span>Y: {pos.y || 0}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Live Drag Canvas Workspace */}
        <div className="flex-1 bg-[#040507] relative overflow-hidden flex items-center justify-center p-8">
          {/* Subtle Grid Lines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: `linear-gradient(to right, #5B8DB8 1px, transparent 1px), linear-gradient(to bottom, #5B8DB8 1px, transparent 1px)`,
              backgroundSize: `${gridSize}px ${gridSize}px`,
            }}
          />

          {/* Device Frame */}
          <div
            className={`relative transition-all duration-300 rounded-3xl border-2 border-white/20 bg-[#090b10] shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col items-center p-6 ${
              previewDevice === "desktop" ? "w-[480px] min-h-[640px]" : previewDevice === "tablet" ? "w-[400px] min-h-[580px]" : "w-[340px] min-h-[520px]"
            }`}
          >
            {/* Header banner area */}
            <div className="w-full text-center mb-4 pb-2 border-b border-white/10 text-[10px] font-mono uppercase tracking-widest text-[#E5E7EB]/40">
              {slides[activeSlideIdx]?.title || "Identity Slide"}
            </div>

            {/* Draggable Layer Components */}
            {Object.keys(elementPositions).map((k) => {
              const pos = elementPositions[k] || {};
              if (pos.visible === false) return null;
              const isSelected = selectedLayer === k;

              return (
                <div
                  key={k}
                  onMouseDown={(e) => handleStartDrag(e, k)}
                  onContextMenu={(e) => handleContextMenu(e, k)}
                  className={`cursor-grab active:cursor-grabbing transition-shadow duration-150 relative mb-3 ${
                    isSelected ? "ring-2 ring-[#5B8DB8] shadow-[0_0_20px_rgba(91,141,184,0.4)] rounded-2xl" : "hover:ring-1 hover:ring-white/30 rounded-2xl"
                  } anim-${pos.animation || "none"}`}
                  style={{
                    transform: `translate(${pos.x || 0}px, ${pos.y || 0}px) scale(${(pos.scale || 100) / 100}) rotate(${pos.rotation || 0}deg)`,
                    zIndex: pos.zIndex || 1,
                  }}
                >
                  {/* Selected Indicator Handle */}
                  {isSelected && (
                    <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-[#5B8DB8] text-white flex items-center justify-center text-[10px] font-bold shadow-lg pointer-events-none">
                      <Move size={11} />
                    </div>
                  )}

                  {/* Render Visual Mockup of Element */}
                  {k === "avatar" && (
                    <div className="w-20 h-20 rounded-full border-2 border-[#5B8DB8] bg-[#0c0e14] flex items-center justify-center overflow-hidden shadow-xl mx-auto">
                      <img src={user?.pfp ? `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}` : `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {k === "title" && (
                    <div className="text-center px-4 py-1">
                      <div className="font-extrabold text-lg text-white">{user.display_name || user.username}</div>
                      <div className="text-xs text-[#5B8DB8]">@{user.username}</div>
                    </div>
                  )}

                  {k === "badges" && (
                    <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                      <Sparkles size={12} className="text-[#5B8DB8]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white">VIP Badge Deck</span>
                    </div>
                  )}

                  {k === "bio" && (
                    <div className="text-center text-xs text-[#E5E7EB]/70 px-4 max-w-xs">
                      {user.description || "Building the cleanest bio profiles on Swats.bio."}
                    </div>
                  )}

                  {k === "socials" && (
                    <div className="flex items-center justify-center gap-2 p-1.5 rounded-xl bg-black/40 border border-white/10">
                      <SiDiscord size={13} className="text-[#5865F2]" />
                      <SiSpotify size={13} className="text-[#1DB954]" />
                      <Sparkles size={13} className="text-[#5B8DB8]" />
                    </div>
                  )}

                  {k === "links" && (
                    <div className="w-64 p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs font-semibold">
                      <span>🔗 Official Social Link Button</span>
                      <ArrowRight size={13} className="text-[#5B8DB8]" />
                    </div>
                  )}

                  {k === "discord" && (
                    <div className="w-64 p-2.5 rounded-xl bg-[#5865F2]/15 border border-[#5865F2]/40 flex items-center gap-2 text-xs">
                      <SiDiscord size={16} className="text-[#5865F2]" />
                      <div>
                        <div className="font-bold text-white">Discord Live Status</div>
                        <div className="text-[10px] text-[#E5E7EB]/60">Online & Playing</div>
                      </div>
                    </div>
                  )}

                  {k === "spotify" && (
                    <div className="w-64 p-2.5 rounded-xl bg-[#1DB954]/15 border border-[#1DB954]/40 flex items-center gap-2 text-xs">
                      <SiSpotify size={16} className="text-[#1DB954]" />
                      <div className="truncate">
                        <div className="font-bold text-white truncate">Spotify Active Playback</div>
                        <div className="text-[10px] text-[#E5E7EB]/60">Live synced track</div>
                      </div>
                    </div>
                  )}

                  {k === "widgets" && (
                    <div className="w-64 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-between text-xs font-bold text-amber-300">
                      <span>⚡ Interactive Live Widget</span>
                      <Sparkles size={13} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar: Element Controls & Animation Studio */}
        <div className="w-72 border-l border-white/10 bg-[#08090d] flex flex-col shrink-0 p-4 space-y-4 overflow-y-auto">
          <div className="font-bold text-xs uppercase tracking-wider text-[#E5E7EB]/80 flex items-center gap-1.5 pb-2 border-b border-white/10">
            <Zap size={14} className="text-amber-400" /> Layer Inspector: <span className="capitalize text-white">{selectedLayer}</span>
          </div>

          {/* Position X / Y */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px] text-[#E5E7EB]/70">Position X (px)</Label>
              <Input
                type="number"
                value={currentElemConfig.x || 0}
                onChange={(e) => updateSelectedElem("x", Number(e.target.value))}
                className="bg-[#040507] border-white/10 text-white h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-[#E5E7EB]/70">Position Y (px)</Label>
              <Input
                type="number"
                value={currentElemConfig.y || 0}
                onChange={(e) => updateSelectedElem("y", Number(e.target.value))}
                className="bg-[#040507] border-white/10 text-white h-8 text-xs font-mono"
              />
            </div>
          </div>

          {/* Scale Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#E5E7EB]/70">Scale Size</span>
              <span className="font-mono text-[#5B8DB8]">{currentElemConfig.scale || 100}%</span>
            </div>
            <Slider
              min={50}
              max={200}
              step={5}
              value={[currentElemConfig.scale || 100]}
              onValueChange={([v]) => updateSelectedElem("scale", v)}
            />
          </div>

          {/* Rotation Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#E5E7EB]/70">Rotation Angle</span>
              <span className="font-mono text-[#5B8DB8]">{currentElemConfig.rotation || 0}°</span>
            </div>
            <Slider
              min={-180}
              max={180}
              step={5}
              value={[currentElemConfig.rotation || 0]}
              onValueChange={([v]) => updateSelectedElem("rotation", v)}
            />
          </div>

          {/* Animation Studio */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <Label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles size={13} className="text-[#5B8DB8]" /> Kinetic Animation Studio
            </Label>
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {ANIMATION_OPTIONS.map((anim) => {
                const isActive = (currentElemConfig.animation || "none") === anim.id;
                return (
                  <button
                    key={anim.id}
                    onClick={() => updateSelectedElem("animation", anim.id)}
                    className={`w-full text-left p-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                      isActive
                        ? "bg-[#5B8DB8]/20 border border-[#5B8DB8] text-white"
                        : "bg-white/5 border border-white/5 text-[#E5E7EB]/60 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span>{anim.name}</span>
                    {isActive && <Check size={13} className="text-[#5B8DB8]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reset layer */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={() => {
                updateSelectedElem("x", 0);
                updateSelectedElem("y", 0);
                updateSelectedElem("scale", 100);
                updateSelectedElem("rotation", 0);
                updateSelectedElem("animation", "none");
              }}
              className="text-xs text-[#E5E7EB]/50 hover:text-white flex items-center gap-1"
            >
              <RotateCcw size={12} /> Reset Layer
            </button>
          </div>
        </div>
      </div>

      {/* Right Click Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-[100000] w-48 rounded-2xl bg-[#0e1118] border border-white/15 p-1.5 shadow-2xl backdrop-blur-2xl text-xs space-y-0.5 animate-in fade-in duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E5E7EB]/40 border-b border-white/10 mb-1">
            {contextMenu.element} Layer
          </div>
          <button
            onClick={() => {
              updateSelectedElem("scale", (currentElemConfig.scale || 100) + 15);
              closeContextMenu();
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-white flex items-center gap-2"
          >
            <Plus size={12} /> Scale Up (+15%)
          </button>
          <button
            onClick={() => {
              updateSelectedElem("scale", Math.max(50, (currentElemConfig.scale || 100) - 15));
              closeContextMenu();
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-white flex items-center gap-2"
          >
            <ChevronDown size={12} /> Scale Down (-15%)
          </button>
          <button
            onClick={() => {
              updateSelectedElem("x", 0);
              updateSelectedElem("y", 0);
              closeContextMenu();
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-white flex items-center gap-2"
          >
            <RotateCcw size={12} /> Center Alignment
          </button>
          <button
            onClick={() => {
              updateSelectedElem("animation", "pulse_slow");
              closeContextMenu();
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-white flex items-center gap-2"
          >
            <Sparkles size={12} className="text-amber-400" /> Apply Pulse FX
          </button>
        </div>
      )}
    </div>
  );
}
