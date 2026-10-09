import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flame, Check, X, Sliders, Sparkles } from "lucide-react";
import { USERNAME_EFFECTS_LIST, renderBioText } from "@/lib/textEffects";
import CustomColorPicker from "@/components/ColorPicker";

export function NameEffectsModal({
  open,
  onClose,
  displayName,
  setDisplayName,
  username,
  settings,
  patch,
}) {
  const [selectedEffectColor, setSelectedEffectColor] = useState(settings?.name_effect_color || "#5B8DB8");
  const [sparkleColor, setSparkleColor] = useState(settings?.sparkle_color || "#F5C542");

  if (!open) return null;

  const rawName = (displayName || username || "swats").replace(/^:[a-zA-Z0-9_#-]+:(.*?)(?::[a-zA-Z0-9_#-]+)?:$/g, "$1").trim();

  const applyEffect = (effect) => {
    let customColor = selectedEffectColor;
    if (effect.id === "sparkle") customColor = sparkleColor;
    const formatted = effect.wrap(rawName, customColor);
    setDisplayName(formatted);
  };

  const handleSparkleColor = (c) => {
    setSparkleColor(c);
    patch("sparkle_color", c);
  };

  const handleEffectColor = (c) => {
    setSelectedEffectColor(c);
    patch("name_effect_color", c);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[620px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[92dvh] bg-[#0c0e15] border border-[#2b384e] text-white p-0 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#090b10]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 flex items-center justify-center text-[#5B8DB8]">
              <Flame size={16} />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-white font-display">
                Display Name Effects Studio
              </DialogTitle>
              <div className="text-[11px] text-[#E5E7EB]/50">
                Luminous flows, RGB glows, star sparkles, and cyber pulse animations
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

        {/* Live Name Preview Bar */}
        <div className="p-4 bg-[#07090e] border-b border-white/10 text-center shrink-0">
          <div className="text-[10px] uppercase font-bold tracking-widest text-[#5B8DB8] mb-1">
            Live Preview
          </div>
          <div className="font-display text-2xl font-black text-white min-h-[36px] flex items-center justify-center">
            {renderBioText(displayName || username || "swats")}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {/* Color Settings Bar */}
          <div className="grid grid-cols-2 gap-3 bg-[#080a10] p-3 rounded-xl border border-white/5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[#E5E7EB]/70">Glow Color:</span>
              <div className="w-32">
                <CustomColorPicker
                  value={selectedEffectColor}
                  onChange={handleEffectColor}
                  label="Glow"
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[#E5E7EB]/70">Sparkle Star Color:</span>
              <div className="w-32">
                <CustomColorPicker
                  value={sparkleColor}
                  onChange={handleSparkleColor}
                  label="Sparkle"
                />
              </div>
            </div>
          </div>

          {/* Effects Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {USERNAME_EFFECTS_LIST.map((ue) => (
              <div
                key={ue.id}
                className="p-3 rounded-xl border border-white/10 bg-[#080a10] hover:border-[#5B8DB8]/50 hover:bg-[#111624] flex flex-col justify-between gap-2 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-white">{ue.name}</span>
                  </div>
                  <div className="text-[10px] text-[#E5E7EB]/50 mb-2">
                    {ue.desc}
                  </div>

                  {/* Individual Live Rendering Inside Each Option Card! */}
                  <div className="p-2 rounded-lg bg-black/60 border border-white/5 text-center font-display text-sm font-bold min-h-[32px] flex items-center justify-center">
                    {renderBioText(ue.wrap(rawName, ue.id === "sparkle" ? sparkleColor : selectedEffectColor))}
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => applyEffect(ue)}
                  className="w-full bg-[#5B8DB8]/20 hover:bg-[#5B8DB8] text-[#5B8DB8] hover:text-white border border-[#5B8DB8]/40 text-xs font-semibold h-7 rounded-lg transition-all gap-1"
                >
                  <Check size={12} /> Apply Effect
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-[#090b10] flex items-center justify-end shrink-0">
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
