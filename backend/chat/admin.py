from django.contrib import admin
from .models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "sender_type", "short_content", "timestamp", "is_read"]
    list_filter = ["sender_type", "is_read", "user"]
    search_fields = ["user__username", "content"]
    readonly_fields = ["timestamp"]
    ordering = ["-timestamp"]

    def short_content(self, obj):
        return obj.content[:60] + ("…" if len(obj.content) > 60 else "")
    short_content.short_description = "Content"

    def get_fields(self, request, obj=None):
        if obj:
            return ["user", "sender_type", "content", "timestamp", "is_read"]
        # New message form — staff picks user and writes content; sender_type defaults to staff
        return ["user", "content"]

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return ["user", "sender_type", "timestamp"]
        return []

    def save_model(self, request, obj, form, change):
        if not change:
            obj.sender_type = "staff"
        super().save_model(request, obj, form, change)
