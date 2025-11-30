import React, { useState, useRef, useCallback } from 'react'
import { FiCamera, FiUpload, FiX, FiCheck, FiDownload } from 'react-icons/fi'
import toast from 'react-hot-toast'

interface DocumentScannerProps {
  onDocumentScanned: (file: File, documentType: string) => void
  onClose: () => void
  documentType?: string
}

const DocumentScanner: React.FC<DocumentScannerProps> = ({
  onDocumentScanned,
  onClose,
  documentType = 'document'
}) => {
  const [isScanning, setIsScanning] = useState(false)
  const [scannedImage, setScannedImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Fonction pour démarrer la caméra
  const startCamera = useCallback(async () => {
    try {
      setIsScanning(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Caméra arrière sur mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
    } catch (error) {
      console.error('Erreur accès caméra:', error)
      toast.error('Impossible d\'accéder à la caméra')
      setIsScanning(false)
    }
  }, [])

  // Fonction pour capturer l'image
  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Ajuster la taille du canvas
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Dessiner l'image de la vidéo sur le canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convertir en blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `${documentType}_scan_${Date.now()}.jpg`, {
          type: 'image/jpeg'
        })
        setSelectedFile(file)
        setScannedImage(URL.createObjectURL(blob))
        setIsScanning(false)
        
        // Arrêter la caméra
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }
        
        toast.success('Document scanné avec succès !')
      }
    }, 'image/jpeg', 0.8)
  }, [documentType])

  // Fonction pour gérer l'upload de fichier
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setScannedImage(URL.createObjectURL(file))
      toast.success('Fichier sélectionné !')
    }
  }, [])

  // Fonction pour confirmer le document
  const confirmDocument = useCallback(() => {
    if (selectedFile) {
      onDocumentScanned(selectedFile, documentType)
      onClose()
    }
  }, [selectedFile, documentType, onDocumentScanned, onClose])

  // Nettoyage à la fermeture
  const handleClose = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    if (scannedImage) {
      URL.revokeObjectURL(scannedImage)
    }
    onClose()
  }, [scannedImage, onClose])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Scanner un document</h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {!scannedImage ? (
            <>
              {/* Instructions */}
              <div className="text-center space-y-2">
                <FiCamera size={48} className="mx-auto text-gray-400" />
                <h4 className="font-medium">Scanner votre {documentType}</h4>
                <p className="text-sm text-gray-600">
                  Placez le document dans le cadre et assurez-vous qu'il soit bien visible
                </p>
              </div>

              {/* Camera Preview */}
              {isScanning && (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 border-2 border-primary-500 border-dashed rounded-lg pointer-events-none">
                    <div className="absolute top-2 left-2 right-2 bottom-2 border border-primary-300 rounded pointer-events-none" />
                  </div>
                  <button
                    onClick={captureImage}
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-primary-500 text-white p-3 rounded-full shadow-lg"
                  >
                    <FiCamera size={24} />
                  </button>
                </div>
              )}

              {/* Hidden canvas for capture */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Action Buttons */}
              <div className="space-y-3">
                {!isScanning && (
                  <button
                    onClick={startCamera}
                    className="w-full btn-primary flex items-center justify-center space-x-2"
                  >
                    <FiCamera size={20} />
                    <span>Ouvrir la caméra</span>
                  </button>
                )}

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full btn-secondary flex items-center justify-center space-x-2"
                >
                  <FiUpload size={20} />
                  <span>Choisir un fichier</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </>
          ) : (
            <>
              {/* Preview du document scanné */}
              <div className="space-y-4">
                <div className="text-center">
                  <h4 className="font-medium mb-2">Aperçu du document</h4>
                  <img
                    src={scannedImage}
                    alt="Document scanné"
                    className="w-full h-64 object-contain border rounded-lg"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setScannedImage(null)
                      setSelectedFile(null)
                    }}
                    className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                  >
                    <FiX size={20} />
                    <span>Recommencer</span>
                  </button>

                  <button
                    onClick={confirmDocument}
                    className="flex-1 btn-primary flex items-center justify-center space-x-2"
                  >
                    <FiCheck size={20} />
                    <span>Confirmer</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tips */}
        <div className="p-4 bg-gray-50 border-t">
          <h5 className="font-medium text-sm mb-2">💡 Conseils pour un bon scan :</h5>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Assurez-vous d'avoir un bon éclairage</li>
            <li>• Placez le document à plat</li>
            <li>• Évitez les reflets et les ombres</li>
            <li>• Le document doit remplir le cadre</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default DocumentScanner
