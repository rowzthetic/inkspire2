# Register your models here.
from django.contrib import admin
from django.utils.html import format_html

from .models import Appointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    # Columns shown in the list view
    list_display = (
        "customer",
        "artist",
        "appointment_datetime",
        "status_badge",
        "is_deposit_paid",
        "is_refunded",
        "reference_preview",
    )

    # Filter sidebar
    list_filter = ("status", "appointment_datetime", "artist", "is_deposit_paid", "is_refunded")
    # Search box
    search_fields = ("customer__username", "artist__username", "description")

    # Organize fields into sections in the edit view
    fieldsets = (
        ("Participants", {"fields": ("customer", "artist")}),
        (
            "Schedule",
            {"fields": ("appointment_datetime", "estimated_duration_hours", "status")},
        ),
        (
            "Tattoo Details",
            {
                "fields": (
                    "session_type",
                    "placement",
                    "tattoo_style",
                    "description",
                    "reference_image",
                )
            },
        ),
        (
            "Financials",
            {"fields": ("price_quote", "deposit_amount", "is_deposit_paid")},
        ),
        ("Internal Notes", {"fields": ("artist_notes", "rejection_reason")}),
    )

    def status_badge(self, obj):
        # Color codes the status for quick reading
        colors = {
            "pending": "orange",
            "confirmed": "green",
            "cancelled": "red",
            "completed": "blue",
        }
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colors.get(obj.status, "black"),
            obj.get_status_display(),
        )

    def reference_preview(self, obj):
        if obj.reference_image:
            return format_html(
                '<img src="{}" style="width: 50px; height: auto;" />',
                obj.reference_image.url,
            )
        return "No Image"

    status_badge.short_description = "Status"
