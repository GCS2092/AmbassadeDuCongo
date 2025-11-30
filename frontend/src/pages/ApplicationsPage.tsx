import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import ProtectedFeatureLink from '../components/ProtectedFeatureLink'
import { applicationsApi } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { FiPlus, FiFileText } from 'react-icons/fi'
import { debugAPI, safeArrayAccess, debugComponent } from '../utils/debugHelper'

export default function ApplicationsPage() {
  const { data: applicationsResponse, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: () => {
      debugAPI.logRequest('/applications/', 'GET');
      return applicationsApi.list().then(res => {
        debugAPI.logResponse('/applications/', res.status, res.data);
        return res.data;
      }).catch(error => {
        debugAPI.logError('/applications/', error);
        throw error;
      });
    }
  })

  const applications = safeArrayAccess(applicationsResponse);
  debugComponent('ApplicationsPage', { applicationsCount: applications.length, isLoading });

  if (isLoading) {
    return <LoadingSpinner text="Chargement..." />
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Mes Demandes</h1>
        <ProtectedFeatureLink to="/applications/new" feature="applications" className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto">
          <FiPlus />
          <span>Nouvelle demande</span>
        </ProtectedFeatureLink>
      </div>

      {applications && applications.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          {applications.map((application: any) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <FiFileText className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-600 mb-4">Vous n'avez aucune demande</p>
          <ProtectedFeatureLink to="/applications/new" feature="applications" className="btn-primary inline-block">
            Créer une demande
          </ProtectedFeatureLink>
        </div>
      )}
    </div>
  )
}

function ApplicationCard({ application }: any) {
  const statusColors: any = {
    DRAFT: 'badge-secondary',
    SUBMITTED: 'badge-info',
    UNDER_REVIEW: 'badge-warning',
    PROCESSING: 'badge-info',
    READY: 'badge-success',
    COMPLETED: 'badge-success',
    REJECTED: 'badge-danger',
  }

  return (
    <Link to={`/applications/${application.id}`} className="card hover:shadow-lg transition block p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
            <h3 className="text-lg sm:text-xl font-bold truncate">{application.application_type_display}</h3>
            <span className={`badge text-xs ${statusColors[application.status]} self-start`}>
              {application.status_display}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2 truncate">
            Réf: {application.reference_number}
          </p>
          <p className="text-sm text-gray-500 truncate">
            {application.service_name} • {application.office_name}
          </p>
          {application.submitted_at && (
            <p className="text-xs text-gray-500 mt-2">
              Soumis le {new Date(application.submitted_at).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary-500">
            {application.total_fee} XOF
          </p>
          {application.is_paid && (
            <span className="text-xs text-green-600">✓ Payé</span>
          )}
        </div>
      </div>
    </Link>
  )
}

