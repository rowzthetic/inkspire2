from django.urls import path

from .views import LibraryDetailView, LibraryListView

urlpatterns = [
    path("", LibraryListView.as_view(), name="library-list"),
    path("<int:pk>/", LibraryDetailView.as_view(), name="library-detail"),
]
