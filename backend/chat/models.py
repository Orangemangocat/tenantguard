from django.db import models
from django.contrib.auth.models import User


class Message(models.Model):
    SENDER_CHOICES = [
        ("user", "User"),
        ("ai", "AI Assistant"),
        ("staff", "Staff"),
    ]

    # The tenant user this conversation belongs to (always the tenant, regardless of who sent the message)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="chat_messages")
    sender_type = models.CharField(max_length=10, choices=SENDER_CHOICES, default="user")
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["timestamp"]

    def __str__(self):
        return f"[{self.sender_type}] {self.user.username}: {self.content[:40]}"
