// ─────────────────────────────────────────────────────────────────────────────
// Effects Registry
// Single source of truth for every visual effect the app supports.
//
// Each effect declares an id, a human name, a description and a settings
// schema. Renderers (TextEffects / CursorEffects / BackgroundEffects /
// ProfileEffects) read from this catalog so the studio UI never has to
// hardcode controls, and so no effect ships a "fake" decorative setting.
// ─────────────────────────────────────────────────────────────────────────────

// ── Schema helpers ───────────────────────────────────────────────────────────
const range = (key, label, min, max, step, def, extra = {}) => ({
  key, label, type: "range", min, max, step, default: def, ...extra,
});
const color = (key, label, def, extra = {}) => ({ key, label, type: "color", default: def, ...extra });
const toggle = (key, label, def = true, extra = {}) => ({ key, label, type: "toggle", default: def, ...extra });
const select = (key, label, options, def, extra = {}) => ({ key, label, type: "select", options, default: def, ...extra });

const ACCENT = "#5B8DB8";

// ── Group metadata ───────────────────────────────────────────────────────────
export const EFFECT_GROUP_META = {
  text: {
    id: "text",
    label: "Text & Typography",
    hint: "Animated, distorted and decorative lettering for names and headings.",
    icon: "Type",
  },
  cursor: {
    id: "cursor",
    label: "Cursor",
    hint: "Pointer trails, particles and reactive cursor decorations.",
    icon: "MousePointer2",
  },
  background: {
    id: "background",
    label: "Background",
    hint: "Ambient motion, particle fields and retro display treatments.",
    icon: "Waves",
  },
  profile: {
    id: "profile",
    label: "Profile & Cards",
    hint: "Panel surfaces, borders, avatar glow and entrance motion.",
    icon: "PanelTop",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY 1 — TEXT & TYPOGRAPHY EFFECTS
// ─────────────────────────────────────────────────────────────────────────────
export const TEXT_EFFECTS = [
  { id: "none", name: "None", description: "Clean, unmodified text." },

  {
    id: "typewriter",
    name: "Typewriter",
    description: "Reveals characters one at a time, then optionally deletes and retypes.",
    settings: [
      range("speed", "Typing speed", 20, 400, 10, 90, { unit: "ms", invert: true }),
      range("eraseSpeed", "Deleting speed", 10, 300, 10, 45, { unit: "ms", invert: true }),
      range("pause", "Pause at end", 200, 6000, 100, 2200, { unit: "ms" }),
      toggle("loop", "Loop forever", true),
      toggle("caret", "Blinking caret", true),
      color("caretColor", "Caret color", ACCENT),
      { key: "phrases", label: "Extra phrases", type: "text", default: "", placeholder: "Comma separated — leave blank to use your name" },
    ],
  },

  {
    id: "shuffle",
    name: "Shuffle",
    description: "Characters scramble through random glyphs before settling into the real text.",
    settings: [
      range("duration", "Resolve duration", 300, 4000, 100, 1200, { unit: "ms" }),
      range("stagger", "Per-character delay", 0, 120, 2, 30, { unit: "ms" }),
      select("trigger", "Trigger", [
        { v: "load", l: "On load" },
        { v: "hover", l: "On hover" },
        { v: "loop", l: "Continuous loop" },
      ], "load"),
      { key: "charset", label: "Character set", type: "text", default: "!<>-_\\/[]{}—=+*^?#________" },
      color("color", "Glow color", "#22d3ee"),
    ],
  },

  {
    id: "fuzzy",
    name: "Fuzzy",
    description: "Soft unstable blur with faint chromatic separation. Text stays readable.",
    settings: [
      range("intensity", "Blur intensity", 0, 2, 0.05, 0.4, { unit: "px" }),
      range("speed", "Instability speed", 0.2, 3, 0.1, 1),
      color("colorA", "Channel A", "#06b6d4"),
      color("colorB", "Channel B", "#ec4899"),
    ],
  },

  {
    id: "glitch",
    name: "Glitch",
    description: "Short digital-interference bursts with clipped fragments and color separation.",
    settings: [
      range("intensity", "Intensity", 0, 1, 0.05, 0.6),
      range("frequency", "Burst frequency", 0.5, 8, 0.1, 2.5, { unit: "/s" }),
      color("colorA", "Shift color A", "#00fff0"),
      color("colorB", "Shift color B", "#ff00a0"),
    ],
  },

  {
    id: "rgb_split",
    name: "RGB Split",
    description: "Separates the red/cyan channels into colored fringes around the letters.",
    settings: [
      range("offsetX", "Horizontal offset", 0, 12, 0.5, 2, { unit: "px" }),
      range("offsetY", "Vertical offset", 0, 12, 0.5, 0, { unit: "px" }),
      toggle("animated", "Animate offsets", true),
      range("speed", "Animation speed", 0.2, 3, 0.1, 1),
    ],
  },

  {
    id: "glitch_lines",
    name: "Glitch Lines",
    description: "Narrow horizontal bands that briefly cut and offset the lettering.",
    settings: [
      range("count", "Band count", 1, 10, 1, 3),
      range("thickness", "Thickness", 1, 8, 0.5, 2, { unit: "px" }),
      range("opacity", "Opacity", 0.1, 1, 0.05, 0.6),
      range("frequency", "Burst frequency", 0.5, 10, 0.5, 3, { unit: "/s" }),
      color("color", "Band color", "#38bdf8"),
    ],
  },

  {
    id: "scanline",
    name: "Scanline Text",
    description: "Fine evenly-spaced horizontal lines across the glyphs, like a CRT display.",
    settings: [
      range("spacing", "Line spacing", 2, 10, 1, 3, { unit: "px" }),
      range("opacity", "Line opacity", 0.05, 0.8, 0.05, 0.28),
      range("speed", "Scroll speed", 0, 4, 0.1, 0.6, { unit: "s", zeroLabel: "Static" }),
      color("color", "Base color", "#c8facc"),
    ],
  },

  {
    id: "flicker",
    name: "Flicker",
    description: "Neon-sign brightness instability — a stable mode and an irregular mode.",
    settings: [
      select("mode", "Mode", [
        { v: "stable", l: "Mostly stable" },
        { v: "irregular", l: "Irregular / broken tube" },
      ], "stable"),
      range("intensity", "Intensity", 0.1, 1, 0.05, 0.5),
      range("frequency", "Frequency", 0.5, 12, 0.5, 4, { unit: "/s" }),
      color("color", "Glow color", "#7dd3fc"),
    ],
  },

  {
    id: "wave",
    name: "Wave",
    description: "Letters ride a smooth sine wave with a per-character phase offset.",
    settings: [
      range("amplitude", "Amplitude", 0, 16, 0.5, 5, { unit: "px" }),
      range("wavelength", "Wavelength", 0.4, 6, 0.1, 1.4),
      range("speed", "Speed", 0.3, 4, 0.1, 1.6, { unit: "s" }),
      select("direction", "Direction", [
        { v: "horizontal", l: "Horizontal" },
        { v: "vertical", l: "Vertical" },
        { v: "diagonal", l: "Diagonal" },
      ], "horizontal"),
    ],
  },

  {
    id: "jitter",
    name: "Jitter",
    description: "Subtle, smoothed positional instability around each letter.",
    settings: [
      range("intensity", "Intensity", 0.5, 6, 0.25, 1.6, { unit: "px" }),
      range("frequency", "Frequency", 0.5, 12, 0.5, 5, { unit: "/s" }),
      toggle("perChar", "Randomize per character", true),
    ],
  },

  {
    id: "cipher",
    name: "Cipher",
    description: "Unrevealed characters display as symbols, then resolve into the real text.",
    settings: [
      range("duration", "Reveal duration", 300, 5000, 100, 1600, { unit: "ms" }),
      select("direction", "Reveal direction", [
        { v: "left", l: "Left to right" },
        { v: "right", l: "Right to left" },
        { v: "center", l: "From center out" },
        { v: "random", l: "Random order" },
      ], "left"),
      { key: "symbols", label: "Symbol set", type: "text", default: "アイウエオカキクケコサシスセソ◆◇○●▲▼" },
      color("color", "Symbol color", "#a3e635"),
    ],
  },

  {
    id: "marquee",
    name: "Marquee",
    description: "Scrolls a long line continuously across a horizontal track.",
    settings: [
      range("speed", "Scroll duration", 4, 60, 1, 16, { unit: "s" }),
      select("direction", "Direction", [
        { v: "left", l: "Right to left" },
        { v: "right", l: "Left to right" },
      ], "left"),
      range("gap", "Repeat gap", 8, 200, 4, 56, { unit: "px" }),
      toggle("pauseOnHover", "Pause on hover", true),
    ],
  },

  {
    id: "fade",
    name: "Fade",
    description: "Smooth opacity reveal or hide, whole-element or staggered per character.",
    settings: [
      select("mode", "Mode", [
        { v: "in", l: "Fade in" },
        { v: "out", l: "Fade out" },
        { v: "stagger", l: "Staggered characters" },
      ], "in"),
      range("duration", "Duration", 0.2, 4, 0.1, 0.9, { unit: "s" }),
      range("stagger", "Stagger step", 0.01, 0.4, 0.01, 0.06, { unit: "s" }),
      { key: "easing", label: "Easing", type: "text", default: "ease-out" },
    ],
  },

  {
    id: "letter_reveal",
    name: "Letter Reveal",
    description: "Characters or words appear progressively in a configurable direction.",
    settings: [
      range("stagger", "Stagger step", 0.01, 0.5, 0.01, 0.07, { unit: "s" }),
      select("unit", "Reveal by", [
        { v: "char", l: "Character" },
        { v: "word", l: "Word" },
      ], "char"),
      select("direction", "Direction", [
        { v: "left", l: "Left to right" },
        { v: "right", l: "Right to left" },
        { v: "center", l: "Center out" },
      ], "left"),
      range("rise", "Rise distance", 0, 40, 1, 12, { unit: "px" }),
    ],
  },

  {
    id: "blur_reveal",
    name: "Blur Reveal",
    description: "Starts blurred and low-opacity, then sharpens smoothly into focus.",
    settings: [
      range("blur", "Starting blur", 1, 24, 0.5, 10, { unit: "px" }),
      range("duration", "Duration", 0.3, 5, 0.1, 1.2, { unit: "s" }),
      range("stagger", "Stagger step", 0, 0.5, 0.01, 0.05, { unit: "s" }),
    ],
  },

  {
    id: "pop",
    name: "Pop",
    description: "Appears with a small scale-up and natural settling motion.",
    settings: [
      range("scale", "Start scale", 0.5, 1, 0.01, 0.82),
      range("duration", "Duration", 0.15, 1.5, 0.05, 0.45, { unit: "s" }),
      toggle("perChar", "Stagger per character", false),
    ],
  },

  {
    id: "gradient",
    name: "Gradient",
    description: "A configurable color gradient clipped to the glyph shapes.",
    settings: [
      color("colorA", "Color A", "#38bdf8"),
      color("colorB", "Color B", "#a855f7"),
      color("colorC", "Color C", "#f43f5e", { optional: true }),
      range("angle", "Angle", 0, 360, 5, 135, { unit: "°" }),
      color("fallback", "Solid fallback", "#e5e7eb", { optional: true }),
    ],
  },

  {
    id: "animated_gradient",
    name: "Animated Gradient",
    description: "Moves a gradient through the text without moving the letters.",
    settings: [
      color("colorA", "Color A", "#38bdf8"),
      color("colorB", "Color B", "#a855f7"),
      color("colorC", "Color C", "#facc15", { optional: true }),
      range("speed", "Speed", 0.5, 20, 0.5, 5, { unit: "s" }),
      select("direction", "Direction", [
        { v: "horizontal", l: "Horizontal" },
        { v: "vertical", l: "Vertical" },
        { v: "diagonal", l: "Diagonal" },
      ], "horizontal"),
      range("width", "Gradient width", 100, 500, 10, 220, { unit: "%" }),
    ],
  },

  {
    id: "neon",
    name: "Neon",
    description: "Bright sharp lettering with a controlled luminous outer glow.",
    settings: [
      color("color", "Glow color", "#22d3ee"),
      range("radius", "Glow radius", 2, 40, 1, 14, { unit: "px" }),
      range("opacity", "Glow opacity", 0.1, 1, 0.05, 0.85),
      toggle("pulse", "Subtle pulse", false),
      range("speed", "Pulse speed", 0.5, 5, 0.1, 2, { unit: "s" }),
    ],
  },

  {
    id: "outline",
    name: "Outline",
    description: "Letter outlines instead of a solid fill, with optional transparent interior.",
    settings: [
      color("color", "Outline color", ACCENT),
      range("thickness", "Outline thickness", 0.5, 4, 0.1, 1.2, { unit: "px" }),
      toggle("transparentFill", "Transparent interior", false),
      color("fillColor", "Fill color", "#ffffff"),
    ],
  },

  {
    id: "double_shadow",
    name: "Double Shadow",
    description: "Two carefully offset shadows for depth or a layered graphic look.",
    settings: [
      color("colorA", "Shadow 1 color", "#0ea5e9"),
      range("offsetA", "Shadow 1 offset", 0, 16, 0.5, 3, { unit: "px" }),
      color("colorB", "Shadow 2 color", "#f43f5e"),
      range("offsetB", "Shadow 2 offset", 0, 24, 0.5, 6, { unit: "px" }),
      range("blur", "Shadow blur", 0, 12, 0.5, 1, { unit: "px" }),
    ],
  },

  {
    id: "chrome",
    name: "Chrome",
    description: "Metallic tonal bands with an optional travelling highlight.",
    settings: [
      color("light", "Highlight", "#f8fafc"),
      color("mid", "Mid tone", "#94a3b8"),
      color("dark", "Shadow tone", "#1e293b"),
      toggle("animated", "Travelling highlight", true),
      range("speed", "Highlight speed", 1, 10, 0.5, 4, { unit: "s" }),
    ],
  },

  {
    id: "ghost",
    name: "Ghost",
    description: "Translucent, understated text with an optional soft shadow.",
    settings: [
      range("opacity", "Opacity", 0.05, 0.9, 0.05, 0.45),
      color("color", "Text color", "#e5e7eb"),
      range("shadow", "Soft shadow", 0, 24, 1, 8, { unit: "px" }),
      range("blur", "Edge blur", 0, 4, 0.1, 0, { unit: "px", zeroLabel: "Sharp" }),
    ],
  },

  {
    id: "crt",
    name: "CRT Terminal",
    description: "Monospace terminal lettering with optional scanlines and phosphor glow.",
    settings: [
      color("color", "Phosphor color", "#22c55e"),
      toggle("scanlines", "Scanlines", true),
      range("spacing", "Scanline spacing", 2, 8, 1, 3, { unit: "px" }),
      toggle("glow", "Phosphor glow", true),
      range("glowRadius", "Glow radius", 2, 30, 1, 10, { unit: "px" }),
      { key: "font", label: "Monospace font", type: "text", default: "ui-monospace, SFMono-Regular, Menlo, monospace" },
    ],
  },

  {
    id: "vhs",
    name: "VHS Noise",
    description: "Restrained analog noise plus occasional horizontal channel displacement.",
    settings: [
      range("noise", "Noise intensity", 0.02, 0.5, 0.01, 0.12),
      range("displace", "Displacement", 0, 10, 0.5, 2.5, { unit: "px" }),
      range("frequency", "Distortion frequency", 0.5, 10, 0.5, 2, { unit: "/s" }),
      color("colorA", "Channel A", "#e879f9"),
      color("colorB", "Channel B", "#38bdf8"),
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY 2 — CURSOR EFFECTS
// ─────────────────────────────────────────────────────────────────────────────
export const CURSOR_EFFECTS = [
  { id: "none", name: "System Pointer", description: "No decoration — the standard cursor." },

  {
    id: "trail",
    name: "Cursor Trail",
    description: "A fading ribbon of points that follows the pointer.",
    settings: [
      range("length", "Trail length", 4, 60, 1, 22),
      range("size", "Point size", 2, 24, 1, 8, { unit: "px" }),
      color("color", "Color", ACCENT),
      range("fade", "Fade duration", 0.1, 2, 0.05, 0.6, { unit: "s" }),
    ],
  },

  {
    id: "glow",
    name: "Glowing Cursor",
    description: "A soft light that follows the pointer and blends with the background.",
    settings: [
      range("radius", "Glow radius", 20, 300, 5, 110, { unit: "px" }),
      color("color", "Color", ACCENT),
      range("opacity", "Opacity", 0.05, 0.8, 0.05, 0.4),
      range("follow", "Follow smoothing", 0.05, 1, 0.05, 0.25),
    ],
  },

  {
    id: "particles",
    name: "Particle Trail",
    description: "Small drifting particles spawned as the pointer moves.",
    settings: [
      range("count", "Particle count", 1, 8, 1, 2, { note: "per move event" }),
      range("size", "Particle size", 1, 16, 0.5, 3, { unit: "px" }),
      range("life", "Lifetime", 0.2, 3, 0.1, 0.9, { unit: "s" }),
      range("spread", "Spread", 0, 12, 0.5, 4),
      color("color", "Color", "#5B8DB8"),
    ],
  },

  {
    id: "sparkle",
    name: "Sparkle Trail",
    description: "Star-shaped highlights that spin and fade along the cursor path.",
    settings: [
      range("density", "Density", 1, 8, 1, 3),
      range("size", "Sparkle size", 3, 26, 1, 10, { unit: "px" }),
      range("life", "Lifetime", 0.2, 2.5, 0.1, 0.8, { unit: "s" }),
      color("color", "Color", "#f5c542"),
    ],
  },

  {
    id: "star",
    name: "Star Trail",
    description: "Small rotating star particles with a short lifetime.",
    settings: [
      range("density", "Density", 1, 8, 1, 2),
      range("size", "Star size", 2, 22, 1, 8, { unit: "px" }),
      range("life", "Lifetime", 0.3, 3, 0.1, 1, { unit: "s" }),
      range("spin", "Spin speed", 0, 4, 0.1, 1, { unit: "rad/s" }),
      color("color", "Color", "#93c5fd"),
    ],
  },

  {
    id: "smoke",
    name: "Smoke Trail",
    description: "Soft expanding translucent puffs that drift and dissolve.",
    settings: [
      range("density", "Density", 1, 6, 1, 2),
      range("size", "Puff size", 6, 60, 1, 22, { unit: "px" }),
      range("drift", "Drift", -2, 2, 0.1, -0.4),
      range("life", "Lifetime", 0.5, 4, 0.1, 1.4, { unit: "s" }),
      color("color", "Color", "#cbd5e1"),
    ],
  },

  {
    id: "fire",
    name: "Fire Trail",
    description: "Warm embers that rise and shrink behind the pointer.",
    settings: [
      range("density", "Density", 1, 8, 1, 3),
      range("size", "Ember size", 2, 20, 0.5, 6, { unit: "px" }),
      range("rise", "Rise speed", 0.2, 5, 0.1, 1.4),
      range("life", "Lifetime", 0.3, 2.5, 0.1, 0.9, { unit: "s" }),
      color("color", "Core color", "#fbbf24"),
    ],
  },

  {
    id: "rainbow",
    name: "Rainbow Trail",
    description: "A trail whose colors cycle smoothly through a spectrum.",
    settings: [
      range("length", "Trail length", 4, 60, 1, 26),
      range("size", "Point size", 2, 22, 1, 9, { unit: "px" }),
      range("speed", "Hue cycle speed", 0.2, 6, 0.1, 1.5),
      select("mode", "Palette", [
        { v: "cycle", l: "Cycling rainbow" },
        { v: "fixed", l: "Fixed multicolor" },
      ], "cycle"),
    ],
  },

  {
    id: "emoji",
    name: "Emoji Trail",
    description: "Selected decorative symbols emitted along the cursor path.",
    settings: [
      range("density", "Density", 1, 6, 1, 2),
      range("size", "Symbol size", 8, 48, 1, 22, { unit: "px" }),
      range("life", "Lifetime", 0.3, 3, 0.1, 1, { unit: "s" }),
      { key: "symbols", label: "Symbol set", type: "text", default: "✦,❖,☾,✿" },
    ],
  },

  {
    id: "falling",
    name: "Falling Particles",
    description: "Particles spawned at the pointer that fall and fade under gravity.",
    settings: [
      range("density", "Density", 1, 8, 1, 2),
      range("gravity", "Gravity", 0, 5, 0.1, 1.6),
      range("size", "Particle size", 1, 16, 0.5, 4, { unit: "px" }),
      range("life", "Lifetime", 0.5, 4, 0.1, 1.6, { unit: "s" }),
      color("color", "Color", "#a3e635"),
    ],
  },

  {
    id: "dots",
    name: "Following Dots",
    description: "A small group of dots that trail the pointer with different follow factors.",
    settings: [
      range("count", "Dot count", 2, 12, 1, 5),
      range("spacing", "Follow factor", 0.05, 1, 0.01, 0.32),
      range("size", "Dot size", 2, 20, 1, 6, { unit: "px" }),
      color("color", "Color", ACCENT),
    ],
  },

  {
    id: "lines",
    name: "Following Lines",
    description: "A smoothly interpolated line drawn behind the pointer.",
    settings: [
      range("length", "Line length", 4, 60, 1, 24),
      range("width", "Line width", 1, 12, 0.5, 2.4, { unit: "px" }),
      range("fade", "Fade", 0.05, 1, 0.05, 0.5),
      color("color", "Color", "#38bdf8"),
    ],
  },

  {
    id: "ripple_move",
    name: "Ripple on Movement",
    description: "Expanding rings emitted at intervals as the pointer moves.",
    settings: [
      range("spacing", "Emit distance", 20, 300, 5, 90, { unit: "px" }),
      range("radius", "Max radius", 10, 160, 5, 48, { unit: "px" }),
      range("opacity", "Opacity", 0.1, 1, 0.05, 0.5),
      color("color", "Color", ACCENT),
    ],
  },

  {
    id: "ripple_click",
    name: "Ripple on Click",
    description: "An expanding circular wave at the click point. Never blocks the click.",
    settings: [
      range("radius", "Max radius", 20, 300, 5, 90, { unit: "px" }),
      range("duration", "Duration", 0.2, 2, 0.05, 0.7, { unit: "s" }),
      range("opacity", "Opacity", 0.1, 1, 0.05, 0.6),
      color("color", "Color", "#38bdf8"),
    ],
  },

  {
    id: "ring",
    name: "Expanding Ring",
    description: "A ring around the pointer that grows and shrinks on a configurable cycle.",
    settings: [
      range("radius", "Base radius", 8, 120, 2, 28, { unit: "px" }),
      range("pulse", "Pulse range", 0, 60, 1, 12, { unit: "px" }),
      range("thickness", "Border thickness", 0.5, 6, 0.5, 1.6, { unit: "px" }),
      color("color", "Color", ACCENT),
    ],
  },

  {
    id: "magnetic",
    name: "Magnetic Hover",
    description: "Configured elements lean gently toward the pointer while it is nearby.",
    settings: [
      range("strength", "Attraction strength", 0.05, 0.6, 0.01, 0.22),
      range("limit", "Maximum movement", 2, 40, 1, 12, { unit: "px" }),
      { key: "selector", label: "Target selector", type: "text", default: "[data-magnetic]" },
    ],
  },

  {
    id: "image",
    name: "Image Cursor",
    description: "A user-provided image as a decorative cursor with a system fallback.",
    settings: [
      { key: "url", label: "Image URL", type: "text", default: "", placeholder: "Upload or paste an image URL" },
      range("size", "Size", 8, 96, 1, 32, { unit: "px" }),
      range("hotspotX", "Hotspot X", 0, 100, 1, 50, { unit: "%" }),
      range("hotspotY", "Hotspot Y", 0, 100, 1, 50, { unit: "%" }),
    ],
  },

  {
    id: "animated",
    name: "Animated Cursor",
    description: "A small animated asset as the pointer decoration, with reduced-motion fallback.",
    settings: [
      { key: "url", label: "Animation URL (GIF/WebP)", type: "text", default: "", placeholder: "Upload or paste a GIF/WebP URL" },
      range("size", "Size", 8, 128, 1, 48, { unit: "px" }),
    ],
  },

  {
    id: "pixel",
    name: "Pixel Cursor",
    description: "A deliberately pixelated pointer drawn with crisp, unblurred edges.",
    settings: [
      range("size", "Size", 8, 64, 2, 22, { unit: "px" }),
      color("color", "Color", "#5B8DB8"),
      select("shape", "Shape", [
        { v: "arrow", l: "Arrow" },
        { v: "cross", l: "Pixel cross" },
        { v: "square", l: "Square" },
      ], "arrow"),
    ],
  },

  {
    id: "crosshair",
    name: "Crosshair",
    description: "A decorative crosshair centered on the pointer.",
    settings: [
      range("length", "Arm length", 4, 60, 1, 16, { unit: "px" }),
      range("gap", "Center gap", 0, 24, 1, 5, { unit: "px" }),
      range("thickness", "Line thickness", 0.5, 4, 0.5, 1.5, { unit: "px" }),
      color("color", "Color", ACCENT),
    ],
  },

  {
    id: "neon",
    name: "Neon Cursor",
    description: "A crisp pointer dot inside a colored luminous halo.",
    settings: [
      range("radius", "Halo radius", 10, 160, 2, 40, { unit: "px" }),
      color("color", "Halo color", "#22d3ee"),
      color("core", "Core color", "#ffffff"),
      range("thickness", "Core size", 1, 12, 0.5, 4, { unit: "px" }),
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY 3 — BACKGROUND EFFECTS
// ─────────────────────────────────────────────────────────────────────────────
export const BACKGROUND_EFFECTS = [
  { id: "none", name: "None", description: "No ambient background layer." },

  {
    id: "aurora",
    name: "Aurora",
    description: "Broad, softly blended color bands drifting like northern lights.",
    settings: [
      color("colorA", "Band A", "#22c55e"),
      color("colorB", "Band B", "#3b82f6"),
      color("colorC", "Band C", "#a855f7", { optional: true }),
      range("blur", "Blur", 20, 160, 5, 70, { unit: "px" }),
      range("speed", "Drift speed", 0.1, 3, 0.05, 0.6),
      range("opacity", "Opacity", 0.1, 1, 0.05, 0.55),
    ],
  },

  {
    id: "plasma",
    name: "Plasma",
    description: "A fluid field of luminous color with slow organic movement.",
    settings: [
      color("colorA", "Color A", "#f472b6"),
      color("colorB", "Color B", "#22d3ee"),
      range("speed", "Speed", 0.05, 1.5, 0.05, 0.25),
      range("intensity", "Intensity", 0.1, 1, 0.05, 0.6),
    ],
  },

  {
    id: "dither",
    name: "Dither",
    description: "Controlled dot distribution creating tonal variation without flicker.",
    settings: [
      range("scale", "Pattern scale", 1, 12, 0.5, 3, { unit: "px" }),
      range("density", "Density", 0.1, 1, 0.05, 0.5),
      range("contrast", "Contrast", 0.1, 2, 0.05, 1),
      color("color", "Dot color", "#94a3b8"),
      toggle("animated", "Animate pattern", false),
    ],
  },

  {
    id: "gradient",
    name: "Animated Gradient",
    description: "A background gradient that slowly changes position over time.",
    settings: [
      color("colorA", "Color A", "#0f172a"),
      color("colorB", "Color B", "#1e3a8a"),
      color("colorC", "Color C", "#7c3aed", { optional: true }),
      range("speed", "Speed", 2, 60, 1, 18, { unit: "s" }),
      select("direction", "Direction", [
        { v: "diagonal", l: "Diagonal" },
        { v: "horizontal", l: "Horizontal" },
        { v: "vertical", l: "Vertical" },
      ], "diagonal"),
    ],
  },

  {
    id: "mesh",
    name: "Mesh Gradient",
    description: "Overlapping color regions blended into an organic mesh.",
    settings: [
      color("colorA", "Color A", "#f472b6"),
      color("colorB", "Color B", "#22d3ee"),
      color("colorC", "Color C", "#a3e635", { optional: true }),
      color("colorD", "Color D", "#facc15", { optional: true }),
      range("blur", "Blur", 20, 200, 5, 80, { unit: "px" }),
      range("speed", "Drift speed", 0.1, 3, 0.05, 0.5),
    ],
  },

  {
    id: "fluid",
    name: "Fluid",
    description: "An abstract, slowly flowing color field with organic transitions.",
    settings: [
      color("colorA", "Color A", "#1d4ed8"),
      color("colorB", "Color B", "#9333ea"),
      range("speed", "Flow speed", 0.05, 1.5, 0.05, 0.22),
      range("intensity", "Intensity", 0.1, 1, 0.05, 0.5),
    ],
  },

  {
    id: "waves",
    name: "Wave Background",
    description: "Broad overlapping wave shapes flowing across the background.",
    settings: [
      color("color", "Wave color", "#38bdf8"),
      range("amplitude", "Amplitude", 5, 120, 1, 34, { unit: "px" }),
      range("frequency", "Frequency", 0.002, 0.03, 0.001, 0.008),
      range("speed", "Speed", 0.05, 1.5, 0.05, 0.4),
      range("layers", "Layers", 1, 5, 1, 3),
      range("opacity", "Opacity", 0.05, 0.8, 0.05, 0.28),
    ],
  },

  {
    id: "geometric",
    name: "Geometric Motion",
    description: "Simple shapes drifting with consistent movement rules.",
    settings: [
      range("count", "Shape count", 4, 60, 1, 18),
      select("shape", "Shape", [
        { v: "circle", l: "Circles" },
        { v: "triangle", l: "Triangles" },
        { v: "polygon", l: "Polygons" },
        { v: "line", l: "Thin lines" },
      ], "circle"),
      range("scale", "Scale", 4, 120, 1, 26, { unit: "px" }),
      range("speed", "Speed", 0.05, 2, 0.05, 0.4),
      range("opacity", "Opacity", 0.02, 0.6, 0.02, 0.16),
      color("color", "Color", "#93c5fd"),
    ],
  },

  {
    id: "particles",
    name: "Floating Particles",
    description: "Small particles drifting slowly, with optional depth layers.",
    settings: [
      range("count", "Particle count", 10, 300, 5, 90),
      range("size", "Size", 0.5, 8, 0.5, 1.8, { unit: "px" }),
      range("speed", "Drift speed", 0.05, 2, 0.05, 0.35),
      range("opacity", "Opacity", 0.05, 1, 0.05, 0.5),
      toggle("depth", "Depth layers", true),
      color("color", "Color", "#cbd5e1"),
    ],
  },

  {
    id: "network",
    name: "Particle Network",
    description: "Moving particles linked by thin lines when they come close.",
    settings: [
      range("count", "Particle count", 10, 160, 5, 55),
      range("distance", "Connection distance", 40, 240, 5, 120, { unit: "px" }),
      range("speed", "Speed", 0.05, 1.5, 0.05, 0.35),
      range("opacity", "Line opacity", 0.03, 0.6, 0.02, 0.16),
      color("color", "Color", "#60a5fa"),
    ],
  },

  {
    id: "starfield",
    name: "Starfield",
    description: "Stars that drift slowly, or move outward to suggest depth.",
    settings: [
      range("density", "Star density", 20, 400, 5, 160),
      range("size", "Star size", 0.4, 4, 0.2, 1.3, { unit: "px" }),
      range("speed", "Speed", 0, 3, 0.05, 0.5),
      toggle("warp", "Warp outward", false),
      color("color", "Star color", "#e2e8f0"),
    ],
  },

  {
    id: "snow",
    name: "Snowfall",
    description: "Snow particles falling with gentle drift and wrap-around.",
    settings: [
      range("count", "Particle count", 20, 400, 5, 150),
      range("speed", "Fall speed", 0.2, 4, 0.1, 1),
      range("size", "Flake size", 0.5, 6, 0.5, 1.6, { unit: "px" }),
      range("drift", "Drift", -2, 2, 0.1, 0.4),
      color("color", "Flake color", "#f1f5f9"),
    ],
  },

  {
    id: "rain",
    name: "Rain",
    description: "Thin falling streaks, distinct from snowfall.",
    settings: [
      range("count", "Drop count", 20, 400, 5, 120),
      range("speed", "Fall speed", 2, 30, 1, 12),
      range("length", "Streak length", 4, 60, 1, 18, { unit: "px" }),
      range("opacity", "Opacity", 0.05, 1, 0.05, 0.4),
      color("color", "Streak color", "#a5d8ff"),
    ],
  },

  {
    id: "dust",
    name: "Floating Dust",
    description: "Small low-opacity motes drifting in different directions.",
    settings: [
      range("count", "Count", 20, 400, 5, 130),
      range("size", "Size", 0.4, 4, 0.2, 1.1, { unit: "px" }),
      range("speed", "Speed", 0.05, 1.5, 0.05, 0.25),
      range("opacity", "Opacity", 0.02, 0.5, 0.02, 0.16),
      color("color", "Color", "#fef3c7"),
    ],
  },

  {
    id: "bubbles",
    name: "Bubbles",
    description: "Translucent circles rising and fading, with soft highlights.",
    settings: [
      range("count", "Bubble count", 5, 120, 1, 26),
      range("size", "Size", 4, 80, 1, 22, { unit: "px" }),
      range("speed", "Rise speed", 0.1, 4, 0.1, 0.7),
      range("opacity", "Opacity", 0.05, 0.7, 0.05, 0.25),
      color("color", "Color", "#93c5fd"),
    ],
  },

  {
    id: "fireflies",
    name: "Fireflies",
    description: "Glowing motes that drift and slowly vary in brightness.",
    settings: [
      range("count", "Count", 5, 120, 1, 32),
      range("glow", "Glow radius", 4, 60, 1, 18, { unit: "px" }),
      range("speed", "Speed", 0.05, 1.5, 0.05, 0.35),
      color("color", "Color", "#fde047"),
    ],
  },

  {
    id: "symbols",
    name: "Floating Symbols",
    description: "Decorative characters drifting behind the content.",
    settings: [
      { key: "symbols", label: "Symbol set", type: "text", default: "✦ ❖ ☾ ✿ ◈ ✧" },
      range("count", "Count", 5, 120, 1, 30),
      range("size", "Size", 8, 64, 1, 22, { unit: "px" }),
      range("speed", "Drift speed", 0.05, 1.5, 0.05, 0.3),
      range("opacity", "Opacity", 0.02, 0.5, 0.02, 0.14),
      color("color", "Color", "#c4b5fd"),
    ],
  },

  {
    id: "particle_waves",
    name: "Particle Waves",
    description: "Particles moving in coordinated wave rows rather than randomly.",
    settings: [
      range("count", "Columns", 10, 160, 1, 54),
      range("height", "Wave height", 4, 120, 1, 34, { unit: "px" }),
      range("speed", "Speed", 0.2, 4, 0.1, 1.2),
      range("spacing", "Spacing", 6, 60, 1, 18, { unit: "px" }),
      color("color", "Color", "#38bdf8"),
    ],
  },

  {
    id: "scanlines",
    name: "Scanline Overlay",
    description: "Evenly spaced horizontal lines, stationary or slowly moving.",
    settings: [
      range("spacing", "Spacing", 2, 12, 1, 4, { unit: "px" }),
      range("thickness", "Line thickness", 0.5, 4, 0.5, 1, { unit: "px" }),
      range("opacity", "Opacity", 0.02, 0.5, 0.02, 0.14),
      range("speed", "Scroll speed", 0, 8, 0.5, 0, { unit: "s", zeroLabel: "Static" }),
    ],
  },

  {
    id: "crt",
    name: "CRT Display",
    description: "Scanlines, restrained glow, vignette and optional noise as independent layers.",
    settings: [
      toggle("scanlines", "Scanlines", true),
      range("scanSpacing", "Scanline spacing", 2, 10, 1, 3, { unit: "px" }),
      toggle("glow", "Screen glow", true),
      color("glowColor", "Glow color", "#22c55e"),
      toggle("vignette", "Vignette", true),
      range("noise", "Noise", 0, 0.3, 0.01, 0.05),
    ],
  },

  {
    id: "vhs",
    name: "VHS Noise",
    description: "Intermittent noise, horizontal displacement and slight color separation.",
    settings: [
      range("noise", "Noise intensity", 0.02, 0.4, 0.01, 0.1),
      range("frequency", "Glitch frequency", 0.5, 10, 0.5, 2, { unit: "/s" }),
      range("displace", "Displacement", 0, 14, 1, 4, { unit: "px" }),
      range("opacity", "Opacity", 0.1, 1, 0.05, 0.5),
    ],
  },

  {
    id: "static",
    name: "Digital Static",
    description: "A controlled layer of small, rapidly changing noise marks.",
    settings: [
      range("density", "Noise density", 0.05, 1, 0.05, 0.3),
      range("opacity", "Opacity", 0.02, 0.5, 0.02, 0.1),
      range("speed", "Update rate", 2, 30, 1, 12, { unit: "/s" }),
    ],
  },

  {
    id: "glitch",
    name: "Glitch Interference",
    description: "Occasional horizontal bands and brief displacement over the background.",
    settings: [
      range("bands", "Band count", 1, 12, 1, 4),
      range("thickness", "Band thickness", 4, 80, 1, 22, { unit: "px" }),
      range("intensity", "Intensity", 0.1, 1, 0.05, 0.5),
      range("frequency", "Event frequency", 0.5, 10, 0.5, 3, { unit: "/s" }),
    ],
  },

  {
    id: "dither_texture",
    name: "Dithered Texture",
    description: "A consistent ordered dot/pixel pattern that adds texture.",
    settings: [
      range("scale", "Pattern scale", 1, 10, 0.5, 2, { unit: "px" }),
      range("opacity", "Opacity", 0.02, 0.5, 0.02, 0.14),
      range("contrast", "Contrast", 0.2, 3, 0.05, 1),
      select("pattern", "Pattern", [
        { v: "dots", l: "Dots" },
        { v: "checker", l: "Checkerboard" },
        { v: "diagonal", l: "Diagonal lines" },
      ], "dots"),
    ],
  },

  {
    id: "pixel_grid",
    name: "Pixel Grid",
    description: "A subtle grid of squares behind the content.",
    settings: [
      range("cell", "Cell size", 6, 80, 1, 28, { unit: "px" }),
      range("opacity", "Line opacity", 0.02, 0.5, 0.02, 0.12),
      color("color", "Line color", "#5B8DB8"),
      toggle("animated", "Gently drift", false),
      range("speed", "Drift speed", 1, 30, 1, 10, { unit: "s" }),
    ],
  },

  {
    id: "falling_code",
    name: "Falling Code",
    description: "Streams of decorative characters falling vertically.",
    settings: [
      { key: "charset", label: "Character set", type: "text", default: "01アイウエオカキクケコ" },
      range("density", "Column density", 10, 160, 1, 46),
      range("speed", "Fall speed", 0.2, 6, 0.1, 1.4),
      range("size", "Glyph size", 8, 28, 1, 15, { unit: "px" }),
      color("color", "Color", "#22c55e"),
      range("opacity", "Opacity", 0.05, 0.9, 0.05, 0.4),
    ],
  },

  {
    id: "light_streaks",
    name: "Light Streaks",
    description: "Narrow glowing bands sweeping across the background.",
    settings: [
      range("angle", "Angle", 0, 180, 1, 25, { unit: "°" }),
      range("width", "Width", 20, 400, 5, 140, { unit: "px" }),
      range("speed", "Speed", 1, 30, 1, 9, { unit: "s" }),
      range("opacity", "Opacity", 0.03, 0.5, 0.02, 0.14),
      color("color", "Color", "#bfdbfe"),
      range("count", "Streak count", 1, 6, 1, 2),
    ],
  },

  {
    id: "moving_grid",
    name: "Moving Grid",
    description: "A grid that slowly shifts to create a subtle sense of depth.",
    settings: [
      range("spacing", "Grid spacing", 10, 160, 2, 46, { unit: "px" }),
      range("thickness", "Line thickness", 0.5, 4, 0.5, 1, { unit: "px" }),
      range("opacity", "Line opacity", 0.02, 0.5, 0.02, 0.12),
      range("speed", "Movement speed", 0, 20, 0.5, 6, { unit: "s", zeroLabel: "Static" }),
      color("color", "Line color", "#5B8DB8"),
    ],
  },

  {
    id: "fog",
    name: "Fog / Mist",
    description: "Slowly drifting soft translucent layers.",
    settings: [
      color("color", "Tint color", "#cbd5e1"),
      range("opacity", "Opacity", 0.02, 0.5, 0.02, 0.14),
      range("scale", "Blob scale", 40, 400, 10, 180, { unit: "%" }),
      range("speed", "Drift speed", 0.05, 2, 0.05, 0.35),
    ],
  },

  {
    id: "vignette",
    name: "Vignette",
    description: "Darkens or tints the outer edges while the center stays visible.",
    settings: [
      range("radius", "Inner radius", 10, 90, 1, 55, { unit: "%" }),
      range("softness", "Softness", 5, 80, 1, 45, { unit: "%" }),
      range("intensity", "Intensity", 0.1, 1, 0.05, 0.7),
      color("color", "Tint color", "#000000"),
    ],
  },

  {
    id: "blur",
    name: "Background Blur",
    description: "Blurs only the ambient background layer, keeping text sharp.",
    settings: [
      range("radius", "Blur radius", 1, 40, 1, 8, { unit: "px" }),
      range("opacity", "Layer opacity", 0, 1, 0.05, 0.6),
    ],
  },

  {
    id: "glow_haze",
    name: "Glow Haze",
    description: "A diffuse luminous region behind the profile content.",
    settings: [
      color("color", "Color", ACCENT),
      range("radius", "Radius", 30, 100, 2, 65, { unit: "%" }),
      range("opacity", "Opacity", 0.05, 0.9, 0.05, 0.3),
      toggle("pulse", "Slow pulse", true),
      range("speed", "Pulse speed", 1, 12, 0.5, 5, { unit: "s" }),
    ],
  },

  {
    id: "light_rays",
    name: "Light Rays",
    description: "Broad translucent rays of light across the background.",
    settings: [
      color("color", "Color", "#fef9c3"),
      range("angle", "Angle", 0, 180, 1, 60, { unit: "°" }),
      range("width", "Ray width", 10, 300, 5, 90, { unit: "px" }),
      range("count", "Ray count", 2, 16, 1, 6),
      range("opacity", "Opacity", 0.02, 0.4, 0.02, 0.1),
      range("speed", "Drift speed", 0, 4, 0.1, 0.5),
    ],
  },

  {
    id: "floating_gradients",
    name: "Floating Gradients",
    description: "Several independently moving gradient blobs.",
    settings: [
      range("count", "Blob count", 2, 12, 1, 5),
      color("colorA", "Color A", "#f472b6"),
      color("colorB", "Color B", "#22d3ee"),
      range("size", "Blob size", 10, 120, 2, 42, { unit: "%" }),
      range("blur", "Blur", 20, 200, 5, 80, { unit: "px" }),
      range("speed", "Speed", 0.05, 2, 0.05, 0.4),
    ],
  },

  {
    id: "neon_halo",
    name: "Neon Halo",
    description: "A soft colored ring or glow behind the profile panel.",
    settings: [
      color("color", "Color", "#a855f7"),
      range("radius", "Radius", 20, 100, 2, 55, { unit: "%" }),
      range("opacity", "Opacity", 0.05, 0.9, 0.05, 0.32),
      range("pulse", "Pulse speed", 0, 12, 0.5, 5, { unit: "s", zeroLabel: "Static" }),
    ],
  },

  {
    id: "pulsing_glow",
    name: "Pulsing Glow",
    description: "Slowly varies the brightness and size of a background glow.",
    settings: [
      color("color", "Color", ACCENT),
      range("intensity", "Intensity", 0.1, 1, 0.05, 0.5),
      range("duration", "Pulse duration", 1, 20, 0.5, 6, { unit: "s" }),
      range("radius", "Radius", 20, 100, 2, 60, { unit: "%" }),
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY 4 — PROFILE, BORDER & COMPONENT EFFECTS
// (panel / border / entrance — single select, plus independent tilt & hover)
// ─────────────────────────────────────────────────────────────────────────────
export const PROFILE_EFFECTS = [
  { id: "none", name: "None", description: "Plain panel with no added treatment." },

  {
    id: "fade_in",
    name: "Fade Entrance",
    description: "The profile panel fades into view once on page entry.",
    settings: [
      range("duration", "Duration", 0.2, 3, 0.1, 0.8, { unit: "s" }),
      range("delay", "Delay", 0, 2, 0.05, 0, { unit: "s" }),
    ],
  },

  {
    id: "slide_up",
    name: "Slide Entrance",
    description: "The panel slides up into its final position on entry.",
    settings: [
      range("distance", "Distance", 8, 120, 2, 36, { unit: "px" }),
      range("duration", "Duration", 0.2, 3, 0.05, 0.7, { unit: "s" }),
      range("delay", "Delay", 0, 2, 0.05, 0, { unit: "s" }),
    ],
  },

  {
    id: "scale_pop",
    name: "Pop Entrance",
    description: "A restrained scale-up that settles without bouncing.",
    settings: [
      range("scale", "Start scale", 0.7, 1, 0.01, 0.9),
      range("duration", "Duration", 0.15, 1.5, 0.05, 0.5, { unit: "s" }),
    ],
  },

  {
    id: "border_pulse",
    name: "Pulsing Border",
    description: "Slowly varies the border glow while keeping it visible.",
    settings: [
      color("color", "Border color", ACCENT),
      range("width", "Border width", 1, 6, 0.5, 1.5, { unit: "px" }),
      range("pulse", "Pulse intensity", 0.05, 1, 0.05, 0.5),
      range("speed", "Pulse speed", 0.5, 8, 0.5, 3, { unit: "s" }),
    ],
  },

  {
    id: "border_gradient",
    name: "Gradient Border",
    description: "A border whose color travels across a gradient.",
    settings: [
      color("colorA", "Color A", "#38bdf8"),
      color("colorB", "Color B", "#a855f7"),
      color("colorC", "Color C", "#f43f5e", { optional: true }),
      range("width", "Border width", 1, 6, 0.5, 2, { unit: "px" }),
      range("speed", "Travel speed", 1, 20, 0.5, 6, { unit: "s" }),
      range("radius", "Corner radius", 0, 48, 1, 24, { unit: "px" }),
    ],
  },

  {
    id: "border_neon",
    name: "Neon Border",
    description: "A bright crisp edge with a controlled outer glow.",
    settings: [
      color("color", "Edge color", "#22d3ee"),
      range("width", "Edge width", 1, 5, 0.5, 1.5, { unit: "px" }),
      range("glow", "Glow intensity", 0, 60, 1, 22, { unit: "px" }),
      range("opacity", "Glow opacity", 0.1, 1, 0.05, 0.7),
    ],
  },

  {
    id: "avatar_glow",
    name: "Avatar Glow",
    description: "A soft colored glow behind the avatar, independent of its crop.",
    settings: [
      color("color", "Glow color", "#7db5e3"),
      range("radius", "Glow radius", 0, 60, 1, 24, { unit: "px" }),
      range("intensity", "Intensity", 0.1, 1, 0.05, 0.7),
      toggle("pulse", "Slow pulse", false),
    ],
  },

  {
    id: "panel_gradient",
    name: "Panel Gradient",
    description: "A configurable gradient surface for the profile panel.",
    settings: [
      color("colorA", "Color A", "#101827"),
      color("colorB", "Color B", "#1e3a8a"),
      range("angle", "Angle", 0, 360, 5, 135, { unit: "°" }),
      range("opacity", "Layer opacity", 0.1, 1, 0.05, 0.85),
    ],
  },

  {
    id: "panel_blur",
    name: "Panel Blur",
    description: "Frosted blur on the panel's background layer only; content stays sharp.",
    settings: [
      range("radius", "Blur radius", 2, 40, 1, 14, { unit: "px" }),
      range("opacity", "Background opacity", 0.05, 1, 0.05, 0.55),
    ],
  },
];

// Independent profile subsystems (always available regardless of the panel effect)
export const CARD_TILT_SCHEMA = [
  toggle("enabled", "Enable card tilt", true),
  range("maxTilt", "Maximum tilt", 0, 30, 0.5, 12, { unit: "°" }),
  range("perspective", "Perspective", 400, 2400, 50, 1000, { unit: "px" }),
  range("scale", "Hover scale", 1, 1.1, 0.005, 1.015),
  range("smoothing", "Motion smoothing", 0.02, 1, 0.02, 0.16),
  toggle("shift", "Translate with pointer", true),
  toggle("disableOnTouch", "Disable on touch devices", true),
  toggle("glare", "Light sheen follows pointer", false),
];

export const HOVER_SCHEMA = [
  toggle("glow", "Hover glow", false),
  color("glowColor", "Glow color", ACCENT),
  range("glowIntensity", "Glow intensity", 0.05, 1, 0.05, 0.5),
  toggle("lift", "Hover lift", false),
  range("liftDistance", "Lift distance", 1, 20, 1, 5, { unit: "px" }),
  toggle("scale", "Hover scale", false),
  range("scaleAmount", "Scale amount", 1, 1.1, 0.005, 1.03),
];

// ─────────────────────────────────────────────────────────────────────────────
// Accessors / helpers
// ─────────────────────────────────────────────────────────────────────────────
export const EFFECT_GROUPS = {
  text: TEXT_EFFECTS,
  cursor: CURSOR_EFFECTS,
  background: BACKGROUND_EFFECTS,
  profile: PROFILE_EFFECTS,
};

const BY_GROUP_ID = Object.fromEntries(
  Object.entries(EFFECT_GROUPS).map(([group, list]) => [
    group,
    Object.fromEntries(list.map((effect) => [effect.id, effect])),
  ])
);

// Legacy stored values → new effect ids (kept so existing profiles keep working)
const LEGACY_ALIASES = {
  background: {
    snow_fall: "snow",
    snow_stack: "snow",
    shimmer: "light_streaks",
    grain: "dither_texture",
    static_grain: "static",
    vhs_tape: "vhs",
  },
  cursor: {
    sparkles: "sparkle",
    neon_aura: "neon",
    glow_dot: "neon",
    crosshair: "crosshair",
    trail: "trail",
  },
  text: {
    waveflow: "wave",
    wave: "wave",
    rainbow: "animated_gradient",
    rgbglow: "rgb_split",
    glow: "neon",
    sparkle: "shuffle",
    stack: "double_shadow",
    grain: "vhs",
    outline: "outline",
    neon: "neon",
    flicker: "flicker",
    typewriter: "typewriter",
    glitch: "glitch",
    fuzzy: "fuzzy",
    shuffle: "shuffle",
  },
  profile: {
    neon_rim: "border_neon",
    ripple: "border_pulse",
    shimmer: "border_gradient",
    neon_pulse: "border_pulse",
    prism: "border_gradient",
    orbit: "border_gradient",
    pulse: "border_pulse",
    scan: "border_gradient",
    holo: "panel_gradient",
    glitch: "border_neon",
    signal: "border_pulse",
  },
};

export function getEffect(group, id) {
  const table = BY_GROUP_ID[group];
  if (!table) return null;
  return table[id] || null;
}

/** Resolve a stored (possibly legacy) id to a real effect id for a group. */
export function resolveEffectId(group, id) {
  if (!id || id === "none") return "none";
  const table = BY_GROUP_ID[group] || {};
  if (table[id]) return id;
  const alias = LEGACY_ALIASES[group]?.[id];
  if (alias && table[alias]) return alias;
  return "none";
}

/** Build the default config object for an effect from its schema. */
export function buildDefaultConfig(group, id) {
  const effect = getEffect(group, id);
  if (!effect?.settings) return {};
  return effect.settings.reduce((acc, setting) => {
    acc[setting.key] = setting.default;
    return acc;
  }, {});
}

const GROUP_DEFAULTS = { text: "none", cursor: "none", background: "none", profile: "none" };

/**
 * Read the full effect state from a settings object, applying legacy fallbacks
 * so older profiles render with the new engine.
 */
export function readEffectState(settings = {}) {
  const stored = settings.effects || {};
  const state = {};

  for (const group of Object.keys(EFFECT_GROUPS)) {
    const raw = stored[group];
    const legacyId =
      group === "background" ? settings.bg_effect
        : group === "cursor" ? settings.cursor_fx
          : group === "text" ? settings.name_effect
            : group === "profile" ? settings.profile_effect
              : undefined;

    const id = resolveEffectId(group, raw?.effect ?? legacyId ?? GROUP_DEFAULTS[group]);
    state[group] = {
      effect: id,
      config: { ...buildDefaultConfig(group, id), ...(raw?.config || {}) },
    };
  }

  state.cardTilt = Object.fromEntries(
    CARD_TILT_SCHEMA.map((f) => [f.key, settings.card_tilt?.[f.key] ?? f.default])
  );
  state.hover = Object.fromEntries(
    HOVER_SCHEMA.map((f) => [f.key, settings.hover_effects?.[f.key] ?? f.default])
  );

  return state;
}

/** Immutably write one group's { effect, config } back into a settings object. */
export function writeEffectState(settings, group, patch) {
  const current = settings.effects || {};
  const prev = current[group] || {};
  const next = {
    ...current,
    [group]: {
      effect: patch.effect ?? prev.effect ?? "none",
      config: { ...(prev.config || {}), ...(patch.config || {}) },
    },
  };
  // Keep the legacy flat keys in sync so any older component still works.
  const legacyKey = { background: "bg_effect", cursor: "cursor_fx", text: "name_effect", profile: "profile_effect" }[group];
  const out = { ...settings, effects: next };
  if (legacyKey) out[legacyKey] = next[group].effect;
  return out;
}

export function schemaDefaults(schema) {
  return Object.fromEntries(schema.map((f) => [f.key, f.default]));
}
