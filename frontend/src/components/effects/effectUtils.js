import { useEffect, useState } from "react";

/** Live prefers-reduced-motion tracker. Every animated effect consults this. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return reduced;
}

/** True when the current device is touch-only (used to disable tilt/magnetic). */
export function useIsTouchDevice() {
  const [touch, setTouch] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(hover: none)").matches ?? "ontouchstart" in window;
  });
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(hover: none)");
    const onChange = () => setTouch(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return touch;
}

/** Clamp a numeric value. */
export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

/** Unicode-safe character split (keeps surrogate pairs together). */
export function splitChars(text) {
  return Array.from(String(text ?? ""));
}

/** Split into tokens that preserve whitespace so layout does not shift. */
export function splitWords(text) {
  return String(text ?? "").split(/(\s+)/).filter((part) => part.length > 0);
}

/** Convert a hex/rgb color + alpha into an rgba() string. */
export function withAlpha(color, alpha) {
  if (!color) return `rgba(255,255,255,${alpha})`;
  const hex = color.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(hex)) {
    let c = hex.slice(1);
    if (c.length === 3) c = c.split("").map((x) => x + x).join("");
    if (c.length === 8) c = c.slice(0, 6);
    const int = parseInt(c, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (/^rgba?\(/i.test(hex)) return hex.replace(/rgba?\(([^)]+)\)/i, (_m, body) => {
    const parts = body.split(",").map((p) => p.trim());
    return `rgba(${parts[0]},${parts[1]},${parts[2]},${alpha})`;
  });
  return hex;
}

/** Lighten/darken a hex color by an amount in [-1, 1]. */
export function shade(color, amount) {
  const hex = (color || "#888888").replace("#", "");
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex.slice(0, 6);
  const int = parseInt(full, 16);
  const mix = (channel) => {
    const v = amount >= 0 ? channel + (255 - channel) * amount : channel * (1 + amount);
    return clamp(Math.round(v), 0, 255);
  };
  const r = mix((int >> 16) & 255);
  const g = mix((int >> 8) & 255);
  const b = mix(int & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/** A tiny seeded PRNG so particle initial positions are stable per mount. */
export function makeRandom(seed = Math.random() * 10000) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** Shared fixed full-viewport layer for decorative effects. */
export const LAYER_STYLE = {
  position: "fixed",
  inset: 0,
  pointerEvents: "none",
  width: "100%",
  height: "100%",
};

/** Add + remove a class on <body> for a group of effects. */
export function useBodyClass(className, active) {
  useEffect(() => {
    if (!active || !className || typeof document === "undefined") return undefined;
    document.body.classList.add(className);
    return () => document.body.classList.remove(className);
  }, [className, active]);
}
