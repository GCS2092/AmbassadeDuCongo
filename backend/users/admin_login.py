"""
Vue de connexion personnalisée pour Django Admin avec support 2FA
Demande le code 2FA après la vérification du mot de passe pour les admins
"""
from django.contrib.auth import authenticate, login
from django.contrib.auth.views import LoginView
from django.shortcuts import redirect, render
from django.urls import reverse
from django.contrib import messages
from django.views.decorators.csrf import csrf_protect
from django.utils.decorators import method_decorator
from django.views import View
from django_otp import devices_for_user, user_has_device
from django_otp.plugins.otp_totp.models import TOTPDevice
from .models import User
from .admin_2fa import requires_2fa


@method_decorator(csrf_protect, name='dispatch')
class AdminLoginView(LoginView):
    """
    Vue de connexion personnalisée pour Django Admin
    Intègre la vérification 2FA dans le processus de connexion
    """
    template_name = 'admin/login_2fa.html'
    redirect_authenticated_user = True
    
    def form_valid(self, form):
        """
        Traite le formulaire de connexion
        Si l'utilisateur nécessite la 2FA, redirige vers la vérification
        Sinon, connecte directement l'utilisateur
        """
        username = form.cleaned_data.get('username')
        password = form.cleaned_data.get('password')
        
        # Authentifier l'utilisateur
        user = authenticate(
            self.request,
            username=username,
            password=password
        )
        
        if user is None:
            # Si l'authentification échoue, laisser Django gérer l'erreur
            return super().form_invalid(form)
        
        # Vérifier que l'utilisateur est staff (nécessaire pour accéder à Django Admin)
        if not user.is_staff:
            messages.error(self.request, 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.')
            return super().form_invalid(form)
        
        # Vérifier si l'utilisateur nécessite la 2FA
        if requires_2fa(user) and user_has_device(user):
            # Vérifier si la 2FA est activée
            if user.is_2fa_enabled:
                # Stocker l'utilisateur dans la session pour la vérification 2FA
                # On ne connecte pas encore l'utilisateur
                self.request.session['pending_user_id'] = user.id
                # Stocker le backend d'authentification
                backend = user.backend if hasattr(user, 'backend') else 'django.contrib.auth.backends.ModelBackend'
                self.request.session['pending_user_backend'] = backend
                
                # Rediriger vers la page de vérification 2FA
                messages.info(self.request, 'Veuillez entrer votre code d\'authentification à deux facteurs.')
                return redirect('admin:login_verify_2fa')
        
        # Si pas de 2FA requise, connecter directement l'utilisateur
        login(self.request, user)
        return redirect(self.get_success_url())
    
    def get_success_url(self):
        """URL de redirection après connexion réussie"""
        return reverse('admin:index')


@method_decorator(csrf_protect, name='dispatch')
class AdminLoginVerify2FAView(View):
    """
    Vue pour vérifier le code 2FA lors de la connexion
    """
    template_name = 'admin/login_verify_2fa.html'
    
    def dispatch(self, request, *args, **kwargs):
        """Vérifier qu'il y a un utilisateur en attente dans la session"""
        if 'pending_user_id' not in request.session:
            messages.error(request, 'Aucune session de connexion en cours.')
            return redirect('admin:login')
        return super().dispatch(request, *args, **kwargs)
    
    def get(self, request):
        """Afficher le formulaire de vérification 2FA"""
        user_id = request.session.get('pending_user_id')
        if not user_id:
            return redirect('admin:login')
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            messages.error(request, 'Utilisateur introuvable.')
            request.session.pop('pending_user_id', None)
            return redirect('admin:login')
        
        # Vérifier que l'utilisateur a bien un appareil TOTP
        if not user_has_device(user):
            messages.error(request, 'Aucun appareil 2FA configuré. Veuillez contacter un administrateur.')
            request.session.pop('pending_user_id', None)
            return redirect('admin:login')
        
        from django.shortcuts import render
        return render(request, self.template_name, {'user': user})
    
    def post(self, request):
        """Vérifier le code 2FA et connecter l'utilisateur"""
        # Gérer l'annulation
        if request.POST.get('cancel'):
            request.session.pop('pending_user_id', None)
            request.session.pop('pending_user_backend', None)
            return redirect('admin:login')
        
        user_id = request.session.get('pending_user_id')
        if not user_id:
            messages.error(request, 'Aucune session de connexion en cours.')
            return redirect('admin:login')
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            messages.error(request, 'Utilisateur introuvable.')
            request.session.pop('pending_user_id', None)
            return redirect('admin:login')
        
        token = request.POST.get('token', '').strip()
        
        if not token:
            messages.error(request, 'Veuillez entrer un code de vérification.')
            return self.get(request)
        
        # Vérifier le token avec tous les appareils TOTP de l'utilisateur
        devices = devices_for_user(user)
        verified_device = None
        
        for device in devices:
            if isinstance(device, TOTPDevice) and device.verify_token(token):
                verified_device = device
                break
        
        if verified_device:
            # Le code est valide, connecter l'utilisateur
            # Récupérer le backend d'authentification depuis la session
            backend = request.session.get('pending_user_backend', 'django.contrib.auth.backends.ModelBackend')
            
            # Nettoyer la session
            request.session.pop('pending_user_id', None)
            request.session.pop('pending_user_backend', None)
            
            # Connecter l'utilisateur
            user.backend = backend
            login(request, user)
            
            # Marquer l'appareil comme vérifié pour cette session
            verified_device.generate_challenge()
            
            messages.success(request, 'Connexion réussie avec authentification à deux facteurs.')
            return redirect('admin:index')
        else:
            messages.error(request, 'Code de vérification invalide. Veuillez réessayer.')
            return self.get(request)

