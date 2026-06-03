from django.contrib.syndication.views import Feed
from django.http import JsonResponse
from django.conf import settings
from .models import Post

FRONTEND_URL = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')


class LatestEntriesFeed(Feed):
    title = "TenantGuard Blog"
    link = "/blog/"
    description = "Latest updates and research from TenantGuard."

    def items(self):
        return Post.objects.filter(status='published').order_by('-created_at')[:20]

    def item_title(self, item):
        return item.title

    def item_description(self, item):
        return item.excerpt or ''

    def item_link(self, item):
        return f"{FRONTEND_URL}/blog/{item.slug}/"

    def item_author_name(self, item):
        return str(item.author)

    def item_pubdate(self, item):
        return item.created_at

    def item_updateddate(self, item):
        return item.updated_at

    def item_categories(self, item):
        cats = []
        if item.category:
            cats.append(item.category.name)
        cats.extend(item.tags.values_list('name', flat=True))
        return cats


def json_feed(request):
    posts = Post.objects.filter(status='published').order_by('-created_at')[:20]

    items = []
    for post in posts:
        entry = {
            "id": f"{FRONTEND_URL}/blog/{post.slug}/",
            "url": f"{FRONTEND_URL}/blog/{post.slug}/",
            "title": post.title,
            "summary": post.excerpt or '',
            "content_html": post.content or '',
            "date_published": post.created_at.isoformat(),
            "date_modified": post.updated_at.isoformat(),
            "author": {"name": str(post.author)},
            "tags": list(post.tags.values_list('name', flat=True)),
        }
        if post.category:
            entry["tags"] = [post.category.name] + entry["tags"]
        if post.featured_image:
            entry["image"] = request.build_absolute_uri(post.featured_image.url)
        items.append(entry)

    feed = {
        "version": "https://jsonfeed.org/version/1.1",
        "title": "TenantGuard Blog",
        "home_page_url": f"{FRONTEND_URL}/blog/",
        "feed_url": request.build_absolute_uri(),
        "description": "Latest updates and research from TenantGuard.",
        "language": "en-US",
        "items": items,
    }

    return JsonResponse(feed, content_type="application/feed+json")
