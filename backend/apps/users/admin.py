from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import PortfolioImage, User, WorkSchedule


# Register the Custom User Model
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # Add the new fields to the admin view so you can see them
    fieldsets = UserAdmin.fieldsets + (
        (
            "Artist Info",
            {
                "fields": (
                    "is_artist",
                    "bio",
                    "styles",
                    "city",
                    "shop_name",
                    "instagram_link",
                    "profile_picture",
                )
            },
        ),
        ("OTP Debugging", {"fields": ("otp", "otp_expiry")}),
    )


# Register other models
admin.site.register(PortfolioImage)
admin.site.register(WorkSchedule)
