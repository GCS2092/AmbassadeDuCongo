/**
 * Page affichée pour les utilisateurs avec compte inactif
 * Informe l'utilisateur qu'il doit se rendre à l'ambassade pour activer son compte
 */
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { 
  FiAlertCircle, FiMapPin, FiPhone, FiMail, FiClock, 
  FiCreditCard, FiInfo, FiShield, FiX
} from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'
import { api } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'

export default function InactiveAccountPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [showDetails, setShowDetails] = React.useState(true)
  const reason = location.state?.reason
  const customMessage = location.state?.message
  const fromRegistration = location.state?.fromRegistration || false

  // Récupérer les informations de l'ambassade
  const { data: embassyData, isLoading } = useQuery({
    queryKey: ['consular-offices'],
    queryFn: async () => {
      try {
        const response = await api.get('/core/consular-offices/')
        // Retourner le premier bureau actif (généralement l'ambassade principale)
        const offices = Array.isArray(response.data) 
          ? response.data 
          : response.data?.results || []
        return offices.find((office: any) => office.is_active && office.office_type === 'EMBASSY') || offices[0] || null
      } catch (error) {
        console.error('Erreur lors de la récupération des informations de l\'ambassade:', error)
        return null
      }
    }
  })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Si l'utilisateur n'est pas connecté ou est actif, rediriger
  React.useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    if (user.is_active) {
      // Si le compte devient actif, rediriger vers le dashboard
      navigate('/dashboard')
      return
    }
  }, [user, navigate])

  if (isLoading) {
    return <LoadingSpinner text="Chargement des informations..." />
  }

  // Message personnalisé selon la raison
  const isNoConsularCard = reason === 'no_consular_card'
  
  const embassy = embassyData || {
    name: "Ambassade de la République du Congo au Sénégal",
    address_line1: "Stèle Mermoz, Pyrotechnie",
    address_line2: "P.O. Box 5243",
    city: "Dakar",
    country: "Sénégal",
    phone_primary: "+221 824 8398",
    phone_secondary: "+221 649 3117",
    email: "contact@ambassade-congo.sn",
    opening_hours: "Lundi - Vendredi: 9h00 - 17h00\nSamedi: 9h00 - 13h00"
  }

  const fullAddress = [
    embassy.address_line1,
    embassy.address_line2,
    embassy.city,
    embassy.country
  ].filter(Boolean).join(', ')

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header avec possibilité de fermer */}
        <div className="bg-white rounded-lg shadow-lg border-2 border-orange-200 mb-6">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-t-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <FiShield className="text-white mt-1 flex-shrink-0" size={32} />
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">
                    {isNoConsularCard ? "Carte consulaire requise" : "Compte en attente d'activation"}
                  </h1>
                  <p className="text-orange-100 text-lg">
                    {fromRegistration 
                      ? "Votre inscription a été enregistrée, mais votre compte nécessite une carte consulaire valide"
                      : isNoConsularCard 
                        ? "Votre compte nécessite une carte consulaire valide" 
                        : "Votre compte nécessite une activation par l'ambassade"}
                  </p>
                </div>
              </div>
              {showDetails && (
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-white hover:text-orange-200 transition-colors p-2"
                  aria-label="Réduire"
                >
                  <FiX size={24} />
                </button>
              )}
            </div>
          </div>

          {showDetails && (
            <div className="p-6 space-y-6">
              {/* Message principal */}
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                <div className="flex items-start space-x-3">
                  <FiAlertCircle className="text-orange-600 mt-1 flex-shrink-0" size={24} />
                  <div className="flex-1">
                    <h2 className="font-bold text-orange-900 text-lg mb-2">
                      {isNoConsularCard ? 'Carte consulaire requise pour l\'activation' : 'Activation de votre compte requise'}
                    </h2>
                    {customMessage ? (
                      <p className="text-orange-800 mb-3">{customMessage}</p>
                    ) : (
                      <p className="text-orange-800 mb-3">
                        {isNoConsularCard 
                          ? 'Votre compte nécessite une carte consulaire valide pour être activé. Pour des raisons de sécurité et pour garantir l\'authenticité de nos services, vous devez vous rendre à l\'ambassade avec une pièce d\'identité pour obtenir votre carte consulaire.'
                          : 'Pour activer votre compte et accéder à tous les services de l\'ambassade, vous devez vous présenter physiquement à l\'ambassade avec les documents requis.'}
                      </p>
                    )}
                    {!user?.consular_card_number && (
                      <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mt-3">
                        <p className="text-yellow-900 text-sm font-semibold mb-1">
                          ⚠️ Carte consulaire requise
                        </p>
                        <p className="text-yellow-800 text-sm">
                          Vous devez posséder une <strong>carte consulaire valide</strong> avec un numéro au format SNXXXXXXX 
                          pour pouvoir activer votre compte. Si vous n'avez pas encore de carte consulaire, 
                          vous pourrez en obtenir une lors de votre visite à l'ambassade.
                        </p>
                      </div>
                    )}
                    {user?.consular_card_number && (
                      <div className="bg-green-50 border border-green-300 rounded-lg p-3 mt-3">
                        <p className="text-green-900 text-sm font-semibold mb-1">
                          ✓ Numéro de carte consulaire enregistré
                        </p>
                        <p className="text-green-800 text-sm font-mono">
                          {user.consular_card_number}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-bold text-blue-900 text-lg mb-4 flex items-center space-x-2">
                  <FiInfo className="text-blue-600" size={20} />
                  <span>{isNoConsularCard ? 'Comment obtenir votre carte consulaire et activer votre compte' : 'Instructions pour l\'activation'}</span>
                </h3>
                {isNoConsularCard ? (
                  <div className="space-y-4">
                    <div className="bg-white border-l-4 border-blue-500 p-4 rounded-r-lg">
                      <h4 className="font-bold text-blue-900 mb-3">Pourquoi votre accès est bloqué ?</h4>
                      <p className="text-blue-800 text-sm mb-3">
                        Votre compte a été créé avec succès, mais <strong>l'accès aux fonctionnalités est temporairement bloqué</strong> car vous n'avez pas encore de numéro de carte consulaire enregistré dans notre système.
                      </p>
                      <p className="text-blue-800 text-sm">
                        La carte consulaire est <strong>obligatoire</strong> pour accéder aux services de l'ambassade. Elle garantit votre identité et permet de sécuriser l'accès à vos informations personnelles.
                      </p>
                    </div>
                    
                    <div className="bg-white border-l-4 border-green-500 p-4 rounded-r-lg">
                      <h4 className="font-bold text-green-900 mb-3">Comment résoudre ce problème ?</h4>
                      <p className="text-green-800 text-sm mb-3">
                        Pour activer votre compte et accéder à tous les services, vous devez vous rendre au <strong>bureau de l'ambassade</strong> avec les documents suivants :
                      </p>
                      <ul className="list-disc list-inside text-green-800 text-sm space-y-2 ml-2">
                        <li><strong>Pièce d'identité valide</strong> (passeport, carte d'identité nationale)</li>
                        <li><strong>Preuve de nationalité</strong> (acte de naissance, certificat de nationalité)</li>
                        <li><strong>Justificatif de domicile</strong> (facture, quittance de loyer récente)</li>
                        <li><strong>Photo d'identité récente</strong> (format passeport, fond blanc)</li>
                        <li>Tout autre document pouvant être requis par l'ambassade</li>
                      </ul>
                    </div>
                  </div>
                ) : null}
                
                <ol className="space-y-3 text-blue-900 mt-4">
                  <li className="flex items-start space-x-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">1</span>
                    <div>
                      <p className="font-semibold">Rendez-vous au bureau de l'ambassade</p>
                      <p className="text-sm text-blue-700">
                        Présentez-vous aux heures d'ouverture avec tous les documents requis listés ci-dessus.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">2</span>
                    <div>
                      <p className="font-semibold">{isNoConsularCard ? 'Obtenez votre carte consulaire' : 'Munissez-vous de votre carte consulaire'}</p>
                      <p className="text-sm text-blue-700">
                        {isNoConsularCard 
                          ? 'Nos agents vérifieront vos documents et vous délivreront une <strong>carte consulaire</strong> avec un numéro unique au format SNXXXXXXX. Ce processus peut être effectué dans les meilleurs délais selon la disponibilité.'
                          : 'Apportez votre <strong>carte consulaire valide</strong> avec le numéro au format SNXXXXXXX pour vérification.'}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">3</span>
                    <div>
                      <p className="font-semibold">Enregistrement et activation</p>
                      <p className="text-sm text-blue-700">
                        Une fois votre carte consulaire obtenue et vérifiée, l'administrateur enregistrera votre numéro dans le système et activera votre compte. 
                        Vous recevrez une notification par email lorsque votre compte sera activé.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">4</span>
                    <div>
                      <p className="font-semibold">Accès complet aux services</p>
                      <p className="text-sm text-blue-700">
                        Une fois votre compte activé, vous pourrez accéder à tous les services en ligne de l'ambassade : 
                        prise de rendez-vous, suivi de demandes, paiements, etc.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Informations de l'ambassade */}
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center space-x-2">
                  <FiMapPin className="text-primary-500" size={20} />
                  <span>Informations de l'ambassade</span>
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">{embassy.name}</h4>
                    <div className="space-y-2 text-gray-700">
                      <p className="flex items-start space-x-2">
                        <FiMapPin className="text-primary-500 mt-1 flex-shrink-0" size={16} />
                        <span>{fullAddress}</span>
                      </p>
                      {embassy.phone_primary && (
                        <p className="flex items-center space-x-2">
                          <FiPhone className="text-primary-500 flex-shrink-0" size={16} />
                          <a href={`tel:${embassy.phone_primary}`} className="hover:text-primary-600 hover:underline">
                            {embassy.phone_primary}
                          </a>
                        </p>
                      )}
                      {embassy.phone_secondary && (
                        <p className="flex items-center space-x-2">
                          <FiPhone className="text-primary-500 flex-shrink-0" size={16} />
                          <a href={`tel:${embassy.phone_secondary}`} className="hover:text-primary-600 hover:underline">
                            {embassy.phone_secondary}
                          </a>
                        </p>
                      )}
                      {embassy.email && (
                        <p className="flex items-center space-x-2">
                          <FiMail className="text-primary-500 flex-shrink-0" size={16} />
                          <a href={`mailto:${embassy.email}`} className="hover:text-primary-600 hover:underline break-all">
                            {embassy.email}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    {embassy.opening_hours && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center space-x-2">
                          <FiClock className="text-primary-500" size={16} />
                          <span>Horaires d'ouverture</span>
                        </h4>
                        <p className="text-gray-700 whitespace-pre-line">
                          {embassy.opening_hours}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Message pour les utilisateurs sans compte */}
              {!user?.consular_card_number && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2 flex items-center space-x-2">
                    <FiCreditCard className="text-purple-600" size={18} />
                    <span>Vous n'avez pas encore de compte ?</span>
                  </h4>
                  <p className="text-purple-800 text-sm mb-2">
                    Si vous n'avez pas encore créé de compte sur cette plateforme, 
                    vous pouvez vous rendre directement à l'ambassade pour :
                  </p>
                  <ul className="list-disc list-inside text-purple-800 text-sm space-y-1 ml-2">
                    <li>Vous enregistrer et créer votre compte</li>
                    <li>Obtenir votre carte consulaire avec un numéro valide</li>
                    <li>Activer votre compte dans les plus brefs délais</li>
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="flex-1 btn-secondary py-3"
                >
                  Se déconnecter
                </button>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex-1 btn-primary py-3"
                >
                  {showDetails ? 'Réduire' : 'Voir les détails'}
                </button>
              </div>
            </div>
          )}

          {!showDetails && (
            <div className="p-6 text-center">
              <p className="text-gray-700 mb-4">
                Votre compte est en attente d'activation. 
                Veuillez vous rendre à l'ambassade avec votre carte consulaire.
              </p>
              <button
                onClick={() => setShowDetails(true)}
                className="btn-primary"
              >
                Voir les instructions complètes
              </button>
            </div>
          )}
        </div>

        {/* Informations supplémentaires */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Informations importantes</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Note importante :</strong> Pour disposer d'un compte actif sur cette plateforme, 
              vous devez obligatoirement posséder une <strong>carte consulaire valide</strong> avec un numéro au format SNXXXXXXX.
            </p>
            <p>
              Cette carte consulaire est délivrée par l'ambassade et sert d'identifiant unique pour tous vos services consulaires.
            </p>
            <p>
              Si vous avez des questions ou besoin d'assistance, n'hésitez pas à contacter l'ambassade aux coordonnées indiquées ci-dessus.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

