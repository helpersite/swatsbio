import React from "react";

export const PROFILE_AVATAR_EFFECTS = [
  { id: "none", name: "None", description: "No avatar effect" },
  { id: "neon_rim", name: "Neon Rim", description: "Ultra-bright neon perimeter halo aura" },
  { id: "ripple", name: "Ripple", description: "Expanding concentric energy rings" },
  { id: "shimmer", name: "Shimmer", description: "Continuous radiant metallic light sweep" },
  { id: "rainbow", name: "Rainbow", description: "Rotating chromatic rainbow spectrum border" },
  { id: "spin", name: "Spin", description: "Continuous 360-degree rotating perimeter halo" },
  { id: "cyber_vortex", name: "Orbit Vortex", description: "Rotating dual-ring field with particle sparks" },
  { id: "celestial_halo", name: "Celestial Halo", description: "Shimmering golden halo with pulsing celestial rays" },
  { id: "neon_pulse", name: "Neon Pulse", description: "Pulsing multi-chromatic neon border ring" },
  { id: "liquid_plasma", name: "Liquid Plasma", description: "Fluid rotating morphing gradient ring" },
  { id: "dragon_fire", name: "Dragon Fire", description: "Flaming red-orange ember particles rising upwards" },
  { id: "void_singularity", name: "Void Singularity", description: "Deep purple event horizon vortex" },
  { id: "electric_storm", name: "Electric Storm", description: "Crackling blue lightning arc flashes" },
  { id: "sakura_bloom", name: "Sakura Bloom", description: "Floating cherry blossom petals" },
  { id: "golden_radiance", name: "Golden Radiance", description: "Luxury spinning 24k gold bezel" },
  { id: "hyperdrive_warp", name: "Hyperdrive Warp", description: "Hyperspace warp speed streaks" },
  { id: "orbit", name: "Orbit", description: "Fine rotating rings with orbital node" },
  { id: "pulse", name: "Pulse", description: "Double shockwave pulse" },
  { id: "prism", name: "Prism", description: "Slow shifting spectrum edge" },
  { id: "scan", name: "Scan", description: "Segmented tactical scanner ring" },
  { id: "holo", name: "Holo", description: "Holographic inner color wash" },
  { id: "glitch", name: "Glitch", description: "Chromatic offset scan bars" },
  { id: "signal", name: "Signal", description: "Orbiting signal indicator points" },
];

const frameModules = import.meta.glob("../../frames/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});

export const AVATAR_FRAME_CATALOG = Object.entries(frameModules)
  .map(([path, url]) => {
    const id = path.match(/(\d+)\.png$/)?.[1] || path;
    return { id, name: `Frame ${id}`, url };
  })
  .sort((left, right) => left.id.localeCompare(right.id, undefined, { numeric: true }));

export function AvatarDecoration({ decoration, profileEffect, color }) {
  if (!decoration && !profileEffect) return null;
  if (decoration === "invisible" || (decoration === "none" && !profileEffect)) return null;

  let assetUrl = null;
  let frameId = null;

  if (typeof decoration === "object" && decoration !== null) {
    assetUrl = decoration.url || decoration.assetUrl || decoration.asset_url;
    if (!assetUrl && decoration.asset) {
      assetUrl = `https://cdn.discordapp.com/avatar-decoration-presets/${decoration.asset}.png`;
    }
    frameId = decoration.id || decoration.frame || decoration.style || decoration.profileEffect;
  } else if (typeof decoration === "string") {
    if (decoration.startsWith("http://") || decoration.startsWith("https://") || decoration.startsWith("/") || decoration.startsWith("data:")) {
      assetUrl = decoration;
    } else if (decoration.startsWith("a_") || decoration.length > 25) {
      assetUrl = `https://cdn.discordapp.com/avatar-decoration-presets/${decoration}.png`;
    } else {
      frameId = decoration;
    }
  }

  const activeEffect = profileEffect ?? decoration?.profileEffect ?? frameId ?? "none";
  if (activeEffect === "invisible" || activeEffect === "none" && !assetUrl) {
    if (!assetUrl) return null;
  }
  const effectColor = color ?? decoration?.color ?? "#7db5e3";

  // Check if it's one of our custom animated CSS frames
  const customFrames = [
    "neon_rim", "ripple", "shimmer", "bleeding", "rainbow", "spin",
    "cyber_vortex", "celestial_halo", "neon_pulse", "liquid_plasma",
    "dragon_fire", "void_singularity", "electric_storm",
    "sakura_bloom", "golden_radiance", "hyperdrive_warp"
  ];

  const isCustomFrame = customFrames.includes(activeEffect) || (frameId && customFrames.includes(frameId));
  const activeCustomFrame = isCustomFrame ? (customFrames.includes(activeEffect) ? activeEffect : frameId) : null;

  return (
    <>
      {assetUrl && (
        <img
          src={assetUrl}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 z-30 w-[108%] h-[108%] max-w-none max-h-none -translate-x-1/2 -translate-y-1/2 object-contain select-none"
        />
      )}
      
      {activeCustomFrame && (
        <div
          className={`frame-${activeCustomFrame}`}
          style={{ "--profile-effect-color": effectColor }}
          aria-hidden="true"
        />
      )}

      {activeEffect && activeEffect !== "none" && !isCustomFrame && (
        <div
          aria-hidden="true"
          className={`profile-avatar-effect profile-avatar-effect-${activeEffect}`}
          style={{ "--profile-effect-color": effectColor }}
        >
          {activeEffect === "orbit" && <><span className="profile-avatar-effect-orbit" /><span className="profile-avatar-effect-orbit-node" /></>}
          {activeEffect === "pulse" && <><span className="profile-avatar-effect-pulse" /><span className="profile-avatar-effect-pulse-inner" /></>}
          {activeEffect === "prism" && <span className="profile-avatar-effect-prism" />}
          {activeEffect === "scan" && <><span className="profile-avatar-effect-scan" /><span className="profile-avatar-effect-scan-node" /></>}
          {activeEffect === "ripple" && <><span className="profile-avatar-effect-ripple" /><span className="profile-avatar-effect-ripple-inner" /></>}
          {activeEffect === "holo" && <span className="profile-avatar-effect-holo" />}
          {activeEffect === "glitch" && <><span className="profile-avatar-effect-glitch" /><span className="profile-avatar-effect-glitch-line" /></>}
          {activeEffect === "signal" && <><span className="profile-avatar-effect-signal" /><span className="profile-avatar-effect-signal-node" /></>}
        </div>
      )}
    </>
  );
}
