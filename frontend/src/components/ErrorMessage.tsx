/**
 * Composant d'affichage d'erreur réutilisable
 * Affiche les erreurs de manière élégante avec des icônes et des styles appropriés
 */
import { FiAlertCircle, FiX, FiRefreshCw, FiWifi, FiShield } from 'react-icons/fi'

interface ErrorMessageProps {
  title?: string
  message: string
  type?: 'error' | 'warning' | 'info' | 'network' | 'auth'
  onRetry?: () => void
  onDismiss?: () => void
  showIcon?: boolean
  className?: string
}

export default function ErrorMessage({
  title,
  message,
  type = 'error',
  onRetry,
  onDismiss,
  showIcon = true,
  className = ''
}: ErrorMessageProps) {
  const getIcon = () => {
    switch (type) {
      case 'network':
        return <FiWifi className="w-5 h-5" />
      case 'auth':
        return <FiShield className="w-5 h-5" />
      case 'warning':
        return <FiAlertCircle className="w-5 h-5" />
      default:
        return <FiAlertCircle className="w-5 h-5" />
    }
  }

  const getStyles = () => {
    switch (type) {
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: 'text-yellow-500',
          button: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
        }
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: 'text-blue-500',
          button: 'bg-blue-100 hover:bg-blue-200 text-blue-800'
        }
      case 'network':
        return {
          container: 'bg-orange-50 border-orange-200 text-orange-800',
          icon: 'text-orange-500',
          button: 'bg-orange-100 hover:bg-orange-200 text-orange-800'
        }
      case 'auth':
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: 'text-red-500',
          button: 'bg-red-100 hover:bg-red-200 text-red-800'
        }
      default:
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: 'text-red-500',
          button: 'bg-red-100 hover:bg-red-200 text-red-800'
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
          
          {(onRetry || onDismiss) && (
            <div className="mt-3 flex space-x-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${styles.button}`}
                >
                  <FiRefreshCw className="w-3 h-3 mr-1" />
                  Réessayer
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
 * Hook pour gérer les erreurs de manière centralisée
 */
export function useErrorHandler() {
  const handleError = (error: any, context?: string) => {
    console.error(`❌ Erreur ${context ? `dans ${context}` : ''}:`, error)
    
    let title = 'Erreur'
    let message = 'Une erreur inattendue s\'est produite'
    let type: 'error' | 'warning' | 'info' | 'network' | 'auth' = 'error'
    
    if (error.response?.status === 401) {
      title = 'Non autorisé'
      message = 'Votre session a expiré. Veuillez vous reconnecter.'
      type = 'auth'
    } else if (error.response?.status === 403) {
      title = 'Accès refusé'
      message = 'Vous n\'avez pas les permissions nécessaires pour cette action.'
      type = 'auth'
    } else if (error.response?.status === 404) {
      title = 'Non trouvé'
      message = 'La ressource demandée n\'a pas été trouvée.'
      type = 'error'
    } else if (error.response?.status === 422) {
      title = 'Données invalides'
      message = 'Les données fournies ne sont pas valides. Vérifiez les champs requis.'
      type = 'warning'
    } else if (error.response?.status === 429) {
      title = 'Trop de requêtes'
      message = 'Trop de tentatives. Veuillez attendre avant de réessayer.'
      type = 'warning'
    } else if (error.response?.status === 500) {
      title = 'Erreur serveur'
      message = 'Erreur interne du serveur. Veuillez réessayer plus tard.'
      type = 'error'
    } else if (!error.response) {
      title = 'Problème de connexion'
      message = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.'
      type = 'network'
    } else {
      message = error.response?.data?.error 
        || error.response?.data?.detail 
        || error.message 
        || message
    }
    
    return { title, message, type }
  }
  
  return { handleError }
}
