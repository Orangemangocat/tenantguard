"""
RQ tasks for AI blog generation + revision.

This is designed to be robust:
- Uses OpenAI if available (OPENAI_API_KEY required)
- Creates BlogPost rows with proper workflow status:
    - draft
    - pending_approval (recommended)
    - published (if publish_immediately True)
- Uses BlogPost model methods: submit_for_approval(), publish()
"""

import json
import os
import re
import unicodedata
from datetime import datetime

from flask import has_app_context

from src.main import app
from src.models.user import db
from src.models.blog import BlogPost
from src.models.blog_topic import BlogTopic
from src.services.blog_content import normalize_blog_content


def _slugify(title: str, max_len: int = 90) -> str:
    if not title:
        return "post"
    value = unicodedata.normalize("NFKD", title).encode("ascii", "ignore").decode("ascii")
    value = value.lower().strip().replace("_", " ")
    value = re.sub(r"[^a-z0-9\s-]", "", value)
    value = re.sub(r"[\s-]+", "-", value).strip("-")
    if len(value) > max_len:
        value = value[:max_len].rstrip("-")
    return value or "post"


def _ensure_unique_slug(base_slug: str) -> str:
    slug = base_slug
    counter = 2
    while BlogPost.query.filter_by(slug=slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
    return slug


def _require_openai():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set. Set it in your environment for AI blog generation.")
    try:
        from openai import OpenAI  # type: ignore
    except Exception as exc:
        raise RuntimeError(
            "openai Python package is not installed. Add `openai` to requirements.txt and rebuild."
        ) from exc
    return OpenAI(api_key=api_key)


def _run_with_app_context(callback):
    if has_app_context():
        return callback()
    with app.app_context():
        return callback()


def _parse_model_json(raw: str) -> dict:
    raw = (raw or "").strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw).strip()
    try:
        return json.loads(raw)
    except Exception:
        match = re.search(r"\{.*\}", raw, flags=re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise


def _topic_links(topic_record: BlogTopic) -> list:
    if not topic_record.research_links:
        return []
    try:
        links = json.loads(topic_record.research_links)
    except Exception:
        return []
    return links if isinstance(links, list) else []


def _build_generation_prompt(payload: dict) -> str:
    topic = payload.get("topic", "").strip()
    category = payload.get("category", "technical")
    links = payload.get("links", []) or []
    text_snippets = (payload.get("text_snippets") or "").strip()
    additional_context = (payload.get("additional_context") or "").strip()

    link_block = "\n".join(f"- {l}" for l in links) if links else "(none)"
    snippets_block = text_snippets if text_snippets else "(none)"
    context_block = additional_context if additional_context else "(none)"

    # IMPORTANT: keep TenantGuard legal constraints / tone (no guarantees).
    return f"""
You are writing a TenantGuard blog post for laypeople in Tennessee dealing with landlord–tenant issues.
This is legal education, not legal advice. Use careful language:
- "One possible argument is..."
- "This may support..."
- "Tennessee courts often consider..."
Avoid guarantees and absolutes.

TOPIC:
{topic}

CATEGORY:
{category}

SOURCES/LINKS (if helpful, you may cite or paraphrase):
{link_block}

TEXT SNIPPETS (may include product notes / admin notes / draft material):
{snippets_block}

ADDITIONAL CONTEXT:
{context_block}

OUTPUT FORMAT (STRICT JSON):
Return JSON with keys:
- title: string
- excerpt: string (<= 160 chars is ideal; <= 220 max)
- tags: array of short strings (5-12 tags)
- content_html: string (valid HTML with headings, paragraphs, lists; include H2/H3 sections)
- suggested_slug: string (optional; if you include, it must be derived from title)

CONTENT REQUIREMENTS:
- 900–1400 words
- Use scannable structure: H2 sections, bullets
- Include a "What to do next" section with 5–10 action steps
- Be accurate and cautious; no promises
- Be Tennessee-aware (general sessions / detainer warrant terminology is okay)
""".strip()


def _build_revision_prompt(post: BlogPost, revision_request: str) -> str:
    return f"""
You are revising an existing TenantGuard blog post.

RULES:
- Keep it legally cautious (no guarantees).
- Preserve the general structure unless revision request says otherwise.
- Return JSON with keys: title, excerpt, tags, content_html

REVISION REQUEST:
{revision_request}

CURRENT POST TITLE:
{post.title}

CURRENT EXCERPT:
{post.excerpt or ""}

CURRENT TAGS (comma-separated):
{post.tags or ""}

CURRENT CONTENT (HTML):
{post.content}
""".strip()


def generate_blog_post(payload: dict, submit_for_approval=None, topic_id=None):
    """
    RQ task: generate a new blog post.

    payload fields expected:
      topic, category, author, links, text_snippets, additional_context,
      llm_provider=openai, generation_source,
      requested_by_user_id,
      submit_for_approval (bool),
      publish_immediately (bool)
    """
    return _run_with_app_context(
        lambda: _generate_blog_post(payload, submit_for_approval=submit_for_approval, topic_id=topic_id)
    )


def _generate_blog_post(payload: dict, submit_for_approval=None, topic_id=None):
    payload = dict(payload or {})
    topic_record = None
    if topic_id:
        topic_record = BlogTopic.query.get(topic_id)
        if not topic_record:
            raise ValueError(f"Blog topic {topic_id} was not found")
        payload.setdefault("topic", topic_record.title)
        payload.setdefault("category", topic_record.category)
        payload.setdefault("links", _topic_links(topic_record))
        payload.setdefault("text_snippets", topic_record.research_notes or "")
        payload.setdefault("additional_context", topic_record.description or "")
        payload.setdefault("generation_source", "topic_suggestion")

    if submit_for_approval is not None:
        payload["submit_for_approval"] = bool(submit_for_approval)

    topic = (payload.get("topic") or "").strip()
    if not topic:
        raise ValueError("payload.topic is required")

    author = payload.get("author") or "TenantGuard AI"
    category = payload.get("category") or "technical"
    llm_provider = (payload.get("llm_provider") or "openai").lower()

    submit_for_approval = bool(payload.get("submit_for_approval", True))
    publish_immediately = bool(payload.get("publish_immediately", False))
    requested_by_user_id = payload.get("requested_by_user_id")

    if publish_immediately:
        submit_for_approval = False

    if llm_provider != "openai":
        raise ValueError(f"Unsupported provider: {llm_provider}")

    client = _require_openai()
    prompt = _build_generation_prompt(payload)

    # Use responses API style via chat.completions for broad compatibility.
    resp = client.chat.completions.create(
        model=os.getenv("OPENAI_BLOG_MODEL", "gpt-4o-mini"),
        messages=[
            {"role": "system", "content": "You are a careful legal-education writer for Tennessee tenants."},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=float(os.getenv("OPENAI_BLOG_TEMPERATURE", "0.6")),
    )

    raw = resp.choices[0].message.content or ""
    try:
        data = _parse_model_json(raw)
    except Exception as exc:
        raise RuntimeError(f"Model did not return valid JSON. Raw output:\n{raw}") from exc

    title = (data.get("title") or topic).strip()
    excerpt = (data.get("excerpt") or "").strip()
    tags = data.get("tags") or []
    content_html = data.get("content_html") or ""
    suggested_slug = (data.get("suggested_slug") or "").strip()

    if not excerpt:
        excerpt = title[:160]

    # Normalize tags into a comma string
    if isinstance(tags, list):
        tags_str = ",".join([str(t).strip() for t in tags if str(t).strip()])
    else:
        tags_str = str(tags).strip()

    content_html = normalize_blog_content(content_html)

    base_slug = _slugify(suggested_slug or title)
    slug = _ensure_unique_slug(base_slug)

    # Create post
    post = BlogPost(
        title=title,
        slug=slug,
        content=content_html,
        excerpt=excerpt[:500] if excerpt else None,
        category=category,
        author=author,
        status="draft",
        tags=tags_str,
        generated_by=llm_provider,
        generation_source=payload.get("generation_source") or "ai_assisted",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    # Workflow: approval/publish
    if publish_immediately:
        post.status = "approved"
        post.published_at = datetime.utcnow()
    elif submit_for_approval:
        post.status = "pending_approval"
        post.submitted_for_approval_at = datetime.utcnow()
        if requested_by_user_id:
            post.submitted_by_user_id = requested_by_user_id

    db.session.add(post)
    db.session.flush()

    if topic_record:
        topic_record.blog_post_id = post.id
        topic_record.status = "completed"
        topic_record.completed_at = datetime.utcnow()

    db.session.commit()

    if publish_immediately:
        # publish() will ping SEO and set status to published
        post.publish(source="ai_generate_publish_immediately")

    return {"success": True, "post_id": post.id}


def revise_blog_post(post_id: int, payload: dict):
    """
    RQ task: revise an existing blog post.

    payload fields:
      revision_request (required)
      llm_provider (default openai)
    """
    return _run_with_app_context(lambda: _revise_blog_post(post_id, payload))


def _revise_blog_post(post_id: int, payload: dict):
    payload = dict(payload or {})
    post = BlogPost.query.get(post_id)
    if not post:
        raise ValueError("Post not found")

    revision_request = (payload.get("revision_request") or "").strip()
    if not revision_request:
        raise ValueError("payload.revision_request is required")

    llm_provider = (payload.get("llm_provider") or post.generated_by or "openai").lower()
    if llm_provider != "openai":
        raise ValueError(f"Unsupported provider: {llm_provider}")

    client = _require_openai()
    prompt = _build_revision_prompt(post, revision_request)

    resp = client.chat.completions.create(
        model=os.getenv("OPENAI_BLOG_MODEL", "gpt-4o-mini"),
        messages=[
            {"role": "system", "content": "You revise legal-education blog posts carefully for Tennessee tenants."},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=float(os.getenv("OPENAI_BLOG_TEMPERATURE", "0.4")),
    )

    raw = resp.choices[0].message.content or ""
    try:
        data = _parse_model_json(raw)
    except Exception as exc:
        raise RuntimeError(f"Model did not return valid JSON. Raw output:\n{raw}") from exc

    title = (data.get("title") or post.title).strip()
    excerpt = (data.get("excerpt") or post.excerpt or "").strip()
    tags = data.get("tags") or []
    content_html = data.get("content_html") or post.content or ""

    if isinstance(tags, list):
        tags_str = ",".join([str(t).strip() for t in tags if str(t).strip()])
    else:
        tags_str = str(tags).strip()

    post.title = title
    post.excerpt = excerpt[:500] if excerpt else post.excerpt
    post.tags = tags_str
    post.content = normalize_blog_content(content_html)
    post.updated_at = datetime.utcnow()

    db.session.commit()
    return {"success": True, "post_id": post.id}
