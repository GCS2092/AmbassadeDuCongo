"""
Password validators for the Embassy PWA
"""
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
import re


def validate_strong_password(password):
    """
    Validate password strength with multiple criteria
    """
    errors = []
    
    # Check minimum length
    if len(password) < 8:
        errors.append(_('Le mot de passe doit contenir au moins 8 caractères.'))
    
    # Check for uppercase letter
    if not re.search(r'[A-Z]', password):
        errors.append(_('Le mot de passe doit contenir au moins une lettre majuscule.'))
    
    # Check for lowercase letter
    if not re.search(r'[a-z]', password):
        errors.append(_('Le mot de passe doit contenir au moins une lettre minuscule.'))
    
    # Check for digit
    if not re.search(r'\d', password):
        errors.append(_('Le mot de passe doit contenir au moins un chiffre.'))
    
    # Check for special character
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append(_('Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*(),.?":{}|<>).'))
    
    if errors:
        raise ValidationError(errors)


def validate_password_strength(password):
    """
    Alternative validator that returns a strength score instead of raising errors
    """
    score = 0
    feedback = []
    
    # Length check
    if len(password) >= 8:
        score += 1
    else:
        feedback.append(_('Au moins 8 caractères'))
    
    # Uppercase check
    if re.search(r'[A-Z]', password):
        score += 1
    else:
        feedback.append(_('Une majuscule'))
    
    # Lowercase check
    if re.search(r'[a-z]', password):
        score += 1
    else:
        feedback.append(_('Une minuscule'))
    
    # Digit check
    if re.search(r'\d', password):
        score += 1
    else:
        feedback.append(_('Un chiffre'))
    
    # Special character check
    if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        score += 1
    else:
        feedback.append(_('Un caractère spécial'))
    
    # Require at least 4 out of 5 criteria for a strong password
    if score < 4:
        missing = ', '.join(feedback)
        raise ValidationError(
            _('Mot de passe trop faible. Il manque : %(missing)s'),
            params={'missing': missing}
        )
