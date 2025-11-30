"""
Additional API views for feedback and utilities
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Feedback


class FeedbackViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user feedback (GRATUIT)
    """
    queryset = Feedback.objects.all()
    permission_classes = (AllowAny,)  # Allow anonymous feedback
    http_method_names = ['get', 'post']  # Read-only for users, create allowed
    
    def get_queryset(self):
        """Users can only see their own feedback"""
        if self.request.user.is_authenticated:
            if self.request.user.role in ['ADMIN', 'SUPERADMIN', 'AGENT_CONSULAIRE']:
                return Feedback.objects.all()
            return Feedback.objects.filter(user=self.request.user)
        return Feedback.objects.none()
    
    def create(self, request, *args, **kwargs):
        """Create feedback"""
        data = request.data.copy()
        
        # Add user if authenticated
        if request.user.is_authenticated:
            data['user'] = request.user.id
        
        # Add metadata
        data['ip_address'] = self.get_client_ip(request)
        data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')[:500]
        
        # Create feedback
        feedback = Feedback.objects.create(
            user=request.user if request.user.is_authenticated else None,
            page=data.get('page', ''),
            context=data.get('context', ''),
            rating=data.get('rating', 'POSITIVE'),
            comment=data.get('comment', ''),
            ip_address=data.get('ip_address'),
            user_agent=data.get('user_agent'),
        )
        
        return Response({
            'id': feedback.id,
            'status': 'success',
            'message': 'Merci pour votre retour !'
        }, status=status.HTTP_201_CREATED)
    
    @staticmethod
    def get_client_ip(request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

