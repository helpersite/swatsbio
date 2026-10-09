import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Check, X, Sparkles, CloudSun, Compass, Navigation } from "lucide-react";
import CustomColorPicker from "@/components/ColorPicker";

export const LOCATION_EFFECT_STYLES = [
  { id: "glass_pill", name: "Glass Pill", desc: "Frosted translucent badge with subtle border" },
  { id: "neon_glow", name: "Neon Aura", desc: "Electric glow border with ambient drop shadow" },
  { id: "cyber_coords", name: "Cyber Coordinates", desc: "Monospace uppercase tracking with brackets" },
  { id: "minimal_clean", name: "Clean Minimal", desc: "Borderless sleek text with accent pin" },
  { id: "tactical_hud", name: "Tactical HUD", desc: "Beveled badge with telemetry status indicator" },
];

export function LocationEffectsModal({
  open,
  onClose,
  location,
  settings,
  patch,
}) {
  const [selectedStyle, setSelectedStyle] = useState(settings?.location_effect_style || "glass_pill");
  const [pinColor, setPinColor] = useState(settings?.location_pin_color || settings?.accent_color || "#5B8DB8");
  const [glowColor, setGlowColor] = useState(settings?.location_glow_color || settings?.accent_color || "#5B8DB8");

  if (!open) return null;

  const locText = location || "Tokyo, Japan";

  const handleSelectStyle = (id) => {
    setSelectedStyle(id);
    patch("location_effect_style", id);
  };

  const handlePinColor = (c) => {
    setPinColor(c);
    patch("location_pin_color", c);
  };

  const handleGlowColor = (c) => {
    setGlowColor(c);
    patch("location_glow_color", c);
  };

  const renderLocationPreview = (styleId, pCol, gCol) => {
    if (styleId === "neon_glow") {
      return (
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white backdrop-blur-md"
          style={{
            background: "rgba(10,12,16,0.85)",
            border: `1.5px solid ${pCol}`,
            boxShadow: `0 0 14px ${gCol}66, inset 0 0 8px ${gCol}22`,
          }}
        >
          <MapPin size={12} style={{ color: pCol, filter: `drop-shadow(0 0 6px ${gCol})` }} />
          <span>{locText}</span>
        </span>
      );
    }
    if (styleId === "cyber_coords") {
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-mono uppercase tracking-widest text-white/90 border border-white/15 bg-black/60"
          style={{ borderColor: `${pCol}44` }}
        >
          <Compass size={11} style={{ color: pCol }} />
          <span>[LOC // {locText}]</span>
        </span>
      );
    }
    if (styleId === "minimal_clean") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-white/80">
          <MapPin size={12} style={{ color: pCol }} />
          <span>{locText}</span>
        </span>
      );
    }
    if (styleId === "tactical_hud") {
      return (
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-mono uppercase text-white bg-[#0a0c10] border"
          style={{ borderColor: `${pCol}88`, boxShadow: `0 2px 10px rgba(0,0,0,0.5)` }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: pCol }} />
          <span style={{ color: pCol }}>LAT:</span>
          <span>{locText}</span>
        </span>
      );
    }
    // Default: glass_pill
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-white/90 font-medium backdrop-blur-md"
        style={{ borderColor: `${pCol}33` }}
      >
        <MapPin size={12} style={{ color: pCol }} />
        <span>{locText}</span>
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[620px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[92dvh] bg-[#090b10] border border-white/10 text-white p-0 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#0c0e15]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 flex items-center justify-center text-[#5B8DB8]">
              <MapPin size={16} />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-white font-display">
                Location Effects Studio
              </DialogTitle>
              <div className="text-[11px] text-[#E5E7EB]/50">
                Visual styles, glowing pins, coordinates format & telemetry badges
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Live Preview */}
        <div className="p-4 bg-[#050609] border-b border-white/10 text-center shrink-0">
          <div className="text-[10px] uppercase font-bold tracking-widest text-[#5B8DB8] mb-1.5">
            Live Location Preview
          </div>
          <div className="min-h-[38px] flex items-center justify-center">
            {renderLocationPreview(selectedStyle, pinColor, glowColor)}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {/* Colors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0c0e15] p-3 rounded-xl border border-white/5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[#E5E7EB]/70 font-medium">Pin Icon Color:</span>
              <div className="w-32">
                <CustomColorPicker value={pinColor} onChange={handlePinColor} label="Pin Color" />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[#E5E7EB]/70 font-medium">Glow Accent:</span>
              <div className="w-32">
                <CustomColorPicker value={glowColor} onChange={handleGlowColor} label="Glow Color" />
              </div>
            </div>
          </div>

          {/* Style Options */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-white/70">Badge Silhouette & Style</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {LOCATION_EFFECT_STYLES.map((st) => {
                const isSelected = selectedStyle === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleSelectStyle(st.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-[#5B8DB8]/20 border-[#5B8DB8] ring-1 ring-[#5B8DB8]/50 shadow-[0_0_15px_rgba(91,141,184,0.25)]"
                        : "bg-[#0c0e15] border-white/10 hover:border-[#5B8DB8]/40 hover:bg-[#111624]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-xs font-bold ${isSelected ? "text-[#5B8DB8]" : "text-white"}`}>{st.name}</span>
                        {isSelected && <Check size={13} className="text-[#5B8DB8]" />}
                      </div>
                      <div className="text-[10px] text-[#E5E7EB]/50 mb-2">{st.desc}</div>
                      <div className="p-1.5 rounded-lg bg-black/60 border border-white/5 text-center flex items-center justify-center">
                        {renderLocationPreview(st.id, pinColor, glowColor)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-[#0c0e15] flex items-center justify-end shrink-0">
          <Button
            type="button"
            size="sm"
            onClick={onClose}
            className="text-xs font-bold h-8 px-5 rounded-lg bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white shadow-[0_0_12px_rgba(91,141,184,0.35)] cursor-pointer"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
