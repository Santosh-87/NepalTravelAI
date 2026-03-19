from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from .models import VehicleListing, Booking
from .serializers import VehicleListingSerializer, BookingSerializer

class VehicleListingViewSet(viewsets.ModelViewSet):
    """
    Vendor can CRUD their vehicle listings
    Tourists can view approved listings
    """
    serializer_class = VehicleListingSerializer
    
    def get_permissions(self):
        """
        Allow public access to list and retrieve
        Require authentication for create/update/delete
        """
        if self.action in ['list', 'retrieve', 'public']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        
        # Public access or unauthenticated users
        if not user.is_authenticated:
            return VehicleListing.objects.filter(status='approved', is_available=True)
        
        # Authenticated users
        if user.role == 'vendor':
            return VehicleListing.objects.filter(vendor=user)
        else:
            return VehicleListing.objects.filter(status='approved', is_available=True)
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public(self, request):
        """
        Public endpoint for browsing vehicles (no authentication required)
        """
        queryset = VehicleListing.objects.filter(status='approved', is_available=True)
        
        # Apply filters
        vehicle_type = request.query_params.get('vehicle_type')
        if vehicle_type:
            queryset = queryset.filter(vehicle_type=vehicle_type)
        
        min_price = request.query_params.get('min_price')
        if min_price:
            queryset = queryset.filter(price_per_day__gte=min_price)
        
        max_price = request.query_params.get('max_price')
        if max_price:
            queryset = queryset.filter(price_per_day__lte=max_price)
        
        location = request.query_params.get('location')
        if location:
            queryset = queryset.filter(available_location__icontains=location)
        
        min_capacity = request.query_params.get('min_capacity')
        if min_capacity:
            queryset = queryset.filter(seating_capacity__gte=min_capacity)
        
        # Order by creation date (newest first)
        queryset = queryset.order_by('-created_at')
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        if self.request.user.role != 'vendor':
            raise PermissionError("Only vendors can create listings")
        serializer.save(vendor=self.request.user)
    
    def perform_update(self, serializer):
        if serializer.instance.vendor != self.request.user:
            raise PermissionError("You can only edit your own listings")
        serializer.save()
    
    def perform_destroy(self, instance):
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
            return Booking.objects.filter(vehicle_listing__vendor=user)
        else:
            return Booking.objects.filter(tourist=user)
    
    def get_serializer_context(self):
        """Pass request to serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """Override create to add logging"""
        print("=" * 60)
        print("BOOKING CREATE REQUEST")
        print("=" * 60)
        print(f"User: {request.user}")
        print(f"User role: {request.user.role}")
        print(f"Request data: {request.data}")
        print("=" * 60)
        
        # Check if user is tourist
        if request.user.role != 'tourist':
            return Response(
                {'detail': 'Only tourists can create bookings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            print("VALIDATION ERRORS:")
            print(serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            self.perform_create(serializer)
            print("Booking created successfully!")
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            print(f"Error creating booking: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def perform_create(self, serializer):
        """Save the booking"""
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Vendor confirms a booking"""
        booking = self.get_object()
        
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
        
        if booking.tourist != request.user and booking.vehicle_listing.vendor != request.user:
            return Response(
                {'error': 'Not authorized'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        booking.cancel()
        return Response({'status': 'Booking cancelled'})
    
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Mark a booking as completed (after trip is done)
        Only the vehicle owner can mark as complete
        """
        booking = self.get_object()
        
        if booking.vehicle_listing.vendor != request.user:
            return Response(
                {'error': 'Only the vehicle owner can mark booking as complete'},
                status=status.HTTP_403_FORBIDDEN
            )
    
        if booking.status != 'confirmed':
            return Response(
                {'error': 'Only confirmed bookings can be marked as complete'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
        booking.complete()
    
        serializer = self.get_serializer(booking)
        return Response({
            'status': 'Booking completed successfully',
            'booking': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Vendor rejects a booking
        Only the vehicle owner can reject
        """
        booking = self.get_object()
        
        # Check if user is the vehicle owner
        if booking.vehicle_listing.vendor != request.user:
            return Response(
                {'error': 'Only the vehicle owner can reject bookings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if booking.status != 'pending':
            return Response(
                {'error': 'Only pending bookings can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
        reason = request.data.get('reason', '')
        
        booking.reject(reason)
        
        serializer = self.get_serializer(booking)
        return Response({
            'status': 'Booking rejected',
            'reason': reason,
            'booking': serializer.data
        })