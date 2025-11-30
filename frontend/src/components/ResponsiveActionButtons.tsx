/**
 * Composant de boutons d'action responsifs pour mobile et desktop
 */
import { useState } from 'react'
import { 
  FiTrash2, FiUserX, FiRefreshCw, FiDownload, FiSettings, 
  FiAlertTriangle, FiCheckCircle, FiX, FiShield, FiMoreVertical,
  FiChevronDown, FiChevronUp
} from 'react-icons/fi'
import PasswordConfirmationModal from './PasswordConfirmationModal'
import toast from 'react-hot-toast'

interface ResponsiveActionButtonsProps {
  onDeleteGroup?: () => void
  onDeleteUser?: (userId: string) => void
  onResetData?: () => void
  onExportData?: () => void
  onBulkAction?: (action: string) => void
  selectedItems?: any[]
  className?: string
  variant?: 'admin' | 'vigile' | 'user'
}

export default function ResponsiveActionButtons({
  onDeleteGroup,
  onDeleteUser,
  onResetData,
  onExportData,
  onBulkAction,
  selectedItems = [],
  className = '',
  variant = 'admin'
}: ResponsiveActionButtonsProps) {
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    type: string
    title: string
    message: string
    action: () => void
    danger?: boolean
  } | null>(null)

  const getVariantStyles = () => {
    switch (variant) {
      case 'vigile':
        return {
          primary: 'bg-blue-600 hover:bg-blue-700 text-white',
          danger: 'bg-red-600 hover:bg-red-700 text-white',
          warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          secondary: 'bg-gray-600 hover:bg-gray-700 text-white'
        }
      case 'user':
        return {
          primary: 'bg-green-600 hover:bg-green-700 text-white',
          danger: 'bg-red-600 hover:bg-red-700 text-white',
          warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          secondary: 'bg-gray-600 hover:bg-gray-700 text-white'
        }
      default: // admin
        return {
          primary: 'bg-blue-600 hover:bg-blue-700 text-white',
          danger: 'bg-red-600 hover:bg-red-700 text-white',
          warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          secondary: 'bg-gray-600 hover:bg-gray-700 text-white'
        }
    }
  }

  const styles = getVariantStyles()

  const handleAction = (actionType: string, action: () => void, config: {
    title: string
    message: string
    danger?: boolean
  }) => {
    setPendingAction({
      type: actionType,
      title: config.title,
      message: config.message,
      action,
      danger: config.danger
    })
    setShowPasswordModal(true)
  }

  const handleConfirm = () => {
    if (pendingAction) {
      try {
        pendingAction.action()
        toast.success('Action exécutée avec succès')
      } catch (error) {
        console.error('❌ Erreur action:', error)
        toast.error('Erreur lors de l\'exécution de l\'action')
      }
    }
    setShowPasswordModal(false)
    setPendingAction(null)
  }

  const handleCancel = () => {
    setShowPasswordModal(false)
    setPendingAction(null)
  }

  const getButtonClasses = (type: 'primary' | 'danger' | 'warning' | 'secondary') => {
    return `px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${styles[type]}`
  }

  const getMobileButtonClasses = (type: 'primary' | 'danger' | 'warning' | 'secondary') => {
    return `w-full px-4 py-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${styles[type]}`
  }

  const primaryActions = [
    // Supprimer un groupe
    onDeleteGroup && {
      label: 'Supprimer groupe',
      icon: <FiTrash2 size={16} />,
      action: () => handleAction('delete-group', onDeleteGroup, {
        title: 'Supprimer un groupe',
        message: 'Êtes-vous sûr de vouloir supprimer ce groupe de rendez-vous ? Cette action est irréversible.',
        danger: true
      }),
      type: 'danger' as const
    },

    // Supprimer des utilisateurs
    onDeleteUser && selectedItems.length > 0 && {
      label: `Supprimer (${selectedItems.length})`,
      icon: <FiUserX size={16} />,
      action: () => handleAction('delete-user', () => {
        selectedItems.forEach(item => onDeleteUser(item.id))
      }, {
        title: 'Supprimer des utilisateurs',
        message: `Êtes-vous sûr de vouloir supprimer ${selectedItems.length} utilisateur(s) ? Cette action est irréversible.`,
        danger: true
      }),
      type: 'danger' as const
    },

    // Réinitialiser les données
    onResetData && {
      label: 'Réinitialiser',
      icon: <FiRefreshCw size={16} />,
      action: () => handleAction('reset-data', onResetData, {
        title: 'Réinitialiser les données',
        message: 'ATTENTION: Cette action va supprimer toutes les données de test. Cette action est irréversible.',
        danger: true
      }),
      type: 'warning' as const
    }
  ].filter(Boolean)

  const secondaryActions = [
    // Exporter les données
    onExportData && {
      label: 'Exporter',
      icon: <FiDownload size={16} />,
      action: () => handleAction('export-data', onExportData, {
        title: 'Exporter les données',
        message: 'Voulez-vous exporter les données actuelles ?'
      }),
      type: 'secondary' as const
    },

    // Actualiser le système
    {
      label: 'Actualiser',
      icon: <FiRefreshCw size={16} />,
      action: () => handleAction('system-refresh', () => {
        window.location.reload()
      }, {
        title: 'Actualiser le système',
        message: 'Voulez-vous actualiser toutes les données du système ?'
      }),
      type: 'primary' as const
    },

    // Paramètres système
    {
      label: 'Paramètres',
      icon: <FiSettings size={16} />,
      action: () => handleAction('system-settings', () => {
        toast.info('Ouverture des paramètres système...')
      }, {
        title: 'Paramètres système',
        message: 'Voulez-vous ouvrir les paramètres système ?'
      }),
      type: 'secondary' as const
    }
  ].filter(Boolean)

  return (
    <>
      {/* Desktop View */}
      <div className={`hidden md:flex flex-wrap gap-2 ${className}`}>
        {primaryActions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className={getButtonClasses(action.type)}
            title={action.label}
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
        
        {secondaryActions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className={getButtonClasses(action.type)}
            title={action.label}
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Mobile View */}
      <div className={`md:hidden ${className}`}>
        {/* Primary Actions - Always Visible */}
        <div className="flex flex-wrap gap-2 mb-2">
          {primaryActions.slice(0, 2).map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`flex-1 ${getMobileButtonClasses(action.type)}`}
            >
              {action.icon}
              <span className="text-xs">{action.label}</span>
            </button>
          ))}
        </div>

        {/* More Actions Dropdown */}
        {(primaryActions.length > 2 || secondaryActions.length > 0) && (
          <div className="relative">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className={`w-full ${getMobileButtonClasses('secondary')}`}
            >
              <FiMoreVertical size={16} />
              <span>Plus d'actions</span>
              {showMobileMenu ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
            </button>

            {showMobileMenu && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <div className="py-1">
                  {primaryActions.slice(2).map((action, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        action.action()
                        setShowMobileMenu(false)
                      }}
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center space-x-3 ${styles[action.type]}`}
                    >
                      {action.icon}
                      <span>{action.label}</span>
                    </button>
                  ))}
                  
                  {secondaryActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        action.action()
                        setShowMobileMenu(false)
                      }}
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center space-x-3 ${styles[action.type]}`}
                    >
                      {action.icon}
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de confirmation par mot de passe */}
      <PasswordConfirmationModal
        isOpen={showPasswordModal}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={pendingAction?.title || ''}
        message={pendingAction?.message || ''}
        actionLabel="Confirmer"
        danger={pendingAction?.danger || false}
      />
    </>
  )
}
