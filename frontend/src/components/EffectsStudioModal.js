import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Sparkles, Wand2, Palette, Flame, ShieldAlert, Disc, Eye, Check, X, Sliders, Radio, Music2 } from "lucide-react";
import { BackgroundEffect, BACKGROUND_EFFECTS_LIST } from "@/components/BackgroundEffects";
import { AvatarDecoration, AVATAR_FRAME_CATALOG, PROFILE_AVATAR_EFFECTS } from "@/components/AvatarDecorations";
import { USERNAME_EFFECTS_LIST, renderBioText } from "@/lib/textEffects";
import CustomColorPicker from "@/components/ColorPicker";
import { MediaDisplay } from "@/components/MediaDisplay";

export function EffectsStudioModal({
  open,
  settings,
  patch,
  displayName,
  setDisplayName,
  username,
  pfpUrl,
  discordAccount,
  onClose,
}) {
  const [tab, setTab] = useState("bg");
  const [reactiveSensitivity, setReactiveSensitivity] = useState(settings?.bg_effect_config?.sensitivity || 50);
  const [reactiveColor, setReactiveColor] = useState(settings?.bg_effect_config?.color || "#5B8DB8");
  const [hoveredBackground, setHoveredBackground] = useState(null);
  const [frameSearch, setFrameSearch] = useState("");
  const [visibleFrameCount, setVisibleFrameCount] = useState(60);

  const currentBg = settings?.bg_effect || "none";
  const currentAvatarDeco = discordAccount?.avatar_decoration;
  const profileEffect = settings?.profile_effect || "none";
  const profileEffectColor = settings?.profile_effect_color || "#7db5e3";
  const selectedFrame = settings?.profile_frame || null;
  const matchingFrames = AVATAR_FRAME_CATALOG.filter((frame) => frame.id.includes(frameSearch.trim()));
  const visibleFrames = matchingFrames.slice(0, visibleFrameCount);
  const hasDiscordAssetMetadata = Number.isFinite(Number(discordAccount?.public_flags));
  const selectedBackground = BACKGROUND_EFFECTS_LIST.find((effect) => effect.id === currentBg) || BACKGROUND_EFFECTS_LIST[0];
  const previewBackground = BACKGROUND_EFFECTS_LIST.find((effect) => effect.id === (hoveredBackground || currentBg)) || selectedBackground;
  const sparkleColor = settings?.sparkle_color || "#F5C542";
  const previewName = displayName ? displayName.replace(/^:[a-zA-Z0-9#_]+:(.*?)(?::[a-zA-Z0-9#_]+)?:$/g, "$1") : (username || "swats");

  const applyUsernameEffect = (effect) => {
    const rawName = (displayName || username || "swats").replace(/^:[a-zA-Z0-9#_]+:(.*?)(?::[a-zA-Z0-9#_]+)?:$/g, "$1").trim();
    const formatted = effect.wrap(rawName, effect.id === "sparkle" ? sparkleColor : undefined);
    setDisplayName(formatted);
  };

  const handleReactiveConfigChange = (k, v) => {
    const nextCfg = { ...(settings?.bg_effect_config || {}), [k]: v };
    if (k === "sensitivity") setReactiveSensitivity(v);
    if (k === "color") setReactiveColor(v);
    patch("bg_effect_config", nextCfg);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#0b0d12]/98 backdrop-blur-3xl border-[#4A6B8A]/35 text-[#E5E7EB] w-[calc(100vw-1rem)] max-w-2xl max-h-[90dvh] min-h-0 overflow-hidden flex flex-col p-0 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.9)]">
        {/* Header */}
        <div className="shrink-0 p-4 sm:p-5 pb-3 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5B8DB8]/30 to-purple-500/30 border border-[#5B8DB8]/50 flex items-center justify-center text-[#5B8DB8] shadow-[0_0_15px_rgba(91,141,184,0.3)]">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <DialogTitle className="font-display text-xl font-black tracking-tight text-white flex items-center gap-2">
                FX Studio & Visual Effects
              </DialogTitle>
              <div className="text-xs text-[#E5E7EB]/50">
                Background motion, username styling, and your linked Discord decoration
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="shrink-0 px-4 sm:px-5 pt-3">
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid grid-cols-3 bg-[#07080b] p-1 rounded-2xl border border-[#4A6B8A]/25">
              <TabsTrigger
                value="bg"
                className="rounded-xl text-xs font-semibold py-2 data-[state=active]:bg-[#5B8DB8] data-[state=active]:text-white transition-all flex items-center justify-center gap-1.5"
              >
                <Wand2 size={13} />
                <span>Background FX</span>
              </TabsTrigger>
              <TabsTrigger
                value="username"
                className="rounded-xl text-xs font-semibold py-2 data-[state=active]:bg-[#5B8DB8] data-[state=active]:text-white transition-all flex items-center justify-center gap-1.5"
              >
                <Flame size={13} />
                <span>Username FX</span>
              </TabsTrigger>
              <TabsTrigger
                value="avatar"
                className="rounded-xl text-xs font-semibold py-2 data-[state=active]:bg-[#5B8DB8] data-[state=active]:text-white transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles size={13} />
                <span>Profile FX</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content Area */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 space-y-4">
          {/* TAB 1: BACKGROUND EFFECTS */}
          {tab === "bg" && (
            <div className="space-y-4">
              <div className="relative h-20 overflow-hidden rounded-lg border border-white/10 bg-[#090b0f]">
                <BackgroundEffect effect={previewBackground.id} config={{ sensitivity: reactiveSensitivity, color: reactiveColor }} />
                <div className="absolute inset-0 bg-black/35" />
                <div className="absolute inset-0 flex items-center justify-between px-4">
                  <div>
                    <div className="text-xs font-semibold text-white">{previewBackground.name}</div>
                    <div className="text-[10px] text-white/65">{previewBackground.description}</div>
                  </div>
                  <span className="text-[10px] uppercase tracking-wide text-white/50">Preview</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BACKGROUND_EFFECTS_LIST.map((eff) => {
                  const isSelected = currentBg === eff.id;
                  return (
                    <button
                      key={eff.id}
                      type="button"
                      onClick={() => patch("bg_effect", eff.id)}
                      onMouseEnter={() => setHoveredBackground(eff.id)}
                      onMouseLeave={() => setHoveredBackground(null)}
                      onFocus={() => setHoveredBackground(eff.id)}
                      onBlur={() => setHoveredBackground(null)}
                      className={`min-h-[68px] text-left p-2.5 rounded-lg border transition-colors flex flex-col justify-center gap-1 ${
                        isSelected
                          ? "border-[#5B8DB8] bg-[#5B8DB8]/15"
                          : "border-white/10 bg-[#07090d]/80 hover:border-[#5B8DB8]/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-white truncate">
                          {eff.name}
                        </span>
                        {isSelected && <Check size={13} className="shrink-0 text-[#7db5e3]" />}
                      </div>
                      <div className="text-[10px] text-[#E5E7EB]/55 line-clamp-1">
                        {eff.description}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Reactive Effect Customizer Box */}
              {currentBg === "reactive" && (
                <div className="p-4 rounded-2xl border border-[#5B8DB8]/40 bg-[#5B8DB8]/10 space-y-3">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sliders size={14} className="text-[#5B8DB8]" />
                    <span>Reactive Particles Settings</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-[#E5E7EB]/70 mb-1.5">
                      <span>Particle Sensitivity & Velocity</span>
                      <span className="font-mono text-[#5B8DB8]">{reactiveSensitivity}%</span>
                    </div>
                    <Slider
                      value={[reactiveSensitivity]}
                      max={100}
                      step={1}
                      onValueChange={(v) => handleReactiveConfigChange("sensitivity", v[0])}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
                    <span className="text-xs text-[#E5E7EB]/80">Neon Particle Hue</span>
                    <div className="w-40">
                      <CustomColorPicker
                        label="Color"
                        value={reactiveColor}
                        onChange={(v) => handleReactiveConfigChange("color", v)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: USERNAME TEXT EFFECTS */}
          {tab === "username" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/25 px-3 py-2">
                <Label className="text-xs text-[#E5E7EB]/75">Sparkle color</Label>
                <div className="w-36">
                  <CustomColorPicker label="Sparkle" value={sparkleColor} onChange={(value) => patch("sparkle_color", value)} />
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-center">
                <div className="text-[11px] text-[#E5E7EB]/50 mb-1">Live Display Name Preview:</div>
                <div className="font-display text-2xl font-extrabold text-white">
                  {renderBioText(displayName || username || "MyProfile")}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {USERNAME_EFFECTS_LIST.map((ue) => (
                  <div
                    key={ue.id}
                    className="p-3.5 rounded-2xl border border-white/10 bg-[#07090d]/80 hover:border-[#5B8DB8]/50 flex flex-col justify-between gap-2.5 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">{ue.name}</span>
                      </div>
                      <div className="text-[11px] text-[#E5E7EB]/50 leading-tight mb-2">
                        {ue.desc}
                      </div>
                      {/* Effect Preview rendering */}
                      <div className="p-2 rounded-xl bg-black/50 border border-white/5 text-center font-display text-sm font-bold min-h-[36px] flex items-center justify-center">
                        {renderBioText(ue.wrap(previewName, ue.id === "sparkle" ? sparkleColor : undefined))}
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => applyUsernameEffect(ue)}
                      className="w-full bg-[#5B8DB8]/20 hover:bg-[#5B8DB8] text-[#5B8DB8] hover:text-white border border-[#5B8DB8]/40 text-xs font-semibold h-7.5 rounded-xl transition-all gap-1"
                    >
                      <Check size={12} /> Apply this Effect
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LINKED DISCORD AVATAR */}
          {tab === "avatar" && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-black/25 border border-white/10 flex items-center gap-5">
                <div className="relative w-20 h-20 rounded-full border-2 border-[#5B8DB8] overflow-visible">
                  <MediaDisplay
                    src={pfpUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`}
                    alt="Profile preview"
                    className="w-full h-full rounded-full object-cover"
                  />
                  <AvatarDecoration decoration={selectedFrame || currentAvatarDeco} profileEffect={profileEffect} color={profileEffectColor} />
                </div>
                <div className="min-w-0 text-left">
                  <div className="text-xs text-[#E5E7EB]/50">Avatar frame</div>
                  <div className="text-sm font-semibold text-white">
                    {selectedFrame ? selectedFrame.name : currentAvatarDeco ? "Equipped Discord decoration" : hasDiscordAssetMetadata ? "No frame selected" : "Reconnect Discord to sync"}
                  </div>
                  <div className="text-[11px] text-[#E5E7EB]/45 mt-1">
                    {selectedFrame ? "Library frames work independently of Discord." : hasDiscordAssetMetadata ? "Showing the decoration reported by Discord." : "Connect or reconnect Discord to sync its equipped frame."}
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-white">Profile effect</div>
                    <div className="text-[10px] text-white/45">Available to every profile; independent of Discord Nitro.</div>
                  </div>
                  <div className="w-36">
                    <CustomColorPicker label="Effect color" value={profileEffectColor} onChange={(value) => patch("profile_effect_color", value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {PROFILE_AVATAR_EFFECTS.map((effect) => (
                    <button
                      key={effect.id}
                      type="button"
                      onClick={() => patch("profile_effect", effect.id)}
                      className={`min-h-16 rounded-md border px-2 py-2 text-left transition-colors ${profileEffect === effect.id ? "border-[#7db5e3] bg-[#7db5e3]/10" : "border-white/10 bg-white/[0.02] hover:border-white/25"}`}
                    >
                      <span className="block text-[11px] font-semibold text-white">{effect.name}</span>
                      <span className="mt-1 block text-[9px] leading-tight text-white/45">{effect.description}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-white">Avatar frame library</div>
                    <div className="text-[10px] text-white/45">{AVATAR_FRAME_CATALOG.length} frames · search by number</div>
                  </div>
                  {selectedFrame && <Button type="button" variant="outline" size="sm" onClick={() => patch("profile_frame", null)} className="h-8 border-white/15 text-xs text-white/70">Use Discord frame</Button>}
                </div>
                <Input value={frameSearch} onChange={(event) => { setFrameSearch(event.target.value.replace(/\D/g, "")); setVisibleFrameCount(60); }} placeholder="Search frame number" aria-label="Search avatar frames" className="h-9 bg-black/30 border-white/10 text-xs" />
                {matchingFrames.length === 0 ? (
                  <div className="py-6 text-center text-xs text-white/45">No frame matches that number.</div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                    {visibleFrames.map((frame) => {
                      const active = selectedFrame?.id === frame.id;
                      return (
                        <button key={frame.id} type="button" onClick={() => patch("profile_frame", active ? null : frame)} aria-label={`Select ${frame.name}`} title={frame.name} className={`aspect-square overflow-hidden rounded-md border bg-[#08090B] p-1 transition-colors ${active ? "border-[#7db5e3] bg-[#7db5e3]/10" : "border-white/10 hover:border-white/30"}`}>
                          <img src={frame.url} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain" />
                          <span className="sr-only">{frame.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {visibleFrameCount < matchingFrames.length && (
                  <Button type="button" variant="outline" onClick={() => setVisibleFrameCount((count) => count + 60)} className="h-9 w-full border-white/15 text-xs text-white/70">
                    Show {Math.min(60, matchingFrames.length - visibleFrameCount)} more
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-3 sm:px-5 border-t border-white/10 flex items-center justify-between gap-3 bg-[#07080b]">
          <div className="text-xs text-[#E5E7EB]/50">
            Save your profile to keep these changes.
          </div>
          <Button
            type="button"
            onClick={onClose}
            className="bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white text-xs font-semibold px-5 rounded-xl shadow-[0_0_12px_rgba(91,141,184,0.3)]"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
