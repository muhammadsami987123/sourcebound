"""Local document text extraction for PDF, TXT and Markdown files."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


class DocumentLoadError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


@dataclass
class DocumentExtractResult:
    text: str
    char_count: int


def extract_text(file_path: Path, extension: str) -> DocumentExtractResult:
    extension = extension.lower()
    if extension == ".pdf":
        text = _extract_pdf(file_path)
    elif extension in (".txt", ".md"):
        text = _extract_plain_text(file_path)
    else:
        raise DocumentLoadError(f"Unsupported file extension: {extension}")

    if not text or not text.strip():
        raise DocumentLoadError("This document contains no readable text.")

    return DocumentExtractResult(text=text, char_count=len(text))


def _extract_pdf(file_path: Path) -> str:
    try:
        from pypdf import PdfReader
    except ImportError:  # pragma: no cover
        raise DocumentLoadError("PDF support is not available on the server.")

    try:
        reader = PdfReader(str(file_path))
    except Exception as exc:
        raise DocumentLoadError(f"The PDF file could not be read (corrupted or invalid): {exc}")

    if getattr(reader, "is_encrypted", False):
        try:
            reader.decrypt("")
        except Exception:
            raise DocumentLoadError("The PDF file is password-protected and cannot be processed.")

    try:
        pages_text = []
        for page in reader.pages:
            page_text = page.extract_text() or ""
            pages_text.append(page_text)
        text = "\n\n".join(pages_text)
    except Exception as exc:
        raise DocumentLoadError(f"Failed to extract text from PDF: {exc}")

    return text


def _extract_plain_text(file_path: Path) -> str:
    try:
        raw = file_path.read_bytes()
    except OSError as exc:
        raise DocumentLoadError(f"Failed to read the uploaded file: {exc}")

    if not raw:
        raise DocumentLoadError("The uploaded file is empty.")

    for encoding in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue

    raise DocumentLoadError("The uploaded file could not be decoded as text.")
