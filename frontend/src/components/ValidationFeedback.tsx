/**
 * Composant de feedback de validation en temps réel
 */
import { useState, useEffect } from 'react'
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiLoader } from 'react-icons/fi'

interface ValidationFeedbackProps {
  value: string
  rules: ValidationRule[]
  onValidationChange?: (isValid: boolean, errors: string[]) => void
  showIcon?: boolean
  className?: string
}

interface ValidationRule {
  test: (value: string) => boolean
  message: string
  type: 'error' | 'warning' | 'success'
}

export default function ValidationFeedback({
  value,
  rules,
  onValidationChange,
  showIcon = true,
  className = ''
}: ValidationFeedbackProps) {
  const [isValidating, setIsValidating] = useState(false)
  const [validationResults, setValidationResults] = useState<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  }>({ isValid: true, errors: [], warnings: [] })

  useEffect(() => {
    if (!value) {
      setValidationResults({ isValid: true, errors: [], warnings: [] })
      onValidationChange?.(true, [])
      return
    }

    setIsValidating(true)
    
    // Simuler un délai pour la validation
    const timeout = setTimeout(() => {
      const errors: string[] = []
      const warnings: string[] = []
      let isValid = true

      rules.forEach(rule => {
        if (!rule.test(value)) {
          if (rule.type === 'error') {
            errors.push(rule.message)
            isValid = false
          } else if (rule.type === 'warning') {
            warnings.push(rule.message)
          }
        }
      })

      setValidationResults({ isValid, errors, warnings })
      onValidationChange?.(isValid, errors)
      setIsValidating(false)
    }, 300)

    return () => clearTimeout(timeout)
  }, [value, rules, onValidationChange])

  if (!value && !isValidating) return null

  const getIcon = () => {
    if (isValidating) {
      return <FiLoader className="w-4 h-4 animate-spin" />
    }
    
    if (validationResults.errors.length > 0) {
      return <FiXCircle className="w-4 h-4" />
    }
    
    if (validationResults.warnings.length > 0) {
      return <FiAlertCircle className="w-4 h-4" />
    }
    
    return <FiCheckCircle className="w-4 h-4" />
  }

  const getIconColor = () => {
    if (isValidating) return 'text-gray-400'
    if (validationResults.errors.length > 0) return 'text-red-500'
    if (validationResults.warnings.length > 0) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getTextColor = () => {
    if (validationResults.errors.length > 0) return 'text-red-600'
    if (validationResults.warnings.length > 0) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Messages d'erreur */}
      {validationResults.errors.map((error, index) => (
        <div key={index} className="flex items-center space-x-2">
          {showIcon && (
            <FiXCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          )}
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ))}
      
      {/* Messages d'avertissement */}
      {validationResults.warnings.map((warning, index) => (
        <div key={index} className="flex items-center space-x-2">
          {showIcon && (
            <FiAlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
          )}
          <p className="text-sm text-yellow-600">{warning}</p>
        </div>
      ))}
      
      {/* Message de succès */}
      {validationResults.isValid && 
       validationResults.errors.length === 0 && 
       validationResults.warnings.length === 0 && 
       value && (
        <div className="flex items-center space-x-2">
          {showIcon && (
            <FiCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
          )}
          <p className="text-sm text-green-600">Valide</p>
        </div>
      )}
      
      {/* Indicateur de validation en cours */}
      {isValidating && (
        <div className="flex items-center space-x-2">
          {showIcon && (
            <FiLoader className="w-4 h-4 text-gray-400 flex-shrink-0 animate-spin" />
          )}
          <p className="text-sm text-gray-500">Validation en cours...</p>
        </div>
      )}
    </div>
  )
}

/**
 * Règles de validation communes
 */
export const validationRules = {
  email: (value: string): ValidationRule => ({
    test: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    message: 'Format d\'email invalide',
    type: 'error'
  }),
  
  required: (value: string): ValidationRule => ({
    test: (val) => val.trim().length > 0,
    message: 'Ce champ est requis',
    type: 'error'
  }),
  
  minLength: (min: number): ValidationRule => ({
    test: (val) => val.length >= min,
    message: `Au moins ${min} caractères requis`,
    type: 'error'
  }),
  
  maxLength: (max: number): ValidationRule => ({
    test: (val) => val.length <= max,
    message: `Maximum ${max} caractères autorisés`,
    type: 'error'
  }),
  
  phone: (value: string): ValidationRule => ({
    test: (val) => /^[\+]?[0-9\s\-\(\)]{9,}$/.test(val),
    message: 'Format de téléphone invalide',
    type: 'error'
  }),
  
  password: (value: string): ValidationRule => ({
    test: (val) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(val),
    message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial',
    type: 'error'
  }),
  
  passwordMatch: (password: string): ValidationRule => ({
    test: (val) => val === password,
    message: 'Les mots de passe ne correspondent pas',
    type: 'error'
  }),
  
  passport: (value: string): ValidationRule => ({
    test: (val) => /^[A-Z]{2}[0-9]{7}$/.test(val),
    message: 'Format de passeport invalide (ex: AB1234567)',
    type: 'error'
  })
}
