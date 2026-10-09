import React, { useEffect, useRef } from "react";

function getCanvasDims(canvas) {
  const p = canvas?.parentElement;
  return {
    width: p && p.clientWidth > 0 ? p.clientWidth : window.innerWidth,
    height: p && p.clientHeight > 0 ? p.clientHeight : window.innerHeight,
  };
}

// ──────────────────────────────────────────────
// 1. SNOW FALL (Micro-sized flakes that stack and melt at bottom, reacts to mouse)
// ──────────────────────────────────────────────
export function SnowFallEffect({ speed = 1, density = 1 }) {
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

    // Micro snow flakes (delicate fine snow particles)
    const count = Math.min(220, Math.max(70, Math.floor((width / 8) * density)));
    const flakes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: (0.6 + Math.random() * 1.4) * speed,
      r: 0.45 + Math.random() * 0.95, // WAY smaller micro-sized snow crystals
      opacity: 0.4 + Math.random() * 0.55,
      drift: -0.25 + Math.random() * 0.5,
    }));

    // Dense accumulation stack columns across screen width
    const pileCols = Math.max(60, Math.floor(width / 6));
    const snowPile = Array(pileCols).fill(0);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw accumulated snow stack at the bottom
      ctx.fillStyle = "rgba(240, 248, 255, 0.65)";
      ctx.beginPath();
      ctx.moveTo(0, height);
      const colWidth = width / (pileCols - 1);
      for (let c = 0; c < pileCols; c++) {
        const pileH = Math.min(28, snowPile[c] * 0.35);
        ctx.lineTo(c * colWidth, height - pileH);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Gentle natural melting
      for (let c = 0; c < pileCols; c++) {
        if (snowPile[c] > 0) snowPile[c] = Math.max(0, snowPile[c] - 0.008);
      }

      // Render falling micro flakes
      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];

        // Cursor repulsion physics
        if (mouse.active) {
          const dx = f.x - mouse.x;
          const dy = f.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const repRadius = 85;

          if (dist < repRadius && dist > 0) {
            const force = ((repRadius - dist) / repRadius) * 2.0;
            const angle = Math.atan2(dy, dx);
            f.vx += Math.cos(angle) * force;
            f.vy += Math.sin(angle) * force;
          }
        }

        f.vx *= 0.92;
        f.vy = f.vy * 0.94 + 0.06 * (0.6 * speed);

        f.x += f.vx + f.drift;
        f.y += f.vy;

        // Flake touches bottom and stacks
        if (f.y >= height - 2) {
          const colIdx = Math.min(pileCols - 1, Math.max(0, Math.floor((f.x / width) * pileCols)));
          if (snowPile[colIdx] < 50) {
            snowPile[colIdx] += 0.45;
            if (colIdx > 0) snowPile[colIdx - 1] += 0.15;
            if (colIdx < pileCols - 1) snowPile[colIdx + 1] += 0.15;
          }
          // Recycle flake to top
          f.y = -4;
          f.x = Math.random() * width;
          f.vx = 0;
          f.vy = (0.6 + Math.random() * 1.4) * speed;
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
// 2. RAIN (Doesn't stack, reacts/moves to mouse)
// ──────────────────────────────────────────────
export function RainEffect({ speed = 1, density = 1 }) {
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

    const count = Math.min(110, Math.max(40, Math.floor((width / 16) * density)));
    const drops = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: (12 + Math.random() * 8) * speed,
      len: 14 + Math.random() * 18,
      drift: -0.3 + Math.random() * 0.4,
      opacity: 0.25 + Math.random() * 0.35,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];

        if (mouse.active) {
          const dx = mouse.x - d.x;
          const dy = mouse.y - d.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const pullRadius = 140;

          if (dist < pullRadius && dist > 10) {
            const force = ((pullRadius - dist) / pullRadius) * 1.5;
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
        ctx.strokeStyle = `rgba(160, 215, 255, ${d.opacity})`;
        ctx.lineWidth = 1.2;
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.drift + d.vx * 1.5, d.y + d.len);
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

// ──────────────────────────────────────────────
// 2. SHIMMER (Shimmers a pure luminous light shine beam across screen periodically - no stars)
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
        progress = -0.5; // cycle sweep periodically
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
// 5. GRADIENT WAVE (Fluid luminous gradient wave reacting to mouse)
// ──────────────────────────────────────────────
export function GradientWaveEffect({ speed = 1 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    const dims = getCanvasDims(canvas);
    let width = (canvas.width = dims.width);
    let height = (canvas.height = dims.height);

    let mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    };
    window.addEventListener("mousemove", onMouseMove);

    const onResize = () => {
      const d = getCanvasDims(canvas);
      width = canvas.width = d.width;
      height = canvas.height = d.height;
    };
    window.addEventListener("resize", onResize);

    let step = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      step += 0.015 * speed;

      // Draw 3 layers of fluid undulating sine waves
      const waves = [
        { color1: "rgba(91, 141, 184, 0.18)", color2: "rgba(56, 189, 248, 0.08)", freq: 0.003, amp: 35, speed: 1.0, offset: 0 },
        { color1: "rgba(168, 85, 247, 0.15)", color2: "rgba(236, 72, 153, 0.06)", freq: 0.004, amp: 45, speed: -1.2, offset: 2 },
        { color1: "rgba(34, 197, 94, 0.12)", color2: "rgba(6, 182, 212, 0.05)", freq: 0.0025, amp: 55, speed: 0.8, offset: 4 },
      ];

      waves.forEach((w) => {
        ctx.beginPath();
        ctx.moveTo(0, height);

        const mouseOffset = ((mouse.x - width / 2) / width) * 40;
        const mouseHeightInfluence = ((mouse.y - height / 2) / height) * 60;

        for (let x = 0; x <= width; x += 15) {
          const y =
            height * 0.65 +
            Math.sin(x * w.freq + step * w.speed + w.offset + mouseOffset * 0.05) * w.amp +
            Math.cos(x * w.freq * 0.5 + step * 0.5) * (w.amp * 0.5) +
            mouseHeightInfluence;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, height * 0.4, width, height);
        grad.addColorStop(0, w.color1);
        grad.addColorStop(1, w.color2);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animId);
    };
  }, [speed]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1]" />;
}

// ──────────────────────────────────────────────
// 6. FILM GRAIN (Authentic textured film grain)
// ──────────────────────────────────────────────
export function GrainEffect({ opacity = 0.08 }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-[1] mix-blend-overlay"
      style={{
        opacity: Math.max(0.03, Math.min(0.20, opacity)),
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

// ──────────────────────────────────────────────
// 7. VHS TAPE (Authentic retro VHS tape scanlines & tracking glitch)
// ──────────────────────────────────────────────
export function VHSTapeEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
      {/* Scanlines */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 255, 255, 0.09) 2px, rgba(255, 255, 255, 0.09) 4px)",
        }}
      />
      {/* Subtle CRT Vignette */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow: "inset 0 0 100px rgba(0,0,0,0.8)",
        }}
      />
    </div>
  );
}

// ──────────────────────────────────────────────
// EXCLUSIVELY REDONE BACKGROUND EFFECTS LIST
// ──────────────────────────────────────────────
export const BACKGROUND_EFFECTS_LIST = [
  { id: "none", name: "None", description: "Clean transparent effect (shows wallpaper / colors)" },
  { id: "snow_fall", name: "Snow Fall", description: "Micro-sized snow flakes stacking & melting at bottom, moves on mouse" },
  { id: "rain", name: "Rain", description: "Tokyo rain streaks reacting to mouse velocity" },
  { id: "shimmer", name: "Shimmer", description: "Periodic luminous light beam sweep across screen" },
  { id: "gradient_wave", name: "Gradient Wave", description: "Fluid luminous liquid wave reacting to mouse" },
  { id: "grain", name: "Grain", description: "Authentic cinematic film grain texture" },
  { id: "vhs_tape", name: "VHS Tape", description: "Retro CRT scanlines & tracking glitch" },
];

export function BackgroundEffect({ effect, config = {} }) {
  if (!effect || effect === "none") return null;

  // Backwards compatibility alias resolution
  const resolved =
    effect === "snow" || effect === "snow_stack" ? "snow_fall" :
    effect === "vhs" ? "vhs_tape" :
    effect === "static" || effect === "static_grain" ? "grain" :
    effect === "aurora" || effect === "reactive" || effect === "anti_fall" ? "gradient_wave" :
    effect;

  switch (resolved) {
    case "snow_fall":
      return <SnowFallEffect speed={config.speed || 1} density={config.density || 1} />;
    case "rain":
      return <RainEffect speed={config.speed || 1} density={config.density || 1} />;
    case "shimmer":
      return <ShimmerEffect speed={config.speed || 1} />;
    case "gradient_wave":
      return <GradientWaveEffect speed={config.speed || 1} />;
    case "grain":
      return <GrainEffect opacity={config.opacity || 0.08} />;
    case "vhs_tape":
      return <VHSTapeEffect />;
    default:
      return null;
  }
}

// ──────────────────────────────────────────────
// INTERACTIVE CURSOR EFFECTS RENDERER
// ──────────────────────────────────────────────
export function CursorEffectsRenderer({ effect, color = "#5B8DB8", size = 18 }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, isDown: false, lastX: -1000, lastY: -1000 });
  const particlesRef = useRef([]);

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
      mouseRef.current.lastX = mouseRef.current.x;
      mouseRef.current.lastY = mouseRef.current.y;
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
        for (let i = 0; i < 12; i++) {
          const angle = (Math.PI * 2 * i) / 12;
          const speed = 2 + Math.random() * 3;
          particlesRef.current.push({
            x: e.clientX,
            y: e.clientY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
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
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
      style={{ touchAction: "none" }}
    />
  );
}
