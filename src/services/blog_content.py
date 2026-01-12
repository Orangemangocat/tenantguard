import re

try:
    import markdown as markdown_lib
except ImportError:  # pragma: no cover - fallback when dependency is unavailable
    markdown_lib = None


_HTML_TAG_RE = re.compile(r"</?[a-z][^>]*>", re.IGNORECASE)


def _looks_like_html(content):
    if not content:
        return False
    return bool(_HTML_TAG_RE.search(content))


def normalize_blog_content(content):
    """Return HTML content when input is markdown; leave HTML untouched."""
    if not content:
        return content
    if _looks_like_html(content):
        return content
    if markdown_lib is None:
        return content
    return markdown_lib.markdown(content, extensions=['extra', 'sane_lists'])
