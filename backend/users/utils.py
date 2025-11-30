"""
Utility functions for User app
"""
import random
from django.db import IntegrityError
from django.conf import settings
from hashids import Hashids
from .models import User

# Initialize Hashids with a salt from settings
# The salt should be a strong, unique string stored in environment variables
_hashids = Hashids(
    salt=getattr(settings, 'HASHIDS_SALT', 'your-super-secret-salt-for-hashids'),
    min_length=getattr(settings, 'HASHIDS_MIN_LENGTH', 8)
)


def hashids_encode(pk):
    """Encodes a primary key into a hashids string."""
    if pk is None:
        return None
    try:
        return _hashids.encode(pk)
    except Exception:
        return None


def hashids_decode(hashed_id):
    """Decodes a hashids string back to a primary key."""
    if not hashed_id:
        return None
    try:
        decoded = _hashids.decode(str(hashed_id))
        if decoded:
            return decoded[0]  # hashids.decode returns a tuple
        return None
    except Exception:
        return None


def generate_consular_card_number():
    """
    Génère un numéro de carte consulaire unique au format SNXXXXXXX
    Format: SN suivi de 7 à 9 chiffres (ex: SN1234567, SN12345678, SN123456789)
    """
    max_attempts = 100
    
    for attempt in range(max_attempts):
        # Générer un nombre aléatoire entre 7 et 9 chiffres
        num_digits = random.choice([7, 8, 9])
        # Générer le numéro (éviter de commencer par 0)
        number = random.randint(10**(num_digits-1), 10**num_digits - 1)
        consular_number = f"SN{number}"
        
        # Vérifier l'unicité
        if not User.objects.filter(consular_card_number=consular_number).exists():
            return consular_number
    
    # Si on n'a pas trouvé de numéro unique après max_attempts tentatives,
    # essayer avec un numéro séquentiel basé sur le nombre d'utilisateurs
    user_count = User.objects.count()
    base_number = user_count + 1000000  # Commencer à partir de SN1000000
    
    # Trouver le premier numéro disponible
    for i in range(10000):  # Essayer jusqu'à 10000 numéros
        consular_number = f"SN{base_number + i}"
        if not User.objects.filter(consular_card_number=consular_number).exists():
            return consular_number
    
    # Dernier recours: utiliser un timestamp
    import time
    timestamp = int(time.time()) % 100000000  # Garder les 8 derniers chiffres
    return f"SN{timestamp}"


def assign_consular_card_number(user):
    """
    Assigne un numéro de carte consulaire à un utilisateur s'il n'en a pas
    """
    if not user.consular_card_number:
        consular_number = generate_consular_card_number()
        user.consular_card_number = consular_number
        user.save(update_fields=['consular_card_number'])
        return consular_number
    return user.consular_card_number

