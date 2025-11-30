/**
 * Modal d'édition des demandes pour l'admin
 */
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  FiX, FiSave, FiUser, FiCalendar, FiDollarSign, 
  FiFileText, FiAlertCircle, FiCheckCircle
} from 'react-icons/fi'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsApi } from '../lib/api'
import LoadingSpinner from './LoadingSpinner'
import ErrorMessage from './ErrorMessage'
import FormField from './FormField'
import Input from './FormField'
import toast from 'react-hot-toast'

const applicationSchema = z.object({
  application_type: z.string().min(1, 'Type de demande requis'),
  service_type: z.number().min(1, 'Service requis'),
  applicant: z.number().min(1, 'Demandeur requis'),
  office: z.number().min(1, 'Bureau consulaire requis'),
  status: z.string().min(1, 'Statut requis'),
  base_fee: z.number().min(0, 'Frais de base doit être positif'),
  additional_fees: z.number().min(0, 'Frais additionnels doit être positif'),
  applicant_notes: z.string().optional(),
  admin_notes: z.string().optional(),
  assigned_agent: z.number().optional()
})

type ApplicationFormData = z.infer<typeof applicationSchema>

interface ApplicationEditModalProps {
  isOpen: boolean
  onClose: () => void
  application: any
  onSuccess: () => void
}

export default function ApplicationEditModal({
  isOpen,
  onClose,
  application,
  onSuccess
}: ApplicationEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      application_type: application?.application_type || '',
      service_type: application?.service_type || 0,
      applicant: application?.applicant || 0,
      office: application?.office || 0,
      status: application?.status || 'DRAFT',
      base_fee: application?.base_fee || 0,
      additional_fees: application?.additional_fees || 0,
      applicant_notes: application?.applicant_notes || '',
      admin_notes: application?.admin_notes || '',
      assigned_agent: application?.assigned_agent || 0
    }
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: ApplicationFormData) => 
      applicationsApi.update(application.id, data),
    onSuccess: () => {
      toast.success('Demande mise à jour avec succès')
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      onSuccess()
    },
    onError: (error: any) => {
      console.error('❌ Erreur mise à jour demande:', error)
      toast.error('Erreur lors de la mise à jour de la demande')
    }
  })

  // Reset form when application changes
  useEffect(() => {
    if (application && isOpen) {
      reset({
        application_type: application.application_type || '',
        service_type: application.service_type || 0,
        applicant: application.applicant || 0,
        office: application.office || 0,
        status: application.status || 'DRAFT',
        base_fee: application.base_fee || 0,
        additional_fees: application.additional_fees || 0,
        applicant_notes: application.applicant_notes || '',
        admin_notes: application.admin_notes || '',
        assigned_agent: application.assigned_agent || 0
      })
    }
  }, [application, isOpen, reset])

  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true)
    try {
      await updateMutation.mutateAsync(data)
    } catch (error) {
      console.error('❌ Erreur soumission:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  const totalFee = (watch('base_fee') || 0) + (watch('additional_fees') || 0)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <FiEdit className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Modifier la demande
                  </h3>
                  <p className="text-sm text-gray-500">
                    {application?.reference_number}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <FiX size={24} />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Type de demande */}
                <FormField
                  label="Type de demande"
                  error={errors.application_type?.message}
                  required
                >
                  <select
                    {...register('application_type')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner un type</option>
                    <option value="VISA">Visa</option>
                    <option value="PASSPORT">Passeport</option>
                    <option value="PASSPORT_RENEWAL">Renouvellement de passeport</option>
                    <option value="BIRTH_CERT">Acte de naissance</option>
                    <option value="MARRIAGE_CERT">Acte de mariage</option>
                    <option value="LEGALIZATION">Légalisation de document</option>
                    <option value="ATTESTATION">Attestation consulaire</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </FormField>

                {/* Statut */}
                <FormField
                  label="Statut"
                  error={errors.status?.message}
                  required
                >
                  <select
                    {...register('status')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="DRAFT">Brouillon</option>
                    <option value="SUBMITTED">Soumis</option>
                    <option value="UNDER_REVIEW">En cours de vérification</option>
                    <option value="ADDITIONAL_INFO_REQUIRED">Informations supplémentaires requises</option>
                    <option value="PAYMENT_PENDING">En attente de paiement</option>
                    <option value="PAYMENT_RECEIVED">Paiement reçu</option>
                    <option value="PROCESSING">En traitement</option>
                    <option value="READY">Prêt pour retrait</option>
                    <option value="COMPLETED">Terminé</option>
                    <option value="REJECTED">Rejeté</option>
                    <option value="CANCELLED">Annulé</option>
                  </select>
                </FormField>

                {/* Service */}
                <FormField
                  label="Service"
                  error={errors.service_type?.message}
                  required
                >
                  <Input
                    type="number"
                    {...register('service_type', { valueAsNumber: true })}
                    placeholder="ID du service"
                  />
                </FormField>

                {/* Bureau consulaire */}
                <FormField
                  label="Bureau consulaire"
                  error={errors.office?.message}
                  required
                >
                  <Input
                    type="number"
                    {...register('office', { valueAsNumber: true })}
                    placeholder="ID du bureau"
                  />
                </FormField>

                {/* Demandeur */}
                <FormField
                  label="Demandeur"
                  error={errors.applicant?.message}
                  required
                >
                  <Input
                    type="number"
                    {...register('applicant', { valueAsNumber: true })}
                    placeholder="ID du demandeur"
                  />
                </FormField>

                {/* Agent assigné */}
                <FormField
                  label="Agent assigné"
                  error={errors.assigned_agent?.message}
                >
                  <Input
                    type="number"
                    {...register('assigned_agent', { valueAsNumber: true })}
                    placeholder="ID de l'agent (optionnel)"
                  />
                </FormField>

                {/* Frais de base */}
                <FormField
                  label="Frais de base (€)"
                  error={errors.base_fee?.message}
                  required
                >
                  <Input
                    type="number"
                    step="0.01"
                    {...register('base_fee', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </FormField>

                {/* Frais additionnels */}
                <FormField
                  label="Frais additionnels (€)"
                  error={errors.additional_fees?.message}
                >
                  <Input
                    type="number"
                    step="0.01"
                    {...register('additional_fees', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </FormField>

                {/* Total calculé */}
                <div className="md:col-span-2">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Total des frais:
                      </span>
                      <span className="text-lg font-semibold text-gray-900">
                        {totalFee.toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes du demandeur */}
                <FormField
                  label="Notes du demandeur"
                  error={errors.applicant_notes?.message}
                >
                  <textarea
                    {...register('applicant_notes')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Notes du demandeur..."
                  />
                </FormField>

                {/* Notes administratives */}
                <FormField
                  label="Notes administratives"
                  error={errors.admin_notes?.message}
                >
                  <textarea
                    {...register('admin_notes')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Notes administratives..."
                  />
                </FormField>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2" size={16} />
                    Sauvegarder
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
