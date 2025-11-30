/**
 * Checklist Component - Pour guider l'utilisateur
 * Avant rendez-vous ou soumission de demande
 */
import { FiCheckCircle, FiCircle } from 'react-icons/fi'

interface ChecklistItem {
  id: string
  label: string
  completed: boolean
  required: boolean
}

interface ChecklistProps {
  title: string
  items: ChecklistItem[]
  onToggle?: (itemId: string) => void
}

export default function Checklist({ title, items, onToggle }: ChecklistProps) {
  const completedCount = items.filter(item => item.completed).length
  const requiredCount = items.filter(item => item.required).length
  const allRequiredCompleted = items
    .filter(item => item.required)
    .every(item => item.completed)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">{title}</h3>
        <div className="text-sm">
          <span className="font-medium text-primary-500">{completedCount}</span>
          <span className="text-gray-600">/{items.length}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1 text-sm">
          <span className="text-gray-600">
            {completedCount === items.length ? 'Tout est prêt ! ✅' : 'En cours...'}
          </span>
          <span className="text-gray-600">
            {Math.round((completedCount / items.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / items.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map(item => (
          <div
            key={item.id}
            className={`flex items-center space-x-4 p-4 rounded-lg transition cursor-pointer hover:bg-opacity-80 ${
              item.completed ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
            }`}
            onClick={() => onToggle?.(item.id)}
          >
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => onToggle?.(item.id)}
              disabled={!onToggle}
              className="w-6 h-6 text-primary-600 bg-white border-2 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
            />
            <div className="flex-1">
              <p className={`text-lg ${item.completed ? 'line-through text-gray-500' : 'text-gray-900 font-medium'}`}>
                {item.label}
                {item.required && !item.completed && (
                  <span className="text-red-500 ml-1 font-bold">*</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {!allRequiredCompleted && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            ⚠️ Il manque {requiredCount - items.filter(i => i.required && i.completed).length} élément(s) obligatoire(s)
          </p>
        </div>
      )}

      {allRequiredCompleted && completedCount === items.length && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-800">
            ✅ Tous les éléments sont complétés ! Vous pouvez continuer.
          </p>
        </div>
      )}
    </div>
  )
}

