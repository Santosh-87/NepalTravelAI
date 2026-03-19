from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CommunityPostViewSet, CommentViewSet

router = DefaultRouter()
router.register(r'posts', CommunityPostViewSet, basename='community-post')

urlpatterns = [
    path('', include(router.urls)),
    path('posts/<int:post_pk>/comments/',
         CommentViewSet.as_view({'get': 'list', 'post': 'create'}),
         name='post-comments'),
    path('posts/<int:post_pk>/comments/<int:pk>/',
         CommentViewSet.as_view({'delete': 'destroy'}),
         name='post-comment-detail'),
]
