"""Website URL fetching and readable-text extraction."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import httpx
from bs4 import BeautifulSoup

from app.config import settings

ALLOWED_CONTENT_TYPES = ("text/html", "application/xhtml+xml")


@dataclass
class URLFetchResult:
    text: str
    title: str
    char_count: int


class URLLoadError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


_STRIP_TAGS = ["script", "style", "nav", "footer", "header", "noscript", "iframe", "svg", "form", "aside"]


def fetch_and_extract(url: str) -> URLFetchResult:
    """Fetch the URL and extract readable text. Raises URLLoadError on any failure."""
    timeout = settings.URL_REQUEST_TIMEOUT_SECONDS
    max_size = settings.MAX_URL_CONTENT_SIZE_BYTES

    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; Sourcebound/1.0; +https://example.com/bot)"
    }

    try:
        with httpx.Client(follow_redirects=True, timeout=timeout, headers=headers) as client:
            with client.stream("GET", url) as response:
                if response.status_code >= 400:
                    raise URLLoadError(f"The website returned an error status ({response.status_code}).")

                content_type = response.headers.get("content-type", "").lower()
                if content_type and not any(ct in content_type for ct in ALLOWED_CONTENT_TYPES):
                    raise URLLoadError(f"Unsupported content type: {content_type.split(';')[0]}")

                chunks = []
                total = 0
                for data in response.iter_bytes():
                    total += len(data)
                    if total > max_size:
                        raise URLLoadError("The page content is too large to process.")
                    chunks.append(data)
                raw_bytes = b"".join(chunks)
    except httpx.TimeoutException:
        raise URLLoadError("The website could not be reached (request timed out).")
    except httpx.ConnectError:
        raise URLLoadError("The website could not be reached (connection failed).")
    except httpx.RequestError as exc:
        raise URLLoadError(f"Network error while fetching the website: {exc}")
    except URLLoadError:
        raise
    except Exception as exc:
        raise URLLoadError(f"Failed to fetch the website: {exc}")

    if not raw_bytes:
        raise URLLoadError("This website returned no content.")

    try:
        html = raw_bytes.decode("utf-8", errors="replace")
        soup = BeautifulSoup(html, "html.parser")
    except Exception as exc:
        raise URLLoadError(f"Failed to parse the website content: {exc}")

    for tag_name in _STRIP_TAGS:
        for tag in soup.find_all(tag_name):
            tag.decompose()

    title_tag = soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else url

    body = soup.body if soup.body else soup
    text = body.get_text(separator="\n")

    if not text or not text.strip():
        raise URLLoadError("This website contains no readable text.")

    return URLFetchResult(text=text, title=title or url, char_count=len(text))
