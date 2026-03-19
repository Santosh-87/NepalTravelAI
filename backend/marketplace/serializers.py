from rest_framework import serializers
from .models import VehicleListing, Booking
from django.contrib.auth import get_user_model
from decimal import Decimal

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
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['vendor', 'status', 'admin_notes', 'created_at', 'updated_at']

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
            'contact_number',
            'special_requests',
            'status',
            'created_at',
            'updated_at',
            'admin_notes',
            'completed_at',
        ]
        read_only_fields = ['tourist', 'price_per_day', 'total_days', 'total_price', 'admin_notes', 'completed_at', 'created_at', 'updated_at']
    
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

        # Get vehicle and lock in price
        vehicle = validated_data['vehicle_listing']
        validated_data['price_per_day'] = vehicle.price_per_day

        trip_type = validated_data.get('trip_type', 'outside_valley')
        start_date = validated_data['start_date']
        end_date = validated_data['end_date']

        if trip_type == 'within_valley':
            # Flat local rate: 60% of daily price, always 1 day
            validated_data['total_days'] = 1
            validated_data['total_price'] = (
                validated_data['price_per_day'] * Decimal('0.6')
            ).quantize(Decimal('0.01'))
            # Normalise end_date to match start_date for within-valley trips
            validated_data['end_date'] = start_date
        else:
            # Outside valley: per-day rate; same-day (start==end) counts as 1 day
            days = (end_date - start_date).days + 1
            validated_data['total_days'] = days
            validated_data['total_price'] = validated_data['price_per_day'] * days

        booking = Booking.objects.create(**validated_data)
        return booking