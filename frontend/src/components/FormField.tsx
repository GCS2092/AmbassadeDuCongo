/**
 * Composant de champ de formulaire avec validation et messages d'erreur améliorés
 */
import { forwardRef } from 'react'
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi'

interface FormFieldProps {
  label: string
  error?: string
  success?: boolean
  required?: boolean
  helpText?: string
  children: React.ReactNode
  className?: string
}

const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, error, success, required, helpText, children, className = '' }, ref) => {
    return (
      <div ref={ref} className={`space-y-2 ${className}`}>
        <label className="label flex items-center">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <div className="relative">
          {children}
          
          {/* Icône de statut */}
          {error && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <FiAlertCircle className="h-5 w-5 text-red-500" />
            </div>
          )}
          {success && !error && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <FiCheckCircle className="h-5 w-5 text-green-500" />
            </div>
          )}
        </div>
        
        {/* Message d'aide */}
        {helpText && !error && (
          <p className="text-sm text-gray-500">{helpText}</p>
        )}
        
        {/* Message d'erreur */}
        {error && (
          <div className="flex items-center space-x-2">
            <FiAlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'

export default FormField

/**
 * Composant d'input avec styles conditionnels
 */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  success?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, success, className = '', ...props }, ref) => {
    const baseClasses = 'input w-full'
    const errorClasses = error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
    const successClasses = success && !error ? 'border-green-300 focus:border-green-500 focus:ring-green-500' : ''
    
    return (
      <input
        ref={ref}
        className={`${baseClasses} ${errorClasses} ${successClasses} ${className}`}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

/**
 * Composant de textarea avec styles conditionnels
 */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  success?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, success, className = '', ...props }, ref) => {
    const baseClasses = 'input w-full'
    const errorClasses = error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
    const successClasses = success && !error ? 'border-green-300 focus:border-green-500 focus:ring-green-500' : ''
    
    return (
      <textarea
        ref={ref}
        className={`${baseClasses} ${errorClasses} ${successClasses} ${className}`}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'

/**
 * Composant de select avec styles conditionnels
 */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  success?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, success, className = '', children, ...props }, ref) => {
    const baseClasses = 'input w-full'
    const errorClasses = error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
    const successClasses = success && !error ? 'border-green-300 focus:border-green-500 focus:ring-green-500' : ''
    
    return (
      <select
        ref={ref}
        className={`${baseClasses} ${errorClasses} ${successClasses} ${className}`}
        {...props}
      >
        {children}
      </select>
    )
  }
)

Select.displayName = 'Select'
