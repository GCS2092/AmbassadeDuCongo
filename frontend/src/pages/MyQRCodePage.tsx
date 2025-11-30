import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { FiUser, FiDownload, FiMail, FiShield } from 'react-icons/fi'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import QRCode from 'qrcode'

interface UserQRData {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  embassy: {
    name: string
    address: string
    phone: string
    email: string
  }
  generatedAt: string
  validUntil: string
  purpose: string
}

export default function MyQRCodePage() {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [qrData, setQrData] = useState<UserQRData | null>(null)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    if (user) {
      generateUserQRCode()
    }
  }, [user])

  const generateUserQRCode = async () => {
    if (!user) return

    setIsGenerating(true)
    try {
      // Préparer les données du QR code utilisateur
      const userQRData: UserQRData = {
        user: {
          id: user.id.toString(),
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role: user.role
        },
        embassy: {
          name: "Ambassade de la République du Congo - Sénégal",
          address: "Stèle Mermoz, Pyrotechnie, P.O. Box 5243, Dakar, Sénégal",
          phone: "+221 824 8398",
          email: "contact@ambassade-congo.sn"
        },
        generatedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Valide 1 an
        purpose: "Identification utilisateur - Accès aux services consulaires"
      }

      // Générer le QR code
      const qrCodeString = JSON.stringify(userQRData, null, 2)
      const qrCodeDataUrl = await QRCode.toDataURL(qrCodeString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      })

      setQrCodeDataUrl(qrCodeDataUrl)
      setQrData(userQRData)
      
    } catch (error) {
      console.error('Erreur lors de la génération du QR code:', error)
      toast.error('Erreur lors de la génération du QR code')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return

    const link = document.createElement('a')
    link.download = `qr-code-${user?.first_name}-${user?.last_name}.png`
    link.href = qrCodeDataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('QR code téléchargé')
  }

  const sendQRCodeByEmail = async () => {
    if (!qrCodeDataUrl || !qrData) return

    try {
      const response = await fetch('/api/notifications/send-user-qr/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          to: user?.email,
          subject: 'Votre QR Code personnel - Ambassade du Congo',
          qr_code_data_url: qrCodeDataUrl,
          user_data: qrData
        })
      })

      if (response.ok) {
        toast.success('QR code envoyé par email')
      } else {
        toast.error('Erreur lors de l\'envoi de l\'email')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de l\'envoi de l\'email')
    }
  }

  if (!user) {
    return <LoadingSpinner text="Chargement..." />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <FiShield className="inline-block mr-3 text-blue-600" />
            Mon QR Code personnel
          </h1>
          <p className="text-gray-600">
            Votre identifiant numérique pour accéder aux services consulaires
          </p>
        </div>

        {/* QR Code Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="text-center">
            {isGenerating ? (
              <div className="py-12">
                <LoadingSpinner text="Génération du QR code..." />
              </div>
            ) : qrCodeDataUrl ? (
              <div>
                <div className="mb-6">
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code personnel"
                    className="mx-auto border-2 border-gray-200 rounded-lg"
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={downloadQRCode}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                    >
                      <FiDownload size={20} />
                      <span>Télécharger</span>
                    </button>
                    
                    <button
                      onClick={sendQRCodeByEmail}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                    >
                      <FiMail size={20} />
                      <span>Envoyer par email</span>
                    </button>
                  </div>
                  
                  <button
                    onClick={generateUserQRCode}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 flex items-center space-x-2 mx-auto"
                  >
                    <FiShield size={20} />
                    <span>Régénérer</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12">
                <p className="text-gray-500 mb-4">QR code non généré</p>
                <button
                  onClick={generateUserQRCode}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  Générer mon QR code
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Informations utilisateur */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FiUser className="mr-2 text-blue-600" />
            Mes informations
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Nom complet</label>
                <p className="text-lg">{user.first_name} {user.last_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-lg">{user.email}</p>
              </div>
              {user.phone_number && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Téléphone</label>
                  <p className="text-lg">{user.phone_number}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Statut du compte</label>
                <p className="text-lg">
                  {user.is_verified ? (
                    <span className="text-green-600">✓ Compte vérifié</span>
                  ) : (
                    <span className="text-yellow-600">En attente de vérification</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions d'utilisation */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <FiShield className="mr-2 text-blue-600" />
            Comment utiliser votre QR code
          </h3>
          
          <div className="space-y-3 text-gray-700">
            <p>
              <strong>1. Identification :</strong> Votre QR code contient vos informations d'identification pour accéder aux services consulaires.
            </p>
            <p>
              <strong>2. Rendez-vous :</strong> Présentez ce QR code lors de vos rendez-vous à l'ambassade pour une vérification rapide de votre identité.
            </p>
            <p>
              <strong>3. Sécurité :</strong> Ce QR code est personnel et ne doit pas être partagé avec d'autres personnes.
            </p>
            <p>
              <strong>4. Validité :</strong> Votre QR code est valide pendant 1 an et peut être régénéré à tout moment.
            </p>
          </div>
        </div>

        {/* Informations de l'ambassade */}
        {qrData && (
          <div className="bg-gray-50 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold mb-3">Informations de l'ambassade</h3>
            <div className="space-y-2 text-gray-700">
              <p><strong>Nom :</strong> {qrData.embassy.name}</p>
              <p><strong>Adresse :</strong> {qrData.embassy.address}</p>
              <p><strong>Téléphone :</strong> {qrData.embassy.phone}</p>
              <p><strong>Email :</strong> {qrData.embassy.email}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
