# from django.urls import path

# from .views import (
#     AppointmentCancelView,
#     AppointmentManageView,  # New view for artist accept/decline with price quote
#     ArtistAppointmentListView,  # New: Artist-only appointments with stats
#     BookAppointmentView,  # Renamed from AppointmentCreateView
#     ClientAppointmentListView,  # New: Client-only appointments
#     DeleteAvailabilityView,
#     GetAvailableSlotsView,  # Renamed from CheckAvailabilityView (Logic changed)
#     ManageAvailabilityView,
# )

# urlpatterns = [
#     path("slots/<int:artist_id>/", GetAvailableSlotsView.as_view(), name="get-slots"),
#     # 1. Booking Logic (The "Brain")
#     path("slots/<int:artist_id>/", GetAvailableSlotsView.as_view(), name="get-slots"),
#     path("book/", BookAppointmentView.as_view(), name="book-appointment"),
#     # 2. History & Management - Separate endpoints for Artist and Client
#     path(
#         "artist/list/", ArtistAppointmentListView.as_view(), name="artist-appointments"
#     ),
#     path(
#         "client/list/", ClientAppointmentListView.as_view(), name="client-appointments"
#     ),
#     # Legacy endpoint (kept for backward compatibility)
#     path("list/", ArtistAppointmentListView.as_view(), name="list-appointments"),
#     # 3. Cancellation (Using UUID as per your existing code)
#     path(
#         "cancel/<uuid:pk>/", AppointmentCancelView.as_view(), name="cancel-appointment"
#     ),
#     # 4. Artist Manage Appointment (Accept/Decline with Price Quote)
#     path(
#         "manage/<int:pk>/", AppointmentManageView.as_view(), name="manage-appointment"
#     ),
#     # 5. Artist Availability Management
#     path(
#         "availability/manage/",
#         ManageAvailabilityView.as_view(),
#         name="manage-availability",
#     ),
#     path(
#         "availability/delete/<uuid:pk>/",
#         DeleteAvailabilityView.as_view(),
#         name="delete-availability",
#     ),
# ]


from django.urls import path

from .views import (
    AppointmentCancelView,
    AppointmentManageView,  
    ArtistAppointmentListView,  
    BookAppointmentView,  
    ClientAppointmentListView,  
    DeleteAvailabilityView,
    GetAvailableSlotsView,  
    ManageAvailabilityView,
    CreateStripeCheckoutView,  # 👈 Added this
    StripePaymentSuccessView,
      HealingNotesView,
        HealingReminderView  # 👈 Added this
)

urlpatterns = [
    # 1. Booking Logic (The "Brain")
    path("slots/<int:artist_id>/", GetAvailableSlotsView.as_view(), name="get-slots"),
    path("book/", BookAppointmentView.as_view(), name="book-appointment"),
    
    # 2. History & Management - Separate endpoints for Artist and Client
    path(
        "artist/list/", ArtistAppointmentListView.as_view(), name="artist-appointments"
    ),
    path(
        "client/list/", ClientAppointmentListView.as_view(), name="client-appointments"
    ),
    # Legacy endpoint (kept for backward compatibility)
    path("list/", ArtistAppointmentListView.as_view(), name="list-appointments"),
    
    # 3. Cancellation (Using UUID as per your existing code)
    path(
        "cancel/<int:pk>/", AppointmentCancelView.as_view(), name="cancel-appointment"
    ),
    
    # 4. Artist Manage Appointment (Accept/Decline with Price Quote)
    path(
        "manage/<int:pk>/", AppointmentManageView.as_view(), name="manage-appointment"
    ),
    
    # 5. Artist Availability Management
    path(
        "availability/manage/",
        ManageAvailabilityView.as_view(),
        name="manage-availability",
    ),
    path(
        "availability/delete/<uuid:pk>/",
        DeleteAvailabilityView.as_view(),
        name="delete-availability",
    ),

    # ==========================================
    # 6. STRIPE PAYMENTS
    # ==========================================
    path(
        "checkout/<int:pk>/", 
        CreateStripeCheckoutView.as_view(), 
        name="stripe-checkout"
    ),
    path(
        "payment-success/", 
        StripePaymentSuccessView.as_view(), 
        name="stripe-success"
    ),

    path('healing-notes/<int:appointment_id>/', HealingNotesView.as_view()),
    path('healing-reminders/', HealingReminderView.as_view()),
]