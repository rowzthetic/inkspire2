# from django.conf import settings
# from django.conf.urls.static import static
# from django.contrib import admin
# from django.urls import include, path
# from rest_framework_simplejwt.views import TokenRefreshView

# # ✅ FIXED IMPORTS: Added Dashboard Views here
# from apps.users.views import (
#     ArtistDashboardView,
#     ArtistDetailView,
#     ArtistListView,  # 👈
#     CustomTokenObtainPairView,
#     ManagePortfolioView,
#     UpdateArtistProfileView,
#     UpdateScheduleView,
# )

# urlpatterns = [
#     path("admin/", admin.site.urls),
#     # --- Authentication & Users ---
#     # This includes your login/register/verify-otp
#     path("api/auth/", include("apps.users.urls")),
#     # --- 👇 NEW DASHBOARD ENDPOINTS (Required for Artist Dashboard) ---
#     path("api/auth/dashboard/", ArtistDashboardView.as_view(), name="artist-dashboard"),
#     path(
#         "api/auth/dashboard/schedule/",
#         UpdateScheduleView.as_view(),
#         name="update-schedule",
#     ),
#     path(
#         "api/auth/dashboard/portfolio/",
#         ManagePortfolioView.as_view(),
#         name="manage-portfolio",
#     ),
#     path(
#         "api/auth/dashboard/portfolio/<int:pk>/",
#         ManagePortfolioView.as_view(),
#         name="delete-portfolio",
#     ),
#     # --- Feature Apps ---
#     path("api/appointments/", include("apps.appointment.urls")),
#     path("api/price/", include("apps.price.urls")),
#     path("api/library/", include("library.urls")),
#     # --- JWT Token Endpoints ---
#     path("api/token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
#     path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
#     path("api/auth/dashboard/settings/", UpdateArtistProfileView.as_view()),
#     path("api/artists/", ArtistListView.as_view(), name="artist-list"),
#     path("api/artists/<int:id>/", ArtistDetailView.as_view(), name="artist-detail"),
# ]

# if settings.DEBUG:
#     urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView

# ✅ FIXED IMPORTS: Added Dashboard Views here
from apps.users.views import (
    ArtistDashboardView,
    ArtistDetailView,
    ArtistListView,  # 👈
    CustomTokenObtainPairView,
    ManagePortfolioView,
    UpdateArtistProfileView,
    UpdateScheduleView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    
    # --- Authentication & Users ---
    # This includes your login/register/verify-otp
    path("api/auth/", include("apps.users.urls")),
    
    # --- 👇 NEW DASHBOARD ENDPOINTS (Required for Artist Dashboard) ---
    path("api/auth/dashboard/", ArtistDashboardView.as_view(), name="artist-dashboard"),
    path(
        "api/auth/dashboard/schedule/",
        UpdateScheduleView.as_view(),
        name="update-schedule",
    ),
    path(
        "api/auth/dashboard/portfolio/",
        ManagePortfolioView.as_view(),
        name="manage-portfolio",
    ),
    path(
        "api/auth/dashboard/portfolio/<int:pk>/",
        ManagePortfolioView.as_view(),
        name="delete-portfolio",
    ),
    
    # --- Feature Apps ---
    path("api/appointments/", include("apps.appointment.urls")),
    path("api/price/", include("apps.price.urls")),
    path("api/library/", include("library.urls")),
    
    # 🛒 👇 THIS IS THE NEW SHOP LINE WE JUST ADDED! 👇 🛒
    path("api/shop/", include("apps.shop.urls")), 
    
    # --- JWT Token Endpoints ---
    path("api/token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/dashboard/settings/", UpdateArtistProfileView.as_view()),
    path("api/artists/", ArtistListView.as_view(), name="artist-list"),
    path("api/artists/<int:id>/", ArtistDetailView.as_view(), name="artist-detail"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
