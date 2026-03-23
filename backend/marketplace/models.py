from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal

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
    primary_image = models.ImageField(
        upload_to='vehicles/',
        blank=True,
        null=True,
        help_text="Vehicle photo"
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

    # Ratings (denormalized for performance)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    rating_count = models.PositiveIntegerField(default=0)

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
        ('pending_vendor_approval', 'Pending Vendor Approval'),
        ('pending_customer_approval', 'Pending Customer Approval'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    ]

    TRIP_TYPE_CHOICES = [
        ('within_valley', 'Within Valley'),
        ('outside_valley', 'Outside Valley'),
    ]

    NEGOTIATION_STATUS_CHOICES = [
        ('none', 'None'),
        ('customer_offered', 'Customer Offered'),
        ('vendor_countered', 'Vendor Countered'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
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
    trip_type = models.CharField(
        max_length=20,
        choices=TRIP_TYPE_CHOICES,
        default='outside_valley',
    )
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    number_of_passengers = models.PositiveIntegerField()

    # Pricing
    total_days = models.PositiveIntegerField()
    price_per_day = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    # Price Negotiation
    original_price_per_day = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Vendor's original listed price (preserved for transparency)"
    )
    customer_offered_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Customer's counter-offer per day"
    )
    vendor_counter_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Vendor's counter-offer per day"
    )
    final_price_per_day = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Agreed price per day after negotiation"
    )
    negotiation_status = models.CharField(
        max_length=20,
        choices=NEGOTIATION_STATUS_CHOICES,
        default='none',
    )
    negotiation_expires_at = models.DateTimeField(
        null=True, blank=True,
        help_text="48-hour deadline for negotiation response"
    )
    price_negotiated = models.BooleanField(default=False)

    # Contact
    contact_number = models.CharField(max_length=20)
    special_requests = models.TextField(blank=True)

    # Status
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default='pending'
    )

    admin_notes = models.TextField(blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

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

    def recalculate_total(self, effective_price):
        """Recalculate total_price using the given per-day price.
        effective_price already includes the OV markup if applicable."""
        if self.trip_type == 'within_valley':
            self.total_days = 1
            self.total_price = effective_price
        else:
            days = (self.end_date - self.start_date).days + 1
            self.total_days = days
            self.total_price = effective_price * days

    def calculate_total(self):
        """Calculate total price based on trip type"""
        effective_price = self.final_price_per_day or self.price_per_day
        self.recalculate_total(effective_price)
        return self.total_price

    def confirm(self):
        """Vendor confirms booking"""
        self.status = 'confirmed'
        self.confirmed_at = timezone.now()
        self.save()

    def complete(self):
        """Mark booking as completed after trip"""
        if self.status != 'confirmed':
            raise ValueError("Only confirmed bookings can be completed")
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()

    def reject(self, reason=""):
        """Reject a booking (vendor declines)"""
        if self.status not in ('pending', 'pending_vendor_approval'):
            raise ValueError("Only pending bookings can be rejected")
        self.status = 'rejected'
        self.admin_notes = reason
        self.save()

    def cancel(self):
        """Cancel booking"""
        self.status = 'cancelled'
        self.save()

    # --- Price Negotiation Methods ---

    def accept_customer_offer(self):
        """Vendor accepts the customer's counter-offer"""
        self.final_price_per_day = self.customer_offered_price
        self.recalculate_total(self.final_price_per_day)
        self.negotiation_status = 'accepted'
        self.price_negotiated = True
        self.status = 'pending'
        self.save()

    def vendor_counter_offer(self, counter_price):
        """Vendor counters with a different price"""
        from datetime import timedelta
        self.vendor_counter_price = counter_price
        self.negotiation_status = 'vendor_countered'
        self.status = 'pending_customer_approval'
        self.negotiation_expires_at = timezone.now() + timedelta(hours=48)
        self.save()

    def customer_accept_counter(self):
        """Customer accepts the vendor's counter-offer"""
        self.final_price_per_day = self.vendor_counter_price
        self.recalculate_total(self.final_price_per_day)
        self.negotiation_status = 'accepted'
        self.price_negotiated = True
        self.status = 'pending'
        self.save()

    def customer_reject_counter(self):
        """Customer rejects the vendor's counter-offer — booking cancelled"""
        self.status = 'cancelled'
        self.negotiation_status = 'rejected'
        self.save()


class Rating(models.Model):
    """
    Post-trip rating and review by tourist
    """
    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name='rating'
    )
    tourist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ratings_given'
    )
    vendor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ratings_received'
    )
    vehicle_listing = models.ForeignKey(
        VehicleListing,
        on_delete=models.CASCADE,
        related_name='ratings'
    )

    # Star ratings (1-5)
    overall_rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    vehicle_condition_rating = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    punctuality_rating = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    driver_behavior_rating = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )

    # Written review
    review_text = models.CharField(max_length=500, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ratings'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['vendor']),
            models.Index(fields=['vehicle_listing']),
        ]

    def __str__(self):
        return f"Rating for Booking #{self.booking_id} by {self.tourist.email}"