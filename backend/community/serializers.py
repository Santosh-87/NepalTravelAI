from rest_framework import serializers
from .models import CommunityPost, PostImage, Comment, PostLike


class PostImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostImage
        fields = ['id', 'image']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        img = data.get('image')
        if img and request and not img.startswith('http'):
            data['image'] = request.build_absolute_uri(img)
        return data


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'author', 'author_name', 'content', 'parent', 'replies', 'created_at']
        read_only_fields = ['author', 'created_at']

    def get_replies(self, obj):
        if obj.parent is not None:
            return []
        replies = obj.replies.select_related('author').all()
        return CommentSerializer(replies, many=True, context=self.context).data


class CommunityPostListSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    preview_image = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = CommunityPost
        fields = [
            'id', 'author', 'author_name', 'title', 'content', 'category',
            'location_tag', 'likes_count', 'comments_count', 'preview_image',
            'is_liked', 'created_at', 'updated_at',
        ]

    def get_preview_image(self, obj):
        first_image = obj.images.first()
        if first_image:
            request = self.context.get('request')
            url = first_image.image.url
            if request and not url.startswith('http'):
                return request.build_absolute_uri(url)
            return url
        return None

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return PostLike.objects.filter(post=obj, user=request.user).exists()
        return False


class CommunityPostDetailSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    author_email = serializers.CharField(source='author.email', read_only=True)
    images = PostImageSerializer(many=True, read_only=True)
    comments = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = CommunityPost
        fields = [
            'id', 'author', 'author_name', 'author_email', 'title', 'content',
            'category', 'location_tag', 'likes_count', 'comments_count',
            'images', 'comments', 'is_liked', 'created_at', 'updated_at',
        ]

    def get_comments(self, obj):
        top_level = obj.comments.filter(parent__isnull=True).select_related('author').prefetch_related('replies__author')
        return CommentSerializer(top_level, many=True, context=self.context).data

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return PostLike.objects.filter(post=obj, user=request.user).exists()
        return False


class CommunityPostCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunityPost
        fields = ['title', 'content', 'category', 'location_tag']

    def create(self, validated_data):
        request = self.context.get('request')
        post = CommunityPost.objects.create(author=request.user, **validated_data)
        images = request.FILES.getlist('images')
        for image in images:
            PostImage.objects.create(post=post, image=image)
        return post
