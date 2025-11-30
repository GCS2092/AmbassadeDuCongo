import React from 'react'
import { FiClock, FiDollarSign, FiFileText, FiChevronRight } from 'react-icons/fi'

interface Service {
  id: number
  name: string
  category: string
  category_display: string
  description?: string
  base_fee: string
  processing_time_days: number
  requires_appointment: boolean
}

interface ServiceCardProps {
  service: Service
  onSelect: (service: Service) => void
  isSelected?: boolean
}

export default function ServiceCard({ service, onSelect, isSelected = false }: ServiceCardProps) {
  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price)
    return new Intl.NumberFormat('fr-FR').format(numPrice)
  }

  return (
    <div
      onClick={() => onSelect(service)}
      className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected 
          ? 'ring-2 ring-primary-500 bg-primary-50 border-primary-200' 
          : 'hover:shadow-md'
      }`}
    >
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-full">
        {/* En-tête avec catégorie */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {service.category_display}
              </span>
              {service.requires_appointment && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                  RDV requis
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {service.name}
            </h3>
          </div>
          <FiChevronRight className={`h-5 w-5 text-gray-400 transition-colors ${
            isSelected ? 'text-primary-500' : ''
          }`} />
        </div>

        {/* Description */}
        {service.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {service.description}
          </p>
        )}

        {/* Informations de prix et délai */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-700">
              <FiDollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Prix</span>
            </div>
            <span className="text-lg font-bold text-green-600">
              {formatPrice(service.base_fee)} XOF
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-700">
              <FiClock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Délai</span>
            </div>
            <span className="text-sm font-semibold text-blue-600">
              {service.processing_time_days} jour{service.processing_time_days > 1 ? 's' : ''}
            </span>
          </div>

          {service.requires_appointment && (
            <div className="flex items-center gap-2 text-orange-600">
              <FiFileText className="h-4 w-4" />
              <span className="text-sm font-medium">Rendez-vous obligatoire</span>
            </div>
          )}
        </div>

        {/* Indicateur de sélection */}
        {isSelected && (
          <div className="absolute top-4 right-4">
            <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
