/**
 * Hook pour gérer le focus automatique sur les formulaires
 */
import { useEffect, useRef } from 'react'

interface UseAutoFocusOptions {
  enabled?: boolean
  delay?: number
  selector?: string
}

export default function useAutoFocus(options: UseAutoFocusOptions = {}) {
  const { enabled = true, delay = 100, selector = 'input[type="email"], input[type="text"], input[type="password"]' } = options
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled || !containerRef.current) return

    const timer = setTimeout(() => {
      const container = containerRef.current
      if (!container) return

      // Chercher le premier champ de saisie
      const firstInput = container.querySelector(selector) as HTMLInputElement
      
      if (firstInput) {
        // Vérifier si l'élément est visible
        const rect = firstInput.getBoundingClientRect()
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight

        if (isVisible) {
          firstInput.focus()
        } else {
          // Si pas visible, faire défiler puis focus
          firstInput.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          })
          
          // Focus après le scroll
          setTimeout(() => {
            firstInput.focus()
          }, 300)
        }
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [enabled, delay, selector])

  return containerRef
}
