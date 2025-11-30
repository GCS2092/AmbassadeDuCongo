import React from 'react'
import { FiX, FiEdit, FiMapPin, FiClock, FiDollarSign, FiFileText } from 'react-icons/fi'

interface ServiceType {
  id: number
  name: string
  category: string
  description: string
  base_fee: number
  processing_time_days: number
  requires_appointment: boolean
  is_active: boolean
  display_order: number
  required_documents: string
  offices: Array<{ id: number; name: string }>
}

interface ServiceTypeDetailsProps {
  service: ServiceType
  onClose: () => void
  onEdit?: () => void
}

export function ServiceTypeDetails({ service, onClose, onEdit }: ServiceTypeDetailsProps) {
  const categories = {
    VISA: 'Visa',
    PASSPORT: 'Passeport',
    CIVIL: 'Actes Civils',
    LEGAL: 'Légalisation',
    ATTEST: 'Attestation',
    OTHER: 'Autre'
  }

  const formatDocuments = (documents: string) => {
    if (!documents) return []
    return documents.split('\n').filter(doc => doc.trim())
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Détails du service</h3>
            <div className="flex items-center space-x-2">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="btn-primary btn-sm flex items-center space-x-1"
                >
                  <FiEdit />
                  <span>Modifier</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Informations générales */}
            <div>
              <h4 className="text-lg font-semibold mb-3">Informations générales</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Nom</label>
                  <p className="text-lg font-semibold">{service.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Catégorie</label>
                  <p className="text-lg">{categories[service.category as keyof typeof categories] || service.category}</p>
                </div>
              </div>
              
              {service.description && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-600">Description</label>
                  <p className="text-gray-800 whitespace-pre-wrap">{service.description}</p>
                </div>
              )}
            </div>

            {/* Tarification et délais */}
            <div>
              <h4 className="text-lg font-semibold mb-3">Tarification et délais</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <FiDollarSign className="text-green-600" />
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Prix de base</label>
                    <p className="text-lg font-semibold">{service.base_fee} XOF</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <FiClock className="text-blue-600" />
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Délai de traitement</label>
                    <p className="text-lg font-semibold">{service.processing_time_days} jours</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Ordre d'affichage</label>
                  <p className="text-lg font-semibold">{service.display_order}</p>
                </div>
              </div>
            </div>

            {/* Options */}
            <div>
              <h4 className="text-lg font-semibold mb-3">Options</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${service.requires_appointment ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">
                    {service.requires_appointment ? 'Nécessite un rendez-vous' : 'Ne nécessite pas de rendez-vous'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${service.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm">
                    {service.is_active ? 'Service actif' : 'Service inactif'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bureaux */}
            {service.offices && service.offices.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-3">Bureaux offrant ce service</h4>
                <div className="space-y-2">
                  {service.offices.map(office => (
                    <div key={office.id} className="flex items-center space-x-2">
                      <FiMapPin className="text-blue-600" />
                      <span className="text-sm">{office.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents requis */}
            {service.required_documents && (
              <div>
                <h4 className="text-lg font-semibold mb-3">Documents requis</h4>
                <div className="space-y-2">
                  {formatDocuments(service.required_documents).map((doc, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <FiFileText className="text-gray-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-6 border-t mt-6">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
