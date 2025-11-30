import React, { useState, useMemo } from 'react'
import { FiSearch, FiFilter, FiX } from 'react-icons/fi'

interface Service {
  id: number
  name: string
  category: string
  category_display: string
  description?: string
  base_fee: string
  processing_time_days: number
  requires_appointment: boolean
}

interface ServiceFilterProps {
  services: Service[]
  onFilteredServices: (filtered: Service[]) => void
}

const categories = [
  { value: 'all', label: 'Tous les services' },
  { value: 'VISA', label: 'Visa' },
  { value: 'PASSPORT', label: 'Passeport' },
  { value: 'CIVIL', label: 'Actes Civils' },
  { value: 'LEGAL', label: 'Légalisation' },
  { value: 'ATTEST', label: 'Attestation' },
  { value: 'OTHER', label: 'Autre' }
]

export default function ServiceFilter({ services, onFilteredServices }: ServiceFilterProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  const filteredServices = useMemo(() => {
    let filtered = services

    // Filtre par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory)
    }

    // Filtre par terme de recherche
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(term) ||
        service.description?.toLowerCase().includes(term) ||
        service.category_display.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [services, searchTerm, selectedCategory])

  // Notifier le composant parent des services filtrés
  React.useEffect(() => {
    onFilteredServices(filteredServices)
  }, [filteredServices, onFilteredServices])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('all')
  }

  const hasActiveFilters = searchTerm.trim() || selectedCategory !== 'all'

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Barre de recherche */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Rechercher un service..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <FiX className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FiFilter className="h-4 w-4" />
            Filtres
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <FiX className="h-4 w-4" />
              Effacer les filtres
            </button>
          )}
        </div>

        <div className="text-sm text-gray-600">
          {filteredServices.length} service{filteredServices.length > 1 ? 's' : ''} trouvé{filteredServices.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Filtres déroulants */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
