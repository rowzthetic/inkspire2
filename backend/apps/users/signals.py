from django.contrib.auth import get_user_model
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.template.loader import render_to_string
from django.conf import settings

from apps.users.email_utils import send_email

User = get_user_model()


@receiver(pre_save, sender=User)
def check_status_change(sender, instance, **kwargs):
    """
    Before saving, check if the user is transitioning from Inactive -> Active.
    We store a temporary flag `_is_being_activated` on the instance.
    """
    if instance.pk:  # Ensure this is an update, not a new creation
        try:
            old_instance = User.objects.get(pk=instance.pk)
            # Check if it was Inactive (False) and is now becoming Active (True)
            if not old_instance.is_active and instance.is_active:
                instance._is_being_activated = True
        except User.DoesNotExist:
            pass


@receiver(post_save, sender=User)
def send_approval_email(sender, instance, created, **kwargs):
    """
    After saving, check the flag we set in pre_save.
    If True, send the approval email via Resend.
    """
    if getattr(instance, "_is_being_activated", False):
        if instance.is_artist:
            login_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/login"
            html = render_to_string(
                "emails/artist_approved.html",
                {
                    "user": instance,
                    "login_url": login_url,
                },
            )
            send_email(
                to=instance.email,
                subject="Congratulations! Your Artist Account is Approved",
                html=html,
            )

        # Remove the flag to prevent double sending (in memory)
        instance._is_being_activated = False

