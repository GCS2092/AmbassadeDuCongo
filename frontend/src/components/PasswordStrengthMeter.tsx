import React from 'react'

interface PasswordStrengthMeterProps {
  password: string
}

interface PasswordStrength {
  score: number
  label: string
  color: string
  requirements: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    number: boolean
    special: boolean
  }
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const calculateStrength = (password: string): PasswordStrength => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }

    const score = Object.values(requirements).filter(Boolean).length
    
    let label = 'Très faible'
    let color = 'bg-red-500'
    
    if (score >= 3 && requirements.length) {
      if (score === 3) {
        label = 'Faible'
        color = 'bg-orange-500'
      } else if (score === 4) {
        label = 'Moyen'
        color = 'bg-yellow-500'
      } else if (score === 5) {
        label = 'Fort'
        color = 'bg-green-500'
      }
    }

    return { score, label, color, requirements }
  }

  const strength = calculateStrength(password)
  const percentage = (strength.score / 5) * 100

  if (!password) return null

  return (
    <div className="mt-2">
      {/* Barre de progression */}
      <div className="flex items-center space-x-2 mb-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={`text-sm font-medium ${
          strength.score < 3 ? 'text-red-600' : 
          strength.score < 4 ? 'text-orange-600' : 
          strength.score < 5 ? 'text-yellow-600' : 'text-green-600'
        }`}>
          {strength.label}
        </span>
      </div>

      {/* Liste des critères */}
      <div className="space-y-1 text-xs">
        <div className={`flex items-center space-x-2 ${strength.requirements.length ? 'text-green-600' : 'text-gray-500'}`}>
          <span className={strength.requirements.length ? '✓' : '○'}>
            {strength.requirements.length ? '✓' : '○'}
          </span>
          <span>Au moins 8 caractères</span>
        </div>
        <div className={`flex items-center space-x-2 ${strength.requirements.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
          <span className={strength.requirements.uppercase ? '✓' : '○'}>
            {strength.requirements.uppercase ? '✓' : '○'}
          </span>
          <span>Une majuscule (A-Z)</span>
        </div>
        <div className={`flex items-center space-x-2 ${strength.requirements.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
          <span className={strength.requirements.lowercase ? '✓' : '○'}>
            {strength.requirements.lowercase ? '✓' : '○'}
          </span>
          <span>Une minuscule (a-z)</span>
        </div>
        <div className={`flex items-center space-x-2 ${strength.requirements.number ? 'text-green-600' : 'text-gray-500'}`}>
          <span className={strength.requirements.number ? '✓' : '○'}>
            {strength.requirements.number ? '✓' : '○'}
          </span>
          <span>Un chiffre (0-9)</span>
        </div>
        <div className={`flex items-center space-x-2 ${strength.requirements.special ? 'text-green-600' : 'text-gray-500'}`}>
          <span className={strength.requirements.special ? '✓' : '○'}>
            {strength.requirements.special ? '✓' : '○'}
          </span>
          <span>Un caractère spécial (!@#$...)</span>
        </div>
      </div>
    </div>
  )
}

export default PasswordStrengthMeter
