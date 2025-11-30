import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { canAccessRoute, getDefaultRoute, UserRole } from '../lib/permissions'

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const pathname = location.pathname
  const role = user?.role as UserRole

  // Si l'utilisateur n'a pas de rôle, rediriger vers login
  if (!role) {
    return <Navigate to="/login" replace />
  }

  // Si le compte est inactif et que l'utilisateur n'est pas déjà sur la page d'activation
  // Rediriger vers la page d'activation (sauf pour les admins qui peuvent gérer les comptes)
  if (!user.is_active && pathname !== '/inactive-account') {
    // Les admins peuvent toujours accéder à leurs pages même si leur compte est inactif
    // (cas rare mais possible)
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      return <Navigate to="/inactive-account" replace />
    }
  }

  // Vérifier si l'utilisateur peut accéder à cette route
  if (!canAccessRoute(role, pathname)) {
    // Rediriger vers la route par défaut du rôle
    const defaultRoute = getDefaultRoute(role)
    return <Navigate to={defaultRoute} replace />
  }

  // Redirections spécifiques selon le rôle
  // VIGILE ne doit jamais accéder au dashboard citoyen
  if (role === 'VIGILE' && (pathname === '/dashboard' || pathname.startsWith('/dashboard'))) {
    return <Navigate to="/vigile" replace />
  }

  // ADMIN/SUPERADMIN redirigés vers /admin si ils essaient d'accéder au dashboard citoyen
  if ((role === 'ADMIN' || role === 'SUPERADMIN') && pathname === '/dashboard') {
    return <Navigate to="/admin" replace />
  }

  // AGENT_RDV et AGENT_CONSULAIRE peuvent accéder à /dashboard (qui affichera AgentDashboardPage)
  // Mais on s'assure qu'ils ne voient pas le dashboard CITIZEN
  // La logique dans DashboardPage.tsx gère déjà cela, mais on peut aussi rediriger ici si nécessaire

  // Rediriger les rôles non-citoyens qui essaient d'accéder aux pages publiques
  if (['ADMIN', 'SUPERADMIN', 'VIGILE', 'AGENT_RDV', 'AGENT_CONSULAIRE'].includes(role)) {
    if (pathname === '/' || pathname === '/services' || pathname === '/contact' || pathname === '/faq') {
      return <Navigate to={getDefaultRoute(role)} replace />
    }
  }

  // CITIZEN, AGENT_RDV, AGENT_CONSULAIRE ne peuvent pas accéder aux routes admin
  if (pathname.startsWith('/admin') && !['ADMIN', 'SUPERADMIN'].includes(role)) {
    return <Navigate to={getDefaultRoute(role)} replace />
  }

  // Seuls VIGILE, ADMIN, SUPERADMIN peuvent accéder aux routes vigile/security
  if ((pathname.startsWith('/vigile') || pathname.startsWith('/security')) && 
      !['VIGILE', 'ADMIN', 'SUPERADMIN'].includes(role)) {
    return <Navigate to={getDefaultRoute(role)} replace />
  }

  return <Outlet />
}

