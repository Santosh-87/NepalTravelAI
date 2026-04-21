"""
Serializers for Authentication
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'role', 'phone_number',
            'pan_number', 'business_address', 'is_vendor_approved',
            'is_vendor_rejected', 'is_staff', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_staff', 'created_at', 'updated_at']

    def get_role(self, obj):
        return 'admin' if obj.is_staff else obj.role


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
            'full_name', 'role', 'phone_number', 'pan_number', 'business_address', 'is_vendor_approved',
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
            phone_number=validated_data.get('phone_number'),
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


class UpdateProfileSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile fields"""

    class Meta:
        model = User
        fields = ['full_name', 'email', 'phone_number', 'business_address']

    def validate_full_name(self, value):
        if len(value.split()) < 2:
            raise serializers.ValidationError("Full name must contain at least 2 words.")
        return value

    def validate_email(self, value):
        user = self.instance
        if User.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def update(self, instance, validated_data):
        # Keep username in sync with email (AbstractUser has a separate username column)
        if 'email' in validated_data:
            validated_data['username'] = validated_data['email']
        return super().update(instance, validated_data)


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password (requires current password)"""

    current_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password]
    )
    new_password_confirm = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password_confirm": "Password fields didn't match."})
        return attrs


class ForgotPasswordSerializer(serializers.Serializer):
    """Serializer for forgot-password email request"""

    email = serializers.EmailField(required=True)


class ResetPasswordSerializer(serializers.Serializer):
    """Serializer for confirming a password reset via DB-stored token"""

    token = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password]
    )
    new_password_confirm = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password_confirm": "Password fields didn't match."})
        return attrs