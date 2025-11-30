import React from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalCount: number
  pageSize: number
  onPageChange: (page: number) => void
  className?: string
}

export default function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  className = '',
}: PaginationProps) {
  // Calculer les numéros de page à afficher
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      // Afficher toutes les pages si moins de maxVisible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Toujours afficher la première page
      pages.push(1)

      // Calculer le début et la fin de la plage visible
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      // Ajuster si on est proche du début
      if (currentPage <= 3) {
        end = Math.min(4, totalPages - 1)
      }

      // Ajuster si on est proche de la fin
      if (currentPage >= totalPages - 2) {
        start = Math.max(totalPages - 3, 2)
      }

      // Ajouter "..." si nécessaire
      if (start > 2) {
        pages.push('...')
      }

      // Ajouter les pages de la plage visible
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      // Ajouter "..." si nécessaire
      if (end < totalPages - 1) {
        pages.push('...')
      }

      // Toujours afficher la dernière page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  const pageNumbers = getPageNumbers()
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalCount)

  if (totalPages <= 1) {
    return null // Ne pas afficher la pagination s'il n'y a qu'une page
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Info sur les résultats */}
      <div className="text-sm text-gray-600">
        Affichage de <span className="font-medium">{startItem}</span> à{' '}
        <span className="font-medium">{endItem}</span> sur{' '}
        <span className="font-medium">{totalCount}</span> résultat{totalCount > 1 ? 's' : ''}
      </div>

      {/* Contrôles de pagination */}
      <div className="flex items-center gap-2">
        {/* Bouton Précédent */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-2 rounded-lg border transition-colors ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
              : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-primary-300'
          }`}
          aria-label="Page précédente"
        >
          <FiChevronLeft size={18} />
        </button>

        {/* Numéros de page */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                  ...
                </span>
              )
            }

            const pageNum = page as number
            const isActive = pageNum === currentPage

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`min-w-[40px] px-3 py-2 rounded-lg border transition-colors ${
                  isActive
                    ? 'bg-primary-500 text-white border-primary-500 font-semibold'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-primary-300'
                }`}
                aria-label={`Page ${pageNum}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        {/* Bouton Suivant */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-2 rounded-lg border transition-colors ${
            currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
              : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-primary-300'
          }`}
          aria-label="Page suivante"
        >
          <FiChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}

