/**
 * Composant d'affichage élégant des résultats de scan QR
 */
import { useState, useEffect } from 'react'
import { 
  FiCheckCircle, FiCopy, FiDownload, FiEye, FiEyeOff, 
  FiUser, FiCalendar, FiMapPin, FiFileText, FiShield,
  FiAlertCircle, FiInfo, FiClock, FiTag
} from 'react-icons/fi'
import toast from 'react-hot-toast'

interface QRScanResultProps {
  data: string
  onClose: () => void
  onRescan?: () => void
}

interface ParsedQRData {
  type: 'appointment' | 'user' | 'document' | 'url' | 'text' | 'json' | 'unknown'
  title: string
  description: string
  icon: React.ReactNode
  color: string
  details: Record<string, any>
  rawData: string
}

export default function QRScanResult({ data, onClose, onRescan }: QRScanResultProps) {
  const [parsedData, setParsedData] = useState<ParsedQRData | null>(null)
  const [showRawData, setShowRawData] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    parseQRData(data)
  }, [data])

  const parseQRData = (rawData: string): ParsedQRData => {
    try {
      // Essayer de parser comme JSON
      const jsonData = JSON.parse(rawData)
      
      // Vérifier le type de données basé sur la structure
      if (jsonData.type === 'service' || jsonData.service_id) {
        return {
          type: 'service',
          title: 'Service Consulaire',
          description: `${jsonData.service_name || 'Service'} - ${jsonData.category_display || 'Catégorie'}`,
          icon: <FiFileText className="text-indigo-500" size={24} />,
          color: 'bg-indigo-50 border-indigo-200 text-indigo-800',
          details: jsonData,
          rawData
        }
      } else if (jsonData.appointment_id || jsonData.appointmentId) {
        return {
          type: 'appointment',
          title: 'Rendez-vous',
          description: `Rendez-vous du ${jsonData.date || 'date inconnue'}`,
          icon: <FiCalendar className="text-blue-500" size={24} />,
          color: 'bg-blue-50 border-blue-200 text-blue-800',
          details: jsonData,
          rawData
        }
      } else if (jsonData.user_id || jsonData.userId || jsonData.email) {
        return {
          type: 'user',
          title: 'Utilisateur',
          description: `${jsonData.first_name || ''} ${jsonData.last_name || ''}`.trim() || jsonData.email || 'Utilisateur',
          icon: <FiUser className="text-green-500" size={24} />,
          color: 'bg-green-50 border-green-200 text-green-800',
          details: jsonData,
          rawData
        }
      } else if (jsonData.document_id || jsonData.documentId || jsonData.document_type) {
        return {
          type: 'document',
          title: 'Document',
          description: `Document ${jsonData.document_type || 'inconnu'}`,
          icon: <FiFileText className="text-purple-500" size={24} />,
          color: 'bg-purple-50 border-purple-200 text-purple-800',
          details: jsonData,
          rawData
        }
      } else {
        return {
          type: 'json',
          title: 'Données JSON',
          description: 'Données structurées détectées',
          icon: <FiTag className="text-orange-500" size={24} />,
          color: 'bg-orange-50 border-orange-200 text-orange-800',
          details: jsonData,
          rawData
        }
      }
    } catch {
      // Vérifier si c'est une URL
      if (rawData.startsWith('http://') || rawData.startsWith('https://')) {
        return {
          type: 'url',
          title: 'Lien Web',
          description: rawData,
          icon: <FiMapPin className="text-indigo-500" size={24} />,
          color: 'bg-indigo-50 border-indigo-200 text-indigo-800',
          details: { url: rawData },
          rawData
        }
      }
      
      // Texte simple
      return {
        type: 'text',
        title: 'Texte',
        description: rawData.length > 100 ? rawData.substring(0, 100) + '...' : rawData,
        icon: <FiFileText className="text-gray-500" size={24} />,
        color: 'bg-gray-50 border-gray-200 text-gray-800',
        details: { text: rawData },
        rawData
      }
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(parsedData?.rawData || data)
      setIsCopied(true)
      toast.success('Données copiées dans le presse-papiers')
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Erreur copie:', error)
      toast.error('Impossible de copier les données')
    }
  }

  const downloadData = () => {
    const blob = new Blob([parsedData?.rawData || data], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qr-scan-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Données téléchargées')
  }

  const formatValue = (key: string, value: any): string => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2)
    }
    if (typeof value === 'boolean') {
      return value ? 'Oui' : 'Non'
    }
    if (typeof value === 'string' && value.includes('T') && !isNaN(Date.parse(value))) {
      return new Date(value).toLocaleString('fr-FR')
    }
    return String(value)
  }

  if (!parsedData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {parsedData.icon}
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {parsedData.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {parsedData.description}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowRawData(!showRawData)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title={showRawData ? 'Masquer les détails' : 'Afficher les détails'}
              >
                {showRawData ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
              <button
                onClick={copyToClipboard}
                className={`p-2 rounded-lg transition-colors ${
                  isCopied 
                    ? 'bg-green-100 text-green-600' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
                title="Copier les données"
              >
                <FiCopy size={20} />
              </button>
              <button
                onClick={downloadData}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="Télécharger"
              >
                <FiDownload size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {showRawData ? (
            /* Vue détaillée */
            <div className="space-y-6">
              {/* Affichage spécifique pour les services */}
              {parsedData.type === 'service' && (
                <div className={`p-6 rounded-lg border-2 ${parsedData.color}`}>
                  <div className="flex items-center space-x-2 mb-4">
                    <FiFileText size={20} />
                    <span className="font-semibold text-lg">Service Consulaire</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Informations de base */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Informations du service</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Nom:</span>
                            <span className="text-sm font-medium">{parsedData.details.service_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Catégorie:</span>
                            <span className="text-sm font-medium">{parsedData.details.category_display}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">ID Service:</span>
                            <span className="text-sm font-mono text-gray-500">{parsedData.details.service_id}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tarification et délais */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Tarification & Délais</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Prix:</span>
                            <span className="text-sm font-bold text-green-600">{parsedData.details.base_fee} XOF</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Délai:</span>
                            <span className="text-sm font-medium">{parsedData.details.processing_time_days} jour{parsedData.details.processing_time_days > 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Rendez-vous:</span>
                            <span className={`text-sm font-medium ${parsedData.details.requires_appointment ? 'text-orange-600' : 'text-green-600'}`}>
                              {parsedData.details.requires_appointment ? 'Obligatoire' : 'Non requis'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {parsedData.details.description && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                      <p className="text-sm text-gray-600">{parsedData.details.description}</p>
                    </div>
                  )}

                  {/* Informations de l'ambassade */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <FiShield size={16} />
                      <span>{parsedData.details.embassy}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Scanné le {new Date(parsedData.details.timestamp).toLocaleString('fr-FR')}
                    </div>
                  </div>
                </div>
              )}

              {/* Informations principales pour autres types */}
              {parsedData.type !== 'service' && (
                <div className={`p-4 rounded-lg border-2 ${parsedData.color}`}>
                  <div className="flex items-center space-x-2 mb-3">
                    <FiInfo size={16} />
                    <span className="font-medium">Informations principales</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Afficher le numéro consulaire en priorité si présent */}
                    {parsedData.details.user?.consular_card_number && (
                      <div className="md:col-span-2 space-y-1 bg-primary-50 p-3 rounded-lg border border-primary-200">
                        <span className="text-sm font-semibold text-primary-700">
                          Numéro de carte consulaire:
                        </span>
                        <p className="text-lg font-mono font-bold text-primary-900 break-words">
                          {parsedData.details.user.consular_card_number}
                        </p>
                      </div>
                    )}
                    {parsedData.details.consular_card_number && (
                      <div className="md:col-span-2 space-y-1 bg-primary-50 p-3 rounded-lg border border-primary-200">
                        <span className="text-sm font-semibold text-primary-700">
                          Numéro de carte consulaire:
                        </span>
                        <p className="text-lg font-mono font-bold text-primary-900 break-words">
                          {parsedData.details.consular_card_number}
                        </p>
                      </div>
                    )}
                    {Object.entries(parsedData.details)
                      .filter(([key, value]) => 
                        !['id', 'created_at', 'updated_at', 'user'].includes(key) && 
                        key !== 'consular_card_number' &&
                        value !== null && 
                        value !== undefined && 
                        value !== '' &&
                        typeof value !== 'object'
                      )
                      .slice(0, 6)
                      .map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <span className="text-sm font-medium text-gray-500 capitalize">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <p className="text-sm break-words">
                            {formatValue(key, value)}
                          </p>
                        </div>
                      ))}
                    {/* Afficher les informations utilisateur si présentes */}
                    {parsedData.details.user && typeof parsedData.details.user === 'object' && (
                      <>
                        {Object.entries(parsedData.details.user)
                          .filter(([key, value]) => 
                            key !== 'consular_card_number' &&
                            value !== null && 
                            value !== undefined && 
                            value !== ''
                          )
                          .map(([key, value]) => (
                            <div key={`user-${key}`} className="space-y-1">
                              <span className="text-sm font-medium text-gray-500 capitalize">
                                {key.replace(/_/g, ' ')}:
                              </span>
                              <p className="text-sm break-words">
                                {formatValue(key, value)}
                              </p>
                            </div>
                          ))}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Données complètes */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <FiFileText size={16} />
                  <span className="font-medium">Données complètes</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
                    {JSON.stringify(parsedData.details, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            /* Vue simplifiée */
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border-2 ${parsedData.color}`}>
                <div className="flex items-center space-x-2 mb-3">
                  <FiCheckCircle size={16} />
                  <span className="font-medium">Scan réussi</span>
                </div>
                <p className="text-sm text-gray-700">
                  {parsedData.type === 'appointment' && 'Rendez-vous détecté avec succès'}
                  {parsedData.type === 'user' && 'Informations utilisateur détectées'}
                  {parsedData.type === 'document' && 'Document détecté avec succès'}
                  {parsedData.type === 'url' && 'Lien web détecté'}
                  {parsedData.type === 'json' && 'Données structurées détectées'}
                  {parsedData.type === 'text' && 'Texte détecté'}
                </p>
              </div>

              {/* Actions rapides */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setShowRawData(true)}
                  className="flex items-center justify-center space-x-2 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <FiEye size={16} />
                  <span>Voir détails</span>
                </button>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center justify-center space-x-2 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <FiCopy size={16} />
                  <span>Copier</span>
                </button>
                <button
                  onClick={downloadData}
                  className="flex items-center justify-center space-x-2 p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <FiDownload size={16} />
                  <span>Télécharger</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Fermer
            </button>
            {onRescan && (
              <button
                onClick={onRescan}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Scanner à nouveau
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}