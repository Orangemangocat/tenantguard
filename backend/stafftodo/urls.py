from django.urls import path
from . import views

app_name = 'stafftodo'

urlpatterns = [
    path('', views.panel, name='panel'),
    path('list/', views.todo_list, name='list'),
    path('create/', views.todo_create, name='create'),
    path('<int:pk>/', views.todo_detail, name='detail'),
    path('<int:pk>/edit/', views.todo_update, name='update'),
    path('<int:pk>/delete/', views.todo_delete, name='delete'),
    path('<int:pk>/status/', views.todo_status, name='status'),
    path('<int:pk>/comments/', views.comment_create, name='comment_create'),
    path('<int:pk>/comments/<int:comment_pk>/delete/', views.comment_delete, name='comment_delete'),
]
