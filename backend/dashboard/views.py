from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Q
from django.utils import timezone

from marketplace.models import VehicleListing, Booking
from community.models import CommunityPost
from .serializers import AdminUserSerializer, AdminVehicleSerializer, AdminBookingSerializer
from .permissions import IsAdminUser

User = get_user_model()


class AdminStatsView(APIView):
    """GET /api/admin/stats/ — dashboard overview numbers."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_users     = User.objects.filter(is_staff=False).count()
        total_tourists  = User.objects.filter(role='tourist').count()
        total_vendors   = User.objects.filter(role='vendor').count()
        pending_vendors = User.objects.filter(role='vendor', is_vendor_approved=False, is_active=True).count()

        total_vehicles   = VehicleListing.objects.count()
        pending_vehicles = VehicleListing.objects.filter(status='pending').count()
        approved_vehicles = VehicleListing.objects.filter(status='approved').count()

        total_bookings     = Booking.objects.count()
        pending_bookings   = Booking.objects.filter(status='pending').count()
        confirmed_bookings = Booking.objects.filter(status='confirmed').count()
        completed_bookings = Booking.objects.filter(status='completed').count()

        total_revenue = (
            Booking.objects
            .filter(status__in=['confirmed', 'completed'])
            .aggregate(total=Sum('total_price'))['total'] or 0
        )

        recent_bookings = (
            Booking.objects
            .select_related('tourist', 'vehicle_listing', 'vehicle_listing__vendor')
            .order_by('-created_at')[:6]
        )

        return Response({
            'users': {
                'total': total_users,
                'tourists': total_tourists,
                'vendors': total_vendors,
                'pending_vendors': pending_vendors,
            },
            'vehicles': {
                'total': total_vehicles,
                'pending': pending_vehicles,
                'approved': approved_vehicles,
            },
            'bookings': {
                'total': total_bookings,
                'pending': pending_bookings,
                'confirmed': confirmed_bookings,
                'completed': completed_bookings,
            },
            'revenue': float(total_revenue),
            'recent_bookings': AdminBookingSerializer(recent_bookings, many=True).data,
        })


class AdminUsersView(APIView):
    """GET /api/admin/users/ — list all non-staff users."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        queryset = User.objects.filter(is_staff=False).order_by('-created_at')

        role = request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)

        search = request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) | Q(full_name__icontains=search)
            )

        serializer = AdminUserSerializer(queryset, many=True)
        return Response(serializer.data)


class AdminUserActionView(APIView):
    """POST /api/admin/users/<pk>/<action>/ — approve/reject vendor, toggle active."""
    permission_classes = [IsAdminUser]

    def _get_user(self, pk):
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None

    def post(self, request, pk, action):
        user = self._get_user(pk)
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if action == 'approve':
            user.is_vendor_approved = True
            user.save()
            return Response({'message': f'{user.full_name} approved as vendor.'})

        if action == 'reject':
            user.is_vendor_approved = False
            user.save()
            return Response({'message': f'{user.full_name} vendor status revoked.'})

        if action == 'toggle-active':
            user.is_active = not user.is_active
            user.save()
            word = 'activated' if user.is_active else 'deactivated'
            return Response({'message': f'{user.full_name} has been {word}.'})

        return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)


class AdminVehiclesView(APIView):
    """GET /api/admin/vehicles/ — list all vehicle listings."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        queryset = VehicleListing.objects.select_related('vendor').order_by('-created_at')

        vehicle_status = request.query_params.get('status')
        if vehicle_status:
            queryset = queryset.filter(status=vehicle_status)

        search = request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(vehicle_name__icontains=search) |
                Q(vendor__full_name__icontains=search) |
                Q(vehicle_number__icontains=search)
            )

        serializer = AdminVehicleSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)


class AdminVehicleActionView(APIView):
    """POST /api/admin/vehicles/<pk>/<action>/ — approve or reject a listing."""
    permission_classes = [IsAdminUser]

    def _get_vehicle(self, pk):
        try:
            return VehicleListing.objects.get(pk=pk)
        except VehicleListing.DoesNotExist:
            return None

    def post(self, request, pk, action):
        vehicle = self._get_vehicle(pk)
        if not vehicle:
            return Response({'error': 'Vehicle not found'}, status=status.HTTP_404_NOT_FOUND)

        if action == 'approve':
            vehicle.approve()
            return Response({'message': f'"{vehicle.vehicle_name}" has been approved.'})

        if action == 'reject':
            reason = request.data.get('reason', '')
            vehicle.reject(reason)
            return Response({'message': f'"{vehicle.vehicle_name}" has been rejected.'})

        return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)


class AdminBookingsView(APIView):
    """GET /api/admin/bookings/ — list all bookings."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        queryset = (
            Booking.objects
            .select_related('tourist', 'vehicle_listing', 'vehicle_listing__vendor')
            .order_by('-created_at')
        )

        booking_status = request.query_params.get('status')
        if booking_status:
            queryset = queryset.filter(status=booking_status)

        search = request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(tourist__full_name__icontains=search) |
                Q(tourist__email__icontains=search) |
                Q(vehicle_listing__vehicle_name__icontains=search)
            )

        serializer = AdminBookingSerializer(queryset, many=True)
        return Response(serializer.data)


class AdminCommunityPostsView(APIView):
    """GET /api/admin-panel/community-posts/ — list all community posts."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        queryset = CommunityPost.objects.select_related('author').order_by('-created_at')

        search = request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(author__full_name__icontains=search) |
                Q(author__email__icontains=search)
            )

        category = request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)

        posts = queryset[:100]
        data = [{
            'id': p.id,
            'title': p.title,
            'content': p.content,
            'author_name': p.author.full_name,
            'author_email': p.author.email,
            'category': p.category,
            'likes_count': p.likes_count,
            'comments_count': p.comments_count,
            'is_active': p.is_active,
            'created_at': p.created_at,
        } for p in posts]
        return Response(data)


class AdminCommunityPostActionView(APIView):
    """POST /api/admin-panel/community-posts/<pk>/<action>/ — moderate posts."""
    permission_classes = [IsAdminUser]

    def post(self, request, pk, action):
        try:
            post = CommunityPost.objects.get(pk=pk)
        except CommunityPost.DoesNotExist:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

        if action == 'deactivate':
            post.is_active = False
            post.save()
            return Response({'message': f'Post "{post.title}" deactivated.'})

        if action == 'activate':
            post.is_active = True
            post.save()
            return Response({'message': f'Post "{post.title}" activated.'})

        return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)


class AdminAnalyticsView(APIView):
    """GET /api/admin-panel/analytics/ — chart data for the dashboard."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        from datetime import datetime as dt

        now = timezone.now()

        # ---- Monthly trends: last 6 calendar months ----
        monthly_trends = []
        for i in range(5, -1, -1):
            year = now.year
            month = now.month - i
            while month <= 0:
                month += 12
                year -= 1

            label = dt(year, month, 1).strftime('%b')

            bookings_count = Booking.objects.filter(
                created_at__year=year,
                created_at__month=month,
            ).count()

            revenue = Booking.objects.filter(
                status__in=['confirmed', 'completed'],
                created_at__year=year,
                created_at__month=month,
            ).aggregate(total=Sum('total_price'))['total'] or 0

            monthly_trends.append({
                'month': label,
                'bookings': bookings_count,
                'revenue': float(revenue),
            })

        # ---- Booking status distribution ----
        status_counts = Booking.objects.values('status').annotate(count=Count('id'))
        booking_status_dist = [
            {'status': s['status'].capitalize(), 'count': s['count']}
            for s in status_counts
        ]

        # ---- Vehicle type distribution ----
        vehicle_type_dist = [
            {
                'type': v['vehicle_type'].replace('_', ' ').title(),
                'count': v['count'],
            }
            for v in VehicleListing.objects
            .values('vehicle_type')
            .annotate(count=Count('id'))
            .order_by('-count')
        ]

        return Response({
            'monthly_trends': monthly_trends,
            'booking_status_dist': booking_status_dist,
            'vehicle_type_dist': vehicle_type_dist,
        })
