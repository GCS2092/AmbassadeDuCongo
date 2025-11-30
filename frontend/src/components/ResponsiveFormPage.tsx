/**
 * Composant de page responsive pour les formulaires
 */
import { ReactNode } from 'react'
import ScrollToForm from './ScrollToForm'

interface ResponsiveFormPageProps {
  children: ReactNode
  title: string
  subtitle?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}

export default function ResponsiveFormPage({ 
  children, 
  title, 
  subtitle,
  maxWidth = 'md',
  className = ''
}: ResponsiveFormPageProps) {
  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  }[maxWidth]

  return (
    <div className={`min-h-screen bg-gray-50 py-4 sm:py-8 lg:py-12 ${className}`}>
      <div className="container mx-auto px-4">
        <ScrollToForm className="flex items-center justify-center min-h-[calc(100vh-2rem)] sm:min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-6rem)]">
          <div className={`w-full ${maxWidthClass}`}>
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm sm:text-base text-gray-600">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Form Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </div>
        </ScrollToForm>
      </div>
    </div>
  )
}
