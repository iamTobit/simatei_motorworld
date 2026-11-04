import os
from datetime import timedelta
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


def _normalize_db_url(url: Optional[str]) -> Optional[str]:
    if url and url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


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

    BCRYPT_ROUNDS = int(os.getenv("BCRYPT_ROUNDS", 10))
    BUSINESS_HOURS_START = 8
    BUSINESS_HOURS_END = 18
    ADMIN_CONTACT_PHONE = os.getenv("ADMIN_CONTACT_PHONE", "+254 740 892 332")


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = _normalize_db_url(
        os.getenv(
            "DATABASE_URL",
            "postgresql://dev:car_db2026@localhost:5432/car_db",
        )
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