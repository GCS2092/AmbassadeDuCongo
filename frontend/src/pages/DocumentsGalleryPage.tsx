import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiCamera, FiUpload, FiCalendar, FiEdit3, FiTrash2, FiEye, FiDownload, FiPlus, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import DocumentScanner from '../components/DocumentScanner'
import LoadingSpinner from '../components/LoadingSpinner'
import { authApi } from '../lib/api'
import { debugAPI, validateDataStructure, safeArrayAccess } from '../utils/debugHelper'

interface Document {
  id: number
  hashed_id?: string
  document_type: string
  name: string
  file_url: string
  expiry_date?: string
  upload_date: string
  status: 'valid' | 'expired' | 'expiring_soon'
  is_verified: boolean
}

const documentTypes = [
  { key: 'passport', label: 'Passeport', icon: '🛂' },
  { key: 'id_card', label: 'Carte d\'identité', icon: '🆔' },
  { key: 'consular_card', label: 'Carte consulaire', icon: '🏛️' },
  { key: 'driving_license', label: 'Permis de conduire', icon: '🚗' },
  { key: 'birth_certificate', label: 'Acte de naissance', icon: '📜' },
  { key: 'marriage_certificate', label: 'Acte de mariage', icon: '💒' },
  { key: 'other', label: 'Autre document', icon: '📄' }
]

export default function DocumentsGalleryPage() {
  const [showScanner, setShowScanner] = useState(false)
  const [selectedDocumentType, setSelectedDocumentType] = useState('')
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [showExpiryModal, setShowExpiryModal] = useState(false)
  
  const queryClient = useQueryClient()

  // Récupérer les documents depuis l'API
  const { data: documentsResponse, isLoading } = useQuery({
    queryKey: ['user-documents'],
    queryFn: async () => {
      debugAPI.logRequest('/auth/documents/', 'GET');
      try {
        const res = await authApi.getDocuments();
        debugAPI.logResponse('/auth/documents/', res.status, res.data);
        
        // Gérer la structure paginée de l'API
        if (res.data && res.data.results && Array.isArray(res.data.results)) {
          return res.data.results;
        } else if (Array.isArray(res.data)) {
          return res.data;
        } else {
          console.warn('Unexpected data structure:', res.data);
          return [];
        }
      } catch (error) {
        debugAPI.logError('/auth/documents/', error);
        // Retourner un tableau vide en cas d'erreur
        return [];
      }
    }
  })

  // Les documents sont maintenant directement dans documentsResponse
  const documents = documentsResponse || [];

  const uploadDocument = useMutation({
    mutationFn: async (data: { file: File; type: string; name: string; expiry_date?: string }) => {
      const formData = new FormData()
      formData.append('file', data.file)
      formData.append('document_type', data.type)
      formData.append('name', data.name)
      
      // Ajouter la date d'expiration si fournie
      if (data.expiry_date) {
        formData.append('expiry_date', data.expiry_date)
      }
      
      return authApi.uploadDocument(formData)
    },
    onSuccess: () => {
      // Forcer le rafraîchissement des données
      queryClient.invalidateQueries({ queryKey: ['user-documents'] })
      queryClient.refetchQueries({ queryKey: ['user-documents'] })
      toast.success('Document ajouté avec succès !')
      setShowScanner(false)
      setSelectedDocumentType('')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'upload')
    }
  })

  const updateExpiryDate = useMutation({
    mutationFn: async ({ id, expiry_date }: { id: string | number; expiry_date: string }) => {
      return authApi.updateDocumentExpiry(id, expiry_date)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-documents'] })
      toast.success('Date d\'expiration mise à jour !')
      setShowExpiryModal(false)
      setEditingDocument(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la mise à jour')
    }
  })

  const deleteDocument = useMutation({
    mutationFn: async (id: string | number) => {
      return authApi.deleteDocument(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-documents'] })
      toast.success('Document supprimé !')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression')
    }
  })

  const [expiryDate, setExpiryDate] = useState('')

  const handleDocumentScanned = (file: File, documentType: string) => {
    const documentTypeInfo = documentTypes.find(dt => dt.key === documentType)
    const name = documentTypeInfo?.label || 'Document'
    
    // Préparer les données avec la date d'expiration si fournie
    const uploadData: any = {
      file,
      type: documentType,
      name
    }
    
    if (expiryDate) {
      uploadData.expiry_date = expiryDate
    }
    
    uploadDocument.mutate(uploadData)
    setExpiryDate('') // Réinitialiser après l'upload
  }

  const getDocumentStatus = (expiryDate?: string) => {
    if (!expiryDate) return 'valid'
    
    const expiry = new Date(expiryDate)
    const today = new Date()
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'expired'
    if (diffDays <= 30) return 'expiring_soon'
    return 'valid'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expired': return 'bg-red-100 text-red-800'
      case 'expiring_soon': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'expired': return 'Expiré'
      case 'expiring_soon': return 'Expire bientôt'
      default: return 'Valide'
    }
  }

  if (isLoading) {
    return <LoadingSpinner text="Chargement des documents..." />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mes Documents</h1>
            <p className="text-gray-600">Gérez vos documents officiels et leurs dates d'expiration</p>
          </div>
          <button
            onClick={() => {
              setShowScanner(true)
              setSelectedDocumentType('')
            }}
            className="btn-primary flex items-center space-x-2"
          >
            <FiPlus size={20} />
            <span>Ajouter un document</span>
          </button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <div className="text-2xl font-bold text-blue-600">{(documents || []).length}</div>
            <div className="text-sm text-gray-600">Documents totaux</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-green-600">
              {(documents || []).filter(d => getDocumentStatus(d.expiry_date) === 'valid').length}
            </div>
            <div className="text-sm text-gray-600">Valides</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {(documents || []).filter(d => getDocumentStatus(d.expiry_date) === 'expiring_soon').length}
            </div>
            <div className="text-sm text-gray-600">Expirent bientôt</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-red-600">
              {(documents || []).filter(d => getDocumentStatus(d.expiry_date) === 'expired').length}
            </div>
            <div className="text-sm text-gray-600">Expirés</div>
          </div>
        </div>


        {/* Liste des documents */}
        <div className="space-y-4">
          {(documents || []).length === 0 ? (
            <div className="card text-center py-12">
              <FiUpload size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun document</h3>
              <p className="text-gray-600 mb-4">Commencez par scanner vos premiers documents</p>
              <button
                onClick={() => setShowScanner(true)}
                className="btn-primary"
              >
                Scanner un document
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(documents || []).map((document) => {
                const docType = documentTypes.find(dt => dt.key === document.document_type)
                const status = getDocumentStatus(document.expiry_date)
                
                return (
                  <div key={document.id} className="card">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{docType?.icon}</span>
                        <div>
                          <h3 className="font-medium">{document.name}</h3>
                          <p className="text-sm text-gray-600">{docType?.label}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {getStatusText(status)}
                      </span>
                    </div>

                    {/* Image du document */}
                    <div className="mb-4">
                      {document.file_url ? (
                        <img
                          src={document.file_url}
                          alt={document.name}
                          className="w-full h-32 object-cover rounded-lg cursor-pointer"
                          onClick={() => window.open(document.file_url, '_blank')}
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer" onClick={() => window.open(document.file, '_blank')}>
                          <FiEye size={24} className="text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Informations */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <FiCalendar size={16} className="mr-2" />
                        Ajouté le {new Date(document.upload_date).toLocaleDateString('fr-FR')}
                      </div>
                      {document.expiry_date && (
                        <div className="flex items-center text-sm text-gray-600">
                          <FiCalendar size={16} className="mr-2" />
                          Expire le {new Date(document.expiry_date).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.open(document.file_url || document.file, '_blank')}
                        className="btn-primary text-sm flex items-center justify-center space-x-1"
                        title="Télécharger le document"
                      >
                        <FiDownload size={16} />
                        <span>Télécharger</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingDocument(document)
                          setShowExpiryModal(true)
                        }}
                        className="btn-secondary text-sm flex items-center justify-center space-x-1"
                      >
                        <FiEdit3 size={16} />
                        <span>Modifier</span>
                      </button>
                      <button
                        onClick={() => deleteDocument.mutate(document.hashed_id || document.id)}
                        className="btn-danger text-sm flex items-center justify-center space-x-1"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Modal Type de document */}
        {!showScanner && !selectedDocumentType && (
          <DocumentTypeModal
            onSelectType={(type) => setSelectedDocumentType(type)}
            onClose={() => setSelectedDocumentType('')}
          />
        )}

        {/* Modal Scanner */}
        {showScanner && selectedDocumentType && (
          <DocumentUploadModal
            documentType={selectedDocumentType}
            expiryDate={expiryDate}
            onExpiryDateChange={setExpiryDate}
            onDocumentScanned={handleDocumentScanned}
            onClose={() => {
              setShowScanner(false)
              setSelectedDocumentType('')
              setExpiryDate('')
            }}
          />
        )}

        {/* Modal Gestion des dates d'expiration */}
        {showExpiryModal && editingDocument && (
          <ExpiryDateModal
            document={editingDocument}
            onSave={(expiry_date) => updateExpiryDate.mutate({
              id: editingDocument.hashed_id || editingDocument.id,
              expiry_date
            })}
            onClose={() => {
              setShowExpiryModal(false)
              setEditingDocument(null)
            }}
            isLoading={updateExpiryDate.isPending}
          />
        )}
      </div>
    </div>
  )
}

// Modal de sélection du type de document
interface DocumentTypeModalProps {
  onSelectType: (type: string) => void
  onClose: () => void
}

function DocumentTypeModal({ onSelectType, onClose }: DocumentTypeModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Choisir un type de document</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {documentTypes.map((type) => (
              <button
                key={type.key}
                onClick={() => onSelectType(type.key)}
                className="p-4 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-colors text-left"
              >
                <div className="flex flex-col items-center space-y-2">
                  <span className="text-3xl">{type.icon}</span>
                  <span className="font-medium text-sm">{type.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Modal d'upload de document avec date d'expiration
interface DocumentUploadModalProps {
  documentType: string
  expiryDate: string
  onExpiryDateChange: (date: string) => void
  onDocumentScanned: (file: File, documentType: string) => void
  onClose: () => void
}

function DocumentUploadModal({
  documentType,
  expiryDate,
  onExpiryDateChange,
  onDocumentScanned,
  onClose
}: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
    }
  }

  const handleUpload = () => {
    if (file) {
      onDocumentScanned(file, documentType)
    }
  }

  const documentTypeInfo = documentTypes.find(dt => dt.key === documentType)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Ajouter un {documentTypeInfo?.label}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Sélection de fichier */}
          <div>
            <label className="label">Document</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full btn-secondary flex items-center justify-center space-x-2"
            >
              <FiUpload size={20} />
              <span>Choisir un fichier</span>
            </button>
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="mt-2 w-full h-48 object-contain border rounded"
              />
            )}
          </div>

          {/* Date d'expiration */}
          <div>
            <label className="label">Date d'expiration (optionnel)</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => onExpiryDateChange(e.target.value)}
              className="input"
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-gray-500 mt-1">
              ⚠️ Vous recevrez un email 3 jours avant l'expiration
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Annuler
            </button>
            <button
              onClick={handleUpload}
              disabled={!file}
              className="flex-1 btn-primary"
            >
              Ajouter
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Composant Modal pour la gestion des dates d'expiration
interface ExpiryDateModalProps {
  document: Document
  onSave: (expiry_date: string) => void
  onClose: () => void
  isLoading: boolean
}

function ExpiryDateModal({ document, onSave, onClose, isLoading }: ExpiryDateModalProps) {
  const [expiryDate, setExpiryDate] = useState(document.expiry_date || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (expiryDate) {
      onSave(expiryDate)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Gérer l'expiration</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="label">Document</label>
            <p className="text-gray-700">{document.name}</p>
          </div>

          <div>
            <label className="label">Date d'expiration</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="input"
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-gray-500 mt-1">
              Vous recevrez un rappel 30 jours avant l'expiration
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!expiryDate || isLoading}
              className="flex-1 btn-primary"
            >
              {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
