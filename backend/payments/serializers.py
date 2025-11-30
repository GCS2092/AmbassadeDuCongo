"""
Serializers for Payment models
"""
from rest_framework import serializers
from .models import Payment, Refund


class PaymentSerializer(serializers.ModelSerializer):
    """Payment serializer"""
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    application_reference = serializers.CharField(source='application.reference_number', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    is_successful = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'transaction_id', 'application', 'application_reference',
            'user', 'user_name', 'amount', 'currency',
            'payment_method', 'payment_method_display',
            'status', 'status_display', 'is_successful',
            'receipt_number', 'receipt_url',
            'description', 'failure_reason',
            'created_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'transaction_id', 'receipt_number', 'receipt_url',
            'status', 'failure_reason', 'created_at', 'completed_at'
        ]


class PaymentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating payments"""
    
    class Meta:
        model = Payment
        fields = ['application', 'payment_method', 'description']
    
    def validate_application(self, value):
        """Validate application"""
        # Check if application belongs to user
        request = self.context.get('request')
        if value.applicant != request.user:
            raise serializers.ValidationError("Cette demande ne vous appartient pas.")
        
        # Check if payment is required
        if value.status not in ['PAYMENT_PENDING', 'SUBMITTED', 'UNDER_REVIEW']:
            raise serializers.ValidationError("Cette demande ne nécessite pas de paiement pour le moment.")
        
        # Check if already paid
        if value.is_paid:
            raise serializers.ValidationError("Cette demande a déjà été payée.")
        
        return value
    
    def create(self, validated_data):
        """Create payment"""
        application = validated_data['application']
        validated_data['user'] = self.context['request'].user
        validated_data['amount'] = application.total_fee
        validated_data['currency'] = 'XOF'
        
        payment = Payment.objects.create(**validated_data)
        
        # Update application status
        application.status = 'PAYMENT_PENDING'
        application.save()
        
        return payment


class RefundSerializer(serializers.ModelSerializer):
    """Refund serializer"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_transaction = serializers.CharField(source='payment.transaction_id', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.get_full_name', read_only=True)
    
    class Meta:
        model = Refund
        fields = [
            'id', 'refund_id', 'payment', 'payment_transaction',
            'amount', 'status', 'status_display', 'reason',
            'requested_by', 'requested_by_name',
            'created_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'refund_id', 'status', 
            'requested_by', 'created_at', 'completed_at'
        ]


class RefundRequestSerializer(serializers.ModelSerializer):
    """Serializer for requesting refunds"""
    
    class Meta:
        model = Refund
        fields = ['payment', 'amount', 'reason']
    
    def validate_payment(self, value):
        """Validate payment"""
        # Check if payment is completed
        if value.status != 'COMPLETED':
            raise serializers.ValidationError("Seuls les paiements terminés peuvent être remboursés.")
        
        # Check if payment belongs to user
        request = self.context.get('request')
        if value.user != request.user:
            raise serializers.ValidationError("Ce paiement ne vous appartient pas.")
        
        # Check if already refunded
        if value.refunds.filter(status='COMPLETED').exists():
            raise serializers.ValidationError("Ce paiement a déjà été remboursé.")
        
        return value
    
    def validate_amount(self, value):
        """Validate refund amount"""
        if value <= 0:
            raise serializers.ValidationError("Le montant doit être supérieur à zéro.")
        return value
    
    def create(self, validated_data):
        """Create refund request"""
        validated_data['requested_by'] = self.context['request'].user
        return super().create(validated_data)

