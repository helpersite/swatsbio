import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Plus, Trash2, Edit3, MoveUp, MoveDown, Layers, Sparkles, ExternalLink,
  ShieldCheck, Code, ShoppingCart, Key, Gamepad2, Briefcase, Eye, Upload,
  Image as ImageIcon, X, Check, Users, Shield, Tag
} from "lucide-react";
import { SiDiscord } from "react-icons/si";
import { toast } from "sonner";
import { fileUrl } from "@/lib/auth";

export const PROJECT_TYPES = [
  { id: "game_cheat", name: "Game Cheat / Mod Menu", icon: Gamepad2, desc: "Showcase game hacks, bypasses, status & code languages" },
  { id: "store", name: "Digital Store / Product", icon: ShoppingCart, desc: "Sell software licenses, digital configs, downloads & assets" },
  { id: "accounts", name: "Accounts & Alts", icon: Key, desc: "Marketplace for gaming accounts, subscriptions & alt drops" },
  { id: "code", name: "Code / Repository / Tool", icon: Code, desc: "Showcase open-source libraries, exploits & frameworks" },
  { id: "service", name: "Service / Commission", icon: Briefcase, desc: "Freelance dev, reverse engineering, boosting, or UI design" },
  { id: "portfolio", name: "Project Portfolio", icon: Sparkles, desc: "General creative showcase with media galleries" },
];

export const CATEGORIZED_TAGS = {
  "Code & Tech": ["C++", "C#", "Python", "Rust", "JavaScript", "TypeScript", "HTML/CSS", "Go", "Lua", "Java", "PHP", "React", "Kernel Driver", "Reverse Engineering"],
  "Games": ["Fortnite", "Valorant", "CS2", "Apex Legends", "Roblox", "Minecraft", "Rust", "GTA V", "Overwatch 2", "Rainbow Six Siege", "Call of Duty", "Tarkov"],
  "Product & Perks": ["Instant Delivery", "Warranty Included", "Crypto Accepted", "PayPal", "Stripe", "Auto-Checkout", "Limited Stock", "Lifetime License", "Undetected"],
  "Accounts": ["Full Access", "Unverified Mail", "OG Names", "Stacked Skins", "Ranked Ready", "NFA", "FA", "Clean History"],
  "Services": ["24/7 Support", "Fast Delivery", "Middleman", "Custom Setup", "Boosting", "Graphic Design", "Bot Development"]
};

export function SlideshowManager({
  slideshowConfig,
  onChange,
  uploadFile,
}) {
  const slides = slideshowConfig?.slides || [];
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [heading, setHeading] = useState("");

  // Form State for Adding / Editing a Slide
  const [slideType, setSlideType] = useState("project"); // "discord" | "project"
  const [projectLayout, setProjectLayout] = useState("one_sided"); // "one_sided" | "two_sided"
  const [projectSubtype, setProjectSubtype] = useState("game_cheat");
  
  // Discord Fields
  const [dcServerName, setDcServerName] = useState("Swats Bio Community");
  const [dcInviteUrl, setDcInviteUrl] = useState("https://discord.gg/swats");
  const [dcIcon, setDcIcon] = useState("");
  const [dcBanner, setDcBanner] = useState("");
  const [dcMembers, setDcMembers] = useState("1,450");
  const [dcOnline, setDcOnline] = useState("320");
  const [dcDescription, setDcDescription] = useState("Official verified community for bio updates, releases, and 24/7 priority support.");
  const [dcTheme, setDcTheme] = useState("nitro_glass");
  const [dcButtonText, setDcButtonText] = useState("Join Server");

  // Project Fields
  const [projTitle, setProjTitle] = useState("Apex Silent Aim & ESP");
  const [projGame, setProjGame] = useState("Apex Legends");
  const [projLanguage, setProjLanguage] = useState("C++ / Kernel Driver");
  const [projStatus, setProjStatus] = useState("Undetected");
  const [projPrice, setProjPrice] = useState("$19.99 / mo");
  const [projDescription, setProjDescription] = useState("Full kernel bypass with customizable smooth aimbot, item glow ESP, spectator list alert, and customizable config presets.");
  const [projImages, setProjImages] = useState([]);
  const [projTags, setProjTags] = useState(["C++", "Apex Legends", "Undetected", "Instant Delivery"]);
  const [projButtonText, setProjButtonText] = useState("Purchase Access");
  const [projButtonUrl, setProjButtonUrl] = useState("https://swats.bio");
  const [projSecondaryButtonText, setProjSecondaryButtonText] = useState("Join Discord");
  const [projSecondaryButtonUrl, setProjSecondaryButtonUrl] = useState("https://discord.gg/swats");

  // Two-sided secondary project fields
  const [proj2Title, setProj2Title] = useState("Rust External Radar");
  const [proj2Game, setProj2Game] = useState("Rust");
  const [proj2Description, setProj2Description] = useState("Live web radar stream with player inventory and resource scanner.");
  const [proj2Price, setProj2Price] = useState("$24.99");
  const [proj2ButtonUrl, setProj2ButtonUrl] = useState("https://swats.bio");

  const toggleTag = (tag) => {
    if (projTags.includes(tag)) {
      setProjTags(projTags.filter((t) => t !== tag));
    } else {
      setProjTags([...projTags, tag]);
    }
  };

  const openAddSlideModal = (type = "project") => {
    setEditingIndex(null);
    setSlideType(type);
    setHeading("");
    setProjectLayout("one_sided");
    setProjectSubtype("game_cheat");
    setProjTitle("Valorant Precision Triggerbot");
    setProjGame("Valorant");
    setProjLanguage("C++ / Arduino");
    setProjStatus("Undetected");
    setProjPrice("$14.99 / mo");
    setProjDescription("Color-based aim assist with humanized smoothing curves, custom hitboxes, and hardware emulation.");
    setProjImages([]);
    setProjTags(["C++", "Valorant", "Undetected", "Instant Delivery"]);
    setProjButtonText("Get Started");
    setProjButtonUrl("https://swats.bio");
    setModalOpen(true);
  };

  const openEditSlideModal = (index) => {
    const s = slides[index];
    if (!s) return;
    setEditingIndex(index);
    setSlideType(s.type || "project");
    setHeading(s.heading || "");
    if (s.type === "discord") {
      setDcServerName(s.serverName || "");
      setDcInviteUrl(s.inviteUrl || "");
      setDcIcon(s.icon || "");
      setDcBanner(s.banner || "");
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
      setProjTags(s.tags || ["C++", "Undetected"]);
      setProjButtonText(s.buttonText || "Purchase Access");
      setProjButtonUrl(s.buttonUrl || "");
      setProjSecondaryButtonText(s.secondaryButtonText || "Join Discord");
      setProjSecondaryButtonUrl(s.secondaryButtonUrl || "");
      setProj2Title(s.side2Title || "");
      setProj2Game(s.side2Game || "");
      setProj2Description(s.side2Description || "");
      setProj2Price(s.side2Price || "");
      setProj2ButtonUrl(s.side2ButtonUrl || "");
    }
    setModalOpen(true);
  };

  const handleSaveSlide = () => {
    let slideData = {};
    if (slideType === "discord") {
      if (!dcServerName.trim()) {
        toast.error("Please enter a Discord server name");
        return;
      }
      slideData = {
        type: "discord",
        heading: heading.trim(),
        serverName: dcServerName.trim(),
        inviteUrl: dcInviteUrl.trim(),
        icon: dcIcon,
        banner: dcBanner,
        members: dcMembers,
        online: dcOnline,
        description: dcDescription,
        theme: dcTheme,
        buttonText: dcButtonText || "Join Server",
      };
    } else {
      if (!projTitle.trim()) {
        toast.error("Please enter a project title");
        return;
      }
      slideData = {
        type: "project",
        heading: heading.trim(),
        layout: projectLayout,
        subtype: projectSubtype,
        title: projTitle.trim(),
        game: projGame.trim(),
        language: projLanguage.trim(),
        status: projStatus.trim(),
        price: projPrice.trim(),
        description: projDescription.trim(),
        images: projImages,
        tags: projTags,
        buttonText: projButtonText || "View Project",
        buttonUrl: projButtonUrl.trim(),
        secondaryButtonText: projSecondaryButtonText,
        secondaryButtonUrl: projSecondaryButtonUrl.trim(),
        side2Title: proj2Title.trim(),
        side2Game: proj2Game.trim(),
        side2Description: proj2Description.trim(),
        side2Price: proj2Price.trim(),
        side2ButtonUrl: proj2ButtonUrl.trim(),
      };
    }

    const nextSlides = [...slides];
    if (editingIndex !== null) {
      nextSlides[editingIndex] = slideData;
      toast.success("Slide updated");
    } else {
      nextSlides.push(slideData);
      toast.success("New slide added to deck");
    }

    onChange({ ...(slideshowConfig || {}), slides: nextSlides });
    setModalOpen(false);
  };

  const handleDeleteSlide = (index) => {
    const nextSlides = slides.filter((_, i) => i !== index);
    onChange({ ...(slideshowConfig || {}), slides: nextSlides });
    toast.success("Slide removed");
  };

  const handleMoveSlide = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= slides.length) return;
    const nextSlides = [...slides];
    const temp = nextSlides[index];
    nextSlides[index] = nextSlides[target];
    nextSlides[target] = temp;
    onChange({ ...(slideshowConfig || {}), slides: nextSlides });
  };

  const handleUploadImage = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    for (const f of files) {
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
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => openAddSlideModal("discord")}
            className="h-8 px-3 rounded-xl bg-[#5865F2]/15 hover:bg-[#5865F2]/25 border border-[#5865F2]/40 text-[#8b95ff] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <SiDiscord size={13} /> Discord
          </button>
          <button
            type="button"
            onClick={() => openAddSlideModal("project")}
            className="h-8 px-3 rounded-xl bg-[#5B8DB8]/15 hover:bg-[#5B8DB8]/25 border border-[#5B8DB8]/40 text-[#8fc0e8] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus size={13} /> Project
          </button>
        </div>
      </div>

      {/* Slide List */}
      {slides.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-white/15 text-center bg-[#08090d]">
          <Layers size={32} className="mx-auto text-white/30 mb-2" />
          <div className="text-xs font-bold text-white mb-1">No slides added yet</div>
          <div className="text-[11px] text-[#E5E7EB]/50 max-w-sm mx-auto mb-3">
            Press &ldquo;Add Slide&rdquo; to build your first Discord server widget or product showcase slide.
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => openAddSlideModal("discord")}
              className="bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-white text-xs rounded-xl cursor-pointer border border-[#5865F2]/40"
            >
              <SiDiscord size={13} className="mr-1" /> Discord Embed
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => openAddSlideModal("project")}
              className="bg-white/10 hover:bg-white/20 text-white text-xs rounded-xl cursor-pointer"
            >
              <Plus size={13} className="mr-1" /> Project Card
            </Button>
          </div>
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
                      <SiDiscord className="text-[#5865F2] shrink-0" size={14} />
                    ) : (
                      <Gamepad2 className="text-[#5B8DB8] shrink-0" size={14} />
                    )}
                    <span className="truncate">
                      {s.heading || (s.type === "discord" ? (s.serverName || "Discord Server") : (s.title || "Project"))}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md border border-white/10 text-[#E5E7EB]/50 shrink-0">
                      {s.type === "discord" ? "Discord" : (PROJECT_TYPES.find((p) => p.id === s.subtype)?.name || "Project")}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#E5E7EB]/50 truncate">
                    {s.type === "discord"
                      ? `${s.serverName || "Server"} · ${s.members || "1,000"} members · ${s.online || "250"} online`
                      : `${s.layout === "two_sided" ? "Two-Sided Split" : "One-Sided Centered"} · ${s.price || "Free / Premium"}`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleMoveSlide(idx, -1)}
                  disabled={idx === 0}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-20 flex items-center justify-center cursor-pointer"
                  title="Move Up"
                >
                  <MoveUp size={13} />
                </button>
                <button
                  onClick={() => handleMoveSlide(idx, 1)}
                  disabled={idx === slides.length - 1}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-20 flex items-center justify-center cursor-pointer"
                  title="Move Down"
                >
                  <MoveDown size={13} />
                </button>
                <button
                  onClick={() => openEditSlideModal(idx)}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-[#5B8DB8]/20 text-white/70 hover:text-[#5B8DB8] flex items-center justify-center cursor-pointer"
                  title="Edit Slide"
                >
                  <Edit3 size={13} />
                </button>
                <button
                  onClick={() => handleDeleteSlide(idx)}
                  className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center cursor-pointer"
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
        <DialogContent className="w-[840px] max-w-[calc(100vw-2rem)] h-[720px] max-h-[92dvh] bg-[#0c0e15] border border-[#2b384e] text-white p-0 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#090b10]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 flex items-center justify-center text-[#5B8DB8]">
                <Layers size={16} />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-white font-display">
                  {editingIndex !== null ? "Edit Deck Slide" : "Add Slide to Deck"}
                </DialogTitle>
                <div className="text-[11px] text-[#E5E7EB]/50">
                  Configure Discord server embeds, software details, categorized tags & live previews
                </div>
              </div>
            </div>
            <button
              onClick={() => setModalOpen(false)}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {/* Slide Type Selector */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSlideType("project")}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                  slideType === "project"
                    ? "bg-[#5B8DB8]/20 border-[#5B8DB8] text-white ring-1 ring-[#5B8DB8]"
                    : "bg-[#080a10] border-white/10 text-white/70 hover:border-white/20"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-[#5B8DB8]/20 flex items-center justify-center text-[#5B8DB8]">
                  <Gamepad2 size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Project / Product Showcase</div>
                  <div className="text-[10px] text-[#E5E7EB]/50">Game cheats, tools, code, store items</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSlideType("discord")}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                  slideType === "discord"
                    ? "bg-[#5865F2]/20 border-[#5865F2] text-white ring-1 ring-[#5865F2]"
                    : "bg-[#080a10] border-white/10 text-white/70 hover:border-white/20"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2]">
                  <SiDiscord size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Discord Server Embed</div>
                  <div className="text-[10px] text-[#E5E7EB]/50">Live server banner, stats & join button</div>
                </div>
              </button>
            </div>

            {/* Slide heading (card title) */}
            <div className="space-y-1">
              <Label className="text-[11px] text-[#E5E7EB]/70">
                Slide Heading <span className="text-[#E5E7EB]/40">— optional title shown above the card</span>
              </Label>
              <Input
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                placeholder={slideType === "discord" ? "e.g. Join the community" : "e.g. Featured drop"}
                className="bg-[#080a10] border-white/10 text-xs text-white"
              />
            </div>

            {/* If DISCORD EMBED */}
            {slideType === "discord" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#E5E7EB]/70">Server Name</Label>
                    <Input
                      value={dcServerName}
                      onChange={(e) => setDcServerName(e.target.value)}
                      placeholder="e.g. Swats Community"
                      className="bg-[#080a10] border-white/10 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#E5E7EB]/70">Invite URL / Vanities</Label>
                    <Input
                      value={dcInviteUrl}
                      onChange={(e) => setDcInviteUrl(e.target.value)}
                      placeholder="https://discord.gg/swats"
                      className="bg-[#080a10] border-white/10 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#E5E7EB]/70">Total Members</Label>
                    <Input
                      value={dcMembers}
                      onChange={(e) => setDcMembers(e.target.value)}
                      placeholder="e.g. 2,450"
                      className="bg-[#080a10] border-white/10 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#E5E7EB]/70">Online Count</Label>
                    <Input
                      value={dcOnline}
                      onChange={(e) => setDcOnline(e.target.value)}
                      placeholder="e.g. 540"
                      className="bg-[#080a10] border-white/10 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#E5E7EB]/70">Icon URL (optional)</Label>
                    <Input
                      value={dcIcon}
                      onChange={(e) => setDcIcon(e.target.value)}
                      placeholder="https://.../icon.png"
                      className="bg-[#080a10] border-white/10 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#E5E7EB]/70">Banner URL (optional)</Label>
                    <Input
                      value={dcBanner}
                      onChange={(e) => setDcBanner(e.target.value)}
                      placeholder="https://.../banner.png"
                      className="bg-[#080a10] border-white/10 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#E5E7EB]/70">Button Label</Label>
                    <Input
                      value={dcButtonText}
                      onChange={(e) => setDcButtonText(e.target.value)}
                      placeholder="Join Server"
                      className="bg-[#080a10] border-white/10 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#E5E7EB]/70">Card Theme</Label>
                    <Select value={dcTheme} onValueChange={setDcTheme}>
                      <SelectTrigger className="bg-[#080a10] border-white/10 text-xs text-white h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0c0e15] border-white/10 text-white">
                        <SelectItem value="nitro_glass">Nitro Glass</SelectItem>
                        <SelectItem value="ghost">Ghost / Frosted</SelectItem>
                        <SelectItem value="aurora">Aurora Gradient</SelectItem>
                        <SelectItem value="discord">Classic Discord</SelectItem>
                        <SelectItem value="minibanner">Mini Banner</SelectItem>
                        <SelectItem value="square">Square Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-[#E5E7EB]/70">Server Description / Tagline</Label>
                  <Textarea
                    value={dcDescription}
                    onChange={(e) => setDcDescription(e.target.value)}
                    placeholder="Enter server description..."
                    rows={2}
                    className="bg-[#080a10] border-white/10 text-xs text-white resize-none"
                  />
                </div>

                {/* Live Discord Embed Preview Card */}
                <div className="p-4 rounded-2xl bg-[#080a10] border border-[#5865F2]/30 space-y-3">
                  <div className="text-[11px] font-bold text-[#5865F2] flex items-center gap-1.5">
                    <SiDiscord size={13} />
                    <span>Live Discord Embed Preview</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#141824] border border-white/10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center text-[#5865F2] font-bold text-lg">
                        {dcServerName.charAt(0) || "S"}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{dcServerName || "Server Name"}</div>
                        <div className="text-[11px] text-[#E5E7EB]/60 flex items-center gap-2">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> {dcOnline} Online</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white/40" /> {dcMembers} Members</span>
                        </div>
                      </div>
                    </div>
                    <a
                      href={dcInviteUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(88,101,242,0.4)]"
                    >
                      {dcButtonText || "Join Server"}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* If PROJECT SHOWCASE */}
            {slideType === "project" && (
              <div className="space-y-4">
                {/* Project Subtype Pills */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-[#E5E7EB]/70">Project Category</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {PROJECT_TYPES.map((pt) => {
                      const Icon = pt.icon;
                      const isSel = projectSubtype === pt.id;
                      return (
                        <button
                          key={pt.id}
                          type="button"
                          onClick={() => setProjectSubtype(pt.id)}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                            isSel
                              ? "bg-[#5B8DB8]/20 border-[#5B8DB8] text-white"
                              : "bg-[#080a10] border-white/10 text-white/60 hover:text-white"
                          }`}
                        >
                          <Icon size={14} className={isSel ? "text-[#5B8DB8]" : "text-white/40"} />
                          <span className="text-xs font-bold truncate">{pt.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Layout */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-[#E5E7EB]/70">Slide Layout</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "one_sided", label: "One-Sided Centered" },
                      { id: "two_sided", label: "Two-Sided Split" },
                    ].map((L) => (
                      <button
                        key={L.id}
                        type="button"
                        onClick={() => setProjectLayout(L.id)}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          projectLayout === L.id
                            ? "bg-[#5B8DB8]/20 border-[#5B8DB8] text-white"
                            : "bg-[#080a10] border-white/10 text-white/60 hover:text-white"
                        }`}
                      >
                        {L.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[11px] text-[#E5E7EB]/70">Project Title</Label>
                    <Input
                      value={projTitle}
                      onChange={(e) => setProjTitle(e.target.value)}
                      placeholder="e.g. Apex Kernel Mod Menu"
                      className="bg-[#080a10] border-white/10 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#E5E7EB]/70">Price / Tier</Label>
                    <Input
                      value={projPrice}
                      onChange={(e) => setProjPrice(e.target.value)}
                      placeholder="e.g. $19.99 / mo or Free"
                      className="bg-[#080a10] border-white/10 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#E5E7EB]/70">Status / Badge</Label>
                    <Input value={projStatus} onChange={(e) => setProjStatus(e.target.value)} placeholder="Undetected" className="bg-[#080a10] border-white/10 text-xs text-white" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#E5E7EB]/70">Game / Platform</Label>
                    <Input value={projGame} onChange={(e) => setProjGame(e.target.value)} placeholder="Apex Legends" className="bg-[#080a10] border-white/10 text-xs text-white" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#E5E7EB]/70">Language / Stack</Label>
                    <Input value={projLanguage} onChange={(e) => setProjLanguage(e.target.value)} placeholder="C++ / Kernel" className="bg-[#080a10] border-white/10 text-xs text-white" />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-[#E5E7EB]/70">Description & Feature List</Label>
                  <Textarea
                    value={projDescription}
                    onChange={(e) => setProjDescription(e.target.value)}
                    placeholder="Describe key features, supported OS, undetected status..."
                    rows={3}
                    className="bg-[#080a10] border-white/10 text-xs text-white resize-none"
                  />
                </div>

                {/* Gallery Images */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-[#080a10] border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ImageIcon size={13} className="text-[#5B8DB8]" /> Gallery Images <span className="text-[#E5E7EB]/40">({projImages.length})</span>
                    </div>
                    <label className="text-[11px] font-bold text-[#5B8DB8] hover:underline flex items-center gap-1 cursor-pointer">
                      <Upload size={12} /> Upload
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleUploadImage} />
                    </label>
                  </div>
                  {projImages.length === 0 ? (
                    <div className="text-[10px] text-[#E5E7EB]/45 py-3 text-center border border-dashed border-white/10 rounded-xl">
                      No images yet — the first image becomes the cover.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {projImages.map((img, i) => (
                        <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10 group">
                          <img src={fileUrl(img)} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setProjImages(projImages.filter((_, j) => j !== i))}
                            className="absolute top-0.5 right-0.5 w-5 h-5 rounded-md bg-black/70 text-red-300 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Categorized Selectable Tags */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-[#080a10] border border-white/10">
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Tag size={13} className="text-[#5B8DB8]" /> Select Project Tags</span>
                    <span className="text-[10px] text-[#E5E7EB]/50">{projTags.length} selected</span>
                  </div>
                  <div className="space-y-2.5 pt-1">
                    {Object.entries(CATEGORIZED_TAGS).map(([cat, tags]) => (
                      <div key={cat} className="space-y-1">
                        <div className="text-[10px] font-semibold text-[#5B8DB8]">{cat}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map((t) => {
                            const isSelected = projTags.includes(t);
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => toggleTag(t)}
                                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-[#5B8DB8] border-[#5B8DB8] text-white shadow-[0_0_8px_rgba(91,141,184,0.4)]"
                                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                                }`}
                              >
                                {t}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions & Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#E5E7EB]/70">Primary Button Label</Label>
                    <Input
                      value={projButtonText}
                      onChange={(e) => setProjButtonText(e.target.value)}
                      placeholder="e.g. Purchase Access"
                      className="bg-[#080a10] border-white/10 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#E5E7EB]/70">Primary URL</Label>
                    <Input
                      value={projButtonUrl}
                      onChange={(e) => setProjButtonUrl(e.target.value)}
                      placeholder="https://yourstore.com"
                      className="bg-[#080a10] border-white/10 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Secondary Button */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#E5E7EB]/70">Secondary Button Label</Label>
                    <Input value={projSecondaryButtonText} onChange={(e) => setProjSecondaryButtonText(e.target.value)} placeholder="Join Discord" className="bg-[#080a10] border-white/10 text-xs text-white" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#E5E7EB]/70">Secondary URL</Label>
                    <Input value={projSecondaryButtonUrl} onChange={(e) => setProjSecondaryButtonUrl(e.target.value)} placeholder="https://discord.gg/..." className="bg-[#080a10] border-white/10 text-xs text-white" />
                  </div>
                </div>

                {/* Two-Sided Secondary Offer */}
                {projectLayout === "two_sided" && (
                  <div className="space-y-3 p-3.5 rounded-2xl bg-[#0a0d14] border border-[#5B8DB8]/25">
                    <div className="text-[11px] font-bold text-[#5B8DB8] uppercase tracking-wider">Two-Sided: Bundle Offer (right panel)</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-[#E5E7EB]/70">Offer Title</Label>
                        <Input value={proj2Title} onChange={(e) => setProj2Title(e.target.value)} placeholder="Rust Radar" className="bg-[#080a10] border-white/10 text-xs text-white" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-[#E5E7EB]/70">Offer Price</Label>
                        <Input value={proj2Price} onChange={(e) => setProj2Price(e.target.value)} placeholder="$9.99" className="bg-[#080a10] border-white/10 text-xs text-white" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-[#E5E7EB]/70">Offer Description</Label>
                      <Textarea value={proj2Description} onChange={(e) => setProj2Description(e.target.value)} rows={2} placeholder="What is included in this offer?" className="bg-[#080a10] border-white/10 text-xs text-white resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-[#E5E7EB]/70">Offer Game</Label>
                        <Input value={proj2Game} onChange={(e) => setProj2Game(e.target.value)} placeholder="Rust" className="bg-[#080a10] border-white/10 text-xs text-white" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-[#E5E7EB]/70">Offer URL</Label>
                        <Input value={proj2ButtonUrl} onChange={(e) => setProj2ButtonUrl(e.target.value)} placeholder="https://..." className="bg-[#080a10] border-white/10 text-xs text-white" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3.5 border-t border-white/10 flex justify-end gap-2 bg-[#090b10]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="border-white/10 text-white hover:bg-white/5 text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveSlide}
              className="bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold px-5 rounded-xl cursor-pointer"
            >
              Save Slide
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
