import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { faqApi } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  const { data: faqs, isLoading } = useQuery({
    queryKey: ['faq', selectedCategory],
    queryFn: () => faqApi.list(selectedCategory || undefined).then(res => res.data)
  })

  const categories = [
    { value: 'VISA', label: 'Visa' },
    { value: 'PASSPORT', label: 'Passeport' },
    { value: 'APPOINTMENT', label: 'Rendez-vous' },
    { value: 'DOCUMENTS', label: 'Documents' },
    { value: 'PAYMENT', label: 'Paiement' },
    { value: 'GENERAL', label: 'Général' },
  ]

  if (isLoading) {
    return <LoadingSpinner text="Chargement..." />
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Questions Fréquentes</h1>
        <p className="text-xl text-gray-600">
          Trouvez rapidement les réponses à vos questions
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full transition ${
            selectedCategory === null
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Toutes
        </button>
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-4 py-2 rounded-full transition ${
              selectedCategory === cat.value
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* FAQ List */}
      <div className="max-w-4xl mx-auto space-y-4">
        {faqs && faqs.length > 0 ? (
          faqs.map((faq: any) => <FAQItem key={faq.id} faq={faq} />)
        ) : (
          <div className="text-center py-12 text-gray-500">
            Aucune question disponible pour cette catégorie
          </div>
        )}
      </div>
    </div>
  )
}

function FAQItem({ faq }: any) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-start justify-between text-left"
      >
        <div className="flex-1">
          <span className="badge badge-info mr-3">{faq.category_display}</span>
          <h3 className="font-semibold inline">{faq.question}</h3>
        </div>
        <div className="ml-4 flex-shrink-0">
          {isOpen ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
        </div>
      </button>
      
      {isOpen && (
        <div className="mt-4 pt-4 border-t text-gray-700">
          {faq.answer}
        </div>
      )}
    </div>
  )
}

