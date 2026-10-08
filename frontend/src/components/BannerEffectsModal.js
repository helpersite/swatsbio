import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Layers, Check, X, Sliders } from "lucide-react";
import CustomColorPicker from "@/components/ColorPicker";

export const BANNER_EFFECTS_LIST = [
  { id: "none", name: "Clean None", desc: "Original crisp high-resolution banner" },
  { id: "dark_vignette", name: "Bottom Vignette Fade", desc: "Dark seamless gradient fade into profile card" },
  { id: "fade_overlay", name: "Cinematic Dark Overlay", desc: "Smooth tinted overlay for higher text contrast" },
  { id: "gradient_mask", name: "Gradient Tint Mask", desc: "Stylized dual-tone color gradient blend" },
  { id: "glow", name: "Neon Border Glow", desc: "Radiant illuminated backlight around banner perimeter" },
  { id: "scan", name: "CRT Cyber Scanlines", desc: "Retro tactical scanning beam sweep" },
  { id: "shimmer", name: "Prism Light Shimmer", desc: "Diagonal metallic light sheen reflection" },
  { id: "dark_fog", name: "Atmospheric Dark Fog", desc: "Soft ambient floating smoke vignette" },
  { id: "noise_tint", name: "Film Noise Tint", desc: "Tactical gritty film grain overlay" },
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
  const fxIntensity = settings?.banner_fx_intensity !== undefined ? settings.banner_fx_intensity : 60;
  const bannerUrl = settings?.banner_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600";

  const handleSelect = (id) => {
    patch("banner_fx", id);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[680px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[92dvh] bg-[#0c0e15] border border-[#2b384e] text-white p-0 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
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
                Choose vignette fades, cyber scanlines, and ambient glow overlays
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {BANNER_EFFECTS_LIST.map((b) => {
              const isSelected = currentFx === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleSelect(b.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between group cursor-pointer h-32 ${
                    isSelected
                      ? "bg-[#5B8DB8]/20 border-[#5B8DB8] shadow-[0_0_15px_rgba(91,141,184,0.3)] ring-1 ring-[#5B8DB8]"
                      : "bg-[#080a10] border-white/10 hover:border-[#5B8DB8]/50 hover:bg-[#111624]"
                  }`}
                >
                  {/* Mini Preview Box */}
                  <div className="relative w-full h-14 rounded-lg bg-[#040508] border border-white/10 overflow-hidden shrink-0">
                    <img
                      src={bannerUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover opacity-70"
                    />
                    {/* Simulated Effect Overlay */}
                    {b.id === "dark_vignette" && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    )}
                    {b.id === "fade_overlay" && (
                      <div className="absolute inset-0 bg-black/60" />
                    )}
                    {b.id === "gradient_mask" && (
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#5B8DB8]/40 via-purple-600/30 to-transparent mix-blend-overlay" />
                    )}
                    {b.id === "glow" && (
                      <div className="absolute inset-0 border-2 border-[#5B8DB8] shadow-[inset_0_0_10px_#5B8DB8]" />
                    )}
                    {b.id === "scan" && (
                      <div
                        className="absolute inset-0"
                        style={{
                          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px)",
                        }}
                      />
                    )}
                    {b.id === "shimmer" && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-pulse" />
                    )}
                    {b.id === "dark_fog" && (
                      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/90 filter blur-[1px]" />
                    )}
                    {b.id === "noise_tint" && (
                      <div
                        className="absolute inset-0 opacity-40 mix-blend-overlay"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                        }}
                      />
                    )}

                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#5B8DB8] text-white flex items-center justify-center shadow-md z-10">
                        <Check size={10} />
                      </div>
                    )}
                  </div>

                  <div className="mt-1.5">
                    <div className="text-xs font-bold text-white truncate">{b.name}</div>
                    <div className="text-[10px] text-[#E5E7EB]/50 line-clamp-1">{b.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {currentFx !== "none" && (
            <div className="p-3.5 rounded-xl border border-white/10 bg-[#080a10] space-y-3">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sliders size={13} className="text-[#5B8DB8]" />
                <span>Effect Configuration</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-[#E5E7EB]/70">
                    <span>Intensity / Opacity</span>
                    <span className="font-mono text-white">{fxIntensity}%</span>
                  </div>
                  <Slider
                    value={[fxIntensity]}
                    min={10}
                    max={100}
                    step={1}
                    onValueChange={([v]) => patch("banner_fx_intensity", v)}
                    className="cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-[#E5E7EB]/70">Accent Glow / Tint:</span>
                  <div className="w-36">
                    <CustomColorPicker
                      value={fxColor}
                      onChange={(c) => patch("banner_fx_color", c)}
                      label="Color"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-white/10 flex justify-end bg-[#090b10]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
