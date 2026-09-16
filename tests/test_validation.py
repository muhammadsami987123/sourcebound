"""Tests for URL, file, and chat message validation."""
import pytest

from app.utils.validation import (
    ValidationError,
    validate_chat_message,
    validate_file_extension,
    validate_file_size,
    validate_url,
)
from app.config import settings


def test_valid_url():
    assert validate_url("https://example.com") == "https://example.com"


def test_invalid_url_malformed():
    with pytest.raises(ValidationError):
        validate_url("not a url")


def test_unsupported_protocol_file():
    with pytest.raises(ValidationError):
        validate_url("file:///etc/passwd")


def test_unsupported_protocol_javascript():
    with pytest.raises(ValidationError):
        validate_url("javascript:alert(1)")


def test_unsupported_protocol_ftp():
    with pytest.raises(ValidationError):
        validate_url("ftp://example.com/file.txt")


def test_empty_url():
    with pytest.raises(ValidationError):
        validate_url("")


def test_oversized_url():
    long_url = "https://example.com/" + ("a" * 3000)
    with pytest.raises(ValidationError):
        validate_url(long_url)


def test_valid_file_extension():
    assert validate_file_extension("document.pdf") == ".pdf"
    assert validate_file_extension("notes.txt") == ".txt"
    assert validate_file_extension("readme.md") == ".md"


def test_unsupported_file_extension():
    with pytest.raises(ValidationError):
        validate_file_extension("archive.zip")


def test_empty_filename():
    with pytest.raises(ValidationError):
        validate_file_extension("")


def test_valid_file_size():
    validate_file_size(1024)  # should not raise


def test_empty_file_size():
    with pytest.raises(ValidationError):
        validate_file_size(0)


def test_oversized_file_size():
    with pytest.raises(ValidationError):
        validate_file_size(settings.MAX_UPLOAD_SIZE_BYTES + 1)


def test_empty_chat_message():
    with pytest.raises(ValidationError):
        validate_chat_message("")


def test_excessively_long_chat_message():
    long_message = "a" * (settings.MAX_CHAT_MESSAGE_LENGTH + 1)
    with pytest.raises(ValidationError):
        validate_chat_message(long_message)


def test_valid_chat_message():
    assert validate_chat_message("What is this about?") == "What is this about?"
