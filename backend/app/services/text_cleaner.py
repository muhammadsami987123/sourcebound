"""Text cleaning and normalization utilities."""
from __future__ import annotations

import re

_MULTI_SPACE_RE = re.compile(r"[ \t ]+")
_MULTI_BLANK_LINE_RE = re.compile(r"\n{3,}")
_TRAILING_SPACE_RE = re.compile(r"[ \t]+\n")

# Lines that look like nav/footer clutter (short, repeated boilerplate)
_NAV_NOISE_PATTERNS = [
    re.compile(r"^\s*(home|menu|login|sign up|sign in|subscribe|cookie policy|privacy policy|terms of service|all rights reserved|©.*)\s*$", re.IGNORECASE),
]


def clean_text(raw_text: str) -> str:
    """Clean and normalize extracted text while preserving paragraph meaning."""
    if not raw_text:
        return ""

    text = raw_text.replace("\r\n", "\n").replace("\r", "\n")

    lines = text.split("\n")
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            cleaned_lines.append("")
            continue
        if any(p.match(stripped) for p in _NAV_NOISE_PATTERNS):
            continue
        # collapse internal repeated whitespace
        stripped = _MULTI_SPACE_RE.sub(" ", stripped)
        cleaned_lines.append(stripped)

    text = "\n".join(cleaned_lines)
    text = _MULTI_BLANK_LINE_RE.sub("\n\n", text)
    text = text.strip()
    return text


def normalize_text(text: str) -> str:
    """Final normalization pass prior to chunking."""
    if not text:
        return ""
    # Ensure single spaces, unify quotes/dashes lightly, keep content intact.
    text = text.replace("‘", "'").replace("’", "'")
    text = text.replace("“", '"').replace("”", '"')
    text = text.replace("–", "-").replace("—", "-")
    return text.strip()


def is_meaningful_text(text: str, min_chars: int = 50) -> bool:
    """Check whether extracted text is meaningful enough to process."""
    if not text:
        return False
    stripped = text.strip()
    if len(stripped) < min_chars:
        return False
    # Require some alphabetic content
    alpha_count = sum(1 for c in stripped if c.isalpha())
    return alpha_count >= min_chars * 0.3
