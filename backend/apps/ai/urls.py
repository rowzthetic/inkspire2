from django.urls import path
from .views import TattooPreviewView, TattooConsultantView

urlpatterns = [
    path("tattoo-preview/", TattooPreviewView.as_view(), name="tattoo-preview"),
    path("consult/", TattooConsultantView.as_view(), name="tattoo-consult"),
]
