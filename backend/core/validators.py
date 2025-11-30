"""
Custom validators for file uploads and data validation
"""
from django.core.exceptions import ValidationError
from django.conf import settings
import magic
import os


def validate_file_size(file):
    """Validate uploaded file size"""
    max_size = settings.MAX_UPLOAD_SIZE
    if file.size > max_size:
        raise ValidationError(
            f'La taille du fichier ne doit pas dépasser {max_size / (1024*1024):.1f} MB.'
        )


def validate_file_extension(file):
    """Validate file extension"""
    allowed_extensions = settings.ALLOWED_DOCUMENT_TYPES
    ext = os.path.splitext(file.name)[1][1:].lower()
    
    if ext not in allowed_extensions:
        raise ValidationError(
            f'Type de fichier non autorisé. Types acceptés: {", ".join(allowed_extensions)}'
        )


def validate_file_content(file):
    """
    Validate actual file content using python-magic
    Prevents file type spoofing
    """
    # Read first chunk for MIME type detection
    file_head = file.read(2048)
    file.seek(0)
    
    mime = magic.from_buffer(file_head, mime=True)
    
    allowed_mimes = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
    }
    
    ext = os.path.splitext(file.name)[1][1:].lower()
    expected_mime = allowed_mimes.get(ext)
    
    if expected_mime and mime != expected_mime:
        raise ValidationError(
            f'Le contenu du fichier ne correspond pas à son extension. '
            f'Type détecté: {mime}, attendu: {expected_mime}'
        )


def validate_document(file):
    """Complete document validation"""
    validate_file_size(file)
    validate_file_extension(file)
    # Uncomment if python-magic is installed
    # validate_file_content(file)


def validate_phone_number(value):
    """Validate phone number format"""
    import re
    pattern = r'^\+?1?\d{9,15}$'
    if not re.match(pattern, value):
        raise ValidationError(
            'Numéro de téléphone invalide. Format: +221XXXXXXXXX'
        )


def validate_passport_number(value):
    """Validate passport number format"""
    import re
    # Basic alphanumeric validation
    pattern = r'^[A-Z0-9]{6,12}$'
    if not re.match(pattern, value.upper()):
        raise ValidationError(
            'Numéro de passeport invalide. Format: 6-12 caractères alphanumériques'
        )

