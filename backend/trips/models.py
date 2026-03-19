from django.db import models


class TripTemplate(models.Model):
    CATEGORY_CHOICES = [
        ('trekking', 'Trekking'),
        ('cultural', 'Cultural'),
        ('adventure', 'Adventure'),
        ('wildlife', 'Wildlife'),
        ('pilgrimage', 'Pilgrimage'),
    ]

    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('moderate', 'Moderate'),
        ('challenging', 'Challenging'),
        ('strenuous', 'Strenuous'),
    ]

    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES)
    duration_days = models.PositiveIntegerField()
    best_season = models.CharField(max_length=100)
    max_altitude = models.PositiveIntegerField(help_text="Maximum altitude in meters")
    starting_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Starting price in USD")
    cover_image = models.ImageField(upload_to='trips/', blank=True, null=True)
    highlights = models.JSONField(default=list)
    itinerary_days = models.JSONField(default=list)
    included_services = models.JSONField(default=list)
    excluded_services = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'trip_templates'
        ordering = ['title']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['difficulty']),
            models.Index(fields=['slug']),
        ]

    def __str__(self):
        return self.title
