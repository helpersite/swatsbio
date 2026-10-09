import React, { useEffect, useMemo, useRef } from "react";
import "./effects.css";
import { useIsTouchDevice, usePrefersReducedMotion } from "./effectUtils";

const PARTICLE_CAP = 900;

// ── Shape helpers ────────────────────────────────────────────────────────────
function starPath(ctx, x, y, spikes, outer, inner, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot + (Math.PI * i) / spikes - Math.PI / 2;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function fourPoint(ctx, x, y, s, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(0, 0, s, 0);
  ctx.quadraticCurveTo(0, 0, 0, s);
  ctx.quadraticCurveTo(0, 0, -s, 0);
  ctx.quadraticCurveTo(0, 0, 0, -s);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Full-screen cursor decoration layer.
 * Canvas handles the particle/drawing effects; DOM nodes handle URL cursors
 * and magnetically-attracted elements. All pointer handling is passive and
 * never intercepts clicks.
 */
export function CursorEffectsLayer({ effect = "none", config = {}, accent = "#5B8DB8", bound = false }) {
  const c = config || {};
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const reduced = usePrefersReducedMotion();
  const isTouch = useIsTouchDevice();
  const key = useMemo(() => JSON.stringify(c), [c]);

  const isCanvasEffect = !["none", "image", "animated", "magnetic"].includes(effect);

  // ── Canvas effects ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isCanvasEffect || effect === "none") return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    let raf = 0;
    let width = 0;
    let height = 0;

    const boxSize = () => {
      if (bound && canvas.parentElement) {
        return { w: canvas.parentElement.clientWidth, h: canvas.parentElement.clientHeight };
      }
      return { w: window.innerWidth, h: window.innerHeight };
    };
    const resize = () => {
      const { w, h } = boxSize();
      width = canvas.width = w;
      height = canvas.height = h;
    };
    resize();
    window.addEventListener("resize", resize);

    const pointer = { x: -9999, y: -9999, px: -9999, py: -9999, down: false, active: false };
    const particles = [];
    const trailPos = [];
    const rings = [];
    let hue = 0;
    let lastEmit = { x: 0, y: 0 };

    const color = c.color || accent;
    const size = c.size || 10;
    const spawnBlocked = reduced && ["trail", "particles", "sparkle", "star", "smoke", "fire", "rainbow", "emoji", "falling", "dots", "lines"].includes(effect);

    const push = (p) => {
      if (particles.length >= PARTICLE_CAP) particles.shift();
      particles.push(p);
    };

    const emit = (x, y) => {
      if (spawnBlocked) return;
      switch (effect) {
        case "particles": {
          const n = Math.max(1, Math.round(c.count || 2));
          for (let i = 0; i < n; i += 1) {
            push({
              kind: "dot",
              x, y,
              vx: (Math.random() - 0.5) * (c.spread || 4) * 0.4,
              vy: (Math.random() - 0.5) * (c.spread || 4) * 0.4,
              r: (c.size || 3) * (0.5 + Math.random() * 0.6),
              life: 1,
              decay: 1 / (60 * (c.life || 0.9)),
              color,
            });
          }
          break;
        }
        case "sparkle":
        case "star": {
          const n = Math.max(1, Math.round(c.density || 2));
          for (let i = 0; i < n; i += 1) {
            push({
              kind: effect,
              x: x + (Math.random() - 0.5) * 14,
              y: y + (Math.random() - 0.5) * 14,
              vx: (Math.random() - 0.5) * 0.6,
              vy: (Math.random() - 0.5) * 0.6,
              r: (c.size || 10) * (0.5 + Math.random() * 0.7),
              rot: Math.random() * Math.PI * 2,
              spin: (c.spin ?? 1) * (Math.random() - 0.5) * 0.12,
              life: 1,
              decay: 1 / (60 * (c.life || 0.8)),
              color,
            });
          }
          break;
        }
        case "smoke": {
          const n = Math.max(1, Math.round(c.density || 2));
          for (let i = 0; i < n; i += 1) {
            push({
              kind: "smoke",
              x: x + (Math.random() - 0.5) * 10,
              y: y + (Math.random() - 0.5) * 10,
              vx: (c.drift ?? -0.4) * (0.5 + Math.random()),
              vy: -0.2 - Math.random() * 0.4,
              r: (c.size || 22) * 0.4,
              grow: 0.5 + Math.random() * 0.6,
              rot: Math.random() * Math.PI,
              life: 1,
              decay: 1 / (60 * (c.life || 1.4)),
              color,
            });
          }
          break;
        }
        case "fire": {
          const n = Math.max(1, Math.round(c.density || 3));
          for (let i = 0; i < n; i += 1) {
            push({
              kind: "fire",
              x: x + (Math.random() - 0.5) * 10,
              y: y + (Math.random() - 0.5) * 6,
              vx: (Math.random() - 0.5) * 0.8,
              vy: -(c.rise || 1.4) * (0.6 + Math.random() * 0.8),
              r: (c.size || 6) * (0.5 + Math.random() * 0.8),
              life: 1,
              decay: 1 / (60 * (c.life || 0.9)),
              color: i % 3 === 0 ? (c.color || "#f97316") : color,
            });
          }
          break;
        }
        case "emoji": {
          const syms = String(c.symbols || "✦,❖,☾,✿").split(",").map((s) => s.trim()).filter(Boolean);
          const n = Math.max(1, Math.round(c.density || 2));
          for (let i = 0; i < n; i += 1) {
            push({
              kind: "text",
              text: syms[Math.floor(Math.random() * syms.length)] || "✦",
              x: x + (Math.random() - 0.5) * 16,
              y: y + (Math.random() - 0.5) * 16,
              vx: (Math.random() - 0.5) * 0.8,
              vy: (Math.random() - 0.5) * 0.8,
              r: (c.size || 22) * (0.6 + Math.random() * 0.5),
              rot: (Math.random() - 0.5) * 0.6,
              spin: (Math.random() - 0.5) * 0.02,
              life: 1,
              decay: 1 / (60 * (c.life || 1)),
              color,
            });
          }
          break;
        }
        case "falling": {
          const n = Math.max(1, Math.round(c.density || 2));
          for (let i = 0; i < n; i += 1) {
            push({
              kind: "fall",
              x: x + (Math.random() - 0.5) * 18,
              y,
              vx: (Math.random() - 0.5) * 1.4,
              vy: Math.random() * 0.6,
              g: (c.gravity || 1.6) * 0.06,
              r: (c.size || 4) * (0.6 + Math.random() * 0.7),
              life: 1,
              decay: 1 / (60 * (c.life || 1.6)),
              color,
            });
          }
          break;
        }
        default:
          break;
      }
    };

    const onMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      pointer.px = pointer.x;
      pointer.py = pointer.y;
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;

      if (effect === "trail" || effect === "rainbow" || effect === "lines" || effect === "dots") {
        if (spawnBlocked) return;
        if (effect === "dots") {
          trailPos.unshift({ x, y });
          if (trailPos.length > 80) trailPos.pop();
          return;
        }
        const dx = x - (lastEmit.x || x);
        const dy = y - (lastEmit.y || y);
        if (effect === "lines" || Math.hypot(dx, dy) > 2) {
          trailPos.unshift({ x, y, life: 1 });
          const max = effect === "lines" ? (c.length || 24) : (c.length || 22);
          if (trailPos.length > max * 3) trailPos.length = max * 3;
          lastEmit = { x, y };
        }
        return;
      }

      if (effect === "ripple_move") {
        const dx = x - (lastEmit.x || x);
        const dy = y - (lastEmit.y || y);
        if (Math.hypot(dx, dy) > (c.spacing || 90)) {
          rings.push({ x, y, r: 0, max: c.radius || 48, life: 1, color: c.color || accent, w: 2 });
          lastEmit = { x, y };
        }
        return;
      }

      emit(x, y);
    };

    const onDown = (e) => {
      pointer.down = true;
      const x = e.clientX;
      const y = e.clientY;
      if (effect === "ripple_click") {
        rings.push({ x, y, r: 0, max: c.radius || 90, life: 1, color: c.color || "#38bdf8", w: 2 });
      }
      if (!spawnBlocked) {
        // burst variants
        if (effect === "particles" || effect === "sparkle" || effect === "star") {
          for (let i = 0; i < 14; i += 1) {
            const a = (Math.PI * 2 * i) / 14;
            push({
              kind: effect === "particles" ? "dot" : effect,
              x, y,
              vx: Math.cos(a) * 3,
              vy: Math.sin(a) * 3,
              r: (c.size || 10) * 0.7,
              rot: Math.random() * Math.PI,
              spin: 0.14,
              life: 1,
              decay: 1 / 45,
              color,
            });
          }
        }
      }
    };

    const onUp = () => { pointer.down = false; };
    const onLeave = () => { pointer.active = false; pointer.x = -9999; pointer.y = -9999; };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown, { passive: true });
    window.addEventListener("mouseup", onUp, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("touchmove", (e) => {
      const t = e.touches?.[0];
      if (t) onMove({ clientX: t.clientX, clientY: t.clientY });
    }, { passive: true });

    let smoothX = pointer.x;
    let smoothY = pointer.y;

    const frame = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (bound && canvas.parentElement) {
        const r = canvas.parentElement.getBoundingClientRect();
        ctx.setTransform(1, 0, 0, 1, -r.left, -r.top);
      }
      hue = (hue + (c.speed || 1.5)) % 360;

      const follow = Math.max(0.05, Math.min(1, c.follow ?? 0.35));
      smoothX += (pointer.x - smoothX) * follow;
      smoothY += (pointer.y - smoothY) * follow;
      const sx = reduced ? pointer.x : smoothX;
      const sy = reduced ? pointer.y : smoothY;

      if (pointer.active && pointer.x > -9000) {
        if (effect === "glow") {
          const rad = c.radius || 110;
          const g = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, rad);
          g.addColorStop(0, color);
          g.addColorStop(0.35, c.color ? `${c.color}` : accent);
          g.addColorStop(1, "transparent");
          ctx.globalAlpha = c.opacity ?? 0.4;
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(pointer.x, pointer.y, rad, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        if (effect === "ring") {
          const base = c.radius || 28;
          const pulse = reduced ? 0 : Math.sin(performance.now() / 500) * (c.pulse || 12);
          ctx.strokeStyle = c.color || accent;
          ctx.lineWidth = c.thickness || 1.6;
          ctx.shadowColor = c.color || accent;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(pointer.x, pointer.y, Math.max(4, base + pulse), 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        if (effect === "crosshair") {
          const arm = c.length || 16;
          const gap = c.gap ?? 5;
          const col = c.color || accent;
          ctx.strokeStyle = col;
          ctx.lineWidth = c.thickness || 1.5;
          ctx.shadowColor = col;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(pointer.x, pointer.y - gap); ctx.lineTo(pointer.x, pointer.y - gap - arm);
          ctx.moveTo(pointer.x, pointer.y + gap); ctx.lineTo(pointer.x, pointer.y + gap + arm);
          ctx.moveTo(pointer.x - gap, pointer.y); ctx.lineTo(pointer.x - gap - arm, pointer.y);
          ctx.moveTo(pointer.x + gap, pointer.y); ctx.lineTo(pointer.x + gap + arm, pointer.y);
          ctx.stroke();
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(pointer.x, pointer.y, 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        if (effect === "neon") {
          const rad = c.radius || 40;
          const halo = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, rad);
          halo.addColorStop(0, c.color || "#22d3ee");
          halo.addColorStop(0.6, `${(c.color || "#22d3ee")}55`);
          halo.addColorStop(1, "transparent");
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(pointer.x, pointer.y, rad, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = c.core || "#ffffff";
          ctx.beginPath();
          ctx.arc(pointer.x, pointer.y, c.thickness || 4, 0, Math.PI * 2);
          ctx.fill();
        }

        if (effect === "pixel") {
          ctx.imageSmoothingEnabled = false;
          const s = Math.max(2, Math.round((c.size || 22) / 8));
          const col = c.color || accent;
          const ox = pointer.x;
          const oy = pointer.y;
          const map = c.shape === "cross" ? [["0,0", "±"]] : [];
          ctx.fillStyle = col;
          if (c.shape === "square") {
            ctx.fillRect(ox - s * 2, oy - s * 2, s * 4, s * 4);
            ctx.fillStyle = "#fff";
            ctx.fillRect(ox - s, oy - s, s * 2, s * 2);
          } else if (c.shape === "cross") {
            ctx.fillRect(ox - s * 4, oy - s / 2, s * 8, s);
            ctx.fillRect(ox - s / 2, oy - s * 4, s, s * 8);
          } else {
            // pixel arrow
            ctx.beginPath();
            ctx.moveTo(ox, oy);
            ctx.lineTo(ox, oy + s * 6);
            ctx.lineTo(ox + s * 1.5, oy + s * 4.5);
            ctx.lineTo(ox + s * 3, oy + s * 7.5);
            ctx.lineTo(ox + s * 4.5, oy + s * 6.5);
            ctx.lineTo(ox + s * 3, oy + s * 3.5);
            ctx.lineTo(ox + s * 5, oy + s * 3);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
          ctx.imageSmoothingEnabled = true;
          void map;
        }
      }

      // ── Trail-type effects ──
      if (["trail", "rainbow", "lines", "dots"].includes(effect)) {
        if (effect === "dots") {
          const n = Math.max(2, Math.round(c.count || 5));
          ctx.fillStyle = c.color || accent;
          for (let i = 0; i < n; i += 1) {
            const p = trailPos[Math.round(i * (c.spacing ? 1 + i : 6))] || trailPos[i * 6];
            if (!p) continue;
            const r = (c.size || 6) * (1 - i / (n + 1));
            ctx.globalAlpha = 1 - i / n;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(1, r), 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        } else if (effect === "lines") {
          if (trailPos.length > 1) {
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            for (let i = 0; i < trailPos.length - 1; i += 1) {
              const t = 1 - i / trailPos.length;
              ctx.strokeStyle = c.color || "#38bdf8";
              ctx.globalAlpha = Math.pow(t, 1.6) * (c.fade ?? 0.5);
              ctx.lineWidth = Math.max(0.5, (c.width || 2.4) * t);
              ctx.beginPath();
              ctx.moveTo(trailPos[i].x, trailPos[i].y);
              ctx.lineTo(trailPos[i + 1].x, trailPos[i + 1].y);
              ctx.stroke();
            }
            ctx.globalAlpha = 1;
          }
        } else {
          trailPos.forEach((p, i) => {
            const t = 1 - i / trailPos.length;
            const col = effect === "rainbow"
              ? (c.mode === "fixed" ? `hsl(${(i * 18) % 360},90%,62%)` : `hsl(${(hue + i * 12) % 360},90%,62%)`)
              : (c.color || accent);
            ctx.globalAlpha = Math.pow(t, 1.4) * 0.9;
            ctx.fillStyle = col;
            ctx.shadowColor = col;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.5, (c.size || 8) * t), 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
        }
        if (effect === "lines" && trailPos.length > (c.length || 24)) trailPos.length = c.length || 24;
        if (effect === "trail" || effect === "rainbow") {
          if (trailPos.length > (c.length || 22)) trailPos.length = c.length || 22;
        }
      }

      // ── Particle update/draw ──
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.kind === "fall") p.vy += p.g;
        p.rot = (p.rot || 0) + (p.spin || 0);
        if (p.grow) p.r += p.grow * 0.6;
        p.life -= p.decay;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
        if (p.kind === "smoke") {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          g.addColorStop(0, `${p.color}66`);
          g.addColorStop(1, "transparent");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === "fire") {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          g.addColorStop(0, "#fff6cc");
          g.addColorStop(0.5, p.color);
          g.addColorStop(1, "transparent");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === "text") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot || 0);
          ctx.font = `${p.r}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#fff";
          ctx.fillText(p.text, 0, 0);
          ctx.restore();
        } else if (p.kind === "sparkle") {
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 12;
          fourPoint(ctx, p.x, p.y, p.r * (0.5 + p.life * 0.6), p.rot);
          ctx.shadowBlur = 0;
        } else if (p.kind === "star") {
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 12;
          starPath(ctx, p.x, p.y, 5, p.r * (0.5 + p.life * 0.6), p.r * 0.42 * (0.5 + p.life * 0.6), p.rot);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.6, p.r), 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      ctx.globalAlpha = 1;

      // ── Rings ──
      for (let i = rings.length - 1; i >= 0; i -= 1) {
        const r = rings[i];
        r.r += r.max / 26;
        r.life -= 1 / 26;
        if (r.life <= 0) {
          rings.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(0, r.life) * (effect === "ripple_move" ? (c.opacity ?? 0.5) : (c.opacity ?? 0.6));
        ctx.strokeStyle = r.color;
        ctx.lineWidth = r.w;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mouseleave", onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effect, key, accent, reduced, isCanvasEffect, bound]);

  // ── URL image cursor ──────────────────────────────────────────────────────
  useEffect(() => {
    if (effect !== "image" && effect !== "animated") return undefined;
    const node = imgRef.current;
    if (!node || !c.url) return undefined;
    let raf = 0;
    let tx = -9999;
    let ty = -9999;
    let x = tx;
    let y = ty;
    const onMove = (e) => { tx = e.clientX; ty = e.clientY; };
    window.addEventListener("mousemove", onMove, { passive: true });
    const loop = () => {
      x += (tx - x) * 0.4;
      y += (ty - y) * 0.4;
      node.style.transform = `translate(${x}px, ${y}px) translate(-${effect === "image" ? (c.hotspotX ?? 50) : 50}%, -${effect === "image" ? (c.hotspotY ?? 50) : 50}%)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
    };
  }, [effect, key, c.url]);

  // ── Magnetic hover targets ────────────────────────────────────────────────
  useEffect(() => {
    if (effect !== "magnetic" || isTouch) return undefined;
    let raf = 0;
    const selector = c.selector || "[data-magnetic]";
    let nodes = [];
    const scopeRoot = bound && canvasRef.current?.parentElement ? canvasRef.current.parentElement : document;
    const collect = () => { nodes = Array.from(scopeRoot.querySelectorAll(selector)); };
    collect();
    const mo = new MutationObserver(collect);
    mo.observe(document.body, { childList: true, subtree: true });

    const pointer = { x: -9999, y: -9999 };
    const onMove = (e) => { pointer.x = e.clientX; pointer.y = e.clientY; };
    window.addEventListener("mousemove", onMove, { passive: true });

    const loop = () => {
      const limit = c.limit || 12;
      const strength = c.strength ?? 0.22;
      nodes.forEach((node) => {
        const r = node.getBoundingClientRect();
        if (r.width === 0) return;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = pointer.x - cx;
        const dy = pointer.y - cy;
        const dist = Math.hypot(dx, dy);
        const range = Math.max(r.width, r.height) * 1.1;
        if (dist < range) {
          const f = (1 - dist / range);
          const mx = Math.max(-limit, Math.min(limit, dx * strength * f));
          const my = Math.max(-limit, Math.min(limit, dy * strength * f));
          node.style.transform = `translate3d(${mx.toFixed(2)}px, ${my.toFixed(2)}px, 0)`;
        } else if (node.style.transform) {
          node.style.transform = "";
        }
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      window.removeEventListener("mousemove", onMove);
      nodes.forEach((node) => { node.style.transform = ""; });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effect, key, isTouch, bound]);

  if (effect === "none") return null;

  return (
    <>
      {isCanvasEffect && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none"
          style={{
            position: bound ? "absolute" : "fixed",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: bound ? 5 : 9999,
            touchAction: "none",
          }}
        />
      )}
      {(effect === "image" || effect === "animated") && c.url && !reduced && (
        <img
          ref={imgRef}
          src={c.url}
          alt=""
          aria-hidden="true"
          className="fx-cursor-img"
          style={{
            width: effect === "image" ? (c.size || 32) : (c.size || 48),
            height: "auto",
            imageRendering: c.pixelated ? "pixelated" : undefined,
            [effect === "image" ? "--x" : "--y"]: 0,
          }}
        />
      )}
    </>
  );
}

export default CursorEffectsLayer;
