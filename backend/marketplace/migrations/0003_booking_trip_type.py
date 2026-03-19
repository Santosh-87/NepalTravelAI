from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0002_booking_admin_notes_booking_completed_at_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='booking',
            name='trip_type',
            field=models.CharField(
                choices=[
                    ('within_valley', 'Within Valley'),
                    ('outside_valley', 'Outside Valley'),
                ],
                default='outside_valley',
                max_length=20,
            ),
        ),
    ]
