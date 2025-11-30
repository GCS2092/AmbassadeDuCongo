import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { FiDownload, FiCopy, FiEye, FiEyeOff, FiGrid } from 'react-icons/fi'
import toast from 'react-hot-toast'

interface Service {
  id: number
  name: string
  category: string
  category_display: string
  description?: string
  base_fee: string
  processing_time_days: number
  requires_appointment: boolean
}

interface ServiceQRCodeProps {
  service: Service
  size?: number
  showDetails?: boolean
  className?: string
}

export default function ServiceQRCode({ 
  service, 
  size = 120, 
  showDetails = true,
  className = ""
}: ServiceQRCodeProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  // Générer les données QR pour le service
  const generateQRData = () => {
    const qrData = {
      type: 'service',
      service_id: service.id,
      service_name: service.name,
      category: service.category,
      category_display: service.category_display,
      description: service.description,
      base_fee: service.base_fee,
      processing_time_days: service.processing_time_days,
      requires_appointment: service.requires_appointment,
      timestamp: new Date().toISOString(),
      embassy: 'Ambassade du Congo - Sénégal'
    }
    return JSON.stringify(qrData)
  }

  const qrData = generateQRData()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrData)
      setIsCopied(true)
      toast.success('Données QR copiées dans le presse-papiers')
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      toast.error('Impossible de copier les données')
    }
  }

  const handleDownload = () => {
    // Créer un lien de téléchargement pour les données QR
    const blob = new Blob([qrData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `service-${service.id}-${service.name.replace(/\s+/g, '-').toLowerCase()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Données QR téléchargées')
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FiGrid className="text-primary-500" size={20} />
          <h3 className="font-semibold text-gray-900">Code QR Service</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title={isExpanded ? "Réduire" : "Développer"}
        >
          {isExpanded ? <FiEyeOff size={16} /> : <FiEye size={16} />}
        </button>
      </div>

      {/* Code QR */}
      <div className="flex justify-center mb-3">
        <div className="bg-white p-2 rounded-lg border-2 border-gray-100">
          <QRCodeSVG 
            value={qrData} 
            size={size}
            level="M"
            includeMargin={true}
          />
        </div>
      </div>

      {/* Informations du service */}
      {showDetails && (
        <div className="text-center mb-3">
          <h4 className="font-medium text-gray-900 mb-1">{service.name}</h4>
          <p className="text-sm text-gray-600 mb-2">{service.category_display}</p>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <span>{service.base_fee} XOF</span>
            <span>•</span>
            <span>{service.processing_time_days} jour{service.processing_time_days > 1 ? 's' : ''}</span>
            {service.requires_appointment && (
              <>
                <span>•</span>
                <span className="text-orange-600">RDV requis</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
            isCopied 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FiCopy size={14} />
          {isCopied ? 'Copié!' : 'Copier'}
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
        >
          <FiDownload size={14} />
          Télécharger
        </button>
      </div>

      {/* Détails étendus */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h5 className="font-medium text-gray-900 mb-2">Détails du service</h5>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>ID Service:</span>
              <span className="font-mono">{service.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Catégorie:</span>
              <span>{service.category_display}</span>
            </div>
            <div className="flex justify-between">
              <span>Prix:</span>
              <span className="font-semibold">{service.base_fee} XOF</span>
            </div>
            <div className="flex justify-between">
              <span>Délai:</span>
              <span>{service.processing_time_days} jour{service.processing_time_days > 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between">
              <span>Rendez-vous:</span>
              <span className={service.requires_appointment ? 'text-orange-600' : 'text-green-600'}>
                {service.requires_appointment ? 'Obligatoire' : 'Non requis'}
              </span>
            </div>
            {service.description && (
              <div className="mt-2">
                <span className="block text-gray-500 mb-1">Description:</span>
                <p className="text-xs text-gray-600">{service.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Note pour le vigile */}
      <div className="mt-3 p-2 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700 text-center">
          📱 <strong>Pour le vigile:</strong> Scannez ce code QR pour voir les détails du service
        </p>
      </div>
    </div>
  )
}
