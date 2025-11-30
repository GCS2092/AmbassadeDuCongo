/**
 * Quick Actions - Actions rapides contextuelles
 * Affiche les prochaines étapes recommandées
 */
import { Link } from 'react-router-dom'
import { FiCalendar, FiFileText, FiDollarSign, FiUser, FiAlertCircle } from 'react-icons/fi'

interface Action {
  icon: React.ReactNode
  title: string
  description: string
  link: string
  color: string
  priority: 'high' | 'medium' | 'low'
}

interface QuickActionsProps {
  user?: any
  upcomingAppointments?: any[]
  inProgressApplications?: any[]
}

export default function QuickActions({ 
  user, 
  upcomingAppointments = [], 
  inProgressApplications = [] 
}: QuickActionsProps) {
  const actions: Action[] = []

  // Profil incomplet
  if (user && !user.profile?.is_profile_complete) {
    actions.push({
      icon: <FiUser size={24} />,
      title: 'Complétez votre profil',
      description: 'Gagnez du temps pour vos prochaines demandes',
      link: '/profile',
      color: 'bg-orange-500',
      priority: 'high',
    })
  }

  // Aucun rendez-vous
  if (upcomingAppointments.length === 0) {
    actions.push({
      icon: <FiCalendar size={24} />,
      title: 'Prenez rendez-vous',
      description: 'Réservez votre créneau en ligne',
      link: '/appointments/book',
      color: 'bg-blue-500',
      priority: 'medium',
    })
  }

  // Paiement en attente
  const paymentPending = inProgressApplications.find(
    (app: any) => app.status === 'PAYMENT_PENDING'
  )
  if (paymentPending) {
    actions.push({
      icon: <FiDollarSign size={24} />,
      title: 'Paiement en attente',
      description: `Demande ${paymentPending.reference_number}`,
      link: `/applications/${paymentPending.id}`,
      color: 'bg-red-500',
      priority: 'high',
    })
  }

  // Document prêt
  const readyApp = inProgressApplications.find(
    (app: any) => app.status === 'READY'
  )
  if (readyApp) {
    actions.push({
      icon: <FiAlertCircle size={24} />,
      title: 'Document prêt !',
      description: 'Venez récupérer votre document',
      link: `/applications/${readyApp.id}`,
      color: 'bg-green-500',
      priority: 'high',
    })
  }

  // Aucune demande en cours
  if (inProgressApplications.length === 0) {
    actions.push({
      icon: <FiFileText size={24} />,
      title: 'Nouvelle demande',
      description: 'Visa, passeport, légalisation...',
      link: '/applications/new',
      color: 'bg-purple-500',
      priority: 'low',
    })
  }

  // Trier par priorité
  const sortedActions = actions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  if (sortedActions.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Actions recommandées</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {sortedActions.slice(0, 4).map((action, index) => (
          <Link
            key={index}
            to={action.link}
            className="card hover:shadow-lg transition flex items-start space-x-4"
          >
            <div className={`${action.color} text-white p-3 rounded-lg flex-shrink-0`}>
              {action.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold mb-1 flex items-center">
                {action.title}
                {action.priority === 'high' && (
                  <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                    Urgent
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

