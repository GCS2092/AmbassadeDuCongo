"""
Encryption utilities for sensitive data
"""
from cryptography.fernet import Fernet
from django.conf import settings
import base64
import hashlib


def get_encryption_key():
    """
    Get or generate encryption key from settings
    """
    encryption_key = getattr(settings, 'ENCRYPTION_KEY', None)
    
    if not encryption_key:
        if settings.DEBUG:
            # En développement, utiliser une clé par défaut (NE JAMAIS EN PRODUCTION)
            return Fernet.generate_key()
        else:
            raise ValueError("ENCRYPTION_KEY doit être défini en production")
    
    # Si la clé est une string, la convertir en bytes
    if isinstance(encryption_key, str):
        # Si c'est une clé Fernet valide (base64), l'utiliser directement
        try:
            # Vérifier si c'est une clé Fernet valide
            Fernet(encryption_key.encode())
            return encryption_key.encode()
        except:
            # Sinon, générer une clé à partir de la string
            key = hashlib.sha256(encryption_key.encode()).digest()
            return base64.urlsafe_b64encode(key)
    
    return encryption_key


def encrypt_data(data: str) -> str:
    """
    Encrypt sensitive data
    """
    if not data:
        return data
    
    try:
        key = get_encryption_key()
        fernet = Fernet(key)
        encrypted = fernet.encrypt(data.encode())
        return encrypted.decode()
    except Exception as e:
        # En cas d'erreur, logger et retourner None
        import logging
        logger = logging.getLogger('embassy')
        logger.error(f"Erreur de chiffrement: {e}")
        return None


def decrypt_data(encrypted_data: str) -> str:
    """
    Decrypt sensitive data
    """
    if not encrypted_data:
        return encrypted_data
    
    try:
        key = get_encryption_key()
        fernet = Fernet(key)
        decrypted = fernet.decrypt(encrypted_data.encode())
        return decrypted.decode()
    except Exception as e:
        # En cas d'erreur, logger et retourner None
        import logging
        logger = logging.getLogger('embassy')
        logger.error(f"Erreur de déchiffrement: {e}")
        return None

