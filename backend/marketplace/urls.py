from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VehicleListingViewSet, BookingViewSet, PaymentViewSet

router = DefaultRouter()
router.register(r'vehicles', VehicleListingViewSet, basename='vehicle')
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'payments', PaymentViewSet, basename='payment')

urlpatterns = [
    path('', include(router.urls)),
]