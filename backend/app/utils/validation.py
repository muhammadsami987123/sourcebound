"""Validation helpers for URLs, uploaded files and chat requests."""
from __future__ import annotations

import os
import re
from urllib.parse import urlparse

from app.config import settings

ALLOWED_SCHEMES = {"http", "https"}
BLOCKED_SCHEMES = {"file", "javascript", "ftp", "data", "blob"}


class ValidationError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


def validate_url(url: str) -> str:
    """Validate a URL string, returning the normalized URL or raising ValidationError."""
    if url is None or not str(url).strip():
        raise ValidationError("URL is required.")

    url = url.strip()

    if len(url) > settings.MAX_URL_LENGTH:
        raise ValidationError(f"URL exceeds maximum length of {settings.MAX_URL_LENGTH} characters.")

    try:
        parsed = urlparse(url)
    except Exception:
        raise ValidationError("URL is malformed.")

    scheme = (parsed.scheme or "").lower()

    if not scheme:
        raise ValidationError("URL must include a scheme (http:// or https://).")

    if scheme in BLOCKED_SCHEMES:
        raise ValidationError(f"Unsupported or unsafe URL protocol: {scheme}")

    if scheme not in ALLOWED_SCHEMES:
        raise ValidationError("Only http and https URLs are supported.")

    if not parsed.netloc:
        raise ValidationError("URL is malformed: missing host.")

    # Basic host sanity check
    host = parsed.netloc.split("@")[-1].split(":")[0]
    if not re.match(r"^[A-Za-z0-9.\-]+$", host):
        raise ValidationError("URL host is invalid.")

    return url


def validate_file_extension(filename: str) -> str:
    if not filename or not filename.strip():
        raise ValidationError("A filename is required.")
    ext = os.path.splitext(filename)[1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(settings.ALLOWED_EXTENSIONS))
        raise ValidationError(f"Unsupported file extension '{ext}'. Allowed: {allowed}")
    return ext


def validate_mime_type(content_type: str | None, extension: str) -> None:
    if not content_type:
        return  # not all clients provide this; extension is authoritative
    content_type = content_type.lower().split(";")[0].strip()
    if content_type not in settings.ALLOWED_MIME_TYPES:
        # Be lenient: many browsers send odd mime types for .md files.
        # Only hard-reject clearly wrong categories (e.g. image/*, video/*).
        if content_type.startswith(("image/", "video/", "audio/", "application/zip",
                                     "application/x-msdownload", "application/vnd")):
            raise ValidationError(f"Unsupported MIME type '{content_type}' for extension '{extension}'.")


def validate_file_size(size_bytes: int) -> None:
    if size_bytes <= 0:
        raise ValidationError("The uploaded file is empty.")
    if size_bytes > settings.MAX_UPLOAD_SIZE_BYTES:
        raise ValidationError(
            f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )


def sanitize_filename_component(filename: str) -> str:
    """Return a safe base name (no directories, no traversal) purely for display."""
    name = os.path.basename(filename or "")
    name = name.replace("\\", "").replace("/", "")
    name = re.sub(r"[^A-Za-z0-9 ._\-]", "_", name)
    return name[:255] if name else "upload"


def validate_chat_message(message: str) -> str:
    if message is None or not str(message).strip():
        raise ValidationError("Message is required.")
    message = message.strip()
    if len(message) > settings.MAX_CHAT_MESSAGE_LENGTH:
        raise ValidationError(
            f"Message exceeds maximum length of {settings.MAX_CHAT_MESSAGE_LENGTH} characters."
        )
    return message
