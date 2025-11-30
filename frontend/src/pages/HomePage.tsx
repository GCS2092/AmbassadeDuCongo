import React from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiCalendar, FiFileText, FiMapPin, FiPhone, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi'
import { announcementsApi } from '../lib/api'
import SmoothScroll from '../components/SmoothScroll'
import ProtectedFeatureLink from '../components/ProtectedFeatureLink'
import { useAuthStore } from '../store/authStore'

export default function HomePage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [showActivationMessage, setShowActivationMessage] = React.useState(true)
  
  const { data: announcementsResponse } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementsApi.list().then(res => res.data)
  })

  // Extraire les données du format de réponse de l'API
  const announcements = Array.isArray(announcementsResponse) 
    ? announcementsResponse 
    : announcementsResponse?.results || []

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
    
    // Par défaut
    return '📢'
  }

  // Vérifier si l'utilisateur est connecté mais non activé
  const isInactiveUser = isAuthenticated && user && !user.is_active

  return (
    <SmoothScroll scrollToTop={true}>
      <div>
      {/* Message d'activation pour comptes non activés */}
      {isInactiveUser && showActivationMessage && (
        <section className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white py-4 shadow-lg">
          <div className="container mx-auto px-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start space-x-3 flex-1">
                <FiInfo className="text-white mt-1 flex-shrink-0" size={24} />
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">Activation de votre compte requise</h3>
                  <p className="text-white/95 mb-3">
                    Pour activer votre compte et accéder à tous les services, veuillez vous rendre à l'ambassade muni de votre <strong>carte consulaire</strong>.
                  </p>
                  {!user?.consular_card_number && (
                    <div className="bg-white/20 rounded-lg p-3 mt-3">
                      <p className="text-sm font-semibold mb-2">Vous n'avez pas de carte consulaire ?</p>
                      <p className="text-sm text-white/90">
                        Pour obtenir une carte consulaire, vous devez vous présenter à l'ambassade avec :
                      </p>
                      <ul className="text-sm text-white/90 mt-2 ml-4 list-disc space-y-1">
                        <li>Votre passeport valide</li>
                        <li>Votre acte de naissance</li>
                        <li>Une photo d'identité récente</li>
                        <li>Un justificatif de résidence au Sénégal</li>
                      </ul>
                      <p className="text-sm text-white/90 mt-2">
                        <strong>Adresse :</strong> Stèle Mermoz, Pyrotechnie, P.O. Box 5243, Dakar, Sénégal<br />
                        <strong>Téléphones :</strong> +221 824 8398 / +221 649 3117
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowActivationMessage(false)}
                className="text-white hover:text-gray-200 flex-shrink-0"
                aria-label="Fermer"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-500 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Bienvenue à l'Ambassade de la<br /> Republique<br />   Du Congo Au Senegal
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Services consulaires en ligne pour les citoyens congolais au Sénégal
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/appointments/book" className="btn-primary bg-white text-primary-600 hover:bg-gray-100">
              Prendre rendez-vous
            </Link>
            <Link to="/services" className="btn-outline border-white text-white hover:bg-white hover:text-primary-600">
              Nos services
            </Link>
          </div>
        </div>
      </section>

      {/* Announcements */}
      {announcements && announcements.length > 0 && (
        <section className="bg-gradient-to-r from-yellow-50 to-amber-50 border-y-2 border-yellow-300 py-6 shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start space-x-4 flex-1">
                <div className="text-4xl flex-shrink-0">📢</div>
                <div className="flex-1">
                  <h3 className="font-bold text-yellow-900 mb-3 text-lg flex items-center gap-2">
                    <span>📌</span>
                    <span>Annonces importantes</span>
                  </h3>
                  <div className="space-y-2">
                    {announcements.slice(0, 3).map((announcement: any) => {
                      const contentIcon = getContentIcon(announcement.title || '', announcement.content || '')
                      return (
                        <div key={announcement.id} className="flex items-start gap-2 bg-white/70 rounded-lg p-2 hover:bg-white transition-colors">
                          <span className="text-xl mt-0.5 flex-shrink-0">
                            {contentIcon}
                          </span>
                          <div className="flex-1">
                            <p className="text-yellow-900 font-medium text-sm">
                              {announcement.title}
                            </p>
                            {announcement.publish_from && (
                              <p className="text-yellow-700 text-xs mt-1 flex items-center gap-1">
                                <span>📅</span>
                                <span>{new Date(announcement.publish_from).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/announcements')}
                className="text-yellow-900 hover:text-yellow-950 font-semibold text-sm bg-yellow-200 hover:bg-yellow-300 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 flex-shrink-0"
              >
                <span>Voir tout</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="py-8 md:py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8">Services en ligne</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 max-w-5xl mx-auto">
            <QuickActionCard
              icon={<FiCalendar size={32} />}
              title="Rendez-vous"
              description="Prenez rendez-vous en ligne pour vos démarches consulaires"
              link="/appointments/book"
              color="bg-blue-500"
              feature="appointments"
            />
            <QuickActionCard
              icon={<FiFileText size={32} />}
              title="Demandes"
              description="Soumettez vos demandes de visa, passeport et autres documents"
              link="/applications/new"
              color="bg-green-500"
              feature="applications"
            />
            <QuickActionCard
              icon={<FiMapPin size={32} />}
              title="Localisation"
              description="Trouvez nos coordonnées et itinéraire"
              link="/contact"
              color="bg-purple-500"
            />
            <QuickActionCard
              icon={<FiPhone size={32} />}
              title="Contact"
              description="Contactez-nous pour toute question"
              link="/contact"
              color="bg-orange-500"
            />
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Embassy Info */}
            <div>
              <h2 className="text-3xl font-bold mb-6">Ambassade du Congo - Brazzaville</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <FiMapPin className="text-primary-500 mt-1" size={20} />
                  <div>
                    <p className="font-semibold">Adresse</p>
                    <p className="text-gray-600">
                      Stèle Mermoz, Pyrotechnie<br />
                      P.O. Box 5243, Dakar, Sénégal
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <FiPhone className="text-primary-500 mt-1" size={20} />
                  <div>
                    <p className="font-semibold">Téléphones</p>
                    <p className="text-gray-600">+221 824 8398 / +221 649 3117</p>
                  </div>
                </div>
                <div className="mt-6">
                  <p className="font-semibold mb-2">Horaires d'ouverture</p>
                  <p className="text-gray-600">
                    Lundi - Vendredi: 9h00 - 17h00<br />
                    Samedi: 9h00 - 13h00
                  </p>
                </div>
              </div>
            </div>

            {/* Important Services */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-2xl font-bold mb-4">Services aux étrangers</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg">
                    Direction de la Police des Étrangers (DPETV)
                  </h4>
                  <p className="text-gray-600 text-sm mt-2">
                    Pour vos cartes de circulation, titres de séjour et documents de voyage
                  </p>
                  <div className="mt-3 space-y-1 text-sm">
                    <p><strong>Adresse:</strong> Dieuppeul, Allées Sérigne Ababacar Sy, Dakar</p>
                    <p><strong>Téléphones:</strong> 33 869 30 01 / 33 864 51 26</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      </div>
    </SmoothScroll>
  )
}

interface QuickActionCardProps {
  icon: React.ReactNode
  title: string
  description: string
  link: string
  color: string
  feature?: 'registration' | 'appointments' | 'applications' | 'payments'
}

function QuickActionCard({ icon, title, description, link, color, feature }: QuickActionCardProps) {
  const cardContent = (
    <>
      <div className={`${color} text-white p-2 md:p-3 lg:p-4 rounded-lg mb-2 md:mb-3 lg:mb-4 inline-block group-hover:scale-110 transition flex items-center justify-center`}>
        <div className="flex items-center justify-center">
          {React.cloneElement(icon as React.ReactElement, { 
            className: "w-5 h-5 md:w-7 md:h-7 lg:w-8 lg:h-8"
          })}
        </div>
      </div>
      <h3 className="text-sm md:text-base lg:text-lg font-bold mb-1 md:mb-2">{title}</h3>
      <p className="text-xs md:text-sm text-gray-600 hidden md:block">{description}</p>
    </>
  )

  if (feature) {
    return (
      <ProtectedFeatureLink to={link} feature={feature} className="card hover:shadow-lg transition group block">
        {cardContent}
      </ProtectedFeatureLink>
    )
  }

  return (
    <Link to={link} className="card hover:shadow-lg transition group">
      {cardContent}
    </Link>
  )
}

