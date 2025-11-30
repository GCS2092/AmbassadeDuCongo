export interface PasswordValidation {
  isValid: boolean
  score: number
  requirements: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    number: boolean
    special: boolean
  }
  errors: string[]
}

export function validatePassword(password: string): PasswordValidation {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }

  const errors: string[] = []
  
  if (!requirements.length) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères')
  }
  if (!requirements.uppercase) {
    errors.push('Le mot de passe doit contenir au moins une majuscule')
  }
  if (!requirements.lowercase) {
    errors.push('Le mot de passe doit contenir au moins une minuscule')
  }
  if (!requirements.number) {
    errors.push('Le mot de passe doit contenir au moins un chiffre')
  }
  if (!requirements.special) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial')
  }

  const score = Object.values(requirements).filter(Boolean).length
  const isValid = errors.length === 0

  return {
    isValid,
    score,
    requirements,
    errors
  }
}

export function getPasswordStrengthLabel(score: number): string {
  if (score < 2) return 'Très faible'
  if (score < 3) return 'Faible'
  if (score < 4) return 'Moyen'
  if (score < 5) return 'Fort'
  return 'Très fort'
}

export function getPasswordStrengthColor(score: number): string {
  if (score < 2) return 'bg-red-500'
  if (score < 3) return 'bg-orange-500'
  if (score < 4) return 'bg-yellow-500'
  if (score < 5) return 'bg-green-500'
  return 'bg-green-600'
}
