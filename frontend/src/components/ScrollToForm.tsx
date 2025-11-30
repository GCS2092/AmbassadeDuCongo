/**
 * Composant pour gérer le scroll automatique vers les formulaires
 */
import { useEffect, useRef } from 'react'

interface ScrollToFormProps {
  children: React.ReactNode
  className?: string
  scrollOffset?: number
  enableAutoScroll?: boolean
}

export default function ScrollToForm({ 
  children, 
  className = '', 
  scrollOffset = 20,
  enableAutoScroll = true 
}: ScrollToFormProps) {
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enableAutoScroll || !formRef.current) return

    // Attendre que le DOM soit prêt
    const timer = setTimeout(() => {
      if (formRef.current) {
        const element = formRef.current
        const elementRect = element.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const elementHeight = elementRect.height

        // Vérifier si l'élément est visible dans le viewport
        const isElementVisible = elementRect.top >= 0 && 
                                elementRect.bottom <= viewportHeight

        // Si l'élément n'est pas entièrement visible, faire défiler
        if (!isElementVisible) {
          const scrollTop = elementRect.top + window.pageYOffset - scrollOffset
          
          // Scroll fluide
          window.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: 'smooth'
          })
        }
      }
    }, 100) // Petit délai pour s'assurer que le contenu est rendu

    return () => clearTimeout(timer)
  }, [enableAutoScroll, scrollOffset])

  return (
    <div ref={formRef} className={className}>
      {children}
    </div>
  )
}
