import React, { useState, useEffect } from "react";
import { useAuth, api } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Wrench, Download, Copy, QrCode, Share2, Eye
} from "lucide-react";
import { SiDiscord, SiX } from "react-icons/si";

export default function ToolsSection() {
  const { user, mutate } = useAuth();
  const [toolTab, setToolTab] = useState("metadata");

  const bioLink = `https://feds.lol/${user?.username || "user"}`;
  const userSettings = user?.settings || {};

  // ──────────────────────────────────────────────
  // 1. METADATA & OPENGRAPH STUDIO STATE
  // ──────────────────────────────────────────────
  const [metaTitle, setMetaTitle] = useState(userSettings.meta_title || `${user?.display_name || user?.username || "Creator"} (@${user?.username || "user"}) • feds.lol`);
  const [metaDesc, setMetaDesc] = useState(userSettings.meta_desc || user?.description || "Explore my official links, social channels, and exclusive content on feds.lol.");
  const [metaThemeColor, setMetaThemeColor] = useState(userSettings.meta_theme_color || userSettings.accent_color || "#5B8DB8");
  const [metaImage, setMetaImage] = useState(userSettings.meta_image || userSettings.profile_embed_image || userSettings.pfp || "");
  const [metaKeywords, setMetaKeywords] = useState(userSettings.meta_keywords || "feds, feds.lol, biolink, links, creator, cyber halo, underground");
  const [twitterCardType, setTwitterCardType] = useState(userSettings.twitter_card || "summary_large_image");
  const [savingMeta, setSavingMeta] = useState(false);

  useEffect(() => {
    if (user?.settings) {
      if (user.settings.meta_title) setMetaTitle(user.settings.meta_title);
      if (user.settings.meta_desc) setMetaDesc(user.settings.meta_desc);
      if (user.settings.meta_theme_color) setMetaThemeColor(user.settings.meta_theme_color);
      if (user.settings.meta_image) setMetaImage(user.settings.meta_image);
      if (user.settings.meta_keywords) setMetaKeywords(user.settings.meta_keywords);
      if (user.settings.twitter_card) setTwitterCardType(user.settings.twitter_card);
    }
  }, [user]);

  const handleSaveMetadata = async () => {
    setSavingMeta(true);
    try {
      const currentSettings = { ...(user?.settings || {}) };
      const updatedSettings = {
        ...currentSettings,
        meta_title: metaTitle.trim(),
        meta_desc: metaDesc.trim(),
        meta_theme_color: metaThemeColor.trim(),
        meta_image: metaImage.trim(),
        meta_keywords: metaKeywords.trim(),
        twitter_card: twitterCardType,
        profile_embed_image: metaImage.trim() || currentSettings.profile_embed_image
      };

      await api.put("/profile", { settings: updatedSettings });
      if (mutate) await mutate();
      toast.success("Metadata & OpenGraph settings saved to your live bio!");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to save metadata settings.");
    } finally {
      setSavingMeta(false);
    }
  };

  // ──────────────────────────────────────────────
  // 2. DISCORD WEBHOOK STUDIO STATE
  // ──────────────────────────────────────────────
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookTitle, setWebhookTitle] = useState("⚡ Swats.bio Dispatch");
  const [webhookDesc, setWebhookDesc] = useState("Check out my latest updates, music tracks, and social links!");
  const [webhookColor, setWebhookColor] = useState("#5B8DB8");
  const [webhookAuthor, setWebhookAuthor] = useState(user?.display_name || user?.username || "Swats Operator");
  const [webhookThumb, setWebhookThumb] = useState("https://www.swats.bio/logo.png");
  const [webhookImg, setWebhookImg] = useState("");
  const [sendingWebhook, setSendingWebhook] = useState(false);

  const handleSendWebhook = async (e) => {
    e.preventDefault();
    if (!webhookUrl.trim()) return toast.error("Please enter a Discord Webhook URL");
    setSendingWebhook(true);
    try {
      const hexColor = parseInt(webhookColor.replace("#", ""), 16) || 0x5B8DB8;
      const res = await fetch(webhookUrl.trim(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title: webhookTitle,
              description: webhookDesc,
              color: hexColor,
              author: {
                name: webhookAuthor,
                url: bioLink,
                icon_url: "https://www.swats.bio/logo.png"
              },
              thumbnail: webhookThumb ? { url: webhookThumb } : undefined,
              image: webhookImg ? { url: webhookImg } : undefined,
              footer: {
                text: "Swats.bio Creator Studio",
                icon_url: "https://www.swats.bio/logo.png"
              },
              timestamp: new Date().toISOString()
            }
          ]
        })
      });
      if (res.ok || res.status === 204) {
        toast.success("Webhook embed successfully dispatched to Discord!");
      } else {
        toast.error(`Webhook error (HTTP ${res.status}). Verify your URL permissions.`);
      }
    } catch {
      toast.error("Failed to dispatch webhook. Check CORS or URL validity.");
    } finally {
      setSendingWebhook(false);
    }
  };

  // ──────────────────────────────────────────────
  // 3. QR CODE GENERATOR STATE
  // ──────────────────────────────────────────────
  const [qrColor, setQrColor] = useState("5B8DB8");
  const [qrBg, setQrBg] = useState("08090D");
  const [qrSize, setQrSize] = useState("350x350");

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}&data=${encodeURIComponent(bioLink)}&color=${qrColor.replace("#", "")}&bgcolor=${qrBg.replace("#", "")}`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* ────────────────────────────────────────────────────────── */}
      {/* TOP BANNER & TOOL NAVIGATION */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-[#0c0e18] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 flex items-center justify-center text-[#5B8DB8] shadow-lg">
            <Wrench size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <span>Creator Tools Studio</span>
              <span className="px-2 py-0.5 rounded-full bg-[#5B8DB8]/20 text-[#5B8DB8] text-[10px] font-mono font-bold border border-[#5B8DB8]/30">V3.0</span>
            </h1>
            <p className="text-xs text-[#E5E7EB]/60">
              OpenGraph metadata customization, Discord Webhook embed dispatchers & QR code generator
            </p>
          </div>
        </div>

        {/* Tools Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1.5 rounded-xl bg-[#08090d] border border-white/10">
          {[
            { id: "metadata", label: "Metadata & Embeds", icon: Share2 },
            { id: "webhook", label: "Discord Webhooks", icon: SiDiscord },
            { id: "qr", label: "QR Generator", icon: QrCode },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setToolTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                toolTab === t.id
                  ? "bg-[#5B8DB8] text-white shadow-md"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <t.icon size={13} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. METADATA & OPENGRAPH CUSTOMIZER + LIVE SIMULATORS */}
      {/* ────────────────────────────────────────────────────────── */}
      {toolTab === "metadata" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="p-5 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 font-display">
                  <Share2 size={16} className="text-[#5B8DB8]" />
                  <span>Metadata & Embed Customizer</span>
                </h2>
                <Button
                  size="sm"
                  onClick={handleSaveMetadata}
                  disabled={savingMeta}
                  className="bg-[#5B8DB8] hover:bg-[#4a7a9f] text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                >
                  {savingMeta ? "Saving..." : "Save Settings"}
                </Button>
              </div>

              <p className="text-xs text-[#E5E7EB]/60">
                Customize how your bio link appears when shared on Discord, Twitter/X, iMessage, and search engines.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1">OpenGraph Meta Title</label>
                  <Input
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="e.g. Creator Name (@username) • Swats.bio"
                    className="text-xs bg-[#08090d] border-white/10 rounded-xl text-white focus:border-[#5B8DB8]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1">Meta Description</label>
                  <Textarea
                    value={metaDesc}
                    onChange={(e) => setMetaDesc(e.target.value)}
                    placeholder="Brief description for search engines and social cards..."
                    rows={3}
                    className="text-xs bg-[#08090d] border-white/10 rounded-xl text-white focus:border-[#5B8DB8]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-white/80 block mb-1">Theme / Embed Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={metaThemeColor.startsWith("#") ? metaThemeColor : "#5B8DB8"}
                        onChange={(e) => setMetaThemeColor(e.target.value)}
                        className="w-8 h-8 rounded-lg border border-white/20 bg-transparent cursor-pointer"
                      />
                      <Input
                        value={metaThemeColor}
                        onChange={(e) => setMetaThemeColor(e.target.value)}
                        placeholder="#5B8DB8"
                        className="text-xs bg-[#08090d] border-white/10 rounded-xl text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white/80 block mb-1">Twitter Card Style</label>
                    <select
                      value={twitterCardType}
                      onChange={(e) => setTwitterCardType(e.target.value)}
                      className="w-full h-9 rounded-xl bg-[#08090d] border border-white/10 text-xs text-white px-3 focus:border-[#5B8DB8]"
                    >
                      <option value="summary_large_image">Large Banner Image</option>
                      <option value="summary">Small Thumbnail Card</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1">Custom Embed Banner / Image URL</label>
                  <Input
                    value={metaImage}
                    onChange={(e) => setMetaImage(e.target.value)}
                    placeholder="https://... or upload in Profile Editor"
                    className="text-xs bg-[#08090d] border-white/10 rounded-xl text-white focus:border-[#5B8DB8]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live Previews Column */}
          <div className="lg:col-span-6 space-y-4">
            {/* Discord Simulator */}
            <div className="p-5 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <SiDiscord className="text-[#5865F2]" />
                  <span>Discord Link Preview (Live Simulation)</span>
                </span>
                <span className="text-[10px] text-white/40">Real-time</span>
              </div>

              {/* Discord Message Bubble */}
              <div className="p-4 rounded-xl bg-[#2B2D31] border border-white/5 space-y-2">
                <div className="text-xs text-[#00A8FC] hover:underline cursor-pointer">
                  {bioLink}
                </div>

                {/* Discord Embed Box */}
                <div
                  className="rounded-lg bg-[#1E1F22] p-3.5 border-l-4 space-y-2"
                  style={{ borderLeftColor: metaThemeColor || "#5B8DB8" }}
                >
                  <div className="text-[10px] font-bold text-white/60">Swats.bio</div>
                  <div className="text-xs font-bold text-[#00A8FC] hover:underline cursor-pointer">
                    {metaTitle || "Swats.bio Profile"}
                  </div>
                  <div className="text-xs text-white/80 leading-relaxed">
                    {metaDesc || "Explore my links and bio."}
                  </div>
                  {metaImage && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-white/5 max-h-48">
                      <img src={metaImage} alt="Embed banner" className="w-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Twitter / X Simulator */}
            <div className="p-5 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <SiX className="text-white" />
                  <span>X / Twitter Card Preview</span>
                </span>
                <span className="text-[10px] text-white/40">{twitterCardType}</span>
              </div>

              <div className="rounded-2xl border border-white/15 bg-black overflow-hidden shadow-lg">
                {metaImage && twitterCardType === "summary_large_image" && (
                  <div className="w-full aspect-[2/1] bg-[#111] overflow-hidden">
                    <img src={metaImage} alt="Twitter card" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-3.5 space-y-1">
                  <div className="text-[11px] text-white/50">swats.bio</div>
                  <div className="text-xs font-bold text-white truncate">{metaTitle}</div>
                  <div className="text-xs text-white/70 line-clamp-2">{metaDesc}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. DISCORD WEBHOOK STUDIO */}
      {/* ────────────────────────────────────────────────────────── */}
      {toolTab === "webhook" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-5 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 font-display">
              <SiDiscord className="text-[#5865F2]" />
              <span>Discord Webhook Embed Dispatcher</span>
            </h2>
            <p className="text-xs text-[#E5E7EB]/60">
              Build and dispatch customized embeds directly into any Discord server channel via Webhooks.
            </p>

            <form onSubmit={handleSendWebhook} className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-white/80 block mb-1">Discord Webhook URL</label>
                <Input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="text-xs bg-[#08090d] border-white/10 rounded-xl text-white focus:border-[#5B8DB8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1">Author Name</label>
                  <Input
                    value={webhookAuthor}
                    onChange={(e) => setWebhookAuthor(e.target.value)}
                    className="text-xs bg-[#08090d] border-white/10 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1">Embed Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={webhookColor.startsWith("#") ? webhookColor : "#5B8DB8"}
                      onChange={(e) => setWebhookColor(e.target.value)}
                      className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border border-white/20"
                    />
                    <Input
                      value={webhookColor}
                      onChange={(e) => setWebhookColor(e.target.value)}
                      className="text-xs bg-[#08090d] border-white/10 rounded-xl text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/80 block mb-1">Embed Title</label>
                <Input
                  value={webhookTitle}
                  onChange={(e) => setWebhookTitle(e.target.value)}
                  className="text-xs bg-[#08090d] border-white/10 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/80 block mb-1">Embed Description</label>
                <Textarea
                  value={webhookDesc}
                  onChange={(e) => setWebhookDesc(e.target.value)}
                  rows={3}
                  className="text-xs bg-[#08090d] border-white/10 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1">Thumbnail URL</label>
                  <Input
                    value={webhookThumb}
                    onChange={(e) => setWebhookThumb(e.target.value)}
                    className="text-xs bg-[#08090d] border-white/10 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1">Image Banner URL</label>
                  <Input
                    value={webhookImg}
                    onChange={(e) => setWebhookImg(e.target.value)}
                    placeholder="Optional banner image"
                    className="text-xs bg-[#08090d] border-white/10 rounded-xl text-white"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={sendingWebhook || !webhookUrl.trim()}
                className="w-full bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold h-10 rounded-xl shadow-lg mt-2 cursor-pointer"
              >
                {sendingWebhook ? "Dispatching..." : "Send Webhook Embed to Discord"}
              </Button>
            </form>
          </div>

          <div className="lg:col-span-5 p-5 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-3 shadow-xl">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Eye size={14} className="text-[#5B8DB8]" />
              <span>Live Embed Visualizer</span>
            </span>

            <div className="p-4 rounded-xl bg-[#2B2D31] space-y-2">
              <div
                className="rounded-lg bg-[#1E1F22] p-4 border-l-4 space-y-2"
                style={{ borderLeftColor: webhookColor || "#5B8DB8" }}
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  {webhookThumb && <img src={webhookThumb} alt="thumb" className="w-5 h-5 rounded-full" />}
                  <span>{webhookAuthor}</span>
                </div>
                <div className="text-xs font-bold text-[#00A8FC]">{webhookTitle}</div>
                <div className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap">{webhookDesc}</div>
                {webhookImg && (
                  <div className="rounded-lg overflow-hidden border border-white/5 mt-2">
                    <img src={webhookImg} alt="img" className="w-full object-cover" />
                  </div>
                )}
                <div className="text-[10px] text-white/40 pt-1 flex items-center justify-between border-t border-white/5">
                  <span>Swats.bio Creator Studio</span>
                  <span>Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. QR CODE GENERATOR */}
      {/* ────────────────────────────────────────────────────────── */}
      {toolTab === "qr" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 p-5 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 font-display">
              <QrCode size={16} className="text-[#5B8DB8]" />
              <span>Bio Link QR Code Customizer</span>
            </h2>
            <p className="text-xs text-[#E5E7EB]/60">
              Generate scannable high-resolution QR codes pointing directly to your Swats.bio URL.
            </p>

            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1">QR Code Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={`#${qrColor.replace("#", "")}`}
                      onChange={(e) => setQrColor(e.target.value.replace("#", ""))}
                      className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border border-white/20"
                    />
                    <Input
                      value={qrColor}
                      onChange={(e) => setQrColor(e.target.value)}
                      className="text-xs bg-[#08090d] border-white/10 rounded-xl text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={`#${qrBg.replace("#", "")}`}
                      onChange={(e) => setQrBg(e.target.value.replace("#", ""))}
                      className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border border-white/20"
                    />
                    <Input
                      value={qrBg}
                      onChange={(e) => setQrBg(e.target.value)}
                      className="text-xs bg-[#08090d] border-white/10 rounded-xl text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#08090d] border border-white/10 space-y-2">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Target Bio URL</div>
                <div className="text-xs text-[#5B8DB8] font-mono truncate">{bioLink}</div>
              </div>

              <div className="flex gap-2">
                <a
                  href={qrImageUrl}
                  download={`swatsbio-qr-${user?.username || "profile"}.png`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 h-9 rounded-xl bg-[#5B8DB8] hover:bg-[#4a7a9f] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow cursor-pointer"
                >
                  <Download size={13} />
                  <span>Download High-Res PNG</span>
                </a>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(qrImageUrl)}
                  className="border-white/10 text-white hover:bg-white/5 text-xs h-9 rounded-xl cursor-pointer"
                >
                  <Copy size={13} className="mr-1" />
                  <span>Copy Link</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 p-5 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-3 shadow-xl flex flex-col items-center justify-center text-center">
            <div className="p-4 rounded-2xl bg-white border border-white/20 shadow-2xl">
              <img src={qrImageUrl} alt="QR Code Preview" className="w-56 h-56 rounded-xl object-contain" />
            </div>
            <p className="text-xs text-white/50 pt-2">Scan with camera to open https://swats.bio/{user?.username}</p>
          </div>
        </div>
      )}
    </div>
  );
}
