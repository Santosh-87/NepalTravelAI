import stripe
from decimal import Decimal
from django.conf import settings as django_settings
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import VehicleListing, Booking, Rating, Payment
from .serializers import (
    VehicleListingSerializer, BookingSerializer,
    VendorNegotiationResponseSerializer, CustomerNegotiationResponseSerializer,
    RatingSerializer, PaymentSerializer,
)

stripe.api_key = django_settings.STRIPE_SECRET_KEY

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
        # If vendor edits a rejected listing, reset to pending for re-review
        if serializer.instance.status == 'rejected':
            serializer.save(status='pending', admin_notes='')
        else:
            serializer.save()
    
    def perform_destroy(self, instance):
        if instance.vendor != self.request.user:
            raise PermissionError("You can only delete your own listings")
        instance.delete()

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def ratings(self, request, pk=None):
        """Public endpoint to get all ratings for a vehicle"""
        vehicle = self.get_object()
        ratings_qs = vehicle.ratings.select_related('tourist').order_by('-created_at')
        serializer = RatingSerializer(ratings_qs, many=True)
        return Response({
            'average_rating': float(vehicle.average_rating),
            'rating_count': vehicle.rating_count,
            'ratings': serializer.data,
        })


class BookingViewSet(viewsets.ModelViewSet):
    """
    Tourists create bookings
    Vendors manage bookings for their vehicles
    """
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user

        # Lazy expiration: auto-cancel expired negotiations
        Booking.objects.filter(
            negotiation_expires_at__lt=timezone.now(),
            status__in=['pending_vendor_approval', 'pending_customer_approval'],
        ).update(status='cancelled', negotiation_status='rejected')

        if user.role == 'vendor':
            return Booking.objects.filter(vehicle_listing__vendor=user).select_related(
                'vehicle_listing__vendor', 'tourist', 'rating', 'rating__tourist'
            )
        else:
            return Booking.objects.filter(tourist=user).select_related(
                'vehicle_listing__vendor', 'tourist', 'rating', 'rating__tourist'
            )
    
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
        
        if booking.status not in ('pending', 'pending_vendor_approval'):
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

    # --- Price Negotiation Endpoints ---

    @action(detail=True, methods=['post'], url_path='vendor-respond')
    def vendor_respond(self, request, pk=None):
        """Vendor responds to customer's price offer: accept, reject, or counter"""
        booking = self.get_object()

        if booking.vehicle_listing.vendor != request.user:
            return Response(
                {'error': 'Only the vehicle owner can respond to offers'},
                status=status.HTTP_403_FORBIDDEN
            )

        if booking.status != 'pending_vendor_approval':
            return Response(
                {'error': 'This booking is not awaiting vendor approval'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = VendorNegotiationResponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action_type = serializer.validated_data['action']

        if action_type == 'accept':
            booking.accept_customer_offer()
        elif action_type == 'reject':
            reason = serializer.validated_data.get('reason', '')
            booking.reject(reason)
        elif action_type == 'counter':
            counter_price = serializer.validated_data['counter_price']
            if counter_price <= booking.customer_offered_price:
                return Response(
                    {'error': 'Counter must be higher than customer offer'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if counter_price > booking.original_price_per_day:
                return Response(
                    {'error': 'Counter cannot exceed original price'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            booking.vendor_counter_offer(counter_price)

        return Response(BookingSerializer(booking, context={'request': request}).data)

    @action(detail=True, methods=['post'], url_path='customer-respond')
    def customer_respond(self, request, pk=None):
        """Customer responds to vendor's counter-offer: accept or reject"""
        booking = self.get_object()

        if booking.tourist != request.user:
            return Response(
                {'error': 'Only the booking tourist can respond'},
                status=status.HTTP_403_FORBIDDEN
            )

        if booking.status != 'pending_customer_approval':
            return Response(
                {'error': 'This booking is not awaiting your approval'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CustomerNegotiationResponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action_type = serializer.validated_data['action']

        if action_type == 'accept':
            booking.customer_accept_counter()
        elif action_type == 'reject':
            booking.customer_reject_counter()

        return Response(BookingSerializer(booking, context={'request': request}).data)

    # --- Rating Endpoint ---

    @action(detail=True, methods=['post'])
    def rate(self, request, pk=None):
        """Customer rates a completed booking"""
        booking = self.get_object()

        if booking.tourist != request.user:
            return Response(
                {'error': 'Only the booking tourist can rate'},
                status=status.HTTP_403_FORBIDDEN
            )

        if booking.status != 'completed':
            return Response(
                {'error': 'Only completed bookings can be rated'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if hasattr(booking, 'rating'):
            return Response(
                {'error': 'This booking has already been rated'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = RatingSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(
            booking=booking,
            tourist=request.user,
            vendor=booking.vehicle_listing.vendor,
            vehicle_listing=booking.vehicle_listing,
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PaymentViewSet(viewsets.ViewSet):
    """
    Stripe payment endpoints for tourists paying confirmed bookings.

    POST /api/marketplace/payments/create-intent/
        → Creates a Stripe PaymentIntent and returns the client_secret.

    POST /api/marketplace/payments/confirm/
        → Verifies the PaymentIntent succeeded, records the Payment, and
          marks the booking as paid.
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='create-intent')
    def create_intent(self, request):
        """Create a Stripe PaymentIntent for a confirmed booking."""
        booking_id = request.data.get('booking_id')
        if not booking_id:
            return Response(
                {'error': 'booking_id is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking = get_object_or_404(Booking, id=booking_id, tourist=request.user)

        if booking.status != 'confirmed':
            return Response(
                {'error': 'Only confirmed bookings can be paid'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if booking.payment_status == 'paid':
            return Response(
                {'error': 'This booking has already been paid'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Convert NPR to USD cents for Stripe (NPR is not a Stripe-supported currency).
        # Using approximate exchange rate: 1 USD ≈ 133 NPR.
        # Example: NPR 11,000 → $82.71 USD → 8271 cents.
        NPR_TO_USD = Decimal('133')
        amount_usd = booking.total_price / NPR_TO_USD
        amount_cents = max(50, int(amount_usd * 100))  # Stripe minimum is 50 cents

        try:
            payment_intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency='usd',
                metadata={
                    'booking_id': str(booking.id),
                    'tourist_email': request.user.email,
                    'vehicle': booking.vehicle_listing.vehicle_name,
                },
            )
        except stripe.error.StripeError as e:
            return Response(
                {'error': str(e.user_message)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'client_secret': payment_intent.client_secret,
            'payment_intent_id': payment_intent.id,
            'amount_cents': amount_cents,
            'amount_display': f"NPR {int(booking.total_price):,}",
        })

    @action(detail=False, methods=['post'], url_path='confirm')
    def confirm_payment(self, request):
        """Verify Stripe PaymentIntent succeeded, record Payment, mark booking paid."""
        booking_id = request.data.get('booking_id')
        payment_intent_id = request.data.get('payment_intent_id')

        if not booking_id or not payment_intent_id:
            return Response(
                {'error': 'booking_id and payment_intent_id are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking = get_object_or_404(Booking, id=booking_id, tourist=request.user)

        if booking.payment_status == 'paid':
            return Response(
                {'error': 'This booking has already been paid'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        except stripe.error.StripeError as e:
            return Response(
                {'error': str(e.user_message)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if payment_intent.status != 'succeeded':
            return Response(
                {'error': f"Payment not successful. Stripe status: {payment_intent.status}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Guard: make sure the intent belongs to this booking
        if payment_intent.metadata['booking_id'] != str(booking.id):
            return Response(
                {'error': 'Payment intent does not match this booking'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Record the payment
        payment = Payment.objects.create(
            booking=booking,
            stripe_payment_intent_id=payment_intent_id,
            amount_npr=booking.total_price,
            amount_cents=payment_intent.amount,
            currency=payment_intent.currency,
            status='succeeded',
            paid_at=timezone.now(),
        )

        booking.payment_status = 'paid'
        booking.save(update_fields=['payment_status'])

        return Response({
            'status': 'Payment successful',
            'payment': PaymentSerializer(payment).data,
            'booking_payment_status': 'paid',
        })