/**
 * Scanner QR Code avec support HTTPS et fallback mobile
 */
import { useRef, useEffect, useState } from 'react'
import jsQR from 'jsqr'
import { FiCamera, FiX, FiAlertTriangle, FiInfo } from 'react-icons/fi'
import toast from 'react-hot-toast'
import QRScanResult from './QRScanResult'
import CameraSupportDetector from './CameraSupportDetector'

interface QRCodeScannerProps {
  isOpen: boolean
  onClose: () => void
  onScan: (data: string) => void
}

export default function QRCodeScanner({ isOpen, onClose, onScan }: QRCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number>()
  
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [useFallback, setUseFallback] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [scannedData, setScannedData] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [showSupportInfo, setShowSupportInfo] = useState(false)

  const isHttpsContext = () => {
    // Camera requires secure context on mobile browsers
    if (typeof window === 'undefined') return false
    
    // Vérifier HTTPS ou localhost (pour développement)
    const isSecure = window.isSecureContext || 
                    window.location.protocol === 'https:' || 
                    window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1'
    
    console.log('🔍 [QR Scanner] Contexte sécurisé:', {
      isSecure,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      isSecureContext: window.isSecureContext
    })
    
    return isSecure
  }

  const queryCameraPermission = async () => {
    try {
      // Vérifier le support des permissions API
      if (navigator.permissions && navigator.permissions.query) {
        console.log('🔍 [QR Scanner] Vérification des permissions caméra...')
        
        // Essayer différentes variantes pour la compatibilité
        const permissionQueries = [
          { name: 'camera' },
          { name: 'camera' as PermissionName },
          // @ts-ignore - pour les navigateurs qui supportent mais TypeScript ne connaît pas
          { name: 'camera' as any }
        ]
        
        for (const query of permissionQueries) {
          try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const status = await navigator.permissions.query(query)
            console.log('🔍 [QR Scanner] État permission caméra:', status.state)
            return status.state as 'granted' | 'denied' | 'prompt'
          } catch (e) {
            console.log('🔍 [QR Scanner] Tentative permission échouée:', e)
            continue
          }
        }
      }
    } catch (error) {
      console.log('🔍 [QR Scanner] Permissions API non supportée:', error)
    }
    
    console.log('🔍 [QR Scanner] Utilisation du comportement par défaut getUserMedia')
    return 'prompt'
  }

  const getVideoConstraints = () => {
    // Détecter le type d'appareil et navigateur
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    
    console.log('🔍 [QR Scanner] Détection appareil:', {
      isMobile,
      isSafari,
      isIOS,
      userAgent: navigator.userAgent
    })

    // Contraintes de base pour tous les navigateurs
    const baseConstraints = {
      facingMode: { ideal: 'environment' } as const
    }

    // Contraintes spécifiques selon le navigateur
    if (isSafari || isIOS) {
      // Safari/iOS : contraintes minimales pour éviter les erreurs
      return {
        ...baseConstraints,
        width: { min: 320, ideal: 640, max: 1280 },
        height: { min: 240, ideal: 480, max: 720 }
      }
    } else if (isMobile) {
      // Mobile Android/autres : contraintes modérées
      return {
        ...baseConstraints,
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 }
      }
    } else {
      // Desktop : contraintes élevées
      return {
        ...baseConstraints,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    }
  }

  const startCamera = async () => {
    try {
      setIsScanning(true)
      setHasPermission(false)

      // Log de démarrage détaillé
      console.log('🔍 [QR Scanner] ===== DÉMARRAGE SCANNER QR =====', {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        isHttps: isHttpsContext(),
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        hasMediaDevices: !!navigator.mediaDevices,
        hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
        location: {
          protocol: window.location.protocol,
          host: window.location.host,
          origin: window.location.origin
        },
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          availWidth: window.screen.availWidth,
          availHeight: window.screen.availHeight
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      })

      // Vérifier le support de la caméra avec détection avancée
      const hasMediaDevices = !!navigator.mediaDevices
      const hasGetUserMedia = !!navigator.mediaDevices?.getUserMedia
      const hasOldGetUserMedia = !!(navigator as any).getUserMedia || !!(navigator as any).webkitGetUserMedia || !!(navigator as any).mozGetUserMedia
      
      console.log('🔍 [QR Scanner] Support caméra détaillé:', {
        hasMediaDevices,
        hasGetUserMedia,
        hasOldGetUserMedia,
        mediaDevices: !!navigator.mediaDevices,
        getUserMedia: !!navigator.mediaDevices?.getUserMedia,
        webkitGetUserMedia: !!(navigator as any).webkitGetUserMedia,
        mozGetUserMedia: !!(navigator as any).mozGetUserMedia
      })

      if (!hasMediaDevices && !hasOldGetUserMedia) {
        console.error('❌ [QR Scanner] Aucun support caméra détecté')
        throw new Error('Votre navigateur ne supporte pas l\'accès à la caméra. Veuillez utiliser un navigateur moderne.')
      }

      // HTTPS requis sur mobile (iOS/Safari/Chrome Android)
      if (!isHttpsContext()) {
        console.warn('⚠️ [QR Scanner] HTTPS requis pour la caméra')
        setUseFallback(true)
        setIsScanning(false)
        setHasPermission(false)
        toast.error('HTTPS requis pour accéder à la caméra')
        return
      }

      const permissionState = await queryCameraPermission()
      console.log('🔍 [QR Scanner] État permission caméra:', permissionState)
      
      if (permissionState === 'denied') {
        console.warn('⚠️ [QR Scanner] Permission caméra refusée')
        setUseFallback(true)
        setIsScanning(false)
        toast.error('Permission caméra refusée. Autorisez la caméra dans les réglages du navigateur.')
        return
      }

      // Demander l'accès à la caméra avec fallback progressif
      const constraints = getVideoConstraints()
      
      console.log('🔍 [QR Scanner] Demande d\'accès caméra avec contraintes:', constraints)
      console.log('🔍 [QR Scanner] Vérification des contraintes supportées...')
      
      // Vérifier les contraintes supportées
      if (navigator.mediaDevices.getSupportedConstraints) {
        const supportedConstraints = navigator.mediaDevices.getSupportedConstraints()
        console.log('🔍 [QR Scanner] Contraintes supportées:', supportedConstraints)
      }

      // Essayer différentes approches selon le navigateur
      const getUserMediaMethods = [
        // Méthode moderne
        () => navigator.mediaDevices.getUserMedia({ video: constraints }),
        // Méthode avec contraintes minimales
        () => navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }),
        // Méthode de base
        () => navigator.mediaDevices.getUserMedia({ video: true }),
        // Méthodes legacy pour compatibilité
        () => new Promise<MediaStream>((resolve, reject) => {
          const legacyGetUserMedia = (navigator as any).getUserMedia || 
                                   (navigator as any).webkitGetUserMedia || 
                                   (navigator as any).mozGetUserMedia
          if (legacyGetUserMedia) {
            legacyGetUserMedia.call(navigator, { video: true }, resolve, reject)
          } else {
            reject(new Error('Aucune méthode getUserMedia disponible'))
          }
        })
      ]

      let lastError: any = null
      let stream: MediaStream | null = null
      
      for (let i = 0; i < getUserMediaMethods.length; i++) {
        try {
          console.log(`🔄 [QR Scanner] Tentative ${i + 1}/${getUserMediaMethods.length}`)
          stream = await getUserMediaMethods[i]()
          console.log('✅ [QR Scanner] Accès caméra accordé', {
            method: i + 1,
            tracks: stream.getTracks().map(track => ({
              kind: track.kind,
              label: track.label,
              enabled: track.enabled,
              readyState: track.readyState,
              settings: track.getSettings()
            }))
          })
          break
        } catch (e: any) {
          console.warn(`⚠️ [QR Scanner] Tentative ${i + 1} échouée:`, {
            name: e.name,
            message: e.message,
            constraint: e.constraint
          })
          lastError = e
          
          // Si c'est la dernière tentative, lancer l'erreur
          if (i === getUserMediaMethods.length - 1) {
            throw lastError
          }
        }
      }

      if (!stream) {
        throw new Error('Impossible d\'obtenir l\'accès à la caméra')
      }

      streamRef.current = stream
      
      if (videoRef.current) {
        console.log('🔍 [QR Scanner] Configuration de l\'élément vidéo')
        videoRef.current.srcObject = stream
        
        // iOS Safari requires inline playback
        try {
          videoRef.current.setAttribute('playsinline', 'true')
          videoRef.current.setAttribute('autoplay', 'true')
          videoRef.current.muted = true
          console.log('✅ [QR Scanner] Attributs vidéo configurés pour mobile')
        } catch (err) {
          console.warn('⚠️ [QR Scanner] Erreur configuration attributs vidéo:', err)
        }
        
        // Attendre que la vidéo soit prête avant de jouer
        videoRef.current.onloadedmetadata = () => {
          console.log('🔍 [QR Scanner] Métadonnées vidéo chargées, démarrage lecture')
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              console.log('✅ [QR Scanner] Lecture vidéo démarrée')
            }).catch((err) => {
              console.error('❌ [QR Scanner] Erreur de lecture vidéo:', err)
            })
          }
        }
        
        setHasPermission(true)
        console.log('✅ [QR Scanner] Caméra activée avec succès')
        toast.success('Caméra activée - Pointez vers un QR code')
      }

    } catch (err: any) {
      console.error('❌ [QR Scanner] ===== ERREUR CAMÉRA DÉTAILLÉE =====', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
        errorDetails: {
          constraint: err.constraint,
          constraintName: err.constraintName,
          constraintValue: err.constraintValue,
          constraintType: err.constraintType
        },
        environment: {
          isHttps: isHttpsContext(),
          isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
          userAgent: navigator.userAgent,
          protocol: window.location.protocol,
          hasMediaDevices: !!navigator.mediaDevices,
          hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia
        }
      })
      
      setIsScanning(false)
      setHasPermission(false)
      
      // Activer le mode fallback sur mobile
      if (err.name === 'NotAllowedError' || err.name === 'NotFoundError' || err.name === 'NotSupportedError' || err.name === 'SecurityError' || err.name === 'NotReadableError' || err.name === 'OverconstrainedError') {
        console.log('🔄 [QR Scanner] Activation du mode fallback pour:', err.name)
        setUseFallback(true)
        toast('Mode saisie manuelle activé', { icon: 'ℹ️' })
        return
      }
      
      let errorMessage = 'Erreur d\'accès à la caméra'
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Permission caméra refusée'
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'Aucune caméra trouvée'
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Caméra non supportée'
      } else if (err.name === 'SecurityError') {
        errorMessage = 'HTTPS requis pour la caméra'
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Caméra occupée par une autre application'
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        errorMessage = 'Impossible d\'accéder à la caméra avec ces paramètres'
      }
      
      console.error('❌ [QR Scanner] Message d\'erreur affiché:', errorMessage)
      toast.error(errorMessage)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    setIsScanning(false)
    setHasPermission(false)
    setIsDetecting(false)
  }

  const detectQR = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Vérifier que la vidéo a des dimensions valides
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      // Réessayer plus tard
      animationRef.current = requestAnimationFrame(detectQR)
      return
    }

    // Ajuster la taille du canvas
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Dessiner l'image de la vidéo sur le canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Obtenir les données de l'image
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    
    // Détecter le QR code
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height)
    
    if (qrCode) {
      console.log('✅ [QR Scanner] QR Code détecté:', {
        data: qrCode.data,
        location: qrCode.location,
        timestamp: new Date().toISOString(),
        videoDimensions: { width: video.videoWidth, height: video.videoHeight },
        canvasDimensions: { width: canvas.width, height: canvas.height }
      })
      
      setIsDetecting(false)
      setScannedData(qrCode.data)
      setShowResult(true)
      toast.success('QR Code détecté !')
      
      // Arrêter l'animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      
      // Arrêter la caméra
      stopCamera()
    } else {
      // Continuer la détection
      animationRef.current = requestAnimationFrame(detectQR)
    }
  }

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      setScannedData(manualInput.trim())
      setShowResult(true)
      toast.success('Code QR traité manuellement')
      setManualInput('')
    } else {
      toast.error('Veuillez saisir un code QR')
    }
  }

  const handleResultClose = () => {
    setShowResult(false)
    setScannedData(null)
    onClose()
  }

  const handleRescan = () => {
    setShowResult(false)
    setScannedData(null)
    setUseFallback(false)
    startCamera()
  }

  // Démarrer la détection quand la caméra est prête
  useEffect(() => {
    if (hasPermission && isScanning) {
      setIsDetecting(true)
      detectQR()
    }
  }, [hasPermission, isScanning])

  // Nettoyer à la fermeture
  useEffect(() => {
    if (!isOpen) {
      stopCamera()
      setUseFallback(false)
      setManualInput('')
      setScannedData(null)
      setShowResult(false)
    }
  }, [isOpen])

  // Nettoyer au démontage
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  if (!isOpen) return null

  // Afficher le résultat du scan
  if (showResult && scannedData) {
    return (
      <QRScanResult
        data={scannedData}
        onClose={handleResultClose}
        onRescan={handleRescan}
      />
    )
  }

  // Rendu du fallback si nécessaire
  if (useFallback) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Scanner QR Code</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSupportInfo(!showSupportInfo)}
                className="text-gray-400 hover:text-gray-600"
                title="Informations de support"
              >
                <FiInfo className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          <div className="text-center mb-6">
            <FiAlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-800 mb-2">
              Caméra non disponible
            </h4>
            <p className="text-gray-600 text-sm">
              L'accès à la caméra nécessite HTTPS sur mobile.<br/>
              Vous pouvez saisir le code QR manuellement ci-dessous.
            </p>
            {!isHttpsContext() && (
              <p className="text-xs text-red-600 mt-2">
                Ouvrez l'application en HTTPS (voir démarrage sécurisé) pour activer la caméra.
              </p>
            )}
          </div>

          {/* Détecteur de support caméra */}
          {showSupportInfo && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <CameraSupportDetector 
                onSupportDetected={(supported, details) => {
                  console.log('🔍 [QR Scanner] Support caméra détecté:', { supported, details })
                }}
                showDetails={true}
              />
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code QR à scanner
              </label>
              <textarea
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Collez ou tapez le code QR ici..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleManualSubmit}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiCamera className="inline w-4 h-4 mr-2" />
                Scanner le code
              </button>
              
              <button
                onClick={() => {
                  setUseFallback(false)
                  startCamera()
                }}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Réessayer caméra
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Scanner QR Code</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Zone de vidéo */}
          <div className="relative bg-gray-100 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-64 object-cover"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            
            {/* Overlay de détection */}
            {isDetecting && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-blue-500 bg-opacity-20 border-2 border-blue-500 border-dashed rounded-lg w-48 h-48 flex items-center justify-center">
                  <div className="text-center text-blue-600">
                    <FiCamera className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                    <p className="text-sm font-medium">Recherche QR Code...</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contrôles */}
          <div className="flex space-x-3">
            {!isScanning ? (
              <button
                onClick={startCamera}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiCamera className="inline w-4 h-4 mr-2" />
                Activer la caméra
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Arrêter la caméra
              </button>
            )}
            
            <button
              onClick={() => {
                setUseFallback(true)
              }}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Mode manuel
            </button>
          </div>

          {/* Instructions */}
          <div className="text-center text-sm text-gray-600">
            {!isScanning ? (
              <p>Cliquez sur "Activer la caméra" pour commencer le scan</p>
            ) : (
              <p>Pointez la caméra vers un QR Code</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}