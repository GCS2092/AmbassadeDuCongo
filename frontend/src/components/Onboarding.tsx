/**
 * Onboarding Component - Guide interactif pour nouveaux utilisateurs
 * Gratuit - Pas d'abonnement requis
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiX, FiChevronRight, FiCheck } from 'react-icons/fi'

interface OnboardingStep {
  title: string
  description: string
  image?: string
  action?: {
    label: string
    path: string
  }
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: '🎉 Bienvenue !',
    description: 'Bienvenue sur le portail de l\'Ambassade de la République du Congo au Sénégal. Gérez vos rendez-vous et demandes en ligne facilement.',
  },
  {
    title: '📋 Organisez vos papiers',
    description: 'Créez votre identité numérique complète et organisez tous vos documents officiels dans un espace sécurisé.',
    action: {
      label: 'Configurer mon profil',
      path: '/identity',
    },
  },
  {
    title: '📅 Prenez rendez-vous',
    description: 'Réservez votre créneau en ligne pour vos démarches consulaires. Fini les longues files d\'attente !',
    action: {
      label: 'Prendre rendez-vous',
      path: '/appointments/book',
    },
  },
  {
    title: '📝 Faites vos demandes',
    description: 'Soumettez vos demandes de visa, passeport et autres documents directement en ligne.',
    action: {
      label: 'Nouvelle demande',
      path: '/applications/new',
    },
  },
  {
    title: '💳 Payez en ligne',
    description: 'Réglez vos frais consulaires de manière sécurisée par carte bancaire ou Mobile Money.',
  },
  {
    title: '📱 Suivez vos dossiers',
    description: 'Consultez l\'avancement de vos demandes en temps réel et recevez des notifications.',
    action: {
      label: 'Mon tableau de bord',
      path: '/dashboard',
    },
  },
]

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà vu l'onboarding
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding')
    if (!hasSeenOnboarding) {
      setIsVisible(true)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    localStorage.setItem('hasSeenOnboarding', 'true')
    setIsVisible(false)
  }

  const handleComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true')
    setIsVisible(false)
    const action = ONBOARDING_STEPS[currentStep].action
    if (action) {
      navigate(action.path)
    }
  }

  const handleAction = (path: string) => {
    handleComplete()
    navigate(path)
  }

  if (!isVisible) return null

  const step = ONBOARDING_STEPS[currentStep]
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="text-sm text-gray-600">
            Étape {currentStep + 1} sur {ONBOARDING_STEPS.length}
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">{step.title}</h2>
          <p className="text-gray-600 text-lg mb-8">{step.description}</p>

          {step.image && (
            <img 
              src={step.image} 
              alt={step.title}
              className="w-64 h-64 mx-auto mb-6 object-contain"
            />
          )}

          {step.action && (
            <button
              onClick={() => handleAction(step.action!.path)}
              className="btn-primary mb-4 w-full"
            >
              {step.action.label} →
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="px-8 pb-4">
          <div className="flex space-x-2 mb-4">
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition ${
                  index <= currentStep ? 'bg-primary-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t">
          <button
            onClick={handleSkip}
            className="text-gray-600 hover:text-gray-800"
          >
            Passer
          </button>
          <button
            onClick={handleNext}
            className="btn-primary flex items-center space-x-2"
          >
            <span>{isLastStep ? 'Terminer' : 'Suivant'}</span>
            {!isLastStep && <FiChevronRight />}
            {isLastStep && <FiCheck />}
          </button>
        </div>
      </div>
    </div>
  )
}

