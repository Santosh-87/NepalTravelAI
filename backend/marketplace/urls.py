from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VehicleListingViewSet, BookingViewSet

router = DefaultRouter()
router.register(r'vehicles', VehicleListingViewSet, basename='vehicle')
router.register(r'bookings', BookingViewSet, basename='booking')

urlpatterns = [
    path('', include(router.urls)),
]