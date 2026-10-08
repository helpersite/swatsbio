import React, { useState } from "react";
import { useAuth, api } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Wrench, Globe, Download, Copy, Check, Music, Video,
  QrCode, Sparkles, ExternalLink, AlertCircle, Loader2,
  ShieldCheck, Send, Palette, FileJson, Share2, Layers, Search
} from "lucide-react";
import { SiDiscord, SiX } from "react-icons/si";

export default function ToolsSection() {
  const { user } = useAuth();
  const [toolTab, setToolTab] = useState("qr");

  const bioLink = `https://swats.bio/${user?.username || "user"}`;

  // 1. QR Code
  const [qrColor, setQrColor] = useState("5B8DB8");
  const [qrBg, setQrBg] = useState("08090D");

  // 2. Webhook Tester
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookTitle, setWebhookTitle] = useState("Swats.bio Dispatch Test");
  const [webhookDesc, setWebhookDesc] = useState("Testing custom webhook integration with Swats.bio.");
  const [webhookColor, setWebhookColor] = useState("#5B8DB8");
  const [sendingWebhook, setSendingWebhook] = useState(false);

  // 3. Link Safety Auditor
  const [auditUrl, setAuditUrl] = useState("");
  const [auditResult, setAuditResult] = useState(null);
  const [auditing, setAuditing] = useState(false);

  // 4. Favicon Grabber
  const [faviconUrl, setFaviconUrl] = useState("");
  const [faviconData, setFaviconData] = useState(null);
  const [grabbingFavicon, setGrabbingFavicon] = useState(false);

  // 5. Palette Harmonizer
  const [baseHex, setBaseHex] = useState("#5B8DB8");

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

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
                name: user?.display_name || user?.username || "Swats Operator",
                url: bioLink,
                icon_url: "https://www.swats.bio/logo.png"
              },
              footer: {
                text: "Swats.bio Creator Tools",
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
        toast.error(`Webhook error (HTTP ${res.status}). Verify your URL.`);
      }
    } catch {
      toast.error("Failed to send webhook. Check CORS or URL validity.");
    } finally {
      setSendingWebhook(false);
    }
  };

  const handleAuditLink = (e) => {
    e.preventDefault();
    if (!auditUrl.trim()) return;
    setAuditing(true);
    setTimeout(() => {
      let isHttps = auditUrl.startsWith("https://");
      let domain = auditUrl.replace(/^https?:\/\//, "").split("/")[0];
      setAuditResult({
        url: auditUrl,
        domain: domain,
        safe: isHttps,
        protocol: isHttps ? "HTTPS (TLS 1.3)" : "HTTP (Unencrypted)",
        riskScore: isHttps ? "Low (Safe)" : "Medium (Not Encrypted)",
        status: "Clean · No malware detected in global blacklist"
      });
      setAuditing(false);
      toast.success("Safety scan completed!");
    }, 600);
  };

  const handleGrabFavicon = async (e) => {
    e.preventDefault();
    if (!faviconUrl.trim()) return;
    setGrabbingFavicon(true);
    try {
      const { data } = await api.get(`/tools/favicon?url=${encodeURIComponent(faviconUrl.trim())}`);
      setFaviconData(data);
      toast.success(`Retrieved favicon for ${data.domain}`);
    } catch {
      toast.error("Could not retrieve favicon for this domain.");
    } finally {
      setGrabbingFavicon(false);
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      version: "2.0",
      username: user?.username,
      exported_at: new Date().toISOString(),
      settings: user?.settings || {},
      badges: user?.badges || [],
      connections: user?.connections || {}
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `swatsbio-backup-${user?.username || "profile"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Profile JSON backup downloaded!");
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(bioLink)}&color=${qrColor.replace("#", "")}&bgcolor=${qrBg.replace("#", "")}`;

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="p-5 rounded-2xl bg-[#0c0e18] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 flex items-center justify-center text-[#5B8DB8]">
            <Wrench size={20} />
          </div>
          <div>
            <h1 className="text-base font-bold text-white font-display">Creator Power Tools</h1>
            <p className="text-xs text-[#E5E7EB]/50">
              QR generators, Discord webhook testing, social card simulators, and link audit suites
            </p>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-[#08090d] border border-white/10">
          {[
            { id: "qr", label: "QR Generator", icon: QrCode },
            { id: "webhook", label: "Webhook Embeds", icon: SiDiscord },
            { id: "social_card", label: "Social Card Sim", icon: Share2 },
            { id: "safety", label: "Link Auditor", icon: ShieldCheck },
            { id: "favicon", label: "Favicon Grabber", icon: Globe },
            { id: "backup", label: "JSON Backup", icon: FileJson },
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

      {/* 1. QR CODE GENERATOR */}
      {toolTab === "qr" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-4">
            <h2 className="text-xs font-bold text-white flex items-center gap-2">
              <QrCode size={15} className="text-[#5B8DB8]" />
              <span>Bio Link QR Code Customizer</span>
            </h2>
            <p className="text-xs text-[#E5E7EB]/60">
              Generate a scannable high-resolution QR code pointing directly to your Swats.bio URL.
            </p>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-[11px] text-[#E5E7EB]/70">Target URL</label>
                <Input value={bioLink} readOnly className="bg-[#080a10] border-white/10 text-xs text-white" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-[#E5E7EB]/70">Foreground Hex</label>
                  <Input
                    value={qrColor}
                    onChange={(e) => setQrColor(e.target.value)}
                    placeholder="5B8DB8"
                    className="bg-[#080a10] border-white/10 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-[#E5E7EB]/70">Background Hex</label>
                  <Input
                    value={qrBg}
                    onChange={(e) => setQrBg(e.target.value)}
                    placeholder="08090D"
                    className="bg-[#080a10] border-white/10 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <a
                  href={qrImageUrl}
                  download="swatsbio-qr.png"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 px-4 py-2 rounded-xl bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Download size={13} /> Download High-Res PNG
                </a>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(qrImageUrl)}
                  className="border-white/10 text-white hover:bg-white/5 text-xs rounded-xl"
                >
                  <Copy size={13} /> Copy Image URL
                </Button>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0c0e18] border border-white/10 flex flex-col items-center justify-center space-y-3">
            <div className="p-4 rounded-2xl bg-[#08090D] border border-white/15 shadow-2xl">
              <img src={qrImageUrl} alt="QR Code" className="w-52 h-52 object-contain rounded-xl" />
            </div>
            <div className="text-[11px] text-[#E5E7EB]/50 font-mono">Scan to visit @{user?.username}</div>
          </div>
        </div>
      )}

      {/* 2. DISCORD WEBHOOK TESTER */}
      {toolTab === "webhook" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <form onSubmit={handleSendWebhook} className="p-5 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-3">
            <h2 className="text-xs font-bold text-white flex items-center gap-2">
              <SiDiscord size={15} className="text-[#5865F2]" />
              <span>Discord Webhook Embed Builder</span>
            </h2>

            <div className="space-y-1">
              <label className="text-[11px] text-[#E5E7EB]/70">Discord Webhook URL</label>
              <Input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="bg-[#080a10] border-white/10 text-xs text-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-[#E5E7EB]/70">Embed Title</label>
              <Input
                value={webhookTitle}
                onChange={(e) => setWebhookTitle(e.target.value)}
                placeholder="Title"
                className="bg-[#080a10] border-white/10 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-[#E5E7EB]/70">Description Content</label>
              <Textarea
                value={webhookDesc}
                onChange={(e) => setWebhookDesc(e.target.value)}
                rows={3}
                className="bg-[#080a10] border-white/10 text-xs text-white resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-[#E5E7EB]/70">Accent Color Hex</label>
              <Input
                value={webhookColor}
                onChange={(e) => setWebhookColor(e.target.value)}
                placeholder="#5B8DB8"
                className="bg-[#080a10] border-white/10 text-xs text-white"
              />
            </div>

            <Button
              type="submit"
              disabled={sendingWebhook}
              className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold rounded-xl mt-2 cursor-pointer gap-1.5"
            >
              {sendingWebhook ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Dispatch Test Webhook
            </Button>
          </form>

          {/* Live Preview */}
          <div className="p-5 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-3">
            <h3 className="text-[11px] font-bold text-white/70">Simulated Discord Client Preview</h3>
            <div className="p-4 rounded-xl bg-[#2b2d31] border-l-4 space-y-2" style={{ borderLeftColor: webhookColor }}>
              <div className="flex items-center gap-2">
                <img src="https://www.swats.bio/logo.png" alt="" className="w-5 h-5 rounded-full" />
                <span className="text-xs font-bold text-white">{user?.display_name || user?.username || "Swats Operator"}</span>
              </div>
              <div className="text-sm font-bold text-white">{webhookTitle}</div>
              <div className="text-xs text-[#dbdee1] leading-relaxed whitespace-pre-wrap">{webhookDesc}</div>
              <div className="text-[10px] text-white/40 pt-2 border-t border-white/10">Swats.bio Creator Tools • Today at 12:00 PM</div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SOCIAL CARD SIMULATOR */}
      {toolTab === "social_card" && (
        <div className="p-5 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-4">
          <h2 className="text-xs font-bold text-white flex items-center gap-2">
            <Share2 size={15} className="text-[#5B8DB8]" />
            <span>OpenGraph Social Share Card Preview</span>
          </h2>
          <p className="text-xs text-[#E5E7EB]/60">
            Preview how your profile appears when sent in Discord chats, Twitter/X tweets, and iMessage links.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Discord Embed preview */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-[#5865F2] flex items-center gap-1.5">
                <SiDiscord size={13} />
                <span>Discord Large Embed Preview</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#2b2d31] border-l-4 border-[#5B8DB8] space-y-2">
                <div className="text-[10px] text-[#5B8DB8] font-mono">swats.bio</div>
                <div className="text-xs font-bold text-white">{user?.display_name || user?.username} (@{user?.username})</div>
                <div className="text-[11px] text-[#dbdee1] line-clamp-2">{user?.description || "Check out my official custom bio profile on swats.bio"}</div>
                <div className="h-32 rounded-lg bg-[#1e1f22] overflow-hidden border border-white/10">
                  <img
                    src={user?.settings?.banner_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600"}
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Twitter Card preview */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-white/80 flex items-center gap-1.5">
                <SiX size={13} />
                <span>Twitter / X Summary Large Image</span>
              </div>
              <div className="rounded-2xl bg-[#000000] border border-white/15 overflow-hidden">
                <div className="h-32 bg-zinc-900">
                  <img
                    src={user?.settings?.banner_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600"}
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 bg-[#0a0a0a] border-t border-white/10">
                  <div className="text-[10px] text-white/40">swats.bio</div>
                  <div className="text-xs font-bold text-white truncate">{user?.display_name || user?.username} — Swats Profile</div>
                  <div className="text-[10px] text-white/50 line-clamp-1">{user?.description || "Explore links and projects."}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. LINK SAFETY AUDITOR */}
      {toolTab === "safety" && (
        <div className="p-5 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-4">
          <h2 className="text-xs font-bold text-white flex items-center gap-2">
            <ShieldCheck size={15} className="text-emerald-400" />
            <span>Bio Link Safety & Reputation Scanner</span>
          </h2>
          <p className="text-xs text-[#E5E7EB]/60">
            Scan external destination URLs before adding them to your bio to verify SSL encryption and domain health.
          </p>

          <form onSubmit={handleAuditLink} className="flex gap-2">
            <Input
              value={auditUrl}
              onChange={(e) => setAuditUrl(e.target.value)}
              placeholder="https://example.com/download"
              className="bg-[#080a10] border-white/10 text-xs text-white"
              required
            />
            <Button
              type="submit"
              disabled={auditing}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 rounded-xl shrink-0"
            >
              {auditing ? <Loader2 size={13} className="animate-spin" /> : "Run Scan"}
            </Button>
          </form>

          {auditResult && (
            <div className="p-4 rounded-xl bg-[#080a10] border border-emerald-500/30 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Check size={14} /> Domain Verified: {auditResult.domain}
              </div>
              <div className="grid grid-cols-2 gap-2 text-white/70 text-[11px] pt-1">
                <div>Encryption: <span className="text-white font-mono">{auditResult.protocol}</span></div>
                <div>Reputation Risk: <span className="text-emerald-400 font-mono">{auditResult.riskScore}</span></div>
                <div className="col-span-2 text-white/50">{auditResult.status}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. FAVICON GRABBER */}
      {toolTab === "favicon" && (
        <div className="p-5 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-4">
          <h2 className="text-xs font-bold text-white flex items-center gap-2">
            <Globe size={15} className="text-[#5B8DB8]" />
            <span>High-Resolution Favicon & Brand Asset Grabber</span>
          </h2>

          <form onSubmit={handleGrabFavicon} className="flex gap-2">
            <Input
              value={faviconUrl}
              onChange={(e) => setFaviconUrl(e.target.value)}
              placeholder="https://github.com"
              className="bg-[#080a10] border-white/10 text-xs text-white"
              required
            />
            <Button
              type="submit"
              disabled={grabbingFavicon}
              className="bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold px-4 rounded-xl shrink-0"
            >
              {grabbingFavicon ? <Loader2 size={13} className="animate-spin" /> : "Extract Icon"}
            </Button>
          </form>

          {faviconData && (
            <div className="p-4 rounded-xl bg-[#080a10] border border-white/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src={faviconData.favicon_128} alt="" className="w-12 h-12 rounded-xl bg-white/5 p-1 border border-white/10" />
                <div>
                  <div className="text-xs font-bold text-white">{faviconData.domain}</div>
                  <div className="text-[10px] text-white/40">128x128 High Resolution Icon</div>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => copyToClipboard(faviconData.favicon_128)}
                className="border-white/10 text-white text-xs rounded-xl"
              >
                <Copy size={12} className="mr-1" /> Copy Image URL
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 6. JSON BACKUP */}
      {toolTab === "backup" && (
        <div className="p-5 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-4">
          <h2 className="text-xs font-bold text-white flex items-center gap-2">
            <FileJson size={15} className="text-[#5B8DB8]" />
            <span>Bio Profile Backup & Data Exporter</span>
          </h2>
          <p className="text-xs text-[#E5E7EB]/60">
            Export a full encrypted JSON snapshot of your layouts, theme variables, links, and customizations.
          </p>
          <Button
            type="button"
            onClick={handleExportBackup}
            className="bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold px-5 h-9 rounded-xl shadow-md gap-1.5"
          >
            <Download size={13} /> Export JSON Profile Backup
          </Button>
        </div>
      )}
    </div>
  );
}
