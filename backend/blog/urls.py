from django.urls import path
from .views import (
    PostListView, PostDetailView, CategoryListView,
    CommentCreateView, ai_generator_view, ai_generate_api
)
from .feeds import LatestEntriesFeed, json_feed

urlpatterns = [
    path('posts/', PostListView.as_view(), name='post-list'),
    path('posts/<slug:slug>/', PostDetailView.as_view(), name='post-detail'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('posts/<slug:slug>/comments/', CommentCreateView.as_view(), name='comment-create'),
    path('feed/', LatestEntriesFeed(), name='post-feed'),
    path('feed.json', json_feed, name='post-feed-json'),
]
