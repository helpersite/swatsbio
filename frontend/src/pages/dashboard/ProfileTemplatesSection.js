import React, { useState, useEffect } from "react";
import { useAuth, api, fileUrl } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Check, Eye, Loader2, Plus, Search,
  Trash2, Edit3, CheckSquare, Square,
  Sparkles, ExternalLink, ShieldCheck, User,
  Layers, Palette, Music
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { renderBioText } from "@/lib/textEffects";
import { BackgroundEffect } from "@/components/BackgroundEffects";

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

  // Admin / Owner Edit Modal
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
    "Community",
    "My Templates",
    ...(isAdmin ? ["Role Restricted", "Unlisted"] : [])
  ];

  const allTemplates = communityTemplates.map((t) => ({
    id: t.id,
    name: t.name,
    category: t.visibility === "role" ? "Role Restricted" : (t.visibility === "unlisted" ? "Unlisted" : "Community"),
    tagline: t.description || `Shared by @${t.owner_username || "user"}`,
    author: `@${t.owner_username || "user"}`,
    owner_username: t.owner_username || "swats",
    accent: t.settings?.accent_color || "#5B8DB8",
    bg_gradient: "from-blue-950/40 via-purple-950/20 to-[#08090d]",
    settings: t.settings || {},
    owner_id: t.owner_id,
    visibility: t.visibility,
    target_role: t.target_role,
  }));

  const filteredTemplates = allTemplates.filter((t) => {
    const matchSearch = `${t.name} ${t.tagline} ${t.author || ""}`.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (activeCategory === "All") return true;
    if (activeCategory === "Community") return t.visibility === "public" || !t.visibility;
    if (activeCategory === "My Templates") return t.owner_id === user?.id;
    if (activeCategory === "Role Restricted") return t.visibility === "role";
    if (activeCategory === "Unlisted") return t.visibility === "unlisted";
    return t.category === activeCategory;
  });

  const handleApply = async (template) => {
    setApplyingId(template.id);
    try {
      const { data } = await api.post(`/templates/${template.id}/apply`);
      setUser(data.user);
      toast.success(`Equipped template: ${template.name}`);
      setPreviewTemplate(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to apply template.");
    } finally {
      setApplyingId(null);
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!templateName.trim()) return toast.error("Enter a template name");
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
        description: templateDesc.trim() || `Preset by @${user?.username || "user"}`,
        settings: Object.keys(filteredSettings).length > 0 ? filteredSettings : userSettings,
        links: filteredLinks,
      });

      setCommunityTemplates((prev) => [data, ...prev]);
      setTemplateName("");
      setTemplateDesc("");
      setPublishOpen(false);
      toast.success("Template published.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not publish template.");
    } finally {
      setPublishing(false);
    }
  };

  const handleDeleteTemplate = async (templateId, name) => {
    if (!window.confirm(`Delete template "${name}"?`)) return;
    try {
      await api.delete(`/templates/${templateId}`);
      toast.success("Template deleted.");
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
      toast.success("Template updated.");
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
          <h1 className="text-base font-bold text-white font-display">Templates & Themes</h1>
          <p className="text-xs text-[#E5E7EB]/50">
            Preview, customize, and equip community themes and layouts
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setPublishOpen(true)}
          className="bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold px-4 h-9 rounded-xl shadow-md gap-1.5 cursor-pointer shrink-0"
        >
          <Plus size={14} /> Publish Template
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
              placeholder="Search templates by name, author, style..."
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
                    ? "bg-[#5B8DB8] text-white shadow-sm"
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
      {loading ? (
        <div className="py-16 flex items-center justify-center text-white/40 text-xs">
          <Loader2 size={20} className="animate-spin mr-2" /> Loading templates...
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="py-16 text-center text-white/40 bg-[#0c0e18] rounded-2xl border border-white/10 p-8 space-y-3">
          <p className="text-xs">No templates found matching your criteria.</p>
          <Button
            type="button"
            onClick={() => setPublishOpen(true)}
            className="bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold px-4 h-8 rounded-xl"
          >
            <Plus size={13} className="mr-1" /> Publish First Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((t) => {
            const isApplying = applyingId === t.id;
            const canManage = isAdmin || t.owner_id === user?.id;
            const s = t.settings || {};
            const accent = t.accent || "#5B8DB8";
            const bgUrl = s.banner ? fileUrl(s.banner) : (s.backgrounds?.[0] ? fileUrl(s.backgrounds[0]) : (s.profile_embed_image ? fileUrl(s.profile_embed_image) : null));
            const pfpUrl = s.pfp ? fileUrl(s.pfp) : (user?.pfp ? fileUrl(user.pfp) : null);

            const handleOpenRealPreview = () => {
              const previewUrl = `/p/${user?.username || "preview"}?preview_template=${t.id}`;
              window.open(previewUrl, "_blank");
            };

            return (
              <div
                key={t.id}
                className="rounded-2xl bg-[#0c0e18] border border-white/10 hover:border-[#5B8DB8]/60 overflow-hidden flex flex-col justify-between group transition-all duration-200 shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.8)]"
              >
                {/* Top Card Preview: ONLY uploaded background with centered PFP */}
                <div className="relative h-44 bg-[#050608] border-b border-white/10 overflow-hidden flex items-center justify-center select-none group">
                  {/* Uploaded Background Image */}
                  {bgUrl ? (
                    <img
                      src={bgUrl}
                      alt={t.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#0c0e18] via-[#121624] to-[#08090d]"
                    />
                  )}

                  {/* Background Effect Canvas inside preview if active */}
                  {s.bg_effect && s.bg_effect !== "none" && (
                    <BackgroundEffect effect={s.bg_effect} config={s.bg_effect_config || { speed: 0.8 }} />
                  )}

                  {/* Dark backdrop overlay for contrast */}
                  <div className="absolute inset-0 bg-black/30 pointer-events-none" />

                  {/* Top Bar: Category Pill & Real Preview / Manage Controls */}
                  <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between">
                    <span
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-md backdrop-blur-md bg-black/60"
                      style={{
                        borderColor: `${accent}60`,
                        color: accent,
                      }}
                    >
                      {t.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {canManage && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleOpenEdit(t); }}
                          className="w-7 h-7 rounded-lg bg-black/70 hover:bg-[#5B8DB8] text-white flex items-center justify-center text-xs transition-colors cursor-pointer border border-white/10"
                          title="Edit"
                        >
                          <Edit3 size={12} />
                        </button>
                      )}
                      {canManage && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t.id, t.name); }}
                          className="w-7 h-7 rounded-lg bg-black/70 hover:bg-red-500 text-white flex items-center justify-center text-xs transition-colors cursor-pointer border border-white/10"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}

                      {/* Top Right Real Live Preview Open Button */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleOpenRealPreview(); }}
                        className="w-7 h-7 rounded-lg bg-black/80 hover:bg-[#5B8DB8] text-white flex items-center justify-center border border-white/20 transition-all shadow-md group-hover:scale-105 cursor-pointer"
                        title="Open Real Live Template Page"
                      >
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Centered PFP in Middle */}
                  <div
                    className="relative z-10 w-16 h-16 rounded-full border-2 p-0.5 shadow-2xl overflow-hidden bg-black/70 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                    style={{ borderColor: accent }}
                  >
                    {pfpUrl ? (
                      <img
                        src={pfpUrl}
                        alt={t.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center font-black text-base text-white"
                        style={{ backgroundColor: `${accent}40` }}
                      >
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-white truncate">{t.name}</h3>
                      <span className="text-[10px] font-mono text-[#5B8DB8] px-1.5 py-0.5 rounded bg-[#5B8DB8]/10 border border-[#5B8DB8]/20">
                        {s.font_family || s.font || "Outfit"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#E5E7EB]/60 leading-relaxed line-clamp-2 mt-1">
                      {t.tagline}
                    </p>
                  </div>

                  {/* Specs Pill List */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-white/70 border border-white/5">
                      {s.card_style || s.layout || "classic"}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-white/70 border border-white/5">
                      {s.bg_effect || "no effect"}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleOpenRealPreview}
                      className="flex-1 border-white/15 hover:bg-white/10 text-white/90 hover:text-white text-xs h-8 rounded-xl gap-1.5 cursor-pointer"
                    >
                      <ExternalLink size={12} /> Live Preview
                    </Button>
                    <Button
                      type="button"
                      disabled={isApplying}
                      onClick={() => handleApply(t)}
                      className="flex-1 bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold h-8 rounded-xl shadow-md gap-1.5 cursor-pointer"
                    >
                      {isApplying ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <>
                          <Check size={13} /> Equip
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Full Template Live Preview Modal */}
      <Dialog open={Boolean(previewTemplate)} onOpenChange={(o) => !o && setPreviewTemplate(null)}>
        <DialogContent className="w-[780px] max-w-[calc(100vw-2rem)] h-[660px] max-h-[92dvh] bg-[#07090e] border border-[#2b384e] text-white p-0 rounded-3xl shadow-[0_25px_90px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
          {previewTemplate && (() => {
            const s = previewTemplate.settings || {};
            const accent = s.accent_color || previewTemplate.accent || "#5B8DB8";
            const font = s.font_family || s.font || "Outfit";

            return (
              <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">
                {/* Background Ambient Effect */}
                {s.bg_effect && s.bg_effect !== "none" && (
                  <BackgroundEffect effect={s.bg_effect} config={s.bg_effect_config || { speed: 1 }} />
                )}

                {/* Top Floating Control Bar */}
                <div className="relative z-30 p-4 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-xl shrink-0">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shadow" style={{ backgroundColor: accent }}>
                      {previewTemplate.name.charAt(0)}
                    </span>
                    <div>
                      <DialogTitle className="text-sm font-bold text-white font-display">
                        {previewTemplate.name}
                      </DialogTitle>
                      <div className="text-[11px] text-[#E5E7EB]/50">
                        Live Interactive Template Preview
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      disabled={applyingId === previewTemplate.id}
                      onClick={() => handleApply(previewTemplate)}
                      className="bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold h-8 px-4 rounded-xl shadow-md gap-1.5 cursor-pointer"
                    >
                      {applyingId === previewTemplate.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      Equip Template
                    </Button>
                    <button
                      onClick={() => setPreviewTemplate(null)}
                      className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Center Live Mockup Canvas */}
                <div className="relative z-20 flex-1 overflow-y-auto p-6 flex items-center justify-center">
                  <div
                    className="w-full max-w-sm rounded-3xl p-6 border shadow-2xl backdrop-blur-2xl text-center space-y-4 transition-all"
                    style={{
                      fontFamily: font,
                      borderColor: `${accent}45`,
                      background: "rgba(10, 13, 18, 0.78)",
                      boxShadow: `0 20px 60px rgba(0,0,0,0.8), 0 0 35px ${accent}25`,
                    }}
                  >
                    {/* Mockup Profile Avatar */}
                    <div className="relative inline-block mx-auto">
                      <div
                        className="w-20 h-20 rounded-full border-2 flex items-center justify-center text-2xl font-black text-white shadow-xl mx-auto"
                        style={{ borderColor: accent, backgroundColor: `${accent}25` }}
                      >
                        {previewTemplate.name.charAt(0)}
                      </div>
                    </div>

                    {/* Mockup Title with Text Effect */}
                    <div>
                      <h2 className="text-xl font-black text-white">
                        {renderBioText(previewTemplate.name)}
                      </h2>
                      <div className="text-xs font-semibold mt-0.5 tracking-wider uppercase" style={{ color: accent }}>
                        {previewTemplate.author}
                      </div>
                    </div>

                    {/* Mockup Description */}
                    <p className="text-xs text-[#E5E7EB]/70 leading-relaxed font-normal">
                      {previewTemplate.tagline}
                    </p>

                    {/* Mockup Links */}
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <div
                        className="w-full py-2.5 px-3 rounded-xl border flex items-center justify-between text-xs font-semibold text-white backdrop-blur-md"
                        style={{ borderColor: `${accent}35`, background: `${accent}15` }}
                      >
                        <span className="flex items-center gap-2">
                          <Sparkles size={14} style={{ color: accent }} />
                          <span>Interactive Preview Link</span>
                        </span>
                        <ExternalLink size={12} className="text-white/40" />
                      </div>
                      <div
                        className="w-full py-2.5 px-3 rounded-xl border border-white/10 bg-black/40 flex items-center justify-between text-xs font-semibold text-[#E5E7EB]/80"
                      >
                        <span className="flex items-center gap-2">
                          <Palette size={14} className="text-white/50" />
                          <span>Custom Color & Effects</span>
                        </span>
                        <ExternalLink size={12} className="text-white/40" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Left "Template by: [Logo] [Name]" Bar */}
                <div className="relative z-30 p-4 border-t border-white/10 bg-black/70 backdrop-blur-xl flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5 text-xs text-[#E5E7EB]/80">
                    <span className="text-[11px] uppercase tracking-wider text-white/50 font-bold">
                      Template by:
                    </span>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white font-semibold">
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-black" style={{ backgroundColor: accent }}>
                        {previewTemplate.owner_username.charAt(0).toUpperCase()}
                      </span>
                      <span>@{previewTemplate.owner_username}</span>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-white/50">
                    Layout: <strong className="text-white font-semibold">{s.layout || "classic"}</strong> · Effect: <strong className="text-white font-semibold">{s.bg_effect || "none"}</strong>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Publish Modal */}
      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="max-w-lg bg-[#0c0e18] border border-[#2b384e] text-white p-5 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="text-base font-bold text-white font-display">
            Publish Template
          </DialogTitle>
          <form onSubmit={handlePublish} className="space-y-4 pt-2 text-xs">
            <div className="space-y-1.5">
              <label className="text-white/80 font-semibold block">Template Name</label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Name"
                className="bg-[#07080c] border-white/10 text-white text-xs h-9 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-white/80 font-semibold block">Description</label>
              <Textarea
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                placeholder="Description"
                rows={2}
                className="bg-[#07080c] border-white/10 text-white text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/80 font-semibold block mb-1">Visibility</label>
                <select
                  value={templateVisibility}
                  onChange={(e) => setTemplateVisibility(e.target.value)}
                  className="w-full h-9 rounded-xl bg-[#07080c] border border-white/10 text-xs text-white px-3 focus:border-[#5B8DB8]"
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="role">Role Restricted</option>
                  <option value="private">Private</option>
                </select>
              </div>

              {templateVisibility === "role" && (
                <div>
                  <label className="text-white/80 font-semibold block mb-1">Target Role</label>
                  <Input
                    value={templateRole}
                    onChange={(e) => setTemplateRole(e.target.value)}
                    placeholder="e.g. booster"
                    className="bg-[#07080c] border-white/10 text-white text-xs h-9 rounded-xl"
                  />
                </div>
              )}
            </div>

            {/* Inclusions */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-xs font-bold text-white block">Included Components</span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-white/80">
                <button
                  type="button"
                  onClick={() => setIncludeTheme(!includeTheme)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[#07080c] border border-white/10 text-left hover:border-white/20"
                >
                  {includeTheme ? <CheckSquare size={14} className="text-[#5B8DB8]" /> : <Square size={14} />}
                  <span>Theme & Colors</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIncludeLayout(!includeLayout)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[#07080c] border border-white/10 text-left hover:border-white/20"
                >
                  {includeLayout ? <CheckSquare size={14} className="text-[#5B8DB8]" /> : <Square size={14} />}
                  <span>Layout & Blur</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIncludeAudio(!includeAudio)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[#07080c] border border-white/10 text-left hover:border-white/20"
                >
                  {includeAudio ? <CheckSquare size={14} className="text-[#5B8DB8]" /> : <Square size={14} />}
                  <span>Audio Tracks</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIncludeSlideshow(!includeSlideshow)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[#07080c] border border-white/10 text-left hover:border-white/20"
                >
                  {includeSlideshow ? <CheckSquare size={14} className="text-[#5B8DB8]" /> : <Square size={14} />}
                  <span>Slideshow</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIncludeLinks(!includeLinks)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[#07080c] border border-white/10 text-left hover:border-white/20"
                >
                  {includeLinks ? <CheckSquare size={14} className="text-[#5B8DB8]" /> : <Square size={14} />}
                  <span>Social Links</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIncludeFonts(!includeFonts)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[#07080c] border border-white/10 text-left hover:border-white/20"
                >
                  {includeFonts ? <CheckSquare size={14} className="text-[#5B8DB8]" /> : <Square size={14} />}
                  <span>Fonts</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPublishOpen(false)}
                className="border-white/10 hover:bg-white/5 text-xs text-white/70 h-8 rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={publishing || !templateName.trim()}
                className="bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold h-8 px-4 rounded-xl shadow-md cursor-pointer"
              >
                {publishing ? "Publishing..." : "Publish"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModal.open} onOpenChange={(o) => !o && setEditModal({ ...editModal, open: false })}>
        <DialogContent className="max-w-md bg-[#0c0e18] border border-[#2b384e] text-white p-5 rounded-2xl shadow-2xl">
          <DialogTitle className="text-base font-bold text-white font-display">
            Edit Template
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
                className="border-white/10 hover:bg-white/5 text-xs text-white/70 h-8 rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingEdit || !editModal.name.trim()}
                className="bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold h-8 px-4 rounded-xl shadow-md cursor-pointer"
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
