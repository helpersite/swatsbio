import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Check, X, Sparkles, RotateCcw } from "lucide-react";
import CustomColorPicker from "@/components/ColorPicker";
import { TextEffect } from "@/components/effects/TextEffects";
import { CursorEffectsLayer } from "@/components/effects/CursorEffects";
import { BackgroundEffectsLayer } from "@/components/effects/BackgroundEffects";
import {
  useCardTilt, profilePanelClassName, profilePanelStyle, ProfilePanelOverlays,
  AvatarGlow, hoverAttrs, TiltGlare,
} from "@/components/effects/ProfileEffects";
import {
  EFFECT_GROUPS, EFFECT_GROUP_META, CARD_TILT_SCHEMA, HOVER_SCHEMA,
  buildDefaultConfig, readEffectState,
} from "@/lib/effectsRegistry";

// ── Schema-driven control ────────────────────────────────────────────────────
function Field({ setting, value, onChange }) {
  const { type, label } = setting;
  const unit = setting.unit || "";

  if (type === "toggle") {
    return (
      <div className="flex items-center justify-between gap-3 py-1.5">
        <span className="text-xs text-[#E5E7EB]/80">{label}</span>
        <Switch checked={Boolean(value)} onCheckedChange={onChange} />
      </div>
    );
  }

  if (type === "color") {
    return (
      <div className="flex items-center justify-between gap-3 py-1.5">
        <span className="text-xs text-[#E5E7EB]/80">{label}</span>
        <div className="w-32">
          <CustomColorPicker value={value || "#5B8DB8"} onChange={onChange} label={label} />
        </div>
      </div>
    );
  }

  if (type === "select") {
    return (
      <div className="flex items-center justify-between gap-3 py-1.5">
        <span className="text-xs text-[#E5E7EB]/80">{label}</span>
        <Select value={String(value)} onValueChange={onChange}>
          <SelectTrigger className="w-40 bg-black/40 border-white/10 text-white text-xs h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0c0e15] border-white/10 text-white text-xs">
            {setting.options.map((o) => (
              <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (type === "text") {
    return (
      <div className="space-y-1.5 py-1.5">
        <span className="text-xs text-[#E5E7EB]/80">{label}</span>
        <Input
          value={value ?? ""}
          placeholder={setting.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 bg-black/40 border-white/10 text-xs text-white"
        />
      </div>
    );
  }

  // range (default)
  return (
    <div className="space-y-1.5 py-1.5">
      <div className="flex justify-between text-xs text-[#E5E7EB]/70">
        <span>{label}</span>
        <span className="font-mono text-white text-[11px]">
          {setting.zeroLabel && Number(value) === 0 ? setting.zeroLabel : `${value}${unit}`}
        </span>
      </div>
      <Slider
        value={[Number(value)]}
        min={setting.min}
        max={setting.max}
        step={setting.step}
        onValueChange={([v]) => onChange(v)}
        className="cursor-pointer"
      />
    </div>
  );
}

// ── Studio ───────────────────────────────────────────────────────────────────
export function EffectsStudioV2({
  open,
  onClose,
  settings = {},
  patch,
  username = "profile",
  displayName = "",
  accent = "#5B8DB8",
}) {
  const [group, setGroup] = useState("background");
  const [query, setQuery] = useState("");
  const [previewName] = useState(() => displayName || username || "swats");

  const state = useMemo(() => readEffectState(settings), [settings]);
  const current = state[group] || { effect: "none", config: {} };
  const def = EFFECT_GROUPS[group].find((e) => e.id === current.effect);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = EFFECT_GROUPS[group];
    if (!q) return list;
    return list.filter((e) => e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
  }, [group, query]);

  // Tilt demo for the profile preview
  const tilt = useCardTilt({ ...state.cardTilt });
  const hover = hoverAttrs(state.hover);

  const writeGroup = (next) => {
    patch("effects", { ...(settings.effects || {}), [group]: next });
  };
  const selectEffect = (id) => {
    writeGroup({ effect: id, config: { ...buildDefaultConfig(group, id), ...(settings.effects?.[group]?.config || {}) } });
  };
  const setConfigValue = (key, value) => {
    writeGroup({ effect: current.effect, config: { ...current.config, [key]: value } });
  };
  const resetConfig = () => {
    writeGroup({ effect: current.effect, config: buildDefaultConfig(group, current.effect) });
  };
  const patchTilt = (key, value) => patch("card_tilt", { ...state.cardTilt, [key]: value });
  const patchHover = (key, value) => patch("hover_effects", { ...state.hover, [key]: value });

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#0b0d12]/98 border-[#4A6B8A]/35 text-[#E5E7EB] w-[calc(100vw-1rem)] max-w-5xl h-[88dvh] p-0 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 p-4 border-b border-white/10 flex items-center justify-between gap-3 bg-[#090b10]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 flex items-center justify-center text-[#5B8DB8]">
              <Sparkles size={18} />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-white font-display">Effects Studio</DialogTitle>
              <div className="text-[11px] text-[#E5E7EB]/50">Text, cursor, background and profile effects — all live-previewed</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className="shrink-0 px-4 pt-3 flex gap-1.5 flex-wrap">
          {Object.values(EFFECT_GROUP_META).map((meta) => (
            <button
              key={meta.id}
              type="button"
              onClick={() => { setGroup(meta.id); setQuery(""); }}
              className={`px-3 h-8 rounded-lg text-xs font-semibold transition-colors ${
                group === meta.id ? "bg-[#5B8DB8] text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {meta.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-0 overflow-hidden">
          {/* Left: effect picker */}
          <div className="min-h-0 flex flex-col border-r border-white/5">
            <div className="p-3 pb-2 shrink-0">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ${EFFECT_GROUP_META[group].label.toLowerCase()} effects`}
                  className="h-8 pl-8 bg-black/40 border-white/10 text-xs"
                />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filtered.map((eff) => {
                  const active = current.effect === eff.id;
                  return (
                    <button
                      key={eff.id}
                      type="button"
                      onClick={() => selectEffect(eff.id)}
                      className={`text-left p-2.5 rounded-xl border transition-colors ${
                        active
                          ? "border-[#5B8DB8] bg-[#5B8DB8]/15"
                          : "border-white/10 bg-[#07090d]/70 hover:border-[#5B8DB8]/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-white truncate">{eff.name}</span>
                        {active && <Check size={12} className="shrink-0 text-[#7db5e3]" />}
                      </div>
                      <div className="text-[10px] text-[#E5E7EB]/50 line-clamp-2 mt-0.5">{eff.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: preview + config */}
          <div className="min-h-0 flex flex-col overflow-y-auto p-3 space-y-3">
            {/* Live preview */}
            <div className="relative h-32 rounded-xl overflow-hidden border border-white/10 bg-[#05070b] shrink-0">
              {group === "background" && (
                <div className="absolute inset-0">
                  <BackgroundEffectsLayer effect={current.effect} config={{ ...current.config, accent }} accent={accent} />
                </div>
              )}
              {group === "cursor" && (
                <>
                  <div className="absolute inset-0 grid place-items-center text-center px-4">
                    <div className="text-[11px] text-white/60">Move your cursor / click inside this box</div>
                  </div>
                  <CursorEffectsLayer effect={current.effect} config={current.config} accent={accent} bound />
                </>
              )}
              {group === "text" && (
                <div className="absolute inset-0 grid place-items-center px-4">
                  <TextEffect
                    effect={current.effect}
                    config={current.config}
                    text={previewName}
                    className="text-3xl font-black"
                    key={`${current.effect}-${JSON.stringify(current.config)}`}
                  />
                </div>
              )}
              {group === "profile" && (
                <div className="absolute inset-0 grid place-items-center p-4">
                  <div
                    ref={tilt.tiltRef}
                    {...tilt.tiltHandlers}
                    className={`relative w-48 rounded-2xl border border-white/15 bg-[#0c0e15] px-4 py-3 text-center ${profilePanelClassName(current.effect)}`}
                    style={{ position: "relative", ...profilePanelStyle(current.effect, current.config) }}
                    key={`${current.effect}-${JSON.stringify(current.config)}`}
                  >
                    <ProfilePanelOverlays effect={current.effect} config={current.config} />
                    <div className="relative z-10">
                      <div
                        className="relative w-9 h-9 mx-auto rounded-full"
                        style={{
                          background: accent,
                          boxShadow: current.effect === "avatar_glow" ? `0 0 ${current.config.radius ?? 24}px ${current.config.color || accent}` : undefined,
                        }}
                      >
                        <AvatarGlow enabled={current.effect === "avatar_glow"} config={current.config} color={accent} />
                      </div>
                      <div className="text-[11px] font-bold text-white mt-1.5 truncate">{previewName}</div>
                    </div>
                    <TiltGlare config={state.cardTilt} />
                  </div>
                </div>
              )}
              <span className="absolute top-1.5 left-2 text-[9px] uppercase tracking-widest text-white/35">Live preview</span>
            </div>

            {/* Effect config */}
            {def?.settings?.length ? (
              <div className="rounded-xl border border-white/10 bg-[#080a10] p-3 space-y-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">{def.name} settings</span>
                  <button
                    type="button"
                    onClick={resetConfig}
                    className="text-[10px] flex items-center gap-1 text-white/50 hover:text-white"
                  >
                    <RotateCcw size={11} /> Reset
                  </button>
                </div>
                {def.settings.map((setting) => (
                  <Field
                    key={setting.key}
                    setting={setting}
                    value={current.config?.[setting.key] ?? setting.default}
                    onChange={(v) => setConfigValue(setting.key, v)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-[#080a10] p-3 text-xs text-white/50">
                This effect has no additional options.
              </div>
            )}

            {/* Profile-only: card tilt + hover */}
            {group === "profile" && (
              <>
                <div className="rounded-xl border border-white/10 bg-[#080a10] p-3 space-y-1">
                  <div className="text-xs font-bold text-white mb-1">Card tilt</div>
                  {CARD_TILT_SCHEMA.map((setting) => (
                    <Field
                      key={setting.key}
                      setting={setting}
                      value={state.cardTilt?.[setting.key] ?? setting.default}
                      onChange={(v) => patchTilt(setting.key, v)}
                    />
                  ))}
                </div>
                <div className="rounded-xl border border-white/10 bg-[#080a10] p-3 space-y-1">
                  <div className="text-xs font-bold text-white mb-1">Hover treatments</div>
                  <div className={`rounded-lg border border-white/10 p-2.5 text-center text-xs text-white ${hover.className}`} style={hover.style}>
                    Hover preview
                  </div>
                  {HOVER_SCHEMA.map((setting) => (
                    <Field
                      key={setting.key}
                      setting={setting}
                      value={state.hover?.[setting.key] ?? setting.default}
                      onChange={(v) => patchHover(setting.key, v)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 p-3 border-t border-white/10 bg-[#090b10] flex items-center justify-between">
          <div className="text-[11px] text-white/45">Save your profile to keep these changes.</div>
          <Button type="button" size="sm" onClick={onClose} className="text-xs font-bold h-8 px-5 rounded-lg bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EffectsStudioV2;
