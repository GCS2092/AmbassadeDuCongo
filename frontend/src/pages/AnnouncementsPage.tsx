/**
 * Page d'affichage des actualités de l'ambassade
 * Affiche toutes les annonces publiées
 */
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { FiAlertCircle, FiCalendar, FiMapPin, FiClock, FiInfo } from 'react-icons/fi'
import { announcementsApi } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'

export default function AnnouncementsPage() {
  const { data: announcementsResponse, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementsApi.list().then(res => res.data),
  })

  if (isLoading) {
    return <LoadingSpinner text="Chargement des actualités..." />
  }

  // Extraire les données du format de réponse de l'API
  const announcements = Array.isArray(announcementsResponse) 
    ? announcementsResponse 
    : announcementsResponse?.results || []

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 border-red-300 text-red-800'
      case 'HIGH':
        return 'bg-orange-100 border-orange-300 text-orange-800'
      case 'NORMAL':
        return 'bg-blue-100 border-blue-300 text-blue-800'
      case 'LOW':
        return 'bg-gray-100 border-gray-300 text-gray-800'
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800'
    }
  }

  const getPriorityEmoji = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return '🚨'
      case 'HIGH':
        return '⚠️'
      case 'NORMAL':
        return 'ℹ️'
      case 'LOW':
        return '📌'
      default:
        return 'ℹ️'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <FiAlertCircle className="text-red-600" size={20} />
      case 'HIGH':
        return <FiAlertCircle className="text-orange-600" size={20} />
      default:
        return <FiInfo className="text-blue-600" size={20} />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Détection automatique de l'icône selon le contenu
  const getContentIcon = (title: string, content: string): string => {
    const text = `${title} ${content}`.toLowerCase()
    
    // Documents
    if (text.match(/\b(document|passeport|visa|carte|acte|certificat|attestation|papier)\b/)) {
      return '📄'
    }
    
    // Rendez-vous
    if (text.match(/\b(rendez-vous|rdv|appointment|réserver|réservation)\b/)) {
      return '📅'
    }
    
    // Paiement
    if (text.match(/\b(paiement|payer|tarif|prix|coût|frais|montant)\b/)) {
      return '💳'
    }
    
    // Service
    if (text.match(/\b(service|nouveau service|disponible|nouveau)\b/)) {
      return '✨'
    }
    
    // Urgent/Important
    if (text.match(/\b(urgent|important|attention|rappel|vérifiez|vérifier)\b/)) {
      return '⚠️'
    }
    
    // Horaires
    if (text.match(/\b(horaires|ouverture|fermeture|fermé|ouvert)\b/)) {
      return '🕐'
    }
    
    // Contact
    if (text.match(/\b(contact|téléphone|email|adresse|coordonnées)\b/)) {
      return '📞'
    }
    
    // Localisation
    if (text.match(/\b(localisation|adresse|lieu|bureau|ambassade)\b/)) {
      return '📍'
    }
    
    // Information générale
    if (text.match(/\b(information|info|actualité|nouvelle|annonce)\b/)) {
      return 'ℹ️'
    }
    
    // Par défaut, utiliser l'emoji de priorité
    return getPriorityEmoji('NORMAL')
  }

  // Séparer les annonces épinglées des autres
  const pinnedAnnouncements = announcements?.filter((a: any) => a.is_pinned) || []
  const regularAnnouncements = announcements?.filter((a: any) => !a.is_pinned) || []

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center space-x-3">
            <span className="text-4xl">📢</span>
            <span>Actualités de l'Ambassade</span>
          </h1>
          <p className="text-gray-600 flex items-center gap-2">
            <span>📰</span>
            <span>Restez informé des dernières nouvelles et informations importantes</span>
          </p>
        </div>

        {/* Annonces épinglées */}
        {pinnedAnnouncements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <span className="text-2xl">📌</span>
              <span>Annonces importantes</span>
            </h2>
            <div className="space-y-4">
              {pinnedAnnouncements.map((announcement: any) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  getPriorityColor={getPriorityColor}
                  getPriorityIcon={getPriorityIcon}
                  getPriorityEmoji={getPriorityEmoji}
                  getContentIcon={getContentIcon}
                  formatDate={formatDate}
                  formatDateShort={formatDateShort}
                />
              ))}
            </div>
          </div>
        )}

        {/* Autres annonces */}
        {regularAnnouncements.length > 0 ? (
          <div>
            {pinnedAnnouncements.length > 0 && (
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <span className="text-2xl">📋</span>
                <span>Autres actualités</span>
              </h2>
            )}
            <div className="space-y-4">
              {regularAnnouncements.map((announcement: any) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  getPriorityColor={getPriorityColor}
                  getPriorityIcon={getPriorityIcon}
                  getPriorityEmoji={getPriorityEmoji}
                  getContentIcon={getContentIcon}
                  formatDate={formatDate}
                  formatDateShort={formatDateShort}
                />
              ))}
            </div>
          </div>
        ) : pinnedAnnouncements.length === 0 && (
          <div className="card text-center py-12">
            <FiInfo className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600">Aucune actualité disponible pour le moment</p>
          </div>
        )}
      </div>
    </div>
  )
}

interface AnnouncementCardProps {
  announcement: any
  getPriorityColor: (priority: string) => string
  getPriorityIcon: (priority: string) => React.ReactNode
  getPriorityEmoji: (priority: string) => string
  getContentIcon: (title: string, content: string) => string
  formatDate: (dateString: string) => string
  formatDateShort: (dateString: string) => string
}

function AnnouncementCard({ announcement, getPriorityColor, getPriorityIcon, getPriorityEmoji, getContentIcon, formatDate, formatDateShort }: AnnouncementCardProps) {
  // Utiliser l'icône détectée selon le contenu, ou l'emoji de priorité en fallback
  const contentIcon = getContentIcon(announcement.title || '', announcement.content || '')
  const priorityEmoji = getPriorityEmoji(announcement.priority)
  
  return (
    <div className={`bg-white rounded-xl shadow-lg border-l-4 ${getPriorityColor(announcement.priority)} p-5 md:p-7 hover:shadow-xl transition-shadow duration-300`}>
      {/* Header avec icône de contenu et badge épinglé */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1">
          {/* Icône de contenu détectée en grand */}
          <div className="text-3xl md:text-4xl flex-shrink-0">
            {contentIcon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">{announcement.title}</h3>
              {announcement.is_pinned && (
                <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  📌 <span className="hidden sm:inline">Épinglé</span>
                </span>
              )}
            </div>
            
            {/* Métadonnées avec emojis */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
              {/* Date avec emoji calendrier */}
              <span className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                <span className="text-lg">📅</span>
                <span className="font-medium">{formatDateShort(announcement.publish_from)}</span>
              </span>
              
              {/* Bureau avec emoji localisation */}
              {announcement.office_name && (
                <span className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                  <span className="text-lg">📍</span>
                  <span className="font-medium">{announcement.office_name}</span>
                </span>
              )}
              
              {/* Badge de priorité */}
              <span className={`px-3 py-1.5 rounded-lg font-semibold text-xs ${getPriorityColor(announcement.priority)}`}>
                {announcement.priority_display || announcement.priority}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contenu */}
      <div className="prose max-w-none">
        <p className="text-gray-700 whitespace-pre-line leading-relaxed text-base md:text-lg">
          {announcement.content}
        </p>
      </div>
      
      {/* Footer avec date complète si nécessaire */}
      {announcement.publish_to && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <span className="flex items-center space-x-2 text-sm text-gray-500">
            <FiClock size={14} />
            <span>Valable jusqu'au {formatDateShort(announcement.publish_to)}</span>
          </span>
        </div>
      )}
    </div>
  )
}

