"""Tests for text cleaning and chunking."""
from app.services.chunker import chunk_text
from app.services.text_cleaner import clean_text, is_meaningful_text, normalize_text
from app.services.url_loader import URLFetchResult


def test_html_text_extraction_strips_scripts_and_styles():
    from bs4 import BeautifulSoup

    html = """
    <html><head><style>.a{}</style></head>
    <body>
        <script>alert(1)</script>
        <nav>Home | About</nav>
        <p>Real content here.</p>
        <footer>Copyright 2024</footer>
    </body></html>
    """
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup.find_all(["script", "style", "nav", "footer"]):
        tag.decompose()
    text = soup.get_text(separator="\n")
    assert "alert" not in text
    assert "Real content here." in text
    assert "Copyright" not in text


def test_text_cleaning_collapses_whitespace_and_blank_lines():
    raw = "Hello    world\n\n\n\n\nSecond   paragraph"
    cleaned = clean_text(raw)
    assert "    " not in cleaned
    assert "\n\n\n" not in cleaned
    assert "Hello world" in cleaned
    assert "Second paragraph" in cleaned


def test_text_cleaning_removes_nav_noise_lines():
    raw = "Home\nReal paragraph content that matters.\nAll rights reserved."
    cleaned = clean_text(raw)
    assert "Home" not in cleaned.split("\n")
    assert "Real paragraph content that matters." in cleaned


def test_normalize_text_unifies_quotes():
    raw = "“Hello” ‘world’"
    normalized = normalize_text(raw)
    assert '"Hello"' in normalized
    assert "'world'" in normalized


def test_is_meaningful_text_rejects_short_content():
    assert not is_meaningful_text("short")
    assert not is_meaningful_text("")


def test_is_meaningful_text_accepts_long_content():
    text = "This is a reasonably long piece of meaningful text content. " * 3
    assert is_meaningful_text(text)


def test_chunk_creation_basic():
    text = "a" * 2500
    chunks = chunk_text(text, chunk_size=1000, chunk_overlap=100)
    assert len(chunks) >= 2
    for c in chunks:
        assert len(c) <= 1000


def test_chunk_overlap_present():
    text = "0123456789" * 200  # 2000 chars
    chunks = chunk_text(text, chunk_size=1000, chunk_overlap=200)
    assert len(chunks) >= 2
    # Verify overlapping content exists between consecutive chunks
    overlap_region = chunks[0][-200:]
    assert overlap_region in chunks[1] or chunks[1].startswith(overlap_region[-50:])


def test_empty_content_handling():
    assert chunk_text("") == []
    assert chunk_text("   ") == []
    assert chunk_text(None) == []


def test_duplicate_chunk_prevention():
    text = "Repeated content block. " * 5
    # Force duplicate-producing scenario with tiny chunk size and no overlap
    chunks = chunk_text(text * 4, chunk_size=len(text), chunk_overlap=0)
    seen = set()
    for c in chunks:
        key = c.strip().lower()
        assert key not in seen
        seen.add(key)


def test_tiny_fragments_filtered():
    text = "Hello world, this is a normal sentence that is long enough. " + "x"
    chunks = chunk_text(text, chunk_size=60, chunk_overlap=5)
    for c in chunks:
        assert len(c) >= 20
