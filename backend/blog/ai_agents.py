import os
import re
import openai
import markdown as md
from html.parser import HTMLParser
from openai import OpenAI
from django.conf import settings
import requests
from django.core.files.base import ContentFile
from .models import Post, Category
from django.utils.text import slugify
from pathlib import Path


class _TextExtractor(HTMLParser):
    """Minimal HTML-to-text stripper using stdlib only."""
    def __init__(self):
        super().__init__()
        self._parts = []
        self._skip = False

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "nav", "footer", "header"):
            self._skip = True

    def handle_endtag(self, tag):
        if tag in ("script", "style", "nav", "footer", "header"):
            self._skip = False
        if tag in ("p", "br", "li", "h1", "h2", "h3", "h4", "h5", "h6", "tr"):
            self._parts.append("\n")

    def handle_data(self, data):
        if not self._skip:
            self._parts.append(data)

    def get_text(self):
        return re.sub(r'\n{3,}', '\n\n', "".join(self._parts)).strip()


def _fetch_url_text(url: str, max_chars: int = 4000) -> str:
    """Fetch a URL and return its readable text content, truncated to max_chars."""
    try:
        resp = requests.get(url, timeout=10, headers={"User-Agent": "TenantGuard-BlogBot/1.0"})
        resp.raise_for_status()
        parser = _TextExtractor()
        parser.feed(resp.text)
        text = parser.get_text()
        if len(text) > max_chars:
            text = text[:max_chars] + "\n[… truncated]"
        return text
    except Exception as e:
        return f"[Could not fetch {url}: {e}]"

class BaseAgent:
    def __init__(self, model="gpt-4o-mini"):
        self.model = model
        self.api_key = os.getenv("OPENAI_API_KEY")
        if self.api_key:
            self.client = OpenAI(api_key=self.api_key)
        else:
            self.client = None

    def call_ai(self, system_prompt, user_prompt, temperature=0.7):
        if not self.client:
            return f"[SIMULATED] Response for: {user_prompt[:50]}..."
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
        )
        return response.choices[0].message.content

class ContextualResearcherAgent(BaseAgent):
    """Reads project documentation to ensure the blog is aligned with TenantGuard's mission."""
    
    def gather_context(self):
        base_path = Path(settings.BASE_DIR).parent
        important_files = [
            "docs/control-plane/01_PROJECT_CONTEXT/PRODUCT_VISION.md",
            "docs/control-plane/01_PROJECT_CONTEXT/TARGET_USERS.md",
            "knowledge-repo/knowledge/DOMAIN_MODEL.md",
            "knowledge-repo/knowledge/INTERNAL_RULES_AND_HEURISTICS.md"
        ]
        
        context_parts = []
        for rel_path in important_files:
            full_path = base_path / rel_path
            if full_path.exists():
                with open(full_path, 'r') as f:
                    content = f.read()
                    context_parts.append(f"--- FILE: {rel_path} ---\n{content}")
        
        return "\n\n".join(context_parts)

    def research_topic(self, topic, url_context: str = ""):
        context = self.gather_context()
        system_prompt = (
            "You are the Head of Research at TenantGuard. Your job is to analyze a blog topic "
            "and provide a 'Briefing Note' for the author. This note MUST align the topic with "
            "TenantGuard's mission, specific audience (Tennessee tenants), and brand voice (Precision, Clarity)."
        )
        url_section = (
            f"\n\nAdditional reference material provided by the editor:\n{url_context}"
            if url_context else ""
        )
        user_prompt = (
            f"Topic: {topic}\n\n"
            f"Here is the TenantGuard Project Context:\n{context}"
            f"{url_section}\n\n"
            "Please provide a Briefing Note that includes:\n"
            "1. Core Narrative: How this topic serves our mission.\n"
            "2. Audience Angle: How this specifically helps a tenant in Davidson County, TN.\n"
            "3. Key Facts: Important domain rules or entities from our context to mention.\n"
            "4. Tone Guide: Specific advice on how to write this for a 'stressed non-lawyer'."
        )
        return self.call_ai(system_prompt, user_prompt)

class TopicsAgent(BaseAgent):
    def get_topics(self, theme="Tenant Rights and Protection"):
        system_prompt = (
            "You are an expert content strategist specializing in housing and tenant rights. "
            "Your goal is to come up with 5 engaging, timely, and valuable blog post topics."
        )
        user_prompt = (
            f"Based on the theme '{theme}', suggest 5 interesting blog post topics for a modern audience. "
            "Explain why each topic is interesting. Choose one as the 'Top Recommendation'."
        )
        return self.call_ai(system_prompt, user_prompt)

class BlogAuthorAgent(BaseAgent):
    def write_article(self, topic, research_brief, previous_content=None, feedback=None):
        system_prompt = (
            "You are a staff writer for TenantGuard, a tenant rights publication based in Tennessee. "
            "You have a background in journalism and housing advocacy. You write the way a knowledgeable "
            "human writer does: direct, occasionally informal, grounded in real situations that tenants face. "
            "You explain legal concepts in plain English without being condescending. "
            "Your readers are stressed, non-lawyers dealing with a landlord problem right now.\n\n"
            "WRITING RULES — follow these strictly:\n"
            "- Never use the words: delve, leverage (as a verb), robust, utilize, game-changer, landscape, "
            "navigate, realm, embark, foster, pivotal, crucial, paramount, multifaceted, nuanced, "
            "it's worth noting, it's important to note, in conclusion, furthermore, moreover.\n"
            "- Don't open sentences with 'Additionally' or 'Furthermore'.\n"
            "- Vary sentence length. Mix short punchy sentences with longer ones.\n"
            "- Don't over-structure. Use subheadings where they help, but prefer flowing prose over "
            "bullet-point lists whenever possible.\n"
            "- Be specific. Use real county names, dollar amounts, day counts from Tennessee law where relevant.\n"
            "- Sound like a person who has seen these situations play out, not a text generator."
        )
        if previous_content and feedback:
            user_prompt = (
                f"Topic: {topic}\n"
                f"Research Briefing:\n{research_brief}\n\n"
                f"PREVIOUS DRAFT:\n{previous_content}\n\n"
                f"EDITOR FEEDBACK:\n{feedback}\n\n"
                "Revise the article based on the editor's feedback. Keep what works, fix what doesn't. "
                "Apply the same writing rules as before. Use Markdown for formatting."
            )
        else:
            user_prompt = (
                f"Topic: {topic}\n"
                f"Research Briefing:\n{research_brief}\n\n"
                "Write a comprehensive blog post based on this brief. "
                "Include a strong opening that hooks the reader with a concrete scenario or fact, "
                "several informative sections with subheadings, and a practical closing that tells the reader "
                "what to do next. Use Markdown for formatting."
            )
        return self.call_ai(system_prompt, user_prompt)

class FeaturedImageCreatorAgent(BaseAgent):
    def generate_image_prompt(self, title, content, previous_prompt=None, feedback=None):
        system_prompt = (
            "You are a creative director specialized in visual storytelling for blogs. "
            "Your task is to describe a compelling featured image that complements the blog's content."
        )
        if previous_prompt and feedback:
            user_prompt = (
                f"Blog title: '{title}'\n\n"
                f"Previous image prompt:\n{previous_prompt}\n\n"
                f"Editor feedback:\n{feedback}\n\n"
                "Revise the image prompt based on the feedback. Return only the revised prompt text."
            )
        else:
            user_prompt = (
                f"Given the blog title '{title}' and its content, describe a visually striking featured image. "
                "Provide a detailed prompt that could be used in DALL-E 3."
            )
        return self.call_ai(system_prompt, user_prompt)

    def generate_image(self, prompt):
        if not self.client:
            return None
        
        try:
            response = self.client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                quality="standard",
                n=1,
            )
            image_url = response.data[0].url
            return image_url
        except Exception as e:
            print(f"Image generation error: {e}")
            return None

class SEOOptimizerAgent(BaseAgent):
    def optimize(self, title, content):
        system_prompt = (
            "You are an SEO specialist for a tenant rights publication. "
            "Your meta titles and descriptions should sound like they were written by a human editor, "
            "not a content tool. Avoid generic filler phrases. Be specific and direct."
        )
        user_prompt = (
            f"Optimize this blog post for SEO.\nTitle: {title}\nContent: {content[:1000]}...\n\n"
            "Return ONLY the following three items, each on its own labeled line:\n"
            "META_TITLE: (max 60 chars, reads naturally — no AI buzzwords)\n"
            "META_DESCRIPTION: (max 160 chars, reads like a human wrote it — specific, not generic)\n"
            "TAGS: (5-10 topically relevant tags, comma-separated — no tags like 'AI', 'Generated', "
            "'content', or other meta/process words; use subject-matter terms only)"
        )
        return self.call_ai(system_prompt, user_prompt)

class FactCheckerReviewerAgent(BaseAgent):
    def review(self, content):
        system_prompt = (
            "You are a meticulous fact-checker and copy editor at TenantGuard. "
            "Your goals are accuracy, natural voice, and readability."
        )
        user_prompt = (
            "Review this blog post for three things:\n"
            "1. Factual accuracy — flag any legal claims that seem incorrect or overly broad.\n"
            "2. Grammar and clarity — note any awkward or confusing sentences.\n"
            "3. AI writing patterns — flag any phrases that sound like a language model wrote them "
            "(e.g. 'delve into', 'it's worth noting', 'in today's landscape', 'game-changer', "
            "excessive bullet lists where prose would read better, or an overly formal register). "
            "Suggest more natural alternatives.\n\n"
            "If no issues are found in a category, say so briefly. "
            "If everything is clean across all three, say 'Review Passed'.\n\n"
            f"{content}"
        )
        return self.call_ai(system_prompt, user_prompt)

class BlogGeneratorWorkflow:
    def __init__(self):
        self.researcher_agent = ContextualResearcherAgent()
        self.topics_agent = TopicsAgent()
        self.author_agent = BlogAuthorAgent()
        self.image_agent = FeaturedImageCreatorAgent()
        self.seo_agent = SEOOptimizerAgent()
        self.reviewer_agent = FactCheckerReviewerAgent()

    def run_step_1(self, theme):
        return self.topics_agent.get_topics(theme)

    def run_step_2(self, topic, context_urls: list = None):
        url_context = ""
        if context_urls:
            fetched = []
            for url in context_urls:
                url = url.strip()
                if url:
                    text = _fetch_url_text(url)
                    fetched.append(f"--- Source: {url} ---\n{text}")
            if fetched:
                url_context = "\n\n".join(fetched)

        brief = self.researcher_agent.research_topic(topic, url_context)
        content = self.author_agent.write_article(topic, brief)
        review = self.reviewer_agent.review(content)
        seo = self.seo_agent.optimize(topic, content)
        return {
            "research_brief": brief,
            "content": content,
            "review": review,
            "seo": seo
        }

    def run_step_2_revision(self, topic, previous_content, feedback, research_brief, context_urls=None):
        # Re-fetch URLs only if new ones were supplied
        url_context = ""
        if context_urls:
            fetched = []
            for url in context_urls:
                url = url.strip()
                if url:
                    text = _fetch_url_text(url)
                    fetched.append(f"--- Source: {url} ---\n{text}")
            if fetched:
                url_context = "\n\n".join(fetched)

        # Keep the original research brief; re-run it only if somehow missing
        if not research_brief:
            research_brief = self.researcher_agent.research_topic(topic, url_context)

        content = self.author_agent.write_article(
            topic, research_brief, previous_content=previous_content, feedback=feedback
        )
        review = self.reviewer_agent.review(content)
        seo = self.seo_agent.optimize(topic, content)
        return {
            "research_brief": research_brief,
            "content": content,
            "review": review,
            "seo": seo,
        }

    def run_step_3(self, title, content):
        image_prompt = self.image_agent.generate_image_prompt(title, content)
        image_url = self.image_agent.generate_image(image_prompt)
        return {
            "image_prompt": image_prompt,
            "image_url": image_url
        }

    def run_step_3_revision(self, title, content, previous_image_prompt, feedback):
        image_prompt = self.image_agent.generate_image_prompt(
            title, content, previous_prompt=previous_image_prompt, feedback=feedback
        )
        image_url = self.image_agent.generate_image(image_prompt)
        return {
            "image_prompt": image_prompt,
            "image_url": image_url,
        }

    def update_post(self, post_id, title, content, meta_title, meta_description, tags, image_url=None):
        clean_title = re.sub(r'^\s*#+\s*', '', title.strip())
        clean_title = re.sub(r'[\*_]{1,3}(.*?)[\*_]{1,3}', r'\1', clean_title)
        clean_title = clean_title.strip('"').strip()

        clean_content = md.markdown(content, extensions=['extra', 'nl2br', 'sane_lists'])

        post = Post.objects.get(pk=post_id)
        post.title = clean_title
        post.content = clean_content
        post.meta_title = meta_title or clean_title
        post.meta_description = meta_description or ''

        if tags:
            tag_list = [t.strip() for t in tags.split(',') if t.strip()]
            post.tags.set(*tag_list)

        if image_url and image_url.startswith('http'):
            # Only re-download if it looks like a generation URL (not an already-stored media URL)
            stored_url = post.featured_image.url if post.featured_image else ''
            if image_url != stored_url:
                try:
                    response = requests.get(image_url, timeout=10)
                    if response.status_code == 200:
                        file_name = f"{slugify(clean_title)}.png"
                        post.featured_image.save(file_name, ContentFile(response.content), save=False)
                except Exception as e:
                    print(f"Error updating image: {e}")

        post.save()
        return post

    def save_post(self, title, content, meta_title, meta_description, tags, author_id, image_url=None):
        from django.contrib.auth.models import User
        author = User.objects.get(id=author_id)

        # Strip markdown bold/italic markers and leading heading characters from the title
        clean_title = re.sub(r'^\s*#+\s*', '', title.strip())   # remove leading # chars
        clean_title = re.sub(r'[\*_]{1,3}(.*?)[\*_]{1,3}', r'\1', clean_title)  # remove **..** / *..* / __..__ etc.
        clean_title = clean_title.strip('"').strip()  # remove any surrounding quotes left by the AI

        # Convert markdown body to HTML so CKEditor-stored content renders correctly
        clean_content = md.markdown(
            content,
            extensions=['extra', 'nl2br', 'sane_lists'],
        )

        post = Post.objects.create(
            title=clean_title,
            content=clean_content,
            author=author,
            meta_title=meta_title,
            meta_description=meta_description,
            status='draft'
        )
        
        if tags:
            tag_list = [t.strip() for t in tags.split(",")]
            post.tags.add(*tag_list)

        if image_url:
            try:
                response = requests.get(image_url, timeout=10)
                if response.status_code == 200:
                    file_name = f"{slugify(clean_title)}.png"
                    post.featured_image.save(file_name, ContentFile(response.content), save=True)
            except Exception as e:
                print(f"Error saving image: {e}")
        
        return post
