from django.db import models
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

User = get_user_model()


class UserProfile(models.Model):
    """
    Extended profile for every TenantGuard user.
    Created automatically via post_save signal when a User is created.
    """
    NOTIFICATION_CHOICES = [
        ("email", "Email"),
        ("sms", "SMS / Text"),
        ("both", "Email & SMS"),
        ("none", "None"),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile",
    )

    # Personal info (supplements Django's built-in first_name / last_name / email)
    phone = models.CharField(max_length=20, blank=True, default="")
    address_line1 = models.CharField(max_length=255, blank=True, default="")
    address_line2 = models.CharField(max_length=255, blank=True, default="")
    city = models.CharField(max_length=100, blank=True, default="")
    state = models.CharField(max_length=50, blank=True, default="Tennessee")
    zip_code = models.CharField(max_length=10, blank=True, default="")

    # Notification preferences
    notification_preference = models.CharField(
        max_length=10,
        choices=NOTIFICATION_CHOICES,
        default="email",
    )
    email_court_reminders = models.BooleanField(default=True)
    email_deadline_alerts = models.BooleanField(default=True)
    email_case_updates = models.BooleanField(default=True)
    sms_court_reminders = models.BooleanField(default=False)
    sms_deadline_alerts = models.BooleanField(default=False)

    # Onboarding / meta
    onboarding_complete = models.BooleanField(default=False)
    avatar_url = models.URLField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"

    def __str__(self):
        return f"Profile — {self.user.username}"

    @property
    def full_name(self):
        name = f"{self.user.first_name} {self.user.last_name}".strip()
        return name or self.user.username


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Auto-create a UserProfile whenever a new User is saved."""
    if created:
        UserProfile.objects.get_or_create(user=instance)
