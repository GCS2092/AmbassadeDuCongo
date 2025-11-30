import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FiShield, FiUser, FiClock, FiMapPin, FiCheckCircle, FiAlertTriangle, FiDownload, FiSearch, FiFilter } from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { api } from '../lib/api'
import Pagination from '../components/Pagination'

export default function AdminAccessLogPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const { user } = useAuthStore()

  // Récupérer le journal d'accès avec pagination
  const { data: accessLogsResponse, isLoading } = useQuery({
    queryKey: ['admin-access-logs', currentPage],
    queryFn: async () => {
      try {
        // Appeler l'API des logs d'audit avec pagination
        const response = await api.get(`/core/audit-logs/?page=${currentPage}`)
        // Gérer la structure de réponse paginée
        if (response.data && response.data.results) {
          return response.data
        } else if (Array.isArray(response.data)) {
          return { results: response.data, count: response.data.length, next: null, previous: null }
        }
        return { results: [], count: 0, next: null, previous: null }
      } catch (error) {
        console.error('Erreur lors de la récupération des logs d\'accès:', error)
        return { results: [], count: 0, next: null, previous: null }
      }
    }
  })

  const accessLogs = accessLogsResponse?.results || []
  const totalCount = accessLogsResponse?.count || 0
  const totalPages = Math.ceil(totalCount / 20) || 1

  // Réinitialiser à la page 1 quand les filtres changent
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterStatus])

  // Filtrer les logs (filtrage côté client pour la page actuelle)
  const filteredLogs = accessLogs?.filter(log => {
    const userName = log.user_name || log.user_email || ''
    const userEmail = log.user_email || ''
    const description = log.description || ''
    
    const matchesSearch = 
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      description.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Pour les logs d'audit, on peut filtrer par action au lieu de status
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'allowed' && log.action === 'LOGIN') ||
      (filterStatus === 'denied' && log.action === 'REJECT')
    
    return matchesSearch && matchesFilter
  }) || []

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <FiShield className="mx-auto mb-4 text-red-500" size={64} />
          <h2 className="text-2xl font-bold mb-4">Accès non autorisé</h2>
          <p className="text-gray-600">Vous devez avoir les privilèges administrateur.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <LoadingSpinner text="Chargement du journal d'accès..." />
  }

  const allowedCount = accessLogs?.filter(log => log.action === 'LOGIN').length || 0
  const deniedCount = accessLogs?.filter(log => log.action === 'REJECT').length || 0
  const todayCount = accessLogs?.filter(log => {
    if (!log.timestamp) return false
    const logDate = new Date(log.timestamp)
    const today = new Date()
    return logDate.toDateString() === today.toDateString()
  }).length || 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center space-x-3">
            <FiShield className="text-blue-500" size={32} />
            <span>Journal d'Accès Sécurité</span>
          </h1>
          <p className="text-gray-600">
            Historique complet des accès et tentatives d'accès à l'ambassade
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
                  placeholder="Rechercher dans le journal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            <div className="md:w-64">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input"
              >
                <option value="all">Tous les accès</option>
                <option value="allowed">Accès autorisés</option>
                <option value="denied">Accès refusés</option>
              </select>
            </div>
            <button
              onClick={() => toast.success('Export en cours...')}
              className="btn-secondary flex items-center space-x-2"
            >
              <FiDownload size={16} />
              <span>Exporter</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiShield className="text-blue-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total aujourd'hui</p>
                <p className="text-2xl font-bold text-gray-900">{todayCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiCheckCircle className="text-green-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Autorisés</p>
                <p className="text-2xl font-bold text-gray-900">{allowedCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <FiAlertTriangle className="text-red-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Refusés</p>
                <p className="text-2xl font-bold text-gray-900">{deniedCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FiClock className="text-purple-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Taux de réussite</p>
                <p className="text-2xl font-bold text-gray-900">
                  {accessLogs?.length > 0 ? Math.round((allowedCount / accessLogs.length) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Access Logs Table - Mobile View */}
        <div className="md:hidden space-y-4">
          {filteredLogs.map((log) => (
            <div key={log.id} className="bg-white rounded-lg shadow border p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                    log.action === 'LOGIN' || log.action === 'VIEW' ? 'bg-green-500' : 
                    log.action === 'REJECT' || log.action === 'DELETE' ? 'bg-red-500' : 'bg-blue-500'
                  }`}>
                    <FiUser className="text-white" size={20} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {log.user_name || log.user_email || 'Utilisateur anonyme'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {log.user_email || 'Email non disponible'}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  log.action === 'LOGIN' || log.action === 'VIEW' || log.action === 'CREATE'
                    ? 'bg-green-100 text-green-800' 
                    : log.action === 'REJECT' || log.action === 'DELETE'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {log.action_display || log.action}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Description:</span>
                  <p className="text-gray-900">{log.description || 'Aucune description'}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <FiClock size={14} />
                  <span>{log.timestamp ? new Date(log.timestamp).toLocaleString('fr-FR') : 'N/A'}</span>
                </div>
                <div className="text-xs text-gray-400">
                  IP: {log.ip_address || 'N/A'}
                </div>
              </div>
            </div>
          ))}
          {filteredLogs.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow border">
              <FiShield className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-500">Aucun log d'accès trouvé</p>
            </div>
          )}
        </div>

        {/* Access Logs Table - Desktop View */}
        <div className="hidden md:block bg-white rounded-lg shadow border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Description
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Détails
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-3 md:px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10">
                          <div className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center ${
                            log.action === 'LOGIN' || log.action === 'VIEW' ? 'bg-green-500' : 
                            log.action === 'REJECT' || log.action === 'DELETE' ? 'bg-red-500' : 'bg-blue-500'
                          }`}>
                            <FiUser className="text-white" size={16} />
                          </div>
                        </div>
                        <div className="ml-2 md:ml-4 min-w-0">
                          <div className="text-xs md:text-sm font-medium text-gray-900 truncate">
                            {log.user_name || log.user_email || 'Utilisateur anonyme'}
                          </div>
                          <div className="text-xs text-gray-500 truncate hidden md:block">
                            {log.user_email || 'Email non disponible'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 hidden lg:table-cell">
                      <div className="text-xs md:text-sm text-gray-900 truncate max-w-xs">
                        {log.description || 'Aucune description'}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        log.action === 'LOGIN' || log.action === 'VIEW' || log.action === 'CREATE'
                          ? 'bg-green-100 text-green-800' 
                          : log.action === 'REJECT' || log.action === 'DELETE'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {log.action_display || log.action}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-4 hidden lg:table-cell">
                      <div className="text-xs text-gray-400">
                        IP: {log.ip_address || 'N/A'}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 text-xs md:text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <FiClock size={12} />
                        <span className="truncate">{log.timestamp ? new Date(log.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <FiShield className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-500">Aucun log d'accès trouvé</p>
            </div>
          )}
        </div>

        {/* Security Alerts */}
        {deniedCount > 0 && (
          <div className="mt-8 bg-red-50 p-6 rounded-lg border border-red-200">
            <div className="flex items-center space-x-2 mb-4">
              <FiAlertTriangle className="text-red-500" size={20} />
              <h3 className="text-lg font-semibold text-red-800">Alertes de Sécurité</h3>
            </div>
            <div className="text-sm text-red-700 space-y-2">
              <p>• {deniedCount} tentative(s) d'accès refusée(s) détectée(s)</p>
              <p>• Vérifiez les logs pour identifier les menaces potentielles</p>
              <p>• Considérez renforcer les mesures de sécurité si nécessaire</p>
            </div>
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
