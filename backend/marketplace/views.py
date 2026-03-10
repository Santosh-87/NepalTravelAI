from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import VehicleListing, Booking
from .serializers import VehicleListingSerializer, BookingSerializer

class VehicleListingViewSet(viewsets.ModelViewSet):
    """
    Vendor can CRUD their vehicle listings
    Tourists can view approved listings
    """
    serializer_class = VehicleListingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'vendor':
            # Vendors see only their listings
            return VehicleListing.objects.filter(vendor=user)
        else:
            # Tourists see approved listings
            return VehicleListing.objects.filter(status='approved', is_available=True)
    
    def perform_create(self, serializer):
        # Only vendors can create
        if self.request.user.role != 'vendor':
            raise PermissionError("Only vendors can create listings")
        
        serializer.save(vendor=self.request.user)
    
    def perform_update(self, serializer):
        # Vendors can only update their own
        if serializer.instance.vendor != self.request.user:
            raise PermissionError("You can only edit your own listings")
        
        serializer.save()
    
    def perform_destroy(self, instance):
        # Vendors can only delete their own
        if instance.vendor != self.request.user:
            raise PermissionError("You can only delete your own listings")
        
        instance.delete()


class BookingViewSet(viewsets.ModelViewSet):
    """
    Tourists create bookings
    Vendors manage bookings for their vehicles
    """
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'vendor':
            # Vendors see bookings for their vehicles
            return Booking.objects.filter(vehicle_listing__vendor=user)
        else:
            # Tourists see their own bookings
            return Booking.objects.filter(tourist=user)
    
    def perform_create(self, serializer):
        # Only tourists can create bookings
        if self.request.user.role != 'tourist':
            raise PermissionError("Only tourists can create bookings")
        
        serializer.save(tourist=self.request.user)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Vendor confirms a booking"""
        booking = self.get_object()
        
        # Only vendor of the vehicle can confirm
        if booking.vehicle_listing.vendor != request.user:
            return Response(
                {'error': 'Only vehicle owner can confirm'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        booking.confirm()
        return Response({'status': 'Booking confirmed'})
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a booking"""
        booking = self.get_object()
        
        # Tourist or vendor can cancel
        if booking.tourist != request.user and booking.vehicle_listing.vendor != request.user:
            return Response(
                {'error': 'Not authorized'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        booking.cancel()
        return Response({'status': 'Booking cancelled'})