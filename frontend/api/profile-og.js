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

module.exports = async function profileOg(req, res) {
  let username = String(req.query.username || "").trim().toLowerCase();
  try { username = decodeURIComponent(username); } catch {}
  if (!/^[a-z0-9_#!-]{2,20}$/.test(username) || RESERVED_PATHS.has(username)) {
    res.status(404).send("Profile not found");
    return;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/profile-preview/${encodeURIComponent(username)}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      res.status(response.status === 404 ? 404 : 502).send("Profile preview unavailable");
      return;
    }

    const bio = await response.json();
    const settings = bio.settings || {};
    const candidates = [
      settings.profile_embed_image,
      settings.header_banner,
      ...(Array.isArray(settings.backgrounds) ? settings.backgrounds : []),
      settings.banner,
      settings.pfp,
    ].filter((value) => value && value !== "invisible" && !isVideo(value));
    const image = mediaUrl(candidates[0]) || "https://www.swats.bio/logo.png";
    const displayName = bio.display_name || bio.username || username;
    const title = `${displayName} (@${username}) · swats.bio`;
    const views = Number(bio.views || 0).toLocaleString();
    const description = `${bio.description || `View @${username}'s profile on swats.bio`} · ${views} profile views`.slice(0, 300);
    const pageUrl = `https://www.swats.bio/${encodeURIComponent(username)}`;
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="theme-color" content="${escapeHtml(settings.accent_color || "#5B8DB8")}"><meta property="og:type" content="profile"><meta property="og:site_name" content="swats.bio"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(pageUrl)}"><meta property="og:image" content="${escapeHtml(image)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${escapeHtml(image)}"><meta http-equiv="refresh" content="0;url=${escapeHtml(pageUrl)}"></head><body><a href="${escapeHtml(pageUrl)}">Open ${escapeHtml(title)}</a></body></html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
    res.status(200).send(html);
  } catch {
    res.status(502).send("Profile preview unavailable");
  }
};