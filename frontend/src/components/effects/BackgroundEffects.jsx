import React, { useEffect, useMemo, useRef } from "react";
import "./effects.css";
import { makeRandom, usePrefersReducedMotion, withAlpha } from "./effectUtils";

// Effects rendered on a shared 2D canvas.
const CANVAS_EFFECTS = new Set([
  "plasma", "waves", "geometric", "particles", "network", "starfield",
  "snow", "rain", "dust", "bubbles", "fireflies", "symbols",
  "particle_waves", "falling_code",
]);

// Effects rendered purely with CSS layers.
const CSS_EFFECTS = new Set([
  "aurora", "mesh", "fluid", "floating_gradients", "gradient", "dither",
  "dither_texture", "scanlines", "crt", "static", "glitch", "pixel_grid",
  "moving_grid", "light_streaks", "light_rays", "fog", "vignette", "blur",
  "glow_haze", "neon_halo", "pulsing_glow", "vhs",
]);

const bgLayer = { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, overflow: "hidden" };

// ─────────────────────────────────────────────────────────────────────────────
// Canvas renderer
// ─────────────────────────────────────────────────────────────────────────────
function CanvasBackground({ effect, c, reduced }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    let raf = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const rand = makeRandom(effect.length * 137 + 11);
    const color = c.color || "#cbd5e1";
    const speed = c.speed ?? 0.4;
    let t = 0;
    let data = null;

    // ── init per effect ──
    const init = () => {
      switch (effect) {
        case "plasma":
          data = { cols: 64, rows: 36 };
          break;
        case "waves": {
          const layers = Math.max(1, Math.round(c.layers || 3));
          data = { waves: Array.from({ length: layers }, (_, i) => ({ phase: rand() * Math.PI * 2, off: i })) };
          break;
        }
        case "geometric": {
          const n = Math.max(4, Math.round(c.count || 18));
          data = {
            shapes: Array.from({ length: n }, () => ({
              x: rand() * width, y: rand() * height,
              vx: (rand() - 0.5) * speed * 1.4, vy: (rand() - 0.5) * speed * 1.4,
              r: (c.scale || 26) * (0.4 + rand() * 0.9), rot: rand() * Math.PI * 2,
              rotV: (rand() - 0.5) * 0.01,
            })),
          };
          break;
        }
        case "particles":
        case "dust":
        case "fireflies":
        case "symbols": {
          const n = Math.min(400, Math.max(10, Math.round(c.count || (effect === "dust" ? 130 : effect === "fireflies" ? 32 : effect === "symbols" ? 30 : 90))));
          const syms = String(c.symbols || "✦ ❖ ☾ ✿ ◈ ✧").split(/\s+/).filter(Boolean);
          data = {
            dots: Array.from({ length: n }, () => ({
              x: rand() * width, y: rand() * height,
              vx: (rand() - 0.5) * speed, vy: (rand() - 0.5) * speed,
              r: (c.size || 2) * (0.4 + rand()),
              depth: 0.3 + rand() * 0.7,
              phase: rand() * Math.PI * 2,
              sym: syms[Math.floor(rand() * syms.length)] || "✦",
            })),
          };
          break;
        }
        case "network": {
          const n = Math.min(180, Math.max(10, Math.round(c.count || 55)));
          data = {
            dots: Array.from({ length: n }, () => ({
              x: rand() * width, y: rand() * height,
              vx: (rand() - 0.5) * speed, vy: (rand() - 0.5) * speed,
            })),
          };
          break;
        }
        case "starfield": {
          const n = Math.min(450, Math.max(20, Math.round(c.density || 160)));
          data = {
            dots: Array.from({ length: n }, () => {
              const x = rand() * width;
              const y = rand() * height;
              return { x, y, r: (c.size || 1.3) * (0.4 + rand()), base: 0.4 + rand() * 0.6 };
            }),
          };
          break;
        }
        case "snow":
        case "rain": {
          const n = Math.min(450, Math.max(20, Math.round(c.count || (effect === "rain" ? 120 : 150))));
          data = {
            drops: Array.from({ length: n }, () => ({
              x: rand() * width, y: rand() * height,
              vy: (c.speed || (effect === "rain" ? 12 : 1)) * (0.7 + rand() * 0.6),
              drift: (c.drift || 0.4) * (rand() - 0.5) * 2,
              r: (c.size || 1.6) * (0.5 + rand()),
              len: (c.length || 18) * (0.6 + rand() * 0.8),
              o: 0.4 + rand() * 0.5,
            })),
          };
          break;
        }
        case "bubbles": {
          const n = Math.min(140, Math.max(5, Math.round(c.count || 26)));
          data = {
            bubbles: Array.from({ length: n }, () => ({
              x: rand() * width, y: rand() * height,
              r: (c.size || 22) * (0.3 + rand() * 0.8),
              vy: (c.speed || 0.7) * (0.5 + rand()),
              sway: rand() * Math.PI * 2,
            })),
          };
          break;
        }
        case "particle_waves": {
          const n = Math.min(180, Math.max(10, Math.round(c.count || 54)));
          data = {
            dots: Array.from({ length: n }, (_, i) => ({ x: i * (c.spacing || 18), phase: (i / n) * Math.PI * 2 })),
          };
          break;
        }
        case "falling_code": {
          const cols = Math.min(180, Math.max(10, Math.round(c.density || 46)));
          const chars = Array.from(String(c.charset || "01アイウエオカキクケコ"));
          data = {
            size: c.size || 15,
            cols: Array.from({ length: cols }, () => ({
              x: Math.floor((rand() * width) / (c.size || 15)) * (c.size || 15),
              y: rand() * height,
              vy: (c.speed || 1.4) * (0.5 + rand()),
              chars: Array.from({ length: 8 + Math.floor(rand() * 14) }, () => chars[Math.floor(rand() * chars.length)]),
            })),
          };
          break;
        }
        default:
          data = {};
      }
    };
    init();

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      t += 0.016 * Math.max(0.05, speed);

      switch (effect) {
        case "plasma": {
          const { cols, rows } = data;
          const cw = width / cols;
          const ch = height / rows;
          for (let y = 0; y < rows; y += 1) {
            for (let x = 0; x < cols; x += 1) {
              const v = Math.sin(x * 0.18 + t) + Math.sin(y * 0.22 - t * 1.2) + Math.sin((x + y) * 0.12 + t * 0.7);
              const hue = (v + 3) / 6 * 360;
              ctx.fillStyle = `hsla(${(hue + 180) % 360}, 80%, 55%, ${(c.intensity ?? 0.6) * 0.35})`;
              ctx.fillRect(x * cw, y * ch, cw + 1, ch + 1);
            }
          }
          break;
        }
        case "waves": {
          const amp = c.amplitude || 34;
          const freq = c.frequency || 0.008;
          ctx.lineWidth = 2;
          data.waves.forEach((w, i) => {
            ctx.beginPath();
            const mid = height * (0.35 + i * 0.14);
            for (let x = 0; x <= width; x += 8) {
              const y = mid + Math.sin(x * freq + t * 2 + w.phase) * amp;
              if (x === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            const grad = ctx.createLinearGradient(0, mid - amp, 0, mid + amp);
            grad.addColorStop(0, withAlpha(color, (c.opacity ?? 0.28) * 0.2));
            grad.addColorStop(1, withAlpha(color, c.opacity ?? 0.28));
            ctx.strokeStyle = grad;
            ctx.stroke();
          });
          break;
        }
        case "geometric": {
          ctx.strokeStyle = withAlpha(color, c.opacity ?? 0.16);
          ctx.fillStyle = withAlpha(color, c.opacity ?? 0.16);
          ctx.lineWidth = 1.5;
          data.shapes.forEach((s) => {
            s.x += s.vx; s.y += s.vy; s.rot += s.rotV;
            if (s.x < -s.r) s.x = width + s.r;
            if (s.x > width + s.r) s.x = -s.r;
            if (s.y < -s.r) s.y = height + s.r;
            if (s.y > height + s.r) s.y = -s.r;
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(s.rot);
            if (c.shape === "triangle") {
              ctx.beginPath();
              ctx.moveTo(0, -s.r);
              ctx.lineTo(s.r, s.r);
              ctx.lineTo(-s.r, s.r);
              ctx.closePath();
              ctx.stroke();
            } else if (c.shape === "polygon") {
              const sides = 6;
              ctx.beginPath();
              for (let i = 0; i < sides; i += 1) {
                const a = (Math.PI * 2 * i) / sides;
                const px = Math.cos(a) * s.r;
                const py = Math.sin(a) * s.r;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
              }
              ctx.closePath();
              ctx.stroke();
            } else if (c.shape === "line") {
              ctx.beginPath();
              ctx.moveTo(-s.r, 0);
              ctx.lineTo(s.r, 0);
              ctx.stroke();
            } else {
              ctx.beginPath();
              ctx.arc(0, 0, s.r * 0.5, 0, Math.PI * 2);
              ctx.stroke();
            }
            ctx.restore();
          });
          break;
        }
        case "particles":
        case "dust":
        case "fireflies":
        case "symbols": {
          data.dots.forEach((d) => {
            d.x += d.vx; d.y += d.vy; d.phase += 0.02;
            if (d.x < 0) d.x = width; if (d.x > width) d.x = 0;
            if (d.y < 0) d.y = height; if (d.y > height) d.y = 0;
            if (effect === "fireflies") {
              const glow = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, c.glow || 18);
              const a = (0.4 + 0.6 * (0.5 + Math.sin(d.phase) * 0.5)) * 0.8;
              glow.addColorStop(0, withAlpha(color, a));
              glow.addColorStop(1, "transparent");
              ctx.fillStyle = glow;
              ctx.beginPath();
              ctx.arc(d.x, d.y, c.glow || 18, 0, Math.PI * 2);
              ctx.fill();
            } else if (effect === "symbols") {
              ctx.globalAlpha = (c.opacity ?? 0.14) * d.depth;
              ctx.fillStyle = color;
              ctx.font = `${d.r * 8}px serif`;
              ctx.fillText(d.sym, d.x, d.y);
              ctx.globalAlpha = 1;
            } else {
              ctx.globalAlpha = (effect === "dust" ? (c.opacity ?? 0.16) : (c.opacity ?? 0.5)) * d.depth;
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(d.x, d.y, d.r * (c.depth ? d.depth : 1), 0, Math.PI * 2);
              ctx.fill();
              ctx.globalAlpha = 1;
            }
          });
          break;
        }
        case "network": {
          const maxDist = c.distance || 120;
          data.dots.forEach((d) => {
            d.x += d.vx; d.y += d.vy;
            if (d.x < 0 || d.x > width) d.vx *= -1;
            if (d.y < 0 || d.y > height) d.vy *= -1;
          });
          ctx.strokeStyle = withAlpha(color, c.opacity ?? 0.16);
          ctx.fillStyle = withAlpha(color, 0.6);
          for (let i = 0; i < data.dots.length; i += 1) {
            const a = data.dots[i];
            for (let j = i + 1; j < data.dots.length; j += 1) {
              const b = data.dots[j];
              const dx = a.x - b.x;
              const dy = a.y - b.y;
              const dist = Math.hypot(dx, dy);
              if (dist < maxDist) {
                ctx.globalAlpha = (1 - dist / maxDist) * 0.9;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
              }
            }
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(a.x, a.y, 1.6, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
        case "starfield": {
          const cx = width / 2;
          const cy = height / 2;
          data.dots.forEach((d) => {
            if (c.warp) {
              const dx = d.x - cx;
              const dy = d.y - cy;
              const k = 1 + (c.speed || 0.5) * 0.004 * (d.base + 0.4);
              d.x = cx + dx * k;
              d.y = cy + dy * k;
              if (d.x < 0 || d.x > width || d.y < 0 || d.y > height) {
                const a = Math.random() * Math.PI * 2;
                const r = Math.random() * 10;
                d.x = cx + Math.cos(a) * r;
                d.y = cy + Math.sin(a) * r;
              }
            } else {
              d.y += (c.speed || 0.5) * 0.1;
              if (d.y > height) d.y = 0;
            }
            ctx.globalAlpha = d.base;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.globalAlpha = 1;
          break;
        }
        case "snow":
        case "rain": {
          ctx.strokeStyle = withAlpha(color, c.opacity ?? 0.4);
          ctx.fillStyle = withAlpha(color, 0.85);
          data.drops.forEach((d) => {
            d.y += d.vy;
            d.x += d.drift;
            if (d.y > height + d.len) {
              d.y = -d.len;
              d.x = Math.random() * width;
            }
            if (d.x < 0) d.x = width;
            if (d.x > width) d.x = 0;
            if (effect === "rain") {
              ctx.globalAlpha = d.o * (c.opacity ?? 0.4);
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.moveTo(d.x, d.y);
              ctx.lineTo(d.x + d.drift * 2, d.y + d.len);
              ctx.stroke();
            } else {
              ctx.globalAlpha = d.o * 0.9;
              ctx.beginPath();
              ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
              ctx.fill();
            }
          });
          ctx.globalAlpha = 1;
          break;
        }
        case "bubbles": {
          data.bubbles.forEach((b) => {
            b.y -= b.vy;
            b.sway += 0.02;
            if (b.y < -b.r) {
              b.y = height + b.r;
              b.x = Math.random() * width;
            }
            const bx = b.x + Math.sin(b.sway) * 8;
            ctx.strokeStyle = withAlpha(color, c.opacity ?? 0.25);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(bx, b.y, b.r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = withAlpha("#ffffff", (c.opacity ?? 0.25) * 0.8);
            ctx.beginPath();
            ctx.arc(bx - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.18, 0, Math.PI * 2);
            ctx.fill();
          });
          break;
        }
        case "particle_waves": {
          ctx.fillStyle = withAlpha(color, 0.8);
          data.dots.forEach((d) => {
            d.phase += 0.03 * (c.speed || 1.2);
            const y = height / 2 + Math.sin(d.phase) * (c.height || 34);
            ctx.beginPath();
            ctx.arc(d.x, y, 2, 0, Math.PI * 2);
            ctx.fill();
          });
          break;
        }
        case "falling_code": {
          const { size } = data;
          ctx.font = `${size}px monospace`;
          data.cols.forEach((col) => {
            col.y += col.vy;
            if (col.y - col.chars.length * size > height) {
              col.y = -size * 4;
              col.x = Math.random() * width;
            }
            col.chars.forEach((ch, i) => {
              const y = col.y - i * size;
              ctx.fillStyle = withAlpha(color, (c.opacity ?? 0.4) * (1 - i / col.chars.length));
              if (i === 0) ctx.fillStyle = withAlpha("#ffffff", Math.min(1, (c.opacity ?? 0.4) + 0.35));
              ctx.fillText(ch, col.x, y);
            });
          });
          break;
        }
        default:
          break;
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effect, JSON.stringify(c), reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS renderer
// ─────────────────────────────────────────────────────────────────────────────
function CssBackground({ effect, c }) {
  const color = c.color || "#5B8DB8";
  const rand = useMemo(() => makeRandom(effect.length * 71 + 3), [effect]);

  switch (effect) {
    case "aurora": {
      const cols = [c.colorA, c.colorB, c.colorC].filter(Boolean);
      return (
        <div style={{ ...bgLayer }}>
          {cols.map((col, i) => (
            <div
              key={i}
              className="fx-aurora-band"
              style={{
                top: `${10 + i * 22}%`,
                height: `${52 + i * 6}%`,
                background: `radial-gradient(60% 100% at 50% 50%, ${withAlpha(col, c.opacity ?? 0.55)}, transparent 70%)`,
                "--fx-blur": `${c.blur || 70}px`,
                animation: `fx-blob-${["a", "b", "c"][i % 3]} ${(18 / Math.max(0.1, c.speed || 0.6)).toFixed(1)}s ease-in-out ${i * 2}s infinite`,
              }}
            />
          ))}
        </div>
      );
    }

    case "mesh":
    case "fluid":
    case "floating_gradients": {
      const palette = effect === "fluid"
        ? [c.colorA, c.colorB]
        : effect === "mesh"
          ? [c.colorA, c.colorB, c.colorC, c.colorD].filter(Boolean)
          : [c.colorA, c.colorB];
      const count = effect === "floating_gradients" ? Math.max(2, Math.round(c.count || 5)) : palette.length * 2;
      const blobs = Array.from({ length: count }, (_, i) => {
        const col = palette[i % palette.length];
        const sizePct = effect === "floating_gradients" ? (c.size || 42) * (0.6 + rand() * 0.8) : 42 + rand() * 30;
        return (
          <div
            key={i}
            className="fx-blob"
            style={{
              left: `${rand() * 90 - 10}%`,
              top: `${rand() * 90 - 10}%`,
              width: `${sizePct}%`,
              height: `${sizePct}%`,
              background: `radial-gradient(circle, ${col}, transparent 70%)`,
              "--fx-blur": `${c.blur || (effect === "fluid" ? 90 : 80)}px`,
              opacity: effect === "fluid" ? (c.intensity ?? 0.5) : 0.7,
              animation: `fx-blob-${["a", "b", "c"][i % 3]} ${(22 / Math.max(0.05, c.speed || 0.4)).toFixed(1)}s ease-in-out ${(i * 1.3).toFixed(1)}s infinite`,
            }}
          />
        );
      });
      return <div style={bgLayer}>{blobs}</div>;
    }

    case "gradient":
      return (
        <div
          style={{
            ...bgLayer,
            "--fx-c1": c.colorA,
            "--fx-c2": c.colorB,
            "--fx-c3": c.colorC || c.colorA,
            "--fx-speed": `${c.speed}s`,
            "--fx-deg": c.direction === "vertical" ? "180deg" : c.direction === "horizontal" ? "90deg" : "135deg",
          }}
          className="fx-bg-gradient"
        />
      );

    case "dither":
    case "dither_texture": {
      const pattern = effect === "dither_texture" ? c.pattern : "dots";
      const cls = pattern === "checker" ? "fx-dither fx-dither-checker" : "fx-dither";
      return (
        <div
          style={{
            ...bgLayer,
            "--fx-scale": `${c.scale || 2}px`,
            "--fx-color": color,
            "--fx-opacity": (effect === "dither_texture" ? (c.opacity ?? 0.14) : (c.density ?? 0.5) * 0.3),
            "--fx-contrast": c.contrast || 1,
          }}
          className={`${cls} ${c.animated ? "fx-dither-animated" : ""}`}
        />
      );
    }

    case "scanlines":
      return (
        <div
          style={{
            ...bgLayer,
            "--fx-spacing": `${c.spacing || 4}px`,
            "--fx-thickness": `${c.thickness || 1}px`,
            "--fx-opacity": c.opacity ?? 0.14,
            "--fx-speed": c.speed ? `${c.speed}s` : "0s",
          }}
          className="fx-bg-scanlines"
        />
      );

    case "crt":
      return (
        <div style={bgLayer}>
          {c.scanlines && (
            <div
              style={{
                position: "absolute", inset: 0,
                "--fx-spacing": `${c.scanSpacing || 3}px`,
                "--fx-thickness": "1px",
                "--fx-opacity": 0.16,
                "--fx-speed": "0s",
              }}
              className="fx-bg-scanlines"
            />
          )}
          {c.glow && (
            <div className="fx-bg-crt-glow" style={{ position: "absolute", inset: 0, "--fx-glow": withAlpha(c.glowColor || "#22c55e", 0.5) }} />
          )}
          {c.vignette && (
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 120% at 50% 50%, transparent 55%, rgba(0,0,0,0.75) 100%)" }} />
          )}
          {c.noise > 0 && (
            <div className="fx-bg-static" style={{ position: "absolute", inset: 0, "--fx-opacity": c.noise, "--fx-speed": "8" }} />
          )}
        </div>
      );

    case "static":
      return (
        <div
          style={{ ...bgLayer, "--fx-opacity": c.opacity ?? 0.1, "--fx-speed": c.speed || 12, opacity: 1 }}
          className="fx-bg-static"
        />
      );

    case "vhs":
      return (
        <div style={bgLayer}>
          <div className="fx-bg-static" style={{ position: "absolute", inset: 0, "--fx-opacity": c.noise ?? 0.1, "--fx-speed": "10" }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="fx-bg-glitch-band"
              style={{
                position: "absolute",
                top: `${20 + i * 25}%`,
                "--fx-th": `${8 + i * 6}px`,
                "--fx-intensity": (c.opacity ?? 0.5) * 0.6,
                "--fx-freq": Math.max(0.4, c.frequency || 2),
                "--fx-i": 1,
                animationDelay: `${i * 1.7}s`,
              }}
            />
          ))}
        </div>
      );

    case "glitch":
      return (
        <div style={bgLayer}>
          {Array.from({ length: Math.max(1, Math.round(c.bands || 4)) }).map((_, i) => (
            <div
              key={i}
              className="fx-bg-glitch-band"
              style={{
                position: "absolute",
                top: `${(i * 100) / Math.max(1, c.bands || 4) + rand() * 12}%`,
                "--fx-th": `${c.thickness || 22}px`,
                "--fx-intensity": c.intensity ?? 0.5,
                "--fx-freq": Math.max(0.4, c.frequency || 3),
                "--fx-i": rand() > 0.5 ? 1 : -1,
                animationDelay: `${(i * 0.9).toFixed(2)}s`,
              }}
            />
          ))}
        </div>
      );

    case "pixel_grid":
    case "moving_grid":
      return (
        <div
          style={{
            ...bgLayer,
            "--fx-cell": `${c.cell || c.spacing || 28}px`,
            "--fx-thickness": `${c.thickness || 1}px`,
            "--fx-color": color,
            "--fx-opacity": c.opacity ?? 0.12,
            "--fx-speed": c.speed ? `${c.speed}s` : "0s",
          }}
          className={`fx-bg-pixel-grid ${(c.animated || (c.speed && c.speed > 0)) ? "fx-bg-pixel-grid-animated" : ""}`}
        />
      );

    case "light_streaks":
      return (
        <div style={bgLayer}>
          {Array.from({ length: Math.max(1, Math.round(c.count || 2)) }).map((_, i) => (
            <div
              key={i}
              className="fx-bg-streak"
              style={{
                left: 0,
                "--fx-width": `${c.width || 140}px`,
                "--fx-color": withAlpha(c.color || "#bfdbfe", 0.8),
                "--fx-opacity": c.opacity ?? 0.14,
                "--fx-angle": `${c.angle || 25}deg`,
                "--fx-speed": `${(c.speed || 9) + i * 2}s`,
                animationDelay: `${i * 1.6}s`,
              }}
            />
          ))}
        </div>
      );

    case "light_rays":
      return (
        <div style={bgLayer}>
          {Array.from({ length: Math.max(2, Math.round(c.count || 6)) }).map((_, i) => (
            <div
              key={i}
              className="fx-bg-ray"
              style={{
                left: `${(i * 100) / Math.max(2, c.count || 6)}%`,
                "--fx-width": `${c.width || 90}px`,
                "--fx-angle": `${(c.angle || 60) + i * 3}deg`,
                "--fx-color": withAlpha(c.color || "#fef9c3", 0.9),
                "--fx-opacity": c.opacity ?? 0.1,
                "--fx-speed": `${(c.speed || 0.5) * 6 + i}s`,
              }}
            />
          ))}
        </div>
      );

    case "fog":
      return (
        <div style={bgLayer}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="fx-bg-fog"
              style={{
                left: `${i * 30 - 10}%`,
                top: `${i * 22}%`,
                width: `${c.scale || 180}%`,
                height: `${(c.scale || 180) * 0.6}%`,
                "--fx-color": withAlpha(c.color || "#cbd5e1", 1),
                "--fx-opacity": c.opacity ?? 0.14,
                "--fx-speed-sc": `${(12 / Math.max(0.05, c.speed || 0.35)).toFixed(1)}s`,
                animationDelay: `${i * 2}s`,
              }}
            />
          ))}
        </div>
      );

    case "vignette":
      return (
        <div
          style={{
            ...bgLayer,
            background: `radial-gradient(circle at 50% 50%, transparent ${c.radius}%, ${withAlpha(c.color || "#000000", c.intensity)} ${(c.radius || 55) + (c.softness || 45)}%)`,
          }}
        />
      );

    case "blur":
      return (
        <div
          style={{
            ...bgLayer,
            backdropFilter: `blur(${c.radius || 8}px)`,
            WebkitBackdropFilter: `blur(${c.radius || 8}px)`,
            background: `rgba(8, 9, 13, ${c.opacity ?? 0.6})`,
          }}
        />
      );

    case "glow_haze":
    case "neon_halo":
    case "pulsing_glow": {
      const pulseSpeed = effect === "pulsing_glow" ? (c.duration || 6) : (c.speed ?? (effect === "neon_halo" ? 5 : 6));
      const shouldPulse = effect === "pulsing_glow" || c.pulse === true || (effect === "neon_halo" && pulseSpeed > 0);
      return (
        <div style={bgLayer}>
          <div
            className={`fx-bg-haze ${shouldPulse ? "fx-bg-haze-pulse" : ""}`}
            style={{
              "--fx-color": withAlpha(c.color || color, 0.9),
              "--fx-radius": `${c.radius || 60}%`,
              "--fx-opacity": c.opacity ?? c.intensity ?? 0.3,
              "--fx-speed": `${pulseSpeed}s`,
            }}
          />
        </div>
      );
    }

    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
export function BackgroundEffectsLayer({ effect = "none", config = {}, accent = "#5B8DB8" }) {
  const reduced = usePrefersReducedMotion();
  const c = useMemo(() => ({ accent, ...config }), [config, accent]);

  if (!effect || effect === "none") return null;
  if (CANVAS_EFFECTS.has(effect)) return <CanvasBackground effect={effect} c={c} reduced={reduced} />;
  if (CSS_EFFECTS.has(effect)) return <CssBackground effect={effect} c={c} />;
  return null;
}

export default BackgroundEffectsLayer;
