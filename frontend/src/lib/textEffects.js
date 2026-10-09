import React, { useState, useEffect } from "react";
import { Ghost, Star } from "lucide-react";
import sparkleAsset from "../../sparkle_black.gif";

const COLOR_MAP = {
  red: "#ef4444",
  blue: "#3b82f6",
  cyan: "#06b6d4",
  purple: "#a855f7",
  pink: "#ec4899",
  grey: "#9ca3af",
  gray: "#9ca3af",
  white: "#ffffff",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#22c55e",
  gold: "#F5C542",
  black: "#111827",
  silver: "#cbd5e1",
  teal: "#14b8a6",
  violet: "#8b5cf6",
  rose: "#f43f5e",
  emerald: "#10b981",
  amber: "#f59e0b",
  sky: "#38bdf8",
  indigo: "#6366f1",
  crimson: "#dc2626",
  magenta: "#d946ef",
  lime: "#84cc16",
  ruby: "#e11d48",
  sapphire: "#2563eb",
  aqua: "#06b6d4",
  coral: "#fb7185",
  neon: "#00f2fe",
  lavender: "#c084fc",
  fuchsia: "#e879f9",
  mint: "#6ee7b7",
  ice: "#bae6fd",
};

export const USERNAME_EFFECTS_LIST = [
  { id: "none", name: "No Effect", desc: "Clean default typography styling", wrap: (t) => t },
  { id: "glow", name: "Glow", desc: "Refined luminous backlight glow with customizable accent color", wrap: (t, color = "#5B8DB8") => `:glow#${color.replace(/^#/, "")}:${t}:glow:` },
  { id: "sparkle", name: "Sparkle", desc: "Intense multi-color animated star sparkles around your name", wrap: (t, color = "#F5C542") => `:sparkle#${color.replace(/^#/, "")}:${t}:sparkle:` },
  { id: "stack", name: "3D Stack", desc: "Layered 3D depth multi-chroma chromatic text stack", wrap: (t, color = "#5B8DB8") => `:stack#${color.replace(/^#/, "")}:${t}:stack:` },
  { id: "typewriter", name: "Typewriter", desc: "Live animated character-by-character typewriter effect", wrap: (t) => `:typewriter:${t}:` },
  { id: "grain", name: "Film Grain", desc: "Cinematic textured noise grain typography", wrap: (t) => `:grain:${t}:` },
  { id: "wave_flow", name: "Wave Flow", desc: "True flowing sine wave undulating animation across letters", wrap: (t) => `:waveflow:${t}:` },
  { id: "rgb_glow", name: "RGB Glow", desc: "Pulsing multi-chroma RGB rainbow perimeter glow", wrap: (t) => `:rgbglow:${t}:` },
  { id: "flicker", name: "Flicker", desc: "High-voltage neon phosphor flickering strobe", wrap: (t) => `:flicker:${t}:` },
  { id: "neon", name: "Neon Edge", desc: "Intense neon tube edge glow with customizable color", wrap: (t, color = "#06b6d4") => `:neon#${color.replace(/^#/, "")}:${t}:neon:` },
  { id: "rainbow", name: "Rainbow Wave", desc: "Smooth chromatic color shifting gradient", wrap: (t) => `:rainbow:${t}:` },
  { id: "outline", name: "Outline", desc: "Crisp color-stroked lettering", wrap: (t, color = "#5B8DB8") => `:outline#${color.replace(/^#/, "")}:${t}:outline:` },
];

function TypewriterText({ text }) {
  const [displayed, setDisplayed] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    let index = 0;
    let forward = true;
    let timeoutId;

    const tick = () => {
      if (forward) {
        index++;
        setDisplayed(text.slice(0, index));
        if (index >= text.length) {
          forward = false;
          timeoutId = setTimeout(tick, 2200); // pause at full text
          return;
        }
        timeoutId = setTimeout(tick, 90 + Math.random() * 40);
      } else {
        index--;
        setDisplayed(text.slice(0, index));
        if (index <= 0) {
          forward = true;
          timeoutId = setTimeout(tick, 600); // pause before retyping
          return;
        }
        timeoutId = setTimeout(tick, 45);
      }
    };

    timeoutId = setTimeout(tick, 100);

    const cursorInterval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 450);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(cursorInterval);
    };
  }, [text]);

  return (
    <span className="font-mono inline-flex items-center tracking-wide text-white">
      <span>{displayed || "\u00A0"}</span>
      <span
        className={`inline-block w-[2px] h-[1em] ml-0.5 bg-[#5B8DB8] ${cursorVisible ? "opacity-100" : "opacity-0"}`}
        style={{ boxShadow: "0 0 6px #5B8DB8" }}
      />
    </span>
  );
}

function ShuffleText({ text }) {
  const [display, setDisplay] = useState(text);
  const chars = "!@#$%^&*()_+-=~<>{}[]|/\\0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((letter, index) => {
            if (index < iteration) {
              return text[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );

      if (iteration >= text.length) {
        iteration = 0;
      }
      iteration += 1 / 3;
    }, 60);

    return () => clearInterval(interval);
  }, [text]);

  return <span className="font-mono tracking-wide text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] inline-block">{display}</span>;
}

export function stripEffectSyntax(text) {
  if (!text || typeof text !== "string") return "";
  let clean = text;
  // 1. Strip bracketed effect tags: [:sparkle#3845FF:koni:sparkle:], [:glow:koni:], [:neon#3845FF:koni:], [:stack:koni:]
  clean = clean.replace(/\[:([a-zA-Z0-9_#-]+):([^:\n\]]+):([a-zA-Z0-9_#-]+):\]/g, "$2");
  clean = clean.replace(/\[:([a-zA-Z0-9_#-]+):([^:\n\]]+):\]/g, "$2");
  clean = clean.replace(/\[:([a-zA-Z0-9_#-]+):\]/g, "");
  // 2. Strip unbracketed tags: :sparkle#3845FF:koni:sparkle:, :glow:koni:glow:, :waveflow:koni:, :stack:koni:
  clean = clean.replace(/:([a-zA-Z0-9_#-]+):([^:\n]+):([a-zA-Z0-9_#-]+):/g, "$2");
  clean = clean.replace(/:([a-zA-Z0-9_#-]+):([^:\n]+):/g, "$2");
  clean = clean.replace(/:([a-zA-Z0-9_#-]+):/g, "");
  // 3. Strip BBCode-like tags
  clean = clean.replace(/\[\/?(?:b|i|u|s|color|glow|neon|sparkle|glitch|wave|fire|badge|font|stack|grain)[^\]]*\]/gi, "");
  // 4. Strip markdown link format [text](url) -> text
  clean = clean.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
  // 5. Strip markdown formatting
  clean = clean.replace(/\*\*|--|\*|_|~|`/g, "");
  // 6. Clean outer brackets / parentheses like [koni] -> koni
  clean = clean.replace(/^\[+([^\]]+)\]+$/, "$1");
  clean = clean.replace(/^\(+([^\)]+)\)+$/, "$1");
  clean = clean.replace(/\s+/g, " ");
  return clean.trim();
}

function resolveColor(hexMatch, colorMatch, defaultHex) {
  const candidate = (hexMatch || colorMatch || "").replace(/^#/, "").trim();
  if (!candidate) return defaultHex;
  const lower = candidate.toLowerCase();
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  if (/^[0-9a-fA-F]{3,8}$/.test(candidate)) return `#${candidate}`;
  return defaultHex;
}

export function renderBioText(text) {
  if (!text) return null;
  if (typeof text !== "string") return text;
  
  const tokens = [];
  let i = 0;
  const src = text;
  const pushText = (s) => { if (s) tokens.push({ t: "text", v: s }); };

  const patterns = [
    { re: /^:rainbow:([^:\n]+)(?::(?:rainbow|[a-zA-Z0-9_#-]+))?:/i, type: "rainbow" },
    { re: /^:fuzzy:([^:\n]+)(?::(?:fuzzy|[a-zA-Z0-9_#-]+))?:/i, type: "fuzzy" },
    { re: /^:shuffle:([^:\n]+)(?::(?:shuffle|[a-zA-Z0-9_#-]+))?:/i, type: "shuffle" },
    { re: /^:waveflow:([^:\n]+)(?::(?:waveflow|[a-zA-Z0-9_#-]+))?:/i, type: "waveflow" },
    { re: /^:wavegrad:([^:\n]+)(?::(?:wavegrad|[a-zA-Z0-9_#-]+))?:/i, type: "wavegrad" },
    { re: /^:rgbglow:([^:\n]+)(?::(?:rgbglow|[a-zA-Z0-9_#-]+))?:/i, type: "rgbglow" },
    { re: /^:flicker:([^:\n]+)(?::(?:flicker|[a-zA-Z0-9_#-]+))?:/i, type: "flicker" },
    { re: /^:bats:([^:\n]+)(?::(?:bats|[a-zA-Z0-9_#-]+))?:/i, type: "bats" },
    { re: /^:sparkle(?:[#-]([a-zA-Z0-9_#]+))?:([^:\n]+)(?::([a-zA-Z0-9_#-]+))?:/i, type: "sparkle" },
    { re: /^:stack(?:[#-]([a-zA-Z0-9_#]+))?:([^:\n]+)(?::([a-zA-Z0-9_#-]+))?:/i, type: "stack" },
    { re: /^:grain:([^:\n]+)(?::(?:grain|[a-zA-Z0-9_#-]+))?:/i, type: "grain" },
    { re: /^:outline(?:[#-]([a-zA-Z0-9_#]+))?:([^:\n]+)(?::([a-zA-Z0-9_#-]+))?:/i, type: "outline" },
    { re: /^:highlight(?:[#-]([a-zA-Z0-9_#]+))?:([^:\n]+)(?::([a-zA-Z0-9_#-]+))?:/i, type: "highlight" },
    { re: /^:fire:([^:\n]+)(?::(?:fire|[a-zA-Z0-9_#-]+))?:/i, type: "fire" },
    { re: /^:matrix:([^:\n]+)(?::(?:matrix|[a-zA-Z0-9_#-]+))?:/i, type: "plain" },
    { re: /^:glitch:([^:\n]+)(?::(?:glitch|[a-zA-Z0-9_#-]+))?:/i, type: "glitch" },
    { re: /^:blood:([^:\n]+)(?::(?:blood|[a-zA-Z0-9_#-]+))?:/i, type: "plain" },
    { re: /^:bleed:([^:\n]+)(?::(?:bleed|[a-zA-Z0-9_#-]+))?:/i, type: "plain" },
    { re: /^:wave:([^:\n]+)(?::(?:wave|[a-zA-Z0-9_#-]+))?:/i, type: "waveflow" },
    { re: /^:smoke:([^:\n]+)(?::(?:smoke|[a-zA-Z0-9_#-]+))?:/i, type: "smoke" },
    { re: /^:stars:([^:\n]+)(?::(?:stars|[a-zA-Z0-9_#-]+))?:/i, type: "stars" },
    { re: /^:ghost:([^:\n]+)(?::(?:ghost|[a-zA-Z0-9_#-]+))?:/i, type: "ghost" },
    { re: /^:typewriter:([^:\n]+)(?::(?:typewriter|[a-zA-Z0-9_#-]+))?:/i, type: "typewriter" },
    { re: /^:neon(?:[#-]([a-zA-Z0-9_#]+))?:([^:\n]+)(?::([a-zA-Z0-9_#-]+))?:/i, type: "neon" },
    { re: /^:glow(?:[#-]([a-zA-Z0-9_#]+))?:([^:\n]+)(?::([a-zA-Z0-9_#-]+))?:/i, type: "glow" },
    { re: /^:blur:([^:\n]+)(?::(?:blur|[a-zA-Z0-9_#-]+))?:/i, type: "blur" },
    { re: /^\*\*([\s\S]*?)\*\*/, type: "bold" },
    { re: /^--([\s\S]*?)--/, type: "cut" },
    { re: /^\*([\s\S]*?)\*/, type: "italic" },
    { re: /^\[([^\]]+)\]\(([^)]+)\)/, type: "link" },
  ];

  let buffer = "";
  while (i < src.length) {
    const rest = src.slice(i);
    let matched = false;
    for (const p of patterns) {
      const m = rest.match(p.re);
      if (m) {
        pushText(buffer);
        buffer = "";
        if (p.type === "glow") {
          const content = m[2] || m[1] || "";
          const color = resolveColor(m[1], m[3] === "glow" ? null : m[3], "#5B8DB8");
          tokens.push({ t: "glow", v: content, color });
        } else if (p.type === "neon") {
          const content = m[2] || m[1] || "";
          const color = resolveColor(m[1], m[3] === "neon" ? null : m[3], "#06b6d4");
          tokens.push({ t: "neon", v: content, color });
        } else if (p.type === "sparkle") {
          const content = m[2] || m[1] || "";
          const color = resolveColor(m[1], m[3] === "sparkle" ? null : m[3], "#F5C542");
          tokens.push({ t: "sparkle", v: content, color });
        } else if (p.type === "stack") {
          const content = m[2] || m[1] || "";
          const color = resolveColor(m[1], m[3] === "stack" ? null : m[3], "#5B8DB8");
          tokens.push({ t: "stack", v: content, color });
        } else if (p.type === "outline") {
          const content = m[2] || m[1] || "";
          const color = resolveColor(m[1], m[3] === "outline" ? null : m[3], "#5B8DB8");
          tokens.push({ t: "outline", v: content, color });
        } else if (p.type === "highlight") {
          const content = m[2] || m[1] || "";
          const color = resolveColor(m[1], m[3] === "highlight" ? null : m[3], "#5B8DB8");
          tokens.push({ t: "highlight", v: content, color });
        } else {
          tokens.push({ t: p.type, v: m[1], url: m[2] });
        }
        i += m[0].length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      buffer += src[i];
      i += 1;
    }
  }
  pushText(buffer);

  return tokens.map((tok, idx) => {
    switch (tok.t) {
      case "rainbow":
        return (
          <span key={idx} className="font-bold text-fx-rainbow inline-block">
            {tok.v}
          </span>
        );

      case "fuzzy":
        return (
          <span
            key={idx}
            className="font-bold inline-block text-white"
            style={{
              textShadow: "1px 0 #06b6d4, -1px 0 #ec4899, 0 1px #a855f7",
              filter: "blur(0.35px)",
              letterSpacing: "0.02em",
            }}
          >
            {tok.v}
          </span>
        );

      case "shuffle":
        return <ShuffleText key={idx} text={tok.v} />;

      case "typewriter":
        return <TypewriterText key={idx} text={tok.v} />;

      case "stack": {
        const hex = tok.color || "#5B8DB8";
        return (
          <span
            key={idx}
            className="font-black inline-block text-white tracking-wider uppercase relative"
            style={{
              textShadow: `2px 2px 0px ${hex}, 4px 4px 0px rgba(0,0,0,0.8), -1px -1px 0px rgba(255,255,255,0.25), 0 0 18px ${hex}88`,
              letterSpacing: "0.05em",
            }}
          >
            {tok.v}
          </span>
        );
      }

      case "grain":
        return (
          <span
            key={idx}
            className="font-bold inline-block text-white relative px-0.5"
            style={{
              textShadow: "0 0 10px rgba(255,255,255,0.4)",
              filter: "contrast(130%)",
            }}
          >
            <span className="relative z-10">{tok.v}</span>
            <span
              className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              }}
            />
          </span>
        );

      case "waveflow":
        return (
          <span key={idx} className="font-bold text-fx-waveflow inline-block">
            {tok.v.split("").map((ch, cIdx) => (
              <span
                key={cIdx}
                className="inline-block"
                style={{
                  animation: "wave-flow-motion 1.8s ease-in-out infinite",
                  animationDelay: `${cIdx * 0.1}s`,
                }}
              >
                {ch === " " ? "\u00A0" : ch}
              </span>
            ))}
          </span>
        );

      case "rgbglow":
        return (
          <span key={idx} className="text-fx-rgbglow inline-block">
            {tok.v}
          </span>
        );

      case "flicker":
        return (
          <span key={idx} className="text-fx-flicker font-bold text-cyan-300 inline-block">
            {tok.v}
          </span>
        );

      case "wavegrad":
        return (
          <span
            key={idx}
            className="font-extrabold inline-block text-transparent bg-clip-text"
            style={{
              backgroundImage: "linear-gradient(135deg, #38bdf8 0%, #a855f7 50%, #f43f5e 100%)",
              backgroundSize: "200% auto",
              animation: "fx-rainbow 4s linear infinite",
              filter: "drop-shadow(0 0 10px rgba(168,85,247,0.6))",
            }}
          >
            {tok.v}
          </span>
        );

      case "bats":
        return (
          <span key={idx} className="font-semibold text-fx-bats inline-block text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">
            {tok.v}
          </span>
        );

      case "sparkle": {
        const col = tok.color || "#F5C542";
        const positions = [
          { cls: "-left-1 top-0 h-5 w-5", delay: "0ms" },
          { cls: "left-[16%] -top-1 h-3 w-3", delay: "170ms" },
          { cls: "left-[43%] -top-2 h-4 w-4", delay: "340ms" },
          { cls: "right-[18%] -top-1 h-3 w-3", delay: "510ms" },
          { cls: "-right-1 top-1 h-5 w-5", delay: "680ms" },
          { cls: "left-[8%] bottom-0 h-3 w-3", delay: "850ms" },
          { cls: "right-[38%] -bottom-1 h-4 w-4", delay: "1020ms" },
          { cls: "right-[7%] bottom-0 h-3 w-3", delay: "1190ms" },
        ];
        return (
          <span key={idx} className="text-fx-sparkle relative inline-block px-3 py-1 align-middle">
            {positions.map((pos, pIdx) => (
              <span
                key={pIdx}
                aria-hidden="true"
                className={`sparkle-drift pointer-events-none absolute ${pos.cls}`}
                style={{
                  backgroundColor: col,
                  WebkitMaskImage: `url("${sparkleAsset}")`,
                  maskImage: `url("${sparkleAsset}")`,
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  animationDelay: pos.delay,
                  filter: `drop-shadow(0 0 6px ${col})`,
                }}
              />
            ))}
            <span
              className="relative z-10 font-bold inline-block"
              style={{
                color: col,
                textShadow: `0 0 8px ${col}99`,
              }}
            >
              {tok.v}
            </span>
          </span>
        );
      }

      case "outline": {
        const color = tok.color || "#5B8DB8";
        return <span key={idx} className="inline-block font-bold text-white" style={{ WebkitTextStroke: `1px ${color}`, textShadow: `0 0 8px ${color}66` }}>{tok.v}</span>;
      }

      case "highlight": {
        const color = tok.color || "#5B8DB8";
        return <span key={idx} className="inline-block rounded-sm px-1 py-0.5 text-white" style={{ background: `${color}44`, boxShadow: `inset 0 -1px ${color}` }}>{tok.v}</span>;
      }

      case "fire":
        return (
          <span key={idx} className="font-black text-fx-fire inline-block">
            {tok.v}
          </span>
        );

      case "plain":
        return <React.Fragment key={idx}>{tok.v}</React.Fragment>;

      case "glitch":
        return (
          <span key={idx} className="font-extrabold text-fx-glitch inline-block" data-text={tok.v}>
            {tok.v}
          </span>
        );

      case "smoke":
        return <span key={idx} className="font-medium text-fx-smoke inline-block">{tok.v}</span>;

      case "stars":
        return (
          <span key={idx} className="font-semibold text-fx-stars inline-flex items-center gap-1">
            <Star size={12} aria-hidden="true" className="fill-sky-400 text-sky-400" />
            <span className="text-cyan-100 drop-shadow-[0_0_8px_rgba(56,189,248,0.85)]">{tok.v}</span>
            <Star size={12} aria-hidden="true" className="fill-sky-400 text-sky-400" />
          </span>
        );

      case "ghost":
        return (
          <span key={idx} className="font-medium text-fx-ghost inline-flex items-center gap-1">
            <Ghost size={14} aria-hidden="true" className="opacity-80" />
            <span className="text-slate-300 italic">{tok.v}</span>
          </span>
        );

      case "neon": {
        const hex = tok.color || "#06b6d4";
        return (
          <span
            key={idx}
            className="font-bold text-fx-neon"
            style={{
              color: "#ffffff",
              textShadow: `0 0 5px ${hex}, 0 0 10px ${hex}, 0 0 20px ${hex}, 0 0 35px ${hex}`,
            }}
          >
            {tok.v}
          </span>
        );
      }

      case "glow": {
        const hex = tok.color || "#5B8DB8";
        return (
          <span
            key={idx}
            className="font-bold text-fx-glow"
            style={{
              color: "#ffffff",
              textShadow: `0 0 8px ${hex}, 0 0 16px ${hex}88`,
            }}
          >
            {tok.v}
          </span>
        );
      }

      case "blur":
        return (
          <span key={idx} className="inline-block transition-all hover:blur-none" style={{ filter: "blur(4px)" }}>
            {tok.v}
          </span>
        );

      case "bold":
        return <strong key={idx} className="font-bold text-white">{tok.v}</strong>;

      case "cut":
        return <del key={idx} className="line-through text-[#E5E7EB]/50">{tok.v}</del>;

      case "italic":
        return <em key={idx} className="italic text-[#E5E7EB]/90">{tok.v}</em>;

      case "link":
        return (
          <a
            key={idx}
            href={tok.url}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 text-[#5B8DB8] hover:text-[#78A9D0] transition-colors"
          >
            {tok.v}
          </a>
        );

      default:
        return <React.Fragment key={idx}>{tok.v}</React.Fragment>;
    }
  });
}
