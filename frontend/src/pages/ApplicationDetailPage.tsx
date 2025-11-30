/**
 * Complete Application Detail Page
 * Page de détail complète d'une demande
 */
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FiDownload, FiCreditCard, FiX, FiFileText, FiCheckCircle } from 'react-icons/fi'
import { applicationsApi, paymentsApi } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ApplicationStatusTracker from '../components/ApplicationStatusTracker'

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: application, isLoading, refetch } = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationsApi.get(Number(id)).then(res => res.data),
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
    staleTime: 15000, // Considérer les données comme obsolètes après 15 secondes
  })

  const cancelMutation = useMutation({
    mutationFn: () => applicationsApi.cancel(Number(id)),
    onSuccess: () => {
      toast.success('Demande annulée')
      refetch()
    }
  })

  const submitMutation = useMutation({
    mutationFn: () => applicationsApi.submit(Number(id)),
    onSuccess: () => {
      toast.success('Demande soumise avec succès')
      refetch()
    }
  })

  if (isLoading) {
    return <LoadingSpinner text="Chargement..." />
  }

  if (!application) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card text-center">
          <p>Demande non trouvée</p>
        </div>
      </div>
    )
  }

  const canCancel = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'PAYMENT_PENDING'].includes(application.status)
  const needsPayment = application.status === 'PAYMENT_PENDING' && !application.is_paid
  const canSubmit = application.status === 'DRAFT'

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {application.application_type_display}
              </h1>
              <p className="text-gray-600">Référence : {application.reference_number}</p>
            </div>
            <span className={`badge badge-${getStatusColor(application.status)}`}>
              {application.status_display}
            </span>
          </div>
        </div>

        {/* Status Tracker */}
        <div className="mb-6">
          <ApplicationStatusTracker
            status={application.status}
            submittedAt={application.submitted_at}
            completedAt={application.completed_at}
          />
        </div>

        {/* Payment Alert */}
        {needsPayment && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start space-x-4">
              <FiCreditCard className="text-red-500 mt-1" size={32} />
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2 text-red-800">Paiement requis</h3>
                <p className="text-red-700 mb-4">
                  Veuillez effectuer le paiement de <strong>{application.total_fee} XOF</strong> pour continuer le traitement de votre demande.
                </p>
                <ProtectedFeatureLink to={`/payments/create/${application.id}`} feature="payments" className="btn-primary inline-block">
                  Payer maintenant
                </ProtectedFeatureLink>
              </div>
            </div>
          </div>
        )}

        {/* Ready Alert */}
        {application.status === 'READY' && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-start space-x-4">
              <FiCheckCircle className="text-green-500 mt-1" size={32} />
              <div>
                <h3 className="font-bold text-lg mb-2 text-green-800">Document prêt !</h3>
                <p className="text-green-700 mb-2">
                  Votre document est prêt pour retrait. Venez le récupérer pendant nos horaires d'ouverture.
                </p>
                <p className="text-sm text-green-600">
                  📍 {application.office_name}<br />
                  ⏰ Lundi-Vendredi : 9h-17h, Samedi : 9h-13h
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Details */}
          <div className="card">
            <h3 className="text-xl font-bold mb-4">Informations</h3>
            <div className="space-y-3">
              <InfoRow label="Type" value={application.application_type_display} />
              <InfoRow label="Service" value={application.service_name} />
              <InfoRow label="Bureau" value={application.office_name} />
              <InfoRow label="Statut" value={application.status_display} />
              <InfoRow label="Montant" value={`${application.total_fee} XOF`} />
              <InfoRow label="Payé" value={application.is_paid ? 'Oui ✅' : 'Non'} />
              {application.submitted_at && (
                <InfoRow 
                  label="Soumis le" 
                  value={new Date(application.submitted_at).toLocaleDateString('fr-FR')} 
                />
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="card">
            <h3 className="text-xl font-bold mb-4">Documents</h3>
            {application.documents && application.documents.length > 0 ? (
              <div className="space-y-2">
                {application.documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{doc.document_type_display}</p>
                      <p className="text-xs text-gray-600">{doc.original_filename}</p>
                    </div>
                    {doc.is_verified && (
                      <span className="text-green-500 text-sm">✓ Vérifié</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Aucun document</p>
            )}
          </div>
        </div>

        {/* Notes */}
        {(application.applicant_notes || application.admin_notes || application.rejection_reason) && (
          <div className="card mt-6">
            <h3 className="text-xl font-bold mb-4">Notes</h3>
            {application.applicant_notes && (
              <div className="mb-4">
                <p className="font-semibold text-sm text-gray-600">Vos notes :</p>
                <p className="text-gray-800">{application.applicant_notes}</p>
              </div>
            )}
            {application.admin_notes && (
              <div className="mb-4 bg-blue-50 p-4 rounded-lg">
                <p className="font-semibold text-sm text-blue-800 mb-2">Notes de l'administration :</p>
                <p className="text-blue-900">{application.admin_notes}</p>
              </div>
            )}
            {application.rejection_reason && (
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="font-semibold text-sm text-red-800 mb-2">Motif de rejet :</p>
                <p className="text-red-900">{application.rejection_reason}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="card mt-6">
          <div className="flex flex-wrap gap-4">
            {canSubmit && (
              <button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
                className="btn-primary"
              >
                Soumettre la demande
              </button>
            )}
            {needsPayment && (
              <ProtectedFeatureLink to={`/payments/create/${application.id}`} feature="payments" className="btn-primary">
                <FiCreditCard className="inline mr-2" />
                Payer maintenant
              </ProtectedFeatureLink>
            )}
            {canCancel && (
              <button
                onClick={() => {
                  if (confirm('Êtes-vous sûr de vouloir annuler cette demande ?')) {
                    cancelMutation.mutate()
                  }
                }}
                disabled={cancelMutation.isPending}
                className="btn-secondary text-red-600"
              >
                <FiX className="inline mr-2" />
                Annuler la demande
              </button>
            )}
            <button onClick={() => navigate('/applications')} className="btn-secondary">
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b last:border-0">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    DRAFT: 'secondary',
    SUBMITTED: 'info',
    UNDER_REVIEW: 'warning',
    PAYMENT_PENDING: 'warning',
    PAYMENT_RECEIVED: 'info',
    PROCESSING: 'info',
    READY: 'success',
    COMPLETED: 'success',
    REJECTED: 'danger',
    CANCELLED: 'secondary',
  }
  return colors[status] || 'info'
}
