from rest_framework import serializers
from .models import TattooMeaning

class TattooMeaningSerializer(serializers.ModelSerializer):
    class Meta:
        model = TattooMeaning
        fields = ['id', 'title', 'meaning', 'image', 'tags']