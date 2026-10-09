import React, { useEffect, useMemo, useRef, useState } from "react";
import "./effects.css";
import { splitChars, usePrefersReducedMotion } from "./effectUtils";

// ── Character / word splitting helpers ───────────────────────────────────────
function CharSpans({ text, className = "fx-char", styleFor, charClassName }) {
  return splitChars(text).map((ch, i) => (
    <span
      key={i}
      className={`${className}${charClassName ? ` ${charClassName}` : ""}`}
      style={styleFor ? styleFor(ch, i) : undefined}
    >
      {ch === " " ? "\u00A0" : ch}
    </span>
  ));
}

function WordSpans({ text, className = "fx-word", styleFor }) {
  return String(text).split(/(\s+)/).map((part, i) => (
    <span key={i} className={className} style={styleFor ? styleFor(part, i) : undefined}>
      {/^\s+$/.test(part) ? part.replace(/ /g, "\u00A0") : part}
    </span>
  ));
}

// ── 1. Typewriter ────────────────────────────────────────────────────────────
function Typewriter({ text, c, reduced }) {
  const phrases = useMemo(() => {
    const extra = String(c.phrases || "").split(",").map((p) => p.trim()).filter(Boolean);
    return extra.length ? extra : [String(text)];
  }, [c.phrases, text]);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [shown, setShown] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [caretOn, setCaretOn] = useState(true);

  useEffect(() => {
    if (reduced) {
      setShown(phrases[0]);
      return undefined;
    }
    const current = phrases[phraseIdx % phrases.length] || "";
    let timer;
    if (!deleting && shown.length < current.length) {
      timer = setTimeout(() => setShown(current.slice(0, shown.length + 1)), Math.max(10, c.speed));
    } else if (!deleting && shown.length === current.length) {
      if (phraseIdx >= phrases.length - 1 && !c.loop) return undefined;
      timer = setTimeout(() => setDeleting(true), Math.max(200, c.pause));
    } else if (deleting && shown.length > 0) {
      timer = setTimeout(() => setShown(current.slice(0, shown.length - 1)), Math.max(8, c.eraseSpeed));
    } else if (deleting) {
      setDeleting(false);
      setPhraseIdx((i) => (i + 1) % phrases.length);
    }
    return () => clearTimeout(timer);
  }, [shown, deleting, phraseIdx, phrases, c.speed, c.eraseSpeed, c.pause, c.loop, reduced]);

  useEffect(() => {
    if (reduced || !c.caret) return undefined;
    const id = setInterval(() => setCaretOn((v) => !v), 500);
    return () => clearInterval(id);
  }, [c.caret, reduced]);

  return (
    <span className="fx-text" aria-label={String(text)}>
      <span aria-hidden="true">{shown || "\u00A0"}</span>
      {c.caret && !reduced && (
        <span
          aria-hidden="true"
          className="inline-block align-middle"
          style={{
            width: 2,
            height: "1em",
            marginLeft: 2,
            background: c.caretColor,
            opacity: caretOn ? 1 : 0,
            boxShadow: `0 0 8px ${c.caretColor}`,
          }}
        />
      )}
    </span>
  );
}

// ── 2 + 11. Shuffle & Cipher (progressive character resolution) ──────────────
function ScrambleText({ text, c, reduced, charset, mode }) {
  const [display, setDisplay] = useState(String(text));
  const [runKey, setRunKey] = useState(0);
  const rafRef = useRef(0);
  const src = String(text);
  const chars = useMemo(() => splitChars(charset), [charset]);

  // Order in which indices resolve, based on direction.
  const order = useMemo(() => {
    const idx = src.split("").map((_, i) => i);
    if (mode === "right") return idx.reverse();
    if (mode === "center") {
      const mid = (idx.length - 1) / 2;
      return idx.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
    }
    if (mode === "random") return idx.sort(() => Math.random() - 0.5);
    return idx;
  }, [src, mode]);

  useEffect(() => {
    if (reduced) {
      setDisplay(src);
      return undefined;
    }
    if (c.trigger === "hover") return undefined; // run on demand
    if (c.trigger === "loop") {
      const loop = setInterval(() => setRunKey((k) => k + 1), Math.max(1200, c.duration + 1400));
      return () => clearInterval(loop);
    }
    setRunKey((k) => k + 1);
    return undefined;
  }, [src, reduced, c.trigger, c.duration]);

  useEffect(() => {
    if (reduced) return undefined;
    const start = performance.now();
    const duration = Math.max(120, c.duration);
    const stagger = Math.max(0, c.stagger);
    const total = duration + stagger * Math.max(0, order.length - 1);
    const resolveAt = new Map(order.map((charIdx, step) => [charIdx, duration + step * stagger]));

    const tick = (now) => {
      const elapsed = now - start;
      let remaining = 0;
      const next = splitChars(src).map((ch, i) => {
        if (ch === " ") return " ";
        const settle = resolveAt.get(i) ?? duration;
        if (elapsed >= settle) return ch;
        remaining += 1;
        return chars[Math.floor(Math.random() * chars.length)] || ch;
      });
      setDisplay(next.join(""));
      if (remaining > 0 && elapsed < total) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(src);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [runKey, src, chars, order, c.duration, c.stagger, reduced]);

  return (
    <span
      className="fx-text"
      aria-label={src}
      onMouseEnter={c.trigger === "hover" ? () => setRunKey((k) => k + 1) : undefined}
    >
      <span aria-hidden="true">{display}</span>
    </span>
  );
}

// ── 12. Marquee ──────────────────────────────────────────────────────────────
function Marquee({ text, c }) {
  const track = (
    <span className="fx-marquee-track" style={{ gap: c.gap }}>
      <span style={{ paddingRight: c.gap }}>{text}</span>
      <span style={{ paddingRight: c.gap }} aria-hidden="true">{text}</span>
    </span>
  );
  return (
    <span
      className={`fx-marquee ${c.direction === "right" ? "fx-marquee-r" : "fx-marquee-l"} ${c.pauseOnHover ? "fx-pause" : ""}`}
      style={{ "--fx-speed": `${c.speed}s` }}
      aria-label={String(text)}
    >
      {track}
    </span>
  );
}

// ── Dispatcher ───────────────────────────────────────────────────────────────
export function TextEffect({ effect = "none", config = {}, text = "", className = "", style, as: Tag = "span" }) {
  const reduced = usePrefersReducedMotion();
  const c = config || {};
  const value = String(text ?? "");
  const baseClass = `fx-text ${className}`.trim();

  if (effect === "none" || !value) {
    return <Tag className={className} style={style}>{value}</Tag>;
  }

  // Interactive / stateful effects
  if (effect === "typewriter") {
    return <Tag className={className} style={style}><Typewriter text={value} c={c} reduced={reduced} /></Tag>;
  }
  if (effect === "shuffle" || effect === "cipher") {
    const charset = effect === "shuffle" ? (c.charset || "!<>-_\\/[]{}—=+*^?#") : (c.symbols || "◆◇○●▲▼");
    return (
      <Tag className={className} style={{ color: c.color, ...style }}>
        <ScrambleText text={value} c={c} reduced={reduced} charset={charset} mode={effect === "cipher" ? c.direction : "left"} />
      </Tag>
    );
  }
  if (effect === "marquee") {
    return <Tag className={className} style={style}><Marquee text={value} c={c} /></Tag>;
  }

  // CSS-driven effects
  switch (effect) {
    case "fuzzy":
      return (
        <Tag
          className={baseClass}
          data-fx-text={value}
          style={{ "--fx-blur": `${c.intensity}px`, "--fx-speed": c.speed, "--fx-ca": c.colorA, "--fx-cb": c.colorB, color: "#fff", ...style }}
        >
          <span className="fx-fuzzy" style={{ display: "inline-block" }}>{value}</span>
        </Tag>
      );

    case "glitch":
      return (
        <Tag className={baseClass} style={style}>
          <span
            className="fx-glitch"
            data-fx-text={value}
            style={{ "--fx-i": c.intensity, "--fx-freq": Math.max(0.2, c.frequency), "--fx-ca": c.colorA, "--fx-cb": c.colorB }}
          >
            {value}
          </span>
        </Tag>
      );

    case "rgb_split":
      return (
        <Tag className={baseClass} style={style}>
          <span
            className={`fx-rgb ${c.animated ? "fx-rgb-animated" : ""}`}
            data-fx-text={value}
            style={{ "--fx-ox": `${c.offsetX}px`, "--fx-oy": `${c.offsetY}px` }}
          >
            {value}
          </span>
        </Tag>
      );

    case "glitch_lines":
      return (
        <Tag className={baseClass} style={style}>
          <span
            className="fx-glitch-lines"
            style={{ "--fx-th": `${c.thickness}px`, "--fx-op": c.opacity, "--fx-freq": Math.max(0.2, c.frequency), "--fx-color": c.color, "--fx-h": "1em" }}
          >
            {value}
            {Array.from({ length: Math.max(1, Math.round(c.count)) }).map((_, i) => (
              <span
                key={i}
                className="fx-band"
                style={{ top: `${(12 + i * (76 / Math.max(1, c.count))) }%`, animationDelay: `${(i * 0.37).toFixed(2)}s` }}
              />
            ))}
          </span>
        </Tag>
      );

    case "scanline":
      return (
        <Tag
          className={baseClass}
          style={{ "--fx-sp": `${c.spacing}px`, "--fx-op": c.opacity, "--fx-spd": c.speed ? `${c.speed}s` : "0s", color: c.color, ...style }}
        >
          <span className="fx-scanline" style={{ WebkitTextFillColor: c.color, backgroundAttachment: "local" }}>{value}</span>
        </Tag>
      );

    case "flicker":
      return (
        <Tag className={baseClass} style={style}>
          <span
            className={`fx-flicker ${c.mode === "irregular" ? "fx-flicker-irregular" : "fx-flicker-stable"}`}
            style={{ "--fx-color": c.color, "--fx-i": c.intensity, "--fx-freq": Math.max(0.2, c.frequency) }}
          >
            {value}
          </span>
        </Tag>
      );

    case "wave": {
      const dirClass = c.direction === "vertical" ? "fx-wave-v" : c.direction === "diagonal" ? "fx-wave-d" : "fx-wave-h";
      const wavelength = Math.max(0.2, c.wavelength);
      return (
        <Tag className={`${baseClass} ${dirClass}`} style={{ "--fx-amp": `${c.amplitude}px`, "--fx-speed": c.speed, ...style }}>
          <CharSpans text={value} styleFor={(_ch, i) => ({ animationDelay: `${(-(i * 0.12) / wavelength).toFixed(3)}s` })} />
        </Tag>
      );
    }

    case "jitter":
      return (
        <Tag className={`${baseClass} fx-jitter ${c.perChar ? "fx-jitter-alt" : ""}`} style={{ "--fx-i": `${c.intensity}px`, "--fx-freq": c.frequency, ...style }}>
          <CharSpans text={value} styleFor={(_ch, i) => ({ animationDelay: `${-(i * 0.18).toFixed(2)}s` })} />
        </Tag>
      );

    case "fade": {
      const dur = `${c.duration}s`;
      if (c.mode === "stagger") {
        return (
          <Tag className={`${baseClass} fx-fade-stagger`} style={{ "--fx-dur": dur, "--fx-ease": c.easing, ...style }}>
            <CharSpans text={value} styleFor={(_ch, i) => ({ animationDelay: `${(i * c.stagger).toFixed(3)}s` })} />
          </Tag>
        );
      }
      return (
        <Tag className={`${baseClass} ${c.mode === "out" ? "fx-fade-out" : "fx-fade-in"}`} style={{ "--fx-dur": dur, "--fx-ease": c.easing, ...style }}>
          {value}
        </Tag>
      );
    }

    case "letter_reveal": {
      const order = c.direction === "right" ? -1 : 1;
      const total = c.unit === "word" ? value.split(/\s+/).length : splitChars(value).length;
      return (
        <Tag className={`${baseClass} fx-letter-reveal`} style={{ "--fx-rise": `${c.rise}px`, ...style }}>
          {c.unit === "word" ? (
            <WordSpans
              text={value}
              styleFor={(_p, i) => ({ animationDelay: `${Math.max(0, (order > 0 ? i : total - i) * c.stagger).toFixed(3)}s` })}
            />
          ) : (
            <CharSpans text={value} styleFor={(_ch, i) => ({ animationDelay: `${Math.max(0, (order > 0 ? i : total - i) * c.stagger).toFixed(3)}s` })}
            />
          )}
        </Tag>
      );
    }

    case "blur_reveal":
      return c.stagger > 0 ? (
        <Tag className={`${baseClass} fx-blur-reveal-stagger`} style={{ "--fx-blur": `${c.blur}px`, "--fx-dur": `${c.duration}s`, ...style }}>
          <CharSpans text={value} styleFor={(_ch, i) => ({ animationDelay: `${(i * c.stagger).toFixed(3)}s` })} />
        </Tag>
      ) : (
        <Tag className={`${baseClass} fx-blur-reveal`} style={{ "--fx-blur": `${c.blur}px`, "--fx-dur": `${c.duration}s`, ...style }}>
          {value}
        </Tag>
      );

    case "pop":
      return (
        <Tag className={`${baseClass} fx-pop`} style={{ "--fx-scale": c.scale, "--fx-dur": `${c.duration}s`, ...style }}>
          {c.perChar ? <CharSpans text={value} styleFor={(_ch, i) => ({ animationDelay: `${(i * 0.05).toFixed(3)}s` })} /> : value}
        </Tag>
      );

    case "gradient": {
      const stops = [c.colorA, c.colorB, c.colorC].filter(Boolean).join(", ");
      return (
        <Tag
          className={baseClass}
          style={{
            backgroundImage: `linear-gradient(${c.angle}deg, ${stops})`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: c.fallback || "transparent",
            WebkitTextFillColor: "transparent",
            ...style,
          }}
        >
          {value}
        </Tag>
      );
    }

    case "animated_gradient": {
      const stops = [c.colorA, c.colorB, c.colorC].filter(Boolean).join(", ");
      const deg = c.direction === "vertical" ? "180deg" : c.direction === "diagonal" ? "135deg" : "90deg";
      return (
        <Tag
          className={`${baseClass} fx-anim-gradient`}
          style={{ "--fx-grad": `linear-gradient(${deg}, ${stops})`, "--fx-speed": `${c.speed}s`, "--fx-w": `${c.width}%`, ...style }}
        >
          {value}
        </Tag>
      );
    }

    case "neon":
      return (
        <Tag
          className={`${baseClass} fx-neon ${c.pulse ? "fx-neon-pulse" : ""}`}
          style={{ "--fx-color": c.color, "--fx-r": `${c.radius}px`, "--fx-speed": `${c.speed}s`, opacity: 0.4 + c.opacity * 0.6, ...style }}
        >
          {value}
        </Tag>
      );

    case "outline":
      return (
        <Tag
          className={baseClass}
          style={{
            WebkitTextStroke: `${c.thickness}px ${c.color}`,
            color: c.transparentFill ? "transparent" : c.fillColor,
            WebkitTextFillColor: c.transparentFill ? "transparent" : c.fillColor,
            ...style,
          }}
        >
          {value}
        </Tag>
      );

    case "double_shadow":
      return (
        <Tag
          className={baseClass}
          style={{
            color: "#ffffff",
            textShadow: `${c.offsetA}px ${c.offsetA}px ${c.blur}px ${c.colorA}, ${c.offsetB}px ${c.offsetB}px ${c.blur}px ${c.colorB}`,
            ...style,
          }}
        >
          {value}
        </Tag>
      );

    case "chrome":
      return (
        <Tag
          className={`${baseClass} fx-chrome ${c.animated ? "fx-chrome-animated" : ""}`}
          style={{ "--fx-light": c.light, "--fx-mid": c.mid, "--fx-dark": c.dark, "--fx-speed": `${c.speed}s`, ...style }}
        >
          {value}
        </Tag>
      );

    case "ghost":
      return (
        <Tag
          className={baseClass}
          style={{
            color: c.color,
            opacity: c.opacity,
            filter: c.blur > 0 ? `blur(${c.blur}px)` : undefined,
            textShadow: c.shadow > 0 ? `0 0 ${c.shadow}px rgba(255,255,255,0.35)` : undefined,
            ...style,
          }}
        >
          {value}
        </Tag>
      );

    case "crt":
      return (
        <Tag
          className={baseClass}
          style={{ fontFamily: c.font, color: c.color, textShadow: c.glow ? `0 0 ${c.glowRadius}px ${c.color}` : "none", ...style }}
        >
          <span className={c.scanlines ? "fx-crt-scan" : undefined} style={{ "--fx-sp": `${c.spacing}px`, WebkitTextFillColor: c.color }}>{value}</span>
        </Tag>
      );

    case "vhs":
      return (
        <Tag className={baseClass} style={style}>
          <span className="fx-vhs" style={{ "--fx-disp": `${c.displace}px`, "--fx-freq": Math.max(0.3, c.frequency) }}>
            <span className="fx-vhs-shift" style={{ textShadow: `${c.displace}px 0 ${c.colorA}, ${-c.displace}px 0 ${c.colorB}` }}>
              {value}
            </span>
            <span className="fx-vhs-noise" style={{ "--fx-noise": c.noise }} />
          </span>
        </Tag>
      );

    default:
      return <Tag className={className} style={style}>{value}</Tag>;
  }
}

export default TextEffect;
