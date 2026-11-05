import json
import mimetypes
import os
import urllib.error
import urllib.request
import uuid
from werkzeug.utils import secure_filename
from flask import current_app
from .errors import APIError

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}


def allowed_file(filename: str) -> bool:
    return "." in filename and \
           filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def _supabase_storage_config():
    url = (current_app.config.get("SUPABASE_URL") or "").rstrip("/")
    key = current_app.config.get("SUPABASE_SERVICE_ROLE_KEY")
    bucket = current_app.config.get("SUPABASE_STORAGE_BUCKET", "car-images")
    if url and key:
        return url, key, bucket
    return None


def ensure_supabase_bucket() -> dict:
    """Verify the configured Supabase Storage bucket exists (and is public), creating it if missing."""
    sb_cfg = _supabase_storage_config()
    if not sb_cfg:
        return {"configured": False, "connected": False, "bucket": None, "error": "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set"}

    supabase_url, service_key, bucket = sb_cfg
    headers = {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key,
        "Content-Type": "application/json",
    }
    bucket_url = f"{supabase_url}/storage/v1/bucket/{bucket}"
    req = urllib.request.Request(bucket_url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8") or "{}")
            return {
                "configured": True,
                "connected": True,
                "bucket": bucket,
                "public": data.get("public", True),
                "error": None,
            }
    except urllib.error.HTTPError as exc:
        if exc.code in (400, 404):
            create_url = f"{supabase_url}/storage/v1/bucket"
            payload = json.dumps({"id": bucket, "name": bucket, "public": True}).encode("utf-8")
            create_req = urllib.request.Request(create_url, data=payload, headers=headers, method="POST")
            try:
                with urllib.request.urlopen(create_req, timeout=15):
                    return {
                        "configured": True,
                        "connected": True,
                        "bucket": bucket,
                        "public": True,
                        "created": True,
                        "error": None,
                    }
            except Exception as create_exc:
                return {
                    "configured": True,
                    "connected": False,
                    "bucket": bucket,
                    "error": str(create_exc),
                }
        return {
            "configured": True,
            "connected": False,
            "bucket": bucket,
            "error": f"HTTP {exc.code}: {exc.reason}",
        }
    except Exception as exc:
        return {
            "configured": True,
            "connected": False,
            "bucket": bucket,
            "error": str(exc),
        }


def save_image(file) -> str:
    """Save an uploaded FileStorage to Supabase Storage (if configured) or local disk."""
    if not file or not file.filename:
        raise APIError("Empty file", status_code=400)
    if not allowed_file(file.filename):
        raise APIError(f"Unsupported file type: {file.filename}", status_code=400)

    ext = file.filename.rsplit(".", 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    filename = secure_filename(filename)

    sb_cfg = _supabase_storage_config()
    if sb_cfg:
        supabase_url, service_key, bucket = sb_cfg
        object_path = f"cars/{filename}"
        content_type = (
            getattr(file, "mimetype", None)
            or mimetypes.guess_type(filename)[0]
            or "application/octet-stream"
        )
        file.stream.seek(0)
        upload_url = f"{supabase_url}/storage/v1/object/{bucket}/{object_path}"
        req = urllib.request.Request(
            upload_url,
            data=file.read(),
            headers={
                "Authorization": f"Bearer {service_key}",
                "apikey": service_key,
                "Content-Type": content_type,
                "x-upsert": "true",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                if resp.status >= 400:
                    raise APIError(
                        f"Failed to upload image to Supabase Storage ({resp.status})",
                        status_code=502,
                    )
        except urllib.error.HTTPError as exc:
            if exc.code in (400, 404):
                ensure_supabase_bucket()
                file.stream.seek(0)
                retry_req = urllib.request.Request(
                    upload_url,
                    data=file.read(),
                    headers={
                        "Authorization": f"Bearer {service_key}",
                        "apikey": service_key,
                        "Content-Type": content_type,
                        "x-upsert": "true",
                    },
                    method="POST",
                )
                try:
                    with urllib.request.urlopen(retry_req, timeout=30) as resp:
                        if resp.status < 400:
                            return f"{supabase_url}/storage/v1/object/public/{bucket}/{object_path}"
                except Exception:
                    pass
            raise APIError(
                f"Failed to upload image to Supabase Storage ({exc.code})",
                status_code=502,
            ) from exc
        except urllib.error.URLError as exc:
            raise APIError(
                "Failed to reach Supabase Storage",
                status_code=502,
            ) from exc
        return f"{supabase_url}/storage/v1/object/public/{bucket}/{object_path}"

    upload_dir = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_dir, exist_ok=True)
    file.save(os.path.join(upload_dir, filename))

    return f"uploads/cars/{filename}"


def delete_image(relative_or_public_path: str) -> None:
    """Remove an image from Supabase Storage or local disk; ignore if missing."""
    if not relative_or_public_path:
        return

    sb_cfg = _supabase_storage_config()
    if sb_cfg and (
        relative_or_public_path.startswith("http://")
        or relative_or_public_path.startswith("https://")
    ):
        supabase_url, service_key, bucket = sb_cfg
        public_prefix = f"{supabase_url}/storage/v1/object/public/{bucket}/"
        if relative_or_public_path.startswith(public_prefix):
            object_path = relative_or_public_path[len(public_prefix):]
            delete_url = f"{supabase_url}/storage/v1/object/{bucket}/{object_path}"
            req = urllib.request.Request(
                delete_url,
                headers={
                    "Authorization": f"Bearer {service_key}",
                    "apikey": service_key,
                },
                method="DELETE",
            )
            try:
                with urllib.request.urlopen(req, timeout=15):
                    pass
            except urllib.error.URLError:
                pass
        return

    if relative_or_public_path.startswith("http://") or relative_or_public_path.startswith("https://"):
        return

    full_path = os.path.join(current_app.static_folder, relative_or_public_path)
    try:
        os.remove(full_path)
    except FileNotFoundError:
        pass