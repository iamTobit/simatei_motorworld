import re

PHONE_RE = re.compile(r"^\+?[0-9\s\-()]{7,20}$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PASSWORD_RE = re.compile(r"^(?=.*[0-9])(?=.*[!@#$%^&*(),.?\":{}|<>]).{8,}$")


def is_valid_phone(phone):
    return bool(phone and PHONE_RE.match(phone))


def is_valid_email(email):
    return bool(email and EMAIL_RE.match(email))


def is_strong_password(password):
    return bool(password and PASSWORD_RE.match(password))


def whatsapp_link(phone: str, message: str) -> str:
    from urllib.parse import quote

    clean = re.sub(r"[^0-9]", "", phone or "")
    return f"https://wa.me/{clean}?text={quote(message)}"