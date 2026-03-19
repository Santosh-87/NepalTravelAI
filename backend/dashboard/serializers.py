from rest_framework import serializers
from django.contrib.auth import get_user_model
from marketplace.models import VehicleListing, Booking

User = get_user_model()


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'role',
            'is_active', 'is_staff', 'is_vendor_approved',
            'pan_number', 'business_address',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AdminVehicleSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.full_name', read_only=True)
    vendor_email = serializers.CharField(source='vendor.email', read_only=True)

    class Meta:
        model = VehicleListing
        fields = [
            'id', 'vendor', 'vendor_name', 'vendor_email',
            'vehicle_type', 'vehicle_name', 'vehicle_number',
            'seating_capacity', 'price_per_day', 'description',
            'features', 'primary_image', 'available_location',
            'contact_number', 'is_available', 'status', 'admin_notes',
            'created_at', 'updated_at', 'approved_at',
        ]


class AdminBookingSerializer(serializers.ModelSerializer):
    tourist_name = serializers.CharField(source='tourist.full_name', read_only=True)
    tourist_email = serializers.CharField(source='tourist.email', read_only=True)
    vehicle_name = serializers.CharField(source='vehicle_listing.vehicle_name', read_only=True)
    vendor_name = serializers.CharField(source='vehicle_listing.vendor.full_name', read_only=True)
    vendor_email = serializers.CharField(source='vehicle_listing.vendor.email', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'tourist', 'tourist_name', 'tourist_email',
            'vehicle_listing', 'vehicle_name', 'vendor_name', 'vendor_email',
            'start_date', 'end_date', 'pickup_location', 'dropoff_location',
            'number_of_passengers', 'total_days', 'price_per_day', 'total_price',
            'contact_number', 'special_requests', 'status', 'admin_notes',
            'created_at', 'updated_at', 'confirmed_at', 'completed_at',
        ]
