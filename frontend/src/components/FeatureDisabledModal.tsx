import React from 'react'
import { FiAlertCircle, FiX } from 'react-icons/fi'

interface FeatureDisabledModalProps {
  isOpen: boolean
  onClose: () => void
  message: string
  title?: string
}

export default function FeatureDisabledModal({
  isOpen,
  onClose,
  message,
  title = 'Fonctionnalité temporairement indisponible'
}: FeatureDisabledModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FiX size={24} />
        </button>
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <FiAlertCircle className="text-orange-500" size={32} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-gray-700 whitespace-pre-line">
              {message}
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full btn-primary"
            >
              Compris
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

