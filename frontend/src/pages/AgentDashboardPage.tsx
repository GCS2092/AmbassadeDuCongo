/**
 * Dashboard spécifique pour AGENT_RDV et AGENT_CONSULAIRE
 * Interface simplifiée et adaptée à leurs besoins
 */
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import ProtectedFeatureLink from '../components/ProtectedFeatureLink'
import { FiCalendar, FiFileText, FiUsers, FiClock, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'
import { appointmentsApi, applicationsApi } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { safeArrayAccess } from '../utils/debugHelper'
import { UserRole, getRoleDisplayName } from '../lib/permissions'

interface AgentDashboardPageProps {
  role: UserRole
}

export default function AgentDashboardPage({ role }: AgentDashboardPageProps) {
  const { user } = useAuthStore()
  const isAgentRdv = role === 'AGENT_RDV'
  const isAgentConsulaire = role === 'AGENT_CONSULAIRE'

  // Récupérer tous les rendez-vous (pour les agents)
  const { data: allAppointments, isLoading: loadingAppointments } = useQuery({
    queryKey: ['agent-appointments'],
    queryFn: () => appointmentsApi.list().then(res => safeArrayAccess(res.data)),
    refetchInterval: 30000,
  })

  // Récupérer toutes les demandes (pour AGENT_CONSULAIRE)
  const { data: allApplications, isLoading: loadingApplications } = useQuery({
    queryKey: ['agent-applications'],
    queryFn: () => applicationsApi.list().then(res => safeArrayAccess(res.data)),
    enabled: isAgentConsulaire, // Seulement pour AGENT_CONSULAIRE
    refetchInterval: 30000,
  })

  const today = new Date().toISOString().split('T')[0]
  const todayAppointments = allAppointments?.filter((apt: any) => 
    apt.appointment_date === today
  ) || []

  const pendingApplications = allApplications?.filter((app: any) => 
    ['SUBMITTED', 'UNDER_REVIEW'].includes(app.status)
  ) || []

  if (loadingAppointments || (isAgentConsulaire && loadingApplications)) {
    return <LoadingSpinner text="Chargement..." />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Bonjour, {user?.first_name || 'Agent'} ! 👋
        </h1>
        <p className="text-gray-600">
          {isAgentRdv 
            ? 'Gestion des rendez-vous consulaires' 
            : 'Gestion des demandes et rendez-vous consulaires'}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/appointments"
          className="bg-white p-6 rounded-lg shadow border hover:shadow-md transition-shadow flex items-center space-x-4"
        >
          <div className="p-3 bg-blue-100 rounded-lg">
            <FiCalendar className="text-blue-600" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Gérer les rendez-vous</h3>
            <p className="text-sm text-gray-600">Voir tous les rendez-vous</p>
          </div>
        </Link>
        
        {isAgentRdv && (
          <Link
            to="/appointments/book"
            className="bg-white p-6 rounded-lg shadow border hover:shadow-md transition-shadow flex items-center space-x-4"
          >
            <div className="p-3 bg-green-100 rounded-lg">
              <FiCalendar className="text-green-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Créer un rendez-vous</h3>
              <p className="text-sm text-gray-600">Pour un citoyen</p>
            </div>
          </Link>
        )}

        {isAgentConsulaire && (
          <Link
            to="/applications"
            className="bg-white p-6 rounded-lg shadow border hover:shadow-md transition-shadow flex items-center space-x-4"
          >
            <div className="p-3 bg-green-100 rounded-lg">
              <FiFileText className="text-green-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Gérer les demandes</h3>
              <p className="text-sm text-gray-600">Voir toutes les demandes</p>
            </div>
          </Link>
        )}

        <Link
          to="/profile"
          className="bg-white p-6 rounded-lg shadow border hover:shadow-md transition-shadow flex items-center space-x-4"
        >
          <div className="p-3 bg-purple-100 rounded-lg">
            <FiUser className="text-purple-600" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Mon profil</h3>
            <p className="text-sm text-gray-600">Paramètres</p>
          </div>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rendez-vous aujourd'hui</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {todayAppointments.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiCalendar className="text-blue-600" size={24} />
            </div>
          </div>
          <Link to="/appointments" className="text-sm text-blue-600 hover:text-blue-800 mt-4 inline-block">
            Voir tous →
          </Link>
        </div>

        {isAgentConsulaire && (
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Demandes en attente</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {pendingApplications.length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FiAlertTriangle className="text-yellow-600" size={24} />
              </div>
            </div>
            <Link to="/applications" className="text-sm text-blue-600 hover:text-blue-800 mt-4 inline-block">
              Voir toutes →
            </Link>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total rendez-vous</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {allAppointments?.length || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FiUsers className="text-green-600" size={24} />
            </div>
          </div>
          <Link to="/appointments" className="text-sm text-blue-600 hover:text-blue-800 mt-4 inline-block">
            Voir tous →
          </Link>
        </div>
      </div>

      {/* Rendez-vous d'aujourd'hui */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <FiCalendar size={20} />
              <span>Rendez-vous d'aujourd'hui</span>
            </h3>
            <Link to="/appointments" className="text-sm text-blue-600 hover:text-blue-800">
              Voir tout →
            </Link>
          </div>
        </div>
        <div className="p-6">
          {todayAppointments.length > 0 ? (
            <div className="space-y-3">
              {todayAppointments.slice(0, 5).map((appointment: any) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {appointment.user?.first_name} {appointment.user?.last_name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {appointment.service_type?.name || 'Service'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {appointment.appointment_time}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      appointment.status === 'CONFIRMED' 
                        ? 'bg-green-100 text-green-800' 
                        : appointment.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {appointment.status === 'CONFIRMED' ? 'Confirmé' : 
                       appointment.status === 'PENDING' ? 'En attente' : appointment.status}
                    </span>
                    <Link
                      to={`/appointments`}
                      className="text-blue-600 hover:text-blue-800"
                      title="Voir détails"
                    >
                      <FiEdit size={16} />
                    </Link>
                  </div>
                </div>
              ))}
              {todayAppointments.length > 5 && (
                <Link
                  to="/appointments"
                  className="block text-center text-sm text-blue-600 hover:text-blue-800 mt-2"
                >
                  Voir les {todayAppointments.length - 5} autres →
                </Link>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiCalendar className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">Aucun rendez-vous aujourd'hui</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

