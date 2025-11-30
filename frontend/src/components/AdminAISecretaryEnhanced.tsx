import React, { useState, useRef, useEffect } from 'react'
import { 
  FiMessageCircle, FiSend, FiUser, FiCalendar, FiFileText, 
  FiSettings, FiHelpCircle, FiTrendingUp, FiClock,
  FiCheckCircle, FiAlertTriangle, FiX, FiMinimize2, FiMaximize2,
  FiUsers, FiShield, FiMail, FiDownload, FiSearch, FiEdit,
  FiActivity, FiTarget, FiZap
} from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'
import { appointmentsApi, applicationsApi, serviceTypesApi, consularOfficesApi } from '../lib/api'
import toast from 'react-hot-toast'

interface AdminAISecretaryEnhancedProps {
  isMinimized?: boolean
  onToggleMinimize?: () => void
  isVisible?: boolean
  onToggleVisibility?: () => void
}

interface AIMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  metadata?: {
    action?: string
    data?: any
    quickActions?: Array<{
      label: string
      action: string
      icon: React.ComponentType<any>
    }>
  }
}

interface QuickAction {
  label: string
  action: string
  icon: React.ComponentType<any>
  description: string
}

export default function AdminAISecretaryEnhanced({ 
  isMinimized, 
  onToggleMinimize, 
  isVisible = false, 
  onToggleVisibility 
}: AdminAISecretaryEnhancedProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Bonjour ! Je suis votre secrétaire IA avancée. Je peux vous aider avec la gestion complète de l\'ambassade : statistiques, demandes, rendez-vous, services, et bien plus !',
      timestamp: new Date(),
      metadata: {
        quickActions: [
          { label: 'Statistiques', action: 'stats', icon: FiTrendingUp },
          { label: 'Demandes urgentes', action: 'urgent', icon: FiAlertTriangle },
          { label: 'Rendez-vous du jour', action: 'today', icon: FiCalendar },
          { label: 'Services populaires', action: 'services', icon: FiTrendingUp }
        ]
      }
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Récupérer toutes les données nécessaires
  const { data: comprehensiveStats } = useQuery({
    queryKey: ['ai-comprehensive-stats'],
    queryFn: async () => {
      const [appointments, applications, services, offices] = await Promise.all([
        appointmentsApi.list().then(res => Array.isArray(res.data) ? res.data : res.data?.results || []),
        applicationsApi.list().then(res => Array.isArray(res.data) ? res.data : res.data?.results || []),
        serviceTypesApi.list().then(res => Array.isArray(res.data) ? res.data : res.data?.results || []),
        consularOfficesApi.list().then(res => Array.isArray(res.data) ? res.data : res.data?.results || [])
      ])

      const today = new Date().toISOString().split('T')[0]
      const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const thisMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Statistiques des rendez-vous
      const todayAppointments = appointments.filter(apt => apt.appointment_date === today)
      const weekAppointments = appointments.filter(apt => apt.appointment_date >= thisWeek)
      const monthAppointments = appointments.filter(apt => apt.appointment_date >= thisMonth)

      // Statistiques des demandes
      const pendingApplications = applications.filter(app => 
        ['SUBMITTED', 'UNDER_REVIEW'].includes(app.status)
      )
      const urgentApplications = applications.filter(app => 
        app.status === 'SUBMITTED' && 
        new Date(app.created_at) < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      )
      const completedThisWeek = applications.filter(app => 
        app.status === 'COMPLETED' && 
        new Date(app.completed_at || app.updated_at) >= new Date(thisWeek)
      )

      // Statistiques des services
      const popularServices = services
        .map(service => ({
          ...service,
          applicationCount: applications.filter(app => app.service_type === service.id).length
        }))
        .sort((a, b) => b.applicationCount - a.applicationCount)
        .slice(0, 5)

      // Analyse des tendances
      const statusDistribution = applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return {
        // Rendez-vous
        todayAppointments: todayAppointments.length,
        weekAppointments: weekAppointments.length,
        monthAppointments: monthAppointments.length,
        totalAppointments: appointments.length,
        
        // Demandes
        pendingApplications: pendingApplications.length,
        urgentApplications: urgentApplications.length,
        completedThisWeek: completedThisWeek.length,
        totalApplications: applications.length,
        statusDistribution,
        
        // Services
        totalServices: services.length,
        popularServices,
        
        // Bureaux
        totalOffices: offices.length,
        
        // Données brutes pour analyses
        rawAppointments: appointments,
        rawApplications: applications,
        rawServices: services
      }
    }
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Actions rapides disponibles
  const quickActions: QuickAction[] = [
    { label: 'Statistiques complètes', action: 'stats', icon: FiTrendingUp, description: 'Voir toutes les statistiques' },
    { label: 'Demandes urgentes', action: 'urgent', icon: FiAlertTriangle, description: 'Demandes en attente > 3 jours' },
    { label: 'Rendez-vous du jour', action: 'today', icon: FiCalendar, description: 'Planning quotidien' },
    { label: 'Services populaires', action: 'services', icon: FiTrendingUp, description: 'Top 5 des services' },
    { label: 'Analyse des tendances', action: 'trends', icon: FiActivity, description: 'Évolution des demandes' },
    { label: 'Performance mensuelle', action: 'performance', icon: FiTarget, description: 'Indicateurs de performance' },
    { label: 'Alertes système', action: 'alerts', icon: FiZap, description: 'Notifications importantes' },
    { label: 'Rapport d\'activité', action: 'report', icon: FiDownload, description: 'Générer un rapport' }
  ]

  // Base de connaissances avancée de l'IA
  const getAIResponse = async (userMessage: string): Promise<AIMessage> => {
    const message = userMessage.toLowerCase()
    setIsTyping(true)
    
    // Simuler un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    let response = ''
    let quickActions: Array<{ label: string; action: string; icon: React.ComponentType<any> }> = []

    // Statistiques complètes
    if (message.includes('statistique') || message.includes('stats') || message.includes('nombre') || message.includes('données')) {
      response = `📊 **Statistiques Complètes de l'Ambassade :**

**📅 Rendez-vous :**
• Aujourd'hui : **${comprehensiveStats?.todayAppointments || 0}** rendez-vous
• Cette semaine : **${comprehensiveStats?.weekAppointments || 0}** rendez-vous
• Ce mois : **${comprehensiveStats?.monthAppointments || 0}** rendez-vous
• Total : **${comprehensiveStats?.totalAppointments || 0}** rendez-vous

**📝 Demandes :**
• En attente : **${comprehensiveStats?.pendingApplications || 0}** demandes
• Urgentes (>3 jours) : **${comprehensiveStats?.urgentApplications || 0}** demandes
• Complétées cette semaine : **${comprehensiveStats?.completedThisWeek || 0}** demandes
• Total : **${comprehensiveStats?.totalApplications || 0}** demandes

**🏢 Services :**
• Services disponibles : **${comprehensiveStats?.totalServices || 0}**
• Bureaux actifs : **${comprehensiveStats?.totalOffices || 0}**

**📈 Distribution des statuts :**
${Object.entries(comprehensiveStats?.statusDistribution || {}).map(([status, count]) => 
  `• ${status} : ${count} demandes`
).join('\n')}

💡 **Recommandations :**
${comprehensiveStats?.urgentApplications > 0 ? '🚨 **URGENT** : Traiter les demandes en attente depuis plus de 3 jours' : '✅ Situation normale pour les demandes urgentes'}
${comprehensiveStats?.todayAppointments > 15 ? '📅 Journée chargée en rendez-vous - Prévoir du personnel supplémentaire' : '📅 Charge normale pour les rendez-vous'}`

      quickActions = [
        { label: 'Demandes urgentes', action: 'urgent', icon: FiAlertTriangle },
        { label: 'Rendez-vous du jour', action: 'today', icon: FiCalendar },
        { label: 'Services populaires', action: 'services', icon: FiTrendingUp }
      ]
    }

    // Demandes urgentes
    else if (message.includes('urgent') || message.includes('priorité') || message.includes('attente')) {
      const urgentApps = comprehensiveStats?.rawApplications?.filter(app => 
        app.status === 'SUBMITTED' && 
        new Date(app.created_at) < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      ) || []

      response = `🚨 **Demandes Urgentes (${urgentApps.length}) :**

${urgentApps.length === 0 ? '✅ Aucune demande urgente - Excellent travail !' : urgentApps.map(app => 
  `• **${app.reference_number}** - ${app.application_type_display} (${app.applicant_name})
   Créée le ${new Date(app.created_at).toLocaleDateString('fr-FR')}
   Statut : ${app.status_display}`
).join('\n\n')}

${urgentApps.length > 0 ? `
💡 **Actions recommandées :**
• Examiner immédiatement ces demandes
• Contacter les demandeurs si nécessaire
• Mettre à jour les statuts rapidement
• Planifier des rendez-vous de suivi` : ''}`

      quickActions = [
        { label: 'Voir toutes les demandes', action: 'applications', icon: FiFileText },
        { label: 'Statistiques complètes', action: 'stats', icon: FiTrendingUp }
      ]
    }

    // Rendez-vous du jour
    else if (message.includes('rendez-vous') || message.includes('appointment') || message.includes('aujourd\'hui') || message.includes('planning')) {
      const todayApps = comprehensiveStats?.rawAppointments?.filter(apt => 
        apt.appointment_date === new Date().toISOString().split('T')[0]
      ) || []

      response = `📅 **Rendez-vous du Jour (${todayApps.length}) :**

${todayApps.length === 0 ? '✅ Aucun rendez-vous programmé aujourd\'hui' : todayApps.map(apt => 
  `• **${apt.appointment_time}** - ${apt.service_name}
   Client : ${apt.user_name || 'N/A'}
   Bureau : ${apt.office_name || 'N/A'}
   Statut : ${apt.status || 'Confirmé'}`
).join('\n\n')}

**🔧 Outils disponibles :**
• Scanner QR code pour les visiteurs
• Gérer les créneaux disponibles
• Envoyer des rappels par email
• Modifier les rendez-vous si nécessaire

💡 **Conseils :**
• Vérifiez les QR codes des visiteurs
• Préparez les documents nécessaires
• Informez l'équipe des rendez-vous importants`

      quickActions = [
        { label: 'Scanner QR', action: 'qr', icon: FiSearch },
        { label: 'Gérer créneaux', action: 'slots', icon: FiEdit },
        { label: 'Envoyer rappels', action: 'reminders', icon: FiMail }
      ]
    }

    // Services populaires
    else if (message.includes('service') || message.includes('populaire') || message.includes('demandé')) {
      const popular = comprehensiveStats?.popularServices || []

      response = `🏆 **Top 5 des Services les Plus Demandés :**

${popular.map((service, index) => 
  `${index + 1}. **${service.name}** - ${service.applicationCount} demandes
     Frais : ${service.fee} FCFA
     Délai : ${service.processing_time || 'N/A'}`
).join('\n\n')}

**📊 Analyse :**
• Service le plus demandé : **${popular[0]?.name || 'N/A'}**
• Total de demandes : **${popular.reduce((sum, s) => sum + s.applicationCount, 0)}**
• Moyenne par service : **${Math.round(popular.reduce((sum, s) => sum + s.applicationCount, 0) / Math.max(popular.length, 1))}**

💡 **Recommandations :**
• Optimiser les processus pour les services populaires
• Former l'équipe sur les services les plus demandés
• Prévoir des créneaux supplémentaires si nécessaire`

      quickActions = [
        { label: 'Gérer les services', action: 'manage_services', icon: FiSettings },
        { label: 'Statistiques complètes', action: 'stats', icon: FiTrendingUp }
      ]
    }

    // Analyse des tendances
    else if (message.includes('tendance') || message.includes('évolution') || message.includes('analyse') || message.includes('performance')) {
      const statusDist = comprehensiveStats?.statusDistribution || {}
      const totalApps = comprehensiveStats?.totalApplications || 0
      
      response = `📈 **Analyse des Tendances et Performance :**

**📊 Distribution des Statuts :**
${Object.entries(statusDist).map(([status, count]) => {
  const percentage = totalApps > 0 ? Math.round((count / totalApps) * 100) : 0
  return `• **${status}** : ${count} demandes (${percentage}%)`
}).join('\n')}

**📅 Performance Cette Semaine :**
• Demandes complétées : **${comprehensiveStats?.completedThisWeek || 0}**
• Taux de completion : **${comprehensiveStats?.totalApplications > 0 ? 
  Math.round((comprehensiveStats.completedThisWeek / comprehensiveStats.totalApplications) * 100) : 0}%**

**🎯 Indicateurs Clés :**
• Temps de traitement moyen : **${comprehensiveStats?.urgentApplications > 0 ? '> 3 jours' : '< 3 jours'}**
• Charge de travail : **${comprehensiveStats?.pendingApplications > 10 ? 'Élevée' : 'Normale'}**
• Efficacité : **${comprehensiveStats?.completedThisWeek > 5 ? 'Bonne' : 'À améliorer'}**

💡 **Recommandations :**
${comprehensiveStats?.urgentApplications > 0 ? '• Priorité : Réduire le temps de traitement des demandes' : '• Maintenir le bon rythme de traitement'}
${comprehensiveStats?.pendingApplications > 10 ? '• Augmenter les ressources pour traiter les demandes en attente' : '• Charge de travail équilibrée'}`

      quickActions = [
        { label: 'Rapport détaillé', action: 'detailed_report', icon: FiDownload },
        { label: 'Optimiser les processus', action: 'optimize', icon: FiZap }
      ]
    }

    // Alertes système
    else if (message.includes('alerte') || message.includes('notification') || message.includes('problème') || message.includes('erreur')) {
      const alerts = []
      
      if (comprehensiveStats?.urgentApplications > 0) {
        alerts.push(`🚨 ${comprehensiveStats.urgentApplications} demandes urgentes en attente`)
      }
      if (comprehensiveStats?.todayAppointments > 20) {
        alerts.push(`📅 Journée très chargée : ${comprehensiveStats.todayAppointments} rendez-vous`)
      }
      if (comprehensiveStats?.pendingApplications > 15) {
        alerts.push(`📝 Charge élevée : ${comprehensiveStats.pendingApplications} demandes en attente`)
      }
      if (comprehensiveStats?.completedThisWeek < 3) {
        alerts.push(`⚠️ Performance faible : seulement ${comprehensiveStats.completedThisWeek} demandes complétées cette semaine`)
      }

      response = `🔔 **Alertes et Notifications Système :**

${alerts.length === 0 ? '✅ Aucune alerte - Système fonctionnel normalement' : alerts.map(alert => `• ${alert}`).join('\n\n')}

**🔧 Actions Correctives :**
${alerts.length === 0 ? '• Continuer le bon travail' : 
  alerts.some(a => a.includes('urgent')) ? '• Traiter immédiatement les demandes urgentes' : ''}
${alerts.some(a => a.includes('chargée')) ? '• Prévoir du personnel supplémentaire' : ''}
${alerts.some(a => a.includes('Performance')) ? '• Analyser les goulots d\'étranglement' : ''}

**📊 Surveillance Continue :**
• Vérification automatique toutes les heures
• Notifications en temps réel
• Rapports de performance quotidiens`

      quickActions = [
        { label: 'Résoudre les alertes', action: 'resolve_alerts', icon: FiCheckCircle },
        { label: 'Configurer les notifications', action: 'notifications', icon: FiSettings }
      ]
    }

    // Aide générale
    else if (message.includes('aide') || message.includes('help') || message.includes('commande') || message.includes('que peux-tu')) {
      response = `🤖 **Secrétaire IA - Guide d'Utilisation :**

**📊 Statistiques et Analyses :**
• "Statistiques" - Vue d'ensemble complète
• "Tendances" - Analyse des performances
• "Performance" - Indicateurs clés

**🚨 Gestion des Priorités :**
• "Urgent" - Demandes prioritaires
• "Alertes" - Notifications système
• "Problèmes" - Diagnostic des issues

**📅 Planning et Rendez-vous :**
• "Rendez-vous" - Planning du jour
• "Planning" - Gestion des créneaux
• "Visiteurs" - Scanner QR codes

**🏢 Services et Bureaux :**
• "Services" - Services populaires
• "Bureaux" - Gestion des bureaux
• "Types" - Types de services

**📈 Rapports et Exports :**
• "Rapport" - Générer des rapports
• "Export" - Exporter les données
• "Analyse" - Analyses approfondies

**💡 Conseils :**
• Posez des questions naturelles
• Utilisez les actions rapides
• Demandez des analyses spécifiques`

      quickActions = [
        { label: 'Statistiques', action: 'stats', icon: FiTrendingUp },
        { label: 'Demandes urgentes', action: 'urgent', icon: FiAlertTriangle },
        { label: 'Rendez-vous du jour', action: 'today', icon: FiCalendar }
      ]
    }

    // Réponse par défaut
    else {
      response = `🤔 **Je ne suis pas sûr de comprendre votre demande.**

Voici ce que je peux faire pour vous :
• Analyser les statistiques de l'ambassade
• Identifier les demandes urgentes
• Gérer les rendez-vous du jour
• Analyser les tendances et performances
• Générer des rapports détaillés
• Fournir des recommandations

**💡 Essayez de me demander :**
• "Statistiques complètes"
• "Demandes urgentes"
• "Rendez-vous du jour"
• "Services populaires"
• "Analyse des tendances"`

      quickActions = [
        { label: 'Statistiques', action: 'stats', icon: FiTrendingUp },
        { label: 'Aide', action: 'help', icon: FiHelpCircle },
        { label: 'Actions rapides', action: 'quick', icon: FiZap }
      ]
    }

    setIsTyping(false)
    
    return {
      id: Date.now().toString(),
      type: 'ai',
      content: response,
      timestamp: new Date(),
      metadata: { quickActions }
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setShowQuickActions(false)

    try {
      const aiResponse = await getAIResponse(inputMessage)
      setMessages(prev => [...prev, aiResponse])
    } catch (error) {
      console.error('Erreur IA:', error)
      toast.error('Erreur lors de la génération de la réponse')
    }
  }

  const handleQuickAction = async (action: string) => {
    const actionMessages: Record<string, string> = {
      'stats': 'Statistiques complètes',
      'urgent': 'Demandes urgentes',
      'today': 'Rendez-vous du jour',
      'services': 'Services populaires',
      'trends': 'Analyse des tendances',
      'performance': 'Performance mensuelle',
      'alerts': 'Alertes système',
      'report': 'Rapport d\'activité'
    }

    const message = actionMessages[action] || action
    setInputMessage(message)
    await handleSendMessage()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isVisible) return null

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${isMinimized ? 'w-16 h-16' : 'w-96 h-[600px]'} transition-all duration-300`}>
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <FiMessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Secrétaire IA Avancée</h3>
              <p className="text-xs opacity-90">Assistant intelligent</p>
            </div>
          </div>
          <div className="flex space-x-2">
            {onToggleMinimize && (
              <button
                onClick={onToggleMinimize}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
              >
                {isMinimized ? <FiMaximize2 className="w-4 h-4" /> : <FiMinimize2 className="w-4 h-4" />}
              </button>
            )}
            {onToggleVisibility && (
              <button
                onClick={onToggleVisibility}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Quick Actions */}
            {showQuickActions && (
              <div className="p-4 bg-gray-50 border-b">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Actions Rapides</h4>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.slice(0, 6).map((action) => (
                    <button
                      key={action.action}
                      onClick={() => handleQuickAction(action.action)}
                      className="flex items-center space-x-2 p-2 text-xs bg-white rounded border hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      title={action.description}
                    >
                      <action.icon className="w-3 h-3" />
                      <span className="truncate">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                    {message.metadata?.quickActions && (
                      <div className="mt-3 space-y-2">
                        {message.metadata.quickActions.map((action, index) => (
                          <button
                            key={index}
                            onClick={() => handleQuickAction(action.action)}
                            className="flex items-center space-x-2 p-2 text-xs bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors"
                          >
                            <action.icon className="w-3 h-3" />
                            <span>{action.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Posez votre question..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FiSend className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-between items-center mt-2">
                <button
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  {showQuickActions ? 'Masquer' : 'Afficher'} les actions rapides
                </button>
                <span className="text-xs text-gray-400">
                  Appuyez sur Entrée pour envoyer
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
