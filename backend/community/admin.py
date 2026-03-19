from django.contrib import admin
from .models import CommunityPost, PostImage, Comment, PostLike


class PostImageInline(admin.TabularInline):
    model = PostImage
    extra = 0


@admin.register(CommunityPost)
class CommunityPostAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'category', 'likes_count', 'comments_count', 'is_active', 'created_at')
    list_filter = ('category', 'is_active', 'created_at')
    search_fields = ('title', 'content', 'author__email', 'author__full_name')
    readonly_fields = ('likes_count', 'comments_count', 'created_at', 'updated_at')
    inlines = [PostImageInline]


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('post', 'author', 'content_preview', 'parent', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('content', 'author__email')

    def content_preview(self, obj):
        return obj.content[:80] + '...' if len(obj.content) > 80 else obj.content
    content_preview.short_description = 'Content'


@admin.register(PostLike)
class PostLikeAdmin(admin.ModelAdmin):
    list_display = ('post', 'user', 'created_at')
    list_filter = ('created_at',)
