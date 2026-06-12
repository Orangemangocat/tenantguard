"""
seed_test_users — Create test accounts for staging/development.

Run:
    python manage.py seed_test_users

This creates (or resets) the following accounts:

  ┌─────────────────────────────────────────────────────────┐
  │  TEST ATTORNEY                                          │
  │  Username: testattorney                                 │
  │  Password: TestAttorney123!                             │
  │  Email:    testattorney@tenantguard.net                 │
  │  Role:     staff (attorney)                             │
  ├─────────────────────────────────────────────────────────┤
  │  TEST TENANT                                            │
  │  Username: testtenant                                   │
  │  Password: TestTenant123!                               │
  │  Email:    testtenant@tenantguard.net                   │
  │  Role:     regular user (tenant)                        │
  └─────────────────────────────────────────────────────────┘

These accounts are for TESTING ONLY on staging/dev environments.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

TEST_USERS = [
    {
        "username": "testattorney",
        "email": "testattorney@tenantguard.net",
        "password": "TestAttorney123!",
        "first_name": "Test",
        "last_name": "Attorney",
        "is_staff": True,
    },
    {
        "username": "testtenant",
        "email": "testtenant@tenantguard.net",
        "password": "TestTenant123!",
        "first_name": "Test",
        "last_name": "Tenant",
        "is_staff": False,
    },
]


class Command(BaseCommand):
    help = "Seed test attorney and tenant accounts for staging/development."

    def handle(self, *args, **options):
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
                    "is_active": True,
                },
            )

            if not created:
                # Update existing user to ensure correct state
                user.email = user_data["email"]
                user.first_name = user_data["first_name"]
                user.last_name = user_data["last_name"]
                user.is_staff = user_data["is_staff"]
                user.is_active = True

            # Always reset the password so we know what it is
            user.set_password(password)
            user.save()

            status = "CREATED" if created else "RESET"
            self.stdout.write(
                self.style.SUCCESS(
                    f"  [{status}] {username} / {password} "
                    f"({'staff/attorney' if user.is_staff else 'tenant'})"
                )
            )

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("✓ Test users seeded successfully."))
        self.stdout.write("")
        self.stdout.write("  Test Attorney Login:")
        self.stdout.write("    Username: testattorney")
        self.stdout.write("    Password: TestAttorney123!")
        self.stdout.write("")
        self.stdout.write("  Test Tenant Login:")
        self.stdout.write("    Username: testtenant")
        self.stdout.write("    Password: TestTenant123!")
        self.stdout.write("")
