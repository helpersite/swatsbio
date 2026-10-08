import React, { useEffect, useState } from "react";
import { useAuth, api, fileUrl } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Sparkles, Search, Check, Trash2, Eye, Plus, LayoutTemplate,
  Loader2, Download, ShieldCheck, Palette, Layers, Star, Zap
} from "lucide-react";
import { toast } from "sonner";
import { renderBioText } from "@/lib/textEffects";

export const OFFICIAL_STYLE_PRESETS = [
  {
    id: "preset_cyberpunk",
    name: "Cyber Neon Glow",
    category: "Cyber & Gaming",
    tagline: "High-contrast neon cyan & magenta glitch aesthetics with frosted glass",
    accent: "#00F0FF",
    bg_gradient: "from-cyan-950/60 via-purple-950/40 to-[#08090d]",
    settings: {
      accent_color: "#00F0FF",
      card_color: "#0c0e18",
      card_opacity: 85,
      card_blur: 16,
      border_color: "#00F0FF",
      border_radius: 18,
      bg_effect: "cyber_grid",
      avatar_fx: "neon_rim",
      avatar_fx_color: "#00F0FF",
      banner_fx: "scan",
      name_effect: "neon_rim",
      name_color: "#00F0FF",
      bio_effect: "glow",
      layout: "floating_glass",
      font_family: "Space Grotesk",
    },
  },
  {
    id: "preset_minimal",
    name: "Minimalist Slate",
    category: "Minimal",
    tagline: "Ultra clean monochrome dark glass with crisp minimalist typography",
    accent: "#E5E7EB",
    bg_gradient: "from-slate-900/60 via-zinc-900/40 to-[#08090d]",
    settings: {
      accent_color: "#FFFFFF",
      card_color: "#0f1117",
      card_opacity: 90,
      card_blur: 24,
      border_color: "#27272a",
      border_radius: 14,
      bg_effect: "static",
      avatar_fx: "none",
      banner_fx: "dark_vignette",
      name_effect: "none",
      name_color: "#FFFFFF",
      bio_effect: "none",
      layout: "minimal",
      font_family: "Inter",
    },
  },
  {
    id: "preset_anime",
    name: "Violet Nebula",
    category: "Anime & Cosmos",
    tagline: "Purple & rose celestial gradients with deep starfield animations",
    accent: "#E879F9",
    bg_gradient: "from-fuchsia-950/60 via-purple-950/40 to-[#08090d]",
    settings: {
      accent_color: "#E879F9",
      card_color: "#130e1f",
      card_opacity: 80,
      card_blur: 20,
      border_color: "#E879F9",
      border_radius: 20,
      bg_effect: "stars",
      avatar_fx: "ripple",
      avatar_fx_color: "#E879F9",
      banner_fx: "shimmer",
      name_effect: "waveflow",
      name_color: "#E879F9",
      bio_effect: "sparkle",
      layout: "bento_grid",
      font_family: "Outfit",
    },
  },
  {
    id: "preset_developer",
    name: "Terminal Matrix",
    category: "Developer",
    tagline: "Terminal aesthetics, Matrix rain particle stream & monospaced layout",
    accent: "#10B981",
    bg_gradient: "from-emerald-950/60 via-slate-950/40 to-[#08090d]",
    settings: {
      accent_color: "#10B981",
      card_color: "#0a120e",
      card_opacity: 88,
      card_blur: 14,
      border_color: "#10B981",
      border_radius: 12,
      bg_effect: "matrix",
      avatar_fx: "neon_rim",
      avatar_fx_color: "#10B981",
      banner_fx: "scan",
      name_effect: "glow",
      name_color: "#10B981",
      bio_effect: "none",
      layout: "two_column",
      font_family: "JetBrains Mono",
    },
  },
  {
    id: "preset_store",
    name: "Store & Projects Showcase",
    category: "Store & Projects",
    tagline: "Product showcases, instant action buttons & multi-deck interactive slides",
    accent: "#5B8DB8",
    bg_gradient: "from-sky-950/60 via-blue-950/40 to-[#08090d]",
    settings: {
      accent_color: "#5B8DB8",
      card_color: "#0c101c",
      card_opacity: 92,
      card_blur: 20,
      border_color: "#5B8DB8",
      border_radius: 16,
      bg_effect: "anti_fall",
      avatar_fx: "spin",
      avatar_fx_color: "#5B8DB8",
      banner_fx: "fade_overlay",
      name_effect: "rgbglow",
      name_color: "#5B8DB8",
      bio_effect: "glow",
      layout: "slideshow",
      font_family: "Inter",
    },
  },
  {
    id: "preset_luxury",
    name: "VIP Obsidian Gold",
    category: "Luxury VIP",
    tagline: "Deep onyx obsidian with gold foil reflections, glowing border & royal badges",
    accent: "#F59E0B",
    bg_gradient: "from-amber-950/60 via-yellow-950/40 to-[#08090d]",
    settings: {
      accent_color: "#F59E0B",
      card_color: "#120e06",
      card_opacity: 90,
      card_blur: 24,
      border_color: "#F59E0B",
      border_radius: 20,
      bg_effect: "aurora",
      avatar_fx: "shimmer",
      avatar_fx_color: "#F59E0B",
      banner_fx: "shimmer",
      name_effect: "sparkle",
      name_color: "#F59E0B",
      bio_effect: "glow",
      layout: "magazine",
      font_family: "Outfit",
    },
  },
];

export default function ProfileTemplatesSection() {
  const { user, setUser } = useAuth();
  const [communityTemplates, setCommunityTemplates] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // Publish Form Modal
  const [publishOpen, setPublishOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    let active = true;
    api.get("/templates?limit=100")
      .then(({ data }) => { if (active) setCommunityTemplates(Array.isArray(data) ? data : []); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const categories = ["All", "Style Presets", "Cyber & Gaming", "Minimal", "Anime & Cosmos", "Developer", "Store & Projects", "Luxury VIP", "My Published"];

  const allTemplates = [
    ...OFFICIAL_STYLE_PRESETS.map((t) => ({ ...t, is_curated: true })),
    ...communityTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      category: "Community",
      tagline: t.description || `Shared template by @${t.owner_username || "creator"}`,
      author: `@${t.owner_username || "creator"}`,
      accent: t.settings?.accent_color || "#5B8DB8",
      bg_gradient: "from-blue-950/40 via-purple-950/20 to-[#08090d]",
      settings: t.settings || {},
      owner_id: t.owner_id,
      is_curated: false,
    })),
  ];

  const filteredTemplates = allTemplates.filter((t) => {
    const matchSearch = `${t.name} ${t.tagline}`.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (activeCategory === "All") return true;
    if (activeCategory === "Style Presets") return t.is_curated;
    if (activeCategory === "My Published") return t.owner_id === user?.id;
    return t.category === activeCategory;
  });

  const handleApply = async (template) => {
    setApplyingId(template.id);
    try {
      if (template.is_curated) {
        const nextSettings = { ...(user?.settings || {}), ...template.settings };
        const { data } = await api.put("/profile/settings", nextSettings);
        setUser((prev) => ({ ...prev, settings: data }));
        toast.success(`✨ Successfully equipped "${template.name}" style preset!`);
      } else {
        const { data } = await api.post(`/templates/${template.id}/apply`);
        setUser(data.user);
        toast.success(`✨ Successfully equipped "${template.name}" community template!`);
      }
      setPreviewTemplate(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to apply template.");
    } finally {
      setApplyingId(null);
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!templateName.trim()) return toast.error("Please enter a template name");
    setPublishing(true);
    try {
      const { data: linkData } = await api.get("/links");
      const cleanSettings = { ...(user?.settings || {}) };
      delete cleanSettings.profile_templates;
      const { data } = await api.post("/templates", {
        name: templateName.trim(),
        visibility: "public",
        display_name: user?.display_name || "",
        description: user?.description || "",
        settings: cleanSettings,
        links: Array.isArray(linkData) ? linkData : [],
      });
      setCommunityTemplates((prev) => [data, ...prev]);
      setTemplateName("");
      setPublishOpen(false);
      toast.success("🚀 Template published to global community library!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not publish template.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="p-5 rounded-2xl bg-[#0c0e18] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="text-[#5B8DB8]" size={18} />
            <h1 className="text-base font-bold text-white font-display">Profile Style Presets & Themes</h1>
          </div>
          <p className="text-xs text-[#E5E7EB]/50">
            One-click apply clean layouts, background FX, frosted glass themes, and glowing fonts directly to your live bio
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setPublishOpen(true)}
          className="bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold px-4 h-9 rounded-xl shadow-[0_0_15px_rgba(91,141,184,0.35)] gap-1.5 cursor-pointer shrink-0"
        >
          <Plus size={14} /> Publish My Current Bio
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={14} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search style presets by layout, font, or keyword..."
              className="bg-[#0c0e18] border-white/10 pl-9 text-xs text-white placeholder:text-white/30 h-9 rounded-xl"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const isSel = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSel
                    ? "bg-[#5B8DB8] text-white shadow-[0_0_12px_rgba(91,141,184,0.4)]"
                    : "bg-[#0c0e18] border border-white/10 text-white/60 hover:text-white hover:border-white/20"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((t) => {
          const isApplying = applyingId === t.id;
          return (
            <div
              key={t.id}
              className="rounded-2xl bg-[#0c0e18] border border-white/10 hover:border-[#5B8DB8]/50 overflow-hidden flex flex-col justify-between group transition-all shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
            >
              {/* Card Banner / Aesthetic Header */}
              <div className={`relative h-28 bg-gradient-to-br ${t.bg_gradient} p-3.5 flex flex-col justify-between border-b border-white/10 overflow-hidden`}>
                <div className="flex items-center justify-between z-10">
                  <span
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-sm"
                    style={{
                      backgroundColor: `${t.accent}20`,
                      borderColor: `${t.accent}60`,
                      color: t.accent,
                    }}
                  >
                    {t.category}
                  </span>
                  {t.is_curated ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
                      <Star size={10} className="fill-amber-400" /> Official Preset
                    </span>
                  ) : (
                    <span className="text-[10px] text-white/60 font-mono">
                      {t.author}
                    </span>
                  )}
                </div>

                {/* Mini Visual Elements */}
                <div className="flex items-center gap-2 z-10">
                  <div
                    className="w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold shadow-md"
                    style={{ backgroundColor: t.accent, color: "#000" }}
                  >
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{t.name}</div>
                    <div className="text-[10px] text-[#E5E7EB]/60 font-mono">{t.settings?.font_family || "Default Font"}</div>
                  </div>
                </div>

                <div
                  className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full filter blur-2xl opacity-40 pointer-events-none"
                  style={{ backgroundColor: t.accent }}
                />
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <p className="text-[11px] text-[#E5E7EB]/60 leading-relaxed line-clamp-2">
                  {t.tagline}
                </p>

                {/* Specs Pill List */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-white/70 border border-white/5">
                    🎨 {t.settings?.layout || "classic"}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-white/70 border border-white/5">
                    ✨ {t.settings?.bg_effect || "none"}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-white/70 border border-white/5">
                    🔤 {t.settings?.font_family || "Inter"}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPreviewTemplate(t)}
                    className="flex-1 border-white/10 hover:bg-white/5 text-white/80 hover:text-white text-xs h-8 rounded-xl gap-1 cursor-pointer"
                  >
                    <Eye size={12} /> Inspect
                  </Button>
                  <Button
                    type="button"
                    disabled={isApplying}
                    onClick={() => handleApply(t)}
                    className="flex-1 bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold h-8 rounded-xl shadow-[0_0_10px_rgba(91,141,184,0.3)] gap-1 cursor-pointer"
                  >
                    {isApplying ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <>
                        <Check size={12} /> Equip Preset
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inspect / Preview Modal */}
      <Dialog open={Boolean(previewTemplate)} onOpenChange={(o) => !o && setPreviewTemplate(null)}>
        <DialogContent className="w-[620px] max-w-[calc(100vw-2rem)] bg-[#0c0e18] border border-[#2b384e] text-white p-5 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.95)]">
          {previewTemplate && (
            <div className="space-y-4">
              <DialogTitle className="text-base font-bold text-white font-display flex items-center gap-2">
                <Sparkles className="text-[#5B8DB8]" size={16} />
                <span>Inspect Preset: {previewTemplate.name}</span>
              </DialogTitle>
              <p className="text-xs text-[#E5E7EB]/60">{previewTemplate.tagline}</p>

              {/* Specs Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[#07080c] p-3 rounded-xl border border-white/10 text-xs">
                <div>
                  <span className="text-[10px] text-white/40 uppercase font-bold block">Layout</span>
                  <span className="text-white font-mono">{previewTemplate.settings?.layout || "classic"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 uppercase font-bold block">Background FX</span>
                  <span className="text-white font-mono">{previewTemplate.settings?.bg_effect || "none"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 uppercase font-bold block">Font Family</span>
                  <span className="text-white font-mono">{previewTemplate.settings?.font_family || "Inter"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 uppercase font-bold block">Avatar Effect</span>
                  <span className="text-white font-mono">{previewTemplate.settings?.avatar_fx || "none"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 uppercase font-bold block">Name Glow FX</span>
                  <span className="text-white font-mono">{previewTemplate.settings?.name_effect || "none"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 uppercase font-bold block">Card Opacity</span>
                  <span className="text-white font-mono">{previewTemplate.settings?.card_opacity || 90}%</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreviewTemplate(null)}
                  className="border-white/10 hover:bg-white/5 text-xs text-white/70 h-8 rounded-xl"
                >
                  Close
                </Button>
                <Button
                  type="button"
                  disabled={applyingId === previewTemplate.id}
                  onClick={() => handleApply(previewTemplate)}
                  className="bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold h-8 px-4 rounded-xl shadow-md"
                >
                  {applyingId === previewTemplate.id ? "Equipping..." : "Equip Live"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Publish Modal */}
      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="max-w-md bg-[#0c0e18] border border-[#2b384e] text-white p-5 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.95)]">
          <DialogTitle className="text-base font-bold text-white font-display flex items-center gap-2">
            <Plus className="text-[#5B8DB8]" size={16} />
            <span>Publish Current Bio as Template</span>
          </DialogTitle>
          <form onSubmit={handlePublish} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs text-white/70 font-semibold">Template Name</label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. Neon Horizon"
                className="bg-[#07080c] border-white/10 text-white text-xs h-9 rounded-xl"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPublishOpen(false)}
                className="border-white/10 hover:bg-white/5 text-xs text-white/70 h-8 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={publishing || !templateName.trim()}
                className="bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold h-8 px-4 rounded-xl shadow-md"
              >
                {publishing ? "Publishing..." : "Publish to Library"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
