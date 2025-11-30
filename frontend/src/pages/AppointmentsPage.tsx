import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { appointmentsApi } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { FiCalendar, FiClock, FiMapPin, FiPlus } from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { debugAPI, safeArrayAccess, debugComponent } from '../utils/debugHelper'

export default function AppointmentsPage() {
  const { data: appointmentsResponse, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => {
      debugAPI.logRequest('/appointments/', 'GET');
      return appointmentsApi.list().then(res => {
        debugAPI.logResponse('/appointments/', res.status, res.data);
        return safeArrayAccess(res.data);
      }).catch(error => {
        debugAPI.logError('/appointments/', error);
        throw error;
      });
    }
  })

  const appointments = safeArrayAccess(appointmentsResponse);
  debugComponent('AppointmentsPage', { appointmentsCount: appointments.length, isLoading });

  if (isLoading) {
    return <LoadingSpinner text="Chargement..." />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Mes Rendez-vous</h1>
        {/* Masquer la création pour VIGILE */}
        {(!localStorage.getItem('embassy-auth') || (() => {
          try {
            const state = JSON.parse(localStorage.getItem('embassy-auth') as string)?.state
            const role = state?.user?.role
            return role !== 'VIGILE'
          } catch { return true }
        })()) && (
          <ProtectedFeatureLink to="/appointments/book" feature="appointments" className="btn-primary flex items-center space-x-2">
            <FiPlus />
            <span>Nouveau rendez-vous</span>
          </ProtectedFeatureLink>
        )}
      </div>

      {appointments && appointments.length > 0 ? (
        <div className="grid lg:grid-cols-2 gap-6">
          {appointments.map((appointment: any) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">Vous n'avez aucun rendez-vous</p>
          <ProtectedFeatureLink to="/appointments/book" feature="appointments" className="btn-primary inline-block">
            Prendre un rendez-vous
          </ProtectedFeatureLink>
        </div>
      )}
    </div>
  )
}

function AppointmentCard({ appointment }: any) {
  const user = useAuthStore((s) => s.user)
  const statusColors: any = {
    PENDING: 'badge-warning',
    CONFIRMED: 'badge-success',
    COMPLETED: 'badge-info',
    CANCELLED: 'badge-danger',
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold mb-1">{appointment.service_name}</h3>
          <p className="text-gray-600 text-sm">{appointment.office_name}</p>
        </div>
        <span className={`badge ${statusColors[appointment.status]}`}>
          {appointment.status_display}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-3 text-gray-700">
          <FiCalendar className="text-primary-500" />
          <span>{new Date(appointment.appointment_date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</span>
        </div>
        
        <div className="flex items-center space-x-3 text-gray-700">
          <FiClock className="text-primary-500" />
          <span>{appointment.appointment_time}</span>
        </div>
        
        <div className="flex items-center space-x-3 text-gray-700">
          <FiMapPin className="text-primary-500" />
          <span>{appointment.office_name}</span>
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center mt-2">
        Référence: {appointment.reference_number}
      </p>

      {/* Contrôles agent pour changer le statut */}
      {user && ['ADMIN','SUPERADMIN','AGENT_RDV','AGENT_CONSULAIRE'].includes(user.role) && (
        <div className="mt-4 border-t pt-4">
          <div className="flex items-center space-x-2">
            <select id={`status-${appointment.id}`} defaultValue={appointment.status} className="input">
              <option value="PENDING">En attente</option>
              <option value="CONFIRMED">Confirmé</option>
              <option value="CHECKED_IN">Enregistré</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="COMPLETED">Terminé</option>
              <option value="CANCELLED">Annulé</option>
              <option value="NO_SHOW">Absent</option>
            </select>
            <button
              onClick={async () => {
                const sel = document.getElementById(`status-${appointment.id}`) as HTMLSelectElement
                try {
                  await appointmentsApi.updateStatus(appointment.id, sel.value)
                  toast.success('Statut mis à jour. Email envoyé à l\'usager.')
                } catch (e: any) {
                  toast.error(e?.response?.data?.error || 'Erreur mise à jour')
                }
              }}
              className="btn-primary"
            >
              Appliquer
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">L'usager est notifié et devra présenter son QR au vigile.</p>
        </div>
      )}
    </div>
  )
}

