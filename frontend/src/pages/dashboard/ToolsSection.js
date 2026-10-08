import React, { useState } from "react";
import { useAuth, api } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Wrench, Globe, Download, Copy, Check, Music, Video,
  ShoppingBag, QrCode, Sparkles, ExternalLink, AlertCircle, Loader2
} from "lucide-react";

export default function ToolsSection() {
  const { user } = useAuth();
  const [toolTab, setToolTab] = useState("favicon");

  // Favicon Grabber
  const [faviconUrl, setFaviconUrl] = useState("");
  const [faviconData, setFaviconData] = useState(null);
  const [grabbingFavicon, setGrabbingFavicon] = useState(false);
  const [copiedLink, setCopiedLink] = useState(null);

  // Media Tool
  const [mediaUrl, setMediaUrl] = useState("");
  const [testedMedia, setTestedMedia] = useState(null);

  // QR Code generator
  const bioLink = `https://swats.bio/${user?.username || ""}`;
  const [qrColor, setQrColor] = useState("5B8DB8");

  // Handle Favicon Grab
  const handleGrabFavicon = async (e) => {
    e?.preventDefault();
    if (!faviconUrl.trim()) return;
    setGrabbingFavicon(true);
    try {
      const { data } = await api.get(`/tools/favicon?url=${encodeURIComponent(faviconUrl.trim())}`);
      setFaviconData(data);
      toast.success(`Retrieved favicon for ${data.domain}`);
    } catch (err) {
      toast.error("Could not retrieve favicon for this domain.");
    } finally {
      setGrabbingFavicon(false);
    }
  };

  // Copy helper
  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedLink(null), 2000);
  };

  // Test Media Link
  const handleTestMedia = (e) => {
    e?.preventDefault();
    if (!mediaUrl.trim()) return;
    setTestedMedia(mediaUrl.trim());
    toast.success("Media URL loaded for playback testing!");
  };

  const isVideoUrl = (url) => /\.(mp4|webm|mov)(?:[?#].*)?$/i.test(url || "");

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(bioLink)}&color=${qrColor.replace("#", "")}&bgcolor=08090B`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl swat-glass border border-[#4A6B8A]/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 flex items-center justify-center text-[#5B8DB8]">
            <Wrench size={20} />
          </div>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-black text-white">Creator Tools</h1>
            <p className="text-xs text-[#E5E7EB]/60">Favicon extractors, media helpers, QR generators & store previews.</p>
          </div>
        </div>

        {/* Tool Category Selector */}
        <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-black/40 border border-white/10">
          {[
            { id: "favicon", label: "Favicon Grabber", icon: Globe },
            { id: "media", label: "Media & Streams", icon: Music },
            { id: "qr", label: "QR Generator", icon: QrCode },
            { id: "store", label: "Storefront", icon: ShoppingBag },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setToolTab(t.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                toolTab === t.id
                  ? "bg-[#5B8DB8] text-white shadow-lg"
                  : "text-[#E5E7EB]/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <t.icon size={13} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 1. FAVICON GRABBER */}
      {toolTab === "favicon" && (
        <div className="rounded-3xl swat-glass border border-[#4A6B8A]/30 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe size={18} className="text-[#5B8DB8]" /> High-Res Favicon Grabber
            </h2>
            <p className="text-xs text-[#E5E7EB]/50 mt-0.5">
              Enter any domain, website, or social platform to instantly extract and download its high-resolution favicons.
            </p>
          </div>

          <form onSubmit={handleGrabFavicon} className="flex gap-2 max-w-xl">
            <Input
              value={faviconUrl}
              onChange={(e) => setFaviconUrl(e.target.value)}
              placeholder="e.g. spotify.com, discord.com, github.com"
              className="bg-black/40 border-white/15 rounded-2xl text-white placeholder:text-white/30 h-11"
            />
            <Button
              type="submit"
              disabled={grabbingFavicon || !faviconUrl.trim()}
              className="h-11 px-5 rounded-2xl bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white font-bold shrink-0"
            >
              {grabbingFavicon ? "Extracting..." : "Grab Icon"}
            </Button>
          </form>

          {faviconData && (
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4 animate-in fade-in duration-200">
              <div className="text-sm font-bold text-white flex items-center justify-between">
                <span>Extracted Assets for <code className="text-[#5B8DB8]">{faviconData.domain}</code></span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 128px */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center text-center space-y-3">
                  <img src={faviconData.favicon_128} alt="128px" className="w-16 h-16 rounded-xl object-contain bg-white/5 p-1 border border-white/10 shadow-lg" />
                  <div>
                    <div className="text-xs font-bold text-white">128x128 High-Res</div>
                    <div className="text-[10px] text-[#E5E7EB]/40">Recommended for Bio Links</div>
                  </div>
                  <div className="flex gap-2 w-full pt-1">
                    <a
                      href={faviconData.favicon_128}
                      download={`${faviconData.domain}_128.png`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-1.5 rounded-xl bg-[#5B8DB8]/20 hover:bg-[#5B8DB8] text-[#5B8DB8] hover:text-white text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                    >
                      <Download size={12} /> Open
                    </a>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(faviconData.favicon_128, "128")}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#E5E7EB]"
                    >
                      {copiedLink === "128" ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>

                {/* 64px */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center text-center space-y-3">
                  <img src={faviconData.favicon_64} alt="64px" className="w-12 h-12 rounded-xl object-contain bg-white/5 p-1 border border-white/10 shadow-md" />
                  <div>
                    <div className="text-xs font-bold text-white">64x64 Medium</div>
                    <div className="text-[10px] text-[#E5E7EB]/40">Social Icons & Badges</div>
                  </div>
                  <div className="flex gap-2 w-full pt-1">
                    <a
                      href={faviconData.favicon_64}
                      download={`${faviconData.domain}_64.png`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-1.5 rounded-xl bg-[#5B8DB8]/20 hover:bg-[#5B8DB8] text-[#5B8DB8] hover:text-white text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                    >
                      <Download size={12} /> Open
                    </a>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(faviconData.favicon_64, "64")}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#E5E7EB]"
                    >
                      {copiedLink === "64" ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>

                {/* Direct ICO */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center text-center space-y-3">
                  <img src={faviconData.duckduckgo} alt="ICO" className="w-10 h-10 rounded-lg object-contain bg-white/5 p-1 border border-white/10" />
                  <div>
                    <div className="text-xs font-bold text-white">Direct .ICO File</div>
                    <div className="text-[10px] text-[#E5E7EB]/40">Native Root Icon</div>
                  </div>
                  <div className="flex gap-2 w-full pt-1">
                    <a
                      href={faviconData.duckduckgo}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-1.5 rounded-xl bg-[#5B8DB8]/20 hover:bg-[#5B8DB8] text-[#5B8DB8] hover:text-white text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                    >
                      <Download size={12} /> Open
                    </a>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(faviconData.duckduckgo, "ico")}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#E5E7EB]"
                    >
                      {copiedLink === "ico" ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {toolTab === "media" && (
        <div className="rounded-3xl swat-glass border border-[#4A6B8A]/30 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Music size={18} className="text-[#5B8DB8]" /> MP3 & MP4 Stream Inspector
            </h2>
            <p className="text-xs text-[#E5E7EB]/50 mt-0.5">
              Inspect, test direct audio/video streaming streams, and quickly save links directly to your public bio background player.
            </p>
          </div>

          <form onSubmit={handleTestMedia} className="flex gap-2 max-w-xl">
            <Input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="Paste direct audio/video URL (.mp3, .mp4, .ogg, cdn link)..."
              className="bg-black/40 border-white/15 rounded-2xl text-white placeholder:text-white/30 h-11"
            />
            <Button
              type="submit"
              disabled={!mediaUrl.trim()}
              className="h-11 px-5 rounded-2xl bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white font-bold shrink-0"
            >
              Test Stream
            </Button>
          </form>

          {testedMedia && (
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4 animate-in fade-in duration-200">
              <div className="text-sm font-bold text-white flex items-center justify-between">
                <span>Live Stream Media Player</span>
                <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active Source
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col gap-3">
                {isVideoUrl(testedMedia) ? (
                  <video controls playsInline src={testedMedia} className="max-h-[60vh] w-full rounded-md bg-black" />
                ) : (
                  <audio controls src={testedMedia} className="w-full h-10 accent-[#5B8DB8]" />
                )}
                <div className="text-[11px] font-mono text-[#E5E7EB]/50 truncate">{testedMedia}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. QR CODE GENERATOR */}
      {toolTab === "qr" && (
        <div className="rounded-3xl swat-glass border border-[#4A6B8A]/30 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <QrCode size={18} className="text-[#5B8DB8]" /> Bio QR Code Generator
            </h2>
            <p className="text-xs text-[#E5E7EB]/50 mt-0.5">
              High-resolution QR code pointing directly to your profile. Perfect for streams, cards, and socials.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#E5E7EB]/60 font-semibold mb-1 block">Bio Destination URL</label>
                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 font-mono text-xs text-[#5B8DB8] truncate">
                  {bioLink}
                </div>
              </div>

              <div>
                <label className="text-xs text-[#E5E7EB]/60 font-semibold mb-1.5 block">QR Accent Color</label>
                <div className="flex gap-2">
                  {[
                    { id: "5B8DB8", label: "Blue" },
                    { id: "22C55E", label: "Green" },
                    { id: "A855F7", label: "Purple" },
                    { id: "EAB308", label: "Gold" },
                    { id: "FFFFFF", label: "White" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setQrColor(c.id)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        qrColor === c.id ? "bg-[#5B8DB8] text-white border-[#5B8DB8]" : "bg-white/5 border-white/10 text-[#E5E7EB]/70"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <a
                  href={qrImageUrl}
                  target="_blank"
                  download="swats_bio_qr.png"
                  rel="noreferrer"
                  className="px-5 py-2.5 rounded-2xl bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg"
                >
                  <Download size={14} /> Download QR Code
                </a>
                <Button
                  onClick={() => copyToClipboard(qrImageUrl, "qr")}
                  variant="outline"
                  className="rounded-2xl border-white/20 text-xs"
                >
                  {copiedLink === "qr" ? <Check size={14} /> : <Copy size={14} />}
                </Button>
              </div>
            </div>

            {/* QR Visual */}
            <div className="flex justify-center">
              <div className="p-5 rounded-3xl bg-[#08090B] border border-[#4A6B8A]/40 shadow-2xl flex flex-col items-center gap-3">
                <img src={qrImageUrl} alt="QR Code" className="w-48 h-48 rounded-xl object-contain shadow-inner" />
                <span className="text-xs font-mono text-[#5B8DB8] font-bold">@{user?.username}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. STOREFRONT CREATOR (COMING SOON) */}
      {toolTab === "store" && (
        <div className="rounded-3xl swat-glass border border-[#4A6B8A]/30 p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 flex items-center justify-center text-[#5B8DB8] mx-auto shadow-2xl">
            <ShoppingBag size={30} />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 text-[#5B8DB8] text-xs font-bold uppercase tracking-wider">
              <Sparkles size={12} /> Coming Soon...
            </div>
            <h2 className="text-2xl font-black text-white">Full Storefront & Merch Builder</h2>
            <p className="text-xs text-[#E5E7EB]/60 leading-relaxed">
              Showcase digital goods, commission services, merchandise, and keys directly on your bio page with external checkout integrations (Stripe, Sellix, Shopify, Gumroad).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 max-w-lg mx-auto text-left text-xs text-[#E5E7EB]/70 space-y-2">
            <div className="font-bold text-white flex items-center gap-1.5">
              <AlertCircle size={14} className="text-[#5B8DB8]" /> Transparent Payments Policy:
            </div>
            <p className="text-[11px] leading-relaxed text-[#E5E7EB]/60">
              Payments will <strong>NOT</strong> be handled or processed through us. You will connect your own direct external checkout links so you keep 100% of your earnings.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
