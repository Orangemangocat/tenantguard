from django.contrib.admin.views.decorators import staff_member_required
from django.db.models import Case, IntegerField, Q, Value, When
from django.http import HttpResponseForbidden
from django.shortcuts import get_object_or_404, render
from django.views.decorators.http import require_POST

from .forms import TodoCommentForm, TodoForm
from .models import Todo, TodoActivity, TodoComment

# Annotate queryset with numeric priority rank for sorting.
_PRIORITY_RANK = Case(
    When(priority=Todo.PRIORITY_CRITICAL, then=Value(0)),
    When(priority=Todo.PRIORITY_HIGH, then=Value(1)),
    When(priority=Todo.PRIORITY_MEDIUM, then=Value(2)),
    When(priority=Todo.PRIORITY_LOW, then=Value(3)),
    output_field=IntegerField(),
)

LOGIN_URL = '/admin/login/'


def _build_qs(request):
    """Return (active_qs, done_qs) based on GET params."""
    qs = Todo.objects.select_related('assignee', 'created_by').annotate(
        priority_rank=_PRIORITY_RANK
    )

    view = request.GET.get('view', 'open')
    if view == 'mine':
        qs = qs.filter(
            assignee=request.user,
            status__in=[Todo.STATUS_OPEN, Todo.STATUS_IN_PROGRESS, Todo.STATUS_BLOCKED],
        )
    elif view == 'open':
        qs = qs.filter(
            status__in=[Todo.STATUS_OPEN, Todo.STATUS_IN_PROGRESS, Todo.STATUS_BLOCKED]
        )
    # 'all' → no status filter

    search = request.GET.get('q', '').strip()
    if search:
        qs = qs.filter(
            Q(title__icontains=search)
            | Q(description__icontains=search)
            | Q(tags__icontains=search)
        )

    priority = request.GET.get('priority', '')
    if priority in (Todo.PRIORITY_LOW, Todo.PRIORITY_MEDIUM, Todo.PRIORITY_HIGH, Todo.PRIORITY_CRITICAL):
        qs = qs.filter(priority=priority)

    assignee_id = request.GET.get('assignee', '')
    if assignee_id.isdigit():
        qs = qs.filter(assignee_id=int(assignee_id))

    active = qs.exclude(status=Todo.STATUS_DONE).order_by('priority_rank', 'due_date', '-created_at')
    done = qs.filter(status=Todo.STATUS_DONE).order_by('-updated_at')[:50]
    return active, done, view, search


@staff_member_required(login_url=LOGIN_URL)
def panel(request):
    """Entry point: renders the initial list into the panel body."""
    return todo_list(request)


@staff_member_required(login_url=LOGIN_URL)
def todo_list(request):
    active, done, view, search = _build_qs(request)
    return render(request, 'stafftodo/_list.html', {
        'active_todos': active,
        'done_todos': done,
        'view': view,
        'search': search,
    })


@staff_member_required(login_url=LOGIN_URL)
def todo_create(request):
    if request.method == 'POST':
        form = TodoForm(request.POST)
        if form.is_valid():
            todo = form.save(commit=False)
            todo.created_by = request.user
            todo.save()
            TodoActivity.objects.create(
                todo=todo, actor=request.user, verb='created this task',
            )
            return todo_list(request)
    else:
        form = TodoForm()
    return render(request, 'stafftodo/_form.html', {'form': form, 'action': 'Create task'})


@staff_member_required(login_url=LOGIN_URL)
def todo_detail(request, pk):
    todo = get_object_or_404(Todo, pk=pk)
    return render(request, 'stafftodo/_detail.html', {
        'todo': todo,
        'comment_form': TodoCommentForm(),
    })


@staff_member_required(login_url=LOGIN_URL)
def todo_update(request, pk):
    todo = get_object_or_404(Todo, pk=pk)
    if request.method == 'POST':
        form = TodoForm(request.POST, instance=todo)
        if form.is_valid():
            old_status = todo.status
            old_assignee_id = todo.assignee_id
            updated = form.save()
            if old_status != updated.status:
                TodoActivity.objects.create(
                    todo=updated, actor=request.user,
                    verb=f'changed status to {updated.get_status_display()}',
                )
            if old_assignee_id != updated.assignee_id:
                name = (
                    updated.assignee.get_full_name() or updated.assignee.username
                    if updated.assignee else 'nobody'
                )
                TodoActivity.objects.create(
                    todo=updated, actor=request.user,
                    verb=f'assigned to {name}',
                )
            return todo_detail(request, pk)
    else:
        form = TodoForm(instance=todo)
    return render(request, 'stafftodo/_form.html', {
        'form': form, 'todo': todo, 'action': 'Save changes',
    })


@staff_member_required(login_url=LOGIN_URL)
@require_POST
def todo_delete(request, pk):
    todo = get_object_or_404(Todo, pk=pk)
    todo.delete()
    return todo_list(request)


@staff_member_required(login_url=LOGIN_URL)
@require_POST
def todo_status(request, pk):
    """Quick status toggle from the list (mark done / reopen)."""
    todo = get_object_or_404(Todo, pk=pk)
    new_status = request.POST.get('status', '')
    if new_status in dict(Todo.STATUS_CHOICES):
        old_status = todo.status
        todo.status = new_status
        todo.save(update_fields=['status', 'updated_at'])
        if old_status != new_status:
            TodoActivity.objects.create(
                todo=todo, actor=request.user,
                verb=f'changed status to {todo.get_status_display()}',
            )
    return todo_list(request)


@staff_member_required(login_url=LOGIN_URL)
@require_POST
def comment_create(request, pk):
    todo = get_object_or_404(Todo, pk=pk)
    form = TodoCommentForm(request.POST)
    if form.is_valid():
        comment = form.save(commit=False)
        comment.todo = todo
        comment.author = request.user
        comment.save()
        TodoActivity.objects.create(
            todo=todo, actor=request.user, verb='added a note',
        )
    return todo_detail(request, pk)


@staff_member_required(login_url=LOGIN_URL)
@require_POST
def comment_delete(request, pk, comment_pk):
    comment = get_object_or_404(TodoComment, pk=comment_pk, todo__pk=pk)
    if comment.author != request.user and not request.user.is_superuser:
        return HttpResponseForbidden()
    comment.delete()
    return todo_detail(request, pk)
