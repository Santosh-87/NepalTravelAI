"""
Custom password reset token generator.

Django's default PasswordResetTokenGenerator includes last_login in the
hash value. Since simplejwt updates last_login on every login via
RefreshToken.for_user(), any login after requesting a reset would
immediately invalidate the token.

This custom generator excludes last_login so tokens stay valid for their
full duration regardless of login activity.
"""

from django.contrib.auth.tokens import PasswordResetTokenGenerator


class PasswordResetTokenGeneratorNoLastLogin(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        # Exclude last_login — only bind the token to the user's pk,
        # password, email, and the timestamp.
        email_field = user.get_email_field_name()
        email = getattr(user, email_field, '') or ''
        return f"{user.pk}{user.password}{timestamp}{email}"


password_reset_token_generator = PasswordResetTokenGeneratorNoLastLogin()
