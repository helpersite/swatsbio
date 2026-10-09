
import React, { useEffect, useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useParams, Link } from "react-router-dom";
import { api, fileUrl } from "@/lib/auth";
import { renderBioText, stripEffectSyntax } from "@/lib/textEffects";
import { BADGE_DEFS } from "@/pages/dashboard/badges";
import { Eye, Code2, ChevronDown, Layers, Terminal, FolderGit2, Compass, MessageSquare, EyeOff, Loader2, Volume2, VolumeX, Volume1, Music, Lock, BadgeCheck, Play, Pause, SkipBack, SkipForward, Disc3, FileText, Radio, Disc, Music2, Sliders, Activity, Copy, Check, ExternalLink, Gamepad2, Headphones, Sparkles, X, ChevronRight, Users, ShieldCheck, Square, MapPin, Fingerprint, ShieldAlert } from "lucide-react";
import { SiDiscord, SiSpotify, SiTiktok, SiYoutube, SiTwitch, SiKick, SiInstagram, SiX, SiGithub, SiSteam, SiRoblox, SiTelegram } from "react-icons/si";
import { brandIcon, BRAND_COLORS } from "@/lib/brandIcons";
import { DETAIL_KEYS } from "@/lib/linkConfig";
import { injectCustomFonts } from "@/lib/fonts";
import { BackgroundEffect, CursorEffectsRenderer } from "@/components/BackgroundEffects";
import { AvatarDecoration } from "@/components/AvatarDecorations";
import { MediaDisplay } from "@/components/MediaDisplay";
import { getDiscordBadges, DISCORD_BADGES_CATALOG, DiscordBadgeIcon } from "@/lib/discordBadges";
import * as Icons from "lucide-react";

// ---------------------------------------------------------------------------
// GUNS.LOL / FEDS STYLE SLIDESHOW HUD & SHOWCASE SECTIONS
// ---------------------------------------------------------------------------

function HudTopLeftAudio({ bio, accent }) {
  const s = bio?.settings || {};
  const audioCfg = s.audio || {};
  const tracks = audioCfg.tracks || [];
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const audioRef = useRef(null);

  const track = tracks[currentIdx] || null;

  useEffect(() => {
    if (!track?.url) return;
    const aud = new Audio(fileUrl(track.url));
    aud.volume = (audioCfg.volume ?? 65) / 100;
    aud.loop = !!audioCfg.loop;
    audioRef.current = aud;

    if (audioCfg.autoplay !== false) {
      aud.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }

    aud.onended = () => {
      if (tracks.length > 1) {
        setCurrentIdx((i) => (i + 1) % tracks.length);
      } else {
        setIsPlaying(false);
      }
    };

    return () => {
      aud.pause();
      aud.src = "";
    };
  }, [track?.url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  if (!track) return null;

  return (
    <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/75 backdrop-blur-xl border border-white/15 shadow-2xl transition-all duration-200 hover:scale-[1.03] group">
      <button
        onClick={togglePlay}
        className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
        style={{ background: `${accent}33`, color: accent, border: `1px solid ${accent}66` }}
        title={isPlaying ? "Pause audio" : "Play audio"}
      >
        {isPlaying ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
      </button>

      <div className="flex flex-col max-w-[130px] sm:max-w-[170px] overflow-hidden text-left">
        <span className="text-[11px] font-bold text-white truncate leading-tight">
          {stripEffectSyntax(track.name || "Audio Track")}
        </span>
        <span className="text-[9px] text-[#E5E7EB]/60 truncate leading-tight">
          {stripEffectSyntax(track.artist || bio.display_name || bio.username)}
        </span>
      </div>

      {/* Animated Equalizer Wave Bars */}
      <div className="flex items-end gap-0.5 h-3.5 px-1">
        {[0.8, 1.2, 0.6, 1.0].map((speed, i) => (
          <span
            key={i}
            className={`w-0.5 rounded-full transition-all ${isPlaying ? "bg-[#5B8DB8] animate-pulse" : "bg-white/30 h-1"}`}
            style={{
              height: isPlaying ? `${Math.max(4, ((i + 1) * 3.5)) }px` : '4px',
              backgroundColor: isPlaying ? accent : undefined,
              animationDuration: `${speed}s`,
            }}
          />
        ))}
      </div>

      <button
        onClick={toggleMute}
        className="text-[#E5E7EB]/60 hover:text-white transition-colors ml-0.5"
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
      </button>
    </div>
  );
}

function HudBottomLeftStats({ bio, locationText, accent }) {
  return (
    <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 pointer-events-auto flex items-center gap-2">
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-xl border border-white/15 shadow-2xl text-[11px] text-[#E5E7EB]/90">
        <span className="flex items-center gap-1 font-semibold text-white">
          <Eye size={13} style={{ color: accent }} />
          {(bio.views || 0).toLocaleString()}
        </span>
        {locationText && (
          <>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1 text-[#E5E7EB]/75 uppercase tracking-wider text-[10px]">
              <MapPin size={11} style={{ color: accent }} />
              {locationText}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function HudMiddleRightDots({ slides, activeSlide, onSelectSlide, accent }) {
  return (
    <div className="fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-50 pointer-events-auto flex flex-col items-center gap-3">
      {slides.map((s, idx) => {
        const isActive = activeSlide === idx;
        return (
          <button
            key={s.id || idx}
            onClick={() => onSelectSlide(idx)}
            className="group relative flex items-center justify-center p-1.5 transition-all"
            aria-label={`Slide ${idx + 1}: ${s.label}`}
          >
            {/* Tooltip on hover */}
            <span className="absolute right-8 px-2 py-1 rounded-md bg-black/90 border border-white/20 text-[10px] font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
              {s.label}
            </span>
            <span
              className={`block rounded-full transition-all duration-300 ${
                isActive
                  ? "w-3 h-3 ring-4 shadow-[0_0_12px_rgba(255,255,255,0.6)]"
                  : "w-2 h-2 bg-white/35 hover:bg-white/80 hover:scale-125"
              }`}
              style={{
                backgroundColor: isActive ? accent : undefined,
                ringColor: isActive ? `${accent}44` : undefined,
                boxShadow: isActive ? `0 0 14px ${accent}` : undefined,
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

function HudBottomCenterScroll({ onClick, accent, visible = true }) {
  return (
    <div className={`fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
      <button
        onClick={onClick}
        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black/70 backdrop-blur-xl border border-white/15 text-white/80 hover:text-white hover:border-white/30 transition-all text-xs font-medium shadow-2xl group cursor-pointer"
      >
        <span className="text-[10px] uppercase tracking-[0.18em] font-semibold group-hover:tracking-[0.22em] transition-all">
          Scroll for more
        </span>
        <ChevronDown size={13} className="animate-bounce" style={{ color: accent }} />
      </button>
    </div>
  );
}

function DiscordGuildCardWidget({ guildConfig, inviteUrl, accent, theme = "discord 1:1", style }) {
  const [liveData, setLiveData] = useState(null);
  const [copied, setCopied] = useState(false);
  const rawInvite = (inviteUrl || guildConfig?.invite_url || guildConfig?.invite_link || guildConfig?.url || "").trim();
  const match = rawInvite.match(/(?:discord\.gg|discord(?:app)?\.com\/invite)\/([a-zA-Z0-9_-]+)/i);
  const code = match ? match[1] : (rawInvite.startsWith("http") ? "" : rawInvite);

  useEffect(() => {
    if (!code) return;
    let alive = true;
    fetch(`https://discord.com/api/v9/invites/${code}?with_counts=true`)
      .then((res) => res.json())
      .then((data) => {
        if (alive && data?.guild) setLiveData(data);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [code]);

  const guild = liveData?.guild || {};
  const name = guild.name || guildConfig?.name || "Discord Community";
  const iconUrl = guild.icon
    ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${guild.icon.startsWith("a_") ? "gif" : "png"}?size=256`
    : (guildConfig?.icon ? fileUrl(guildConfig.icon) : null);
  const bannerUrl = guild.banner
    ? `https://cdn.discordapp.com/banners/${guild.id}/${guild.banner}.png?size=512`
    : guild.splash
    ? `https://cdn.discordapp.com/splashes/${guild.id}/${guild.splash}.png?size=512`
    : null;

  const onlineCount = liveData?.approximate_presence_count ?? guildConfig?.online_count;
  const memberCount = liveData?.approximate_member_count ?? guildConfig?.member_count;
  const description = guild.description || guildConfig?.description || "";
  const isVerified = guild.features?.includes("VERIFIED") || guild.features?.includes("PARTNERED");
  const isCommunity = guild.features?.includes("COMMUNITY") || isVerified;
  const fullInviteLink = rawInvite.startsWith("http") ? rawInvite : (code ? `https://discord.gg/${code}` : "#");

  const styleMode = guildConfig?.style || guildConfig?.theme || theme || "discord 1:1";
  const isNoBg = styleMode === "no bg" || styleMode === "none";
  const isGhost = styleMode === "ghost";

  const containerStyle = isNoBg
    ? "bg-transparent border-0 shadow-none"
    : isGhost
    ? "bg-white/[0.04] border border-white/15 backdrop-blur-xl shadow-2xl"
    : "bg-[#1e1f22] border border-[#5865F2]/40 shadow-2xl";

  return (
    <div className={`w-full rounded-2xl text-[#E5E7EB] overflow-hidden text-left transition-all ${containerStyle}`}>
      {/* Top Banner Cover */}
      {!isNoBg && (
        <div
          className="h-20 bg-[#141517] bg-cover bg-center relative p-3 flex justify-between items-start"
          style={{
            backgroundImage: bannerUrl ? `url(${bannerUrl})` : "linear-gradient(135deg, rgba(88,101,242,0.3) 0%, rgba(20,21,23,0.95) 100%)",
          }}
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-white font-semibold border border-white/10 shadow">
            <SiDiscord size={12} className="text-[#5865F2]" />
            <span>Discord Server</span>
          </div>
          {isCommunity && (
            <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[#5865F2] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-white/10">
              <Users size={11} /> Community
            </span>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className={`p-4 ${isNoBg ? "pt-2" : "-mt-7 pt-0"} relative`}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              {iconUrl ? (
                <img src={iconUrl} alt="" className="w-13 h-13 rounded-2xl border-2 border-[#1e1f22] bg-[#141517] object-cover shadow-xl" />
              ) : (
                <div className="w-13 h-13 rounded-2xl border-2 border-[#1e1f22] bg-[#5865F2] flex items-center justify-center text-white shadow-xl">
                  <SiDiscord size={24} />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5 truncate">
                <span>{name}</span>
                {isVerified && <ShieldCheck size={14} className="text-[#5865F2] shrink-0" />}
              </h3>
              <div className="flex items-center gap-2.5 text-[11px] mt-0.5 font-mono">
                <div className="flex items-center gap-1 font-medium text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{onlineCount != null ? Number(onlineCount).toLocaleString() : "Active"}</span>
                  <span className="text-white/40 font-normal text-[10px]">Online</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <div className="flex items-center gap-1 font-medium text-white/70">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>{memberCount != null ? Number(memberCount).toLocaleString() : "Members"}</span>
                  <span className="text-white/40 font-normal text-[10px]">Total</span>
                </div>
              </div>
            </div>
          </div>

          {/* Far Right Join Button */}
          {rawInvite && (
            <div className="shrink-0 flex items-center gap-1.5">
              <a
                href={fullInviteLink}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#5865F2]/25 transition-all hover:scale-105 active:scale-95"
              >
                <SiDiscord size={13} /> Join
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(fullInviteLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
                title="Copy server invite"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              </button>
            </div>
          )}
        </div>

        {description && (
          <p className="text-xs text-[#dbdee1]/80 leading-relaxed line-clamp-2 mt-1">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export default function PublicBio() {
  const { username: routeUsername } = useParams();
  const host = typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
  const hostSubdomain = host.endsWith(".swats.bio") ? host.slice(0, -".swats.bio".length) : "";
  const rawUser = routeUsername || (hostSubdomain && hostSubdomain !== "www" && hostSubdomain !== "api" ? hostSubdomain : "");
  const username = (rawUser || "").replace(/^@+/, "").trim();
  const [bio, setBio] = useState(null);
  const [err, setErr] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!username) return;
    setErr(false);
    api.get(`/u/${encodeURIComponent(username)}`)
      .then(({ data }) => { 
        setBio(data); 
        if (!data.locked && !data.settings?.enter_screen?.enabled) setEntered(true); 
      })
      .catch(() => setErr(true));
  }, [username]);

  // Tab Title & Custom Favicon Effects
  useEffect(() => {
    if (!bio) return;
    const s = bio.settings || {};
    const cleanedName = stripEffectSyntax(bio.display_name || bio.username);
    const customTitle = s.meta_title ? stripEffectSyntax(s.meta_title) : `${cleanedName || bio.username} (@${bio.username}) • Swats.bio`;
    const customDesc = s.meta_desc ? stripEffectSyntax(s.meta_desc) : stripEffectSyntax(bio.description || `View @${bio.username}'s bio & links on Swats.bio`);
    const pfpUrl = s.pfp ? fileUrl(s.pfp) : "";
    const shareImage = s.meta_image || s.profile_embed_image || s.header_banner || s.banner || pfpUrl || "https://www.swats.bio/logo.png";
    const themeColor = s.meta_theme_color || s.accent_color || "#5B8DB8";
    const twitterCard = s.twitter_card || "summary_large_image";
    const bioUrl = `https://swats.bio/${bio.username}`;

    document.title = customTitle;

    const setMeta = (name, content, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let tag = document.head.querySelector(selector);
      if (!tag) {
        tag = document.createElement("meta");
        if (isProperty) tag.setAttribute("property", name);
        else tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    setMeta("description", customDesc);
    setMeta("theme-color", themeColor);
    setMeta("msapplication-TileColor", themeColor);
    setMeta("twitter:card", twitterCard);
    setMeta("twitter:site", "@swatsbio");
    setMeta("twitter:creator", `@${bio.username}`);
    setMeta("twitter:title", customTitle);
    setMeta("twitter:description", customDesc);
    setMeta("twitter:image", shareImage);
    setMeta("twitter:image:alt", customTitle);
    setMeta("og:title", customTitle, true);
    setMeta("og:description", customDesc, true);
    setMeta("og:image", shareImage, true);
    setMeta("og:image:secure_url", shareImage, true);
    setMeta("og:image:alt", customTitle, true);
    setMeta("og:site_name", "Swats.bio", true);
    setMeta("og:type", "profile", true);
    setMeta("og:url", bioUrl, true);
    setMeta("profile:username", bio.username, true);

    // oEmbed and Canonical link injection
    let oembedLink = document.head.querySelector("link[type='application/json+oembed']");
    if (!oembedLink) {
      oembedLink = document.createElement("link");
      oembedLink.setAttribute("rel", "alternate");
      oembedLink.setAttribute("type", "application/json+oembed");
      document.head.appendChild(oembedLink);
    }
    oembedLink.setAttribute("href", `https://swatsbio-production.up.railway.app/api/oembed?username=${bio.username}`);
    oembedLink.setAttribute("title", customTitle);

    // Automatic User Avatar & Custom Favicon (Rounded)
    let originalFavicon = null;
    const faviconUrl = pfpUrl || s.custom_favicon;
    if (faviconUrl) {
      let link = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "shortcut icon";
        document.getElementsByTagName("head")[0].appendChild(link);
      }
      originalFavicon = link.href;

      try {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 64;
          canvas.height = 64;
          const ctx = canvas.getContext("2d");
          ctx.beginPath();
          ctx.arc(32, 32, 31, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, 0, 0, 64, 64);
          link.href = canvas.toDataURL("image/png");
        };
        img.onerror = () => {
          link.href = faviconUrl;
        };
        img.src = faviconUrl;
      } catch (e) {
        link.href = faviconUrl;
      }
    }

    // Tab Title Effects
    const effect = s.tab_title_effect || "none";
    let intervalId = null;

    if (effect === "marquee") {
      let text = ` @${bio.username} · swats.bio · `;
      intervalId = setInterval(() => {
        text = text.substring(1) + text.substring(0, 1);
        document.title = text;
      }, 350);
    } else if (effect === "typing") {
      const full = `@${bio.username} · swats.bio`;
      let i = 0;
      let forward = true;
      intervalId = setInterval(() => {
        if (forward) {
          i++;
          if (i >= full.length) forward = false;
        } else {
          i--;
          if (i <= 3) forward = true;
        }
        document.title = full.substring(0, i) + "_";
      }, 250);
    } else if (effect === "switch_alert") {
      const handleVisibility = () => {
        if (document.hidden) {
          document.title = s.tab_switch_msg || "👀 Hey, come back!";
        } else {
          document.title = defaultTitle;
        }
      };
      document.addEventListener("visibilitychange", handleVisibility);
      return () => {
        document.removeEventListener("visibilitychange", handleVisibility);
        if (originalFavicon) {
          const link = document.querySelector("link[rel*='icon']");
          if (link) link.href = originalFavicon;
        }
      };
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (originalFavicon) {
        const link = document.querySelector("link[rel*='icon']");
        if (link) link.href = originalFavicon;
      }
    };
  }, [bio]);

  const onUnlock = (data) => { setBio(data); setEntered(true); };

  if (err) return (
    <div className="swat-bg min-h-screen flex flex-col items-center justify-center text-center px-6">
      <div className="font-display text-6xl font-extrabold text-[#5B8DB8]">404</div>
      <p className="text-[#E5E7EB]/60 mt-3">@{username} hasn't been deployed yet.</p>
      <Link to="/s/home" className="mt-6 text-[#5B8DB8] underline">back home</Link>
    </div>
  );
  if (!bio) return <div className="swat-bg min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#5B8DB8]" /></div>;

  const es = bio.settings?.enter_screen || {};
  if (!entered && (bio.locked || es.enabled)) return <EnterScreen bio={bio} username={username} onUnlock={onUnlock} />;

  return <BioCard key={bio.username} bio={bio} />;
}

function EnterScreen({ bio, username, onUnlock }) {
  const es = bio.settings?.enter_screen || {};
  const s = bio.settings || {};
  const accent = s.accent_color || "#5B8DB8";
  const [val, setVal] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [unlockedFade, setUnlockedFade] = useState(false);
  const needsPassword = bio.locked;
  const style = es.password_style || "text";
  const entryStyle = es.style || "minimal";
  const exitAnim = es.exit_animation || "fade_out";
  const entryBlur = Number(es.blur ?? 12);
  const dimPct = Number(es.dim ?? 50) / 100;
  const entryHeaderText = (es.header || "").toString().trim();
  const entrySubtitle = (es.subtitle || "").toString().trim();
  const entryButtonText = stripEffectSyntax(es.text || "Click or press enter to continue").trim() || "Click or press enter to continue";
  const bgParticleEffect = es.particle_effect || "none";

  const bannerUrl = fileUrl(s.backgrounds?.[0] || s.banner);

  const playUnlockSound = () => {
    if (!es.sound) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.18); // C6
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  };

  const triggerUnlock = (data) => {
    playUnlockSound();
    setUnlockedFade(true);
    setTimeout(() => {
      onUnlock(data || { ...bio, locked: false });
    }, 420);
  };

  const submit = async (pw) => {
    if (!needsPassword) {
      return triggerUnlock();
    }
    const password = pw ?? val;
    if (!password) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post(`/u/${encodeURIComponent(username)}/unlock`, { password });
      triggerUnlock(data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Incorrect password");
      setVal("");
      setShake(true);
      setTimeout(() => setShake(false), 650);
    } finally {
      setBusy(false);
    }
  };

  // Keyboard navigation listener (Enter, Space, or Any Key to enter when no password required)
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if (!needsPassword) {
        e.preventDefault();
        submit();
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [needsPassword]);

  const isVideoBanner = bannerUrl && (bannerUrl.endsWith(".mp4") || bannerUrl.endsWith(".webm") || bannerUrl.includes("video/upload"));
  const exitClass = unlockedFade ? `anim-exit-${exitAnim}` : "opacity-100 scale-100";

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-6 relative overflow-hidden cursor-pointer select-none transition-all duration-300 ${exitClass}`}
      onClick={() => { if (!needsPassword) submit(); }}
    >
      {/* Background Media */}
      {(es.no_bg || bannerUrl) && (
        <>
          {bannerUrl && (
            isVideoBanner ? (
              <video
                src={bannerUrl}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
                style={{ filter: `blur(${Math.max(entryBlur, 4)}px) brightness(0.7) saturate(1.1)` }}
              />
            ) : (
              <div
                className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0 pointer-events-none"
                style={{ backgroundImage: `url(${bannerUrl})`, filter: `blur(${Math.max(entryBlur, 4)}px) brightness(0.7) saturate(1.1)` }}
              />
            )
          )}
        </>
      )}

      {!es.no_bg && !bannerUrl && <div className="absolute inset-0 z-0 swat-bg" />}

      {/* Darken / Dim Overlay Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundColor: `rgba(0,0,0,${dimPct})`, backdropFilter: `blur(${entryBlur}px)` }} />

      {/* Enter Screen Ambient Particle Effect */}
      {bgParticleEffect && bgParticleEffect !== "none" && <BackgroundEffect effect={bgParticleEffect} />}

      <div
        className={`text-center relative z-10 max-w-md w-full transition-transform ${shake ? "animate-shake" : ""}`}
      >
        {entryHeaderText && (
          <div className="font-display text-2xl sm:text-3xl font-extrabold mb-3 text-white" style={{ textShadow: `0 0 20px ${accent}66` }}>
            {renderBioText(entryHeaderText)}
          </div>
        )}

        {entrySubtitle && (
          <div className="text-xs text-[#E5E7EB]/70 mb-5 max-w-xs mx-auto">
            {entrySubtitle}
          </div>
        )}

        {needsPassword ? (
          <div className="rounded-3xl border border-white/15 bg-[#0d1117]/85 p-7 shadow-[0_25px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl text-center">
            {/* Holographic glowing lock avatar */}
            <div
              className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center border-2 transition-all shadow-xl relative group"
              style={{
                background: `radial-gradient(circle, ${accent}33 0%, rgba(10,12,16,0.95) 100%)`,
                borderColor: `${accent}88`,
                boxShadow: `0 0 25px ${accent}55`,
              }}
            >
              <Lock size={26} style={{ color: accent }} className="animate-pulse" />
              <span
                className="absolute inset-0 rounded-3xl border border-white/20 animate-ping opacity-25"
                style={{ borderColor: accent }}
              />
            </div>

            <div className="text-white text-base font-bold mb-1">Protected Profile</div>
            <div className="text-[#E5E7EB]/60 text-xs mb-5">
              Enter {style === "pin" ? "4-digit PIN" : style === "number" ? "access code" : "password"} to unlock.
            </div>

            {style === "text" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
                className="space-y-4"
              >
                <div className="relative">
                  <input
                    data-testid="unlock-input"
                    type={showPassword ? "text" : "password"}
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    autoFocus
                    className="w-full text-center bg-[#08090B]/90 border rounded-2xl py-3 pl-10 pr-10 outline-none text-white tracking-widest text-sm transition-all focus:border-[#5B8DB8] shadow-inner"
                    style={{ borderColor: error ? "#ef4444" : `${accent}66` }}
                    placeholder="Enter password..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#E5E7EB]/40 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button
                  data-testid="unlock-submit"
                  type="submit"
                  disabled={busy || !val.trim()}
                  className="w-full rounded-2xl py-3 font-bold text-white transition-all shadow-xl hover:brightness-110 active:scale-98 disabled:opacity-50 text-sm"
                  style={{ background: accent, boxShadow: `0 6px 20px ${accent}55` }}
                >
                  {busy ? "Verifying..." : "Unlock Profile"}
                </button>
              </form>
            )}
            {(style === "pin" || style === "number") && (
              <Keypad
                value={val}
                setValue={setVal}
                accent={accent}
                pin={style === "pin"}
                onSubmit={submit}
                busy={busy}
              />
            )}
            {error && <div className="text-red-400 text-xs mt-4 font-semibold animate-pulse">{error}</div>}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {entryStyle === "minimal" && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); submit(); }}
                className="inline-flex items-center justify-center gap-2.5 rounded-full border border-white/15 bg-black/40 backdrop-blur-xl px-6 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-black/60 hover:scale-105 shadow-2xl group"
                style={{ boxShadow: `0 0 24px ${accent}25`, borderColor: `${accent}55` }}
              >
                <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }} />
                <span>{entryButtonText}</span>
              </button>
            )}

            {entryStyle === "glass" && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); submit(); }}
                className="w-full max-w-xs p-5 rounded-3xl swat-glass border border-white/20 shadow-2xl backdrop-blur-2xl text-center transition-all duration-200 hover:scale-105 group"
                style={{ boxShadow: `0 15px 35px rgba(0,0,0,0.5), 0 0 30px ${accent}25` }}
              >
                <div className="w-10 h-10 rounded-2xl mx-auto mb-2 flex items-center justify-center bg-white/10 text-white border border-white/20 group-hover:scale-110 transition-transform">
                  <Sparkles size={18} style={{ color: accent }} />
                </div>
                <div className="text-sm font-bold text-white mb-0.5">{entryButtonText}</div>
                <div className="text-[10px] text-[#E5E7EB]/55">Click or press any key to enter</div>
              </button>
            )}

            {entryStyle === "cyber" && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); submit(); }}
                className="relative px-7 py-3.5 rounded-xl border bg-black/80 font-mono text-xs uppercase tracking-widest text-white transition-all duration-200 hover:scale-105 shadow-2xl group"
                style={{ borderColor: accent, boxShadow: `0 0 25px ${accent}44, inset 0 0 12px ${accent}22` }}
              >
                <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2" style={{ borderColor: accent }} />
                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2" style={{ borderColor: accent }} />
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: accent }} />
                  {entryButtonText}
                </span>
              </button>
            )}

            {entryStyle === "hologram" && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); submit(); }}
                className="w-32 h-32 rounded-full flex flex-col items-center justify-center text-center p-3 border-2 transition-all duration-300 hover:scale-110 relative group"
                style={{
                  background: `radial-gradient(circle, ${accent}33 0%, rgba(10,12,16,0.9) 70%)`,
                  borderColor: accent,
                  boxShadow: `0 0 35px ${accent}66`,
                }}
              >
                <span className="absolute inset-0 rounded-full border border-white/30 animate-ping opacity-25" style={{ borderColor: accent }} />
                <Sparkles size={20} style={{ color: accent }} className="animate-pulse mb-1" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider leading-tight">{entryButtonText}</span>
              </button>
            )}

            {entryStyle === "terminal" && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); submit(); }}
                className="w-full max-w-xs p-4 rounded-xl bg-black border border-emerald-500/50 text-left font-mono text-xs text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all hover:border-emerald-400 hover:scale-105"
              >
                <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-emerald-500/20 text-[10px] text-emerald-500/60">
                  <span className="w-2 h-2 rounded-full bg-red-500/60" />
                  <span className="w-2 h-2 rounded-full bg-yellow-500/60" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500/60" />
                  <span className="ml-1 text-emerald-400 font-bold">bash - profile.sh</span>
                </div>
                <div className="text-emerald-300">$ ./unlock --target @{username}</div>
                <div className="mt-1 flex items-center gap-1 font-bold text-white">
                  <span>&gt; {entryButtonText}</span>
                  <span className="w-2 h-3.5 bg-emerald-400 animate-pulse inline-block" />
                </div>
              </button>
            )}

            {entryStyle === "fingerprint" && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); submit(); }}
                className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-black/60 border border-white/15 backdrop-blur-2xl transition-all duration-300 hover:scale-105 group"
                style={{ boxShadow: `0 0 35px ${accent}33` }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 relative"
                  style={{ background: `${accent}15`, borderColor: `${accent}55`, color: accent, boxShadow: `0 0 20px ${accent}44` }}
                >
                  <Fingerprint size={32} className="animate-pulse" />
                  <span className="absolute inset-0 rounded-2xl border border-white/20 animate-ping opacity-25" style={{ borderColor: accent }} />
                </div>
                <div className="text-xs font-bold tracking-wider uppercase text-white">{entryButtonText}</div>
                <div className="text-[10px] text-[#E5E7EB]/50 font-mono">Biometric ID Scan Required</div>
              </button>
            )}

            {entryStyle === "gate" && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); submit(); }}
                className="w-full max-w-xs p-5 rounded-2xl bg-black/80 border border-amber-500/40 text-center font-mono transition-all hover:scale-105 shadow-[0_0_35px_rgba(245,158,11,0.2)]"
              >
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider mb-2">
                  <ShieldAlert size={12} /> Restricted Perimeter
                </div>
                <div className="text-sm font-bold text-white mb-1">{entryButtonText}</div>
                <div className="text-[10px] text-amber-400/70">Press to authenticate gate clearance</div>
              </button>
            )}

            {entryStyle === "glitch" && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); submit(); }}
                className="px-8 py-4 rounded-xl bg-black border-2 border-cyan-400 text-cyan-300 font-mono font-bold text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all hover:scale-105 hover:bg-cyan-950/40"
              >
                <span className="inline-block animate-pulse mr-2">⚡</span>
                {entryButtonText}
                <span className="inline-block animate-pulse ml-2">⚡</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Keypad({ value, setValue, accent, pin, onSubmit, busy }) {
  const max = pin ? 4 : 8;
  const press = (d) => {
    setValue((v) => {
      if (v.length >= max) return v;
      const next = v + d;
      if (pin && next.length === 4) {
        setTimeout(() => onSubmit(next), 40);
      }
      return next;
    });
  };
  const back = () => setValue((v) => v.slice(0, -1));

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        press(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        back();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onSubmit(value);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [value, max, pin, onSubmit]);

  return (
    <div>
      <div className="flex justify-center gap-2.5 mb-6">
        {Array.from({ length: pin ? 4 : Math.max(4, value.length) }).map((_, i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${i < value.length ? "scale-110" : "scale-100"}`}
            style={{
              background: i < value.length ? accent : "rgba(229,231,235,0.15)",
              boxShadow: i < value.length ? `0 0 8px ${accent}` : "none",
            }}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            data-testid={`keypad-${n}`}
            type="button"
            onClick={() => press(String(n))}
            className="keypad-btn py-3.5 rounded-xl border text-lg font-semibold text-[#E5E7EB] bg-white/[0.03] hover:bg-white/[0.08] active:scale-95 transition-all"
            style={{ borderColor: `${accent}33` }}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={back}
          className="py-3.5 rounded-xl border flex items-center justify-center text-[#E5E7EB]/60 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] active:scale-95 transition-all"
          style={{ borderColor: `${accent}33` }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
            <line x1="18" y1="9" x2="12" y2="15" />
            <line x1="12" y1="9" x2="18" y2="15" />
          </svg>
        </button>
        <button
          data-testid="keypad-0"
          type="button"
          onClick={() => press("0")}
          className="py-3.5 rounded-xl border text-lg font-semibold text-[#E5E7EB] bg-white/[0.03] hover:bg-white/[0.08] active:scale-95 transition-all"
          style={{ borderColor: `${accent}33` }}
        >
          0
        </button>
        <button
          data-testid="keypad-enter"
          type="button"
          onClick={() => onSubmit(value)}
          disabled={busy || !value}
          className="py-3.5 rounded-xl text-white font-semibold transition-all hover:brightness-110 active:scale-95 disabled:opacity-40"
          style={{ background: accent, boxShadow: `0 4px 14px ${accent}44` }}
        >
          {busy ? "..." : "OK"}
        </button>
      </div>
    </div>
  );
}

function formatAudioTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function parseLrc(text) {
  if (!text || typeof text !== "string") return [];
  const lines = text.split("\n");
  const result = [];
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let match;
    const timestamps = [];
    while ((match = timeRegex.exec(trimmed)) !== null) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const ms = match[3] ? parseFloat("0." + match[3]) : 0;
      timestamps.push(min * 60 + sec + ms);
    }
    const cleanText = trimmed.replace(timeRegex, "").trim();
    if (timestamps.length > 0) {
      for (const time of timestamps) {
        result.push({ time, text: cleanText || "♪" });
      }
    } else {
      result.push({ time: null, text: trimmed });
    }
  }

  const hasTimestamps = result.some((r) => r.time !== null);
  if (hasTimestamps) {
    return result.sort((a, b) => (a.time ?? 0) - (b.time ?? 0));
  }
  return result;
}

function AudioVolumeControl({ volume, muted, onVolumeChange, onToggleMute, accent, inline = false }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [open]);

  const displayVol = muted ? 0 : Math.round(volume * 100);

  if (inline) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleMute}
          title={muted ? "Unmute" : "Mute"}
          className="text-[#E5E7EB]/70 hover:text-white transition-colors"
        >
          {muted || volume === 0 ? <VolumeX size={15} className="text-red-400" /> : volume < 0.5 ? <Volume1 size={15} /> : <Volume2 size={15} />}
        </button>
        <div className="relative flex items-center group w-20 sm:w-24">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={muted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-full h-1.5 rounded-full cursor-pointer bg-white/20"
            style={{ accentColor: accent }}
          />
        </div>
        <span className="text-[10px] font-mono text-[#E5E7EB]/50 w-7 text-right select-none">
          {displayVol}%
        </span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex items-center">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        data-testid="audio-volume-toggle"
        title="Volume & Mute (Click to adjust)"
        className="w-7 h-7 rounded-full flex items-center justify-center text-[#E5E7EB]/70 hover:text-white transition-colors hover:bg-white/10"
      >
        {muted || volume === 0 ? <VolumeX size={14} className="text-red-400" /> : volume < 0.5 ? <Volume1 size={14} /> : <Volume2 size={14} />}
      </button>

      {open && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 bg-[#0d0f14]/98 border border-[#4A6B8A]/45 p-3 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex flex-col gap-2.5 w-40 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between text-[11px] font-medium text-white/90">
            <span>Volume</span>
            <span className="font-mono text-[10px] text-[#5B8DB8] font-bold">{displayVol}%</span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={onToggleMute} className="text-[#E5E7EB]/70 hover:text-white shrink-0">
              {muted || volume === 0 ? <VolumeX size={13} className="text-red-400" /> : <Volume2 size={13} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={muted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full h-2 rounded-full cursor-pointer bg-white/20"
              style={{ accentColor: accent }}
            />
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-4 gap-1 pt-1.5 border-t border-white/10 text-[9px] font-mono">
            {[0, 0.25, 0.5, 1].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => onVolumeChange(pct)}
                className="py-1 rounded bg-white/5 hover:bg-white/15 text-[#E5E7EB]/80 hover:text-white transition-colors"
              >
                {pct === 0 ? "Mute" : `${Math.round(pct * 100)}%`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TacticalAudioPlayer({ bio, accent, widthClass, placement = "bottom" }) {
  const a = bio?.settings?.audio;
  const tracks = a?.tracks || [];
  if (!tracks.length || a?.display === false) return null;

  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const lyricsScrollRef = useRef(null);
  const activeLineRef = useRef(null);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState((a?.volume ?? 65) / 100);
  const [showLyrics, setShowLyrics] = useState(false);

  const orderRef = useRef([]);
  useEffect(() => {
    let order = tracks.map((_, i) => i);
    if (a?.randomize) order = order.sort(() => Math.random() - 0.5);
    orderRef.current = order;
  }, [tracks, a?.randomize]);

  const activeTrack = tracks[orderRef.current[currentIdx] ?? currentIdx] || tracks[0];
  const coverImg = fileUrl(activeTrack?.cover || activeTrack?.icon || a?.custom_icon || a?.cover);

  // Autoplay audio on load (or on first user interaction if blocked by browser policy)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;

    const playAudio = () => {
      audio.play().then(() => {
        setPlaying(true);
        setMuted(false);
      }).catch(() => {
        const resumeOnInteract = () => {
          if (audioRef.current) {
            audioRef.current.play().then(() => {
              setPlaying(true);
              setMuted(false);
            }).catch(() => {});
          }
          window.removeEventListener("pointerdown", resumeOnInteract);
          window.removeEventListener("keydown", resumeOnInteract);
          window.removeEventListener("scroll", resumeOnInteract);
        };
        window.addEventListener("pointerdown", resumeOnInteract);
        window.addEventListener("keydown", resumeOnInteract);
        window.addEventListener("scroll", resumeOnInteract);
      });
    };

    playAudio();
  }, [activeTrack?.url]);

  const lyricsRaw = activeTrack?.lyrics || a?.lyrics || "";
  const parsedLyrics = useMemo(() => parseLrc(lyricsRaw), [lyricsRaw]);
  const isSynced = useMemo(() => parsedLyrics.some((l) => l.time !== null), [parsedLyrics]);

  const activeLineIndex = useMemo(() => {
    if (!isSynced) return -1;
    let idx = -1;
    for (let i = 0; i < parsedLyrics.length; i++) {
      if (parsedLyrics[i].time !== null && currentTime >= parsedLyrics[i].time) {
        idx = i;
      } else if (parsedLyrics[i].time !== null && currentTime < parsedLyrics[i].time) {
        break;
      }
    }
    return idx;
  }, [parsedLyrics, currentTime, isSynced]);

  useEffect(() => {
    if (showLyrics && isSynced && activeLineRef.current && lyricsScrollRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeLineIndex, showLyrics, isSynced]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = muted ? 0 : volume;
  }, [volume, muted]);

  const prev = () => {
    setCurrentIdx((i) => (i - 1 + tracks.length) % tracks.length);
    setCurrentTime(0);
  };

  const next = () => {
    setCurrentIdx((i) => (i + 1) % tracks.length);
    setCurrentTime(0);
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      if (muted) setMuted(false);
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  const handleStop = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setPlaying(false);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (muted) {
      setMuted(false);
      audio.volume = volume || 0.5;
      if (volume === 0) setVolume(0.5);
    } else {
      setMuted(true);
      audio.volume = 0;
    }
  };

  const handleVolumeChange = (newVol) => {
    const audio = audioRef.current;
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolume(clamped);
    if (clamped > 0 && muted) setMuted(false);
    if (clamped === 0) setMuted(true);
    if (audio) audio.volume = clamped;
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const bar = progressBarRef.current;
    if (!audio || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = pct * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const seekToLyric = (timeSec) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = timeSec;
    setCurrentTime(timeSec);
    if (!playing) {
      if (muted) setMuted(false);
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space" && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, muted]);

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const hasLyrics = parsedLyrics.length > 0;

  const legacyVisualizer = ["equalizer_bars", "vinyl", "waveform", "pulse_dot", "spectrum_meter", "cyber_freq", "stealth"].includes(a?.style);
  const styleMode = a?.card_style || (legacyVisualizer ? "bottom" : a?.style) || "bottom";

  // Invisible / Hide modes: audio element renders & plays, but zero UI
  if (styleMode === "hide" || styleMode === "invisible") {
    return (
      <audio
        ref={audioRef}
        src={fileUrl(activeTrack?.url)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={next}
        loop={tracks.length === 1}
      />
    );
  }

  if (styleMode === "simple") {
    return (
      <>
        <audio
          ref={audioRef}
          src={fileUrl(activeTrack?.url)}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={next}
          loop={tracks.length === 1}
        />
        <div className="w-full mt-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="h-9 w-9 rounded-full flex items-center justify-center text-white" style={{ background: accent }}>
              {playing && !muted ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
            </button>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-white">{activeTrack?.name || "Audio Track"}</div>
              <div className="truncate text-[10px] text-white/55">{activeTrack?.artist || bio.display_name || bio.username}</div>
            </div>
            <div className="text-[10px] font-mono text-white/55">{formatAudioTime(currentTime)}</div>
          </div>
          <div ref={progressBarRef} onClick={handleSeek} className="mt-2 h-1.5 bg-white/15 rounded-full cursor-pointer overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: accent }} />
          </div>
        </div>
      </>
    );
  }

  const lyricsModal = showLyrics && hasLyrics && (
    <div className="fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md p-4 rounded-3xl swat-glass border border-[#4A6B8A]/40 text-[#E5E7EB] shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center justify-between pb-2.5 border-b border-white/10 mb-3">
        <div className="flex items-center gap-2">
          {coverImg ? (
            <img src={coverImg} alt="Cover" className="w-6 h-6 rounded-md object-cover border border-white/10" />
          ) : (
            <FileText size={15} className="text-[#5B8DB8]" />
          )}
          <span className="text-xs font-semibold text-[#E5E7EB] truncate max-w-[200px]">
            {activeTrack?.name || "Lyrics"}
          </span>
          {isSynced && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#5B8DB8]/20 text-[#5B8DB8] border border-[#5B8DB8]/30 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5B8DB8] animate-pulse" /> Synced
            </span>
          )}
        </div>
        <button
          onClick={() => setShowLyrics(false)}
          className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-xs text-[#E5E7EB]/50 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <div
        ref={lyricsScrollRef}
        className="max-h-64 sm:max-h-72 overflow-y-auto pr-1 space-y-1.5 select-text scroll-smooth"
      >
        {isSynced ? (
          parsedLyrics.map((line, idx) => {
            const isActive = idx === activeLineIndex;
            return (
              <div
                key={idx}
                ref={isActive ? activeLineRef : null}
                onClick={() => line.time !== null && seekToLyric(line.time)}
                className={`py-1.5 px-3 rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "lyrics-active-line bg-white/10 text-white font-bold text-sm scale-[1.02] shadow-[0_0_15px_rgba(91,141,184,0.3)]"
                    : "text-[#E5E7EB]/40 hover:text-[#E5E7EB]/80 text-xs"
                }`}
                style={{
                  borderLeft: isActive ? `3px solid ${accent}` : "3px solid transparent",
                }}
              >
                {line.text}
              </div>
            );
          })
        ) : (
          <div className="text-xs leading-relaxed whitespace-pre-line text-[#E5E7EB]/85 font-mono px-2 py-1">
            {lyricsRaw}
          </div>
        )}
      </div>
    </div>
  );

  // Minimal Pill / Icon Floating Mode
  if (styleMode === "icon") {
    return (
      <>
        <audio
          ref={audioRef}
          src={fileUrl(activeTrack?.url)}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={next}
          loop={tracks.length === 1}
        />
        <div className="fixed bottom-5 right-5 z-40">
          <button
            onClick={togglePlay}
            title={playing && !muted ? "Pause Audio" : "Play Audio"}
            className="w-13 h-13 rounded-full border-2 flex items-center justify-center shadow-2xl backdrop-blur-xl transition-all hover:scale-110 active:scale-95 group relative"
            style={{
              background: `radial-gradient(circle, ${accent}33 0%, #0d0f14 100%)`,
              borderColor: `${accent}88`,
              boxShadow: `0 0 25px ${accent}66`,
            }}
          >
            {coverImg ? (
              <img src={coverImg} alt="" className={`w-9 h-9 rounded-full object-cover ${playing && !muted ? "animate-spin" : ""}`} style={{ animationDuration: "6s" }} />
            ) : (
              <Music size={20} className={playing && !muted ? "animate-pulse" : ""} style={{ color: accent }} />
            )}
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold" style={{ background: accent }}>
              {playing && !muted ? "▶" : "❚❚"}
            </span>
          </button>
        </div>
      </>
    );
  }

  // Pill Mode
  if (styleMode === "pill") {
    return (
      <>
        <audio
          ref={audioRef}
          src={fileUrl(activeTrack?.url)}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={next}
          loop={tracks.length === 1}
        />
        <div className="w-full flex justify-center mt-3 z-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full swat-glass border border-white/15 backdrop-blur-xl shadow-xl">
            <button
              onClick={togglePlay}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0"
              style={{ background: accent }}
            >
              {playing && !muted ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
            </button>
            <div className="max-w-[140px] sm:max-w-[180px] truncate">
              <span className="text-xs font-bold text-white mr-1">{activeTrack?.name || "Audio"}</span>
              <span className="text-[10px] text-white/50">{activeTrack?.artist || ""}</span>
            </div>
            <span className="text-[10px] font-mono text-white/60 select-none">{formatAudioTime(currentTime)}</span>
            <AudioVolumeControl volume={volume} muted={muted} onVolumeChange={handleVolumeChange} onToggleMute={toggleMute} accent={accent} inline={false} />
          </div>
        </div>
      </>
    );
  }

  // Minimal Clean Mode
  if (styleMode === "minimal") {
    return (
      <>
        <audio
          ref={audioRef}
          src={fileUrl(activeTrack?.url)}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={next}
          loop={tracks.length === 1}
        />
        <div className="w-full mt-2 px-3 py-2 flex items-center gap-2.5 text-xs text-white/80">
          <button onClick={togglePlay} className="p-1 rounded hover:bg-white/10 text-white" style={{ color: accent }}>
            {playing && !muted ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <span className="font-semibold truncate max-w-[130px]">{activeTrack?.name || "Track"}</span>
          <div ref={progressBarRef} onClick={handleSeek} className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: accent }} />
          </div>
          <span className="font-mono text-[10px] text-white/50">{formatAudioTime(currentTime)}</span>
        </div>
      </>
    );
  }

  // Container styling classes according to styleMode
  let containerStyleClass = "w-full mt-3 px-1 py-1 bg-transparent border-0 shadow-none transition-all relative z-10";
  if (styleMode === "blur" || styleMode === "glass") {
    containerStyleClass = "w-full mt-4 p-4 rounded-3xl swat-glass border border-white/15 shadow-2xl backdrop-blur-2xl transition-all relative z-10";
  } else if (styleMode === "ghost") {
    containerStyleClass = "w-full mt-3 px-2 py-2 opacity-25 hover:opacity-100 transition-opacity duration-300 relative z-10";
  } else if (styleMode === "floating" || styleMode === "corner") {
    containerStyleClass = "fixed bottom-5 right-5 z-40 max-w-xs p-3 rounded-2xl swat-glass border border-white/20 shadow-2xl backdrop-blur-2xl";
  } else if (styleMode === "overlay") {
    containerStyleClass = "absolute bottom-0 left-0 right-0 p-4 bg-black/75 backdrop-blur-md border-t border-white/10 z-20";
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={fileUrl(activeTrack?.url)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={next}
        loop={tracks.length === 1}
      />
      {lyricsModal}

      {/* Main Tactical Audio Player */}
      <div className={`${widthClass || "w-full"} ${containerStyleClass}`}>
        <div className="flex items-center gap-3">
          {/* Cover Art & Visualizer */}
          <div
            className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-xl overflow-hidden shrink-0 border border-white/20 bg-white/5 flex items-center justify-center cursor-pointer group transition-transform active:scale-95 shadow-md"
            onClick={togglePlay}
            title={playing && !muted ? "Pause" : "Play"}
          >
            {coverImg ? (
              <img
                src={coverImg}
                alt="Cover"
                className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center transition-transform group-hover:scale-105" style={{ background: `${accent}25`, color: accent }}>
                <Music size={20} className={playing && !muted ? "animate-pulse" : ""} />
              </div>
            )}
            {playing && !muted && (
              <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-black animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            )}
          </div>

          {/* Title, Artist & Equalizer */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-baseline justify-between gap-2 mb-1.5 min-w-0">
              <div className="min-w-0 flex items-center gap-2 truncate">
                <span className="text-xs sm:text-sm font-bold text-white truncate" style={{ textShadow: `0 0 12px ${accent}66` }}>
                  {activeTrack?.name || "Audio Track"}
                </span>
                <span className="text-[11px] text-white/55 truncate">
                  {activeTrack?.artist || a?.artist || bio.display_name || bio.username}
                </span>

              </div>
              {hasLyrics && (
                <button
                  onClick={() => setShowLyrics((l) => !l)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-all shrink-0 ${
                    showLyrics
                      ? "border-[#5B8DB8] text-[#5B8DB8] bg-[#5B8DB8]/20"
                      : "border-white/20 text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Lyrics
                </button>
              )}
            </div>

            {/* Timeline Seekbar */}
            <div className="flex items-center gap-2.5 w-full">
              <span className="text-[11px] font-mono font-medium text-white/70 shrink-0 select-none w-8 text-left">
                {formatAudioTime(currentTime)}
              </span>

              <div
                ref={progressBarRef}
                onClick={handleSeek}
                data-testid="audio-seekbar"
                className="flex-1 h-2 rounded-full bg-white/20 hover:bg-white/30 cursor-pointer overflow-hidden relative group/bar transition-colors"
              >
                <div
                  className="h-full rounded-full transition-all group-hover/bar:brightness-125 relative"
                  style={{ width: `${progressPct}%`, background: accent, boxShadow: `0 0 10px ${accent}88` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                </div>
              </div>

              <span className="text-[11px] font-mono font-medium text-white/70 shrink-0 select-none w-8 text-right">
                {formatAudioTime(duration)}
              </span>
            </div>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/10">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={prev}
              title="Previous track"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/75 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            >
              <SkipBack size={15} />
            </button>

            <button
              onClick={togglePlay}
              title={playing && !muted ? "Pause" : "Play"}
              className="w-8.5 h-8.5 rounded-xl flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
              style={{ background: accent, boxShadow: `0 0 14px ${accent}66` }}
            >
              {playing && !muted ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
            </button>

            <button
              onClick={handleStop}
              title="Stop track"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/75 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            >
              <Square size={13} className="fill-current" />
            </button>

            <button
              onClick={next}
              title="Next track"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/75 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            >
              <SkipForward size={15} />
            </button>
          </div>

          <AudioVolumeControl
            volume={volume}
            muted={muted}
            onVolumeChange={handleVolumeChange}
            onToggleMute={toggleMute}
            accent={accent}
            inline={true}
          />
        </div>
      </div>
    </>
  );
}

function getAvatarShape(style) {
  switch (style) {
    case "square": return { borderRadius: "4px", overflow: "hidden" };
    case "squircle": return { borderRadius: "28%", overflow: "hidden" };
    case "rounded": return { borderRadius: "1.25rem", overflow: "hidden" };
    case "hexagon": return { clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)", overflow: "hidden" };
    case "diamond": return { clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)", overflow: "hidden" };
    case "star": return { clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)", overflow: "hidden" };
    case "octagon": return { clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)", overflow: "hidden" };
    case "circle": default: return { borderRadius: "9999px", overflow: "hidden" };
  }
}

function getCardShape(shape) {
  switch (shape) {
    case "sharp": return { borderRadius: "0px" };
    case "squircle": return { borderRadius: "36px" };
    case "pill": return { borderRadius: "44px" };
    case "chamfer": return {
      clipPath: "polygon(0 18px, 18px 0, calc(100% - 18px) 0, 100% 18px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 18px 100%, 0 calc(100% - 18px))",
      WebkitClipPath: "polygon(0 18px, 18px 0, calc(100% - 18px) 0, 100% 18px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 18px 100%, 0 calc(100% - 18px))",
    };
    case "tech_corner": return {
      clipPath: "polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px))",
      WebkitClipPath: "polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px))",
    };
    case "rounded": default: return { borderRadius: "24px" };
  }
}

function getCardMaterial(style, alpha = 0.75, blur = 12, accent = "#5B8DB8", customBg = null, customBorder = null, glowColor = null, glowIntensity = 1, borderEnabled = true) {
  const normalizedStyle = (style || "glass").toLowerCase();
  const numAlpha = typeof alpha === "number" ? alpha : parseFloat(alpha) || 0;

  // If card alpha is 0 or background is set to transparent/none or style is none, render 100% invisible card
  if (numAlpha === 0 || normalizedStyle === "none" || customBg === "transparent" || customBg === "rgba(0,0,0,0)" || customBg === "none") {
    return {
      background: "transparent",
      backgroundColor: "transparent",
      backdropFilter: "none",
      WebkitBackdropFilter: "none",
      border: borderEnabled && customBorder && customBorder !== "transparent" && customBorder !== "none" ? `1px solid ${customBorder}` : "none",
      boxShadow: "none",
    };
  }

  const bg = customBg || `rgba(32,35,41,${numAlpha})`;
  const baseBorder = borderEnabled ? (customBorder ? `1px solid ${customBorder}` : `1px solid ${accent}33`) : "none";
  const activeGlow = glowColor || accent;
  const intensity = typeof glowIntensity === "number" ? glowIntensity : 1;
  const glowHexAlpha = Math.min(255, Math.max(10, Math.round(intensity * 45))).toString(16).padStart(2, "0");
  const glowSpread = Math.round(20 * Math.max(0.5, intensity));

  switch (normalizedStyle) {
    case "solid":
      return {
        background: customBg || "#0c0e12",
        border: baseBorder,
        boxShadow: glowColor && intensity > 0
          ? `0 25px 50px rgba(0,0,0,0.6), 0 0 ${glowSpread}px ${activeGlow}${glowHexAlpha}`
          : "0 25px 50px rgba(0,0,0,0.6)",
      };
    case "outline":
      return {
        background: customBg ? `${customBg}66` : `rgba(8,9,11,${numAlpha * 0.4})`,
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        border: borderEnabled ? (customBorder ? `1.5px solid ${customBorder}` : `1.5px solid ${accent}77`) : "none",
        boxShadow: glowColor && intensity > 0
          ? `0 0 ${glowSpread}px ${activeGlow}${glowHexAlpha}`
          : undefined,
      };
    case "cyber":
      return {
        background: customBg || `rgba(10,12,16,${numAlpha})`,
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        border: borderEnabled ? (customBorder ? `1px solid ${customBorder}` : `1px solid ${accent}66`) : "none",
        boxShadow: `0 0 ${Math.max(16, glowSpread)}px ${activeGlow}${glowHexAlpha}, inset 0 0 15px ${accent}15`,
      };
    case "neon":
      return {
        background: customBg || `rgba(12,14,18,${numAlpha})`,
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        border: borderEnabled ? (customBorder ? `1.5px solid ${customBorder}` : `1.5px solid ${accent}`) : "none",
        boxShadow: `0 0 ${Math.max(25, glowSpread * 1.4)}px ${activeGlow}${glowHexAlpha}, inset 0 0 15px ${accent}25`,
      };
    case "frosted":
      return {
        background: customBg || "rgba(255,255,255,0.06)",
        backdropFilter: `blur(${Math.max(20, blur * 2)}px)`,
        WebkitBackdropFilter: `blur(${Math.max(20, blur * 2)}px)`,
        border: customBorder ? `1px solid ${customBorder}` : "1px solid rgba(255,255,255,0.18)",
        boxShadow: glowColor && intensity > 0
          ? `0 25px 50px rgba(0,0,0,0.5), 0 0 ${glowSpread}px ${activeGlow}${glowHexAlpha}`
          : "0 25px 50px rgba(0,0,0,0.5)",
      };
    case "glass":
    default:
      return {
        background: bg,
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        border: baseBorder,
        boxShadow: glowColor && intensity > 0
          ? `0 25px 50px rgba(0,0,0,0.45), 0 0 ${glowSpread}px ${activeGlow}${glowHexAlpha}`
          : "0 25px 50px rgba(0,0,0,0.45)",
      };
  }
}

function BadgeItem({ badgeData, badgeId, accent, displayStyle = {} }) {
  const [hovered, setHovered] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const badgeRef = useRef(null);

  let name = "";
  let desc = "";
  let col = accent;
  let iconName = "Award";
  let glowColor = null;
  let glowIntensity = 12;

  if (typeof badgeData === "object" && badgeData !== null) {
    if (badgeData.isCustom) {
      name = badgeData.name || "Custom Badge";
      desc = badgeData.desc || "Custom creator badge";
      col = badgeData.color || accent;
      iconName = badgeData.icon || "Sparkles";
      glowColor = badgeData.glow_color || col;
      glowIntensity = badgeData.glow_intensity ?? 15;
    } else {
      const bId = badgeData.id || badgeId;
      const def = BADGE_DEFS.find((d) => d.id.toLowerCase() === (bId || "").toLowerCase());
      name = def?.name || bId;
      desc = def?.desc || "Verified member badge";
      col = def?.color || accent;
      iconName = def?.icon || "Award";
      glowColor = def?.color || accent;
    }
  } else {
    const bId = badgeId || badgeData;
    const def = BADGE_DEFS.find((d) => d.id.toLowerCase() === (bId || "").toLowerCase());
    name = def?.name || bId;
    desc = def?.desc || "Verified member badge";
    col = def?.color || accent;
    iconName = def?.icon || "Award";
    glowColor = def?.color || accent;
  }

  if (displayStyle.badge_color_overlap) {
    col = displayStyle.badge_color_overlap;
  }
  if (displayStyle.badge_glow_overlap) {
    glowColor = displayStyle.badge_glow_overlap;
  }

  const Ic = Icons[iconName] || Icons.Award;
  const size = Math.min(44, Math.max(20, Number(displayStyle.size) || 28));
  const borderRadius = displayStyle.shape === "square" ? "4px" : displayStyle.shape === "rounded" ? "9px" : "9999px";
  const glow = displayStyle.glow === false ? "none" : `0 0 ${Math.max(4, glowIntensity / 2)}px ${glowColor || col}44`;
  const tooltipMode = displayStyle.tooltip_style || displayStyle.tooltip || "normal";

  const updatePos = () => {
    if (badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left + rect.width / 2,
      });
    }
  };

  const handleMouseEnter = () => {
    updatePos();
    setHovered(true);
  };

  return (
    <div
      ref={badgeRef}
      className="relative inline-flex items-center justify-center z-10"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}
      onClick={() => { updatePos(); setHovered((h) => !h); }}
      tabIndex={0}
      role="button"
      aria-label={`${name}: ${desc}`}
      onFocus={handleMouseEnter}
      onBlur={() => setHovered(false)}
    >
      <span
        className="flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer relative"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius,
          background: displayStyle.background === false ? "transparent" : `radial-gradient(circle, ${col}2e 0%, rgba(10,12,16,0.9) 100%)`,
          border: displayStyle.outline === false ? "none" : `1.5px solid ${col}77`,
          color: col,
          boxShadow: displayStyle.glow === false
            ? "none"
            : hovered
              ? `0 0 ${Math.max(16, glowIntensity)}px ${glowColor || col}99, 0 0 6px ${col}`
              : glow,
        }}
      >
        <Ic
          size={Math.round(size * 0.48)}
          className="transition-transform"
          style={{ filter: displayStyle.glow === false ? "none" : `drop-shadow(0 0 ${Math.max(2, glowIntensity / 3)}px ${glowColor || col})` }}
        />
      </span>

      {/* Floating Rich Tooltip rendered directly into document.body via Portal */}
      {hovered && typeof document !== "undefined" && createPortal(
        <div
          className="fixed pointer-events-none z-[999999] -translate-x-1/2 -translate-y-full mb-1.5 animate-in fade-in duration-150 drop-shadow-2xl"
          style={{
            top: coords.top - (tooltipMode === "mini" ? 4 : 8),
            left: coords.left,
          }}
        >
          {tooltipMode === "mini" ? (
            /* Mini Tooltip: Pure crisp text only, zero background, zero box */
            <div className="text-xs font-bold text-white tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] whitespace-nowrap text-center bg-transparent border-0 p-0 shadow-none select-none">
              {name}
            </div>
          ) : tooltipMode === "basic" ? (
            /* Basic Tooltip: Sleek dark pill with badge name */
            <div>
              <div className="px-2.5 py-1 rounded-lg bg-[#0c0e14]/95 border border-white/15 text-xs font-semibold text-white shadow-xl backdrop-blur-md whitespace-nowrap text-center">
                {name}
              </div>
              <div className="w-2 h-2 rotate-45 mx-auto -mt-1 bg-[#0c0e14]/95 border-r border-b border-white/15" />
            </div>
          ) : (
            /* Normal Tooltip: Full glowing rich card with icon preview & description */
            <div style={{ minWidth: "180px", maxWidth: "280px" }}>
              <div
                className="p-2.5 rounded-xl text-left shadow-2xl backdrop-blur-2xl"
                style={{
                  background: "rgba(10, 12, 16, 0.98)",
                  border: `1px solid ${col}66`,
                  boxShadow: `0 12px 35px rgba(0,0,0,0.95), 0 0 20px ${glowColor || col}44`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: `${col}25`, color: col, border: `1px solid ${col}44` }}
                  >
                    <Ic size={11} />
                  </span>
                  <span className="text-xs font-bold truncate text-white" style={{ textShadow: `0 0 10px ${col}66` }}>
                    {name}
                  </span>
                </div>
                <div className="text-[11px] leading-snug text-[#E5E7EB]/90 font-normal">
                  {desc}
                </div>
              </div>
              <div
                className="w-2.5 h-2.5 rotate-45 mx-auto -mt-1.5"
                style={{
                  background: "rgba(10, 12, 16, 0.98)",
                  borderRight: `1px solid ${col}66`,
                  borderBottom: `1px solid ${col}66`,
                }}
              />
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

function BadgesRow({ badges, accent, align = "center", bio, layoutOverride }) {
  const s = bio?.settings || {};
  const displayStyle = {
    tooltip_style: s.badge_tooltip_style || "normal",
    badge_color_overlap: s.badge_color_overlap,
    badge_glow_overlap: s.badge_glow_overlap,
    ...(s.badge_style || {}),
  };
  const badgeLayout = layoutOverride || s.badge_layout || "classic";
  const badgesPos = s.advanced_positioning_enabled ? (s.badges_position || "below_name") : (s.badges_position || "below_name");

  // If badges are configured to be next to name and this isn't the inline call, don't render below
  if (badgesPos === "next_to_name" && !["compact_inline", "inline"].includes(layoutOverride)) {
    return null;
  }

  const shownIds = Array.isArray(s.badges_shown) ? s.badges_shown.map((id) => String(id)) : [];
  const systemBadges = (badges || []).filter((b) => {
    return shownIds.length > 0 && shownIds.includes(String(b));
  });
  const customBadges = bio?.role === "admin"
    ? (s.custom_badges || []).filter((cb) => cb && cb.enabled !== false)
    : [];
  const allBadges = [
    ...systemBadges.map((id) => ({ id, isCustom: false })),
    ...customBadges.map((cb) => ({ ...cb, isCustom: true })),
  ];

  if (allBadges.length === 0) return null;

  if (["compact_inline", "inline"].includes(badgeLayout)) {
    return (
      <span className="inline-flex items-center gap-1.5 align-middle ml-2 select-none relative z-30">
        {allBadges.map((b, idx) => (
          <BadgeItem key={b.id || b.name || idx} badgeData={b} accent={accent} displayStyle={{ ...displayStyle, size: 18 }} />
        ))}
      </span>
    );
  }

  const alignClass = align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center";

  if (["rounded_pill", "pill", "all_in_one"].includes(badgeLayout)) {
    return (
      <div className={`flex w-full max-w-full ${alignClass} items-center mt-2.5 relative z-30`}>
        <div
          className="inline-flex min-w-0 max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 px-3 py-1.5 rounded-2xl backdrop-blur-xl border border-white/15 bg-black/45 shadow-xl"
          style={{
            borderColor: `${accent}44`,
            boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 14px ${accent}25`,
          }}
        >
          {allBadges.map((b, idx) => (
            <React.Fragment key={b.id || b.name || idx}>
              {idx > 0 && <span className="w-1 h-1 rounded-full bg-white/25" />}
              <BadgeItem badgeData={b} accent={accent} displayStyle={{ ...displayStyle, size: displayStyle.size || 22 }} />
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  if (badgeLayout === "grid") {
    return (
      <div className={`grid grid-cols-4 gap-2 mt-2.5 relative z-30 max-w-xs ${align === "left" ? "mr-auto" : align === "right" ? "ml-auto" : "mx-auto"}`}>
        {allBadges.map((b, idx) => (
          <div key={b.id || b.name || idx} className="flex items-center justify-center p-1.5 rounded-xl bg-black/35 border border-white/10">
            <BadgeItem badgeData={b} accent={accent} displayStyle={displayStyle} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap ${alignClass} items-center gap-2 mt-2.5 relative z-30`}>
      {allBadges.map((b, idx) => (
        <BadgeItem key={b.id || b.name || idx} badgeData={b} accent={accent} displayStyle={displayStyle} />
      ))}
    </div>
  );
}

function SocialIconsRow({ links = [], accent, align = "center", max = 50, onSocialClick, iconNoBg = false, iconStyle = "glass" }) {
  const socials = (links || []).filter((l) => {
    const displayAs = l?.config?.display_as;
    return !l?.hidden && !!l?.platform && displayAs !== "card" && displayAs !== "hidden";
  });

  if (socials.length === 0) return null;

  return (
    <div className={`flex flex-wrap ${align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center"} items-center gap-2.5 mt-3.5`}>
      {socials.slice(0, max).map((l) => {
        const Ic = brandIcon(l.platform);
        const customCol = l.config?.custom_icon_color;
        const col = customCol || BRAND_COLORS[l.platform] || accent;
        const customGlow = l.config?.custom_icon_glow || (l.config?.glow ? (l.config?.glow_color || col) : null);
        const glowSize = l.config?.glow_size ?? 12;
        const noBg = iconNoBg || l.config?.no_bg || l.config?.no_icon_bg || iconStyle === "clean" || iconStyle === "minimal";
        const popupEnabled = !!onSocialClick && l.config?.popup_enabled !== false;

        const handleClick = (e) => {
          if (popupEnabled) {
            e.preventDefault();
            onSocialClick(l);
          }
        };

        if (noBg) {
          return (
            <a
              key={l.id}
              href={l.url}
              onClick={handleClick}
              target={popupEnabled ? undefined : "_blank"}
              rel="noreferrer"
              title={`${l.label || l.platform}${popupEnabled ? " (Open profile popup)" : ""}`}
              className="p-1.5 transition-all hover:scale-125 hover:-translate-y-0.5 group cursor-pointer relative flex items-center justify-center rounded-lg"
              style={{
                color: col,
                filter: customGlow ? `drop-shadow(0 0 ${glowSize}px ${customGlow})` : `drop-shadow(0 0 8px ${col}66)`,
              }}
            >
              <Ic size={20} className="transition-transform group-hover:scale-110" />
            </a>
          );
        }

        const isNeon = iconStyle === "neon";
        const isSolid = iconStyle === "solid";

        return (
          <a
            key={l.id}
            href={l.url}
            onClick={handleClick}
            target={popupEnabled ? undefined : "_blank"}
            rel="noreferrer"
            title={`${l.label || l.platform}${popupEnabled ? " (Open profile popup)" : ""}`}
            className="w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all hover:scale-115 hover:-translate-y-0.5 group cursor-pointer relative"
            style={{
              background: isSolid ? "#08090B" : l.config?.icon_color_overlay ? `${col}18` : "rgba(8,9,11,0.75)",
              border: isNeon ? `1.5px solid ${col}` : `1px solid ${col}55`,
              color: col,
              boxShadow: customGlow
                ? `0 0 ${glowSize}px ${customGlow}`
                : isNeon
                ? `0 0 16px ${col}88, inset 0 0 8px ${col}33`
                : `0 0 12px ${col}25`,
            }}
          >
            <Ic size={16} className="transition-transform group-hover:scale-110" />
            <span
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-[#08090B]"
              style={{ background: col }}
            />
          </a>
        );
      })}
    </div>
  );
}

function WeatherWidget({ location = "London", unit = "C", accent }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    if (!location) return;
    fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`)
      .then((r) => r.json())
      .then((json) => {
        if (!alive) return;
        const current = json?.current_condition?.[0];
        const area = json?.nearest_area?.[0]?.areaName?.[0]?.value || location;
        if (current) {
          setData({
            temp_C: current.temp_C,
            temp_F: current.temp_F,
            desc: current.weatherDesc?.[0]?.value || "Clear",
            humidity: current.humidity,
            windspeed: current.windspeedKmph,
            area,
          });
        }
      })
      .catch(() => {
        if (alive) {
          setData({
            temp_C: "21",
            temp_F: "70",
            desc: "Sunny / Clear",
            humidity: "48",
            windspeed: "12",
            area: location,
          });
        }
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [location]);

  if (!location) return null;
  const temp = unit === "F" ? `${data?.temp_F || "70"}°F` : `${data?.temp_C || "21"}°C`;

  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md transition-all hover:border-white/20">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
          <Icons.CloudSun size={18} />
        </div>
        <div className="text-left">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>{data?.area || location}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/70">{temp}</span>
          </div>
          <div className="text-[11px] text-[#E5E7EB]/60 capitalize">{loading ? "Fetching weather..." : data?.desc || "Clear"}</div>
        </div>
      </div>
      {data && (
        <div className="text-right text-[10px] text-white/40 font-mono">
          <div>💧 {data.humidity}%</div>
          <div>💨 {data.windspeed} km/h</div>
        </div>
      )}
    </div>
  );
}

function EnhancedClockWidget({ timezone = "UTC", format = "24h", label = "Local Time", clock_style = "analog", accent }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  let tz = timezone === "auto" || !timezone ? undefined : timezone;
  let timeStr = "";
  let hours = time.getHours();
  let minutes = time.getMinutes();
  let seconds = time.getSeconds();

  try {
    const options = {
      timeZone: tz,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: format === "12h",
    };
    timeStr = time.toLocaleTimeString(undefined, options);

    // Get localized hours/minutes/seconds for analog hands
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    }).formatToParts(time);

    parts.forEach((p) => {
      if (p.type === "hour") hours = parseInt(p.value, 10);
      if (p.type === "minute") minutes = parseInt(p.value, 10);
      if (p.type === "second") seconds = parseInt(p.value, 10);
    });
  } catch (e) {
    timeStr = time.toLocaleTimeString();
  }

  const secondDeg = (seconds / 60) * 360;
  const minuteDeg = ((minutes + seconds / 60) / 60) * 360;
  const hourDeg = (((hours % 12) + minutes / 60) / 12) * 360;

  if (clock_style === "analog") {
    return (
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/45 border border-white/10 backdrop-blur-xl shadow-lg transition-all hover:border-white/20">
        <div className="flex items-center gap-3">
          {/* Authentic Rotating SVG Analog Clock Face */}
          <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#181a20] to-[#0d0e12] border-2 border-white/20 shadow-inner flex items-center justify-center shrink-0">
            {/* Hour tick marks */}
            <div className="absolute inset-0.5 rounded-full pointer-events-none">
              <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-white/60 rounded-full" />
              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-white/60 rounded-full" />
              <span className="absolute left-0.5 top-1/2 -translate-y-1/2 h-0.5 w-1.5 bg-white/60 rounded-full" />
              <span className="absolute right-0.5 top-1/2 -translate-y-1/2 h-0.5 w-1.5 bg-white/60 rounded-full" />
            </div>

            {/* Hour hand */}
            <div
              className="absolute w-0.5 bg-white rounded-full origin-bottom shadow-sm transition-transform duration-200"
              style={{
                height: "12px",
                bottom: "50%",
                left: "calc(50% - 1px)",
                transform: `rotate(${hourDeg}deg)`,
              }}
            />

            {/* Minute hand */}
            <div
              className="absolute w-0.5 bg-[#94a3b8] rounded-full origin-bottom shadow-sm transition-transform duration-200"
              style={{
                height: "17px",
                bottom: "50%",
                left: "calc(50% - 1px)",
                transform: `rotate(${minuteDeg}deg)`,
              }}
            />

            {/* Second hand */}
            <div
              className="absolute w-[1px] rounded-full origin-bottom shadow-sm"
              style={{
                background: accent || "#ef4444",
                height: "19px",
                bottom: "50%",
                left: "calc(50% - 0.5px)",
                transform: `rotate(${secondDeg}deg)`,
                boxShadow: `0 0 4px ${accent || "#ef4444"}`,
              }}
            />

            {/* Center Pin */}
            <div className="absolute w-1.5 h-1.5 rounded-full bg-white ring-1 ring-black z-10" />
          </div>

          <div className="text-left min-w-0">
            <div className="text-xs font-bold text-white truncate">{label || "Local Clock"}</div>
            <div className="text-[10px] font-mono text-white/50 uppercase tracking-wider">{tz || "Local Time"}</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-mono font-bold text-white tracking-widest px-2.5 py-1 rounded-xl bg-white/[0.06] border border-white/10 shadow-inner">
            {timeStr || "--:--:--"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
          <Icons.Clock size={18} />
        </div>
        <div className="text-left">
          <div className="text-xs font-bold text-white">{label || "Clock"}</div>
          <div className="text-[10px] font-mono text-white/50 uppercase">{tz || "Local"}</div>
        </div>
      </div>
      <div className="text-sm font-mono font-bold text-white tracking-wider px-2.5 py-1 rounded-xl bg-black/60 border border-white/10">
        {timeStr || "--:--:--"}
      </div>
    </div>
  );
}

function AccountStatsWidget({ bio, accent }) {
  const createdAt = bio?.created_at;
  const views = bio?.views || 0;
  const badgesCount = (bio?.badges || []).length;

  const getAccountAge = (dateString) => {
    if (!dateString) return "Early Pioneer";
    try {
      const created = new Date(dateString);
      const now = new Date();
      const diffMs = Math.max(0, now - created);
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffMonths = Math.floor(diffDays / 30);
      const diffYears = Math.floor(diffDays / 365);

      if (diffYears >= 1) {
        const remMonths = diffMonths % 12;
        return `Active for ${diffYears}y ${remMonths > 0 ? `${remMonths}m` : ""}`;
      }
      if (diffMonths >= 1) return `Active for ${diffMonths} months`;
      if (diffDays >= 1) return `Active for ${diffDays} days`;
      return "Joined today";
    } catch (e) {
      return "Active Member";
    }
  };

  const formattedDate = createdAt ? new Date(createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : null;

  return (
    <div className="p-3.5 rounded-2xl bg-black/45 border border-white/10 backdrop-blur-xl space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck size={14} />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Account Stats</div>
            <div className="text-[10px] text-white/50">{formattedDate ? `Member since ${formattedDate}` : "Verified Member"}</div>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-emerald-300 font-semibold border border-white/10">
          {getAccountAge(createdAt)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 text-center">
        <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="text-xs font-bold text-white flex items-center justify-center gap-1">
            <Eye size={12} className="text-sky-400" />
            <span>{views.toLocaleString()}</span>
          </div>
          <div className="text-[9px] text-white/40 uppercase tracking-wider mt-0.5">Profile Views</div>
        </div>
        <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="text-xs font-bold text-white flex items-center justify-center gap-1">
            <Award size={12} className="text-amber-400" />
            <span>{badgesCount}</span>
          </div>
          <div className="text-[9px] text-white/40 uppercase tracking-wider mt-0.5">Badges Earned</div>
        </div>
      </div>
    </div>
  );
}

function MusicPlayerWidget({ config = {}, accent }) {
  const type = config.type || "spotify"; // spotify, soundcloud, apple
  const url = config.url || "";
  const title = config.title || "";
  const artist = config.artist || "";

  if (!url) return null;

  const extractId = (u) => {
    const match = u.match(/(?:playlist|track|album|track\/|album\/)([a-zA-Z0-9]+)/);
    return match ? match[1] : u;
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-white/15 bg-black/50 shadow-xl backdrop-blur-xl">
      {(title || artist) && (
        <div className="px-3 py-2 bg-white/[0.04] border-b border-white/10 flex items-center justify-between">
          <div className="text-left min-w-0">
            {title && <div className="text-xs font-bold text-white truncate">{renderBioText(title)}</div>}
            {artist && <div className="text-[10px] text-white/60 truncate">{renderBioText(artist)}</div>}
          </div>
          <div className="shrink-0">
            {type === "spotify" && <SiSpotify size={14} className="text-[#1DB954]" />}
            {type === "soundcloud" && <SiSoundcloud size={16} className="text-[#ff5500]" />}
            {type === "apple" && <SiApplemusic size={14} className="text-[#fa243c]" />}
          </div>
        </div>
      )}

      {type === "spotify" && (
        <iframe
          src={`https://open.spotify.com/embed/${url.includes("playlist") ? "playlist" : "track"}/${extractId(url)}?utm_source=generator&theme=0`}
          width="100%"
          height="152"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title="Spotify Embed"
        />
      )}

      {type === "soundcloud" && (
        <iframe
          width="100%"
          height="150"
          scrolling="no"
          frameBorder="no"
          allow="autoplay"
          src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`}
          title="SoundCloud Embed"
        />
      )}

      {type === "apple" && (
        <iframe
          allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
          frameBorder="0"
          height="150"
          style={{ width: "100%", maxWidth: "100%", overflow: "hidden", background: "transparent" }}
          sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
          src={url.includes("embed.") ? url : url.replace("music.apple.com", "embed.music.apple.com")}
          title="Apple Music Embed"
        />
      )}
    </div>
  );
}

function RobloxWidget({ username, userId, accent }) {
  const targetId = userId || (username ? "1" : null);
  const profileUrl = userId ? `https://www.roblox.com/users/${userId}/profile` : username ? `https://www.roblox.com/user.aspx?username=${username}` : "https://www.roblox.com";
  const avatarUrl = targetId ? `https://www.roblox.com/headshot-thumbnail/image?userId=${targetId}&width=150&height=150&format=png` : null;

  return (
    <a
      href={profileUrl}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between p-3 rounded-2xl bg-black/60 border border-red-500/25 backdrop-blur-md transition-all hover:border-red-500/50 hover:bg-black/80 group"
    >
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Roblox" className="w-full h-full object-cover group-hover:scale-110 transition-transform" onError={(e) => { e.target.style.display = 'none'; }} />
          ) : (
            <SiRoblox size={20} />
          )}
        </div>
        <div className="text-left min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white truncate group-hover:text-red-400 transition-colors">{username || (userId ? `ID: ${userId}` : "Roblox Profile")}</span>
            <SiRoblox size={12} className="text-red-400 shrink-0" />
          </div>
          <div className="text-[10px] text-white/50 font-mono">Roblox Player Profile</div>
        </div>
      </div>
      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
        <ExternalLink size={13} />
      </div>
    </a>
  );
}

function ProfileWidgets({ bio, accent }) {
  const s = bio?.settings || {};
  const widgets = s.widgets || {};
  const hasWidgets =
    widgets.spotify?.enabled ||
    widgets.roblox?.enabled ||
    widgets.weather?.enabled ||
    widgets.clock?.enabled ||
    widgets.discord_server?.enabled ||
    widgets.music_player?.enabled ||
    widgets.account_stats?.enabled ||
    s.spotify_playlist_url ||
    s.spotify_song_url;

  if (!hasWidgets) return null;

  return (
    <div className="mt-4 space-y-3 w-full text-left">
      {/* Discord Server Invite Widget */}
      {widgets.discord_server?.enabled && (
        <DiscordGuildCardWidget
          inviteUrl={widgets.discord_server?.invite_url || widgets.discord_server?.url}
          style={widgets.discord_server?.style || "discord"}
          accent={accent}
        />
      )}

      {/* Music Player Widget (Spotify, SoundCloud, Apple Music) */}
      {widgets.music_player?.enabled && (
        <MusicPlayerWidget
          config={widgets.music_player}
          accent={accent}
        />
      )}

      {/* Account Stats Widget */}
      {widgets.account_stats?.enabled && (
        <AccountStatsWidget bio={bio} accent={accent} />
      )}

      {/* Legacy Spotify Custom Playlist/Song Embed */}
      {!widgets.music_player?.enabled && (widgets.spotify?.enabled || s.spotify_playlist_url || s.spotify_song_url) && (
        <div className="rounded-2xl overflow-hidden border border-[#1DB954]/30 bg-black/40 shadow-xl">
          <iframe
            src={`https://open.spotify.com/embed/${(widgets.spotify?.playlist_url || s.spotify_playlist_url) ? "playlist" : "track"}/${(widgets.spotify?.playlist_url || s.spotify_playlist_url || widgets.spotify?.song_url || s.spotify_song_url || "").match(/(?:playlist|track|album)\/([a-zA-Z0-9]+)/)?.[1] || ""}?utm_source=generator&theme=0`}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-2xl"
            title="Spotify Embed"
          />
        </div>
      )}

      {/* Roblox Widget */}
      {widgets.roblox?.enabled && (
        <RobloxWidget
          username={widgets.roblox?.username}
          userId={widgets.roblox?.user_id}
          accent={accent}
        />
      )}

      {/* Weather Widget */}
      {widgets.weather?.enabled && (
        <WeatherWidget
          location={widgets.weather?.location || "London"}
          unit={widgets.weather?.unit || "C"}
          accent={accent}
        />
      )}

      {/* Enhanced Clock Widget (Analog or Digital) */}
      {widgets.clock?.enabled && (
        <EnhancedClockWidget
          timezone={widgets.clock?.timezone || "UTC"}
          format={widgets.clock?.format || "24h"}
          label={widgets.clock?.label || "Local Time"}
          clock_style={widgets.clock?.style || "analog"}
          accent={accent}
        />
      )}
    </div>
  );
}

function DiscordPresenceWidget({ discord, accent, showBadge, onClick, bio, style = "discord" }) {
  if (!discord && !bio?.connections?.discord && !bio?.settings?.discord_snowflake_id) return null;
  const s = bio?.settings || {};
  const dc = bio?.connections?.discord || discord || {};
  const discordId = s.discord_snowflake_id || dc?.id || dc?.user_id;

  const [lanyard, setLanyard] = useState(null);

  useEffect(() => {
    if (!discordId) return;

    let ws = null;
    let heartbeatInterval = null;
    let alive = true;

    const fetchLanyard = () => {
      fetch(`https://api.lanyard.rest/v1/users/${discordId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (alive && data?.success && data?.data) {
            setLanyard(data.data);
          }
        })
        .catch(() => {});
    };
    fetchLanyard();

    try {
      ws = new WebSocket("wss://api.lanyard.rest/socket");
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { op, t, d } = payload;
          if (op === 1) {
            const interval = d.heartbeat_interval || 30000;
            heartbeatInterval = setInterval(() => {
              if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ op: 3 }));
              }
            }, interval);

            ws.send(JSON.stringify({
              op: 2,
              d: { subscribe_to_id: discordId }
            }));
          } else if (op === 0 && (t === "INIT_STATE" || t === "PRESENCE_UPDATE")) {
            if (alive && d) {
              setLanyard(d);
            }
          }
        } catch (e) {}
      };
      ws.onerror = () => {};
    } catch (e) {}

    return () => {
      alive = false;
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (ws) {
        try { ws.close(); } catch (e) {}
      }
    };
  }, [discordId]);

  const liveStatus = lanyard?.discord_status || s.discord_presence_status || dc.status || dc.presence?.status || "online";
  const userObj = lanyard?.discord_user;
  const liveAvatar = s.discord_avatar_override
    ? fileUrl(s.discord_avatar_override)
    : userObj?.avatar
    ? `https://cdn.discordapp.com/avatars/${dc.id || userObj.id}/${userObj.avatar}.${userObj.avatar.startsWith("a_") ? "gif" : "png"}?size=128`
    : dc.avatar;
  const liveName = userObj?.global_name || userObj?.username || dc.global_name || dc.username || bio?.display_name || bio?.username || "Discord";
  
  const customStatusText = lanyard?.activities?.find((a) => a.type === 4)?.state || s.discord_custom_status;
  const customStatusEmoji = lanyard?.activities?.find((a) => a.type === 4)?.emoji?.name || s.discord_status_emoji;
  
  const mainActivity = lanyard?.activities?.find((a) => a.type === 0 || a.type === 1 || a.type === 3) || (s.discord_activity_name ? { name: s.discord_activity_name, details: s.discord_activity_details, type: 0 } : null);
  const spotify = lanyard?.spotify;

  const statusMap = {
    online: { label: "online", bg: "rgba(34,197,94,0.18)", border: "rgba(34,197,94,0.6)", color: "#23a55a" },
    idle: { label: "idle", bg: "rgba(245,158,11,0.18)", border: "rgba(245,158,11,0.6)", color: "#f0b232" },
    dnd: { label: "dnd", bg: "rgba(239,68,68,0.18)", border: "rgba(239,68,68,0.6)", color: "#f23f43" },
    offline: { label: "offline", bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.4)", color: "#80848e" },
    streaming: { label: "streaming", bg: "rgba(168,85,247,0.18)", border: "rgba(168,85,247,0.5)", color: "#593695" },
  };
  const visual = statusMap[liveStatus] || statusMap.online;

  const isNoBg = style === "nobg" || s.discord_style === "nobg";
  const isGhost = style === "ghost" || s.discord_style === "ghost";

  return (
    <div
      onClick={onClick}
      className={`mt-4 flex items-center gap-3 rounded-2xl p-3 transition-all ${onClick ? "cursor-pointer hover:scale-[1.01]" : ""} ${
        isNoBg
          ? "bg-transparent border border-white/10"
          : isGhost
          ? "bg-white/[0.04] backdrop-blur-2xl border border-white/15 shadow-xl hover:bg-white/[0.07]"
          : "bg-[#232428] border border-[#1e1f22] text-[#dbdee1] shadow-2xl hover:bg-[#2b2d31]"
      }`}
    >
      <div className="relative shrink-0">
        {liveAvatar ? (
          <img src={liveAvatar} alt="" className="w-10 h-10 rounded-full border border-white/10 object-cover" />
        ) : (
          <span className="w-10 h-10 rounded-full bg-[#5865F2]/30 flex items-center justify-center border border-white/10"><SiDiscord color="#5865F2" size={18} /></span>
        )}
        <span
          className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#111214]"
          style={{ background: visual.color, boxShadow: `0 0 10px ${visual.color}` }}
          title={liveStatus}
        />
      </div>

      <div className="text-left min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-[0.18em] text-[#949ba4] font-bold">Discord</span>
          {customStatusText && (
            <span className="text-[10px] text-white/70 truncate max-w-[150px] italic flex items-center gap-1">
              {customStatusEmoji && <span>{customStatusEmoji}</span>}
              <span>— {customStatusText}</span>
            </span>
          )}
        </div>
        <div className="text-xs text-white font-bold truncate">{liveName}</div>
        {spotify ? (
          <div className="text-[10px] text-emerald-400 truncate mt-0.5 font-mono flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Listening to {renderBioText(spotify.song)} — {renderBioText(spotify.artist)}</span>
          </div>
        ) : mainActivity ? (
          <div className="text-[10px] text-white/70 truncate mt-0.5 font-mono">
            {mainActivity.type === 1 ? "Streaming" : mainActivity.type === 2 ? "Listening to" : mainActivity.type === 3 ? "Watching" : "Playing"} <strong className="text-white font-semibold">{mainActivity.name}</strong>
          </div>
        ) : null}
      </div>

      {showBadge && (
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full border shrink-0 font-mono uppercase" style={{ background: visual.bg, borderColor: visual.border, color: visual.color }}>
          {visual.label}
        </span>
      )}
    </div>
  );
}

function getCardWidthClass(width, layout) {
  if (["split_left", "wide", "sidebar_dock", "bento_grid", "profile_header", "showcase_grid"].includes(layout)) return "max-w-2xl";
  if (layout === "grid_tiles" || layout === "floating_glass") return "max-w-lg";
  switch (width) {
    case "sm": return "max-w-sm";
    case "lg": return "max-w-lg";
    case "wide": return "max-w-2xl";
    case "md": default: return "max-w-md";
  }
}

function ViewsBadge({ bio, position }) {
  const s = bio?.settings || {};
  const display = s.views_display || "icon_text";
  const configuredPos = s.views_position || "footer";
  if (display === "hidden") return null;
  if (position !== configuredPos && !(position === "footer" && !s.views_position)) {
    return null;
  }

  const viewsCount = (bio.views || 0).toLocaleString();

  let content = null;
  if (display === "icon_text") {
    content = <><Eye size={12} /> <span>{viewsCount} views</span></>;
  } else if (display === "icon_only") {
    content = <><Eye size={12} /> <span>{viewsCount}</span></>;
  } else if (display === "text_only") {
    content = <span>Views: {viewsCount}</span>;
  } else if (display === "number_only") {
    content = <span>{viewsCount}</span>;
  }

  const isCorner = position === "top_left" || position === "top_right" || position === "bottom_left" || position === "bottom_right";

  if (isCorner) {
    const posClass =
      position === "top_left" ? "top-3.5 left-4" :
      position === "top_right" ? "top-3.5 right-4" :
      position === "bottom_left" ? "bottom-3.5 left-4" : "bottom-3.5 right-4";
    return (
      <div className={`absolute ${posClass} z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-black/60 border border-white/10 text-white/70 backdrop-blur-md shadow-md`}>
        {content}
      </div>
    );
  }

  if (position === "above_avatar" || position === "header") {
    return (
      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono bg-white/5 border border-white/10 text-white/75 mb-2 backdrop-blur-md shadow-sm">
        {content}
      </div>
    );
  }

  if (position === "below_name") {
    return (
      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-black/40 border border-white/10 text-white/70 mt-1">
        {content}
      </div>
    );
  }

  // Footer default
  return (
    <div className="flex items-center justify-center gap-1.5 mt-6 text-xs text-[#E5E7EB]/40">
      {content} · <Link to="/s/home" className="hover:text-[#5B8DB8]">swats.bio</Link>
    </div>
  );
}

function getProfileTitleStyle(style, accent, glowColor, textColor) {
  const base = { color: textColor || "#E5E7EB", textShadow: `0 0 12px ${glowColor || accent}` };
  switch (style) {
    case "depth_3d":
      return {
        ...base,
        transform: "perspective(900px) rotateX(10deg)",
        textShadow: `0 1px 0 rgba(255,255,255,0.18), 0 2px 0 rgba(58,83,107,0.8), 0 3px 0 rgba(36,52,68,0.9), 0 5px 18px rgba(0,0,0,0.45), 0 0 20px ${glowColor || accent}`,
        WebkitTextStroke: "0.5px rgba(255,255,255,0.12)",
      };
    case "glass_3d":
      return {
        ...base,
        background: `linear-gradient(180deg, ${textColor || "#F5F7FA"} 0%, ${accent} 130%)`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        textShadow: `0 0 18px ${glowColor || accent}`,
      };
    case "mono_stack":
      return {
        ...base,
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        textShadow: `0 0 16px ${glowColor || accent}, 0 0 24px rgba(255,255,255,0.18)`,
      };
    default:
      return base;
  }
}

function BioCard({ bio }) {
  const s = {
    ...(bio.settings || {}),
    avatar_decoration: {
      ...(bio.connections?.discord?.avatar_decoration || {}),
      ...(bio.settings?.profile_frame || {}),
      profileEffect: bio.settings?.profile_effect || "none",
      color: bio.settings?.profile_effect_color || "#7db5e3",
    },
  };
  const a = s.audio || {};
  const hasAudio = (a.tracks || []).length > 0;
  useEffect(() => injectCustomFonts(s.custom_fonts), [s.custom_fonts]);

  const cardRef = useRef(null);
  const rafId = useRef(null);

  const handleMouseMove = (e) => {
    if (s.tilt_effect === false || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const rotateY = x * 18;
    const rotateX = -(y * 18);
    const translateX = x * 10;
    const translateY = y * 10;

    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      if (cardRef.current) {
        cardRef.current.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate3d(${translateX}px, ${translateY}px, 0) scale(1.01)`;
      }
    });
  };

  const handleMouseLeave = () => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    if (cardRef.current) {
      cardRef.current.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0) scale(1)";
    }
  };

  const adv = s.advanced_positioning_enabled === true ? s : {};
  const accent = s.accent_color || "#5B8DB8";
  const glowColor = s.glow_color || accent;
  const textColor = s.text_color || "#E5E7EB";
  const descColor = s.desc_color || "rgba(229,231,235,0.8)";
  const locationText = (s.location || "").trim();
  const titleVisual = getProfileTitleStyle(s.title_style || "classic", accent, glowColor, textColor);
  const titleAlignClass = (adv.title_alignment || s.title_alignment || "center") === "left" ? "text-left" : (adv.title_alignment || s.title_alignment || "center") === "right" ? "text-right" : "text-center";
  const contentAlignClass = (adv.desc_alignment || s.content_alignment || "center") === "left" ? "items-start text-left" : (adv.desc_alignment || s.content_alignment || "center") === "right" ? "items-end text-right" : "items-center text-center";
  const avatarAlignClass = (adv.avatar_alignment || s.avatar_alignment || "center") === "left" ? "justify-start" : (adv.avatar_alignment || s.avatar_alignment || "center") === "right" ? "justify-end" : "justify-center";
  
  // Custom advanced positioning overrides
  const customAvatarSize = adv.avatar_size ? { width: `${adv.avatar_size}px`, height: `${adv.avatar_size}px` } : {};
  const customAvatarOffsetY = adv.avatar_offset_y ? { transform: `translateY(${adv.avatar_offset_y}px)` } : {};
  const customTitleStyle = {
    ...titleVisual,
    ...(adv.title_size ? { fontSize: `${adv.title_size}px` } : {}),
    ...(adv.title_offset_y ? { transform: `translateY(${adv.title_offset_y}px)` } : {}),
  };
  const viewsPos = adv.views_position || s.views_position || "footer";
  const locationPos = adv.location_position || "below_name";
  const badgesPos = adv.badges_position || "below_name";
  const iconsPos = adv.icons_position || "below_desc";
  const badgeLayout = s.badge_layout || "classic";

  const cardFxClass = s.card_effect && s.card_effect !== "none" ? `card-fx-${s.card_effect}` : "";
  const cursorClass = s.cursor && s.cursor !== "default" ? `cursor-${s.cursor}` : "";
  const pfpFxClass = s.pfp_effect && s.pfp_effect !== "none" ? `pfp-fx-${s.pfp_effect}` : "";

  const sharedLinkColor = s.link_color_all ? (s.link_color || s.link_bg_color || accent) : s.link_bg_color;
  const linkBg = s.link_color_all ? sharedLinkColor : s.link_bg_color;
  const linkText = s.link_color_all ? (s.link_text_color || "#F5F7FA") : s.link_text_color;
  const cardBorder = s.card_border_color;
  const avatarShape = getAvatarShape(s.avatar_style || s.pfp_shape || s.avatar_shape || "circle");
  const spotifyFormat = s.spotify_presence_format || s.spotify_presence_style || s.presence?.spotify_format || "card";
  const cardShape = getCardShape(s.card_shape);
  const numCardAlpha = s.card_alpha !== undefined && s.card_alpha !== null
    ? (typeof s.card_alpha === "number" ? s.card_alpha : parseFloat(s.card_alpha))
    : (s.card_opacity !== undefined ? Number(s.card_opacity) / 100 : 0.75);
  const isCardInvisible = numCardAlpha === 0 || s.card_opacity === 0 || s.card_opacity === "0" || s.card_bg_color === "transparent" || s.card_bg_color === "none" || s.card_style === "none" || s.remove_card_bg === true;
  const showCardBorder = s.card_border_enabled === true;
  const cardMaterial = getCardMaterial(s.card_style, numCardAlpha, s.bg_blur ?? 12, accent, s.card_bg_color, cardBorder, glowColor, s.glow_intensity, showCardBorder);
  const layout = s.card_layout || "classic";
  const slideshowSlideHeight = Math.min(110, Math.max(65, Number(s.slideshow_slide_height) || 85));
  const widthClass = getCardWidthClass(s.card_width, layout);
  const iconNoBg = s.icon_background_enabled !== true;
  const socialIconStyle = s.social_icon_style || "glass";

  const discord = bio.connections?.discord;
  const showDiscordWidget = (s.discord_presence_enabled !== false || s.presence?.discord) && (discord || s.discord_snowflake_id || s.discord_custom_status || s.discord_presence_status || s.discord_activity_name);
  const isPfpInvisible = s.pfp === "invisible" || s.hide_pfp === true;
  const pfp = isPfpInvisible ? null : ((s.presence?.use_discord_pfp && discord?.avatar) ? discord.avatar : (fileUrl(s.pfp) || `https://api.dicebear.com/7.x/bottts/svg?seed=${bio.username}`));

  const bgList = useMemo(() => {
    const list = Array.isArray(s.backgrounds) && s.backgrounds.length > 0
      ? s.backgrounds.filter((background) => background && background !== "invisible")
      : (s.banner && s.banner !== "invisible" ? [s.banner] : []);
    return list.slice(0, 8);
  }, [s.backgrounds, s.banner]);

  const bgStorageKey = `swats-profile-bg-${bio.username}`;
  const [activeBgIdx, setActiveBgIdx] = useState(() => {
    if (bgList.length <= 1 || s.bg_shuffle === false) return 0;
    let previous = -1;
    try {
      const stored = sessionStorage.getItem(bgStorageKey);
      previous = stored === null ? -1 : Number(stored);
    } catch {}
    const candidates = bgList.map((_, index) => index).filter((index) => index !== previous);
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    try { sessionStorage.setItem(bgStorageKey, String(next)); } catch {}
    return next;
  });

  useEffect(() => {
    if (bgList.length <= 1 || s.bg_auto_cycle !== true) return;
    const intervalSec = Number(s.bg_cycle_speed || 8);
    if (intervalSec <= 0) return;
    const timer = setInterval(() => {
      setActiveBgIdx((prev) => {
        let next;
        if (s.bg_shuffle !== false) {
          do {
            next = Math.floor(Math.random() * bgList.length);
          } while (next === prev && bgList.length > 1);
        } else {
          next = (prev + 1) % bgList.length;
        }
        try { sessionStorage.setItem(bgStorageKey, String(next)); } catch {}
        return next;
      });
    }, intervalSec * 1000);
    return () => clearInterval(timer);
  }, [bgList, bgStorageKey, s.bg_cycle_speed, s.bg_shuffle, s.bg_auto_cycle]);

  const bannerUrl = fileUrl(bgList[activeBgIdx] || s.banner);
  const headerBannerUrl = s.header_banner === "invisible" ? null : fileUrl(s.header_banner) || bannerUrl;
  const headerBannerIsVideo = !!headerBannerUrl && (/\.(mp4|webm|mov|m4v|ogg)([?#]|$)/i.test(headerBannerUrl) || headerBannerUrl.includes("/video/upload/"));
  const headerBannerColor = s.header_banner_color || accent;
  const headerBannerEffect = s.header_banner_effect || "none";
  const headerBannerHidden = s.header_banner_invisible === true || s.header_banner === "invisible" || s.show_banner === false;
  const headerBannerStyle = {
    "--profile-banner-color": headerBannerColor,
    backgroundImage: headerBannerHidden || headerBannerIsVideo ? "none" : headerBannerUrl ? `url(${headerBannerUrl})` : `linear-gradient(135deg, ${headerBannerColor}88, #090b0e)`,
    backgroundColor: headerBannerHidden ? "transparent" : headerBannerColor,
  };
  const isHeaderLayout = ["banner_left", "banner", "profile_header"].includes(layout);
  const showBanner = isHeaderLayout && s.show_banner !== false;
  const showWallpaper = s.show_background !== false && bgList.length > 0;
  const isVideoBanner = bannerUrl && (/\.(mp4|webm|mov|m4v|ogg)([?#]|$)/i.test(bannerUrl) || bannerUrl.includes("video/upload") || bannerUrl.includes("/video/"));

  const isClippedShape = s.card_shape === "chamfer" || s.card_shape === "tech_corner";

  const linksDisplay = s.links_display || "both"; // "both", "cards", "icons"
  const linkBtnStyle = s.link_btn_style || "arrow"; // "arrow", "copy", "presence", "platform", "none"
  const showPresenceModal = s.show_presence_modal !== false;
  const [presenceModal, setPresenceModal] = useState(null);

  const socialLinks = useMemo(() => {
    if (linksDisplay === "cards") return [];
    return (bio.links || []).filter((l) => !l.hidden && l.platform && l.config?.display_as !== "card");
  }, [bio.links, linksDisplay]);

  const cardLinks = useMemo(() => {
    if (linksDisplay === "icons") return [];
    return (bio.links || []).filter((l) => !l.hidden && l.config?.display_as !== "icon");
  }, [bio.links, linksDisplay]);

  const shopProducts = useMemo(() => {
    const items = Array.isArray(s.shop) ? s.shop : [];
    return items.filter((p) => p && (p.name || p.description || p.url || p.image)).slice(0, 8);
  }, [s.shop]);

  const handlePresenceClick = (l) => {
    if (!showPresenceModal) return;
    const url = (l.url || "").trim();
    const plat = (l.platform || "").toLowerCase();
    const isDiscordInvite =
      l.config?.discord_mode === "server" ||
      url.includes("discord.gg/") ||
      url.includes("discord.com/invite/") ||
      url.includes("discordapp.com/invite/");

    if (plat === "discord" && isDiscordInvite) {
      setPresenceModal({ type: "discord_server", link: l, url });
    } else if (plat === "discord") {
      setPresenceModal({ type: "discord_user", link: l, discord: bio.connections?.discord });
    } else if (plat === "tiktok" || url.includes("tiktok.com/")) {
      setPresenceModal({ type: "tiktok", link: l });
    } else if (plat === "spotify" || url.includes("spotify.com/")) {
      setPresenceModal({ type: "spotify", link: l });
    } else if (plat === "youtube" || url.includes("youtube.com/") || url.includes("youtu.be/")) {
      setPresenceModal({ type: "youtube", link: l });
    } else if (plat === "twitch" || url.includes("twitch.tv/")) {
      setPresenceModal({ type: "twitch", link: l });
    } else if (plat === "kick" || url.includes("kick.com/")) {
      setPresenceModal({ type: "kick", link: l });
    } else if (plat === "instagram" || url.includes("instagram.com/")) {
      setPresenceModal({ type: "instagram", link: l });
    } else if (plat === "twitter" || plat === "x" || url.includes("twitter.com/") || url.includes("x.com/")) {
      setPresenceModal({ type: "twitter", link: l });
    } else if (plat === "github" || url.includes("github.com/")) {
      setPresenceModal({ type: "github", link: l });
    } else if (plat === "steam" || url.includes("steamcommunity.com/")) {
      setPresenceModal({ type: "steam", link: l });
    } else if (plat === "roblox" || url.includes("roblox.com/")) {
      setPresenceModal({ type: "roblox", link: l });
    } else if (plat === "telegram" || url.includes("t.me/")) {
      setPresenceModal({ type: "telegram", link: l });
    } else if (plat === "reddit" || url.includes("reddit.com/")) {
      setPresenceModal({ type: "reddit", link: l });
    } else if (plat === "soundcloud" || url.includes("soundcloud.com/")) {
      setPresenceModal({ type: "soundcloud", link: l });
    } else {
      setPresenceModal({ type: "generic", link: l });
    }
  };

  const [activeSlide, setActiveSlide] = useState(0);
  const [scrolledDown, setScrolledDown] = useState(false);

  const customSlides = Array.isArray(s.slideshow?.slides) ? s.slideshow.slides : [];

  const slideshowSlides = useMemo(() => {
    const list = [{ id: "slide-0", label: "Identity" }];

    if (customSlides.length > 0) {
      customSlides.forEach((cs, idx) => {
        list.push({
          id: `slide-custom-${idx}`,
          label: cs.title || cs.serverName || `Slide ${idx + 1}`,
          customData: cs,
        });
      });
    } else {
      list.push({ id: "slide-1", label: "Projects" });
      if (s.discord_guild?.name || s.discord_server?.name || s.discord_guild?.invite_url) {
        list.push({ id: "slide-2", label: "Discord" });
      }
    }

    if (Array.isArray(s.promos) && s.promos.length > 0) {
      list.push({ id: "slide-3", label: "Showcase" });
    }
    list.push({ id: "slide-footer", label: "Footer" });
    return list;
  }, [customSlides, s.projects, s.discord_guild, s.discord_server, s.promos]);

  const scrollToSlide = (id) => {
    const target = id && document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  const slideshowStyle = (id, minHeight = "var(--profile-slide-height)") => {
    const index = slideshowSlides.findIndex((slide) => slide.id === id);
    const fade = s.slideshow_transition === "fade";
    return {
      minHeight,
      scrollMarginTop: "1rem",
      opacity: fade && index >= 0 && index !== activeSlide ? 0.76 : 1,
      transition: fade ? "opacity 550ms ease-out" : "none",
    };
  };

  useEffect(() => {
    if (layout !== "slideshow") return;
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setScrolledDown(scrollY > 40);

      const viewportCenter = scrollY + window.innerHeight / 2;
      let closestIdx = 0;
      let minDistance = Infinity;

      slideshowSlides.forEach((slide, idx) => {
        const el = document.getElementById(slide.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          const elemCenter = scrollY + rect.top + rect.height / 2;
          const dist = Math.abs(viewportCenter - elemCenter);
          if (dist < minDistance) {
            minDistance = dist;
            closestIdx = idx;
          }
        }
      });
      setActiveSlide(closestIdx);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [layout, slideshowSlides]);

  return (
    <div className={`swat-bg min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-16 relative overflow-x-hidden ${cursorClass}`} data-profile-outline={s.profile_outline_enabled === true ? "on" : "off"} data-profile-layout={layout} style={{ "--profile-slide-height": `${slideshowSlideHeight}vh` }}>
      {/* Subtle organic noise overlay to remove AI sterile feel */}
      <div className="noise-overlay pointer-events-none fixed inset-0 z-1 opacity-25" />

      {/* Background Media Cross-Fading (up to 3 backgrounds shuffle/cycle) */}
      {showWallpaper && (
        <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden">
          {bgList.map((bgUrlRaw, idx) => {
            const url = fileUrl(bgUrlRaw);
            const isVideo = url && (/\.(mp4|webm|mov|m4v|ogg)([?#]|$)/i.test(url) || url.includes("video/upload") || url.includes("/video/"));
            const isActive = idx === activeBgIdx;
            return (
              <div
                key={`${idx}-${bgUrlRaw}`}
                className={`absolute inset-0 w-full h-full ${s.bg_transition === "fade" ? "transition-opacity ease-in-out" : ""} ${
                  isActive ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
                }`}
                style={{ transitionDuration: `${Number(s.bg_transition_duration || 1200)}ms` }}
              >
                {isVideo ? (
                  <video
                    src={url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-cover bg-center bg-no-repeat ${s.bg_transition === "fade" ? "transition-transform ease-out" : ""}`}
                    style={{ backgroundImage: `url(${url})`, transitionDuration: `${Number(s.bg_transition_duration || 1200)}ms` }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Background Tint & Blur Overlay */}
      {(showWallpaper || s.bg_tint_color) && (
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            backgroundColor: s.bg_tint_color ? `${s.bg_tint_color}${s.bg_tint_color.length === 7 ? "66" : ""}` : "rgba(0,0,0,0.45)",
            backdropFilter: s.bg_blur ? `blur(${s.bg_blur}px)` : undefined,
            WebkitBackdropFilter: s.bg_blur ? `blur(${s.bg_blur}px)` : undefined,
          }}
        />
      )}

      {/* Dynamic Animated Background Effect */}
      <BackgroundEffect effect={s.bg_effect} />

      {/* Interactive Cursor Effects Renderer (Trail, Sparkles, Reticle, Halo, Dot) */}
      <CursorEffectsRenderer effect={s.cursor_fx} color={s.cursor_fx_color || accent} size={s.cursor_fx_size || 18} />

      {/* Guns.lol / Feds Slideshow Floating HUD Overlays */}
      {layout === "slideshow" && s.slideshow_hud_enabled !== false && (
        <>
          {s.slideshow_audio_enabled !== false && <HudTopLeftAudio bio={bio} accent={accent} />}
          {s.slideshow_stats_enabled !== false && <HudBottomLeftStats bio={bio} locationText={locationText} accent={accent} />}
          {s.slideshow_dots_enabled !== false && <HudMiddleRightDots
            slides={slideshowSlides}
            activeSlide={activeSlide}
            onSelectSlide={(idx) => {
              scrollToSlide(slideshowSlides[idx]?.id);
            }}
            accent={accent}
          />}
          {s.slideshow_scroll_hint_enabled !== false && <HudBottomCenterScroll
            visible={!scrolledDown && activeSlide === 0}
            onClick={() => {
              const nextSlide = slideshowSlides[1]?.id || "slide-footer";
              scrollToSlide(nextSlide);
            }}
            accent={accent}
          />}
        </>
      )}

      {/* LAYOUT: SLIDESHOW DECK (FULL-PAGE SECTIONS PER SLIDE) */}
      {layout === "slideshow" ? (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center relative z-10 px-2 py-4">
          {/* Slide 1: Identity & Presence */}
          <div id="slide-0" className="min-h-[85vh] sm:min-h-screen w-full flex flex-col items-center justify-center py-10" style={slideshowStyle("slide-0")}>
            <div
              className={`w-full max-w-lg transition-transform duration-75 overflow-hidden text-center ${layout === "minimal" || isCardInvisible ? "bg-transparent border-0 shadow-none p-4" : "p-6 sm:p-8 rounded-3xl swat-glass border border-white/15 shadow-2xl backdrop-blur-2xl"}`}
              style={{
                ...(layout === "minimal" || isCardInvisible ? { background: "transparent", backdropFilter: "none", WebkitBackdropFilter: "none", border: showCardBorder && cardBorder ? `1px solid ${cardBorder}` : "none", boxShadow: "none" } : cardMaterial),
                ...(layout === "minimal" || isCardInvisible ? {} : cardShape),
                fontFamily: s.font || "Outfit",
              }}
            >
              <div className="relative inline-block">
                <MediaDisplay src={pfp} alt={bio.display_name || bio.username} className="w-24 h-24 mx-auto object-cover border-2 relative z-10" style={{ ...avatarShape, borderColor: accent, boxShadow: `0 0 ${s.glow_intensity ?? 30}px ${glowColor}` }} />
                <AvatarDecoration decoration={s.avatar_decoration} />
              </div>
              <h1 className={`profile-title-3d text-2xl sm:text-3xl font-black mt-3.5 ${titleAlignClass}`} style={titleVisual}>{renderBioText(bio.display_name || bio.username)}</h1>
              <div className="text-xs font-semibold mt-1 tracking-wider uppercase" style={{ color: accent }}>@{bio.username}</div>
              <BadgesRow badges={bio.badges} accent={accent} align="center" bio={bio} />
              {locationText && <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.18em] text-[#E5E7EB]/80"><MapPin size={11} style={{ color: accent }} /> {locationText}</div>}
              {bio.description && <div className="text-sm mt-4 leading-relaxed font-normal" style={{ color: descColor }}>{renderBioText(bio.description)}</div>}
              <SocialIconsRow links={socialLinks} accent={accent} align="center" onSocialClick={showPresenceModal ? handlePresenceClick : null} iconNoBg={iconNoBg} iconStyle={socialIconStyle} />

              {showDiscordWidget && (
                <div className="mt-5 pt-4 border-t border-white/10 space-y-3">
                  <DiscordPresenceWidget discord={discord} accent={accent} bio={bio} showBadge={s.presence?.show_discord_badge} onClick={showPresenceModal ? () => setPresenceModal({ type: "discord", discord }) : undefined} />
                  {s.presence?.spotify && <NowPlaying username={bio.username} accent={accent} discordId={discord?.id} format={spotifyFormat} />}
                </div>
              )}

              {/* Interactive Profile Widgets */}
              <ProfileWidgets bio={bio} accent={accent} />

              {cardLinks.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <RenderLinksContainer
                    links={cardLinks}
                    accent={accent}
                    linkBg={linkBg}
                    linkText={linkText}
                    cardBorder={cardBorder}
                    rightBtnStyle={linkBtnStyle}
                    linkLayoutStyle={s.link_layout_style}
                    linkAnimation={s.link_animation}
                    iconNoBg={iconNoBg}
                    linkColorOverlap={s.link_color_overlap}
                    linkGlowOverlap={s.link_glow_overlap}
                    showPresenceModal={showPresenceModal}
                    onPresenceClick={handlePresenceClick}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Slide 2: Projects & Code Showcase */}
          <div id="slide-1" className="min-h-[85vh] sm:min-h-screen w-full flex flex-col items-center justify-center py-10" style={slideshowStyle("slide-1")}>
              <div
                className={`w-full max-w-xl transition-all duration-500 ease-out overflow-hidden text-left ${layout === "minimal" || isCardInvisible ? "bg-transparent border-0 shadow-none p-5 sm:p-7" : "p-7 sm:p-9 rounded-2xl swat-glass border border-white/15 shadow-2xl backdrop-blur-2xl"}`}
                style={{
                  ...(layout === "minimal" || isCardInvisible ? { background: "transparent", backdropFilter: "none", WebkitBackdropFilter: "none", border: showCardBorder && cardBorder ? `1px solid ${cardBorder}` : "none", boxShadow: "none" } : cardMaterial),
                  ...(layout === "minimal" || isCardInvisible ? {} : cardShape),
                  fontFamily: s.font || "Outfit",
                }}
              >
                <div className="flex items-center justify-between gap-3 mb-5 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/10 text-white" style={{ borderColor: `${accent}66`, border: '1px solid' }}>
                      <Code2 size={16} style={{ color: accent }} />
                    </span>
                    <div>
                      <h3 className="text-base font-bold uppercase tracking-wider text-white">Projects & Portfolio</h3>
                      <p className="text-xs text-[#E5E7EB]/60">Built with code & passion</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider" style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}44` }}>
                    {(s.projects || []).length} Works
                  </span>
                </div>

                {(Array.isArray(s.projects) && s.projects.length > 0) ? <div className="grid gap-4 sm:grid-cols-1">
                  {s.projects.map((p, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-black/40 border border-white/10 hover:border-white/25 transition-all duration-200 group">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white group-hover:text-[#5B8DB8] transition-colors" style={{ color: accent }}>
                              {stripEffectSyntax(p.title || "Project")}
                            </span>
                            {p.category && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-white/10 text-[#E5E7EB]/80 border border-white/10">
                                {p.category}
                              </span>
                            )}
                          </div>
                          {p.description && (
                            <p className="text-xs text-[#E5E7EB]/75 mt-1.5 leading-relaxed font-normal">
                              {renderBioText(p.description)}
                            </p>
                          )}
                        </div>
                      </div>

                      {Array.isArray(p.languages) && p.languages.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-white/5">
                          {p.languages.map((lang, lIdx) => (
                            <span key={lIdx} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/60 border border-white/10 text-white/90">
                              {lang}
                            </span>
                          ))}
                        </div>
                      )}

                      {(p.demo_url || p.github_url) && (
                        <div className="flex items-center gap-2.5 mt-3 pt-2.5 border-t border-white/10">
                          {p.demo_url && (
                            <a href={p.demo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/20 transition-all border border-white/15">
                              <ExternalLink size={12} /> Live Demo
                            </a>
                          )}
                          {p.github_url && (
                            <a href={p.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold text-white/80 hover:text-white bg-black/50 hover:bg-black/80 transition-all border border-white/10">
                              <SiGithub size={12} /> Source Code
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div> : <div className="rounded-xl border border-white/10 bg-black/25 px-5 py-8 text-center">
                  <Code2 size={25} className="mx-auto mb-3" style={{ color: accent }} />
                  <p className="text-sm font-semibold text-white">Your portfolio starts here</p>
                  <p className="mt-1 text-xs text-white/55">Projects you add will appear in this space.</p>
                </div>}
              </div>
            </div>

          {/* Slide 3: Discord Server Widget */}
          {((s.discord_guild?.name || s.discord_server?.name || s.discord_guild?.invite_url)) && (
            <div id="slide-2" className="min-h-[85vh] sm:min-h-screen w-full flex flex-col items-center justify-center py-10" style={slideshowStyle("slide-2")}>
              <div
                className={`w-full max-w-lg transition-transform duration-75 overflow-hidden text-left ${layout === "minimal" || isCardInvisible ? "bg-transparent border-0 shadow-none p-4" : "p-6 sm:p-8 rounded-3xl swat-glass border border-white/15 shadow-2xl backdrop-blur-2xl"} ${cardFxClass}`}
                style={{
                  ...(layout === "minimal" || isCardInvisible ? { background: "transparent", backdropFilter: "none", WebkitBackdropFilter: "none", border: showCardBorder && cardBorder ? `1px solid ${cardBorder}` : "none", boxShadow: "none" } : cardMaterial),
                  ...(layout === "minimal" || isCardInvisible ? {} : cardShape),
                  fontFamily: s.font || "Outfit",
                }}
              >
                <DiscordGuildCardWidget guildConfig={s.discord_guild || s.discord_server} accent={accent} />
              </div>
            </div>
          )}

          {/* Slide 4: Promo Showcase & Media Banners */}
          {(Array.isArray(s.promos) && s.promos.length > 0) && (
            <div id="slide-3" className="min-h-[85vh] sm:min-h-screen w-full flex flex-col items-center justify-center py-10" style={slideshowStyle("slide-3")}>
              <div
                className={`w-full max-w-lg transition-transform duration-75 overflow-hidden text-left space-y-4 ${layout === "minimal" || isCardInvisible ? "bg-transparent border-0 shadow-none p-4" : "p-6 sm:p-8 rounded-3xl swat-glass border border-white/15 shadow-2xl backdrop-blur-2xl"} ${cardFxClass}`}
                style={{
                  ...(layout === "minimal" || isCardInvisible ? { background: "transparent", backdropFilter: "none", WebkitBackdropFilter: "none", border: showCardBorder && cardBorder ? `1px solid ${cardBorder}` : "none", boxShadow: "none" } : cardMaterial),
                  ...(layout === "minimal" || isCardInvisible ? {} : cardShape),
                  fontFamily: s.font || "Outfit",
                }}
              >
                <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <Sparkles size={16} style={{ color: accent }} />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Promo Showcase</h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-1">
                  {s.promos.map((item, idx) => (
                    <div key={idx} className="rounded-2xl bg-black/40 border border-white/10 overflow-hidden group">
                      {item.media_url && (
                        item.media_type === "video" || /\.(mp4|webm)$/i.test(item.media_url) ? (
                          <video src={fileUrl(item.media_url)} autoPlay loop muted playsInline className="w-full h-44 object-cover" />
                        ) : (
                          <img src={fileUrl(item.media_url)} alt="" loading="lazy" decoding="async" className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
                        )
                      )}
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-white">{item.title || "Featured"}</h4>
                          {item.link && (
                            <a href={item.link} target="_blank" rel="noreferrer" className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 border border-white/10">
                              Visit <ChevronRight size={12} />
                            </a>
                          )}
                        </div>
                        {item.description && <p className="text-xs text-[#E5E7EB]/70 mt-1 leading-relaxed">{renderBioText(item.description)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Slide Footer */}
          <div id="slide-footer" className="min-h-[50vh] w-full flex flex-col items-center justify-center py-10 text-center space-y-3" style={slideshowStyle("slide-footer", "50vh")}>
            {s.footer_text && <p className="text-xs text-[#E5E7EB]/60 font-medium max-w-sm">{renderBioText(s.footer_text)}</p>}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 border border-white/10 text-[10px] text-white/50 tracking-wider">
              <span>swats.bio</span> • <span style={{ color: accent }}>verified</span>
            </div>
          </div>
        </div>
      ) : (
        /* Main Card & Audio Player Centered Column (Standard / Grid / Bento / Minimal / etc.) */
        <div className={`w-full ${widthClass} flex flex-col items-center relative z-10 mx-auto anim-card-${s.enter_screen?.card_animation || "slide_up"}`}>
          {/* Top Docked Audio Player if selected */}
          {hasAudio && a.display !== false && (a.card_style === "top" || a.style === "top") && (
            <TacticalAudioPlayer bio={bio} accent={accent} widthClass="w-full mb-3" />
          )}

          {/* Main Profile Card Container */}
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`w-full relative z-10 transition-transform duration-75 overflow-hidden ${layout === "minimal" || isCardInvisible ? "bg-transparent border-0 shadow-none p-4" : "p-6 sm:p-8"} ${cardFxClass}`}
            style={{
              ...(layout === "minimal" || isCardInvisible ? { background: "transparent", backdropFilter: "none", WebkitBackdropFilter: "none", border: showCardBorder && cardBorder ? `1px solid ${cardBorder}` : "none", boxShadow: "none" } : cardMaterial),
              ...(layout === "minimal" || isCardInvisible ? {} : cardShape),
              ...(isClippedShape && layout !== "minimal" && !isCardInvisible ? { filter: `drop-shadow(0 20px 40px rgba(0,0,0,0.7))` } : {}),
              fontFamily: s.font || "Outfit",
              willChange: "transform",
            }}
          >
            {/* Corner Views Badges */}
            <ViewsBadge bio={bio} position="top_left" />
            <ViewsBadge bio={bio} position="top_right" />
            <ViewsBadge bio={bio} position="bottom_left" />
            <ViewsBadge bio={bio} position="bottom_right" />

            {/* Top Incard Audio Player if selected */}
            {hasAudio && a.display !== false && (a.card_style === "incard-top" || a.style === "incard-top") && (
              <TacticalAudioPlayer bio={bio} accent={accent} widthClass="w-full mb-4" />
            )}

            {/* Above-Avatar Views Badge (if configured via advanced positioning) */}
            {viewsPos === "above_avatar" && <ViewsBadge bio={bio} position="above_avatar" />}

        {/* LAYOUT 1: GRID TILES (2x2 Grid) */}
        {layout === "grid_tiles" && (
          <div className={`text-center ${contentAlignClass}`}>
            <div className={`relative inline-block ${avatarAlignClass}`}>
              <MediaDisplay src={pfp} alt={bio.display_name || bio.username} className="w-22 h-22 mx-auto object-cover border-2 relative z-10" style={{ ...avatarShape, ...customAvatarSize, ...customAvatarOffsetY, borderColor: accent, boxShadow: `0 0 ${s.glow_intensity ?? 30}px ${glowColor}` }} />
              <AvatarDecoration decoration={s.avatar_decoration} />
            </div>
            <h1 className={`profile-title-3d text-2xl font-extrabold mt-3.5 ${titleAlignClass}`} style={customTitleStyle}>{renderBioText(bio.display_name || bio.username)}</h1>
            <div className="text-xs font-medium mt-0.5" style={{ color: accent }}>@{bio.username}</div>
            {viewsPos === "below_name" && <ViewsBadge bio={bio} position="below_name" />}
            <BadgesRow badges={bio.badges} accent={accent} align={adv.badges_alignment || "center"} bio={bio} />
            {locationText && <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.18em] text-[#E5E7EB]/75"><MapPin size={11} /> {locationText}</div>}
            {bio.description && <div className="text-xs mt-3 leading-relaxed" style={{ color: descColor, textAlign: adv.desc_alignment || undefined }}>{renderBioText(bio.description)}</div>}
            <SocialIconsRow links={socialLinks} accent={accent} align={adv.icons_alignment || "center"} onSocialClick={showPresenceModal ? handlePresenceClick : null} iconNoBg={iconNoBg} iconStyle={socialIconStyle} />

            {s.presence?.discord && discord && <DiscordPresenceWidget discord={discord} accent={accent} showBadge={s.presence?.show_discord_badge} onClick={showPresenceModal ? () => setPresenceModal({ type: "discord", discord }) : undefined} />}
            {s.presence?.spotify && <NowPlaying username={bio.username} accent={accent} discordId={discord?.id} format={spotifyFormat} />}

            {/* Interactive Profile Widgets */}
            <ProfileWidgets bio={bio} accent={accent} />

            {/* 2x2 Grid of square tiles */}
            {cardLinks.length > 0 && (
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mt-6">
                {cardLinks.map((l, i) => (
                  <LinkTile
                    key={l.id}
                    l={l}
                    accent={accent}
                    index={i}
                    linkBg={linkBg}
                    linkText={linkText}
                    cardBorder={cardBorder}
                    animation={s.link_animation}
                    iconNoBg={iconNoBg}
                    linkColorOverlap={s.link_color_overlap}
                    linkGlowOverlap={s.link_glow_overlap}
                    onPresenceClick={showPresenceModal ? handlePresenceClick : null}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* LAYOUT: MINI BANNER HEADER (Very compact banner fading out smoothly) */}
        {layout === "mini_banner" && (
          <div>
            {/* Very Small Banner with bottom fade */}
            <div
              className={`profile-header-banner relative -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 h-20 sm:h-24 bg-cover bg-center overflow-hidden ${!headerBannerHidden && headerBannerEffect !== "none" ? `profile-banner-fx-${headerBannerEffect}` : ""}`}
              style={headerBannerStyle}
            >
              {!headerBannerHidden && headerBannerIsVideo && <video src={headerBannerUrl} autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover" />}
              {!headerBannerHidden && (
                <>
                  <div className="absolute inset-0 mix-blend-color opacity-30" style={{ backgroundColor: headerBannerColor }} />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/90" />
                </>
              )}
            </div>

            {/* Avatar Overlapping Mini Banner */}
            <div className="relative -mt-9 sm:-mt-11 mb-2.5 flex items-end justify-between px-1 z-10">
              <div className="relative inline-block">
                <img
                  src={pfp}
                  alt={bio.display_name || bio.username}
                  className="w-18 h-18 sm:w-20 sm:h-20 object-cover border-3 ring-2 ring-black/50 shadow-2xl relative z-10"
                  style={{
                    ...avatarShape,
                    ...customAvatarSize,
                    ...customAvatarOffsetY,
                    borderColor: accent,
                    boxShadow: `0 6px 20px rgba(0,0,0,0.6), 0 0 ${s.glow_intensity ?? 30}px ${glowColor}`,
                  }}
                />
                <AvatarDecoration decoration={s.avatar_decoration} />
              </div>
            </div>

            {/* Info Bar */}
            <div className="text-left px-1 mt-1">
              <div className="flex items-center flex-wrap gap-1.5">
                <h1 className={`profile-title-3d text-xl sm:text-2xl font-extrabold ${titleAlignClass}`} style={customTitleStyle}>
                  {renderBioText(bio.display_name || bio.username)}
                </h1>
                {badgesPos === "next_to_name" && (
                  <BadgesRow badges={bio.badges} accent={accent} bio={bio} layoutOverride="compact_inline" />
                )}
              </div>
              <div className="text-xs font-semibold tracking-wide mt-0.5" style={{ color: accent }}>
                @{bio.username}
              </div>
              {viewsPos === "below_name" && <ViewsBadge bio={bio} position="below_name" />}
              <BadgesRow badges={bio.badges} accent={accent} align={adv.badges_alignment || "left"} bio={bio} />
              {locationText && <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.18em] text-[#E5E7EB]/75"><MapPin size={10} /> {locationText}</div>}
              {bio.description && (
                <div className="text-xs sm:text-sm mt-2.5 leading-relaxed" style={{ color: descColor, textAlign: adv.desc_alignment || undefined }}>
                  {renderBioText(bio.description)}
                </div>
              )}
              <SocialIconsRow links={socialLinks} accent={accent} align={adv.icons_alignment || "left"} onSocialClick={showPresenceModal ? handlePresenceClick : null} iconNoBg={iconNoBg} iconStyle={socialIconStyle} />
            </div>

            {showDiscordWidget && <DiscordPresenceWidget discord={discord} accent={accent} bio={bio} showBadge={s.presence?.show_discord_badge} onClick={showPresenceModal ? () => setPresenceModal({ type: "discord", discord }) : undefined} />}
            {s.presence?.spotify && <NowPlaying username={bio.username} accent={accent} discordId={discord?.id} format={spotifyFormat} />}
            
            <ProfileWidgets bio={bio} accent={accent} />

            {cardLinks.length > 0 && (
              <RenderLinksContainer
                links={cardLinks}
                accent={accent}
                linkBg={linkBg}
                linkText={linkText}
                cardBorder={cardBorder}
                rightBtnStyle={linkBtnStyle}
                linkLayoutStyle={s.link_layout_style}
                linkAnimation={s.link_animation}
                iconNoBg={iconNoBg}
                linkColorOverlap={s.link_color_overlap}
                linkGlowOverlap={s.link_glow_overlap}
                showPresenceModal={showPresenceModal}
                onPresenceClick={handlePresenceClick}
              />
            )}
          </div>
        )}

        {/* LAYOUT 3: BANNER HEADER (Cover with Avatar Docked Left) */}
        {(layout === "banner_left" || layout === "banner") && (
          <div>
            {/* Top Banner Cover */}
            <div
              className={`profile-header-banner relative -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 h-36 sm:h-44 bg-cover bg-center overflow-hidden ${!headerBannerHidden && headerBannerEffect !== "none" ? `profile-banner-fx-${headerBannerEffect}` : ""}`}
              style={headerBannerStyle}
            >
              {!headerBannerHidden && headerBannerIsVideo && <video src={headerBannerUrl} autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover" />}
              {!headerBannerHidden && <>
                <div className="absolute inset-0 mix-blend-color opacity-30" style={{ backgroundColor: headerBannerColor }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              </>}
            </div>

            {/* Avatar Docked Left Overlapping Banner */}
            <div className="relative -mt-12 sm:-mt-14 mb-3 flex items-end justify-between px-1 z-10">
              <div className="relative inline-block">
                <img
                  src={pfp}
                  alt={bio.display_name || bio.username}
                  className="w-22 h-22 sm:w-26 sm:h-26 object-cover border-4 ring-2 ring-black/40 shadow-2xl relative z-10"
                  style={{
                    ...avatarShape,
                    ...customAvatarSize,
                    ...customAvatarOffsetY,
                    borderColor: accent,
                    boxShadow: `0 8px 24px rgba(0,0,0,0.6), 0 0 ${s.glow_intensity ?? 30}px ${glowColor}`,
                  }}
                />
                <AvatarDecoration decoration={s.avatar_decoration} />
              </div>
            </div>

            {/* Wide Status / Info Bar */}
            <div className="text-left px-1 mt-1">
              <div className="flex items-center flex-wrap gap-2">
                <h1 className={`profile-title-3d text-2xl sm:text-3xl font-extrabold ${titleAlignClass}`} style={customTitleStyle}>
                  {renderBioText(bio.display_name || bio.username)}
                </h1>
                {badgesPos === "next_to_name" && (
                  <BadgesRow badges={bio.badges} accent={accent} bio={bio} layoutOverride="compact_inline" />
                )}
              </div>
              <div className="text-xs font-semibold tracking-wide mt-0.5" style={{ color: accent }}>
                @{bio.username}
              </div>
              {viewsPos === "below_name" && <ViewsBadge bio={bio} position="below_name" />}
              <BadgesRow badges={bio.badges} accent={accent} align={adv.badges_alignment || "left"} bio={bio} />
              {locationText && <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.18em] text-[#E5E7EB]/75"><MapPin size={11} /> {locationText}</div>}
              {bio.description && (
                <div className="text-xs sm:text-sm mt-3 leading-relaxed" style={{ color: descColor, textAlign: adv.desc_alignment || undefined }}>
                  {renderBioText(bio.description)}
                </div>
              )}
              <SocialIconsRow links={socialLinks} accent={accent} align={adv.icons_alignment || "left"} onSocialClick={showPresenceModal ? handlePresenceClick : null} iconNoBg={iconNoBg} iconStyle={socialIconStyle} />
            </div>

            {showDiscordWidget && <DiscordPresenceWidget discord={discord} accent={accent} bio={bio} showBadge={s.presence?.show_discord_badge} onClick={showPresenceModal ? () => setPresenceModal({ type: "discord", discord }) : undefined} />}
            {s.presence?.spotify && <NowPlaying username={bio.username} accent={accent} discordId={discord?.id} format={spotifyFormat} />}
            
            {/* Interactive Profile Widgets */}
            <ProfileWidgets bio={bio} accent={accent} />

            {cardLinks.length > 0 && (
              <RenderLinksContainer
                links={cardLinks}
                accent={accent}
                linkBg={linkBg}
                linkText={linkText}
                cardBorder={cardBorder}
                rightBtnStyle={linkBtnStyle}
                linkLayoutStyle={s.link_layout_style}
                linkAnimation={s.link_animation}
                iconNoBg={iconNoBg}
                linkColorOverlap={s.link_color_overlap}
                linkGlowOverlap={s.link_glow_overlap}
                showPresenceModal={showPresenceModal}
                onPresenceClick={handlePresenceClick}
              />
            )}
          </div>
        )}

        {/* LAYOUT 4: CLASSIC CENTERED */}
        {(layout === "classic" || layout === "minimal") && (
          <div className={`text-center ${contentAlignClass}`}>
            <div className={`relative inline-block ${avatarAlignClass}`}>
              <MediaDisplay src={pfp} alt={bio.display_name || bio.username} className="w-24 h-24 mx-auto object-cover border-2 relative z-10" style={{ ...avatarShape, ...customAvatarSize, ...customAvatarOffsetY, borderColor: accent, boxShadow: `0 0 ${s.glow_intensity ?? 30}px ${glowColor}` }} />
              <AvatarDecoration decoration={s.avatar_decoration} />
            </div>
            <div className="flex items-center justify-center flex-wrap gap-2 mt-3.5">
              <h1 className={`profile-title-3d text-2xl font-extrabold ${titleAlignClass}`} style={customTitleStyle}>{renderBioText(bio.display_name || bio.username)}</h1>
              {badgesPos === "next_to_name" && (
                <BadgesRow badges={bio.badges} accent={accent} bio={bio} layoutOverride="compact_inline" />
              )}
            </div>
            <div className="text-sm mt-0.5" style={{ color: accent }}>@{bio.username}</div>
            {viewsPos === "below_name" && <ViewsBadge bio={bio} position="below_name" />}
            <BadgesRow badges={bio.badges} accent={accent} align={adv.badges_alignment || "center"} bio={bio} />
            {locationText && <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.18em] text-[#E5E7EB]/75"><MapPin size={11} /> {locationText}</div>}
            {bio.description && <div className="text-sm mt-3.5 leading-relaxed" style={{ color: descColor, textAlign: adv.desc_alignment || undefined }}>{renderBioText(bio.description)}</div>}
            <SocialIconsRow links={socialLinks} accent={accent} align={adv.icons_alignment || "center"} onSocialClick={showPresenceModal ? handlePresenceClick : null} iconNoBg={iconNoBg} iconStyle={socialIconStyle} />

            {showDiscordWidget && <DiscordPresenceWidget discord={discord} accent={accent} bio={bio} showBadge={s.presence?.show_discord_badge} onClick={showPresenceModal ? () => setPresenceModal({ type: "discord", discord }) : undefined} />}
            {s.presence?.spotify && <NowPlaying username={bio.username} accent={accent} discordId={discord?.id} format={spotifyFormat} />}

            {/* Interactive Profile Widgets */}
            <ProfileWidgets bio={bio} accent={accent} />

            {cardLinks.length > 0 && (
              <RenderLinksContainer
                links={cardLinks}
                accent={accent}
                linkBg={linkBg}
                linkText={linkText}
                cardBorder={cardBorder}
                rightBtnStyle={linkBtnStyle}
                linkLayoutStyle={s.link_layout_style}
                linkAnimation={s.link_animation}
                iconNoBg={iconNoBg}
                linkColorOverlap={s.link_color_overlap}
                linkGlowOverlap={s.link_glow_overlap}
                showPresenceModal={showPresenceModal}
                onPresenceClick={handlePresenceClick}
              />
            )}
          </div>
        )}

        {/* LAYOUT 5: SPLIT STACK (Avatar & Info Left, Stacked Links Right) */}
        {(layout === "split_left" || layout === "wide") && (
          <div className="grid md:grid-cols-[1fr_1.3fr] gap-6 items-start">
            <div className="text-center md:text-left space-y-3">
              <div className="relative inline-block">
                <MediaDisplay src={pfp} alt={bio.display_name || bio.username} className="w-24 h-24 mx-auto md:mx-0 object-cover border-2 relative z-10" style={{ ...avatarShape, ...customAvatarSize, ...customAvatarOffsetY, borderColor: accent, boxShadow: `0 0 ${s.glow_intensity ?? 30}px ${glowColor}` }} />
                <AvatarDecoration decoration={s.avatar_decoration} />
              </div>
              <div>
                <h1 className={`profile-title-3d text-2xl font-extrabold ${titleAlignClass}`} style={customTitleStyle}>{renderBioText(bio.display_name || bio.username)}</h1>
                <div className="text-sm font-medium mt-0.5" style={{ color: accent }}>@{bio.username}</div>
              </div>
              {viewsPos === "below_name" && <ViewsBadge bio={bio} position="below_name" />}
              <BadgesRow badges={bio.badges} accent={accent} align={adv.badges_alignment || "left"} bio={bio} />
              {bio.description && <div className="text-xs leading-relaxed pt-1" style={{ color: descColor, textAlign: adv.desc_alignment || undefined }}>{renderBioText(bio.description)}</div>}
              <SocialIconsRow links={socialLinks} accent={accent} align={adv.icons_alignment || "left"} onSocialClick={showPresenceModal ? handlePresenceClick : null} iconNoBg={iconNoBg} iconStyle={socialIconStyle} />
              {showDiscordWidget && <DiscordPresenceWidget discord={discord} accent={accent} bio={bio} showBadge={s.presence?.show_discord_badge} onClick={showPresenceModal ? () => setPresenceModal({ type: "discord", discord }) : undefined} />}
              <ProfileWidgets bio={bio} accent={accent} />
            </div>
            <div className="space-y-2.5">
              {s.presence?.spotify && <NowPlaying username={bio.username} accent={accent} discordId={discord?.id} format={spotifyFormat} />}

              {cardLinks.map((l, i) => (
                <LinkCard
                  key={l.id}
                  l={l}
                  accent={accent}
                  index={i}
                  linkBg={linkBg}
                  linkText={linkText}
                  cardBorder={cardBorder}
                  rightBtnStyle={linkBtnStyle}
                  animation={s.link_animation}
                  iconNoBg={iconNoBg}
                  linkColorOverlap={s.link_color_overlap}
                  linkGlowOverlap={s.link_glow_overlap}
                  onPresenceClick={showPresenceModal ? handlePresenceClick : null}
                />
              ))}
            </div>
          </div>
        )}

        {/* LAYOUT 6: SPLIT REVERSE (Text & Socials Left, Round Avatar Right) */}
        {layout === "split_reverse" && (
          <div>
            <div className="flex items-center justify-between gap-4 text-left">
              <div className="flex-1 min-w-0">
                <h1 className={`profile-title-3d text-2xl font-extrabold truncate ${titleAlignClass}`} style={customTitleStyle}>{renderBioText(bio.display_name || bio.username)}</h1>
                <div className="text-xs font-medium" style={{ color: accent }}>@{bio.username}</div>
                {viewsPos === "below_name" && <ViewsBadge bio={bio} position="below_name" />}
                <BadgesRow badges={bio.badges} accent={accent} align={adv.badges_alignment || "left"} bio={bio} />
                {bio.description && <div className="text-xs mt-2.5 leading-relaxed" style={{ color: descColor, textAlign: adv.desc_alignment || undefined }}>{renderBioText(bio.description)}</div>}
                <SocialIconsRow links={socialLinks} accent={accent} align={adv.icons_alignment || "left"} onSocialClick={showPresenceModal ? handlePresenceClick : null} iconNoBg={iconNoBg} iconStyle={socialIconStyle} />
              </div>
              <div className="relative inline-block shrink-0">
                <MediaDisplay src={pfp} alt={bio.display_name || bio.username} className="w-22 h-22 object-cover border-2 relative z-10" style={{ ...avatarShape, ...customAvatarSize, ...customAvatarOffsetY, borderColor: accent, boxShadow: `0 0 ${s.glow_intensity ?? 30}px ${glowColor}` }} />
                <AvatarDecoration decoration={s.avatar_decoration} />
              </div>
            </div>

            {showDiscordWidget && <DiscordPresenceWidget discord={discord} accent={accent} bio={bio} showBadge={s.presence?.show_discord_badge} onClick={showPresenceModal ? () => setPresenceModal({ type: "discord", discord }) : undefined} />}
            {s.presence?.spotify && <NowPlaying username={bio.username} accent={accent} discordId={discord?.id} format={spotifyFormat} />}

            {/* Interactive Profile Widgets */}
            <ProfileWidgets bio={bio} accent={accent} />

            {cardLinks.length > 0 && (
              <RenderLinksContainer
                links={cardLinks}
                accent={accent}
                linkBg={linkBg}
                linkText={linkText}
                cardBorder={cardBorder}
                rightBtnStyle={linkBtnStyle}
                linkLayoutStyle={s.link_layout_style}
                linkAnimation={s.link_animation}
                iconNoBg={iconNoBg}
                linkColorOverlap={s.link_color_overlap}
                linkGlowOverlap={s.link_glow_overlap}
                showPresenceModal={showPresenceModal}
                onPresenceClick={handlePresenceClick}
              />
            )}
          </div>
        )}

        {/* LAYOUT 7: SIDEBAR DOCK */}
        {layout === "sidebar_dock" && (
          <div className="grid md:grid-cols-[1fr_1.35fr] gap-6 text-left items-start">
            {/* Left Profile Sidebar Dock */}
            <div className={`p-5 sm:p-6 rounded-3xl space-y-3.5 md:sticky md:top-6 ${isCardInvisible ? "bg-transparent border-0 shadow-none" : "bg-white/[0.03] border border-white/10 shadow-xl"}`}>
              <div className="relative inline-block">
                <MediaDisplay src={pfp} alt={bio.display_name || bio.username} className="w-20 h-20 object-cover border-2 shadow-lg relative z-10" style={{ ...avatarShape, ...customAvatarSize, ...customAvatarOffsetY, borderColor: accent, boxShadow: `0 0 ${s.glow_intensity ?? 30}px ${glowColor}` }} />
                <AvatarDecoration decoration={s.avatar_decoration} />
              </div>
              <div>
                <h1 className={`profile-title-3d text-2xl font-bold truncate ${titleAlignClass}`} style={customTitleStyle}>
                  {renderBioText(bio.display_name || bio.username)}
                </h1>
                <div className="text-xs font-semibold" style={{ color: accent }}>@{bio.username}</div>
                {viewsPos === "below_name" && <ViewsBadge bio={bio} position="below_name" />}
                <BadgesRow badges={bio.badges} accent={accent} align={adv.badges_alignment || "left"} bio={bio} />
              </div>

              {bio.description && (
                <div className="text-xs leading-relaxed pt-1" style={{ color: descColor, textAlign: adv.desc_alignment || undefined }}>
                  {renderBioText(bio.description)}
                </div>
              )}

              <div className="pt-1 border-t border-white/10">
                <SocialIconsRow links={socialLinks} accent={accent} align={adv.icons_alignment || "left"} onSocialClick={showPresenceModal ? handlePresenceClick : null} iconNoBg={iconNoBg} iconStyle={socialIconStyle} />
              </div>

              {showDiscordWidget && (
                <DiscordPresenceWidget discord={discord} accent={accent} bio={bio} showBadge={s.presence?.show_discord_badge} onClick={showPresenceModal ? () => setPresenceModal({ type: "discord", discord }) : undefined} />
              )}
              <ProfileWidgets bio={bio} accent={accent} />
            </div>

            {/* Right Links & Media Stream */}
            <div className="space-y-3">
              {s.presence?.spotify && <NowPlaying username={bio.username} accent={accent} discordId={discord?.id} format={spotifyFormat} />}

              {cardLinks.length > 0 && (
                <RenderLinksContainer
                  links={cardLinks}
                  accent={accent}
                  linkBg={linkBg}
                  linkText={linkText}
                  cardBorder={cardBorder}
                  rightBtnStyle={linkBtnStyle}
                  linkLayoutStyle={s.link_layout_style}
                  linkAnimation={s.link_animation}
                  iconNoBg={iconNoBg}
                  linkColorOverlap={s.link_color_overlap}
                  linkGlowOverlap={s.link_glow_overlap}
                  showPresenceModal={showPresenceModal}
                  onPresenceClick={handlePresenceClick}
                />
              )}
            </div>
          </div>
        )}

        {/* LAYOUT 8: FLOATING GLASS ISLANDS */}
        {layout === "floating_glass" && (
          <div className="space-y-4 text-center">
            {/* Header Island */}
            <div className={`p-4 rounded-3xl flex flex-col items-center ${isCardInvisible ? "bg-transparent border-0 shadow-none" : "swat-glass border border-white/15 shadow-xl"}`}>
              <div className="relative inline-block">
                <MediaDisplay src={pfp} alt={bio.display_name || bio.username} className="w-22 h-22 object-cover border-2 shadow-2xl relative z-10" style={{ ...avatarShape, ...customAvatarSize, ...customAvatarOffsetY, borderColor: accent, boxShadow: `0 0 ${s.glow_intensity ?? 30}px ${glowColor}` }} />
                <AvatarDecoration decoration={s.avatar_decoration} />
              </div>
              <h1 className={`profile-title-3d text-2xl font-extrabold mt-3 ${titleAlignClass}`} style={customTitleStyle}>
                {renderBioText(bio.display_name || bio.username)}
              </h1>
              <div className="text-xs font-semibold" style={{ color: accent }}>@{bio.username}</div>
              {viewsPos === "below_name" && <ViewsBadge bio={bio} position="below_name" />}
              <BadgesRow badges={bio.badges} accent={accent} align={adv.badges_alignment || "center"} bio={bio} />
            </div>

            {bio.description && (
              <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${isCardInvisible ? "bg-transparent border-0 shadow-none" : "swat-glass border border-white/10 shadow-lg"}`} style={{ color: descColor, textAlign: adv.desc_alignment || undefined }}>
                {renderBioText(bio.description)}
              </div>
            )}

            <div className={`p-2 rounded-2xl ${isCardInvisible ? "bg-transparent border-0 shadow-none" : "swat-glass border border-white/10"}`}>
              <SocialIconsRow links={socialLinks} accent={accent} align={adv.icons_alignment || "center"} onSocialClick={showPresenceModal ? handlePresenceClick : null} iconNoBg={iconNoBg} iconStyle={socialIconStyle} />
            </div>

            {s.presence?.discord && discord && <DiscordPresenceWidget discord={discord} accent={accent} showBadge={s.presence?.show_discord_badge} onClick={showPresenceModal ? () => setPresenceModal({ type: "discord", discord }) : undefined} />}
            {s.presence?.spotify && <NowPlaying username={bio.username} accent={accent} discordId={discord?.id} format={spotifyFormat} />}

            {cardLinks.length > 0 && (
              <RenderLinksContainer
                links={cardLinks}
                accent={accent}
                linkBg={linkBg || (isCardInvisible ? "transparent" : "rgba(255,255,255,0.04)")}
                linkText={linkText}
                cardBorder={cardBorder || (isCardInvisible ? "none" : "rgba(255,255,255,0.15)")}
                rightBtnStyle={linkBtnStyle}
                linkLayoutStyle={s.link_layout_style}
                linkAnimation={s.link_animation || "glass_lift"}
                iconNoBg={iconNoBg}
                showPresenceModal={showPresenceModal}
                onPresenceClick={handlePresenceClick}
              />
            )}
          </div>
        )}

        {/* LAYOUT 9: BENTO SHOWCASE */}
        {layout === "bento_grid" && (
          <div className="space-y-3 text-left">
            {/* Main Hero Bento Tile */}
            <div className={`p-5 rounded-3xl flex items-center gap-4 ${isCardInvisible ? "bg-transparent border-0 shadow-none" : "swat-glass border border-white/15 shadow-xl"}`}>
              <div className="relative inline-block shrink-0">
                <MediaDisplay src={pfp} alt={bio.display_name || bio.username} className="w-20 h-20 object-cover border-2 shadow-lg relative z-10" style={{ ...avatarShape, ...customAvatarSize, ...customAvatarOffsetY, borderColor: accent, boxShadow: `0 0 ${s.glow_intensity ?? 30}px ${glowColor}` }} />
                <AvatarDecoration decoration={s.avatar_decoration} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className={`profile-title-3d text-2xl font-extrabold truncate ${titleAlignClass}`} style={customTitleStyle}>
                  {renderBioText(bio.display_name || bio.username)}
                </h1>
                <div className="text-xs font-semibold" style={{ color: accent }}>@{bio.username}</div>
                {viewsPos === "below_name" && <ViewsBadge bio={bio} position="below_name" />}
                <BadgesRow badges={bio.badges} accent={accent} align={adv.badges_alignment || "left"} bio={bio} />
              </div>
            </div>

            {bio.description && (
              <div className={`p-4 rounded-2xl text-xs leading-relaxed ${isCardInvisible ? "bg-transparent border-0 shadow-none" : "swat-glass border border-white/10"}`} style={{ color: descColor, textAlign: adv.desc_alignment || undefined }}>
                {renderBioText(bio.description)}
              </div>
            )}

            <SocialIconsRow links={socialLinks} accent={accent} align={adv.icons_alignment || "center"} onSocialClick={showPresenceModal ? handlePresenceClick : null} iconNoBg={iconNoBg} iconStyle={socialIconStyle} />

            {s.presence?.discord && discord && <DiscordPresenceWidget discord={discord} accent={accent} showBadge={s.presence?.show_discord_badge} onClick={showPresenceModal ? () => setPresenceModal({ type: "discord", discord }) : undefined} />}
            {s.presence?.spotify && <NowPlaying username={bio.username} accent={accent} discordId={discord?.id} format={spotifyFormat} />}

            {cardLinks.length > 0 && (
              <RenderLinksContainer
                links={cardLinks}
                accent={accent}
                linkBg={linkBg}
                linkText={linkText}
                cardBorder={cardBorder}
                rightBtnStyle={linkBtnStyle}
                linkLayoutStyle={s.link_layout_style || "bento"}
                linkAnimation={s.link_animation}
                iconNoBg={iconNoBg}
                showPresenceModal={showPresenceModal}
                onPresenceClick={handlePresenceClick}
              />
            )}
          </div>
        )}

        {/* LAYOUT 10: MINIMALIST COMPACT */}
        {layout === "compact" && (
          <div className={`text-center space-y-3 ${contentAlignClass}`}>
            <div className={`relative inline-block ${avatarAlignClass}`}>
              <MediaDisplay src={pfp} alt={bio.display_name || bio.username} className="w-18 h-18 mx-auto object-cover border-2 shadow-lg relative z-10" style={{ ...avatarShape, ...customAvatarSize, ...customAvatarOffsetY, borderColor: accent, boxShadow: `0 0 ${s.glow_intensity ?? 25}px ${glowColor}` }} />
              <AvatarDecoration decoration={s.avatar_decoration} />
            </div>
            <div>
              <h1 className={`profile-title-3d text-xl font-bold ${titleAlignClass}`} style={customTitleStyle}>{renderBioText(bio.display_name || bio.username)}</h1>
              <div className="text-xs" style={{ color: accent }}>@{bio.username}</div>
            </div>
            {viewsPos === "below_name" && <ViewsBadge bio={bio} position="below_name" />}
            <BadgesRow badges={bio.badges} accent={accent} align={adv.badges_alignment || "center"} bio={bio} />
            {bio.description && <div className="text-xs max-w-xs mx-auto leading-relaxed" style={{ color: descColor, textAlign: adv.desc_alignment || undefined }}>{renderBioText(bio.description)}</div>}
            <SocialIconsRow links={socialLinks} accent={accent} align={adv.icons_alignment || "center"} onSocialClick={showPresenceModal ? handlePresenceClick : null} iconNoBg={iconNoBg} iconStyle={socialIconStyle} />

            {cardLinks.length > 0 && (
              <RenderLinksContainer
                links={cardLinks}
                accent={accent}
                linkBg={linkBg}
                linkText={linkText}
                cardBorder={cardBorder}
                rightBtnStyle={linkBtnStyle}
                linkLayoutStyle={s.link_layout_style || "pill"}
                linkAnimation={s.link_animation}
                iconNoBg={iconNoBg}
                showPresenceModal={showPresenceModal}
                onPresenceClick={handlePresenceClick}
              />
            )}
          </div>
        )}

        {layout === "profile_header" && (
          <div className="text-center">
            <div
              className={`profile-header-banner relative -mx-6 -mt-6 mb-0 h-32 overflow-hidden bg-cover bg-center sm:-mx-8 sm:-mt-8 sm:h-40 ${!headerBannerHidden && headerBannerEffect !== "none" ? `profile-banner-fx-${headerBannerEffect}` : ""}`}
              style={headerBannerStyle}
            >
              {!headerBannerHidden && headerBannerIsVideo && <video src={headerBannerUrl} autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover" />}
              {!headerBannerHidden && <>
                <div className="absolute inset-0 mix-blend-color opacity-30" style={{ backgroundColor: headerBannerColor }} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#08090b] via-black/20 to-transparent" />
              </>}
            </div>
            <div className="relative -mt-12 mb-3 inline-block">
              <MediaDisplay src={pfp} alt={bio.display_name || bio.username} className="relative z-10 h-24 w-24 rounded-full border-4 border-[#111419] object-cover shadow-xl" style={{ ...avatarShape, ...customAvatarSize, ...customAvatarOffsetY, borderColor: accent, boxShadow: `0 0 ${s.glow_intensity ?? 30}px ${glowColor}` }} />
              <AvatarDecoration decoration={s.avatar_decoration} />
            </div>
            <h1 className={`profile-title-3d text-2xl font-bold ${titleAlignClass}`} style={customTitleStyle}>{renderBioText(bio.display_name || bio.username)}</h1>
            <div className="mt-0.5 text-xs font-medium" style={{ color: accent }}>@{bio.username}</div>
            {viewsPos === "below_name" && <ViewsBadge bio={bio} position="below_name" />}
            <BadgesRow badges={bio.badges} accent={accent} align={adv.badges_alignment || "center"} bio={bio} />
            {bio.description && <div className="mx-auto mt-3 max-w-md text-sm leading-relaxed" style={{ color: descColor, textAlign: adv.desc_alignment || undefined }}>{renderBioText(bio.description)}</div>}
            <SocialIconsRow links={socialLinks} accent={accent} align={adv.icons_alignment || "center"} onSocialClick={showPresenceModal ? handlePresenceClick : null} iconNoBg={iconNoBg} iconStyle={socialIconStyle} />
            {s.presence?.discord && discord && <DiscordPresenceWidget discord={discord} accent={accent} showBadge={s.presence?.show_discord_badge} onClick={showPresenceModal ? () => setPresenceModal({ type: "discord", discord }) : undefined} />}
            {s.presence?.spotify && <NowPlaying username={bio.username} accent={accent} discordId={discord?.id} format={spotifyFormat} />}
            {cardLinks.length > 0 && (
              <RenderLinksContainer
                links={cardLinks}
                accent={accent}
                linkBg={linkBg}
                linkText={linkText}
                cardBorder={cardBorder}
                rightBtnStyle={linkBtnStyle}
                linkLayoutStyle={s.link_layout_style || "grid_2col"}
                linkAnimation={s.link_animation}
                iconNoBg={iconNoBg}
                showPresenceModal={showPresenceModal}
                onPresenceClick={handlePresenceClick}
              />
            )}
          </div>
        )}

        {layout === "showcase_grid" && (
          <div className="grid gap-5 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="min-w-0 space-y-3 text-left">
              <div className="relative inline-block">
                <MediaDisplay src={pfp} alt={bio.display_name || bio.username} className="relative z-10 h-20 w-20 object-cover" style={{ ...avatarShape, ...customAvatarSize, ...customAvatarOffsetY, border: showCardBorder ? `2px solid ${cardBorder || accent}` : "none", boxShadow: `0 0 ${s.glow_intensity ?? 24}px ${glowColor}` }} />
                <AvatarDecoration decoration={s.avatar_decoration} />
              </div>
              <div>
                <h1 className={`profile-title-3d text-2xl font-bold ${titleAlignClass}`} style={customTitleStyle}>{renderBioText(bio.display_name || bio.username)}</h1>
                <div className="mt-0.5 text-xs" style={{ color: accent }}>@{bio.username}</div>
                {viewsPos === "below_name" && <ViewsBadge bio={bio} position="below_name" />}
                <BadgesRow badges={bio.badges} accent={accent} align={adv.badges_alignment || "left"} bio={bio} />
              </div>
              {bio.description && <p className="text-sm leading-relaxed" style={{ color: descColor, textAlign: adv.desc_alignment || undefined }}>{renderBioText(bio.description)}</p>}
              <SocialIconsRow links={socialLinks} accent={accent} align={adv.icons_alignment || "left"} onSocialClick={showPresenceModal ? handlePresenceClick : null} iconNoBg={iconNoBg} iconStyle={socialIconStyle} />
              {s.presence?.discord && discord && <DiscordPresenceWidget discord={discord} accent={accent} showBadge={s.presence?.show_discord_badge} onClick={showPresenceModal ? () => setPresenceModal({ type: "discord", discord }) : undefined} />}
              {s.presence?.spotify && <NowPlaying username={bio.username} accent={accent} discordId={discord?.id} format={spotifyFormat} />}
            </div>
            <div className="grid min-w-0 grid-cols-2 content-start gap-2.5">
              {cardLinks.map((link, index) => (
                <LinkTile key={link.id} l={link} accent={accent} index={index} linkBg={linkBg} linkText={linkText} cardBorder={cardBorder} animation={s.link_animation} iconNoBg={iconNoBg} onPresenceClick={showPresenceModal ? handlePresenceClick : null} />
              ))}
            </div>
          </div>
        )}

        {/* Incard Bottom Audio Player if selected */}
        {hasAudio && a.display !== false && (a.card_style === "incard-bottom" || a.card_style === "incard" || a.style === "incard-bottom" || a.style === "incard") && (
          <TacticalAudioPlayer bio={bio} accent={accent} widthClass="w-full mt-4" />
        )}

        {shopProducts.length > 0 && (
          <div className="mt-6 w-full">
            <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[#E5E7EB]/55">
              <span>Shop</span>
              <span>{shopProducts.length}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {shopProducts.map((product, index) => (
                <a
                  key={product.id || `${product.name}-${index}`}
                  href={product.url || "#"}
                  target={product.url ? "_blank" : undefined}
                  rel="noreferrer"
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-black/20 text-left transition-all hover:-translate-y-1 hover:border-[#5B8DB8]/40"
                >
                  {product.image ? (
                    <img src={fileUrl(product.image)} alt={product.name || "Product"} loading="lazy" decoding="async" className="h-28 w-full object-cover" />
                  ) : (
                    <div className="flex h-28 w-full items-center justify-center bg-[#101317] text-[#E5E7EB]/40">
                      <Icons.ShoppingBag size={18} />
                    </div>
                  )}
                  <div className="space-y-2 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="truncate text-sm font-semibold text-white">{product.name || "Product"}</div>
                      {product.price && <span className="text-xs font-semibold text-[#5B8DB8]">{product.price}</span>}
                    </div>
                    {product.description && <div className="text-[11px] leading-relaxed text-[#E5E7EB]/60">{product.description}</div>}
                    <div className="text-[10px] uppercase tracking-[0.15em] text-[#E5E7EB]/45">Open product</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Footer View Count */}
        <ViewsBadge bio={bio} position="footer" />
      </div>

      {/* Outside Bottom Media Player (when not top or incard) */}
      {layout !== "slideshow" &&
        hasAudio &&
        a.display !== false &&
        a.card_style !== "top" &&
        a.style !== "top" &&
        a.card_style !== "incard-top" &&
        a.style !== "incard-top" &&
        a.card_style !== "incard-bottom" &&
        a.style !== "incard-bottom" &&
        a.card_style !== "incard" &&
        a.style !== "incard" && (
          <TacticalAudioPlayer bio={bio} accent={accent} widthClass="w-full" />
        )}
        </div>
      )}

    {/* Floating Interactive Live Presence Modal Box */}
    {presenceModal && (
        <PresenceModal
          data={presenceModal}
          bio={bio}
          accent={accent}
          onClose={() => setPresenceModal(null)}
        />
      )}
    </div>
  );
}


function NowPlaying({ username, accent, discordId, format = "card" }) {
  const [np, setNp] = useState(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const lyricsRef = useRef(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const { data } = await api.get(`/u/${encodeURIComponent(username)}/nowplaying`);
        if (!alive) return;
        if (data && data.playing) {
          setNp(data);
          return;
        }
      } catch (err) {}

      // Fallback to Lanyard if user has Discord listening to Spotify
      if (discordId) {
        try {
          const res = await fetch(`https://api.lanyard.rest/v1/users/${discordId}`);
          const lanyardRes = await res.json();
          if (!alive) return;
          if (lanyardRes?.success && lanyardRes.data?.listening_to_spotify && lanyardRes.data?.spotify) {
            const sp = lanyardRes.data.spotify;
            const now = Date.now();
            const start = sp.timestamps?.start || now;
            const end = sp.timestamps?.end || (start + 180000);
            const duration_ms = Math.max(1, end - start);
            const progress_ms = Math.min(duration_ms, Math.max(0, now - start));
            setNp({
              playing: true,
              track: sp.song,
              artist: sp.artist,
              album: sp.album,
              album_art: sp.album_art_url,
              url: `https://open.spotify.com/track/${sp.track_id}`,
              progress_ms,
              duration_ms,
            });
            return;
          }
        } catch (err) {}
      }

      if (alive) {
        setNp({ playing: false, state: "not_playing" });
      }
    };

    load();
    const id = setInterval(load, 8000);
    return () => { alive = false; clearInterval(id); };
  }, [username, discordId]);

  const isPlaying = !!np?.playing;
  const pct = isPlaying && np.duration_ms ? Math.min(100, (np.progress_ms / np.duration_ms) * 100) : 0;
  const currentSec = (np?.progress_ms || 0) / 1000;
  const totalSec = (np?.duration_ms || 0) / 1000;

  useEffect(() => {
    const el = lyricsRef.current;
    if (el && showLyrics) el.scrollTop = (pct / 100) * (el.scrollHeight - el.clientHeight);
  }, [pct, showLyrics]);

  if (!np) return <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/45">Loading Spotify presence...</div>;
  const idleMessages = {
    not_configured: "Spotify is not configured yet.",
    not_connected: "Connect Spotify to show listening activity.",
    reconnect_required: "Spotify needs to be reconnected.",
    unavailable: "Spotify presence is temporarily unavailable.",
    not_playing: "Nothing is playing right now.",
    disabled: "Spotify presence is turned off.",
  };

  /* 1. MINIMAL PILL FORMAT */
  if (format === "pill") {
    return (
      <div className="mt-3 flex justify-center">
        <a
          href={isPlaying ? np.url : undefined}
          target={isPlaying ? "_blank" : undefined}
          rel="noreferrer"
          data-testid="spotify-now-playing"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border backdrop-blur-xl text-xs font-semibold transition-all hover:scale-105"
          style={{
            background: "rgba(10,12,16,0.9)",
            borderColor: "rgba(29,185,84,0.4)",
            boxShadow: "0 0 15px rgba(29,185,84,0.2)",
          }}
        >
          <SiSpotify size={14} className="text-[#1DB954] shrink-0 animate-pulse" />
          {isPlaying ? (
            <span className="truncate max-w-[220px] text-white">
              <span className="font-bold">{np.track}</span> <span className="text-[#E5E7EB]/60 font-normal">by {np.artist}</span>
            </span>
          ) : (
            <span className="text-white/60 text-[11px]">Spotify Inactive</span>
          )}
        </a>
      </div>
    );
  }

  /* 2. STATUS TICKER FORMAT */
  if (format === "ticker") {
    return (
      <div className="mt-3 overflow-hidden rounded-xl border border-[#1DB954]/30 bg-black/70 p-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-md bg-[#1DB954]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#1DB954] uppercase tracking-wider shrink-0">
            <SiSpotify size={10} /> NOW
          </span>
          <div className="flex-1 overflow-hidden whitespace-nowrap">
            {isPlaying ? (
              <a href={np.url} target="_blank" rel="noreferrer" className="inline-block text-xs font-bold text-white hover:text-[#1DB954] transition-colors">
                {np.track} — {np.artist} {np.album ? `• ${np.album}` : ""}
              </a>
            ) : (
              <span className="text-xs text-white/50">{idleMessages[np.state] || "No track currently playing on Spotify"}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* 3. COMPACT ROW PLAYER FORMAT */
  if (format === "compact") {
    return (
      <div className="mt-3 text-left">
        <div
          data-testid="spotify-now-playing"
          className="flex items-center gap-2.5 p-2 rounded-xl border backdrop-blur-xl transition-all duration-200 hover:border-[#1DB954]/60"
          style={{
            background: "rgba(10,12,16,0.88)",
            borderColor: "rgba(29,185,84,0.3)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4), 0 0 12px rgba(29,185,84,0.1)",
          }}
        >
          <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-[#1DB954]/40">
            {np.album_art ? (
              <img src={np.album_art} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#1DB954]/20 flex items-center justify-center text-[#1DB954]">
                <SiSpotify size={16} />
              </div>
            )}
            {isPlaying && <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-[#1DB954] ring-1 ring-black animate-pulse" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9px] font-bold text-[#1DB954] flex items-center gap-1 uppercase tracking-wider">
                <SiSpotify size={9} />
                <span>{isPlaying ? "Playing" : "Spotify"}</span>
              </span>
              {isPlaying && (
                <span className="text-[9px] font-mono text-[#E5E7EB]/50">
                  {formatAudioTime(currentSec)} / {formatAudioTime(totalSec)}
                </span>
              )}
            </div>
            {isPlaying ? (
              <a href={np.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-white hover:text-[#1DB954] transition-colors truncate block">
                {np.track} <span className="text-[10px] text-[#E5E7EB]/60 font-normal">• {np.artist}</span>
              </a>
            ) : (
              <div className="text-[11px] text-[#E5E7EB]/65">{idleMessages[np.state] || "Nothing playing"}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* 4. RICH FULL CARD FORMAT (Default) */
  return (
    <div className="mt-4 text-left">
      <div
        data-testid="spotify-now-playing"
        className="group relative flex flex-col p-3.5 rounded-2xl border backdrop-blur-xl transition-all duration-300 hover:shadow-xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(29,185,84,0.12) 0%, rgba(10,12,16,0.85) 100%)",
          borderColor: "rgba(29,185,84,0.35)",
          boxShadow: "0 8px 30px rgba(0,0,0,0.5), 0 0 20px rgba(29,185,84,0.12)",
        }}
      >
        {/* Subtle top glow line */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#1DB954]/50 to-transparent" />

        <div className="flex items-center gap-3">
          {/* Album Art with pulse & vinyl style glow */}
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-[#1DB954]/40 shadow-lg group-hover:scale-105 transition-transform duration-200">
            {np.album_art ? (
              <img src={np.album_art} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#1DB954]/20 flex items-center justify-center text-[#1DB954]">
                <SiSpotify size={24} />
              </div>
            )}
            {isPlaying && <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-[#1DB954] ring-2 ring-black animate-pulse shadow-[0_0_8px_rgba(29,185,84,0.9)]" />}
          </div>

          {/* Track and Artist info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="text-[10px] font-bold text-[#1DB954] flex items-center gap-1.5 uppercase tracking-wider">
                <SiSpotify size={11} className="shrink-0" />
                <span>{isPlaying ? "Now Playing on Spotify" : "Spotify"}</span>
              </span>

              {/* Animated EQ Spectrum bars */}
              {isPlaying && <div className="flex items-end gap-0.5 h-3 px-1 shrink-0">
                <span className="w-0.5 rounded-full animate-eq-1 bg-[#1DB954]" />
                <span className="w-0.5 rounded-full animate-eq-2 bg-[#1DB954]" />
                <span className="w-0.5 rounded-full animate-eq-3 bg-[#1DB954]" />
                <span className="w-0.5 rounded-full animate-eq-4 bg-[#1DB954]" />
                <span className="w-0.5 rounded-full animate-eq-5 bg-[#1DB954]" />
              </div>}
            </div>

            {isPlaying ? <>
              <a
                href={np.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs sm:text-sm font-bold text-white hover:text-[#1DB954] transition-colors truncate block"
                title={np.track}
              >
                {np.track}
              </a>
              <div className="text-[11px] text-[#E5E7EB]/60 truncate">{np.artist}</div>
            </> : <div className="text-xs text-[#E5E7EB]/65">{idleMessages[np.state] || "Nothing is playing right now."}</div>}
          </div>
        </div>

        {/* Live Timeline Bar */}
        {isPlaying && <div className="mt-3 flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#E5E7EB]/50 w-7 select-none">
            {formatAudioTime(currentSec)}
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden relative">
            <div
              className="h-full bg-[#1DB954] rounded-full transition-all duration-300"
              style={{ width: `${pct}%`, boxShadow: "0 0 8px rgba(29,185,84,0.8)" }}
            />
          </div>
          <span className="text-[10px] font-mono text-[#E5E7EB]/50 w-7 text-right select-none">
            {formatAudioTime(totalSec)}
          </span>
        </div>}

        {/* Lyrics toggle button if available */}
        {np.lyrics && (
          <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between">
            <button
              onClick={() => setShowLyrics((s) => !s)}
              className="text-[10px] font-medium text-[#1DB954] hover:text-[#1ed760] transition-colors flex items-center gap-1"
            >
              <FileText size={11} />
              <span>{showLyrics ? "Hide Lyrics" : "View Live Lyrics"}</span>
            </button>
            <a
              href={np.url}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-[#E5E7EB]/40 hover:text-white transition-colors flex items-center gap-1"
            >
              <ExternalLink size={10} />
              <span>Spotify App</span>
            </a>
          </div>
        )}

        {/* Expandable Synced Lyrics Box */}
        {showLyrics && np.lyrics && (
          <div
            ref={lyricsRef}
            data-testid="spotify-lyrics"
            className="mt-2.5 max-h-36 overflow-y-auto rounded-xl p-3 text-left text-xs leading-relaxed whitespace-pre-line scroll-smooth bg-black/40 border border-[#1DB954]/20 text-[#E5E7EB]/80 animate-in fade-in zoom-in-95 duration-150"
          >
            {np.lyrics}
          </div>
        )}
      </div>
    </div>
  );
}

function RenderLinksContainer({ links, accent, linkBg, linkText, cardBorder, rightBtnStyle, linkLayoutStyle = "list", linkAnimation = "none", showPresenceModal, onPresenceClick, iconNoBg = false, linkColorOverlap = null, linkGlowOverlap = null }) {
  if (!links || links.length === 0) return null;

  if (linkLayoutStyle === "grid_2col") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-5">
        {links.map((l, i) => (
          <LinkCard
            key={l.id}
            l={l}
            accent={accent}
            index={i}
            linkBg={linkBg}
            linkText={linkText}
            cardBorder={cardBorder}
            rightBtnStyle={rightBtnStyle}
            animation={linkAnimation}
            iconNoBg={iconNoBg}
            linkColorOverlap={linkColorOverlap}
            linkGlowOverlap={linkGlowOverlap}
            onPresenceClick={showPresenceModal ? onPresenceClick : null}
          />
        ))}
      </div>
    );
  }

  if (linkLayoutStyle === "bento") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-5">
        {links.map((l, i) => (
          <div key={l.id} className={i % 3 === 0 ? "sm:col-span-2" : "sm:col-span-1"}>
            <LinkCard
              l={l}
              accent={accent}
              index={i}
              linkBg={linkBg}
              linkText={linkText}
              cardBorder={cardBorder}
              rightBtnStyle={rightBtnStyle}
              animation={linkAnimation}
              iconNoBg={iconNoBg}
              linkColorOverlap={linkColorOverlap}
              linkGlowOverlap={linkGlowOverlap}
              onPresenceClick={showPresenceModal ? onPresenceClick : null}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-2.5">
      {links.map((l, i) => (
        <LinkCard
          key={l.id}
          l={l}
          accent={accent}
          index={i}
          linkBg={linkBg}
          linkText={linkText}
          cardBorder={cardBorder}
          rightBtnStyle={rightBtnStyle}
          animation={linkAnimation}
          pill={linkLayoutStyle === "pill"}
          iconNoBg={iconNoBg}
          linkColorOverlap={linkColorOverlap}
          linkGlowOverlap={linkGlowOverlap}
          onPresenceClick={showPresenceModal ? onPresenceClick : null}
        />
      ))}
    </div>
  );
}

function LinkTile({ l, accent, index = 0, linkBg = null, linkText = null, cardBorder = null, animation = "none", onPresenceClick, iconNoBg = false, linkColorOverlap = null, linkGlowOverlap = null }) {
  const c = l.config || {};
  const noBg = iconNoBg || l.config?.no_bg || l.config?.no_icon_bg;
  const Ic = brandIcon(l.platform);
  const customIconColor = l.config?.custom_icon_color;
  const brandColor = linkColorOverlap || customIconColor || BRAND_COLORS[l.platform] || accent;
  const glow = linkGlowOverlap || l.config?.custom_icon_glow || (c.glow ? (c.glow_color || brandColor) : null);
  const glowSize = l.config?.glow_size ?? 12;
  const name = c.username && c.username_text ? c.username_text : l.label;
  const details = [];
  DETAIL_KEYS.forEach((k) => { if (c[k] && c[`${k}_value`]) details.push(c[`${k}_value`]); });

  const animClass = animation && animation !== "none" ? `anim-${animation}` : "";

  const handleClick = (e) => {
    if (onPresenceClick) {
      e.preventDefault();
      onPresenceClick(l);
    }
  };

  return (
    <a
      href={l.url}
      onClick={handleClick}
      target={onPresenceClick ? undefined : "_blank"}
      rel="noreferrer"
      data-testid={`bio-tile-${l.id}`}
      className={`link-in relative group flex flex-col justify-between p-3.5 sm:p-4 rounded-xl border backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl overflow-hidden cursor-pointer ${animClass}`}
      style={{
        borderColor: cardBorder ? `${cardBorder}55` : `${accent}33`,
        background: linkBg || "linear-gradient(145deg, rgba(14,17,23,0.7), rgba(8,10,14,0.85))",
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* Top subtle sheen on hover */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-center justify-between gap-2">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden transition-transform duration-200 group-hover:scale-110 shrink-0" 
          style={{
            background: noBg ? "transparent" : c.icon_color_overlay ? `linear-gradient(135deg, ${brandColor}44 0%, ${brandColor}18 100%)` : "rgba(6,8,12,0.8)",
            border: noBg ? "none" : c.icon_color_overlay ? `1.5px solid ${brandColor}88` : `1px solid ${brandColor}40`,
            boxShadow: noBg ? "none" : c.icon_color_overlay ? `0 0 14px ${brandColor}44, inset 0 0 8px ${brandColor}22` : `0 2px 8px rgba(0,0,0,0.4)`
          }}
        >
          {c.avatar && c.avatar_url ? (
            <MediaDisplay src={c.avatar_url} alt="" className="w-full h-full object-cover" style={{ boxShadow: glow ? `0 0 ${glowSize}px ${glow}` : undefined }} />
          ) : c.custom_icon && c.custom_icon_url ? (
            <img src={c.custom_icon_url} alt="" className="w-5 h-5 object-contain" style={{ filter: glow ? `drop-shadow(0 0 ${glowSize}px ${glow})` : undefined }} />
          ) : (
            <span style={{ color: brandColor, filter: glow ? `drop-shadow(0 0 ${glowSize}px ${glow})` : (noBg || c.icon_color_overlay ? `drop-shadow(0 0 6px ${brandColor}88)` : undefined) }}>
              <Ic size={noBg ? 24 : 19} />
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {c.verified && <BadgeCheck size={14} className="text-[#5B8DB8]" />}
          <span className="w-2 h-2 rounded-full ring-2 ring-[#08090B] animate-pulse" style={{ background: brandColor }} />
        </div>
      </div>

      <div className="mt-3 text-left">
        <div className="text-xs font-bold tracking-tight truncate group-hover:text-white transition-colors" style={{ color: linkText || "#E5E7EB" }}>{name}</div>
        {details.length > 0 ? (
          <div className="text-[10px] font-mono text-[#E5E7EB]/50 truncate mt-0.5">{details[0]}</div>
        ) : (
          <div className="text-[10px] font-mono tracking-wider text-[#E5E7EB]/40 truncate mt-0.5 uppercase">{l.platform}</div>
        )}
      </div>
    </a>
  );
}

function LinkCard({ l, accent, index = 0, linkBg = null, linkText = null, cardBorder = null, rightBtnStyle = "arrow", animation = "none", pill = false, onPresenceClick, iconNoBg = false, linkColorOverlap = null, linkGlowOverlap = null }) {
  const [copied, setCopied] = useState(false);
  const c = l.config || {};
  const noBg = iconNoBg || l.config?.no_bg || l.config?.no_icon_bg;
  const Ic = brandIcon(l.platform);
  const customIconColor = l.config?.custom_icon_color;
  const brandColor = linkColorOverlap || customIconColor || BRAND_COLORS[l.platform] || accent;
  const glow = linkGlowOverlap || l.config?.custom_icon_glow || (c.glow ? (c.glow_color || brandColor) : null);
  const glowSize = l.config?.glow_size ?? 12;
  const details = [];
  DETAIL_KEYS.forEach((k) => { if (c[k] && c[`${k}_value`]) details.push(c[`${k}_value`]); });
  (c.custom_fields || []).forEach((f) => { if (f.label || f.value) details.push(`${f.label ? f.label + ": " : ""}${f.value}`); });
  const name = c.username && c.username_text ? c.username_text : l.label;
  const nameColor = linkText || (c.username && c.username_color ? c.username_color : "#E5E7EB");

  const animClass = animation && animation !== "none" ? `anim-${animation}` : "";

  const handleCardClick = (e) => {
    if (onPresenceClick && c.popup_enabled !== false) {
      e.preventDefault();
      onPresenceClick(l);
    }
  };

  const handleCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(l.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <a
      href={l.url}
      onClick={handleCardClick}
      target={onPresenceClick && c.popup_enabled !== false ? undefined : "_blank"}
      rel="noreferrer"
      data-testid={`bio-link-${l.id}`}
      className={`link-in group relative flex items-center justify-between gap-3 w-full ${pill ? "px-4 py-2.5 rounded-full" : "px-4 py-3 rounded-xl"} border backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer overflow-hidden ${animClass}`}
      style={{
        borderColor: cardBorder || `${accent}44`,
        background: linkBg || "linear-gradient(135deg, rgba(12,15,20,0.7), rgba(8,9,11,0.85))",
        animationDelay: `${index * 70}ms`,
      }}
    >
      {/* Top micro sheen highlight */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {c.avatar && c.avatar_url ? (
          <MediaDisplay src={c.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-white/10" style={{ boxShadow: glow ? `0 0 ${glowSize}px ${glow}` : undefined }} />
        ) : c.custom_icon && c.custom_icon_url ? (
          <img src={c.custom_icon_url} alt="" className="w-6 h-6 object-contain shrink-0" style={{ filter: glow ? `drop-shadow(0 0 ${glowSize}px ${glow})` : "none" }} />
        ) : (
          <div 
            className={`w-9 h-9 ${pill ? "rounded-full" : "rounded-xl"} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110`}
            style={{ 
              background: noBg ? "transparent" : c.icon_color_overlay ? `linear-gradient(135deg, ${brandColor}44 0%, ${brandColor}18 100%)` : "rgba(8,9,11,0.75)",
              border: noBg ? "none" : c.icon_color_overlay ? `1.5px solid ${brandColor}88` : `1px solid ${brandColor}35`, 
              color: brandColor,
              boxShadow: c.icon_color_overlay ? `0 0 14px ${brandColor}44, inset 0 0 8px ${brandColor}22` : undefined,
              filter: glow ? `drop-shadow(0 0 ${glowSize}px ${glow})` : (noBg || c.icon_color_overlay ? `drop-shadow(0 0 6px ${brandColor}88)` : "none")
            }}
          >
            <Ic size={noBg ? 22 : 18} />
          </div>
        )}
        <div className="flex-1 min-w-0 text-left">
          <div className="text-sm font-semibold tracking-tight flex items-center gap-1.5" style={{ color: nameColor }}>
            <span className="truncate group-hover:text-white transition-colors">{name}</span>
            {c.verified && <BadgeCheck size={14} className="text-[#5B8DB8] shrink-0" />}
            {c.online && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />}
            {c.badge && <Icons.Award size={13} className="text-[#eab308] shrink-0" />}
          </div>
          {details.length > 0 && (
            <div className="text-[11px] font-mono text-[#E5E7EB]/50 truncate mt-0.5">{details.join(" · ")}</div>
          )}
        </div>
      </div>

      {/* Right button options */}
      {rightBtnStyle === "copy" && (
        <button
          type="button"
          onClick={handleCopy}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#E5E7EB]/50 hover:text-white hover:bg-white/10 transition-all shrink-0 active:scale-95"
          title="Copy link"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
      )}

      {rightBtnStyle === "presence" && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onPresenceClick) onPresenceClick(l);
          }}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase flex items-center gap-1.5 shrink-0 transition-all hover:scale-105 active:scale-95"
          style={{ background: `${brandColor}22`, color: brandColor, border: `1px solid ${brandColor}44` }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: brandColor }} />
          Preview
        </button>
      )}

      {rightBtnStyle === "platform" && (
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[#E5E7EB]/50 shrink-0">
          {l.platform}
        </span>
      )}

      {rightBtnStyle === "arrow" && (
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[#E5E7EB]/40 group-hover:text-white group-hover:bg-white/5 transition-all shrink-0">
          <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      )}
    </a>
  );
}

/* ========================================================================= */
/*                     PRESENCE & PREVIEW MODAL SUITE                        */
/* ========================================================================= */

/* 1. DISCORD SERVER INVITE MODAL */
function DiscordServerModal({ data, bio, accent, onClose }) {
  const url = data.link?.url || data.url || "";
  const match = url.match(/(?:discord\.gg|discord(?:app)?\.com\/invite)\/([a-zA-Z0-9_-]+)/i);
  const code = match ? match[1] : (url.startsWith("http") ? "" : url);
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(!!code);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!code) { setLoading(false); return; }
    let alive = true;
    fetch(`https://discord.com/api/v9/invites/${code}?with_counts=true`)
      .then((res) => res.json())
      .then((json) => {
        if (alive && json && (json.guild || json.code)) setServer(json);
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [code]);

  const guild = server?.guild;
  const name = guild?.name || data.link?.label || "Discord Server";
  const iconUrl = guild?.icon
    ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${guild.icon.startsWith("a_") ? "gif" : "png"}?size=256`
    : data.link?.config?.avatar_url;
  const bannerUrl = guild?.banner
    ? `https://cdn.discordapp.com/banners/${guild.id}/${guild.banner}.png?size=512`
    : guild?.splash
    ? `https://cdn.discordapp.com/splashes/${guild.id}/${guild.splash}.png?size=512`
    : null;

  const onlineCount = server?.approximate_presence_count;
  const memberCount = server?.approximate_member_count;
  const desc = guild?.description || data.link?.config?.status_value || "";
  const isVerified = guild?.features?.includes("VERIFIED") || guild?.features?.includes("PARTNERED");

  return (
    <div className="presence-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div className="presence-modal-card relative w-full max-w-sm rounded-3xl bg-[#111214] border border-[#5865F2]/40 text-[#E5E7EB] shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        {/* Banner Cover */}
        <div
          className="h-28 bg-[#1e1f22] bg-cover bg-center relative p-3 flex justify-between items-start"
          style={{
            backgroundImage: bannerUrl ? `url(${bannerUrl})` : "linear-gradient(135deg, #5865F2 0%, #1e1f22 100%)",
          }}
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md text-[11px] text-white font-medium border border-white/10 shadow">
            <SiDiscord size={13} className="text-[#5865F2]" />
            <span>Discord Server</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-black/50 hover:bg-black/75 flex items-center justify-center text-white/70 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-5 pt-0 -mt-9 relative">
          <div className="flex items-end justify-between mb-3.5">
            <div className="relative">
              {iconUrl ? (
                <img src={iconUrl} alt="" className="w-18 h-18 rounded-2xl border-4 border-[#111214] bg-[#1e1f22] object-cover shadow-2xl" />
              ) : (
                <div className="w-18 h-18 rounded-2xl border-4 border-[#111214] bg-[#5865F2] flex items-center justify-center text-white shadow-2xl">
                  <SiDiscord size={32} />
                </div>
              )}
            </div>
            {isVerified && (
              <span className="px-2 py-0.5 rounded-full bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#5865F2] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                <BadgeCheck size={12} /> Verified
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-lg font-bold text-white flex items-center gap-1.5">
              <span className="truncate">{name}</span>
            </div>
            {server?.channel?.name && (
              <div className="text-xs text-[#949ba4] font-medium font-mono">#{server.channel.name}</div>
            )}
          </div>

          {/* Counts */}
          <div className="mt-3.5 flex items-center gap-3 py-2 px-3 rounded-xl bg-[#1e1f22] border border-white/5 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-white/90">
              <span className="w-2 h-2 rounded-full bg-[#23a55a] animate-pulse" />
              <span>{onlineCount != null ? onlineCount.toLocaleString() : "Active"}</span>
              <span className="text-[#949ba4] font-normal">Online</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <div className="flex items-center gap-1.5 font-medium text-white/90">
              <span className="w-2 h-2 rounded-full bg-[#80848e]" />
              <span>{memberCount != null ? memberCount.toLocaleString() : "Community"}</span>
              <span className="text-[#949ba4] font-normal">Members</span>
            </div>
          </div>

          {/* Description */}
          {desc && (
            <div className="mt-3 p-3 rounded-xl bg-[#1e1f22]/70 border border-white/5 text-xs text-[#dbdee1] leading-relaxed line-clamp-3">
              {desc}
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 pt-3 border-t border-white/10 flex gap-2">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-[#5865F2]/25 transition-all active:scale-95"
            >
              <SiDiscord size={15} /> Join Server
            </a>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-3.5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-medium text-[#E5E7EB] flex items-center gap-1.5 transition-all"
              title="Copy server invite"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              <span>{copied ? "Copied!" : "Copy Invite"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 2. DISCORD USER PRESENCE MODAL */
function DiscordPresenceModal({ data, bio, accent, onClose }) {
  const dc = bio?.connections?.discord || {};
  const s = bio?.settings || {};
  const discordId = s.discord_snowflake_id || dc?.id || data.link?.url?.match(/users\/(\d+)/)?.[1] || data.link?.config?.discord_id || data.link?.config?.user_id || "";
  const [lanyard, setLanyard] = useState(null);
  const [loading, setLoading] = useState(!!discordId);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!discordId) {
      setLoading(false);
      return;
    }
    let alive = true;
    fetch(`https://api.lanyard.rest/v1/users/${discordId}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((json) => {
        if (alive && json?.success && json?.data) {
          setLanyard(json.data);
        }
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [discordId]);

  const user = lanyard?.discord_user;
  const status = lanyard?.discord_status || s.discord_presence_status || dc?.status || "online";
  const avatar = s.discord_avatar_override
    ? fileUrl(s.discord_avatar_override)
    : user?.avatar
    ? `https://cdn.discordapp.com/avatars/${dc?.id || user.id}/${user.avatar}.${user.avatar.startsWith("a_") ? "gif" : "png"}?size=256`
    : dc?.avatar || data.link?.config?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${bio?.username}`;

  const displayName = user?.global_name || dc?.global_name || dc?.username || s.discord_custom_name || bio?.display_name || bio?.username || "Discord";
  const tag = user?.username ? `@${user.username}` : dc?.username ? `@${dc.username}` : `@${bio?.username}`;

  const customStatus = lanyard?.activities?.find((a) => a.type === 4) || (s.discord_custom_status ? { state: s.discord_custom_status, emoji: s.discord_status_emoji ? { name: s.discord_status_emoji } : null } : null);
  const mainActivity = lanyard?.activities?.find((a) => a.type === 0 || a.type === 1 || a.type === 3) || (s.discord_activity_name ? { name: s.discord_activity_name, details: s.discord_activity_details, type: 0 } : null);
  const spotify = lanyard?.spotify;

  const bannerUrl =
    user?.banner
      ? `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${user.banner.startsWith("a_") ? "gif" : "png"}?size=512`
      : s.discord_larp_banner || data.link?.config?.discord_banner || null;

  const accountAssets = {
    ...(dc || {}),
    public_flags: user?.public_flags ?? dc?.public_flags ?? 1,
    premium_type: user?.premium_type ?? dc?.premium_type ?? 2,
  };
  const activeBadgeIds = getDiscordBadges(accountAssets);
  const activeBadgesList = DISCORD_BADGES_CATALOG.filter((badge) => activeBadgeIds.includes(badge.id));

  const statusColor = {
    online: "#23a55a",
    idle: "#f0b232",
    dnd: "#f23f43",
    offline: "#80848e",
    streaming: "#593695",
  }[status] || "#23a55a";

  const statusLabel = {
    online: "Online",
    idle: "Idle / Away",
    dnd: "Do Not Disturb",
    offline: "Offline",
    streaming: "Streaming",
  }[status] || "Online";

  return (
    <div className="presence-modal-backdrop fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-md animate-in fade-in duration-200 sm:items-center sm:p-4" onClick={onClose}>
      <div className="presence-modal-card relative my-auto w-full max-w-md max-h-[90dvh] overflow-y-auto overscroll-contain rounded-xl bg-[#17181c] border border-white/10 text-[#E5E7EB] shadow-[0_24px_72px_rgba(0,0,0,0.7)] animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        {/* Top Banner */}
        <div
          className="h-28 relative p-3 flex justify-between items-start bg-cover bg-center overflow-hidden"
          style={{
            backgroundImage: bannerUrl ? `url(${bannerUrl})` : "linear-gradient(135deg, #3b3d49 0%, #222328 100%)",
          }}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md text-[11px] text-white/90 font-medium border border-white/10">
            <SiDiscord size={13} className="text-[#5865F2]" />
            <span>Discord Presence</span>
          </div>
          <button onClick={onClose} className="relative z-10 w-7 h-7 rounded-full bg-black/50 hover:bg-black/75 flex items-center justify-center text-white/70 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Profile Header & Avatar */}
        <div className="px-5 pb-5 pt-0 -mt-10 relative">
          <div className="flex items-end justify-between gap-2 mb-3">
            <div className="relative inline-block">
              <img src={avatar} alt="" className="w-20 h-20 rounded-full border-4 border-[#111214] bg-[#1e1f22] object-cover shadow-xl relative z-10" />
              <AvatarDecoration decoration={bio?.settings?.profile_frame || { ...(bio?.connections?.discord?.avatar_decoration || {}), profileEffect: bio?.settings?.profile_effect || "none", color: bio?.settings?.profile_effect_color || "#7db5e3" }} />
              <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-[#111214] z-20" style={{ background: statusColor }} title={statusLabel} />
            </div>
            <div className="flex min-w-0 max-w-[58%] flex-col items-end gap-1.5 pb-1">
              {activeBadgesList.length > 0 && (
                <div className="flex max-w-full flex-wrap justify-end gap-1 bg-[#1e1f22]/90 border border-white/10 p-1.5 rounded-lg shadow-lg">
                  {activeBadgesList.map((badge) => (
                    <span key={badge.id} className="w-5 h-5 flex items-center justify-center" style={{ color: badge.color }} title={badge.name}>
                      <DiscordBadgeIcon badgeId={badge.id} size={16} />
                    </span>
                  ))}
                </div>
              )}
              {activeBadgesList.length === 0 && (
                <span className="text-right text-[10px] text-white/45">
                  {typeof accountAssets.public_flags === "number" ? "No public Discord badges" : "Reconnect Discord to sync badges"}
                </span>
              )}
              <span
                className="max-w-full whitespace-nowrap text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize flex items-center gap-1 border"
                style={{
                  background: `${statusColor}22`,
                  borderColor: `${statusColor}44`,
                  color: statusColor,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statusColor }} />
                {statusLabel}
              </span>
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="text-lg font-bold text-white flex items-center gap-1.5">
              {displayName}
              {lanyard?.discord_user?.bot && (
                <span className="text-[10px] bg-[#5865F2] text-white px-1.5 py-0.2 rounded font-mono font-bold">BOT</span>
              )}
            </div>
            {tag && <div className="text-xs text-[#949ba4] font-medium font-mono">{tag}</div>}
          </div>

          {loading && <div className="mt-3 h-9 rounded-md border border-white/10 bg-white/[0.03] animate-pulse" aria-label="Syncing Discord presence" />}
          {!loading && lanyard && !customStatus && !mainActivity && !spotify && (
            <div className="mt-3 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/50">No public activity</div>
          )}

          {/* Custom Status */}
          {customStatus && (
            <div className="mt-3 p-2.5 rounded-xl bg-[#232428] border border-white/5 text-xs text-[#dbdee1] flex items-center gap-2">
              {customStatus.emoji?.id ? (
                <img
                  src={`https://cdn.discordapp.com/emojis/${customStatus.emoji.id}.${customStatus.emoji.animated ? "gif" : "png"}`}
                  alt=""
                  className="w-4 h-4"
                />
              ) : customStatus.emoji?.name ? (
                <span>{customStatus.emoji.name}</span>
              ) : null}
              <span className="truncate">{customStatus.state}</span>
            </div>
          )}

          {/* Rich Presence: Playing Game */}
          {mainActivity && (
            <div className="mt-3 p-3 rounded-2xl bg-[#1e1f22] border border-white/5 space-y-2">
              <div className="text-[10px] font-bold text-[#b5bac1] tracking-wider uppercase flex items-center gap-1.5">
                <Gamepad2 size={13} className="text-[#5865F2]" />
                Playing a Game
              </div>
              <div className="flex items-center gap-3">
                {mainActivity.assets?.large_image ? (
                  <img
                    src={
                      mainActivity.assets.large_image.startsWith("mp:external")
                        ? mainActivity.assets.large_image.replace(/mp:external\/[^\/]+\/https\//, "https://")
                        : `https://cdn.discordapp.com/app-assets/${mainActivity.application_id}/${mainActivity.assets.large_image}.png`
                    }
                    alt=""
                    className="w-11 h-11 rounded-xl object-cover border border-white/10"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/30 flex items-center justify-center text-[#5865F2]">
                    <Gamepad2 size={20} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white truncate">{mainActivity.name}</div>
                  {mainActivity.details && <div className="text-[11px] text-[#949ba4] truncate">{mainActivity.details}</div>}
                  {mainActivity.state && <div className="text-[11px] text-[#949ba4]/70 truncate">{mainActivity.state}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Rich Presence: Spotify on Discord */}
          {spotify && (
            <div className="mt-3 p-3 rounded-2xl bg-[#1e1f22] border border-[#1DB954]/25 space-y-2">
              <div className="text-[10px] font-bold text-[#1DB954] tracking-wider uppercase flex items-center gap-1.5">
                <SiSpotify size={13} />
                Listening to Spotify
              </div>
              <div className="flex items-center gap-3">
                {spotify.album_art_url && (
                  <img src={spotify.album_art_url} alt="" className="w-11 h-11 rounded-xl object-cover border border-white/10" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white truncate">{spotify.song}</div>
                  <div className="text-[11px] text-[#949ba4] truncate">{spotify.artist}</div>
                  <div className="text-[10px] text-[#949ba4]/60 truncate">{spotify.album}</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 pt-3 border-t border-white/10 flex gap-2">
            <a
              href={data.link?.url || `https://discord.com/users/${discordId || ""}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <SiDiscord size={15} /> Open Discord
            </a>
            <button
              type="button"
              onClick={() => {
                const toCopy = user?.username || dc?.username || displayName;
                navigator.clipboard.writeText(toCopy);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-3.5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-medium text-[#E5E7EB] flex items-center gap-1.5 transition-all"
              title="Copy Discord username"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              <span>{copied ? "Copied!" : "Copy Tag"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 3. TIKTOK CREATOR MODAL */
function TikTokModal({ data, bio, accent, onClose }) {
  const [copied, setCopied] = useState(false);
  const l = data.link;
  const c = l?.config || {};
  const url = l?.url || "";
  const handleMatch = url.match(/@([a-zA-Z0-9_.-]+)/i);
  const rawHandle = handleMatch ? handleMatch[1] : (c.username_text || l?.label || bio.username);
  const handle = rawHandle.startsWith("@") ? rawHandle : `@${rawHandle}`;
  const displayName = c.username_text || l?.label || bio.display_name || bio.username;
  const avatarUrl = c.avatar_url || fileUrl(bio.settings?.pfp) || `https://api.dicebear.com/7.x/bottts/svg?seed=${rawHandle}`;

  const followers = c.followers_value || c.followers || null;

  return (
    <div className="presence-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div className="presence-modal-card relative w-full max-w-sm rounded-3xl bg-[#08090B] border border-[#25f4ee]/30 text-[#E5E7EB] shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_40px_rgba(37,244,238,0.15)] overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        {/* TikTok Dual-Neon Banner Header */}
        <div
          className="h-24 relative p-3 flex justify-between items-start overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(37,244,238,0.25) 0%, #08090B 50%, rgba(254,44,85,0.25) 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Subtle neon glow orbs */}
          <div className="absolute -left-6 -top-6 w-24 h-24 rounded-full bg-[#25f4ee]/20 blur-xl pointer-events-none" />
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-[#fe2c55]/20 blur-xl pointer-events-none" />

          <div className="relative z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] text-white font-medium border border-white/10 shadow-lg">
            <SiTiktok size={12} className="text-[#25f4ee]" />
            <span>TikTok Profile</span>
          </div>
          <button onClick={onClose} className="relative z-10 w-7 h-7 rounded-full bg-black/50 hover:bg-black/75 flex items-center justify-center text-white/70 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Profile Card */}
        <div className="px-5 pb-5 pt-0 -mt-10 relative">
          <div className="flex items-end justify-between mb-3.5">
            <div className="relative">
              <img
                src={avatarUrl}
                alt=""
                className="w-20 h-20 rounded-full border-4 border-[#08090B] bg-[#111214] object-cover shadow-2xl"
                style={{
                  boxShadow: "0 0 20px rgba(37,244,238,0.35), 0 0 35px rgba(254,44,85,0.25)",
                }}
              />
              <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[#08090B] flex items-center justify-center border-2 border-[#08090B]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#25f4ee] animate-pulse" />
              </span>
            </div>

            {c.verified && (
              <span className="px-2.5 py-1 rounded-full bg-[#25f4ee]/15 border border-[#25f4ee]/40 text-[#25f4ee] text-[11px] font-bold flex items-center gap-1 mb-1">
                <BadgeCheck size={13} /> Verified
              </span>
            )}
          </div>

          <div className="space-y-0.5">
            <div className="text-lg font-bold text-white flex items-center gap-1.5">
              <span>{displayName}</span>
            </div>
            <div className="text-xs text-[#25f4ee] font-mono font-medium">{handle}</div>
          </div>

          {/* TikTok Stats & Highlights */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/5">
              <div className="text-xs font-bold text-white">{followers || "Creator"}</div>
              <div className="text-[10px] text-[#E5E7EB]/50 uppercase tracking-wider mt-0.5">
                {followers ? "Followers" : "Content"}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/5">
              <div className="text-xs font-bold text-[#fe2c55]">Videos & Lives</div>
              <div className="text-[10px] text-[#E5E7EB]/50 uppercase tracking-wider mt-0.5">TikTok Feed</div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 pt-3 border-t border-white/10 flex gap-2">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 rounded-xl text-black text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-95"
              style={{
                background: "linear-gradient(90deg, #25f4ee 0%, #fe2c55 100%)",
                boxShadow: "0 4px 20px rgba(37,244,238,0.3)",
              }}
            >
              <SiTiktok size={14} className="text-black" /> Watch on TikTok
            </a>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(handle);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-3.5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-medium text-[#E5E7EB] flex items-center gap-1.5 transition-all"
              title="Copy handle"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 4. SPOTIFY MODAL */
function SpotifyPresenceModal({ data, bio, accent, onClose }) {
  const [np, setNp] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    api.get(`/u/${encodeURIComponent(bio.username)}/nowplaying`)
      .then(({ data }) => { if (alive) setNp(data); })
      .catch(() => {});
    return () => { alive = false; };
  }, [bio.username]);

  const trackName = np?.track || data.link?.label || "Spotify Track";
  const artistName = np?.artist || data.link?.config?.username_text || "Spotify";
  const artUrl = np?.album_art || data.link?.config?.avatar_url;
  const targetUrl = np?.url || data.link?.url || "https://spotify.com";

  return (
    <div className="presence-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div className="presence-modal-card relative w-full max-w-sm rounded-3xl bg-[#0f1115] border border-[#1DB954]/40 text-[#E5E7EB] shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="h-20 bg-gradient-to-r from-[#1DB954] to-[#121212] p-3 flex justify-between items-start">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-[11px] text-white font-medium">
            <SiSpotify size={13} className="text-[#1DB954]" />
            <span>Spotify Live Presence</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/70 hover:text-white">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 pt-0 -mt-8">
          <div className="flex items-center gap-4 mb-4">
            {artUrl ? (
              <img src={artUrl} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-[#1DB954]/50 shadow-xl shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#1DB954]/20 border border-[#1DB954]/40 flex items-center justify-center shrink-0">
                <SiSpotify size={30} className="text-[#1DB954]" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-[#1DB954] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1DB954] animate-pulse" />
                {np?.playing ? "Currently Playing" : "Spotify Connected"}
              </div>
              <div className="text-base font-bold text-white truncate">{renderBioText(trackName)}</div>
              <div className="text-xs text-[#E5E7EB]/60 truncate">{renderBioText(artistName)}</div>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-white/10">
            <a href={targetUrl} target="_blank" rel="noreferrer" className="flex-1 py-2.5 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md">
              <SiSpotify size={15} /> Listen on Spotify
            </a>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(targetUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-3.5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-medium text-[#E5E7EB] flex items-center gap-1.5 transition-all"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 5. YOUTUBE MODAL */
function YouTubeModal({ data, bio, accent, onClose }) {
  const [copied, setCopied] = useState(false);
  const l = data.link;
  const c = l?.config || {};
  const url = l?.url || "";
  const name = c.username_text || l?.label || "YouTube Channel";
  const avatarUrl = c.avatar_url || fileUrl(bio.settings?.pfp);
  const subscribers = c.subscribers_value || null;

  return (
    <div className="presence-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div className="presence-modal-card relative w-full max-w-sm rounded-3xl bg-[#0f1115] border border-[#FF0000]/40 text-[#E5E7EB] shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="h-22 bg-gradient-to-r from-[#FF0000] to-[#1a0505] p-3 flex justify-between items-start">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-[11px] text-white font-medium border border-white/10">
            <SiYoutube size={14} className="text-[#FF0000]" />
            <span>YouTube Profile</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/70 hover:text-white">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 pt-0 -mt-9">
          <div className="flex items-end justify-between mb-3.5">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-18 h-18 rounded-2xl border-4 border-[#0f1115] object-cover shadow-xl" />
            ) : (
              <div className="w-18 h-18 rounded-2xl border-4 border-[#0f1115] bg-[#FF0000]/20 border-[#FF0000]/40 flex items-center justify-center text-[#FF0000]">
                <SiYoutube size={32} />
              </div>
            )}
            {c.verified && (
              <span className="px-2 py-0.5 rounded-full bg-[#FF0000]/20 border border-[#FF0000]/40 text-[#FF0000] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                <BadgeCheck size={12} /> Verified
              </span>
            )}
          </div>

          <div className="space-y-0.5">
            <div className="text-base font-bold text-white truncate">{name}</div>
            <div className="text-xs text-[#E5E7EB]/50">{subscribers ? `${subscribers} Subscribers` : "Videos & Premieres"}</div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex gap-2">
            <a href={url} target="_blank" rel="noreferrer" className="flex-1 py-2.5 rounded-xl bg-[#FF0000] hover:bg-[#d90000] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95">
              <SiYoutube size={15} /> Watch on YouTube
            </a>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-3.5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-medium text-[#E5E7EB] flex items-center gap-1.5"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 6. TWITCH & KICK LIVE STREAMER MODAL */
function TwitchKickModal({ data, bio, accent, onClose }) {
  const [copied, setCopied] = useState(false);
  const l = data.link;
  const c = l?.config || {};
  const isKick = l?.platform === "kick";
  const brandCol = isKick ? "#53FC18" : "#9146FF";
  const brandName = isKick ? "Kick" : "Twitch";
  const Ic = isKick ? SiKick : SiTwitch;
  const name = c.username_text || l?.label || "Live Streamer";
  const url = l?.url || "";

  return (
    <div className="presence-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div className="presence-modal-card relative w-full max-w-sm rounded-3xl bg-[#0f1115] border text-[#E5E7EB] shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden animate-in zoom-in-95 duration-200" style={{ borderColor: `${brandCol}55` }} onClick={(e) => e.stopPropagation()}>
        <div className="h-22 p-3 flex justify-between items-start" style={{ background: `linear-gradient(135deg, ${brandCol}33, #0f1115)` }}>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-[11px] text-white font-medium border border-white/10">
            <span style={{ color: brandCol }}><Ic size={13} /></span>
            <span>{brandName} Streamer</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/70 hover:text-white">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 pt-0 -mt-8">
          <div className="flex items-center gap-3.5 mb-3.5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border" style={{ background: `${brandCol}22`, borderColor: `${brandCol}44`, color: brandCol }}>
              <Ic size={26} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-base font-bold text-white truncate">{name}</div>
              <div className="text-xs flex items-center gap-1 mt-0.5" style={{ color: brandCol }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: brandCol }} />
                <span>Live Streams & Clips</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-white/10">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
              style={{ background: brandCol, color: isKick ? "#000" : "#FFF" }}
            >
              <Ic size={14} /> Watch on {brandName}
            </a>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-3.5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-medium text-[#E5E7EB] flex items-center gap-1.5"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 7. GENERAL PLATFORM (INSTAGRAM, X/TWITTER, GITHUB, STEAM, ROBLOX, TELEGRAM, ETC.) */
function PlatformPresenceModal({ data, bio, accent, onClose }) {
  const [copied, setCopied] = useState(false);
  const l = data.link;
  const c = l?.config || {};
  const plat = (l?.platform || data.type || "link").toLowerCase();
  const Ic = brandIcon(plat);
  const brandCol = BRAND_COLORS[plat] || accent;
  const name = c.popup_title || c.username_text || l?.label || plat;
  const popupDescription = c.popup_description || c.description_value || "";
  const url = l?.url || "";

  // Details
  const details = [];
  DETAIL_KEYS.forEach((k) => { if (c[k] && c[`${k}_value`]) details.push({ label: k, value: c[`${k}_value`] }); });

  return (
    <div className="presence-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div className="presence-modal-card relative w-full max-w-md rounded-2xl bg-[#0f1115] border text-[#E5E7EB] shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden animate-in zoom-in-95 duration-200" style={{ borderColor: `${brandCol}44` }} onClick={(e) => e.stopPropagation()}>
        <div className="h-20 p-3 flex justify-between items-start" style={{ background: `linear-gradient(135deg, ${brandCol}28, #0f1115)` }}>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-[11px] text-white font-medium border border-white/10">
            <span style={{ color: brandCol }}><Ic size={13} /></span>
            <span className="capitalize">{plat} Profile</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/70 hover:text-white">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 pt-0 -mt-8">
          <div className="flex items-center gap-3.5 mb-3.5">
            {c.avatar_url ? (
              <MediaDisplay src={c.avatar_url} alt={`${name} avatar`} className="w-16 h-16 rounded-xl border-2 object-cover shrink-0" style={{ borderColor: `${brandCol}66` }} />
            ) : (
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border" style={{ background: `${brandCol}18`, borderColor: `${brandCol}44`, color: brandCol }}>
                <Ic size={24} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-base font-bold text-white flex items-center gap-1.5">
                <span className="truncate">{name}</span>
                {c.verified && <BadgeCheck size={14} className="text-[#5B8DB8] shrink-0" />}
              </div>
              <div className="text-xs text-[#E5E7EB]/50 truncate font-mono mt-0.5">{url}</div>
            </div>
          </div>

          {popupDescription && <p className="mb-3.5 text-xs leading-relaxed text-white/65">{popupDescription}</p>}

          {details.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-3.5">
              {details.map((d) => (
                <div key={d.label} className="p-2 rounded-xl bg-white/[0.04] border border-white/5 text-center">
                  <div className="text-xs font-semibold text-white truncate">{d.value}</div>
                  <div className="text-[10px] text-[#E5E7EB]/40 uppercase tracking-wider">{d.label}</div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-3 border-t border-white/10">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
              style={{ background: brandCol }}
            >
              <ExternalLink size={14} /> Open {plat.toUpperCase()}
            </a>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-3.5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-medium text-[#E5E7EB] flex items-center gap-1.5"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 8. GENERIC FALLBACK MODAL */
function GenericPresenceModal({ data, bio, accent, onClose }) {
  const [copied, setCopied] = useState(false);
  const l = data.link;
  const Ic = brandIcon(l?.platform);
  const brandColor = BRAND_COLORS[l?.platform] || accent;
  const popupTitle = l?.config?.popup_title || l?.label || "Profile link";
  const popupDescription = l?.config?.popup_description || "";

  return (
    <div className="presence-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div className="presence-modal-card relative w-full max-w-sm rounded-3xl bg-[#0f1115] border border-white/15 text-[#E5E7EB] shadow-[0_25px_70px_rgba(0,0,0,0.85)] p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span style={{ color: brandColor }}><Ic size={18} /></span>
            <span className="text-xs font-semibold capitalize">{l?.platform || "Link"} preview</span>
          </div>
          <button onClick={onClose} className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-[#E5E7EB]/50 hover:text-white">
            <X size={15} />
          </button>
        </div>

        <div className="text-center py-2">
          <div className="text-base font-bold text-white mb-0.5">{popupTitle}</div>
          <div className="text-xs text-[#E5E7EB]/50 truncate max-w-[280px] mx-auto font-mono">{l?.url}</div>
          {popupDescription && <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-white/65">{popupDescription}</p>}
        </div>

        <div className="flex gap-2 pt-2 border-t border-white/10">
          <a href={l?.url} target="_blank" rel="noreferrer" className="flex-1 py-2.5 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md" style={{ background: brandColor }}>
            <ExternalLink size={14} /> Open Link
          </a>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(l?.url || "");
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="px-3.5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-medium text-[#E5E7EB] flex items-center gap-1.5"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* TOP-LEVEL PRESENCE MODAL DISPATCHER */
function PresenceModal({ data, bio, accent, onClose }) {
  if (!data) return null;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const type = data.type || data.link?.platform || "generic";
  const url = (data.link?.url || data.url || "").trim();
  const isDiscordInvite =
    type === "discord_server" ||
    (type === "discord" && (url.includes("discord.gg/") || url.includes("discord.com/invite/") || url.includes("discordapp.com/invite/") || data.link?.config?.discord_mode === "server"));

  if (isDiscordInvite) {
    return <DiscordServerModal data={data} bio={bio} accent={accent} onClose={onClose} />;
  }
  if (type === "discord" || type === "discord_user") {
    return <DiscordPresenceModal data={data} bio={bio} accent={accent} onClose={onClose} />;
  }
  if (type === "tiktok" || url.includes("tiktok.com/")) {
    return <TikTokModal data={data} bio={bio} accent={accent} onClose={onClose} />;
  }
  if (type === "spotify" || url.includes("spotify.com/")) {
    return <SpotifyPresenceModal data={data} bio={bio} accent={accent} onClose={onClose} />;
  }
  if (type === "youtube" || url.includes("youtube.com/") || url.includes("youtu.be/")) {
    return <YouTubeModal data={data} bio={bio} accent={accent} onClose={onClose} />;
  }
  if (type === "twitch" || type === "kick") {
    return <TwitchKickModal data={data} bio={bio} accent={accent} onClose={onClose} />;
  }
  if (["instagram", "twitter", "x", "github", "steam", "roblox", "telegram", "reddit", "soundcloud"].includes(type)) {
    return <PlatformPresenceModal data={data} bio={bio} accent={accent} onClose={onClose} />;
  }
  return <GenericPresenceModal data={data} bio={bio} accent={accent} onClose={onClose} />;
}

function iconFor(platform) {
  const map = { twitter: "Twitter", instagram: "Instagram", github: "Github", youtube: "Youtube", twitch: "Twitch", discord: "MessageCircle", spotify: "Music", tiktok: "Music2", website: "Globe", shop: "ShoppingBag", telegram: "Send", email: "Mail" };
  return map[platform?.toLowerCase()] || "Link2";
}


