import React from "react";

// Official SVG vector paths and colors for Discord Badges
export const DISCORD_BADGES_CATALOG = [
  {
    id: "nitro",
    name: "Discord Nitro",
    desc: "Nitro subscription reported by Discord",
    color: "#f47fff",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M19.44 5.25c-.21-.08-.43.04-.49.25l-2.09 7.02c-.06.2.04.42.24.48.2.06.42-.04.48-.24l2.09-7.02c.07-.21-.03-.43-.23-.49zm-4.73 2.14c-.2-.08-.42.02-.5.21l-3.32 8.08c-.08.2.02.43.21.51.2.08.43-.02.51-.21l3.32-8.08c.08-.2-.02-.43-.22-.51zm-4.66 2.08c-.19-.09-.42-.01-.51.18L6.41 16.5c-.09.19 0 .42.18.51.19.09.42.01.51-.18l3.13-6.85c.09-.19 0-.42-.18-.51z"/>
        <path d="M2.5 12a9.5 9.5 0 1 0 19 0 9.5 9.5 0 0 0-19 0zm9.5-11C5.65 1 .5 6.15.5 12.5S5.65 24 12 24s11.5-5.15 11.5-11.5S18.35 1 12 1z"/>
      </svg>
    ),
  },
  {
    id: "booster",
    name: "Server Booster (24 Months+)",
    desc: "Boosting servers with Level 9 Pink Gem Aura",
    color: "#f47fff",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M12 1.5l2.84 5.76 6.36.93-4.6 4.48 1.09 6.33L12 16.01l-5.69 2.99 1.09-6.33-4.6-4.48 6.36-.93L12 1.5z" />
      </svg>
    ),
  },
  {
    id: "hypesquad_events",
    name: "HypeSquad Events",
    desc: "Discord HypeSquad Events participant",
    color: "#5865f2",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M12 1.5 14.8 7l6.2.9-4.5 4.4 1.1 6.2L12 15.6l-5.6 2.9 1.1-6.2L3 7.9 9.2 7 12 1.5z" />
      </svg>
    ),
  },
  {
    id: "hypesquad_bravery",
    name: "HypeSquad Bravery",
    desc: "Member of the HypeSquad Bravery House",
    color: "#9c84ef",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M1.74 5.92L12 0l10.26 5.92v12.16L12 24 1.74 18.08V5.92zm10.26 14.71l7.08-4.09V7.46L12 3.37 4.92 7.46v9.08l7.08 4.09z" />
        <path d="M12 6.5l4.5 2.6v5.8L12 17.5l-4.5-2.6V9.1L12 6.5z" />
      </svg>
    ),
  },
  {
    id: "hypesquad_brilliance",
    name: "HypeSquad Brilliance",
    desc: "Member of the HypeSquad Brilliance House",
    color: "#f47b67",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M12 0L1.74 5.92v12.16L12 24l10.26-5.92V5.92L12 0zm0 3.37l7.08 4.09v9.08L12 20.63l-7.08-4.09V7.46L12 3.37z" />
        <polygon points="12,6 16,12 12,18 8,12" />
      </svg>
    ),
  },
  {
    id: "hypesquad_balance",
    name: "HypeSquad Balance",
    desc: "Member of the HypeSquad Balance House",
    color: "#45ddc0",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M12 0L1.74 5.92v12.16L12 24l10.26-5.92V5.92L12 0zm0 3.37l7.08 4.09v9.08L12 20.63l-7.08-4.09V7.46L12 3.37z" />
        <circle cx="12" cy="12" r="4.5" />
      </svg>
    ),
  },
  {
    id: "early_supporter",
    name: "Early Supporter",
    desc: "Discord Early Supporter Badge",
    color: "#f47fff",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    ),
  },
  {
    id: "active_developer",
    name: "Active Developer",
    desc: "Creator of active verified applications on Discord",
    color: "#57f287",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M12 2L1 7l11 5 9-4.09V17h2V7L12 2zM3.46 8.87L12 12.75l8.54-3.88L12 4.97 3.46 8.87zM12 14.25L3 10.16V17l9 5 9-5v-6.84l-9 4.09z"/>
      </svg>
    ),
  },
  {
    id: "bug_hunter_1",
    name: "Discord Bug Hunter",
    desc: "Discovered and reported critical vulnerabilities",
    color: "#57f287",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M19 8h-1.81a5.985 5.985 0 0 0-1.82-1.96l.93-.93a.996.996 0 1 0-1.41-1.41l-1.47 1.47C12.82 5.06 12.18 5 11.5 5s-1.32.06-1.92.17L8.11 3.7a.996.996 0 1 0-1.41 1.41l.93.93C6.77 6.69 6.16 7.29 5.81 8H4c-.55 0-1 .45-1 1s.45 1 1 1h1.16c-.1 0-.16.32-.16.5v1H3c-.55 0-1 .45-1 1s.45 1 1 1h2v1H3c-.55 0-1 .45-1 1s.45 1 1 1h2v1H3c-.55 0-1 .45-1 1s.45 1 1 1h2c0 .18.06.5.16.5H4c-.55 0-1 .45-1 1s.45 1 1 1h1.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H19c.55 0 1-.45 1-1s-.45-1-1-1h-1.16c.1 0 .16-.32.16-.5H20c.55 0 1-.45 1-1s-.45-1-1-1h-1v-1h1c.55 0 1-.45 1-1s-.45-1-1-1h-1v-1h1c.55 0 1-.45 1-1s-.45-1-1-1h-1v-1h1c.55 0 1-.45 1-1s-.45-1-1-1h-1.16c-.1 0-.16-.32-.16-.5H19c.55 0 1-.45 1-1s-.45-1-1-1z"/>
      </svg>
    ),
  },
  {
    id: "bug_hunter_2",
    name: "Discord Bug Hunter (Level 2)",
    desc: "Discord Bug Hunter Level 2",
    color: "#f0b232",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M19 8h-1.8a6 6 0 0 0-1.8-2l.9-.9a1 1 0 0 0-1.4-1.4l-1.5 1.5a8 8 0 0 0-3.8 0L8.1 3.7a1 1 0 0 0-1.4 1.4l.9.9A6 6 0 0 0 5.8 8H4a1 1 0 1 0 0 2h1v2H3a1 1 0 1 0 0 2h2v2H4a1 1 0 1 0 0 2h1.8a6 6 0 0 0 12.4 0H20a1 1 0 1 0 0-2h-1v-2h2a1 1 0 1 0 0-2h-2v-2h1a1 1 0 1 0 0-2z" />
      </svg>
    ),
  },
  {
    id: "verified_developer",
    name: "Early Verified Bot Developer",
    desc: "Verified application developer pioneer",
    color: "#5865f2",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"/>
      </svg>
    ),
  },
  {
    id: "certified_moderator",
    name: "Certified Discord Moderator",
    desc: "Discord Certified Moderator Alumni",
    color: "#5865f2",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
      </svg>
    ),
  },
  {
    id: "partner",
    name: "Partnered Server Owner",
    desc: "Discord Official Community Partner",
    color: "#5865f2",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm4.5 13.5l-4.5-2.7-4.5 2.7 1.2-5.1-3.9-3.4 5.2-.4L12 4.8l2 4.7 5.2.4-3.9 3.4 1.2 5.2z"/>
      </svg>
    ),
  },
  {
    id: "staff",
    name: "Discord Staff",
    desc: "Official Discord Employee & System Engineer",
    color: "#5865f2",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
      </svg>
    ),
  },
];

const VERIFIED_BADGE_FLAGS = [
  [0, "staff"],
  [1, "partner"],
  [2, "hypesquad_events"],
  [3, "bug_hunter_1"],
  [6, "hypesquad_bravery"],
  [7, "hypesquad_brilliance"],
  [8, "hypesquad_balance"],
  [9, "early_supporter"],
  [14, "bug_hunter_2"],
  [17, "verified_developer"],
  [18, "certified_moderator"],
  [22, "active_developer"],
];

export function getDiscordBadges(discord = {}) {
  if (discord && discord.is_member === false) return [];

  const flags = Number(discord.public_flags) || 0;
  const badgeIds = VERIFIED_BADGE_FLAGS
    .filter(([bit]) => (flags & (2 ** bit)) !== 0)
    .map(([, id]) => id);

  if (Number(discord.premium_type) > 0) badgeIds.push("nitro");
  return [...new Set(badgeIds)];
}

export function DiscordBadgeIcon({ id, badgeId, size = 16, className = "" }) {
  const resolvedId = id || badgeId;
  const badge = DISCORD_BADGES_CATALOG.find((b) => b.id === resolvedId);
  if (!badge) return null;
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: `${size}px`, height: `${size}px`, color: badge.color }}
      title={`${badge.name}: ${badge.desc}`}
    >
      {badge.icon}
    </span>
  );
}
