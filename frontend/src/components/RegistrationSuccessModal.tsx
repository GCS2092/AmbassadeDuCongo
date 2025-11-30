/**
 * Modal affichée après l'inscription pour informer l'utilisateur
 * du statut de son compte et des prochaines étapes
 */
import React from 'react'
import { FiAlertCircle, FiCheckCircle, FiX, FiMapPin, FiCreditCard, FiInfo } from 'react-icons/fi'

interface RegistrationSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  hasValidConsularCard: boolean
  consularCardNumber?: string
}

export default function RegistrationSuccessModal({
  isOpen,
  onClose,
  hasValidConsularCard,
  consularCardNumber
}: RegistrationSuccessModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className={`p-6 rounded-t-lg ${hasValidConsularCard ? 'bg-green-500' : 'bg-orange-500'} text-white`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              {hasValidConsularCard ? (
                <FiCheckCircle className="text-white mt-1 flex-shrink-0" size={32} />
              ) : (
                <FiAlertCircle className="text-white mt-1 flex-shrink-0" size={32} />
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">
                  {hasValidConsularCard ? 'Inscription réussie' : 'Compte en attente de validation'}
                </h2>
                <p className="text-white/90">
                  {hasValidConsularCard 
                    ? 'Votre compte a été créé avec succès. Vérifiez votre email pour activer votre compte.'
                    : 'Votre compte a été créé mais reste en veille jusqu\'à validation de votre identité.'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-white/80 transition-colors p-2"
              aria-label="Fermer"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!hasValidConsularCard ? (
            <>
              {/* Message principal pour compte en attente */}
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                <div className="flex items-start space-x-3">
                  <FiInfo className="text-orange-600 mt-1 flex-shrink-0" size={20} />
                  <div className="flex-1">
                    <h3 className="font-bold text-orange-900 mb-2">
                      Votre compte est temporairement désactivé
                    </h3>
                    <p className="text-orange-800 text-sm mb-3">
                      Votre compte a été créé avec succès, mais il reste <strong>en veille</strong> jusqu'à ce que votre identité soit confirmée via votre numéro de carte consulaire. 
                      <strong>L'accès aux fonctionnalités est temporairement bloqué</strong> jusqu'à l'obtention et l'enregistrement de votre carte consulaire.
                    </p>
                    {consularCardNumber && (
                      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mt-3">
                        <p className="text-yellow-900 text-sm font-semibold mb-1">
                          ⚠️ Numéro de carte consulaire invalide ou non trouvé
                        </p>
                        <p className="text-yellow-800 text-sm mb-2">
                          Le numéro <strong className="font-mono">{consularCardNumber}</strong> que vous avez fourni n'a pas pu être validé dans notre système.
                        </p>
                        <p className="text-yellow-800 text-sm">
                          Cela peut signifier que :
                        </p>
                        <ul className="list-disc list-inside text-yellow-800 text-sm mt-2 space-y-1 ml-2">
                          <li>Le numéro n'existe pas dans notre base de données</li>
                          <li>Le numéro a été mal saisi</li>
                          <li>Vous n'avez pas encore de carte consulaire enregistrée</li>
                        </ul>
                      </div>
                    )}
                    {!consularCardNumber && (
                      <div className="bg-red-50 border border-red-300 rounded-lg p-3 mt-3">
                        <p className="text-red-900 text-sm font-semibold mb-1">
                          ⚠️ Numéro de carte consulaire manquant
                        </p>
                        <p className="text-red-800 text-sm">
                          Vous n'avez pas fourni de numéro de carte consulaire lors de l'inscription.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-bold text-blue-900 text-lg mb-4 flex items-center space-x-2">
                  <FiMapPin className="text-blue-600" size={20} />
                  <span>Comment activer votre compte ?</span>
                </h3>
                <ol className="space-y-3 text-blue-900">
                  <li className="flex items-start space-x-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">1</span>
                    <div>
                      <p className="font-semibold">Rendez-vous à l'ambassade</p>
                      <p className="text-sm text-blue-700">
                        Présentez-vous aux heures d'ouverture avec une pièce d'identité valide.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">2</span>
                    <div>
                      <p className="font-semibold">Obtenez ou vérifiez votre carte consulaire</p>
                      <p className="text-sm text-blue-700 mb-2">
                        Si vous n'avez pas encore de carte consulaire, vous pourrez en obtenir une lors de votre visite. 
                        Si vous en avez déjà une, apportez-la pour vérification.
                      </p>
                      {!consularCardNumber && (
                        <div className="bg-white border border-blue-300 rounded-lg p-3 mt-2">
                          <p className="text-blue-900 text-xs font-semibold mb-2">📋 Documents à apporter pour obtenir votre carte consulaire :</p>
                          <ul className="text-blue-800 text-xs space-y-1 list-disc list-inside">
                            <li>Pièce d'identité valide (passeport, carte d'identité nationale)</li>
                            <li>Preuve de nationalité (acte de naissance, certificat de nationalité)</li>
                            <li>Justificatif de domicile (facture, quittance de loyer récente)</li>
                            <li>Photo d'identité récente (format passeport, fond blanc)</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">3</span>
                    <div>
                      <p className="font-semibold">Activation rapide</p>
                      <p className="text-sm text-blue-700">
                        Une fois votre identité vérifiée et votre carte consulaire validée, 
                        votre compte sera activé dans les plus brefs délais par l'administration.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Avertissement */}
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <div className="flex items-start space-x-3">
                  <FiCreditCard className="text-red-600 mt-1 flex-shrink-0" size={20} />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900 mb-2">
                      ⚠️ Falsification strictement interdite
                    </h4>
                    <p className="text-red-800 text-sm">
                      Les numéros de carte consulaire sont <strong>uniques</strong> et vérifiés dans notre système. 
                      Toute tentative de falsification ou d'utilisation d'un numéro non valide entraînera la suspension définitive de votre compte 
                      et peut faire l'objet de poursuites judiciaires. Ne tentez pas de contourner cette procédure.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Message pour compte avec numéro valide */}
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                <div className="flex items-start space-x-3">
                  <FiCheckCircle className="text-green-600 mt-1 flex-shrink-0" size={20} />
                  <div className="flex-1">
                    <h3 className="font-bold text-green-900 mb-2">
                      Numéro de carte consulaire validé
                    </h3>
                    <p className="text-green-800 text-sm">
                      Votre numéro de carte consulaire a été validé. Vérifiez votre email pour activer votre compte.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Informations générales */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Informations importantes</h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start space-x-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Votre compte restera en veille jusqu'à validation de votre identité par l'ambassade.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Vous devez posséder une carte consulaire valide avec un numéro unique pour activer votre compte.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>L'activation se fait uniquement en vous présentant physiquement à l'ambassade avec les documents requis.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full btn-primary py-3"
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  )
}

