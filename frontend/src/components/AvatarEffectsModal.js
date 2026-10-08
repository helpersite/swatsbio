import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Check, X, Search, Palette } from "lucide-react";
import { AVATAR_FRAME_CATALOG, PROFILE_AVATAR_EFFECTS, AvatarDecoration } from "@/components/AvatarDecorations";
import CustomColorPicker from "@/components/ColorPicker";

export function AvatarEffectsModal({
  open,
  onClose,
  settings,
  patch,
  pfpUrl,
}) {
  const [activeTab, setActiveTab] = useState("effects"); // "effects" | "frames"
  const [searchFrame, setSearchFrame] = useState("");
  const [selectedEffectColor, setSelectedEffectColor] = useState(settings?.profile_effect_color || "#5B8DB8");
  const [visibleFrameCount, setVisibleFrameCount] = useState(48);

  if (!open) return null;

  const currentEffect = settings?.profile_effect || "none";
  const currentFrame = settings?.profile_frame || null;
  const sampleAvatar = pfpUrl || "https://api.dicebear.com/7.x/bottts/svg?seed=preview";

  const handleSelectEffect = (effectId) => {
    patch("profile_effect", effectId);
  };

  const handleSelectFrame = (frameId) => {
    patch("profile_frame", frameId);
  };

  const handleEffectColorChange = (color) => {
    setSelectedEffectColor(color);
    patch("profile_effect_color", color);
  };

  const filteredFrames = AVATAR_FRAME_CATALOG.filter((f) =>
    f.id.toLowerCase().includes(searchFrame.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[680px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[92dvh] bg-[#0c0e15] border border-[#2b384e] text-white p-0 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#090b10]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 flex items-center justify-center text-[#5B8DB8]">
              <Sparkles size={16} />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-white font-display">
                Avatar Effects Studio
              </DialogTitle>
              <div className="text-[11px] text-[#E5E7EB]/50">
                Choose animated perimeter effects & Discord nitro frame decorations
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

        {/* Sub-nav & Color Picker */}
        <div className="px-4 py-2.5 border-b border-white/10 bg-[#08090d] flex items-center justify-between gap-3 shrink-0">
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveTab("effects")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "effects"
                  ? "bg-[#5B8DB8] text-white shadow-sm"
                  : "bg-white/5 text-[#E5E7EB]/70 hover:text-white"
              }`}
            >
              Perimeter FX ({PROFILE_AVATAR_EFFECTS.length})
            </button>
            <button
              onClick={() => setActiveTab("frames")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "frames"
                  ? "bg-[#5B8DB8] text-white shadow-sm"
                  : "bg-white/5 text-[#E5E7EB]/70 hover:text-white"
              }`}
            >
              Discord Frames ({AVATAR_FRAME_CATALOG.length})
            </button>
          </div>

          {activeTab === "effects" && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#E5E7EB]/60">Glow Hue:</span>
              <div className="w-28">
                <CustomColorPicker
                  value={selectedEffectColor}
                  onChange={handleEffectColorChange}
                  label="Color"
                />
              </div>
            </div>
          )}

          {activeTab === "frames" && (
            <div className="relative w-44">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
              <Input
                value={searchFrame}
                onChange={(e) => setSearchFrame(e.target.value)}
                placeholder="Search frame..."
                className="h-7 text-xs pl-8 bg-black/40 border-white/10 text-white rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Modal Body: Option grid with individual live previews inside each card! */}
        <div className="p-4 flex-1 overflow-y-auto min-h-0 space-y-3">
          {activeTab === "effects" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PROFILE_AVATAR_EFFECTS.map((eff) => {
                const isSelected = currentEffect === eff.id;
                return (
                  <button
                    key={eff.id}
                    type="button"
                    onClick={() => handleSelectEffect(eff.id)}
                    className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col items-center group cursor-pointer ${
                      isSelected
                        ? "bg-[#5B8DB8]/20 border-[#5B8DB8] shadow-[0_0_15px_rgba(91,141,184,0.3)] ring-1 ring-[#5B8DB8]"
                        : "bg-[#080a10] border-white/10 hover:border-[#5B8DB8]/50 hover:bg-[#111624]"
                    }`}
                  >
                    {/* Live Preview Container for THIS effect */}
                    <div className="relative w-14 h-14 rounded-full my-1.5 flex items-center justify-center shrink-0">
                      <img
                        src={sampleAvatar}
                        alt="Avatar"
                        className="w-12 h-12 rounded-full object-cover border border-white/20"
                      />
                      {eff.id !== "none" && (
                        <AvatarDecoration
                          profileEffect={eff.id}
                          color={selectedEffectColor}
                        />
                      )}
                    </div>

                    <div className="text-center w-full mt-1">
                      <div className="text-xs font-bold text-white flex items-center justify-center gap-1">
                        <span>{eff.name}</span>
                        {isSelected && <Check size={13} className="text-[#5B8DB8]" />}
                      </div>
                      <div className="text-[10px] text-[#E5E7EB]/50 line-clamp-1 mt-0.5">
                        {eff.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === "frames" && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {/* None option */}
                <button
                  type="button"
                  onClick={() => handleSelectFrame(null)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    !currentFrame
                      ? "bg-[#5B8DB8]/20 border-[#5B8DB8]"
                      : "bg-[#080a10] border-white/10 hover:border-white/30"
                  }`}
                >
                  <div className="w-12 h-12 rounded-full border border-dashed border-white/30 mx-auto flex items-center justify-center text-[10px] text-white/50 mb-1">
                    None
                  </div>
                  <span className="text-[11px] font-semibold text-white">No Frame</span>
                </button>

                {filteredFrames.slice(0, visibleFrameCount).map((frame) => {
                  const isSelected = currentFrame === frame.url || currentFrame === frame.id;
                  return (
                    <button
                      key={frame.id}
                      type="button"
                      onClick={() => handleSelectFrame(frame.url)}
                      className={`p-2 rounded-xl border text-center transition-all relative group ${
                        isSelected
                          ? "bg-[#5B8DB8]/20 border-[#5B8DB8] shadow-md ring-1 ring-[#5B8DB8]"
                          : "bg-[#080a10] border-white/10 hover:border-[#5B8DB8]/50 hover:bg-[#111624]"
                      }`}
                    >
                      <div className="relative w-12 h-12 mx-auto my-1 flex items-center justify-center">
                        <img
                          src={sampleAvatar}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover border border-white/20"
                        />
                        <img
                          src={frame.url}
                          alt={frame.name}
                          className="pointer-events-none absolute inset-0 w-full h-full object-contain -translate-y-0.5 scale-110"
                        />
                      </div>
                      <span className="text-[10px] font-mono text-white/70 truncate block">
                        #{frame.id}
                      </span>
                    </button>
                  );
                })}
              </div>

              {filteredFrames.length > visibleFrameCount && (
                <div className="text-center pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setVisibleFrameCount((c) => c + 48)}
                    className="text-xs border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                  >
                    Load More Frames ({filteredFrames.length - visibleFrameCount} remaining)
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-[#090b10] flex items-center justify-between shrink-0">
          <div className="text-xs text-[#E5E7EB]/60">
            Selected: <span className="font-semibold text-white">{currentEffect !== "none" ? currentEffect : "Default Avatar"}</span>
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
