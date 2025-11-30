import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCamera, FiUser, FiCalendar, FiMapPin, FiShield, FiAlertTriangle, FiInfo } from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'
import LoadingSpinner from '../components/LoadingSpinner'
import QRScanResult from '../components/QRScanResult'
import QRCodeScanner from '../components/QRCodeScanner'
import toast from 'react-hot-toast'
import { api } from '../lib/api'

interface QRCodeData {
  appointment: {
    id: string
    date: string
    time: string
    service: string
    status: string
  }
  user: {
    name: string
    email: string
  }
  embassy: {
    name: string
    address: string
    phone: string
  }
  instructions: {
    scanDate: string
    validUntil: string
    message: string
    arrivalTime: string
    requiredDocuments: string
  }
}

export default function SecurityQRScannerPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [scannedData, setScannedData] = useState<QRCodeData | null>(null)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [scanHistory, setScanHistory] = useState<QRCodeData[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  // Fonction pour scanner un QR code réel
  const handleRealQRScan = async (qrData: string) => {
    setIsProcessing(true)
    try {
      // Nettoyer et valider les données QR
      let cleanedQRData = qrData.trim()
      
      // Vérifier si c'est un JSON valide
      let parsedData
      try {
        parsedData = JSON.parse(cleanedQRData)
        console.log('QR code JSON valide:', parsedData)
      } catch (parseError) {
        // Si ce n'est pas du JSON, traiter comme une chaîne simple
        console.log('QR code non-JSON détecté:', cleanedQRData)
        parsedData = { raw_data: cleanedQRData, type: 'raw' }
      }
      
      const response = await api.post('/core/vigile/qr-scan/scan_qr_code/', {
        qr_data: cleanedQRData,
        parsed_data: parsedData
      })
      
      if (response.data.success) {
        const scanData = response.data.data
        
        // Adapter les données selon le type
        let formattedData: QRCodeData
        if (response.data.type === 'appointment') {
          formattedData = {
            appointment: {
              id: scanData.appointment_id,
              date: scanData.appointment.date,
              time: scanData.appointment.time,
              service: scanData.appointment.service,
              status: scanData.appointment.status
            },
            user: {
              name: `${scanData.user.first_name} ${scanData.user.last_name}`,
              email: scanData.user.email,
              consular_card_number: scanData.user.consular_card_number || ''
            },
            access: {
              granted: scanData.access_granted,
              reason: scanData.access_granted ? 'Rendez-vous confirmé' : 'Rendez-vous non confirmé'
            }
          }
        } else if (response.data.type === 'general') {
          // QR code général
          formattedData = {
            general: {
              raw_data: scanData.raw_data,
              scanned_at: scanData.scanned_at,
              scanned_by: scanData.scanned_by
            },
            access: {
              granted: scanData.access_granted,
              reason: scanData.access_granted ? 'Accès général autorisé' : 'Accès refusé'
            }
          }
        } else {
          // QR code personnel
          formattedData = {
            user: {
              name: `${scanData.user.first_name} ${scanData.user.last_name}`,
              email: scanData.user.email,
              consular_card_number: scanData.user.consular_card_number || ''
            },
            access: {
              granted: scanData.access_granted,
              reason: scanData.access_granted ? 'Utilisateur vérifié' : 'Utilisateur non vérifié'
            }
          }
        }
        
        setScannedData(formattedData)
        setIsValid(formattedData.access.granted)
        
        // Ajouter à l'historique
        setScanHistory(prev => [formattedData, ...prev.slice(0, 9)])
        
        toast.success('QR code scanné avec succès')
      } else {
        toast.error('QR code invalide')
        setScannedData(null)
        setIsValid(false)
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur lors du scan:', error)
      }
      toast.error(error.response?.data?.error || 'Erreur lors du scan du QR code')
      setScannedData(null)
      setIsValid(false)
    } finally {
      setIsProcessing(false)
    }
  }

  // Vérifier que l'utilisateur a le rôle de vigile
  useEffect(() => {
    if (!user || user.role !== 'VIGILE') {
      toast.error('Accès non autorisé - Rôle de vigile requis')
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleScan = async (qrData: string) => {
    try {
      setIsScanning(true)
      
      // Parser les données du QR code
      const parsedData: QRCodeData = JSON.parse(qrData)
      
      // Valider les données
      const isValidData = validateQRData(parsedData)
      
      setScannedData(parsedData)
      setIsValid(isValidData)
      
      // Ajouter à l'historique
      setScanHistory(prev => [parsedData, ...prev.slice(0, 9)]) // Garder les 10 derniers
      
      // Enregistrer le scan dans l'historique
      await recordSecurityScan(parsedData, isValidData)
      
      if (isValidData) {
        toast.success('QR Code valide - Accès autorisé')
      } else {
        toast.error('QR Code invalide ou expiré')
      }
      
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur lors du scan:', error)
      }
      toast.error('Erreur lors du scan du QR code')
      setIsValid(false)
    } finally {
      setIsScanning(false)
    }
  }

  const validateQRData = (data: QRCodeData): boolean => {
    try {
      // Vérifier la structure des données
      if (!data.appointment || !data.user || !data.embassy) {
        return false
      }
      
      // Vérifier la date de validité
      const validUntil = new Date(data.instructions.validUntil)
      const now = new Date()
      
      if (now > validUntil) {
        return false
      }
      
      // Vérifier que c'est pour aujourd'hui
      const appointmentDate = new Date(data.appointment.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      appointmentDate.setHours(0, 0, 0, 0)
      
      if (appointmentDate.getTime() !== today.getTime()) {
        return false
      }
      
      return true
    } catch (error) {
      return false
    }
  }

  const recordSecurityScan = async (data: QRCodeData, isValid: boolean) => {
    try {
      // Envoyer les données du scan au backend
      const response = await fetch('/api/security/scan-record/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          qr_data: data,
          is_valid: isValid,
          scanned_by: user?.id,
          scan_timestamp: new Date().toISOString()
        })
      })
      
      if (!response.ok) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Erreur lors de l\'enregistrement du scan')
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur lors de l\'enregistrement:', error)
      }
    }
  }

  const resetScan = () => {
    setScannedData(null)
    setIsValid(null)
  }

  const testCameraPermissions = async () => {
    try {
      // Vérifier si l'API getUserMedia est disponible
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Votre navigateur ne supporte pas l\'accès à la caméra')
        return
      }

      // Demander l'accès à la caméra
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Caméra arrière sur mobile
        } 
      })
      
      // Arrêter le stream immédiatement (c'était juste un test)
      stream.getTracks().forEach(track => track.stop())
      
      toast.success('✅ Caméra accessible ! Vous pouvez maintenant scanner des QR codes.')
      
    } catch (error: any) {
      console.error('Erreur caméra:', error)
      
      let errorMessage = 'Erreur d\'accès à la caméra'
      
      if (error.name === 'NotAllowedError') {
        errorMessage = '❌ Accès à la caméra refusé. Autorisez l\'accès dans les paramètres du navigateur.'
      } else if (error.name === 'NotFoundError') {
        errorMessage = '❌ Aucune caméra trouvée sur cet appareil.'
      } else if (error.name === 'NotSupportedError') {
        errorMessage = '❌ Ce navigateur ne supporte pas l\'accès à la caméra.'
      } else if (error.name === 'NotReadableError') {
        errorMessage = '❌ La caméra est utilisée par une autre application.'
      }
      
      toast.error(errorMessage)
    }
  }

  if (!user || user.role !== 'VIGILE') {
    return <LoadingSpinner text="Vérification des autorisations..." />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <FiShield className="inline-block mr-3 text-blue-600" />
            Scanner de sécurité
          </h1>
          <p className="text-gray-600">
            Scannez les QR codes des visiteurs pour vérifier leur accès
          </p>
        </div>

        {/* Scanner Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Scanner QR Code</h2>
          
          {/* Instructions d'autorisation caméra */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <FiInfo className="text-blue-600 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Autorisation caméra requise</h3>
                <p className="text-sm text-blue-700 mb-2">
                  Pour scanner un QR code, votre navigateur doit accéder à la caméra.
                </p>
                <div className="text-sm text-blue-600">
                  <p><strong>Si la caméra ne fonctionne pas :</strong></p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Autorisez l'accès à la caméra quand demandé</li>
                    <li>Utilisez HTTPS au lieu de HTTP</li>
                    <li>Essayez un autre navigateur (Chrome recommandé)</li>
                    <li>Utilisez la saisie manuelle ci-dessous</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center space-y-4">
            <div className="flex justify-center space-x-4">
              <button
                onClick={testCameraPermissions}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Tester la caméra
              </button>
              
              <button
                onClick={() => setIsScannerOpen(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <FiCamera className="inline-block mr-2" />
                Scanner QR Code
              </button>
            </div>
            
            <p className="text-sm text-gray-500">
              Utilisez le scanner QR pour activer la caméra et scanner des codes
            </p>
          </div>

          {/* Zone de scan simulée */}
          {isScanning && (
            <div className="mt-6 p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <FiCamera size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Pointez la caméra vers le QR code</p>
              
              {/* Simulation pour les tests */}
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  Test avec QR code réel
                </p>
                <button
                  onClick={() => {
                    // QR code de test pour rendez-vous
                    const testQRData = JSON.stringify({
                      type: 'appointment',
                      appointment_id: 1
                    })
                    handleRealQRScan(testQRData)
                  }}
                  disabled={isProcessing}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {isProcessing ? 'Scan en cours...' : 'Tester QR Rendez-vous'}
                </button>
                
                <button
                  onClick={() => {
                    // QR code de test pour utilisateur
                    const testQRData = JSON.stringify({
                      type: 'user',
                      user_id: 1
                    })
                    handleRealQRScan(testQRData)
                  }}
                  disabled={isProcessing}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 mt-2"
                >
                  {isProcessing ? 'Scan en cours...' : 'Tester QR Utilisateur'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Résultat du scan avec interface élégante */}
        {scannedData && (
          <QRScanResult
            data={JSON.stringify({
              type: scannedData.appointment ? 'appointment' : 'user',
              ...scannedData,
              access_granted: isValid || false,
              user: scannedData.user ? {
                ...scannedData.user,
                consular_card_number: scannedData.user.consular_card_number || ''
              } : undefined
            })}
            onClose={() => {
              setScannedData(null)
              setIsValid(null)
            }}
            onRescan={() => {
              setScannedData(null)
              setIsValid(null)
            }}
          />
        )}

        {/* Historique des scans */}
        {scanHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Historique des scans</h2>
            <div className="space-y-3">
              {scanHistory.slice(0, 5).map((scan, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      validateQRData(scan) ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="font-medium">{scan.user.name}</p>
                      <p className="text-sm text-gray-600">
                        {scan.appointment.service} - {new Date(scan.appointment.date).toLocaleDateString('fr-FR')} {scan.appointment.time}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    validateQRData(scan) 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {validateQRData(scan) ? 'Valide' : 'Invalide'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scanner QR Code */}
        <QRCodeScanner
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScan={handleRealQRScan}
        />
      </div>
    </div>
  )
}