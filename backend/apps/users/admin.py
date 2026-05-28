from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.template.response import TemplateResponse
from django.template.loader import render_to_string
from django.contrib import messages
from django.http import HttpResponseRedirect

from .models import PortfolioImage, User, WorkSchedule
from .email_utils import send_email


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

    actions = ['reject_artists']

    @admin.action(description="Reject Artist Application")
    def reject_artists(self, request, queryset):
        if 'post' in request.POST:
            reason = request.POST.get('reason')
            count = 0
            for user in queryset:
                # Deactivate the user
                user.is_active = False
                user.save()

                # Send rejection email via Resend
                html = render_to_string(
                    "emails/artist_rejected.html",
                    {
                        "user": user,
                        "reason": reason,
                    },
                )
                ok = send_email(
                    to=user.email,
                    subject="Update on your Inkspire Artist Application",
                    html=html,
                )
                if ok:
                    count += 1
                else:
                    self.message_user(
                        request,
                        f"Failed to send email to {user.email}.",
                        level=messages.ERROR,
                    )

            self.message_user(
                request,
                f"Successfully rejected {count} artist application(s) and sent notification emails.",
                level=messages.SUCCESS,
            )
            return HttpResponseRedirect(request.get_full_path())

        # Render the intermediate page
        context = {
            **self.admin_site.each_context(request),
            'opts': self.model._meta,
            'queryset': queryset,
        }
        return TemplateResponse(request, 'admin/users/reject_reason.html', context)


# Register other models
admin.site.register(PortfolioImage)
admin.site.register(WorkSchedule)
