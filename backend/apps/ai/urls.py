from django.urls import path
from .views import TattooPreviewView, TattooConsultantView, TattooLibraryAIView

urlpatterns = [
    path("tattoo-preview/", TattooPreviewView.as_view(), name="tattoo-preview"),
    path("consult/", TattooConsultantView.as_view(), name="tattoo-consult"),
    path("library-search/", TattooLibraryAIView.as_view(), name="library-search"),
]
