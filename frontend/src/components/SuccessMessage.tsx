/**
 * Composant de message de succès réutilisable
 */
import { FiCheckCircle, FiX, FiRefreshCw } from 'react-icons/fi'

interface SuccessMessageProps {
  title?: string
  message: string
  type?: 'success' | 'info' | 'warning'
  onDismiss?: () => void
  onAction?: () => void
  actionLabel?: string
  showIcon?: boolean
  className?: string
  autoDismiss?: boolean
  duration?: number
}

export default function SuccessMessage({
  title,
  message,
  type = 'success',
  onDismiss,
  onAction,
  actionLabel = 'Continuer',
  showIcon = true,
  className = '',
  autoDismiss = true,
  duration = 5000
}: SuccessMessageProps) {
  const getIcon = () => {
    switch (type) {
      case 'info':
        return <FiCheckCircle className="w-5 h-5" />
      case 'warning':
        return <FiCheckCircle className="w-5 h-5" />
      default:
        return <FiCheckCircle className="w-5 h-5" />
    }
  }

  const getStyles = () => {
    switch (type) {
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: 'text-blue-500',
          button: 'bg-blue-100 hover:bg-blue-200 text-blue-800'
        }
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: 'text-yellow-500',
          button: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
        }
      default:
        return {
          container: 'bg-green-50 border-green-200 text-green-800',
          icon: 'text-green-500',
          button: 'bg-green-100 hover:bg-green-200 text-green-800'
        }
    }
  }

  const styles = getStyles()

  return (
    <div className={`rounded-lg border p-4 ${styles.container} ${className}`}>
      <div className="flex items-start">
        {showIcon && (
          <div className={`flex-shrink-0 mr-3 ${styles.icon}`}>
            {getIcon()}
          </div>
        )}
        
        <div className="flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          <p className="text-sm">
            {message}
          </p>
          
          {(onAction || onDismiss) && (
            <div className="mt-3 flex space-x-2">
              {onAction && (
                <button
                  onClick={onAction}
                  className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${styles.button}`}
                >
                  <FiRefreshCw className="w-3 h-3 mr-1" />
                  {actionLabel}
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${styles.button}`}
                >
                  <FiX className="w-3 h-3 mr-1" />
                  Fermer
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Hook pour gérer les messages de succès
 */
export function useSuccessHandler() {
  const showSuccess = (
    message: string,
    title?: string,
    type: 'success' | 'info' | 'warning' = 'success'
  ) => {
    // Cette fonction sera utilisée avec toast.success ou un state pour contrôler l'affichage
    return { title, message, type }
  }

  return { showSuccess }
}
