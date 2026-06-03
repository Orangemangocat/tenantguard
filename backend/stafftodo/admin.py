from django.contrib import admin
from .models import Todo, TodoComment, TodoActivity


class TodoCommentInline(admin.TabularInline):
    model = TodoComment
    extra = 0
    readonly_fields = ('author', 'created_at')
    fields = ('author', 'body', 'created_at')


class TodoActivityInline(admin.TabularInline):
    model = TodoActivity
    extra = 0
    readonly_fields = ('actor', 'verb', 'created_at')
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Todo)
class TodoAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'priority', 'assignee', 'due_date', 'created_by', 'created_at')
    list_filter = ('status', 'priority', 'assignee')
    search_fields = ('title', 'description', 'tags')
    date_hierarchy = 'created_at'
    ordering = ('status', 'due_date', '-created_at')
    readonly_fields = ('created_by', 'created_at', 'updated_at')
    inlines = [TodoCommentInline, TodoActivityInline]

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(TodoComment)
class TodoCommentAdmin(admin.ModelAdmin):
    list_display = ('todo', 'author', 'created_at')
    list_filter = ('author',)
    readonly_fields = ('author', 'created_at')


@admin.register(TodoActivity)
class TodoActivityAdmin(admin.ModelAdmin):
    list_display = ('todo', 'actor', 'verb', 'created_at')
    list_filter = ('actor',)
    readonly_fields = ('todo', 'actor', 'verb', 'created_at')

    def has_add_permission(self, request):
        return False
