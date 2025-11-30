"""
Views pour les notifications
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from rest_framework.decorators import action
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.http import JsonResponse
from django.utils import timezone
from .models import Notification
from .serializers import NotificationSerializer, NotificationListSerializer
import base64
import qrcode
import io
import json
import logging

logger = logging.getLogger(__name__)

class SendAppointmentQRView(APIView):
    """
    Endpoint pour envoyer le QR code d'un rendez-vous par email
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            data = request.data
            
            # Validation des données requises
            required_fields = ['to', 'subject', 'appointmentId', 'userInfo', 'appointmentDetails', 'qrCodeDataUrl']
            for field in required_fields:
                if field not in data:
                    return Response({
                        'error': f'Champ requis manquant: {field}'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Préparer le contexte pour l'email
            context = {
                'user_name': data['userInfo'].get('name', ''),
                'appointment_date': data['appointmentDetails'].get('date', ''),
                'appointment_time': data['appointmentDetails'].get('time', ''),
                'service_name': data['appointmentDetails'].get('service', ''),
                'office_name': data['appointmentDetails'].get('office', ''),
                'appointment_id': data['appointmentId'],
                'qr_code_data_url': data['qrCodeDataUrl'],
                'embassy_name': "Ambassade de la République du Congo - Sénégal",
                'embassy_address': "Stèle Mermoz, Pyrotechnie, P.O. Box 5243, Dakar, Sénégal",
                'embassy_phone': "+221 824 8398",
                'embassy_email': "contact@ambassade-congo.sn"
            }
            
            # Rendu du template HTML
            html_content = render_to_string('emails/appointment_qr_code.html', context)
            
            # Rendu du template texte
            text_content = render_to_string('emails/appointment_qr_code.txt', context)
            
            # Création de l'email
            subject = data['subject']
            from_email = settings.DEFAULT_FROM_EMAIL
            recipient_list = [data['to']]
            
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=from_email,
                to=recipient_list
            )
            
            # Ajout du contenu HTML
            email.attach_alternative(html_content, "text/html")
            
            # Envoi de l'email
            email.send()
            
            logger.info(f"QR Code email sent successfully to {data['to']} for appointment {data['appointmentId']}")
            
            return Response({
                'success': True,
                'message': 'Email avec QR code envoyé avec succès',
                'appointment_id': data['appointmentId']
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error sending QR code email: {str(e)}")
            return Response({
                'error': 'Erreur lors de l\'envoi de l\'email',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GenerateQRCodeView(APIView):
    """
    Endpoint pour générer un QR code avec les informations du rendez-vous
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            data = request.data
            
            # Validation des données requises
            required_fields = ['appointmentId', 'appointmentDate', 'appointmentTime', 'serviceName', 'userInfo']
            for field in required_fields:
                if field not in data:
                    return Response({
                        'error': f'Champ requis manquant: {field}'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Préparer les données du QR code
            qr_data = {
                'appointment': {
                    'id': data['appointmentId'],
                    'date': data['appointmentDate'],
                    'time': data['appointmentTime'],
                    'service': data['serviceName'],
                    'status': 'CONFIRMED'
                },
                'user': {
                    'name': data['userInfo'].get('name', ''),
                    'email': data['userInfo'].get('email', '')
                },
                'embassy': {
                    'name': "Ambassade de la République du Congo - Sénégal",
                    'address': "Stèle Mermoz, Pyrotechnie, P.O. Box 5243, Dakar, Sénégal",
                    'phone': "+221 824 8398",
                    'phone2': "+221 649 3117",
                    'email': "contact@ambassade-congo.sn",
                    'website': "https://ambassade-congo.sn"
                },
                'instructions': {
                    'scanDate': data.get('scanDate', ''),
                    'validUntil': data.get('validUntil', ''),
                    'message': "Présenter ce QR code à la réception de l'ambassade",
                    'arrivalTime': "Arriver 15 minutes avant l'heure du rendez-vous",
                    'requiredDocuments': "Pièce d'identité valide requise"
                }
            }
            
            # Générer le QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_M,
                box_size=10,
                border=5
            )
            
            qr.add_data(json.dumps(qr_data, ensure_ascii=False))
            qr.make(fit=True)
            
            # Créer l'image
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Convertir en base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)
            
            qr_code_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            qr_code_data_url = f"data:image/png;base64,{qr_code_base64}"
            
            return Response({
                'success': True,
                'qr_code_data_url': qr_code_data_url,
                'qr_data': qr_data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error generating QR code: {str(e)}")
            return Response({
                'error': 'Erreur lors de la génération du QR code',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SendUserQRView(APIView):
    """
    Endpoint pour envoyer le QR code utilisateur par email
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            data = request.data
            
            # Validation des données requises
            required_fields = ['to', 'subject', 'qr_code_data_url', 'user_data']
            for field in required_fields:
                if field not in data:
                    return Response({
                        'error': f'Champ requis manquant: {field}'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Préparer le contexte pour l'email
            context = {
                'user_name': data['user_data']['user']['name'],
                'user_email': data['user_data']['user']['email'],
                'user_role': data['user_data']['user']['role'],
                'qr_code_data_url': data['qr_code_data_url'],
                'generated_at': data['user_data']['generatedAt'],
                'valid_until': data['user_data']['validUntil'],
                'embassy_name': data['user_data']['embassy']['name'],
                'embassy_address': data['user_data']['embassy']['address'],
                'embassy_phone': data['user_data']['embassy']['phone'],
                'embassy_email': data['user_data']['embassy']['email']
            }
            
            # Rendu du template HTML
            html_content = render_to_string('emails/user_qr_code.html', context)
            
            # Rendu du template texte
            text_content = render_to_string('emails/user_qr_code.txt', context)
            
            # Création de l'email
            subject = data['subject']
            from_email = settings.DEFAULT_FROM_EMAIL
            recipient_list = [data['to']]
            
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=from_email,
                to=recipient_list
            )
            
            # Ajout du contenu HTML
            email.attach_alternative(html_content, "text/html")
            
            # Envoi de l'email
            email.send()
            
            logger.info(f"User QR Code email sent successfully to {data['to']}")
            
            return Response({
                'success': True,
                'message': 'QR code personnel envoyé par email avec succès'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error sending user QR code email: {str(e)}")
            return Response({
                'error': 'Erreur lors de l\'envoi de l\'email',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet pour gérer les notifications de l'utilisateur connecté
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retourner uniquement les notifications de l'utilisateur connecté"""
        return Notification.objects.filter(
            recipient=self.request.user,
            channel=Notification.Channel.IN_APP
        ).order_by('-created_at')
    
    def get_serializer_class(self):
        """Utiliser le serializer simplifié pour la liste"""
        if self.action == 'list':
            return NotificationListSerializer
        return NotificationSerializer
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Marquer une notification comme lue"""
        notification = self.get_object()
        notification.mark_as_read()
        return Response({
            'message': 'Notification marquée comme lue',
            'notification': NotificationSerializer(notification).data
        })
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Marquer toutes les notifications comme lues"""
        count = Notification.objects.filter(
            recipient=request.user,
            channel=Notification.Channel.IN_APP,
            status__in=[Notification.Status.SENT, Notification.Status.DELIVERED]
        ).update(
            status=Notification.Status.READ,
            read_at=timezone.now()
        )
        return Response({
            'message': f'{count} notification(s) marquée(s) comme lue(s)',
            'count': count
        })
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Retourner le nombre de notifications non lues"""
        count = Notification.objects.filter(
            recipient=request.user,
            channel=Notification.Channel.IN_APP,
            status__in=[Notification.Status.SENT, Notification.Status.DELIVERED]
        ).count()
        return Response({'count': count})