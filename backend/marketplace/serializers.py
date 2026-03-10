from rest_framework import serializers
from .models import VehicleListing, Booking
from django.contrib.auth import get_user_model

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
    
    def create(self, validated_data):
        # Handle features list
        features_list = validated_data.pop('features_list', [])
        if features_list:
            validated_data['features'] = ', '.join(features_list)
        
        # Set vendor from request context
        validated_data['vendor'] = self.context['request'].user
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Handle features list
        features_list = validated_data.pop('features_list', None)
        if features_list:
            validated_data['features'] = ', '.join(features_list)
        
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
        ]
        read_only_fields = ['tourist', 'total_days', 'total_price', 'created_at', 'updated_at']
    
    def validate(self, attrs):
        # Check dates
        if attrs['start_date'] >= attrs['end_date']:
            raise serializers.ValidationError({
                'end_date': 'End date must be after start date'
            })
        
        # Check passengers
        vehicle = attrs.get('vehicle_listing')
        passengers = attrs.get('number_of_passengers')
        
        if vehicle and passengers > vehicle.seating_capacity:
            raise serializers.ValidationError({
                'number_of_passengers': f'Maximum capacity is {vehicle.seating_capacity}'
            })
        
        return attrs
    
    def create(self, validated_data):
        # Set tourist from request
        validated_data['tourist'] = self.context['request'].user
        
        # Calculate pricing
        vehicle = validated_data['vehicle_listing']
        validated_data['price_per_day'] = vehicle.price_per_day
        
        # Calculate days
        days = (validated_data['end_date'] - validated_data['start_date']).days + 1
        validated_data['total_days'] = days
        validated_data['total_price'] = validated_data['price_per_day'] * days
        
        return super().create(validated_data)