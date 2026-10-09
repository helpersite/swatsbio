import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Briefcase, Shield, Terminal, Star, Sparkles, Cpu, Check, X, Award } from "lucide-react";
import CustomColorPicker from "@/components/ColorPicker";

export const ROLE_EFFECT_STYLES = [
  { id: "glass_pill", name: "Glass Accolade", desc: "Translucent frosted pill with subtle glass sheen" },
  { id: "cyber_halo", name: "Cyber Halo", desc: "Orbital ultraviolet glow with precision border" },
  { id: "neon_badge", name: "Neon Matrix", desc: "High-contrast glowing pill with electric aura" },
  { id: "terminal_mono", name: "Console Badge", desc: "Monospace prompt with code brackets" },
  { id: "gold_verified", name: "Gold Authority", desc: "Golden gradient border with warm drop shadow" },
];

export const ROLE_ICONS = [
  { id: "briefcase", label: "Briefcase", icon: "💼" },
  { id: "shield", label: "Shield", icon: "🛡️" },
  { id: "terminal", label: "Terminal", icon: "💻" },
  { id: "star", label: "Star", icon: "⭐" },
  { id: "sparkles", label: "Sparkles", icon: "✨" },
  { id: "cpu", label: "Cyber Core", icon: "⚡" },
];

export function RoleEffectsModal({
  open,
  onClose,
  occupation,
  settings,
  patch,
}) {
  const [selectedStyle, setSelectedStyle] = useState(settings?.role_effect_style || "glass_pill");
  const [roleColor, setRoleColor] = useState(settings?.role_effect_color || settings?.accent_color || "#5B8DB8");
  const [selectedIcon, setSelectedIcon] = useState(settings?.role_icon || "💼");

  if (!open) return null;

  const roleText = occupation || "Software Engineer";

  const handleSelectStyle = (id) => {
    setSelectedStyle(id);
    patch("role_effect_style", id);
  };

  const handleRoleColor = (c) => {
    setRoleColor(c);
    patch("role_effect_color", c);
  };

  const handleSelectIcon = (ic) => {
    setSelectedIcon(ic);
    patch("role_icon", ic);
  };

  const renderRolePreview = (styleId, col, icon) => {
    if (styleId === "cyber_halo") {
      return (
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white backdrop-blur-xl"
          style={{
            background: "rgba(12,14,20,0.85)",
            border: `1.5px solid ${col}`,
            boxShadow: `0 0 16px ${col}66, inset 0 0 8px ${col}33`,
          }}
        >
          <span>{icon}</span>
          <span style={{ textShadow: `0 0 8px ${col}88` }}>{roleText}</span>
        </span>
      );
    }
    if (styleId === "neon_badge") {
      return (
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white"
          style={{
            background: `linear-gradient(135deg, ${col}33, #090b10)`,
            border: `1.5px solid ${col}aa`,
            boxShadow: `0 0 12px ${col}44`,
          }}
        >
          <span>{icon}</span>
          <span>{roleText}</span>
        </span>
      );
    }
    if (styleId === "terminal_mono") {
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-mono text-white/90 border border-white/15 bg-black/70"
          style={{ borderColor: `${col}55` }}
        >
          <span style={{ color: col }}>$&gt;</span>
          <span>{roleText}</span>
        </span>
      );
    }
    if (styleId === "gold_verified") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-amber-100 bg-[#16130b] border border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.3)]">
          <span>{icon}</span>
          <span>{roleText}</span>
        </span>
      );
    }
    // Default: glass_pill
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-white/90 font-medium backdrop-blur-md"
        style={{ borderColor: `${col}33` }}
      >
        <span>{icon}</span>
        <span>{roleText}</span>
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[620px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[92dvh] bg-[#090b10] border border-white/10 text-white p-0 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#0c0e15]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 flex items-center justify-center text-[#5B8DB8]">
              <Award size={16} />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-white font-display">
                Role & Profession Effects Studio
              </DialogTitle>
              <div className="text-[11px] text-[#E5E7EB]/50">
                Custom halo pills, authority badges, and glowing profession tags
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
            Live Role Preview
          </div>
          <div className="min-h-[38px] flex items-center justify-center">
            {renderRolePreview(selectedStyle, roleColor, selectedIcon)}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {/* Colors & Icon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0c0e15] p-3 rounded-xl border border-white/5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[#E5E7EB]/70 font-medium">Role Accent Color:</span>
              <div className="w-32">
                <CustomColorPicker value={roleColor} onChange={handleRoleColor} label="Role Color" />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[#E5E7EB]/70 font-medium">Leading Icon:</span>
              <div className="flex items-center gap-1 bg-[#080a10] p-1 rounded-lg border border-white/10">
                {ROLE_ICONS.map((ic) => (
                  <button
                    key={ic.id}
                    type="button"
                    onClick={() => handleSelectIcon(ic.icon)}
                    className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-all ${
                      selectedIcon === ic.icon ? "bg-[#5B8DB8] text-white shadow" : "hover:bg-white/10"
                    }`}
                    title={ic.label}
                  >
                    {ic.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Style Options */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-white/70">Badge Styling</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ROLE_EFFECT_STYLES.map((st) => {
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
                        {renderRolePreview(st.id, roleColor, selectedIcon)}
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
