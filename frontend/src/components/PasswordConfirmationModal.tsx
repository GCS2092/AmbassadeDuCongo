/**
 * Modal de confirmation par mot de passe pour les actions sensibles
 */
import { useState } from 'react'
import { FiShield, FiEye, FiEyeOff, FiX, FiAlertTriangle } from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../lib/api'
import toast from 'react-hot-toast'

interface PasswordConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  actionLabel?: string
  danger?: boolean
}

export default function PasswordConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  actionLabel = 'Confirmer',
  danger = false
}: PasswordConfirmationModalProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password.trim()) {
      setError('Veuillez saisir votre mot de passe')
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      // Vérifier le mot de passe en tentant une connexion
      await authApi.login(user?.email || '', password)
      
      // Si la vérification réussit, exécuter l'action
      onConfirm()
      onClose()
      setPassword('')
      toast.success('Action confirmée avec succès')
    } catch (error: any) {
      console.error('❌ Erreur vérification mot de passe:', error)
      
      if (error.response?.status === 401) {
        setError('Mot de passe incorrect')
      } else if (error.response?.status === 429) {
        setError('Trop de tentatives. Veuillez attendre quelques minutes.')
      } else {
        setError('Erreur de vérification. Veuillez réessayer.')
      }
    } finally {
      setIsVerifying(false)
    }
  }

  const handleClose = () => {
    setPassword('')
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative w-full max-w-md rounded-lg border p-6 shadow-lg ${
          danger ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
        }`}>
          {/* Header */}
          <div className="flex items-start">
            <div className={`flex-shrink-0 mr-4 ${
              danger ? 'text-red-500' : 'text-blue-500'
            }`}>
              <FiShield className="w-8 h-8" />
            </div>
            
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${
                danger ? 'text-red-800' : 'text-gray-900'
              }`}>
                {title}
              </h3>
              
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="mt-4">
            <p className={`text-sm ${
              danger ? 'text-red-700' : 'text-gray-600'
            }`}>
              {message}
            </p>
            
            {danger && (
              <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-md">
                <div className="flex">
                  <FiAlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mr-2" />
                  <p className="text-sm text-red-700">
                    Cette action est irréversible et peut affecter plusieurs utilisateurs.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe de confirmation
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-3 py-2 pr-10 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    error ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Saisissez votre mot de passe"
                  disabled={isVerifying}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
              
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>
            
            {/* Actions */}
            <div className="mt-6 flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isVerifying}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Annuler
              </button>
              
              <button
                type="submit"
                disabled={isVerifying || !password.trim()}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
                  danger 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isVerifying ? 'Vérification...' : actionLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
