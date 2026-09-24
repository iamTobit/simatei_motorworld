import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app
from .errors import APIError

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}

def allowed_file(filename: str) -> bool:
    return "." in filename and \
           filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def save_image(file) -> str:
    """Save an uploaded FileStorage and return its relative path (for CarImage.url)."""
    if not file or not file.filename:
        raise APIError("Empty file", status_code=400)
    if not allowed_file(file.filename):
        raise APIError(f"Unsupported file type: {file.filename}", status_code=400)

    ext = file.filename.rsplit(".", 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    # secure_filename strips dangerous chars; uuid already makes it unique
    filename = secure_filename(filename)

    upload_dir = current_app.config["UPLOAD_FOLDER"]  # e.g. 'static/uploads/cars'
    os.makedirs(upload_dir, exist_ok=True)
    file.save(os.path.join(upload_dir, filename))

    # Return path relative to /static so url_for('static', filename=...) works
    # e.g. "uploads/cars/abc123.jpg"
    return f"uploads/cars/{filename}"


def delete_image(relative_path: str) -> None:
    """Remove a file from disk; ignore if missing."""
    if not relative_path:
        return
    full_path = os.path.join(current_app.static_folder, relative_path)
    try:
        os.remove(full_path)
    except FileNotFoundError:
        pass