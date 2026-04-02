# from rest_framework import serializers
# from django.contrib.auth import get_user_model
# from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
# from .models import PortfolioImage, WorkSchedule

# User = get_user_model()

# # --- 1. Define these FIRST so UserSerializer can use them ---

# class PortfolioImageSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = PortfolioImage
#         fields = ['id', 'image', 'created_at']

# class WorkScheduleSerializer(serializers.ModelSerializer):
#     # Add a readable day name field
#     day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)

#     class Meta:
#         model = WorkSchedule
#         fields = [
#             'id', 'day_of_week', 'day_name', 'is_active',
#             'start_time', 'end_time', 'break_start', 'break_end'
#         ]

# # --- 2. Now define UserSerializer at the BOTTOM ---

# class UserSerializer(serializers.ModelSerializer):
#     # ✅ Now these will work because they are defined above
#     portfolio = PortfolioImageSerializer(many=True, read_only=True)
#     schedule = WorkScheduleSerializer(many=True, read_only=True)

#     class Meta:
#         model = User
#         fields = (
#             "id", "username", "email", "is_artist", "is_active",
#             "phone_number", "profile_picture", "bio",
#             "shop_name", "city", "instagram_link", "styles",
#             "portfolio", "schedule"  # 👈 Added nested fields
#         )

# # --- Other Serializers (Order doesn't matter for these) ---

# class UserRegistrationSerializer(serializers.ModelSerializer):
#     password = serializers.CharField(write_only=True)
#     class Meta:
#         model = User
#         fields = ('username', 'email', 'password', 'is_artist')

#     def create(self, validated_data):
#         user = User.objects.create_user(
#             username=validated_data['username'],
#             email=validated_data['email'],
#             password=validated_data['password'],
#             is_artist=validated_data.get('is_artist', False)
#         )
#         return user

# class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
#     @classmethod
#     def get_token(cls, user):
#         token = super().get_token(user)
#         token['username'] = user.username
#         token['email'] = user.email
#         token['is_artist'] = user.is_artist
#         return token

# class ArtistDashboardSerializer(serializers.ModelSerializer):
#     schedule = WorkScheduleSerializer(many=True, read_only=True)
#     portfolio = PortfolioImageSerializer(many=True, read_only=True)
#     class Meta:
#         model = User
#         fields = (
#             "id", "username", "email", "profile_picture",
#             "bio", "styles", "city", "shop_name",
#             "instagram_link", "schedule", "portfolio"
#         )

# class SendOTPSerializer(serializers.Serializer):
#     email = serializers.EmailField()

# class VerifyOTPSerializer(serializers.Serializer):
#     email = serializers.EmailField()
#     otp = serializers.CharField(max_length=6)


from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import PortfolioImage, WorkSchedule

User = get_user_model()

# --- 1. Define these FIRST so UserSerializer can use them ---


class PortfolioImageSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(source="artist.username", read_only=True)
    artist_id = serializers.IntegerField(source="artist.id", read_only=True)

    class Meta:
        model = PortfolioImage
        fields = ["id", "image", "created_at", "artist_name", "artist_id"]


class WorkScheduleSerializer(serializers.ModelSerializer):
    # Add a readable day name field
    day_name = serializers.CharField(source="get_day_of_week_display", read_only=True)

    class Meta:
        model = WorkSchedule
        fields = [
            "id",
            "day_of_week",
            "day_name",
            "is_active",
            "start_time",
            "end_time",
            "break_start",
            "break_end",
        ]


# --- 2. Now define UserSerializer at the BOTTOM ---


class UserSerializer(serializers.ModelSerializer):
    # ✅ Now these will work because they are defined above
    portfolio = PortfolioImageSerializer(many=True, read_only=True)
    schedule = WorkScheduleSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "is_artist",
            "is_active",
            "phone_number",
            "profile_picture",
            "bio",
            "shop_name",
            "city",
            "instagram_link",
            "styles",
            "portfolio",
            "schedule",
        )


# --- Other Serializers ---


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("username", "email", "password", "is_artist")

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            is_artist=validated_data.get("is_artist", False),
        )
        return user



class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        token["email"] = user.email
        token["is_artist"] = user.is_artist
        return token

    def validate(self, attrs):
        # 1. Allow login with Email
        username_or_email = attrs.get("username") or attrs.get("email")

        if username_or_email:
            try:
                # Find the user by email
                user_obj = User.objects.get(email=username_or_email)
                attrs["username"] = user_obj.username
            except User.DoesNotExist:
                pass

        # 2. Perform Standard Validation (Check Password)
        data = super().validate(attrs)

        # 3. ✅ CRITICAL FIX: Add User Data to the Response
        # This tells the Frontend that you are an ARTIST
        data["id"] = self.user.id
        data["username"] = self.user.username
        data["email"] = self.user.email
        data["is_artist"] = self.user.is_artist  # <--- THIS LINE FIXES THE REDIRECT

        # Handle profile picture safely
        if self.user.profile_picture:
            data["profile_picture"] = self.user.profile_picture.url
        else:
            data["profile_picture"] = None

        return data


class ArtistDashboardSerializer(serializers.ModelSerializer):
    schedule = WorkScheduleSerializer(many=True, read_only=True)
    portfolio = PortfolioImageSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "profile_picture",
            "bio",
            "styles",
            "city",
            "shop_name",
            "instagram_link",
            "schedule",
            "portfolio",
        )


class SendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
