import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { api } from '../lib/api'

export default function VigileTodayPage() {
  const user = useAuthStore(s => s.user)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user || !['VIGILE', 'ADMIN', 'SUPERADMIN'].includes(user.role)) {
      toast.error('Accès non autorisé')
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['vigile-today-scans'],
    queryFn: async () => {
      const res = await api.get('/appointments/slots/today_scans/')
      return res.data
    }
  })

  if (!user) return <LoadingSpinner text="Chargement..." />
  if (isLoading) return <LoadingSpinner text="Chargement des scans du jour..." />
  if (isError) {
    return <div className="container mx-auto px-4 py-8">Erreur de chargement</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Scans du jour</h1>
      </div>

      {Array.isArray(data) && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((item: any, idx: number) => (
            <div key={idx} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm text-gray-500">Réf: {item.reference_number}</p>
                  <p className="text-xs text-gray-400">Scanné à {new Date(item.scanned_at).toLocaleTimeString('fr-FR')}</p>
                </div>
                <span className="badge badge-info">{item.status_after}</span>
              </div>
              <div className="grid md:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="font-medium">Usager</p>
                  <p>{item.appointment.user_name}</p>
                  <p className="text-gray-500">{item.appointment.user_email}</p>
                </div>
                <div>
                  <p className="font-medium">Rendez-vous</p>
                  <p>{item.appointment.service_name}</p>
                  <p className="text-gray-500">{item.appointment.appointment_date} {item.appointment.appointment_time}</p>
                </div>
                <div>
                  <p className="font-medium">Bureau</p>
                  <p>{item.appointment.office_name}</p>
                  <p className="text-gray-500">Par: {item.scanned_by || 'N/A'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-6 text-center">Aucun scan enregistré aujourd'hui.</div>
      )}
    </div>
  )
}
