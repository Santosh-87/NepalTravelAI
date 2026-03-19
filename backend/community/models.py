from django.db import models
from django.conf import settings


class CommunityPost(models.Model):
    CATEGORY_CHOICES = [
        ('experience', 'Travel Experience'),
        ('itinerary', 'Itinerary'),
        ('tip', 'Travel Tip'),
        ('question', 'Question'),
        ('news', 'News'),
    ]

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='community_posts'
    )
    title = models.CharField(max_length=300)
    content = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    location_tag = models.CharField(max_length=255, blank=True)
    likes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'community_posts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['author']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return self.title


class PostImage(models.Model):
    post = models.ForeignKey(
        CommunityPost,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(upload_to='community/')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'post_images'

    def __str__(self):
        return f"Image for: {self.post.title}"


class Comment(models.Model):
    post = models.ForeignKey(
        CommunityPost,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='community_comments'
    )
    content = models.TextField()
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'post_comments'
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author.email} on {self.post.title}"


class PostLike(models.Model):
    post = models.ForeignKey(
        CommunityPost,
        on_delete=models.CASCADE,
        related_name='likes'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='post_likes'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'post_likes'
        unique_together = ('post', 'user')

    def __str__(self):
        return f"{self.user.email} likes {self.post.title}"
