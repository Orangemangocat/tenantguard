from rest_framework import serializers
from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "sender_type", "content", "timestamp", "is_read"]
        read_only_fields = ["sender_type", "timestamp", "is_read"]
