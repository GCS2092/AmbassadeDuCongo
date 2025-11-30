/**
 * Complete Appointment Booking Page
 * Formulaire complet de prise de rendez-vous
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { FiMapPin, FiFileText, FiChevronRight } from 'react-icons/fi'
import { officesApi, servicesApi, appointmentsApi } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'
import Checklist from '../components/Checklist'
import AppointmentQRCode from '../components/AppointmentQRCode'
import ServiceFilter from '../components/ServiceFilter'
import ServiceCard from '../components/ServiceCard'
import ServiceQRCode from '../components/ServiceQRCode'
import { debugComponent } from '../utils/debugHelper'
import { useQueryClient } from '@tanstack/react-query'

const appointmentSchema = z.object({
  office: z.number().min(1, 'Bureau requis'),
  service_type: z.number().min(1, 'Service requis'),
  appointment_date: z.string().min(1, 'Date requise'),
  appointment_time: z.string().min(1, 'Heure requise'),
  user_notes: z.string().optional(),
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

export default function AppointmentBookingPage() {
  const [step, setStep] = useState(1)
  const [selectedOffice, setSelectedOffice] = useState<number | null>(null)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [filteredServices, setFilteredServices] = useState<any[]>([])
  const [checklistItems, setChecklistItems] = useState([
    { id: '1', label: 'J\'ai vérifié la date et l\'heure', completed: true, required: true },
    { id: '2', label: 'Je serai disponible à cette date', completed: false, required: true },
    { id: '3', label: 'J\'ai les documents requis', completed: false, required: true },
  ])
  const [showQRCode, setShowQRCode] = useState(false)
  const [confirmedAppointment, setConfirmedAppointment] = useState<any>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Mutation pour créer un rendez-vous
  const createAppointment = useMutation({
    mutationFn: appointmentsApi.create,
    onSuccess: async (data) => {
      console.log('✅ Rendez-vous créé avec succès:', data);
      toast.success('Rendez-vous créé avec succès !');
      
      // Invalider les queries pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'upcoming'] });
      
      // Traiter le QR code et l'email
      await handleAppointmentConfirmation(data);
    },
    onError: (error: any) => {
      console.error('❌ Erreur lors de la création du rendez-vous:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la création du rendez-vous');
    }
  })

  // Fonction pour gérer le toggle des éléments de la checklist
  const handleChecklistToggle = (itemId: string) => {
    console.log('🔄 Toggle checklist item:', itemId);
    setChecklistItems(prevItems => {
      const newItems = prevItems.map(item =>
        item.id === itemId
          ? { ...item, completed: !item.completed }
          : item
      );
      console.log('🔄 New checklist items:', newItems);
      return newItems;
    });
  };

  // Fonction pour traiter la confirmation du rendez-vous
  const handleAppointmentConfirmation = async (appointmentData: any) => {
    try {
      console.log('📧 Processing appointment confirmation for:', appointmentData);
      
      // Préparer les données du QR code
      const qrData = {
        appointment: {
          id: appointmentData.id,
          date: appointmentData.appointment_date,
          time: appointmentData.appointment_time,
          service: selectedService?.name || 'Service consulaire',
          status: appointmentData.status
        },
        user: {
          name: `${appointmentData.user?.first_name || ''} ${appointmentData.user?.last_name || ''}`.trim(),
          email: appointmentData.user?.email || ''
        },
        embassy: {
          name: "Ambassade de la République du Congo - Sénégal",
          address: "Stèle Mermoz, Pyrotechnie, P.O. Box 5243, Dakar, Sénégal",
          phone: "+221 824 8398",
          phone2: "+221 649 3117",
          email: "contact@ambassade-congo.sn",
          website: "https://ambassade-congo.sn"
        },
        instructions: {
          scanDate: new Date().toISOString(),
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          message: "Présenter ce QR code à la réception de l'ambassade",
          arrivalTime: "Arriver 15 minutes avant l'heure du rendez-vous",
          requiredDocuments: "Pièce d'identité valide requise"
        }
      };

      // Générer le QR code en base64
      const QRCode = await import('qrcode');
      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData, null, 2), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      // Préparer les données pour l'email
      const emailData = {
        to: appointmentData.user?.email,
        subject: `QR Code de votre rendez-vous - ${selectedService?.name || 'Service consulaire'}`,
        appointmentId: appointmentData.id,
        userInfo: {
          name: `${appointmentData.user?.first_name || ''} ${appointmentData.user?.last_name || ''}`.trim(),
          email: appointmentData.user?.email || ''
        },
        appointmentDetails: {
          date: appointmentData.appointment_date,
          time: appointmentData.appointment_time,
          service: selectedService?.name || '',
          office: (Array.isArray(offices) ? offices : offices?.data || []).find((o: any) => o.id === selectedOffice)?.name || ''
        },
        qrCodeDataUrl: qrCodeDataUrl
      };

      // Envoyer l'email
      const response = await fetch('/api/notifications/send-appointment-qr/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (response.ok) {
        console.log('✅ Email avec QR code envoyé avec succès');
        toast.success('Email de confirmation envoyé !');
      } else {
        console.warn('⚠️ Erreur lors de l\'envoi de l\'email, mais le rendez-vous est créé');
      }

      // Afficher le QR code
      setConfirmedAppointment({
        id: appointmentData.id,
        qrCodeDataUrl: qrCodeDataUrl,
        userInfo: emailData.userInfo,
        appointmentDetails: emailData.appointmentDetails
      });
      
      setShowQRCode(true);
      setStep(4);

    } catch (error) {
      console.error('❌ Erreur lors du traitement de la confirmation:', error);
      // Le rendez-vous est créé même si l'email échoue
      setShowQRCode(true);
      setStep(4);
    }
  };


  // Fetch des bureaux et services avec données de fallback
  const { data: offices, isLoading: officesLoading } = useQuery({
    queryKey: ['offices'],
    queryFn: async () => {
      try {
        return await officesApi.list();
      } catch (error) {
        console.warn('Failed to fetch offices, using fallback data');
        return fallbackOffices;
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const { data: servicesResponse, isLoading: servicesLoading, error: servicesError } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      try {
        const response = await servicesApi.list();
        return response.data;
      } catch (error) {
        console.error('Failed to fetch services:', error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Extraire les services du format de réponse de l'API
  const services = Array.isArray(servicesResponse) 
    ? servicesResponse 
    : servicesResponse?.results || []

  // Données de fallback si l'API ne répond pas
  const fallbackOffices = [
    {
      id: 1,
      name: "Ambassade de la République du Congo - Dakar",
      address: "Stèle Mermoz, Pyrotechnie, P.O. Box 5243, Dakar, Sénégal",
      phone: "+221 824 8398",
      email: "contact@ambassade-congo.sn",
      is_active: true
    }
  ]

  const fallbackServices = [
    {
      id: 1,
      name: "Visa Tourisme",
      description: "Visa pour séjour touristique",
      fee: "50,000",
      processing_time: "5 jours ouvrés",
      is_active: true
    },
    {
      id: 2,
      name: "Visa Affaires",
      description: "Visa pour séjour d'affaires",
      fee: "75,000",
      processing_time: "3 jours ouvrés",
      is_active: true
    },
    {
      id: 3,
      name: "Passeport Nouveau",
      description: "Demande de nouveau passeport",
      fee: "100,000",
      processing_time: "10 jours ouvrés",
      is_active: true
    },
    {
      id: 4,
      name: "Renouvellement Passeport",
      description: "Renouvellement de passeport",
      fee: "90,000",
      processing_time: "7 jours ouvrés",
      is_active: true
    }
  ]

  // Utiliser les données de l'API
  const displayOffices = Array.isArray(offices) ? offices : (offices?.data || [])
  const displayServices = services || []

  // Configuration du formulaire
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      office: selectedOffice || undefined,
      service_type: selectedService?.id || undefined,
    }
  })

  // Calcul des éléments de validation
  const allRequiredCompleted = checklistItems
    .filter(item => item.required)
    .every(item => item.completed)

  // Debug complet du formulaire (après useForm)
  const formData = watch ? watch() : {};
  console.log('🔍 FORM STATE DEBUG:', {
    step,
    formData,
    selectedOffice,
    selectedService: selectedService?.name,
    allRequiredCompleted,
    checklistItems,
    errors,
    isSubmitting: createAppointment.isPending
  });

  debugComponent('AppointmentBookingPage', {
    step,
    checklistItems,
    allRequiredCompleted,
    selectedOffice,
    selectedService: selectedService?.name,
    formData
  });

  const onSubmit = (data: AppointmentFormData) => {
    console.log('🚀🚀🚀 FORM SUBMIT: onSubmit called 🚀🚀🚀');
    console.log('🚀 Submitting appointment form:', data);
    console.log('🚀 All required completed:', allRequiredCompleted);
    console.log('🚀 Selected office:', selectedOffice);
    console.log('🚀 Selected service:', selectedService);
    console.log('🚀 Checklist items:', checklistItems);
    console.log('🚀 Form data validation:', data);
    console.log('🚀 Form validation errors:', errors);
    
    // Vérifier si toutes les données requises sont présentes
    if (!data.office || !data.service_type || !data.appointment_date || !data.appointment_time) {
      console.log('❌ FORM VALIDATION ERROR: Missing required fields', {
        office: data.office,
        service_type: data.service_type,
        appointment_date: data.appointment_date,
        appointment_time: data.appointment_time
      });
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    // Vérifier si toutes les cases de la checklist sont cochées
    if (!allRequiredCompleted) {
      console.log('❌ CHECKLIST VALIDATION ERROR: Not all required items completed', {
        checklistItems,
        allRequiredCompleted
      });
      toast.error('Veuillez confirmer tous les éléments de la checklist');
      return;
    }

    console.log('✅✅✅ All checks passed, calling createAppointment.mutate ✅✅✅');
    createAppointment.mutate(data as any)
  }

  const nextStep = () => {
    if (step < 4) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleOfficeSelect = (officeId: number) => {
    console.log('🏢 Office selected:', officeId);
    setSelectedOffice(officeId)
    setValue('office', officeId)
    nextStep()
  }

  const handleServiceSelect = (service: any) => {
    console.log('🔧 Service selected:', service);
    setSelectedService(service)
    setValue('service_type', service.id)
    nextStep()
  }

  // Ne plus bloquer si les données de fallback sont disponibles
  const isLoading = officesLoading && servicesLoading

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Prendre un rendez-vous
          </h1>
          <p className="text-gray-600">
            Réservez votre créneau pour vos démarches consulaires
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div className={`w-12 h-1 ml-2 ${
                    step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span>Bureau</span>
            <span>Service</span>
            <span>Date & Heure</span>
            <span>Confirmation</span>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-sm p-6">
          {isLoading && <LoadingSpinner />}
          
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Choisir le bureau consulaire
              </h2>
              
              {!officesLoading && displayOffices.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ Mode hors ligne : Utilisation des données de démonstration
                  </p>
                </div>
              )}
              
              <div className="grid gap-4">
                {displayOffices.map((office: any) => (
                  <div
                    key={office.id}
                    onClick={() => handleOfficeSelect(office.id)}
                    className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <FiMapPin className="w-5 h-5 text-blue-600 mt-1" />
                      <div>
                        <h3 className="font-medium text-gray-900">{office.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{office.address}</p>
                        <p className="text-sm text-gray-500 mt-1">{office.phone}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Choisir le service
                </h2>
                <button
                  type="button"
                  onClick={prevStep}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  ← Retour
                </button>
              </div>
              
              {servicesLoading ? (
                <LoadingSpinner text="Chargement des services..." />
              ) : servicesError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 text-sm">
                    ❌ Erreur lors du chargement des services. Veuillez réessayer.
                  </p>
                </div>
              ) : services.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ Aucun service disponible pour le moment.
                  </p>
                </div>
              ) : (
                <>
                  {/* Filtres de services */}
                  <ServiceFilter 
                    services={services}
                    onFilteredServices={setFilteredServices}
                  />
                  
                  {/* Liste des services */}
                  <div className="grid gap-4">
                    {filteredServices.map((service: any) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        onSelect={handleServiceSelect}
                        isSelected={selectedService?.id === service.id}
                      />
                    ))}
                  </div>
                  
                  {filteredServices.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Aucun service ne correspond à vos critères de recherche.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Choisir la date et l'heure
                </h2>
                <button
                  type="button"
                  onClick={prevStep}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  ← Retour
                </button>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date du rendez-vous
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  {...register('appointment_date')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.appointment_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.appointment_date.message}</p>
                )}
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure du rendez-vous
                </label>
                <select
                  {...register('appointment_time')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner une heure</option>
                  {Array.from({ length: 8 }, (_, i) => {
                    const hour = 9 + i;
                    return (
                      <option key={hour} value={`${hour}:00`}>
                        {hour}:00
                      </option>
                    );
                  })}
                </select>
                {errors.appointment_time && (
                  <p className="mt-1 text-sm text-red-600">{errors.appointment_time.message}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  {...register('user_notes')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ajoutez des informations complémentaires..."
                />
              </div>

              {/* Checklist */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Confirmez les éléments suivants :</h3>
                <Checklist
                  title="Confirmez les éléments suivants :"
                  items={checklistItems}
                  onToggle={handleChecklistToggle}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={createAppointment.isPending || !allRequiredCompleted}
                className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                  createAppointment.isPending || !allRequiredCompleted
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {createAppointment.isPending ? 'Confirmation...' : 'Confirmer le rendez-vous'}
              </button>
            </div>
          )}

          {step === 4 && showQRCode && (
            <div className="text-center space-y-6">
              <div className="text-green-600">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <h2 className="text-2xl font-semibold mb-2">Rendez-vous confirmé !</h2>
                <p className="text-gray-600">Votre rendez-vous a été enregistré avec succès</p>
              </div>

              {confirmedAppointment && (
                <AppointmentQRCode
                  appointmentId={confirmedAppointment?.id}
                  userInfo={{
                    name: `${confirmedAppointment?.user?.first_name || ''} ${confirmedAppointment?.user?.last_name || ''}`.trim(),
                    email: confirmedAppointment?.user?.email || ''
                  }}
                  appointmentDetails={{
                    date: confirmedAppointment?.appointment_date || '',
                    time: confirmedAppointment?.appointment_time || '',
                    service: selectedService?.name || '',
                    office: (Array.isArray(displayOffices) ? displayOffices : []).find((o: any) => o.id === selectedOffice)?.name || ''
                  }}
                  onClose={() => setShowQRCode(false)}
                />
              )}

              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setStep(1)
                    setShowQRCode(false)
                    setConfirmedAppointment(null)
                    reset()
                    navigate('/appointments')
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Voir mes rendez-vous
                </button>
                <button
                  onClick={() => {
                    setStep(1)
                    setShowQRCode(false)
                    setConfirmedAppointment(null)
                    reset()
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
                >
                  Nouveau rendez-vous
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
 