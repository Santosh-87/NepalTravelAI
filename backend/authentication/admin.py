from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.safestring import mark_safe
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = [
        'email', 
        'full_name', 
        'role', 
        'vendor_status',
        'is_active',
        'created_at'
    ]
    
    list_filter = ['role', 'is_vendor_approved', 'is_active', 'created_at']
    
    search_fields = ['email', 'full_name', 'pan_number']
    
    fieldsets = (
        ('Account', {
            'fields': ('email', 'password')
        }),
        ('Personal Info', {
            'fields': ('full_name', 'role')
        }),
        ('Vendor Information', {
            'fields': ('pan_number', 'business_address', 'is_vendor_approved'),
            'classes': ('collapse',),
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser'),
            'classes': ('collapse',),
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at', 'last_login'),
            'classes': ('collapse',),
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'full_name', 'role', 'password1', 'password2'),
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at', 'last_login']
    
    ordering = ['-created_at']
    
    actions = ['approve_vendors', 'reject_vendors']
    
    def vendor_status(self, obj):
        """Display vendor approval status with color coding"""
        if obj.role != 'vendor':
            return '-'
        
        if obj.is_vendor_approved:
            return mark_safe(
                '<span style="color: #28a745; font-weight: 600;">✓ Approved</span>'
            )
        else:
            return mark_safe(
                '<span style="color: #ffc107; font-weight: 600;">⏳ Pending</span>'
            )
    
    vendor_status.admin_order_field = 'is_vendor_approved'
    vendor_status.short_description = 'Vendor Status'
    
    def approve_vendors(self, request, queryset):
        vendors = queryset.filter(role='vendor')
        count = vendors.update(is_vendor_approved=True)
        self.message_user(request, f'{count} vendor(s) approved successfully.')
    
    approve_vendors.short_description = 'Approve selected vendors'
    
    def reject_vendors(self, request, queryset):
        vendors = queryset.filter(role='vendor')
        count = vendors.update(is_vendor_approved=False)
        self.message_user(request, f'{count} vendor(s) marked as pending.')
    
    reject_vendors.short_description = 'Mark vendors as pending'