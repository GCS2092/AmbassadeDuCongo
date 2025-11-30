"""
Custom middleware for the Embassy PWA
"""
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from .models import AuditLog
import logging

logger = logging.getLogger('embassy')


class AuditLogMiddleware(MiddlewareMixin):
    """
    Middleware to automatically log important actions - Sécurité renforcée
    """
    
    LOGGED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']
    SENSITIVE_PATHS = [
        '/api/auth/', 
        '/api/payments/', 
        '/api/applications/',
        '/api/admin/',
        '/api/users/',
        '/api/appointments/',
    ]
    
    # Actions spécifiques à logger
    SENSITIVE_ACTIONS = [
        'login', 'register', 'logout', 'password_reset',
        'change_role', 'activate', 'deactivate',
        'payment', 'application_create', 'application_update',
    ]
    
    def process_response(self, request, response):
        """Log requests to sensitive endpoints"""
        path = request.path
        
        # Logger toutes les actions sensibles
        should_log = False
        
        # Vérifier si c'est une méthode à logger
        if request.method in self.LOGGED_METHODS:
            # Vérifier si le chemin est sensible
            is_sensitive_path = any(path.startswith(sp) for sp in self.SENSITIVE_PATHS)
            
            # Vérifier si c'est une action sensible
            is_sensitive_action = any(action in path.lower() for action in self.SENSITIVE_ACTIONS)
            
            should_log = is_sensitive_path or is_sensitive_action
        
        # Logger aussi les erreurs de sécurité (401, 403, 429)
        if response.status_code in [401, 403, 429]:
            should_log = True
        
        if should_log:
            try:
                user = None
                if hasattr(request, 'user') and request.user.is_authenticated:
                    user = request.user
                
                # Déterminer l'action
                action = self._get_action(request.method, path, response.status_code)
                
                # Créer le log d'audit
                AuditLog.objects.create(
                    user=user,
                    action=action,
                    description=f"{request.method} {path} - Status: {response.status_code}",
                    ip_address=self._get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
                    metadata={
                        'method': request.method,
                        'path': path,
                        'status_code': response.status_code,
                        'user_email': user.email if user else None,
                        'user_role': user.role if user else None,
                    }
                )
                
                # Logger aussi dans le fichier de sécurité si c'est critique
                if response.status_code in [401, 403, 429]:
                    logger.warning(
                        f"SECURITY: {action} - {path} - "
                        f"User: {user.email if user else 'Anonymous'} - "
                        f"IP: {self._get_client_ip(request)} - "
                        f"Status: {response.status_code}"
                    )
            except Exception as e:
                logger.error(f"Error logging audit: {e}")
        
        return response
    
    @staticmethod
    def _get_action(method, path, status_code):
        """Map HTTP method and path to action"""
        path_lower = path.lower()
        
        # Actions spécifiques
        if 'login' in path_lower:
            return 'LOGIN' if status_code == 200 else 'LOGIN_FAILED'
        if 'register' in path_lower:
            return 'CREATE'  # User registration
        if 'logout' in path_lower:
            return 'LOGOUT'
        if 'password' in path_lower and 'reset' in path_lower:
            return 'PASSWORD_RESET'
        if 'change_role' in path_lower:
            return 'CHANGE_ROLE'
        if 'activate' in path_lower:
            return 'ACTIVATE_USER'
        if 'deactivate' in path_lower:
            return 'DEACTIVATE_USER'
        if 'payment' in path_lower:
            return 'PAYMENT'
        
        # Actions génériques par méthode HTTP
        mapping = {
            'POST': 'CREATE',
            'PUT': 'UPDATE',
            'PATCH': 'UPDATE',
            'DELETE': 'DELETE',
            'GET': 'VIEW',
        }
        return mapping.get(method, 'UPDATE')
    
    @staticmethod
    def _get_client_ip(request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Add additional security headers
    """
    
    def process_response(self, request, response):
        """Add security headers"""
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        return response


class RateLimitExceededMiddleware(MiddlewareMixin):
    """
    Custom rate limit exceeded handler
    """
    
    def process_exception(self, request, exception):
        """Handle rate limit exceptions"""
        from rest_framework.exceptions import Throttled
        
        if isinstance(exception, Throttled):
            return JsonResponse({
                'error': 'Trop de requêtes. Veuillez réessayer plus tard.',
                'wait': exception.wait
            }, status=429)
        
        return None

