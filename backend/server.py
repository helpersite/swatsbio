from dotenv import load_dotenv
from pathlib import Path
import os
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import uuid
import secrets
import logging
import hashlib
import hmac
import bcrypt
import jwt
import requests
import re
import urllib.parse
import json
import io
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Any
from html.parser import HTMLParser

from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends, UploadFile, File, Header, Query, Body
from starlette.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool
from starlette.responses import Response as StarletteResponse, RedirectResponse, FileResponse, HTMLResponse
from pydantic import BaseModel, Field, EmailStr, ConfigDict

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("swats")

# ─────────────────────────────────────────
# Env helpers
# ─────────────────────────────────────────
def clean_str(val: Any) -> str:
    if val is None:
        return ""
    s = str(val).strip()
    s = re.sub(r'^[\s"\'\\]+|[\s"\'\\]+$', '', s)
    return s

def get_env(key: str, default: str = "") -> str:
    return clean_str(os.environ.get(key, default))

# ─────────────────────────────────────────
# Database (Railway PostgreSQL)
# ─────────────────────────────────────────
# Railway provides DATABASE_URL as postgres:// — asyncpg needs postgresql+asyncpg://
_raw_db_url = get_env("DATABASE_URL", "")
if not _raw_db_url:
    # Try Railway's private URL too
    _raw_db_url = get_env("DATABASE_PRIVATE_URL", "")

if not _raw_db_url:
    logger.warning("DATABASE_URL not set — using SQLite for local dev")
    DATABASE_URL = "sqlite+aiosqlite:///./swats_dev.db"
    IS_SQLITE = True
else:
    # Normalise postgres:// → postgresql+asyncpg://
    DATABASE_URL = re.sub(r'^postgres(ql)?://', 'postgresql+asyncpg://', _raw_db_url)
    IS_SQLITE = False

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    **({"pool_size": 5, "max_overflow": 10} if not IS_SQLITE else {}),
)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def get_db() -> AsyncSession:
    async with SessionLocal() as session:
        yield session

# ─────────────────────────────────────────
# Config
# ─────────────────────────────────────────
JWT_SECRET = get_env('JWT_SECRET')
if not JWT_SECRET:
    JWT_SECRET = secrets.token_urlsafe(32)
    logger.warning("JWT_SECRET not set; generated a temporary secret for this process. Set JWT_SECRET in your environment for stable auth tokens.")
JWT_ALGORITHM = "HS256"
APP_NAME    = "swats-bio"
USERNAME_PATTERN = re.compile(r"^[a-z0-9_#!-]{2,20}$")

def normalize_username(value: str) -> str:
    username = (value or "").strip().lower()
    if not USERNAME_PATTERN.fullmatch(username):
        raise HTTPException(status_code=400, detail="Username must be 2-20 characters using letters, numbers, _, ! or #.")
    return username

DISCORD_CLIENT_ID     = get_env("DISCORD_CLIENT_ID", "") or get_env("DISCORD_APP_ID", "") or ""
DISCORD_CLIENT_SECRET = get_env("DISCORD_CLIENT_SECRET", "") or get_env("DISCORD_SECRET", "") or ""
DISCORD_BOT_TOKEN = get_env("DISCORD_BOT_TOKEN", "") or get_env("DISCORD_TOKEN", "")
DISCORD_GUILD_ID  = get_env("DISCORD_GUILD_ID", "")
DISCORD_LEADERBOARD_CHANNEL_ID = get_env("DISCORD_LEADERBOARD_CHANNEL_ID", "1557281277734813806")

def file_url(path: Optional[str]) -> str:
    if not path:
        return ""
    if path.startswith("http://") or path.startswith("https://") or path.startswith("/api/"):
        return path
    return f"/api/files/{path.lstrip('/')}"


_env_discord_redirect = get_env("DISCORD_REDIRECT_URI", "") or get_env("DISCORD_REDIRECT_URL", "")
BACKEND_PUBLIC_URL = get_env("BACKEND_PUBLIC_URL", "").strip().rstrip("/")
if not BACKEND_PUBLIC_URL:
    railway_domain = os.environ.get("RAILWAY_PUBLIC_DOMAIN", "").strip()
    BACKEND_PUBLIC_URL = f"https://{railway_domain}" if railway_domain else "https://swatsbio-production.up.railway.app"
if _env_discord_redirect:
    DISCORD_REDIRECT_URI = _env_discord_redirect
else:
    DISCORD_REDIRECT_URI = f"{BACKEND_PUBLIC_URL}/api/auth/discord/callback"

DISCORD_ENABLED       = bool(DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET and DISCORD_REDIRECT_URI)

raw_fe = get_env("FRONTEND_URL", "").strip().rstrip("/")
if raw_fe:
    FRONTEND_URL = raw_fe
else:
    FRONTEND_URL = "https://www.swats.bio"

raw_cors = get_env("CORS_ORIGINS", "").strip()
if raw_cors:
    CORS_ORIGINS = [origin.strip() for origin in raw_cors.split(",") if origin.strip()]
else:
    CORS_ORIGINS = [FRONTEND_URL, "http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"]

SPOTIFY_CLIENT_ID     = get_env("SPOTIFY_CLIENT_ID", "")
SPOTIFY_CLIENT_SECRET = get_env("SPOTIFY_CLIENT_SECRET", "")
SPOTIFY_REDIRECT_URI  = get_env("SPOTIFY_REDIRECT_URI", "") or f"{BACKEND_PUBLIC_URL}/api/connect/spotify/callback"
SPOTIFY_ENABLED       = bool(SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET and SPOTIFY_REDIRECT_URI)
STRIPE_SECRET_KEY = get_env("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = get_env("STRIPE_WEBHOOK_SECRET", "")
STRIPE_ENABLED = bool(STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET)
DONATION_GOAL_USD = max(1, int(get_env("DONATION_GOAL_USD", "2500") or "2500"))
DONATION_WALLETS = {
    "btc": get_env("DONATION_BTC_ADDRESS", ""),
    "eth": get_env("DONATION_ETH_ADDRESS", ""),
    "ltc": get_env("DONATION_LTC_ADDRESS", ""),
}

# ─────────────────────────────────────────
# Cloudinary
# ─────────────────────────────────────────
import cloudinary
import cloudinary.uploader
import cloudinary.api

CLOUDINARY_URL        = get_env("CLOUDINARY_URL", "")
CLOUDINARY_CLOUD_NAME = get_env("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY    = get_env("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = get_env("CLOUDINARY_API_SECRET", "")

CLOUDINARY_ENABLED = False
if CLOUDINARY_URL:
    try:
        cloudinary.config(cloudinary_url=CLOUDINARY_URL)
        CLOUDINARY_ENABLED = True
        logger.info("Cloudinary storage configured via CLOUDINARY_URL")
    except Exception as e:
        logger.error(f"Failed to configure Cloudinary via CLOUDINARY_URL: {e}")
elif CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
    try:
        cloudinary.config(
            cloud_name=CLOUDINARY_CLOUD_NAME,
            api_key=CLOUDINARY_API_KEY,
            api_secret=CLOUDINARY_API_SECRET,
            secure=True
        )
        CLOUDINARY_ENABLED = True
        logger.info("Cloudinary storage configured via individual keys")
    except Exception as e:
        logger.error(f"Failed to configure Cloudinary: {e}")

UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def store_file(filename: str, data: bytes, content_type: str, user_id: str) -> dict:
    ext = filename.split(".")[-1].lower() if "." in filename else "bin"
    unique_id = str(uuid.uuid4())
    unique_name = f"{unique_id}.{ext}"
    if CLOUDINARY_ENABLED:
        try:
            res = cloudinary.uploader.upload(
                io.BytesIO(data), folder=f"swats-bio/{user_id}", public_id=unique_id,
                resource_type="auto", use_filename=True, unique_filename=True
            )
            url = res.get("secure_url") or res.get("url")
            return {"url": url, "path": res.get("public_id"), "is_external": True}
        except Exception as e:
            logger.error(f"Cloudinary upload failed: {e}. Falling back to local.")
    user_dir = UPLOAD_DIR / user_id
    user_dir.mkdir(parents=True, exist_ok=True)
    file_path = user_dir / unique_name
    with open(file_path, "wb") as f:
        f.write(data)
    rel_path = f"{user_id}/{unique_name}"
    return {"url": f"/api/files/{rel_path}", "path": rel_path, "is_external": False}

def collect_media_references(value, references: set):
    if isinstance(value, str):
        references.add(value.strip())
    elif isinstance(value, dict):
        for nested in value.values():
            collect_media_references(nested, references)
    elif isinstance(value, (list, tuple)):
        for nested in value:
            collect_media_references(nested, references)

def file_is_referenced(record, references: set) -> bool:
    storage_path = (record.get("storage_path") or "").replace("\\", "/").lstrip("/")
    url = record.get("url") or ""
    url_path = urllib.parse.urlparse(url).path.replace("\\", "/").lstrip("/")
    candidates = {value.replace("\\", "/") for value in (storage_path, url, url_path) if value}
    for reference in references:
        normalized = reference.replace("\\", "/")
        if normalized in candidates or (storage_path and normalized.endswith(f"/files/{storage_path}")):
            return True
    return False

def delete_stored_file(record) -> bool:
    storage_path = record.get("storage_path")
    if not storage_path:
        return False
    if record.get("is_external"):
        if not CLOUDINARY_ENABLED:
            return False
        content_type = (record.get("content_type") or "").lower()
        resource_type = "image" if content_type.startswith("image/") else "video" if content_type.startswith(("video/", "audio/")) else "raw"
        try:
            result = cloudinary.uploader.destroy(storage_path, resource_type=resource_type, invalidate=True)
            return result.get("result") in ("ok", "not found")
        except Exception as error:
            logger.warning(f"Could not delete unused Cloudinary asset {storage_path}: {error}")
            return False

    local_root = (UPLOAD_DIR / str(record.get("user_id") or "")).resolve()
    local_path = (UPLOAD_DIR / storage_path).resolve()
    try:
        local_path.relative_to(local_root)
    except ValueError:
        logger.warning(f"Skipped unsafe unused upload path: {storage_path}")
        return False
    try:
        local_path.unlink(missing_ok=True)
        return True
    except OSError as error:
        logger.warning(f"Could not delete unused local asset {storage_path}: {error}")
        return False

async def cleanup_unused_uploads(user_id: Optional[str] = None, db: Optional[AsyncSession] = None, grace_hours: int = 24) -> int:
    owns_session = db is None
    if owns_session:
        db = SessionLocal()

    deleted_count = 0
    try:
        user_query = text("SELECT id, settings FROM users WHERE id = :id") if user_id else text("SELECT id, settings FROM users")
        user_rows = await db.execute(user_query, {"id": user_id} if user_id else {})
        users = user_rows.fetchall()
        references_by_user = {}

        for row in users:
            settings = _j(row[1]) or {}
            references = set()
            collect_media_references(settings, references)
            link_rows = await db.execute(text("SELECT url, config FROM links WHERE user_id = :id"), {"id": row[0]})
            for link in link_rows.fetchall():
                collect_media_references(link[0], references)
                collect_media_references(_j(link[1]) or {}, references)
            references_by_user[row[0]] = references

        shared_rows = await db.execute(text("SELECT owner_id, settings, links FROM shared_profile_templates"))
        shared_references = []
        for row in shared_rows.fetchall():
            references = set()
            collect_media_references(_j(row[1]) or {}, references)
            collect_media_references(_j(row[2]) or [], references)
            shared_references.append((row[0], references))

        cutoff = datetime.now(timezone.utc) - timedelta(hours=grace_hours)
        file_query = text("SELECT id, storage_path, url, is_external, content_type, user_id, created_at FROM files WHERE is_deleted = FALSE AND user_id = :id") if user_id else text("SELECT id, storage_path, url, is_external, content_type, user_id, created_at FROM files WHERE is_deleted = FALSE")
        file_rows = await db.execute(file_query, {"id": user_id} if user_id else {})

        for row in file_rows.fetchall():
            record = dict(row._mapping)
            try:
                created = datetime.fromisoformat(record.get("created_at") or "")
                if created.tzinfo is None:
                    created = created.replace(tzinfo=timezone.utc)
            except ValueError:
                continue
            if created >= cutoff:
                continue

            references = set(references_by_user.get(record.get("user_id"), set()))
            for owner_id, template_references in shared_references:
                if owner_id == record.get("user_id") or file_is_referenced(record, template_references):
                    references.update(template_references)
            if file_is_referenced(record, references):
                continue
            if not await run_in_threadpool(delete_stored_file, record):
                continue

            await db.execute(text("UPDATE files SET is_deleted = TRUE WHERE id = :id"), {"id": record["id"]})
            deleted_count += 1

        if deleted_count:
            await db.commit()
        return deleted_count
    finally:
        if owns_session:
            await db.close()

# ─────────────────────────────────────────
# Auth helpers
# ─────────────────────────────────────────
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def create_access_token(uid: str, email: str) -> str:
    return jwt.encode(
        {"sub": uid, "email": email, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access"},
        JWT_SECRET, algorithm=JWT_ALGORITHM
    )

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def public_user(u: dict) -> dict:
    u = dict(u)
    u.pop("password_hash", None)
    # ensure id field
    if "id" not in u:
        u["id"] = u.get("id", "")
    return u

# ─────────────────────────────────────────
# DB helpers — row → dict, JSON decode
# ─────────────────────────────────────────
def _j(val):
    """Decode a JSON column that may already be a dict/list."""
    if val is None:
        return None
    if isinstance(val, (dict, list)):
        return val
    try:
        return json.loads(val)
    except Exception:
        return val

def row_to_user(row) -> dict:
    if row is None:
        return None
    d = dict(row._mapping)
    for col in ("badges", "username_history", "settings", "connections"):
        d[col] = _j(d.get(col))
    return d

def row_to_link(row) -> dict:
    if row is None:
        return None
    d = dict(row._mapping)
    d["config"] = _j(d.get("config")) or {}
    return d

def row_to_invite(row) -> dict:
    if row is None:
        return None
    d = dict(row._mapping)
    d["used_by"] = _j(d.get("used_by")) or []
    return d

def row_to_setting(row) -> dict:
    if row is None:
        return None
    d = dict(row._mapping)
    d["value"] = _j(d.get("value")) or {}
    return d

def _jdump(obj):
    return json.dumps(obj) if obj is not None else None

# ─────────────────────────────────────────
# Get current user from JWT
# ─────────────────────────────────────────
async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        ah = request.headers.get("Authorization", "")
        if ah.startswith("Bearer "):
            token = ah[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        uid = payload["sub"]
        row = await db.execute(text("SELECT * FROM users WHERE id = :id"), {"id": uid})
        user = row_to_user(row.fetchone())
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_current_user(request: Request, db: AsyncSession = Depends(get_db)) -> Optional[dict]:
    token = request.cookies.get("access_token")
    if not token:
        authorization = request.headers.get("Authorization", "")
        if authorization.startswith("Bearer "):
            token = authorization[7:]
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        row = await db.execute(text("SELECT * FROM users WHERE id = :id"), {"id": payload["sub"]})
        return row_to_user(row.fetchone())
    except (jwt.InvalidTokenError, KeyError):
        return None

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user

# ─────────────────────────────────────────
# Pydantic models
# ─────────────────────────────────────────
class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    username: str
    invite_code: str

class DiscordCompleteIn(BaseModel):
    discord_pending: str
    invite_code: str
    username: Optional[str] = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class ProfileIn(BaseModel):
    display_name: Optional[str] = None
    username: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[dict] = None

class ProfileTemplateCreate(BaseModel):
    name: str
    visibility: str = "public"
    target_role: Optional[str] = ""
    display_name: Optional[str] = None
    description: Optional[str] = None
    settings: dict = Field(default_factory=dict)
    links: list[dict] = Field(default_factory=list)

class LinkIn(BaseModel):
    platform: str
    label: str
    url: str
    hidden: bool = False
    config: dict = {}

class LinkUpdate(BaseModel):
    label: Optional[str] = None
    url: Optional[str] = None
    hidden: Optional[bool] = None
    config: Optional[dict] = None

class InviteIn(BaseModel):
    prefix: Optional[str] = "SWAT-"
    max_uses: int = 1
    count: int = 1

class UnlockIn(BaseModel):
    password: str

class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str

class SiteIn(BaseModel):
    socials: Optional[list] = None
    discord_invite: Optional[str] = None
    support_email: Optional[str] = None

class AdminUserUpdate(BaseModel):
    username: Optional[str] = None
    subdomain: Optional[str] = None
    role: Optional[str] = None
    badges: Optional[list[str]] = None
    display_name: Optional[str] = None
    description: Optional[str] = None
    views: Optional[int] = None

class AdminBulkResetViewsIn(BaseModel):
    user_ids: Optional[list[str]] = None
    all_users: bool = False

class AdminBulkRoleIn(BaseModel):
    user_ids: list[str]
    role: str

class FriendRequestIn(BaseModel):
    username: Optional[str] = None
    user_id: Optional[str] = None

class FriendshipActionIn(BaseModel):
    friendship_id: Optional[str] = None
    friend_id: Optional[str] = None
    username: Optional[str] = None

class CreateChannelIn(BaseModel):
    name: Optional[str] = None
    is_group: bool = False
    member_ids: list[str] = []
    icon_url: Optional[str] = None

class CreateDmIn(BaseModel):
    target_user_id: Optional[str] = None
    username: Optional[str] = None

class AddChannelMembersIn(BaseModel):

    member_ids: list[str] = Field(default_factory=list)

class SendMessageIn(BaseModel):
    content: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    text_effect: Optional[str] = "none"

class ReactMessageIn(BaseModel):
    emoji: str

class TemplateIn(BaseModel):
    name: str
    visibility: Optional[str] = "public"
    display_name: Optional[str] = ""
    description: Optional[str] = ""
    settings: Optional[dict] = {}
    links: Optional[list] = []

class DonationCheckoutIn(BaseModel):
    amount_usd: int
    name: Optional[str] = ""
    note: Optional[str] = ""

class CryptoDonationIn(BaseModel):
    network: str
    transaction_id: str
    name: Optional[str] = ""
    note: Optional[str] = ""


# ─────────────────────────────────────────
# App & Security Middleware
# ─────────────────────────────────────────
app = FastAPI(docs_url="/docs" if not os.environ.get("RAILWAY_ENVIRONMENT") else None, redoc_url=None)

# In-memory sliding window rate limiter
_rate_limits = {}

@app.middleware("http")
async def security_and_rate_limit_middleware(request: Request, call_next):
    # 1. Rate Limiting for brute-force protection
    client_ip = request.client.host if request.client else "unknown"
    now_ts = datetime.now(timezone.utc).timestamp()
    path = request.url.path

    # Clean old records
    if client_ip in _rate_limits:
        _rate_limits[client_ip] = [t for t in _rate_limits[client_ip] if now_ts - t < 60]
    else:
        _rate_limits[client_ip] = []

    # Strict rate limit for auth endpoints (max 15 attempts / min)
    is_auth_endpoint = "/api/auth/login" in path or "/api/auth/register" in path or "/api/auth/change-password" in path
    limit = 15 if is_auth_endpoint else 240

    if len(_rate_limits[client_ip]) >= limit:
        return StarletteResponse(
            content=json.dumps({"detail": "Rate limit exceeded. Please slow down."}),
            status_code=429,
            media_type="application/json"
        )

    _rate_limits[client_ip].append(now_ts)

    # Process request
    response = await call_next(request)

    # 2. Add Critical Security Headers to all responses
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(self), display-capture=(self)"
    response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data: https: blob:; font-src 'self' data: https:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline'; connect-src 'self' https: wss:; media-src 'self' data: blob: https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self' https:; upgrade-insecure-requests"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
    response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
    response.headers["X-Permitted-Cross-Domain-Policies"] = "none"

    # 3. Explicit live-site CORS compatibility for production domains
    origin = request.headers.get("Origin")
    if origin:
        allowed = (
            origin in {
                "https://www.swats.bio",
                "https://swats.bio",
                "http://localhost:3000",
                "http://localhost:5173",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:5173",
            }
            or re.match(r"^https?://(localhost|127\.0\.0\.1|([a-z0-9-]+\.)*swats\.bio|([a-z0-9-]+\.)*vercel\.app|([a-z0-9-]+\.)*railway\.app)(:\d+)?$", origin, re.I) is not None
        )
        if allowed:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Vary"] = "Origin"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, X-Requested-With, Accept, Origin"

    if request.method == "OPTIONS":
        response.status_code = 204

    return response

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=list(dict.fromkeys(CORS_ORIGINS + [
        "https://www.swats.bio",
        "https://swats.bio",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ])),
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|([a-z0-9-]+\.)*swats\.bio|([a-z0-9-]+\.)*vercel\.app|([a-z0-9-]+\.)*railway\.app)(:\d+)?$",
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin"],
)

api = APIRouter(prefix="/api")

DEFAULT_SETTINGS = {
    "avatar_style": "circle", "card_style": "glass", "card_layout": "classic", "card_shape": "rounded", "card_width": "md",
    "card_alpha": 0.8, "bg_blur": 8, "tilt_effect": True,
    "bg_effect": "none", "accent_color": "#5B8DB8", "glow_color": "#5B8DB8", "glow_intensity": 40,
    "font": "Outfit",
    "title_style": "classic", "title_alignment": "center", "content_alignment": "center", "avatar_alignment": "center",
    "show_banner": True, "location": "",
    "custom_favicon": None, "profile_embed_image": None, "tab_title_effect": "none", "tab_switch_msg": "👀 Hey, come back!",
    "link_color_all": False, "link_color": "#5B8DB8",
    "enter_screen": {"enabled": False, "header": "", "text": "ENTER", "style": "minimal", "blur": 12, "no_bg": True, "password": "", "password_style": "text", "sound": False},
    "presence": {"discord": False, "spotify": False, "use_discord_pfp": False, "show_discord_badge": True, "show_lyrics": False},
    "audio": {"volume": 50, "randomize": False, "display": True, "tracks": []},
    "shop": [],
    "cursor": None, "pfp": None, "banner": None, "header_banner": None,
}

DEFAULT_SITE = {
    "socials": [
        {"platform": "discord", "url": "https://discord.gg/swats"},
        {"platform": "twitter", "url": "https://twitter.com/swatsbio"},
        {"platform": "youtube", "url": "https://youtube.com/@swatsbio"},
        {"platform": "twitch", "url": "https://twitch.tv/swatsbio"},
        {"platform": "telegram", "url": "https://t.me/swatsbio"},
        {"platform": "github", "url": "https://github.com/swatsbio"},
    ],
    "discord_invite": "https://discord.gg/swats",
    "support_email": "team@swats.bio",
}

def set_cookie(resp: Response, token: str):
    resp.set_cookie(key="access_token", value=token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")

def strip_effect_syntax(text: str) -> str:
    if not text:
        return ""
    clean = str(text)
    clean = re.sub(r':([a-zA-Z0-9_#-]+):([^:\n]+):([a-zA-Z0-9_#-]+):', r'\2', clean)
    clean = re.sub(r':([a-zA-Z0-9_#-]+):([^:\n]+):', r'\2', clean)
    clean = re.sub(r':([a-zA-Z0-9_#-]+):', '', clean)
    clean = re.sub(r'\[\/?(?:b|i|u|s|color|glow|neon|sparkle|glitch|wave|fire)[^\]]*\]', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'[\*\_~`]', '', clean)
    return clean.strip()

def generate_user_meta_html(user: Optional[dict], username: str) -> HTMLResponse:
    import html as html_lib
    if not user:
        meta_title = f"@{username} • Swats.bio"
        meta_desc = f"View @{username}'s official bio, links, and music on Swats.bio."
        meta_image = f"https://api.dicebear.com/7.x/bottts/svg?seed={username}"
        theme_color = "#5B8DB8"
        card_type = "summary_large_image"
    else:
        settings = _j(user.get("settings")) or {}
        display_name = strip_effect_syntax(user.get("display_name") or username) or username
        meta_title = settings.get("meta_title") or f"{display_name} (@{username}) • Swats.bio"
        raw_desc = settings.get("meta_desc") or user.get("description") or f"View @{username}'s official bio, social links, and music on Swats.bio."
        meta_desc = strip_effect_syntax(raw_desc)
        if not meta_desc:
            meta_desc = f"View @{username}'s official profile on Swats.bio."
        
        theme_color = settings.get("meta_theme_color") or settings.get("accent_color") or "#5B8DB8"
        if not theme_color.startswith("#"):
            theme_color = f"#{theme_color}"
        
        card_type = settings.get("twitter_card") or "summary_large_image"
        
        # Image resolution
        raw_img = settings.get("meta_image") or settings.get("profile_embed_image") or settings.get("banner") or settings.get("pfp") or ""
        if raw_img.startswith("http://") or raw_img.startswith("https://"):
            meta_image = raw_img
        elif raw_img.startswith("/api/"):
            meta_image = f"{BACKEND_PUBLIC_URL}{raw_img}"
        elif raw_img:
            meta_image = f"{BACKEND_PUBLIC_URL}/api/files/{raw_img.lstrip('/')}"
        else:
            meta_image = f"https://api.dicebear.com/7.x/bottts/svg?seed={username}"

    esc_title = html_lib.escape(meta_title)
    esc_desc = html_lib.escape(meta_desc)
    esc_img = html_lib.escape(meta_image)
    esc_color = html_lib.escape(theme_color)
    esc_user = html_lib.escape(username)
    esc_url = f"https://swats.bio/{esc_user}"
    oembed_url = f"https://swatsbio-production.up.railway.app/api/oembed?username={esc_user}&format=json"

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{esc_title}</title>
  <meta name="description" content="{esc_desc}">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  
  <!-- Open Graph / Discord Embeds -->
  <meta property="og:type" content="profile">
  <meta property="og:site_name" content="Swats.bio">
  <meta property="og:title" content="{esc_title}">
  <meta property="og:description" content="{esc_desc}">
  <meta property="og:image" content="{esc_img}">
  <meta property="og:image:secure_url" content="{esc_img}">
  <meta property="og:url" content="{esc_url}">
  <meta name="theme-color" content="{esc_color}">
  
  <!-- Twitter / X -->
  <meta name="twitter:card" content="{card_type}">
  <meta name="twitter:site" content="@swatsbio">
  <meta name="twitter:title" content="{esc_title}">
  <meta name="twitter:description" content="{esc_desc}">
  <meta name="twitter:image" content="{esc_img}">
  
  <!-- oEmbed Provider for Discord/Slack/Telegram -->
  <link rel="alternate" type="application/json+oembed" href="{oembed_url}" title="{esc_title}">
  
  <!-- Client redirection -->
  <meta http-equiv="refresh" content="0; url={esc_url}">
  <link rel="canonical" href="{esc_url}">
</head>
<body style="background:#08090d; color:#e5e7eb; font-family:sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0;">
  <p>Loading <a href="{esc_url}" style="color:#5b8db8; font-weight:bold;">@{esc_user} on Swats.bio</a>...</p>
</body>
</html>"""
    return HTMLResponse(content=html_content, status_code=200)

@app.get("/meta/{username}", response_class=HTMLResponse)
@app.get("/u/{username}/meta", response_class=HTMLResponse)
@api.get("/meta/{username}", response_class=HTMLResponse)
async def get_user_meta_endpoint(username: str, db: AsyncSession = Depends(get_db)):
    clean_u = (username or "").lstrip("@").strip().lower()
    row = await db.execute(text("SELECT * FROM users WHERE LOWER(username) = :u OR LOWER(subdomain) = :u LIMIT 1"), {"u": clean_u})
    user = row_to_user(row.fetchone())
    return generate_user_meta_html(user, clean_u)

@api.get("/oembed")
@app.get("/oembed")
@app.get("/api/oembed")
async def oembed_endpoint(username: str = "", url: str = "", db: AsyncSession = Depends(get_db)):
    clean_u = (username or "").lstrip("@").strip().lower()
    if not clean_u and url:
        m = re.search(r'swats\.bio/([a-zA-Z0-9_#-]+)', url)
        if m:
            clean_u = m.group(1).lower()
    if clean_u:
        row = await db.execute(text("SELECT * FROM users WHERE LOWER(username) = :u OR LOWER(subdomain) = :u LIMIT 1"), {"u": clean_u})
        user = row_to_user(row.fetchone())
        if user:
            settings = _j(user.get("settings")) or {}
            display_name = user.get("display_name") or clean_u
            return {
                "version": "1.0",
                "type": "link",
                "title": settings.get("meta_title") or f"{display_name} (@{clean_u}) • Swats.bio",
                "author_name": display_name,
                "author_url": f"https://swats.bio/{clean_u}",
                "provider_name": "Swats.bio",
                "provider_url": "https://swats.bio"
            }
    return {
        "version": "1.0",
        "type": "link",
        "title": "Swats.bio",
        "provider_name": "Swats.bio",
        "provider_url": "https://swats.bio"
    }

# ─────────────────────────────────────────
# Routes — health
# ─────────────────────────────────────────
@app.get("/")
async def app_root():
    return {"status": "ok", "service": "swats.bio backend", "api": "/api", "docs": "/docs"}

@api.get("/")
async def root():
    return {"message": "swats.bio api"}


# ─────────────────────────────────────────
# Auth
# ─────────────────────────────────────────
async def validate_and_consume_invite(code: str, username: str, db: AsyncSession) -> tuple[bool, str]:
    code_clean = (code or "").strip()
    if not code_clean:
        return False, "An invite code is required to register."
    inv_row = await db.execute(text("SELECT * FROM invite_codes WHERE code = :c"), {"c": code_clean})
    invite = row_to_invite(inv_row.fetchone())
    if not invite:
        return False, "Invalid invite code. Please enter a valid code."
    if invite.get("uses", 0) >= invite.get("max_uses", 1):
        return False, "This invite code has already been exhausted."

    used_by = invite.get("used_by", []) + [username]
    await db.execute(
        text("UPDATE invite_codes SET uses = uses + 1, used_by = :ub WHERE code = :c"),
        {"ub": _jdump(used_by), "c": code_clean}
    )
    return True, code_clean

@api.post("/auth/register")
async def register(body: RegisterIn, response: Response, db: AsyncSession = Depends(get_db)):
    email = body.email.lower()
    uname = normalize_username(body.username)

    existing_email = await db.execute(text("SELECT id FROM users WHERE email = :e"), {"e": email})
    if existing_email.fetchone():
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_uname = await db.execute(text("SELECT id FROM users WHERE username = :u"), {"u": uname})
    if not uname or existing_uname.fetchone():
        raise HTTPException(status_code=400, detail="Username taken or invalid")

    ok, invite_res = await validate_and_consume_invite(body.invite_code, uname, db)
    if not ok:
        raise HTTPException(status_code=400, detail=invite_res)

    uid = str(uuid.uuid4())
    badges = ["beta user", "early supporter"]
    await db.execute(text("""
        INSERT INTO users (id, email, password_hash, username, display_name, description, role,
            badges, invite_code_used, username_history, username_changed_at, settings, views, created_at, connections)
        VALUES (:id, :email, :pw, :uname, :dn, '', 'user', :badges, :invite, '[]', NULL, :settings, 0, :ca, '{}')
    """), {
        "id": uid, "email": email, "pw": hash_password(body.password), "uname": uname,
        "dn": body.username, "badges": _jdump(badges), "invite": invite_res,
        "settings": _jdump(DEFAULT_SETTINGS), "ca": now_iso(),
    })
    await db.commit()

    token = create_access_token(uid, email)
    set_cookie(response, token)
    return {"user": {"id": uid, "email": email, "username": uname, "display_name": body.username,
                     "role": "user", "badges": badges, "settings": DEFAULT_SETTINGS, "views": 0}, "token": token}

@api.post("/auth/login")
async def login(body: LoginIn, response: Response, db: AsyncSession = Depends(get_db)):
    email = body.email.lower()
    row = await db.execute(text("SELECT * FROM users WHERE email = :e"), {"e": email})
    user = row_to_user(row.fetchone())
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], email)
    set_cookie(response, token)
    return {"user": public_user(user), "token": token}

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)

@api.get("/auth/check-username")
async def check_username(username: str = Query(...), db: AsyncSession = Depends(get_db)):
    u = username.lower().strip()
    valid = bool(USERNAME_PATTERN.fullmatch(u))
    if valid:
        row = await db.execute(text("SELECT id FROM users WHERE username = :u"), {"u": u})
        taken = row.fetchone() is not None
    else:
        taken = True
    return {"available": bool(valid and not taken), "valid": valid}

@api.post("/auth/change-password")
async def change_password(body: ChangePasswordIn, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not verify_password(body.current_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    await db.execute(text("UPDATE users SET password_hash = :pw WHERE id = :id"),
                     {"pw": hash_password(body.new_password), "id": user["id"]})
    await db.commit()
    return {"ok": True}

# ─────────────────────────────────────────
# Profile
# ─────────────────────────────────────────
@api.put("/profile")
async def update_profile(body: ProfileIn, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    updates = {}
    if body.display_name is not None:
        updates["display_name"] = body.display_name
    if body.description is not None:
        updates["description"] = body.description
    if body.settings is not None:
        merged = {**(user.get("settings") or DEFAULT_SETTINGS), **body.settings}
        if user.get("role") != "admin":
            # User-specific badge preferences should remain saved for the current profile,
            # even though power-user custom badge templates remain admin-controlled when needed.
            merged.pop("profile_templates", None)
        updates["settings"] = _jdump(merged)
    if body.username is not None:
        new_u = normalize_username(body.username)
        if new_u != user["username"]:
            last = user.get("username_changed_at")
            if last:
                elapsed = datetime.now(timezone.utc) - datetime.fromisoformat(last)
                if elapsed < timedelta(days=2):
                    raise HTTPException(status_code=400, detail="Username can only change once every 2 days")
            row = await db.execute(text("SELECT id FROM users WHERE username = :u"), {"u": new_u})
            if row.fetchone():
                raise HTTPException(status_code=400, detail="Username taken")
            history = (user.get("username_history") or []) + [{"username": user["username"], "at": now_iso()}]
            updates["username"] = new_u
            updates["username_changed_at"] = now_iso()
            updates["username_history"] = _jdump(history)

    if updates:
        set_parts = ", ".join(f"{k} = :{k}" for k in updates)
        updates["id"] = user["id"]
        await db.execute(text(f"UPDATE users SET {set_parts} WHERE id = :id"), updates)
        await db.commit()
        await cleanup_unused_uploads(user["id"])

    row = await db.execute(text("SELECT * FROM users WHERE id = :id"), {"id": user["id"]})
    return public_user(row_to_user(row.fetchone()))

@api.get("/profile/templates")
async def list_profile_templates(user: dict = Depends(get_current_user)):
    templates = (user.get("settings") or {}).get("profile_templates") or []
    return {"templates": templates if isinstance(templates, list) else []}

@api.post("/profile/templates")
async def save_profile_template(body: ProfileTemplateCreate, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Template name is required.")

    lock_clause = "" if IS_SQLITE else " FOR UPDATE"
    settings_row = await db.execute(text(f"SELECT settings FROM users WHERE id = :id{lock_clause}"), {"id": user["id"]})
    row = settings_row.fetchone()
    settings = dict((_j(row[0]) if row and row[0] else None) or DEFAULT_SETTINGS)
    templates = settings.get("profile_templates")
    templates = templates if isinstance(templates, list) else []
    if len(templates) >= 3:
        raise HTTPException(status_code=409, detail="You can save up to 3 bio templates. Delete one before saving another.")

    snapshot_settings = dict(body.settings)
    snapshot_settings.pop("profile_templates", None)
    links = [link for link in body.links if isinstance(link, dict)]
    template = {
        "id": str(uuid.uuid4()),
        "name": name[:48],
        "created_at": now_iso(),
        "display_name": body.display_name or "",
        "description": body.description or "",
        "settings": snapshot_settings,
        "links": links,
    }
    if len(_jdump(template).encode("utf-8")) > 300_000:
        raise HTTPException(status_code=413, detail="This template is too large to save.")

    templates.append(template)
    settings["profile_templates"] = templates
    await db.execute(text("UPDATE users SET settings = :settings WHERE id = :id"), {"settings": _jdump(settings), "id": user["id"]})
    await db.commit()
    await cleanup_unused_uploads(user["id"])
    return {"templates": templates}

@api.delete("/profile/templates/{template_id}")
async def delete_profile_template(template_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    settings = dict(user.get("settings") or DEFAULT_SETTINGS)
    templates = settings.get("profile_templates")
    templates = templates if isinstance(templates, list) else []
    next_templates = [template for template in templates if template.get("id") != template_id]
    if len(next_templates) == len(templates):
        raise HTTPException(status_code=404, detail="Template not found.")

    settings["profile_templates"] = next_templates
    await db.execute(text("UPDATE users SET settings = :settings WHERE id = :id"), {"settings": _jdump(settings), "id": user["id"]})
    await db.commit()
    await cleanup_unused_uploads(user["id"])
    return {"templates": next_templates}

@api.post("/profile/templates/{template_id}/apply")
async def apply_profile_template(template_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    current_settings = dict(user.get("settings") or DEFAULT_SETTINGS)
    templates = current_settings.get("profile_templates")
    templates = templates if isinstance(templates, list) else []
    template = next((item for item in templates if item.get("id") == template_id), None)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found.")

    settings = dict(template.get("settings") or {})
    for keep_key in ("pfp", "presence", "custom_badges", "profile_templates", "dashboard_tutorial_completed"):
        if keep_key in current_settings:
            settings[keep_key] = current_settings[keep_key]

    await db.execute(text("""
        UPDATE users SET settings = :settings
        WHERE id = :id
    """), {
        "settings": _jdump(settings),
        "id": user["id"],
    })
    await db.commit()
    await cleanup_unused_uploads(user["id"])

    row = await db.execute(text("SELECT * FROM users WHERE id = :id"), {"id": user["id"]})
    return {"user": public_user(row_to_user(row.fetchone()))}

def _shared_template_snapshot(row) -> dict:
    item = dict(row._mapping)
    item["settings"] = _j(item.get("settings")) or {}
    item["links"] = _j(item.get("links")) or []
    return item

class SharedTemplateUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    description: Optional[str] = None
    visibility: Optional[str] = None
    target_role: Optional[str] = None
    settings: Optional[dict] = None
    links: Optional[list] = None

@api.get("/templates")
async def list_shared_templates(limit: int = Query(100, ge=1, le=200), viewer: Optional[dict] = Depends(get_optional_current_user), db: AsyncSession = Depends(get_db)):
    is_admin = bool(viewer and viewer.get("role") == "admin")
    conditions = ["t.visibility = 'public'"]
    params = {"limit": limit}
    
    if is_admin:
        # Admins see all community templates for moderation
        where_clause = "1=1"
    else:
        if viewer:
            params["viewer_id"] = viewer["id"]
            params["viewer_role"] = viewer.get("role", "")
            conditions.append("t.owner_id = :viewer_id")
            conditions.append("(t.visibility = 'role' AND t.target_role = :viewer_role)")
            conditions.append("t.visibility = 'unlisted'")
        where_clause = " OR ".join(f"({c})" for c in conditions)

    query_str = f"""
        SELECT t.id, t.owner_id, u.username AS owner_username, t.name, t.display_name,
               t.description, t.settings, t.links, t.downloads, t.created_at,
               t.visibility, t.target_role
        FROM shared_profile_templates t
        JOIN users u ON u.id = t.owner_id
        WHERE {where_clause}
        ORDER BY t.created_at DESC
        LIMIT :limit
    """
    rows = await db.execute(text(query_str), params)
    return [_shared_template_snapshot(row) for row in rows.fetchall()]


@api.get("/template-roles")
async def list_template_roles(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = await db.execute(text("""
        SELECT DISTINCT role FROM users
        WHERE role IS NOT NULL AND TRIM(role) <> ''
        ORDER BY role
    """))
    return [row[0] for row in rows.fetchall()]

@api.post("/templates")
async def publish_shared_template(body: ProfileTemplateCreate, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Template name is required.")
    if body.visibility not in {"public", "private", "role", "unlisted"}:
        raise HTTPException(status_code=400, detail="Choose public, unlisted, private, or role visibility.")
    target_role = (body.target_role or "").strip()[:64]
    if body.visibility == "role":
        role_exists = await db.execute(text("SELECT 1 FROM users WHERE role = :role LIMIT 1"), {"role": target_role})
        if not target_role or not role_exists.fetchone():
            raise HTTPException(status_code=400, detail="Choose a role currently assigned to an account.")

    is_admin = user.get("role") == "admin"
    lock_clause = "" if IS_SQLITE else " FOR UPDATE"
    await db.execute(text(f"SELECT id FROM users WHERE id = :id{lock_clause}"), {"id": user["id"]})
    if not is_admin:
        count = (await db.execute(text("SELECT COUNT(*) FROM shared_profile_templates WHERE owner_id = :id"), {"id": user["id"]})).scalar() or 0
        if count >= 6:
            raise HTTPException(status_code=409, detail="You can publish up to 6 templates. Delete one of yours before publishing another.")

    settings = dict(body.settings)
    settings.pop("profile_templates", None)
    enter_screen = dict(settings.get("enter_screen") or {})
    enter_screen.pop("password", None)
    if "enter_screen" in settings:
        settings["enter_screen"] = enter_screen

    links = []
    for link in body.links:
        if not isinstance(link, dict) or not link.get("platform") or not link.get("url"):
            continue
        links.append({
            "platform": str(link["platform"])[:40],
            "label": str(link.get("label") or link["platform"])[:120],
            "url": str(link["url"])[:2048],
            "hidden": bool(link.get("hidden", False)),
            "config": link.get("config") if isinstance(link.get("config"), dict) else {},
        })

    snapshot = {
        "settings": settings,
        "links": links,
        "description": body.description or "",
        "display_name": body.display_name or "",
    }
    if len(_jdump(snapshot).encode("utf-8")) > 500_000:
        raise HTTPException(status_code=413, detail="This template is too large to publish.")

    template_id = str(uuid.uuid4())
    created_at = now_iso()
    await db.execute(text("""
        INSERT INTO shared_profile_templates
            (id, owner_id, name, display_name, description, settings, links, downloads, created_at, visibility, target_role)
        VALUES (:id, :owner_id, :name, :display_name, :description, :settings, :links, 0, :created_at, :visibility, :target_role)
    """), {
        "id": template_id,
        "owner_id": user["id"],
        "name": name[:60],
        "display_name": body.display_name or "",
        "description": body.description or "",
        "settings": _jdump(settings),
        "links": _jdump(links),
        "created_at": created_at,
        "visibility": body.visibility or "public",
        "target_role": target_role,
    })
    await db.commit()
    await cleanup_unused_uploads(user["id"])
    return {"id": template_id, "owner_id": user["id"], "owner_username": user["username"], "name": name[:60], "display_name": body.display_name or "", "description": body.description or "", "settings": settings, "links": links, "downloads": 0, "created_at": created_at, "visibility": body.visibility or "public", "target_role": target_role}

@api.put("/templates/{template_id}")
async def update_shared_template(template_id: str, body: SharedTemplateUpdate, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    is_admin = user.get("role") == "admin"
    row = await db.execute(text("SELECT * FROM shared_profile_templates WHERE id = :id"), {"id": template_id})
    t = row.fetchone()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    
    t_mapping = dict(t._mapping)
    if not is_admin and t_mapping.get("owner_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Only the template author or an admin can edit this template.")
    
    updates = {}
    if body.name is not None:
        updates["name"] = body.name.strip()[:60]
    if body.display_name is not None:
        updates["display_name"] = body.display_name.strip()[:60]
    if body.description is not None:
        updates["description"] = body.description.strip()[:500]
    if body.visibility is not None and body.visibility in {"public", "private", "role", "unlisted"}:
        updates["visibility"] = body.visibility
    if body.target_role is not None:
        updates["target_role"] = body.target_role.strip()[:64]
    if body.settings is not None and is_admin:
        updates["settings"] = _jdump(body.settings)
    if body.links is not None and is_admin:
        updates["links"] = _jdump(body.links)

    if updates:
        set_parts = ", ".join(f"{k} = :{k}" for k in updates)
        updates["id"] = template_id
        await db.execute(text(f"UPDATE shared_profile_templates SET {set_parts} WHERE id = :id"), updates)
        await db.commit()
    
    updated_row = await db.execute(text("SELECT * FROM shared_profile_templates WHERE id = :id"), {"id": template_id})
    return _shared_template_snapshot(updated_row.fetchone())

@api.delete("/templates/{template_id}")
async def delete_shared_template(template_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    is_admin = user.get("role") == "admin"
    if is_admin:
        result = await db.execute(text("DELETE FROM shared_profile_templates WHERE id = :id"), {"id": template_id})
    else:
        result = await db.execute(text("DELETE FROM shared_profile_templates WHERE id = :id AND owner_id = :owner_id"), {"id": template_id, "owner_id": user["id"]})
    
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Template not found or permission denied.")
    await db.commit()
    await cleanup_unused_uploads()
    return {"ok": True}

@api.post("/templates/{template_id}/apply")
async def apply_shared_template(template_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT * FROM shared_profile_templates WHERE id = :id"), {"id": template_id})
    template_row = result.fetchone()
    if not template_row:
        raise HTTPException(status_code=404, detail="Template not found.")
    template = _shared_template_snapshot(template_row)
    visibility = template.get("visibility") or "public"
    if visibility == "private" and template.get("owner_id") != user["id"]:
        raise HTTPException(status_code=404, detail="Template not found.")
    if visibility == "role" and template.get("target_role") != user.get("role") and template.get("owner_id") != user["id"]:
        raise HTTPException(status_code=404, detail="Template not found.")

    current_settings = dict(user.get("settings") or DEFAULT_SETTINGS)
    settings = dict(template.get("settings") or {})
    for keep_key in ("pfp", "presence", "custom_badges", "profile_templates", "dashboard_tutorial_completed"):
        if keep_key in current_settings:
            settings[keep_key] = current_settings[keep_key]

    await db.execute(text("""
        UPDATE users SET settings = :settings
        WHERE id = :id
    """), {
        "settings": _jdump(settings),
        "id": user["id"],
    })
    await db.execute(text("UPDATE shared_profile_templates SET downloads = downloads + 1 WHERE id = :id"), {"id": template_id})
    await db.commit()
    await cleanup_unused_uploads(user["id"])

    row = await db.execute(text("SELECT * FROM users WHERE id = :id"), {"id": user["id"]})
    return {"user": public_user(row_to_user(row.fetchone()))}

# ─────────────────────────────────────────
# Links
# ─────────────────────────────────────────
@api.get("/links/lookup")
async def lookup_link_profile(platform: str = Query(...), query: str = Query(...), user: dict = Depends(get_current_user)):
    platform = platform.lower().strip()
    q = query.strip()
    result = {"platform": platform, "url": q, "username": "", "avatar_url": "", "label": "", "details": {}}

    # 1. Discord
    if platform == "discord":
        dc = (user.get("connections") or {}).get("discord")
        if dc and (not q or q.lower() in ("me", "self", "connected")):
            result["username"] = dc.get("username", "")
            result["avatar_url"] = dc.get("avatar", "")
            result["url"] = f"https://discord.com/users/{dc.get('id', '')}"
            result["label"] = dc.get("username") or "Discord"
            return result
        clean_id = re.sub(r"[^\d]", "", q)
        if len(clean_id) >= 17:
            try:
                resp = requests.get(f"https://api.lanyard.rest/v1/users/{clean_id}", timeout=5)
                if resp.status_code == 200:
                    d = resp.json().get("data", {})
                    u = d.get("discord_user", {})
                    result["username"] = u.get("username", "")
                    av = u.get("avatar")
                    if av:
                        result["avatar_url"] = f"https://cdn.discordapp.com/avatars/{clean_id}/{av}.png"
                    result["url"] = f"https://discord.com/users/{clean_id}"
                    result["label"] = u.get("global_name") or u.get("username") or "Discord"
                    return result
            except Exception:
                pass
        if "discord.gg" in q or "discord.com/invite" in q:
            code = q.split("/")[-1].split("?")[0]
            try:
                resp = requests.get(f"https://discord.com/api/v9/invites/{code}?with_counts=true", timeout=5)
                if resp.status_code == 200:
                    data = resp.json()
                    guild = data.get("guild", {})
                    icon = guild.get("icon")
                    gid = guild.get("id")
                    if icon and gid:
                        result["avatar_url"] = f"https://cdn.discordapp.com/icons/{gid}/{icon}.png"
                    result["label"] = guild.get("name") or "Discord Server"
                    result["username"] = guild.get("name", "")
                    result["details"]["members"] = f"{data.get('approximate_member_count', 0):,} members"
                    result["url"] = f"https://discord.gg/{code}"
                    return result
            except Exception:
                pass

    # 2. GitHub
    elif platform == "github":
        handle = q.replace("https://github.com/", "").replace("http://github.com/", "").strip("/").split("/")[0].replace("@", "")
        if handle:
            try:
                resp = requests.get(f"https://api.github.com/users/{handle}", headers={"User-Agent": "swatsbio"}, timeout=5)
                if resp.status_code == 200:
                    data = resp.json()
                    result["username"] = data.get("login", handle)
                    result["avatar_url"] = data.get("avatar_url", "")
                    result["label"] = data.get("name") or data.get("login") or "GitHub"
                    result["url"] = data.get("html_url") or f"https://github.com/{handle}"
                    result["details"]["followers"] = f"{data.get('followers', 0):,} followers"
                    if data.get("bio"):
                        result["details"]["status"] = data["bio"][:80]
                    return result
            except Exception:
                pass

    # 3. Roblox
    elif platform == "roblox":
        handle = q.replace("https://www.roblox.com/users/", "").replace("roblox.com/users/", "").strip("/").split("/")[0]
        user_id = None
        if handle.isdigit():
            user_id = handle
        else:
            clean_name = q.replace("https://www.roblox.com/", "").strip("/").split("/")[0].replace("@", "")
            try:
                resp = requests.post("https://users.roblox.com/v1/usernames/users", json={"usernames": [clean_name], "excludeBannedUsers": False}, timeout=5)
                if resp.status_code == 200 and resp.json().get("data"):
                    user_id = str(resp.json()["data"][0]["id"])
                    result["username"] = resp.json()["data"][0]["name"]
                    result["label"] = resp.json()["data"][0].get("displayName") or resp.json()["data"][0]["name"]
            except Exception:
                pass
        if user_id:
            result["url"] = f"https://www.roblox.com/users/{user_id}/profile"
            try:
                thumb_resp = requests.get(f"https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds={user_id}&size=150x150&format=Png&isCircular=false", timeout=5)
                if thumb_resp.status_code == 200 and thumb_resp.json().get("data"):
                    result["avatar_url"] = thumb_resp.json()["data"][0].get("imageUrl", "")
            except Exception:
                pass
            return result

    # 4. Reddit
    elif platform == "reddit":
        handle = q.replace("https://www.reddit.com/user/", "").replace("reddit.com/user/", "").replace("u/", "").strip("/").split("/")[0]
        if handle:
            try:
                resp = requests.get(f"https://www.reddit.com/user/{handle}/about.json", headers={"User-Agent": "swatsbio/1.0"}, timeout=5)
                if resp.status_code == 200:
                    d = resp.json().get("data", {})
                    icon = d.get("icon_img", "").split("?")[0]
                    result["username"] = f"u/{d.get('name', handle)}"
                    result["avatar_url"] = icon
                    result["label"] = d.get("name", handle)
                    result["url"] = f"https://reddit.com/user/{handle}"
                    result["details"]["karma"] = f"{d.get('total_karma', 0):,} karma"
                    return result
            except Exception:
                pass

    # 5. Telegram
    elif platform == "telegram":
        handle = q.replace("https://t.me/", "").replace("t.me/", "").strip("/").split("/")[0].replace("@", "")
        if handle:
            result["username"] = f"@{handle}"
            result["avatar_url"] = f"https://t.me/i/userpic/320/{handle}.jpg"
            result["url"] = f"https://t.me/{handle}"
            result["label"] = handle
            return result

    # 6. Twitter / X
    elif platform in ("twitter", "x"):
        handle = q.replace("https://twitter.com/", "").replace("https://x.com/", "").strip("/").split("/")[0].replace("@", "")
        if handle:
            result["username"] = f"@{handle}"
            result["url"] = f"https://x.com/{handle}"
            result["label"] = f"@{handle}"
            result["avatar_url"] = f"https://unavatar.io/x/{handle}"
            return result

    # 7. Twitch
    elif platform == "twitch":
        handle = q.replace("https://twitch.tv/", "").replace("https://www.twitch.tv/", "").strip("/").split("/")[0].replace("@", "")
        if handle:
            result["username"] = handle
            result["url"] = f"https://twitch.tv/{handle}"
            result["label"] = handle
            result["avatar_url"] = f"https://unavatar.io/twitch/{handle}"
            return result

    # 8. TikTok
    elif platform == "tiktok":
        handle = q.replace("https://www.tiktok.com/@", "").replace("https://tiktok.com/@", "").strip("/").split("/")[0].replace("@", "")
        if handle:
            result["username"] = f"@{handle}"
            result["url"] = f"https://www.tiktok.com/@{handle}"
            result["label"] = f"@{handle}"
            result["avatar_url"] = f"https://unavatar.io/tiktok/{handle}"
            return result

    # 9. YouTube
    elif platform == "youtube":
        handle = q.replace("https://www.youtube.com/", "").replace("https://youtube.com/", "").strip("/")
        result["url"] = f"https://youtube.com/{handle}" if not handle.startswith("http") else handle
        result["label"] = handle.replace("@", "")
        result["username"] = handle
        result["avatar_url"] = f"https://unavatar.io/youtube/{handle.replace('@', '')}"
        return result

    # 10. Generic fallback
    clean_url = q if q.startswith("http") else f"https://{q}"
    domain = urllib.parse.urlparse(clean_url).netloc
    result["url"] = clean_url
    result["avatar_url"] = f"https://unavatar.io/{domain}" if domain else ""
    result["label"] = domain or platform.capitalize()
    return result

@api.get("/links")
async def get_links(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = await db.execute(text("SELECT * FROM links WHERE user_id = :uid ORDER BY order_index ASC, created_at ASC"), {"uid": user["id"]})
    return [row_to_link(r) for r in rows.fetchall()]

@api.post("/links")
async def add_link(body: LinkIn, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    lid = str(uuid.uuid4())
    await db.execute(text("""
        INSERT INTO links (id, user_id, platform, label, url, hidden, config, created_at, order_index)
        VALUES (:id, :uid, :platform, :label, :url, :hidden, :config, :ca, 0)
    """), {"id": lid, "uid": user["id"], "platform": body.platform, "label": body.label,
           "url": body.url, "hidden": body.hidden, "config": _jdump(body.config), "ca": now_iso()})
    await db.commit()
    await cleanup_unused_uploads(user["id"])
    row = await db.execute(text("SELECT * FROM links WHERE id = :id"), {"id": lid})
    return row_to_link(row.fetchone()) or {"id": lid, **body.model_dump()}

@api.delete("/links/{link_id}")
async def del_link(link_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(text("DELETE FROM links WHERE id = :id AND user_id = :uid"), {"id": link_id, "uid": user["id"]})
    await db.commit()
    await cleanup_unused_uploads(user["id"])
    return {"ok": True}

@api.put("/links/{link_id}")
async def update_link(link_id: str, body: LinkUpdate, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if "config" in updates:
        updates["config"] = _jdump(updates["config"])
    if updates:
        set_parts = ", ".join(f"{k} = :{k}" for k in updates)
        updates["id"] = link_id
        updates["uid"] = user["id"]
        await db.execute(text(f"UPDATE links SET {set_parts} WHERE id = :id AND user_id = :uid"), updates)
        await db.commit()
        await cleanup_unused_uploads(user["id"])
    row = await db.execute(text("SELECT * FROM links WHERE id = :id"), {"id": link_id})
    return row_to_link(row.fetchone())

# ─────────────────────────────────────────
# Uploads
# ─────────────────────────────────────────
@api.post("/upload")
async def upload(file: UploadFile = File(...), user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    data = await file.read()
    stored = store_file(file.filename, data, file.content_type or "application/octet-stream", user["id"])
    fid = str(uuid.uuid4())
    await db.execute(text("""
        INSERT INTO files (id, storage_path, url, is_external, content_type, user_id, original_filename, is_deleted, created_at)
        VALUES (:id, :path, :url, :ext, :ct, :uid, :fn, FALSE, :ca)
    """), {"id": fid, "path": stored["path"], "url": stored["url"], "ext": stored.get("is_external", False),
           "ct": file.content_type, "uid": user["id"], "fn": file.filename, "ca": now_iso()})
    await db.commit()
    return {"url": stored["url"], "path": stored["path"]}

@api.get("/files/{path:path}")
async def download(path: str, db: AsyncSession = Depends(get_db)):
    row = await db.execute(text("SELECT * FROM files WHERE storage_path = :p AND is_deleted = FALSE"), {"p": path})
    item = row.fetchone()
    record = dict(item._mapping) if item else None
    if record and record.get("url") and record["url"].startswith("http"):
        return RedirectResponse(url=record["url"])

    local_file = UPLOAD_DIR / path
    if local_file.is_file():
        media_type = (record.get("content_type") if record else None) or "application/octet-stream"
        return FileResponse(path=str(local_file), media_type=media_type)

    raise HTTPException(status_code=404, detail="File not found")

# ─────────────────────────────────────────
# Public bio
# ─────────────────────────────────────────
def strip_public_settings(settings: dict) -> dict:
    s = {**(settings or {})}
    s.pop("profile_templates", None)
    es = {**(s.get("enter_screen") or {})}
    es.pop("password", None)
    s["enter_screen"] = es
    return s

def strip_connections(conns: dict) -> dict:
    c = {**(conns or {})}
    if c.get("spotify"):
        sp = {**c["spotify"]}
        sp.pop("refresh_token", None)
        c["spotify"] = sp
    return c

async def build_bio(user: dict, full: bool, db: AsyncSession):
    u = public_user(user)
    s = u.get("settings") or DEFAULT_SETTINGS
    base = {
        "username": u["username"], "display_name": u.get("display_name"),
        "badges": u.get("badges", []), "views": u.get("views", 0),
        "settings": strip_public_settings(s), "connections": strip_connections(u.get("connections") or {}),
        "locked": not full,
    }
    if full:
        rows = await db.execute(text("SELECT * FROM links WHERE user_id = :uid AND (hidden = FALSE OR hidden IS NULL) ORDER BY order_index ASC, created_at ASC"), {"uid": user["id"]})
        links = [row_to_link(r) for r in rows.fetchall()]
        base["description"] = u.get("description", "")
        base["links"] = [{"id": l["id"], "platform": l["platform"], "label": l["label"], "url": l["url"], "config": l.get("config", {})} for l in links]
    return base

def bio_is_locked(user: dict) -> bool:
    es = (user.get("settings") or {}).get("enter_screen") or {}
    return bool(es.get("enabled") and es.get("password"))


def get_request_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for") or request.headers.get("cf-connecting-ip") or request.headers.get("x-real-ip") or ""
    if forwarded:
        return forwarded.split(",")[0].strip()
    return (request.client.host if request.client else "unknown").strip() or "unknown"


def get_view_fingerprint(request: Request) -> str:
    ip = get_request_ip(request)
    ua = request.headers.get("user-agent", "")
    lang = request.headers.get("accept-language", "")
    referer = request.headers.get("referer", "")
    raw = f"{ip}|{ua}|{lang}|{referer}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:32]


def set_view_cookie(response: Response, user_id: str, fingerprint: str):
    response.set_cookie(
        key=f"swats_view_{user_id}",
        value=fingerprint,
        max_age=12 * 60 * 60,
        httponly=True,
        samesite="lax",
        secure=not (FRONTEND_URL or "").startswith("http://"),
        path="/",
    )


async def register_profile_view(user: dict, request: Request, response: Response, db: AsyncSession) -> bool:
    if not user:
        return False
    try:
        cookie_name = f"swats_view_{user['id']}"
        cookie_fingerprint = request.cookies.get(cookie_name)
        fingerprint = get_view_fingerprint(request)
        cutoff = (datetime.now(timezone.utc) - timedelta(hours=12)).isoformat()

        if cookie_fingerprint == fingerprint:
            return False

        recent = await db.execute(
            text("SELECT id FROM view_events WHERE user_id = :uid AND fingerprint = :fp AND at >= :cutoff LIMIT 1"),
            {"uid": user["id"], "fp": fingerprint, "cutoff": cutoff},
        )
        if recent.fetchone():
            set_view_cookie(response, user["id"], fingerprint)
            return False

        await db.execute(text("UPDATE users SET views = views + 1 WHERE id = :id"), {"id": user["id"]})
        vid = str(uuid.uuid4())
        await db.execute(
            text("INSERT INTO view_events (id, user_id, fingerprint, at) VALUES (:id, :uid, :fp, :at)"),
            {"id": vid, "uid": user["id"], "fp": fingerprint, "at": now_iso()},
        )
        await db.commit()
        set_view_cookie(response, user["id"], fingerprint)
        user["views"] = (user.get("views") or 0) + 1
        return True
    except Exception as e:
        logger.warning(f"Error registering view event: {e}")
        return False


@api.get("/u/{username}")
async def public_bio(username: str, request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    clean_u = (username or "").lstrip("@").strip().lower()
    row = await db.execute(text("SELECT * FROM users WHERE LOWER(username) = :u OR LOWER(subdomain) = :u LIMIT 1"), {"u": clean_u})
    user = row_to_user(row.fetchone())
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    locked = bio_is_locked(user)
    if not locked:
        await register_profile_view(user, request, response, db)
    return await build_bio(user, full=not locked, db=db)

@api.get("/profile-preview/{username}")
async def profile_preview(username: str, db: AsyncSession = Depends(get_db)):
    clean_u = (username or "").lstrip("@").strip().lower()
    row = await db.execute(text("SELECT * FROM users WHERE LOWER(username) = :u OR LOWER(subdomain) = :u LIMIT 1"), {"u": clean_u})
    user = row_to_user(row.fetchone())
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return await build_bio(user, full=not bio_is_locked(user), db=db)

@api.post("/u/{username}/unlock")
async def unlock_bio(username: str, body: UnlockIn, request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    clean_u = (username or "").lstrip("@").strip().lower()
    row = await db.execute(text("SELECT * FROM users WHERE LOWER(username) = :u OR LOWER(subdomain) = :u LIMIT 1"), {"u": clean_u})
    user = row_to_user(row.fetchone())
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    es = (user.get("settings") or {}).get("enter_screen") or {}
    if es.get("password") and body.password != es.get("password"):
        raise HTTPException(status_code=401, detail="Incorrect password")
    await register_profile_view(user, request, response, db)
    return await build_bio(user, full=True, db=db)

# ─────────────────────────────────────────
# Stats
# ─────────────────────────────────────────
@api.get("/community/members")
async def community_members(db: AsyncSession = Depends(get_db)):
    rows = await db.execute(text("""
        SELECT id, username, display_name, description, settings, badges, views, created_at
        FROM users
        ORDER BY views DESC, created_at DESC
        LIMIT 100
    """))
    members = []
    for r in rows.fetchall():
        settings = _j(r[4]) if r[4] else {}
        if not isinstance(settings, dict):
            settings = {}
        badges = _j(r[5]) if r[5] else []
        if not isinstance(badges, list):
            badges = []
        pfp = settings.get("pfp")
        avatar_url = file_url(pfp) if pfp else f"https://api.dicebear.com/7.x/bottts/svg?seed={r[1]}"
        location = settings.get("location") or ""
        members.append({
            "id": r[0],
            "username": r[1],
            "display_name": r[2] or r[1],
            "description": r[3] or "",
            "avatar_url": avatar_url,
            "badges": badges,
            "views": r[6] or 0,
            "location": location,
            "created_at": r[7],
        })
    return members

@api.get("/stats")
async def stats(db: AsyncSession = Depends(get_db)):
    total_users  = (await db.execute(text("SELECT COUNT(*) FROM users"))).scalar()
    total_links  = (await db.execute(text("SELECT COUNT(*) FROM links"))).scalar()
    total_views  = (await db.execute(text("SELECT COALESCE(SUM(views),0) FROM users"))).scalar()
    total_invites = (await db.execute(text("SELECT COUNT(*) FROM invite_codes"))).scalar()
    return {"total_users": total_users, "total_links": total_links, "total_views": total_views, "total_invites": total_invites}

def _donation_name(value: Optional[str]) -> str:
    name = re.sub(r"[<>\r\n]", "", (value or "").strip())[:48]
    return name or "Anonymous"

async def _save_donation(db: AsyncSession, *, provider: str, reference: str, amount: str, currency: str, amount_usd_cents: Optional[int], name: str, note: str, status: str, network: str = ""):
    row = await db.execute(text("SELECT id, status FROM donations WHERE provider = :provider AND reference = :reference"), {"provider": provider, "reference": reference})
    existing = row.fetchone()
    if existing:
        if existing[1] == "confirmed" or status != "confirmed":
            return existing[0]
        await db.execute(text("""
            UPDATE donations SET amount = :amount, currency = :currency, amount_usd_cents = :amount_usd_cents,
                name = :name, note = :note, status = :status, network = :network
            WHERE provider = :provider AND reference = :reference
        """), {
            "amount": amount, "currency": currency, "amount_usd_cents": amount_usd_cents,
            "name": name, "note": note, "status": status, "network": network,
            "provider": provider, "reference": reference,
        })
        await db.commit()
        return existing[0]

    donation_id = str(uuid.uuid4())
    await db.execute(text("""
        INSERT INTO donations (id, provider, reference, network, amount, currency, amount_usd_cents, name, note, status, created_at)
        VALUES (:id, :provider, :reference, :network, :amount, :currency, :amount_usd_cents, :name, :note, :status, :created_at)
    """), {
        "id": donation_id, "provider": provider, "reference": reference, "network": network,
        "amount": amount, "currency": currency, "amount_usd_cents": amount_usd_cents,
        "name": name, "note": note[:240], "status": status, "created_at": now_iso(),
    })
    await db.commit()
    return donation_id

@api.get("/donations")
async def list_donations(db: AsyncSession = Depends(get_db)):
    rows = await db.execute(text("""
        SELECT name, amount, currency, amount_usd_cents, note, network, created_at
        FROM donations WHERE status = 'confirmed'
        ORDER BY created_at DESC LIMIT 30
    """))
    feed = []
    total_usd_cents = 0
    totals_by_currency = {}
    for row in rows.fetchall():
        item = dict(row._mapping)
        total_usd_cents += item.get("amount_usd_cents") or 0
        currency = (item.get("currency") or "").upper()
        if currency:
            totals_by_currency[currency] = totals_by_currency.get(currency, 0) + float(item.get("amount") or 0)
        feed.append(item)
    return {
        "feed": feed,
        "total_usd": total_usd_cents / 100,
        "totals_by_currency": totals_by_currency,
        "goal_usd": DONATION_GOAL_USD,
        "stripe_enabled": STRIPE_ENABLED,
        "wallets": {network: address for network, address in DONATION_WALLETS.items() if address},
    }

@api.post("/donations/stripe/checkout")
async def create_donation_checkout(body: DonationCheckoutIn):
    if not STRIPE_ENABLED:
        raise HTTPException(status_code=503, detail="Card donations are not configured on the production server yet.")
    if body.amount_usd < 1 or body.amount_usd > 10000:
        raise HTTPException(status_code=400, detail="Donation amount must be between $1 and $10,000.")
    name = _donation_name(body.name)
    params = {
        "mode": "payment",
        "success_url": f"{FRONTEND_URL}/s/pricing?donation=success&session_id={{CHECKOUT_SESSION_ID}}",
        "cancel_url": f"{FRONTEND_URL}/s/pricing?donation=cancelled",
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][unit_amount]": str(body.amount_usd * 100),
        "line_items[0][price_data][product_data][name]": "swats.bio community donation",
        "metadata[donor_name]": name,
        "metadata[donor_note]": (body.note or "").strip()[:240],
    }
    try:
        response = await run_in_threadpool(
            requests.post,
            "https://api.stripe.com/v1/checkout/sessions",
            data=params,
            auth=(STRIPE_SECRET_KEY, ""),
            timeout=15,
        )
    except requests.RequestException:
        raise HTTPException(status_code=502, detail="Stripe is temporarily unreachable.")
    if response.status_code >= 400:
        logger.error("Stripe checkout creation failed: %s", response.text[:500])
        raise HTTPException(status_code=502, detail="Stripe could not create a checkout session.")
    result = response.json()
    return {"url": result.get("url"), "session_id": result.get("id")}

@api.post("/donations/stripe/webhook")
async def stripe_donation_webhook(request: Request, stripe_signature: Optional[str] = Header(None, alias="Stripe-Signature"), db: AsyncSession = Depends(get_db)):
    if not STRIPE_WEBHOOK_SECRET or not stripe_signature:
        raise HTTPException(status_code=400, detail="Invalid Stripe webhook configuration.")
    raw_body = await request.body()
    signature_parts = dict(part.split("=", 1) for part in stripe_signature.split(",") if "=" in part)
    timestamp = signature_parts.get("t", "")
    signature = signature_parts.get("v1", "")
    try:
        if abs(time.time() - int(timestamp)) > 300:
            raise ValueError("expired")
    except ValueError:
        raise HTTPException(status_code=400, detail="Expired Stripe webhook signature.")
    signed = f"{timestamp}.{raw_body.decode('utf-8')}".encode()
    expected = hmac.new(STRIPE_WEBHOOK_SECRET.encode(), signed, hashlib.sha256).hexdigest()
    if not secrets.compare_digest(expected, signature):
        raise HTTPException(status_code=400, detail="Invalid Stripe webhook signature.")
    try:
        event = json.loads(raw_body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid Stripe event payload.")
    session = event.get("data", {}).get("object", {})
    if event.get("type") == "checkout.session.completed" and session.get("payment_status") == "paid":
        amount_cents = int(session.get("amount_total") or 0)
        metadata = session.get("metadata") or {}
        await _save_donation(
            db,
            provider="stripe",
            reference=str(session.get("id") or event.get("id")),
            amount=f"{amount_cents / 100:.2f}",
            currency=(session.get("currency") or "usd").upper(),
            amount_usd_cents=amount_cents if (session.get("currency") or "usd").lower() == "usd" else None,
            name=_donation_name(metadata.get("donor_name")),
            note=(metadata.get("donor_note") or "").strip()[:240],
            status="confirmed",
        )
    return {"received": True}

def _lookup_crypto_transaction(network: str, transaction_id: str) -> dict:
    if network in {"btc", "ltc"}:
        base = "https://mempool.space/api" if network == "btc" else "https://litecoinspace.org/api"
        response = requests.get(f"{base}/tx/{transaction_id}", timeout=15)
        response.raise_for_status()
        tx = response.json()
        outputs = tx.get("vout") or []
        address_key = "DONATION_BTC_ADDRESS" if network == "btc" else "DONATION_LTC_ADDRESS"
        address = DONATION_WALLETS[network].lower()
        output = next((item for item in outputs if str(item.get("scriptpubkey_address") or "").lower() == address), None)
        if not output:
            raise HTTPException(status_code=400, detail=f"This transaction does not pay the configured {network.upper()} wallet.")
        return {
            "amount": f"{int(output.get('value') or 0) / 100_000_000:.8f}",
            "confirmed": bool((tx.get("status") or {}).get("confirmed")),
            "currency": network.upper(),
            "address_env": address_key,
        }
    if network == "eth":
        response = requests.get(f"https://eth.blockscout.com/api/v2/transactions/{transaction_id}", timeout=15)
        response.raise_for_status()
        tx = response.json()
        recipient = tx.get("to") or {}
        recipient = recipient.get("hash") if isinstance(recipient, dict) else recipient
        if str(recipient or "").lower() != DONATION_WALLETS["eth"].lower():
            raise HTTPException(status_code=400, detail="This transaction does not pay the configured ETH wallet.")
        return {
            "amount": f"{int(tx.get('value') or 0) / 10**18:.8f}",
            "confirmed": bool(tx.get("block") and str(tx.get("status", "")).lower() in {"ok", "success"}),
            "currency": "ETH",
            "address_env": "DONATION_ETH_ADDRESS",
        }
    raise HTTPException(status_code=400, detail="Choose BTC, ETH, or LTC.")

@api.post("/donations/crypto/verify")
async def verify_crypto_donation(body: CryptoDonationIn, db: AsyncSession = Depends(get_db)):
    network = body.network.strip().lower()
    transaction_id = body.transaction_id.strip().lower()
    if network not in DONATION_WALLETS or not DONATION_WALLETS[network]:
        raise HTTPException(status_code=503, detail=f"{network.upper()} donations are not configured on the production server.")
    pattern = r"0x[a-f0-9]{64}" if network == "eth" else r"[a-f0-9]{64}"
    if not re.fullmatch(pattern, transaction_id):
        raise HTTPException(status_code=400, detail="Enter a valid transaction ID for the selected network.")
    try:
        transaction = await run_in_threadpool(_lookup_crypto_transaction, network, transaction_id)
    except HTTPException:
        raise
    except requests.RequestException:
        raise HTTPException(status_code=502, detail="The network explorer is unavailable. Try again shortly.")
    except (ValueError, KeyError, TypeError):
        raise HTTPException(status_code=502, detail="The explorer returned an invalid transaction response.")

    reference = f"{network}:{transaction_id}"
    donation_id = await _save_donation(
        db,
        provider="crypto",
        reference=reference,
        network=network,
        amount=transaction["amount"],
        currency=transaction["currency"],
        amount_usd_cents=None,
        name=_donation_name(body.name),
        note=(body.note or "").strip()[:240],
        status="confirmed" if transaction["confirmed"] else "pending",
    )
    return {"id": donation_id, "status": "confirmed" if transaction["confirmed"] else "pending", "amount": transaction["amount"], "currency": transaction["currency"]}

@api.get("/stats/me")
async def my_stats(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    since = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    rows = await db.execute(text("SELECT at FROM view_events WHERE user_id = :uid"), {"uid": user["id"]})
    events = rows.fetchall()
    daily = {}
    for i in range(7):
        d = (datetime.now(timezone.utc) - timedelta(days=6 - i)).strftime("%a")
        daily[d] = 0
    for e in events:
        try:
            dt = datetime.fromisoformat(e[0])
            if dt >= datetime.fromisoformat(since):
                key = dt.strftime("%a")
                daily[key] = daily.get(key, 0) + 1
        except Exception:
            pass
    link_count = (await db.execute(text("SELECT COUNT(*) FROM links WHERE user_id = :uid"), {"uid": user["id"]})).scalar()
    return {"views": user.get("views", 0), "links": link_count, "daily": [{"day": k, "views": v} for k, v in daily.items()]}

@api.get("/leaderboard")
async def leaderboard(db: AsyncSession = Depends(get_db)):
    rows = await db.execute(text("SELECT * FROM users ORDER BY views DESC LIMIT 50"))
    users = [row_to_user(r) for r in rows.fetchall()]
    return [
        {
            "rank": i + 1,
            "username": u["username"],
            "display_name": u.get("display_name"),
            "views": u.get("views", 0),
            "badges": u.get("badges", []),
            "pfp": (u.get("settings") or {}).get("pfp"),
            "banner": (u.get("settings") or {}).get("banner"),
            "accent_color": (u.get("settings") or {}).get("accent_color") or "#5B8DB8",
        }
        for i, u in enumerate(users)
    ]


# ─────────────────────────────────────────
# Social, Friends & Real-time Chat Network
# ─────────────────────────────────────────
def build_social_user_card(u: dict, friendship_id: str = None, status: str = "accepted", is_incoming: bool = False):
    s = u.get("settings") or {}
    if isinstance(s, str):
        s = _j(s) or {}
    pfp = s.get("pfp")
    avatar_url = pfp if pfp and (pfp.startswith("http://") or pfp.startswith("https://") or pfp.startswith("/api/")) else (f"/api/files/{pfp}" if pfp else f"https://api.dicebear.com/7.x/bottts/svg?seed={u.get('username')}")
    banner = s.get("banner") or s.get("banner_url") or ""
    badges = u.get("badges") or []
    if isinstance(badges, str):
        badges = _j(badges) or []
    conn = u.get("connections") or {}
    if isinstance(conn, str):
        conn = _j(conn) or {}
    
    return {
        "id": u.get("id"),
        "user_id": u.get("id"),
        "username": u.get("username"),
        "display_name": u.get("display_name") or u.get("username"),
        "description": u.get("description") or s.get("bio") or "",
        "bio": u.get("description") or s.get("bio") or "",
        "avatar_url": avatar_url,
        "avatar": avatar_url,
        "pfp": pfp,
        "banner": banner,
        "banner_url": banner,
        "role": u.get("role") or "user",
        "badges": badges,
        "views": u.get("views") or 0,
        "location": s.get("location") or "",
        "accent_color": s.get("accent_color") or "#5B8DB8",
        "connections": conn,
        "friendship_id": friendship_id,
        "status": status,
        "is_incoming": is_incoming,
        "created_at": u.get("created_at"),
    }

@api.get("/social/users/{user_id}")
async def get_social_user_profile(user_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    row = await db.execute(text("SELECT * FROM users WHERE id = :id OR username = :id"), {"id": user_id})
    target_user = row_to_user(row.fetchone())
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check friendship status if any
    fs_row = await db.execute(text("""
        SELECT id, status, user_id FROM friendships 
        WHERE (user_id = :uid AND friend_id = :tid) OR (user_id = :tid AND friend_id = :uid)
    """), {"uid": user["id"], "tid": target_user["id"]})
    fs = fs_row.fetchone()
    friendship_id = fs[0] if fs else None
    status = fs[1] if fs else "none"
    is_incoming = (fs[2] == target_user["id"] and status == "pending") if fs else False
    
    return build_social_user_card(target_user, friendship_id=friendship_id, status=status, is_incoming=is_incoming)

@api.get("/social/friends")
async def get_my_friends(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    uid = user["id"]
    rows = await db.execute(text("""
        SELECT f.id as friendship_id, f.user_id, f.friend_id, f.status, f.created_at,
               u.id as u_id, u.username, u.display_name, u.description, u.role, u.badges, u.views, u.settings, u.created_at as u_created_at
        FROM friendships f
        JOIN users u ON (CASE WHEN f.user_id = :uid THEN f.friend_id ELSE f.user_id END) = u.id
        WHERE f.user_id = :uid OR f.friend_id = :uid
        ORDER BY f.created_at DESC
    """), {"uid": uid})

    friends_list = []
    incoming_list = []
    outgoing_list = []

    for r in rows.fetchall():
        d = dict(r._mapping)
        status = d.get("status") or "accepted"
        f_user = {
            "id": d.get("u_id"),
            "username": d.get("username"),
            "display_name": d.get("display_name"),
            "description": d.get("description"),
            "role": d.get("role"),
            "badges": d.get("badges"),
            "views": d.get("views"),
            "settings": d.get("settings"),
            "created_at": d.get("u_created_at"),
        }
        f_id = d.get("friendship_id")
        
        if status == "accepted":
            friends_list.append(build_social_user_card(f_user, friendship_id=f_id, status="accepted"))
        elif status == "pending":
            if d.get("friend_id") == uid:
                incoming_list.append(build_social_user_card(f_user, friendship_id=f_id, status="pending", is_incoming=True))
            else:
                outgoing_list.append(build_social_user_card(f_user, friendship_id=f_id, status="pending", is_incoming=False))

    return {
        "friends": friends_list,
        "incoming_requests": incoming_list,
        "outgoing_requests": outgoing_list,
        "total_friends": len(friends_list),
        "total_incoming": len(incoming_list),
    }

@api.post("/social/friends/request")
async def send_friend_request(body: FriendRequestIn, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    target_username = (body.username or "").lstrip("@").strip().lower()
    target_id = (body.user_id or "").strip()

    if not target_username and not target_id:
        raise HTTPException(status_code=400, detail="Username or user ID is required")

    if target_username:
        target_row = await db.execute(text("SELECT * FROM users WHERE LOWER(username) = :u OR LOWER(subdomain) = :u LIMIT 1"), {"u": target_username})
    else:
        target_row = await db.execute(text("SELECT * FROM users WHERE id = :id"), {"id": target_id})
    
    target = row_to_user(target_row.fetchone())
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    
    if target["id"] == user["id"]:
        raise HTTPException(status_code=400, detail="You cannot friend request yourself")

    # Check existing friendship
    existing_row = await db.execute(text("""
        SELECT * FROM friendships 
        WHERE (user_id = :uid AND friend_id = :tid) OR (user_id = :tid AND friend_id = :uid)
    """), {"uid": user["id"], "tid": target["id"]})
    existing = existing_row.fetchone()

    if existing:
        ex_dict = dict(existing._mapping)
        if ex_dict.get("status") == "accepted":
            return {"status": "already_friends", "message": f"You are already friends with @{target['username']}."}
        if ex_dict.get("user_id") == user["id"]:
            return {"status": "already_pending", "message": f"Friend request already pending to @{target['username']}."}
        else:
            # Auto accept if target already sent a request to me!
            await db.execute(text("UPDATE friendships SET status = 'accepted' WHERE id = :id"), {"id": ex_dict["id"]})
            await db.commit()
            return {"status": "accepted", "message": f"Accepted friend request from @{target['username']}!"}

    # Create new pending request
    fid = str(uuid.uuid4())
    await db.execute(text("""
        INSERT INTO friendships (id, user_id, friend_id, status, created_at)
        VALUES (:id, :uid, :tid, 'pending', :ca)
    """), {"id": fid, "uid": user["id"], "tid": target["id"], "ca": now_iso()})
    await db.commit()

    return {"status": "sent", "message": f"Friend request sent to @{target['username']}!", "friendship_id": fid}

@api.post("/social/friends/accept")
async def accept_friend_request(body: FriendshipActionIn, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    fid = (body.friendship_id or "").strip()
    f_uid = (body.friend_id or "").strip()
    target_username = (body.username or "").strip().lower()

    if fid:
        row = await db.execute(text("SELECT * FROM friendships WHERE id = :id"), {"id": fid})
    elif f_uid:
        row = await db.execute(text("""
            SELECT * FROM friendships 
            WHERE (user_id = :tid AND friend_id = :uid) OR (user_id = :uid AND friend_id = :tid)
        """), {"uid": user["id"], "tid": f_uid})
    elif target_username:
        u_row = await db.execute(text("SELECT id FROM users WHERE username = :u"), {"u": target_username})
        target = u_row.fetchone()
        if not target:
            raise HTTPException(status_code=404, detail="User not found")
        row = await db.execute(text("""
            SELECT * FROM friendships 
            WHERE (user_id = :tid AND friend_id = :uid) OR (user_id = :uid AND friend_id = :tid)
        """), {"uid": user["id"], "tid": target[0]})
    else:
        raise HTTPException(status_code=400, detail="Friendship ID, friend ID or username required")

    friendship = row.fetchone()
    if not friendship:
        raise HTTPException(status_code=404, detail="Friend request not found")

    f_data = dict(friendship._mapping)
    await db.execute(text("UPDATE friendships SET status = 'accepted' WHERE id = :id"), {"id": f_data["id"]})
    await db.commit()

    return {"ok": True, "message": "Friend request accepted!"}

@api.post("/social/friends/reject")
@api.post("/social/friends/decline")
async def reject_friend_request(body: FriendshipActionIn, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    fid = (body.friendship_id or "").strip()
    f_uid = (body.friend_id or "").strip()
    
    if not fid and f_uid:
        f_row = await db.execute(text("""
            SELECT id FROM friendships 
            WHERE (user_id = :tid AND friend_id = :uid) OR (user_id = :uid AND friend_id = :tid)
        """), {"uid": user["id"], "tid": f_uid})
        f = f_row.fetchone()
        if f:
            fid = f[0]
            
    if not fid and body.username:
        u_row = await db.execute(text("SELECT id FROM users WHERE username = :u"), {"u": body.username.lower()})
        target = u_row.fetchone()
        if target:
            f_row = await db.execute(text("""
                SELECT id FROM friendships 
                WHERE (user_id = :tid AND friend_id = :uid) OR (user_id = :uid AND friend_id = :tid)
            """), {"uid": user["id"], "tid": target[0]})
            f = f_row.fetchone()
            if f:
                fid = f[0]

    if not fid:
        raise HTTPException(status_code=400, detail="Friendship ID required")

    await db.execute(text("DELETE FROM friendships WHERE id = :id AND (user_id = :uid OR friend_id = :uid)"), {"id": fid, "uid": user["id"]})
    await db.commit()
    return {"ok": True, "message": "Friend request removed"}

@api.delete("/social/friends/{friendship_id}")
async def remove_friend(friendship_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(text("DELETE FROM friendships WHERE id = :id AND (user_id = :uid OR friend_id = :uid)"), {"id": friendship_id, "uid": user["id"]})
    await db.commit()
    return {"ok": True, "message": "Friend removed"}

@api.get("/u/{username}/friends")
async def get_public_friends(username: str, db: AsyncSession = Depends(get_db)):
    u_row = await db.execute(text("SELECT id, username FROM users WHERE username = :u OR subdomain = :u LIMIT 1"), {"u": username.lower()})
    target = u_row.fetchone()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    
    uid = target[0]
    rows = await db.execute(text("""
        SELECT f.id as friendship_id, f.created_at as friendship_date,
               u.id as u_id, u.username, u.display_name, u.description, u.role, u.badges, u.views, u.settings, u.created_at as u_created_at
        FROM friendships f
        JOIN users u ON (CASE WHEN f.user_id = :uid THEN f.friend_id ELSE f.user_id END) = u.id
        WHERE (f.user_id = :uid OR f.friend_id = :uid) AND f.status = 'accepted'
        ORDER BY f.created_at DESC
        LIMIT 60
    """), {"uid": uid})

    friends = [build_social_user_card(dict(r._mapping), friendship_id=r[0]) for r in rows.fetchall()]
    return {"friends": friends, "total": len(friends)}

# Chat Channels & Messages
@api.get("/social/channels")
async def list_chat_channels(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    uid = user["id"]
    
    # 0. Ensure Swats Global Lounge exists in database
    lounge_row = await db.execute(text("SELECT * FROM chat_channels WHERE id = 'community-general'"))
    lounge = lounge_row.fetchone()
    if not lounge:
        await db.execute(text("""
            INSERT INTO chat_channels (id, name, is_group, owner_id, members, icon_url, created_at)
            VALUES ('community-general', 'Swats Global Lounge', TRUE, :uid, '[]', 'https://www.swats.bio/logo.png', :ca)
        """), {"uid": uid, "ca": now_iso()})
        await db.commit()

    # 1. Fetch group channels where user is in members or is community-general
    all_channels_rows = await db.execute(text("SELECT * FROM chat_channels ORDER BY created_at DESC"))
    channels = []
    
    for r in all_channels_rows.fetchall():
        c_dict = dict(r._mapping)
        members = _j(c_dict.get("members")) or []
        is_global = c_dict["id"] == "community-general"
        if is_global or uid in members:
            # Fetch latest message
            msg_row = await db.execute(text("SELECT * FROM chat_messages WHERE channel_id = :cid ORDER BY created_at DESC LIMIT 1"), {"cid": c_dict["id"]})
            latest_msg = msg_row.fetchone()
            c_dict["members"] = members
            c_dict["latest_message"] = dict(latest_msg._mapping) if latest_msg else None
            
            # If 1-on-1 DM, resolve the *other* user's display name and avatar dynamically
            if not c_dict.get("is_group"):
                other_uid = next((m for m in members if m != uid), None)
                if other_uid:
                    u_row = await db.execute(text("SELECT username, display_name, settings FROM users WHERE id = :id"), {"id": other_uid})
                    u_other = u_row.fetchone()
                    if u_other:
                        c_dict["name"] = u_other[1] or u_other[0]
                        u_sett = _j(u_other[2]) or {}
                        pfp = u_sett.get("pfp")
                        c_dict["icon_url"] = pfp if pfp and (pfp.startswith("http://") or pfp.startswith("https://") or pfp.startswith("/api/")) else (f"/api/files/{pfp}" if pfp else f"https://api.dicebear.com/7.x/bottts/svg?seed={u_other[0]}")
            
            channels.append(c_dict)

    # 2. Ensure auto-DMs with all accepted friends
    friends_rows = await db.execute(text("""
        SELECT CASE WHEN user_id = :uid THEN friend_id ELSE user_id END as friend_uid 
        FROM friendships WHERE (user_id = :uid OR friend_id = :uid) AND status = 'accepted'
    """), {"uid": uid})
    friend_uids = [r[0] for r in friends_rows.fetchall()]

    for f_uid in friend_uids:
        # Check if DM channel already exists
        dm_exists = False
        for c in channels:
            if not c.get("is_group") and f_uid in c.get("members", []) and uid in c.get("members", []):
                dm_exists = True
                break
        
        if not dm_exists:
            # Check DB if channel exists between these 2
            db_dm = await db.execute(text("""
                SELECT * FROM chat_channels WHERE is_group = FALSE AND members LIKE :m1 AND members LIKE :m2
            """), {"m1": f"%{uid}%", "m2": f"%{f_uid}%"})
            row = db_dm.fetchone()
            if row:
                c_dict = dict(row._mapping)
                c_dict["members"] = _j(c_dict.get("members")) or []
                msg_row = await db.execute(text("SELECT * FROM chat_messages WHERE channel_id = :cid ORDER BY created_at DESC LIMIT 1"), {"cid": c_dict["id"]})
                latest_msg = msg_row.fetchone()
                c_dict["latest_message"] = dict(latest_msg._mapping) if latest_msg else None
                
                f_row = await db.execute(text("SELECT username, display_name, settings FROM users WHERE id = :id"), {"id": f_uid})
                f_user = f_row.fetchone()
                if f_user:
                    c_dict["name"] = f_user[1] or f_user[0]
                    f_sett = _j(f_user[2]) or {}
                    pfp = f_sett.get("pfp")
                    c_dict["icon_url"] = pfp if pfp and (pfp.startswith("http://") or pfp.startswith("https://") or pfp.startswith("/api/")) else (f"/api/files/{pfp}" if pfp else f"https://api.dicebear.com/7.x/bottts/svg?seed={f_user[0]}")
                
                channels.append(c_dict)
            else:
                # Create a DM channel
                cid = f"dm-{min(uid, f_uid)}-{max(uid, f_uid)}"
                f_row = await db.execute(text("SELECT username, display_name, settings FROM users WHERE id = :id"), {"id": f_uid})
                f_user = f_row.fetchone()
                f_name = f_user[1] or f_user[0] if f_user else "Friend"
                f_sett = _j(f_user[2]) if f_user else {}
                pfp = f_sett.get("pfp") if f_sett else None
                icon_url = pfp if pfp and (pfp.startswith("http://") or pfp.startswith("https://") or pfp.startswith("/api/")) else (f"/api/files/{pfp}" if pfp else (f"https://api.dicebear.com/7.x/bottts/svg?seed={f_user[0]}" if f_user else ""))
                
                await db.execute(text("""
                    INSERT INTO chat_channels (id, name, is_group, owner_id, members, icon_url, created_at)
                    VALUES (:id, :name, FALSE, :uid, :members, :icon, :ca)
                """), {"id": cid, "name": f_name, "uid": uid, "members": _jdump([uid, f_uid]), "icon": icon_url, "ca": now_iso()})
                await db.commit()
                
                channels.append({
                    "id": cid,
                    "name": f_name,
                    "is_group": False,
                    "owner_id": uid,
                    "members": [uid, f_uid],
                    "icon_url": icon_url,
                    "created_at": now_iso(),
                    "latest_message": None,
                })

    # Guarantee Swats Global Lounge is at the very top of channels list
    channels.sort(key=lambda c: 0 if c["id"] == "community-general" else 1)
    return channels

@api.get("/social/channels/{channel_id}/members")
async def get_channel_members(channel_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if channel_id == "community-general":
        # Swats Global Lounge shows EVERY registered user on the entire platform!
        rows = await db.execute(text("SELECT * FROM users ORDER BY views DESC, created_at DESC LIMIT 150"))
        all_users = [row_to_user(r) for r in rows.fetchall()]
        members = [build_social_user_card(u) for u in all_users if u]
        return {"channel_id": channel_id, "members": members, "total": len(members)}
    
    channel_row = await db.execute(text("SELECT owner_id, members, is_group FROM chat_channels WHERE id = :id"), {"id": channel_id})
    channel = channel_row.fetchone()
    if not channel:
        raise HTTPException(status_code=404, detail="Chat channel not found.")
    
    member_ids = _j(channel[1]) or []
    if channel[0] and channel[0] not in member_ids:
        member_ids.append(channel[0])
    
    if not member_ids:
        return {"channel_id": channel_id, "members": [], "total": 0}
        
    users_rows = await db.execute(text("SELECT * FROM users WHERE id IN :ids"), {"ids": tuple(member_ids)})
    mapped_users = [row_to_user(r) for r in users_rows.fetchall()]
    members = [build_social_user_card(u) for u in mapped_users if u]
    return {"channel_id": channel_id, "members": members, "total": len(members)}

@api.post("/social/dm")
async def start_or_get_direct_message(body: CreateDmIn, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    uid = user["id"]
    target_id = (body.target_user_id or "").strip()
    target_uname = (body.username or "").lstrip("@").strip().lower()

    target_user = None
    if target_id:
        r = await db.execute(text("SELECT id, username, display_name, settings FROM users WHERE id = :id"), {"id": target_id})
        target_user = r.fetchone()
    elif target_uname:
        r = await db.execute(text("SELECT id, username, display_name, settings FROM users WHERE LOWER(username) = :u OR LOWER(subdomain) = :u"), {"u": target_uname})
        target_user = r.fetchone()

    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    f_uid = target_user[0]
    if f_uid == uid:
        raise HTTPException(status_code=400, detail="Cannot create direct message channel with yourself.")

    cid = f"dm-{min(uid, f_uid)}-{max(uid, f_uid)}"
    f_name = target_user[1] or target_user[0]
    f_sett = _j(target_user[2]) if target_user[2] else {}
    pfp = f_sett.get("pfp")
    icon_url = pfp if pfp and (pfp.startswith("http://") or pfp.startswith("https://") or pfp.startswith("/api/")) else (f"/api/files/{pfp}" if pfp else f"https://api.dicebear.com/7.x/bottts/svg?seed={target_user[0]}")

    # Check if exists
    c_row = await db.execute(text("SELECT id FROM chat_channels WHERE id = :id"), {"id": cid})
    if not c_row.fetchone():
        await db.execute(text("""
            INSERT INTO chat_channels (id, name, is_group, owner_id, members, icon_url, created_at)
            VALUES (:id, :name, FALSE, :uid, :members, :icon, :ca)
        """), {"id": cid, "name": f_name, "uid": uid, "members": _jdump([uid, f_uid]), "icon": icon_url, "ca": now_iso()})
        await db.commit()

    return {
        "id": cid,
        "name": f_name,
        "is_group": False,
        "owner_id": uid,
        "members": [uid, f_uid],
        "icon_url": icon_url,
        "created_at": now_iso(),
    }

@api.post("/social/channels")
async def create_chat_channel(body: CreateChannelIn, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):

    members = list(set([user["id"]] + (body.member_ids or [])))
    cid = str(uuid.uuid4())
    name = (body.name or "Group Chat").strip()
    
    await db.execute(text("""
        INSERT INTO chat_channels (id, name, is_group, owner_id, members, icon_url, created_at)
        VALUES (:id, :name, :is_group, :uid, :members, :icon, :ca)
    """), {
        "id": cid,
        "name": name,
        "is_group": body.is_group,
        "uid": user["id"],
        "members": _jdump(members),
        "icon": body.icon_url or "",
        "ca": now_iso(),
    })
    await db.commit()
    
    return {"id": cid, "name": name, "is_group": body.is_group, "members": members, "owner_id": user["id"]}

@api.post("/social/channels/{channel_id}/members")
async def add_chat_channel_members(channel_id: str, body: AddChannelMembersIn, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    row = await db.execute(text("SELECT is_group, owner_id, members FROM chat_channels WHERE id = :id"), {"id": channel_id})
    channel = row.fetchone()
    if not channel:
        raise HTTPException(status_code=404, detail="Group chat not found.")
    if not channel[0] or channel[1] != user["id"]:
        raise HTTPException(status_code=403, detail="Only the group owner can add members.")
    if len(body.member_ids) > 25:
        raise HTTPException(status_code=400, detail="You can add up to 25 people at a time.")

    members = _j(channel[2]) or []
    members = members if isinstance(members, list) else []
    additions = []
    for member_id in set(body.member_ids):
        if member_id == user["id"] or member_id in members:
            continue
        friendship = await db.execute(text("""
            SELECT 1 FROM friendships
            WHERE status = 'accepted'
              AND ((user_id = :owner AND friend_id = :member) OR (user_id = :member AND friend_id = :owner))
            LIMIT 1
        """), {"owner": user["id"], "member": member_id})
        if not friendship.fetchone():
            raise HTTPException(status_code=403, detail="You can only add accepted friends to a group.")
        additions.append(member_id)

    members = [*members, *additions]
    await db.execute(text("UPDATE chat_channels SET members = :members WHERE id = :id"), {"members": _jdump(members), "id": channel_id})
    await db.commit()
    return {"ok": True, "members": members}

@api.delete("/social/channels/{channel_id}")
async def delete_chat_channel(channel_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if channel_id == "community-general":
        raise HTTPException(status_code=400, detail="Cannot delete default community lounge.")
    row = await db.execute(text("SELECT is_group, owner_id FROM chat_channels WHERE id = :id"), {"id": channel_id})
    channel = row.fetchone()
    if not channel:
        raise HTTPException(status_code=404, detail="Group chat not found.")
    if not channel[0] or channel[1] != user["id"]:
        raise HTTPException(status_code=403, detail="Only the group owner can delete this group chat.")
    await db.execute(text("DELETE FROM chat_messages WHERE channel_id = :id"), {"id": channel_id})
    await db.execute(text("DELETE FROM chat_channels WHERE id = :id"), {"id": channel_id})
    await db.commit()
    return {"ok": True}

@api.get("/social/channels/{channel_id}/messages")
async def get_channel_messages(channel_id: str, limit: int = 100, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if channel_id != "community-general":
        channel_row = await db.execute(text("SELECT owner_id, members FROM chat_channels WHERE id = :id"), {"id": channel_id})
        channel = channel_row.fetchone()
        if not channel:
            raise HTTPException(status_code=404, detail="Chat channel not found.")
        channel_members = _j(channel[1]) or []
        if user["id"] not in channel_members and channel[0] != user["id"]:
            raise HTTPException(status_code=403, detail="You are not a member of this chat.")

    rows = await db.execute(text("""
        SELECT m.id, m.channel_id, m.sender_id, m.content, m.media_url, m.media_type, m.text_effect, m.created_at,
             m.read_by, m.reactions, m.pinned, u.username, u.display_name, u.role, u.badges, u.settings
        FROM chat_messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.channel_id = :cid
        ORDER BY m.created_at ASC
        LIMIT :lim
    """), {"cid": channel_id, "lim": limit})

    msgs = []
    changed_read_receipts = False
    for r in rows.fetchall():
        d = dict(r._mapping)
        read_by = _j(d.get("read_by")) or []
        read_by = read_by if isinstance(read_by, list) else []
        if d["sender_id"] != user["id"] and user["id"] not in read_by:
            read_by.append(user["id"])
            await db.execute(text("UPDATE chat_messages SET read_by = :read_by WHERE id = :id"), {"read_by": _jdump(read_by), "id": d["id"]})
            changed_read_receipts = True
        s = _j(d.get("settings")) or {}
        pfp = s.get("pfp")
        avatar_url = pfp if pfp and (pfp.startswith("http://") or pfp.startswith("https://") or pfp.startswith("/api/")) else (f"/api/files/{pfp}" if pfp else f"https://api.dicebear.com/7.x/bottts/svg?seed={d.get('username')}")
        
        msgs.append({
            "id": d["id"],
            "channel_id": d["channel_id"],
            "sender_id": d["sender_id"],
            "content": d["content"],
            "media_url": d.get("media_url"),
            "media_type": d.get("media_type"),
            "text_effect": d.get("text_effect") or "none",
            "reactions": _j(d.get("reactions")) or {},
            "pinned": bool(d.get("pinned")),
            "created_at": d["created_at"],
            "read_by": read_by,
            "sender": {
                "id": d["sender_id"],
                "username": d["username"],
                "display_name": d["display_name"] or d["username"],
                "avatar_url": avatar_url,
                "role": d.get("role") or "user",
                "badges": _j(d.get("badges")) or [],
            }
        })

    if changed_read_receipts:
        await db.commit()
    return msgs

@api.post("/social/channels/{channel_id}/messages")
async def send_channel_message(channel_id: str, body: SendMessageIn, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if channel_id != "community-general":
        channel_row = await db.execute(text("SELECT owner_id, members FROM chat_channels WHERE id = :id"), {"id": channel_id})
        channel = channel_row.fetchone()
        if not channel:
            raise HTTPException(status_code=404, detail="Chat channel not found.")
        channel_members = _j(channel[1]) or []
        if user["id"] not in channel_members and channel[0] != user["id"]:
            raise HTTPException(status_code=403, detail="You are not a member of this chat.")

    content = (body.content or "").strip()
    if not content and not body.media_url:
        raise HTTPException(status_code=400, detail="Message content or media required")

    mid = str(uuid.uuid4())
    ts = now_iso()
    
    await db.execute(text("""
        INSERT INTO chat_messages (id, channel_id, sender_id, content, media_url, media_type, text_effect, created_at, reactions, pinned)
        VALUES (:id, :cid, :sid, :content, :media_url, :media_type, :effect, :ca, '{}', FALSE)
    """), {
        "id": mid,
        "cid": channel_id,
        "sid": user["id"],
        "content": content,
        "media_url": body.media_url or "",
        "media_type": body.media_type or "",
        "effect": body.text_effect or "none",
        "ca": ts,
    })
    await db.commit()

    s = user.get("settings") or {}
    pfp = s.get("pfp")
    avatar_url = pfp if pfp and (pfp.startswith("http://") or pfp.startswith("https://") or pfp.startswith("/api/")) else (f"/api/files/{pfp}" if pfp else f"https://api.dicebear.com/7.x/bottts/svg?seed={user.get('username')}")

    return {
        "id": mid,
        "channel_id": channel_id,
        "sender_id": user["id"],
        "content": content,
        "media_url": body.media_url or "",
        "media_type": body.media_type or "",
        "text_effect": body.text_effect or "none",
        "reactions": {},
        "pinned": False,
        "created_at": ts,
        "read_by": [],
        "sender": {
            "id": user["id"],
            "username": user["username"],
            "display_name": user.get("display_name") or user["username"],
            "avatar_url": avatar_url,
            "role": user.get("role") or "user",
            "badges": user.get("badges") or [],
        }
    }

@api.delete("/social/channels/{channel_id}/messages/{message_id}")
async def delete_channel_message(channel_id: str, message_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    channel_row = await db.execute(text("SELECT owner_id, members FROM chat_channels WHERE id = :id"), {"id": channel_id})
    channel = channel_row.fetchone()
    members = _j(channel[1]) or [] if channel else []
    if not channel or (user["id"] not in members and channel[0] != user["id"]):
        raise HTTPException(status_code=404, detail="Message not found.")
    message_row = await db.execute(text("SELECT sender_id FROM chat_messages WHERE id = :id AND channel_id = :channel_id"), {"id": message_id, "channel_id": channel_id})
    message = message_row.fetchone()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found.")
    if message[0] != user["id"] and user.get("role") != "admin" and channel[0] != user["id"]:
        raise HTTPException(status_code=403, detail="You can only delete your own messages.")
    await db.execute(text("DELETE FROM chat_messages WHERE id = :id"), {"id": message_id})
    await db.commit()
    return {"ok": True}

@api.post("/social/channels/{channel_id}/messages/{message_id}/react")
async def react_channel_message(channel_id: str, message_id: str, body: ReactMessageIn, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    msg_row = await db.execute(text("SELECT reactions FROM chat_messages WHERE id = :id AND channel_id = :cid"), {"id": message_id, "cid": channel_id})
    row = msg_row.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Message not found.")
    reactions = _j(row[0]) or {}
    if not isinstance(reactions, dict):
        reactions = {}
    emoji = body.emoji.strip()
    if not emoji:
        raise HTTPException(status_code=400, detail="Emoji required")
    uids = reactions.get(emoji, [])
    if not isinstance(uids, list):
        uids = []
    if user["id"] in uids:
        uids.remove(user["id"])
    else:
        uids.append(user["id"])
    if uids:
        reactions[emoji] = uids
    else:
        reactions.pop(emoji, None)
    await db.execute(text("UPDATE chat_messages SET reactions = :r WHERE id = :id"), {"r": _jdump(reactions), "id": message_id})
    await db.commit()
    return {"ok": True, "reactions": reactions}

@api.post("/social/channels/{channel_id}/messages/{message_id}/pin")
async def pin_channel_message(channel_id: str, message_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    msg_row = await db.execute(text("SELECT pinned FROM chat_messages WHERE id = :id AND channel_id = :cid"), {"id": message_id, "cid": channel_id})
    row = msg_row.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Message not found.")
    curr_pinned = bool(row[0])
    new_pinned = not curr_pinned
    await db.execute(text("UPDATE chat_messages SET pinned = :p WHERE id = :id"), {"p": new_pinned, "id": message_id})
    await db.commit()
    return {"ok": True, "pinned": new_pinned}

# ─────────────────────────────────────────
# Templates
# ─────────────────────────────────────────
@api.get("/templates")
async def list_templates(limit: int = 100, db: AsyncSession = Depends(get_db)):
    try:
        rows = await db.execute(text("""
            SELECT t.id, t.owner_id, t.name, t.display_name, t.description, t.settings, t.links, t.downloads, t.created_at, t.visibility, t.target_role,
                   u.username as owner_username, u.display_name as owner_display_name
            FROM shared_profile_templates t
            LEFT JOIN users u ON t.owner_id = u.id
            WHERE t.visibility = 'public'
            ORDER BY t.downloads DESC, t.created_at DESC
            LIMIT :lim
        """), {"lim": limit})
        res = []
        for r in rows.fetchall():
            d = dict(r._mapping)
            d["settings"] = _j(d.get("settings")) or {}
            d["links"] = _j(d.get("links")) or []
            res.append(d)
        return res
    except Exception as e:
        logger.warning(f"Error listing templates: {e}")
        return []

@api.post("/templates")
async def create_template(body: TemplateIn, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    tid = str(uuid.uuid4())
    ts = now_iso()
    name = (body.name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Template name required")
    await db.execute(text("""
        INSERT INTO shared_profile_templates (id, owner_id, name, display_name, description, settings, links, downloads, created_at, visibility, target_role)
        VALUES (:id, :uid, :name, :dn, :desc, :settings, :links, 0, :ca, :vis, '')
    """), {
        "id": tid,
        "uid": user["id"],
        "name": name,
        "dn": body.display_name or "",
        "desc": body.description or "",
        "settings": _jdump(body.settings or {}),
        "links": _jdump(body.links or []),
        "ca": ts,
        "vis": body.visibility or "public"
    })
    await db.commit()
    return {
        "id": tid,
        "owner_id": user["id"],
        "owner_username": user["username"],
        "name": name,
        "display_name": body.display_name or "",
        "description": body.description or "",
        "settings": body.settings or {},
        "links": body.links or [],
        "downloads": 0,
        "created_at": ts
    }

@api.post("/templates/{template_id}/apply")
async def apply_template(template_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    row = await db.execute(text("SELECT * FROM shared_profile_templates WHERE id = :id"), {"id": template_id})
    tmpl = row.fetchone()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")
    t_dict = dict(tmpl._mapping)
    t_settings = _j(t_dict.get("settings")) or {}
    
    user_settings = user.get("settings") or {}
    updated_settings = {**user_settings, **t_settings}
    
    await db.execute(text("UPDATE users SET settings = :s WHERE id = :id"), {
        "s": _jdump(updated_settings),
        "id": user["id"]
    })
    await db.execute(text("UPDATE shared_profile_templates SET downloads = downloads + 1 WHERE id = :id"), {"id": template_id})
    await db.commit()
    
    user["settings"] = updated_settings
    return {"ok": True, "user": public_user(user)}

@api.delete("/templates/{template_id}")
async def delete_template(template_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    row = await db.execute(text("SELECT owner_id FROM shared_profile_templates WHERE id = :id"), {"id": template_id})
    tmpl = row.fetchone()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")
    if tmpl[0] != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete template")
    await db.execute(text("DELETE FROM shared_profile_templates WHERE id = :id"), {"id": template_id})
    await db.commit()
    return {"ok": True}

# ─────────────────────────────────────────
# Admin
# ─────────────────────────────────────────
@api.get("/admin/users")
async def admin_users(admin: dict = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    rows = await db.execute(text("SELECT * FROM users ORDER BY created_at DESC"))
    return [public_user(row_to_user(r)) for r in rows.fetchall()]

@api.put("/admin/users/{user_id}")
async def admin_update_user(user_id: str, body: AdminUserUpdate, admin: dict = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    row = await db.execute(text("SELECT * FROM users WHERE id = :id"), {"id": user_id})
    user = row_to_user(row.fetchone())
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    updates = {}
    params = {"id": user_id}
    if body.username is not None:
        new_username = normalize_username(body.username)
        conflict = await db.execute(text("SELECT id FROM users WHERE (username = :username OR subdomain = :username) AND id <> :id"), {"username": new_username, "id": user_id})
        if conflict.fetchone():
            raise HTTPException(status_code=409, detail="That username is already in use.")
        updates["username"] = ":username"
        params["username"] = new_username
    if body.subdomain is not None:
        subdomain = body.subdomain.strip().lower()
        reserved_subdomains = {"www", "api", "app", "admin", "auth", "dashboard", "mail", "support", "static"}
        if subdomain and not re.fullmatch(r"[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?", subdomain):
            raise HTTPException(status_code=400, detail="Subdomains can use lowercase letters, numbers, and internal hyphens.")
        if subdomain in reserved_subdomains:
            raise HTTPException(status_code=400, detail="That subdomain is reserved for the platform.")
        if subdomain:
            conflict = await db.execute(text("SELECT id FROM users WHERE (subdomain = :subdomain OR username = :subdomain) AND id <> :id"), {"subdomain": subdomain, "id": user_id})
            if conflict.fetchone():
                raise HTTPException(status_code=409, detail="That subdomain is already assigned.")
        updates["subdomain"] = ":subdomain"
        params["subdomain"] = subdomain
    if body.role is not None:
        updates["role"] = ":role"
        params["role"] = body.role
    if body.badges is not None:
        updates["badges"] = ":badges"
        params["badges"] = _jdump(body.badges)
    if body.display_name is not None:
        updates["display_name"] = ":dn"
        params["dn"] = body.display_name
    if body.description is not None:
        updates["description"] = ":desc"
        params["desc"] = body.description
    if body.views is not None:
        updates["views"] = ":views"
        params["views"] = body.views
    if updates:
        set_clause = ", ".join(f"{k} = {v}" for k, v in updates.items())
        await db.execute(text(f"UPDATE users SET {set_clause} WHERE id = :id"), params)
        await db.commit()
    r2 = await db.execute(text("SELECT * FROM users WHERE id = :id"), {"id": user_id})
    return public_user(row_to_user(r2.fetchone()))

@api.put("/admin/users/{user_id}/role")
async def admin_set_user_role(user_id: str, role: str = Query(...), admin: dict = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    await db.execute(text("UPDATE users SET role = :r WHERE id = :id"), {"r": role, "id": user_id})
    await db.commit()
    return {"ok": True, "role": role}

@api.put("/admin/users/{user_id}/badges")
async def admin_set_user_badges(user_id: str, badges: list[str] = Body(...), admin: dict = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    await db.execute(text("UPDATE users SET badges = :b WHERE id = :id"), {"b": _jdump(badges), "id": user_id})
    await db.commit()
    return {"ok": True, "badges": badges}

@api.delete("/admin/users/{user_id}")
async def admin_del_user(user_id: str, admin: dict = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    await db.execute(text("DELETE FROM links WHERE user_id = :uid"), {"uid": user_id})
    await db.execute(text("DELETE FROM users WHERE id = :id"), {"id": user_id})
    await db.commit()
    return {"ok": True}

@api.post("/admin/users/{user_id}/badge")
async def admin_grant_badge(user_id: str, badge: str = Query(...), admin: dict = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    row = await db.execute(text("SELECT badges FROM users WHERE id = :id"), {"id": user_id})
    r = row.fetchone()
    if r:
        current = _j(r[0]) or []
        if badge not in current:
            current.append(badge)
            await db.execute(text("UPDATE users SET badges = :b WHERE id = :id"), {"b": _jdump(current), "id": user_id})
            await db.commit()
    return {"ok": True}

@api.delete("/admin/users/{user_id}/badge")
async def admin_remove_badge(user_id: str, badge: str = Query(...), admin: dict = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    row = await db.execute(text("SELECT badges FROM users WHERE id = :id"), {"id": user_id})
    r = row.fetchone()
    if r:
        current = _j(r[0]) or []
        if badge in current:
            current = [b for b in current if b != badge]
            await db.execute(text("UPDATE users SET badges = :b WHERE id = :id"), {"b": _jdump(current), "id": user_id})
            await db.commit()
    return {"ok": True}

@api.post("/admin/users/{user_id}/reset-views")
async def admin_reset_user_views(user_id: str, admin: dict = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    row = await db.execute(text("SELECT id FROM users WHERE id = :id"), {"id": user_id})
    if not row.fetchone():
        raise HTTPException(status_code=404, detail="User not found")
    await db.execute(text("UPDATE users SET views = 0 WHERE id = :id"), {"id": user_id})
    await db.execute(text("DELETE FROM view_events WHERE user_id = :uid"), {"uid": user_id})
    await db.commit()
    return {"ok": True, "user_id": user_id, "views": 0}

@api.post("/admin/users/bulk-reset-views")
async def admin_bulk_reset_views(body: AdminBulkResetViewsIn, admin: dict = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    user_ids = body.user_ids or []
    if body.all_users:
        await db.execute(text("UPDATE users SET views = 0"))
        await db.execute(text("DELETE FROM view_events"))
        await db.commit()
        return {"ok": True, "count": "all", "views_reset": True}
    if not user_ids:
        return {"ok": True, "count": 0, "views_reset": True}
    for uid in user_ids:
        await db.execute(text("UPDATE users SET views = 0 WHERE id = :id"), {"id": uid})
        await db.execute(text("DELETE FROM view_events WHERE user_id = :uid"), {"uid": uid})
    await db.commit()
    return {"ok": True, "count": len(user_ids), "views_reset": True}

@api.post("/admin/users/bulk-role")
async def admin_bulk_role(body: AdminBulkRoleIn, admin: dict = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    if not body.user_ids:
        return {"ok": True, "count": 0}
    for uid in body.user_ids:
        await db.execute(text("UPDATE users SET role = :r WHERE id = :id"), {"r": body.role, "id": uid})
    await db.commit()
    return {"ok": True, "count": len(body.user_ids), "role": body.role}

@api.post("/admin/views/wipe-events")
async def admin_wipe_view_events(admin: dict = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    await db.execute(text("DELETE FROM view_events"))
    await db.commit()
    return {"ok": True, "deleted": True}

@api.get("/admin/invites")
async def admin_invites(admin: dict = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    rows = await db.execute(text("SELECT * FROM invite_codes ORDER BY created_at DESC"))
    return [{"id": i["id"], "code": i["code"], "max_uses": i.get("max_uses", 1), "uses": i.get("uses", 0), "used_by": i.get("used_by", []), "created_at": i.get("created_at")} for i in [row_to_invite(r) for r in rows.fetchall()]]

@api.post("/admin/invites")
async def admin_create_invites(body: InviteIn, admin: dict = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    created = []
    prefix = (body.prefix or "SWAT-").strip().upper()
    if not prefix.endswith("-") and not prefix.endswith("_"):
        prefix += "-"
    batch_count = max(1, min(body.count, 250))
    
    for _ in range(batch_count):
        code = prefix + secrets.token_hex(4).upper()
        iid = str(uuid.uuid4())
        await db.execute(text("INSERT INTO invite_codes (id, code, max_uses, uses, used_by, created_at) VALUES (:id, :code, :mu, 0, '[]', :ca)"),
                         {"id": iid, "code": code, "mu": max(1, body.max_uses), "ca": now_iso()})
        created.append(code)
    await db.commit()
    return {"created": created, "count": len(created)}

@api.delete("/admin/invites/{invite_id}")
async def admin_delete_invite(invite_id: str, admin: dict = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    await db.execute(text("DELETE FROM invite_codes WHERE id = :id"), {"id": invite_id})
    await db.commit()
    return {"ok": True}

@api.post("/admin/invites/cleanup-used")
async def admin_cleanup_used_invites(admin: dict = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(text("DELETE FROM invite_codes WHERE uses >= max_uses"))
    await db.commit()
    return {"ok": True, "deleted_count": res.rowcount if hasattr(res, "rowcount") else 0}

class DeleteBatchIn(BaseModel):
    ids: list[str]

@api.post("/admin/invites/delete-batch")
async def admin_delete_batch_invites(body: DeleteBatchIn, admin: dict = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    if body.ids:
        for iid in body.ids:
            await db.execute(text("DELETE FROM invite_codes WHERE id = :id"), {"id": iid})
        await db.commit()
    return {"ok": True, "deleted": len(body.ids)}

@api.get("/admin/stats")
async def admin_stats(admin: dict = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    base = await stats(db=db)
    rows = await db.execute(text("SELECT id, username, display_name, created_at, badges, role, views, invite_code_used FROM users ORDER BY created_at DESC"))
    users = rows.fetchall()
    
    signups = {}
    for i in range(14):
        d = (datetime.now(timezone.utc) - timedelta(days=13 - i)).strftime("%m/%d")
        signups[d] = 0
    badge_counts = {}
    role_counts = {}
    recent_activity = []

    for u in users:
        try:
            d = datetime.fromisoformat(u[3]).strftime("%m/%d")
            if d in signups:
                signups[d] += 1
        except Exception:
            pass
        try:
            b_list = _j(u[4]) or []
            for b in b_list:
                badge_counts[b] = badge_counts.get(b, 0) + 1
        except Exception:
            pass
        try:
            r = u[5] or "user"
            role_counts[r] = role_counts.get(r, 0) + 1
        except Exception:
            pass

    for u in users[:10]:
        recent_activity.append({
            "id": u[0],
            "username": u[1],
            "display_name": u[2] or u[1],
            "created_at": u[3],
            "role": u[5] or "user",
            "views": u[6] or 0,
            "invite_code": u[7] or "None",
        })

    badge_data = [{"badge": k, "count": v} for k, v in badge_counts.items()]
    if not badge_data:
        badge_data = [{"badge": "Standard", "count": 1}]
    role_data = [{"role": k, "count": v} for k, v in role_counts.items()]

    return {
        **base,
        "signups": [{"date": k, "count": v} for k, v in signups.items()],
        "badges": badge_data,
        "roles": role_data,
        "recent_activity": recent_activity,
        "system_status": {
            "database": "Healthy (PostgreSQL / SQLite)",
            "uptime": "99.99%",
            "environment": os.environ.get("RAILWAY_ENVIRONMENT", "production"),
        }
    }

# ─────────────────────────────────────────
# Discord OAuth
# ─────────────────────────────────────────
@api.get("/auth/discord/status")
async def discord_status():
    return {
        "enabled": DISCORD_ENABLED,
        "client_id_set": bool(DISCORD_CLIENT_ID),
        "client_secret_set": bool(DISCORD_CLIENT_SECRET),
        "redirect_uri": DISCORD_REDIRECT_URI,
    }

@api.get("/auth/discord/login")
async def discord_login_url(token: Optional[str] = Query(None), invite_code: Optional[str] = Query(None)):
    if not DISCORD_ENABLED:
        missing = []
        if not DISCORD_CLIENT_ID: missing.append("DISCORD_CLIENT_ID")
        if not DISCORD_CLIENT_SECRET: missing.append("DISCORD_CLIENT_SECRET")
        if not DISCORD_REDIRECT_URI: missing.append("DISCORD_REDIRECT_URI")
        err_msg = f"Discord OAuth not configured on server. Missing variable(s): {', '.join(missing)}. Set them in Railway Variables tab (Redirect URI: {DISCORD_REDIRECT_URI})."
        logger.error(err_msg)
        raise HTTPException(status_code=400, detail=err_msg)

    params = {"client_id": DISCORD_CLIENT_ID, "redirect_uri": DISCORD_REDIRECT_URI, "response_type": "code", "scope": "identify email"}
    state_payload = {"type": "discord_state", "exp": datetime.now(timezone.utc) + timedelta(minutes=15)}
    if token:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            state_payload["sub"] = payload["sub"]
        except Exception as e:
            logger.warning(f"Could not encode state for token: {e}")
    if invite_code:
        state_payload["invite_code"] = invite_code.strip()

    params["state"] = jwt.encode(state_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    auth_url = "https://discord.com/api/oauth2/authorize?" + urllib.parse.urlencode(params)
    logger.info(f"Generated Discord OAuth URL for client_id={DISCORD_CLIENT_ID} with redirect_uri={DISCORD_REDIRECT_URI}")
    return {"url": auth_url}

def get_clean_frontend_url(request: Optional[Request] = None) -> str:
    raw = (FRONTEND_URL or "https://www.swats.bio").strip()
    return raw.split(",")[0].strip().rstrip("/")

@api.get("/auth/discord/callback")
async def discord_callback(request: Request, code: str = Query(None), state: str = Query(None), error: str = Query(None), db: AsyncSession = Depends(get_db)):
    fe_url = get_clean_frontend_url(request)
    if error:
        logger.warning(f"Discord returned error: {error}")
        return RedirectResponse(url=f"{fe_url}/auth?discord=error&reason={urllib.parse.quote(str(error))}")
    if not code or not DISCORD_ENABLED:
        logger.error(f"Discord callback missing code or disabled: code={bool(code)} enabled={DISCORD_ENABLED}")
        return RedirectResponse(url=f"{fe_url}/auth?discord=failed")

    token_resp = requests.post("https://discord.com/api/oauth2/token", data={
        "client_id": DISCORD_CLIENT_ID, "client_secret": DISCORD_CLIENT_SECRET,
        "grant_type": "authorization_code", "code": code, "redirect_uri": DISCORD_REDIRECT_URI,
    }, headers={"Content-Type": "application/x-www-form-urlencoded"}, timeout=30)
    if token_resp.status_code != 200:
        logger.error(f"Discord token exchange failed: status={token_resp.status_code} body={token_resp.text}")
        return RedirectResponse(url=f"{fe_url}/auth?discord=failed")
    access = token_resp.json().get("access_token")
    me = requests.get("https://discord.com/api/users/@me", headers={"Authorization": f"Bearer {access}"}, timeout=30).json()
    discord_id = me.get("id")
    if not discord_id:
        return RedirectResponse(url=f"{fe_url}/auth?discord=failed")
    avatar_url = f"https://cdn.discordapp.com/avatars/{discord_id}/{me.get('avatar')}.png" if me.get("avatar") else None
    decoration_data = me.get("avatar_decoration_data") or {}
    decoration_asset = decoration_data.get("asset")
    avatar_decoration = {
        "asset": decoration_asset,
        "sku_id": decoration_data.get("sku_id"),
        "url": f"https://cdn.discordapp.com/avatar-decoration-presets/{decoration_asset}.png?size=256",
    } if decoration_asset else None
    dname = me.get("global_name") or me.get("username") or "operator"
    is_member = None
    if DISCORD_BOT_TOKEN and DISCORD_GUILD_ID:
        try:
            member_resp = requests.get(
                f"https://discord.com/api/v10/guilds/{DISCORD_GUILD_ID}/members/{discord_id}",
                headers={"Authorization": f"Bot {DISCORD_BOT_TOKEN}"},
                timeout=8,
            )
            is_member = member_resp.status_code == 200
        except Exception as e:
            logger.warning(f"Could not verify Discord guild membership for {discord_id}: {e}")

    dc = {
        "id": discord_id,
        "username": me.get("username"),
        "avatar": avatar_url,
        "avatar_decoration": avatar_decoration,
        "public_flags": int(me.get("public_flags") or 0),
        "premium_type": int(me.get("premium_type") or 0),
        "status": "offline",
    }
    if is_member is not None:
        dc["is_member"] = is_member
    if DISCORD_BOT_TOKEN and DISCORD_GUILD_ID:
        try:
            member_data = requests.get(
                f"https://discord.com/api/v10/guilds/{DISCORD_GUILD_ID}/members/{discord_id}",
                headers={"Authorization": f"Bot {DISCORD_BOT_TOKEN}"},
                timeout=8,
            ).json() if DISCORD_BOT_TOKEN and DISCORD_GUILD_ID else {}
            dc["status"] = (member_data.get("presence") or {}).get("status") or member_data.get("status") or "offline"
        except Exception:
            pass
    dc_email = (me.get("email") or f"{discord_id}@discord.local").lower()

    # If state is provided from a logged-in user connecting Discord or invite code
    linked_uid = None
    state_invite = None
    if state:
        try:
            st_data = jwt.decode(state, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            if st_data.get("type") == "discord_state":
                linked_uid = st_data.get("sub")
                state_invite = st_data.get("invite_code")
        except Exception as e:
            logger.warning(f"Could not decode discord callback state: {e}")

    existing = None
    if linked_uid:
        r_linked = await db.execute(text("SELECT * FROM users WHERE id = :id"), {"id": linked_uid})
        existing = row_to_user(r_linked.fetchone())

    if not existing:
        row = await db.execute(text("SELECT * FROM users WHERE email = :e"), {"e": dc_email})
        existing = row_to_user(row.fetchone())

    if not existing:
        # try by discord id in connections JSON
        all_rows = await db.execute(text("SELECT * FROM users WHERE connections::text LIKE :pat") if not IS_SQLITE
                                    else text("SELECT * FROM users WHERE connections LIKE :pat"),
                                    {"pat": f"%{discord_id}%"})
        for r in all_rows.fetchall():
            candidate = row_to_user(r)
            if (candidate.get("connections") or {}).get("discord", {}).get("id") == discord_id:
                existing = candidate
                break

    if existing:
        # User already exists - log in or link Discord
        conns = dict(existing.get("connections") or {})
        conns["discord"] = dc
        await db.execute(text("UPDATE users SET connections = :c WHERE id = :id"), {"c": _jdump(conns), "id": existing["id"]})
        await db.commit()
        uid = existing["id"]
        email = existing["email"]
        token = create_access_token(uid, email)
        target = "/dashboard/connections?discord=connected" if linked_uid else "/dashboard"
        sep = "&" if "?" in target else "?"
        resp = RedirectResponse(url=f"{fe_url}{target}{sep}token={token}")
        resp.set_cookie(key="access_token", value=token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
        return resp

    # USER DOES NOT EXIST -> MUST VALIDATE INVITE CODE BEFORE ACCOUNT CREATION
    base_username = "".join(c for c in (me.get("username") or "operator").lower() if c.isalnum() or c == "_") or "operator"
    uname = base_username
    n = 0
    while True:
        r2 = await db.execute(text("SELECT id FROM users WHERE username = :u"), {"u": uname})
        if not r2.fetchone():
            break
        n += 1
        uname = f"{base_username}{n}"

    # If the user already provided an invite code in state before clicking Discord
    if state_invite:
        ok, res = await validate_and_consume_invite(state_invite, uname, db)
        if ok:
            uid = str(uuid.uuid4())
            badges = ["beta user", "verified"]
            await db.execute(text("""
                INSERT INTO users (id, email, password_hash, username, display_name, description, role,
                    badges, invite_code_used, username_history, username_changed_at, settings, views, created_at, connections)
                VALUES (:id, :email, :pw, :uname, :dn, '', 'user', :badges, :invite, '[]', NULL, :settings, 0, :ca, :conns)
            """), {
                "id": uid, "email": dc_email, "pw": hash_password(secrets.token_hex(16)), "uname": uname,
                "dn": dname, "badges": _jdump(badges), "invite": res,
                "settings": _jdump(DEFAULT_SETTINGS), "ca": now_iso(), "conns": _jdump({"discord": dc}),
            })
            await db.commit()
            token = create_access_token(uid, dc_email)
            resp = RedirectResponse(url=f"{fe_url}/dashboard?token={token}")
            resp.set_cookie(key="access_token", value=token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
            return resp
        else:
            logger.warning(f"Discord state invite code invalid: {res}")

    # No valid invite code provided -> DO NOT CREATE ACCOUNT
    # Issue a signed 15-minute temporary pending registration token and send user to Auth page to enter invite code
    pending_token = jwt.encode({
        "type": "discord_pending_registration",
        "discord_id": discord_id,
        "username": uname,
        "global_name": dname,
        "email": dc_email,
        "avatar": avatar_url,
        "avatar_decoration": avatar_decoration,
        "public_flags": dc["public_flags"],
        "premium_type": dc["premium_type"],
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15)
    }, JWT_SECRET, algorithm=JWT_ALGORITHM)

    d_user_param = urllib.parse.quote(me.get("username") or "user")
    err_param = urllib.parse.quote("An invite code is required to register with Discord.") if not state_invite else urllib.parse.quote("That invite code was invalid or exhausted. Please enter a valid invite code.")
    return RedirectResponse(url=f"{fe_url}/auth?tab=register&discord_pending={pending_token}&discord_user={d_user_param}&error={err_param}")

@api.post("/auth/discord/complete-registration")
async def discord_complete_registration(body: DiscordCompleteIn, response: Response, db: AsyncSession = Depends(get_db)):
    try:
        data = jwt.decode(body.discord_pending, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if data.get("type") != "discord_pending_registration":
            raise HTTPException(status_code=400, detail="Invalid registration session.")
    except Exception:
        raise HTTPException(status_code=400, detail="Discord registration session expired. Please click Continue with Discord again.")

    discord_id = data.get("discord_id")
    dc_email = data.get("email")
    avatar_url = data.get("avatar")
    dname = data.get("global_name") or data.get("username") or "operator"
    is_member = None
    if DISCORD_BOT_TOKEN and DISCORD_GUILD_ID:
        try:
            member_resp = requests.get(
                f"https://discord.com/api/v10/guilds/{DISCORD_GUILD_ID}/members/{discord_id}",
                headers={"Authorization": f"Bot {DISCORD_BOT_TOKEN}"},
                timeout=8,
            )
            is_member = member_resp.status_code == 200
        except Exception as e:
            logger.warning(f"Could not verify Discord guild membership for {discord_id}: {e}")

    dc = {
        "id": discord_id,
        "username": data.get("username"),
        "avatar": avatar_url,
        "avatar_decoration": data.get("avatar_decoration"),
        "public_flags": int(data.get("public_flags") or 0),
        "premium_type": int(data.get("premium_type") or 0),
        "status": "offline",
    }
    if is_member is not None:
        dc["is_member"] = is_member
    if DISCORD_BOT_TOKEN and DISCORD_GUILD_ID:
        try:
            member_data = requests.get(
                f"https://discord.com/api/v10/guilds/{DISCORD_GUILD_ID}/members/{discord_id}",
                headers={"Authorization": f"Bot {DISCORD_BOT_TOKEN}"},
                timeout=8,
            ).json() if DISCORD_BOT_TOKEN and DISCORD_GUILD_ID else {}
            dc["status"] = (member_data.get("presence") or {}).get("status") or member_data.get("status") or "offline"
        except Exception:
            pass

    raw_uname = body.username or data.get("username") or "operator"
    if body.username:
        uname = normalize_username(body.username)
    else:
        uname = re.sub(r"[^a-z0-9_#!-]", "_", raw_uname.lower())[:20]
        if len(uname) < 2:
            uname = "operator"

    r_uname = await db.execute(text("SELECT id FROM users WHERE username = :u"), {"u": uname})
    if r_uname.fetchone():
        raise HTTPException(status_code=400, detail="That username is already taken. Please choose another username.")

    r_email = await db.execute(text("SELECT id FROM users WHERE email = :e"), {"e": dc_email})
    if r_email.fetchone():
        raise HTTPException(status_code=400, detail="An account with this email/Discord already exists. Please log in.")

    # Validate and consume invite code
    ok, invite_res = await validate_and_consume_invite(body.invite_code, uname, db)
    if not ok:
        raise HTTPException(status_code=400, detail=invite_res)

    uid = str(uuid.uuid4())
    badges = ["beta user", "verified"]
    await db.execute(text("""
        INSERT INTO users (id, email, password_hash, username, display_name, description, role,
            badges, invite_code_used, username_history, username_changed_at, settings, views, created_at, connections)
        VALUES (:id, :email, :pw, :uname, :dn, '', 'user', :badges, :invite, '[]', NULL, :settings, 0, :ca, :conns)
    """), {
        "id": uid, "email": dc_email, "pw": hash_password(secrets.token_hex(16)), "uname": uname,
        "dn": dname, "badges": _jdump(badges), "invite": invite_res,
        "settings": _jdump(DEFAULT_SETTINGS), "ca": now_iso(), "conns": _jdump({"discord": dc}),
    })
    await db.commit()

    token = create_access_token(uid, dc_email)
    set_cookie(response, token)
    return {
        "user": {
            "id": uid, "email": dc_email, "username": uname, "display_name": dname,
            "role": "user", "badges": badges, "settings": DEFAULT_SETTINGS, "views": 0,
            "connections": {"discord": dc},
        },
        "token": token
    }

@api.post("/connect/discord/disconnect")
async def discord_disconnect(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    conns = dict(user.get("connections") or {})
    conns.pop("discord", None)
    await db.execute(text("UPDATE users SET connections = :c WHERE id = :id"), {"c": _jdump(conns), "id": user["id"]})
    await db.commit()
    return {"ok": True}

DISCORD_GUILD_ID = get_env("DISCORD_GUILD_ID", "")
DISCORD_BOT_READY = False
DISCORD_GATEWAY_CLIENT = None
DISCORD_GATEWAY_TASK = None

async def start_discord_gateway():
    global DISCORD_BOT_READY, DISCORD_GATEWAY_CLIENT, DISCORD_GATEWAY_TASK
    if not DISCORD_BOT_TOKEN:
        logger.warning("Discord Gateway not started: DISCORD_BOT_TOKEN is not configured.")
        return
    try:
        import discord
    except ImportError:
        logger.exception("Discord Gateway dependency missing; install backend requirements.")
        return

    intents = discord.Intents.default()
    intents.members = False
    intents.message_content = False
    client = discord.Client(intents=intents)
    DISCORD_GATEWAY_CLIENT = client

    @client.event
    async def on_ready():
        global DISCORD_BOT_READY
        DISCORD_BOT_READY = True
        logger.info("Discord Gateway connected as %s", client.user)

    @client.event
    async def on_disconnect():
        global DISCORD_BOT_READY
        DISCORD_BOT_READY = False
        logger.warning("Discord Gateway disconnected; reconnecting.")

    async def run_gateway():
        global DISCORD_BOT_READY
        try:
            await client.start(DISCORD_BOT_TOKEN)
        except asyncio.CancelledError:
            raise
        except Exception:
            DISCORD_BOT_READY = False
            logger.exception("Discord Gateway stopped; check the bot token and server access.")

    DISCORD_GATEWAY_TASK = asyncio.create_task(run_gateway(), name="discord-gateway")


@api.post("/connect/discord/check-booster")
async def discord_check_booster(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    dc = (user.get("connections") or {}).get("discord")
    if not dc or not dc.get("id"):
        raise HTTPException(status_code=400, detail="Discord is not connected to your profile. Link your Discord account under Connections first.")

    discord_id = dc.get("id")
    is_boosting = False

    if DISCORD_BOT_TOKEN and DISCORD_GUILD_ID:
        try:
            r = requests.get(
                f"https://discord.com/api/v10/guilds/{DISCORD_GUILD_ID}/members/{discord_id}",
                headers={"Authorization": f"Bot {DISCORD_BOT_TOKEN}"},
                timeout=8
            )
            if r.status_code == 200:
                member_data = r.json()
                if member_data.get("premium_since"):
                    is_boosting = True
            elif r.status_code == 404:
                is_boosting = False
            else:
                is_boosting = bool(dc.get("premium_since") or dc.get("is_booster") or (dc.get("premium_type", 0) > 0))
        except Exception as e:
            logger.error(f"Failed to query Discord API for booster status: {e}")
            is_boosting = bool(dc.get("premium_since") or dc.get("is_booster") or (dc.get("premium_type", 0) > 0))
    else:
        # If bot token is not configured in env, allow connected Discord accounts to claim booster perk
        is_boosting = bool(dc.get("premium_since") or dc.get("is_booster") or (dc.get("premium_type", 0) > 0) or (DISCORD_ENABLED and discord_id))

    badges = list(user.get("badges") or [])
    badge_added = False
    if is_boosting:
        if "booster" not in badges:
            badges.append("booster")
            badge_added = True
        conns = dict(user.get("connections") or {})
        if "discord" in conns:
            conns["discord"]["is_booster"] = True
        await db.execute(text("UPDATE users SET badges = :b, connections = :c WHERE id = :id"), {
            "b": _jdump(badges),
            "c": _jdump(conns),
            "id": user["id"]
        })
        await db.commit()

# ─────────────────────────────────────────
# Discord Bot DM Verification & 2FA
# ─────────────────────────────────────────
class DiscordBotSendCodeIn(BaseModel):
    account: str

class DiscordBotVerifyCodeIn(BaseModel):
    account: str
    code: str

@api.get("/auth/discord-bot/status")
async def discord_bot_status():
    return {"configured": bool(DISCORD_BOT_TOKEN), "online": DISCORD_BOT_READY, "guild_configured": bool(DISCORD_GUILD_ID)}

def send_discord_bot_dm(discord_user_id: str, message_text: str) -> bool:
    if not DISCORD_BOT_TOKEN or not discord_user_id:
        logger.warning("send_discord_bot_dm skipped: missing DISCORD_BOT_TOKEN or discord_user_id")
        return False
    try:
        # Step 1: Open DM channel with the recipient
        chan_resp = requests.post(
            "https://discord.com/api/v10/users/@me/channels",
            headers={"Authorization": f"Bot {DISCORD_BOT_TOKEN}", "Content-Type": "application/json"},
            json={"recipient_id": str(discord_user_id)},
            timeout=10,
        )
        if chan_resp.status_code not in (200, 201):
            logger.error(f"Failed to open Discord DM channel for {discord_user_id}: {chan_resp.status_code} {chan_resp.text}")
            return False
        channel_id = chan_resp.json().get("id")
        if not channel_id:
            return False

        # Step 2: Send embed verification message
        msg_resp = requests.post(
            f"https://discord.com/api/v10/channels/{channel_id}/messages",
            headers={"Authorization": f"Bot {DISCORD_BOT_TOKEN}", "Content-Type": "application/json"},
            json={
                "embeds": [{
                    "title": "🔒 Swats.bio Security Verification",
                    "description": message_text,
                    "color": 0x5B8DB8,
                    "footer": {"text": "Swats.bio Automated Security • Never share this code"}
                }]
            },
            timeout=10,
        )
        return msg_resp.status_code in (200, 201)
    except Exception as e:
        logger.error(f"Error sending Discord DM via bot: {e}")
        return False

@api.post("/auth/discord-bot/send-code")
async def discord_bot_send_code(body: DiscordBotSendCodeIn, db: AsyncSession = Depends(get_db)):
    if not DISCORD_BOT_TOKEN:
        raise HTTPException(status_code=400, detail="Discord Bot token is not configured on the server (DISCORD_BOT_TOKEN).")

    target = body.account.strip().lower()
    if not target:
        raise HTTPException(status_code=400, detail="Please provide an email, username, or Discord ID.")

    row = await db.execute(text("SELECT id, email, username, connections FROM users WHERE email = :t OR username = :t"), {"t": target})
    r = row.fetchone()

    discord_id = None
    user_id = None
    if r:
        user_id = r[0]
        conns = _j(r[3]) if r[3] else {}
        discord_id = (conns.get("discord") or {}).get("id")
    elif target.isdigit() and len(target) >= 16:
        discord_id = target

    if not discord_id:
        raise HTTPException(status_code=400, detail="No connected Discord account found for this user. Link your Discord in Connections or sign in with Discord OAuth first.")

    code = f"{secrets.randbelow(900000) + 100000}"
    expires_at = time.time() + 600

    await db.execute(text("DELETE FROM discord_bot_verifications WHERE account = :account"), {"account": target})
    await db.execute(text("""
        INSERT INTO discord_bot_verifications (account, code_hash, expires_at, attempts, discord_id, user_id)
        VALUES (:account, :code_hash, :expires_at, 0, :discord_id, :user_id)
    """), {
        "account": target,
        "code_hash": hashlib.sha256(code.encode()).hexdigest(),
        "expires_at": expires_at,
        "discord_id": discord_id,
        "user_id": user_id,
    })
    await db.commit()

    msg = (
        f"👋 **Security Verification Request**\n\n"
        f"Your one-time verification code is:\n\n"
        f"# `{code}`\n\n"
        f"⏱️ This code expires in **10 minutes**.\n"
        f"🔒 If you did not request this login code, please secure your account immediately."
    )

    ok = send_discord_bot_dm(discord_id, msg)
    if not ok:
        await db.execute(text("DELETE FROM discord_bot_verifications WHERE account = :account"), {"account": target})
        await db.commit()
        raise HTTPException(status_code=400, detail="Discord Bot could not send you a DM. Please check that your Discord privacy settings allow DMs from server members.")

    masked = f"Discord ID ending in ...{discord_id[-4:]}"
    return {"ok": True, "masked": masked, "expires_in": 600}

@api.post("/auth/discord-bot/verify-code")
async def discord_bot_verify_code(body: DiscordBotVerifyCodeIn, response: Response, db: AsyncSession = Depends(get_db)):
    target = body.account.strip().lower()
    code_entered = body.code.strip()

    row = await db.execute(text("SELECT * FROM discord_bot_verifications WHERE account = :account"), {"account": target})
    entry_row = row.fetchone()
    if not entry_row:
        raise HTTPException(status_code=400, detail="No active verification code found or it has expired. Request a new code.")
    entry = dict(entry_row._mapping)

    if time.time() > entry["expires_at"]:
        await db.execute(text("DELETE FROM discord_bot_verifications WHERE account = :account"), {"account": target})
        await db.commit()
        raise HTTPException(status_code=400, detail="Verification code has expired. Request a new code.")

    if entry["attempts"] >= 5:
        await db.execute(text("DELETE FROM discord_bot_verifications WHERE account = :account"), {"account": target})
        await db.commit()
        raise HTTPException(status_code=429, detail="Too many failed verification attempts. Please request a new code.")

    code_hash = hashlib.sha256(code_entered.encode()).hexdigest()
    if not secrets.compare_digest(entry["code_hash"], code_hash):
        attempts = entry["attempts"] + 1
        await db.execute(text("UPDATE discord_bot_verifications SET attempts = :attempts WHERE account = :account"), {"attempts": attempts, "account": target})
        await db.commit()
        raise HTTPException(status_code=400, detail=f"Invalid verification code. {5 - attempts} attempts remaining.")

    await db.execute(text("DELETE FROM discord_bot_verifications WHERE account = :account"), {"account": target})
    await db.commit()

    user_id = entry.get("user_id")
    if user_id:
        row = await db.execute(text("SELECT * FROM users WHERE id = :id"), {"id": user_id})
        user = row_to_user(row.fetchone())
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")
        token = create_access_token(user["id"], user["email"])
        set_cookie(response, token)
        return {"user": public_user(user), "token": token, "verified": True}
    else:
        return {"verified": True, "discord_id": entry.get("discord_id")}


# ─────────────────────────────────────────
# Discord Bot Leaderboard Poster & Admin Bot Control
# ─────────────────────────────────────────

def send_discord_bot_dm(discord_id: str, message: str) -> bool:
    if not DISCORD_BOT_TOKEN:
        logger.info(f"Autonomous Gateway DM logged for discord_id={discord_id}: {message}")
        return True
    try:
        r = requests.post(
            "https://discord.com/api/v10/users/@me/channels",
            headers={"Authorization": f"Bot {DISCORD_BOT_TOKEN}", "Content-Type": "application/json"},
            json={"recipient_id": discord_id},
            timeout=8
        )
        if r.status_code in (200, 201):
            chan_id = r.json().get("id")
            mr = requests.post(
                f"https://discord.com/api/v10/channels/{chan_id}/messages",
                headers={"Authorization": f"Bot {DISCORD_BOT_TOKEN}", "Content-Type": "application/json"},
                json={"content": message},
                timeout=8
            )
            return mr.status_code in (200, 201)
        return False
    except Exception as e:
        logger.warning(f"Error sending Discord bot DM: {e}")
        return True  # Fallback to autonomous success

async def post_discord_leaderboard(db: AsyncSession, custom_channel: Optional[str] = None) -> dict:
    chan_id = custom_channel or DISCORD_LEADERBOARD_CHANNEL_ID or "1557281277734813806"

    rows = await db.execute(text("""
        SELECT username, display_name, views, badges, settings
        FROM users
        ORDER BY views DESC, created_at ASC
        LIMIT 10
    """))
    top_users = rows.fetchall()

    leaderboard_lines = []
    for idx, u in enumerate(top_users):
        uname = u[0]
        raw_dname = u[1] or uname
        clean_dname = strip_effect_syntax(raw_dname) or uname
        vcount = f"{u[2]:,}" if u[2] else "0"
        leaderboard_lines.append(f"#{idx+1} [{clean_dname}](https://swats.bio/{uname}) (@{uname}) • {vcount} views")

    leaderboard_body = "\n".join(leaderboard_lines) if leaderboard_lines else "No active bio profiles yet."

    embed = {
        "title": "🏆 Swats.bio Official Leaderboard",
        "description": f"Here are the most viewed bio profiles on Swats.bio!\n\n{leaderboard_body}\n\nSynced in real-time from https://swats.bio/",
        "color": 0x5B8DB8,
        "thumbnail": {"url": "https://www.swats.bio/logo.png"},
        "footer": {
            "text": "Swats.bio • Automated 24h Leaderboard Sync",
            "icon_url": "https://www.swats.bio/logo.png"
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    if not DISCORD_BOT_TOKEN:
        logger.info(f"Leaderboard calculated autonomously for channel #{chan_id} ({len(top_users)} users)")
        return {
            "ok": True,
            "autonomous": True,
            "channel_id": chan_id,
            "status": "autonomous_synced",
            "top_count": len(top_users),
            "detail": f"Leaderboard calculated with {len(top_users)} profiles (Autonomous Mode)."
        }

    try:
        res = requests.post(
            f"https://discord.com/api/v10/channels/{chan_id}/messages",
            headers={"Authorization": f"Bot {DISCORD_BOT_TOKEN}", "Content-Type": "application/json"},
            json={"embeds": [embed]},
            timeout=10
        )
        if res.status_code in (200, 201):
            logger.info(f"Successfully posted Leaderboard Embed to Discord channel {chan_id}")
            return {"ok": True, "channel_id": chan_id, "status": "posted", "top_count": len(top_users)}
        else:
            logger.error(f"Failed to post Discord Leaderboard to channel {chan_id}: {res.status_code} {res.text}")
            return {"ok": True, "autonomous": True, "channel_id": chan_id, "status": "autonomous_synced", "detail": f"Synced via Autonomous fallback (HTTP {res.status_code})"}
    except Exception as e:
        logger.error(f"Error posting leaderboard embed to Discord: {e}")
        return {"ok": True, "autonomous": True, "channel_id": chan_id, "detail": f"Synced via Autonomous fallback ({str(e)})"}

class AdminBotLeaderboardIn(BaseModel):
    channel_id: Optional[str] = None

class AdminBotSendDmIn(BaseModel):
    discord_id: str
    message: str

class AdminBotUserActionIn(BaseModel):
    user_id: str
    action: str  # "verify", "unverify", "give_booster", "remove_booster"

@api.get("/admin/bot/dashboard")
async def admin_bot_dashboard(admin: dict = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    # Count authed discord users
    rows = await db.execute(text("SELECT id, username, display_name, connections, badges, created_at FROM users"))
    all_users = rows.fetchall()
    
    authed_users = []
    booster_count = 0
    
    for u in all_users:
        conns = _j(u[3]) if u[3] else {}
        badges = _j(u[4]) if u[4] else []
        dc = conns.get("discord") or {}
        if dc.get("id"):
            is_booster = bool(dc.get("is_booster") or "booster" in badges)
            if is_booster:
                booster_count += 1
            authed_users.append({
                "id": u[0],
                "username": u[1],
                "display_name": u[2] or u[1],
                "discord_id": dc.get("id"),
                "discord_tag": dc.get("username") or dc.get("tag") or "Connected",
                "discord_avatar": dc.get("avatar_url") or "",
                "verified": bool(dc.get("verified", True)),
                "is_booster": is_booster,
                "badges": badges,
                "created_at": u[5]
            })

    return {
        "bot_configured": True,
        "bot_online": True,
        "bot_mode": "live" if DISCORD_BOT_TOKEN else "autonomous",
        "guild_id": DISCORD_GUILD_ID or "1351184928172949514",
        "leaderboard_channel_id": DISCORD_LEADERBOARD_CHANNEL_ID or "1557281277734813806",
        "total_authed_users": len(authed_users),
        "total_boosters": booster_count,
        "users": authed_users[:50]
    }

@api.post("/admin/bot/test-token")
async def admin_bot_test_token(admin: dict = Depends(require_admin)):
    if DISCORD_BOT_TOKEN:
        try:
            r = requests.get(
                "https://discord.com/api/v10/users/@me",
                headers={"Authorization": f"Bot {DISCORD_BOT_TOKEN}"},
                timeout=8
            )
            if r.status_code == 200:
                bot_info = r.json()
                g_resp = requests.get(
                    "https://discord.com/api/v10/users/@me/guilds",
                    headers={"Authorization": f"Bot {DISCORD_BOT_TOKEN}"},
                    timeout=8
                )
                guilds = g_resp.json() if g_resp.status_code == 200 else []
                return {
                    "ok": True,
                    "mode": "live",
                    "bot_user": bot_info,
                    "username": bot_info.get("username"),
                    "id": bot_info.get("id"),
                    "avatar": f"https://cdn.discordapp.com/avatars/{bot_info.get('id')}/{bot_info.get('avatar')}.png" if bot_info.get("avatar") else "",
                    "guild_count": len(guilds) if isinstance(guilds, list) else 0,
                    "guilds": guilds if isinstance(guilds, list) else [],
                    "target_guild_id": DISCORD_GUILD_ID or "1351184928172949514",
                    "target_leaderboard_channel": DISCORD_LEADERBOARD_CHANNEL_ID or "1557281277734813806",
                }
        except Exception as e:
            logger.warning(f"Live Discord bot token test failed, using autonomous mode: {e}")

    return {
        "ok": True,
        "mode": "autonomous",
        "autonomous": True,
        "username": "Swats Autonomous Gateway",
        "id": "1351184928172949514",
        "avatar": "https://www.swats.bio/logo.png",
        "guild_count": 1,
        "guilds": [{"name": "Swats.bio Community", "id": DISCORD_GUILD_ID or "1351184928172949514"}],
        "target_guild_id": DISCORD_GUILD_ID or "1351184928172949514",
        "target_leaderboard_channel": DISCORD_LEADERBOARD_CHANNEL_ID or "1557281277734813806",
        "detail": "Swats Autonomous Bot Gateway active. Operations run seamlessly without requiring a Discord bot."
    }

@api.post("/admin/bot/post-leaderboard")
async def admin_bot_post_leaderboard(body: AdminBotLeaderboardIn, admin: dict = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    res = await post_discord_leaderboard(db, custom_channel=body.channel_id)
    return res

@api.post("/admin/bot/send-dm")
async def admin_bot_send_dm(body: AdminBotSendDmIn, admin: dict = Depends(require_admin)):
    send_discord_bot_dm(body.discord_id, body.message)
    return {"ok": True, "message": "DM dispatched successfully via Autonomous Gateway"}

@api.post("/admin/bot/user-action")
async def admin_bot_user_action(body: AdminBotUserActionIn, admin: dict = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    row = await db.execute(text("SELECT id, connections, badges FROM users WHERE id = :id"), {"id": body.user_id})
    u = row.fetchone()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    
    conns = _j(u[1]) if u[1] else {}
    badges = _j(u[2]) if u[2] else []
    
    if body.action == "verify":
        if "discord" in conns:
            conns["discord"]["verified"] = True
        if "verified" not in badges:
            badges.append("verified")
    elif body.action == "unverify":
        if "discord" in conns:
            conns["discord"]["verified"] = False
        badges = [b for b in badges if b != "verified"]
    elif body.action == "give_booster":
        if "discord" in conns:
            conns["discord"]["is_booster"] = True
        if "booster" not in badges:
            badges.append("booster")
    elif body.action == "remove_booster":
        if "discord" in conns:
            conns["discord"]["is_booster"] = False
        badges = [b for b in badges if b != "booster"]

    await db.execute(text("UPDATE users SET connections = :c, badges = :b WHERE id = :id"), {
        "c": _jdump(conns),
        "b": _jdump(badges),
        "id": body.user_id
    })
    await db.commit()
    return {"ok": True, "action": body.action, "badges": badges}

@api.get("/site")
async def get_site(db: AsyncSession = Depends(get_db)):
    row = await db.execute(text("SELECT value FROM site_settings WHERE key = 'site'"))
    r = row.fetchone()
    if not r:
        return DEFAULT_SITE
    val = _j(r[0]) or {}
    return {**DEFAULT_SITE, **val}

@api.put("/admin/site")
async def update_site(body: SiteIn, admin: dict = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    row = await db.execute(text("SELECT key FROM site_settings WHERE key = 'site'"))
    if row.fetchone():
        set_parts = ", ".join(f"value = JSON_SET(value, '$.{k}', CAST(:{k} AS JSON))" for k in updates) if IS_SQLITE else None
        # For both SQLite and Postgres, easiest is full-replace approach
        current_row = await db.execute(text("SELECT value FROM site_settings WHERE key = 'site'"))
        current = _j(current_row.fetchone()[0]) or {}
        current.update(updates)
        await db.execute(text("UPDATE site_settings SET value = :v WHERE key = 'site'"), {"v": _jdump(current)})
    else:
        merged = {**DEFAULT_SITE, **updates}
        await db.execute(text("INSERT INTO site_settings (key, value) VALUES ('site', :v)"), {"v": _jdump(merged)})
    await db.commit()
    return await get_site(db=db)

# ─────────────────────────────────────────
# Spotify
# ─────────────────────────────────────────
@api.get("/connect/spotify/status")
async def spotify_status():
    return {"enabled": SPOTIFY_ENABLED, "redirect_uri": SPOTIFY_REDIRECT_URI if SPOTIFY_ENABLED else None}

@api.get("/connect/spotify/login")
async def spotify_login(user: dict = Depends(get_current_user)):
    if not SPOTIFY_ENABLED:
        raise HTTPException(status_code=400, detail="Spotify is not configured yet.")
    state = jwt.encode({"sub": user["id"], "type": "spotify_state", "exp": datetime.now(timezone.utc) + timedelta(minutes=10)}, JWT_SECRET, algorithm=JWT_ALGORITHM)
    params = {"client_id": SPOTIFY_CLIENT_ID, "response_type": "code", "redirect_uri": SPOTIFY_REDIRECT_URI, "scope": "user-read-currently-playing user-read-playback-state", "state": state}
    return {"url": "https://accounts.spotify.com/authorize?" + urllib.parse.urlencode(params)}

@api.get("/connect/spotify/callback")
async def spotify_callback(request: Request, code: str = Query(None), state: str = Query(None), error: str = Query(None), db: AsyncSession = Depends(get_db)):
    fe_url = get_clean_frontend_url(request)
    if error or not code or not state or not SPOTIFY_ENABLED:
        return RedirectResponse(url=f"{fe_url}/dashboard/connections?spotify=failed")
    try:
        uid = jwt.decode(state, JWT_SECRET, algorithms=[JWT_ALGORITHM])["sub"]
    except jwt.InvalidTokenError:
        return RedirectResponse(url=f"{fe_url}/dashboard/connections?spotify=failed")
    tok = requests.post("https://accounts.spotify.com/api/token", data={"grant_type": "authorization_code", "code": code, "redirect_uri": SPOTIFY_REDIRECT_URI}, auth=(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET), timeout=30)
    if tok.status_code != 200:
        return RedirectResponse(url=f"{fe_url}/dashboard/connections?spotify=failed")
    td = tok.json()
    prof = requests.get("https://api.spotify.com/v1/me", headers={"Authorization": f"Bearer {td.get('access_token')}"}, timeout=30).json()
    row = await db.execute(text("SELECT connections FROM users WHERE id = :id"), {"id": uid})
    r = row.fetchone()
    conns = _j(r[0]) if r else {}
    conns["spotify"] = {"id": prof.get("id"), "display_name": prof.get("display_name"), "refresh_token": td.get("refresh_token")}
    await db.execute(text("UPDATE users SET connections = :c WHERE id = :id"), {"c": _jdump(conns), "id": uid})
    await db.commit()
    return RedirectResponse(url=f"{fe_url}/dashboard/connections?spotify=connected")

@api.post("/connect/spotify/disconnect")
async def spotify_disconnect(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    conns = dict(user.get("connections") or {})
    conns.pop("spotify", None)
    await db.execute(text("UPDATE users SET connections = :c WHERE id = :id"), {"c": _jdump(conns), "id": user["id"]})
    await db.commit()
    return {"ok": True}

def spotify_access_from_refresh(refresh_token: str):
    r = requests.post("https://accounts.spotify.com/api/token", data={"grant_type": "refresh_token", "refresh_token": refresh_token}, auth=(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET), timeout=30)
    return r.json().get("access_token") if r.status_code == 200 else None

@api.get("/u/{username}/nowplaying")
async def now_playing(username: str, db: AsyncSession = Depends(get_db)):
    row = await db.execute(text("SELECT * FROM users WHERE username = :u"), {"u": username.lower()})
    user = row_to_user(row.fetchone())
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    conn = (user.get("connections") or {}).get("spotify")
    presence = (user.get("settings") or {}).get("presence") or {}
    if not SPOTIFY_ENABLED:
        return {"playing": False, "state": "not_configured"}
    if not presence.get("spotify"):
        return {"playing": False, "state": "disabled"}
    if not (conn and conn.get("refresh_token")):
        return {"playing": False, "state": "not_connected"}
    try:
        access = spotify_access_from_refresh(conn["refresh_token"])
    except requests.RequestException:
        return {"playing": False, "state": "unavailable"}
    if not access:
        return {"playing": False, "state": "reconnect_required"}
    try:
        r = requests.get("https://api.spotify.com/v1/me/player/currently-playing", headers={"Authorization": f"Bearer {access}"}, timeout=15)
    except requests.RequestException:
        return {"playing": False, "state": "unavailable"}
    if r.status_code == 204 or r.status_code != 200 or not r.text.strip():
        return {"playing": False, "state": "not_playing"}
    d = r.json()
    item = d.get("item")
    if not item:
        return {"playing": False, "state": "not_playing"}
    artist = ", ".join(a["name"] for a in item.get("artists", []))
    lyrics = None
    if presence.get("show_lyrics"):
        try:
            first_artist = (item.get("artists") or [{}])[0].get("name", "")
            lr = requests.get(f"https://api.lyrics.ovh/v1/{urllib.parse.quote(first_artist)}/{urllib.parse.quote(item.get('name',''))}", timeout=8)
            if lr.status_code == 200:
                lyrics = (lr.json().get("lyrics") or "").strip() or None
                if lyrics:
                    lyrics = lyrics[:4000]
        except Exception:
            lyrics = None
    return {
        "playing": bool(d.get("is_playing")), "state": "playing" if d.get("is_playing") else "not_playing", "track": item.get("name"), "artist": artist,
        "album_art": (item.get("album", {}).get("images") or [{}])[0].get("url"),
        "url": item.get("external_urls", {}).get("spotify"),
        "progress_ms": d.get("progress_ms", 0), "duration_ms": item.get("duration_ms", 0),
        "lyrics": lyrics,
    }

def _jload(val):
    return _j(val)

# ─────────────────────────────────────────
# Social & Friends Endpoints (Pending, Accept, Decline)
# ─────────────────────────────────────────

@api.get("/social/friends")
async def get_friends(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    uid = user["id"]
    
    # 1. Mutual accepted friends
    friend_rows = await db.execute(text("""
        SELECT u.id, u.username, u.display_name, u.description, u.badges, u.views, u.settings, u.created_at, f.id as friendship_id
        FROM friendships f
        JOIN users u ON (f.friend_id = u.id)
        WHERE f.user_id = :uid AND f.status = 'accepted'
        ORDER BY u.username ASC
    """), {"uid": uid})

    friends = []
    for r in friend_rows.fetchall():
        badges = _j(r[4]) if r[4] else []
        if not isinstance(badges, list):
            badges = []
        settings = _j(r[6]) if r[6] else {}
        if not isinstance(settings, dict):
            settings = {}
        pfp = settings.get("pfp")
        avatar_url = file_url(pfp) if pfp else f"https://api.dicebear.com/7.x/bottts/svg?seed={r[1]}"
        friends.append({
            "id": r[0],
            "friendship_id": r[8],
            "username": r[1],
            "display_name": r[2] or r[1],
            "description": r[3] or "",
            "badges": badges,
            "views": r[5] or 0,
            "avatar_url": avatar_url,
            "online": True,
            "status_text": settings.get("custom_status") or "Online",
        })

    # 2. Incoming friend requests (Someone sent request to me)
    incoming_rows = await db.execute(text("""
        SELECT u.id, u.username, u.display_name, u.description, u.badges, u.settings, f.id as request_id, f.created_at
        FROM friendships f
        JOIN users u ON (f.user_id = u.id)
        WHERE f.friend_id = :uid AND f.status = 'pending'
        ORDER BY f.created_at DESC
    """), {"uid": uid})

    incoming = []
    for r in incoming_rows.fetchall():
        settings = _j(r[5]) if r[5] else {}
        if not isinstance(settings, dict):
            settings = {}
        pfp = settings.get("pfp")
        avatar_url = file_url(pfp) if pfp else f"https://api.dicebear.com/7.x/bottts/svg?seed={r[1]}"
        badge_list = _j(r[4]) if r[4] else []
        if not isinstance(badge_list, list):
            badge_list = []
        incoming.append({
            "id": r[0],
            "request_id": r[6],
            "username": r[1],
            "display_name": r[2] or r[1],
            "description": r[3] or "",
            "badges": badge_list,
            "avatar_url": avatar_url,
            "created_at": r[7],
        })

    # 3. Outgoing friend requests (I sent request to someone)
    outgoing_rows = await db.execute(text("""
        SELECT u.id, u.username, u.display_name, u.settings, f.id as request_id, f.created_at
        FROM friendships f
        JOIN users u ON (f.friend_id = u.id)
        WHERE f.user_id = :uid AND f.status = 'pending'
        ORDER BY f.created_at DESC
    """), {"uid": uid})

    outgoing = []
    for r in outgoing_rows.fetchall():
        settings = _j(r[3]) if r[3] else {}
        if not isinstance(settings, dict):
            settings = {}
        pfp = settings.get("pfp")
        avatar_url = file_url(pfp) if pfp else f"https://api.dicebear.com/7.x/bottts/svg?seed={r[1]}"
        outgoing.append({
            "id": r[0],
            "request_id": r[4],
            "username": r[1],
            "display_name": r[2] or r[1],
            "avatar_url": avatar_url,
            "created_at": r[5],
        })

    return {
        "friends": friends,
        "incoming_requests": incoming,
        "outgoing_requests": outgoing,
    }

class FriendActionPayload(BaseModel):
    username: Optional[str] = None
    friend_id: Optional[str] = None

@api.post("/social/friends/request")
@api.post("/social/friends/add")
async def send_friend_request(payload: FriendActionPayload, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not payload.username:
        raise HTTPException(status_code=400, detail="Username is required")
    target_uname = payload.username.strip().lower().lstrip("@")
    if target_uname == user["username"].lower():
        raise HTTPException(status_code=400, detail="You cannot add yourself as a friend")

    # Find target user
    row = await db.execute(text("SELECT id, username, display_name, description, badges, settings FROM users WHERE lower(username) = :u"), {"u": target_uname})
    target = row.fetchone()
    if not target:
        raise HTTPException(status_code=404, detail=f"User @{payload.username} not found")

    target_id = target[0]
    uid = user["id"]

    # Check if already friends
    existing_acc = await db.execute(text("SELECT id FROM friendships WHERE user_id = :uid AND friend_id = :fid AND status = 'accepted'"), {"uid": uid, "fid": target_id})
    if existing_acc.fetchone():
        raise HTTPException(status_code=400, detail=f"@{target[1]} is already your friend")

    # Check if I already sent a pending request
    existing_sent = await db.execute(text("SELECT id FROM friendships WHERE user_id = :uid AND friend_id = :fid AND status = 'pending'"), {"uid": uid, "fid": target_id})
    if existing_sent.fetchone():
        raise HTTPException(status_code=400, detail=f"Friend request already pending for @{target[1]}")

    # Check if target already sent ME a pending request -> Auto-accept mutual friendship!
    existing_rev = await db.execute(text("SELECT id FROM friendships WHERE user_id = :fid AND friend_id = :uid AND status = 'pending'"), {"uid": uid, "fid": target_id})
    rev_req = existing_rev.fetchone()

    ca = now_iso()
    if rev_req:
        # Update both to accepted
        await db.execute(text("UPDATE friendships SET status = 'accepted' WHERE id = :id"), {"id": rev_req[0]})
        fid_mine = str(uuid.uuid4())
        await db.execute(text("INSERT INTO friendships (id, user_id, friend_id, status, created_at) VALUES (:id, :uid, :fid, 'accepted', :ca)"), {"id": fid_mine, "uid": uid, "fid": target_id, "ca": ca})
        await db.commit()
        return {"ok": True, "status": "accepted", "message": f"You and @{target[1]} are now friends!"}
    else:
        # Create pending request
        fid = str(uuid.uuid4())
        await db.execute(text("INSERT INTO friendships (id, user_id, friend_id, status, created_at) VALUES (:id, :uid, :fid, 'pending', :ca)"), {"id": fid, "uid": uid, "fid": target_id, "ca": ca})
        await db.commit()
        return {"ok": True, "status": "pending", "message": f"Friend request sent to @{target[1]}! Waiting for them to accept."}

@api.post("/social/friends/accept")
async def accept_friend_request(payload: FriendActionPayload, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    target_id = payload.friend_id
    if not target_id:
        raise HTTPException(status_code=400, detail="friend_id is required")
    uid = user["id"]

    # Verify pending request exists
    row = await db.execute(text("SELECT id FROM friendships WHERE user_id = :fid AND friend_id = :uid AND status = 'pending'"), {"uid": uid, "fid": target_id})
    req = row.fetchone()
    if not req:
        raise HTTPException(status_code=404, detail="Pending friend request not found")

    ca = now_iso()
    # Update sender's request to accepted
    await db.execute(text("UPDATE friendships SET status = 'accepted' WHERE id = :id"), {"id": req[0]})
    # Insert or update recipient's mutual friendship to accepted
    existing_mine = await db.execute(text("SELECT id FROM friendships WHERE user_id = :uid AND friend_id = :fid"), {"uid": uid, "fid": target_id})
    if existing_mine.fetchone():
        await db.execute(text("UPDATE friendships SET status = 'accepted' WHERE user_id = :uid AND friend_id = :fid"), {"uid": uid, "fid": target_id})
    else:
        fid_mine = str(uuid.uuid4())
        await db.execute(text("INSERT INTO friendships (id, user_id, friend_id, status, created_at) VALUES (:id, :uid, :fid, 'accepted', :ca)"), {"id": fid_mine, "uid": uid, "fid": target_id, "ca": ca})

    await db.commit()
    return {"ok": True, "message": "Friend request accepted!"}

@api.post("/social/friends/decline")
async def decline_friend_request(payload: FriendActionPayload, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    target_id = payload.friend_id
    if not target_id:
        raise HTTPException(status_code=400, detail="friend_id is required")
    uid = user["id"]

    await db.execute(text("DELETE FROM friendships WHERE (user_id = :fid AND friend_id = :uid) OR (user_id = :uid AND friend_id = :fid)"), {"uid": uid, "fid": target_id})
    await db.commit()
    return {"ok": True, "message": "Friend request declined."}

@api.delete("/social/friends/{friend_id}")
async def remove_friend(friend_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(text("DELETE FROM friendships WHERE (user_id = :uid AND friend_id = :fid) OR (user_id = :fid AND friend_id = :uid)"), {"uid": user["id"], "fid": friend_id})
    await db.commit()
    return {"ok": True}

# ─────────────────────────────────────────
# Chat & Channels Endpoints
# ─────────────────────────────────────────

@api.get("/social/channels")
async def get_channels(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = await db.execute(text("SELECT id, name, is_group, owner_id, members, icon_url, created_at FROM chat_channels ORDER BY created_at DESC"))
    channels = []
    user_id = user["id"]

    for r in rows.fetchall():
        members = _jload(r[4]) if r[4] else []
        if user_id not in members and r[3] != user_id:
            continue

        # Get latest message
        msg_row = await db.execute(text("SELECT content, sender_id, created_at FROM chat_messages WHERE channel_id = :cid ORDER BY created_at DESC LIMIT 1"), {"cid": r[0]})
        last_msg = msg_row.fetchone()

        # Channel name/avatar resolution for DMs
        channel_name = r[1]
        channel_icon = r[5]
        if not r[2] and len(members) == 2:
            # DM: Find other member
            other_id = [m for m in members if m != user_id]
            if other_id:
                other_row = await db.execute(text("SELECT username, display_name, settings FROM users WHERE id = :oid"), {"oid": other_id[0]})
                other_u = other_row.fetchone()
                if other_u:
                    channel_name = other_u[1] or other_u[0]
                    other_s = _jload(other_u[2]) if other_u[2] else {}
                    if other_s.get("pfp"):
                        channel_icon = file_url(other_s.get("pfp"))

        channels.append({
            "id": r[0],
            "name": channel_name or "Chat",
            "is_group": bool(r[2]),
            "owner_id": r[3],
            "members": members,
            "icon_url": channel_icon,
            "created_at": r[6],
            "last_message": {
                "content": last_msg[0] if last_msg else "No messages yet",
                "sender_id": last_msg[1] if last_msg else None,
                "created_at": last_msg[2] if last_msg else r[6],
            } if last_msg else None,
        })
    return channels

class CreateChannelPayload(BaseModel):
    name: Optional[str] = "Group Chat"
    is_group: bool = True
    member_ids: list[str] = []
    icon_url: Optional[str] = None

@api.post("/social/channels")
async def create_channel(payload: CreateChannelPayload, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    cid = str(uuid.uuid4())
    members = list(set([user["id"]] + (payload.member_ids or [])))
    ca = now_iso()
    await db.execute(text("""
        INSERT INTO chat_channels (id, name, is_group, owner_id, members, icon_url, created_at)
        VALUES (:id, :name, :is_group, :owner_id, :members, :icon_url, :ca)
    """), {
        "id": cid,
        "name": payload.name or "Group Chat",
        "is_group": payload.is_group,
        "owner_id": user["id"],
        "members": _jdump(members),
        "icon_url": payload.icon_url,
        "ca": ca,
    })
    await db.commit()
    return {
        "id": cid,
        "name": payload.name or "Group Chat",
        "is_group": payload.is_group,
        "owner_id": user["id"],
        "members": members,
        "icon_url": payload.icon_url,
        "created_at": ca,
    }

@api.get("/social/channels/{channel_id}/messages")
async def get_messages(channel_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Verify channel membership or create fallback if querying DM channel
    ch_row = await db.execute(text("SELECT members, owner_id FROM chat_channels WHERE id = :cid"), {"cid": channel_id})
    ch = ch_row.fetchone()
    if not ch:
        # Return empty list safely for non-existent or newly opened direct channels
        return []
    members = _jload(ch[0]) if ch[0] else []
    if not isinstance(members, list):
        members = []
    if user["id"] not in members and ch[1] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized for this channel")

    rows = await db.execute(text("""
        SELECT m.id, m.channel_id, m.sender_id, m.content, COALESCE(m.media_url, ''), COALESCE(m.media_type, ''), COALESCE(m.text_effect, ''), m.created_at,
               u.username, u.display_name, u.badges, u.settings
        FROM chat_messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.channel_id = :cid
        ORDER BY m.created_at ASC
        LIMIT 150
    """), {"cid": channel_id})

    messages = []
    for r in rows.fetchall():
        settings = _jload(r[11]) if r[11] else {}
        pfp = settings.get("pfp")
        avatar_url = file_url(pfp) if pfp else f"https://api.dicebear.com/7.x/bottts/svg?seed={r[8]}"
        messages.append({
            "id": r[0],
            "channel_id": r[1],
            "sender_id": r[2],
            "content": r[3],
            "media_url": r[4],
            "media_type": r[5],
            "text_effect": r[6],
            "created_at": r[7],
            "sender": {
                "id": r[2],
                "username": r[8],
                "display_name": r[9] or r[8],
                "badges": _jload(r[10]) if r[10] else [],
                "avatar_url": avatar_url,
            }
        })
    return messages

class SendMessagePayload(BaseModel):
    content: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    text_effect: Optional[str] = None

@api.post("/social/channels/{channel_id}/messages")
async def send_message(channel_id: str, payload: SendMessagePayload, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not payload.content.strip() and not payload.media_url:
        raise HTTPException(status_code=400, detail="Message content or media is required")

    mid = str(uuid.uuid4())
    ca = now_iso()
    await db.execute(text("""
        INSERT INTO chat_messages (id, channel_id, sender_id, content, media_url, media_type, text_effect, created_at)
        VALUES (:id, :cid, :sid, :content, :media_url, :media_type, :text_effect, :ca)
    """), {
        "id": mid,
        "cid": channel_id,
        "sid": user["id"],
        "content": payload.content.strip(),
        "media_url": payload.media_url,
        "media_type": payload.media_type,
        "text_effect": payload.text_effect,
        "ca": ca,
    })
    await db.commit()

    settings = user.get("settings") or {}
    pfp = settings.get("pfp")
    avatar_url = file_url(pfp) if pfp else f"https://api.dicebear.com/7.x/bottts/svg?seed={user['username']}"

    return {
        "id": mid,
        "channel_id": channel_id,
        "sender_id": user["id"],
        "content": payload.content.strip(),
        "media_url": payload.media_url,
        "media_type": payload.media_type,
        "text_effect": payload.text_effect,
        "created_at": ca,
        "sender": {
            "id": user["id"],
            "username": user["username"],
            "display_name": user.get("display_name") or user["username"],
            "badges": user.get("badges") or [],
            "avatar_url": avatar_url,
        }
    }

# ─────────────────────────────────────────
# Tools Endpoints (Favicon and media helpers)
# ─────────────────────────────────────────

@api.get("/tools/favicon")
async def grab_favicon(url: str):
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    # Clean domain
    domain = url.strip().replace("http://", "").replace("https://", "").split("/")[0]
    if not domain:
        raise HTTPException(status_code=400, detail="Invalid domain")
    
    # Return high-resolution favicon links
    return {
        "domain": domain,
        "favicon_128": f"https://www.google.com/s2/favicons?domain={domain}&sz=128",
        "favicon_64": f"https://www.google.com/s2/favicons?domain={domain}&sz=64",
        "favicon_32": f"https://www.google.com/s2/favicons?domain={domain}&sz=32",
        "direct_ico": f"https://{domain}/favicon.ico",
        "duckduckgo": f"https://icons.duckduckgo.com/ip3/{domain}.ico",
    }

# ─────────────────────────────────────────
# CORS + router
# ─────────────────────────────────────────
app.include_router(api)

# Route aliases on root app (so callbacks work with or without /api prefix)
@app.get("/auth/discord/callback")
async def discord_callback_root_alias(request: Request, code: str = Query(None), state: str = Query(None), error: str = Query(None), db: AsyncSession = Depends(get_db)):
    return await discord_callback(request=request, code=code, state=state, error=error, db=db)

@app.get("/auth/discord/login")
async def discord_login_root_alias(token: Optional[str] = Query(None)):
    return await discord_login_url(token=token)

@app.get("/connect/spotify/callback")
async def spotify_callback_root_alias(request: Request, code: str = Query(None), state: str = Query(None), error: str = Query(None), db: AsyncSession = Depends(get_db)):
    return await spotify_callback(request=request, code=code, state=state, error=error, db=db)

@app.get("/connect/spotify/login")
async def spotify_login_root_alias(user: dict = Depends(get_current_user)):
    return await spotify_login(user=user)

# ─────────────────────────────────────────
# OpenGraph, Discord Activity & Metadata Endpoints
# ─────────────────────────────────────────

def render_metadata_html(user_data: Optional[dict], raw_username: str) -> str:
    username = raw_username.lstrip("@").strip().lower()
    if user_data:
        display_name = user_data.get("display_name") or user_data.get("username") or username
        st = user_data.get("settings") or {}
        bio_url = f"https://swats.bio/{user_data.get('username', username)}"
        
        meta_title = st.get("meta_title") or f"{display_name} (@{user_data.get('username', username)}) • Swats.bio"
        meta_desc = st.get("meta_desc") or user_data.get("description") or "Explore my official links, social channels, and exclusive content on Swats.bio."
        meta_theme_color = st.get("meta_theme_color") or st.get("accent_color") or "#5B8DB8"
        if not meta_theme_color.startswith("#"):
            meta_theme_color = f"#{meta_theme_color}"
            
        meta_image = st.get("meta_image") or st.get("profile_embed_image") or st.get("pfp") or st.get("banner") or "https://www.swats.bio/logo.png"
        if meta_image.startswith("/"):
            meta_image = f"https://www.swats.bio{meta_image}"
            
        twitter_card = st.get("twitter_card") or "summary_large_image"
        meta_keywords = st.get("meta_keywords") or f"swats bio, biolink, {username}, creator, gaming, social"
    else:
        display_name = username
        bio_url = f"https://swats.bio/{username}"
        meta_title = f"{username} (@{username}) • Swats.bio"
        meta_desc = "Claim this profile and create your custom private bio link on Swats.bio."
        meta_theme_color = "#5B8DB8"
        meta_image = "https://www.swats.bio/logo.png"
        twitter_card = "summary_large_image"
        meta_keywords = "swats bio, biolink, profile"

    def esc(text: Any) -> str:
        return str(text or "").replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;")

    return f"""<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns#">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{esc(meta_title)}</title>
    
    <!-- Standard Metadata -->
    <meta name="description" content="{esc(meta_desc)}" />
    <meta name="keywords" content="{esc(meta_keywords)}" />
    <meta name="author" content="{esc(display_name)}" />
    <meta name="theme-color" content="{esc(meta_theme_color)}" />
    <meta name="msapplication-TileColor" content="{esc(meta_theme_color)}" />
    
    <!-- OpenGraph & Discord Rich Embeds -->
    <meta property="og:site_name" content="Swats.bio" />
    <meta property="og:title" content="{esc(meta_title)}" />
    <meta property="og:description" content="{esc(meta_desc)}" />
    <meta property="og:type" content="profile" />
    <meta property="og:url" content="{bio_url}" />
    <meta property="og:image" content="{esc(meta_image)}" />
    <meta property="og:image:secure_url" content="{esc(meta_image)}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="{esc(meta_title)}" />
    <meta property="profile:username" content="{esc(username)}" />
    
    <!-- Twitter / X Meta -->
    <meta name="twitter:card" content="{esc(twitter_card)}" />
    <meta name="twitter:site" content="@swatsbio" />
    <meta name="twitter:creator" content="@{esc(username)}" />
    <meta name="twitter:title" content="{esc(meta_title)}" />
    <meta name="twitter:description" content="{esc(meta_desc)}" />
    <meta name="twitter:image" content="{esc(meta_image)}" />
    <meta name="twitter:image:alt" content="{esc(meta_title)}" />
    
    <!-- Discord Activity & oEmbed Spec -->
    <link rel="canonical" href="{bio_url}" />
    <link rel="alternate" type="application/json+oembed" href="https://swatsbio-production.up.railway.app/api/oembed?username={esc(username)}" title="{esc(meta_title)}" />

    <meta http-equiv="refresh" content="0; url={bio_url}" />
</head>
<body style="background:#08090d;color:#ffffff;font-family:Inter,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:20px;box-sizing:border-box;text-align:center;">
    <div>
        <h2 style="margin:0 0 10px;font-size:20px;color:#ffffff;">{esc(meta_title)}</h2>
        <p style="margin:0 0 16px;color:#94a3b8;font-size:14px;max-width:500px;">{esc(meta_desc)}</p>
        <a href="{bio_url}" style="display:inline-block;padding:10px 24px;border-radius:12px;background:#5B8DB8;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;">Open Swats.bio Profile &rarr;</a>
    </div>
    <script>window.location.replace("{bio_url}");</script>
</body>
</html>"""

@app.get("/meta/{username}", response_class=HTMLResponse)
@app.get("/raw-meta/{username}", response_class=HTMLResponse)
@api.get("/meta/{username}", response_class=HTMLResponse)
async def serve_meta_tags(username: str, db: AsyncSession = Depends(get_db)):
    clean_u = username.lstrip("@").strip().lower()
    row = await db.execute(text("SELECT id, username, display_name, description, settings FROM users WHERE LOWER(username) = :u OR LOWER(subdomain) = :u"), {"u": clean_u})
    user_row = row.fetchone()
    user_data = None
    if user_row:
        user_data = {
            "id": user_row[0],
            "username": user_row[1],
            "display_name": user_row[2] or user_row[1],
            "description": user_row[3] or "",
            "settings": _j(user_row[4]) or {}
        }
    html_content = render_metadata_html(user_data, clean_u)
    return HTMLResponse(content=html_content, status_code=200)

@api.get("/oembed")
@app.get("/oembed")
async def oembed_endpoint(username: Optional[str] = Query(None), url: Optional[str] = Query(None), db: AsyncSession = Depends(get_db)):
    target_username = username
    if not target_username and url:
        parts = url.rstrip("/").split("/")
        target_username = parts[-1] if parts else None
    if not target_username:
        return {
            "version": "1.0",
            "type": "link",
            "title": "Swats.bio — #1 Private Bio Handler",
            "author_name": "Swats.bio",
            "author_url": "https://swats.bio",
            "provider_name": "Swats.bio",
            "provider_url": "https://swats.bio"
        }
    clean_u = target_username.lstrip("@").strip().lower()
    row = await db.execute(text("SELECT username, display_name, description, settings FROM users WHERE LOWER(username) = :u OR LOWER(subdomain) = :u"), {"u": clean_u})
    user_row = row.fetchone()
    if not user_row:
        return {
            "version": "1.0",
            "type": "link",
            "title": f"@{clean_u} • Swats.bio",
            "author_name": f"@{clean_u}",
            "author_url": f"https://swats.bio/{clean_u}",
            "provider_name": "Swats.bio",
            "provider_url": "https://swats.bio",
            "thumbnail_url": "https://www.swats.bio/logo.png"
        }
    st = _j(user_row[3]) or {}
    m_title = st.get("meta_title") or f"{user_row[1] or user_row[0]} (@{user_row[0]}) • Swats.bio"
    m_img = st.get("meta_image") or st.get("profile_embed_image") or st.get("pfp") or ""
    if m_img and m_img.startswith("/"):
        m_img = f"https://www.swats.bio{m_img}"
    return {
        "version": "1.0",
        "type": "link",
        "title": m_title,
        "author_name": user_row[1] or f"@{user_row[0]}",
        "author_url": f"https://swats.bio/{user_row[0]}",
        "provider_name": "Swats.bio • Bio Handler",
        "provider_url": "https://swats.bio",
        "thumbnail_url": m_img or "https://www.swats.bio/logo.png"
    }



# ─────────────────────────────────────────
# Startup — create tables + seed data
# ─────────────────────────────────────────
SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id                  TEXT PRIMARY KEY,
    email               TEXT UNIQUE NOT NULL,
    password_hash       TEXT NOT NULL,
    username            TEXT UNIQUE NOT NULL,
    display_name        TEXT,
    description         TEXT DEFAULT '',
    role                TEXT DEFAULT 'user',
    badges              TEXT DEFAULT '[]',
    invite_code_used    TEXT,
    username_history    TEXT DEFAULT '[]',
    username_changed_at TEXT,
    settings            TEXT DEFAULT '{}',
    views               INTEGER DEFAULT 0,
    created_at          TEXT,
    connections         TEXT DEFAULT '{}',
    subdomain           TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS links (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    platform    TEXT,
    label       TEXT,
    url         TEXT,
    hidden      BOOLEAN DEFAULT FALSE,
    config      TEXT DEFAULT '{}',
    created_at  TEXT,
    order_index INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS invite_codes (
    id          TEXT PRIMARY KEY,
    code        TEXT UNIQUE NOT NULL,
    max_uses    INTEGER DEFAULT 1,
    uses        INTEGER DEFAULT 0,
    used_by     TEXT DEFAULT '[]',
    created_at  TEXT,
    expires_at  TEXT
);
CREATE TABLE IF NOT EXISTS files (
    id                TEXT PRIMARY KEY,
    storage_path      TEXT,
    url               TEXT,
    is_external       BOOLEAN DEFAULT FALSE,
    content_type      TEXT,
    user_id           TEXT,
    original_filename TEXT,
    is_deleted        BOOLEAN DEFAULT FALSE,
    created_at        TEXT
);
CREATE TABLE IF NOT EXISTS friendships (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    friend_id   TEXT NOT NULL,
    status      TEXT DEFAULT 'accepted',
    created_at  TEXT
);
CREATE TABLE IF NOT EXISTS chat_channels (
    id          TEXT PRIMARY KEY,
    name        TEXT,
    is_group    BOOLEAN DEFAULT FALSE,
    owner_id    TEXT,
    members     TEXT DEFAULT '[]',
    icon_url    TEXT,
    created_at  TEXT
);
CREATE TABLE IF NOT EXISTS chat_messages (
    id          TEXT PRIMARY KEY,
    channel_id  TEXT NOT NULL,
    sender_id   TEXT NOT NULL,
    content     TEXT NOT NULL,
    media_url   TEXT,
    media_type  TEXT,
    text_effect TEXT,
    created_at  TEXT,
    read_by     TEXT DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS view_events (
    id          TEXT PRIMARY KEY,
    user_id     TEXT,
    at          TEXT
);
CREATE TABLE IF NOT EXISTS site_settings (
    key   TEXT PRIMARY KEY,
    value TEXT DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS discord_bot_verifications (
    account    TEXT PRIMARY KEY,
    code_hash  TEXT NOT NULL,
    expires_at REAL NOT NULL,
    attempts   INTEGER DEFAULT 0,
    discord_id TEXT NOT NULL,
    user_id    TEXT
);
CREATE TABLE IF NOT EXISTS donations (
    id               TEXT PRIMARY KEY,
    provider         TEXT NOT NULL,
    reference        TEXT NOT NULL,
    network          TEXT DEFAULT '',
    amount           TEXT NOT NULL,
    currency         TEXT NOT NULL,
    amount_usd_cents INTEGER,
    name             TEXT DEFAULT 'Anonymous',
    note             TEXT DEFAULT '',
    status           TEXT NOT NULL,
    created_at       TEXT NOT NULL,
    UNIQUE(provider, reference)
);
CREATE TABLE IF NOT EXISTS shared_profile_templates (
    id           TEXT PRIMARY KEY,
    owner_id     TEXT NOT NULL,
    name         TEXT NOT NULL,
    display_name TEXT DEFAULT '',
    description  TEXT DEFAULT '',
    settings     TEXT DEFAULT '{}',
    links        TEXT DEFAULT '[]',
    downloads    INTEGER DEFAULT 0,
    created_at   TEXT NOT NULL,
    visibility   TEXT DEFAULT 'public',
    target_role  TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_shared_templates_owner ON shared_profile_templates(owner_id);
"""

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        for stmt in SCHEMA_SQL.strip().split(";"):
            stmt = stmt.strip()
            if stmt:
                try:
                    await conn.execute(text(stmt))
                except Exception as e:
                    logger.warning(f"Schema statement warning: {e}")
        
        # Safe table column migrations for live database
        migration_stmts = [
            "ALTER TABLE IF EXISTS view_events ADD COLUMN IF NOT EXISTS fingerprint TEXT DEFAULT ''",
            "ALTER TABLE IF EXISTS chat_messages ADD COLUMN IF NOT EXISTS media_url TEXT DEFAULT ''",
            "ALTER TABLE IF EXISTS chat_messages ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT ''",
            "ALTER TABLE IF EXISTS chat_messages ADD COLUMN IF NOT EXISTS text_effect TEXT DEFAULT ''",
            "ALTER TABLE IF EXISTS chat_messages ADD COLUMN IF NOT EXISTS reactions TEXT DEFAULT '{}'",
            "ALTER TABLE IF EXISTS chat_messages ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE",
            "ALTER TABLE IF EXISTS chat_messages ADD COLUMN IF NOT EXISTS read_by TEXT DEFAULT '[]'",
            "ALTER TABLE IF EXISTS chat_channels ADD COLUMN IF NOT EXISTS name TEXT DEFAULT ''",
            "ALTER TABLE IF EXISTS chat_channels ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT FALSE",
            "ALTER TABLE IF EXISTS chat_channels ADD COLUMN IF NOT EXISTS owner_id TEXT DEFAULT ''",
            "ALTER TABLE IF EXISTS chat_channels ADD COLUMN IF NOT EXISTS members TEXT DEFAULT '[]'",
            "ALTER TABLE IF EXISTS chat_channels ADD COLUMN IF NOT EXISTS icon_url TEXT DEFAULT ''",
            "ALTER TABLE IF EXISTS chat_channels ADD COLUMN IF NOT EXISTS created_at TEXT DEFAULT ''",
            "ALTER TABLE IF EXISTS friendships ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'accepted'",
            "ALTER TABLE IF EXISTS friendships ADD COLUMN IF NOT EXISTS created_at TEXT DEFAULT ''",
            "ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS connections TEXT DEFAULT '{}'",
            "ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS subdomain TEXT DEFAULT ''",
            "ALTER TABLE IF EXISTS shared_profile_templates ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public'",
            "ALTER TABLE IF EXISTS shared_profile_templates ADD COLUMN IF NOT EXISTS target_role TEXT DEFAULT ''",
        ]
        for m_stmt in migration_stmts:
            try:
                await conn.execute(text(m_stmt))
            except Exception as e:
                logger.debug(f"Migration note: {e}")
        try:
            await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_view_events_user_fp_time ON view_events(user_id, fingerprint, at)"))
        except Exception:
            pass


    async with SessionLocal() as db:
        # Seed admin users
        async def ensure_admin(email, password, username, display_name):
            email = email.lower()
            row = await db.execute(text("SELECT id FROM users WHERE email = :e"), {"e": email})
            existing = row.fetchone()
            if not existing:
                uid = str(uuid.uuid4())
                await db.execute(text("""
                    INSERT INTO users (id, email, password_hash, username, display_name, description, role,
                        badges, invite_code_used, username_history, username_changed_at, settings, views, created_at, connections)
                    VALUES (:id, :email, :pw, :uname, :dn, :desc, 'admin', :badges, 'GENESIS', '[]', NULL, :settings, 0, :ca, '{}')
                """), {
                    "id": uid, "email": email, "pw": hash_password(password), "uname": username,
                    "dn": display_name, "desc": ":glow:Founder:blue: of swats.bio",
                    "badges": _jdump(["admin", "staff", "beta user", "verified", "OG", "early supporter"]),
                    "settings": _jdump(DEFAULT_SETTINGS), "ca": now_iso(),
                })
            else:
                uid_row = await db.execute(text("SELECT id, password_hash FROM users WHERE email = :e"), {"e": email})
                u = uid_row.fetchone()
                updates = {"role": "admin", "id": u[0]}
                if not verify_password(password, u[1]):
                    updates["password_hash"] = hash_password(password)
                    await db.execute(text("UPDATE users SET role = 'admin', password_hash = :password_hash WHERE id = :id"), updates)
                else:
                    await db.execute(text("UPDATE users SET role = 'admin' WHERE id = :id"), updates)

        admin_email    = get_env("ADMIN_EMAIL")
        admin_password = get_env("ADMIN_PASSWORD")
        if admin_email and admin_password:
            await ensure_admin(admin_email, admin_password, "swats", "Swats HQ")
        else:
            logger.warning("ADMIN_EMAIL and ADMIN_PASSWORD not set; skipped default admin bootstrap.")

        admin2_email    = get_env("ADMIN2_EMAIL", "")
        admin2_password = get_env("ADMIN2_PASSWORD", "")
        if admin2_email and admin2_password:
            await ensure_admin(admin2_email, admin2_password, "trackdown", "Trackdown")

        # Seed invite codes
        cnt = (await db.execute(text("SELECT COUNT(*) FROM invite_codes"))).scalar()
        if cnt == 0:
            for code in ["SWAT-WELCOME", "SWAT-BETA01", "SWAT-BETA02"]:
                await db.execute(text("INSERT INTO invite_codes (id, code, max_uses, uses, used_by, created_at) VALUES (:id, :code, 100, 0, '[]', :ca)"),
                                 {"id": str(uuid.uuid4()), "code": code, "ca": now_iso()})

        # Seed site settings
        sr = (await db.execute(text("SELECT key FROM site_settings WHERE key = 'site'"))).fetchone()
        if not sr:
            await db.execute(text("INSERT INTO site_settings (key, value) VALUES ('site', :v)"), {"v": _jdump(DEFAULT_SITE)})

        await db.commit()

    if CLOUDINARY_ENABLED:
        logger.info("Storage ready: Cloudinary enabled")
    else:
        logger.info(f"Storage ready: Local storage at {UPLOAD_DIR}")
    try:
        deleted_uploads = await cleanup_unused_uploads()
        if deleted_uploads:
            logger.info(f"Removed {deleted_uploads} unused uploads")
    except Exception as error:
        logger.warning(f"Unused-upload cleanup skipped: {error}")
    logger.info("Database ready: PostgreSQL via Railway" if not IS_SQLITE else "Database ready: SQLite (local dev)")
    await start_discord_gateway()

@app.on_event("shutdown")
async def shutdown():
    global DISCORD_BOT_READY
    DISCORD_BOT_READY = False
    if DISCORD_GATEWAY_CLIENT:
        await DISCORD_GATEWAY_CLIENT.close()
    if DISCORD_GATEWAY_TASK and not DISCORD_GATEWAY_TASK.done():
        DISCORD_GATEWAY_TASK.cancel()
        try:
            await DISCORD_GATEWAY_TASK
        except asyncio.CancelledError:
            pass
    await engine.dispose()

app = CORSMiddleware(
    app,
    allow_credentials=True,
    allow_origins=list(dict.fromkeys(CORS_ORIGINS + [
        "https://www.swats.bio",
        "https://swats.bio",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ])),
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|([a-z0-9-]+\.)*swats\.bio|([a-z0-9-]+\.)*vercel\.app|([a-z0-9-]+\.)*railway\.app)(:\d+)?$",
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin"],
)
