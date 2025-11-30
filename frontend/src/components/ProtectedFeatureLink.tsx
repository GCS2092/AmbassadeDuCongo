import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSiteSettings } from '../hooks/useSiteSettings'
import FeatureDisabledModal from './FeatureDisabledModal'

interface ProtectedFeatureLinkProps {
  to: string
  feature: 'registration' | 'appointments' | 'applications' | 'payments'
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
}

export default function ProtectedFeatureLink({
  to,
  feature,
  children,
  className = '',
  onClick,
  disabled = false
}: ProtectedFeatureLinkProps) {
  const { data: settings, isLoading } = useSiteSettings()
  const [showModal, setShowModal] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault()
      return
    }

    if (isLoading || !settings) {
      e.preventDefault()
      return
    }

    // Vérifier le mode maintenance global
    if (settings.site_maintenance_mode) {
      e.preventDefault()
      setShowModal(true)
      return
    }

    // Vérifier la fonctionnalité spécifique
    let isEnabled = true
    let message = ''

    switch (feature) {
      case 'registration':
        isEnabled = settings.registration_enabled
        message = settings.registration_message || 'L\'inscription est actuellement désactivée.'
        break
      case 'appointments':
        isEnabled = settings.appointments_enabled
        message = settings.appointments_message || 'La prise de rendez-vous est actuellement désactivée.'
        break
      case 'applications':
        isEnabled = settings.applications_enabled
        message = settings.applications_message || 'La soumission de demandes est actuellement désactivée.'
        break
      case 'payments':
        isEnabled = settings.payments_enabled
        message = settings.payments_message || 'Les paiements en ligne sont actuellement désactivés.'
        break
    }

    if (!isEnabled) {
      e.preventDefault()
      setShowModal(true)
      return
    }

    if (onClick) {
      onClick()
    }
  }

  const getModalMessage = () => {
    if (settings?.site_maintenance_mode) {
      return settings.maintenance_message || 'Le site est actuellement en maintenance. Merci de votre compréhension.'
    }

    switch (feature) {
      case 'registration':
        return settings?.registration_message || 'L\'inscription est actuellement désactivée.'
      case 'appointments':
        return settings?.appointments_message || 'La prise de rendez-vous est actuellement désactivée.'
      case 'applications':
        return settings?.applications_message || 'La soumission de demandes est actuellement désactivée.'
      case 'payments':
        return settings?.payments_message || 'Les paiements en ligne sont actuellement désactivés.'
      default:
        return 'Cette fonctionnalité est actuellement indisponible.'
    }
  }

  return (
    <>
      <Link
        to={to}
        onClick={handleClick}
        className={className}
      >
        {children}
      </Link>
      <FeatureDisabledModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        message={getModalMessage()}
      />
    </>
  )
}

