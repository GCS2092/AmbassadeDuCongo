/**
 * Boutons d'action admin avec validation par mot de passe
 */
import { useState } from 'react'
import { 
  FiTrash2, FiUserX, FiRefreshCw, FiDownload, FiSettings, 
  FiAlertTriangle, FiCheckCircle, FiX, FiShield 
} from 'react-icons/fi'
import PasswordConfirmationModal from './PasswordConfirmationModal'
import toast from 'react-hot-toast'

interface AdminActionButtonsProps {
  onDeleteGroup?: () => void
  onDeleteUser?: (userId: string) => void
  onResetData?: () => void
  onExportData?: () => void
  onBulkAction?: (action: string) => void
  selectedItems?: any[]
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function AdminActionButtons({
  onDeleteGroup,
  onDeleteUser,
  onResetData,
  onExportData,
  onBulkAction,
  selectedItems = [],
  className = '',
  size = 'md'
}: AdminActionButtonsProps) {
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    type: string
    title: string
    message: string
    action: () => void
    danger?: boolean
  } | null>(null)

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs'
      case 'lg':
        return 'px-6 py-3 text-base'
      default:
        return 'px-4 py-2 text-sm'
    }
  }

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 14
      case 'lg':
        return 20
      default:
        return 16
    }
  }

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
        console.error('❌ Erreur action admin:', error)
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

  return (
    <>
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {/* Supprimer un groupe */}
        {onDeleteGroup && (
          <button
            onClick={() => handleAction('delete-group', onDeleteGroup, {
              title: 'Supprimer un groupe',
              message: 'Êtes-vous sûr de vouloir supprimer ce groupe de rendez-vous ? Cette action est irréversible.',
              danger: true
            })}
            className={`btn-danger flex items-center space-x-2 ${getSizeClasses()}`}
            title="Supprimer un groupe de rendez-vous"
          >
            <FiTrash2 size={getIconSize()} />
            <span>Supprimer groupe</span>
          </button>
        )}

        {/* Supprimer un utilisateur */}
        {onDeleteUser && selectedItems.length > 0 && (
          <button
            onClick={() => handleAction('delete-user', () => {
              selectedItems.forEach(item => onDeleteUser(item.id))
            }, {
              title: 'Supprimer des utilisateurs',
              message: `Êtes-vous sûr de vouloir supprimer ${selectedItems.length} utilisateur(s) ? Cette action est irréversible.`,
              danger: true
            })}
            className={`btn-danger flex items-center space-x-2 ${getSizeClasses()}`}
            title="Supprimer les utilisateurs sélectionnés"
          >
            <FiUserX size={getIconSize()} />
            <span>Supprimer ({selectedItems.length})</span>
          </button>
        )}

        {/* Réinitialiser les données */}
        {onResetData && (
          <button
            onClick={() => handleAction('reset-data', onResetData, {
              title: 'Réinitialiser les données',
              message: 'ATTENTION: Cette action va supprimer toutes les données de test. Cette action est irréversible.',
              danger: true
            })}
            className={`btn-warning flex items-center space-x-2 ${getSizeClasses()}`}
            title="Réinitialiser les données de test"
          >
            <FiRefreshCw size={getIconSize()} />
            <span>Réinitialiser</span>
          </button>
        )}

        {/* Exporter les données */}
        {onExportData && (
          <button
            onClick={() => handleAction('export-data', onExportData, {
              title: 'Exporter les données',
              message: 'Voulez-vous exporter les données actuelles ?'
            })}
            className={`btn-secondary flex items-center space-x-2 ${getSizeClasses()}`}
            title="Exporter les données"
          >
            <FiDownload size={getIconSize()} />
            <span>Exporter</span>
          </button>
        )}

        {/* Actions en lot */}
        {onBulkAction && selectedItems.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleAction('bulk-approve', () => onBulkAction('approve'), {
                title: 'Approuver en lot',
                message: `Voulez-vous approuver ${selectedItems.length} élément(s) ?`
              })}
              className={`btn-success flex items-center space-x-2 ${getSizeClasses()}`}
              title="Approuver les éléments sélectionnés"
            >
              <FiCheckCircle size={getIconSize()} />
              <span>Approuver ({selectedItems.length})</span>
            </button>

            <button
              onClick={() => handleAction('bulk-reject', () => onBulkAction('reject'), {
                title: 'Rejeter en lot',
                message: `Voulez-vous rejeter ${selectedItems.length} élément(s) ?`,
                danger: true
              })}
              className={`btn-danger flex items-center space-x-2 ${getSizeClasses()}`}
              title="Rejeter les éléments sélectionnés"
            >
              <FiX size={getIconSize()} />
              <span>Rejeter ({selectedItems.length})</span>
            </button>
          </div>
        )}

        {/* Actions système */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleAction('system-refresh', () => {
              window.location.reload()
            }, {
              title: 'Actualiser le système',
              message: 'Voulez-vous actualiser toutes les données du système ?'
            })}
            className={`btn-info flex items-center space-x-2 ${getSizeClasses()}`}
            title="Actualiser le système"
          >
            <FiRefreshCw size={getIconSize()} />
            <span>Actualiser</span>
          </button>

          <button
            onClick={() => handleAction('system-settings', () => {
              toast.info('Ouverture des paramètres système...')
            }, {
              title: 'Paramètres système',
              message: 'Voulez-vous ouvrir les paramètres système ?'
            })}
            className={`btn-secondary flex items-center space-x-2 ${getSizeClasses()}`}
            title="Paramètres système"
          >
            <FiSettings size={getIconSize()} />
            <span>Paramètres</span>
          </button>
        </div>
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
