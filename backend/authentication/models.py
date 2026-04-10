"""
Custom User Models for NepalTravel AI
Supports Tourist and Vendor roles
"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinLengthValidator, RegexValidator

class PasswordResetToken(models.Model):
    """
    Stores a short-lived token for password resets.
    Token is a uuid4 hex string (32 chars, only a-f and 0-9).
    Checked via simple DB lookup + timestamp expiry — no hash involved.
    """
    user = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='password_reset_tokens',
    )
    token = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'password_reset_tokens'

    def is_expired(self):
        from django.utils import timezone
        from django.conf import settings
        timeout = getattr(settings, 'PASSWORD_RESET_TIMEOUT', 3600)
        return (timezone.now() - self.created_at).total_seconds() > timeout

    def __str__(self):
        return f"Reset token for {self.user.email}"


class User(AbstractUser):
    """
    Extended User model with role-based fields
    """
    
    ROLE_CHOICES = [
        ('tourist', 'Tourist'),
        ('vendor', 'Vendor'),
    ]
    
    # Override email to make it required and unique
    email = models.EmailField(unique=True)
    
    # Custom fields
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='tourist'
    )
    
    full_name = models.CharField(
        max_length=255,
        validators=[MinLengthValidator(2)],
        help_text="Full name (minimum 2 words required)"
    )
    
    # Vendor-specific fields (nullable for tourists)
    pan_number = models.CharField(
        max_length=9,
        null=True,
        blank=True,
        validators=[
            RegexValidator(
                regex=r'^\d{9}$',
                message='PAN must be exactly 9 digits'
            )
        ],
        help_text="9-digit PAN number (vendors only)"
    )
    
    business_address = models.TextField(
        null=True,
        blank=True,
        help_text="Business address (vendors only)"
    )
    
    is_vendor_approved = models.BooleanField(
        default=False,
        help_text="Admin approval for vendor account"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Use email as username
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'full_name']  # Required for createsuperuser
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"
    
    def clean(self):
        """Custom validation"""
        from django.core.exceptions import ValidationError
        
        # Validate full_name has at least 2 words
        if len(self.full_name.split()) < 2:
            raise ValidationError({'full_name': 'Full name must contain at least 2 words'})
        
        # Vendors must have PAN and business address
        if self.role == 'vendor':
            if not self.pan_number:
                raise ValidationError({'pan_number': 'PAN number is required for vendors'})
            if not self.business_address:
                raise ValidationError({'business_address': 'Business address is required for vendors'})