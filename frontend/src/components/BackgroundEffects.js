import React, { useEffect, useRef } from "react";

function getCanvasDims(canvas) {
  const p = canvas?.parentElement;
  return {
    width: p && p.clientWidth > 0 ? p.clientWidth : window.innerWidth,
    height: p && p.clientHeight > 0 ? p.clientHeight : window.innerHeight,
  };
}

// 1. Subtle Rain
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

    const onResize = () => {
      const d = getCanvasDims(canvas);
      width = canvas.width = d.width;
      height = canvas.height = d.height;
    };
    window.addEventListener("resize", onResize);

    const count = Math.min(60, Math.max(25, Math.floor((width / 24) * density)));
    const drops = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      len: 12 + Math.random() * 18,
      speed: (8 + Math.random() * 8) * speed,
      drift: -0.2 + Math.random() * 0.4,
      opacity: 0.18 + Math.random() * 0.28,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        ctx.beginPath();
        ctx.strokeStyle = `rgba(160, 205, 255, ${d.opacity})`;
        ctx.lineWidth = 1;
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.drift, d.y + d.len);
        ctx.stroke();

        d.y += d.speed;
        d.x += d.drift;
        if (d.y > height + d.len) {
          d.y = -d.len;
          d.x = Math.random() * width;
        }
        if (d.x > width) d.x = 0;
        if (d.x < 0) d.x = width;
      }

      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animId);
    };
  }, [speed, density]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1]" />;
}

// 2. Snow Stack / Frost Snowflakes
export function SnowStackEffect({ speed = 1, density = 1 }) {
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

    const count = Math.min(70, Math.max(30, Math.floor((width / 22) * density)));
    const flakes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1 + Math.random() * 2.2,
      speed: (0.8 + Math.random() * 1.6) * speed,
      drift: -0.4 + Math.random() * 0.8,
      opacity: 0.2 + Math.random() * 0.45,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(235, 245, 255, ${f.opacity})`;
        ctx.fill();

        f.y += f.speed;
        f.x += f.drift;
        if (f.y > height) {
          f.y = -5;
          f.x = Math.random() * width;
        }
        if (f.x > width) f.x = 0;
        if (f.x < 0) f.x = width;
      }

      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animId);
    };
  }, [speed, density]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1]" />;
}

// 3. Anti-Fall Mouse Repulsion Physics
export function AntiFallEffect({ color = "#78A9D0", sensitivity = 80 }) {
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
    const onMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);

    const onResize = () => {
      const d = getCanvasDims(canvas);
      width = canvas.width = d.width;
      height = canvas.height = d.height;
    };
    window.addEventListener("resize", onResize);

    const count = Math.min(65, Math.max(25, Math.floor(width / 26)));
    const repRadius = Math.max(60, sensitivity * 1.6);

    const particles = Array.from({ length: count }, () => {
      const x = Math.random() * width;
      const y = Math.random() * height;
      return {
        x,
        y,
        baseX: x,
        baseY: y,
        vx: 0,
        vy: 0.6 + Math.random() * 0.9,
        r: 1.5 + Math.random() * 2,
        opacity: 0.3 + Math.random() * 0.45,
      };
    });

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < repRadius && dist > 0) {
            const force = (repRadius - dist) / repRadius;
            const angle = Math.atan2(dy, dx);
            p.vx += Math.cos(angle) * force * 1.8;
            p.vy += Math.sin(angle) * force * 1.8;
          }
        }

        p.vx *= 0.92;
        p.vy = p.vy * 0.92 + 0.08;

        p.x += p.vx;
        p.y += p.vy;

        if (p.y > height + 10) {
          p.y = -10;
          p.x = Math.random() * width;
          p.vx = 0;
          p.vy = 0.6 + Math.random() * 0.9;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
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
  }, [color, sensitivity]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1]" />;
}

// 4. Matrix Digital Rain
export function MatrixRainEffect({ speed = 1 }) {
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

    const cols = Math.floor(width / 18);
    const ypos = Array(cols).fill(0);
    const chars = "0123456789ABCDEF$#*";

    let lastTime = 0;
    const interval = 45 / speed;

    const render = (time) => {
      if (time - lastTime > interval) {
        lastTime = time;
        ctx.fillStyle = "rgba(8, 9, 13, 0.12)";
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "#5B8DB8";
        ctx.font = "12pt monospace";

        ypos.forEach((y, ind) => {
          const text = chars.charAt(Math.floor(Math.random() * chars.length));
          const x = ind * 18;
          ctx.fillText(text, x, y);
          if (y > 100 + Math.random() * 10000) ypos[ind] = 0;
          else ypos[ind] = y + 16;
        });
      }
      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animId);
    };
  }, [speed]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1]" />;
}

// 5. Cyber Retro Grid
export function CyberGridEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(91,141,184,0.25) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(91,141,184,0.25) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 80%)",
        }}
      />
    </div>
  );
}

// 6. Deep Starfield
export function StarsEffect() {
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

    const count = 75;
    const stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.5 + Math.random() * 1.5,
      twinkle: Math.random() * Math.PI * 2,
      speed: 0.02 + Math.random() * 0.03,
      baseAlpha: 0.2 + Math.random() * 0.6,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.twinkle += s.speed;
        const alpha = Math.max(0.1, s.baseAlpha * (0.6 + 0.4 * Math.sin(s.twinkle)));

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1]" />;
}

// 7. Aurora Wave
export function AuroraEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
      <div 
        className="absolute -inset-[50%] opacity-25 filter blur-[90px] animate-pulse"
        style={{
          background: "radial-gradient(circle at 50% 30%, rgba(91,141,184,0.5), rgba(74,222,128,0.2) 40%, rgba(168,85,247,0.15) 70%, transparent 85%)",
          animationDuration: "8s"
        }}
      />
    </div>
  );
}

// 8. Film Grain Overlay
export function StaticGrainEffect({ opacity = 0.06 }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-[1] mix-blend-overlay"
      style={{
        opacity: Math.max(0.02, Math.min(0.15, opacity)),
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

// 9. Retro VHS Scanlines
export function VHSEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[1]">
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 255, 255, 0.08) 2px, rgba(255, 255, 255, 0.08) 4px)",
        }}
      />
    </div>
  );
}

export const BACKGROUND_EFFECTS_LIST = [
  { id: "none", name: "None", description: "Solid clean dark background" },
  { id: "anti_fall", name: "Anti-Fall Physics", description: "Interactive mouse repulsion forcefield" },
  { id: "rain", name: "Tokyo Drizzle", description: "Smooth streaming rain lines" },
  { id: "snow_stack", name: "Frost Snow", description: "Gentle falling winter snowflakes" },
  { id: "cyber_grid", name: "Cyber Grid", description: "Futuristic perspective wireframe" },
  { id: "matrix", name: "Matrix Code", description: "Digital falling matrix glyphs" },
  { id: "stars", name: "Starfield", description: "Deep night sky twinkling stars" },
  { id: "aurora", name: "Aurora Borealis", description: "Vibrant ambient cosmic lights" },
  { id: "static", name: "Film Grain", description: "Subtle cinematic vintage grain" },
  { id: "vhs", name: "VHS Scanlines", description: "Retro CRT video tracking lines" },
];

export function BackgroundEffect({ effect, config = {} }) {
  if (!effect || effect === "none") return null;

  switch (effect) {
    case "rain":
      return <RainEffect speed={config.speed || 1} density={config.density || 1} />;
    case "snow_stack":
      return <SnowStackEffect speed={config.speed || 1} density={config.density || 1} />;
    case "anti_fall":
      return <AntiFallEffect color={config.color || "#78A9D0"} sensitivity={config.sensitivity || 80} />;
    case "matrix":
      return <MatrixRainEffect speed={config.speed || 1} />;
    case "cyber_grid":
      return <CyberGridEffect />;
    case "stars":
      return <StarsEffect />;
    case "aurora":
      return <AuroraEffect />;
    case "static":
      return <StaticGrainEffect opacity={config.opacity || 0.06} />;
    case "vhs":
      return <VHSEffect />;
    default:
      return null;
  }
}
