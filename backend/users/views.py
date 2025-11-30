"""
User API Views
"""
import logging
import random
from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from core.throttles import LoginRateThrottle, RegisterRateThrottle, PasswordResetRateThrottle, EmailVerificationRateThrottle
from django.contrib.auth import authenticate
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone
from django.conf import settings
from django.db import models
from datetime import date, timedelta
from ipware import get_client_ip

from .models import User, Profile, EmailVerificationCode, UserDocument, DocumentReminder
from core.models import SiteSettings
from .serializers import (
    UserRegistrationSerializer, UserSerializer, AdminUserSerializer, ProfileSerializer, 
    ProfileUpdateSerializer, UserDocumentSerializer
)
from core.permissions import IsAdmin
from .utils import hashids_decode
from django.http import Http404

logger = logging.getLogger(__name__)


def generate_unique_code():
    """Génère un code unique pour EmailVerificationCode"""
    while True:
        code = str(random.randint(100000, 999999))
        if not EmailVerificationCode.objects.filter(code=code).exists():
            return code


def send_verification_email(user, password=None):
    """Envoie un code de vérification unique par email avec le mot de passe"""
    # Générer un code unique
    code_str = generate_unique_code()
    
    # Créer le code dans la DB
    EmailVerificationCode.objects.create(
        user=user, 
        code=code_str, 
        email=user.email
    )
    
    # Préparer le contenu de l'email
    context = {
        "user": user,
        "code": code_str,
        "password": password  # Inclure le mot de passe si fourni
    }
    
    # Envoyer le mail
    subject = "Code de vérification - Ambassade du Congo"
    html_content = render_to_string(
        "emails/verification_code.html", 
        context
    )
    
    # Utiliser DEFAULT_FROM_EMAIL du settings ou un fallback
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'slovengama@gmail.com')
    from_name = getattr(settings, 'DEFAULT_FROM_NAME', 'Ambassade du Congo')
    
    msg = EmailMultiAlternatives(
        subject, 
        "", 
        f"{from_name} <{from_email}>", 
        [user.email]
    )
    msg.attach_alternative(html_content, "text/html")
    msg.send()
    
    logger.info(f"Verification email with code {code_str} sent to {user.email}")


def send_account_activation_email(user):
    """Envoie un email de confirmation d'activation de compte"""
    subject = "Votre compte a été activé - Ambassade du Congo"
    
    # Créer le contenu HTML de l'email
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #1e40af; color: white; padding: 20px; text-align: center; }}
            .content {{ background-color: #f9fafb; padding: 20px; }}
            .button {{ display: inline-block; background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Compte Activé</h1>
            </div>
            <div class="content">
                <p>Bonjour {user.get_full_name()},</p>
                <p>Nous avons le plaisir de vous informer que votre compte a été activé par l'ambassade.</p>
                <p>Vous pouvez maintenant accéder à tous les services en ligne de l'ambassade du Congo au Sénégal.</p>
                <p style="margin-top: 30px;">
                    <a href="{frontend_url}/login" class="button">
                        Se connecter
                    </a>
                </p>
                <p style="margin-top: 30px; font-size: 12px; color: #666;">
                    Si vous avez des questions, n'hésitez pas à nous contacter.<br>
                    Ambassade de la République du Congo au Sénégal
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'slovengama@gmail.com')
    msg = EmailMultiAlternatives(subject, "", from_email, [user.email])
    msg.attach_alternative(html_content, "text/html")
    msg.send()
    
    logger.info(f"Account activation email sent to {user.email}")


def send_account_deactivation_email(user):
    """Envoie un email de notification de désactivation de compte"""
    subject = "Notification - Désactivation de compte - Ambassade du Congo"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #dc2626; color: white; padding: 20px; text-align: center; }}
            .content {{ background-color: #f9fafb; padding: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Compte Désactivé</h1>
            </div>
            <div class="content">
                <p>Bonjour {user.get_full_name()},</p>
                <p>Nous vous informons que votre compte a été désactivé par l'ambassade.</p>
                <p>Pour toute question ou pour réactiver votre compte, veuillez vous rendre à l'ambassade muni de votre carte consulaire.</p>
                <p style="margin-top: 30px; font-size: 12px; color: #666;">
                    Ambassade de la République du Congo au Sénégal<br>
                    Stèle Mermoz, Pyrotechnie, Dakar
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'slovengama@gmail.com')
    msg = EmailMultiAlternatives(subject, "", from_email, [user.email])
    msg.attach_alternative(html_content, "text/html")
    msg.send()
    
    logger.info(f"Account deactivation email sent to {user.email}")


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer that authenticates by email"""
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        # Vérifier d'abord si l'utilisateur existe
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({
                'error': 'Aucun compte n\'est associé à cet email. Si vous n\'avez pas encore de compte, veuillez vous rendre à l\'ambassade pour vous enregistrer et obtenir votre carte consulaire.',
                'account_not_found': True,
                'email': email
            })
        
        # Vérifier si l'utilisateur a une carte consulaire (sauf pour admins/superadmins/agents)
        # VIGILE est retiré de l'exception pour tester le comportement sans carte consulaire
        if user.role not in ['ADMIN', 'SUPERADMIN', 'AGENT_RDV', 'AGENT_CONSULAIRE']:
            if not user.consular_card_number:
                # Vérifier le mot de passe pour confirmer l'identité
                if not user.check_password(password):
                    raise serializers.ValidationError({
                        'error': 'Mot de passe incorrect. Veuillez vérifier votre mot de passe.',
                        'invalid_credentials': True
                    })
                # Si le mot de passe est correct mais pas de carte consulaire
                raise serializers.ValidationError({
                    'error': 'Votre compte nécessite une carte consulaire valide pour être activé. Veuillez vous rendre au bureau de l\'ambassade avec une pièce d\'identité et les documents requis pour obtenir votre carte consulaire et activer votre compte. Consultez la page d\'aide pour la liste complète des documents nécessaires.',
                    'no_consular_card': True,
                    'account_inactive': True,
                    'email': email
                })
        
        # Vérifier si le compte est actif avant d'authentifier
        if not user.is_active:
            # Vérifier quand même le mot de passe pour confirmer l'identité
            if not user.check_password(password):
                raise serializers.ValidationError({
                    'error': 'Mot de passe incorrect. Veuillez vérifier votre mot de passe.',
                    'invalid_credentials': True
                })
            # Si le mot de passe est correct mais le compte est inactif
            # Vérifier si c'est à cause de la carte consulaire
            # VIGILE est retiré de l'exception pour tester le comportement sans carte consulaire
            if user.role not in ['ADMIN', 'SUPERADMIN', 'AGENT_RDV', 'AGENT_CONSULAIRE'] and not user.consular_card_number:
                raise serializers.ValidationError({
                    'error': 'Votre compte est inactif car vous n\'avez pas de carte consulaire valide. Veuillez vous rendre au bureau de l\'ambassade avec une pièce d\'identité et les documents requis pour obtenir votre carte consulaire et activer votre compte. Consultez la page d\'aide pour la liste complète des documents nécessaires.',
                    'no_consular_card': True,
                    'account_inactive': True,
                    'email': email
                })
            else:
                raise serializers.ValidationError({
                    'error': 'Votre compte est inactif. Veuillez vous rendre à l\'ambassade avec votre carte consulaire pour activer votre compte.',
                    'account_inactive': True,
                    'email': email
                })
        
        # Use email as username for authentication
        attrs['username'] = email
        try:
            data = super().validate(attrs)
        except serializers.ValidationError as e:
            # Si l'authentification échoue, c'est probablement un mauvais mot de passe
            error_detail = str(e.detail.get('non_field_errors', [''])[0] if hasattr(e, 'detail') and isinstance(e.detail, dict) else '')
            if 'no active account' in error_detail.lower() or 'invalid' in error_detail.lower():
                raise serializers.ValidationError({
                    'error': 'Mot de passe incorrect. Veuillez vérifier votre mot de passe et réessayer.',
                    'invalid_password': True
                })
            raise
        
        # Check if user is verified (sauf pour les employés de l'ambassade)
        # VIGILE est retiré de l'exception pour tester le comportement sans carte consulaire
        # Les employés (ADMIN, SUPERADMIN, AGENT_RDV, AGENT_CONSULAIRE) n'ont pas besoin de vérification email
        if self.user.role not in ['ADMIN', 'SUPERADMIN', 'AGENT_RDV', 'AGENT_CONSULAIRE']:
            if not self.user.is_verified:
                raise serializers.ValidationError({
                    'error': 'Veuillez vérifier votre email avant de vous connecter. Un email de vérification vous a été envoyé lors de votre inscription.',
                    'needs_verification': True,
                    'email': self.user.email
                })
        
        # Add user data to response
        data['user'] = UserSerializer(self.user).data
        return data


class UserLoginView(TokenObtainPairView):
    """User login endpoint with JWT"""
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [LoginRateThrottle]  # Limite les tentatives de connexion


class UserRegistrationView(generics.CreateAPIView):
    """User registration endpoint"""
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer
    throttle_classes = [RegisterRateThrottle]  # Limite les inscriptions (DRF)
    
    def create(self, request, *args, **kwargs):
        """Override create to add IP detection and send verification email"""
        # Détecter l'IP du client (amélioré avec django-ipware)
        try:
            client_ip, is_routable = get_client_ip(request)
            if client_ip:
                request.META['CLIENT_IP'] = client_ip
        except Exception as e:
            # Si get_client_ip échoue, utiliser l'IP de la requête directement
            client_ip = request.META.get('REMOTE_ADDR', '')
            if client_ip:
                request.META['CLIENT_IP'] = client_ip
            logger.warning(f"Failed to get client IP with ipware: {e}")
        
        # Vérifier si l'inscription est activée
        site_settings = SiteSettings.get_settings()
        
        if not site_settings.registration_enabled:
            return Response(
                {
                    "error": "L'inscription est actuellement désactivée.",
                    "message": site_settings.registration_message,
                    "registration_disabled": True
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Vérifier le mode maintenance
        if site_settings.site_maintenance_mode:
            return Response(
                {
                    "error": "Le site est actuellement en maintenance.",
                    "message": site_settings.maintenance_message,
                    "maintenance_mode": True
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Récupérer le mot de passe avant la création (il sera hashé après)
        password = request.data.get('password', '')
        
        # Create user (profile will be created automatically by signal)
        user = serializer.save()
        
        # Vérifier si le numéro de carte consulaire est valide
        # Pour l'instant, on considère qu'un numéro valide doit être vérifié par l'admin
        # On marque le compte comme nécessitant une validation
        consular_card_validated = False  # Par défaut, non validé jusqu'à vérification admin
        
        # Notifier les admins de la nouvelle inscription
        try:
            from notifications.models import Notification
            admins = User.objects.filter(role__in=['ADMIN', 'SUPERADMIN'], is_active=True)
            
            # S'assurer que l'utilisateur est rechargé depuis la DB pour avoir les valeurs déchiffrées
            user.refresh_from_db()
            
            # Obtenir le nom complet de manière sécurisée
            user_full_name = user.get_full_name() or f"{user.first_name} {user.last_name}".strip() or user.email
            
            # Vérifier si le numéro de carte consulaire existe (gérer les cas None, '', et valeurs chiffrées)
            has_consular_card = user.consular_card_number and str(user.consular_card_number).strip()
            
            # Message de notification selon si le numéro est fourni ou non
            if not has_consular_card:
                notification_message = f'Nouvel utilisateur inscrit SANS numéro de carte consulaire: {user_full_name} ({user.email}). ACTION REQUISE: L\'utilisateur doit se rendre à l\'ambassade pour obtenir une carte consulaire.'
                email_subject = f'[URGENT] Nouvelle inscription SANS carte consulaire - {user_full_name}'
            else:
                # Obtenir le numéro de carte consulaire de manière sécurisée
                consular_card_display = str(user.consular_card_number) if user.consular_card_number else 'N/A'
                notification_message = f'Nouvel utilisateur inscrit: {user_full_name} ({user.email}). Numéro de carte consulaire: {consular_card_display}. Le compte est en attente de validation du numéro de carte.'
                email_subject = f'[Ambassade] Nouvelle inscription - {user_full_name}'
            
            for admin in admins:
                # Notification in-app
                Notification.objects.create(
                    recipient=admin,
                    channel=Notification.Channel.IN_APP,
                    title='Nouvelle inscription',
                    message=notification_message,
                    notification_type='NEW_USER_REGISTRATION',
                    related_object_type='user',
                    related_object_id=str(user.id),
                    status=Notification.Status.SENT
                )
            
            # Envoyer un email aux admins
            try:
                from django.core.mail import send_mail
                from django.conf import settings
                
                admin_emails = [admin.email for admin in admins if admin.email]
                if admin_emails:
                    # Obtenir le nom complet de manière sécurisée
                    user_full_name = user.get_full_name() or f"{user.first_name} {user.last_name}".strip() or user.email
                    has_consular_card = user.consular_card_number and str(user.consular_card_number).strip()
                    
                    email_message = f"""
Nouvel utilisateur inscrit sur la plateforme de l'ambassade.

Informations:
- Nom: {user_full_name}
- Email: {user.email}
- Téléphone: {user.phone_number or 'Non fourni'}
- Numéro de carte consulaire: {user.consular_card_number if has_consular_card else 'NON FOURNI - ACTION REQUISE'}

Statut: Compte en attente de validation
Action requise: {'Vérifier et valider le numéro de carte consulaire, puis activer le compte.' if has_consular_card else 'L\'utilisateur doit se rendre à l\'ambassade pour obtenir une carte consulaire. Une fois la carte obtenue, vous pourrez modifier le numéro et activer le compte.'}

Accédez au dashboard admin pour gérer cet utilisateur.
"""
                    send_mail(
                        subject=email_subject,
                        message=email_message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=admin_emails,
                        fail_silently=True
                    )
            except Exception as email_error:
                logger.error(f"Failed to send admin notification email: {email_error}")
                
        except Exception as notif_error:
            logger.error(f"Failed to create admin notifications: {notif_error}")
        
        # Send verification email to user (non-blocking) avec le mot de passe
        # L'inscription réussit même si l'email échoue
        email_sent = False
        try:
            send_verification_email(user, password=password)
            logger.info(f"Verification email with password sent to {user.email}")
            email_sent = True
        except Exception as e:
            # Logger l'erreur mais ne pas bloquer l'inscription
            logger.error(f"Failed to send verification email to {user.email}: {e}")
            # L'inscription continue même si l'email échoue
            # L'utilisateur pourra demander un nouveau code plus tard

        # S'assurer que l'utilisateur est rechargé pour avoir les valeurs à jour
        user.refresh_from_db()
        
        # Obtenir le numéro de carte consulaire de manière sécurisée
        consular_card = user.consular_card_number if (user.consular_card_number and str(user.consular_card_number).strip()) else None
        
        # Message selon si l'email a été envoyé ou non
        if email_sent:
            message = "Inscription réussie ! Un code de vérification a été envoyé à votre email."
        else:
            message = "Inscription réussie ! Cependant, l'envoi de l'email de vérification a échoué. Veuillez contacter l'ambassade pour obtenir votre code de vérification."
        
        return Response({
            "message": message,
            "user_id": user.id,
            "email": user.email,
            "needs_verification": True,
            "email_sent": email_sent,
            "consular_card_validated": consular_card_validated,
            "consular_card_number": consular_card
        }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    """Verify user email with code - Rate limited"""
    """Verify user email with code"""
    email = request.data.get('email')
    code = request.data.get('code')
    
    if not email or not code:
        return Response(
            {"error": "Email et code requis."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        verification_code = EmailVerificationCode.objects.get(
            email=email,
            code=code,
            is_used=False
        )
        
        if not verification_code.is_valid():
            return Response(
                {"error": "Code expiré. Veuillez demander un nouveau code."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mark code as used and verify user
        verification_code.is_used = True
        verification_code.save()
        
        user = verification_code.user
        user.is_verified = True
        user.save()
        
        # Vérifier si l'utilisateur a une carte consulaire valide
        # Recharger l'utilisateur pour avoir les valeurs à jour
        user.refresh_from_db()
        has_consular_card = user.consular_card_number and str(user.consular_card_number).strip()
        
        # Vérifier si le compte est actif
        is_account_active = user.is_active
        
        # Préparer la réponse selon le statut
        if not has_consular_card and user.role not in ['ADMIN', 'SUPERADMIN', 'AGENT_RDV', 'AGENT_CONSULAIRE', 'VIGILE']:
            # L'utilisateur n'a pas de carte consulaire
            from core.models import ConsularOffice
            try:
                office = ConsularOffice.objects.first()
                embassy_address = office.address if office else "Ambassade de la République du Congo au Sénégal"
            except:
                embassy_address = "Ambassade de la République du Congo au Sénégal"
            
            return Response({
                "message": "Email vérifié avec succès !",
                "email_verified": True,
                "account_active": is_account_active,
                "has_consular_card": False,
                "warning": {
                    "title": "Carte consulaire requise",
                    "message": f"Votre email a été vérifié, mais votre compte nécessite une carte consulaire valide pour être activé. Veuillez vous rendre à l'ambassade située à {embassy_address} avec les documents suivants :",
                    "required_documents": [
                        "Votre pièce d'identité (passeport ou carte d'identité)",
                        "Votre acte de naissance",
                        "Toute autre pièce justificative demandée par l'ambassade"
                    ],
                    "instructions": "Une fois à l'ambassade, présentez-vous au bureau consulaire avec ces documents pour obtenir votre carte consulaire. Votre compte sera activé dès que votre carte consulaire sera enregistrée dans le système.",
                    "embassy_address": embassy_address
                }
            })
        elif not is_account_active:
            # Le compte est inactif pour une autre raison
            return Response({
                "message": "Email vérifié avec succès !",
                "email_verified": True,
                "account_active": False,
                "has_consular_card": has_consular_card,
                "warning": {
                    "title": "Compte en attente d'activation",
                    "message": "Votre email a été vérifié, mais votre compte est en attente d'activation par l'ambassade. Veuillez contacter l'ambassade pour plus d'informations."
                }
            })
        else:
            # Tout est OK
            return Response({
                "message": "Email vérifié avec succès ! Vous pouvez maintenant vous connecter.",
                "email_verified": True,
                "account_active": True,
                "has_consular_card": has_consular_card
            })
        
    except EmailVerificationCode.DoesNotExist:
        return Response(
            {"error": "Code invalide."},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_verification_code(request):
    """Resend verification code - Rate limited"""
    """Resend verification code"""
    email = request.data.get('email')
    
    if not email:
        return Response(
            {"error": "Email requis."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
        
        if user.is_verified:
            return Response(
                {"error": "Email déjà vérifié."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Send new verification code
        send_verification_email(user)
        
        return Response({
            "message": "Un nouveau code de vérification a été envoyé à votre email."
        })
        
    except User.DoesNotExist:
        return Response(
            {"error": "Utilisateur non trouvé."},
            status=status.HTTP_400_BAD_REQUEST
        )


class ProfileView(generics.RetrieveUpdateAPIView):
    """Profile management endpoint"""
    permission_classes = (IsAuthenticated,)
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ProfileSerializer
        return ProfileUpdateSerializer
    
    def get_object(self):
        profile, created = Profile.objects.get_or_create(user=self.request.user)
        return profile
    
    def get(self, request, *args, **kwargs):
        """Get user profile"""
        profile = self.get_object()
        profile_serializer = ProfileSerializer(profile)
        user_serializer = UserSerializer(request.user)
        
        # Combine user and profile data
        response_data = user_serializer.data
        response_data['profile'] = profile_serializer.data
        
        return Response(response_data)
    
    def put(self, request, *args, **kwargs):
        """Update user profile"""
        profile = self.get_object()
        serializer = ProfileUpdateSerializer(profile, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_info(request):
    """Get basic user information"""
    return Response(UserSerializer(request.user).data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def document_reminders(request):
    """Get document expiration reminders for the user"""
    user = request.user
    profile = user.profile
    today = date.today()
    reminders = []
    
    # Vérifier le passeport
    if profile.passport_expiry:
        days_until_expiry = (profile.passport_expiry - today).days
        if days_until_expiry <= 30:
            if days_until_expiry <= 0:
                reminders.append({
                    'type': 'PASSPORT_EXPIRED',
                    'document': 'Passeport',
                    'expiry_date': profile.passport_expiry,
                    'days_remaining': days_until_expiry,
                    'message': f'Votre passeport a expiré le {profile.passport_expiry.strftime("%d/%m/%Y")}',
                    'priority': 'URGENT',
                    'action_required': 'Renouveler immédiatement'
                })
            elif days_until_expiry <= 7:
                reminders.append({
                    'type': 'PASSPORT_EXPIRING_SOON',
                    'document': 'Passeport',
                    'expiry_date': profile.passport_expiry,
                    'days_remaining': days_until_expiry,
                    'message': f'Votre passeport expire dans {days_until_expiry} jours',
                    'priority': 'HIGH',
                    'action_required': 'Renouveler rapidement'
                })
            else:
                reminders.append({
                    'type': 'PASSPORT_EXPIRING',
                    'document': 'Passeport',
                    'expiry_date': profile.passport_expiry,
                    'days_remaining': days_until_expiry,
                    'message': f'Votre passeport expire dans {days_until_expiry} jours',
                    'priority': 'MEDIUM',
                    'action_required': 'Planifier le renouvellement'
                })
    
    # Vérifier la carte d'identité
    if profile.id_card_expiry:
        days_until_expiry = (profile.id_card_expiry - today).days
        if days_until_expiry <= 30:
            if days_until_expiry <= 0:
                reminders.append({
                    'type': 'ID_CARD_EXPIRED',
                    'document': 'Carte d\'identité',
                    'expiry_date': profile.id_card_expiry,
                    'days_remaining': days_until_expiry,
                    'message': f'Votre carte d\'identité a expiré le {profile.id_card_expiry.strftime("%d/%m/%Y")}',
                    'priority': 'URGENT',
                    'action_required': 'Renouveler immédiatement'
                })
            elif days_until_expiry <= 7:
                reminders.append({
                    'type': 'ID_CARD_EXPIRING_SOON',
                    'document': 'Carte d\'identité',
                    'expiry_date': profile.id_card_expiry,
                    'days_remaining': days_until_expiry,
                    'message': f'Votre carte d\'identité expire dans {days_until_expiry} jours',
                    'priority': 'HIGH',
                    'action_required': 'Renouveler rapidement'
                })
            else:
                reminders.append({
                    'type': 'ID_CARD_EXPIRING',
                    'document': 'Carte d\'identité',
                    'expiry_date': profile.id_card_expiry,
                    'days_remaining': days_until_expiry,
                    'message': f'Votre carte d\'identité expire dans {days_until_expiry} jours',
                    'priority': 'MEDIUM',
                    'action_required': 'Planifier le renouvellement'
                })
    
    # Vérifier le permis de conduire
    if profile.driving_license_expiry:
        days_until_expiry = (profile.driving_license_expiry - today).days
        if days_until_expiry <= 30:
            if days_until_expiry <= 0:
                reminders.append({
                    'type': 'DRIVING_LICENSE_EXPIRED',
                    'document': 'Permis de conduire',
                    'expiry_date': profile.driving_license_expiry,
                    'days_remaining': days_until_expiry,
                    'message': f'Votre permis de conduire a expiré le {profile.driving_license_expiry.strftime("%d/%m/%Y")}',
                    'priority': 'URGENT',
                    'action_required': 'Renouveler immédiatement'
                })
            elif days_until_expiry <= 7:
                reminders.append({
                    'type': 'DRIVING_LICENSE_EXPIRING_SOON',
                    'document': 'Permis de conduire',
                    'expiry_date': profile.driving_license_expiry,
                    'days_remaining': days_until_expiry,
                    'message': f'Votre permis de conduire expire dans {days_until_expiry} jours',
                    'priority': 'HIGH',
                    'action_required': 'Renouveler rapidement'
                })
            else:
                reminders.append({
                    'type': 'DRIVING_LICENSE_EXPIRING',
                    'document': 'Permis de conduire',
                    'expiry_date': profile.driving_license_expiry,
                    'days_remaining': days_until_expiry,
                    'message': f'Votre permis de conduire expire dans {days_until_expiry} jours',
                    'priority': 'MEDIUM',
                    'action_required': 'Planifier le renouvellement'
                })
    
    # Vérifier les documents utilisateur scannés
    user_documents = UserDocument.objects.filter(user=user, expiry_date__isnull=False)
    for doc in user_documents:
        days_until_expiry = (doc.expiry_date - today).days
        if days_until_expiry <= 30:
            if days_until_expiry <= 0:
                reminders.append({
                    'id': f'doc_{doc.id}_expired',
                    'type': f'DOCUMENT_EXPIRED_{doc.document_type.upper()}',
                    'document': doc.name,
                    'expiry_date': doc.expiry_date,
                    'days_remaining': days_until_expiry,
                    'message': f'Votre {doc.name.lower()} a expiré le {doc.expiry_date.strftime("%d/%m/%Y")}',
                    'priority': 'URGENT',
                    'action_required': 'Renouveler immédiatement',
                    'document_type': doc.document_type
                })
            elif days_until_expiry <= 3:
                reminders.append({
                    'type': f'DOCUMENT_EXPIRING_SOON_{doc.document_type.upper()}',
                    'document': doc.name,
                    'expiry_date': doc.expiry_date,
                    'days_remaining': days_until_expiry,
                    'message': f'Votre {doc.name.lower()} expire dans {days_until_expiry} jours',
                    'priority': 'URGENT',
                    'action_required': 'Renouveler rapidement',
                    'document_type': doc.document_type
                })
            elif days_until_expiry <= 7:
                reminders.append({
                    'type': f'DOCUMENT_EXPIRING_HIGH_{doc.document_type.upper()}',
                    'document': doc.name,
                    'expiry_date': doc.expiry_date,
                    'days_remaining': days_until_expiry,
                    'message': f'Votre {doc.name.lower()} expire dans {days_until_expiry} jours',
                    'priority': 'HIGH',
                    'action_required': 'Planifier le renouvellement',
                    'document_type': doc.document_type
                })
            else:
                reminders.append({
                    'type': f'DOCUMENT_EXPIRING_{doc.document_type.upper()}',
                    'document': doc.name,
                    'expiry_date': doc.expiry_date,
                    'days_remaining': days_until_expiry,
                    'message': f'Votre {doc.name.lower()} expire dans {days_until_expiry} jours',
                    'priority': 'MEDIUM',
                    'action_required': 'Planifier le renouvellement',
                    'document_type': doc.document_type
                })
    
    # Trier par priorité (URGENT > HIGH > MEDIUM)
    priority_order = {'URGENT': 0, 'HIGH': 1, 'MEDIUM': 2}
    reminders.sort(key=lambda x: priority_order.get(x['priority'], 3))
    
    return Response({
        'reminders': reminders,
        'total_count': len(reminders),
        'urgent_count': len([r for r in reminders if r['priority'] == 'URGENT'])
    })


class UserDocumentViewSet(ModelViewSet):
    """API pour la gestion des documents utilisateur"""
    serializer_class = UserDocumentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserDocument.objects.filter(user=self.request.user)
    
    def get_object(self):
        """Decode hashed ID from URL"""
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        hashed_pk = self.kwargs[lookup_url_kwarg]
        pk = hashids_decode(hashed_pk)
        if pk is None:
            raise Http404("No such user document")
        self.kwargs[lookup_url_kwarg] = pk  # Replace hashed ID with actual ID
        return super().get_object()
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_reminder_status(request, reminder_id):
    """Mettre à jour le statut d'un rappel de document"""
    try:
        # Decode hashed reminder ID
        decoded_reminder_id = hashids_decode(reminder_id)
        if decoded_reminder_id is None:
            return Response({'error': 'ID de rappel invalide'}, status=400)
        
        reminder = DocumentReminder.objects.get(id=decoded_reminder_id, user=request.user)
        new_status = request.data.get('status')
        
        if new_status in ['COMPLETED', 'IGNORED', 'PROCESSING']:
            reminder.status = new_status
            reminder.handled_at = timezone.now()
            reminder.save()
            
            return Response({'message': 'Statut mis à jour avec succès'})
        else:
            return Response({'error': 'Statut invalide'}, status=400)
            
    except DocumentReminder.DoesNotExist:
        return Response({'error': 'Rappel non trouvé'}, status=404)


class UserViewSet(viewsets.ModelViewSet):
    """CRUD utilisateur (Admin uniquement)"""
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get_serializer_class(self):
        """Utiliser AdminUserSerializer pour les admins"""
        if self.request.user.role in ['ADMIN', 'SUPERADMIN']:
            return AdminUserSerializer
        return UserSerializer
    
    def get_object(self):
        """Decode hashed ID from URL"""
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        hashed_pk = self.kwargs[lookup_url_kwarg]
        pk = hashids_decode(hashed_pk)
        if pk is None:
            raise Http404("No such user")
        self.kwargs[lookup_url_kwarg] = pk  # Replace hashed ID with actual ID
        return super().get_object()

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activer l'utilisateur (is_active et is_verified)"""
        try:
            user = self.get_object()
            was_inactive = not user.is_active
            
            user.is_verified = True
            user.is_active = True
            user.save()
            
            # Envoyer un email si le compte vient d'être activé
            if was_inactive:
                try:
                    send_account_activation_email(user)
                    logger.info(f"Account activation email sent to {user.email}")
                except Exception as e:
                    logger.error(f"Failed to send activation email to {user.email}: {e}")
            
            # Créer une notification in-app
            try:
                from notifications.models import Notification
                Notification.objects.create(
                    recipient=user,
                    channel=Notification.Channel.IN_APP,
                    title="Compte activé",
                    message=f"Votre compte a été activé par l'ambassade. Vous pouvez maintenant accéder à tous les services.",
                    notification_type="ACCOUNT_ACTIVATED",
                    status=Notification.Status.SENT
                )
            except Exception as e:
                logger.error(f"Failed to create notification for {user.email}: {e}")
            
            return Response({
                "message": f"Utilisateur {user.email} activé avec succès.",
                "user": AdminUserSerializer(user).data
            })
        except User.DoesNotExist:
            return Response(
                {"error": "Utilisateur non trouvé."}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Désactiver l'utilisateur"""
        try:
            user = self.get_object()
            was_active = user.is_active
            
            user.is_verified = False
            user.is_active = False
            user.save()
            
            # Envoyer un email si le compte était actif
            if was_active:
                try:
                    send_account_deactivation_email(user)
                    logger.info(f"Account deactivation email sent to {user.email}")
                except Exception as e:
                    logger.error(f"Failed to send deactivation email to {user.email}: {e}")
            
            return Response({
                "message": f"Utilisateur {user.email} désactivé.",
                "user": AdminUserSerializer(user).data
            })
        except User.DoesNotExist:
            return Response(
                {"error": "Utilisateur non trouvé."}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def change_role(self, request, pk=None):
        """Changer le rôle de l'utilisateur"""
        try:
            user = self.get_object()
            new_role = request.data.get('role')
            
            # Vérifier que le rôle existe
            valid_roles = [choice[0] for choice in User.Role.choices]
            if new_role not in valid_roles:
                return Response(
                    {"error": f"Rôle invalide. Choisir parmi: {', '.join(valid_roles)}"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user.role = new_role
            user.save()
            return Response({
                "message": f"Rôle de {user.email} changé en {new_role}.",
                "user": UserSerializer(user).data
            })
        except User.DoesNotExist:
            return Response(
                {"error": "Utilisateur non trouvé."}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    def update(self, request, *args, **kwargs):
        """Override update to allow consular card number modification - SUPERADMIN ONLY"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Vérifier si on essaie de modifier le numéro de carte consulaire
        if 'consular_card_number' in request.data:
            # SEUL LE SUPERADMIN peut modifier le numéro de carte consulaire
            if not request.user.is_superuser:
                return Response(
                    {"error": "Seul le Super Administrateur peut modifier le numéro de carte consulaire."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            import re
            consular_card_number = request.data.get('consular_card_number', '').upper().strip()
            
            # Permettre de définir un numéro même si l'utilisateur n'en a pas
            # Permettre aussi de vider le champ (mettre None ou '')
            if consular_card_number:
                # Valider le format si un numéro est fourni
                if not re.match(r'^SN\d{7,9}$', consular_card_number):
                    return Response(
                        {"consular_card_number": ["Format invalide. Le numéro doit commencer par 'SN' suivi de 7 à 9 chiffres (ex: SN1234567)"]},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                # Vérifier si le numéro est déjà utilisé par un autre utilisateur
                existing_user = User.objects.filter(consular_card_number=consular_card_number).exclude(pk=instance.pk).first()
                if existing_user:
                    return Response(
                        {"consular_card_number": ["Ce numéro de carte consulaire est déjà utilisé par un autre utilisateur."]},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                # Permettre de vider le numéro (mettre None)
                consular_card_number = None
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)


class AdminUserListView(generics.ListAPIView):
    """Vue pour lister tous les utilisateurs (Admin seulement)"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]  # Temporairement, retirons IsAdmin pour debug
    
    def get_queryset(self):
        # Récupérer tous les utilisateurs (avec ou sans profil)
        return User.objects.all()
    
    def list(self, request, *args, **kwargs):
        # Debug: vérifier l'utilisateur connecté
        print(f"DEBUG: Utilisateur connecté: {request.user}")
        print(f"DEBUG: Rôle utilisateur: {request.user.role if request.user else 'Non connecté'}")
        
        # Vérifier les permissions manuellement
        if not request.user or request.user.role not in ['ADMIN', 'SUPERADMIN']:
            return Response({
                'error': 'Accès non autorisé',
                'user_role': request.user.role if request.user else None,
                'is_authenticated': request.user.is_authenticated if request.user else False
            }, status=403)
        
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Ajouter des statistiques pour chaque utilisateur
        users_data = []
        serialized_data = serializer.data
        for i, user in enumerate(queryset):
            user_data = serialized_data[i].copy()
            # Ajouter les compteurs (vous pouvez ajuster selon vos besoins)
            user_data['appointments_count'] = 0  # À implémenter si nécessaire
            user_data['applications_count'] = 0  # À implémenter si nécessaire
            users_data.append(user_data)
        
        return Response({
            'users': users_data,
            'total': len(users_data),
            'debug_info': {
                'user_role': request.user.role,
                'is_authenticated': request.user.is_authenticated
            }
        })