from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import TripTemplate
from .serializers import TripTemplateListSerializer, TripTemplateDetailSerializer


class TripTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """Public read-only endpoints for trip templates."""
    permission_classes = [AllowAny]
    lookup_field = 'slug'

    def get_queryset(self):
        queryset = TripTemplate.objects.filter(is_active=True)

        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)

        difficulty = self.request.query_params.get('difficulty')
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)

        min_days = self.request.query_params.get('min_days')
        if min_days:
            queryset = queryset.filter(duration_days__gte=min_days)

        max_days = self.request.query_params.get('max_days')
        if max_days:
            queryset = queryset.filter(duration_days__lte=max_days)

        return queryset

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TripTemplateDetailSerializer
        return TripTemplateListSerializer
