/**
 * Page d'administration des actualités
 * Permet à l'admin/superadmin de créer, modifier et supprimer les annonces
 */
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  FiInfo, FiPlus, FiEdit, FiTrash2, FiSave, FiX, FiAlertCircle,
  FiCalendar, FiMapPin, FiBookmark, FiEye, FiEyeOff, FiFilter, FiSearch
} from 'react-icons/fi'
import { announcementsApi, api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import Pagination from '../components/Pagination'

export default function AdminAnnouncementsPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  
  // Filtres
  const [filters, setFilters] = useState({
    search: '',
    priority: '',
    is_published: '',
    is_pinned: '',
    office: ''
  })

  // Vérifier les permissions admin
  React.useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      toast.error('Accès non autorisé. Privilèges administrateur requis.')
      navigate('/admin')
    }
  }, [user, navigate])

  // Récupérer les annonces (toutes, même non publiées pour l'admin) avec pagination
  const { data: announcements, isLoading } = useQuery({
    queryKey: ['admin-announcements', currentPage],
    queryFn: async () => {
      // Pour l'admin, on récupère toutes les annonces avec pagination
      const response = await api.get(`/core/announcements/?page=${currentPage}`)
      return response.data
    },
    retry: 1,
  })

  // Récupérer les bureaux consulaires
  const { data: officesResponse } = useQuery({
    queryKey: ['consular-offices'],
    queryFn: async () => {
      const response = await api.get('/core/consular-offices/')
      return response.data
    },
  })

  // Extraire les données du format de réponse de l'API
  const offices = Array.isArray(officesResponse) 
    ? officesResponse 
    : officesResponse?.results || []

  // Extraire les annonces du format de réponse paginée
  const allAnnouncements = announcements?.results || (Array.isArray(announcements) ? announcements : [])
  const totalCount = announcements?.count || allAnnouncements.length
  const totalPages = Math.ceil(totalCount / 20) || 1

  // Réinitialiser à la page 1 quand les filtres changent
  React.useEffect(() => {
    setCurrentPage(1)
  }, [filters.search, filters.priority, filters.is_published, filters.is_pinned, filters.office])

  // Filtrer les annonces (filtrage côté client pour la page actuelle)
  const filteredAnnouncements = allAnnouncements.filter((announcement: any) => {
    // Recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      if (!announcement.title?.toLowerCase().includes(searchLower) && 
          !announcement.content?.toLowerCase().includes(searchLower)) {
        return false
      }
    }
    
    // Priorité
    if (filters.priority && announcement.priority !== filters.priority) {
      return false
    }
    
    // Statut publié
    if (filters.is_published !== '') {
      const isPublished = filters.is_published === 'true'
      if (announcement.is_published !== isPublished) {
        return false
      }
    }
    
    // Épinglé
    if (filters.is_pinned !== '') {
      const isPinned = filters.is_pinned === 'true'
      if (announcement.is_pinned !== isPinned) {
        return false
      }
    }
    
    // Bureau
    if (filters.office && announcement.office?.toString() !== filters.office) {
      return false
    }
    
    return true
  })

  // État du formulaire
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'NORMAL',
    office: null as number | null,
    is_pinned: false,
    is_published: false,
    publish_from: new Date().toISOString().slice(0, 16),
    publish_to: '',
    target_all_users: true,
    target_roles: '',
  })

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'NORMAL',
      office: null,
      is_pinned: false,
      is_published: false,
      publish_from: new Date().toISOString().slice(0, 16),
      publish_to: '',
      target_all_users: true,
      target_roles: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  // Charger les données pour l'édition
  const handleEdit = (announcement: any) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      office: announcement.office,
      is_pinned: announcement.is_pinned,
      is_published: announcement.is_published,
      publish_from: announcement.publish_from ? new Date(announcement.publish_from).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      publish_to: announcement.publish_to ? new Date(announcement.publish_to).toISOString().slice(0, 16) : '',
      target_all_users: announcement.target_all_users ?? true,
      target_roles: announcement.target_roles || '',
    })
    setEditingId(announcement.id)
    setShowForm(true)
  }

  // Mutation pour créer/mettre à jour
  const saveMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      const payload = {
        ...data,
        publish_from: data.publish_from ? new Date(data.publish_from).toISOString() : new Date().toISOString(),
        publish_to: data.publish_to ? new Date(data.publish_to).toISOString() : null,
        office: data.office || null,
      }
      
      if (editingId) {
        return announcementsApi.update(editingId, payload)
      } else {
        return announcementsApi.create(payload)
      }
    },
    onSuccess: () => {
      toast.success(editingId ? 'Annonce mise à jour avec succès !' : 'Annonce créée avec succès !')
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la sauvegarde')
    },
  })

  // Mutation pour supprimer
  const deleteMutation = useMutation({
    mutationFn: (id: number) => announcementsApi.delete(id),
    onSuccess: () => {
      toast.success('Annonce supprimée avec succès !')
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate(formData)
  }

  const handleDelete = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading) {
    return <LoadingSpinner text="Chargement des annonces..." />
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'LOW':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center space-x-3">
                <FiInfo className="text-primary-500" size={32} />
                <span>Gestion des Actualités</span>
              </h1>
              <p className="text-gray-600">
                Créez et gérez les annonces affichées sur le site
              </p>
            </div>
            <button
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="btn-primary flex items-center space-x-2"
            >
              <FiPlus size={16} />
              <span className="hidden sm:inline">Nouvelle annonce</span>
            </button>
          </div>
        </div>

        {/* Formulaire */}
        {showForm && (
          <div className="bg-white rounded-lg shadow border p-4 md:p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Modifier l\'annonce' : 'Nouvelle annonce'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="input w-full"
                  required
                  placeholder="Ex: Passeports disponibles"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenu *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="input w-full"
                  rows={6}
                  required
                  placeholder="Détails de l'annonce..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priorité *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    className="input w-full"
                    required
                  >
                    <option value="LOW">Basse</option>
                    <option value="NORMAL">Normale</option>
                    <option value="HIGH">Haute</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bureau consulaire
                  </label>
                  <select
                    value={formData.office || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, office: e.target.value ? parseInt(e.target.value) : null }))}
                    className="input w-full"
                  >
                    <option value="">Tous les bureaux</option>
                    {offices?.map((office: any) => (
                      <option key={office.id} value={office.id}>
                        {office.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de publication *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.publish_from}
                    onChange={(e) => setFormData(prev => ({ ...prev, publish_from: e.target.value }))}
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date d'expiration (optionnel)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.publish_to}
                    onChange={(e) => setFormData(prev => ({ ...prev, publish_to: e.target.value }))}
                    className="input w-full"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_pinned}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_pinned: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Épingler en haut</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Publier immédiatement</span>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary flex items-center justify-center space-x-2"
                >
                  <FiX size={16} />
                  <span>Annuler</span>
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="btn-primary flex items-center justify-center space-x-2"
                >
                  {saveMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sauvegarde...</span>
                    </>
                  ) : (
                    <>
                      <FiSave size={16} />
                      <span>Sauvegarder</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow border p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FiFilter className="text-gray-500" size={20} />
            <h3 className="font-semibold text-gray-700">Filtres</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Recherche */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            {/* Priorité */}
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Toutes les priorités</option>
              <option value="URGENT">Urgente</option>
              <option value="HIGH">Haute</option>
              <option value="NORMAL">Normale</option>
              <option value="LOW">Basse</option>
            </select>
            
            {/* Statut publié */}
            <select
              value={filters.is_published}
              onChange={(e) => setFilters(prev => ({ ...prev, is_published: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="true">Publié</option>
              <option value="false">Brouillon</option>
            </select>
            
            {/* Épinglé */}
            <select
              value={filters.is_pinned}
              onChange={(e) => setFilters(prev => ({ ...prev, is_pinned: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Toutes les annonces</option>
              <option value="true">Épinglées</option>
              <option value="false">Non épinglées</option>
            </select>
            
            {/* Bureau */}
            <select
              value={filters.office}
              onChange={(e) => setFilters(prev => ({ ...prev, office: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Tous les bureaux</option>
              {offices?.map((office: any) => (
                <option key={office.id} value={office.id.toString()}>
                  {office.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Bouton réinitialiser les filtres */}
          {(filters.search || filters.priority || filters.is_published !== '' || filters.is_pinned !== '' || filters.office) && (
            <button
              onClick={() => setFilters({ search: '', priority: '', is_published: '', is_pinned: '', office: '' })}
              className="mt-4 text-sm text-primary-600 hover:text-primary-800 font-medium"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>

        {/* Liste des annonces - Tableau */}
        {filteredAnnouncements && filteredAnnouncements.length > 0 ? (
          <div className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Titre
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priorité
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date de publication
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAnnouncements.map((announcement: any) => (
                    <tr key={announcement.id} className={announcement.is_pinned ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {announcement.is_pinned && (
                            <FiBookmark className="text-yellow-500 flex-shrink-0" size={16} title="Épinglé" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {announcement.title}
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-2 max-w-md">
                              {announcement.content?.substring(0, 100)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          announcement.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                          announcement.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                          announcement.priority === 'NORMAL' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {announcement.priority_display || announcement.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {announcement.is_published ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 flex items-center gap-1">
                            <FiEye size={14} /> Publié
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 flex items-center gap-1">
                            <FiEyeOff size={14} /> Brouillon
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <FiCalendar size={14} />
                          <span>{new Date(announcement.publish_from).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        {announcement.office_name && (
                          <div className="flex items-center space-x-1 text-xs text-gray-400 mt-1">
                            <FiMapPin size={12} />
                            <span>{announcement.office_name}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(announcement)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Modifier"
                          >
                            <FiEdit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(announcement.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Supprimer"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card text-center py-12">
            <FiInfo className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600 mb-4">
              {allAnnouncements.length === 0 
                ? "Aucune annonce pour le moment" 
                : "Aucune annonce ne correspond aux filtres sélectionnés"}
            </p>
            <button
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="btn-primary"
            >
              Créer la première annonce
            </button>
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

