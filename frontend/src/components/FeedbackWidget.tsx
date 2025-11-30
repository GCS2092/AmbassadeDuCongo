/**
 * Feedback Widget - Recueillir les avis utilisateurs
 * Gratuit - Sauvegarde dans la base de données
 */
import { useState } from 'react'
import { FiThumbsUp, FiThumbsDown, FiSend } from 'react-icons/fi'
import toast from 'react-hot-toast'

interface FeedbackWidgetProps {
  page: string
  context?: string
}

export default function FeedbackWidget({ page, context }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!rating) {
      toast.error('Veuillez sélectionner un avis')
      return
    }

    try {
      const { feedbackApi } = await import('../lib/api')
      await feedbackApi.submit({
        page,
        context,
        rating: rating.toUpperCase(),
        comment,
      })
      
      setSubmitted(true)
      toast.success('Merci pour votre retour !')
      
      setTimeout(() => {
        setIsOpen(false)
        setSubmitted(false)
        setRating(null)
        setComment('')
      }, 2000)
    } catch (error) {
      toast.error('Erreur lors de l\'envoi')
    }
  }

  if (submitted) {
    return (
      <div className="fixed bottom-24 right-6 bg-white rounded-lg shadow-lg p-6 w-80 z-30">
        <div className="text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="font-bold text-lg mb-2">Merci !</h3>
          <p className="text-gray-600 text-sm">
            Votre avis nous aide à améliorer nos services.
          </p>
        </div>
      </div>
    )
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 bg-white rounded-lg shadow-lg px-4 py-2 hover:shadow-xl transition z-30 flex items-center space-x-2 text-sm"
      >
        <span>💬</span>
        <span>Votre avis ?</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-24 right-6 bg-white rounded-lg shadow-xl p-6 w-80 z-30">
      <h3 className="font-bold text-lg mb-4">Donnez votre avis</h3>
      
      {/* Rating */}
      <div className="flex justify-center space-x-4 mb-4">
        <button
          onClick={() => setRating('positive')}
          className={`p-4 rounded-lg border-2 transition ${
            rating === 'positive'
              ? 'border-green-500 bg-green-50 text-green-600'
              : 'border-gray-300 hover:border-green-500'
          }`}
        >
          <FiThumbsUp size={32} />
          <p className="text-sm mt-2">Satisfait</p>
        </button>
        
        <button
          onClick={() => setRating('negative')}
          className={`p-4 rounded-lg border-2 transition ${
            rating === 'negative'
              ? 'border-red-500 bg-red-50 text-red-600'
              : 'border-gray-300 hover:border-red-500'
          }`}
        >
          <FiThumbsDown size={32} />
          <p className="text-sm mt-2">Insatisfait</p>
        </button>
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Commentaire (optionnel)"
        className="w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
        rows={3}
      />

      {/* Actions */}
      <div className="flex space-x-2">
        <button
          onClick={() => setIsOpen(false)}
          className="flex-1 btn-secondary"
        >
          Annuler
        </button>
        <button
          onClick={handleSubmit}
          disabled={!rating}
          className="flex-1 btn-primary flex items-center justify-center space-x-2"
        >
          <FiSend size={16} />
          <span>Envoyer</span>
        </button>
      </div>
    </div>
  )
}

