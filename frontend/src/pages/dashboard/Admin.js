import React, { useEffect, useState } from "react";
import { api } from "@/lib/auth";
import { Header, Panel, ToggleRow, SliderRow, SelectRow, ColorRow } from "@/components/DashboardUI";
import { BADGE_DEFS } from "@/pages/dashboard/badges";
import { renderBioText } from "@/lib/textEffects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RTooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";
import {
  MoreVertical, Trash2, Award, ExternalLink, Copy, Plus, Globe, Save,
  Search, Shield, ShieldAlert, Check, CheckSquare, Square, Eye, Sparkles, UserCheck, Crown
} from "lucide-react";
import { brandIcon } from "@/lib/brandIcons";

const PLATFORMS = ["discord", "twitter", "youtube", "twitch", "instagram", "tiktok", "telegram", "github", "spotify", "kick", "website"];
const COLORS = ["#5B8DB8", "#4A6B8A", "#eab308", "#22c55e", "#ef4444", "#a855f7", "#f97316", "#ec4899", "#06b6d4"];
const ROLES = [
  { id: "user", label: "User", color: "#94A3B8" },
  { id: "vip", label: "VIP / Premium", color: "#F59E0B" },
  { id: "moderator", label: "Moderator", color: "#A855F7" },
  { id: "verified", label: "Verified", color: "#3B82F6" },
  { id: "partner", label: "Partner", color: "#10B981" },
  { id: "admin", label: "Admin", color: "#EF4444" },
];

export function AdminSiteSettings() {
  const [site, setSite] = useState(null);
  useEffect(() => { api.get("/site").then(({ data }) => setSite(data)); }, []);
  if (!site) return <div><Header title="Site Content" /><p className="text-[#E5E7EB]/40 mt-6">Loading…</p></div>;

  const setSocial = (i, key, val) => { const s = [...site.socials]; s[i] = { ...s[i], [key]: val }; setSite({ ...site, socials: s }); };
  const addSocial = () => setSite({ ...site, socials: [...site.socials, { platform: "website", url: "" }] });
  const removeSocial = (i) => setSite({ ...site, socials: site.socials.filter((_, idx) => idx !== i) });
  const save = async () => { const { data } = await api.put("/admin/site", { socials: site.socials, discord_invite: site.discord_invite, support_email: site.support_email }); setSite(data); toast.success("Site content saved. It's live on the homepage."); };

  return (
    <div>
      <Header title="Site Content" subtitle="Edit the homepage footer socials, Discord invite & support links." action={
        <Button data-testid="site-save-btn" onClick={save} className="rounded-full bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white gap-2"><Save size={16} /> Save</Button>
      } />
      <div className="space-y-4 mt-6">
        <Panel title="Footer social links">
          {site.socials.map((s, i) => {
            const Ic = brandIcon(s.platform);
            return (
              <div key={i} data-testid={`site-social-${i}`} className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-lg bg-[#5B8DB8]/15 flex items-center justify-center text-[#5B8DB8] shrink-0"><Ic size={16} /></span>
                <select value={s.platform} onChange={(e) => setSocial(i, "platform", e.target.value)} className="bg-[#08090B]/60 border border-[#4A6B8A]/30 rounded-lg text-sm px-2 py-2 text-[#E5E7EB]">
                  {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <Input value={s.url} onChange={(e) => setSocial(i, "url", e.target.value)} placeholder="https://" className="bg-[#08090B]/60 border-[#4A6B8A]/30 flex-1" />
                <button onClick={() => removeSocial(i)} className="text-red-400/70 hover:text-red-400 shrink-0"><Trash2 size={16} /></button>
              </div>
            );
          })}
          <Button onClick={addSocial} size="sm" variant="outline" className="border-[#4A6B8A]/40 rounded-full gap-2"><Plus size={14} /> Add social</Button>
        </Panel>
        <Panel title="Contact & community">
          <div><Label className="text-[#E5E7EB]/70 text-xs">Discord invite URL</Label><Input value={site.discord_invite || ""} onChange={(e) => setSite({ ...site, discord_invite: e.target.value })} className="bg-[#08090B]/60 border-[#4A6B8A]/30 mt-1.5" /></div>
          <div><Label className="text-[#E5E7EB]/70 text-xs">Support email</Label><Input value={site.support_email || ""} onChange={(e) => setSite({ ...site, support_email: e.target.value })} className="bg-[#08090B]/60 border-[#4A6B8A]/30 mt-1.5" /></div>
        </Panel>
      </div>
    </div>
  );
}

export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editUser, setEditUser] = useState(null);
  const [selectedUsername, setSelectedUsername] = useState("");
  const [selectedDisplayName, setSelectedDisplayName] = useState("");
  const [selectedSubdomain, setSelectedSubdomain] = useState("");
  const [selectedBadges, setSelectedBadges] = useState([]);
  const [selectedRole, setSelectedRole] = useState("user");
  const [selectedViews, setSelectedViews] = useState(0);
  const [badgeSearch, setBadgeSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => api.get("/admin/users").then(({ data }) => setUsers(Array.isArray(data) ? data : [])).catch(() => setUsers([]));
  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this user?")) return;
    await api.delete(`/admin/users/${id}`);
    load();
    toast.success("User deleted.");
  };

  const openManager = (u) => {
    setEditUser(u);
    setSelectedUsername(u.username || "");
    setSelectedDisplayName(u.display_name || "");
    setSelectedSubdomain(u.subdomain || "");
    setSelectedBadges(u.badges || []);
    setSelectedRole(u.role || "user");
    setSelectedViews(u.views || 0);
    setBadgeSearch("");
  };

  const toggleBadge = (badgeId) => {
    if (selectedBadges.includes(badgeId)) {
      setSelectedBadges(selectedBadges.filter((b) => b !== badgeId));
    } else {
      setSelectedBadges([...selectedBadges, badgeId]);
    }
  };

  const selectAllBadges = () => {
    setSelectedBadges(BADGE_DEFS.map((b) => b.id));
  };

  const clearAllBadges = () => {
    setSelectedBadges([]);
  };

  const saveUserManager = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await api.put(`/admin/users/${editUser.id}`, {
        username: selectedUsername,
        display_name: selectedDisplayName,
        subdomain: selectedSubdomain,
        role: selectedRole,
        badges: selectedBadges,
        views: Number(selectedViews) || 0,
      });
      setEditUser(null);
      await load();
      toast.success("User roles and badges updated successfully.");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to update user.");
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesQuery =
      u.username?.toLowerCase().includes(query.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(query.toLowerCase()) ||
      u.email?.toLowerCase().includes(query.toLowerCase()) ||
      u.invite_code_used?.toLowerCase().includes(query.toLowerCase());
    const matchesRole = roleFilter === "all" || (u.role || "user") === roleFilter;
    return matchesQuery && matchesRole;
  });

  const bulkResetViews = async (mode = "filtered") => {
    const targetIds = mode === "filtered" ? filteredUsers.map((u) => u.id) : users.map((u) => u.id);
    if (!targetIds.length) {
      toast.error("No users to reset.");
      return;
    }
    if (!window.confirm(mode === "filtered" ? `Reset views for ${targetIds.length} filtered users?` : `Reset views for all ${targetIds.length} users?`)) return;
    try {
      await api.post("/admin/users/bulk-reset-views", { user_ids: targetIds, all_users: mode === "all" });
      await load();
      toast.success(mode === "all" ? "All user views were reset." : "Filtered user views were reset.");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not reset views.");
    }
  };

  const bulkRoleSet = async (role) => {
    const targetIds = filteredUsers.map((u) => u.id);
    if (!targetIds.length) {
      toast.error("No users in the current filter.");
      return;
    }
    if (!window.confirm(`Set ${targetIds.length} filtered users to ${role}?`)) return;
    try {
      await api.post("/admin/users/bulk-role", { user_ids: targetIds, role });
      await load();
      toast.success(`Updated ${targetIds.length} users to ${role}.`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Bulk role update failed.");
    }
  };

  const wipeViewEvents = async () => {
    if (!window.confirm("Delete all saved view-event fingerprints? This resets anti-abuse tracking data.")) return;
    try {
      await api.post("/admin/views/wipe-events");
      toast.success("View-event tracking was wiped.");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not wipe event data.");
    }
  };

  const getRoleBadge = (role) => {
    const found = ROLES.find((r) => r.id === role) || ROLES[0];
    return (
      <span
        className="px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border uppercase"
        style={{
          color: found.color,
          borderColor: `${found.color}55`,
          background: `${found.color}15`,
        }}
      >
        {found.label}
      </span>
    );
  };

  return (
    <div>
      <Header
        title="User Management"
        subtitle={`${users.length} registered operators across all access tiers.`}
      />

      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => bulkResetViews("filtered")}
          className="rounded-full border border-[#5B8DB8]/40 bg-[#5B8DB8]/10 text-[#5B8DB8] hover:bg-[#5B8DB8]/20"
        >
          Reset filtered views
        </Button>
        <Button
          size="sm"
          onClick={() => bulkResetViews("all")}
          className="rounded-full border border-[#ef4444]/30 bg-[#ef4444]/10 text-[#fca5a5] hover:bg-[#ef4444]/20"
        >
          Wipe all views
        </Button>
        <Button
          size="sm"
          onClick={wipeViewEvents}
          className="rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#fbbf24] hover:bg-[#f59e0b]/20"
        >
          Wipe view events
        </Button>
        <Button
          size="sm"
          onClick={() => bulkRoleSet("user")}
          className="rounded-full border border-white/10 bg-white/5 text-[#E5E7EB] hover:bg-white/10"
        >
          Set filter to user
        </Button>
      </div>

      {/* Control Bar: Search & Role Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E5E7EB]/40" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search username, email, display name..."
            className="pl-9 bg-[#08090B]/60 border-[#4A6B8A]/30 text-xs rounded-xl h-10"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setRoleFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              roleFilter === "all" ? "bg-[#5B8DB8] text-white" : "bg-white/5 text-[#E5E7EB]/60 hover:text-white"
            }`}
          >
            All ({users.length})
          </button>
          {ROLES.map((r) => {
            const count = users.filter((u) => (u.role || "user") === r.id).length;
            return (
              <button
                key={r.id}
                onClick={() => setRoleFilter(r.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  roleFilter === r.id ? "bg-[#5B8DB8] text-white" : "bg-white/5 text-[#E5E7EB]/60 hover:text-white"
                }`}
              >
                {r.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Users Table */}
      <div className="swat-glass rounded-2xl mt-4 overflow-x-auto border border-[#4A6B8A]/20">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-[#4A6B8A]/20 text-[#E5E7EB]/50 text-left">
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Email</th>
              <th className="p-4">Views</th>
              <th className="p-4">Invite</th>
              <th className="p-4">Badges ({BADGE_DEFS.length} available)</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[#E5E7EB]/40">
                  No users found matching your filters.
                </td>
              </tr>
            )}
            {filteredUsers.map((u) => (
              <tr key={u.id} data-testid={`admin-user-${u.id}`} className="border-b border-[#4A6B8A]/10 hover:bg-white/[0.02] transition-colors">
                <td className="p-4">
                  <div className="font-semibold text-[#E5E7EB]">{renderBioText(u.display_name || u.username)}</div>
                  <div className="text-xs text-[#5B8DB8] font-mono">@{u.username}</div>
                  {u.subdomain && <div className="text-[10px] text-white/40">{u.subdomain}.swats.bio</div>}
                </td>
                <td className="p-4">{getRoleBadge(u.role || "user")}</td>
                <td className="p-4 text-[#E5E7EB]/60 text-xs">{u.email}</td>
                <td className="p-4 text-[#E5E7EB]/70 font-mono text-xs">{u.views || 0}</td>
                <td className="p-4 font-mono text-xs text-[#5B8DB8]">{u.invite_code_used || "—"}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {(u.badges || []).slice(0, 3).map((b) => (
                      <span key={b} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-[#E5E7EB]/80 font-mono">
                        {b}
                      </span>
                    ))}
                    {(u.badges || []).length > 3 && (
                      <span className="px-1.5 py-0.5 rounded bg-[#5B8DB8]/20 text-[10px] text-[#5B8DB8] font-bold">
                        +{u.badges.length - 3}
                      </span>
                    )}
                    {(u.badges || []).length === 0 && <span className="text-[11px] text-[#E5E7EB]/30">None</span>}
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openManager(u)}
                      className="border-[#4A6B8A]/40 hover:border-[#5B8DB8] text-xs h-8 px-3 rounded-lg gap-1.5"
                    >
                      <Award size={13} className="text-[#5B8DB8]" /> Manage
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button data-testid={`admin-user-menu-${u.id}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#E5E7EB]/50 hover:text-white hover:bg-white/5 transition-all">
                          <MoreVertical size={16} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#161a22] border-[#4A6B8A]/40 text-[#E5E7EB]">
                        <DropdownMenuItem onClick={() => window.open(`/${encodeURIComponent(u.username)}`, "_blank")}>
                          <ExternalLink size={14} className="mr-2" /> View Public Bio
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openManager(u)}>
                          <Award size={14} className="mr-2 text-[#5B8DB8]" /> Edit Role & Badges
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => del(u.id)} className="text-red-400 focus:text-red-300">
                          <Trash2 size={14} className="mr-2" /> Delete Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role Giving & Multi-Select Badges Dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="bg-[#0d0f14]/95 backdrop-blur-2xl border-[#4A6B8A]/40 text-[#E5E7EB] max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <Crown className="text-[#5B8DB8]" size={18} /> Manage Roles & Badges: @{editUser?.username}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#E5E7EB]/80">Alias / username</Label>
                <Input value={selectedUsername} onChange={(event) => setSelectedUsername(event.target.value)} maxLength={20} className="bg-[#161a22] border-[#4A6B8A]/30 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#E5E7EB]/80">Display name</Label>
                <Input value={selectedDisplayName} onChange={(event) => setSelectedDisplayName(event.target.value)} maxLength={64} className="bg-[#161a22] border-[#4A6B8A]/30 text-xs" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold text-[#E5E7EB]/80">Profile subdomain</Label>
                <div className="flex items-center gap-2">
                  <Input value={selectedSubdomain} onChange={(event) => setSelectedSubdomain(event.target.value.toLowerCase())} placeholder="optional-name" maxLength={32} className="bg-[#161a22] border-[#4A6B8A]/30 text-xs" />
                  <span className="shrink-0 text-xs text-white/45">.swats.bio</span>
                </div>
              </div>
            </div>
            <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-[11px] text-white/45">
              Profile URL: {selectedSubdomain ? `https://${selectedSubdomain}.swats.bio` : `https://www.swats.bio/${encodeURIComponent(selectedUsername || editUser?.username || "")}`}
            </div>
            {/* Primary Role Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#E5E7EB]/80 uppercase tracking-wider">
                Primary Account Role
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => {
                  const active = selectedRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRole(r.id)}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                        active
                          ? "border-[#5B8DB8] bg-[#5B8DB8]/20 shadow-[0_0_12px_rgba(91,141,184,0.3)] text-white"
                          : "border-white/10 bg-white/[0.03] text-[#E5E7EB]/70 hover:bg-white/[0.08]"
                      }`}
                    >
                      <span style={{ color: r.color }}>{r.label}</span>
                      {active && <Check size={14} className="text-[#5B8DB8]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Views counter override */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#E5E7EB]/80 uppercase tracking-wider">
                Profile Views Override
              </Label>
              <Input
                type="number"
                value={selectedViews}
                onChange={(e) => setSelectedViews(e.target.value)}
                className="bg-[#161a22] border-[#4A6B8A]/30 text-xs font-mono"
              />
            </div>

            {/* Badges Multi-Select Section */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold text-[#E5E7EB]/80 uppercase tracking-wider">
                    Badges Multi-Select ({selectedBadges.length} selected)
                  </Label>
                  <p className="text-[11px] text-[#E5E7EB]/40">
                    Click any badge to toggle on or off. Multi-select as many as needed.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={selectAllBadges}
                    className="h-7 px-2 text-[11px] text-[#5B8DB8] hover:bg-[#5B8DB8]/15"
                  >
                    Select All
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearAllBadges}
                    className="h-7 px-2 text-[11px] text-[#E5E7EB]/50 hover:bg-white/10"
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Badge Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#E5E7EB]/40" />
                <Input
                  value={badgeSearch}
                  onChange={(e) => setBadgeSearch(e.target.value)}
                  placeholder="Filter badges by name..."
                  className="pl-8 bg-[#161a22] border-[#4A6B8A]/30 text-xs rounded-lg h-8"
                />
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {BADGE_DEFS.filter((b) => b.name.toLowerCase().includes(badgeSearch.toLowerCase())).map((b) => {
                  const isChecked = selectedBadges.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => toggleBadge(b.id)}
                      className={`text-left p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                        isChecked
                          ? "border-[#5B8DB8]/80 bg-[#5B8DB8]/15 shadow-sm text-white"
                          : "border-white/10 bg-white/[0.02] text-[#E5E7EB]/60 hover:bg-white/5"
                      }`}
                    >
                      <div className="shrink-0 text-[#5B8DB8]">
                        {isChecked ? <CheckSquare size={16} /> : <Square size={16} className="text-[#E5E7EB]/30" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate" style={{ color: b.color || "#E5E7EB" }}>
                          {b.name}
                        </div>
                        <div className="text-[10px] text-[#E5E7EB]/40 truncate">{b.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 pt-3 border-t border-white/10">
            <Button variant="ghost" onClick={() => setEditUser(null)} className="text-xs">
              Cancel
            </Button>
            <Button
              onClick={saveUserManager}
              disabled={saving}
              className="bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white text-xs font-semibold gap-1.5"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AdminInvites() {
  const [invites, setInvites] = useState([]);
  const [prefix, setPrefix] = useState("SWAT-");
  const [maxUses, setMaxUses] = useState(1);
  const [count, setCount] = useState(10);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // "all" | "active" | "used"
  const [selectedIds, setSelectedIds] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  const load = () =>
    api
      .get("/admin/invites")
      .then(({ data }) => setInvites(Array.isArray(data) ? data : []))
      .catch(() => setInvites([]));

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post("/admin/invites", {
        prefix: prefix.trim() || "SWAT-",
        max_uses: Number(maxUses) || 1,
        count: Number(count) || 1,
      });
      await load();
      toast.success(`Generated ${data.count} invite code(s)!`);
    } catch (e) {
      toast.error("Failed to generate invite codes.");
    } finally {
      setGenerating(false);
    }
  };

  const deleteOne = async (id, code) => {
    if (!window.confirm(`Delete invite code ${code}?`)) return;
    try {
      await api.delete(`/admin/invites/${id}`);
      setInvites((prev) => prev.filter((i) => i.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      toast.success(`Deleted ${code}`);
    } catch (e) {
      toast.error("Failed to delete code.");
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected invite code(s)?`)) return;
    try {
      await api.post("/admin/invites/delete-batch", { ids: selectedIds });
      await load();
      setSelectedIds([]);
      toast.success("Deleted selected invite codes.");
    } catch (e) {
      toast.error("Failed to delete batch.");
    }
  };

  const cleanupExhausted = async () => {
    if (!window.confirm("Delete all invite codes that have reached their max uses?")) return;
    setCleaning(true);
    try {
      const { data } = await api.post("/admin/invites/cleanup-used");
      await load();
      toast.success(`Cleaned up ${data.deleted_count || 0} exhausted code(s).`);
    } catch (e) {
      toast.error("Cleanup failed.");
    } finally {
      setCleaning(false);
    }
  };

  const copy = (c) => {
    navigator.clipboard.writeText(c);
    toast.success(`Copied ${c}`);
  };

  const copyAllFiltered = () => {
    const text = filteredInvites.map((i) => i.code).join("\n");
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${filteredInvites.length} code(s) to clipboard!`);
  };

  const filteredInvites = invites.filter((i) => {
    const matchSearch = i.code.toLowerCase().includes(search.toLowerCase());
    const isExhausted = i.uses >= i.max_uses;
    if (!matchSearch) return false;
    if (filter === "active") return !isExhausted;
    if (filter === "used") return isExhausted;
    return true;
  });

  const allSelected = filteredInvites.length > 0 && filteredInvites.every((i) => selectedIds.includes(i.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInvites.map((i) => i.id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-6">
      <Header title="Invite Codes & Access Keys" subtitle="Generate mass invitation keys, manage batch quotas, and purge used codes." />

      {/* Mass Generator Panel */}
      <Panel title="Mass Invite Code Generator">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <Label className="text-[#E5E7EB]/70 text-xs">Prefix</Label>
            <Input
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="e.g. SWAT-, VIP-, BETA-"
              className="bg-[#08090B]/60 border-[#4A6B8A]/30 mt-1.5 font-mono uppercase"
            />
          </div>
          <div>
            <Label className="text-[#E5E7EB]/70 text-xs">Max Uses Per Code</Label>
            <Input
              type="number"
              min="1"
              max="1000"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              className="bg-[#08090B]/60 border-[#4A6B8A]/30 mt-1.5"
            />
          </div>
          <div>
            <Label className="text-[#E5E7EB]/70 text-xs">Quantity (1 to 250)</Label>
            <Input
              type="number"
              min="1"
              max="250"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="bg-[#08090B]/60 border-[#4A6B8A]/30 mt-1.5"
            />
          </div>
          <Button
            data-testid="create-invites-btn"
            onClick={create}
            disabled={generating}
            className="bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white gap-2 font-bold h-10 shadow-lg"
          >
            <Plus size={16} /> {generating ? "Generating..." : `Generate ${count} Code(s)`}
          </Button>
        </div>
      </Panel>

      {/* Filter and Bulk Action Bar */}
      <div className="p-4 rounded-2xl swat-glass border border-[#4A6B8A]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search size={15} className="text-[#E5E7EB]/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search codes..."
            className="bg-black/40 border-white/10 text-xs h-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex rounded-xl bg-black/40 border border-white/10 p-0.5">
            {["all", "active", "used"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filter === f ? "bg-[#5B8DB8] text-white" : "text-[#E5E7EB]/60 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <Button
            onClick={copyAllFiltered}
            variant="outline"
            size="sm"
            className="rounded-xl border-white/15 text-xs h-8 gap-1.5"
          >
            <Copy size={13} /> Copy All ({filteredInvites.length})
          </Button>

          {selectedIds.length > 0 && (
            <Button
              onClick={deleteSelected}
              size="sm"
              className="rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs h-8 gap-1.5"
            >
              <Trash2 size={13} /> Delete Selected ({selectedIds.length})
            </Button>
          )}

          <Button
            onClick={cleanupExhausted}
            disabled={cleaning}
            variant="outline"
            size="sm"
            className="rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs h-8 gap-1.5"
          >
            <Trash2 size={13} /> Clean Used
          </Button>
        </div>
      </div>

      {/* Invites Table */}
      <div className="swat-glass rounded-3xl overflow-hidden border border-[#4A6B8A]/30">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[#E5E7EB]/50 text-left bg-black/30 text-xs uppercase tracking-wider">
                <th className="p-4 w-10">
                  <button onClick={toggleSelectAll} className="text-[#5B8DB8]">
                    {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </th>
                <th className="p-4">Invite Code</th>
                <th className="p-4">Quota</th>
                <th className="p-4">Used By</th>
                <th className="p-4">Created Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvites.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#E5E7EB]/40">
                    No invite codes found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredInvites.map((i) => {
                  const isSelected = selectedIds.includes(i.id);
                  const isExhausted = i.uses >= i.max_uses;
                  return (
                    <tr
                      key={i.id}
                      data-testid={`invite-${i.code}`}
                      className={`border-b border-white/5 transition-colors ${
                        isSelected ? "bg-[#5B8DB8]/15" : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <td className="p-4">
                        <button onClick={() => toggleSelectOne(i.id)} className="text-[#5B8DB8]">
                          {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white tracking-wider">{i.code}</span>
                          {isExhausted ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase">
                              Exhausted
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
                              Active
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs text-[#E5E7EB]/70">
                        {i.uses} / {i.max_uses}
                      </td>
                      <td className="p-4 text-[#E5E7EB]/60 text-xs truncate max-w-[200px]">
                        {(i.used_by || []).join(", ") || "—"}
                      </td>
                      <td className="p-4 text-xs text-[#E5E7EB]/40 font-mono">
                        {i.created_at ? new Date(i.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => copy(i.code)}
                            className="w-8 h-8 rounded-lg hover:bg-white/10 text-[#E5E7EB]/60 hover:text-white flex items-center justify-center transition-all"
                            title="Copy code"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => deleteOne(i.id, i.code)}
                            className="w-8 h-8 rounded-lg hover:bg-red-500/15 text-red-400 flex items-center justify-center transition-all"
                            title="Delete code"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AdminStats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);

  const refreshStats = () => {
    api.get("/admin/stats").then(({ data }) => setStats(data)).catch(() => setError(true));
  };

  useEffect(() => {
    refreshStats();
  }, []);

  if (error) {
    return (
      <div>
        <Header title="System Stats" subtitle="Analytics could not be loaded." />
        <div className="p-6 mt-6 rounded-2xl swat-glass border border-red-500/30 text-red-400 text-sm">
          Failed to load stats. Please ensure your account has administrator privileges.
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div>
        <Header title="System Stats" subtitle="Full swats.bio analytics." />
        <p className="text-[#E5E7EB]/40 mt-6">Loading analytics data…</p>
      </div>
    );
  }

  const cards = [
    ["Total Users", stats.total_users ?? 0, "Registered accounts"],
    ["Total Links", stats.total_links ?? 0, "Active creator links"],
    ["Total Views", stats.total_views ?? 0, "Cumulative bio views"],
    ["Active Invites", stats.total_invites ?? 0, "Created access codes"],
  ];

  const signupsData = Array.isArray(stats.signups) && stats.signups.length > 0 ? stats.signups : [];
  const badgesData = Array.isArray(stats.badges) && stats.badges.length > 0 ? stats.badges : [{ badge: "Standard", count: 1 }];
  const rolesData = Array.isArray(stats.roles) && stats.roles.length > 0 ? stats.roles : [{ role: "User", count: stats.total_users || 1 }];
  const recentActivity = stats.recent_activity || [];

  return (
    <div className="space-y-6">
      <Header title="System Stats & Health" subtitle="Operational telemetry, growth metrics, and audit log." />

      {/* System Telemetry Bar */}
      <div className="p-4 rounded-2xl swat-glass border border-[#4A6B8A]/30 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[#E5E7EB]/60">Database:</span>
          <span className="text-white font-mono font-semibold">{stats.system_status?.database || "Connected"}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          <span className="text-[#E5E7EB]/60">API Uptime:</span>
          <span className="text-white font-mono font-semibold">{stats.system_status?.uptime || "99.99%"}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
          <span className="text-[#E5E7EB]/60">Environment:</span>
          <span className="text-white font-mono font-semibold uppercase">{stats.system_status?.environment || "Production"}</span>
        </div>
      </div>

      <div className="p-4 rounded-2xl swat-glass border border-[#4A6B8A]/30">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#5B8DB8] font-semibold">Quick admin actions</div>
            <div className="text-sm text-[#E5E7EB] font-medium">Platform controls and live system actions</div>
          </div>
          <Button onClick={refreshStats} variant="outline" className="border-[#4A6B8A]/40 text-xs h-8 rounded-full">Refresh</Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-[#4A6B8A]/25 bg-black/20 p-3">
            <div className="text-[10px] uppercase tracking-wider text-[#E5E7EB]/50">Open users</div>
            <div className="mt-2 text-xl font-bold text-white">{stats.total_users ?? 0}</div>
            <div className="text-[11px] text-[#5B8DB8]">User accounts on platform</div>
          </div>
          <div className="rounded-2xl border border-[#4A6B8A]/25 bg-black/20 p-3">
            <div className="text-[10px] uppercase tracking-wider text-[#E5E7EB]/50">Open invites</div>
            <div className="mt-2 text-xl font-bold text-white">{stats.total_invites ?? 0}</div>
            <div className="text-[11px] text-[#5B8DB8]">Active invite codes</div>
          </div>
          <div className="rounded-2xl border border-[#4A6B8A]/25 bg-black/20 p-3">
            <div className="text-[10px] uppercase tracking-wider text-[#E5E7EB]/50">Current environment</div>
            <div className="mt-2 text-xl font-bold text-white uppercase">{stats.system_status?.environment || "Prod"}</div>
            <div className="text-[11px] text-[#5B8DB8]">{stats.system_status?.database || "Connected"}</div>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(([label, val, subtitle]) => (
          <div key={label} className="p-5 rounded-3xl swat-glass border border-[#4A6B8A]/25 flex flex-col justify-between">
            <div className="text-xs font-semibold text-[#E5E7EB]/50 uppercase tracking-wider">{label}</div>
            <div className="font-display text-3xl sm:text-4xl font-black text-white mt-2" style={{ textShadow: "0 0 20px rgba(91,141,184,0.4)" }}>
              {val.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#5B8DB8] mt-2 font-medium">{subtitle}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Signups over last 14 days */}
        <div className="swat-glass rounded-3xl p-5 border border-[#4A6B8A]/25">
          <div className="font-display font-semibold mb-4 text-[#E5E7EB] flex items-center justify-between">
            <span>Daily Signups (14 Days)</span>
            <span className="text-xs text-[#5B8DB8] font-mono font-normal">Active growth</span>
          </div>
          <div className="h-64 w-full">
            {signupsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
                <LineChart data={signupsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4A6B8A22" />
                  <XAxis dataKey="date" stroke="#E5E7EB66" fontSize={11} />
                  <YAxis stroke="#E5E7EB66" fontSize={11} allowDecimals={false} />
                  <RTooltip
                    contentStyle={{
                      background: "#161a22",
                      border: "1px solid #4A6B8A55",
                      borderRadius: 12,
                      color: "#E5E7EB",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#5B8DB8"
                    strokeWidth={2.5}
                    dot={{ fill: "#5B8DB8", r: 3.5 }}
                    activeDot={{ r: 6, fill: "#00E5FF" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#E5E7EB]/40 text-sm">
                No signups recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Badge distribution */}
        <div className="swat-glass rounded-3xl p-5 border border-[#4A6B8A]/25">
          <div className="font-display font-semibold mb-4 text-[#E5E7EB] flex items-center justify-between">
            <span>Badge Distribution</span>
            <span className="text-xs text-[#5B8DB8] font-mono font-normal">Active Members</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
              <PieChart>
                <Pie
                  data={badgesData}
                  dataKey="count"
                  nameKey="badge"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  label={({ badge, count }) => `${badge}: ${count}`}
                >
                  {badgesData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <RTooltip
                  contentStyle={{
                    background: "#161a22",
                    border: "1px solid #4A6B8A55",
                    borderRadius: 12,
                    color: "#E5E7EB",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Audit Feed */}
      <div className="swat-glass rounded-3xl p-6 border border-[#4A6B8A]/25 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-white">Recent Member Activity & Signups</h3>
          <span className="text-xs text-[#5B8DB8] font-mono">Live Audit Trail</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/10 text-[#E5E7EB]/40 uppercase tracking-wider">
                <th className="p-3">User</th>
                <th className="p-3">Role</th>
                <th className="p-3">Invite Code Used</th>
                <th className="p-3">Views</th>
                <th className="p-3 text-right">Registration Time</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-[#E5E7EB]/40">
                    No recent activity records found.
                  </td>
                </tr>
              ) : (
                recentActivity.map((act) => (
                  <tr key={act.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-3 font-semibold text-white">
                      {renderBioText(act.display_name || act.username)} <span className="text-[#5B8DB8] font-mono font-normal">(@{act.username})</span>
                    </td>
                    <td className="p-3 capitalize text-[#E5E7EB]/80">{act.role}</td>
                    <td className="p-3 font-mono text-[#5B8DB8]">{act.invite_code}</td>
                    <td className="p-3 font-mono text-white">{act.views}</td>
                    <td className="p-3 text-right text-[#E5E7EB]/40 font-mono">
                      {act.created_at ? new Date(act.created_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────── */
/* Admin Bot Section: Discord Bot, Leaderboard & User DM Manager */
/* ───────────────────────────────────────────────────────────── */

export function AdminBotSection() {
  const [botData, setBotData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [postingLeaderboard, setPostingLeaderboard] = useState(false);
  const [testingToken, setTestingToken] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [dmModal, setDmModal] = useState({ open: false, user: null, message: "" });
  const [sendingDm, setSendingDm] = useState(false);
  const [customChannel, setCustomChannel] = useState("1557281277734813806");

  const loadBotData = () => {
    api.get("/admin/bot/dashboard")
      .then(({ data }) => setBotData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBotData();
  }, []);

  const handleTestToken = async () => {
    setTestingToken(true);
    setTestResult(null);
    try {
      const { data } = await api.post("/admin/bot/test-token");
      setTestResult(data);
      toast.success(`Bot connected: @${data.username} (${data.guild_count} servers)`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Discord bot token test failed.");
      setTestResult({ ok: false, error: e.response?.data?.detail || e.message });
    } finally {
      setTestingToken(false);
    }
  };

  const handlePostLeaderboard = async () => {
    setPostingLeaderboard(true);
    try {
      const { data } = await api.post("/admin/bot/post-leaderboard", { channel_id: customChannel });
      if (data.ok) {
        toast.success(`🏆 Leaderboard embed posted to Discord channel #${customChannel}!`);
      } else {
        toast.error(`Failed to post: ${data.detail || "Check bot permissions in channel"}`);
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not post leaderboard embed.");
    } finally {
      setPostingLeaderboard(false);
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      const { data } = await api.post("/admin/bot/user-action", { user_id: userId, action });
      if (data.ok) {
        toast.success(`User updated: ${action.replace("_", " ")}`);
        loadBotData();
      }
    } catch {
      toast.error("Failed to execute action.");
    }
  };

  const handleSendDm = async (e) => {
    e.preventDefault();
    if (!dmModal.message.trim() || !dmModal.user?.discord_id) return;
    setSendingDm(true);
    try {
      const { data } = await api.post("/admin/bot/send-dm", {
        discord_id: dmModal.user.discord_id,
        message: dmModal.message.trim(),
      });
      if (data.ok) {
        toast.success(`DM delivered to @${dmModal.user.username} via Discord Bot!`);
        setDmModal({ open: false, user: null, message: "" });
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to deliver DM.");
    } finally {
      setSendingDm(false);
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Discord Bot & Leaderboard Command"
        subtitle="Manage Discord authentication gateway, server booster roles, and channel 1557281277734813806 leaderboard sync."
        action={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              disabled={testingToken}
              onClick={handleTestToken}
              variant="outline"
              className="border-white/10 text-white text-xs font-semibold px-3 h-9 rounded-xl hover:bg-white/5 cursor-pointer"
            >
              {testingToken ? "Testing..." : "🔍 Test Bot Token"}
            </Button>
            <Button
              type="button"
              disabled={postingLeaderboard}
              onClick={handlePostLeaderboard}
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold px-4 h-9 rounded-xl shadow-[0_0_15px_rgba(88,101,242,0.4)] gap-1.5 cursor-pointer"
            >
              {postingLeaderboard ? "Posting Embed..." : "⚡ Post Leaderboard to Channel Now"}
            </Button>
          </div>
        }
      />

      {/* Test Result Banner */}
      {testResult && (
        <div className={`p-4 rounded-2xl border ${testResult.ok ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-red-500/10 border-red-500/30 text-red-300"} text-xs space-y-1`}>
          <div className="font-bold flex items-center gap-2">
            <span>{testResult.ok ? "✓ Discord Bot Connection Verified" : "✗ Discord Bot Connection Error"}</span>
          </div>
          {testResult.ok ? (
            <p className="text-white/80">
              Bot account: <strong>@{testResult.username}</strong> (ID: {testResult.id}) • Joined {testResult.guild_count} Discord servers.
            </p>
          ) : (
            <p className="text-white/80">{testResult.error || "Please verify DISCORD_BOT_TOKEN in Railway environment variables."}</p>
          )}
        </div>
      )}

      {/* Top Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-1">
          <div className="text-[11px] text-[#E5E7EB]/50 font-medium flex items-center justify-between">
            <span>Bot Connection</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-lg font-bold text-white">
            {botData?.bot_configured ? "Online & Ready" : "Standby (Configured)"}
          </div>
          <div className="text-[10px] text-[#5B8DB8] font-mono">Channel: {customChannel}</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-1">
          <div className="text-[11px] text-[#E5E7EB]/50 font-medium">Authed Discord Users</div>
          <div className="text-lg font-bold text-white">{botData?.total_authed_users || 0}</div>
          <div className="text-[10px] text-emerald-400 font-mono">OAuth2 Verified</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-1">
          <div className="text-[11px] text-[#E5E7EB]/50 font-medium">Active Boosters</div>
          <div className="text-lg font-bold text-white">{botData?.total_boosters || 0}</div>
          <div className="text-[10px] text-purple-400 font-mono">Server Booster Perks</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-1">
          <div className="text-[11px] text-[#E5E7EB]/50 font-medium">24h Leaderboard Auto-Sync</div>
          <div className="text-lg font-bold text-emerald-400">Enabled (Every 24h)</div>
          <div className="text-[10px] text-white/40 font-mono">Channel #{customChannel}</div>
        </div>
      </div>

      {/* Manual Channel Trigger Config */}
      <div className="p-4 rounded-2xl bg-[#0c0e18] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center text-[#5865F2]">
            <Shield size={16} />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Target Discord Channel ID</div>
            <div className="text-[10px] text-[#E5E7EB]/50">Default leaderboard broadcast channel</div>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            value={customChannel}
            onChange={(e) => setCustomChannel(e.target.value)}
            className="bg-[#080a10] border-white/10 text-xs text-white font-mono w-48 h-8 rounded-xl"
            placeholder="1557281277734813806"
          />
          <Button
            type="button"
            size="sm"
            onClick={handlePostLeaderboard}
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs rounded-xl h-8 shrink-0"
          >
            Broadcast Embed
          </Button>
        </div>
      </div>


      {/* Authed Users Management Table */}
      <div className="p-5 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <span>Authed Discord Accounts & Verification Status</span>
            <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-white/60 font-mono">
              {botData?.users?.length || 0} Registered
            </span>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={loadBotData} className="border-white/10 text-white text-xs h-7 rounded-lg">
            Refresh
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/10 text-[#E5E7EB]/40 uppercase tracking-wider text-[10px]">
                <th className="p-3">Swats User</th>
                <th className="p-3">Discord Tag & ID</th>
                <th className="p-3">Verification</th>
                <th className="p-3">Server Booster</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(!botData?.users || botData.users.length === 0) ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-white/40 text-xs">
                    No connected Discord accounts yet.
                  </td>
                </tr>
              ) : (
                botData.users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-white">{u.display_name}</div>
                      <div className="text-[10px] text-[#5B8DB8] font-mono">@{u.username}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-white font-medium">{u.discord_tag}</div>
                      <div className="text-[10px] text-white/40 font-mono">{u.discord_id}</div>
                    </td>
                    <td className="p-3">
                      {u.verified ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                          Pending Code
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {u.is_booster ? (
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                          🚀 Server Booster
                        </span>
                      ) : (
                        <span className="text-white/30 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setDmModal({ open: true, user: u, message: "" })}
                          className="h-7 px-2.5 text-[11px] border-white/10 text-[#5B8DB8] hover:bg-[#5B8DB8]/10 rounded-lg"
                        >
                          Send DM
                        </Button>
                        {u.is_booster ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleUserAction(u.id, "remove_booster")}
                            className="h-7 px-2 text-[10px] bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-lg"
                          >
                            Remove Boost
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleUserAction(u.id, "give_booster")}
                            className="h-7 px-2 text-[10px] bg-purple-600/30 hover:bg-purple-600 text-purple-200 border border-purple-500/30 rounded-lg"
                          >
                            Give Boost
                          </Button>
                        )}
                        {u.verified ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleUserAction(u.id, "unverify")}
                            className="h-7 px-2 text-[10px] bg-white/5 hover:bg-white/10 text-white/70 rounded-lg"
                          >
                            Revoke
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleUserAction(u.id, "verify")}
                            className="h-7 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                          >
                            Verify
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Send DM Modal */}
      <Dialog open={dmModal.open} onOpenChange={(o) => !o && setDmModal({ open: false, user: null, message: "" })}>
        <DialogContent className="w-[460px] max-w-[calc(100vw-2rem)] bg-[#0c0e15] border border-[#2b384e] text-white p-5 rounded-2xl">
          <form onSubmit={handleSendDm} className="space-y-4">
            <DialogTitle className="text-sm font-bold text-white font-display">
              Send Direct Message to @{dmModal.user?.username}
            </DialogTitle>
            <p className="text-xs text-[#E5E7EB]/60">
              The Swats.bio Discord Bot will dispatch this message directly to their Discord DM inbox.
            </p>
            <div className="space-y-1">
              <label className="text-[11px] text-[#E5E7EB]/70">Message Content</label>
              <Textarea
                value={dmModal.message}
                onChange={(e) => setDmModal((p) => ({ ...p, message: e.target.value }))}
                placeholder="Enter notification or message to send via Discord bot..."
                rows={4}
                className="bg-[#080a10] border-white/10 text-xs text-white resize-none"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDmModal({ open: false, user: null, message: "" })}
                className="border-white/10 text-white hover:bg-white/5 text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={sendingDm || !dmModal.message.trim()}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold rounded-xl"
              >
                {sendingDm ? "Sending DM..." : "Send Bot DM"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ──────────────────────────────────────────────
// OAUTH & CONNECTED ACCOUNTS INSPECTOR (SPOTIFY & DISCORD)
// ──────────────────────────────────────────────
export function AdminOAuthInspector() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // "all" | "spotify" | "discord" | "both" | "boosters"
  const [probingUser, setProbingUser] = useState(null);
  const [probeResult, setProbeResult] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load user roster.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleProbeSpotify = async (u) => {
    setProbingUser(u.username);
    setProbeResult(null);
    try {
      const { data } = await api.get(`/u/${encodeURIComponent(u.username)}/nowplaying`);
      setProbeResult({ username: u.username, data });
      if (data?.playing) {
        toast.success(`Active playback detected for @${u.username}: ${data.track}`);
      } else {
        toast.info(`Spotify probe for @${u.username}: ${data?.state || "Idle / Not playing"}`);
      }
    } catch (err) {
      toast.error(`Could not probe Spotify for @${u.username}`);
    } finally {
      setProbingUser(null);
    }
  };

  const copyText = (t, label = "Copied") => {
    navigator.clipboard.writeText(t);
    toast.success(`${label} copied to clipboard!`);
  };

  // Stats calculation
  const totalUsers = users.length;
  const spotifyUsers = users.filter((u) => u.connections?.spotify?.id || u.connections?.spotify?.display_name || u.connections?.spotify?.access_token);
  const discordUsers = users.filter((u) => u.connections?.discord?.id || u.connections?.discord?.username);
  const dualUsers = users.filter((u) => (u.connections?.spotify?.id || u.connections?.spotify?.access_token) && u.connections?.discord?.id);
  const boosterUsers = users.filter((u) => u.is_booster || u.role === "vip" || (u.badges || []).includes("booster"));

  const filteredUsers = users.filter((u) => {
    const hasSpotify = !!(u.connections?.spotify?.id || u.connections?.spotify?.display_name || u.connections?.spotify?.access_token);
    const hasDiscord = !!(u.connections?.discord?.id || u.connections?.discord?.username);

    if (filter === "spotify" && !hasSpotify) return false;
    if (filter === "discord" && !hasDiscord) return false;
    if (filter === "both" && (!hasSpotify || !hasDiscord)) return false;
    if (filter === "boosters" && !u.is_booster && !(u.badges || []).includes("booster")) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (u.username || "").toLowerCase().includes(q) ||
      (u.display_name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.connections?.spotify?.display_name || "").toLowerCase().includes(q) ||
      (u.connections?.spotify?.id || "").toLowerCase().includes(q) ||
      (u.connections?.discord?.username || "").toLowerCase().includes(q) ||
      (u.connections?.discord?.id || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <Header
        title="OAuth & Connected Accounts Inspector"
        subtitle="Live telemetry and identity verification across all linked Spotify and Discord accounts."
        action={
          <Button
            type="button"
            onClick={loadUsers}
            disabled={loading}
            className="rounded-xl bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white text-xs font-bold gap-2"
          >
            <ShieldCheck size={15} /> Refresh Accounts
          </Button>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#0c0e15] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>Spotify Connected</span>
            <SiSpotify className="text-[#1DB954]" size={16} />
          </div>
          <div className="text-2xl font-black text-white font-mono">{spotifyUsers.length}</div>
          <div className="text-[11px] text-white/40">{Math.round((spotifyUsers.length / Math.max(1, totalUsers)) * 100)}% of total users</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c0e15] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>Discord Connected</span>
            <SiDiscord className="text-[#5865F2]" size={16} />
          </div>
          <div className="text-2xl font-black text-white font-mono">{discordUsers.length}</div>
          <div className="text-[11px] text-white/40">{Math.round((discordUsers.length / Math.max(1, totalUsers)) * 100)}% of total users</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c0e15] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>Dual Connected</span>
            <Sparkles className="text-amber-400" size={16} />
          </div>
          <div className="text-2xl font-black text-white font-mono">{dualUsers.length}</div>
          <div className="text-[11px] text-white/40">Spotify + Discord linked</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c0e15] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>Server Boosters</span>
            <Crown className="text-purple-400" size={16} />
          </div>
          <div className="text-2xl font-black text-white font-mono">{boosterUsers.length}</div>
          <div className="text-[11px] text-white/40">Active VIP perks enabled</div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0c0e15] border border-white/10">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Spotify display name, Discord ID, username..."
            className="pl-9 bg-[#08090d] border-white/10 text-xs rounded-xl h-9 text-white font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: `All Users (${totalUsers})` },
            { id: "spotify", label: `Spotify (${spotifyUsers.length})` },
            { id: "discord", label: `Discord (${discordUsers.length})` },
            { id: "both", label: `Both (${dualUsers.length})` },
            { id: "boosters", label: `Boosters (${boosterUsers.length})` },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filter === f.id
                  ? "bg-[#5B8DB8] text-white shadow"
                  : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts Table */}
      <div className="p-4 rounded-2xl bg-[#0c0e15] border border-white/10 overflow-x-auto shadow-2xl">
        <table className="w-full text-left text-xs min-w-[850px]">
          <thead>
            <tr className="border-b border-white/10 text-white/45 uppercase tracking-wider font-mono text-[10px]">
              <th className="pb-3 px-2">Swats Operator</th>
              <th className="pb-3 px-2">Spotify Linked Account</th>
              <th className="pb-3 px-2">Discord Linked Account</th>
              <th className="pb-3 px-2">Booster / Role</th>
              <th className="pb-3 px-2 text-right">Telemetry Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-white/40">
                  No connected accounts matched your filter criteria.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const sp = u.connections?.spotify;
                const dc = u.connections?.discord;
                const hasSpotify = !!(sp?.id || sp?.display_name || sp?.access_token);
                const hasDiscord = !!(dc?.id || dc?.username);

                return (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Operator */}
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={fileUrl(u.settings?.pfp) || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                          alt=""
                          className="w-8 h-8 rounded-full border border-white/10 object-cover"
                        />
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{stripEffectSyntax(u.display_name || u.username)}</span>
                            {u.verified && <span className="text-emerald-400 text-[10px]">✓</span>}
                          </div>
                          <div className="text-[11px] text-white/45 font-mono">@{u.username}</div>
                        </div>
                      </div>
                    </td>

                    {/* Spotify Column */}
                    <td className="py-3 px-2">
                      {hasSpotify ? (
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-[#1DB954]/20 border border-[#1DB954]/40 flex items-center justify-center text-[#1DB954] shrink-0">
                            <SiSpotify size={13} />
                          </span>
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate flex items-center gap-1.5">
                              <span>{sp.display_name || sp.id || "Connected"}</span>
                              {sp.product && (
                                <span className="px-1.5 py-0.2 rounded bg-[#1DB954]/20 text-[#1DB954] text-[9px] font-mono font-bold uppercase">
                                  {sp.product}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-white/40 font-mono truncate">
                              ID: {sp.id || "OAuth Token Active"} {sp.country ? `• ${sp.country}` : ""}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-white/30 text-[11px] italic font-mono">Not linked</span>
                      )}
                    </td>

                    {/* Discord Column */}
                    <td className="py-3 px-2">
                      {hasDiscord ? (
                        <div className="flex items-center gap-2">
                          {dc.avatar ? (
                            <img
                              src={dc.avatar.startsWith("http") ? dc.avatar : `https://cdn.discordapp.com/avatars/${dc.id}/${dc.avatar}.png`}
                              alt=""
                              className="w-6 h-6 rounded-full border border-[#5865F2]/40 object-cover"
                            />
                          ) : (
                            <span className="w-6 h-6 rounded-lg bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center text-[#5865F2] shrink-0">
                              <SiDiscord size={13} />
                            </span>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate flex items-center gap-1.5">
                              <span>{dc.global_name || dc.username || "Discord User"}</span>
                            </div>
                            <div className="text-[10px] text-white/40 font-mono truncate flex items-center gap-1">
                              <span>{dc.id}</span>
                              <button
                                type="button"
                                onClick={() => copyText(dc.id, "Discord ID")}
                                className="text-white/30 hover:text-white"
                                title="Copy Discord ID"
                              >
                                <Copy size={10} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-white/30 text-[11px] italic font-mono">Not linked</span>
                      )}
                    </td>

                    {/* Booster / Access Role */}
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1.5">
                        {u.is_booster || (u.badges || []).includes("booster") ? (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Crown size={10} /> Booster
                          </span>
                        ) : null}
                        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-[10px] font-semibold uppercase">
                          {u.role || "User"}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {hasSpotify && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleProbeSpotify(u)}
                            disabled={probingUser === u.username}
                            className="h-7 px-2.5 text-[11px] font-bold bg-[#1DB954]/20 hover:bg-[#1DB954] text-[#1DB954] hover:text-black border border-[#1DB954]/30 rounded-lg cursor-pointer"
                          >
                            <Activity size={11} className="mr-1" />
                            {probingUser === u.username ? "Probing..." : "Probe Spotify"}
                          </Button>
                        )}
                        <a
                          href={`/${u.username}`}
                          target="_blank"
                          rel="noreferrer"
                          className="h-7 px-2 text-[11px] bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg flex items-center justify-center border border-white/10"
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Live Probe Feedback Banner */}
      {probeResult && (
        <div className="p-4 rounded-2xl bg-[#080a10] border border-[#1DB954]/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <SiSpotify className="text-[#1DB954]" size={14} />
              <span>Probe Result for @{probeResult.username}</span>
            </span>
            <button onClick={() => setProbeResult(null)} className="text-white/40 hover:text-white">
              <X size={13} />
            </button>
          </div>
          <pre className="text-[11px] font-mono text-white/80 bg-black/60 p-3 rounded-xl overflow-x-auto border border-white/5">
            {JSON.stringify(probeResult.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

