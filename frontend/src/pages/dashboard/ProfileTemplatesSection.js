import React, { useState, useEffect } from "react";
import { useAuth, api } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Check, Eye, Loader2, Plus, Search,
  Trash2, Edit3, CheckSquare, Square
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

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
    accent: t.settings?.accent_color || "#5B8DB8",
    bg_gradient: "from-blue-950/40 via-purple-950/20 to-[#08090d]",
    settings: t.settings || {},
    owner_id: t.owner_id,
    owner_username: t.owner_username,
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
            Apply profile layouts, color accents, backgrounds, and fonts
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
              placeholder="Search templates..."
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

            return (
              <div
                key={t.id}
                className="rounded-2xl bg-[#0c0e18] border border-white/10 hover:border-[#5B8DB8]/50 overflow-hidden flex flex-col justify-between group transition-all shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
              >
                {/* Card Banner */}
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
                          {t.target_role || "Role"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(t)}
                          className="w-6 h-6 rounded-lg bg-black/50 hover:bg-[#5B8DB8] text-white flex items-center justify-center text-xs transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={11} />
                        </button>
                      )}
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(t.id, t.name)}
                          className="w-6 h-6 rounded-lg bg-black/50 hover:bg-red-500 text-white flex items-center justify-center text-xs transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                      <span className="text-[10px] text-white/60 font-mono">
                        {t.author}
                      </span>
                    </div>
                  </div>

                  {/* Header Title */}
                  <div className="flex items-center gap-2 z-10">
                    <div
                      className="w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold shadow-md"
                      style={{ backgroundColor: t.accent, color: "#000" }}
                    >
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{t.name}</div>
                      <div className="text-[10px] text-[#E5E7EB]/60 font-mono">{t.settings?.font_family || "Inter"}</div>
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
                      {t.settings?.layout || "classic"}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-white/70 border border-white/5">
                      {t.settings?.bg_effect || "none"}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-white/70 border border-white/5">
                      {t.settings?.font_family || "Inter"}
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
                      className="flex-1 bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold h-8 rounded-xl shadow-md gap-1 cursor-pointer"
                    >
                      {isApplying ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <>
                          <Check size={12} /> Equip
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

      {/* Inspect Modal */}
      <Dialog open={Boolean(previewTemplate)} onOpenChange={(o) => !o && setPreviewTemplate(null)}>
        <DialogContent className="w-[620px] max-w-[calc(100vw-2rem)] bg-[#0c0e18] border border-[#2b384e] text-white p-5 rounded-2xl shadow-2xl">
          {previewTemplate && (
            <div className="space-y-4">
              <DialogTitle className="text-base font-bold text-white font-display">
                {previewTemplate.name}
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
                  <span className="text-[10px] text-white/40 uppercase font-bold block">Name Effect</span>
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
                className="border-white/10 hover:bg-white/5 text-xs text-white/70 h-8 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={publishing || !templateName.trim()}
                className="bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold h-8 px-4 rounded-xl shadow-md"
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
