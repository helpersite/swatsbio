// Per-platform presence/display fields for links. Drives the link editor + public render.
export const PLATFORM_FIELDS = {
  discord: ["discord_mode", "avatar", "username", "banner", "status", "verified", "glow"],
  twitter: ["avatar", "username", "verified", "followers", "glow"],
  instagram: ["avatar", "username", "verified", "followers", "glow"],
  tiktok: ["avatar", "username", "verified", "followers", "glow"],
  youtube: ["avatar", "username", "verified", "subscribers", "glow"],
  twitch: ["avatar", "username", "verified", "followers", "glow"],
  kick: ["avatar", "username", "verified", "followers", "glow"],
  github: ["avatar", "username", "verified", "followers", "glow"],
  spotify: ["avatar", "username", "verified", "artist", "glow"],
  soundcloud: ["avatar", "username", "verified", "followers", "glow"],
  apple: ["avatar", "username", "verified", "glow"],
  steam: ["avatar", "username", "level", "status", "game", "glow"],
  psn: ["avatar", "username", "online", "level", "trophy", "glow"],
  xbox: ["avatar", "username", "online", "gamerscore", "achievement", "glow"],
  roblox: ["avatar", "username", "displayname", "verified", "glow"],
  riot: ["avatar", "username", "rank", "glow"],
  epic: ["avatar", "username", "glow"],
  battlenet: ["avatar", "username", "status", "glow"],
  telegram: ["avatar", "username", "verified", "online", "glow"],
  snapchat: ["avatar", "bitmoji", "username", "snapscore", "glow"],
  reddit: ["avatar", "username", "karma", "verified", "glow"],
  pinterest: ["avatar", "username", "followers", "glow"],
  threads: ["avatar", "username", "verified", "followers", "glow"],
  bluesky: ["avatar", "username", "verified", "followers", "glow"],
  linkedin: ["avatar", "username", "verified", "glow"],
  patreon: ["avatar", "username", "verified", "glow"],
  website: ["avatar", "username", "glow"],
  shop: ["avatar", "username", "glow"],
  other: ["custom_icon", "avatar", "username", "badge", "glow", "custom_fields"],
};

// kinds: toggle | value | color | avatar | username | glow | select | upload | custom
export const FIELD_META = {
  discord_mode: { kind: "select", label: "Show", options: ["profile", "server"] },
  avatar: { kind: "avatar", label: "Profile avatar" },
  bitmoji: { kind: "toggle", label: "Bitmoji" },
  banner: { kind: "color", label: "Banner" },
  status: { kind: "value", label: "Status text" },
  online: { kind: "toggle", label: "Online status" },
  username: { kind: "username", label: "Username text" },
  displayname: { kind: "value", label: "Display name" },
  verified: { kind: "toggle", label: "Verified badge" },
  badge: { kind: "toggle", label: "Badge" },
  followers: { kind: "value", label: "Follower count" },
  subscribers: { kind: "value", label: "Subscriber count" },
  karma: { kind: "value", label: "Karma" },
  snapscore: { kind: "value", label: "Snap score" },
  artist: { kind: "value", label: "Artist" },
  level: { kind: "value", label: "Level" },
  trophy: { kind: "value", label: "Trophy level" },
  gamerscore: { kind: "value", label: "Gamerscore" },
  achievement: { kind: "value", label: "Achievement" },
  game: { kind: "value", label: "Game" },
  rank: { kind: "value", label: "Rank" },
  custom_icon: { kind: "upload", label: "Custom icon" },
  custom_fields: { kind: "custom", label: "Custom fields" },
  glow: { kind: "glow", label: "Glow icon" },
};

// keys that render as a detail line on the public card
export const DETAIL_KEYS = ["displayname", "status", "followers", "subscribers", "karma", "snapscore", "artist", "level", "trophy", "gamerscore", "achievement", "game", "rank"];

export const ALL_PLATFORMS = Object.keys(PLATFORM_FIELDS);

export const AUTO_FETCH_PLATFORMS = [
  "discord",
  "github",
  "roblox",
  "reddit",
  "telegram",
  "twitter",
  "x",
  "twitch",
  "tiktok",
  "youtube",
];
