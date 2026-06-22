"""
TenantGuard — Auto Blog Post Generator
=======================================
Management command that generates a complete blog post using the
BlogGeneratorWorkflow pipeline (research → write → image → save).

Usage:
    python manage.py auto_generate_blog_post
    python manage.py auto_generate_blog_post --topic "Eviction Notice Tennessee"
    python manage.py auto_generate_blog_post --topic "Eviction Notice" --publish
    python manage.py auto_generate_blog_post --author-id 1 --publish
    python manage.py auto_generate_blog_post --custom-content /path/to/content.md --title "My Title" --publish

This command is designed to be run:
  - Manually by an admin
  - Via a cron job / Cloud Scheduler for automated weekly posts
  - Via a CI/CD pipeline trigger

Environment variables required:
  OPENAI_API_KEY — must be set for AI generation to work
"""
import os
import sys
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Auto-generate a blog post using the AI pipeline and save it as a draft (or published).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--topic',
            type=str,
            default=None,
            help='Specific topic to write about. If omitted, the AI picks from predefined tenant-rights topics.',
        )
        parser.add_argument(
            '--theme',
            type=str,
            default='Tenant Rights',
            help='Theme to use when auto-selecting a topic (default: "Tenant Rights").',
        )
        parser.add_argument(
            '--author-id',
            type=int,
            default=None,
            help='User ID of the post author. Defaults to the first superuser.',
        )
        parser.add_argument(
            '--publish',
            action='store_true',
            default=False,
            help='Publish the post immediately instead of saving as draft.',
        )
        parser.add_argument(
            '--no-image',
            action='store_true',
            default=False,
            help='Skip image generation (faster, saves API credits).',
        )
        parser.add_argument(
            '--context-urls',
            type=str,
            default=None,
            help='Comma-separated list of URLs for the researcher agent to read.',
        )
        parser.add_argument(
            '--custom-content',
            type=str,
            default=None,
            help='Path to a Markdown file to use as the post content instead of generating it.',
        )
        parser.add_argument(
            '--title',
            type=str,
            default=None,
            help='Post title (required when --custom-content is used).',
        )

    def handle(self, *args, **options):
        from blog.ai_agents import BlogGeneratorWorkflow

        # ── Validate OPENAI_API_KEY ────────────────────────────────────────
        if not os.getenv('OPENAI_API_KEY'):
            raise CommandError('OPENAI_API_KEY is not set. Cannot generate blog post.')

        # ── Resolve author ─────────────────────────────────────────────────
        author_id = options['author_id']
        if author_id:
            try:
                author = User.objects.get(pk=author_id)
            except User.DoesNotExist:
                raise CommandError(f'No user with id={author_id}')
        else:
            author = User.objects.filter(is_superuser=True).order_by('id').first()
            if not author:
                raise CommandError('No superuser found. Pass --author-id explicitly.')

        self.stdout.write(f'Author: {author.username} (id={author.id})')

        workflow = BlogGeneratorWorkflow()

        # ── Custom content path ────────────────────────────────────────────
        if options['custom_content']:
            content_path = options['custom_content']
            if not os.path.exists(content_path):
                raise CommandError(f'File not found: {content_path}')
            with open(content_path, 'r') as f:
                raw_content = f.read()
            title = options['title']
            if not title:
                raise CommandError('--title is required when using --custom-content')

            self.stdout.write(f'Using custom content from: {content_path}')
            self.stdout.write(f'Title: {title}')

            # Generate SEO metadata
            self.stdout.write('Generating SEO metadata...')
            seo = workflow.seo_agent.optimize(title, raw_content)
            meta_title = seo.get('meta_title', title)
            meta_description = seo.get('meta_description', '')
            tags = seo.get('tags', '')

            # Generate image
            image_url = None
            if not options['no_image']:
                self.stdout.write('Generating featured image...')
                try:
                    step3 = workflow.run_step_3(title, raw_content)
                    image_url = step3.get('image_url')
                    self.stdout.write(f'Image URL: {image_url}')
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'Image generation failed: {e}'))

            # Save post
            post = workflow.save_post(
                title=title,
                content=raw_content,
                meta_title=meta_title,
                meta_description=meta_description,
                tags=tags if isinstance(tags, str) else ', '.join(tags),
                author_id=author.id,
                image_url=image_url,
            )

        else:
            # ── AI-generated content ───────────────────────────────────────
            topic = options['topic']
            context_urls = []
            if options['context_urls']:
                context_urls = [u.strip() for u in options['context_urls'].split(',') if u.strip()]

            # Step 1: Pick topic if not provided
            if not topic:
                self.stdout.write(f'Selecting topic for theme: "{options["theme"]}"...')
                try:
                    step1 = workflow.run_step_1(options['theme'])
                    topics = step1.get('topics', [])
                    if not topics:
                        raise CommandError('No topics returned from AI. Check OPENAI_API_KEY.')
                    topic = topics[0]
                    if isinstance(topic, dict):
                        topic_title = topic.get('title', str(topic))
                        topic_desc = topic.get('description', '')
                        topic = {'title': topic_title, 'description': topic_desc}
                    self.stdout.write(f'Selected topic: {topic_title if isinstance(topic, dict) else topic}')
                except Exception as e:
                    raise CommandError(f'Step 1 (topic selection) failed: {e}')
            else:
                self.stdout.write(f'Using provided topic: {topic}')

            # Step 2: Generate content
            self.stdout.write('Generating article content (this may take 30–60 seconds)...')
            try:
                step2 = workflow.run_step_2(topic, context_urls)
                content = step2.get('content', '')
                seo = step2.get('seo', {})
                if not content:
                    raise CommandError('No content returned from AI.')
                self.stdout.write(f'Content generated ({len(content)} chars)')
            except Exception as e:
                raise CommandError(f'Step 2 (content generation) failed: {e}')

            # Extract title from content (first H1 line) or SEO
            title = seo.get('meta_title', '')
            if not title:
                for line in content.split('\n'):
                    line = line.strip()
                    if line.startswith('# '):
                        title = line[2:].strip()
                        break
            if not title:
                title = topic if isinstance(topic, str) else topic.get('title', 'Tenant Rights Guide')

            meta_title = seo.get('meta_title', title)
            meta_description = seo.get('meta_description', '')
            tags = seo.get('tags', '')
            if isinstance(tags, list):
                tags = ', '.join(tags)

            self.stdout.write(f'Title: {title}')

            # Step 3: Generate image
            image_url = None
            if not options['no_image']:
                self.stdout.write('Generating featured image...')
                try:
                    step3 = workflow.run_step_3(title, content)
                    image_url = step3.get('image_url')
                    self.stdout.write(f'Image URL: {image_url}')
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'Image generation failed (continuing without image): {e}'))

            # Save post
            self.stdout.write('Saving post to database...')
            post = workflow.save_post(
                title=title,
                content=content,
                meta_title=meta_title,
                meta_description=meta_description,
                tags=tags,
                author_id=author.id,
                image_url=image_url,
            )

        # ── Publish if requested ───────────────────────────────────────────
        if options['publish']:
            post.status = 'published'
            post.save()
            self.stdout.write(self.style.SUCCESS(f'✓ Post PUBLISHED: "{post.title}" (id={post.id})'))
        else:
            self.stdout.write(self.style.SUCCESS(f'✓ Post saved as DRAFT: "{post.title}" (id={post.id})'))

        self.stdout.write(f'  Admin URL: /admin/blog/post/{post.id}/change/')
        self.stdout.write(f'  Frontend URL: /blog/{post.slug}/')
