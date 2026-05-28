from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = "Create a default admin superuser with preconfigured credentials if it does not exist"

    def handle(self, *args, **options):
        username = "admin"
        email = "admin@admin.com"
        password = "ratorachandrasurya"

        self.stdout.write(self.style.NOTICE(f"Checking if superuser '{username}' exists..."))

        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(f"Superuser with username '{username}' already exists."))
            user = User.objects.get(username=username)
            # Update password and email to ensure they match requested ones
            user.email = email
            user.set_password(password)
            user.is_superuser = True
            user.is_staff = True
            user.is_active = True
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Successfully updated superuser '{username}' password and email."))
        elif User.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f"User with email '{email}' already exists."))
            user = User.objects.get(email=email)
            user.username = username
            user.set_password(password)
            user.is_superuser = True
            user.is_staff = True
            user.is_active = True
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Successfully promoted user with email '{email}' to superuser."))
        else:
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            self.stdout.write(self.style.SUCCESS(f"Successfully created superuser '{username}' (email: '{email}')."))
