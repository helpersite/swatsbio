import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Check, X, Layers, Sliders } from "lucide-react";
import CustomColorPicker from "@/components/ColorPicker";

export const BANNER_EFFECTS_LIST = [
  { id: "none", name: "None", desc: "Default crisp static banner" },
  { id: "glow", name: "Neon Glow", desc: "Radiant glowing backlight around the banner border" },
  { id: "pulse", name: "Breathing Pulse", desc: "Smooth pulsing aura around the cover" },
  { id: "scan", name: "Scanner Beam", desc: "Continuous tactical radar line sweeping across" },
  { id: "shimmer", name: "Prism Shimmer", desc: "Diagonal metallic light sweep reflection" },
  { id: "dark_vignette", name: "Bottom Vignette", desc: "Dark gradient fade into the profile card" },
  { id: "holo_overlay", name: "Holo Sheen", desc: "Iridescent multi-color holographic glaze" },
];

export function BannerEffectsModal({
  open,
  onClose,
  settings,
  patch,
}) {
  if (!open) return null;

  const currentFx = settings?.banner_fx || "none";
  const fxColor = settings?.banner_fx_color || "#5B8DB8";
  const fxIntensity = settings?.banner_fx_intensity || 50;

  const handleSelect = (id) => {
    patch("banner_fx", id);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[560px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[92dvh] bg-[#0c0e15] border border-[#2b384e] text-white p-0 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#090b10]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 flex items-center justify-center text-[#5B8DB8]">
              <Layers size={16} />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-white font-display">
                Banner Effects Studio
              </DialogTitle>
              <div className="text-[11px] text-[#E5E7EB]/50">
                Choose header animations, glow borders, and shader sweeps
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
            {BANNER_EFFECTS_LIST.map((b) => {
              const isSelected = currentFx === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleSelect(b.id)}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between group cursor-pointer ${
                    isSelected
                      ? "bg-[#5B8DB8]/20 border-[#5B8DB8] shadow-[0_0_15px_rgba(91,141,184,0.3)] ring-1 ring-[#5B8DB8]"
                      : "bg-[#080a10] border-white/10 hover:border-[#5B8DB8]/50 hover:bg-[#111624]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{b.name}</span>
                    {isSelected && <Check size={13} className="text-[#5B8DB8]" />}
                  </div>
                  <div className="text-[10px] text-[#E5E7EB]/50">{b.desc}</div>
                </button>
              );
            })}
          </div>

          {currentFx !== "none" && (
            <div className="p-3.5 rounded-xl border border-white/10 bg-[#080a10] space-y-3">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sliders size={13} className="text-[#5B8DB8]" />
                <span>Effect Parameters</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-[#E5E7EB]/70">Glow Hue:</span>
                <div className="w-36">
                  <CustomColorPicker
                    value={fxColor}
                    onChange={(c) => patch("banner_fx_color", c)}
                    label="Color"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-[#E5E7EB]/70 mb-1">
                  <span>Intensity</span>
                  <span className="font-mono text-[#5B8DB8] text-[11px]">{fxIntensity}%</span>
                </div>
                <Slider
                  value={[fxIntensity]}
                  min={10}
                  max={100}
                  step={5}
                  onValueChange={(v) => patch("banner_fx_intensity", v[0])}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-[#090b10] flex items-center justify-between shrink-0">
          <div className="text-xs text-[#E5E7EB]/60">
            Selected: <span className="font-semibold text-white">{currentFx}</span>
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
