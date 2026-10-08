import React, { useEffect, useState } from "react";
import { useAuth, api, fileUrl } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/pages/dashboard/Editor";
import { Check, Clock3, LayoutTemplate, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { renderBioText } from "@/lib/textEffects";
import { MediaDisplay } from "@/components/MediaDisplay";

export default function ProfileTemplatesSection() {
  const { user, setUser } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [targetRole, setTargetRole] = useState("user");
  const [roles, setRoles] = useState(["user", "admin"]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    let active = true;
    api.get("/templates?limit=200")
      .then(({ data }) => { if (active) setTemplates(Array.isArray(data) ? data : []); })
      .catch(() => { if (active) toast.error("Could not load shared templates."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    api.get("/template-roles")
      .then(({ data }) => {
        if (!active || !Array.isArray(data) || data.length === 0) return;
        setRoles(data);
        setTargetRole((current) => data.includes(current) ? current : data[0]);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const ownedCount = templates.filter((template) => template.owner_id === user.id).length;
  const filteredTemplates = templates.filter((template) => `${template.name} ${template.owner_username} ${template.description}`.toLowerCase().includes(search.trim().toLowerCase()));

  const saveCurrentBio = async (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return toast.error("Enter a template name.");
    if (ownedCount >= 3) return toast.error("Delete one of your templates before publishing another.");

    setSaving(true);
    try {
      const { data: linkData } = await api.get("/links");
      const settings = { ...(user.settings || {}) };
      delete settings.profile_templates;
      const { data } = await api.post("/templates", {
        name: trimmedName,
        visibility,
        target_role: visibility === "role" ? targetRole : "",
        display_name: user.display_name || "",
        description: user.description || "",
        settings,
        links: Array.isArray(linkData) ? linkData : [],
      });
      setTemplates((current) => [data, ...current.filter((template) => template.id !== data.id)]);
      setName("");
      toast.success("Bio published to the shared library.");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not save this template.");
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = async (template) => {
    setActiveId(template.id);
    try {
      const { data } = await api.post(`/templates/${template.id}/apply`);
      setUser(data.user);
      toast.success(`Applied “${template.name}”.`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not apply this template.");
    } finally {
      setActiveId(null);
    }
  };

  const deleteTemplate = async (template) => {
    setActiveId(template.id);
    try {
      await api.delete(`/templates/${template.id}`);
      setTemplates((current) => current.filter((item) => item.id !== template.id));
      toast.success(`Deleted “${template.name}”.`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not delete this template.");
    } finally {
      setActiveId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Header title="Bio Templates" subtitle="Publish a full bio design for everyone, a role, or just yourself." />

      <form onSubmit={saveCurrentBio} className="flex flex-col gap-2 rounded-lg border border-white/10 bg-black/20 p-3">
        <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={48}
          placeholder="Name this snapshot"
          aria-label="Template name"
          className="min-w-0 flex-1 bg-[#08090B]/70 border-white/10"
        />
        <span className="self-center px-2 text-xs tabular-nums text-white/50">{ownedCount}/3</span>
        <Button type="submit" disabled={saving || loading || ownedCount >= 3} className="h-10 gap-2 bg-[#5B8DB8] text-white hover:bg-[#4A6B8A]">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          Publish current bio
        </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="flex flex-1 items-center gap-2 text-xs text-white/60">
            Visibility
            <select value={visibility} onChange={(event) => setVisibility(event.target.value)} className="h-9 flex-1 rounded-md border border-white/10 bg-[#08090B] px-2 text-sm text-white">
              <option value="public">Public</option>
              <option value="role">Specific role</option>
              <option value="private">Private</option>
            </select>
          </label>
          {visibility === "role" && <label className="flex flex-1 items-center gap-2 text-xs text-white/60">
            Visible to
            <select value={targetRole} onChange={(event) => setTargetRole(event.target.value)} className="h-9 flex-1 rounded-md border border-white/10 bg-[#08090B] px-2 text-sm text-white">
              {roles.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
          </label>}
        </div>
      </form>

      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search shared templates" className="h-10 border-white/10 bg-black/25 pl-9 text-sm" />
      </div>

      {loading ? (
        <div className="flex min-h-40 items-center justify-center text-[#7db5e3]"><Loader2 size={20} className="animate-spin" /></div>
      ) : filteredTemplates.length === 0 ? (
        <div className="flex min-h-52 flex-col items-center justify-center gap-2 border border-dashed border-white/15 text-center">
          <LayoutTemplate size={22} className="text-white/35" />
          <div className="text-sm font-medium text-white/75">{search ? "No matching templates" : "No shared templates yet"}</div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.map((template) => {
            const isBusy = activeId === template.id;
            const isOwner = template.owner_id === user.id;
            const settings = template.settings || {};
            const accent = settings.accent_color || "#5B8DB8";
            return (
              <article key={template.id} className="overflow-hidden border border-white/10 bg-[#111419]">
                <div className="relative flex h-28 items-end gap-3 overflow-hidden p-3" style={{ background: `linear-gradient(135deg, ${accent}44, #111419 72%)` }}>
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 bg-black/45" style={{ borderColor: accent }}>
                    {settings.pfp ? <MediaDisplay src={fileUrl(settings.pfp)} alt="" className="h-full w-full rounded-full object-cover" /> : <LayoutTemplate size={18} style={{ color: accent }} />}
                  </div>
                  <div className="relative min-w-0 pb-1">
                    <div className="truncate text-sm font-semibold text-white">{renderBioText(template.display_name || template.owner_username)}</div>
                    <div className="truncate text-xs text-white/60">by @{template.owner_username}</div>
                  </div>
                  <div className="relative ml-auto self-start rounded border border-white/10 bg-black/35 px-2 py-1 text-[10px] text-white/65">
                    @{template.owner_username}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-white">{template.name}</h2>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-white/45">
                      <Clock3 size={11} /> {template.visibility === "private" ? "Private" : template.visibility === "role" ? `Role: ${template.target_role}` : template.created_at ? new Date(template.created_at).toLocaleDateString() : "Public"}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button type="button" size="sm" disabled={isBusy} onClick={() => applyTemplate(template)} className="h-8 gap-1.5 bg-[#5B8DB8] px-3 text-xs text-white hover:bg-[#4A6B8A]">
                      {isBusy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      Apply
                    </Button>
                    {isOwner && <Button type="button" size="icon" variant="outline" disabled={isBusy} onClick={() => deleteTemplate(template)} title={`Delete ${template.name}`} aria-label={`Delete ${template.name}`} className="h-8 w-8 border-white/15 text-white/65 hover:text-red-300"><Trash2 size={14} /></Button>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
