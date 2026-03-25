from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    # Existing fields
    is_artist = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    profile_picture = models.ImageField(
        upload_to="profile_pics/", blank=True, null=True
    )

    # Artist specific fields
    bio = models.TextField(blank=True)
    styles = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    shop_name = models.CharField(max_length=100, blank=True)
    instagram_link = models.URLField(blank=True, null=True)

    # ✅ OTP Fields
    otp = models.CharField(max_length=6, blank=True, null=True)
    otp_expiry = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return self.username


class PortfolioImage(models.Model):
    artist = models.ForeignKey(User, on_delete=models.CASCADE, related_name="portfolio")
    image = models.ImageField(upload_to="portfolio/")
    created_at = models.DateTimeField(auto_now_add=True)


class WorkSchedule(models.Model):
    # 1. Define Days so 0=Monday, 1=Tuesday, etc.
    DAYS = (
        (0, "Monday"),
        (1, "Tuesday"),
        (2, "Wednesday"),
        (3, "Thursday"),
        (4, "Friday"),
        (5, "Saturday"),
        (6, "Sunday"),
    )

    # 2. ✅ CRITICAL FIX: related_name='schedule' allows "user.schedule" to work
    artist = models.ForeignKey(User, on_delete=models.CASCADE, related_name="schedule")

    # 3. Use choices for the day name
    day_of_week = models.IntegerField(choices=DAYS)

    is_active = models.BooleanField(default=False)

    # 4. Flexible Times (Allow blank/null so it doesn't crash if empty)
    start_time = models.TimeField(default="09:00", null=True, blank=True)
    end_time = models.TimeField(default="17:00", null=True, blank=True)

    # 5. Break Times (Needed for your Dashboard Inputs)
    break_start = models.TimeField(null=True, blank=True)
    break_end = models.TimeField(null=True, blank=True)

    class Meta:
        # Prevents duplicate Mondays for the same artist
        unique_together = ("artist", "day_of_week")
        ordering = ["day_of_week"]

    def __str__(self):
        return f"{self.artist.username} - {self.get_day_of_week_display()}"
