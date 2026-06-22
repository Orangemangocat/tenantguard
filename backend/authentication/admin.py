from django.contrib import admin
from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "full_name", "phone", "city", "state", "notification_preference", "created_at"]
    list_filter = ["state", "notification_preference", "onboarding_complete"]
    search_fields = ["user__username", "user__email", "user__first_name", "user__last_name", "phone"]
    readonly_fields = ["created_at", "updated_at"]
    fieldsets = (
        ("User", {"fields": ("user",)}),
        ("Personal Info", {"fields": ("phone", "address_line1", "address_line2", "city", "state", "zip_code")}),
        ("Notifications", {"fields": (
            "notification_preference",
            "email_court_reminders", "email_deadline_alerts", "email_case_updates",
            "sms_court_reminders", "sms_deadline_alerts",
        )}),
        ("Meta", {"fields": ("onboarding_complete", "avatar_url", "created_at", "updated_at")}),
    )
