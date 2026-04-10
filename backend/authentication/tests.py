"""
Unit tests for the Password Reset feature.

Tests the DB-stored token approach:
  - ForgotPasswordView generates a token and stores it in the DB
  - ResetPasswordView validates the token, checks expiry, and resets the password
"""

from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from authentication.models import User, PasswordResetToken


class ForgotPasswordTests(TestCase):
    """Tests for POST /api/auth/forgot-password/"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser@example.com',
            email='testuser@example.com',
            password='OldPass123',
            full_name='Test User',
            role='tourist',
        )

    def test_forgot_password_creates_token_in_db(self):
        """A valid email should create a PasswordResetToken in the database."""
        response = self.client.post('/api/auth/forgot-password/', {'email': 'testuser@example.com'})

        self.assertEqual(response.status_code, 200)

        # Token must exist in DB for this user
        self.assertTrue(PasswordResetToken.objects.filter(user=self.user).exists())
        token = PasswordResetToken.objects.get(user=self.user)
        self.assertEqual(len(token.token), 32)  # uuid4().hex = 32 chars

    def test_forgot_password_nonexistent_email_returns_200(self):
        """A non-existent email should still return 200 (prevents email enumeration)."""
        response = self.client.post('/api/auth/forgot-password/', {'email': 'nobody@example.com'})

        self.assertEqual(response.status_code, 200)
        # No token should be created
        self.assertEqual(PasswordResetToken.objects.count(), 0)

    def test_forgot_password_replaces_old_token(self):
        """Requesting a reset twice should delete the old token and create a new one."""
        self.client.post('/api/auth/forgot-password/', {'email': 'testuser@example.com'})
        old_token = PasswordResetToken.objects.get(user=self.user).token

        self.client.post('/api/auth/forgot-password/', {'email': 'testuser@example.com'})
        new_token = PasswordResetToken.objects.get(user=self.user).token

        # Only one token should exist, and it should be different
        self.assertEqual(PasswordResetToken.objects.filter(user=self.user).count(), 1)
        self.assertNotEqual(old_token, new_token)

    def test_forgot_password_missing_email_returns_400(self):
        """Missing email field should return 400."""
        response = self.client.post('/api/auth/forgot-password/', {})
        self.assertEqual(response.status_code, 400)


class ResetPasswordTests(TestCase):
    """Tests for POST /api/auth/reset-password/"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser@example.com',
            email='testuser@example.com',
            password='OldPass123',
            full_name='Test User',
            role='tourist',
        )
        # Create a valid token
        self.reset_token = PasswordResetToken.objects.create(
            user=self.user,
            token='abc123def456abc123def456abc123de',
        )

    def test_reset_password_with_valid_token(self):
        """A valid token should reset the password and return 200."""
        response = self.client.post('/api/auth/reset-password/', {
            'token': 'abc123def456abc123def456abc123de',
            'new_password': 'NewSecure123',
            'new_password_confirm': 'NewSecure123',
        })

        self.assertEqual(response.status_code, 200)
        self.assertIn('Password has been reset', response.data['message'])

        # Verify the password was actually changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewSecure123'))

    def test_reset_password_token_is_single_use(self):
        """After a successful reset, the token should be deleted from the DB."""
        self.client.post('/api/auth/reset-password/', {
            'token': 'abc123def456abc123def456abc123de',
            'new_password': 'NewSecure123',
            'new_password_confirm': 'NewSecure123',
        })

        # Token should no longer exist
        self.assertFalse(PasswordResetToken.objects.filter(token='abc123def456abc123def456abc123de').exists())

        # Using the same token again should fail
        response = self.client.post('/api/auth/reset-password/', {
            'token': 'abc123def456abc123def456abc123de',
            'new_password': 'AnotherPass123',
            'new_password_confirm': 'AnotherPass123',
        })
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['error'], 'Invalid reset link')

    def test_reset_password_invalid_token(self):
        """A token that doesn't exist in the DB should return 400."""
        response = self.client.post('/api/auth/reset-password/', {
            'token': 'nonexistent_token_value_here_1234',
            'new_password': 'NewSecure123',
            'new_password_confirm': 'NewSecure123',
        })

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['error'], 'Invalid reset link')

    def test_reset_password_expired_token(self):
        """A token older than 1 hour should be rejected and deleted."""
        # Manually backdate the token to 2 hours ago
        self.reset_token.created_at = timezone.now() - timedelta(hours=2)
        self.reset_token.save(update_fields=['created_at'])

        response = self.client.post('/api/auth/reset-password/', {
            'token': 'abc123def456abc123def456abc123de',
            'new_password': 'NewSecure123',
            'new_password_confirm': 'NewSecure123',
        })

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['error'], 'Reset link has expired')

        # Expired token should be cleaned up
        self.assertFalse(PasswordResetToken.objects.filter(token='abc123def456abc123def456abc123de').exists())

    def test_reset_password_mismatch(self):
        """Mismatched passwords should return 400."""
        response = self.client.post('/api/auth/reset-password/', {
            'token': 'abc123def456abc123def456abc123de',
            'new_password': 'NewSecure123',
            'new_password_confirm': 'Different456',
        })

        self.assertEqual(response.status_code, 400)

    def test_reset_password_weak_password(self):
        """A weak password should be rejected by Django validators."""
        response = self.client.post('/api/auth/reset-password/', {
            'token': 'abc123def456abc123def456abc123de',
            'new_password': '123',
            'new_password_confirm': '123',
        })

        self.assertEqual(response.status_code, 400)


class PasswordResetTokenModelTests(TestCase):
    """Tests for the PasswordResetToken model."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser@example.com',
            email='testuser@example.com',
            password='OldPass123',
            full_name='Test User',
            role='tourist',
        )

    def test_is_expired_returns_false_for_new_token(self):
        """A freshly created token should not be expired."""
        token = PasswordResetToken.objects.create(user=self.user, token='fresh_token_123456789012345678')
        self.assertFalse(token.is_expired())

    def test_is_expired_returns_true_for_old_token(self):
        """A token older than PASSWORD_RESET_TIMEOUT should be expired."""
        token = PasswordResetToken.objects.create(user=self.user, token='old_token_12345678901234567890')
        token.created_at = timezone.now() - timedelta(hours=2)
        token.save(update_fields=['created_at'])
        self.assertTrue(token.is_expired())

    def test_token_not_affected_by_user_login(self):
        """Logging in should NOT invalidate an existing reset token.
        This was the core bug with the old hash-based approach."""
        token = PasswordResetToken.objects.create(user=self.user, token='stable_token_1234567890123456')

        # Simulate a login (update last_login like simplejwt does)
        self.user.last_login = timezone.now()
        self.user.save(update_fields=['last_login'])

        # Token should still be valid
        token.refresh_from_db()
        self.assertFalse(token.is_expired())

        # Token should still be findable
        found = PasswordResetToken.objects.get(token='stable_token_1234567890123456')
        self.assertEqual(found.user, self.user)
