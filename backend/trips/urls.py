from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TripTemplateViewSet

router = DefaultRouter()
router.register(r'templates', TripTemplateViewSet, basename='trip-template')

urlpatterns = [
    path('', include(router.urls)),
]
