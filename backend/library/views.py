from rest_framework import filters, generics

from .models import TattooMeaning
from .serializers import TattooMeaningSerializer


class LibraryListView(generics.ListAPIView):
    queryset = TattooMeaning.objects.all().order_by("title")
    serializer_class = TattooMeaningSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "meaning", "tags"]


class LibraryDetailView(generics.RetrieveAPIView):
    queryset = TattooMeaning.objects.all()
    serializer_class = TattooMeaningSerializer
