import React, { useState, useRef, useEffect, useCallback } from "react";
import { Pipette, Copy, Check, Clock, Palette, Disc } from "lucide-react";
import { toast } from "sonner";

const PALETTES = [
  {
    name: "Tactical Spec-Ops",
    colors: ["#5B8DB8", "#4A6B8A", "#2F435A", "#1E2836", "#E5E7EB", "#94A3B8"],
  },
  {
    name: "Electric hues",
    colors: ["#00FFCC", "#00E5FF", "#9945FF", "#FF0055", "#FFE600", "#00FF66"],
  },
  {
    name: "Crimson & Blood",
    colors: ["#FF1E56", "#E60039", "#B3002D", "#800020", "#4A0E17", "#1A0508"],
  },
  {
    name: "Sunset Synthwave",
    colors: ["#FF007F", "#FF5722", "#FF9800", "#FFC107", "#7C4DFF", "#536DFE"],
  },
  {
    name: "Green tones",
    colors: ["#00FF66", "#10B981", "#059669", "#047857", "#064E3B", "#022C22"],
  },
  {
    name: "Anime & Pastel",
    colors: ["#FCA5A5", "#FDE047", "#86EFAC", "#93C5FD", "#C4B5FD", "#F9A8D4"],
  },
  {
    name: "Royal & Gold",
    colors: ["#F59E0B", "#D97706", "#B45309", "#FCD34D", "#FEF3C7", "#78350F"],
  },
  {
    name: "Stealth & Mono",
    colors: ["#FFFFFF", "#D1D5DB", "#9CA3AF", "#6B7280", "#374151", "#0B0D10"],
  },
];

const SPECTRUM_SHORTCUTS = [
  "#EF4444", "#F97316", "#F59E0B", "#10B981", "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899", "#FFFFFF", "#000000"
];

function hslToHex(h, s, l) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function hexToHsl(hex) {
  let c = (hex || "").replace("#", "").trim();
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  if (c.length !== 6) return { h: 208, s: 50, l: 50 };

  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: break;
    }
    h = Math.round(h * 60);
  }
  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hexToRgb(hex) {
  let c = (hex || "").replace("#", "").trim();
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  if (c.length !== 6) return { r: 91, g: 141, b: 184 };
  return {
    r: parseInt(c.substring(0, 2), 16),
    g: parseInt(c.substring(2, 4), 16),
    b: parseInt(c.substring(4, 6), 16),
  };
}

export default function CustomColorPicker({
  value = "#5B8DB8",
  onChange,
  label,
  allowAlpha = false,
}) {
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState("palette"); // "palette" or "wheel"
  const [hexInput, setHexInput] = useState(value);
  const [copied, setCopied] = useState(false);
  const [recents, setRecents] = useState([]);
  const [hsl, setHsl] = useState(() => hexToHsl(value));

  const containerRef = useRef(null);
  const wheelRef = useRef(null);
  const isDraggingWheel = useRef(false);

  // Sync state when external value changes
  useEffect(() => {
    setHexInput(value);
    setHsl(hexToHsl(value));
  }, [value]);

  // Load recents from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("swats_recent_colors");
      if (saved) setRecents(JSON.parse(saved).slice(0, 12));
    } catch {}
  }, []);

  const saveRecent = (color) => {
    try {
      const norm = color.toUpperCase();
      const updated = [norm, ...recents.filter((c) => c !== norm)].slice(0, 12);
      setRecents(updated);
      localStorage.setItem("swats_recent_colors", JSON.stringify(updated));
    } catch {}
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const selectColor = (c) => {
    onChange(c);
    setHexInput(c);
    setHsl(hexToHsl(c));
    saveRecent(c);
  };

  const handleHexChange = (val) => {
    let clean = val.trim();
    if (!clean.startsWith("#")) clean = "#" + clean;
    setHexInput(clean);
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(clean)) {
      onChange(clean);
      setHsl(hexToHsl(clean));
      saveRecent(clean);
    }
  };

  const handleEyedropper = async () => {
    if (window.EyeDropper) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          selectColor(result.sRGBHex);
          toast.success(`Sampled ${result.sRGBHex}`);
        }
      } catch {}
    } else {
      toast.info("Eyedropper is supported on Chrome & Edge browsers.");
    }
  };

  const copyHex = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success("Hex copied to clipboard.");
  };

  /* ================= CUSTOM SPECTRUM WHEEL INTERACTION ================= */
  const updateFromWheelEvent = useCallback((e) => {
    const el = wheelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = clientX - rect.left - cx;
    const dy = clientY - rect.top - cy;

    const radius = cx;
    const dist = Math.min(radius, Math.hypot(dx, dy));

    // Calculate angle in degrees (0 to 360)
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (angle < 0) angle += 360;

    const newHue = Math.round(angle);
    const newSat = Math.min(100, Math.max(0, Math.round((dist / radius) * 100)));

    setHsl((prev) => {
      // Keep lightness in range, default to 50 if it was 0 or 100
      const safeL = prev.l <= 5 || prev.l >= 95 ? 50 : prev.l;
      const updated = { h: newHue, s: newSat, l: safeL };
      const hex = hslToHex(updated.h, updated.s, updated.l);
      onChange(hex);
      setHexInput(hex);
      saveRecent(hex);
      return updated;
    });
  }, [onChange]);

  const handleWheelStart = (e) => {
    e.preventDefault();
    isDraggingWheel.current = true;
    updateFromWheelEvent(e);

    const onMove = (moveEvt) => {
      if (isDraggingWheel.current) {
        updateFromWheelEvent(moveEvt);
      }
    };

    const onEnd = () => {
      isDraggingWheel.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onEnd);
  };

  const handleLightnessChange = (newLightness) => {
    setHsl((prev) => {
      const updated = { ...prev, l: newLightness };
      const hex = hslToHex(updated.h, updated.s, updated.l);
      onChange(hex);
      setHexInput(hex);
      saveRecent(hex);
      return updated;
    });
  };

  // Pointer position inside the wheel
  const wheelRadius = 75; // 150px width / 2
  const pointerDist = (hsl.s / 100) * (wheelRadius - 6);
  const pointerRad = (hsl.h * Math.PI) / 180;
  const pointerX = wheelRadius + pointerDist * Math.cos(pointerRad);
  const pointerY = wheelRadius + pointerDist * Math.sin(pointerRad);

  const rgb = hexToRgb(value);

  return (
    <div ref={containerRef} className="relative inline-block w-full">
      {/* Trigger Bar */}
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-3 border border-[#4A6B8A]/25 hover:border-[#5B8DB8]/60 rounded-xl px-3 py-2 cursor-pointer transition-all bg-[#08090B]/60 hover:bg-[#08090B]/85 group shadow-xs"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-5 h-5 rounded-md border border-white/20 shadow-xs shrink-0 transition-transform group-hover:scale-110"
            style={{
              background: value,
              boxShadow: `0 0 8px ${value}44`,
            }}
          />
          <span className="text-xs text-[#E5E7EB]/85 font-medium truncate">
            {label || "Color"}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-xs text-[#5B8DB8] group-hover:text-[#8cbbe6] transition-colors uppercase font-medium">
            {value}
          </span>
        </div>
      </div>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-84 rounded-2xl p-4 bg-[#0d0f14]/98 backdrop-blur-2xl border border-[#4A6B8A]/45 shadow-[0_20px_60px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-150">
          {/* View Mode Toggle: Palettes vs Custom Spectrum Wheel */}
          <div className="flex rounded-xl bg-black/40 p-1 border border-white/10 mb-3 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("palette")}
              className={`flex-1 py-1 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                viewMode === "palette"
                  ? "bg-[#5B8DB8] text-white shadow-sm"
                  : "text-[#E5E7EB]/60 hover:text-white"
              }`}
            >
              <Palette size={13} /> Palettes
            </button>
            <button
              type="button"
              onClick={() => setViewMode("wheel")}
              className={`flex-1 py-1 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                viewMode === "wheel"
                  ? "bg-[#5B8DB8] text-white shadow-sm"
                  : "text-[#E5E7EB]/60 hover:text-white"
              }`}
            >
              <Disc size={13} /> Spectrum Wheel
            </button>
          </div>

          {/* Header Preview, Hex Input & Pipette */}
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/20 shrink-0 shadow-lg group">
              <div
                className="w-full h-full transition-transform group-hover:scale-105"
                style={{ background: value }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-[#E5E7EB]/50 uppercase tracking-wider font-semibold">
                Hex Code
              </div>
              <input
                type="text"
                value={hexInput}
                onChange={(e) => handleHexChange(e.target.value)}
                className="w-full bg-[#161a22] border border-[#4A6B8A]/30 rounded-lg px-2.5 py-1 text-xs font-mono text-[#E5E7EB] uppercase focus:outline-hidden focus:border-[#5B8DB8]"
                placeholder="#5B8DB8"
              />
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleEyedropper}
                title="Eyedropper: Sample color from screen"
                className="w-8 h-8 rounded-lg bg-[#161a22] border border-[#4A6B8A]/30 hover:border-[#5B8DB8] flex items-center justify-center text-[#E5E7EB]/70 hover:text-white transition-all hover:scale-105"
              >
                <Pipette size={14} />
              </button>
              <button
                type="button"
                onClick={copyHex}
                title="Copy color hex"
                className="w-8 h-8 rounded-lg bg-[#161a22] border border-[#4A6B8A]/30 hover:border-[#5B8DB8] flex items-center justify-center text-[#E5E7EB]/70 hover:text-white transition-all hover:scale-105"
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* ================= VIEW 1: PALETTE SWATCHES ================= */}
          {viewMode === "palette" && (
            <>
              {/* Recent Swatches */}
              {recents.length > 0 && (
                <div className="mt-3 pb-2.5 border-b border-white/10">
                  <div className="text-[10px] font-semibold text-[#E5E7EB]/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Clock size={11} className="text-[#5B8DB8]" /> Recent Colors
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {recents.map((rc) => (
                      <button
                        key={rc}
                        type="button"
                        onClick={() => selectColor(rc)}
                        className="w-6 h-6 rounded-md border shrink-0 transition-transform hover:scale-120 relative"
                        style={{
                          background: rc,
                          borderColor: value.toUpperCase() === rc ? "#FFFFFF" : "rgba(255,255,255,0.2)",
                          boxShadow: value.toUpperCase() === rc ? `0 0 8px ${rc}` : "none",
                        }}
                        title={rc}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Curated Theme Palettes */}
              <div className="space-y-3 mt-3 max-h-56 overflow-y-auto pr-1">
                {PALETTES.map((palette) => (
                  <div key={palette.name}>
                    <div className="text-[10px] font-semibold text-[#E5E7EB]/40 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>{palette.name}</span>
                    </div>
                    <div className="grid grid-cols-6 gap-1.5">
                      {palette.colors.map((c) => {
                        const isSelected = value.toLowerCase() === c.toLowerCase();
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => selectColor(c)}
                            className="w-full aspect-square rounded-md border transition-all hover:scale-115 relative group"
                            style={{
                              background: c,
                              borderColor: isSelected ? "#FFFFFF" : "rgba(255,255,255,0.15)",
                              boxShadow: isSelected ? `0 0 10px ${c}` : "none",
                            }}
                            title={c}
                          >
                            {isSelected && (
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white drop-shadow font-bold">
                                ✓
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Open Custom Spectrum Wheel Button */}
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-[#E5E7EB]/50">
                <span className="flex items-center gap-1">
                  <Disc size={12} className="text-[#5B8DB8]" /> 16.7M Spectrum
                </span>
                <button
                  type="button"
                  onClick={() => setViewMode("wheel")}
                  className="text-[#5B8DB8] hover:text-[#8cbbe6] hover:underline font-semibold"
                >
                  Custom Spectrum Wheel →
                </button>
              </div>
            </>
          )}

          {/* ================= VIEW 2: CUSTOM SPECTRUM WHEEL ================= */}
          {viewMode === "wheel" && (
            <div className="mt-3 space-y-3 animate-in fade-in duration-150">
              {/* Circular Color Wheel Canvas */}
              <div className="flex flex-col items-center justify-center">
                <div
                  ref={wheelRef}
                  onMouseDown={handleWheelStart}
                  onTouchStart={handleWheelStart}
                  className="relative w-[150px] h-[150px] rounded-full cursor-crosshair shadow-xl border-2 border-white/20 select-none overflow-hidden touch-none"
                  style={{
                    background: `
                      radial-gradient(circle, #ffffff 0%, rgba(255,255,255,0.65) 25%, transparent 72%),
                      conic-gradient(from 0deg, #ff0000 0deg, #ffff00 60deg, #00ff00 120deg, #00ffff 180deg, #0000ff 240deg, #ff00ff 300deg, #ff0000 360deg)
                    `,
                  }}
                >
                  {/* Wheel Pointer Pin */}
                  <div
                    className="absolute w-4 h-4 rounded-full border-2 border-white shadow-[0_0_6px_rgba(0,0,0,0.85)] pointer-events-none -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${pointerX}px`,
                      top: `${pointerY}px`,
                      backgroundColor: value,
                    }}
                  />
                </div>
                <div className="text-[10px] text-[#E5E7EB]/40 mt-1 font-mono">
                  Hue: {hsl.h}° · Sat: {hsl.s}%
                </div>
              </div>

              {/* Lightness / Brightness Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-semibold text-[#E5E7EB]/50 uppercase tracking-wider">
                  <span>Lightness / Shade</span>
                  <span className="font-mono text-[#5B8DB8]">{hsl.l}%</span>
                </div>
                <div className="relative flex items-center h-4">
                  <input
                    type="range"
                    min="1"
                    max="99"
                    value={hsl.l}
                    onChange={(e) => handleLightnessChange(parseInt(e.target.value, 10))}
                    className="w-full h-2.5 rounded-full appearance-none cursor-pointer border border-white/20 shadow-inner"
                    style={{
                      background: `linear-gradient(to right, #000000 0%, hsl(${hsl.h}, ${hsl.s}%, 50%) 50%, #ffffff 100%)`,
                    }}
                  />
                </div>
              </div>

              {/* RGB Value Chips */}
              <div className="grid grid-cols-3 gap-1.5 py-1 text-center font-mono text-[10px]">
                <div className="p-1 rounded bg-[#161a22] border border-white/10 text-red-400">
                  R: {rgb.r}
                </div>
                <div className="p-1 rounded bg-[#161a22] border border-white/10 text-green-400">
                  G: {rgb.g}
                </div>
                <div className="p-1 rounded bg-[#161a22] border border-white/10 text-blue-400">
                  B: {rgb.b}
                </div>
              </div>

              {/* Pure Hue Shortcuts */}
              <div className="pt-2 border-t border-white/10">
                <div className="text-[10px] font-semibold text-[#E5E7EB]/40 uppercase tracking-wider mb-1.5">
                  Quick Hues
                </div>
                <div className="flex items-center justify-between gap-1">
                  {SPECTRUM_SHORTCUTS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => selectColor(col)}
                      className="w-5 h-5 rounded-full border border-white/20 transition-transform hover:scale-125"
                      style={{ background: col }}
                      title={col}
                    />
                  ))}
                </div>
              </div>

              {/* Back to Palettes link */}
              <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[11px]">
                <button
                  type="button"
                  onClick={() => setViewMode("palette")}
                  className="text-[#5B8DB8] hover:text-[#8cbbe6] hover:underline font-semibold"
                >
                  ← Back to Palettes
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-2.5 py-1 rounded-lg bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white text-[11px] font-semibold transition-all shadow"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
