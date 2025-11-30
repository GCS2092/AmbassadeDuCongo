/**
 * Composant de modal d'erreur pour les erreurs critiques
 */
import { useEffect } from 'react'
import { FiX, FiAlertTriangle, FiRefreshCw, FiWifi, FiShield } from 'react-icons/fi'

interface ErrorModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: 'error' | 'warning' | 'network' | 'auth'
  onRetry?: () => void
  showCloseButton?: boolean
}

export default function ErrorModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'error',
  onRetry,
  showCloseButton = true
}: ErrorModalProps) {
  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Empêcher le scroll du body
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'network':
        return <FiWifi className="w-8 h-8" />
      case 'auth':
        return <FiShield className="w-8 h-8" />
      case 'warning':
        return <FiAlertTriangle className="w-8 h-8" />
      default:
        return <FiAlertTriangle className="w-8 h-8" />
    }
  }

  const getStyles = () => {
    switch (type) {
      case 'warning':
        return {
          icon: 'text-yellow-500',
          container: 'bg-yellow-50 border-yellow-200',
          title: 'text-yellow-800',
          message: 'text-yellow-700',
          button: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300'
        }
      case 'network':
        return {
          icon: 'text-orange-500',
          container: 'bg-orange-50 border-orange-200',
          title: 'text-orange-800',
          message: 'text-orange-700',
          button: 'bg-orange-100 hover:bg-orange-200 text-orange-800 border-orange-300'
        }
      case 'auth':
        return {
          icon: 'text-red-500',
          container: 'bg-red-50 border-red-200',
          title: 'text-red-800',
          message: 'text-red-700',
          button: 'bg-red-100 hover:bg-red-200 text-red-800 border-red-300'
        }
      default:
        return {
          icon: 'text-red-500',
          container: 'bg-red-50 border-red-200',
          title: 'text-red-800',
          message: 'text-red-700',
          button: 'bg-red-100 hover:bg-red-200 text-red-800 border-red-300'
        }
    }
  }

  const styles = getStyles()

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative w-full max-w-md rounded-lg border p-6 shadow-lg ${styles.container}`}>
          {/* Header */}
          <div className="flex items-start">
            <div className={`flex-shrink-0 mr-4 ${styles.icon}`}>
              {getIcon()}
            </div>
            
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${styles.title}`}>
                {title}
              </h3>
              
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          
          {/* Content */}
          <div className="mt-4">
            <p className={`text-sm ${styles.message}`}>
              {message}
            </p>
          </div>
          
          {/* Actions */}
          <div className="mt-6 flex space-x-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium border transition-colors ${styles.button}`}
              >
                <FiRefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </button>
            )}
            
            <button
              onClick={onClose}
              className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium border transition-colors ${styles.button}`}
            >
              {onRetry ? 'Fermer' : 'OK'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook pour gérer les modals d'erreur
 */
export function useErrorModal() {
  const showError = (
    title: string,
    message: string,
    type: 'error' | 'warning' | 'network' | 'auth' = 'error',
    onRetry?: () => void
  ) => {
    // Cette fonction sera utilisée avec un state pour contrôler l'affichage
    return { title, message, type, onRetry }
  }

  return { showError }
}
