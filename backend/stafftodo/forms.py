from django import forms
from django.contrib.auth.models import User
from .models import Todo, TodoComment


class TodoForm(forms.ModelForm):
    class Meta:
        model = Todo
        fields = ['title', 'description', 'status', 'priority', 'assignee', 'due_date', 'tags']
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'td-input', 'placeholder': 'Task title…', 'autofocus': True,
            }),
            'description': forms.Textarea(attrs={
                'class': 'td-input td-textarea',
                'placeholder': 'Details, context, links…',
                'rows': 4,
            }),
            'status': forms.Select(attrs={'class': 'td-select'}),
            'priority': forms.Select(attrs={'class': 'td-select'}),
            'assignee': forms.Select(attrs={'class': 'td-select'}),
            'due_date': forms.DateInput(attrs={'class': 'td-input', 'type': 'date'}),
            'tags': forms.TextInput(attrs={
                'class': 'td-input', 'placeholder': 'frontend, bug, api…',
            }),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['assignee'].queryset = (
            User.objects.filter(is_staff=True).order_by('username')
        )
        self.fields['assignee'].empty_label = '— Unassigned —'
        self.fields['assignee'].required = False
        self.fields['description'].required = False
        self.fields['due_date'].required = False
        self.fields['tags'].required = False


class TodoCommentForm(forms.ModelForm):
    class Meta:
        model = TodoComment
        fields = ['body']
        widgets = {
            'body': forms.Textarea(attrs={
                'class': 'td-input td-textarea',
                'placeholder': 'Add a note…',
                'rows': 3,
            }),
        }
