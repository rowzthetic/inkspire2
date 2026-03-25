# import random

# from django.conf import settings
# from django.contrib.auth import get_user_model, login, logout
# from django.core.mail import send_mail
# from django.utils import timezone
# from google.auth.transport import requests as google_requests
# from google.oauth2 import id_token
# from rest_framework import filters, generics, permissions, status
# from rest_framework.response import Response
# from rest_framework.views import APIView
# from rest_framework_simplejwt.tokens import RefreshToken
# from rest_framework_simplejwt.views import TokenObtainPairView

# # --- Serializers ---
# from apps.users.serializers import (
#     ArtistDashboardSerializer,
#     CustomTokenObtainPairSerializer,
#     PortfolioImageSerializer,
#     SendOTPSerializer,
#     UserRegistrationSerializer,
#     UserSerializer,
#     VerifyOTPSerializer,
#     WorkScheduleSerializer,
# )

# # --- Utils ---
# from apps.users.utils import generate_otp, get_otp_expiry

# # --- Models ---
# from .models import PortfolioImage, WorkSchedule

# User = get_user_model()

# # ==========================================
# # 1. AUTHENTICATION VIEWS
# # ==========================================


# class CustomTokenObtainPairView(TokenObtainPairView):
#     """
#     Login View that accepts Email OR Username
#     """

#     serializer_class = CustomTokenObtainPairSerializer


# class RegisterView(APIView):
#     permission_classes = [permissions.AllowAny]

#     def post(self, request):
#         serializer = UserRegistrationSerializer(data=request.data)
#         if serializer.is_valid():
#             # 1. Create the user (Inactive by default)
#             user = serializer.save()
#             user.is_active = False

#             # 2. Generate OTP
#             otp_code = generate_otp()
#             user.otp = otp_code
#             user.otp_expiry = get_otp_expiry()
#             user.save()

#             # ❌ REMOVED DEBUG PRINT HERE

#             try:
#                 send_mail(
#                     "Verify your Inkspire Account",
#                     f"Welcome {user.username}! Your verification code is: {otp_code}",
#                     settings.DEFAULT_FROM_EMAIL,
#                     [user.email],
#                     fail_silently=False,
#                 )
#             except Exception as e:
#                 print(f"Email Error: {e}")
#                 return Response(
#                     {"warning": "User created, but email failed to send."}, status=201
#                 )

#             return Response(
#                 {
#                     "message": "Registration successful! OTP sent to email.",
#                     "email": user.email,
#                 },
#                 status=status.HTTP_201_CREATED,
#             )

#         print("\n❌ REGISTRATION ERROR:", serializer.errors)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# class VerifyOTPView(APIView):
#     """
#     Verifies OTP.
#     - Regular Users: Activated immediately.
#     - Artists: Remain INACTIVE until Admin approval.
#     """

#     permission_classes = [permissions.AllowAny]

#     def post(self, request):
#         serializer = VerifyOTPSerializer(data=request.data)
#         if serializer.is_valid():
#             email = serializer.validated_data["email"]
#             otp_input = serializer.validated_data["otp"]

#             try:
#                 user = User.objects.get(email=email)
#             except User.DoesNotExist:
#                 return Response({"error": "User not found"}, status=404)

#             # 1. Check OTP
#             if user.otp != otp_input:
#                 return Response({"error": "Invalid OTP"}, status=400)

#             # 2. Check Expiry
#             if user.otp_expiry and timezone.now() > user.otp_expiry:
#                 return Response({"error": "OTP has expired"}, status=400)

#             # 3. Clear OTP
#             user.otp = None
#             user.otp_expiry = None

#             # 4. 🚦 ARTIST APPROVAL CHECK
#             if user.is_artist:
#                 # Artists stay inactive
#                 user.is_active = False
#                 user.save()

#                 try:
#                     send_mail(
#                         subject="Inkspire: Artist Application Pending",
#                         message=f"Hi {user.username},\n\nYour email has been verified successfully!\n\nYour account is currently under review by our admin team. You will be unable to log in until we verify your artist credentials.\n\nWe will notify you once your account is active.\n\nThanks,\nThe Inkspire Team",
#                         from_email=settings.DEFAULT_FROM_EMAIL,
#                         recipient_list=[user.email],
#                         fail_silently=False,
#                     )
#                 except Exception as e:
#                     print(f"Error sending pending email: {e}")

#                 return Response(
#                     {
#                         "message": "Email verified! Your artist account is pending Admin approval.",
#                         "is_artist": True,
#                         "approved": False,
#                     },
#                     status=200,
#                 )
#             else:
#                 # Regular Users activate immediately
#                 user.is_active = True
#                 user.save()

#                 # Generate Tokens
#                 refresh = RefreshToken.for_user(user)
#                 return Response(
#                     {
#                         "message": "Verification successful!",
#                         "is_artist": False,
#                         "approved": True,
#                         "refresh": str(refresh),
#                         "access": str(refresh.access_token),
#                         "user": UserSerializer(user).data,
#                     },
#                     status=200,
#                 )

#         return Response(serializer.errors, status=400)


# class GoogleLoginView(APIView):
#     permission_classes = [permissions.AllowAny]

#     def post(self, request):
#         token = request.data.get("token")
#         if not token:
#             return Response({"error": "No token provided"}, status=400)

#         try:
#             CLIENT_ID = getattr(
#                 settings,
#                 "GOOGLE_CLIENT_ID",
#                 "62630033234-cpvj1b5in4vkohk7bceeud7o7g01q55c.apps.googleusercontent.com",
#             )

#             id_info = id_token.verify_oauth2_token(
#                 token, google_requests.Request(), CLIENT_ID
#             )

#             email = id_info["email"]
#             first_name = id_info.get("given_name", "")
#             last_name = id_info.get("family_name", "")

#             user, created = User.objects.get_or_create(
#                 email=email,
#                 defaults={
#                     "username": email.split("@")[0] + str(random.randint(100, 999)),
#                     "first_name": first_name,
#                     "last_name": last_name,
#                     "is_active": True,
#                 },
#             )

#             if not user.is_active and not created:
#                 return Response({"error": "Account is inactive"}, status=403)

#             refresh = RefreshToken.for_user(user)
#             refresh["email"] = user.email
#             refresh["is_artist"] = user.is_artist

#             return Response(
#                 {
#                     "refresh": str(refresh),
#                     "access": str(refresh.access_token),
#                     "email": user.email,
#                     "username": user.username,
#                     "is_artist": user.is_artist,
#                     "message": "Google Login Successful",
#                 }
#             )

#         except ValueError as e:
#             return Response(
#                 {"error": "Invalid Google Token", "details": str(e)}, status=400
#             )


# class LoginWithOTPView(APIView):
#     permission_classes = [permissions.AllowAny]

#     def post(self, request):
#         serializer = SendOTPSerializer(data=request.data)
#         if serializer.is_valid():
#             email = serializer.validated_data["email"]
#             try:
#                 user = User.objects.get(email=email)
#             except User.DoesNotExist:
#                 return Response({"error": "User not found."}, status=404)

#             otp = generate_otp()
#             user.otp = otp
#             user.otp_expiry = get_otp_expiry()
#             user.save()

#             # ❌ REMOVED DEBUG PRINT HERE
#             send_mail(
#                 "Inkspire Login Code",
#                 f"Your login code is: {otp}",
#                 settings.DEFAULT_FROM_EMAIL,
#                 [email],
#                 fail_silently=False,
#             )
#             return Response({"message": "OTP sent to email", "email": email})
#         return Response(serializer.errors, status=400)


# class LogoutView(APIView):
#     def post(self, request):
#         logout(request)
#         return Response(
#             {"message": "Successfully logged out"}, status=status.HTTP_200_OK
#         )


# class UserView(APIView):
#     permission_classes = [permissions.IsAuthenticated]

#     def get(self, request):
#         serializer = UserSerializer(request.user)
#         return Response(serializer.data)


# # ==========================================
# # 2. ARTIST & DASHBOARD VIEWS
# # ==========================================


# class ArtistListView(generics.ListAPIView):
#     serializer_class = UserSerializer
#     permission_classes = [permissions.AllowAny]
#     queryset = User.objects.filter(is_artist=True, is_active=True)
#     filter_backends = [filters.SearchFilter]
#     search_fields = ["username", "bio", "styles", "city", "shop_name"]


# class ArtistDetailView(generics.RetrieveAPIView):
#     serializer_class = UserSerializer
#     permission_classes = [permissions.AllowAny]
#     queryset = User.objects.filter(is_artist=True)


# class ArtistDashboardView(APIView):
#     permission_classes = [permissions.IsAuthenticated]

#     def get(self, request):
#         user = request.user
#         if not user.is_artist:
#             return Response({"error": "Only artists have dashboards"}, status=403)
#         for i in range(7):
#             WorkSchedule.objects.get_or_create(artist=user, day_of_week=i)
#         serializer = ArtistDashboardSerializer(user)
#         data = serializer.data
#         data["revenue"] = 0
#         return Response(data)


# class UpdateScheduleView(APIView):
#     permission_classes = [permissions.IsAuthenticated]

#     def post(self, request):
#         for day_data in request.data:
#             day_obj = WorkSchedule.objects.get(
#                 artist=request.user, day_of_week=day_data["day_of_week"]
#             )
#             serializer = WorkScheduleSerializer(day_obj, data=day_data, partial=True)
#             if serializer.is_valid():
#                 serializer.save()
#         return Response({"message": "Schedule updated successfully!"})


# class ManagePortfolioView(APIView):
#     permission_classes = [permissions.IsAuthenticated]

#     def post(self, request):
#         serializer = PortfolioImageSerializer(data=request.data)
#         if serializer.is_valid():
#             serializer.save(artist=request.user)
#             return Response(serializer.data, status=status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#     def delete(self, request, pk):
#         image = PortfolioImage.objects.filter(id=pk, artist=request.user).first()
#         if image:
#             image.delete()
#             return Response({"message": "Image deleted"})
#         return Response({"error": "Image not found"}, status=status.HTTP_404_NOT_FOUND)


# class UpdateArtistProfileView(generics.UpdateAPIView):
#     """
#     Allows logged-in users to update their own profile details.
#     """

#     serializer_class = UserSerializer
#     permission_classes = [permissions.IsAuthenticated]

#     def get_object(self):
#         return self.request.user


import random

from django.conf import settings
from django.contrib.auth import get_user_model, login, logout
from django.core.mail import send_mail
from django.utils import timezone
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework import filters, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

# --- Serializers ---
from apps.users.serializers import (
    ArtistDashboardSerializer,
    CustomTokenObtainPairSerializer,
    PortfolioImageSerializer,
    SendOTPSerializer,
    UserRegistrationSerializer,
    UserSerializer,
    VerifyOTPSerializer,
    WorkScheduleSerializer,
)

# --- Utils ---
from apps.users.utils import generate_otp, get_otp_expiry

# --- Models ---
from .models import PortfolioImage, WorkSchedule

User = get_user_model()

# ==========================================
# 1. AUTHENTICATION VIEWS
# ==========================================


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Login View that accepts Email OR Username
    """

    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user.is_active = False

            otp_code = generate_otp()
            user.otp = otp_code
            user.otp_expiry = get_otp_expiry()
            user.save()

            try:
                send_mail(
                    "Verify your Inkspire Account",
                    f"Welcome {user.username}! Your verification code is: {otp_code}",
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"Email Error: {e}")
                return Response(
                    {"warning": "User created, but email failed to send."}, status=201
                )

            return Response(
                {
                    "message": "Registration successful! OTP sent to email.",
                    "email": user.email,
                },
                status=status.HTTP_201_CREATED,
            )

        print("\n❌ REGISTRATION ERROR:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            otp_input = serializer.validated_data["otp"]

            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({"error": "User not found"}, status=404)

            if user.otp != otp_input:
                return Response({"error": "Invalid OTP"}, status=400)

            if user.otp_expiry and timezone.now() > user.otp_expiry:
                return Response({"error": "OTP has expired"}, status=400)

            user.otp = None
            user.otp_expiry = None

            if user.is_artist:
                user.is_active = False
                user.save()

                try:
                    send_mail(
                        subject="Inkspire: Artist Application Pending",
                        message=f"Hi {user.username},\n\nYour email has been verified successfully!\n\nYour account is currently under review by our admin team.\n\nThanks,\nThe Inkspire Team",
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[user.email],
                        fail_silently=False,
                    )
                except Exception as e:
                    print(f"Error sending pending email: {e}")

                return Response(
                    {
                        "message": "Email verified! Your artist account is pending Admin approval.",
                        "is_artist": True,
                        "approved": False,
                    },
                    status=200,
                )
            else:
                user.is_active = True
                user.save()
                refresh = RefreshToken.for_user(user)
                return Response(
                    {
                        "message": "Verification successful!",
                        "is_artist": False,
                        "approved": True,
                        "refresh": str(refresh),
                        "access": str(refresh.access_token),
                        "user": UserSerializer(user).data,
                    },
                    status=200,
                )

        return Response(serializer.errors, status=400)


class GoogleLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get("token")
        if not token:
            return Response({"error": "No token provided"}, status=400)

        try:
            CLIENT_ID = getattr(
                settings,
                "GOOGLE_CLIENT_ID",
                "62630033234-cpvj1b5in4vkohk7bceeud7o7g01q55c.apps.googleusercontent.com",
            )

            id_info = id_token.verify_oauth2_token(
                token, google_requests.Request(), CLIENT_ID
            )

            email = id_info["email"]
            first_name = id_info.get("given_name", "")
            last_name = id_info.get("family_name", "")

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "username": email.split("@")[0] + str(random.randint(100, 999)),
                    "first_name": first_name,
                    "last_name": last_name,
                    "is_active": True,
                },
            )

            if not user.is_active and not created:
                return Response({"error": "Account is inactive"}, status=403)

            refresh = RefreshToken.for_user(user)
            refresh["email"] = user.email
            refresh["is_artist"] = user.is_artist

            return Response(
                {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "email": user.email,
                    "username": user.username,
                    "is_artist": user.is_artist,
                    "message": "Google Login Successful",
                }
            )

        except ValueError as e:
            return Response(
                {"error": "Invalid Google Token", "details": str(e)}, status=400
            )


class LoginWithOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({"error": "User not found."}, status=404)

            otp = generate_otp()
            user.otp = otp
            user.otp_expiry = get_otp_expiry()
            user.save()

            send_mail(
                "Inkspire Login Code",
                f"Your login code is: {otp}",
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            return Response({"message": "OTP sent to email", "email": email})
        return Response(serializer.errors, status=400)


class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response(
            {"message": "Successfully logged out"}, status=status.HTTP_200_OK
        )


class UserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


# ==========================================
# 2. ARTIST & DASHBOARD VIEWS
# ==========================================


class ArtistListView(generics.ListAPIView):
    """Returns a list of all ACTIVE artists"""

    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]
    queryset = User.objects.filter(is_artist=True, is_active=True)
    filter_backends = [filters.SearchFilter]
    search_fields = ["username", "bio", "styles", "city", "shop_name"]


class ArtistDetailView(generics.RetrieveAPIView):
    """Returns details for ONE specific artist"""

    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]
    queryset = User.objects.filter(is_artist=True)
    lookup_field = "id"  # 👈 THIS WAS MISSING! Crucial for URL matching.


class ArtistDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.is_artist:
            return Response({"error": "Only artists have dashboards"}, status=403)

        # Ensure 7 days of schedule exist
        for i in range(7):
            WorkSchedule.objects.get_or_create(artist=user, day_of_week=i)

        serializer = ArtistDashboardSerializer(user)
        data = serializer.data
        data["revenue"] = 0  # Placeholder revenue
        return Response(data)


class UpdateScheduleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        for day_data in request.data:
            day_obj = WorkSchedule.objects.get(
                artist=request.user, day_of_week=day_data["day_of_week"]
            )
            serializer = WorkScheduleSerializer(day_obj, data=day_data, partial=True)
            if serializer.is_valid():
                serializer.save()
        return Response({"message": "Schedule updated successfully!"})


class ManagePortfolioView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PortfolioImageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(artist=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        image = PortfolioImage.objects.filter(id=pk, artist=request.user).first()
        if image:
            image.delete()
            return Response({"message": "Image deleted"})
        return Response({"error": "Image not found"}, status=status.HTTP_404_NOT_FOUND)


class UpdateArtistProfileView(generics.UpdateAPIView):
    """
    Allows logged-in users to update their own profile details.
    """

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
