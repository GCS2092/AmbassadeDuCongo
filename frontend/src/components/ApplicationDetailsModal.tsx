/**
 * Modal d'affichage des détails d'une demande
 */
import { 
  FiX, FiUser, FiCalendar, FiDollarSign, FiFileText, 
  FiCheckCircle, FiXCircle, FiClock, FiAlertTriangle,
  FiMapPin, FiPhone, FiMail, FiEdit, FiDownload
} from 'react-icons/fi'

interface ApplicationDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  application: any
}

export default function ApplicationDetailsModal({
  isOpen,
  onClose,
  application
}: ApplicationDetailsModalProps) {
  if (!isOpen || !application) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <FiCheckCircle className="text-green-500" size={20} />
      case 'REJECTED':
        return <FiXCircle className="text-red-500" size={20} />
      case 'PROCESSING':
        return <FiClock className="text-blue-500" size={20} />
      case 'PAYMENT_PENDING':
        return <FiDollarSign className="text-yellow-500" size={20} />
      default:
        return <FiAlertTriangle className="text-gray-500" size={20} />
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <FiFileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Détails de la demande
                  </h3>
                  <p className="text-sm text-gray-500">
                    {application.reference_number}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informations générales */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Informations générales
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <FiFileText className="text-gray-400" size={16} />
                    <div>
                      <span className="text-sm font-medium text-gray-500">Type:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {application.application_type_display}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <FiUser className="text-gray-400" size={16} />
                    <div>
                      <span className="text-sm font-medium text-gray-500">Demandeur:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {application.applicant_name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <FiMapPin className="text-gray-400" size={16} />
                    <div>
                      <span className="text-sm font-medium text-gray-500">Bureau:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {application.office_name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-gray-400">📋</span>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Service:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {application.service_name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statut et frais */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Statut et frais
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(application.status)}
                    <div>
                      <span className="text-sm font-medium text-gray-500">Statut:</span>
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                        {application.status_display}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <FiDollarSign className="text-gray-400" size={16} />
                    <div>
                      <span className="text-sm font-medium text-gray-500">Frais de base:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {application.base_fee.toFixed(2)} €
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <FiDollarSign className="text-gray-400" size={16} />
                    <div>
                      <span className="text-sm font-medium text-gray-500">Frais additionnels:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {application.additional_fees.toFixed(2)} €
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <FiDollarSign className="text-green-500" size={16} />
                    <div>
                      <span className="text-sm font-medium text-gray-500">Total:</span>
                      <span className="ml-2 text-sm font-bold text-gray-900">
                        {application.total_fee.toFixed(2)} €
                      </span>
                      {application.is_paid && (
                        <span className="ml-2 text-xs text-green-600">(Payé)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Dates importantes
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <FiCalendar className="text-gray-400" size={16} />
                    <div>
                      <span className="text-sm font-medium text-gray-500">Créé le:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {formatDate(application.created_at)}
                      </span>
                    </div>
                  </div>

                  {application.submitted_at && (
                    <div className="flex items-center space-x-3">
                      <FiCalendar className="text-gray-400" size={16} />
                      <div>
                        <span className="text-sm font-medium text-gray-500">Soumis le:</span>
                        <span className="ml-2 text-sm text-gray-900">
                          {formatDate(application.submitted_at)}
                        </span>
                      </div>
                    </div>
                  )}

                  {application.completed_at && (
                    <div className="flex items-center space-x-3">
                      <FiCalendar className="text-gray-400" size={16} />
                      <div>
                        <span className="text-sm font-medium text-gray-500">Terminé le:</span>
                        <span className="ml-2 text-sm text-gray-900">
                          {formatDate(application.completed_at)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <FiCalendar className="text-gray-400" size={16} />
                    <div>
                      <span className="text-sm font-medium text-gray-500">Dernière mise à jour:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {formatDate(application.updated_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Documents
                </h4>
                
                {application.documents && application.documents.length > 0 ? (
                  <div className="space-y-2">
                    {application.documents.map((doc: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center space-x-3">
                          <FiFileText className="text-gray-400" size={16} />
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              {doc.original_filename}
                            </span>
                            <div className="text-xs text-gray-500">
                              {doc.document_type} • {(doc.file_size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {doc.is_verified ? (
                            <FiCheckCircle className="text-green-500" size={16} />
                          ) : (
                            <FiAlertTriangle className="text-yellow-500" size={16} />
                          )}
                          <button className="text-blue-600 hover:text-blue-800">
                            <FiDownload size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aucun document joint</p>
                )}
              </div>

              {/* Notes */}
              {(application.applicant_notes || application.admin_notes) && (
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Notes
                  </h4>
                  
                  {application.applicant_notes && (
                    <div className="p-4 bg-blue-50 rounded-md">
                      <h5 className="text-sm font-medium text-blue-900 mb-2">
                        Notes du demandeur:
                      </h5>
                      <p className="text-sm text-blue-800">
                        {application.applicant_notes}
                      </p>
                    </div>
                  )}

                  {application.admin_notes && (
                    <div className="p-4 bg-gray-50 rounded-md">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">
                        Notes administratives:
                      </h5>
                      <p className="text-sm text-gray-700">
                        {application.admin_notes}
                      </p>
                    </div>
                  )}

                  {application.rejection_reason && (
                    <div className="p-4 bg-red-50 rounded-md">
                      <h5 className="text-sm font-medium text-red-900 mb-2">
                        Motif de rejet:
                      </h5>
                      <p className="text-sm text-red-800">
                        {application.rejection_reason}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Détails spécifiques */}
              {(application.visa_details || application.passport_details) && (
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Détails spécifiques
                  </h4>
                  
                  {application.visa_details && (
                    <div className="p-4 bg-green-50 rounded-md">
                      <h5 className="text-sm font-medium text-green-900 mb-2">
                        Détails du visa:
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-green-800">Type:</span>
                          <span className="ml-2 text-green-700">
                            {application.visa_details.visa_type}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-green-800">Durée:</span>
                          <span className="ml-2 text-green-700">
                            {application.visa_details.duration_days} jours
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-green-800">Destination:</span>
                          <span className="ml-2 text-green-700">
                            {application.visa_details.destination_city}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-green-800">Motif:</span>
                          <span className="ml-2 text-green-700">
                            {application.visa_details.purpose_of_visit}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {application.passport_details && (
                    <div className="p-4 bg-blue-50 rounded-md">
                      <h5 className="text-sm font-medium text-blue-900 mb-2">
                        Détails du passeport:
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-blue-800">Type:</span>
                          <span className="ml-2 text-blue-700">
                            {application.passport_details.passport_type}
                          </span>
                        </div>
                        {application.passport_details.current_passport_number && (
                          <div>
                            <span className="font-medium text-blue-800">Passeport actuel:</span>
                            <span className="ml-2 text-blue-700">
                              {application.passport_details.current_passport_number}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
