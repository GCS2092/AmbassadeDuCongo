/**
 * Composant ErrorBoundary pour capturer les erreurs React
 */
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return <ErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}

function ErrorFallback({ error }: { error?: Error }) {
  const handleReload = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="flex justify-center mb-4">
          <FiAlertTriangle className="w-16 h-16 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Oups ! Une erreur s'est produite
        </h1>
        
        <p className="text-gray-600 mb-6">
          Une erreur inattendue s'est produite. Veuillez réessayer ou retourner à l'accueil.
        </p>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Détails de l'erreur (développement)
            </summary>
            <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
              {error.message}
              {error.stack}
            </pre>
          </details>
        )}
        
        <div className="space-y-3">
          <button
            onClick={handleReload}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <FiRefreshCw className="w-4 h-4" />
            <span>Recharger la page</span>
          </button>
          
          <button
            onClick={handleGoHome}
            className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
          >
            <FiHome className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorBoundary

/**
 * Hook pour gérer les erreurs globales
 */
export function useGlobalErrorHandler() {
  const handleGlobalError = (error: Error, errorInfo?: any) => {
    console.error('❌ Erreur globale:', error, errorInfo)
    
    // Ici vous pourriez envoyer l'erreur à un service de monitoring
    // comme Sentry, LogRocket, etc.
    
    // Pour l'instant, on log juste l'erreur
    if (process.env.NODE_ENV === 'production') {
      // En production, vous pourriez envoyer l'erreur à un service
      console.error('Erreur en production:', error)
    }
  }

  return { handleGlobalError }
}
