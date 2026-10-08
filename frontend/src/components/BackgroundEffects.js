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

    const count = Math.min(90, Math.max(30, Math.floor((width / 16) * density)));
    const drops = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      len: 12 + Math.random() * 20,
      speed: (9 + Math.random() * 11) * speed,
      drift: -0.3 + Math.random() * 0.6,
      opacity: 0.2 + Math.random() * 0.35,
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

      const bottomGlow = height * 0.96;
      ctx.fillStyle = "rgba(160, 200, 255, 0.05)";
      ctx.fillRect(0, bottomGlow, width, Math.max(1, height - bottomGlow));
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

    const count = Math.min(100, Math.max(40, Math.floor((width / 14) * density)));
    const flakes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1.2 + Math.random() * 2.8,
      speedY: (0.7 + Math.random() * 1.8) * speed,
      speedX: -0.4 + Math.random() * 0.8,
      opacity: 0.2 + Math.random() * 0.75,
      drift: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Bottom frosty accumulation glow
      const grad = ctx.createLinearGradient(0, height - 35, 0, height);
      grad.addColorStop(0, "rgba(220, 240, 255, 0)");
      grad.addColorStop(1, "rgba(220, 240, 255, 0.12)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, height - 35, width, 35);

      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        const twinkle = (Math.sin(f.drift + performance.now() * 0.003) + 1) * 0.5;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r + twinkle * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230, 245, 255, ${Math.min(1, f.opacity + twinkle * 0.2)})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = "rgba(200, 235, 255, 0.7)";
        ctx.fill();

        f.y += f.speedY;
        f.x += f.speedX + Math.sin(f.y * 0.05) * 0.2;
        f.drift += 0.035;

        if (f.y > height + 6) {
          f.y = -6;
          f.x = Math.random() * width;
        }
        if (f.x > width + 6) f.x = -6;
        if (f.x < -6) f.x = width + 6;
      }
      ctx.shadowBlur = 0;
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

// 3. Anti Fall (Particles that fall down but actively flee/repel opposite of mouse cursor position!)
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

    let mouse = { x: -9999, y: -9999, active: false };

    const onResize = () => {
      const d = getCanvasDims(canvas);
      width = canvas.width = d.width;
      height = canvas.height = d.height;
    };
    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true };
    };
    const onMouseLeave = () => {
      mouse = { x: -9999, y: -9999, active: false };
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);

    const count = Math.min(80, Math.max(35, Math.floor(width / 18)));
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      baseSpeedY: 1.2 + Math.random() * 2.2,
      vx: 0,
      vy: 0,
      r: 1.5 + Math.random() * 2,
      alpha: 0.35 + Math.random() * 0.55,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const repelRadius = (sensitivity / 100) * 160 + 60;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Repel from mouse
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < repelRadius && dist > 0) {
            const force = (1 - dist / repelRadius) * 6.5;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        // Friction and gravity
        p.vx *= 0.92;
        p.vy = (p.vy + p.baseSpeedY * 0.1) * 0.95;

        p.x += p.vx;
        p.y += p.vy + p.baseSpeedY;

        if (p.y > height + 10) {
          p.y = -10;
          p.x = Math.random() * width;
          p.vx = 0;
          p.vy = 0;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, [color, sensitivity]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1]" />;
}

// 4. Static / Grain Simulation
export function StaticGrainEffect({ opacity = 0.08 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    const dims = getCanvasDims(canvas);
    let width = (canvas.width = Math.min(dims.width, 400));
    let height = (canvas.height = Math.min(dims.height, 300));

    const render = () => {
      const imgData = ctx.createImageData(width, height);
      const buffer = new Uint32Array(imgData.data.buffer);
      const len = buffer.length;
      for (let i = 0; i < len; i++) {
        if (Math.random() < 0.5) {
          buffer[i] = 0xffffffff;
        } else {
          buffer[i] = 0xff000000;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-[2] overflow-hidden" style={{ opacity }}>
      <canvas ref={canvasRef} className="w-full h-full object-cover mix-blend-screen" />
    </div>
  );
}

// 5. VHS Retro Tape Scanlines & Glitch
export function VHSEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[2] overflow-hidden">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.6) 50%)",
          backgroundSize: "100% 4px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.04] to-transparent animate-pulse" style={{ animationDuration: "3s" }} />
      <div className="absolute top-4 right-4 text-[10px] font-mono text-white/40 tracking-widest uppercase select-none">
        PLAY ▷ 00:24:19 [VHS]
      </div>
      <div className="absolute bottom-4 left-4 text-[10px] font-mono text-cyan-400/40 tracking-wider select-none">
        SP 4:3 AUTO-TRACKING
      </div>
    </div>
  );
}

// 6. Old TV / CRT Phosphor Display
export function OldTVEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[2] overflow-hidden">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.92) 100%), repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,120,0.04) 3px, rgba(0,0,0,0.25) 4px)",
        }}
      />
      <div className="absolute inset-0 bg-emerald-500/[0.025] mix-blend-screen animate-pulse" style={{ animationDuration: "0.15s" }} />
      <div className="absolute top-4 left-4 text-[10px] font-mono text-emerald-400/50 tracking-widest select-none">
        CH 03 CRT • NTSC
      </div>
    </div>
  );
}

// 7. Topographic Isolines
export function TopographicEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden opacity-25">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 800 600">
        <path d="M0,100 Q200,40 400,120 T800,90" fill="none" stroke="#5B8DB8" strokeWidth="1" strokeDasharray="6,6" opacity="0.4" />
        <path d="M0,200 Q250,140 500,220 T800,180" fill="none" stroke="#5B8DB8" strokeWidth="1" opacity="0.5" />
        <path d="M0,320 Q180,260 420,340 T800,300" fill="none" stroke="#5B8DB8" strokeWidth="1.2" opacity="0.6" />
        <path d="M0,450 Q300,380 600,460 T800,420" fill="none" stroke="#5B8DB8" strokeWidth="1" strokeDasharray="4,4" opacity="0.45" />
      </svg>
    </div>
  );
}

// 8. Aurora Glow
export function AuroraEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
      <div
        className="absolute -top-[30%] -left-[20%] w-[140%] h-[80%] opacity-35 blur-[90px] animate-pulse"
        style={{
          background: "radial-gradient(ellipse at 30% 20%, rgba(91, 141, 184, 0.7) 0%, rgba(168, 85, 247, 0.45) 45%, rgba(6, 182, 212, 0.4) 75%, transparent 100%)",
          animationDuration: "9s",
        }}
      />
    </div>
  );
}

// 9. Stars Twinkle
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

    const stars = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5,
      alpha: Math.random(),
      speed: 0.008 + Math.random() * 0.015,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        s.alpha += s.speed;
        const a = Math.abs(Math.sin(s.alpha));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a * 0.7})`;
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 4;
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

// 10. Fireflies / Embers
export function FirefliesEffect() {
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

    const bugs = Array.from({ length: 30 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1.5 + Math.random() * 2,
      vx: (Math.random() - 0.5) * 0.6,
      vy: -0.3 - Math.random() * 0.5,
      pulse: Math.random() * Math.PI,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      for (const b of bugs) {
        b.x += b.vx;
        b.y += b.vy;
        b.pulse += 0.04;
        if (b.y < -10) b.y = height + 10;
        if (b.x < 0) b.x = width;
        if (b.x > width) b.x = 0;

        const a = 0.3 + Math.sin(b.pulse) * 0.5;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251, 191, 36, ${Math.max(0, a)})`;
        ctx.shadowColor = "rgba(245, 158, 11, 0.9)";
        ctx.shadowBlur = 8;
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

// 11. Reactive Mesh Particles
export function ReactiveEffect({ sensitivity = 50, color = "#5B8DB8" }) {
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

    const count = 35;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * (sensitivity / 25),
      vy: (Math.random() - 0.5) * (sensitivity / 25),
      r: 2 + Math.random() * 2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `${color}${Math.round((1 - dist / 110) * 80).toString(16).padStart(2, "0")}`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animId);
    };
  }, [sensitivity, color]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1]" />;
}

export const BACKGROUND_EFFECTS_LIST = [
  { id: "none", name: "None", description: "Pure solid background without ambient overlay" },
  { id: "rain", name: "Rain", description: "Atmospheric rainfall droplets" },
  { id: "snow_stack", name: "Snow Stack", description: "Frost snowflakes with accumulation" },
  { id: "anti_fall", name: "Anti Fall", description: "Falling particles that repel away from cursor" },
  { id: "static_grain", name: "Static / Grain", description: "Retro TV static film noise" },
  { id: "vhs", name: "VHS Tapes", description: "Vintage VHS tracking scanlines and timecode" },
  { id: "old_tv", name: "Old TV", description: "CRT phosphor curve and scan beams" },
  { id: "aurora", name: "Aurora Glow", description: "Luminous polar light ribbons" },
  { id: "topographic", name: "Topographic", description: "Clean topographic vector contour lines" },
  { id: "stars", name: "Stars", description: "Twinkling stardust night sky" },
  { id: "embers", name: "Embers", description: "Warm glowing floating embers" },
  { id: "reactive", name: "Reactive", description: "Motion & audio responsive particle mesh" },
];

export function BackgroundEffect({ effect, config = {} }) {
  switch (effect) {
    case "rain":
      return <RainEffect speed={config.speed || 1} density={config.density || 1} />;
    case "snow_stack":
    case "snow":
    case "snowflakes":
      return <SnowStackEffect speed={config.speed || 1} density={config.density || 1} />;
    case "anti_fall":
      return <AntiFallEffect color={config.color || "#78A9D0"} sensitivity={config.sensitivity || 80} />;
    case "static_grain":
    case "grain":
    case "static":
      return <StaticGrainEffect opacity={config.opacity || 0.08} />;
    case "vhs":
      return <VHSEffect />;
    case "old_tv":
    case "crt":
      return <OldTVEffect />;
    case "topographic":
    case "topo":
      return <TopographicEffect />;
    case "aurora":
      return <AuroraEffect />;
    case "stars":
      return <StarsEffect />;
    case "embers":
    case "fireflies":
      return <FirefliesEffect />;
    case "reactive":
      return <ReactiveEffect sensitivity={config.sensitivity || 50} color={config.color || "#5B8DB8"} />;
    case "none":
    default:
      return null;
  }
}
