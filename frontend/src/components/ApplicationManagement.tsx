/**
 * Composant de gestion complète des demandes pour l'admin
 */
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  FiPlus, FiEdit, FiTrash2, FiEye, FiSearch, FiFilter, 
  FiDownload, FiRefreshCw, FiUser, FiCalendar, FiDollarSign,
  FiFileText, FiCheckCircle, FiXCircle, FiClock, FiAlertTriangle,
  FiMoreVertical, FiChevronDown, FiChevronUp, FiSettings
} from 'react-icons/fi'
import { applicationsApi } from '../lib/api'
import LoadingSpinner from './LoadingSpinner'
import ErrorMessage from './ErrorMessage'
import SuccessMessage from './SuccessMessage'
import ApplicationEditModal from './ApplicationEditModal'
import ApplicationCreateModal from './ApplicationCreateModal'
import ApplicationDetailsModal from './ApplicationDetailsModal'
import PasswordConfirmationModal from './PasswordConfirmationModal'
import toast from 'react-hot-toast'

interface Application {
  id: number
  reference_number: string
  application_type: string
  application_type_display: string
  service_name: string
  applicant_name: string
  office_name: string
  status: string
  status_display: string
  base_fee: number
  additional_fees: number
  total_fee: number
  is_paid: boolean
  applicant_notes: string
  admin_notes: string
  submitted_at: string
  completed_at: string
  created_at: string
  updated_at: string
  documents: any[]
  visa_details?: any
  passport_details?: any
}

interface ApplicationManagementProps {
  className?: string
}

export default function ApplicationManagement({ className = '' }: ApplicationManagementProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedApplications, setSelectedApplications] = useState<number[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [pendingAction, setPendingAction] = useState<{
    type: string
    title: string
    message: string
    action: () => void
    danger?: boolean
  } | null>(null)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const queryClient = useQueryClient()

  // Fetch applications
  const { data: applications, isLoading, error, refetch } = useQuery({
    queryKey: ['applications', { status: statusFilter, type: typeFilter }],
    queryFn: () => applicationsApi.getAll(),
    staleTime: 30000
  })

  // Delete application mutation
  const deleteApplicationMutation = useMutation({
    mutationFn: (id: number) => applicationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      toast.success('Demande supprimée avec succès')
    },
    onError: (error: any) => {
      console.error('❌ Erreur suppression demande:', error)
      toast.error('Erreur lors de la suppression de la demande')
    }
  })

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => Promise.all(ids.map(id => applicationsApi.delete(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      setSelectedApplications([])
      toast.success(`${selectedApplications.length} demande(s) supprimée(s) avec succès`)
    },
    onError: (error: any) => {
      console.error('❌ Erreur suppression groupée:', error)
      toast.error('Erreur lors de la suppression des demandes')
    }
  })

  // Filter and sort applications
  const filteredApplications = applications?.filter((app: Application) => {
    const matchesSearch = !searchTerm || 
      app.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.application_type_display.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !statusFilter || app.status === statusFilter
    const matchesType = !typeFilter || app.application_type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  }).sort((a: Application, b: Application) => {
    const aValue = a[sortBy as keyof Application]
    const bValue = b[sortBy as keyof Application]
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  }) || []

  const handleSelectApplication = (id: number) => {
    setSelectedApplications(prev => 
      prev.includes(id) 
        ? prev.filter(appId => appId !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedApplications.length === filteredApplications.length) {
      setSelectedApplications([])
    } else {
      setSelectedApplications(filteredApplications.map((app: Application) => app.id))
    }
  }

  const handleEditApplication = (application: Application) => {
    setSelectedApplication(application)
    setShowEditModal(true)
  }

  const handleViewApplication = (application: Application) => {
    setSelectedApplication(application)
    setShowDetailsModal(true)
  }

  const handleDeleteApplication = (application: Application) => {
    setPendingAction({
      type: 'delete',
      title: 'Supprimer la demande',
      message: `Êtes-vous sûr de vouloir supprimer la demande ${application.reference_number} ? Cette action est irréversible.`,
      action: () => deleteApplicationMutation.mutate(application.id),
      danger: true
    })
    setShowPasswordModal(true)
  }

  const handleBulkDelete = () => {
    setPendingAction({
      type: 'bulk-delete',
      title: 'Supprimer les demandes sélectionnées',
      message: `Êtes-vous sûr de vouloir supprimer ${selectedApplications.length} demande(s) ? Cette action est irréversible.`,
      action: () => bulkDeleteMutation.mutate(selectedApplications),
      danger: true
    })
    setShowPasswordModal(true)
  }

  const handleConfirmAction = () => {
    if (pendingAction) {
      try {
        pendingAction.action()
      } catch (error) {
        console.error('❌ Erreur action:', error)
        toast.error('Erreur lors de l\'exécution de l\'action')
      }
    }
    setShowPasswordModal(false)
    setPendingAction(null)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <FiCheckCircle className="text-green-500" size={16} />
      case 'REJECTED':
        return <FiXCircle className="text-red-500" size={16} />
      case 'PROCESSING':
        return <FiClock className="text-blue-500" size={16} />
      case 'PAYMENT_PENDING':
        return <FiDollarSign className="text-yellow-500" size={16} />
      default:
        return <FiAlertTriangle className="text-gray-500" size={16} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800'
      case 'PAYMENT_PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorMessage 
          message="Erreur lors du chargement des demandes"
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow border ${className}`}>
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Gestion des Demandes
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredApplications.length} demande(s) trouvée(s)
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <FiPlus size={16} />
              <span>Nouvelle demande</span>
            </button>
            
            {selectedApplications.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
              >
                <FiTrash2 size={16} />
                <span>Supprimer ({selectedApplications.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="DRAFT">Brouillon</option>
            <option value="SUBMITTED">Soumis</option>
            <option value="UNDER_REVIEW">En vérification</option>
            <option value="PAYMENT_PENDING">En attente de paiement</option>
            <option value="PROCESSING">En traitement</option>
            <option value="READY">Prêt</option>
            <option value="COMPLETED">Terminé</option>
            <option value="REJECTED">Rejeté</option>
            <option value="CANCELLED">Annulé</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les types</option>
            <option value="VISA">Visa</option>
            <option value="PASSPORT">Passeport</option>
            <option value="PASSPORT_RENEWAL">Renouvellement passeport</option>
            <option value="BIRTH_CERT">Acte de naissance</option>
            <option value="MARRIAGE_CERT">Acte de mariage</option>
            <option value="LEGALIZATION">Légalisation</option>
            <option value="ATTESTATION">Attestation</option>
            <option value="OTHER">Autre</option>
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-')
              setSortBy(field)
              setSortOrder(order as 'asc' | 'desc')
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="created_at-desc">Plus récent</option>
            <option value="created_at-asc">Plus ancien</option>
            <option value="reference_number-asc">Référence A-Z</option>
            <option value="reference_number-desc">Référence Z-A</option>
            <option value="applicant_name-asc">Demandeur A-Z</option>
            <option value="applicant_name-desc">Demandeur Z-A</option>
            <option value="total_fee-desc">Prix décroissant</option>
            <option value="total_fee-asc">Prix croissant</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedApplications.length === filteredApplications.length && filteredApplications.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Référence
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Demandeur
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prix
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredApplications.map((application: Application) => (
              <tr key={application.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedApplications.includes(application.id)}
                    onChange={() => handleSelectApplication(application.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {application.reference_number}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {application.application_type_display}
                  </div>
                  <div className="text-xs text-gray-500">
                    {application.service_name}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FiUser className="text-gray-400 mr-2" size={14} />
                    <div className="text-sm text-gray-900">
                      {application.applicant_name}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(application.status)}
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                      {application.status_display}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {application.total_fee.toFixed(2)} €
                  </div>
                  {application.is_paid && (
                    <div className="text-xs text-green-600">Payé</div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(application.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewApplication(application)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Voir les détails"
                    >
                      <FiEye size={16} />
                    </button>
                    <button
                      onClick={() => handleEditApplication(application)}
                      className="text-green-600 hover:text-green-900"
                      title="Modifier"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteApplication(application)}
                      className="text-red-600 hover:text-red-900"
                      title="Supprimer"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredApplications.length === 0 && (
        <div className="text-center py-12">
          <FiFileText className="mx-auto text-gray-400" size={48} />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Aucune demande trouvée
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter || typeFilter 
              ? 'Aucune demande ne correspond à vos critères de recherche.'
              : 'Commencez par créer une nouvelle demande.'
            }
          </p>
          {!searchTerm && !statusFilter && !typeFilter && (
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <FiPlus className="mr-2" size={16} />
                Nouvelle demande
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <ApplicationCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            queryClient.invalidateQueries({ queryKey: ['applications'] })
          }}
        />
      )}

      {showEditModal && selectedApplication && (
        <ApplicationEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedApplication(null)
          }}
          application={selectedApplication}
          onSuccess={() => {
            setShowEditModal(false)
            setSelectedApplication(null)
            queryClient.invalidateQueries({ queryKey: ['applications'] })
          }}
        />
      )}

      {showDetailsModal && selectedApplication && (
        <ApplicationDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedApplication(null)
          }}
          application={selectedApplication}
        />
      )}

      <PasswordConfirmationModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false)
          setPendingAction(null)
        }}
        onConfirm={handleConfirmAction}
        title={pendingAction?.title || ''}
        message={pendingAction?.message || ''}
        actionLabel="Confirmer"
        danger={pendingAction?.danger || false}
      />
    </div>
  )
}
