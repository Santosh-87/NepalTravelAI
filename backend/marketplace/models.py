from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.utils import timezone

class VehicleListing(models.Model):
    """
    Vendor's vehicle listing in marketplace
    """
    
    VEHICLE_TYPES = [
        ('car', 'Car'),
        ('suv', 'SUV'),
        ('hiace', 'Hiace/Van'),
        ('coaster', 'Coaster'),
        ('bus', 'Bus'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('inactive', 'Inactive'),
    ]
    
    # Basic info
    vendor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='vehicle_listings',
        limit_choices_to={'role': 'vendor'}
    )
    
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPES)
    vehicle_name = models.CharField(max_length=255, help_text="e.g., Toyota Hiace 2020")
    vehicle_number = models.CharField(max_length=50, help_text="License plate number")
    
    # Capacity
    seating_capacity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )
    
    # Pricing (NPR per day)
    price_per_day = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    
    # Description
    description = models.TextField(
        help_text="Describe your vehicle, amenities, etc."
    )
    
    # Features (stored as comma-separated)
    features = models.TextField(
        blank=True,
        help_text="AC, GPS, Music System (comma-separated)"
    )
    
    # Images 
    primary_image = models.URLField(
        blank=True,
        help_text="Image URL or upload path"
    )
    
    # Location
    available_location = models.CharField(
        max_length=255,
        help_text="City/area where vehicle is based"
    )
    
    # Contact
    contact_number = models.CharField(max_length=20)
    
    # Availability
    is_available = models.BooleanField(default=True)
    
    # Status (admin approval)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    admin_notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'vehicle_listings'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['vehicle_type']),
            models.Index(fields=['status']),
            models.Index(fields=['vendor']),
        ]
    
    def __str__(self):
        return f"{self.vehicle_name} - {self.vendor.full_name}"
    
    def approve(self):
        """Admin approves listing"""
        self.status = 'approved'
        self.approved_at = timezone.now()
        self.save()
    
    def reject(self, reason=""):
        """Admin rejects listing"""
        self.status = 'rejected'
        self.admin_notes = reason
        self.save()
    
    def get_features_list(self):
        """Return features as list"""
        if self.features:
            return [f.strip() for f in self.features.split(',')]
        return []


class Booking(models.Model):
    """
    Tourist booking a vehicle
    """
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]
    
    # Who & What
    tourist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookings',
        limit_choices_to={'role': 'tourist'}
    )
    vehicle_listing = models.ForeignKey(
        VehicleListing,
        on_delete=models.CASCADE,
        related_name='bookings'
    )
    
    # When
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Details
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    number_of_passengers = models.PositiveIntegerField()
    
    # Pricing
    total_days = models.PositiveIntegerField()
    price_per_day = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Contact
    contact_number = models.CharField(max_length=20)
    special_requests = models.TextField(blank=True)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'bookings'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tourist']),
            models.Index(fields=['vehicle_listing']),
            models.Index(fields=['status']),
            models.Index(fields=['start_date', 'end_date']),
        ]
    
    def __str__(self):
        return f"Booking #{self.id} - {self.tourist.email}"
    
    def calculate_total(self):
        """Calculate total price"""
        days = (self.end_date - self.start_date).days + 1
        self.total_days = days
        self.total_price = self.price_per_day * days
        return self.total_price
    
    def confirm(self):
        """Vendor confirms booking"""
        self.status = 'confirmed'
        self.confirmed_at = timezone.now()
        self.save()
    
    def cancel(self):
        """Cancel booking"""
        self.status = 'cancelled'
        self.save()