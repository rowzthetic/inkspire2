# from django.contrib.auth.tokens import PasswordResetTokenGenerator


# class AccountActivationTokenGenerator(PasswordResetTokenGenerator):
#     def _make_hash_value(self, user, timestamp):
#         return str(user.pk) + str(timestamp) + str(user.is_active)


# account_activation_token = AccountActivationTokenGenerator()


import random
from datetime import timedelta

from django.utils import timezone


def generate_otp():
    """Generates a random 6-digit string."""
    return str(random.randint(100000, 999999))


def get_otp_expiry():
    """Returns the time 10 minutes from now."""
    return timezone.now() + timedelta(minutes=10)
