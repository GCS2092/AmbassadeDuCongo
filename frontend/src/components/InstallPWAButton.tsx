import { useEffect, useState } from 'react'
import { FiDownload } from 'react-icons/fi'

export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // iOS PWA: show hint if not standalone
    if ((window.navigator as any).standalone === false && /iphone|ipad|ipod/i.test(navigator.userAgent)) {
      setVisible(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setVisible(false)
        setDeferredPrompt(null)
      }
    }
  }

  if (!visible) return null

  return (
    <button
      onClick={install}
      className="fixed bottom-6 left-6 z-40 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2"
    >
      <FiDownload />
      <span>Installer l'app</span>
    </button>
  )
}
