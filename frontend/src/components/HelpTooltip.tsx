/**
 * Help Tooltip - Aide contextuelle
 * Fournit de l'aide inline sans quitter la page
 */
import { useState } from 'react'
import { FiHelpCircle } from 'react-icons/fi'

interface HelpTooltipProps {
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export default function HelpTooltip({ content, position = 'top' }: HelpTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className="text-gray-400 hover:text-primary-500 transition"
      >
        <FiHelpCircle size={18} />
      </button>

      {isVisible && (
        <div
          className={`absolute ${positionClasses[position]} w-64 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-xl z-50`}
        >
          <div className="relative">
            {content}
            {/* Arrow */}
            <div
              className={`absolute w-3 h-3 bg-gray-900 transform rotate-45 ${
                position === 'top' ? 'bottom-[-6px] left-1/2 -translate-x-1/2' :
                position === 'bottom' ? 'top-[-6px] left-1/2 -translate-x-1/2' :
                position === 'left' ? 'right-[-6px] top-1/2 -translate-y-1/2' :
                'left-[-6px] top-1/2 -translate-y-1/2'
              }`}
            />
          </div>
        </div>
      )}
    </div>
  )
}

