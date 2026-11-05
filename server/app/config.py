import os
from datetime import timedelta
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


def _extract_supabase_ref(supabase_url: Optional[str]) -> Optional[str]:
    if not supabase_url:
        return None
    from urllib.parse import urlparse

    host = urlparse(supabase_url.strip()).hostname or ""
    if host.endswith(".supabase.co"):
        return host.split(".")[0]
    return None


def _normalize_db_url(url: Optional[str], fallback: str = "sqlite:///:memory:") -> str:
    if not url or not url.strip():
        return fallback
    cleaned = url.strip().strip('"').strip("'")
    if cleaned.startswith("postgres://"):
        cleaned = cleaned.replace("postgres://", "postgresql://", 1)

    import re
    from urllib.parse import quote, unquote

    # Rewrite IPv6-only Supabase direct host (db.<ref>.supabase.co) to IPv4 Supavisor pooler
    direct_match = re.search(r"@db\.([a-z0-9]+)\.supabase\.co(?::\d+)?", cleaned)
    if direct_match:
        ref = direct_match.group(1)
        pooler_region = os.getenv("SUPABASE_POOLER_REGION", "aws-0-eu-west-1")
        cleaned = re.sub(
            r"@db\.[a-z0-9]+\.supabase\.co(?::\d+)?",
            f"@{pooler_region}.pooler.supabase.com:5432",
            cleaned,
            count=1,
        )
        if "://postgres:" in cleaned:
            cleaned = cleaned.replace("://postgres:", f"://postgres.{ref}:", 1)

    if ".pooler.supabase.com" in cleaned and "://postgres:" in cleaned:
        ref = _extract_supabase_ref(os.getenv("SUPABASE_URL"))
        if ref:
            cleaned = cleaned.replace("://postgres:", f"://postgres.{ref}:", 1)

    # Normalize credentials (strip accidental [PASSWORD] brackets and URL-encode special chars)
    if "://" in cleaned and "@" in cleaned:
        scheme, rest = cleaned.split("://", 1)
        userinfo, hostpart = rest.rsplit("@", 1)
        if ":" in userinfo:
            user, raw_pw = userinfo.split(":", 1)
            if raw_pw.startswith("[") and raw_pw.endswith("]"):
                raw_pw = raw_pw[1:-1]
            decoded_pw = unquote(raw_pw)
            encoded_pw = quote(decoded_pw, safe="")
            cleaned = f"{scheme}://{user}:{encoded_pw}@{hostpart}"

    if cleaned.startswith("postgresql+psycopg://"):
        try:
            import psycopg  # noqa: F401
        except ImportError:
            cleaned = cleaned.replace("postgresql+psycopg://", "postgresql+psycopg2://", 1)
    return cleaned


def _parse_cors_origins(raw: Optional[str]):
    if not raw or raw.strip() == "*":
        return "*"
    return [origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip()]


class BaseConfig:
    SECRET_KEY = os.getenv("SECRET_KEY")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "static", "uploads", "cars")

    SUPABASE_URL = (os.getenv("SUPABASE_URL") or "").rstrip("/")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
    SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "car-images")

    CORS_ORIGINS = _parse_cors_origins(os.getenv("CORS_ORIGINS", "*"))

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    CACHE_TYPE = "SimpleCache"
    CACHE_DEFAULT_TIMEOUT = 300

    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

    BCRYPT_ROUNDS = int(os.getenv("BCRYPT_ROUNDS") or 10)
    BUSINESS_HOURS_START = 8
    BUSINESS_HOURS_END = 18
    ADMIN_CONTACT_PHONE = os.getenv("ADMIN_CONTACT_PHONE", "+254 740 892 332")


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = _normalize_db_url(
        os.getenv("DATABASE_URL"),
        fallback="postgresql://dev:car_db2026@localhost:5432/car_db",
    )


class StagingConfig(BaseConfig):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = _normalize_db_url(os.getenv("DATABASE_URL"))
    CACHE_TYPE = "RedisCache" if os.getenv("REDIS_URL") else "SimpleCache"
    CACHE_REDIS_URL = os.getenv("REDIS_URL")


class ProductionConfig(BaseConfig):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = _normalize_db_url(os.getenv("DATABASE_URL"))
    CACHE_TYPE = "RedisCache" if os.getenv("REDIS_URL") else "SimpleCache"
    CACHE_REDIS_URL = os.getenv("REDIS_URL")


config_by_name = {
    "development": DevelopmentConfig,
    "staging": StagingConfig,
    "production": ProductionConfig,
}