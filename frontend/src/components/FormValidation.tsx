/**
 * Composant de validation de formulaire complet avec feedback en temps réel
 */
import { useState, useEffect } from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import FormField, { Input, Textarea, Select } from './FormField'
import ValidationFeedback, { validationRules } from './ValidationFeedback'
import ErrorMessage from './ErrorMessage'
import SuccessMessage from './SuccessMessage'

interface FormValidationProps {
  schema: z.ZodSchema<any>
  onSubmit: (data: any) => Promise<void> | void
  children: (form: UseFormReturn<any>) => React.ReactNode
  className?: string
  showSuccessMessage?: boolean
  successMessage?: string
  onSuccess?: () => void
  onError?: (error: any) => void
}

export default function FormValidation({
  schema,
  onSubmit,
  children,
  className = '',
  showSuccessMessage = true,
  successMessage = 'Formulaire soumis avec succès',
  onSuccess,
  onError
}: FormValidationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const form = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange' // Validation en temps réel
  })

  const { handleSubmit, formState: { errors, isDirty, isValid } } = form

  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      await onSubmit(data)
      setSubmitSuccess(true)
      onSuccess?.()
      
      if (showSuccessMessage) {
        // Le message de succès sera géré par le composant parent
      }
    } catch (error: any) {
      console.error('❌ Erreur soumission formulaire:', error)
      setSubmitError(error.message || 'Erreur lors de la soumission')
      onError?.(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Auto-dismiss success message
  useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => {
        setSubmitSuccess(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [submitSuccess])

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Messages de succès */}
        {submitSuccess && (
          <SuccessMessage
            title="Succès"
            message={successMessage}
            type="success"
            onDismiss={() => setSubmitSuccess(false)}
          />
        )}

        {/* Messages d'erreur */}
        {submitError && (
          <ErrorMessage
            title="Erreur de soumission"
            message={submitError}
            type="error"
            onDismiss={() => setSubmitError(null)}
          />
        )}

        {/* Contenu du formulaire */}
        {children(form)}

        {/* Bouton de soumission */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => form.reset()}
            disabled={isSubmitting || !isDirty}
            className="btn-secondary"
          >
            Réinitialiser
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="btn-primary"
          >
            {isSubmitting ? 'Soumission...' : 'Soumettre'}
          </button>
        </div>
      </form>
    </div>
  )
}

/**
 * Composant de champ avec validation en temps réel
 */
interface ValidatedFieldProps {
  name: string
  label: string
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number'
  placeholder?: string
  required?: boolean
  helpText?: string
  validationRules?: any[]
  form: UseFormReturn<any>
  className?: string
}

export function ValidatedField({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  helpText,
  validationRules: customRules = [],
  form,
  className = ''
}: ValidatedFieldProps) {
  const { register, watch, formState: { errors } } = form
  const value = watch(name) || ''

  const getValidationRules = () => {
    const rules = [...customRules]
    
    if (required) {
      rules.push(validationRules.required(value))
    }
    
    if (type === 'email') {
      rules.push(validationRules.email(value))
    }
    
    if (type === 'tel') {
      rules.push(validationRules.phone(value))
    }
    
    return rules
  }

  const getInputComponent = () => {
    const commonProps = {
      ...register(name),
      placeholder,
      error: !!errors[name],
      success: !errors[name] && value && getValidationRules().every(rule => rule.test(value))
    }

    switch (type) {
      case 'password':
        return <Input type="password" {...commonProps} />
      case 'email':
        return <Input type="email" {...commonProps} />
      case 'tel':
        return <Input type="tel" {...commonProps} />
      case 'url':
        return <Input type="url" {...commonProps} />
      case 'number':
        return <Input type="number" {...commonProps} />
      default:
        return <Input type="text" {...commonProps} />
    }
  }

  return (
    <FormField
      label={label}
      error={errors[name]?.message}
      success={!errors[name] && value && getValidationRules().every(rule => rule.test(value))}
      required={required}
      helpText={helpText}
      className={className}
    >
      {getInputComponent()}
      
      {value && (
        <ValidationFeedback
          value={value}
          rules={getValidationRules()}
          className="mt-1"
        />
      )}
    </FormField>
  )
}

export { FormField, Input, Textarea, Select, ValidationFeedback, validationRules }
