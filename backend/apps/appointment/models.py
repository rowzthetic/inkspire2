from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from core.models import BaseModel


class Appointment(BaseModel):
    # --- CHOICES ---
    STATUS_CHOICES = [
        ("pending", "Pending Approval"),
        ("confirmed", "Confirmed"),
        ("reschedule", "Reschedule Requested"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    SESSION_TYPE_CHOICES = [
        ("consultation", "Consultation (15-30 mins)"),
        ("tattoo", "Tattoo Session"),
        ("touchup", "Touch-up"),
    ]

    PLACEMENT_CHOICES = [
        ("arm", "Arm"),
        ("leg", "Leg"),
        ("back", "Back"),
        ("chest", "Chest"),
        ("neck", "Neck"),
        ("stomach", "Stomach"),
        ("ribs", "Ribs"),
        ("other", "Other"),
    ]

    # --- 1. WHO ---
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="client_appointments",
    )
    artist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="artist_appointments",
        limit_choices_to={"is_artist": True},
    )

    # --- 2. WHEN ---
    appointment_datetime = models.DateTimeField()
    estimated_duration_hours = models.PositiveIntegerField(
        default=1, help_text="Estimated session length in hours"
    )

    # --- 3. WHAT ---
    session_type = models.CharField(
        max_length=20,
        choices=SESSION_TYPE_CHOICES,
        default="tattoo",
    )
    tattoo_style = models.CharField(
        max_length=100,
        blank=True,
        help_text="e.g. Traditional, Realism, Fine Line",
    )
    placement = models.CharField(
        max_length=100, choices=PLACEMENT_CHOICES, default="arm"
    )
    size_description = models.CharField(
        max_length=100,
        blank=True,
        help_text="e.g. Palm-size, Full Sleeve",
    )
    description = models.TextField(
        help_text="Detailed description of the design idea",
    )

    # --- 4. VISUALS ---
    reference_image = models.ImageField(
        upload_to="references/%Y/%m/",
        blank=True,
        null=True,
        help_text="Upload a reference photo for the artist",
    )

    # --- 5. FINANCIALS ---
    price_quote = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Artist's price quote for the session",
    )
    deposit_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Required deposit amount",
    )
    is_deposit_paid = models.BooleanField(default=False)
    is_refunded = models.BooleanField(default=False)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, null=True)

    # --- 6. ADMIN/STATUS ---
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    artist_notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True, null=True)

    def clean(self):
        if self.customer == self.artist:
            raise ValidationError("You cannot book an appointment with yourself.")

    def __str__(self):
        return f"{self.customer} w/ {self.artist} ({self.appointment_datetime})"


class ArtistAvailability(BaseModel):
    WEEKDAY_CHOICES = [
        (0, "Monday"),
        (1, "Tuesday"),
        (2, "Wednesday"),
        (3, "Thursday"),
        (4, "Friday"),
        (5, "Saturday"),
        (6, "Sunday"),
    ]

    artist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="availability_rules",
        limit_choices_to={"is_artist": True},
    )

    blocked_date = models.DateField(null=True, blank=True)
    recurring_weekday = models.IntegerField(
        choices=WEEKDAY_CHOICES, null=True, blank=True
    )
    reason = models.CharField(max_length=100, default="Unavailable")

    def __str__(self):
        return f"{self.artist} - Blocked"


class HealingNote(models.Model):
    """
    Stores artist-written aftercare notes per day (1-28) for a specific appointment.
    The client sees these notes in their TattooHealingTracker page.
    """

    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.CASCADE,
        related_name="healing_notes",
    )
    day = models.PositiveSmallIntegerField(
        help_text="Healing day number (1–28)",
    )
    note = models.TextField(
        help_text="Aftercare instruction for this day",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("appointment", "day")
        ordering = ["day"]

    def __str__(self):
        return f"Appointment {self.appointment_id} — Day {self.day}"


class HealingLog(BaseModel):
    """
    Client-provided daily log of their healing progress.
    """

    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.CASCADE,
        related_name="healing_logs",
    )
    day = models.PositiveSmallIntegerField(help_text="Day 1–28")
    pain_level = models.PositiveSmallIntegerField(default=0)
    symptoms = models.JSONField(default=list)  # e.g., ["Redness", "Swelling"]
    personal_notes = models.TextField(blank=True)
    artist_feedback = models.TextField(
        blank=True, help_text="Artist response to this log"
    )

    class Meta:
        unique_together = ("appointment", "day")
        ordering = ["day"]

    def __str__(self):
        return f"Log: Appt {self.appointment_id} — Day {self.day}"


class HealingPhoto(BaseModel):
    """
    Progress photos uploaded by the client.
    """

    log = models.ForeignKey(
        HealingLog,
        on_delete=models.CASCADE,
        related_name="photos",
    )
    image = models.ImageField(upload_to="healing_progress/%Y/%m/")

    def __str__(self):
        return f"Photo for Log {self.log_id}"


class HealingMessage(BaseModel):
    """
    Message-based communication between client and artist about healing.
    """

    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.CASCADE,
        related_name="healing_messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    message = models.TextField()

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Message from {self.sender.username} for Appt {self.appointment_id}"
