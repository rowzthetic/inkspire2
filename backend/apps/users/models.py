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


class TattooHealingTracker(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="healing_trackers"
    )
    tattoo_name = models.CharField(max_length=200)
    tattoo_image = models.ImageField(
        upload_to="healing_tattoos/", blank=True, null=True
    )
    placement = models.CharField(max_length=100, blank=True, null=True)
    start_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tattoo_name} - {self.user.username}"

    @property
    def days_since_start(self):
        from datetime import date

        return (date.today() - self.start_date).days

    @property
    def current_stage(self):
        days = self.days_since_start
        if days < 0:
            return "Not Started"
        elif days <= 3:
            return "Day 1-3: Redness & Swelling"
        elif days <= 7:
            return "Day 4-7: Itching & Peeling"
        elif days <= 14:
            return "Day 8-14: Peeling & Oozing"
        elif days <= 21:
            return "Day 15-21: Dry & Sensitive"
        else:
            return "Day 22+: Fully Healed"

    @property
    def is_healed(self):
        return self.days_since_start >= 21

    @property
    def days_remaining(self):
        if self.is_healed:
            return 0
        return max(0, 21 - self.days_since_start)

    class Meta:
        ordering = ["-start_date"]
