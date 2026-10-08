import React, { useState, useEffect } from "react";
import { useAuth, api } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Sparkles, Star, Check, Eye, Loader2, Plus, Search,
  Trash2, Edit3, Shield, Lock, Globe, Users, Sliders,
  CheckSquare, Square, Music, Layers, Image as ImageIcon,
  Share2, Type, MousePointer
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

// ─────────────────────────────────────────────────────────────
// OFFICIAL HIGH-AESTHETIC STYLE PRESETS
// ─────────────────────────────────────────────────────────────
const OFFICIAL_STYLE_PRESETS = [
  {
    id: "preset_cyberpunk",
    name: "Neon Cyberpunk 2077",
    category: "Cyber & Gaming",
    tagline: "High-voltage cyan & hot pink neon glow, holographic scanlines, and dark terminal glass",
    accent: "#00FFCC",
    bg_gradient: "from-cyan-950/60 via-purple-950/40 to-[#08090d]",
    settings: {
      accent_color: "#00FFCC",
      glow_color: "#FF007F",
      card_color: "#0b0f19",
      card_opacity: 85,
      card_blur: 16,
      border_color: "#00FFCC",
      border_radius: 18,
      bg_effect: "matrix",
      avatar_fx: "neon_pulse",
      avatar_fx_color: "#00FFCC",
      banner_fx: "scanlines",
      name_effect: "neon",
      name_color: "#00FFCC",
      bio_effect: "glow",
      layout: "classic",
      font_family: "Space Grotesk",
    },
  },
  {
    id: "preset_minimal_mono",
    name: "Monochrome Studio",
    category: "Minimal",
    tagline: "Ultra-clean monochrome frosted glass, minimalist typography, subtle drop shadows",
    accent: "#E2E8F0",
    bg_gradient: "from-zinc-900/60 via-stone-900/40 to-[#050505]",
    settings: {
      accent_color: "#E2E8F0",
      card_color: "#09090b",
      card_opacity: 75,
      card_blur: 20,
      border_color: "#27272a",
      border_radius: 24,
      bg_effect: "subtle_stars",
      avatar_fx: "soft_glow",
      avatar_fx_color: "#ffffff",
      banner_fx: "none",
      name_effect: "none",
      name_color: "#ffffff",
      bio_effect: "none",
      layout: "compact_feed",
      font_family: "Inter",
    },
  },
  {
    id: "preset_anime_cherry",
    name: "Sakura Dreamscape",
    category: "Anime & Cosmos",
    tagline: "Soft pastel cherry blossoms, dreamy rose quartz glowing borders & falling sakura petals",
    accent: "#F472B6",
    bg_gradient: "from-pink-950/50 via-purple-950/30 to-[#0c0a14]",
    settings: {
      accent_color: "#F472B6",
      card_color: "#180d19",
      card_opacity: 80,
      card_blur: 18,
      border_color: "#F472B6",
      border_radius: 22,
      bg_effect: "cherry_blossom",
      avatar_fx: "rainbow_ring",
      avatar_fx_color: "#F472B6",
      banner_fx: "shimmer",
      name_effect: "gradient",
      name_color: "#F472B6",
      bio_effect: "glow",
      layout: "floating_island",
      font_family: "Outfit",
    },
  },
  {
    id: "preset_terminal_hacker",
    name: "Kernel Rootkit",
    category: "Developer",
    tagline: "Retro green phosphor CRT monitor glow, monospaced ASCII aesthetics & terminal scanlines",
    accent: "#22C55E",
    bg_gradient: "from-emerald-950/60 via-green-950/40 to-[#020d06]",
    settings: {
      accent_color: "#22C55E",
      card_color: "#041007",
      card_opacity: 90,
      card_blur: 12,
      border_color: "#15803d",
      border_radius: 12,
      bg_effect: "crt_scanlines",
      avatar_fx: "glitch",
      avatar_fx_color: "#22C55E",
      banner_fx: "scanlines",
      name_effect: "typewriter",
      name_color: "#22C55E",
      bio_effect: "glitch",
      layout: "classic",
      font_family: "Fira Code",
    },
  },
  {
    id: "preset_vip_gold",
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
      layout: "split_left",
      font_family: "Outfit",
    },
  },
];

export default function ProfileTemplatesSection() {
  const { user, setUser } = useAuth();
  const isAdmin = user?.role === "admin";

  const [communityTemplates, setCommunityTemplates] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // Publish Form Modal
  const [publishOpen, setPublishOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [templateVisibility, setTemplateVisibility] = useState("public");
  const [templateRole, setTemplateRole] = useState("");
  const [publishing, setPublishing] = useState(false);

  // Component inclusion toggles
  const [includeTheme, setIncludeTheme] = useState(true);
  const [includeLayout, setIncludeLayout] = useState(true);
  const [includeAudio, setIncludeAudio] = useState(true);
  const [includeSlideshow, setIncludeSlideshow] = useState(true);
  const [includeLinks, setIncludeLinks] = useState(true);
  const [includeFonts, setIncludeFonts] = useState(true);
  const [includeCursor, setIncludeCursor] = useState(true);

  // Admin Edit Modal
  const [editModal, setEditModal] = useState({
    open: false,
    template: null,
    name: "",
    description: "",
    visibility: "public",
    target_role: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchTemplates = () => {
    api.get("/templates?limit=150")
      .then(({ data }) => setCommunityTemplates(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const categories = [
    "All",
    "Style Presets",
    "Cyber & Gaming",
    "Minimal",
    "Anime & Cosmos",
    "Developer",
    "Store & Projects",
    "Luxury VIP",
    "My Published",
    ...(isAdmin ? ["Admin Moderation"] : [])
  ];

  const allTemplates = [
    ...OFFICIAL_STYLE_PRESETS.map((t) => ({ ...t, is_curated: true })),
    ...communityTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      category: t.visibility === "role" ? "Role Restricted" : (t.visibility === "unlisted" ? "Unlisted" : "Community"),
      tagline: t.description || `Shared template by @${t.owner_username || "creator"}`,
      author: `@${t.owner_username || "creator"}`,
      accent: t.settings?.accent_color || "#5B8DB8",
      bg_gradient: "from-blue-950/40 via-purple-950/20 to-[#08090d]",
      settings: t.settings || {},
      owner_id: t.owner_id,
      owner_username: t.owner_username,
      visibility: t.visibility,
      target_role: t.target_role,
      is_curated: false,
    })),
  ];

  const filteredTemplates = allTemplates.filter((t) => {
    const matchSearch = `${t.name} ${t.tagline} ${t.author || ""}`.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (activeCategory === "All") return true;
    if (activeCategory === "Style Presets") return t.is_curated;
    if (activeCategory === "My Published") return t.owner_id === user?.id;
    if (activeCategory === "Admin Moderation") return !t.is_curated;
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
      const userSettings = { ...(user?.settings || {}) };
      delete userSettings.profile_templates;

      const filteredSettings = {};
      if (includeTheme) {
        filteredSettings.accent_color = userSettings.accent_color;
        filteredSettings.glow_color = userSettings.glow_color;
        filteredSettings.border_color = userSettings.border_color;
        filteredSettings.card_color = userSettings.card_color;
      }
      if (includeLayout) {
        filteredSettings.layout = userSettings.layout;
        filteredSettings.card_style = userSettings.card_style;
        filteredSettings.card_opacity = userSettings.card_opacity;
        filteredSettings.card_blur = userSettings.card_blur;
        filteredSettings.bg_effect = userSettings.bg_effect;
      }
      if (includeAudio) {
        filteredSettings.audio = userSettings.audio;
      }
      if (includeSlideshow) {
        filteredSettings.slideshow = userSettings.slideshow;
        filteredSettings.backgrounds = userSettings.backgrounds;
      }
      if (includeFonts) {
        filteredSettings.font_family = userSettings.font_family;
        filteredSettings.name_effect = userSettings.name_effect;
      }
      if (includeCursor) {
        filteredSettings.cursor = userSettings.cursor;
      }

      const { data: linkData } = await api.get("/links");
      const filteredLinks = includeLinks && Array.isArray(linkData) ? linkData : [];

      const { data } = await api.post("/templates", {
        name: templateName.trim(),
        visibility: templateVisibility,
        target_role: templateRole.trim(),
        display_name: user?.display_name || "",
        description: templateDesc.trim() || `Custom bio preset created by @${user?.username || "creator"}`,
        settings: Object.keys(filteredSettings).length > 0 ? filteredSettings : userSettings,
        links: filteredLinks,
      });

      setCommunityTemplates((prev) => [data, ...prev]);
      setTemplateName("");
      setTemplateDesc("");
      setPublishOpen(false);
      toast.success("🚀 Template published to global library!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not publish template.");
    } finally {
      setPublishing(false);
    }
  };

  const handleDeleteTemplate = async (templateId, templateName) => {
    if (!window.confirm(`Are you sure you want to delete template "${templateName}"?`)) return;
    try {
      await api.delete(`/templates/${templateId}`);
      toast.success(`Template "${templateName}" deleted successfully.`);
      setCommunityTemplates((prev) => prev.filter((t) => t.id !== templateId));
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete template.");
    }
  };

  const handleOpenEdit = (t) => {
    setEditModal({
      open: true,
      template: t,
      name: t.name,
      description: t.tagline || t.description || "",
      visibility: t.visibility || "public",
      target_role: t.target_role || "",
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editModal.template) return;
    setSavingEdit(true);
    try {
      const { data } = await api.put(`/templates/${editModal.template.id}`, {
        name: editModal.name.trim(),
        description: editModal.description.trim(),
        visibility: editModal.visibility,
        target_role: editModal.target_role.trim(),
      });
      toast.success("Template updated successfully!");
      setCommunityTemplates((prev) => prev.map((t) => (t.id === data.id ? { ...t, ...data } : t)));
      setEditModal({ open: false, template: null, name: "", description: "", visibility: "public", target_role: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update template.");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="p-5 rounded-2xl bg-[#0c0e18] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="text-[#5B8DB8]" size={18} />
            <h1 className="text-base font-bold text-white font-display flex items-center gap-2">
              <span>Profile Style Presets & Themes</span>
              {isAdmin && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30 flex items-center gap-1">
                  <Shield size={10} /> Admin Manager Active
                </span>
              )}
            </h1>
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
          <Plus size={14} /> Publish Custom Template
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
          const canManage = isAdmin || (!t.is_curated && t.owner_id === user?.id);

          return (
            <div
              key={t.id}
              className="rounded-2xl bg-[#0c0e18] border border-white/10 hover:border-[#5B8DB8]/50 overflow-hidden flex flex-col justify-between group transition-all shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
            >
              {/* Card Banner / Aesthetic Header */}
              <div className={`relative h-28 bg-gradient-to-br ${t.bg_gradient} p-3.5 flex flex-col justify-between border-b border-white/10 overflow-hidden`}>
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-1.5">
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
                    {t.visibility === "role" && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-mono">
                        Role: {t.target_role || "VIP"}
                      </span>
                    )}
                  </div>

                  {t.is_curated ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
                      <Star size={10} className="fill-amber-400" /> Official Preset
                    </span>
                  ) : (
                    <div className="flex items-center gap-1">
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(t)}
                          className="w-6 h-6 rounded-lg bg-black/50 hover:bg-[#5B8DB8] text-white flex items-center justify-center text-xs transition-colors"
                          title="Edit Template"
                        >
                          <Edit3 size={11} />
                        </button>
                      )}
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(t.id, t.name)}
                          className="w-6 h-6 rounded-lg bg-black/50 hover:bg-red-500 text-white flex items-center justify-center text-xs transition-colors"
                          title="Delete Template"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                      <span className="text-[10px] text-white/60 font-mono">
                        {t.author}
                      </span>
                    </div>
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

      {/* Enhanced Publish Modal */}
      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="max-w-lg bg-[#0c0e18] border border-[#2b384e] text-white p-5 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.95)] max-h-[90vh] overflow-y-auto">
          <DialogTitle className="text-base font-bold text-white font-display flex items-center gap-2">
            <Plus className="text-[#5B8DB8]" size={16} />
            <span>Publish Current Bio as Template</span>
          </DialogTitle>
          <form onSubmit={handlePublish} className="space-y-4 pt-2 text-xs">
            <div className="space-y-1.5">
              <label className="text-white/80 font-semibold block">Template Name</label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. Neon Horizon 2026"
                className="bg-[#07080c] border-white/10 text-white text-xs h-9 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-white/80 font-semibold block">Tagline / Description</label>
              <Textarea
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                placeholder="Describe your theme layout, colors, and ideal style..."
                rows={2}
                className="bg-[#07080c] border-white/10 text-white text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/80 font-semibold block mb-1">Privacy & Visibility</label>
                <select
                  value={templateVisibility}
                  onChange={(e) => setTemplateVisibility(e.target.value)}
                  className="w-full h-9 rounded-xl bg-[#07080c] border border-white/10 text-xs text-white px-3 focus:border-[#5B8DB8]"
                >
                  <option value="public">🌐 Public Library</option>
                  <option value="unlisted">🔗 Unlisted (Direct Link)</option>
                  <option value="role">👑 Role Restricted</option>
                  <option value="private">🔒 Private (Me Only)</option>
                </select>
              </div>

              {templateVisibility === "role" && (
                <div>
                  <label className="text-white/80 font-semibold block mb-1">Target Role</label>
                  <Input
                    value={templateRole}
                    onChange={(e) => setTemplateRole(e.target.value)}
                    placeholder="e.g. booster, vip, admin"
                    className="bg-[#07080c] border-white/10 text-white text-xs h-9 rounded-xl"
                  />
                </div>
              )}
            </div>

            {/* What to include in template */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-xs font-bold text-white block">Components to Include in Preset</span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-white/80">
                <button
                  type="button"
                  onClick={() => setIncludeTheme(!includeTheme)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[#07080c] border border-white/10 text-left hover:border-white/20"
                >
                  {includeTheme ? <CheckSquare size={14} className="text-[#5B8DB8]" /> : <Square size={14} />}
                  <span>Theme & Accent Colors</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIncludeLayout(!includeLayout)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[#07080c] border border-white/10 text-left hover:border-white/20"
                >
                  {includeLayout ? <CheckSquare size={14} className="text-[#5B8DB8]" /> : <Square size={14} />}
                  <span>Layout & Glass Blur</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIncludeAudio(!includeAudio)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[#07080c] border border-white/10 text-left hover:border-white/20"
                >
                  {includeAudio ? <CheckSquare size={14} className="text-[#5B8DB8]" /> : <Square size={14} />}
                  <span>Audio & Tracks</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIncludeSlideshow(!includeSlideshow)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[#07080c] border border-white/10 text-left hover:border-white/20"
                >
                  {includeSlideshow ? <CheckSquare size={14} className="text-[#5B8DB8]" /> : <Square size={14} />}
                  <span>Slideshow & Wallpapers</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIncludeLinks(!includeLinks)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[#07080c] border border-white/10 text-left hover:border-white/20"
                >
                  {includeLinks ? <CheckSquare size={14} className="text-[#5B8DB8]" /> : <Square size={14} />}
                  <span>Social Links & Icons</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIncludeFonts(!includeFonts)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[#07080c] border border-white/10 text-left hover:border-white/20"
                >
                  {includeFonts ? <CheckSquare size={14} className="text-[#5B8DB8]" /> : <Square size={14} />}
                  <span>Fonts & Typography</span>
                </button>
              </div>
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

      {/* Admin Edit Modal */}
      <Dialog open={editModal.open} onOpenChange={(o) => !o && setEditModal({ ...editModal, open: false })}>
        <DialogContent className="max-w-md bg-[#0c0e18] border border-[#2b384e] text-white p-5 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.95)]">
          <DialogTitle className="text-base font-bold text-white font-display flex items-center gap-2">
            <Edit3 className="text-[#5B8DB8]" size={16} />
            <span>Moderate / Edit Template</span>
          </DialogTitle>
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2 text-xs">
            <div className="space-y-1">
              <label className="text-white/80 font-semibold block">Template Name</label>
              <Input
                value={editModal.name}
                onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
                className="bg-[#07080c] border-white/10 text-white text-xs h-9 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="text-white/80 font-semibold block">Description</label>
              <Textarea
                value={editModal.description}
                onChange={(e) => setEditModal({ ...editModal, description: e.target.value })}
                rows={2}
                className="bg-[#07080c] border-white/10 text-white text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/80 font-semibold block mb-1">Visibility</label>
                <select
                  value={editModal.visibility}
                  onChange={(e) => setEditModal({ ...editModal, visibility: e.target.value })}
                  className="w-full h-9 rounded-xl bg-[#07080c] border border-white/10 text-xs text-white px-3"
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="role">Role Restricted</option>
                  <option value="private">Private</option>
                </select>
              </div>

              {editModal.visibility === "role" && (
                <div>
                  <label className="text-white/80 font-semibold block mb-1">Target Role</label>
                  <Input
                    value={editModal.target_role}
                    onChange={(e) => setEditModal({ ...editModal, target_role: e.target.value })}
                    placeholder="e.g. booster"
                    className="bg-[#07080c] border-white/10 text-white text-xs h-9 rounded-xl"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModal({ ...editModal, open: false })}
                className="border-white/10 hover:bg-white/5 text-xs text-white/70 h-8 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingEdit || !editModal.name.trim()}
                className="bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold h-8 px-4 rounded-xl shadow-md"
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
