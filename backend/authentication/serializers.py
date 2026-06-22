from django.contrib.auth import get_user_model
from dj_rest_auth.serializers import UserDetailsSerializer as BaseUserDetailsSerializer
from rest_framework import serializers
from .models import UserProfile

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for the extended UserProfile model."""

    class Meta:
        model = UserProfile
        fields = [
            "phone",
            "address_line1",
            "address_line2",
            "city",
            "state",
            "zip_code",
            "notification_preference",
            "email_court_reminders",
            "email_deadline_alerts",
            "email_case_updates",
            "sms_court_reminders",
            "sms_deadline_alerts",
            "onboarding_complete",
            "avatar_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class UserDetailsSerializer(BaseUserDetailsSerializer):
    """Extended user details serializer that includes profile and is_staff."""
    is_staff = serializers.BooleanField(read_only=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    profile = UserProfileSerializer(required=False)

    class Meta(BaseUserDetailsSerializer.Meta):
        fields = BaseUserDetailsSerializer.Meta.fields + (
            "is_staff",
            "first_name",
            "last_name",
            "profile",
        )
        read_only_fields = tuple(
            f for f in BaseUserDetailsSerializer.Meta.read_only_fields
            if f not in ("first_name", "last_name")
        ) + ("is_staff",)

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", None)
        # Update the base user fields (first_name, last_name, email, etc.)
        instance = super().update(instance, validated_data)
        # Update or create the nested profile
        if profile_data is not None:
            profile, _ = UserProfile.objects.get_or_create(user=instance)
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        return instance
