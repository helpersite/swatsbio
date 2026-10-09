import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { MousePointer2, Check, X, Sliders, Crosshair, Sparkles } from "lucide-react";
import CustomColorPicker from "@/components/ColorPicker";

export const CURSOR_EFFECTS_LIST = [
  { id: "none", name: "Default Pointer", desc: "Standard operating system cursor" },
  { id: "trail", name: "Particle Trail", desc: "Smooth glowing stardust trail following pointer movements" },
  { id: "sparkles", name: "Click Sparkles", desc: "Bursting luminous stars when clicking and hovering buttons" },
  { id: "crosshair", name: "Tactical Crosshair", desc: "Tactical cyber gaming reticle target pointer" },
  { id: "neon_aura", name: "Neon Halo", desc: "Glowing ambient orb centered directly beneath cursor" },
  { id: "glow_dot", name: "Precision Dot", desc: "Minimalist glowing precision target dot" },
];

export function CursorEffectsModal({
  open,
  onClose,
  settings,
  patch,
}) {
  if (!open) return null;

  const currentCursorFx = settings?.cursor_fx || "none";
  const cursorColor = settings?.cursor_fx_color || "#5B8DB8";
  const cursorSize = settings?.cursor_fx_size || 16;

  const handleSelect = (id) => {
    patch("cursor_fx", id);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[560px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[92dvh] bg-[#0c0e15] border border-[#2b384e] text-white p-0 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#090b10]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 flex items-center justify-center text-[#5B8DB8]">
              <MousePointer2 size={16} />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-white font-display">
                Cursor Effects Studio
              </DialogTitle>
              <div className="text-[11px] text-[#E5E7EB]/50">
                Custom cursor trail particles, crosshairs, and interactive hover halos
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

        {/* Modal Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            {CURSOR_EFFECTS_LIST.map((c) => {
              const isSelected = currentCursorFx === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c.id)}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between group cursor-pointer ${
                    isSelected
                      ? "bg-[#5B8DB8]/20 border-[#5B8DB8] shadow-[0_0_15px_rgba(91,141,184,0.3)] ring-1 ring-[#5B8DB8]"
                      : "bg-[#080a10] border-white/10 hover:border-[#5B8DB8]/50 hover:bg-[#111624]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{c.name}</span>
                    {isSelected && <Check size={13} className="text-[#5B8DB8]" />}
                  </div>
                  <div className="text-[10px] text-[#E5E7EB]/50">{c.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Interactive Live Cursor Preview Area */}
          <div className="p-4 rounded-xl border border-dashed border-[#5B8DB8]/40 bg-[#06080d] text-center space-y-2 relative overflow-hidden group select-none">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span className="font-bold flex items-center gap-1.5 text-[#5B8DB8]">
                <Sparkles size={13} /> Live Interactive Test Box
              </span>
              <span className="text-[10px] text-white/40 font-mono">Move mouse / click here</span>
            </div>
            <div className="h-24 rounded-lg bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center p-3 relative">
              <MousePointer2 size={20} className="text-[#5B8DB8] animate-bounce mb-1" />
              <div className="text-xs font-semibold text-white">Hover and click around this area</div>
              <div className="text-[10px] text-white/40">Real-time particle bursts, trail stars & glowing halospan</div>
            </div>
          </div>

          {currentCursorFx !== "none" && (
            <div className="p-3.5 rounded-xl border border-white/10 bg-[#080a10] space-y-3">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sliders size={13} className="text-[#5B8DB8]" />
                <span>Cursor FX Parameters</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-[#E5E7EB]/70">Particle Aura Color:</span>
                <div className="w-36">
                  <CustomColorPicker
                    value={cursorColor}
                    onChange={(col) => patch("cursor_fx_color", col)}
                    label="Color"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-[#E5E7EB]/70 mb-1">
                  <span>Pointer Size</span>
                  <span className="font-mono text-[#5B8DB8] text-[11px]">{cursorSize}px</span>
                </div>
                <Slider
                  value={[cursorSize]}
                  min={12}
                  max={36}
                  step={2}
                  onValueChange={(v) => patch("cursor_fx_size", v[0])}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-[#090b10] flex items-center justify-between shrink-0">
          <div className="text-xs text-[#E5E7EB]/60">
            Selected: <span className="font-semibold text-white">{currentCursorFx}</span>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={onClose}
            className="text-xs font-bold h-8 px-5 rounded-lg bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white shadow-[0_0_12px_rgba(91,141,184,0.35)]"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
