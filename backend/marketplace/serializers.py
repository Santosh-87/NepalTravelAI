from rest_framework import serializers
from .models import VehicleListing, Booking, Rating
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Avg
from decimal import Decimal
from datetime import timedelta

User = get_user_model()

class VehicleListingSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.full_name', read_only=True)
    vendor_email = serializers.EmailField(source='vendor.email', read_only=True)
    features_list = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = VehicleListing
        fields = [
            'id',
            'vendor',
            'vendor_name',
            'vendor_email',
            'vehicle_type',
            'vehicle_name',
            'vehicle_number',
            'seating_capacity',
            'price_per_day',
            'description',
            'features',
            'features_list',
            'primary_image',
            'available_location',
            'contact_number',
            'is_available',
            'status',
            'admin_notes',
            'average_rating',
            'rating_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['vendor', 'status', 'admin_notes', 'average_rating', 'rating_count', 'created_at', 'updated_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Ensure primary_image is always an absolute URL
        img = data.get('primary_image')
        if img:
            request = self.context.get('request')
            if request and not img.startswith('http'):
                data['primary_image'] = request.build_absolute_uri(img)
        return data
    
    def create(self, validated_data):
        # Handle features list
        features_list = validated_data.pop('features_list', [])
        if features_list:
            validated_data['features'] = ', '.join(features_list)

        # Set vendor from request context
        validated_data['vendor'] = self.context['request'].user

        # DRF treats absent boolean fields in multipart forms as False (HTML checkbox
        # behaviour). Force is_available=True so every new listing starts available.
        validated_data['is_available'] = True

        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Handle features list
        features_list = validated_data.pop('features_list', None)
        if features_list:
            validated_data['features'] = ', '.join(features_list)

        # Don't let multipart's implicit False override the current availability flag.
        validated_data.pop('is_available', None)

        return super().update(instance, validated_data)


class BookingSerializer(serializers.ModelSerializer):
    tourist_name = serializers.CharField(source='tourist.full_name', read_only=True)
    tourist_email = serializers.EmailField(source='tourist.email', read_only=True)
    vehicle_name = serializers.CharField(source='vehicle_listing.vehicle_name', read_only=True)
    vendor_name = serializers.CharField(source='vehicle_listing.vendor.full_name', read_only=True)
    has_rating = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id',
            'tourist',
            'tourist_name',
            'tourist_email',
            'vehicle_listing',
            'vehicle_name',
            'vendor_name',
            'trip_type',
            'start_date',
            'end_date',
            'pickup_location',
            'dropoff_location',
            'number_of_passengers',
            'total_days',
            'price_per_day',
            'total_price',
            'original_price_per_day',
            'customer_offered_price',
            'vendor_counter_price',
            'final_price_per_day',
            'negotiation_status',
            'negotiation_expires_at',
            'price_negotiated',
            'has_rating',
            'contact_number',
            'special_requests',
            'status',
            'created_at',
            'updated_at',
            'admin_notes',
            'completed_at',
        ]
        read_only_fields = [
            'tourist', 'price_per_day', 'total_days', 'total_price',
            'original_price_per_day', 'vendor_counter_price', 'final_price_per_day',
            'negotiation_status', 'negotiation_expires_at', 'price_negotiated',
            'has_rating', 'admin_notes', 'completed_at', 'created_at', 'updated_at',
        ]

    def get_has_rating(self, obj):
        return hasattr(obj, 'rating')
    
    def validate(self, attrs):
        """Custom validation"""
        # Check dates exist
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        
        if not start_date or not end_date:
            raise serializers.ValidationError({
                'dates': 'Both start and end dates are required'
            })
        
        # Check dates order — allow same-day (start == end counts as 1 day)
        if end_date < start_date:
            raise serializers.ValidationError({
                'end_date': 'End date cannot be before start date'
            })
        
        # Check passengers
        vehicle = attrs.get('vehicle_listing')
        passengers = attrs.get('number_of_passengers')
        
        if not vehicle:
            raise serializers.ValidationError({
                'vehicle_listing': 'Vehicle is required'
            })
        
        if not passengers:
            raise serializers.ValidationError({
                'number_of_passengers': 'Number of passengers is required'
            })
        
        if passengers > vehicle.seating_capacity:
            raise serializers.ValidationError({
                'number_of_passengers': f'Maximum capacity is {vehicle.seating_capacity} passengers'
            })
        
        # Check required text fields
        if not attrs.get('pickup_location'):
            raise serializers.ValidationError({
                'pickup_location': 'Pickup location is required'
            })
        
        if not attrs.get('dropoff_location'):
            raise serializers.ValidationError({
                'dropoff_location': 'Dropoff location is required'
            })
        
        if not attrs.get('contact_number'):
            raise serializers.ValidationError({
                'contact_number': 'Contact number is required'
            })
        
        return attrs
    
    def create(self, validated_data):
        """Create booking with calculated fields"""
        # Set tourist from request
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required")

        validated_data['tourist'] = request.user

        # Get vehicle and calculate effective rate based on trip type
        # Listed price_per_day = Inside Valley (IV) price
        # Outside Valley (OV) = IV + 15%
        vehicle = validated_data['vehicle_listing']
        trip_type = validated_data.get('trip_type', 'outside_valley')
        start_date = validated_data['start_date']
        end_date = validated_data['end_date']

        if trip_type == 'within_valley':
            effective_rate = vehicle.price_per_day  # Listed = IV price
        else:
            effective_rate = (vehicle.price_per_day * Decimal('1.15')).quantize(Decimal('0.01'))  # OV = IV + 15%

        validated_data['price_per_day'] = effective_rate
        validated_data['original_price_per_day'] = effective_rate

        if trip_type == 'within_valley':
            validated_data['total_days'] = 1
            validated_data['total_price'] = effective_rate
            # Normalise end_date to match start_date for within-valley trips
            validated_data['end_date'] = start_date
        else:
            # Outside valley: per-day rate; same-day (start==end) counts as 1 day
            days = (end_date - start_date).days + 1
            validated_data['total_days'] = days
            validated_data['total_price'] = effective_rate * days

        # Handle price negotiation (counter-offer on the effective rate)
        customer_offered_price = validated_data.get('customer_offered_price')
        if customer_offered_price is not None:
            min_offer = effective_rate * Decimal('0.85')
            max_offer = effective_rate * Decimal('0.99')
            if customer_offered_price < min_offer or customer_offered_price > max_offer:
                raise serializers.ValidationError({
                    'customer_offered_price': f'Offer must be between {min_offer:.0f} and {max_offer:.0f} NPR (up to 15% off the trip rate)'
                })
            validated_data['status'] = 'pending_vendor_approval'
            validated_data['negotiation_status'] = 'customer_offered'
            validated_data['negotiation_expires_at'] = timezone.now() + timedelta(hours=48)
        else:
            validated_data['negotiation_status'] = 'none'

        booking = Booking.objects.create(**validated_data)
        return booking


class VendorNegotiationResponseSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['accept', 'reject', 'counter'])
    counter_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False
    )
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs['action'] == 'counter' and not attrs.get('counter_price'):
            raise serializers.ValidationError({
                'counter_price': 'Counter price is required when countering.'
            })
        return attrs


class CustomerNegotiationResponseSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['accept', 'reject'])


class RatingSerializer(serializers.ModelSerializer):
    tourist_name = serializers.CharField(source='tourist.full_name', read_only=True)

    class Meta:
        model = Rating
        fields = [
            'id', 'booking', 'tourist', 'tourist_name', 'vendor', 'vehicle_listing',
            'overall_rating', 'vehicle_condition_rating', 'punctuality_rating',
            'driver_behavior_rating', 'review_text', 'created_at',
        ]
        read_only_fields = ['id', 'booking', 'tourist', 'vendor', 'vehicle_listing', 'created_at']

    def validate_overall_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Rating must be between 1 and 5.')
        return value

    def create(self, validated_data):
        rating = super().create(validated_data)
        # Update denormalized rating fields on VehicleListing
        vehicle = rating.vehicle_listing
        ratings_qs = vehicle.ratings.all()
        vehicle.rating_count = ratings_qs.count()
        vehicle.average_rating = ratings_qs.aggregate(avg=Avg('overall_rating'))['avg'] or 0
        vehicle.save(update_fields=['average_rating', 'rating_count'])
        return rating