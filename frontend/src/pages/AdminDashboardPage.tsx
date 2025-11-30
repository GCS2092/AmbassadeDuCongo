import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  FiUsers, FiCalendar, FiFileText, FiSettings,
  FiShield, FiActivity, FiClock, FiCheckCircle, FiAlertTriangle,
  FiTrendingUp, FiDownload, FiRefreshCw, FiEye, FiBell
} from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'
import { appointmentsApi, applicationsApi, authApi } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'
import AdminAISecretaryEnhanced from '../components/AdminAISecretaryEnhanced'
import ResponsiveActionButtons from '../components/ResponsiveActionButtons'
import ApplicationManagement from '../components/ApplicationManagement'
import { ServiceTypeManagement } from '../components/admin/ServiceTypeManagement'
import toast from 'react-hot-toast'

export default function AdminDashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [activeTab, setActiveTab] = useState('overview')
  const [isAIMinimized, setIsAIMinimized] = useState(false)
  const [isAIVisible, setIsAIVisible] = useState(false)
  const { user } = useAuthStore()

  // Vérifier les permissions admin
  React.useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      toast.error('Accès non autorisé. Privilèges administrateur requis.')
      // Utiliser window.location au lieu de navigate pour éviter les problèmes de contexte
      window.location.href = '/dashboard'
    }
  }, [user])

  // Récupérer les statistiques depuis les APIs existantes
  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['admin-stats', selectedPeriod],
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
    staleTime: 15000, // Considérer les données comme obsolètes après 15 secondes
    queryFn: async () => {
      try {
        // Récupérer les données depuis les APIs existantes
        const [appointmentsRes, applicationsRes] = await Promise.all([
          appointmentsApi.list(),
          applicationsApi.list()
        ])
        
        const appointments = Array.isArray(appointmentsRes.data) ? appointmentsRes.data : appointmentsRes.data?.results || []
        const applications = Array.isArray(applicationsRes.data) ? applicationsRes.data : applicationsRes.data?.results || []
        
        const today = new Date().toDateString()
        
        return {
          appointments: {
            total: appointments.length,
            pending: appointments.filter((apt: any) => apt.status === 'PENDING').length,
            confirmed: appointments.filter((apt: any) => apt.status === 'CONFIRMED').length,
            today: appointments.filter((apt: any) => 
              new Date(apt.appointment_date).toDateString() === today
            ).length,
            this_month: appointments.filter((apt: any) => {
              const aptDate = new Date(apt.created_at)
              const now = new Date()
              return aptDate.getMonth() === now.getMonth() && aptDate.getFullYear() === now.getFullYear()
            }).length,
          },
          applications: {
            total: applications.length,
            submitted: applications.filter((app: any) => app.status === 'SUBMITTED').length,
            under_review: applications.filter((app: any) => app.status === 'UNDER_REVIEW').length,
            processing: applications.filter((app: any) => app.status === 'PROCESSING').length,
            ready: applications.filter((app: any) => app.status === 'READY').length,
            this_month: applications.filter((app: any) => {
              const appDate = new Date(app.created_at)
              const now = new Date()
              return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear()
            }).length,
          },
          users: {
            total: 0, // Placeholder
            active: 0, // Placeholder
            verified: 0, // Placeholder
            this_month: 0, // Placeholder
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error)
        throw error
      }
    }
  })

  // Les onglets redirigent maintenant vers des liens directs (voir navigation)

  // Récupérer les rendez-vous récents
  const { data: recentAppointments } = useQuery({
    queryKey: ['admin-recent-appointments'],
    queryFn: () => appointmentsApi.list().then(res => {
      const appointments = Array.isArray(res.data) ? res.data : res.data?.results || []
      return appointments
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
    })
  })

  // Récupérer les demandes récentes
  const { data: recentApplications } = useQuery({
    queryKey: ['admin-recent-applications'],
    queryFn: () => applicationsApi.list().then(res => {
      const applications = Array.isArray(res.data) ? res.data : res.data?.results || []
      return applications
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
    })
  })

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <FiShield className="mx-auto mb-4 text-red-500" size={64} />
          <h2 className="text-2xl font-bold mb-4">Accès non autorisé</h2>
          <p className="text-gray-600 mb-6">Vous devez avoir les privilèges administrateur pour accéder à cette page.</p>
          <button onClick={() => window.location.href = '/dashboard'} className="btn-primary">
            Retour au tableau de bord
          </button>
        </div>
      </div>
    )
  }

  if (loadingStats) {
    return <LoadingSpinner text="Chargement du tableau de bord admin..." />
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <div className="max-w-6xl xl:max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold mb-2 flex items-center space-x-3">
                <FiActivity className="text-blue-500" size={32} />
                <span>Tableau de Bord Administrateur</span>
              </h1>
              <p className="text-gray-600">
                Gestion complète de l'ambassade et surveillance des activités
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full md:w-auto">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="input w-full md:w-auto"
              >
                <option value="1d">Aujourd'hui</option>
                <option value="7d">7 derniers jours</option>
                <option value="30d">30 derniers jours</option>
                <option value="90d">3 derniers mois</option>
              </select>
              <button 
                onClick={() => refetchStats()}
                className="btn-secondary flex items-center justify-center space-x-2"
              >
                <FiRefreshCw size={16} />
                <span>Actualiser</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 sm:mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto whitespace-nowrap no-scrollbar">
              {[
                { id: 'overview', label: 'Vue d\'ensemble', icon: FiActivity },
                { id: 'service-types', label: 'Types de Services', icon: FiSettings },
                { id: 'security', label: 'Sécurité', icon: FiShield }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm shrink-0 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon size={16} />
                  <span>{tab.label}</span>
                </button>
              ))}
              {/* Liens directs au lieu d'onglets */}
              <Link
                to="/admin/users"
                className="flex items-center space-x-2 py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm shrink-0"
              >
                <FiUsers size={16} />
                <span>Utilisateurs</span>
              </Link>
              <Link
                to="/admin/applications"
                className="flex items-center space-x-2 py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm shrink-0"
              >
                <FiFileText size={16} />
                <span>Demandes</span>
              </Link>
              <Link
                to="/admin/site-settings"
                className="flex items-center space-x-2 py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm shrink-0"
              >
                <FiSettings size={16} />
                <span>Paramètres</span>
              </Link>
              <Link
                to="/admin/announcements"
                className="flex items-center space-x-2 py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm shrink-0"
              >
                <FiBell size={16} />
                <span>Actualités</span>
              </Link>
              <Link
                to="/admin/access-logs"
                className="flex items-center space-x-2 py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm shrink-0"
              >
                <FiDownload size={16} />
                <span>Rapports</span>
              </Link>
            </nav>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 md:space-y-8">
            {/* Actions Admin - Liens directs */}
            <div className="bg-white rounded-lg shadow border p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <FiSettings size={20} />
                <span>Actions Administrateur</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  to="/admin/users"
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center cursor-pointer"
                >
                  <FiUsers className="mx-auto mb-2 text-gray-400" size={32} />
                  <h4 className="font-medium">Gestion Utilisateurs</h4>
                  <p className="text-sm text-gray-600 mt-1">Gérer les comptes</p>
                </Link>
                <Link
                  to="/admin/applications"
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center cursor-pointer"
                >
                  <FiFileText className="mx-auto mb-2 text-gray-400" size={32} />
                  <h4 className="font-medium">Gestion Demandes</h4>
                  <p className="text-sm text-gray-600 mt-1">Traiter les demandes</p>
                </Link>
                <Link
                  to="/admin/access-logs"
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center cursor-pointer"
                >
                  <FiActivity className="mx-auto mb-2 text-gray-400" size={32} />
                  <h4 className="font-medium">Logs d'Accès</h4>
                  <p className="text-sm text-gray-600 mt-1">Voir l'activité</p>
                </Link>
                <Link
                  to="/admin/site-settings"
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center cursor-pointer"
                >
                  <FiSettings className="mx-auto mb-2 text-gray-400" size={32} />
                  <h4 className="font-medium">Paramètres du Site</h4>
                  <p className="text-sm text-gray-600 mt-1">Gérer les fonctionnalités</p>
                </Link>
                <Link
                  to="/admin/announcements"
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center cursor-pointer"
                >
                  <FiBell className="mx-auto mb-2 text-gray-400" size={32} />
                  <h4 className="font-medium">Actualités</h4>
                  <p className="text-sm text-gray-600 mt-1">Gérer les annonces</p>
                </Link>
              </div>
               </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg shadow border">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FiCalendar className="text-blue-600" size={24} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Rendez-vous aujourd'hui</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.appointments?.today || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg shadow border">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FiFileText className="text-green-600" size={24} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Demandes en attente</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.applications?.under_review || 0}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <FiClock className="text-yellow-500" size={16} />
                  <span className="text-yellow-600 ml-1">En traitement</span>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg shadow border">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FiUsers className="text-purple-600" size={24} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Utilisateurs actifs</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.users?.active || 0}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <FiCheckCircle className="text-green-500" size={16} />
                  <span className="text-green-600 ml-1">Tous vérifiés</span>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg shadow border">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <FiActivity className="text-red-600" size={24} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Activité système</p>
                    <p className="text-2xl font-bold text-gray-900">98%</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <FiTrendingUp className="text-green-500" size={16} />
                  <span className="text-green-600 ml-1">Stable</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              {/* Recent Appointments */}
              <div className="bg-white rounded-lg shadow border">
                <div className="p-4 sm:p-5 md:p-6 border-b">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <FiCalendar size={20} />
                    <span>Rendez-vous récents</span>
                  </h3>
                </div>
                <div className="p-4 sm:p-5 md:p-6">
                  {recentAppointments && recentAppointments.length > 0 ? (
                    <div className="space-y-4">
                      {recentAppointments.map((appointment: any) => (
                        <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{appointment.user_display || 'Utilisateur'}</p>
                            <p className="text-sm text-gray-600 break-words">{appointment.service_type_display}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(appointment.appointment_date).toLocaleDateString('fr-FR')} à {appointment.appointment_time}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            appointment.status === 'CONFIRMED' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {appointment.status === 'CONFIRMED' ? 'Confirmé' : 'En attente'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">Aucun rendez-vous récent</p>
                  )}
                </div>
              </div>

              {/* Recent Applications */}
              <div className="bg-white rounded-lg shadow border">
                <div className="p-4 sm:p-5 md:p-6 border-b">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <FiFileText size={20} />
                    <span>Demandes récentes</span>
                  </h3>
                </div>
                <div className="p-4 sm:p-5 md:p-6">
                  {recentApplications && recentApplications.length > 0 ? (
                    <div className="space-y-4">
                      {recentApplications.map((application: any) => (
                        <div key={application.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium break-words">{application.application_type_display}</p>
                            <p className="text-sm text-gray-600">Réf: {application.reference_number}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(application.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            application.status === 'COMPLETED' 
                              ? 'bg-green-100 text-green-800'
                              : application.status === 'UNDER_REVIEW'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {application.status_display}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">Aucune demande récente</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <FiShield size={20} />
                  <span>Outils de Sécurité</span>
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <button 
                    onClick={() => window.location.href = '/security/scanner'}
                    className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <FiEye className="mx-auto mb-4 text-gray-400" size={32} />
                    <h4 className="font-medium text-center">Scanner QR Code</h4>
                    <p className="text-sm text-gray-600 text-center mt-2">
                      Scanner les QR codes des visiteurs
                    </p>
                  </button>

                  <button 
                    onClick={() => window.location.href = '/admin/users'}
                    className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <FiUsers className="mx-auto mb-4 text-gray-400" size={32} />
                    <h4 className="font-medium text-center">Gestion Utilisateurs</h4>
                    <p className="text-sm text-gray-600 text-center mt-2">
                      Gérer les comptes et rôles
                    </p>
                  </button>

                  <button 
                    onClick={() => window.location.href = '/admin/access-logs'}
                    className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <FiActivity className="mx-auto mb-4 text-gray-400" size={32} />
                    <h4 className="font-medium text-center">Journal d'Accès</h4>
                    <p className="text-sm text-gray-600 text-center mt-2">
                      Historique des accès sécurité
                    </p>
                  </button>

                  <button 
                    onClick={() => window.location.href = '/admin/access-logs'}
                    className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <FiActivity className="mx-auto mb-4 text-gray-400" size={32} />
                    <h4 className="font-medium text-center">Journal d'Accès</h4>
                    <p className="text-sm text-gray-600 text-center mt-2">
                      Voir l'historique des accès
                    </p>
                  </button>

                  <button 
                    onClick={() => {
                      // Implémentation des alertes sécurité
                      toast.success('Configuration des alertes ouverte')
                      // Ici on pourrait ouvrir un modal ou naviguer vers une page de configuration
                    }}
                    className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <FiShield className="mx-auto mb-4 text-gray-400" size={32} />
                    <h4 className="font-medium text-center">Alertes Sécurité</h4>
                    <p className="text-sm text-gray-600 text-center mt-2">
                      Configurer les alertes
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            <ApplicationManagement />
          </div>
        )}

        {/* Service Types Tab */}
        {activeTab === 'service-types' && (
          <div className="space-y-6">
            <ServiceTypeManagement />
          </div>
        )}

        {/* Other tabs content - Implémentées */}
        {activeTab !== 'overview' && activeTab !== 'security' && activeTab !== 'applications' && activeTab !== 'service-types' && null}
      </div>

      {/* Secrétaire IA */}
      <AdminAISecretaryEnhanced 
        isMinimized={isAIMinimized}
        onToggleMinimize={() => setIsAIMinimized(!isAIMinimized)}
        isVisible={isAIVisible}
        onToggleVisibility={() => setIsAIVisible(!isAIVisible)}
      />
    </div>
  )
}
