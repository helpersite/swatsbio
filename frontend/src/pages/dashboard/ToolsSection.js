import React, { useState, useEffect, useMemo } from "react";
import { useAuth, api } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Wrench, Globe, Download, Copy, Check, Music, Video,
  QrCode, Sparkles, ExternalLink, AlertCircle, Loader2,
  ShieldCheck, Send, Palette, FileJson, Share2, Layers, Search,
  Terminal, Type, Cpu, CheckCircle2, Sliders, RefreshCw, Eye,
  HelpCircle, Hash, AtSign, ArrowRight, Upload, Key, Shield, User,
  Fingerprint, Activity, Radio, Lock
} from "lucide-react";
import { SiDiscord, SiX, SiGithub, SiInstagram, SiTiktok, SiYoutube, SiTwitch, SiTelegram, SiReddit, SiSpotify, SiSteam } from "react-icons/si";

// ──────────────────────────────────────────────
// UNICODE FONT CONVERSION MAPS
// ──────────────────────────────────────────────
const UNICODE_FONTS = [
  {
    name: "Gothic / Fraktur",
    transform: (text) => {
      const normal = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const gothic = "𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ0123456789";
      return text.split("").map(c => {
        const idx = normal.indexOf(c);
        return idx !== -1 ? Array.from(gothic)[idx] : c;
      }).join("");
    }
  },
  {
    name: "Double-Struck / Blackboard",
    transform: (text) => {
      const normal = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const double = "𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡";
      return text.split("").map(c => {
        const idx = normal.indexOf(c);
        return idx !== -1 ? Array.from(double)[idx] : c;
      }).join("");
    }
  },
  {
    name: "Script / Cursive",
    transform: (text) => {
      const normal = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const script = "𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩";
      return text.split("").map(c => {
        const idx = normal.indexOf(c);
        return idx !== -1 ? Array.from(script)[idx] : c;
      }).join("");
    }
  },
  {
    name: "Small Caps",
    transform: (text) => {
      const normal = "abcdefghijklmnopqrstuvwxyz";
      const smallCaps = "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ";
      return text.split("").map(c => {
        const idx = normal.indexOf(c.toLowerCase());
        return idx !== -1 ? Array.from(smallCaps)[idx] : c;
      }).join("");
    }
  },
  {
    name: "Bold Serif",
    transform: (text) => {
      const normal = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const boldSerif = "𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗";
      return text.split("").map(c => {
        const idx = normal.indexOf(c);
        return idx !== -1 ? Array.from(boldSerif)[idx] : c;
      }).join("");
    }
  },
  {
    name: "Monospace / Code",
    transform: (text) => {
      const normal = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const mono = "𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿";
      return text.split("").map(c => {
        const idx = normal.indexOf(c);
        return idx !== -1 ? Array.from(mono)[idx] : c;
      }).join("");
    }
  },
  {
    name: "Circled / Bubble",
    transform: (text) => {
      const normal = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const bubble = "ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ⓪①②③④⑤⑥⑦⑧⑨";
      return text.split("").map(c => {
        const idx = normal.indexOf(c);
        return idx !== -1 ? Array.from(bubble)[idx] : c;
      }).join("");
    }
  },
  {
    name: "Aesthetic Spaced",
    transform: (text) => text.split("").join(" ")
  },
  {
    name: "Inverted / Upside Down",
    transform: (text) => {
      const normal = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const flipped = "ɐqɔpǝɟƃɥᴉɾʞlɯuodbɹsʇnʌʍxʎz∀𐐒ƆᗡƎℲ⅁HIſʞ˥WNOԀΌᴚS┴∩ΛMX⅄Z";
      return text.split("").reverse().map(c => {
        const idx = normal.indexOf(c);
        return idx !== -1 ? Array.from(flipped)[idx] : c;
      }).join("");
    }
  }
];

// DISCORD PERMISSIONS BITWISE FLAGS
const DISCORD_PERMISSIONS = [
  { name: "Administrator", value: 0x8, desc: "Full administrative bypass" },
  { name: "Manage Server", value: 0x20, desc: "Edit server settings & vanity" },
  { name: "Manage Roles", value: 0x10000000, desc: "Assign and create server roles" },
  { name: "Manage Channels", value: 0x10, desc: "Create, edit, or delete channels" },
  { name: "Kick Members", value: 0x2, desc: "Remove rule-breakers" },
  { name: "Ban Members", value: 0x4, desc: "Permanently ban accounts" },
  { name: "Send Messages", value: 0x800, desc: "Post in text channels" },
  { name: "Embed Links", value: 0x4000, desc: "Render rich embeds & leaderboards" },
  { name: "Attach Files", value: 0x8000, desc: "Upload images and media" },
  { name: "Read Message History", value: 0x10000, desc: "View past chat logs" },
  { name: "Mention Everyone", value: 0x20000, desc: "Ping @everyone and @here" },
  { name: "Use External Emojis", value: 0x40000, desc: "Display cross-server emojis" },
  { name: "Add Reactions", value: 0x40, desc: "React with emoji icons" },
  { name: "Connect (Voice)", value: 0x100000, desc: "Join voice channels" },
  { name: "Speak (Voice)", value: 0x200000, desc: "Transmit voice audio" },
];

export default function ToolsSection() {
  const { user, mutate } = useAuth();
  const [toolTab, setToolTab] = useState("metadata");

  const bioLink = `https://swats.bio/${user?.username || "user"}`;
  const userSettings = user?.settings || {};

  // ──────────────────────────────────────────────
  // 1. METADATA & OPENGRAPH STUDIO STATE
  // ──────────────────────────────────────────────
  const [metaTitle, setMetaTitle] = useState(userSettings.meta_title || `${user?.display_name || user?.username || "Creator"} (@${user?.username || "user"}) • Swats.bio`);
  const [metaDesc, setMetaDesc] = useState(userSettings.meta_desc || user?.description || "Explore my official links, social channels, and exclusive content on Swats.bio.");
  const [metaThemeColor, setMetaThemeColor] = useState(userSettings.meta_theme_color || userSettings.accent_color || "#5B8DB8");
  const [metaImage, setMetaImage] = useState(userSettings.meta_image || userSettings.profile_embed_image || userSettings.pfp || "");
  const [metaKeywords, setMetaKeywords] = useState(userSettings.meta_keywords || "swats bio, biolink, links, creator, gaming, social");
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

  // ──────────────────────────────────────────────
  // 4. UNICODE AESTHETIC FONT GENERATOR STATE
  // ──────────────────────────────────────────────
  const [unicodeInput, setUnicodeInput] = useState(user?.display_name || user?.username || "Aesthetic Bio");

  // ──────────────────────────────────────────────
  // 5. COLOR PALETTE & GRADIENT STUDIO
  // ──────────────────────────────────────────────
  const [gradAngle, setGradAngle] = useState("135deg");
  const [gradStop1, setGradStop1] = useState(userSettings.accent_color || "#5B8DB8");
  const [gradStop2, setGradStop2] = useState("#1e293b");
  const [gradStop3, setGradStop3] = useState("#08090d");

  const generatedGradientCss = `linear-gradient(${gradAngle}, ${gradStop1} 0%, ${gradStop2} 50%, ${gradStop3} 100%)`;

  const handleApplyGradient = async () => {
    try {
      const currentSettings = { ...(user?.settings || {}) };
      const updatedSettings = {
        ...currentSettings,
        card_gradient: generatedGradientCss,
        accent_color: gradStop1
      };
      await api.put("/profile", { settings: updatedSettings });
      if (mutate) await mutate();
      toast.success("Gradient applied to your bio profile settings!");
    } catch {
      toast.error("Failed to apply gradient.");
    }
  };

  // ──────────────────────────────────────────────
  // 6. ENHANCED DISCORD SNOWFLAKE & EPOCH DECODER
  // ──────────────────────────────────────────────
  const [snowflakeInput, setSnowflakeInput] = useState("");
  const [snowflakeResult, setSnowflakeResult] = useState(null);

  const handleDecodeSnowflake = (e) => {
    e.preventDefault();
    const id = snowflakeInput.trim();
    if (!id || !/^\d{16,20}$/.test(id)) {
      toast.error("Enter a valid 17-19 digit Discord Snowflake ID");
      return;
    }
    try {
      const discordEpoch = 1420070400000n;
      const snowflakeBig = BigInt(id);
      const timestampMs = Number((snowflakeBig >> 22n) + discordEpoch);
      const internalWorkerId = Number((snowflakeBig & 0x3E0000n) >> 17n);
      const internalProcessId = Number((snowflakeBig & 0x1F000n) >> 12n);
      const increment = Number(snowflakeBig & 0xFFFn);

      const date = new Date(timestampMs);
      const diffDays = Math.floor((Date.now() - timestampMs) / (1000 * 60 * 60 * 24));

      setSnowflakeResult({
        id,
        dateString: date.toUTCString(),
        iso: date.toISOString(),
        relative: date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        timestampMs,
        diffDays,
        internalWorkerId,
        internalProcessId,
        increment,
        binaryString: snowflakeBig.toString(2).padStart(64, "0")
      });
      toast.success("Snowflake decoded successfully!");
    } catch {
      toast.error("Could not parse snowflake.");
    }
  };

  // ──────────────────────────────────────────────
  // 7. DISCORD BOT PERMISSIONS & INVITE CALCULATOR
  // ──────────────────────────────────────────────
  const [botClientId, setBotClientId] = useState("");
  const [selectedPerms, setSelectedPerms] = useState([0x800, 0x4000, 0x8000, 0x10000, 0x40]); // default messaging perms

  const computedPermissionInteger = useMemo(() => {
    return selectedPerms.reduce((acc, curr) => acc | curr, 0);
  }, [selectedPerms]);

  const togglePerm = (permValue) => {
    if (selectedPerms.includes(permValue)) {
      setSelectedPerms(selectedPerms.filter(p => p !== permValue));
    } else {
      setSelectedPerms([...selectedPerms, permValue]);
    }
  };

  const botInviteUrl = useMemo(() => {
    const cid = botClientId.trim() || "YOUR_BOT_CLIENT_ID";
    return `https://discord.com/api/oauth2/authorize?client_id=${cid}&permissions=${computedPermissionInteger}&scope=bot%20applications.commands`;
  }, [botClientId, computedPermissionInteger]);

  // ──────────────────────────────────────────────
  // 8. DISCORD BOT TOKEN HEADER INSPECTOR (OSINT)
  // ──────────────────────────────────────────────
  const [tokenInput, setTokenInput] = useState("");
  const [tokenResult, setTokenResult] = useState(null);

  const handleInspectToken = (e) => {
    e.preventDefault();
    const raw = tokenInput.trim();
    if (!raw.includes(".")) {
      toast.error("Paste a valid Discord Bot token (contains 3 dot-separated parts)");
      return;
    }
    try {
      const parts = raw.split(".");
      const firstPart = parts[0];
      // Base64 decode ID
      let decodedId = "";
      try {
        decodedId = atob(firstPart);
      } catch {
        // url safe base64 decode
        const b64 = firstPart.replace(/-/g, "+").replace(/_/g, "/");
        decodedId = atob(b64);
      }

      if (!/^\d+$/.test(decodedId)) {
        toast.error("Could not decode valid user ID from token header.");
        return;
      }

      const discordEpoch = 1420070400000n;
      const snowflakeBig = BigInt(decodedId);
      const timestampMs = Number((snowflakeBig >> 22n) + discordEpoch);
      const date = new Date(timestampMs);

      setTokenResult({
        botId: decodedId,
        createdAt: date.toUTCString(),
        relativeAge: date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
        epochMs: timestampMs,
        tokenPrefix: `${firstPart.slice(0, 6)}...`
      });
      toast.success(`Decoded Bot ID: ${decodedId}`);
    } catch {
      toast.error("Failed to inspect token structure.");
    }
  };

  // ──────────────────────────────────────────────
  // 9. SOCIAL MEDIA OSINT USERNAME SCANNER
  // ──────────────────────────────────────────────
  const [osintUsername, setOsintUsername] = useState(user?.username || "");
  const [osintChecked, setOsintChecked] = useState(false);

  const OSINT_PLATFORMS = [
    { name: "GitHub", icon: SiGithub, url: `https://github.com/${osintUsername}` },
    { name: "Twitter / X", icon: SiX, url: `https://x.com/${osintUsername}` },
    { name: "Instagram", icon: SiInstagram, url: `https://instagram.com/${osintUsername}` },
    { name: "YouTube", icon: SiYoutube, url: `https://youtube.com/@${osintUsername}` },
    { name: "TikTok", icon: SiTiktok, url: `https://tiktok.com/@${osintUsername}` },
    { name: "Twitch", icon: SiTwitch, url: `https://twitch.tv/${osintUsername}` },
    { name: "Telegram", icon: SiTelegram, url: `https://t.me/${osintUsername}` },
    { name: "Reddit", icon: SiReddit, url: `https://reddit.com/user/${osintUsername}` },
    { name: "Spotify", icon: SiSpotify, url: `https://open.spotify.com/search/${osintUsername}` },
    { name: "Steam Community", icon: SiSteam, url: `https://steamcommunity.com/id/${osintUsername}` },
  ];

  // ──────────────────────────────────────────────
  // 10. CLOUDFLARE PROTECTION & DNS GUIDE
  // ──────────────────────────────────────────────
  const [domainInput, setDomainInput] = useState("");
  const [dnsResult, setDnsResult] = useState(null);

  const handleCheckDns = (e) => {
    e.preventDefault();
    if (!domainInput.trim()) return;
    const clean = domainInput.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    setDnsResult({
      domain: clean,
      cnameTarget: "swatsbio-production.up.railway.app",
      status: "Configured for Cloudflare Proxy",
      recommendedCname: `CNAME  ${clean}  ->  swatsbio-production.up.railway.app  (Proxied - Orange Cloud ☁️)`,
      recommendedA: `A  ${clean}  ->  Railway / Custom Edge IP`,
      sslMode: "Full (Strict)",
      botFightMode: "Enabled"
    });
    toast.success("Cloudflare DNS configuration generated!");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* ────────────────────────────────────────────────────────── */}
      {/* TOP BANNER & CATEGORY NAVIGATION */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-[#0c0e18] border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 flex items-center justify-center text-[#5B8DB8] shadow-lg">
            <Wrench size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <span>Creator Power, OSINT & Metadata Studio</span>
              <span className="px-2 py-0.5 rounded-full bg-[#5B8DB8]/20 text-[#5B8DB8] text-[10px] font-mono font-bold border border-[#5B8DB8]/30">V3.0</span>
            </h1>
            <p className="text-xs text-[#E5E7EB]/60">
              OpenGraph metadata customization, Discord embed dispatchers, Snowflake OSINT, Cloudflare protection & permission calculators
            </p>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap gap-1.5 p-1.5 rounded-xl bg-[#08090d] border border-white/10">
          {[
            { id: "metadata", label: "Metadata & Embeds", icon: Share2 },
            { id: "webhook", label: "Discord Webhooks", icon: SiDiscord },
            { id: "snowflake", label: "Snowflake OSINT", icon: Cpu },
            { id: "discord_perms", label: "Discord Perms & Bot", icon: Key },
            { id: "token_osint", label: "Token Inspector", icon: Fingerprint },
            { id: "social_osint", label: "Social OSINT", icon: Search },
            { id: "cloudflare", label: "Cloudflare & DNS", icon: Shield },
            { id: "fonts", label: "Bio Fonts", icon: Type },
            { id: "gradients", label: "Gradient Studio", icon: Palette },
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
      {/* 3. ENHANCED DISCORD SNOWFLAKE & EPOCH OSINT */}
      {/* ────────────────────────────────────────────────────────── */}
      {toolTab === "snowflake" && (
        <div className="p-5 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-5 shadow-xl">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2 font-display">
              <Cpu size={16} className="text-[#5B8DB8]" />
              <span>Advanced Discord Snowflake & Epoch Investigator (OSINT)</span>
            </h2>
            <p className="text-xs text-[#E5E7EB]/60">
              Dissect 64-bit Discord snowflake IDs to reveal exact millisecond creation time, internal worker ID, process ID, and account lifespan.
            </p>
          </div>

          <form onSubmit={handleDecodeSnowflake} className="flex gap-2">
            <Input
              value={snowflakeInput}
              onChange={(e) => setSnowflakeInput(e.target.value)}
              placeholder="e.g. 1557281277734813806 or user/channel/role ID"
              className="text-xs bg-[#08090d] border-white/10 rounded-xl text-white flex-1 focus:border-[#5B8DB8]"
            />
            <Button
              type="submit"
              className="bg-[#5B8DB8] hover:bg-[#4a7a9f] text-white text-xs font-bold px-4 rounded-xl shadow cursor-pointer"
            >
              Analyze Snowflake
            </Button>
          </form>

          {snowflakeResult && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#08090d] border border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Creation Date (UTC)</div>
                  <div className="text-xs font-bold text-white mt-0.5">{snowflakeResult.dateString}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Relative Age</div>
                  <div className="text-xs font-bold text-emerald-400 mt-0.5">{snowflakeResult.diffDays} days old ({snowflakeResult.relative})</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Epoch Milliseconds</div>
                  <div className="text-xs font-mono text-white/80 mt-0.5">{snowflakeResult.timestampMs} ms</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Worker / Process / Inc</div>
                  <div className="text-xs font-mono text-[#5B8DB8] mt-0.5">W: {snowflakeResult.internalWorkerId} • P: {snowflakeResult.internalProcessId} • #{snowflakeResult.increment}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1 font-mono text-[11px] text-white/70">
                <div className="text-[10px] text-white/40 uppercase font-sans font-bold">Bitwise Binary Representation (64-Bit)</div>
                <div className="break-all tracking-wider text-[#5B8DB8]">{snowflakeResult.binaryString}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. DISCORD PERMISSIONS & BOT INVITE CALCULATOR */}
      {/* ────────────────────────────────────────────────────────── */}
      {toolTab === "discord_perms" && (
        <div className="p-5 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-5 shadow-xl">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2 font-display">
              <Key size={16} className="text-[#5865F2]" />
              <span>Discord Permissions & OAuth2 Invite Generator</span>
            </h2>
            <p className="text-xs text-[#E5E7EB]/60">
              Calculate exact bitwise permission integers and generate verified OAuth2 bot invite links for your server bots.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1">Bot Client / Application ID</label>
              <Input
                value={botClientId}
                onChange={(e) => setBotClientId(e.target.value)}
                placeholder="e.g. 134567890123456789"
                className="text-xs bg-[#08090d] border-white/10 rounded-xl text-white focus:border-[#5865F2]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1">Computed Bitwise Integer</label>
              <div className="h-9 px-3 rounded-xl bg-[#08090d] border border-white/10 flex items-center justify-between text-xs font-mono text-[#5865F2]">
                <span>{computedPermissionInteger}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(String(computedPermissionInteger))}
                  className="text-xs text-white/50 hover:text-white"
                >
                  Copy Integer
                </button>
              </div>
            </div>
          </div>

          {/* Permissions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2">
            {DISCORD_PERMISSIONS.map((p) => {
              const active = selectedPerms.includes(p.value);
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => togglePerm(p.value)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    active
                      ? "bg-[#5865F2]/20 border-[#5865F2]/50 text-white"
                      : "bg-[#08090d] border-white/5 text-white/60 hover:border-white/15 hover:text-white"
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{p.name}</div>
                    <div className="text-[10px] text-white/40">{p.desc}</div>
                  </div>
                  <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${active ? "bg-[#5865F2] text-white font-bold" : "border border-white/20"}`}>
                    {active ? "✓" : ""}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-[#08090d] border border-white/10 space-y-2">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Generated OAuth2 Bot Invite Link</div>
            <div className="text-xs text-[#5865F2] font-mono break-all">{botInviteUrl}</div>
            <div className="flex gap-2 pt-1">
              <a
                href={botInviteUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-1.5 rounded-lg bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink size={12} />
                <span>Invite Bot to Server</span>
              </a>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(botInviteUrl)}
                className="border-white/10 text-white text-xs rounded-lg hover:bg-white/5"
              >
                Copy Invite Link
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 5. DISCORD BOT TOKEN HEADER INSPECTOR */}
      {/* ────────────────────────────────────────────────────────── */}
      {toolTab === "token_osint" && (
        <div className="p-5 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-4 shadow-xl">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2 font-display">
              <Fingerprint size={16} className="text-[#5B8DB8]" />
              <span>Discord Token Header Inspector (Safe OSINT)</span>
            </h2>
            <p className="text-xs text-[#E5E7EB]/60">
              Inspect the public Base64 header of a Discord bot token to extract the Bot User ID and registration timestamp without exposing secret keys.
            </p>
          </div>

          <form onSubmit={handleInspectToken} className="space-y-3">
            <Input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste Discord Bot Token (processed locally in browser memory only)..."
              className="text-xs bg-[#08090d] border-white/10 rounded-xl text-white focus:border-[#5B8DB8]"
            />
            <Button
              type="submit"
              className="bg-[#5B8DB8] hover:bg-[#4a7a9f] text-white text-xs font-bold px-4 rounded-xl shadow cursor-pointer"
            >
              Analyze Token Header
            </Button>
          </form>

          {tokenResult && (
            <div className="p-4 rounded-xl bg-[#08090d] border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Extracted Bot User ID</div>
                <div className="text-xs font-bold text-[#5B8DB8] font-mono mt-0.5">{tokenResult.botId}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Account Registered</div>
                <div className="text-xs font-bold text-white mt-0.5">{tokenResult.createdAt}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Token Prefix Hash</div>
                <div className="text-xs font-mono text-white/60 mt-0.5">{tokenResult.tokenPrefix}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 6. SOCIAL MEDIA OSINT SCANNER */}
      {/* ────────────────────────────────────────────────────────── */}
      {toolTab === "social_osint" && (
        <div className="p-5 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-5 shadow-xl">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2 font-display">
              <Search size={16} className="text-[#5B8DB8]" />
              <span>Cross-Platform Social OSINT Handle Scanner</span>
            </h2>
            <p className="text-xs text-[#E5E7EB]/60">
              Instantly check profile availability and handle footprints across 10+ major social networks.
            </p>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <Input
                value={osintUsername}
                onChange={(e) => setOsintUsername(e.target.value.replace(/^@/, ""))}
                placeholder="Enter handle to scan..."
                className="pl-8 text-xs bg-[#08090d] border-white/10 rounded-xl text-white focus:border-[#5B8DB8]"
              />
            </div>
            <Button
              onClick={() => {
                setOsintChecked(true);
                toast.success(`Generated direct scan links for @${osintUsername}`);
              }}
              className="bg-[#5B8DB8] hover:bg-[#4a7a9f] text-white text-xs font-bold px-4 rounded-xl shadow cursor-pointer"
            >
              Scan Handles
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {OSINT_PLATFORMS.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-[#08090d] border border-white/10 flex items-center justify-between hover:border-[#5B8DB8]/50 hover:bg-white/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white">
                    <p.icon size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-[#5B8DB8] transition-colors">{p.name}</div>
                    <div className="text-[10px] text-white/40 font-mono">@{osintUsername || "user"}</div>
                  </div>
                </div>
                <ExternalLink size={13} className="text-white/40 group-hover:text-white transition-colors" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 7. CLOUDFLARE & DDOS PROTECTION CONFIGURATOR */}
      {/* ────────────────────────────────────────────────────────── */}
      {toolTab === "cloudflare" && (
        <div className="p-5 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-5 shadow-xl">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2 font-display">
              <Shield size={16} className="text-amber-400" />
              <span>Cloudflare Protection & Custom Domain Setup</span>
            </h2>
            <p className="text-xs text-[#E5E7EB]/60">
              Step-by-step setup guide to proxy your domain through Cloudflare for free DDoS mitigation, rate limiting, and Bot Fight Mode.
            </p>
          </div>

          <form onSubmit={handleCheckDns} className="flex gap-2">
            <Input
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="e.g. bio.yourdomain.com or myname.me"
              className="text-xs bg-[#08090d] border-white/10 rounded-xl text-white flex-1 focus:border-amber-400"
            />
            <Button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold px-4 rounded-xl shadow cursor-pointer"
            >
              Generate DNS Map
            </Button>
          </form>

          {dnsResult && (
            <div className="p-4 rounded-xl bg-[#08090d] border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Target Domain: {dnsResult.domain}</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                  {dnsResult.status}
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono text-white/80 bg-black/40 p-3 rounded-lg border border-white/5">
                <div>{dnsResult.recommendedCname}</div>
              </div>
            </div>
          )}

          {/* Step-by-Step Cloudflare Protection Guide */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-bold text-white uppercase tracking-wider">Cloudflare Protection Checklist</div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[#08090d] border border-white/10 space-y-1.5">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <span>1. Orange Cloud Proxy</span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  In Cloudflare DNS, ensure the CNAME points to <code className="text-[#5B8DB8]">swatsbio-production.up.railway.app</code> with <strong>Proxy status: Proxied (Orange cloud)</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#08090d] border border-white/10 space-y-1.5">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span>2. SSL/TLS Full (Strict)</span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Go to <strong>SSL/TLS &gt; Overview</strong> in Cloudflare and set encryption mode to <strong>Full (Strict)</strong> for end-to-end HTTPS encryption.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#08090d] border border-white/10 space-y-1.5">
                <div className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                  <span>3. Bot Fight Mode & WAF</span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Go to <strong>Security &gt; Bots</strong> and enable <strong>Bot Fight Mode</strong> to automatically block malicious automated crawlers and scrapers.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 8. BIO FONTS */}
      {/* ────────────────────────────────────────────────────────── */}
      {toolTab === "fonts" && (
        <div className="p-5 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2 font-display">
                <Type size={16} className="text-[#5B8DB8]" />
                <span>Aesthetic Unicode Font Generator</span>
              </h2>
              <p className="text-xs text-[#E5E7EB]/60">
                Type your name or bio text and copy styled Unicode fonts for your profile title, description, or links.
              </p>
            </div>
          </div>

          <div className="relative">
            <Input
              value={unicodeInput}
              onChange={(e) => setUnicodeInput(e.target.value)}
              placeholder="Type your bio text here..."
              className="h-11 px-4 text-sm bg-[#08090d] border-white/10 rounded-xl text-white focus:border-[#5B8DB8]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {UNICODE_FONTS.map((font) => {
              const converted = font.transform(unicodeInput || "Swats Bio");
              return (
                <div
                  key={font.name}
                  className="p-3.5 rounded-xl bg-[#08090d] border border-white/10 flex flex-col justify-between gap-3 hover:border-[#5B8DB8]/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">{font.name}</div>
                    <div className="text-sm text-white font-medium break-all select-all font-sans">{converted}</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(converted)}
                    className="h-7 text-xs bg-white/5 hover:bg-[#5B8DB8] hover:text-white text-white/70 rounded-lg transition-colors cursor-pointer w-full flex items-center justify-center gap-1"
                  >
                    <Copy size={12} />
                    <span>Copy Text</span>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 9. GRADIENT STUDIO */}
      {/* ────────────────────────────────────────────────────────── */}
      {toolTab === "gradients" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 p-5 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 font-display">
              <Palette size={16} className="text-[#5B8DB8]" />
              <span>Color Palette & Gradient Studio</span>
            </h2>
            <p className="text-xs text-[#E5E7EB]/60">
              Create smooth multi-stop linear gradients to use across your bio cards and background elements.
            </p>

            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1">Stop 1 (Accent)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={gradStop1}
                      onChange={(e) => setGradStop1(e.target.value)}
                      className="w-7 h-7 rounded bg-transparent cursor-pointer"
                    />
                    <Input
                      value={gradStop1}
                      onChange={(e) => setGradStop1(e.target.value)}
                      className="text-xs bg-[#08090d] border-white/10 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1">Stop 2 (Mid)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={gradStop2}
                      onChange={(e) => setGradStop2(e.target.value)}
                      className="w-7 h-7 rounded bg-transparent cursor-pointer"
                    />
                    <Input
                      value={gradStop2}
                      onChange={(e) => setGradStop2(e.target.value)}
                      className="text-xs bg-[#08090d] border-white/10 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1">Stop 3 (Base)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={gradStop3}
                      onChange={(e) => setGradStop3(e.target.value)}
                      className="w-7 h-7 rounded bg-transparent cursor-pointer"
                    />
                    <Input
                      value={gradStop3}
                      onChange={(e) => setGradStop3(e.target.value)}
                      className="text-xs bg-[#08090d] border-white/10 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/80 block mb-1">Angle</label>
                <div className="flex flex-wrap gap-2">
                  {["135deg", "90deg", "180deg", "45deg", "225deg"].map((ang) => (
                    <button
                      key={ang}
                      type="button"
                      onClick={() => setGradAngle(ang)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                        gradAngle === ang ? "bg-[#5B8DB8] text-white border-[#5B8DB8]" : "bg-[#08090d] text-white/70 border-white/10"
                      }`}
                    >
                      {ang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#08090d] border border-white/10 space-y-2">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">CSS Code</div>
                <code className="text-xs text-[#5B8DB8] font-mono block break-all">{generatedGradientCss}</code>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedGradientCss)}
                    className="flex-1 text-xs border-white/10 text-white hover:bg-white/5 cursor-pointer"
                  >
                    <Copy size={12} className="mr-1" />
                    <span>Copy CSS</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApplyGradient}
                    className="flex-1 text-xs bg-[#5B8DB8] hover:bg-[#4a7a9f] text-white font-bold cursor-pointer"
                  >
                    <span>Apply to Bio Card</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 p-5 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-3 shadow-xl flex flex-col justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Eye size={14} className="text-[#5B8DB8]" />
              <span>Live Gradient Card Preview</span>
            </span>

            <div
              className="w-full aspect-[16/9] rounded-2xl p-6 border border-white/20 shadow-2xl flex flex-col justify-end text-white"
              style={{ background: generatedGradientCss }}
            >
              <div className="p-4 rounded-xl bg-black/40 backdrop-blur border border-white/10 space-y-1">
                <div className="text-sm font-bold text-white">{user?.display_name || user?.username || "Swats Bio Profile"}</div>
                <div className="text-xs text-white/70">Custom gradient styling active</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 10. QR CODE GENERATOR */}
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
