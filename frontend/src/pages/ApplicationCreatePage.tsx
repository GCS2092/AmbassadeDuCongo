/**
 * Complete Application Create Page
 * Formulaire complet de création de demande
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { FiUpload, FiX, FiChevronRight, FiCheckCircle } from 'react-icons/fi'
import { consularOfficesApi, servicesApi, applicationsApi, documentsApi } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { debugAPI, safeArrayAccess, debugComponent } from '../utils/debugHelper'
import { useQueryClient } from '@tanstack/react-query'
import ProgressBar from '../components/ProgressBar'
import HelpTooltip from '../components/HelpTooltip'

export default function ApplicationCreatePage() {
  const [step, setStep] = useState(1)
  const [applicationType, setApplicationType] = useState<string>('')
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedOffice, setSelectedOffice] = useState<number | null>(null)
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm()

  const { data: offices } = useQuery({
    queryKey: ['consular-offices'],
    queryFn: () => consularOfficesApi.list().then(res => Array.isArray(res.data) ? res.data : res.data?.results || [])
  })

  const { data: servicesResponse } = useQuery({
    queryKey: ['services'],
    queryFn: () => {
      debugAPI.logRequest('/core/service-types/', 'GET');
      return servicesApi.list().then(res => {
        debugAPI.logResponse('/core/service-types/', res.status, res.data);
        return safeArrayAccess(res.data);
      }).catch(error => {
        debugAPI.logError('/core/service-types/', error);
        throw error;
      });
    }
  })

  const services = safeArrayAccess(servicesResponse);
  debugComponent('ApplicationCreatePage', { servicesCount: services.length });

  const createApplication = useMutation({
    mutationFn: (data: any) => {
      console.log('🚀 Creating application with data:', data);
      return applicationsApi.create(data);
    },
    onSuccess: (response) => {
      console.log('✅ Application created successfully:', response);
      
             // Rafraîchir toutes les données liées aux applications
             queryClient.invalidateQueries({ queryKey: ['applications'] })
             queryClient.invalidateQueries({ queryKey: ['applications', 'in-progress'] })
             queryClient.invalidateQueries({ queryKey: ['applications', 'all'] })
             queryClient.invalidateQueries({ queryKey: ['applications', 'drafts'] })
             queryClient.invalidateQueries({ queryKey: ['applications', 'completed'] })
             queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      
      toast.success('Demande créée avec succès !')
      navigate('/applications')
    },
    onError: (error: any) => {
      console.error('❌ Application creation failed:', error);
      console.error('❌ Error details:', error.response?.data);
      
      // Gestion d'erreurs plus détaillée pour la création d'application
      let errorTitle = 'Erreur de création'
      let errorMessage = 'Erreur lors de la création de la demande'
      
      if (error.response?.status === 400) {
        errorTitle = 'Données invalides'
        const errors = error.response?.data
        
        if (errors?.application_type) {
          errorMessage = 'Type de demande invalide. Veuillez sélectionner un type valide.'
        } else if (errors?.service_type) {
          errorMessage = 'Service invalide. Veuillez sélectionner un service valide.'
        } else if (errors?.office) {
          errorMessage = 'Bureau invalide. Veuillez sélectionner un bureau valide.'
        } else if (errors?.visa_details) {
          errorMessage = 'Détails du visa invalides. Vérifiez les informations saisies.'
        } else if (errors?.passport_details) {
          errorMessage = 'Détails du passeport invalides. Vérifiez les informations saisies.'
        } else {
          errorMessage = 'Données invalides. Vérifiez tous les champs requis.'
        }
      } else if (error.response?.status === 403) {
        errorTitle = 'Accès refusé'
        errorMessage = 'Vous n\'avez pas les permissions pour créer cette demande.'
      } else if (error.response?.status === 422) {
        errorTitle = 'Validation échouée'
        errorMessage = 'Les données fournies ne respectent pas les règles de validation.'
      } else if (error.response?.status === 500) {
        errorTitle = 'Erreur serveur'
        errorMessage = 'Erreur interne du serveur. Veuillez réessayer plus tard.'
      } else if (!error.response) {
        errorTitle = 'Problème de connexion'
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.'
      } else {
        errorMessage = error.response?.data?.error || 'Erreur lors de la création'
      }
      
      toast.error(`${errorTitle}: ${errorMessage}`, {
        duration: 6000,
        style: {
          background: '#fee2e2',
          color: '#dc2626',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '16px',
          fontSize: '14px',
          maxWidth: '450px'
        }
      })
    }
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 10MB)')
      return
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Type de fichier non autorisé (PDF, JPG, PNG seulement)')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('document_type', docType)
      formData.append('description', `Document pour ${applicationType}`)

      const response = await documentsApi.upload(formData)
      setUploadedDocuments([...uploadedDocuments, response.data])
      toast.success('Document téléversé avec succès')
    } catch (error: any) {
      console.error('❌ Erreur téléversement:', error)
      
      let errorTitle = 'Erreur de téléversement'
      let errorMessage = 'Erreur lors du téléversement du fichier'
      
      if (error.response?.status === 400) {
        errorTitle = 'Fichier invalide'
        errorMessage = 'Le fichier ne respecte pas les critères requis (format, taille, etc.)'
      } else if (error.response?.status === 413) {
        errorTitle = 'Fichier trop volumineux'
        errorMessage = 'Le fichier dépasse la taille maximale autorisée (10MB)'
      } else if (error.response?.status === 415) {
        errorTitle = 'Format non supporté'
        errorMessage = 'Le format de fichier n\'est pas supporté (PDF, JPG, PNG seulement)'
      } else if (!error.response) {
        errorTitle = 'Problème de connexion'
        errorMessage = 'Impossible de téléverser le fichier. Vérifiez votre connexion internet.'
      } else {
        errorMessage = error.response?.data?.error || 'Erreur lors du téléversement'
      }
      
      toast.error(`${errorTitle}: ${errorMessage}`, {
        duration: 5000,
        style: {
          background: '#fee2e2',
          color: '#dc2626',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '16px',
          fontSize: '14px',
          maxWidth: '400px'
        }
      })
    } finally {
      setIsUploading(false)
    }
  }

  const removeDocument = (docId: number) => {
    setUploadedDocuments(uploadedDocuments.filter(doc => doc.id !== docId))
  }

  const onSubmit = (data: any) => {
    const payload = {
      application_type: applicationType,
      service_type: selectedService.id,
      office: selectedOffice,
      applicant_notes: data.applicant_notes || '',
      document_ids: uploadedDocuments.map(doc => doc.id),
    }

    // Add visa details if visa application
    if (applicationType === 'VISA') {
      payload.visa_details = {
        visa_type: data.visa_type,
        purpose_of_visit: data.purpose_of_visit,
        intended_entry_date: data.intended_entry_date,
        intended_departure_date: data.intended_departure_date,
        duration_days: data.duration_days,
        destination_city: data.destination_city,
        sponsor_name: data.sponsor_name || '',
        sponsor_phone: data.sponsor_phone || '',
      }
    }

    // Add passport details if passport application
    if (applicationType === 'PASSPORT' || applicationType === 'PASSPORT_RENEWAL') {
      payload.passport_details = {
        passport_type: applicationType === 'PASSPORT' ? 'NEW' : 'RENEWAL',
        current_passport_number: data.current_passport_number || '',
        current_passport_expiry_date: data.current_passport_expiry_date || null,
      }
    }

    createApplication.mutate(payload)
  }

  const applicationTypes = [
    { value: 'VISA', label: 'Visa', icon: '🛂' },
    { value: 'PASSPORT', label: 'Nouveau Passeport', icon: '📖' },
    { value: 'PASSPORT_RENEWAL', label: 'Renouvellement Passeport', icon: '🔄' },
    { value: 'LEGALIZATION', label: 'Légalisation', icon: '📄' },
    { value: 'ATTESTATION', label: 'Attestation', icon: '📜' },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Nouvelle demande</h1>
          <p className="text-gray-600">Créez votre demande en quelques étapes</p>
        </div>

        <ProgressBar current={step} total={4} label="Progression" />
        <div className="mb-8"></div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Type */}
          {step === 1 && (
            <div className="card">
              <h2 className="text-2xl font-bold mb-6">Type de demande</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {applicationTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setApplicationType(type.value)
                      setStep(2)
                    }}
                    className="p-6 border-2 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-center"
                  >
                    <div className="text-4xl mb-3">{type.icon}</div>
                    <p className="font-bold">{type.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Bureau & Service */}
          {step === 2 && (
            <div className="card space-y-6">
              <h2 className="text-2xl font-bold">Bureau et service</h2>

              <div>
                <label className="label">Bureau consulaire</label>
                <select
                  onChange={(e) => setSelectedOffice(Number(e.target.value))}
                  className="input"
                  value={selectedOffice || ''}
                >
                  <option value="">-- Sélectionner --</option>
                  {Array.isArray(offices) && offices.map((office: any) => (
                    <option key={office.id} value={office.id}>
                      {office.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Service spécifique</label>
                <select
                  onChange={(e) => {
                    const service = services?.find((s: any) => s.id === Number(e.target.value))
                    setSelectedService(service)
                  }}
                  className="input"
                  value={selectedService?.id || ''}
                >
                  <option value="">-- Sélectionner --</option>
                  {services?.filter((s: any) => s.category === (
                    applicationType === 'VISA' ? 'VISA' :
                    applicationType.includes('PASSPORT') ? 'PASSPORT' :
                    applicationType === 'LEGALIZATION' ? 'LEGAL' :
                    'ATTEST'
                  )).map((service: any) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {service.base_fee} XOF
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-4">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">
                  Retour
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!selectedOffice || !selectedService}
                  className="btn-primary flex-1"
                >
                  Continuer <FiChevronRight className="inline ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <div className="card space-y-6">
              <h2 className="text-2xl font-bold">Détails de la demande</h2>

              {applicationType === 'VISA' && (
                <>
                  <div>
                    <label className="label">Type de visa</label>
                    <select {...register('visa_type')} className="input" required>
                      <option value="">-- Sélectionner --</option>
                      <option value="TOURIST">Tourisme</option>
                      <option value="BUSINESS">Affaires</option>
                      <option value="WORK">Travail</option>
                      <option value="STUDY">Études</option>
                      <option value="FAMILY">Famille</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Motif du voyage</label>
                    <textarea {...register('purpose_of_visit')} className="input" required rows={3} />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Date d'entrée prévue</label>
                      <input type="date" {...register('intended_entry_date')} className="input" required />
                    </div>
                    <div>
                      <label className="label">Date de sortie prévue</label>
                      <input type="date" {...register('intended_departure_date')} className="input" required />
                    </div>
                  </div>

                  <div>
                    <label className="label">Durée du séjour (jours)</label>
                    <input type="number" {...register('duration_days')} className="input" required />
                  </div>

                  <div>
                    <label className="label">Ville de destination</label>
                    <input {...register('destination_city')} className="input" required />
                  </div>
                </>
              )}

              {(applicationType === 'PASSPORT' || applicationType === 'PASSPORT_RENEWAL') && (
                <>
                  {applicationType === 'PASSPORT_RENEWAL' && (
                    <>
                      <div>
                        <label className="label">Numéro de passeport actuel</label>
                        <input {...register('current_passport_number')} className="input" />
                      </div>
                      <div>
                        <label className="label">Date d'expiration</label>
                        <input type="date" {...register('current_passport_expiry_date')} className="input" />
                      </div>
                    </>
                  )}
                </>
              )}

              <div>
                <label className="label">Notes complémentaires</label>
                <textarea {...register('applicant_notes')} className="input" rows={3} />
              </div>

              <div className="flex space-x-4">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1">
                  Retour
                </button>
                <button type="button" onClick={() => setStep(4)} className="btn-primary flex-1">
                  Continuer <FiChevronRight className="inline ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Upload Documents */}
          {step === 4 && (
            <div className="card space-y-6">
              <h2 className="text-2xl font-bold">Documents requis</h2>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Documents à fournir :</h4>
                <ul className="text-sm space-y-1">
                  {selectedService?.required_documents?.split('\n').map((doc: string, i: number) => (
                    <li key={i}>• {doc}</li>
                  ))}
                </ul>
              </div>

              {/* Upload Areas */}
              <div className="space-y-4">
                {['PASSPORT', 'PHOTO', 'OTHER'].map((docType) => (
                  <div key={docType}>
                    <label className="label">
                      {docType === 'PASSPORT' ? 'Passeport' : docType === 'PHOTO' ? 'Photo d\'identité' : 'Autres documents'}
                      <HelpTooltip content="PDF, JPG ou PNG - Max 10MB" />
                    </label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, docType)}
                        className="hidden"
                        id={`file-${docType}`}
                        disabled={isUploading}
                      />
                      <label htmlFor={`file-${docType}`} className="cursor-pointer">
                        <FiUpload className="mx-auto mb-2 text-gray-400" size={32} />
                        <p className="text-sm text-gray-600">
                          Cliquer pour sélectionner un fichier
                        </p>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {/* Uploaded Documents */}
              {uploadedDocuments.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Documents téléversés :</h4>
                  <div className="space-y-2">
                    {uploadedDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FiCheckCircle className="text-green-500" />
                          <div>
                            <p className="font-medium">{doc.document_type_display}</p>
                            <p className="text-xs text-gray-600">{doc.original_filename}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDocument(doc.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FiX />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <button type="button" onClick={() => setStep(3)} className="btn-secondary flex-1">
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={uploadedDocuments.length === 0 || createApplication.isPending}
                  className="btn-primary flex-1"
                >
                  {createApplication.isPending ? 'Création...' : 'Créer la demande'}
                </button>
              </div>

              {uploadedDocuments.length === 0 && (
                <p className="text-sm text-yellow-600 text-center">
                  ⚠️ Vous devez téléverser au moins un document
                </p>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
