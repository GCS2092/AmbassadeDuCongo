import { Link } from 'react-router-dom'
import { FiHome } from 'react-icons/fi'

export default function NotFoundPage() {
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <h2 className="text-3xl font-bold mb-4">Page non trouvée</h2>
      <p className="text-gray-600 mb-8">
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <Link to="/" className="btn-primary inline-flex items-center space-x-2">
        <FiHome />
        <span>Retour à l'accueil</span>
      </Link>
    </div>
  )
}

