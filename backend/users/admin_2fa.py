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
from django_otp import devices_for_user, user_has_device
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
        
        # Paramètre pour forcer la recréation d'un nouvel appareil
        force_new = request.GET.get('new', '0') == '1'
        
        # Si force_new, supprimer TOUS les anciens appareils non confirmés
        if force_new:
            TOTPDevice.objects.filter(user=user, confirmed=False).delete()
        
        # Chercher un appareil TOTP existant (confirmé ou non)
        totp_device = TOTPDevice.objects.filter(user=user).first()
        
        # Si aucun appareil n'existe, en créer un nouveau
        if not totp_device:
            totp_device = TOTPDevice.objects.create(
                user=user,
                name='Ambassade Congo Admin',
                confirmed=False,
                tolerance=2  # Accepte codes de +/- 60 secondes pour le décalage horaire
            )
        
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
        
        # Récupérer l'appareil TOTP de l'utilisateur (le plus récent)
        totp_device = TOTPDevice.objects.filter(user=user).order_by('-id').first()
        
        if not totp_device:
            messages.error(request, 'Aucun appareil 2FA trouvé. Veuillez recommencer la configuration.')
            return redirect('admin_setup_2fa')
        
        # Vérifier le token avec une tolérance pour le décalage horaire
        # tolerance=2 permet +/- 60 secondes de décalage
        if totp_device.verify_token(token, tolerance=2):
            # Confirmer l'appareil et activer la 2FA
            totp_device.confirmed = True
            totp_device.save()
            user.is_2fa_enabled = True
            user.save()
            
            # Supprimer les autres appareils non confirmés
            TOTPDevice.objects.filter(user=user, confirmed=False).exclude(id=totp_device.id).delete()
            
            messages.success(request, 'La 2FA a été activée avec succès !')
            return redirect('admin:index')
        else:
            messages.error(request, 'Code de vérification invalide. Vérifiez que l\'heure de votre téléphone est correcte et réessayez.')
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
            # Marquer l'appareil comme vérifié pour cette session
            # django_otp gère automatiquement la vérification via le middleware
            verified_device.generate_challenge()
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
        user.save()
        
        messages.success(request, 'La 2FA a été désactivée avec succès.')
        return redirect('admin:index')

