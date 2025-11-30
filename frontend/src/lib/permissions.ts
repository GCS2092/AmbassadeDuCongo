/**
 * Système de permissions basé sur les rôles
 * Définit les accès et redirections pour chaque rôle
 */

export type UserRole = 
  | 'CITIZEN' 
  | 'AGENT_RDV' 
  | 'AGENT_CONSULAIRE' 
  | 'VIGILE' 
  | 'ADMIN' 
  | 'SUPERADMIN'

/**
 * Configuration des permissions par rôle
 */
export const ROLE_PERMISSIONS: Record<UserRole, {
  allowedRoutes: string[]
  defaultRoute: string
  displayName: string
  canAccessAdmin: boolean
  canAccessVigile: boolean
  canCreateApplications: boolean
  canCreateAppointments: boolean
  canViewPayments: boolean
}> = {
  CITIZEN: {
    allowedRoutes: [
      '/dashboard',
      '/profile',
      '/identity',
      '/digital-identity',
      '/documents',
      '/my-qr-code',
      '/appointments',
      '/appointments/book',
      '/applications',
      '/applications/new',
      '/applications/:id',
      '/payments/create/:applicationId',
      '/reminders',
      '/notifications',
      '/services',
      '/contact',
      '/faq',
      '/announcements'
    ],
    defaultRoute: '/dashboard',
    displayName: 'Citoyen',
    canAccessAdmin: false,
    canAccessVigile: false,
    canCreateApplications: true,
    canCreateAppointments: true,
    canViewPayments: true
  },
  AGENT_RDV: {
    allowedRoutes: [
      '/dashboard',
      '/profile',
      '/appointments',
      '/appointments/book',
      '/applications',
      '/applications/:id',
      '/reminders',
      '/notifications'
    ],
    defaultRoute: '/dashboard',
    displayName: 'Agent Rendez-vous',
    canAccessAdmin: false,
    canAccessVigile: false,
    canCreateApplications: false, // Agent RDV ne crée pas, il consulte seulement
    canCreateAppointments: true, // Peut créer des RDV pour les citoyens
    canViewPayments: false
  },
  AGENT_CONSULAIRE: {
    allowedRoutes: [
      '/dashboard',
      '/profile',
      '/appointments',
      '/appointments/book',
      '/applications',
      '/applications/new',
      '/applications/:id',
      '/reminders',
      '/notifications'
    ],
    defaultRoute: '/dashboard',
    displayName: 'Agent Consulaire',
    canAccessAdmin: false,
    canAccessVigile: false,
    canCreateApplications: true, // Peut créer des demandes pour les citoyens
    canCreateAppointments: true, // Peut créer des RDV pour les citoyens
    canViewPayments: true // Doit voir les paiements pour gérer les demandes
  },
  VIGILE: {
    allowedRoutes: [
      '/vigile',
      '/security/scanner',
      '/security/today',
      '/profile',
      '/notifications'
    ],
    defaultRoute: '/vigile',
    displayName: 'Vigile',
    canAccessAdmin: false,
    canAccessVigile: true,
    canCreateApplications: false,
    canCreateAppointments: false,
    canViewPayments: false
  },
  ADMIN: {
    allowedRoutes: [
      '/admin',
      '/admin/users',
      '/admin/applications',
      '/admin/applications/:id',
      '/admin/access-logs',
      '/admin/site-settings',
      '/admin/announcements',
      '/vigile',
      '/security/today', // Supervision seulement, pas le scanner
      '/profile',
      '/announcements',
      '/notifications'
    ],
    defaultRoute: '/admin',
    displayName: 'Administrateur',
    canAccessAdmin: true,
    canAccessVigile: true,
    canCreateApplications: false, // Admin gère, ne crée pas comme un citoyen
    canCreateAppointments: false, // Admin gère, ne crée pas comme un citoyen
    canViewPayments: true
  },
  SUPERADMIN: {
    allowedRoutes: [
      '/admin',
      '/admin/users',
      '/admin/applications',
      '/admin/applications/:id',
      '/admin/access-logs',
      '/admin/site-settings',
      '/admin/announcements',
      '/vigile',
      '/security/today', // Supervision seulement, pas le scanner
      '/profile',
      '/announcements',
      '/notifications'
    ],
    defaultRoute: '/admin',
    displayName: 'Super Administrateur',
    canAccessAdmin: true,
    canAccessVigile: true,
    canCreateApplications: false, // SuperAdmin gère, ne crée pas comme un citoyen
    canCreateAppointments: false, // SuperAdmin gère, ne crée pas comme un citoyen
    canViewPayments: true
  }
}

/**
 * Vérifie si un rôle peut accéder à une route
 */
export function canAccessRoute(role: UserRole | undefined, pathname: string): boolean {
  if (!role) return false
  
  const permissions = ROLE_PERMISSIONS[role]
  if (!permissions) return false

  // Vérifier les routes exactes
  if (permissions.allowedRoutes.includes(pathname)) {
    return true
  }

  // Vérifier les routes avec paramètres (ex: /applications/:id)
  for (const allowedRoute of permissions.allowedRoutes) {
    // Convertir la route avec paramètres en regex
    const routePattern = allowedRoute.replace(/:[^/]+/g, '[^/]+')
    const regex = new RegExp(`^${routePattern}$`)
    if (regex.test(pathname)) {
      return true
    }
  }

  // Vérifier les préfixes de routes
  if (pathname.startsWith('/admin') && !permissions.canAccessAdmin) {
    return false
  }
  if ((pathname.startsWith('/vigile') || pathname.startsWith('/security')) && !permissions.canAccessVigile) {
    return false
  }

  return false
}

/**
 * Obtient la route par défaut pour un rôle
 */
export function getDefaultRoute(role: UserRole | undefined): string {
  if (!role) return '/login'
  const permissions = ROLE_PERMISSIONS[role]
  return permissions?.defaultRoute || '/dashboard'
}

/**
 * Vérifie si un rôle peut créer des applications
 */
export function canCreateApplications(role: UserRole | undefined): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.canCreateApplications || false
}

/**
 * Vérifie si un rôle peut créer des rendez-vous
 */
export function canCreateAppointments(role: UserRole | undefined): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.canCreateAppointments || false
}

/**
 * Vérifie si un rôle peut accéder à l'admin
 */
export function canAccessAdmin(role: UserRole | undefined): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.canAccessAdmin || false
}

/**
 * Vérifie si un rôle peut accéder aux pages vigile
 */
export function canAccessVigile(role: UserRole | undefined): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.canAccessVigile || false
}

/**
 * Obtient le nom d'affichage d'un rôle
 */
export function getRoleDisplayName(role: UserRole | undefined): string {
  if (!role) return 'Utilisateur'
  return ROLE_PERMISSIONS[role]?.displayName || role
}

