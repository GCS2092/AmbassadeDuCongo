import { useQuery } from '@tanstack/react-query'
import { servicesApi } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { FiClock, FiDollarSign, FiFileText } from 'react-icons/fi'

export default function ServicesPage() {
  const { data: servicesResponse, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.list().then(res => res.data)
  })

  // Extraire les services du format paginé
  const services = Array.isArray(servicesResponse) 
    ? servicesResponse 
    : (servicesResponse?.results || [])

  if (isLoading) {
    return <LoadingSpinner text="Chargement des services..." />
  }

  // Protection contre les erreurs de données
  const safeServices = Array.isArray(services) ? services : []
  
  console.log('🔍 Services reçus:', servicesResponse)
  console.log('🔍 Services extraits:', services)
  console.log('🔍 Services sécurisés:', safeServices)
  
  const groupedServices = safeServices.reduce((acc: any, service: any) => {
    if (!acc[service.category]) {
      acc[service.category] = []
    }
    acc[service.category].push(service)
    return acc
  }, {})

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Services Consulaires</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Découvrez nos services et prenez rendez-vous en ligne
        </p>
      </div>

      {Object.keys(groupedServices).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Aucun service disponible pour le moment.</p>
        </div>
      ) : (
        Object.entries(groupedServices).map(([category, categoryServices]: any) => (
        <div key={category} className="mb-12">
          <h2 className="text-2xl font-bold mb-6 border-b pb-2">
            {categoryServices[0].category_display}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryServices.map((service: any) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
        ))
      )}
    </div>
  )
}

function ServiceCard({ service }: any) {
  return (
    <div className="card">
      <h3 className="text-xl font-bold mb-3">{service.name}</h3>
      <p className="text-gray-600 mb-4 text-sm">{service.description}</p>
      
      <div className="space-y-2 mb-4 text-sm">
        <div className="flex items-center space-x-2 text-gray-700">
          <FiDollarSign className="text-primary-500" />
          <span>{service.base_fee} XOF</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-700">
          <FiClock className="text-primary-500" />
          <span>{service.processing_time_days} jours</span>
        </div>
        {service.requires_appointment && (
          <div className="flex items-center space-x-2 text-gray-700">
            <FiFileText className="text-primary-500" />
            <span>Rendez-vous requis</span>
          </div>
        )}
      </div>
      
      {service.requires_appointment && (
        <a href="/appointments/book" className="btn-primary w-full text-center block">
          Prendre rendez-vous
        </a>
      )}
    </div>
  )
}

