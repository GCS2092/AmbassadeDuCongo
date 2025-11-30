import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { FiUsers, FiEdit, FiTrash2, FiSearch, FiFilter, FiUserCheck, FiUserX, FiMail, FiPhone, FiCalendar, FiCreditCard, FiSave, FiX } from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { api } from '../lib/api'
import Pagination from '../components/Pagination'

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterConsularCard, setFilterConsularCard] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [editingConsularCard, setEditingConsularCard] = useState<string | null>(null)
  const [newConsularCardNumber, setNewConsularCardNumber] = useState('')
  const { user } = useAuthStore()

  // Récupérer la liste des utilisateurs depuis la vraie API avec pagination
  const { data: usersResponse, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', currentPage],
    queryFn: async () => {
      try {
        const response = await api.get(`/auth/users/?page=${currentPage}`)
        console.log('DEBUG: Réponse API utilisateurs:', response.data)
          return response.data
      } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error)
        console.error('Détails de l\'erreur:', error.response?.data)
        return { results: [], count: 0, next: null, previous: null }
      }
    }
  })

  // Extraire les données paginées
  const users = usersResponse?.results || []
  const totalCount = usersResponse?.count || 0
  const totalPages = Math.ceil(totalCount / 20) || 1

  // Réinitialiser à la page 1 quand les filtres changent
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterStatus, filterConsularCard])

  // Mutation pour activer un utilisateur
  const activateUser = useMutation({
    mutationFn: async (hashedId: string) => {
      try {
        const response = await api.post(`/auth/users/${hashedId}/activate/`)
        return response.data
      } catch (error: any) {
        console.error('Erreur lors de l\'activation:', error)
        const errorMessage = error?.response?.data?.error || error?.response?.data?.detail || 'Erreur lors de l\'activation'
        throw new Error(errorMessage)
      }
    },
    onSuccess: () => {
      toast.success('Utilisateur activé avec succès')
      refetch()
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erreur lors de l\'activation')
    }
  })

  // Mutation pour désactiver un utilisateur
  const deactivateUser = useMutation({
    mutationFn: async (hashedId: string) => {
      try {
        const response = await api.post(`/auth/users/${hashedId}/deactivate/`)
        return response.data
      } catch (error: any) {
        console.error('Erreur lors de la désactivation:', error)
        const errorMessage = error?.response?.data?.error || error?.response?.data?.detail || 'Erreur lors de la désactivation'
        throw new Error(errorMessage)
      }
    },
    onSuccess: () => {
      toast.success('Utilisateur désactivé avec succès')
      refetch()
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erreur lors de la désactivation')
    }
  })

  // Mutation pour changer le rôle staff
  const toggleStaffRole = useMutation({
    mutationFn: async ({ hashedId, isStaff }: { hashedId: string, isStaff: boolean }) => {
      try {
        const response = await api.patch(`/auth/users/${hashedId}/`, { is_staff: isStaff })
        return response.data
      } catch (error: any) {
        console.error('Erreur lors de la mise à jour du rôle:', error)
        const errorMessage = error?.response?.data?.error || error?.response?.data?.detail || 'Erreur lors de la mise à jour'
        throw new Error(errorMessage)
      }
    },
    onSuccess: () => {
      toast.success('Rôle utilisateur mis à jour')
      refetch()
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erreur lors de la mise à jour')
    }
  })

  // Mutation pour changer le rôle
  const changeUserRole = useMutation({
    mutationFn: async ({ hashedId, role }: { hashedId: string, role: string }) => {
      try {
        const response = await api.post(`/auth/users/${hashedId}/change_role/`, { role })
        return response.data
      } catch (error: any) {
        console.error('Erreur lors du changement de rôle:', error)
        const errorMessage = error?.response?.data?.error || error?.response?.data?.detail || 'Erreur lors du changement de rôle'
        throw new Error(errorMessage)
      }
    },
    onSuccess: () => {
      toast.success('Rôle utilisateur modifié')
      refetch()
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erreur lors du changement de rôle')
    }
  })

  // Mutation pour modifier le numéro de carte consulaire
  const updateConsularCard = useMutation({
    mutationFn: async ({ hashedId, consularCardNumber }: { hashedId: string, consularCardNumber: string }) => {
      try {
        const response = await api.patch(`/auth/users/${hashedId}/`, { 
          consular_card_number: consularCardNumber.toUpperCase() 
        })
        return response.data
      } catch (error: any) {
        console.error('Erreur lors de la mise à jour du numéro de carte:', error)
        const errorMessage = error?.response?.data?.consular_card_number?.[0] || 
                           error?.response?.data?.error || 
                           error?.response?.data?.detail || 
                           'Erreur lors de la mise à jour du numéro de carte'
        throw new Error(errorMessage)
      }
    },
    onSuccess: () => {
      toast.success('Numéro de carte consulaire mis à jour avec succès')
      setEditingConsularCard(null)
      setNewConsularCardNumber('')
      refetch()
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erreur lors de la mise à jour du numéro de carte')
    }
  })

  const handleEditConsularCard = (hashedId: string, currentNumber?: string) => {
    setEditingConsularCard(hashedId)
    setNewConsularCardNumber(currentNumber || '')
  }

  const handleCancelEdit = () => {
    setEditingConsularCard(null)
    setNewConsularCardNumber('')
  }

  const handleSaveConsularCard = (hashedId: string) => {
    if (!newConsularCardNumber || !/^SN\d{7,9}$/i.test(newConsularCardNumber)) {
      toast.error('Format invalide. Le numéro doit commencer par SN suivi de 7 à 9 chiffres.')
      return
    }
    updateConsularCard.mutate({ hashedId, consularCardNumber: newConsularCardNumber })
  }

  // Filtrer les utilisateurs
  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.consular_card_number?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active) ||
      (filterStatus === 'inactive_consular' && !user.is_active && user.consular_card_number) ||
      (filterStatus === 'no_consular_card' && !user.consular_card_number) ||
      (filterStatus === 'staff' && user.is_staff) ||
      (filterStatus === 'unverified' && !user.is_verified)
    
    const matchesConsularCard = 
      !filterConsularCard || 
      (user.consular_card_number && user.consular_card_number.toLowerCase().includes(filterConsularCard.toLowerCase()))
    
    return matchesSearch && matchesFilter && matchesConsularCard
  }) || []

  // Seul le SUPERADMIN peut modifier les numéros consulaires
  const canModifyConsularCard = user?.role === 'SUPERADMIN'

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <FiUsers className="mx-auto mb-4 text-red-500" size={64} />
          <h2 className="text-2xl font-bold mb-4">Accès non autorisé</h2>
          <p className="text-gray-600">Vous devez avoir les privilèges administrateur.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <LoadingSpinner text="Chargement des utilisateurs..." />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center space-x-3">
            <FiUsers className="text-blue-500" size={32} />
            <span>Gestion des Utilisateurs</span>
          </h1>
          <p className="text-gray-600">
            Gérer les comptes utilisateurs, rôles et permissions
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow border mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input"
              >
                <option value="all">Tous les utilisateurs</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
                <option value="inactive_consular">Inactifs (carte consulaire)</option>
                <option value="no_consular_card">Sans carte consulaire</option>
                <option value="staff">Staff</option>
                <option value="unverified">Non vérifiés</option>
              </select>
            </div>
            <div className="md:w-64">
              <input
                type="text"
                placeholder="Filtrer par carte consulaire..."
                value={filterConsularCard}
                onChange={(e) => setFilterConsularCard(e.target.value)}
                className="input"
                style={{ textTransform: 'uppercase' }}
              />
            </div>
          </div>
        </div>

        {/* Stats - 2x2 Layout */}
        <div className="grid grid-cols-2 gap-4 md:gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiUsers className="text-blue-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{users?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiUserCheck className="text-green-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Actifs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users?.filter(u => u.is_active).length || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FiUsers className="text-purple-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Staff</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users?.filter(u => u.is_staff).length || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <FiUserX className="text-red-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Non vérifiés</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users?.filter(u => !u.is_verified).length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table - Mobile View */}
        <div className="md:hidden space-y-4">
          {filteredUsers.map((userData) => (
            <div key={userData.id} className="bg-white rounded-lg shadow border p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-primary-500 flex items-center justify-center">
                    <span className="text-white font-medium">
                      {(userData.first_name?.[0] || userData.email?.[0] || 'U').toUpperCase()}
                      {(userData.last_name?.[0] || '').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {userData.first_name && userData.last_name 
                        ? `${userData.first_name} ${userData.last_name}`
                        : userData.first_name || userData.last_name || userData.email || 'Utilisateur'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {userData.email}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <FiPhone size={14} />
                  <span>{userData.phone || userData.phone_number || 'N/A'}</span>
                </div>
                {editingConsularCard === (userData.hashed_id || userData.id) ? (
                  <div className="flex items-center space-x-2 mt-2">
                    <input
                      type="text"
                      value={newConsularCardNumber}
                      onChange={(e) => setNewConsularCardNumber(e.target.value.toUpperCase())}
                      placeholder="SN1234567"
                      className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono flex-1"
                      style={{ textTransform: 'uppercase' }}
                      pattern="^SN\d{7,9}$"
                    />
                    <button
                      onClick={() => handleSaveConsularCard(userData.hashed_id || userData.id)}
                      disabled={updateConsularCard.isPending}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                      title="Enregistrer"
                    >
                      <FiSave size={14} />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={updateConsularCard.isPending}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                      title="Annuler"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 group">
                    {userData.consular_card_number ? (
                      <>
                        <span className="text-gray-500">Carte:</span>
                        <span className="font-medium font-mono">{userData.consular_card_number}</span>
                        {canModifyConsularCard && (
                          <button
                            onClick={() => handleEditConsularCard(userData.hashed_id || userData.id, userData.consular_card_number)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-primary-600 hover:bg-primary-100 rounded transition-all"
                            title="Modifier (Super Admin uniquement)"
                          >
                            <FiEdit size={12} />
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-gray-400 italic text-xs">Non renseigné</span>
                        {canModifyConsularCard && (
                          <button
                            onClick={() => handleEditConsularCard(userData.hashed_id || userData.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-primary-600 hover:bg-primary-100 rounded transition-all"
                            title="Ajouter un numéro (Super Admin uniquement)"
                          >
                            <FiEdit size={12} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Rôle:</span>
                  <span className="font-medium">{userData.role || 'CITIZEN'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiCalendar size={14} />
                  <span>{userData.appointments_count || 0} RDV</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiUsers size={14} />
                  <span>{userData.applications_count || 0} demandes</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  userData.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {userData.is_active ? 'Actif' : 'Inactif'}
                </span>
                {userData.is_staff && (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                    Staff
                  </span>
                )}
                {!userData.is_verified && (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Non vérifié
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      if (userData.is_active) {
                        deactivateUser.mutate(userData.hashed_id || userData.id)
                      } else {
                        activateUser.mutate(userData.hashed_id || userData.id)
                      }
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      userData.is_active 
                        ? 'text-red-600 hover:bg-red-100' 
                        : 'text-green-600 hover:bg-green-100'
                    }`}
                    title={userData.is_active ? 'Désactiver' : 'Activer'}
                    disabled={activateUser.isPending || deactivateUser.isPending}
                  >
                    {userData.is_active ? <FiUserX size={18} /> : <FiUserCheck size={18} />}
                  </button>
                  <button
                    onClick={() => toggleStaffRole.mutate({ 
                      hashedId: userData.hashed_id || userData.id, 
                      isStaff: !userData.is_staff 
                    })}
                    className={`p-2 rounded-lg transition-colors ${
                      userData.is_staff 
                        ? 'text-orange-600 hover:bg-orange-100' 
                        : 'text-blue-600 hover:bg-blue-100'
                    }`}
                    title={userData.is_staff ? 'Retirer le rôle staff' : 'Donner le rôle staff'}
                  >
                    <FiUsers size={18} />
                  </button>
                </div>
                <select
                  value={userData.role || 'CITIZEN'}
                  onChange={(e) => {
                    if (e.target.value !== userData.role) {
                      changeUserRole.mutate({ hashedId: userData.hashed_id || userData.id, role: e.target.value })
                    }
                  }}
                  className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  title="Changer le rôle"
                >
                  <option value="CITIZEN">Citoyen</option>
                  <option value="AGENT_RDV">Agent RDV</option>
                  <option value="AGENT_CONSULAIRE">Agent Consulaire</option>
                  <option value="VIGILE">Vigile</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPERADMIN">Super Admin</option>
                </select>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow border">
              <FiUsers className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-500">Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>

        {/* Users Table - Desktop View */}
        <div className="hidden md:block bg-white rounded-lg shadow border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Carte consulaire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((userData) => (
                  <tr key={userData.id} className="hover:bg-gray-50">
                    <td className="px-3 md:px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
                            <span className="text-white font-medium text-xs md:text-sm">
                              {(userData.first_name?.[0] || userData.email?.[0] || 'U').toUpperCase()}
                              {(userData.last_name?.[0] || '').toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-2 md:ml-4 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {userData.first_name && userData.last_name 
                              ? `${userData.first_name} ${userData.last_name}`
                              : userData.first_name || userData.last_name || userData.email || 'Utilisateur'}
                          </div>
                          <div className="text-xs md:text-sm text-gray-500 truncate">
                            ID: {userData.id} | {userData.role || 'CITIZEN'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4">
                      <div className="text-sm text-gray-900 flex items-center space-x-1">
                        <FiMail size={14} />
                        <span className="truncate">{userData.email}</span>
                      </div>
                      <div className="text-xs md:text-sm text-gray-500 flex items-center space-x-1">
                        <FiPhone size={14} />
                        <span className="truncate">{userData.phone || userData.phone_number || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4">
                      {editingConsularCard === (userData.hashed_id || userData.id) ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={newConsularCardNumber}
                            onChange={(e) => setNewConsularCardNumber(e.target.value.toUpperCase())}
                            placeholder="SN1234567"
                            className="text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                            style={{ textTransform: 'uppercase' }}
                            pattern="^SN\d{7,9}$"
                          />
                          <button
                            onClick={() => handleSaveConsularCard(userData.hashed_id || userData.id)}
                            disabled={updateConsularCard.isPending}
                            className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors"
                            title="Enregistrer"
                          >
                            <FiSave size={16} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={updateConsularCard.isPending}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="Annuler"
                          >
                            <FiX size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 group">
                          <span className="text-sm text-gray-900 font-mono">
                            {userData.consular_card_number || (
                              <span className="text-gray-400 italic">Non renseigné</span>
                            )}
                          </span>
                          {canModifyConsularCard && (
                            <button
                              onClick={() => handleEditConsularCard(userData.hashed_id || userData.id, userData.consular_card_number)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-primary-600 hover:bg-primary-100 rounded transition-all"
                              title="Modifier le numéro de carte consulaire (Super Admin uniquement)"
                            >
                              <FiEdit size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 md:px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          userData.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {userData.is_active ? 'Actif' : 'Inactif'}
                        </span>
                        {userData.is_staff && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            Staff
                          </span>
                        )}
                        {!userData.is_verified && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Non vérifié
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 text-xs md:text-sm text-gray-500">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-1">
                          <FiCalendar size={12} />
                          <span>{userData.appointments_count || 0} RDV</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FiUsers size={12} />
                          <span>{userData.applications_count || 0} demandes</span>
                        </div>
                        {userData.last_login && (
                          <div className="text-xs truncate">
                            {new Date(userData.last_login).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 text-xs md:text-sm font-medium">
                      <div className="flex flex-col md:flex-row items-start md:items-center space-y-1 md:space-y-0 md:space-x-2">
                        <button
                          onClick={() => {
                            if (userData.is_active) {
                              deactivateUser.mutate(userData.hashed_id || userData.id)
                            } else {
                              activateUser.mutate(userData.hashed_id || userData.id)
                            }
                          }}
                          disabled={activateUser.isPending || deactivateUser.isPending}
                          className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                            userData.is_active 
                              ? 'text-red-600 hover:bg-red-100' 
                              : 'text-green-600 hover:bg-green-100'
                          }`}
                          title={userData.is_active ? 'Désactiver' : 'Activer'}
                        >
                          {userData.is_active ? <FiUserX size={14} /> : <FiUserCheck size={14} />}
                        </button>
                        
                        <button
                          onClick={() => toggleStaffRole.mutate({ 
                            hashedId: userData.hashed_id || userData.id, 
                            isStaff: !userData.is_staff 
                          })}
                          className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                            userData.is_staff 
                              ? 'text-orange-600 hover:bg-orange-100' 
                              : 'text-blue-600 hover:bg-blue-100'
                          }`}
                          title={userData.is_staff ? 'Retirer le rôle staff' : 'Donner le rôle staff'}
                        >
                          <FiUsers size={14} />
                        </button>
                        
                        <select
                          value={userData.role || 'CITIZEN'}
                          onChange={(e) => {
                            if (e.target.value !== userData.role) {
                              changeUserRole.mutate({ hashedId: userData.hashed_id || userData.id, role: e.target.value })
                            }
                          }}
                          className="text-xs px-1.5 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 w-full md:w-auto"
                          title="Changer le rôle"
                        >
                          <option value="CITIZEN">Citoyen</option>
                          <option value="AGENT_RDV">Agent RDV</option>
                          <option value="AGENT_CONSULAIRE">Agent Consulaire</option>
                          <option value="VIGILE">Vigile</option>
                          <option value="ADMIN">Admin</option>
                          <option value="SUPERADMIN">Super Admin</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <FiUsers className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-500">Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>

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
