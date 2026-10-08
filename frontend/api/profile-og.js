const BACKEND_URL = (process.env.BACKEND_URL || process.env.VITE_API_URL || "https://swatsbio-production.up.railway.app")
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

const RESERVED_PATHS = new Set(["api", "dashboard", "s", "auth", "pricing", "legal", "compare", "waitlist"]);

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function mediaUrl(value) {
  if (!value || value === "invisible") return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${BACKEND_URL}${value}`;
  const path = value.split("/").map(encodeURIComponent).join("/");
  return `${BACKEND_URL}/api/files/${path}`;
}

function isVideo(value) {
  return /\.(mp4|webm|mov|m4v|ogg)([?#]|$)/i.test(value || "");
}

function stripEffectSyntax(text) {
  if (!text || typeof text !== "string") return "";
  let clean = text;
  clean = clean.replace(/\[:([a-zA-Z0-9_#-]+):([^:\n\]]+):([a-zA-Z0-9_#-]+):\]/g, "$2");
  clean = clean.replace(/\[:([a-zA-Z0-9_#-]+):([^:\n\]]+):\]/g, "$2");
  clean = clean.replace(/\[:([a-zA-Z0-9_#-]+):\]/g, "");
  clean = clean.replace(/:([a-zA-Z0-9_#-]+):([^:\n]+):([a-zA-Z0-9_#-]+):/g, "$2");
  clean = clean.replace(/:([a-zA-Z0-9_#-]+):([^:\n]+):/g, "$2");
  clean = clean.replace(/:([a-zA-Z0-9_#-]+):/g, "");
  clean = clean.replace(/\[\/?(?:b|i|u|s|color|glow|neon|sparkle|glitch|wave|fire|badge|font)[^\]]*\]/gi, "");
  clean = clean.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
  clean = clean.replace(/\*\*|--|\*|_|~|`/g, "");
  clean = clean.replace(/^\[+([^\]]+)\]+$/, "$1");
  clean = clean.replace(/^\(+([^\)]+)\)+$/, "$1");
  clean = clean.replace(/\s+/g, " ");
  return clean.trim();
}

module.exports = async function profileOg(req, res) {
  let username = String(req.query.username || "").trim().toLowerCase();
  try { username = decodeURIComponent(username); } catch {}
  if (!/^[a-z0-9_#!-]{1,30}$/.test(username) || RESERVED_PATHS.has(username)) {
    res.status(404).send("Profile not found");
    return;
  }

  // 1. Try proxying Railway's server-rendered /meta/{username} HTML directly
  try {
    const metaResp = await fetch(`${BACKEND_URL}/meta/${encodeURIComponent(username)}`, {
      headers: { "User-Agent": req.headers["user-agent"] || "SwatsBio-Proxy/1.0" },
    });
    if (metaResp.ok) {
      const htmlText = await metaResp.text();
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
      res.status(200).send(htmlText);
      return;
    }
  } catch (err) {
    // Continue to fallback
  }

  // 2. Fallback: fetch user data from /api/u/{username}
  try {
    const response = await fetch(`${BACKEND_URL}/api/u/${encodeURIComponent(username)}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      res.status(response.status === 404 ? 404 : 502).send("Profile preview unavailable");
      return;
    }

    const bio = await response.json();
    const settings = bio.settings || {};
    const candidates = [
      settings.meta_image,
      settings.profile_embed_image,
      settings.header_banner,
      ...(Array.isArray(settings.backgrounds) ? settings.backgrounds : []),
      settings.banner,
      settings.pfp,
    ].filter((value) => value && value !== "invisible" && !isVideo(value));
    
    const image = mediaUrl(candidates[0]) || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`;
    const rawDisplayName = bio.display_name || bio.username || username;
    const displayName = stripEffectSyntax(rawDisplayName) || username;
    const rawTitle = settings.meta_title || `${displayName} (@${username}) • Swats.bio`;
    const title = stripEffectSyntax(rawTitle) || `${displayName} (@${username}) • Swats.bio`;
    const views = Number(bio.views || 0).toLocaleString();
    const rawDesc = settings.meta_desc || bio.description || `View @${username}'s official bio, social links, and music on Swats.bio.`;
    const description = (stripEffectSyntax(rawDesc) || `View @${username}'s official profile on Swats.bio.`).slice(0, 300);
    const themeColor = settings.meta_theme_color || settings.accent_color || "#5B8DB8";
    const pageUrl = `https://swats.bio/${encodeURIComponent(username)}`;
    const oembedUrl = `${BACKEND_URL}/api/oembed?username=${encodeURIComponent(username)}&format=json`;

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta property="og:type" content="profile">
  <meta property="og:site_name" content="Swats.bio">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(pageUrl)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:image:secure_url" content="${escapeHtml(image)}">
  <meta name="theme-color" content="${escapeHtml(themeColor)}">
  <meta name="twitter:card" content="${escapeHtml(settings.twitter_card || "summary_large_image")}">
  <meta name="twitter:site" content="@swatsbio">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  <link rel="alternate" type="application/json+oembed" href="${escapeHtml(oembedUrl)}" title="${escapeHtml(title)}">
  <meta http-equiv="refresh" content="0;url=${escapeHtml(pageUrl)}">
</head>
<body style="background:#08090d;color:#e5e7eb;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <p>Loading <a href="${escapeHtml(pageUrl)}" style="color:#5b8db8;font-weight:bold;">@${escapeHtml(username)} on Swats.bio</a>...</p>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.status(200).send(html);
  } catch (err) {
    res.status(502).send("Profile preview unavailable");
  }
};