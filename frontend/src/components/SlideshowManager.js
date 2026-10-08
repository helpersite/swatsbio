import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit3, MoveUp, MoveDown, Layers, Sparkles, ExternalLink, ShieldCheck, Code, ShoppingCart, Key, Gamepad2, Briefcase, Eye, Upload, Image as ImageIcon, X } from "lucide-react";
import { SiDiscord } from "react-icons/si";
import { toast } from "sonner";
import { fileUrl } from "@/lib/auth";

export const PROJECT_TYPES = [
  { id: "game_cheat", name: "Game Cheat / Mod Menu", icon: Gamepad2, desc: "Showcase game hacks, undetected status, code language & features" },
  { id: "store", name: "Digital Store / Product", icon: ShoppingCart, desc: "Sell products, licenses, downloads & configs" },
  { id: "accounts", name: "Accounts & Alts", icon: Key, desc: "Marketplace for gaming accounts, subscriptions & alts" },
  { id: "code", name: "Code / Repository / Tool", icon: Code, desc: "Showcase open-source repositories, libraries & scripts" },
  { id: "service", name: "Service / Commission", icon: Briefcase, desc: "Freelance dev, graphics, boosting, or design services" },
  { id: "portfolio", name: "Project Portfolio", icon: Sparkles, desc: "General creative showcase with media galleries" },
];

export function SlideshowManager({
  slideshowConfig,
  onChange,
  uploadFile,
}) {
  const slides = slideshowConfig?.slides || [];
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  // Form State for Adding / Editing a Slide
  const [slideType, setSlideType] = useState("project"); // "discord" | "project"
  const [projectLayout, setProjectLayout] = useState("one_sided"); // "one_sided" | "two_sided"
  const [projectSubtype, setProjectSubtype] = useState("game_cheat");
  
  // Discord Fields
  const [dcServerName, setDcServerName] = useState("My Community");
  const [dcInviteUrl, setDcInviteUrl] = useState("https://discord.gg/example");
  const [dcIcon, setDcIcon] = useState("");
  const [dcMembers, setDcMembers] = useState("1,450");
  const [dcOnline, setDcOnline] = useState("320");
  const [dcDescription, setDcDescription] = useState("Official community server for releases, updates and 24/7 support.");
  const [dcTheme, setDcTheme] = useState("nitro_glass"); // "nitro_glass" | "dark_minimal" | "cyber_glow"
  const [dcButtonText, setDcButtonText] = useState("Join Server");

  // Project Fields
  const [projTitle, setProjTitle] = useState("Apex Silent Aim & ESP");
  const [projGame, setProjGame] = useState("Apex Legends");
  const [projLanguage, setProjLanguage] = useState("C++ / Kernel Driver");
  const [projStatus, setProjStatus] = useState("Undetected (v2.4)");
  const [projPrice, setProjPrice] = useState("$19.99 / mo");
  const [projDescription, setProjDescription] = useState("Full kernel bypass with customizable smooth aimbot, item glow ESP, spectator list alert, and customizable config presets.");
  const [projImages, setProjImages] = useState([]);
  const [projButtonText, setProjButtonText] = useState("Purchase Access");
  const [projButtonUrl, setProjButtonUrl] = useState("https://swats.bio");
  const [projSecondaryButtonText, setProjSecondaryButtonText] = useState("Join Discord");
  const [projSecondaryButtonUrl, setProjSecondaryButtonUrl] = useState("https://discord.gg/swats");

  // Two-sided secondary project fields
  const [proj2Title, setProj2Title] = useState("Rust External Radar");
  const [proj2Game, setProj2Game] = useState("Rust");
  const [proj2Description, setProj2Description] = useState("Web radar and live map stream with player inventories.");
  const [proj2Price, setProj2Price] = useState("$24.99");
  const [proj2ButtonUrl, setProj2ButtonUrl] = useState("https://swats.bio");

  const openAddSlideModal = () => {
    setEditingIndex(null);
    setSlideType("project");
    setProjectLayout("one_sided");
    setProjectSubtype("game_cheat");
    setProjTitle("Apex Silent Aim & ESP");
    setProjGame("Apex Legends");
    setProjLanguage("C++ / Kernel Driver");
    setProjStatus("Undetected (v2.4)");
    setProjPrice("$19.99 / mo");
    setProjDescription("Full kernel bypass with customizable smooth aimbot, item glow ESP, spectator list alert, and customizable config presets.");
    setProjImages([]);
    setProjButtonText("Purchase Access");
    setProjButtonUrl("https://swats.bio");
    setModalOpen(true);
  };

  const openEditSlideModal = (index) => {
    const s = slides[index];
    if (!s) return;
    setEditingIndex(index);
    setSlideType(s.type || "project");
    if (s.type === "discord") {
      setDcServerName(s.serverName || "");
      setDcInviteUrl(s.inviteUrl || "");
      setDcIcon(s.icon || "");
      setDcMembers(s.members || "");
      setDcOnline(s.online || "");
      setDcDescription(s.description || "");
      setDcTheme(s.theme || "nitro_glass");
      setDcButtonText(s.buttonText || "Join Server");
    } else {
      setProjectLayout(s.layout || "one_sided");
      setProjectSubtype(s.subtype || "game_cheat");
      setProjTitle(s.title || "");
      setProjGame(s.game || "");
      setProjLanguage(s.language || "");
      setProjStatus(s.status || "");
      setProjPrice(s.price || "");
      setProjDescription(s.description || "");
      setProjImages(s.images || []);
      setProjButtonText(s.buttonText || "Purchase Access");
      setProjButtonUrl(s.buttonUrl || "");
      setProjSecondaryButtonText(s.secondaryButtonText || "");
      setProjSecondaryButtonUrl(s.secondaryButtonUrl || "");
      if (s.project2) {
        setProj2Title(s.project2.title || "");
        setProj2Game(s.project2.game || "");
        setProj2Description(s.project2.description || "");
        setProj2Price(s.project2.price || "");
        setProj2ButtonUrl(s.project2.buttonUrl || "");
      }
    }
    setModalOpen(true);
  };

  const handleSaveSlide = () => {
    let newSlide = {};
    if (slideType === "discord") {
      newSlide = {
        type: "discord",
        serverName: dcServerName,
        inviteUrl: dcInviteUrl,
        icon: dcIcon,
        members: dcMembers,
        online: dcOnline,
        description: dcDescription,
        theme: dcTheme,
        buttonText: dcButtonText,
      };
    } else {
      newSlide = {
        type: "project",
        layout: projectLayout,
        subtype: projectSubtype,
        title: projTitle,
        game: projGame,
        language: projLanguage,
        status: projStatus,
        price: projPrice,
        description: projDescription,
        images: projImages,
        buttonText: projButtonText,
        buttonUrl: projButtonUrl,
        secondaryButtonText: projSecondaryButtonText,
        secondaryButtonUrl: projSecondaryButtonUrl,
      };
      if (projectLayout === "two_sided") {
        newSlide.project2 = {
          title: proj2Title,
          game: proj2Game,
          description: proj2Description,
          price: proj2Price,
          buttonUrl: proj2ButtonUrl,
        };
      }
    }

    let updatedSlides = [...slides];
    if (editingIndex !== null) {
      updatedSlides[editingIndex] = newSlide;
      toast.success("Slide updated!");
    } else {
      updatedSlides.push(newSlide);
      toast.success("New slide added!");
    }
    onChange({ ...slideshowConfig, slides: updatedSlides });
    setModalOpen(false);
  };

  const handleDeleteSlide = (index) => {
    const updated = slides.filter((_, i) => i !== index);
    onChange({ ...slideshowConfig, slides: updated });
    toast.info("Slide removed.");
  };

  const handleMoveSlide = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= slides.length) return;
    const updated = [...slides];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);
    onChange({ ...slideshowConfig, slides: updated });
  };

  const handleAddImage = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (projImages.length + files.length > 3) {
      toast.warning("Maximum 3 images per project slide.");
    }
    const toUpload = files.slice(0, 3 - projImages.length);
    for (const f of toUpload) {
      if (uploadFile) {
        try {
          const url = await uploadFile(f);
          setProjImages((prev) => [...prev, url]);
        } catch {
          toast.error("Image upload failed");
        }
      } else {
        const local = URL.createObjectURL(f);
        setProjImages((prev) => [...prev, local]);
      }
    }
  };

  const handleRemoveImage = (imgIdx) => {
    setProjImages((prev) => prev.filter((_, i) => i !== imgIdx));
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Add Slide Button */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#080a10] border border-white/10">
        <div>
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <Layers size={14} className="text-[#5B8DB8]" />
            <span>Slideshow Deck & Embeds Manager</span>
          </div>
          <div className="text-[11px] text-[#E5E7EB]/50">
            Add interactive Discord embeds, software/cheat showcase cards, and store decks
          </div>
        </div>
        <Button
          type="button"
          onClick={openAddSlideModal}
          className="bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white text-xs font-bold px-4 h-8 rounded-xl shadow-[0_0_12px_rgba(91,141,184,0.35)] gap-1.5"
        >
          <Plus size={14} /> Add Slide
        </Button>
      </div>

      {/* Slide List */}
      {slides.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-white/15 text-center bg-[#08090d]">
          <Layers size={32} className="mx-auto text-white/30 mb-2" />
          <div className="text-xs font-bold text-white mb-1">No slides added yet</div>
          <div className="text-[11px] text-[#E5E7EB]/50 max-w-sm mx-auto mb-3">
            Press &ldquo;Add Slide&rdquo; to build your first Discord server widget or product showcase slide.
          </div>
          <Button
            type="button"
            size="sm"
            onClick={openAddSlideModal}
            className="bg-white/10 hover:bg-white/20 text-white text-xs rounded-xl"
          >
            + Create First Slide
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {slides.map((s, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-[#080a10] border border-white/10 flex items-center justify-between gap-3 hover:border-[#5B8DB8]/40 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-[#5B8DB8]/20 text-[#5B8DB8] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white flex items-center gap-2 truncate">
                    {s.type === "discord" ? (
                      <>
                        <SiDiscord className="text-[#5865F2] shrink-0" size={14} />
                        <span>Discord Embed: {s.serverName || "Server"}</span>
                      </>
                    ) : (
                      <>
                        <Gamepad2 className="text-[#5B8DB8] shrink-0" size={14} />
                        <span>Project ({s.subtype || "game_cheat"}): {s.title || "Project"}</span>
                      </>
                    )}
                  </div>
                  <div className="text-[10px] text-[#E5E7EB]/50 truncate">
                    {s.type === "discord"
                      ? `${s.members || "1,000"} Members · ${s.online || "250"} Online`
                      : `${s.layout === "two_sided" ? "Two-Sided Split" : "One-Sided Centered"} · ${s.price || "Free / Premium"}`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleMoveSlide(idx, -1)}
                  disabled={idx === 0}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-20 flex items-center justify-center"
                  title="Move Up"
                >
                  <MoveUp size={13} />
                </button>
                <button
                  onClick={() => handleMoveSlide(idx, 1)}
                  disabled={idx === slides.length - 1}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-20 flex items-center justify-center"
                  title="Move Down"
                >
                  <MoveDown size={13} />
                </button>
                <button
                  onClick={() => openEditSlideModal(idx)}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-[#5B8DB8]/20 text-white/70 hover:text-[#5B8DB8] flex items-center justify-center"
                  title="Edit Slide"
                >
                  <Edit3 size={13} />
                </button>
                <button
                  onClick={() => handleDeleteSlide(idx)}
                  className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center"
                  title="Delete Slide"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide Modal Editor */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[780px] max-w-[calc(100vw-2rem)] h-[660px] max-h-[92dvh] bg-[#0c0e15] border border-[#2b384e] text-white p-0 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#090b10]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 flex items-center justify-center text-[#5B8DB8]">
                <Layers size={16} />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-white font-display">
                  {editingIndex !== null ? "Edit Slide" : "Add Slide to Deck"}
                </DialogTitle>
                <div className="text-[11px] text-[#E5E7EB]/50">
                  Configure embed types, project details, images and call-to-action buttons
                </div>
              </div>
            </div>
            <button
              onClick={() => setModalOpen(false)}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>

          {/* Slide Type Picker Bar */}
          <div className="px-4 py-2.5 border-b border-white/10 bg-[#08090d] flex items-center gap-2 shrink-0">
            <span className="text-xs text-[#E5E7EB]/70 font-semibold mr-2">Slide Type:</span>
            <button
              type="button"
              onClick={() => setSlideType("discord")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                slideType === "discord"
                  ? "bg-[#5865F2] text-white shadow-sm"
                  : "bg-white/5 text-[#E5E7EB]/70 hover:text-white"
              }`}
            >
              <SiDiscord size={13} /> Discord Server Embed
            </button>
            <button
              type="button"
              onClick={() => setSlideType("project")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                slideType === "project"
                  ? "bg-[#5B8DB8] text-white shadow-sm"
                  : "bg-white/5 text-[#E5E7EB]/70 hover:text-white"
              }`}
            >
              <Gamepad2 size={13} /> Project Page Embed
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {/* DISCORD SERVER EMBED CONFIG */}
            {slideType === "discord" && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-[#E5E7EB]/70">Server Name</Label>
                    <Input
                      value={dcServerName}
                      onChange={(e) => setDcServerName(e.target.value)}
                      placeholder="My Community"
                      className="h-8 text-xs bg-black/40 border-white/10 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#E5E7EB]/70">Invite URL</Label>
                    <Input
                      value={dcInviteUrl}
                      onChange={(e) => setDcInviteUrl(e.target.value)}
                      placeholder="https://discord.gg/yourcode"
                      className="h-8 text-xs bg-black/40 border-white/10 mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-[#E5E7EB]/70">Total Members</Label>
                    <Input
                      value={dcMembers}
                      onChange={(e) => setDcMembers(e.target.value)}
                      placeholder="1,450"
                      className="h-8 text-xs bg-black/40 border-white/10 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#E5E7EB]/70">Online Count</Label>
                    <Input
                      value={dcOnline}
                      onChange={(e) => setDcOnline(e.target.value)}
                      placeholder="320"
                      className="h-8 text-xs bg-black/40 border-white/10 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#E5E7EB]/70">Button Label</Label>
                    <Input
                      value={dcButtonText}
                      onChange={(e) => setDcButtonText(e.target.value)}
                      placeholder="Join Server"
                      className="h-8 text-xs bg-black/40 border-white/10 mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-[#E5E7EB]/70">Server Icon URL</Label>
                  <Input
                    value={dcIcon}
                    onChange={(e) => setDcIcon(e.target.value)}
                    placeholder="https://... (or leave empty for Discord icon)"
                    className="h-8 text-xs bg-black/40 border-white/10 mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs text-[#E5E7EB]/70">Description / Topic</Label>
                  <Textarea
                    value={dcDescription}
                    onChange={(e) => setDcDescription(e.target.value)}
                    rows={2}
                    placeholder="Official server for updates, community chat, and ticket support."
                    className="text-xs bg-black/40 border-white/10 mt-1"
                  />
                </div>

                {/* Live Discord Embed Preview */}
                <div className="p-3.5 rounded-xl bg-[#2b2d31] border border-[#3f4147] text-white space-y-2 mt-2">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[#5865F2]">
                    Live Discord Embed Preview
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#5865F2] flex items-center justify-center text-white overflow-hidden font-bold">
                        {dcIcon ? <img src={dcIcon} alt="" className="w-full h-full object-cover" /> : <SiDiscord size={22} />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{dcServerName || "Discord Server"}</div>
                        <div className="text-[10px] text-white/60 flex items-center gap-2">
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {dcOnline || "0"} Online</span>
                          <span>•</span>
                          <span>{dcMembers || "0"} Members</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1.5 rounded-lg bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-semibold cursor-pointer">
                      {dcButtonText || "Join"}
                    </span>
                  </div>
                  {dcDescription && (
                    <div className="text-[11px] text-white/70 pt-1 border-t border-white/5">
                      {dcDescription}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PROJECT PAGE EMBED CONFIG */}
            {slideType === "project" && (
              <div className="space-y-3.5">
                {/* Layout Style: One-sided vs Two-sided */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setProjectLayout("one_sided")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      projectLayout === "one_sided"
                        ? "bg-[#5B8DB8]/20 border-[#5B8DB8] ring-1 ring-[#5B8DB8]"
                        : "bg-[#080a10] border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="text-xs font-bold text-white mb-0.5">One-Sided (Centered Hero)</div>
                    <div className="text-[10px] text-[#E5E7EB]/50">Single large project card in the middle with multi-image gallery</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProjectLayout("two_sided")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      projectLayout === "two_sided"
                        ? "bg-[#5B8DB8]/20 border-[#5B8DB8] ring-1 ring-[#5B8DB8]"
                        : "bg-[#080a10] border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="text-xs font-bold text-white mb-0.5">Two-Sided (Split Projects)</div>
                    <div className="text-[10px] text-[#E5E7EB]/50">Dual projects displayed side-by-side on left and right columns</div>
                  </button>
                </div>

                {/* Project Type Dropdown */}
                <div>
                  <Label className="text-xs text-[#E5E7EB]/70">Project Category</Label>
                  <Select value={projectSubtype} onValueChange={setProjectSubtype}>
                    <SelectTrigger className="h-8 text-xs bg-black/40 border-white/10 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0b0d13] border-white/15 text-white">
                      {PROJECT_TYPES.map((pt) => (
                        <SelectItem key={pt.id} value={pt.id} className="text-xs">
                          {pt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Primary Project Details */}
                <div className="p-3.5 rounded-xl border border-white/10 bg-[#080a10] space-y-3">
                  <div className="text-xs font-bold text-white">
                    {projectLayout === "two_sided" ? "Project #1 (Left Column)" : "Project Details"}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-[#E5E7EB]/70">Title</Label>
                      <Input
                        value={projTitle}
                        onChange={(e) => setProjTitle(e.target.value)}
                        placeholder="Project Title"
                        className="h-8 text-xs bg-black/40 border-white/10 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-[#E5E7EB]/70">Price / Tier</Label>
                      <Input
                        value={projPrice}
                        onChange={(e) => setProjPrice(e.target.value)}
                        placeholder="$19.99 / mo or Free"
                        className="h-8 text-xs bg-black/40 border-white/10 mt-1"
                      />
                    </div>
                  </div>

                  {projectSubtype === "game_cheat" && (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs text-[#E5E7EB]/70">Game Name</Label>
                        <Input
                          value={projGame}
                          onChange={(e) => setProjGame(e.target.value)}
                          placeholder="Apex / Fortnite"
                          className="h-8 text-xs bg-black/40 border-white/10 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-[#E5E7EB]/70">Code Language</Label>
                        <Input
                          value={projLanguage}
                          onChange={(e) => setProjLanguage(e.target.value)}
                          placeholder="C++ / Kernel"
                          className="h-8 text-xs bg-black/40 border-white/10 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-[#E5E7EB]/70">Status Tag</Label>
                        <Input
                          value={projStatus}
                          onChange={(e) => setProjStatus(e.target.value)}
                          placeholder="Undetected"
                          className="h-8 text-xs bg-black/40 border-white/10 mt-1"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs text-[#E5E7EB]/70">Description & Features</Label>
                    <Textarea
                      value={projDescription}
                      onChange={(e) => setProjDescription(e.target.value)}
                      rows={2}
                      placeholder="Detail features, key updates, or license perks..."
                      className="text-xs bg-black/40 border-white/10 mt-1"
                    />
                  </div>

                  {/* Image Uploads (up to 3) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs text-[#E5E7EB]/70">Project Screenshots / Artwork (Max 3)</Label>
                      <span className="text-[10px] font-mono text-[#5B8DB8]">{projImages.length}/3 images</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {projImages.map((img, iIdx) => (
                        <div key={iIdx} className="relative w-16 h-16 rounded-lg border border-white/10 bg-black/40 overflow-hidden group">
                          <img src={img.startsWith("http") || img.startsWith("blob:") ? img : fileUrl(img)} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(iIdx)}
                            className="absolute top-0.5 right-0.5 w-4 h-4 rounded bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}

                      {projImages.length < 3 && (
                        <label className="w-16 h-16 rounded-lg border border-dashed border-[#5B8DB8]/40 hover:border-[#5B8DB8] bg-[#121622]/50 hover:bg-[#5B8DB8]/10 flex flex-col items-center justify-center cursor-pointer text-[#5B8DB8]">
                          <input type="file" accept="image/*" className="hidden" onChange={handleAddImage} multiple />
                          <Upload size={14} />
                          <span className="text-[9px] mt-0.5 font-medium">+ Add</span>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/5">
                    <div>
                      <Label className="text-xs text-[#E5E7EB]/70">Primary Button Label</Label>
                      <Input
                        value={projButtonText}
                        onChange={(e) => setProjButtonText(e.target.value)}
                        placeholder="Purchase Access"
                        className="h-8 text-xs bg-black/40 border-white/10 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-[#E5E7EB]/70">Primary Button Link</Label>
                      <Input
                        value={projButtonUrl}
                        onChange={(e) => setProjButtonUrl(e.target.value)}
                        placeholder="https://..."
                        className="h-8 text-xs bg-black/40 border-white/10 mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Secondary Project (If Two-Sided is active) */}
                {projectLayout === "two_sided" && (
                  <div className="p-3.5 rounded-xl border border-white/10 bg-[#080a10] space-y-3">
                    <div className="text-xs font-bold text-white">Project #2 (Right Column)</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-[#E5E7EB]/70">Title</Label>
                        <Input
                          value={proj2Title}
                          onChange={(e) => setProj2Title(e.target.value)}
                          placeholder="Project #2 Title"
                          className="h-8 text-xs bg-black/40 border-white/10 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-[#E5E7EB]/70">Price / Tier</Label>
                        <Input
                          value={proj2Price}
                          onChange={(e) => setProj2Price(e.target.value)}
                          placeholder="$24.99"
                          className="h-8 text-xs bg-black/40 border-white/10 mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-[#E5E7EB]/70">Description</Label>
                      <Textarea
                        value={proj2Description}
                        onChange={(e) => setProj2Description(e.target.value)}
                        rows={2}
                        placeholder="Description for right column project..."
                        className="text-xs bg-black/40 border-white/10 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-[#E5E7EB]/70">Button Link</Label>
                      <Input
                        value={proj2ButtonUrl}
                        onChange={(e) => setProj2ButtonUrl(e.target.value)}
                        placeholder="https://..."
                        className="h-8 text-xs bg-black/40 border-white/10 mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-white/10 bg-[#090b10] flex items-center justify-between shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setModalOpen(false)}
              className="text-xs text-white/60 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveSlide}
              className="text-xs font-bold h-8 px-5 rounded-lg bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white shadow-[0_0_12px_rgba(91,141,184,0.35)]"
            >
              Save Slide to Deck
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
