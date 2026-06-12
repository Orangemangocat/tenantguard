"""
Seed test users endpoint for staging/development.

GET /api/seed-test-users/  → Creates test accounts and returns credentials as JSON.

This is intentionally open (no auth required) so testers can hit it to
bootstrap the test accounts without needing existing credentials.
"""

from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

User = get_user_model()

TEST_USERS = [
    {
        "username": "superadmin",
        "email": "admin@tenantguard.net",
        "password": "SuperAdmin123!",
        "first_name": "Super",
        "last_name": "Admin",
        "is_staff": True,
        "is_superuser": True,
    },
    {
        "username": "testattorney",
        "email": "testattorney@tenantguard.net",
        "password": "TestAttorney123!",
        "first_name": "Test",
        "last_name": "Attorney",
        "is_staff": True,
        "is_superuser": False,
    },
    {
        "username": "testtenant",
        "email": "testtenant@tenantguard.net",
        "password": "TestTenant123!",
        "first_name": "Test",
        "last_name": "Tenant",
        "is_staff": False,
        "is_superuser": False,
    },
]


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def seed_test_users_view(request):
    """Create or reset test user accounts and return their credentials."""
    results = []

    for user_data in TEST_USERS:
        username = user_data["username"]
        password = user_data["password"]

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": user_data["email"],
                "first_name": user_data["first_name"],
                "last_name": user_data["last_name"],
                "is_staff": user_data["is_staff"],
                "is_superuser": user_data.get("is_superuser", False),
                "is_active": True,
            },
        )

        if not created:
            user.email = user_data["email"]
            user.first_name = user_data["first_name"]
            user.last_name = user_data["last_name"]
            user.is_staff = user_data["is_staff"]
            user.is_superuser = user_data.get("is_superuser", False)
            user.is_active = True

        user.set_password(password)
        user.save()

        if user_data.get("is_superuser"):
            role = "superadmin (full site control)"
        elif user_data["is_staff"]:
            role = "attorney (staff)"
        else:
            role = "tenant"

        results.append({
            "status": "created" if created else "reset",
            "username": username,
            "password": password,
            "email": user_data["email"],
            "role": role,
        })

    return Response({
        "message": "Test users seeded successfully",
        "accounts": results,
        "admin_panel": {
            "url": "/admin/",
            "login": "superadmin / SuperAdmin123!",
            "features": [
                "Full user management (create, edit, delete users)",
                "Blog post management (create, edit, publish, approve)",
                "AI Blog Writer (/admin/ai-generator/)",
                "Staff Todo panel (/staff/todos/)",
                "Intake submissions management",
                "Override any user's data",
            ],
        },
        "frontend_login_url": "/auth/signin",
        "note": "Use the Username/Password fields on the sign-in page for attorney/tenant. Use /admin/ for superadmin.",
    })
