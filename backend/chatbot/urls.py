from django.urls import path
from .views import HealthCheckView, ChatView

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health'),
    path('chat/', ChatView.as_view(), name='chat'),
]