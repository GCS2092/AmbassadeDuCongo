/**
 * Admin Applications Management Page
 * Page de gestion des demandes pour les administrateurs
 */
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsApi } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { FiFilter, FiSearch, FiEdit, FiTrash2, FiEye, FiCheck, FiX, FiClock, FiAlertTriangle } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { debugAPI, safeArrayAccess, debugComponent } from '../utils/debugHelper'
import Pagination from '../components/Pagination'

export default function AdminApplicationsPage() {
  const [filters, setFilters] = useState({
    status: '',
    application_type: '',
    search: ''
  })
  const [selectedApplications, setSelectedApplications] = useState<number[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const queryClient = useQueryClient()

  // Fetch applications with pagination
  const { data: applicationsResponse, isLoading } = useQuery({
    queryKey: ['admin-applications', currentPage, filters.status, filters.application_type],
    queryFn: () => {
      debugAPI.logRequest('/applications/', 'GET');
      const params: any = { page: currentPage }
      if (filters.status) params.status = filters.status
      if (filters.application_type) params.application_type = filters.application_type
      if (filters.search) params.search = filters.search
      
      return applicationsApi.list().then(res => {
        debugAPI.logResponse('/applications/', res.status, res.data);
        // Si l'API retourne une structure paginée, l'utiliser directement
        if (res.data && res.data.results) {
          return res.data
        }
        // Sinon, wrapper dans une structure paginée
        const apps = safeArrayAccess(res.data) || []
        return {
          results: apps,
          count: apps.length,
          next: null,
          previous: null
        }
      }).catch(error => {
        debugAPI.logError('/applications/', error);
        throw error;
      });
    }
  })

  const applications = applicationsResponse?.results || safeArrayAccess(applicationsResponse) || []
  const totalCount = applicationsResponse?.count || applications.length
  const totalPages = Math.ceil(totalCount / 20) || 1
  debugComponent('AdminApplicationsPage', { applicationsCount: applications.length, isLoading, totalCount });

  // Filter applications
  const filteredApplications = applications.filter((app: any) => {
    const matchesStatus = !filters.status || app.status === filters.status
    const matchesType = !filters.application_type || app.application_type === filters.application_type
    const matchesSearch = !filters.search || 
      app.reference_number.toLowerCase().includes(filters.search.toLowerCase()) ||
      app.applicant_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      app.service_name?.toLowerCase().includes(filters.search.toLowerCase())
    
    return matchesStatus && matchesType && matchesSearch
  })

  // Bulk status update mutation
  const bulkStatusUpdate = useMutation({
    mutationFn: ({ applicationIds, status, adminNotes }: { applicationIds: number[], status: string, adminNotes?: string }) => {
      return Promise.all(
        applicationIds.map(id => 
          applicationsApi.update(id, { status, admin_notes: adminNotes })
        )
      )
    },
    onSuccess: () => {
      toast.success('Statuts mis à jour avec succès')
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      setSelectedApplications([])
      setShowBulkActions(false)
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour des statuts')
      console.error('Bulk update error:', error)
    }
  })

  // Single status update mutation
  const updateStatus = useMutation({
    mutationFn: ({ id, status, adminNotes }: { id: number, status: string, adminNotes?: string }) => {
      return applicationsApi.update(id, { status, admin_notes: adminNotes })
    },
    onSuccess: () => {
      toast.success('Statut mis à jour avec succès')
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour du statut')
      console.error('Status update error:', error)
    }
  })

  // Delete applications mutation
  const deleteApplications = useMutation({
    mutationFn: (applicationIds: number[]) => {
      return Promise.all(applicationIds.map(id => applicationsApi.delete(id)))
    },
    onSuccess: () => {
      toast.success('Demandes supprimées avec succès')
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      setSelectedApplications([])
      setShowBulkActions(false)
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression des demandes')
      console.error('Delete error:', error)
    }
  })

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
      setSelectedApplications(filteredApplications.map((app: any) => app.id))
    }
  }

  const handleBulkStatusUpdate = (status: string) => {
    if (selectedApplications.length === 0) return
    
    const adminNotes = prompt('Notes administratives (optionnel):')
    bulkStatusUpdate.mutate({ 
      applicationIds: selectedApplications, 
      status,
      adminNotes: adminNotes || undefined
    })
  }

  const handleBulkDelete = () => {
    if (selectedApplications.length === 0) return
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedApplications.length} demande(s) ?`)) {
      deleteApplications.mutate(selectedApplications)
    }
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
      UNDER_REVIEW: FiEye,
      ADDITIONAL_INFO_REQUIRED: FiAlertTriangle,
      PAYMENT_PENDING: FiClock,
      PAYMENT_RECEIVED: FiCheck,
      PROCESSING: FiClock,
      READY: FiCheck,
      COMPLETED: FiCheck,
      REJECTED: FiX,
      CANCELLED: FiX
    }
    const Icon = icons[status] || FiClock
    return <Icon className="w-4 h-4" />
  }

  if (isLoading) {
    return <LoadingSpinner text="Chargement des demandes..." />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestion des Demandes
        </h1>
        <p className="text-gray-600">
          Gérez toutes les demandes consulaires
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recherche
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Référence, nom, service..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les statuts</option>
              <option value="DRAFT">Brouillon</option>
              <option value="SUBMITTED">Soumis</option>
              <option value="UNDER_REVIEW">En cours de vérification</option>
              <option value="ADDITIONAL_INFO_REQUIRED">Informations supplémentaires requises</option>
              <option value="PAYMENT_PENDING">En attente de paiement</option>
              <option value="PAYMENT_RECEIVED">Paiement reçu</option>
              <option value="PROCESSING">En traitement</option>
              <option value="READY">Prêt pour retrait</option>
              <option value="COMPLETED">Terminé</option>
              <option value="REJECTED">Rejeté</option>
              <option value="CANCELLED">Annulé</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={filters.application_type}
              onChange={(e) => setFilters(prev => ({ ...prev, application_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les types</option>
              <option value="VISA">Visa</option>
              <option value="PASSPORT">Passeport</option>
              <option value="PASSPORT_RENEWAL">Renouvellement de passeport</option>
              <option value="BIRTH_CERTIFICATE">Acte de naissance</option>
              <option value="MARRIAGE_CERTIFICATE">Acte de mariage</option>
              <option value="LEGALIZATION">Légalisation de document</option>
              <option value="ATTESTATION">Attestation consulaire</option>
              <option value="OTHER">Autre</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              {filteredApplications.length} demande(s) trouvée(s)
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedApplications.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-800">
                {selectedApplications.length} demande(s) sélectionnée(s)
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkStatusUpdate('UNDER_REVIEW')}
                  className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm hover:bg-yellow-200"
                >
                  Marquer en révision
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('PROCESSING')}
                  className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded text-sm hover:bg-cyan-200"
                >
                  Marquer en traitement
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('READY')}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200"
                >
                  Marquer prêt
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('COMPLETED')}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200"
                >
                  Marquer terminé
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('REJECTED')}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
                >
                  Rejeter
                </button>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
              >
                Supprimer
              </button>
              <button
                onClick={() => setSelectedApplications([])}
                className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Mobile View - Cards */}
        <div className="block md:hidden">
          {filteredApplications.map((application: any) => (
            <div key={application.id} className="border-b border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedApplications.includes(application.id)}
                    onChange={() => handleSelectApplication(application.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">{application.reference_number}</h3>
                    <p className="text-sm text-gray-600">{application.applicant_name}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                  {getStatusIcon(application.status)}
                  <span className="ml-1">{application.status_display}</span>
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                <div>
                  <span className="font-medium">Type:</span> {application.application_type_display}
                </div>
                <div>
                  <span className="font-medium">Service:</span> {application.service_name}
                </div>
                <div>
                  <span className="font-medium">Créé:</span> {new Date(application.created_at).toLocaleDateString('fr-FR')}
                </div>
                <div>
                  <span className="font-medium">Soumis:</span> {application.submitted_at ? new Date(application.submitted_at).toLocaleDateString('fr-FR') : 'Non'}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => window.location.href = `/admin/applications/${application.id}`}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                >
                  Voir détails
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedApplications.length === filteredApplications.length && filteredApplications.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Référence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Demandeur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplications.map((application: any) => (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedApplications.includes(application.id)}
                      onChange={() => handleSelectApplication(application.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {application.reference_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {application.applicant_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {application.application_type_display}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {application.service_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                      {getStatusIcon(application.status)}
                      <span className="ml-1">{application.status_display}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {application.submitted_at ? new Date(application.submitted_at).toLocaleDateString('fr-FR') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.location.href = `/admin/applications/${application.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="Voir les détails"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const newStatus = prompt('Nouveau statut:', application.status)
                          if (newStatus && newStatus !== application.status) {
                            const adminNotes = prompt('Notes administratives (optionnel):')
                            updateStatus.mutate({
                              id: application.id,
                              status: newStatus,
                              adminNotes: adminNotes || undefined
                            })
                          }
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Modifier le statut"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <FiFilter className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600">Aucune demande trouvée</p>
          </div>
        )}

        {/* Pagination */}
        {totalCount > 0 && (
          <div className="mt-6 bg-white p-4 rounded-lg shadow border">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={20}
              onPageChange={(page) => {
                setCurrentPage(page)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
