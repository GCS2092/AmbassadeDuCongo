"""
Encrypted model fields for sensitive data
Uses Fernet symmetric encryption from cryptography library
"""
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.db import models
from django.utils.functional import cached_property
import base64
import os
import logging

logger = logging.getLogger(__name__)


def get_encryption_key():
    """
    Get encryption key from settings or generate one
    In production, this should be in environment variables
    """
    key = getattr(settings, 'ENCRYPTION_KEY', None)
    if not key:
        # Generate a key if not set (for development only)
        # In production, this MUST be set in environment variables
        key = Fernet.generate_key().decode()
        if settings.DEBUG:
            print("⚠️  WARNING: ENCRYPTION_KEY not set. Generated temporary key for development.")
            print("⚠️  Set ENCRYPTION_KEY in your .env file for production!")
    else:
        # Ensure key is bytes
        if isinstance(key, str):
            key = key.encode()
    
    return key


class EncryptedCharField(models.CharField):
    """
    Encrypted CharField for sensitive data like consular numbers, passport numbers, etc.
    Data is encrypted at rest in the database.
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._fernet = None
    
    @cached_property
    def fernet(self):
        """Lazy initialization of Fernet cipher"""
        if self._fernet is None:
            key = get_encryption_key()
            self._fernet = Fernet(key)
        return self._fernet
    
    def from_db_value(self, value, expression, connection):
        """Decrypt value when reading from database"""
        if value is None or value == '':
            return None
        
        # Convert to string if needed
        if not isinstance(value, str):
            value = str(value)
        
        # Check if value starts with the encrypted prefix (if we use one)
        # For now, try to decrypt and if it fails, assume it's unencrypted legacy data
        try:
            # Try to decrypt the value
            decrypted = self.fernet.decrypt(value.encode())
            return decrypted.decode()
        except (InvalidToken, ValueError, TypeError) as e:
            # InvalidToken means the value is not encrypted (or wrong key)
            # This is normal for:
            # 1. Legacy unencrypted data
            # 2. Empty strings
            # 3. Values that were never encrypted
            # Silently return the value as-is (it's probably unencrypted legacy data)
            return value
        except Exception as e:
            # Other errors - log but still return value as-is
            if settings.DEBUG:
                logger.debug(f"Decryption error (non-critical, returning as-is): {type(e).__name__}")
            return value
    
    def to_python(self, value):
        """Convert value to Python string"""
        if isinstance(value, str):
            return value
        if value is None:
            return None
        return str(value)
    
    def get_prep_value(self, value):
        """Encrypt value before saving to database"""
        if value is None:
            return None
        
        # If already encrypted (bytes), return as is
        if isinstance(value, bytes):
            return value.decode()
        
        # Encrypt the value
        try:
            encrypted = self.fernet.encrypt(value.encode())
            return encrypted.decode()
        except Exception as e:
            if settings.DEBUG:
                print(f"⚠️  Encryption error: {e}")
            raise ValueError(f"Failed to encrypt value: {e}")


class EncryptedTextField(models.TextField):
    """
    Encrypted TextField for sensitive long text data
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._fernet = None
    
    @cached_property
    def fernet(self):
        """Lazy initialization of Fernet cipher"""
        if self._fernet is None:
            key = get_encryption_key()
            self._fernet = Fernet(key)
        return self._fernet
    
    def from_db_value(self, value, expression, connection):
        """Decrypt value when reading from database"""
        if value is None or value == '':
            return None
        
        # Convert to string if needed
        if not isinstance(value, str):
            value = str(value)
        
        try:
            # Try to decrypt the value
            decrypted = self.fernet.decrypt(value.encode())
            return decrypted.decode()
        except (InvalidToken, ValueError, TypeError) as e:
            # InvalidToken means the value is not encrypted (or wrong key)
            # Silently return the value as-is (it's probably unencrypted legacy data)
            return value
        except Exception as e:
            # Other errors - log but still return value as-is
            if settings.DEBUG:
                logger.debug(f"Decryption error for TextField (non-critical, returning as-is): {type(e).__name__}")
            return value
    
    def to_python(self, value):
        """Convert value to Python string"""
        if isinstance(value, str):
            return value
        if value is None:
            return None
        return str(value)
    
    def get_prep_value(self, value):
        """Encrypt value before saving to database"""
        if value is None:
            return None
        
        if isinstance(value, bytes):
            return value.decode()
        
        try:
            encrypted = self.fernet.encrypt(value.encode())
            return encrypted.decode()
        except Exception as e:
            if settings.DEBUG:
                print(f"⚠️  Encryption error: {e}")
            raise ValueError(f"Failed to encrypt value: {e}")

