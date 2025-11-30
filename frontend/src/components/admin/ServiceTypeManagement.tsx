import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff, FiPackage } from 'react-icons/fi'
import { serviceTypesApi } from '../../lib/api'
import LoadingSpinner from '../LoadingSpinner'
import toast from 'react-hot-toast'
import { ServiceTypeForm } from './ServiceTypeForm'
import { ServiceTypeDetails } from './ServiceTypeDetails'

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

export function ServiceTypeManagement() {
  const [showForm, setShowForm] = useState(false)
  const [editingService, setEditingService] = useState<ServiceType | null>(null)
  const [viewingService, setViewingService] = useState<ServiceType | null>(null)
  const [filter, setFilter] = useState('all')
  const queryClient = useQueryClient()

  const { data: serviceTypesResponse, isLoading } = useQuery({
    queryKey: ['service-types'],
    queryFn: () => serviceTypesApi.list()
  })

  // Extraire les données du format de réponse de l'API
  const serviceTypes = Array.isArray(serviceTypesResponse?.data) 
    ? serviceTypesResponse.data 
    : serviceTypesResponse?.data?.results || []

  const deleteMutation = useMutation({
    mutationFn: (id: number) => serviceTypesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-types'] })
      toast.success('Type de service supprimé avec succès')
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression')
      console.error('Delete error:', error)
    }
  })

  const handleDelete = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce type de service ?')) {
      deleteMutation.mutate(id)
    }
  }

  const filteredServices = serviceTypes?.filter(service => {
    if (filter === 'all') return true
    return service.category === filter
  }) || []

  const categories = [
    { value: 'VISA', label: 'Visa' },
    { value: 'PASSPORT', label: 'Passeport' },
    { value: 'CIVIL', label: 'Actes Civils' },
    { value: 'LEGAL', label: 'Légalisation' },
    { value: 'ATTEST', label: 'Attestation' },
    { value: 'OTHER', label: 'Autre' }
  ]

  if (isLoading) {
    return <LoadingSpinner text="Chargement des types de services..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Types de Services</h2>
          <p className="text-gray-600">Gérez les types de services consulaires</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <FiPlus />
          <span>Nouveau Type</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">Tous les types</option>
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Services List */}
      <div className="grid gap-6">
        {filteredServices.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <div className="text-gray-400 mb-4">
              <FiPackage size={48} className="mx-auto" />
            </div>
            <p className="text-gray-500 text-lg">Aucun type de service trouvé</p>
            <p className="text-gray-400 text-sm mt-2">Créez votre premier type de service</p>
          </div>
        ) : (
          filteredServices.map((service) => (
            <div key={service.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-3">
                    <h3 className="text-xl font-semibold text-gray-900 truncate">{service.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {categories.find(c => c.value === service.category)?.label || service.category}
                      </span>
                    </div>
                  </div>
                  
                  {service.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {service.description}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Prix:</span>
                      <span className="font-semibold text-green-600">{Number(service.base_fee).toLocaleString()} XOF</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Délai:</span>
                      <span className="font-semibold text-blue-600">{service.processing_time_days} jours</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">RDV:</span>
                      <span className={`font-semibold ${service.requires_appointment ? 'text-orange-600' : 'text-gray-600'}`}>
                        {service.requires_appointment ? 'Oui' : 'Non'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setViewingService(service)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center space-x-2"
                    title="Voir les détails"
                  >
                    <FiEye size={16} />
                    <span className="hidden sm:inline">Voir</span>
                  </button>
                  <button
                    onClick={() => setEditingService(service)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium flex items-center space-x-2"
                    title="Modifier le service"
                  >
                    <FiEdit2 size={16} />
                    <span className="hidden sm:inline">Modifier</span>
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center space-x-2"
                    title="Supprimer le service"
                  >
                    <FiTrash2 size={16} />
                    <span className="hidden sm:inline">Supprimer</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <ServiceTypeForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false)
            queryClient.invalidateQueries({ queryKey: ['service-types'] })
          }}
        />
      )}

      {editingService && (
        <ServiceTypeForm
          service={editingService}
          onClose={() => setEditingService(null)}
          onSuccess={() => {
            setEditingService(null)
            queryClient.invalidateQueries({ queryKey: ['service-types'] })
          }}
        />
      )}

      {viewingService && (
        <ServiceTypeDetails
          service={viewingService}
          onClose={() => setViewingService(null)}
        />
      )}
    </div>
  )
}
