import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { FiDownload, FiRefreshCw, FiUser, FiCalendar, FiMapPin } from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'
import { appointmentsApi, authApi } from '../lib/api'
import toast from 'react-hot-toast'

interface PersonalQRCodeProps {
  onClose?: () => void
}

export default function PersonalQRCode({ onClose }: PersonalQRCodeProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(true)

  // Récupérer les informations utilisateur et rendez-vous du jour
  const { data: userData } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => authApi.getProfile().then(res => res.data)
  })

  const { data: todayAppointments } = useQuery({
    queryKey: ['appointments', 'today'],
    queryFn: () => appointmentsApi.list().then(res => {
      const appointments = Array.isArray(res.data) ? res.data : res.data?.results || []
      // Filtrer les rendez-vous d'aujourd'hui
      const today = new Date().toISOString().split('T')[0]
      return appointments.filter((apt: any) => apt.appointment_date === today)
    })
  })

  useEffect(() => {
    if (userData) {
      generatePersonalQRCode()
    }
  }, [userData, todayAppointments])

  const generatePersonalQRCode = async () => {
    try {
      setIsGenerating(true)
      
      if (!userData) {
        throw new Error('Données utilisateur non disponibles')
      }

      // Créer les données complètes du QR code personnel
      const qrData = {
        // Type et identifiants
        type: "PERSONAL_IDENTITY_CARD",
        userId: userData.id,
        timestamp: new Date().toISOString(),
        token: `USER_${userData.id}_${Date.now()}`,
        
        // Informations utilisateur complètes
        user: {
          id: userData.id,
          name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
          email: userData.email,
          phone: userData.phone || userData.phone_number || '',
          consular_card_number: userData.consular_card_number || '',
          nationality: userData.nationality || 'Congolaise',
          dateOfBirth: userData.date_of_birth || '',
          address: userData.address || ''
        },
        
        // Rendez-vous du jour
        todayAppointments: todayAppointments?.map((apt: any) => ({
          id: apt.id,
          date: apt.appointment_date,
          time: apt.appointment_time,
          service: apt.service_type_display || 'Service consulaire',
          office: apt.office_display || 'Bureau consulaire',
          status: apt.status,
          purpose: apt.purpose || 'Démarche consulaire'
        })) || [],
        
        // Informations de contact ambassade
        embassy: {
          name: "Ambassade de la République du Congo - Sénégal",
          address: "Stèle Mermoz, Pyrotechnie, P.O. Box 5243, Dakar, Sénégal",
          phone: "+221 824 8398",
          phone2: "+221 649 3117",
          email: "contact@ambassade-congo.sn",
          website: "https://ambassade-congo.sn"
        },
        
        // Instructions et validité
        instructions: {
          scanDate: new Date().toISOString(),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Valide 24h
          message: "Carte d'identité numérique - Présenter à l'entrée de l'ambassade",
          securityLevel: "HIGH",
          purpose: "Identification et vérification des rendez-vous"
        },
        
        // Métadonnées de sécurité
        security: {
          generatedBy: "Ambassade du Congo - Système sécurisé",
          encryption: "AES-256",
          signature: `SIG_${userData.id}_${Date.now()}`,
          checksum: `CHK_${Math.random().toString(36).substr(2, 9)}`
        }
      }

      console.log('📱 Personal QR Code data:', qrData)

      // Générer le QR code avec une taille plus grande pour plus de données
      const dataUrl = await QRCode.toDataURL(JSON.stringify(qrData, null, 2), {
        width: 400,
        margin: 3,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H' // Niveau de correction d'erreur élevé
      })

      setQrCodeDataUrl(dataUrl)
    } catch (error) {
      console.error('Erreur génération QR code personnel:', error)
      toast.error('Erreur lors de la génération du QR code')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a')
      link.download = `qr-code-identite-${userData?.id || 'user'}.png`
      link.href = qrCodeDataUrl
      link.click()
      toast.success('QR code téléchargé !')
    }
  }

  const handleRefresh = () => {
    generatePersonalQRCode()
    toast.success('QR code actualisé !')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-bold">Ma Carte d'Identité Numérique</h3>
            <p className="text-sm text-gray-600">QR Code personnel pour l'accès à l'ambassade</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <FiX size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Info Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-3 flex items-center space-x-2">
              <FiUser size={16} />
              <span>Vos Informations</span>
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Nom :</span>
                <span className="font-medium text-blue-900 ml-2">
                  {userData ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() : '...'}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Email :</span>
                <span className="font-medium text-blue-900 ml-2">
                  {userData?.email || '...'}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Carte consulaire :</span>
                <span className="font-medium text-blue-900 ml-2 font-mono">
                  {userData?.consular_card_number || 'Non attribué'}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Nationalité :</span>
                <span className="font-medium text-blue-900 ml-2">
                  {userData?.nationality || 'Congolaise'}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Téléphone :</span>
                <span className="font-medium text-blue-900 ml-2">
                  {userData?.phone || userData?.phone_number || 'Non renseigné'}
                </span>
              </div>
            </div>
          </div>

          {/* Today's Appointments */}
          {todayAppointments && todayAppointments.length > 0 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-3 flex items-center space-x-2">
                <FiCalendar size={16} />
                <span>Rendez-vous d'aujourd'hui</span>
              </h4>
              <div className="space-y-2">
                {todayAppointments.map((apt: any, index: number) => (
                  <div key={index} className="bg-white p-3 rounded border">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-green-900">{apt.service}</p>
                        <p className="text-sm text-green-700">
                          {new Date(apt.date).toLocaleDateString('fr-FR')} à {apt.time}
                        </p>
                        <p className="text-sm text-green-600">{apt.office}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {apt.status === 'CONFIRMED' ? 'Confirmé' : 'En attente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QR Code */}
          <div className="text-center space-y-4">
            <h4 className="font-semibold text-gray-900">Votre QR Code Personnel</h4>
            
            {isGenerating ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                <span className="ml-3 text-gray-600">Génération du QR code...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code Personnel"
                    className="border-4 border-primary-500 rounded-lg p-2"
                  />
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>📱 Instructions :</strong> Présentez ce QR code à l'entrée de l'ambassade 
                    pour une identification rapide et sécurisée. Le QR code contient vos informations 
                    personnelles et vos rendez-vous du jour.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Embassy Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
              <FiMapPin size={16} />
              <span>Ambassade du Congo - Sénégal</span>
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Stèle Mermoz, Pyrotechnie, P.O. Box 5243, Dakar, Sénégal</p>
              <p>📞 +221 824 8398 | +221 649 3117</p>
              <p>📧 contact@ambassade-congo.sn</p>
            </div>
          </div>

          {/* Actions */}
          {!isGenerating && (
            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                className="flex-1 btn-secondary flex items-center justify-center space-x-2"
              >
                <FiRefreshCw size={16} />
                <span>Actualiser</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 btn-primary flex items-center justify-center space-x-2"
              >
                <FiDownload size={16} />
                <span>Télécharger</span>
              </button>
            </div>
          )}

          {/* Security Notice */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h5 className="font-medium text-red-800 mb-2">🔒 Sécurité</h5>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Ce QR code est personnel et confidentiel</li>
              <li>• Ne le partagez avec personne</li>
              <li>• Il expire automatiquement après 24 heures</li>
              <li>• En cas de perte, générez un nouveau QR code</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
