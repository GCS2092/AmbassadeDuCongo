/**
 * Application Status Tracker Component
 * Composant de suivi des statuts de demande
 */
import { FiCheckCircle, FiClock, FiAlertTriangle, FiX, FiFileText, FiCreditCard, FiPackage, FiDownload } from 'react-icons/fi'

interface ApplicationStatusTrackerProps {
  status: string
  submittedAt?: string
  completedAt?: string
  className?: string
}

export default function ApplicationStatusTracker({ 
  status, 
  submittedAt, 
  completedAt, 
  className = '' 
}: ApplicationStatusTrackerProps) {
  
  const getStatusSteps = () => {
    const steps = [
      {
        key: 'SUBMITTED',
        label: 'Soumise',
        icon: FiFileText,
        description: 'Votre demande a été reçue et sera examinée prochainement par nos agents.'
      },
      {
        key: 'UNDER_REVIEW',
        label: 'En révision',
        icon: FiClock,
        description: 'Votre demande est en cours d\'examen par nos agents consulaires.'
      },
      {
        key: 'PAYMENT_PENDING',
        label: 'Paiement',
        icon: FiCreditCard,
        description: 'Veuillez effectuer le paiement des frais consulaires.'
      },
      {
        key: 'PROCESSING',
        label: 'Traitement',
        icon: FiPackage,
        description: 'Votre demande est en cours de traitement.'
      },
      {
        key: 'READY',
        label: 'Prête',
        icon: FiCheckCircle,
        description: 'Votre demande est prête pour le retrait.'
      },
      {
        key: 'COMPLETED',
        label: 'Retirée',
        icon: FiDownload,
        description: 'Votre demande a été retirée avec succès.'
      }
    ]
    
    return steps
  }

  const getStatusIndex = (status: string) => {
    const statusOrder = [
      'SUBMITTED',
      'UNDER_REVIEW', 
      'ADDITIONAL_INFO_REQUIRED',
      'PAYMENT_PENDING',
      'PAYMENT_RECEIVED',
      'PROCESSING',
      'READY',
      'COMPLETED'
    ]
    return statusOrder.indexOf(status)
  }

  const getStatusColor = (stepIndex: number, currentIndex: number) => {
    if (stepIndex < currentIndex) {
      return 'text-green-600 bg-green-100'
    } else if (stepIndex === currentIndex) {
      return 'text-blue-600 bg-blue-100'
    } else {
      return 'text-gray-400 bg-gray-100'
    }
  }

  const getStepIcon = (stepIndex: number, currentIndex: number, Icon: any) => {
    if (stepIndex < currentIndex) {
      return <FiCheckCircle className="w-5 h-5" />
    } else if (stepIndex === currentIndex) {
      return <Icon className="w-5 h-5" />
    } else {
      return <div className="w-5 h-5 rounded-full bg-gray-300" />
    }
  }

  const steps = getStatusSteps()
  const currentIndex = getStatusIndex(status)
  const currentStep = steps.find(step => step.key === status) || steps[0]

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Suivi de la demande
      </h3>
      
      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = index <= currentIndex
            const isCurrent = index === currentIndex
            
            return (
              <div key={step.key} className="flex flex-col items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center mb-2
                  ${getStatusColor(index, currentIndex)}
                  ${isActive ? 'ring-2 ring-offset-2' : ''}
                  ${isCurrent ? 'ring-blue-500' : isActive ? 'ring-green-500' : ''}
                `}>
                  {getStepIcon(index, currentIndex, Icon)}
                </div>
                <span className={`text-xs font-medium text-center ${
                  isActive ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
        
        {/* Progress Line */}
        <div className="mt-4">
          <div className="flex items-center">
            {steps.map((_, index) => (
              <div key={index} className="flex-1 flex items-center">
                <div className={`h-1 w-full ${
                  index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                }`} />
                {index < steps.length - 1 && (
                  <div className={`w-2 h-2 rounded-full mx-1 ${
                    index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Current Status Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              {getStepIcon(currentIndex, currentIndex, currentStep.icon)}
            </div>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-900">
              Demande {currentStep.label.toLowerCase()}
            </h4>
            <p className="text-sm text-blue-800 mt-1">
              {currentStep.description}
            </p>
            {submittedAt && (
              <p className="text-xs text-blue-600 mt-2">
                Soumise le {new Date(submittedAt).toLocaleDateString('fr-FR')}
              </p>
            )}
            {completedAt && (
              <p className="text-xs text-blue-600 mt-2">
                Terminée le {new Date(completedAt).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Status-specific messages */}
      {status === 'ADDITIONAL_INFO_REQUIRED' && (
        <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start">
            <FiAlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-orange-900">
                Informations supplémentaires requises
              </h4>
              <p className="text-sm text-orange-800 mt-1">
                Veuillez fournir les informations demandées par nos agents.
              </p>
            </div>
          </div>
        </div>
      )}

      {status === 'REJECTED' && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <FiX className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-red-900">
                Demande rejetée
              </h4>
              <p className="text-sm text-red-800 mt-1">
                Votre demande a été rejetée. Veuillez contacter nos services pour plus d'informations.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
