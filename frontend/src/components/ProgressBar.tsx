/**
 * Progress Bar - Afficher la progression d'un processus
 */
interface ProgressBarProps {
  current: number
  total: number
  label?: string
  showPercentage?: boolean
  color?: 'primary' | 'success' | 'warning' | 'danger'
}

export default function ProgressBar({ 
  current, 
  total, 
  label, 
  showPercentage = true,
  color = 'primary' 
}: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100)

  const colorClasses = {
    primary: 'bg-primary-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
  }

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2 text-sm">
          {label && <span className="font-medium text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-gray-600">{percentage}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-500 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

