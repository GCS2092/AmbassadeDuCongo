/**
 * Page des rappels de documents qui expirent
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiAlertTriangle, FiClock, FiCalendar, FiCheckCircle, FiX } from 'react-icons/fi'
import { authApi } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

interface DocumentReminder {
  id?: string
  type: string
  document: string
  expiry_date: string
  days_remaining: number
  message: string
  priority: 'URGENT' | 'HIGH' | 'MEDIUM'
  action_required: string
  status?: string
  email_sent?: boolean
}

interface RemindersResponse {
  reminders: DocumentReminder[]
  total_count: number
  urgent_count: number
}

export default function DocumentRemindersPage() {
  const queryClient = useQueryClient()
  
  const { data: remindersData, isLoading, error } = useQuery<RemindersResponse>({
    queryKey: ['document-reminders'],
    queryFn: () => authApi.getDocumentReminders().then(res => ({
      ...res.data,
      reminders: Array.isArray(res.data?.reminders) ? res.data.reminders : []
    }))
  })

  // Mutation pour mettre à jour le statut d'un rappel
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) =>
      authApi.updateReminderStatus(id, status),
    onSuccess: () => {
      toast.success('Statut mis à jour avec succès')
      queryClient.invalidateQueries({ queryKey: ['document-reminders'] })
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du statut')
    }
  })

  const handleUpdateStatus = (reminderId: string, status: string) => {
    updateStatusMutation.mutate({ id: reminderId, status })
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <FiAlertTriangle className="text-red-500" />
      case 'HIGH':
        return <FiClock className="text-orange-500" />
      case 'MEDIUM':
        return <FiCalendar className="text-yellow-500" />
      default:
        return <FiCheckCircle className="text-green-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'border-l-red-500 bg-red-50'
      case 'HIGH':
        return 'border-l-orange-500 bg-orange-50'
      case 'MEDIUM':
        return 'border-l-yellow-500 bg-yellow-50'
      default:
        return 'border-l-green-500 bg-green-50'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'URGENT'
      case 'HIGH':
        return 'IMPORTANT'
      case 'MEDIUM':
        return 'RAPPEL'
      default:
        return 'INFO'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-2">Erreur lors du chargement</div>
        <div className="text-gray-600">Impossible de récupérer les rappels de documents</div>
      </div>
    )
  }

  const reminders = remindersData?.reminders || []

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📅 Rappels de Documents</h1>
        <p className="text-gray-600">
          Surveillez l'expiration de vos documents officiels
        </p>
      </div>

      {reminders.length === 0 ? (
        <div className="text-center py-12">
          <FiCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Aucun rappel</h2>
          <p className="text-gray-600">
            Tous vos documents sont à jour ! 🎉
          </p>
        </div>
      ) : (
        <>
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <FiAlertTriangle className="text-red-500 text-2xl mr-3" />
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {remindersData?.urgent_count || 0}
                  </div>
                  <div className="text-gray-600">Urgents</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <FiClock className="text-orange-500 text-2xl mr-3" />
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {reminders.filter(r => r.priority === 'HIGH').length}
                  </div>
                  <div className="text-gray-600">Importants</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <FiCalendar className="text-yellow-500 text-2xl mr-3" />
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {reminders.filter(r => r.priority === 'MEDIUM').length}
                  </div>
                  <div className="text-gray-600">Rappels</div>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des rappels */}
          <div className="space-y-4">
            {reminders.map((reminder, index) => (
              <div
                key={index}
                className={`bg-white rounded-lg shadow border-l-4 ${getPriorityColor(reminder.priority)} p-6`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="text-2xl">
                      {getPriorityIcon(reminder.priority)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {reminder.document}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          reminder.priority === 'URGENT' 
                            ? 'bg-red-100 text-red-800'
                            : reminder.priority === 'HIGH'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {getPriorityLabel(reminder.priority)}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-2">
                        {reminder.message}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <FiCalendar className="mr-1" />
                          Expire le: {new Date(reminder.expiry_date).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="flex items-center">
                          <FiClock className="mr-1" />
                          {reminder.days_remaining > 0 
                            ? `${reminder.days_remaining} jours restants`
                            : 'Expiré'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-white rounded-lg border">
                  <div className="flex flex-col space-y-3">
                    <div>
                      <div className="font-medium text-gray-900">
                        Action requise
                      </div>
                      <div className="text-gray-600">
                        {reminder.action_required}
                      </div>
                    </div>
                    
                    {/* Boutons de gestion du statut */}
                    {reminder.status && reminder.status !== 'COMPLETED' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUpdateStatus(reminder.id || reminder.type, 'COMPLETED')}
                          className="btn-primary flex-1 flex items-center justify-center space-x-2"
                          disabled={updateStatusMutation.isPending}
                        >
                          <FiCheckCircle className="w-4 h-4" />
                          <span>Marquer comme traité</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(reminder.id || reminder.type, 'IGNORED')}
                          className="btn-secondary flex items-center justify-center space-x-2"
                          disabled={updateStatusMutation.isPending}
                        >
                          <FiX className="w-4 h-4" />
                          <span>Ignorer</span>
                        </button>
                      </div>
                    )}
                    
                    {/* Statut affiché */}
                    {reminder.status === 'COMPLETED' && (
                      <div className="flex items-center space-x-2 text-green-600">
                        <FiCheckCircle className="w-5 h-5" />
                        <span className="font-medium">Traité</span>
                      </div>
                    )}
                    
                    {/* Bouton pour prendre rendez-vous */}
                    <button className="btn-primary w-full">
                      Prendre rendez-vous pour renouveler
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Conseils */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">💡 Conseils pratiques</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• Renouvelez vos documents 2-3 mois avant l'expiration</li>
              <li>• Gardez toujours une copie de vos documents importants</li>
              <li>• Vérifiez régulièrement vos dates d'expiration</li>
              <li>• Contactez l'ambassade en cas de perte ou vol de documents</li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
