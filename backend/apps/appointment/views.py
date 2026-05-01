from datetime import datetime, timedelta

import stripe
from django.conf import settings
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.utils import timezone
from rest_framework import generics, parsers, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import WorkSchedule

from .models import Appointment, ArtistAvailability, HealingLog, HealingMessage, HealingNote, HealingPhoto
from .serializers import (
    AppointmentSerializer,
    ArtistAvailabilitySerializer,
    HealingLogSerializer,
    HealingMessageSerializer,
    HealingNoteSerializer,
    HealingPhotoSerializer,
)

# Initialize Stripe API Key
stripe.api_key = settings.STRIPE_SECRET_KEY


def send_appointment_email(appointment, action):
    """
    Send email notification to client when artist accepts or declines appointment.
    """
    customer = appointment.customer
    artist = appointment.artist

    # Prepare context for email templates
    context = {
        "customer_name": customer.username,
        "artist_name": artist.username,
        "appointment_date": appointment.appointment_datetime.strftime("%B %d, %Y"),
        "appointment_time": appointment.appointment_datetime.strftime("%I:%M %p"),
        "session_type": appointment.get_session_type_display(),
        "placement": appointment.get_placement_display(),
        "duration": appointment.estimated_duration_hours,
        "price_quote": appointment.price_quote,
        "deposit_amount": appointment.deposit_amount,
        "artist_notes": appointment.artist_notes,
        "rejection_reason": appointment.rejection_reason,
        "dashboard_url": f"{settings.FRONTEND_URL or 'http://localhost:5173'}/dashboard",
        "artists_url": f"{settings.FRONTEND_URL or 'http://localhost:5173'}/artists",
    }

    if action == "accept":
        subject = f"✓ Appointment Confirmed - {artist.username}"
        html_message = render_to_string("emails/appointment_confirmed.html", context)
    elif action == "decline":
        subject = f"Appointment Declined - {artist.username}"
        html_message = render_to_string("emails/appointment_declined.html", context)
    else:
        return  # Unknown action

    # Send email
    try:
        send_mail(
            subject=subject,
            message="",  # Plain text version (optional)
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[customer.email],
            html_message=html_message,
            fail_silently=False,
        )
    except Exception as e:
        print(f"Failed to send email: {e}")


# ==========================================
# 1. BOOKING & SLOTS
# ==========================================
class GetAvailableSlotsView(APIView):
    """
    Calculates available 1-hour slots for a specific artist on a specific date.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, artist_id):
        date_str = request.query_params.get("date")
        if not date_str:
            return Response({"error": "Date is required"}, status=400)

        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response({"error": "Invalid date format"}, status=400)

        weekday = target_date.weekday()

        # Check Blocks
        if ArtistAvailability.objects.filter(
            artist_id=artist_id, blocked_date=target_date
        ).exists():
            return Response(
                {"slots": [], "message": "Artist is unavailable on this date."}
            )

        if ArtistAvailability.objects.filter(
            artist_id=artist_id, recurring_weekday=weekday
        ).exists():
            return Response(
                {"slots": [], "message": "Artist is unavailable on this day."}
            )

        # Check Schedule
        try:
            schedule = WorkSchedule.objects.get(
                artist_id=artist_id, day_of_week=weekday
            )
        except WorkSchedule.DoesNotExist:
            return Response({"slots": [], "message": "No schedule set for this day."})

        if not schedule.is_active:
            return Response({"slots": [], "message": "Artist is off today."})

        # Calculate Slots
        slots = []
        current_time = datetime.combine(target_date, schedule.start_time)
        end_time = datetime.combine(target_date, schedule.end_time)

        break_start = (
            datetime.combine(target_date, schedule.break_start)
            if schedule.break_start
            else None
        )
        break_end = (
            datetime.combine(target_date, schedule.break_end)
            if schedule.break_end
            else None
        )

        daily_appointments = Appointment.objects.filter(
            artist_id=artist_id,
            appointment_datetime__date=target_date,
            status__in=["pending", "confirmed", "reschedule"],
        )

        while current_time < end_time:
            slot_start = current_time
            slot_end = current_time + timedelta(hours=1)
            is_available = True

            # Check Break
            if break_start and break_end:
                if not (slot_end <= break_start or slot_start >= break_end):
                    is_available = False

            # Check Appointments
            if is_available:
                for appt in daily_appointments:
                    appt_start = (
                        timezone.make_naive(appt.appointment_datetime)
                        if timezone.is_aware(appt.appointment_datetime)
                        else appt.appointment_datetime
                    )
                    appt_end = appt_start + timedelta(
                        hours=appt.estimated_duration_hours
                    )

                    if slot_start < appt_end and slot_end > appt_start:
                        is_available = False
                        break

            slots.append(
                {
                    "time": slot_start.strftime("%I:%M %p"),
                    "value": slot_start.strftime("%H:%M:%S"),
                    "available": is_available,
                }
            )
            current_time += timedelta(hours=1)

        return Response(
            {"slots": slots, "schedule": schedule.get_day_of_week_display()}
        )


class BookAppointmentView(APIView):
    """
    Handles creating an appointment.
    Ensures 'artist' ID is present and user isn't booking themselves.
    """

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (parsers.MultiPartParser, parsers.FormParser)

    def post(self, request):
        data = {}

        # Copy non-file fields manually
        for key, value in request.data.items():
            if key != "reference_image":
                data[key] = value

        # 1. Combine Date + Time
        if "date" in data and "time" in data:
            data["appointment_datetime"] = f"{data['date']}T{data['time']}"

        # 2. Force assign Customer
        data["customer"] = request.user.id

        # 3. Validate Artist ID
        if "artist" not in data:
            return Response({"error": "Artist ID is missing!"}, status=400)

        # 4. Serialize & Save
        serializer = AppointmentSerializer(data=data)
        if serializer.is_valid():
            # Prevent self-booking
            if str(serializer.validated_data["artist"].id) == str(request.user.id):
                return Response(
                    {"error": "You cannot book an appointment with yourself."},
                    status=400,
                )

            # Race condition check
            appt_datetime = serializer.validated_data["appointment_datetime"]
            artist = serializer.validated_data["artist"]
            if Appointment.objects.filter(
                artist=artist,
                appointment_datetime=appt_datetime,
                status__in=["pending", "confirmed"],
            ).exists():
                return Response(
                    {"error": "This slot was just booked by someone else!"}, status=400
                )

            serializer.save()
            return Response(
                {"message": "Request Sent!", "id": serializer.data["id"]}, status=201
            )

        print("Serializer errors:", serializer.errors)
        return Response(serializer.errors, status=400)


# ==========================================
# 2. MANAGEMENT VIEWS
# ==========================================
class ArtistAppointmentListView(generics.ListAPIView):
    """
    Returns appointments where the current user is the artist.
    Includes statistics in the response.
    """

    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Appointment.objects.filter(artist=user).order_by("-appointment_datetime")

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(
            queryset, many=True, context={"request": request}
        )

        # Calculate statistics
        now = timezone.now()
        stats = {
            "total": queryset.count(),
            "pending": queryset.filter(status="pending").count(),
            "confirmed": queryset.filter(status="confirmed").count(),
            "completed": queryset.filter(status="completed").count(),
            "cancelled": queryset.filter(status="cancelled").count(),
            "upcoming": queryset.filter(
                status="confirmed", appointment_datetime__gte=now
            ).count(),
            "total_revenue": sum(
                appt.price_quote or 0 for appt in queryset.filter(status="completed")
            ),
            "pending_revenue": sum(
                appt.price_quote or 0 for appt in queryset.filter(status="confirmed")
            ),
        }

        return Response({"appointments": serializer.data, "statistics": stats})


class ClientAppointmentListView(generics.ListAPIView):
    """
    Returns appointments where the current user is the customer.
    Includes statistics in the response.
    """

    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Appointment.objects.filter(customer=user).order_by(
            "-appointment_datetime"
        )

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(
            queryset, many=True, context={"request": request}
        )

        now = timezone.now()
        stats = {
            "total": queryset.count(),
            "pending": queryset.filter(status="pending").count(),
            "confirmed": queryset.filter(status="confirmed").count(),
            "completed": queryset.filter(status="completed").count(),
            "cancelled": queryset.filter(status="cancelled").count(),
            "upcoming": queryset.filter(
                status="confirmed", appointment_datetime__gte=now
            ).count(),
        }

        return Response({"appointments": serializer.data, "statistics": stats})


class AppointmentCancelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        appointment = get_object_or_404(Appointment, pk=pk)

        if request.user != appointment.customer and request.user != appointment.artist:
            return Response(
                {"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN
            )

        if (
            appointment.is_deposit_paid
            and hasattr(appointment, "stripe_payment_intent_id")
            and appointment.stripe_payment_intent_id
        ):
            try:
                stripe.Refund.create(
                    payment_intent=appointment.stripe_payment_intent_id
                )
            except Exception as e:
                print(f"Refund Failed: {e}")
                return Response({"error": f"Refund failed: {str(e)}"}, status=500)

        appointment.status = "cancelled"
        appointment.save()
        return Response(
            {"message": "Appointment cancelled and refunded successfully."}, status=200
        )


class AppointmentManageView(APIView):
    """
    For Artists to Accept, Decline, or Update an appointment with price quote.
    """

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        appointment = get_object_or_404(Appointment, pk=pk)

        if request.user != appointment.artist:
            return Response(
                {"error": "Only the assigned artist can manage this appointment."},
                status=status.HTTP_403_FORBIDDEN,
            )

        action = request.data.get("action")
        price_quote = request.data.get("price_quote")
        deposit_amount = request.data.get("deposit_amount")
        rejection_reason = request.data.get("rejection_reason")
        artist_notes = request.data.get("artist_notes")

        if action == "accept":
            if not price_quote:
                return Response(
                    {"error": "Price quote is required to accept an appointment."},
                    status=400,
                )
            appointment.status = "confirmed"
            appointment.price_quote = price_quote
            if deposit_amount:
                appointment.deposit_amount = deposit_amount
            if artist_notes:
                appointment.artist_notes = artist_notes
            appointment.save()
            send_appointment_email(appointment, "accept")
            return Response(
                {
                    "message": "Appointment accepted successfully.",
                    "appointment": AppointmentSerializer(
                        appointment, context={"request": request}
                    ).data,
                },
                status=200,
            )

        elif action == "decline":
            appointment.status = "cancelled"
            if rejection_reason:
                appointment.rejection_reason = rejection_reason
            if artist_notes:
                appointment.artist_notes = artist_notes
            appointment.save()
            send_appointment_email(appointment, "decline")
            return Response(
                {
                    "message": "Appointment declined.",
                    "appointment": AppointmentSerializer(
                        appointment, context={"request": request}
                    ).data,
                },
                status=200,
            )

        elif action == "update_quote":
            if price_quote:
                appointment.price_quote = price_quote
            if deposit_amount:
                appointment.deposit_amount = deposit_amount
            if artist_notes:
                appointment.artist_notes = artist_notes
            appointment.save()
            return Response(
                {
                    "message": "Quote updated successfully.",
                    "appointment": AppointmentSerializer(
                        appointment, context={"request": request}
                    ).data,
                },
                status=200,
            )

        elif action == "update_status":
            status_val = request.data.get("status")
            if status_val:
                appointment.status = status_val
                appointment.save()
                return Response(
                    {
                        "message": f"Status updated to {status_val} successfully.",
                        "appointment": AppointmentSerializer(
                            appointment, context={"request": request}
                        ).data,
                    },
                    status=200,
                )
            return Response({"error": "Status value is required."}, status=400)

        else:
            return Response(
                {
                    "error": "Invalid action. Use 'accept', 'decline', 'update_quote', or 'update_status'."
                },
                status=400,
            )


class ManageAvailabilityView(generics.ListCreateAPIView):
    serializer_class = ArtistAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ArtistAvailability.objects.filter(artist=self.request.user)


class DeleteAvailabilityView(generics.DestroyAPIView):
    serializer_class = ArtistAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ArtistAvailability.objects.filter(artist=self.request.user)


# ==========================================
# 3. STRIPE PAYMENT VIEWS
# ==========================================
class CreateStripeCheckoutView(APIView):
    """Creates a Stripe Checkout Session for Deposit Payment"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        appointment = get_object_or_404(Appointment, pk=pk)

        if request.user != appointment.customer:
            return Response({"error": "Permission denied"}, status=403)

        if appointment.is_deposit_paid:
            return Response({"error": "Deposit already paid"}, status=400)

        deposit_amount = float(appointment.deposit_amount or 50.00)
        frontend_url = settings.FRONTEND_URL or "http://localhost:5173"

        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[
                    {
                        "price_data": {
                            "currency": "usd",
                            "unit_amount": int(deposit_amount * 100),
                            "product_data": {
                                "name": f"Tattoo Deposit - {appointment.artist.username}",
                                "description": f"Appointment Date: {appointment.appointment_datetime.strftime('%Y-%m-%d')}",
                            },
                        },
                        "quantity": 1,
                    },
                ],
                mode="payment",
                success_url=f"{frontend_url}/dashboard?payment=success&session_id={{CHECKOUT_SESSION_ID}}&appt_id={appointment.id}",
                cancel_url=f"{frontend_url}/dashboard?payment=cancelled",
                metadata={"appointment_id": appointment.id},
            )
            return Response({"url": checkout_session.url})
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class StripePaymentSuccessView(APIView):
    """Verifies Stripe Payment and updates the database"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        session_id = request.data.get("session_id")
        appt_id = request.data.get("appt_id")

        if not session_id or not appt_id:
            return Response({"error": "Missing parameters"}, status=400)

        try:
            session = stripe.checkout.Session.retrieve(session_id)

            if session.payment_status == "paid":
                appointment = get_object_or_404(Appointment, pk=appt_id)

                if appointment.customer != request.user:
                    return Response({"error": "Unauthorized"}, status=403)

                appointment.is_deposit_paid = True
                if hasattr(appointment, "stripe_payment_intent_id"):
                    appointment.stripe_payment_intent_id = session.payment_intent
                appointment.save()

                return Response(
                    {"message": "Payment verified and deposit marked as paid."}
                )
            else:
                return Response({"error": "Payment not completed"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


# ==========================================
# 4. HEALING NOTES VIEWS
# ==========================================


class HealingNotesView(APIView):
    """
    Artist reads and writes per-day aftercare notes for a client appointment.

    GET  /api/healing-notes/<appointment_id>/
         Returns: { "notes": { "1": "Keep wrapped...", "4": "Peeling is normal..." } }

    PUT  /api/healing-notes/<appointment_id>/
         Body:    { "notes": { "1": "...", "4": "..." } }
         Returns: { "status": "saved", "notes": { ... } }
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, appointment_id):
        appointment = get_object_or_404(Appointment, pk=appointment_id)

        if request.user != appointment.artist:
            return Response({"error": "Permission denied."}, status=403)

        notes = {
            str(n.day): n.note
            for n in HealingNote.objects.filter(appointment=appointment)
        }
        return Response({"notes": notes})

    def put(self, request, appointment_id):
        appointment = get_object_or_404(Appointment, pk=appointment_id)

        if request.user != appointment.artist:
            return Response({"error": "Permission denied."}, status=403)

        notes_data = request.data.get("notes", {})

        # Bulk replace — delete existing and recreate
        HealingNote.objects.filter(appointment=appointment).delete()
        HealingNote.objects.bulk_create(
            [
                HealingNote(
                    appointment=appointment, day=int(day), note=str(text).strip()
                )
                for day, text in notes_data.items()
                if str(text).strip()
            ]
        )

        return Response({"status": "saved", "notes": notes_data})


# ==========================================
# 5. HEALING REMINDER VIEW
# ==========================================


class HealingReminderView(APIView):
    """
    Client subscribes to daily healing reminders.

    POST /api/healing-reminders/
    Body: { "appointment_id": 5, "email": "client@example.com" }

    Immediately sends a confirmation email.
    For actual daily nudges, run the management command:
        python manage.py send_healing_reminders
    (see apps/appointment/management/commands/send_healing_reminders.py)
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        appointment_id = request.data.get("appointment_id")
        email = request.data.get("email")

        if not appointment_id or not email:
            return Response(
                {"error": "appointment_id and email are required."},
                status=400,
            )

        appointment = get_object_or_404(
            Appointment, pk=appointment_id, customer=request.user
        )

        # Optionally persist the reminder email on the appointment
        # appointment.reminder_email = email
        # appointment.save()

        frontend_url = settings.FRONTEND_URL or "http://localhost:5173"

        html_message = f"""
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:28px;
                    background:#0e0e0e;color:#ddd;border-radius:12px;">
            <h2 style="color:#1D9E75;margin-bottom:4px;">Healing Reminders Activated 🩹</h2>
            <p style="color:#a1a1aa;margin-top:0;">You're all set, {request.user.username}.</p>

            <p>You'll receive a daily reminder to log your tattoo healing progress
            for your session with <strong style="color:#fff;">{appointment.artist.username}</strong>.</p>

            <p style="background:#1a1a1a;padding:12px 16px;border-radius:8px;
                      border-left:3px solid #1D9E75;">
                📅 Appointment date:
                <strong>{appointment.appointment_datetime.strftime("%B %d, %Y")}</strong><br>
                🎨 Session: {appointment.get_session_type_display()} — {appointment.description[:60]}{"..." if len(appointment.description) > 60 else ""}
            </p>

            <p>Remember: keep it moisturised, stay out of the sun, and don't pick!</p>

            <a href="{frontend_url}/healing-tracker"
               style="display:inline-block;margin-top:8px;background:#1D9E75;color:#fff;
                      padding:10px 22px;border-radius:6px;text-decoration:none;font-weight:600;">
               Open Healing Tracker
            </a>

            <p style="margin-top:24px;color:#555;font-size:12px;">
                Inkspire — tattoo aftercare reminders
            </p>
        </div>
        """

        try:
            send_mail(
                subject="🩹 Your tattoo healing reminders are set!",
                message=(
                    f"Hi {request.user.username}, your healing reminders are active "
                    f"for your appointment with {appointment.artist.username} on "
                    f"{appointment.appointment_datetime.strftime('%B %d, %Y')}."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False,
            )
        except Exception as e:
            return Response({"error": f"Email send failed: {str(e)}"}, status=500)

        return Response({"status": "reminders_set", "email": email})


# ==========================================
# 6. CLIENT HEALING TRACKER VIEWS
# ==========================================


class ActiveHealingAppointmentView(APIView):
    """
    Finds the most recent appointment for which the user might be tracking healing.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        # Find latest completed or confirmed appointment within last 32 days
        thirty_two_days_ago = now - timedelta(days=32)

        appointment = (
            Appointment.objects.filter(
                customer=request.user,
                status__in=["completed", "confirmed"],
                appointment_datetime__gte=thirty_two_days_ago,
                appointment_datetime__lte=now,
            )
            .order_by("-appointment_datetime")
            .first()
        )

        if not appointment:
            return Response(
                {"error": "No active healing session found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                "id": appointment.id,
                "artist_name": appointment.artist.username,
                "date": appointment.appointment_datetime,
                "status": appointment.status,
            }
        )


class ClientHealingTrackerView(APIView):
    """
    Retrieves all logs and artist notes for a specific appointment.
    Also handles posting new daily logs by the client.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, appointment_id):
        appointment = get_object_or_404(Appointment, pk=appointment_id)

        # Allow both customer and artist
        if request.user != appointment.customer and request.user != appointment.artist:
            return Response({"error": "Permission denied."}, status=403)

        logs = HealingLog.objects.filter(appointment=appointment)
        artist_notes = HealingNote.objects.filter(appointment=appointment)

        return Response(
            {
                "logs": HealingLogSerializer(logs, many=True).data,
                "artist_notes": HealingNoteSerializer(artist_notes, many=True).data,
                "appointment": {
                    "id": appointment.id,
                    "artist_name": appointment.artist.username,
                    "customer_name": appointment.customer.username,
                    "date": appointment.appointment_datetime,
                },
            }
        )

    def post(self, request, appointment_id):
        appointment = get_object_or_404(
            Appointment, pk=appointment_id, customer=request.user
        )

        day = request.data.get("day")
        if not day:
            return Response({"error": "Day is required."}, status=400)

        symptoms = request.data.get("symptoms", [])
        if isinstance(symptoms, str):
            import json
            try:
                symptoms = json.loads(symptoms)
            except ValueError:
                symptoms = []

        log, created = HealingLog.objects.update_or_create(
            appointment=appointment,
            day=int(day),
            defaults={
                "pain_level": int(request.data.get("pain_level", 0)),
                "symptoms": symptoms,
                "personal_notes": request.data.get("personal_notes", ""),
            },
        )

        return Response(HealingLogSerializer(log).data, status=200)


class ArtistFeedbackView(APIView):
    """
    Artist provides feedback on a specific daily log.
    """

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, log_id):
        log = get_object_or_404(
            HealingLog, pk=log_id, appointment__artist=request.user
        )
        feedback = request.data.get("artist_feedback", "")
        log.artist_feedback = feedback
        log.save()
        return Response(HealingLogSerializer(log).data)


class HealingMessageView(APIView):
    """
    Chat/Messages regarding the healing process for an appointment.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, appointment_id):
        appointment = get_object_or_404(Appointment, pk=appointment_id)
        if request.user != appointment.customer and request.user != appointment.artist:
            return Response({"error": "Permission denied."}, status=403)

        messages = HealingMessage.objects.filter(appointment=appointment)
        return Response(HealingMessageSerializer(messages, many=True).data)

    def post(self, request, appointment_id):
        appointment = get_object_or_404(Appointment, pk=appointment_id)
        if request.user != appointment.customer and request.user != appointment.artist:
            return Response({"error": "Permission denied."}, status=403)

        message_text = request.data.get("message")
        if not message_text:
            return Response({"error": "Message text is required."}, status=400)

        msg = HealingMessage.objects.create(
            appointment=appointment,
            sender=request.user,
            message=message_text,
        )
        return Response(HealingMessageSerializer(msg).data, status=201)


class UploadHealingPhotoView(APIView):
    """
    Uploads a photo for a specific daily log.
    """

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (parsers.MultiPartParser, parsers.FormParser)

    def post(self, request, log_id):
        log = get_object_or_404(
            HealingLog, pk=log_id, appointment__customer=request.user
        )
        image = request.FILES.get("image")
        if not image:
            return Response({"error": "No image provided"}, status=400)

        photo = HealingPhoto.objects.create(log=log, image=image)
        return Response(HealingPhotoSerializer(photo).data, status=201)
