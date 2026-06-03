from django.contrib.auth import get_user_model
from dj_rest_auth.serializers import UserDetailsSerializer as BaseUserDetailsSerializer
from rest_framework import serializers

User = get_user_model()


class UserDetailsSerializer(BaseUserDetailsSerializer):
    is_staff = serializers.BooleanField(read_only=True)

    class Meta(BaseUserDetailsSerializer.Meta):
        fields = BaseUserDetailsSerializer.Meta.fields + ('is_staff',)
        read_only_fields = BaseUserDetailsSerializer.Meta.read_only_fields + ('is_staff',)
