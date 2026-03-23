from django.contrib import admin
from django.utils.html import format_html
from .models import VehicleListing, Booking, Rating

@admin.register(VehicleListing)
class VehicleListingAdmin(admin.ModelAdmin):
    list_display = [
        'vehicle_name',
        'vendor_name',
        'vehicle_type',
        'seating_capacity',
        'price_per_day',
        'average_rating',
        'rating_count',
        'status_badge',
        'created_at'
    ]
    
    list_filter = ['status', 'vehicle_type', 'created_at']
    
    search_fields = [
        'vehicle_name', 
        'vehicle_number',
        'vendor__email',
        'vendor__full_name'
    ]
    
    readonly_fields = ['created_at', 'updated_at', 'approved_at']
    
    fieldsets = (
        ('Vehicle Information', {
            'fields': (
                'vendor',
                'vehicle_type',
                'vehicle_name',
                'vehicle_number',
                'seating_capacity',
            )
        }),
        ('Pricing & Location', {
            'fields': (
                'price_per_day',
                'available_location',
            )
        }),
        ('Details', {
            'fields': (
                'description',
                'features',
                'primary_image',
                'contact_number',
            )
        }),
        ('Availability & Status', {
            'fields': (
                'is_available',
                'status',
                'admin_notes',
            )
        }),
        ('Timestamps', {
            'fields': (
                'created_at',
                'updated_at',
                'approved_at',
            ),
            'classes': ('collapse',),
        }),
    )
    
    actions = ['approve_listings', 'reject_listings']
    
    def vendor_name(self, obj):
        return obj.vendor.full_name
    vendor_name.short_description = 'Vendor'
    
    def status_badge(self, obj):
        colors = {
            'pending': '#ffc107',
            'approved': '#28a745',
            'rejected': '#dc3545',
            'inactive': '#6c757d',
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            colors.get(obj.status, '#6c757d'),
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def approve_listings(self, request, queryset):
        count = 0
        for listing in queryset:
            listing.approve()
            count += 1
        self.message_user(request, f'{count} listing(s) approved.')
    approve_listings.short_description = 'Approve selected listings'
    
    def reject_listings(self, request, queryset):
        count = 0
        for listing in queryset:
            listing.reject("Rejected by admin")
            count += 1
        self.message_user(request, f'{count} listing(s) rejected.')
    reject_listings.short_description = 'Reject selected listings'


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'tourist_name',
        'vehicle_info',
        'start_date',
        'end_date',
        'total_price',
        'status_badge',
        'created_at'
    ]
    
    list_filter = ['status', 'negotiation_status', 'start_date', 'created_at']
    
    search_fields = [
        'tourist__email',
        'tourist__full_name',
        'vehicle_listing__vehicle_name',
    ]
    
    readonly_fields = ['created_at', 'updated_at', 'confirmed_at', 'completed_at', 'total_days', 'total_price']

    fieldsets = (
        ('Booking Details', {
            'fields': (
                'tourist',
                'vehicle_listing',
                'start_date',
                'end_date',
            )
        }),
        ('Trip Information', {
            'fields': (
                'pickup_location',
                'dropoff_location',
                'number_of_passengers',
                'special_requests',
            )
        }),
        ('Contact', {
            'fields': (
                'contact_number',
            )
        }),
        ('Pricing', {
            'fields': (
                'price_per_day',
                'total_days',
                'total_price',
            )
        }),
        ('Price Negotiation', {
            'fields': (
                'original_price_per_day',
                'customer_offered_price',
                'vendor_counter_price',
                'final_price_per_day',
                'negotiation_status',
                'negotiation_expires_at',
                'price_negotiated',
            ),
            'classes': ('collapse',),
        }),
        ('Status', {
            'fields': (
                'status',
                'admin_notes',
            )
        }),
        ('Timestamps', {
            'fields': (
                'created_at',
                'updated_at',
                'confirmed_at',
                'completed_at',
            ),
            'classes': ('collapse',),
        }),
    )
    
    def tourist_name(self, obj):
        return obj.tourist.full_name
    tourist_name.short_description = 'Tourist'
    
    def vehicle_info(self, obj):
        return f"{obj.vehicle_listing.vehicle_name}"
    vehicle_info.short_description = 'Vehicle'
    
    def status_badge(self, obj):
        colors = {
            'pending': '#ffc107',
            'pending_vendor_approval': '#e67e22',
            'pending_customer_approval': '#f39c12',
            'confirmed': '#28a745',
            'cancelled': '#dc3545',
            'completed': '#17a2b8',
            'rejected': '#6c757d',
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            colors.get(obj.status, '#6c757d'),
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ['id', 'tourist_name', 'vehicle_name', 'overall_rating', 'created_at']
    list_filter = ['overall_rating', 'created_at']
    search_fields = ['tourist__email', 'tourist__full_name', 'vehicle_listing__vehicle_name']
    readonly_fields = ['created_at']

    def tourist_name(self, obj):
        return obj.tourist.full_name
    tourist_name.short_description = 'Tourist'

    def vehicle_name(self, obj):
        return obj.vehicle_listing.vehicle_name
    vehicle_name.short_description = 'Vehicle'