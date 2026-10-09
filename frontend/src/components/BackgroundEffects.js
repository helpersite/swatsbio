import React, { useEffect, useRef } from "react";

function getCanvasDims(canvas) {
  const p = canvas?.parentElement;
  return {
    width: p && p.clientWidth > 0 ? p.clientWidth : window.innerWidth,
    height: p && p.clientHeight > 0 ? p.clientHeight : window.innerHeight,
  };
}

// ──────────────────────────────────────────────
// 1. SNOW FALL (Dense micro-crystals, stacking & melting at bottom, mouse repulsion)
// ──────────────────────────────────────────────
export function SnowFallEffect({ speed = 1, density = 1.3 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    const dims = getCanvasDims(canvas);
    let width = (canvas.width = dims.width);
    let height = (canvas.height = dims.height);

    let mouse = { x: -1000, y: -1000, active: false };

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const onMouseLeave = () => { mouse.active = false; };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);

    const onResize = () => {
      const d = getCanvasDims(canvas);
      width = canvas.width = d.width;
      height = canvas.height = d.height;
    };
    window.addEventListener("resize", onResize);

    // More snowflakes with fine micro-crystals
    const count = Math.min(320, Math.max(100, Math.floor((width / 5) * density)));
    const flakes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: (0.7 + Math.random() * 1.5) * speed,
      r: 0.5 + Math.random() * 1.2,
      opacity: 0.35 + Math.random() * 0.6,
      drift: -0.3 + Math.random() * 0.6,
    }));

    // Snow pile accumulation columns
    const pileCols = Math.max(80, Math.floor(width / 5));
    const snowPile = Array(pileCols).fill(0);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw bottom accumulated snow
      ctx.fillStyle = "rgba(240, 248, 255, 0.7)";
      ctx.beginPath();
      ctx.moveTo(0, height);
      const colWidth = width / (pileCols - 1);
      for (let c = 0; c < pileCols; c++) {
        const pileH = Math.min(32, snowPile[c] * 0.4);
        ctx.lineTo(c * colWidth, height - pileH);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Gentle natural melting
      for (let c = 0; c < pileCols; c++) {
        if (snowPile[c] > 0) snowPile[c] = Math.max(0, snowPile[c] - 0.01);
      }

      // Render falling flakes
      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];

        // Cursor repulsion physics
        if (mouse.active) {
          const dx = f.x - mouse.x;
          const dy = f.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const repRadius = 95;

          if (dist < repRadius && dist > 0) {
            const force = ((repRadius - dist) / repRadius) * 2.2;
            const angle = Math.atan2(dy, dx);
            f.vx += Math.cos(angle) * force;
            f.vy += Math.sin(angle) * force;
          }
        }

        f.vx *= 0.92;
        f.vy = f.vy * 0.94 + 0.06 * (0.7 * speed);

        f.x += f.vx + f.drift;
        f.y += f.vy;

        // Flake touches bottom
        if (f.y >= height - 2) {
          const colIdx = Math.min(pileCols - 1, Math.max(0, Math.floor((f.x / width) * pileCols)));
          if (snowPile[colIdx] < 60) {
            snowPile[colIdx] += 0.5;
            if (colIdx > 0) snowPile[colIdx - 1] += 0.18;
            if (colIdx < pileCols - 1) snowPile[colIdx + 1] += 0.18;
          }
          f.y = -5;
          f.x = Math.random() * width;
          f.vx = 0;
          f.vy = (0.7 + Math.random() * 1.5) * speed;
        }

        if (f.x < 0) f.x = width;
        if (f.x > width) f.x = 0;

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(250, 252, 255, ${f.opacity})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animId);
    };
  }, [speed, density]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1] bg-transparent" />;
}

// ──────────────────────────────────────────────
// 2. RAIN (Tokyo neon rain streaks that follow mouse velocity)
// ──────────────────────────────────────────────
export function RainEffect({ speed = 1, density = 1.2 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    const dims = getCanvasDims(canvas);
    let width = (canvas.width = dims.width);
    let height = (canvas.height = dims.height);

    let mouse = { x: -1000, y: -1000, active: false };

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const onMouseLeave = () => { mouse.active = false; };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);

    const onResize = () => {
      const d = getCanvasDims(canvas);
      width = canvas.width = d.width;
      height = canvas.height = d.height;
    };
    window.addEventListener("resize", onResize);

    const count = Math.min(180, Math.max(60, Math.floor((width / 10) * density)));
    const drops = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: (14 + Math.random() * 10) * speed,
      len: 16 + Math.random() * 22,
      drift: -0.4 + Math.random() * 0.6,
      opacity: 0.3 + Math.random() * 0.45,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];

        if (mouse.active) {
          const dx = mouse.x - d.x;
          const dy = mouse.y - d.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const pullRadius = 160;

          if (dist < pullRadius && dist > 10) {
            const force = ((pullRadius - dist) / pullRadius) * 2.0;
            d.vx += (dx / dist) * force;
          }
        }

        d.vx *= 0.90;
        d.x += d.drift + d.vx;
        d.y += d.vy;

        if (d.y > height + d.len) {
          d.y = -d.len;
          d.x = Math.random() * width;
          d.vx = 0;
        }
        if (d.x > width) d.x = 0;
        if (d.x < 0) d.x = width;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(175, 220, 255, ${d.opacity})`;
        ctx.lineWidth = 1.3;
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.drift * 1.5 + d.vx * 1.8, d.y + d.len);
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animId);
    };
  }, [speed, density]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1]" />;
}

export function BloodDrippingEffect() {
  return null;
}

// ──────────────────────────────────────────────
// 4. SHIMMER (Periodic pure luminous light beam sweep across screen)
// ──────────────────────────────────────────────
export function ShimmerEffect({ speed = 1 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    const dims = getCanvasDims(canvas);
    let width = (canvas.width = dims.width);
    let height = (canvas.height = dims.height);

    const onResize = () => {
      const d = getCanvasDims(canvas);
      width = canvas.width = d.width;
      height = canvas.height = d.height;
    };
    window.addEventListener("resize", onResize);

    let progress = -0.4;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      progress += 0.0035 * speed;
      if (progress > 1.6) {
        progress = -0.5;
      }

      if (progress >= -0.2 && progress <= 1.2) {
        const sweepX = progress * (width + height);

        ctx.save();
        ctx.translate(sweepX, 0);
        ctx.rotate((Math.PI / 180) * 25);

        const beamWidth = Math.max(120, width * 0.22);
        const grad = ctx.createLinearGradient(-beamWidth / 2, 0, beamWidth / 2, 0);
        grad.addColorStop(0, "rgba(255, 255, 255, 0)");
        grad.addColorStop(0.35, "rgba(200, 230, 255, 0.06)");
        grad.addColorStop(0.5, "rgba(255, 255, 255, 0.26)");
        grad.addColorStop(0.65, "rgba(200, 230, 255, 0.06)");
        grad.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = grad;
        ctx.fillRect(-beamWidth / 2, -height * 1.5, beamWidth, height * 3);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animId);
    };
  }, [speed]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1] bg-transparent" />;
}

// ──────────────────────────────────────────────
// 5. FILM GRAIN (Authentic textured cinema film noise)
// ──────────────────────────────────────────────
export function GrainEffect({ opacity = 0.025 }) {
  const textureRef = useRef(null);

  useEffect(() => {
    const tile = document.createElement("canvas");
    tile.width = 128;
    tile.height = 128;
    const ctx = tile.getContext("2d");
    if (!ctx) return;

    const refresh = () => {
      const image = ctx.createImageData(tile.width, tile.height);
      for (let i = 0; i < image.data.length; i += 4) {
        const shade = Math.random() < 0.5 ? 0 : 255;
        image.data[i] = shade;
        image.data[i + 1] = shade;
        image.data[i + 2] = shade;
        image.data[i + 3] = 255;
      }
      ctx.putImageData(image, 0, 0);
      if (textureRef.current) textureRef.current.style.backgroundImage = `url(${tile.toDataURL("image/png")})`;
    };
    refresh();
    const timer = window.setInterval(refresh, 140);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      ref={textureRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none z-[1]"
      style={{
        opacity: Math.max(0, Math.min(0.06, Number(opacity) || 0)) * 0.35,
        backgroundRepeat: "repeat",
        backgroundSize: "128px 128px",
        mixBlendMode: "soft-light",
      }}
    />
  );
}

// ──────────────────────────────────────────────
// 6. VHS TAPE (Retro CRT scanlines & tracking glitch distortion)
// ──────────────────────────────────────────────
export function VHSTapeEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
      {/* Scanlines */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 255, 255, 0.12) 2px, rgba(255, 255, 255, 0.12) 4px)",
        }}
      />
      {/* Subtle CRT Vignette */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow: "inset 0 0 120px rgba(0,0,0,0.85)",
        }}
      />
    </div>
  );
}

// ──────────────────────────────────────────────
// STRICT CURATED BACKGROUND EFFECTS LIST
// ──────────────────────────────────────────────
export const BACKGROUND_EFFECTS_LIST = [
  { id: "none", name: "None", description: "Clean transparent effect (shows wallpaper / solid color)" },
  { id: "snow_fall", name: "Snow Fall", description: "Dense micro-crystals stacking & melting at bottom, reacts to mouse" },
  { id: "rain", name: "Rain", description: "Tokyo neon rain streaks reacting to mouse velocity" },
  { id: "shimmer", name: "Shimmer", description: "Periodic luminous light beam sweep across screen" },
  { id: "grain", name: "Grain", description: "Authentic cinematic film grain texture" },
  { id: "vhs_tape", name: "VHS Tape", description: "Retro CRT scanlines & tracking glitch" },
];

export function BackgroundEffect({ effect, config = {}, className = "" }) {
  if (!effect || effect === "none" || effect === "blood" || effect === "dripping_blood" || effect === "blood_drip") return null;

  const resolved =
    effect === "snow" || effect === "snow_stack" ? "snow_fall" :
    effect === "vhs" ? "vhs_tape" :
    effect === "static" || effect === "static_grain" ? "grain" :
    effect;

  let rendered = null;
  switch (resolved) {
    case "snow_fall":
      rendered = <SnowFallEffect speed={config.speed || 1} density={config.density || 1.3} />;
      break;
    case "rain":
      rendered = <RainEffect speed={config.speed || 1} density={config.density || 1.2} />;
      break;
    case "shimmer":
      rendered = <ShimmerEffect speed={config.speed || 1} />;
      break;
    case "grain":
      rendered = <GrainEffect opacity={config.opacity ?? 0.025} />;
      break;
    case "vhs_tape":
      rendered = <VHSTapeEffect />;
      break;
    default:
      return null;
  }
  return className ? <div className={className}>{rendered}</div> : rendered;
}

// ──────────────────────────────────────────────
// INTERACTIVE CURSOR EFFECTS RENDERER (Fixed global overlay)
// ──────────────────────────────────────────────
export function CursorEffectsRenderer({ effect, color = "#5B8DB8", size = 18, cursorImage }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, isDown: false });
  const particlesRef = useRef([]);

  useEffect(() => {
    if (typeof document === "undefined" || (!cursorImage && (!effect || effect === "none"))) return;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M5 3v23l6-6 4 9 4-2-4-9h9L5 3Z" fill="#111827" stroke="${color}" stroke-width="2" stroke-linejoin="round"/><circle cx="25" cy="7" r="2" fill="${color}"/></svg>`;
    const cursorUrl = cursorImage || `data:image/svg+xml,${encodeURIComponent(svg)}`;
    const hotspot = cursorImage ? "0 0" : "5 3";
    const style = document.createElement("style");
    style.dataset.swatsCursor = "true";
    style.textContent = `body[data-swats-cursor] *, body[data-swats-cursor] { cursor: url("${cursorUrl.replace(/"/g, "%22")}") ${hotspot}, auto !important; } body[data-swats-cursor] button, body[data-swats-cursor] a, body[data-swats-cursor] [role="button"] { cursor: url("${cursorUrl.replace(/"/g, "%22")}") ${hotspot}, pointer !important; }`;
    document.head.appendChild(style);
    const previousCursor = document.body.dataset.swatsCursor;
    document.body.dataset.swatsCursor = "true";
    return () => {
      style.remove();
      if (previousCursor === undefined) delete document.body.dataset.swatsCursor;
      else document.body.dataset.swatsCursor = previousCursor;
    };
  }, [effect, color, cursorImage]);

  useEffect(() => {
    if (!effect || effect === "none") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;

      if (effect === "trail" || effect === "sparkles") {
        const count = effect === "sparkles" ? 3 : 2;
        for (let i = 0; i < count; i++) {
          particlesRef.current.push({
            x: e.clientX + (Math.random() - 0.5) * 8,
            y: e.clientY + (Math.random() - 0.5) * 8,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            size: (Math.random() * 0.6 + 0.4) * size,
            alpha: 1,
            decay: Math.random() * 0.03 + 0.02,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.1,
          });
        }
      }
    };

    const onMouseDown = (e) => {
      mouseRef.current.isDown = true;
      if (effect === "sparkles" || effect === "trail") {
        for (let i = 0; i < 14; i++) {
          const angle = (Math.PI * 2 * i) / 14;
          const spd = 2 + Math.random() * 3;
          particlesRef.current.push({
            x: e.clientX,
            y: e.clientY,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            size: (Math.random() * 0.8 + 0.6) * size,
            alpha: 1,
            decay: 0.025,
            rotation: Math.random() * Math.PI,
            rotSpeed: 0.15,
          });
        }
      }
    };

    const onMouseUp = () => {
      mouseRef.current.isDown = false;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      if (effect === "neon_aura" && mx > -100) {
        const rad = size * 3;
        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, rad);
        grad.addColorStop(0, color);
        grad.addColorStop(0.35, `${color}88`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mx, my, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      if (effect === "glow_dot" && mx > -100) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(mx, my, size / 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      if (effect === "crosshair" && mx > -100) {
        const arm = size * 1.2;
        const gap = size * 0.4;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.moveTo(mx, my - gap);
        ctx.lineTo(mx, my - gap - arm);
        ctx.moveTo(mx, my + gap);
        ctx.lineTo(mx, my + gap + arm);
        ctx.moveTo(mx - gap, my);
        ctx.lineTo(mx - gap - arm, my);
        ctx.moveTo(mx + gap, my);
        ctx.lineTo(mx + gap + arm, my);
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(mx, my, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      if ((effect === "trail" || effect === "sparkles") && particlesRef.current.length > 0) {
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= p.decay;
          p.rotation += p.rotSpeed;

          if (p.alpha <= 0) {
            particlesRef.current.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = p.alpha;
          ctx.shadowColor = color;
          ctx.shadowBlur = 10;
          ctx.fillStyle = color;

          if (effect === "sparkles") {
            const s = p.size;
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.quadraticCurveTo(0, 0, s, 0);
            ctx.quadraticCurveTo(0, 0, 0, s);
            ctx.quadraticCurveTo(0, 0, -s, 0);
            ctx.quadraticCurveTo(0, 0, 0, -s);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(1, p.size / 2), 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [effect, color, size]);

  if (!effect || effect === "none") return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[9999] w-full h-full"
      style={{ touchAction: "none" }}
    />
  );
}
