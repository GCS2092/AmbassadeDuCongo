/**
 * Chatbot Component - Assistant virtuel basé sur règles
 * 100% GRATUIT - Sans IA payante
 */
import { useState, useRef, useEffect } from 'react'
import { FiMessageCircle, FiX, FiSend } from 'react-icons/fi'
import { Link } from 'react-router-dom'

interface Message {
  id: string
  text: string
  isBot: boolean
  timestamp: Date
  quickReplies?: QuickReply[]
}

interface QuickReply {
  label: string
  value: string
}

// Base de connaissances du chatbot
const CHATBOT_RESPONSES: Record<string, { text: string; quickReplies?: QuickReply[] }> = {
  // Salutations
  greeting: {
    text: 'Bonjour ! 👋 Je suis l\'assistant virtuel de l\'Ambassade du Congo. Comment puis-je vous aider aujourd\'hui ?',
    quickReplies: [
      { label: '📅 Prendre rendez-vous', value: 'appointment' },
      { label: '📝 Faire une demande', value: 'application' },
      { label: '💰 Tarifs', value: 'pricing' },
      { label: '❓ FAQ', value: 'faq' },
    ],
  },
  
  // Rendez-vous
  appointment: {
    text: 'Pour prendre rendez-vous :\n\n1. Cliquez sur "Prendre rendez-vous"\n2. Choisissez votre service\n3. Sélectionnez une date et heure\n4. Confirmez votre rendez-vous\n\nVous recevrez un QR code par email.',
    quickReplies: [
      { label: '✅ Prendre RDV maintenant', value: 'book_appointment' },
      { label: '📋 Documents requis', value: 'documents' },
      { label: '🏢 Horaires', value: 'hours' },
    ],
  },
  
  // Demandes
  application: {
    text: 'Nous traitons plusieurs types de demandes :\n\n• Visa (Tourisme, Affaires)\n• Passeport (Nouveau, Renouvellement)\n• Légalisation de documents\n• Attestations consulaires\n\nQue souhaitez-vous faire ?',
    quickReplies: [
      { label: '🛂 Visa', value: 'visa' },
      { label: '📖 Passeport', value: 'passport' },
      { label: '📄 Légalisation', value: 'legalization' },
    ],
  },
  
  // Visa
  visa: {
    text: '🛂 **Visa**\n\n• Visa Tourisme : 50,000 XOF (5 jours)\n• Visa Affaires : 75,000 XOF (3 jours)\n\n**Documents requis** :\n- Passeport valide (6 mois)\n- 2 photos d\'identité\n- Réservation hôtel\n- Billet d\'avion',
    quickReplies: [
      { label: '📝 Faire une demande', value: 'book_appointment' },
      { label: '💰 Autres tarifs', value: 'pricing' },
    ],
  },
  
  // Passeport
  passport: {
    text: '📖 **Passeport**\n\n• Nouveau : 100,000 XOF (10 jours)\n• Renouvellement : 90,000 XOF (7 jours)\n\n**Documents requis** :\n- Acte de naissance\n- 2 photos d\'identité\n- Ancien passeport (renouvellement)',
    quickReplies: [
      { label: '📝 Faire une demande', value: 'book_appointment' },
      { label: '❓ Plus d\'infos', value: 'faq' },
    ],
  },
  
  // Tarifs
  pricing: {
    text: '💰 **Tarifs des services**\n\n**Visas** :\n• Tourisme : 50,000 XOF\n• Affaires : 75,000 XOF\n\n**Passeports** :\n• Nouveau : 100,000 XOF\n• Renouvellement : 90,000 XOF\n\n**Actes civils** : 5,000 XOF\n**Légalisation** : 10,000 XOF',
    quickReplies: [
      { label: '📅 Prendre RDV', value: 'appointment' },
      { label: '💳 Modes de paiement', value: 'payment' },
    ],
  },
  
  // Horaires
  hours: {
    text: '🏢 **Horaires d\'ouverture**\n\nLundi - Vendredi : 9h00 - 17h00\nSamedi : 9h00 - 13h00\nDimanche : Fermé\n\n📍 Stèle Mermoz, Pyrotechnie, Dakar',
    quickReplies: [
      { label: '📞 Contact', value: 'contact' },
      { label: '🗺️ Itinéraire', value: 'location' },
    ],
  },
  
  // Contact
  contact: {
    text: '📞 **Nous contacter**\n\nTéléphones :\n+221 824 8398\n+221 649 3117\n\nEmail :\ncontact@ambassade-congo.sn\n\nUrgences consulaires :\nDisponible 24/7',
    quickReplies: [
      { label: '🏢 Horaires', value: 'hours' },
      { label: '❓ FAQ', value: 'faq' },
    ],
  },
  
  // Documents
  documents: {
    text: '📋 **Documents généralement requis**\n\n✓ Passeport valide (minimum 6 mois)\n✓ Photos d\'identité récentes\n✓ Formulaire de demande rempli\n✓ Justificatifs selon le service\n\nLa liste complète vous sera donnée lors de la prise de RDV.',
    quickReplies: [
      { label: '📅 Prendre RDV', value: 'appointment' },
      { label: '❓ Questions', value: 'faq' },
    ],
  },
  
  // Paiement
  payment: {
    text: '💳 **Modes de paiement acceptés**\n\n✓ Carte bancaire (en ligne)\n✓ Orange Money\n✓ Wave\n✓ Espèces (au guichet)\n\nPaiement sécurisé via Stripe.',
    quickReplies: [
      { label: '💰 Voir tarifs', value: 'pricing' },
      { label: '📝 Faire une demande', value: 'book_appointment' },
    ],
  },
  
  // FAQ
  faq: {
    text: '❓ **Questions fréquentes**\n\nConsultez notre FAQ pour trouver rapidement des réponses à vos questions sur :\n• Visas\n• Passeports\n• Rendez-vous\n• Paiements\n• Documents',
    quickReplies: [
      { label: '📖 Voir toutes les FAQ', value: 'view_faq' },
      { label: '👤 Parler à un agent', value: 'human_agent' },
    ],
  },
  
  // Agent humain
  human_agent: {
    text: 'Je transfère votre demande à un agent. Vous pouvez également :\n\n📞 Appeler : +221 824 8398\n📧 Email : contact@ambassade-congo.sn\n\nUn agent vous répondra dans les plus brefs délais.',
    quickReplies: [
      { label: '🏠 Retour menu', value: 'greeting' },
    ],
  },
  
  // Défaut
  default: {
    text: 'Je n\'ai pas bien compris votre question. Voici ce que je peux vous aider à faire :',
    quickReplies: [
      { label: '📅 Rendez-vous', value: 'appointment' },
      { label: '📝 Demandes', value: 'application' },
      { label: '💰 Tarifs', value: 'pricing' },
      { label: '❓ FAQ', value: 'faq' },
    ],
  },
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Message de bienvenue initial
    if (messages.length === 0) {
      addBotMessage('greeting')
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const addBotMessage = (responseKey: string) => {
    const response = CHATBOT_RESPONSES[responseKey] || CHATBOT_RESPONSES.default
    const newMessage: Message = {
      id: Date.now().toString(),
      text: response.text,
      isBot: true,
      timestamp: new Date(),
      quickReplies: response.quickReplies,
    }
    setMessages(prev => [...prev, newMessage])
  }

  const addUserMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isBot: false,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, newMessage])
  }

  const handleQuickReply = (value: string) => {
    // Actions spéciales
    if (value === 'book_appointment') {
      window.location.href = '/appointments/book'
      return
    }
    if (value === 'view_faq') {
      window.location.href = '/faq'
      return
    }
    
    // Réponse du bot
    addBotMessage(value)
  }

  const handleSend = () => {
    if (!inputValue.trim()) return

    addUserMessage(inputValue)
    
    // Détection simple de mots-clés
    const text = inputValue.toLowerCase()
    let responseKey = 'default'
    
    if (text.includes('rendez-vous') || text.includes('rdv')) {
      responseKey = 'appointment'
    } else if (text.includes('visa')) {
      responseKey = 'visa'
    } else if (text.includes('passeport')) {
      responseKey = 'passport'
    } else if (text.includes('prix') || text.includes('tarif') || text.includes('coût')) {
      responseKey = 'pricing'
    } else if (text.includes('horaire') || text.includes('ouvert')) {
      responseKey = 'hours'
    } else if (text.includes('contact') || text.includes('téléphone')) {
      responseKey = 'contact'
    } else if (text.includes('document')) {
      responseKey = 'documents'
    } else if (text.includes('paiement') || text.includes('payer')) {
      responseKey = 'payment'
    } else if (text.includes('bonjour') || text.includes('salut') || text.includes('hello')) {
      responseKey = 'greeting'
    }
    
    setTimeout(() => addBotMessage(responseKey), 500)
    setInputValue('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-primary-500 text-white p-4 rounded-full shadow-lg hover:bg-primary-600 transition z-40"
          aria-label="Ouvrir le chat"
        >
          <FiMessageCircle size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-40">
          {/* Header */}
          <div className="bg-primary-500 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div>
              <h3 className="font-bold">Assistant Virtuel</h3>
              <p className="text-sm text-primary-100">En ligne 24/7</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-primary-100 transition"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <div key={message.id}>
                <div
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg whitespace-pre-wrap ${
                      message.isBot
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-primary-500 text-white'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>

                {/* Quick Replies */}
                {message.isBot && message.quickReplies && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {message.quickReplies.map((reply, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickReply(reply.value)}
                        className="text-sm px-3 py-1 bg-white border border-primary-500 text-primary-500 rounded-full hover:bg-primary-50 transition"
                      >
                        {reply.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tapez votre message..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleSend}
                className="bg-primary-500 text-white p-2 rounded-lg hover:bg-primary-600 transition"
              >
                <FiSend size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

