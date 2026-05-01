# from django.urls import path
# from .views import ArtistDashboardView, UpdateScheduleView, ManagePortfolioView
# from .views import (
#     ActivateAccountView,
#     ArtistDetailView,
#     ArtistListView,
#     LoginView,
#     LogoutView,
#     RegisterView,
#     UserView,
# )

# urlpatterns = [
#     # --- Authentication ---
#     path("register/", RegisterView.as_view(), name="register"),
#     # This captures the unique ID and Token from the email link
#     path("activate/<uuid:token>/", ActivateAccountView.as_view(), name="activate"),
#     path("login/", LoginView.as_view(), name="login"),
#     path("logout/", LogoutView.as_view(), name="logout"),
#     path("user/", UserView.as_view(), name="current-user"),
#     # --- Marketplace ---
#     # Search artists: /api/auth/artists/?search=...
#     path("artists/", ArtistListView.as_view(), name="artist-list"),
#     # Get specific artist profile: /api/auth/artists/{uuid}/
#     path("artists/<uuid:pk>/", ArtistDetailView.as_view(), name="artist-detail"),
# ]


# # added


# urlpatterns = [
#     # ... existing ...
#     path('dashboard/', ArtistDashboardView.as_view(), name='artist-dashboard'),
#     path('dashboard/schedule/', UpdateScheduleView.as_view(), name='update-schedule'),
#     path('dashboard/portfolio/', ManagePortfolioView.as_view(), name='add-portfolio'),
#     path('dashboard/portfolio/<int:pk>/', ManagePortfolioView.as_view(), name='delete-portfolio'),
# ]


from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    # Dashboard Views
    ArtistDashboardView,
    ArtistDetailView,
    # Marketplace Views
    ArtistListView,
    CustomTokenObtainPairView,
    GlobalGalleryView,
    # ✅ IMPORT GOOGLE LOGIN VIEW
    GoogleLoginView,
    LoginWithOTPView,
    LogoutView,
    ManagePortfolioView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    # Auth Views
    RegisterView,
    UpdateArtistProfileView,
    UpdateScheduleView,
    UserView,
    VerifyOTPView,
)

urlpatterns = [
    # --- Authentication ---
    path("register/", RegisterView.as_view(), name="register"),
    path("send-otp/", LoginWithOTPView.as_view(), name="send-otp"),
    path("verify-otp/", VerifyOTPView.as_view(), name="verify-otp"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("user/", UserView.as_view(), name="current-user"),
    # Standard Login (Email/Password)
    path("login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # ✅ GOOGLE LOGIN ROUTE
    path("google/", GoogleLoginView.as_view(), name="google-login"),
    # --- Marketplace (Public) ---
    path("artists/", ArtistListView.as_view(), name="artist-list"),
    path("artists/<int:pk>/", ArtistDetailView.as_view(), name="artist-detail"),
    # --- Artist Dashboard (Private) ---
    path("dashboard/", ArtistDashboardView.as_view(), name="artist-dashboard"),
    path("dashboard/schedule/", UpdateScheduleView.as_view(), name="update-schedule"),
    path("dashboard/portfolio/", ManagePortfolioView.as_view(), name="add-portfolio"),
    path(
        "dashboard/portfolio/<int:pk>/",
        ManagePortfolioView.as_view(),
        name="delete-portfolio",
    ),
    # --- Gallery (Global) ---
    path("gallery/", GlobalGalleryView.as_view(), name="global-gallery"),
    # --- Password Reset ---
    path(
        "password-reset/",
        PasswordResetRequestView.as_view(),
        name="password-reset-request",
    ),
    path(
        "password-reset/confirm/",
        PasswordResetConfirmView.as_view(),
        name="password-reset-confirm",
    ),
]
