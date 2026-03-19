from django.contrib import admin
from .models import TripTemplate


@admin.register(TripTemplate)
class TripTemplateAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'difficulty', 'duration_days', 'starting_price', 'is_active')
    list_filter = ('category', 'difficulty', 'is_active')
    search_fields = ('title', 'description')
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ('created_at', 'updated_at')
