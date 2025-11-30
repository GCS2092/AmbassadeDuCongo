import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiX, FiSave } from 'react-icons/fi'
import { serviceTypesApi, consularOfficesApi } from '../../lib/api'
import toast from 'react-hot-toast'

interface ServiceType {
  id?: number
  name: string
  category: string
  description: string
  base_fee: number
  processing_time_days: number
  requires_appointment: boolean
  is_active: boolean
  display_order: number
  required_documents: string
  offices: number[]
}

interface ServiceTypeFormProps {
  service?: ServiceType
  onClose: () => void
  onSuccess: () => void
}

export function ServiceTypeForm({ service, onClose, onSuccess }: ServiceTypeFormProps) {
  const [selectedOffices, setSelectedOffices] = useState<number[]>(service?.offices || [])
  const queryClient = useQueryClient()
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ServiceType>({
    defaultValues: service || {
      name: '',
      category: 'VISA',
      description: '',
      base_fee: 0,
      processing_time_days: 5,
      requires_appointment: true,
      is_active: true,
      display_order: 0,
      required_documents: '',
      offices: []
    }
  })

  const { data: officesResponse } = useQuery({
    queryKey: ['consular-offices'],
    queryFn: () => consularOfficesApi.list()
  })

  // Extraire les données du format de réponse de l'API
  const offices = Array.isArray(officesResponse?.data) 
    ? officesResponse.data 
    : officesResponse?.data?.results || []

  const createMutation = useMutation({
    mutationFn: (data: ServiceType) => serviceTypesApi.create(data),
    onSuccess: () => {
      toast.success('Type de service créé avec succès')
      // Invalider le cache pour forcer la mise à jour
      queryClient.invalidateQueries({ queryKey: ['service-types'] })
      onSuccess()
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la création')
      console.error('Create error:', error)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ServiceType }) => 
      serviceTypesApi.update(id, data),
    onSuccess: () => {
      toast.success('Type de service modifié avec succès')
      // Invalider le cache pour forcer la mise à jour
      queryClient.invalidateQueries({ queryKey: ['service-types'] })
      onSuccess()
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la modification')
      console.error('Update error:', error)
    }
  })

  const onSubmit = (data: ServiceType) => {
    const formData = {
      ...data,
      offices: selectedOffices
    }

    if (service?.id) {
      updateMutation.mutate({ id: service.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleOfficeToggle = (officeId: number) => {
    setSelectedOffices(prev => 
      prev.includes(officeId) 
        ? prev.filter(id => id !== officeId)
        : [...prev, officeId]
    )
  }

  const categories = [
    { value: 'VISA', label: 'Visa' },
    { value: 'PASSPORT', label: 'Passeport' },
    { value: 'CIVIL', label: 'Actes Civils' },
    { value: 'LEGAL', label: 'Légalisation' },
    { value: 'ATTEST', label: 'Attestation' },
    { value: 'OTHER', label: 'Autre' }
  ]

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {service ? 'Modifier le type de service' : 'Nouveau type de service'}
              </h3>
              <p className="text-gray-600 mt-1">
                {service ? 'Modifiez les informations du service' : 'Créez un nouveau type de service'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiX size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Informations générales */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom du service *</label>
                  <input
                    {...register('name', { required: 'Le nom est requis' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    placeholder="Ex: Visa de tourisme"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
                  <select
                    {...register('category', { required: 'La catégorie est requise' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  {...register('description')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  rows={3}
                  placeholder="Description du service..."
                />
              </div>
            </div>

            {/* Tarification et délais */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Tarification et délais</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prix de base (XOF) *</label>
                  <input
                    type="number"
                    {...register('base_fee', { 
                      required: 'Le prix est requis',
                      min: { value: 0, message: 'Le prix doit être positif' }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    placeholder="0"
                  />
                  {errors.base_fee && (
                    <p className="text-red-500 text-sm mt-1">{errors.base_fee.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Délai (jours) *</label>
                  <input
                    type="number"
                    {...register('processing_time_days', { 
                      required: 'Le délai est requis',
                      min: { value: 1, message: 'Le délai doit être d\'au moins 1 jour' }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    placeholder="5"
                  />
                  {errors.processing_time_days && (
                    <p className="text-red-500 text-sm mt-1">{errors.processing_time_days.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ordre d'affichage</label>
                  <input
                    type="number"
                    {...register('display_order')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="bg-green-50 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Options du service</h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('requires_appointment')}
                    className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Nécessite un rendez-vous
                  </label>
                </div>
              </div>
            </div>

            {/* Documents requis */}
            <div className="bg-yellow-50 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Documents requis</h4>
              <textarea
                {...register('required_documents')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                rows={4}
                placeholder="Liste des documents requis (un par ligne)&#10;Ex:&#10;- Passeport valide&#10;- Formulaire de demande&#10;- Photo d'identité"
              />
              <p className="text-sm text-gray-500 mt-2">
                Un document par ligne
              </p>
            </div>

            {/* Bureaux */}
            <div className="bg-purple-50 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Bureaux offrant ce service</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-white">
                {offices?.map(office => (
                  <label key={office.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={selectedOffices.includes(office.id)}
                      onChange={() => handleOfficeToggle(office.id)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{office.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                <FiSave size={18} />
                <span>{isLoading ? 'Enregistrement...' : 'Enregistrer'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
