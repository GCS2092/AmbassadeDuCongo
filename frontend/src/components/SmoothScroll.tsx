/**
 * Composant pour gérer le scroll fluide et le focus
 */
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

interface SmoothScrollProps {
  children: React.ReactNode
  className?: string
  scrollToTop?: boolean
  focusOnMount?: boolean
  focusSelector?: string
}

export default function SmoothScroll({ 
  children, 
  className = '',
  scrollToTop = true,
  focusOnMount = false,
  focusSelector = 'h1, h2, [role="main"], main'
}: SmoothScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  useEffect(() => {
    if (scrollToTop) {
      // Scroll fluide vers le haut de la page
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }, [location.pathname, scrollToTop])

  useEffect(() => {
    if (focusOnMount && containerRef.current) {
      const timer = setTimeout(() => {
        const element = containerRef.current
        if (!element) return

        // Chercher l'élément à focuser
        const focusElement = element.querySelector(focusSelector) as HTMLElement
        
        if (focusElement) {
          // Vérifier si l'élément est visible
          const rect = focusElement.getBoundingClientRect()
          const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight

          if (isVisible) {
            focusElement.focus()
          } else {
            // Si pas visible, faire défiler puis focus
            focusElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            })
            
            // Focus après le scroll
            setTimeout(() => {
              focusElement.focus()
            }, 300)
          }
        }
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [focusOnMount, focusSelector])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}
