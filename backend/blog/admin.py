from django.conf import settings
from django.contrib import admin
from django.http import HttpResponseRedirect
from django.urls import path, reverse
from django.utils.html import format_html
from django_summernote.admin import SummernoteModelAdmin
from .models import Category, Post, Comment


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Post)
class PostAdmin(SummernoteModelAdmin):
    summernote_fields = ('content',)
    list_display = ('title', 'slug', 'author', 'status', 'created_at')
    list_filter = ('status', 'created_at', 'author', 'category')
    search_fields = ('title', 'content')
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'created_at'
    ordering = ('status', '-created_at')
    readonly_fields = ('updated_at', 'frontend_link')

    change_list_template = "admin/blog/post_changelist.html"
    change_form_template = "admin/blog/post_change_form.html"

    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path(
                '<int:pk>/publish/',
                self.admin_site.admin_view(self.publish_view),
                name='blog_post_publish',
            ),
        ]
        return custom + urls

    def publish_view(self, request, pk):
        post = Post.objects.get(pk=pk)
        post.status = 'published'
        post.save()
        self.message_user(request, f'"{post.title}" has been published.')
        return HttpResponseRedirect(reverse('admin:blog_post_change', args=[pk]))

    def frontend_link(self, obj):
        if not obj.pk:
            return "Save the post first."
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        url = f"{frontend_url}/blog/{obj.slug}/"
        if obj.status == 'published':
            return format_html('<a href="{}" target="_blank">{}</a>', url, url)
        return format_html(
            '<span style="color:#888">Draft — not live yet. '
            'Will be at: <a href="{}" target="_blank">{}</a></span>',
            url, url,
        )

    frontend_link.short_description = "Frontend URL"

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('user', 'post', 'created_at', 'active')
    list_filter = ('active', 'created_at')
    search_fields = ('user__username', 'content')
    actions = ['approve_comments']

    def approve_comments(self, request, queryset):
        queryset.update(active=True)
