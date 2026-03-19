from rest_framework import serializers
from .models import TripTemplate


class TripTemplateListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for browse/grid view."""

    class Meta:
        model = TripTemplate
        fields = [
            'id', 'title', 'slug', 'description', 'category', 'difficulty',
            'duration_days', 'best_season', 'max_altitude', 'starting_price',
            'cover_image', 'highlights',
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        img = data.get('cover_image')
        if img and request and not img.startswith('http'):
            data['cover_image'] = request.build_absolute_uri(img)
        return data


class TripTemplateDetailSerializer(serializers.ModelSerializer):
    """Full serializer for detail page."""

    class Meta:
        model = TripTemplate
        fields = '__all__'

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        img = data.get('cover_image')
        if img and request and not img.startswith('http'):
            data['cover_image'] = request.build_absolute_uri(img)
        return data
