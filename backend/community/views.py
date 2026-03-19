from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import CommunityPost, Comment, PostLike
from .serializers import (
    CommunityPostListSerializer,
    CommunityPostDetailSerializer,
    CommunityPostCreateSerializer,
    CommentSerializer,
)


class CommunityPostViewSet(viewsets.ModelViewSet):
    """Community posts with public read and authenticated write."""

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = CommunityPost.objects.filter(is_active=True).select_related('author').prefetch_related('images')

        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(content__icontains=search)
            )

        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return CommunityPostCreateSerializer
        if self.action == 'retrieve':
            return CommunityPostDetailSerializer
        return CommunityPostListSerializer

    def perform_destroy(self, instance):
        if instance.author != self.request.user and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own posts.")
        instance.is_active = False
        instance.save()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def toggle_like(self, request, pk=None):
        post = self.get_object()
        like, created = PostLike.objects.get_or_create(post=post, user=request.user)
        if not created:
            like.delete()
            post.likes_count = max(0, post.likes_count - 1)
            post.save()
            return Response({'liked': False, 'likes_count': post.likes_count})
        post.likes_count += 1
        post.save()
        return Response({'liked': True, 'likes_count': post.likes_count})


class CommentViewSet(viewsets.ModelViewSet):
    """Comments nested under a post."""

    def get_permissions(self):
        if self.action == 'list':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return Comment.objects.filter(
            post_id=self.kwargs['post_pk'],
            parent__isnull=True,
        ).select_related('author').prefetch_related('replies__author')

    def get_serializer_class(self):
        return CommentSerializer

    def perform_create(self, serializer):
        post_pk = self.kwargs['post_pk']
        post = CommunityPost.objects.get(pk=post_pk)
        serializer.save(author=self.request.user, post=post)
        post.comments_count += 1
        post.save()

    def perform_destroy(self, instance):
        if instance.author != self.request.user and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own comments.")
        post = instance.post
        # Count the comment + its replies
        reply_count = instance.replies.count()
        post.comments_count = max(0, post.comments_count - 1 - reply_count)
        post.save()
        instance.delete()
