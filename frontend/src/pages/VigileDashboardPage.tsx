import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { 
  FiShield, FiUsers, FiClock, FiAlertTriangle, FiCheckCircle, 
  FiCalendar, FiUser, FiMapPin, FiActivity, FiRefreshCw, FiSettings
} from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'
import LoadingSpinner from '../components/LoadingSpinner'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { appointmentsApi } from '../lib/api'

export default function VigileDashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('today')
  const { user } = useAuthStore()
  const navigate = useNavigate()

  // Vérifier les permissions vigile
  React.useEffect(() => {
    if (!user || user.role !== 'VIGILE') {
      toast.error('Accès non autorisé. Rôle de vigile requis.')
      navigate('/dashboard')
    }
  }, [user, navigate])

  // Récupérer les données pour le vigile depuis les APIs existantes
  const { data: vigileStats, isLoading } = useQuery({
    queryKey: ['vigile-stats', selectedPeriod],
    queryFn: async () => {
      try {
        // Récupérer les données depuis les APIs existantes
        const appointmentsRes = await appointmentsApi.list()
        const appointments = Array.isArray(appointmentsRes.data) ? appointmentsRes.data : appointmentsRes.data?.results || []
        
        const today = new Date().toDateString()
        const thisWeekStart = new Date()
        thisWeekStart.setDate(thisWeekStart.getDate() - 7)
        
        return {
          today_access: {
            total_appointments: appointments.filter((apt: any) => 
              new Date(apt.appointment_date).toDateString() === today
            ).length,
            total_visitors: appointments.filter((apt: any) => 
              new Date(apt.appointment_date).toDateString() === today
            ).map((apt: any) => apt.user?.id).filter((id, index, arr) => arr.indexOf(id) === index).length,
            pending_appointments: appointments.filter((apt: any) => 
              new Date(apt.appointment_date).toDateString() === today && apt.status === 'PENDING'
            ).length,
          },
          this_week: {
            total_appointments: appointments.filter((apt: any) => 
              new Date(apt.appointment_date) >= thisWeekStart
            ).length,
            total_visitors: appointments.filter((apt: any) => 
              new Date(apt.appointment_date) >= thisWeekStart
            ).map((apt: any) => apt.user?.id).filter((id, index, arr) => arr.indexOf(id) === index).length,
          },
          recent_appointments: appointments.filter((apt: any) => 
            new Date(apt.appointment_date).toDateString() === today
          ).sort((a: any, b: any) => new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime()).slice(0, 10)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques de sécurité:', error)
        throw error
      }
    }
  })

  if (!user || user.role !== 'VIGILE') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <FiShield className="mx-auto mb-4 text-red-500" size={64} />
          <h2 className="text-2xl font-bold mb-4">Accès non autorisé</h2>
          <p className="text-gray-600 mb-6">Vous devez avoir le rôle de vigile pour accéder à cette page.</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Retour au tableau de bord
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <LoadingSpinner text="Chargement des données de sécurité..." />
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center space-x-3">
                <FiShield className="text-blue-500" size={32} />
                <span>Dashboard Vigile</span>
              </h1>
              <p className="text-gray-600">Surveillance et contrôle d'accès</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 flex items-center space-x-2"
              >
                <FiRefreshCw size={16} />
                <span>Actualiser</span>
              </button>
            </div>
          </div>
        </div>

        {/* Actions Rapides - Simplifié */}
        <div className="bg-white rounded-lg shadow border p-4 md:p-6 mb-6 md:mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <FiShield size={20} />
            <span>Actions Rapides</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/security/scanner"
              className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
            >
              <FiShield size={20} />
              <span>Scanner QR Code</span>
            </Link>
            <Link
              to="/security/today"
              className="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
            >
              <FiActivity size={20} />
              <span>Scans du Jour</span>
            </Link>
          </div>
        </div>

        {/* Stats Cards - Simplifié à 2 cartes principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiCalendar className="text-blue-600" size={24} />
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-sm font-medium text-gray-600">Rendez-vous aujourd'hui</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  {vigileStats?.today_access?.total_appointments || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FiAlertTriangle className="text-yellow-600" size={24} />
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-sm font-medium text-gray-600">En attente de vérification</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  {vigileStats?.today_access?.pending_appointments || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rendez-vous d'aujourd'hui - Simplifié */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 md:p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <FiCalendar size={20} />
                <span>Rendez-vous d'aujourd'hui</span>
              </h3>
              <Link
                to="/security/today"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Voir tout →
              </Link>
            </div>
          </div>
          <div className="p-4 md:p-6">
            {vigileStats?.recent_appointments && vigileStats.recent_appointments.length > 0 ? (
              <div className="space-y-3">
                {vigileStats.recent_appointments.slice(0, 5).map((appointment: any) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {appointment.user?.first_name} {appointment.user?.last_name}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {appointment.service_type?.name || 'Service'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {appointment.appointment_time}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ml-2 ${
                      appointment.status === 'CONFIRMED' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {appointment.status === 'CONFIRMED' ? 'Confirmé' : 'En attente'}
                    </span>
                  </div>
                ))}
                {vigileStats.recent_appointments.length > 5 && (
                  <Link
                    to="/security/today"
                    className="block text-center text-sm text-blue-600 hover:text-blue-800 mt-2"
                  >
                    Voir les {vigileStats.recent_appointments.length - 5} autres →
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
    </div>
  )
}