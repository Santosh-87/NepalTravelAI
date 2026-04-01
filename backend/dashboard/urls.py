from django.urls import path
from . import views

urlpatterns = [
    path('stats/', views.AdminStatsView.as_view(), name='admin-stats'),
    path('analytics/', views.AdminAnalyticsView.as_view(), name='admin-analytics'),
    path('users/', views.AdminUsersView.as_view(), name='admin-users'),
    path('users/<int:pk>/<str:action>/', views.AdminUserActionView.as_view(), name='admin-user-action'),
    path('vehicles/', views.AdminVehiclesView.as_view(), name='admin-vehicles'),
    path('vehicles/<int:pk>/<str:action>/', views.AdminVehicleActionView.as_view(), name='admin-vehicle-action'),
    path('bookings/', views.AdminBookingsView.as_view(), name='admin-bookings'),
    path('community-posts/', views.AdminCommunityPostsView.as_view(), name='admin-community-posts'),
    path('community-posts/<int:pk>/<str:action>/', views.AdminCommunityPostActionView.as_view(), name='admin-community-post-action'),
]
