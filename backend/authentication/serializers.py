"""
Serializers for Authentication
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'role',
            'pan_number', 'business_address', 'is_vendor_approved',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'password_confirm',
            'full_name', 'role', 'pan_number', 'business_address', 'is_vendor_approved',
        ]
    
    def validate(self, attrs):
        """Custom validation"""
        
        # Check passwords match
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        
        # Check full_name has 2+ words
        if len(attrs['full_name'].split()) < 2:
            raise serializers.ValidationError({
                "full_name": "Full name must contain at least 2 words."
            })
        
        # Vendor-specific validation
        if attrs.get('role') == 'vendor':
            if not attrs.get('pan_number'):
                raise serializers.ValidationError({
                    "pan_number": "PAN number is required for vendors."
                })
            if not attrs.get('business_address'):
                raise serializers.ValidationError({
                    "business_address": "Business address is required for vendors."
                })
        
        return attrs
    
    def create(self, validated_data):
        """Create user with hashed password"""
        
        # Remove password_confirm
        validated_data.pop('password_confirm')
        
        # Create user
        user = User.objects.create_user(
            username=validated_data['email'],  # Use email as username
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data['full_name'],
            role=validated_data.get('role', 'tourist'),
            pan_number=validated_data.get('pan_number'),
            business_address=validated_data.get('business_address'),
        )
        
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for login"""
    
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )