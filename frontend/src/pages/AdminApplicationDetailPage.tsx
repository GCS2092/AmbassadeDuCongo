/**
 * Admin Application Detail Page
 * Page de détails d'une demande pour les administrateurs
 */
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsApi } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { FiArrowLeft, FiEdit, FiSave, FiX, FiMail, FiUser, FiCalendar, FiFileText, FiCheckCircle, FiAlertTriangle, FiClock } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { debugAPI, debugComponent } from '../utils/debugHelper'

export default function AdminApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<any>({})

  // Fetch application details
  const { data: application, isLoading, error } = useQuery({
    queryKey: ['admin-application', id],
    queryFn: () => {
      debugAPI.logRequest(`/applications/${id}/`, 'GET');
      return applicationsApi.get(parseInt(id!)).then(res => {
        debugAPI.logResponse(`/applications/${id}/`, res.status, res.data);
        return res.data;
      }).catch(error => {
        debugAPI.logError(`/applications/${id}/`, error);
        throw error;
      });
    },
    enabled: !!id
  })

  // Update application mutation
  const updateApplication = useMutation({
    mutationFn: (data: any) => {
      if (data.status && data.status !== application?.status) {
        // Utiliser l'API de changement de statut
        return applicationsApi.updateStatus(parseInt(id!), data);
      } else {
        // Utiliser l'API de mise à jour normale
        return applicationsApi.update(parseInt(id!), data);
      }
    },
    onSuccess: () => {
      toast.success('Demande mise à jour avec succès')
      queryClient.invalidateQueries({ queryKey: ['admin-application', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      setIsEditing(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour')
      console.error('Update error:', error)
    }
  })

  const handleEdit = () => {
    setEditedData({
      status: application?.status || '',
      admin_notes: application?.admin_notes || '',
      rejection_reason: application?.rejection_reason || ''
    })
    setIsEditing(true)
  }

  const handleSave = () => {
    updateApplication.mutate(editedData)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedData({})
  }


  const getStatusColor = (status: string) => {
    const colors: any = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SUBMITTED: 'bg-blue-100 text-blue-800',
      UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
      ADDITIONAL_INFO_REQUIRED: 'bg-orange-100 text-orange-800',
      PAYMENT_PENDING: 'bg-purple-100 text-purple-800',
      PAYMENT_RECEIVED: 'bg-indigo-100 text-indigo-800',
      PROCESSING: 'bg-cyan-100 text-cyan-800',
      READY: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    const icons: any = {
      DRAFT: FiEdit,
      SUBMITTED: FiClock,
      UNDER_REVIEW: FiFileText,
      ADDITIONAL_INFO_REQUIRED: FiAlertTriangle,
      PAYMENT_PENDING: FiClock,
      PAYMENT_RECEIVED: FiCheckCircle,
      PROCESSING: FiClock,
      READY: FiCheckCircle,
      COMPLETED: FiCheckCircle,
      REJECTED: FiX,
      CANCELLED: FiX
    }
    const Icon = icons[status] || FiClock
    return <Icon className="w-4 h-4" />
  }

  const getNextStatuses = (currentStatus: string) => {
    const statusFlow: any = {
      DRAFT: ['SUBMITTED'],
      SUBMITTED: ['UNDER_REVIEW', 'REJECTED'],
      UNDER_REVIEW: ['ADDITIONAL_INFO_REQUIRED', 'PAYMENT_PENDING', 'PROCESSING', 'REJECTED'],
      ADDITIONAL_INFO_REQUIRED: ['UNDER_REVIEW', 'REJECTED'],
      PAYMENT_PENDING: ['PAYMENT_RECEIVED', 'REJECTED'],
      PAYMENT_RECEIVED: ['PROCESSING', 'REJECTED'],
      PROCESSING: ['READY', 'REJECTED'],
      READY: ['COMPLETED'],
      COMPLETED: [],
      REJECTED: ['UNDER_REVIEW'],
      CANCELLED: []
    }
    return statusFlow[currentStatus] || []
  }

  const getStatusLabel = (status: string) => {
    const labels: any = {
      DRAFT: 'Brouillon',
      SUBMITTED: 'Soumise',
      UNDER_REVIEW: 'En révision',
      ADDITIONAL_INFO_REQUIRED: 'Info requise',
      PAYMENT_PENDING: 'Paiement',
      PAYMENT_RECEIVED: 'Paiement reçu',
      PROCESSING: 'Traitement',
      READY: 'Prête',
      COMPLETED: 'Retirée',
      REJECTED: 'Rejetée',
      CANCELLED: 'Annulée'
    }
    return labels[status] || status
  }

  if (isLoading) {
    return <LoadingSpinner text="Chargement de la demande..." />
  }

  if (error || !application) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Demande non trouvée</h1>
          <button
            onClick={() => navigate('/admin/applications')}
            className="btn-primary"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    )
  }

  debugComponent('AdminApplicationDetailPage', { applicationId: id, application });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => navigate('/admin/applications')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <FiArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                Demande {application.reference_number}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 truncate">
                {application.application_type_display} • {application.service_name}
              </p>
            </div>
          </div>
        
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="btn-primary flex items-center space-x-2 w-full sm:w-auto"
            >
              <FiEdit className="w-4 h-4" />
              <span>Modifier</span>
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <button
                onClick={handleSave}
                disabled={updateApplication.isPending}
                className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto"
              >
                <FiSave className="w-4 h-4" />
                <span>Sauvegarder</span>
              </button>
              <button
                onClick={handleCancel}
                className="btn-secondary flex items-center justify-center space-x-2 w-full sm:w-auto"
              >
                <FiX className="w-4 h-4" />
                <span>Annuler</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Status Section */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center">
                <FiCheckCircle className="w-5 h-5 mr-2" />
                Statut de la demande
              </h2>
            
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau statut
                  </label>
                  <select
                    value={editedData.status}
                    onChange={(e) => setEditedData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un statut</option>
                    {getNextStatuses(application.status).map((status: string) => (
                      <option key={status} value={status}>
                        {getStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes administratives
                  </label>
                  <textarea
                    value={editedData.admin_notes || ''}
                    onChange={(e) => setEditedData(prev => ({ ...prev, admin_notes: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ajoutez des notes pour l'équipe..."
                  />
                </div>
                
                {editedData.status === 'REJECTED' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Raison du rejet
                    </label>
                    <textarea
                      value={editedData.rejection_reason || ''}
                      onChange={(e) => setEditedData(prev => ({ ...prev, rejection_reason: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Expliquez la raison du rejet..."
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                    {getStatusIcon(application.status)}
                    <span className="ml-2">{application.status_display}</span>
                  </span>
                </div>
                
                {application.admin_notes && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Notes administratives</h4>
                    <p className="text-blue-800">{application.admin_notes}</p>
                  </div>
                )}
                
                {application.rejection_reason && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-medium text-red-900 mb-2">Raison du rejet</h4>
                    <p className="text-red-800">{application.rejection_reason}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Application Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FiFileText className="w-5 h-5 mr-2" />
              Détails de la demande
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type de demande</label>
                <p className="mt-1 text-sm text-gray-900">{application.application_type_display}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Service</label>
                <p className="mt-1 text-sm text-gray-900">{application.service_name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Bureau</label>
                <p className="mt-1 text-sm text-gray-900">{application.office_name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Frais</label>
                <p className="mt-1 text-sm text-gray-900">
                  {application.total_fee ? `${application.total_fee.toLocaleString()} FCFA` : 'N/A'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Date de soumission</label>
                <p className="mt-1 text-sm text-gray-900">
                  {application.submitted_at ? new Date(application.submitted_at).toLocaleString('fr-FR') : 'N/A'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Dernière mise à jour</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(application.updated_at).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
            
            {application.applicant_notes && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Notes du demandeur</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {application.applicant_notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Applicant Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FiUser className="w-5 h-5 mr-2" />
              Informations du demandeur
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom complet</label>
                <p className="text-sm text-gray-900">{application.applicant_name || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-900">{application.applicant_email || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                <p className="text-sm text-gray-900">{application.applicant_phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
            
            <div className="space-y-2">
              <button
                onClick={() => window.open(`mailto:${application.applicant_email}`, '_blank')}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
              >
                <FiMail className="w-4 h-4" />
                <span>Envoyer un email</span>
              </button>
              
               
            </div>
          </div>

          {/* Status History */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FiCalendar className="w-5 h-5 mr-2" />
              Historique
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Demande créée</p>
                  <p className="text-xs text-gray-500">
                    {new Date(application.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
              
              {application.submitted_at && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Soumise</p>
                    <p className="text-xs text-gray-500">
                      {new Date(application.submitted_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              )}
              
              {application.completed_at && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Terminée</p>
                    <p className="text-xs text-gray-500">
                      {new Date(application.completed_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
