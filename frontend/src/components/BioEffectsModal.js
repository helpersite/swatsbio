import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, X, FileText, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { USERNAME_EFFECTS_LIST, renderBioText } from "@/lib/textEffects";
import CustomColorPicker from "@/components/ColorPicker";

export function BioEffectsModal({
  open,
  onClose,
  description,
  setDescription,
  settings,
  patch,
}) {
  const [selectedEffectColor, setSelectedEffectColor] = useState(settings?.bio_effect_color || settings?.accent_color || "#5B8DB8");
  const [sparkleColor, setSparkleColor] = useState(settings?.sparkle_color || "#F5C542");

  if (!open) return null;

  const rawBio = (description || "Developer & Digital Creator / Building the future").replace(/^:[a-zA-Z0-9_#-]+:(.*?)(?::[a-zA-Z0-9_#-]+)?:$/g, "$1").trim();

  const applyEffect = (effect) => {
    let customColor = selectedEffectColor;
    if (effect.id === "sparkle") customColor = sparkleColor;
    const formatted = effect.wrap(rawBio, customColor);
    setDescription(formatted);
    patch("bio_effect", effect.id);
  };

  const removeEffect = () => {
    setDescription(rawBio);
    patch("bio_effect", "none");
  };

  const handleEffectColor = (c) => {
    setSelectedEffectColor(c);
    patch("bio_effect_color", c);
  };

  const handleSparkleColor = (c) => {
    setSparkleColor(c);
    patch("sparkle_color", c);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[640px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[92dvh] bg-[#090b10] border border-white/10 text-white p-0 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#0c0e15]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 flex items-center justify-center text-[#5B8DB8]">
              <FileText size={16} />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-white font-display">
                Bio Effects Studio
              </DialogTitle>
              <div className="text-[11px] text-[#E5E7EB]/50">
                Animated typography, glowing gradients, typewriter flow, and custom bio styling
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
          <div className="text-[10px] uppercase font-bold tracking-widest text-[#5B8DB8] mb-1">
            Live Bio Preview
          </div>
          <div className="text-sm leading-relaxed text-white/90 min-h-[44px] max-w-md mx-auto flex items-center justify-center font-normal">
            {renderBioText(description || rawBio)}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {/* Controls row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0c0e15] p-3 rounded-xl border border-white/5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[#E5E7EB]/70 font-medium">Bio Glow Color:</span>
              <div className="w-32">
                <CustomColorPicker
                  value={selectedEffectColor}
                  onChange={handleEffectColor}
                  label="Bio Glow"
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[#E5E7EB]/70 font-medium">Sparkle Star Color:</span>
              <div className="w-32">
                <CustomColorPicker
                  value={sparkleColor}
                  onChange={handleSparkleColor}
                  label="Sparkle"
                />
              </div>
            </div>
          </div>

          {/* Quick Clear Button */}
          <div className="flex items-center justify-between pb-1 border-b border-white/5">
            <span className="text-xs font-semibold text-white/70">Select Bio Typography Effect</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={removeEffect}
              className="text-[11px] h-7 px-2.5 border-white/10 hover:bg-white/5 text-white/60 hover:text-white"
            >
              Reset to Plain Text
            </Button>
          </div>

          {/* Effects Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {USERNAME_EFFECTS_LIST.map((ue) => (
              <div
                key={ue.id}
                className="p-3 rounded-xl border border-white/10 bg-[#0c0e15] hover:border-[#5B8DB8]/50 hover:bg-[#111624] flex flex-col justify-between gap-2 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-white">{ue.name}</span>
                  </div>
                  <div className="text-[10px] text-[#E5E7EB]/50 mb-2">
                    {ue.desc}
                  </div>

                  <div className="p-2 rounded-lg bg-black/60 border border-white/5 text-center text-xs min-h-[36px] flex items-center justify-center font-normal">
                    {renderBioText(ue.wrap(rawBio, ue.id === "sparkle" ? sparkleColor : selectedEffectColor))}
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => applyEffect(ue)}
                  className="w-full bg-[#5B8DB8]/20 hover:bg-[#5B8DB8] text-[#5B8DB8] hover:text-white border border-[#5B8DB8]/40 text-xs font-semibold h-7 rounded-lg transition-all gap-1 cursor-pointer"
                >
                  <Check size={12} /> Apply to Bio
                </Button>
              </div>
            ))}
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
