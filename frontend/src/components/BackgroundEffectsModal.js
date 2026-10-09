import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Wand2, Check, X, Sliders } from "lucide-react";
import { BACKGROUND_EFFECTS_LIST, BackgroundEffect } from "@/components/BackgroundEffects";

export function BackgroundEffectsModal({
  open,
  onClose,
  settings,
  patch,
}) {
  if (!open) return null;

  const currentBg = settings?.bg_effect || "none";
  const bgConfig = settings?.bg_effect_config || { speed: 1, density: 1, opacity: 0.08 };

  const handleSelectBg = (bgId) => {
    patch("bg_effect", bgId);
  };

  const handleConfigChange = (k, v) => {
    const nextCfg = { ...(settings?.bg_effect_config || {}), [k]: v };
    patch("bg_effect_config", nextCfg);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[720px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[92dvh] bg-[#0c0e15] border border-[#2b384e] text-white p-0 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#090b10]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 flex items-center justify-center text-[#5B8DB8]">
              <Wand2 size={16} />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-white font-display">
                Background Ambient Effects
              </DialogTitle>
              <div className="text-[11px] text-[#E5E7EB]/50">
                Micro snow fall, rain streaks, fluid gradient waves, film grain, shimmer & VHS
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {/* Options Grid with Live Mini Canvas in every option */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {BACKGROUND_EFFECTS_LIST.map((eff) => {
              const isSelected = currentBg === eff.id;
              return (
                <button
                  key={eff.id}
                  type="button"
                  onClick={() => handleSelectBg(eff.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between group cursor-pointer h-36 ${
                    isSelected
                      ? "bg-[#5B8DB8]/20 border-[#5B8DB8] shadow-[0_0_15px_rgba(91,141,184,0.3)] ring-1 ring-[#5B8DB8]"
                      : "bg-[#080a10] border-white/10 hover:border-[#5B8DB8]/50 hover:bg-[#111624]"
                  }`}
                >
                  {/* Mini Preview Box */}
                  <div className="relative w-full h-18 rounded-lg bg-[#040508] border border-white/10 overflow-hidden shrink-0">
                    {eff.id !== "none" ? (
                      <BackgroundEffect effect={eff.id} config={bgConfig} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-white/40">
                        Solid Clean
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#5B8DB8] text-white flex items-center justify-center shadow-md z-10">
                        <Check size={10} />
                      </div>
                    )}
                  </div>

                  {/* Title & Info */}
                  <div className="mt-2">
                    <div className="text-xs font-bold text-white truncate">
                      {eff.name}
                    </div>
                    <div className="text-[10px] text-[#E5E7EB]/50 line-clamp-1 mt-0.5">
                      {eff.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Settings Box for Current Active Background Effect */}
          {currentBg !== "none" && (
            <div className="p-3.5 rounded-xl border border-white/10 bg-[#080a10] space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sliders size={13} className="text-[#5B8DB8]" />
                  <span>{BACKGROUND_EFFECTS_LIST.find((e) => e.id === currentBg)?.name} Settings</span>
                </span>
                <span className="text-[10px] font-mono text-[#5B8DB8]">Real-time adjustment</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(currentBg === "rain" || currentBg === "snow_fall" || currentBg === "shimmer" || currentBg === "gradient_wave") && (
                  <div>
                    <div className="flex justify-between text-xs text-[#E5E7EB]/70 mb-1">
                      <span>Speed / Flow Velocity</span>
                      <span className="font-mono text-[#5B8DB8] text-[11px]">{bgConfig.speed || 1}x</span>
                    </div>
                    <Slider
                      value={[bgConfig.speed || 1]}
                      min={0.4}
                      max={2.5}
                      step={0.1}
                      onValueChange={(v) => handleConfigChange("speed", v[0])}
                    />
                  </div>
                )}

                {(currentBg === "rain" || currentBg === "snow_fall") && (
                  <div>
                    <div className="flex justify-between text-xs text-[#E5E7EB]/70 mb-1">
                      <span>Particle Density</span>
                      <span className="font-mono text-[#5B8DB8] text-[11px]">{bgConfig.density || 1}x</span>
                    </div>
                    <Slider
                      value={[bgConfig.density || 1]}
                      min={0.4}
                      max={2.2}
                      step={0.1}
                      onValueChange={(v) => handleConfigChange("density", v[0])}
                    />
                  </div>
                )}

                {currentBg === "grain" && (
                  <div className="col-span-2">
                    <div className="flex justify-between text-xs text-[#E5E7EB]/70 mb-1">
                      <span>Film Grain Intensity</span>
                      <span className="font-mono text-[#5B8DB8] text-[11px]">
                        {Math.round((bgConfig.opacity || 0.08) * 100)}%
                      </span>
                    </div>
                    <Slider
                      value={[bgConfig.opacity || 0.08]}
                      min={0.03}
                      max={0.20}
                      step={0.01}
                      onValueChange={(v) => handleConfigChange("opacity", v[0])}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-[#090b10] flex items-center justify-between shrink-0">
          <div className="text-xs text-[#E5E7EB]/60">
            Active: <span className="font-semibold text-white">{currentBg}</span>
          </div>
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
