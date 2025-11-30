/**
 * Status Timeline - Visualisation du statut d'une demande
 * Aide l'utilisateur à comprendre où en est son dossier
 */
import { FiCheck, FiClock, FiX } from 'react-icons/fi'

interface Step {
  label: string
  status: 'completed' | 'current' | 'pending' | 'failed'
  date?: string
}

interface StatusTimelineProps {
  currentStatus: string
  submittedAt?: string
  completedAt?: string
}

const APPLICATION_STEPS = {
  DRAFT: 0,
  SUBMITTED: 1,
  UNDER_REVIEW: 2,
  PAYMENT_PENDING: 3,
  PAYMENT_RECEIVED: 4,
  PROCESSING: 5,
  READY: 6,
  COMPLETED: 7,
  REJECTED: -1,
  CANCELLED: -1,
}

export default function StatusTimeline({ currentStatus, submittedAt, completedAt }: StatusTimelineProps) {
  const currentStepIndex = APPLICATION_STEPS[currentStatus as keyof typeof APPLICATION_STEPS] || 0
  const isFailed = ['REJECTED', 'CANCELLED'].includes(currentStatus)

  const steps: Step[] = [
    {
      label: 'Soumise',
      status: currentStepIndex >= 1 ? 'completed' : 'pending',
      date: submittedAt,
    },
    {
      label: 'En révision',
      status: isFailed ? 'failed' : currentStepIndex >= 2 ? 'completed' : currentStepIndex === 2 ? 'current' : 'pending',
    },
    {
      label: 'Paiement',
      status: isFailed ? 'failed' : currentStepIndex >= 4 ? 'completed' : currentStepIndex === 3 ? 'current' : 'pending',
    },
    {
      label: 'Traitement',
      status: isFailed ? 'failed' : currentStepIndex >= 5 ? 'completed' : currentStepIndex === 5 ? 'current' : 'pending',
    },
    {
      label: 'Prête',
      status: isFailed ? 'failed' : currentStepIndex >= 6 ? 'completed' : currentStepIndex === 6 ? 'current' : 'pending',
    },
    {
      label: 'Retirée',
      status: isFailed ? 'failed' : currentStepIndex >= 7 ? 'completed' : 'pending',
      date: completedAt,
    },
  ]

  return (
    <div className="py-8">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200">
          <div
            className={`h-full transition-all duration-500 ${
              isFailed ? 'bg-red-500' : 'bg-primary-500'
            }`}
            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, index) => (
          <div key={index} className="relative flex flex-col items-center" style={{ zIndex: 1 }}>
            {/* Circle */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all ${
                step.status === 'completed'
                  ? 'bg-primary-500 border-primary-500 text-white'
                  : step.status === 'current'
                  ? 'bg-white border-primary-500 text-primary-500 animate-pulse'
                  : step.status === 'failed'
                  ? 'bg-red-500 border-red-500 text-white'
                  : 'bg-white border-gray-300 text-gray-400'
              }`}
            >
              {step.status === 'completed' ? (
                <FiCheck size={20} />
              ) : step.status === 'current' ? (
                <FiClock size={20} />
              ) : step.status === 'failed' ? (
                <FiX size={20} />
              ) : (
                <span className="text-xs font-bold">{index + 1}</span>
              )}
            </div>

            {/* Label */}
            <div className="mt-2 text-center">
              <p
                className={`text-sm font-medium ${
                  step.status === 'completed' || step.status === 'current'
                    ? 'text-gray-900'
                    : 'text-gray-500'
                }`}
              >
                {step.label}
              </p>
              {step.date && (
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(step.date).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Current Status Description */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <StatusDescription status={currentStatus} />
      </div>
    </div>
  )
}

function StatusDescription({ status }: { status: string }) {
  const descriptions: Record<string, { title: string; description: string; color: string }> = {
    SUBMITTED: {
      title: 'Demande soumise',
      description: 'Votre demande a été reçue et sera examinée prochainement par nos agents.',
      color: 'text-blue-600',
    },
    UNDER_REVIEW: {
      title: 'En cours de vérification',
      description: 'Nos agents vérifient vos documents et informations. Cela peut prendre 1-2 jours ouvrés.',
      color: 'text-orange-600',
    },
    PAYMENT_PENDING: {
      title: 'Paiement en attente',
      description: 'Veuillez effectuer le paiement pour continuer le traitement de votre demande.',
      color: 'text-purple-600',
    },
    PAYMENT_RECEIVED: {
      title: 'Paiement reçu',
      description: 'Votre paiement a été confirmé. Votre demande est maintenant en cours de traitement.',
      color: 'text-green-600',
    },
    PROCESSING: {
      title: 'En traitement',
      description: 'Votre demande est en cours de traitement par nos services consulaires.',
      color: 'text-teal-600',
    },
    READY: {
      title: 'Prête pour retrait',
      description: 'Votre document est prêt ! Vous pouvez venir le récupérer pendant nos horaires d\'ouverture.',
      color: 'text-green-600',
    },
    COMPLETED: {
      title: 'Terminée',
      description: 'Votre demande a été complétée avec succès. Merci d\'avoir utilisé nos services.',
      color: 'text-green-600',
    },
    REJECTED: {
      title: 'Rejetée',
      description: 'Votre demande n\'a pas pu être acceptée. Consultez les notes administratives pour plus de détails.',
      color: 'text-red-600',
    },
    CANCELLED: {
      title: 'Annulée',
      description: 'Cette demande a été annulée.',
      color: 'text-gray-600',
    },
  }

  const info = descriptions[status] || descriptions.SUBMITTED

  return (
    <div>
      <h4 className={`font-bold text-lg mb-2 ${info.color}`}>{info.title}</h4>
      <p className="text-gray-700">{info.description}</p>
    </div>
  )
}

