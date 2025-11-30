"""
Vues personnalisées pour la 2FA dans Django Admin
Force l'authentification à deux facteurs pour les admins et super admins
"""
from django.shortcuts import render, redirect
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib.admin.views.decorators import staff_member_required
from django.views.decorators.http import require_http_methods
from django.contrib import messages
from django.conf import settings
from django.urls import reverse
from django.utils.decorators import method_decorator
from django.views import View
from django.http import JsonResponse
from django_otp import devices_for_user, user_has_device, login as otp_login
from django_otp.plugins.otp_totp.models import TOTPDevice
from django_otp.decorators import otp_required
from django_otp.util import random_hex
import qrcode
import qrcode.image.svg
from io import BytesIO
import base64
from .models import User


def requires_2fa(user):
    """
    Vérifie si un utilisateur nécessite la 2FA
    Seuls les ADMIN et SUPERADMIN doivent avoir la 2FA activée
    """
    return user.role in ['ADMIN', 'SUPERADMIN']


@method_decorator(staff_member_required, name='dispatch')
class Setup2FAView(View):
    """
    Vue pour configurer la 2FA TOTP pour un utilisateur admin/super admin
    Génère un QR code à scanner avec une application d'authentification
    """
    template_name = 'admin/setup_2fa.html'
    
    def get(self, request):
        user = request.user
        
        # Vérifier si l'utilisateur nécessite la 2FA
        if not requires_2fa(user):
            messages.error(request, 'La 2FA n\'est requise que pour les administrateurs.')
            return redirect('admin:index')
        
        # TOUJOURS supprimer TOUS les anciens appareils et en créer un nouveau
        # Cela garantit que le QR code affiché correspond à l'appareil vérifié
        TOTPDevice.objects.filter(user=user).delete()
        
        # Créer un nouvel appareil
        totp_device = TOTPDevice.objects.create(
            user=user,
            name='Ambassade Congo Admin',
            confirmed=False
        )
        
        # Stocker l'ID de l'appareil dans la session pour s'assurer qu'on vérifie le bon
        request.session['setup_2fa_device_id'] = totp_device.id
        
        # Générer le QR code
        config_url = totp_device.config_url
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(config_url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        qr_code_data = base64.b64encode(buffer.getvalue()).decode()
        
        context = {
            'qr_code': qr_code_data,
            'secret_key': totp_device.key,
            'device': totp_device,
            'user': user,
        }
        
        return render(request, self.template_name, context)
    
    def post(self, request):
        user = request.user
        token = request.POST.get('token', '').strip()
        
        if not token:
            messages.error(request, 'Veuillez entrer un code de vérification.')
            return redirect('admin_setup_2fa')
        
        # Récupérer l'ID de l'appareil depuis la session
        device_id = request.session.get('setup_2fa_device_id')
        
        if device_id:
            totp_device = TOTPDevice.objects.filter(id=device_id, user=user).first()
        else:
            # Fallback: prendre le seul appareil de l'utilisateur
            totp_device = TOTPDevice.objects.filter(user=user).first()
        
        if not totp_device:
            messages.error(request, 'Aucun appareil 2FA trouvé. Veuillez recommencer la configuration.')
            return redirect('admin_setup_2fa')
        
        # Vérifier le token
        if totp_device.verify_token(token):
            # Confirmer l'appareil et activer la 2FA
            totp_device.confirmed = True
            totp_device.save()
            user.is_2fa_enabled = True
            # IMPORTANT: utiliser update_fields pour éviter le conflit avec is_verified de django_otp
            user.save(update_fields=['is_2fa_enabled'])
            
            # Marquer l'utilisateur comme vérifié OTP pour cette session
            # Cela permet d'accéder à l'admin sans re-vérifier immédiatement
            otp_login(request, totp_device)
            
            # Nettoyer la session
            request.session.pop('setup_2fa_device_id', None)
            
            messages.success(request, 'La 2FA a été activée avec succès !')
            return redirect('admin:index')
        else:
            messages.error(request, 'Code de vérification invalide. Veuillez scanner à nouveau le QR code et réessayer.')
            return redirect('admin_setup_2fa')


@method_decorator(staff_member_required, name='dispatch')
class Verify2FAView(View):
    """
    Vue pour vérifier le code 2FA lors de la connexion à Django Admin
    """
    template_name = 'admin/verify_2fa.html'
    
    def get(self, request):
        user = request.user
        
        # Vérifier si l'utilisateur nécessite la 2FA
        if not requires_2fa(user):
            return redirect('admin:index')
        
        # Vérifier si l'utilisateur a déjà vérifié la 2FA dans cette session
        # django_otp ajoute la méthode is_verified() via le middleware
        if hasattr(request.user, 'is_verified') and request.user.is_verified():
            return redirect('admin:index')
        
        # Vérifier si l'utilisateur a un appareil TOTP configuré
        if not user_has_device(user):
            messages.warning(request, 'Vous devez configurer la 2FA avant de continuer.')
            return redirect('admin_setup_2fa')
        
        return render(request, self.template_name, {'user': user})
    
    def post(self, request):
        user = request.user
        token = request.POST.get('token', '').strip()
        
        if not token:
            messages.error(request, 'Veuillez entrer un code de vérification.')
            return render(request, self.template_name, {'user': user})
        
        # Vérifier le token avec tous les appareils TOTP de l'utilisateur
        devices = devices_for_user(user)
        verified_device = None
        
        for device in devices:
            if isinstance(device, TOTPDevice) and device.verify_token(token):
                verified_device = device
                break
        
        if verified_device:
            # Marquer l'utilisateur comme vérifié OTP pour cette session
            otp_login(request, verified_device)
            messages.success(request, 'Authentification 2FA réussie.')
            return redirect('admin:index')
        else:
            messages.error(request, 'Code de vérification invalide. Veuillez réessayer.')
            return render(request, self.template_name, {'user': user})


@method_decorator(staff_member_required, name='dispatch')
class Disable2FAView(View):
    """
    Vue pour désactiver la 2FA (nécessite confirmation)
    """
    template_name = 'admin/disable_2fa.html'
    
    def get(self, request):
        user = request.user
        return render(request, self.template_name, {'user': user})
    
    def post(self, request):
        user = request.user
        confirm = request.POST.get('confirm', '').lower() == 'yes'
        
        if not confirm:
            messages.error(request, 'Vous devez confirmer la désactivation de la 2FA.')
            return render(request, self.template_name, {'user': user})
        
        # Supprimer tous les appareils TOTP de l'utilisateur
        TOTPDevice.objects.filter(user=user).delete()
        user.is_2fa_enabled = False
        # IMPORTANT: utiliser update_fields pour éviter le conflit avec is_verified de django_otp
        user.save(update_fields=['is_2fa_enabled'])
        
        messages.success(request, 'La 2FA a été désactivée avec succès.')
        return redirect('admin:index')

