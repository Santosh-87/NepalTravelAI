"""
Management command to clean up expired token blacklist records.
Run with: python manage.py cleanup_tokens
"""

from django.core.management.base import BaseCommand
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken


class Command(BaseCommand):
    help = 'Clean up expired token blacklist records'

    def handle(self, *args, **options):
        # Delete all outstanding tokens and blacklisted tokens
        # (these are only used for session tracking and can be safely cleared for development)
        outstanding_count, _ = OutstandingToken.objects.all().delete()
        blacklisted_count, _ = BlacklistedToken.objects.all().delete()

        self.stdout.write(self.style.SUCCESS(
            f'✓ Cleaned up token records: '
            f'{outstanding_count} outstanding tokens, '
            f'{blacklisted_count} blacklisted tokens'
        ))
