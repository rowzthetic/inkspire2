# from rest_framework import serializers

# from .models import Appointment, ArtistAvailability


# class AppointmentSerializer(serializers.ModelSerializer):
#     artist_name = serializers.CharField(source="artist.username", read_only=True)
#     customer_name = serializers.CharField(source="customer.username", read_only=True)

#     class Meta:
#         model = Appointment
#         fields = [
#             "id",
#             "customer",  # Added ID just in case needed for logic, though name is used for display
#             "customer_name",
#             "artist",
#             "artist_name",
#             "appointment_datetime",
#             "estimated_duration_hours",
#             "session_type",
#             "tattoo_style",
#             "placement",
#             "size_description",
#             "description",
#             "status",
#             "created_at",
#             # --- NEW FIELDS ---
#             "reference_image",  # Handles Image Uploads
#             "price_quote",
#             "deposit_amount",
#             "is_deposit_paid",
#             "rejection_reason",
#             # 'artist_notes' excluded so customers don't see private notes
#         ]

#         read_only_fields = [
#             "status",
#             "created_at",
#             "customer",
#             "customer_name",
#             "artist_name",
#             "price_quote",
#             "deposit_amount",
#             "is_deposit_paid",
#             "rejection_reason",
#         ]

#     def create(self, validated_data):
#         # Automatically attach the logged-in user as the customer
#         user = self.context["request"].user
#         return Appointment.objects.create(customer=user, **validated_data)


# class ArtistAvailabilitySerializer(serializers.ModelSerializer):
#     class Meta:
#         model = ArtistAvailability
#         fields = ["id", "blocked_date", "recurring_weekday", "reason"]

#     def create(self, validated_data):
#         # Automatically attach the logged-in user as the artist
#         user = self.context["request"].user
#         return ArtistAvailability.objects.create(artist=user, **validated_data)


from rest_framework import serializers

from .models import Appointment, ArtistAvailability


class AppointmentSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(source="artist.username", read_only=True)
    customer_name = serializers.CharField(source="customer.username", read_only=True)
    reference_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            "id",
            "customer",  # ✅ Writable so View can assign it
            "customer_name",  # Read-only (display only)
            "artist",  # ✅ Writable so Frontend can send it
            "artist_name",  # Read-only (display only)
            "appointment_datetime",
            "estimated_duration_hours",
            "session_type",
            "tattoo_style",
            "placement",
            "size_description",
            "description",
            "status",
            "created_at",
            # --- NEW FIELDS ---
            "reference_image",
            "reference_image_url",  # Full URL for frontend
            "price_quote",
            "deposit_amount",
            "is_deposit_paid",
            "rejection_reason",
            "artist_notes",
        ]

        # 👇 Critical: 'customer' and 'artist' are NOT in this list.
        # This allows the View and Frontend to set them.
        read_only_fields = [
            "id",
            "created_at",
            "status",
            "customer_name",
            "artist_name",
            "reference_image_url",
            "is_deposit_paid",
        ]

    def get_reference_image_url(self, obj):
        """Return full URL for reference image"""
        if obj.reference_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.reference_image.url)
            return obj.reference_image.url
        return None


class ArtistAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtistAvailability
        fields = ["id", "blocked_date", "recurring_weekday", "reason"]

    # We can keep this create method as it's simple (Artist blocking their own dates)
    def create(self, validated_data):
        user = self.context["request"].user
        return ArtistAvailability.objects.create(artist=user, **validated_data)
