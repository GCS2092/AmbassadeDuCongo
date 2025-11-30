import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import SecretaryHelpDrawer from './SecretaryHelpDrawer'
import InstallPWAButton from './InstallPWAButton'

export default function Layout() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [helpOpen, setHelpOpen] = useState(false)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Bouton d'aide pour agents */}
        {user && ['AGENT_RDV', 'AGENT_CONSULAIRE', 'ADMIN', 'SUPERADMIN'].includes(user.role) && (
          <button
            onClick={() => setHelpOpen(true)}
            className="fixed bottom-6 right-6 bg-primary-600 text-white rounded-full shadow-lg px-4 py-2 z-40 hover:bg-primary-700"
          >
            Aide Secrétaire
          </button>
        )}
        <Outlet />
      </main>
      
      <Footer />
      
      <InstallPWAButton />
      <SecretaryHelpDrawer isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
      {!isOnline && (
        <div className="offline-indicator">
          <span>Mode hors ligne</span>
        </div>
      )}
    </div>
  )
}

