import React, { useEffect, useRef, useState } from "react";
import { SiDiscord } from "react-icons/si";
import {
  ExternalLink, ShieldCheck, Users, Sparkles, Copy, Check, Gamepad2,
  ShoppingCart, Key, Code, Briefcase, ArrowUpRight, Download,
} from "lucide-react";
import { fileUrl } from "@/lib/auth";

// ---------------------------------------------------------------------------
// DECK SLIDE SYSTEM
// Renders the custom slides built in the Slideshow Deck Manager. Previously
// these slides only appeared in the HUD dot list and were never actually
// rendered, which is why the deck looked broken after adding slides.
// ---------------------------------------------------------------------------

export const SUBTYPE_META = {
  game_cheat: { label: "Game Cheat / Mod Menu", icon: Gamepad2, tint: "#f97316" },
  store: { label: "Digital Store", icon: ShoppingCart, tint: "#22c55e" },
  accounts: { label: "Accounts & Alts", icon: Key, tint: "#eab308" },
  code: { label: "Code / Repository", icon: Code, tint: "#38bdf8" },
  service: { label: "Service / Commission", icon: Briefcase, tint: "#a855f7" },
  portfolio: { label: "Portfolio", icon: Sparkles, tint: "#f472b6" },
};

const reducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const digits = (v) => {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/[^0-9]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * Pointer-reactive 3D tilt surface. Uses transform on a single element and a
 * rAF-throttled handler so it stays smooth and never triggers React re-renders.
 * Automatically disabled for users who prefer reduced motion.
 */
export function TiltCard({ children, className = "", style, maxTilt = 8, glare = true }) {
  const ref = useRef(null);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / Math.max(1, rect.width);
    const py = (e.clientY - rect.top) / Math.max(1, rect.height);
    // mousemove already fires at ~60Hz, so write the transform directly instead
    // of waiting on requestAnimationFrame (which is paused in background tabs).
    const rx = (0.5 - py) * maxTilt * 2;
    const ry = (px - 0.5) * maxTilt * 2;
    el.style.transform = `perspective(1100px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(0)`;
    el.style.setProperty("--deck-gx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--deck-gy", `${(py * 100).toFixed(1)}%`);
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(1100px) rotateX(0deg) rotateY(0deg)";
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`deck-tilt ${glare ? "deck-tilt-glare" : ""} ${className}`}
      style={{ ...style, transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}

/** A full-height deck slide wrapper. Keeps every slide consistent + animated. */
export function DeckCustomSlide({
  id, index, data, accent = "#5B8DB8", minimal, font,
  cardMaterial, cardShape, cardFxClass = "", style,
}) {
  const twoSided = data?.layout === "two_sided";
  const surface = minimal
    ? "bg-transparent border-0 shadow-none p-5 sm:p-7"
    : "p-6 sm:p-8 rounded-[28px] swat-glass border border-white/15 shadow-2xl backdrop-blur-2xl";

  return (
    <section
      id={id}
      data-deck-slide={index}
      className="deck-slide min-h-[85vh] sm:min-h-screen w-full flex flex-col items-center justify-center py-10 px-1"
      style={{ ...style, fontFamily: font }}
    >
      <TiltCard
        className={`deck-slide-card w-full anim-card-slide_up ${twoSided ? "max-w-3xl" : "max-w-lg"}`}
        style={{
          ...(minimal ? {} : cardMaterial),
          ...(minimal ? {} : cardShape),
        }}
      >
        <div className={`overflow-hidden text-left ${surface} ${cardFxClass}`}>
          {data?.type === "discord"
            ? <DiscordSlideBody data={data} accent={accent} />
            : <ProjectSlideBody data={data} accent={accent} />}
        </div>
      </TiltCard>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Discord server embed slide
// ---------------------------------------------------------------------------
function DiscordSlideBody({ data, accent }) {
  const [live, setLive] = useState(null);
  const [copied, setCopied] = useState(false);

  const raw = (data.inviteUrl || "").trim();
  const match = raw.match(/(?:discord\.gg|discord(?:app)?\.com\/invite)\/([a-zA-Z0-9_-]+)/i);
  const code = match ? match[1] : (raw.startsWith("http") ? "" : raw);

  useEffect(() => {
    if (!code) return;
    let alive = true;
    fetch(`https://discord.com/api/v9/invites/${code}?with_counts=true`)
      .then((r) => r.json())
      .then((d) => { if (alive && d?.guild) setLive(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, [code]);

  const guild = live?.guild || {};
  const name = guild.name || data.serverName || "Discord Community";
  const iconUrl = guild.icon
    ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${guild.icon.startsWith("a_") ? "gif" : "png"}?size=256`
    : (data.icon ? fileUrl(data.icon) : null);
  const bannerUrl = data.banner
    ? fileUrl(data.banner)
    : guild.banner
    ? `https://cdn.discordapp.com/banners/${guild.id}/${guild.banner}.png?size=512`
    : guild.splash
    ? `https://cdn.discordapp.com/splashes/${guild.id}/${guild.splash}.png?size=512`
    : null;
  const online = live?.approximate_presence_count ?? digits(data.online);
  const members = live?.approximate_member_count ?? digits(data.members);
  const isVerified = guild.features?.includes("VERIFIED") || guild.features?.includes("PARTNERED");
  const invite = raw.startsWith("http") ? raw : (code ? `https://discord.gg/${code}` : "#");

  const handleCopy = () => {
    if (!invite || invite === "#") return;
    navigator.clipboard?.writeText(invite);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-4">
      <div className="relative h-28 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-2 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: bannerUrl
              ? `url(${bannerUrl})`
              : "linear-gradient(135deg, rgba(88,101,242,0.45), rgba(15,17,23,0.95))",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-white">
          <SiDiscord size={12} className="text-[#5865F2]" /> Discord Server
        </span>
      </div>

      <div className="-mt-10 relative flex items-center gap-3.5 px-1">
        {iconUrl ? (
          <img src={iconUrl} alt="" className="w-16 h-16 rounded-2xl border-2 border-white/20 bg-[#141517] object-cover shadow-xl" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-[#5865F2] flex items-center justify-center text-white shadow-xl">
            <SiDiscord size={26} />
          </div>
        )}
        <div className="min-w-0 pt-6">
          <h3 className="text-base font-black text-white flex items-center gap-1.5 truncate">
            <span className="truncate">{name}</span>
            {isVerified && <ShieldCheck size={15} className="text-[#5865F2] shrink-0" />}
          </h3>
          {data.description && (
            <p className="text-[11px] text-white/55 mt-0.5 line-clamp-2">{data.description}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
          <div className="text-sm font-black text-emerald-400 flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {online != null ? online.toLocaleString() : "Live"}
          </div>
          <div className="text-[9px] text-white/45 uppercase tracking-[0.14em] mt-0.5">Online</div>
        </div>
        <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
          <div className="text-sm font-black text-white flex items-center justify-center gap-1.5">
            <Users size={13} className="text-[#5865F2]" />
            {members != null ? members.toLocaleString() : "Community"}
          </div>
          <div className="text-[9px] text-white/45 uppercase tracking-[0.14em] mt-0.5">Members</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={invite}
          target="_blank"
          rel="noreferrer"
          className="flex-1 py-2.5 rounded-2xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#5865F2]/30 transition-all hover:scale-[1.02] active:scale-95"
        >
          <SiDiscord size={15} /> {data.buttonText || "Join Server"}
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
          title="Copy invite link"
        >
          {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Project / product showcase slide (one-sided centered OR two-sided split)
// ---------------------------------------------------------------------------
function ProjectSlideBody({ data, accent }) {
  const meta = SUBTYPE_META[data?.subtype] || SUBTYPE_META.portfolio;
  const Icon = meta.icon;
  const tint = meta.tint;
  const images = Array.isArray(data?.images) ? data.images.filter(Boolean) : [];
  const cover = images[0];
  const tags = Array.isArray(data?.tags) ? data.tags : [];
  const twoSided = data?.layout === "two_sided";

  const Header = (
    <div className="flex items-center gap-2.5">
      <span
        className="w-9 h-9 rounded-xl flex items-center justify-center border"
        style={{ background: `${tint}1f`, borderColor: `${tint}55`, color: tint }}
      >
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.16em] font-bold" style={{ color: tint }}>
          {meta.label}
        </div>
        <h3 className="text-base font-black text-white truncate">{data?.title || "Untitled Project"}</h3>
      </div>
      {data?.status && (
        <span className="ml-auto shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          {data.status}
        </span>
      )}
    </div>
  );

  const Primary = (
    <div className="space-y-3">
      {cover && (
        <div className="relative rounded-2xl overflow-hidden border border-white/10 group/gallery">
          <img
            src={fileUrl(cover)}
            alt={data?.title || ""}
            loading="lazy"
            decoding="async"
            className="w-full h-40 object-cover transition-transform duration-500 group-hover/gallery:scale-105"
          />
          {images.length > 1 && (
            <div className="absolute bottom-2 right-2 flex gap-1.5">
              {images.slice(1, 4).map((img, i) => (
                <img
                  key={i}
                  src={fileUrl(img)}
                  alt=""
                  loading="lazy"
                  className="w-10 h-10 rounded-lg object-cover border border-white/20 shadow-lg"
                />
              ))}
            </div>
          )}
        </div>
      )}
      {data?.description && (
        <p className="text-xs text-[#E5E7EB]/70 leading-relaxed">{data.description}</p>
      )}
      {(data?.game || data?.language) && (
        <div className="flex flex-wrap gap-2 text-[10px] font-mono text-white/60">
          {data.game && <span className="px-2 py-0.5 rounded-md bg-black/40 border border-white/10">{data.game}</span>}
          {data.language && <span className="px-2 py-0.5 rounded-md bg-black/40 border border-white/10">{data.language}</span>}
        </div>
      )}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {tags.map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 rounded-lg text-[10px] font-medium border"
              style={{ background: `${accent}18`, borderColor: `${accent}44`, color: "#e7ecf3" }}
            >
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 pt-1">
        {data?.buttonUrl && (
          <a
            href={data.buttonUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
            style={{ background: accent, boxShadow: `0 8px 28px ${accent}55` }}
          >
            <Download size={15} /> {data.buttonText || "View Project"}
          </a>
        )}
        {data?.secondaryButtonUrl && (
          <a
            href={data.secondaryButtonUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 flex items-center gap-1.5 transition-all"
          >
            {data.secondaryButtonText || "More"} <ArrowUpRight size={14} />
          </a>
        )}
      </div>
    </div>
  );

  if (!twoSided) {
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          {Header}
          {data?.price && (
            <span className="shrink-0 px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-black text-white whitespace-nowrap">
              {data.price}
            </span>
          )}
        </div>
        {Primary}
      </div>
    );
  }

  // Two-sided split layout: primary project on the left, secondary offer right
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        {Header}
        {data?.price && (
          <span className="shrink-0 px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-black text-white whitespace-nowrap">
            {data.price}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="sm:col-span-2">{data?.description && (
          <p className="text-xs text-[#E5E7EB]/70 leading-relaxed">{data.description}</p>
        )}</div>
        <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 space-y-2">
          <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-white/50">Main Build</div>
          <div className="text-sm font-bold text-white">{data?.title || "Primary"}</div>
          {data?.game && <div className="text-[10px] font-mono text-white/55">{data.game}</div>}
          {data?.buttonUrl && (
            <a href={data.buttonUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: accent }}>
              <ExternalLink size={12} /> {data.buttonText || "Open"}
            </a>
          )}
        </div>
        <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 space-y-2">
          <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-white/50">Bundle Offer</div>
          <div className="text-sm font-bold text-white">{data?.side2Title || "Secondary"}</div>
          {data?.side2Description && <p className="text-[11px] text-white/55 leading-relaxed">{data.side2Description}</p>}
          <div className="flex items-center justify-between pt-1">
            {data?.side2Price && <span className="text-xs font-black" style={{ color: accent }}>{data.side2Price}</span>}
            {data?.side2ButtonUrl && (
              <a href={data.side2ButtonUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-white/80 hover:text-white">
                Get <ArrowUpRight size={12} />
              </a>
            )}
          </div>
        </div>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span key={t} className="px-2 py-0.5 rounded-lg text-[10px] font-medium border" style={{ background: `${accent}18`, borderColor: `${accent}44`, color: "#e7ecf3" }}>
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default DeckCustomSlide;
