from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Message
from .serializers import MessageSerializer
from .ai_agents import LegalAssistantAgent


class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Message.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Save the user's message
        user_message = serializer.save(user=request.user, sender_type="user")

        # Fetch conversation history (excluding the message just saved)
        history = list(Message.objects.filter(user=request.user).exclude(pk=user_message.pk))

        # Generate and save AI reply
        agent = LegalAssistantAgent()
        ai_content = agent.reply(request.user, history, user_message.content)
        Message.objects.create(user=request.user, sender_type="ai", content=ai_content)

        # Return the full updated conversation so the frontend gets both messages at once
        all_messages = Message.objects.filter(user=request.user)
        return Response(MessageSerializer(all_messages, many=True).data, status=status.HTTP_201_CREATED)
