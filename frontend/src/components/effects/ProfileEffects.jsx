import React, { useEffect, useMemo, useRef } from "react";
import "./effects.css";
import { useIsTouchDevice, usePrefersReducedMotion, withAlpha } from "./effectUtils";

// ─────────────────────────────────────────────────────────────────────────────
// Card tilt — smoothed perspective rotation that follows the pointer
// ─────────────────────────────────────────────────────────────────────────────
export function useCardTilt(config = {}) {
  const reduced = usePrefersReducedMotion();
  const isTouch = useIsTouchDevice();
  const ref = useRef(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const hovered = useRef(false);
  const raf = useRef(0);
  const key = useMemo(() => JSON.stringify(config), [config]);

  const disabled = config.enabled === false || reduced || (config.disableOnTouch !== false && isTouch);

  useEffect(() => {
    if (disabled) {
      if (ref.current) ref.current.style.transform = "";
      return undefined;
    }
    const cfg = JSON.parse(key);
    const loop = () => {
      const s = Math.max(0.02, Math.min(1, cfg.smoothing ?? 0.16));
      current.current.x += (target.current.x - current.current.x) * s;
      current.current.y += (target.current.y - current.current.y) * s;
      const el = ref.current;
      if (el) {
        const max = cfg.maxTilt ?? 12;
        const persp = cfg.perspective ?? 1000;
        const rx = (-current.current.y * max).toFixed(2);
        const ry = (current.current.x * max).toFixed(2);
        const tx = cfg.shift !== false ? (current.current.x * max * 0.8).toFixed(2) : 0;
        const ty = cfg.shift !== false ? (current.current.y * max * 0.8).toFixed(2) : 0;
        const scale = hovered.current ? (cfg.scale ?? 1.015) : 1;
        el.style.transform = `perspective(${persp}px) rotateX(${rx}deg) rotateY(${ry}deg) translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
        if (cfg.glare) {
          el.style.setProperty("--fx-gx", `${(current.current.x + 0.5) * 100}%`);
          el.style.setProperty("--fx-gy", `${(current.current.y + 0.5) * 100}%`);
        }
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [disabled, key]);

  const onMouseMove = (e) => {
    if (disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    target.current = {
      x: Math.max(-1, Math.min(1, (e.clientX - rect.left) / rect.width - 0.5)) * 2,
      y: Math.max(-1, Math.min(1, (e.clientY - rect.top) / rect.height - 0.5)) * 2,
    };
  };

  const onMouseEnter = () => { hovered.current = true; };
  const onMouseLeave = () => {
    hovered.current = false;
    target.current = { x: 0, y: 0 };
  };

  return { tiltRef: ref, tiltHandlers: { onMouseMove, onMouseEnter, onMouseLeave }, tiltDisabled: disabled };
}

/** Overlay that renders the tilt "light sheen" when glare is enabled. */
export function TiltGlare({ config = {} }) {
  if (!config.glare) return null;
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "inherit",
        pointerEvents: "none",
        zIndex: 2,
        background: "radial-gradient(circle at var(--fx-gx, 50%) var(--fx-gy, 50%), rgba(255,255,255,0.16), transparent 55%)",
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile panel effects (border / entrance / surface)
// ─────────────────────────────────────────────────────────────────────────────
export function profilePanelClassName(effect = "none") {
  switch (effect) {
    case "fade_in": return "fx-entrance-fade";
    case "slide_up": return "fx-entrance-slide";
    case "scale_pop": return "fx-entrance-pop";
    case "border_pulse": return "fx-border-pulse";
    case "border_gradient": return "fx-border-ring";
    case "border_neon": return "fx-border-pulse";
    default: return "";
  }
}

export function profilePanelStyle(effect = "none", config = {}) {
  switch (effect) {
    case "fade_in":
      return { "--fx-dur": `${config.duration || 0.8}s` };
    case "slide_up":
      return { "--fx-dur": `${config.duration || 0.7}s`, "--fx-distance": `${config.distance || 36}px`, "--fx-delay": `${config.delay || 0}s` };
    case "scale_pop":
      return { "--fx-dur": `${config.duration || 0.5}s`, "--fx-scale": config.scale ?? 0.9 };
    case "border_pulse":
      return {
        borderColor: config.color,
        borderWidth: `${config.width || 1.5}px`,
        borderStyle: "solid",
        "--fx-glow": withAlpha(config.color || "#5B8DB8", config.pulse ?? 0.5),
        "--fx-speed": `${config.speed || 3}s`,
      };
    case "border_gradient":
      return {
        "--fx-bw": `${config.width || 2}px`,
        "--fx-c1": config.colorA,
        "--fx-c2": config.colorB,
        "--fx-c3": config.colorC || config.colorA,
        "--fx-speed": `${config.speed || 6}s`,
      };
    case "border_neon":
      return {
        borderColor: config.color,
        borderWidth: `${config.width || 1.5}px`,
        borderStyle: "solid",
        boxShadow: `0 0 ${config.glow || 22}px ${config.width || 1.5}px ${withAlpha(config.color || "#22d3ee", config.opacity ?? 0.7)}`,
        "--fx-glow": withAlpha(config.color || "#22d3ee", config.opacity ?? 0.7),
        "--fx-speed": "3s",
      };
    case "avatar_glow":
      return {};
    default:
      return {};
  }
}

/** Internal surface overlays for the panel (gradient / blur). */
export function ProfilePanelOverlays({ effect = "none", config = {} }) {
  if (effect === "panel_gradient") {
    return <div className="fx-panel-gradient" style={{ "--fx-angle": `${config.angle || 135}deg`, "--fx-c1": config.colorA, "--fx-c2": config.colorB, "--fx-opacity": config.opacity ?? 0.85 }} />;
  }
  if (effect === "panel_blur") {
    return <div className="fx-panel-blur" style={{ "--fx-blur": `${config.radius || 14}px`, "--fx-opacity": config.opacity ?? 0.55 }} />;
  }
  return null;
}

/** Avatar glow ring. Rendered inside the avatar container. */
export function AvatarGlow({ enabled, config = {}, color = "#7db5e3" }) {
  if (!enabled) return null;
  const c = config || {};
  return (
    <div
      aria-hidden="true"
      className={`fx-avatar-glow ${c.pulse ? "fx-avatar-glow-pulse" : ""}`}
      style={{ "--fx-color": c.color || color, "--fx-radius": `${c.radius ?? 24}px`, "--fx-intensity": c.intensity ?? 0.7 }}
    />
  );
}

/** Hover treatment classes + vars for interactive elements. */
export function hoverAttrs(hover = {}) {
  const classes = ["fx-hover"];
  const style = {};
  if (hover.glow) {
    classes.push("fx-hover-glow");
    style["--fx-glow"] = withAlpha(hover.glowColor || "#5B8DB8", hover.glowIntensity ?? 0.5);
  }
  if (hover.lift) {
    classes.push("fx-hover-lift");
    style["--fx-lift"] = `${hover.liftDistance ?? 5}px`;
  }
  if (hover.scale) {
    classes.push("fx-hover-scale");
    style["--fx-scale-h"] = hover.scaleAmount ?? 1.03;
  }
  return { className: classes.join(" "), style };
}

/** Social icon / badge glow helper (per spec items 96 & 97). */
export function glowIconAttrs(enabled, color) {
  if (!enabled) return {};
  return {
    className: "fx-hover fx-hover-glow",
    style: { "--fx-glow": withAlpha(color || "#5B8DB8", 0.6) },
  };
}

/** Wrapper that runs the entrance animation only once per mount. */
export function EntranceWrapper({ effect, config, children, className = "", style = {} }) {
  const cls = profilePanelClassName(effect);
  const s = profilePanelStyle(effect, config);
  return (
    <div className={`${cls} ${className}`.trim()} style={{ ...s, ...style }}>
      {children}
    </div>
  );
}
