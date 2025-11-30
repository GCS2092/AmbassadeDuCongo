"""
Utility functions for the core app
"""
from hashids import Hashids
from django.conf import settings

# Créer une instance Hashids avec une clé secrète
# Utiliser SECRET_KEY de Django pour la cohérence
HASHIDS_SALT = getattr(settings, 'HASHIDS_SALT', settings.SECRET_KEY[:20])
hashids = Hashids(salt=HASHIDS_SALT, min_length=8)


def encode_id(integer_id):
    """
    Encode un ID numérique en hashid
    Exemple: 123 -> "aB3xY9mP"
    """
    if integer_id is None:
        return None
    try:
        return hashids.encode(integer_id)
    except Exception:
        return None


def decode_id(hashid):
    """
    Décode un hashid en ID numérique
    Exemple: "aB3xY9mP" -> 123
    """
    if not hashid:
        return None
    try:
        decoded = hashids.decode(hashid)
        if decoded:
            return decoded[0]  # Retourner le premier ID décodé
        return None
    except Exception:
        return None


def encode_multiple_ids(*ids):
    """
    Encode plusieurs IDs en un seul hashid
    Utile pour les relations complexes
    """
    if not ids:
        return None
    try:
        return hashids.encode(*ids)
    except Exception:
        return None


def decode_multiple_ids(hashid):
    """
    Décode un hashid contenant plusieurs IDs
    """
    if not hashid:
        return None
    try:
        return hashids.decode(hashid)
    except Exception:
        return None

