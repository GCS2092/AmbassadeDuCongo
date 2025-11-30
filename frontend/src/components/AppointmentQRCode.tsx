import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { FiDownload, FiPrinter, FiCheckCircle, FiMail, FiSend } from 'react-icons/fi'
import toast from 'react-hot-toast'

interface AppointmentQRCodeProps {
  appointmentId: number
  userInfo: {
    name: string
    email: string
  }
  appointmentDetails: {
    date: string
    time: string
    service: string
    office: string
  }
  onClose: () => void
}

export default function AppointmentQRCode({
  appointmentId,
  userInfo,
  appointmentDetails,
  onClose
}: AppointmentQRCodeProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(true)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    generateQRCode()
  }, [])

  const generateQRCode = async () => {
    try {
      setIsGenerating(true)
      
      // Créer les données complètes du QR code
      const qrData = {
        // Type et identifiants
        type: "CONSULAR_APPOINTMENT",
        appointmentId: appointmentId,
        timestamp: new Date().toISOString(),
        token: `APPT_${appointmentId}_${Date.now()}`,
        
        // Informations utilisateur complètes
        user: {
          name: userInfo.name,
          email: userInfo.email,
          // Ajouter d'autres infos si disponibles
        },
        
        // Détails du rendez-vous
        appointment: {
          date: appointmentDetails.date,
          time: appointmentDetails.time,
          service: appointmentDetails.service,
          office: appointmentDetails.office,
          status: "CONFIRMED"
        },
        
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
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Valide 7 jours
          message: "Présenter ce QR code à la réception de l'ambassade",
          arrivalTime: "Arriver 15 minutes avant l'heure du rendez-vous",
          requiredDocuments: "Pièce d'identité valide requise"
        }
      }

      // Générer le QR code
      const dataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      })

      setQrCodeDataUrl(dataUrl)
    } catch (error) {
      console.error('Erreur génération QR code:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a')
      link.download = `qr-code-rendez-vous-${appointmentId}.png`
      link.href = qrCodeDataUrl
      link.click()
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSendEmail = async () => {
    try {
      setIsSendingEmail(true)
      
      // Préparer les données pour l'email
      const emailData = {
        to: userInfo.email,
        subject: `QR Code de votre rendez-vous - ${appointmentDetails.service}`,
        appointmentId: appointmentId,
        userInfo: userInfo,
        appointmentDetails: appointmentDetails,
        qrCodeDataUrl: qrCodeDataUrl
      }
      
      // Appel à l'API pour envoyer l'email avec le QR code
      const response = await fetch('/api/notifications/send-appointment-qr/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(emailData)
      })
      
      if (response.ok) {
        setEmailSent(true)
        toast.success('QR code envoyé par email avec succès !')
      } else {
        throw new Error('Erreur lors de l\'envoi de l\'email')
      }
    } catch (error) {
      console.error('Erreur envoi email:', error)
      toast.error('Erreur lors de l\'envoi de l\'email')
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">QR Code de Rendez-vous</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success Message */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2">
              <FiCheckCircle className="text-green-500" size={20} />
              <p className="text-green-800 font-medium">
                Rendez-vous confirmé avec succès !
              </p>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Détails du rendez-vous</h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Nom :</span>
                <span className="font-medium">{userInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date :</span>
                <span className="font-medium">
                  {new Date(appointmentDetails.date).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Heure :</span>
                <span className="font-medium">{appointmentDetails.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Service :</span>
                <span className="font-medium">{appointmentDetails.service}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bureau :</span>
                <span className="font-medium">{appointmentDetails.office}</span>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="text-center space-y-4">
            <h4 className="font-semibold text-gray-900">Votre QR Code</h4>
            
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
                    alt="QR Code Rendez-vous"
                    className="border-2 border-gray-200 rounded-lg"
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>📱 Instructions :</strong> Présentez ce QR code à la réception de l'ambassade 
                    pour confirmer votre identité et accéder à votre rendez-vous.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {!isGenerating && (
            <div className="space-y-3">
              {/* Bouton d'envoi par email */}
              <button
                onClick={handleSendEmail}
                disabled={isSendingEmail || emailSent}
                className={`w-full flex items-center justify-center space-x-2 ${
                  emailSent 
                    ? 'btn-success' 
                    : isSendingEmail 
                      ? 'btn-secondary cursor-not-allowed' 
                      : 'btn-primary'
                }`}
              >
                {emailSent ? (
                  <>
                    <FiCheckCircle size={16} />
                    <span>Email envoyé !</span>
                  </>
                ) : isSendingEmail ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <FiSend size={16} />
                    <span>Envoyer par email</span>
                  </>
                )}
              </button>
              
              {/* Actions secondaires */}
              <div className="flex space-x-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                >
                  <FiDownload size={16} />
                  <span>Télécharger</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                >
                  <FiPrinter size={16} />
                  <span>Imprimer</span>
                </button>
              </div>
            </div>
          )}

          {/* Information */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h5 className="font-medium text-yellow-800 mb-2">💡 Informations importantes :</h5>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Arrivez 15 minutes avant votre rendez-vous</li>
              <li>• Apportez une pièce d'identité valide</li>
              <li>• Le QR code contient vos informations de rendez-vous</li>
              <li>• Gardez ce QR code jusqu'à votre visite</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full btn-primary"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
