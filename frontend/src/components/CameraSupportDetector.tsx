/**
 * Composant de détection du support caméra pour PWA
 */
import { useState, useEffect } from 'react'
import { FiCamera, FiAlertTriangle, FiCheckCircle, FiXCircle } from 'react-icons/fi'

interface CameraSupportDetectorProps {
  onSupportDetected?: (supported: boolean, details: any) => void
  showDetails?: boolean
}

export default function CameraSupportDetector({ 
  onSupportDetected, 
  showDetails = false 
}: CameraSupportDetectorProps) {
  const [supportInfo, setSupportInfo] = useState<any>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    checkCameraSupport()
  }, [])

  const checkCameraSupport = async () => {
    const info = {
      // Informations de base
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      
      // Support des APIs
      hasMediaDevices: !!navigator.mediaDevices,
      hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
      hasLegacyGetUserMedia: !!(navigator as any).getUserMedia,
      hasWebkitGetUserMedia: !!(navigator as any).webkitGetUserMedia,
      hasMozGetUserMedia: !!(navigator as any).mozGetUserMedia,
      
      // Détection navigateur
      isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
      isChrome: /Chrome/.test(navigator.userAgent),
      isFirefox: /Firefox/.test(navigator.userAgent),
      isEdge: /Edg/.test(navigator.userAgent),
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
      isAndroid: /Android/.test(navigator.userAgent),
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      
      // Support PWA
      isPWA: window.matchMedia('(display-mode: standalone)').matches || 
             (window.navigator as any).standalone === true,
      
      // Contraintes supportées
      supportedConstraints: navigator.mediaDevices?.getSupportedConstraints ? 
        navigator.mediaDevices.getSupportedConstraints() : null,
      
      // Test de permission
      permissionState: 'unknown' as 'granted' | 'denied' | 'prompt' | 'unknown'
    }

    // Tester les permissions si possible
    try {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          // @ts-ignore
          const status = await navigator.permissions.query({ name: 'camera' })
          info.permissionState = status.state
        } catch (e) {
          console.log('Permissions API non supportée:', e)
        }
      }
    } catch (error) {
      console.log('Erreur vérification permissions:', error)
    }

    // Calculer le support global
    const hasAnyGetUserMedia = info.hasGetUserMedia || info.hasLegacyGetUserMedia || 
                              info.hasWebkitGetUserMedia || info.hasMozGetUserMedia
    const isSecure = info.isSecureContext || info.protocol === 'https:' || 
                    info.hostname === 'localhost' || info.hostname === '127.0.0.1'
    
    const isSupported = hasAnyGetUserMedia && isSecure

    setSupportInfo({
      ...info,
      isSupported,
      hasAnyGetUserMedia,
      isSecure,
      recommendations: getRecommendations(info, isSupported)
    })

    setIsChecking(false)
    onSupportDetected?.(isSupported, info)
  }

  const getRecommendations = (info: any, isSupported: boolean) => {
    const recommendations = []

    if (!info.isSecure) {
      recommendations.push({
        type: 'error',
        message: 'HTTPS requis pour la caméra',
        solution: 'Utilisez HTTPS ou localhost pour le développement'
      })
    }

    if (!info.hasAnyGetUserMedia) {
      recommendations.push({
        type: 'error',
        message: 'Navigateur non supporté',
        solution: 'Utilisez Chrome, Safari, Firefox ou Edge récent'
      })
    }

    if (info.isSafari && info.isIOS) {
      recommendations.push({
        type: 'warning',
        message: 'Safari iOS détecté',
        solution: 'Assurez-vous que l\'app est installée en PWA'
      })
    }

    if (info.isPWA) {
      recommendations.push({
        type: 'info',
        message: 'Mode PWA détecté',
        solution: 'Excellent ! Les PWA ont un meilleur support caméra'
      })
    }

    if (info.permissionState === 'denied') {
      recommendations.push({
        type: 'warning',
        message: 'Permission caméra refusée',
        solution: 'Autorisez la caméra dans les paramètres du navigateur'
      })
    }

    return recommendations
  }

  if (isChecking) {
    return (
      <div className="flex items-center space-x-2 text-gray-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span>Vérification du support caméra...</span>
      </div>
    )
  }

  if (!supportInfo) return null

  const getStatusIcon = () => {
    if (supportInfo.isSupported) {
      return <FiCheckCircle className="text-green-500" size={20} />
    } else {
      return <FiXCircle className="text-red-500" size={20} />
    }
  }

  const getStatusColor = () => {
    if (supportInfo.isSupported) {
      return 'text-green-600'
    } else {
      return 'text-red-600'
    }
  }

  return (
    <div className="space-y-4">
      {/* Status principal */}
      <div className="flex items-center space-x-3">
        {getStatusIcon()}
        <div>
          <h3 className={`font-medium ${getStatusColor()}`}>
            {supportInfo.isSupported ? 'Caméra supportée' : 'Caméra non supportée'}
          </h3>
          <p className="text-sm text-gray-600">
            {supportInfo.isSafari ? 'Safari' : 
             supportInfo.isChrome ? 'Chrome' :
             supportInfo.isFirefox ? 'Firefox' :
             supportInfo.isEdge ? 'Edge' : 'Navigateur'} 
            {supportInfo.isMobile ? ' Mobile' : ' Desktop'}
            {supportInfo.isPWA ? ' (PWA)' : ''}
          </p>
        </div>
      </div>

      {/* Recommandations */}
      {supportInfo.recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Recommandations :</h4>
          {supportInfo.recommendations.map((rec: any, index: number) => (
            <div key={index} className={`p-3 rounded-md text-sm ${
              rec.type === 'error' ? 'bg-red-50 border border-red-200' :
              rec.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-start space-x-2">
                {rec.type === 'error' ? <FiXCircle className="text-red-500 mt-0.5" size={16} /> :
                 rec.type === 'warning' ? <FiAlertTriangle className="text-yellow-500 mt-0.5" size={16} /> :
                 <FiCheckCircle className="text-blue-500 mt-0.5" size={16} />}
                <div>
                  <p className="font-medium">{rec.message}</p>
                  <p className="text-gray-600 mt-1">{rec.solution}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Détails techniques */}
      {showDetails && (
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer font-medium">Détails techniques</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
            {JSON.stringify(supportInfo, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}
