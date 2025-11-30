/**
 * API Client
 * Axios instance with authentication and error handling
 */
import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

// Détecter automatiquement l'URL de l'API
function getApiBaseUrl(): string {
  // Utiliser la variable d'environnement si définie et valide
  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl && typeof envUrl === 'string') {
    const trimmedUrl = envUrl.trim()
    // Vérifier que l'URL n'est pas vide et commence par http
    if (trimmedUrl !== '' && trimmedUrl.startsWith('http')) {
      // Rejeter explicitement les URLs malformées comme http:///api
      if (trimmedUrl.match(/^https?:\/\/\/+/) || trimmedUrl === 'http:///api' || trimmedUrl === 'https:///api') {
        console.warn('⚠️ VITE_API_URL invalide (hostname manquant), utilisation de la valeur par défaut:', trimmedUrl)
      } else {
        try {
          // Valider l'URL en essayant de la parser
          const url = new URL(trimmedUrl)
          // Vérifier que l'URL a un hostname valide (pas vide, pas de slash, pas juste des points)
          if (url.hostname && 
              url.hostname.length > 0 && 
              url.hostname !== '' &&
              !url.hostname.startsWith('/') &&
              !url.hostname.startsWith('.') &&
              url.hostname !== 'undefined' &&
              url.hostname !== 'null') {
            return trimmedUrl
          } else {
            console.warn('⚠️ VITE_API_URL invalide (hostname vide ou invalide), utilisation de la valeur par défaut:', trimmedUrl)
          }
        } catch (e) {
          // URL invalide, on continue avec les valeurs par défaut
          console.warn('⚠️ VITE_API_URL invalide (erreur de parsing), utilisation de la valeur par défaut:', trimmedUrl, e)
        }
      }
    }
  }
  
  // Utiliser l'IP/hostname de l'hôte actuel pour construire l'URL de l'API
  const hostname = window.location.hostname
  const port = window.location.port || '3000'
  
  // Si on est sur localhost, utiliser localhost pour l'API
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000/api'
  }
  
  // Si on est sur une IP réseau (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  // Utiliser cette même IP pour l'API backend (important pour mobile)
  if (hostname.match(/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/)) {
    // Utiliser la même IP que celle utilisée pour accéder au frontend
    return `http://${hostname}:8000/api`
  }
  
  // Sinon, utiliser l'IP de l'hôte actuel pour l'API
  // L'API backend tourne sur le port 8000
  return `http://${hostname}:8000/api`
}

const API_BASE_URL = getApiBaseUrl()

// Log pour debug
if (import.meta.env.DEV) {
  console.log('🔧 API Base URL configurée:', API_BASE_URL)
  console.log('🔧 Hostname actuel:', window.location.hostname)
  console.log('🔧 VITE_API_URL:', import.meta.env.VITE_API_URL)
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Log seulement en développement
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Requête API envoyée:', {
        url: config.url,
        method: config.method,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        headers: config.headers,
        data: config.data,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      })
    }
    
    return config
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Erreur dans l\'intercepteur de requête:', error)
    }
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Log seulement en développement
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Réponse API reçue:', {
        status: response.status,
        url: response.config.url,
        method: response.config.method,
        fullURL: `${response.config.baseURL}${response.config.url}`,
        responseTime: Date.now(),
        userAgent: navigator.userAgent,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config

    // Log détaillé des erreurs pour diagnostic mobile
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Erreur API complète:', {
      // Informations de base
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
      fullURL: `${error.config?.baseURL}${error.config?.url}`,
      
      // Données de la requête
      requestData: error.config?.data,
      requestHeaders: error.config?.headers,
      
      // Données de la réponse
      responseData: error.response?.data,
      responseHeaders: error.response?.headers,
      
      // Informations de l'erreur
      errorMessage: error.message,
      errorCode: error.code,
      errorName: error.name,
      
      // Informations de l'environnement
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      currentURL: window.location.href,
      protocol: window.location.protocol,
      
      // Informations réseau
      networkState: navigator.onLine ? 'online' : 'offline',
      connectionType: (navigator as any).connection?.effectiveType || 'unknown'
    });
    }

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const refreshToken = useAuthStore.getState().refreshToken
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, { refresh: refreshToken })
          const { access } = response.data
          useAuthStore.getState().setAuth(
            useAuthStore.getState().user!,
            access,
            refreshToken
          )
          
          originalRequest.headers.Authorization = `Bearer ${access}`
          return api(originalRequest)
        } catch (refreshError) {
          // Refresh failed, logout user
          console.error('❌ Erreur refresh token:', refreshError);
          useAuthStore.getState().logout()
          window.location.href = '/login'
          toast.error('Session expirée. Veuillez vous reconnecter.')
        }
      } else {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }

    // Gestion spéciale des erreurs réseau (pas de réponse du serveur)
    if (!error.response) {
      console.error('❌ Erreur réseau - Pas de réponse du serveur:', {
        message: error.message,
        code: error.code,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        },
        possibleCauses: [
          'Serveur non accessible',
          'Problème de réseau',
          'Firewall bloque la connexion',
          'URL incorrecte',
          'Serveur non démarré'
        ]
      });
      
      toast.error('Problème de connexion: Impossible de joindre le serveur. Vérifiez votre connexion internet et que les serveurs sont démarrés.', {
        duration: 6000,
        style: {
          background: '#fef3c7',
          color: '#d97706',
          border: '1px solid #fde68a',
          borderRadius: '8px',
          padding: '16px',
          fontSize: '14px',
          maxWidth: '450px'
        }
      })
      return Promise.reject(error)
    }
    
    // Log détaillé pour les erreurs 400
    if (error.response?.status === 400) {
      console.error('❌ Erreur 400 - Détails:', error.response?.data);
    }
    
    // Gestion d'erreurs plus détaillée
    let errorTitle = 'Erreur'
    let errorMessage = 'Une erreur est survenue'
    
    if (error.response?.status === 400) {
      errorTitle = 'Données invalides'
      errorMessage = 'Les données fournies ne sont pas valides. Vérifiez les champs requis.'
    } else if (error.response?.status === 401) {
      errorTitle = 'Non autorisé'
      errorMessage = 'Votre session a expiré. Veuillez vous reconnecter.'
    } else if (error.response?.status === 403) {
      errorTitle = 'Accès refusé'
      errorMessage = 'Vous n\'avez pas les permissions nécessaires pour cette action.'
    } else if (error.response?.status === 404) {
      errorTitle = 'Non trouvé'
      errorMessage = 'La ressource demandée n\'a pas été trouvée.'
    } else if (error.response?.status === 422) {
      errorTitle = 'Validation échouée'
      errorMessage = 'Les données fournies ne respectent pas les règles de validation.'
    } else if (error.response?.status === 429) {
      errorTitle = 'Trop de requêtes'
      errorMessage = 'Trop de tentatives. Veuillez attendre quelques minutes avant de réessayer.'
    } else if (error.response?.status === 500) {
      errorTitle = 'Erreur serveur'
      errorMessage = 'Erreur interne du serveur. Veuillez réessayer plus tard.'
    } else {
      errorMessage = error.response?.data?.detail 
        || error.response?.data?.error
        || error.message
        || 'Une erreur est survenue'
    }
    
    toast.error(`${errorTitle}: ${errorMessage}`, {
      duration: 5000,
      style: {
        background: '#fee2e2',
        color: '#dc2626',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        maxWidth: '400px'
      }
    })
    
    return Promise.reject(error)
  }
)

// API Services
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login/', { email, password }),
  
  register: (data: any) => {
    // Log seulement en développement
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Tentative d\'inscription avec:', data);
      console.log('🚀 Données JSON envoyées:', JSON.stringify(data, null, 2));
    }
    return api.post('/auth/register/', data);
  },

  verifyEmail: (data: { email: string; code: string }) =>
    api.post('/auth/verify-email/', data),

  resendVerificationCode: (data: { email: string }) =>
    api.post('/auth/resend-code/', data),
  
  getProfile: () =>
    api.get('/auth/profile/'),
  
  updateProfile: (data: any) =>
    api.put('/auth/profile/', data),
  
  getDocumentReminders: () =>
    api.get('/auth/document-reminders/'),
  
  updateReminderStatus: (id: string, status: string) =>
    api.post(`/auth/document-reminders/${id}/status/`, { status }),
  
  // Documents API
  getDocuments: () =>
    api.get('/auth/documents/'),
  
  uploadDocument: (data: FormData) =>
    api.post('/auth/documents/', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  updateDocumentExpiry: (id: string | number, expiry_date: string) =>
    api.patch(`/auth/documents/${id}/`, { expiry_date }),

  deleteDocument: (id: string | number) =>
    api.delete(`/auth/documents/${id}/`),
  
  changePassword: (oldPassword: string, newPassword: string) =>
    api.post('/auth/password/change/', { 
      old_password: oldPassword, 
      new_password: newPassword 
    }),
}

export const officesApi = {
  list: () => api.get('/core/offices/'),
  get: (id: number) => api.get(`/core/offices/${id}/`),
  services: (id: number) => api.get(`/core/offices/${id}/services/`),
}

export const servicesApi = {
  list: () => api.get('/core/service-types/'),
  get: (id: number) => api.get(`/core/service-types/${id}/`),
}

export const appointmentsApi = {
  list: () => api.get('/appointments/'),
  get: (id: number) => api.get(`/appointments/${id}/`),
  create: (data: any) => api.post('/appointments/', data),
  cancel: (id: number) => api.post(`/appointments/${id}/cancel/`),
  updateStatus: (id: number, status: string) => api.post(`/appointments/${id}/update_status/`, { status }),
  upcoming: () => api.get('/appointments/upcoming/'),
  history: () => api.get('/appointments/history/'),
  sendReminder: (id: number) => api.post(`/appointments/${id}/send_reminder/`),
  slots: (params: any) => {
    // Simuler des créneaux disponibles pour les 7 prochains jours
    const slots = []
    const today = new Date()
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      // Générer des créneaux de 9h à 17h
      for (let hour = 9; hour <= 17; hour++) {
        if (hour === 12) continue // Pause déjeuner
        
        const timeSlot = {
          date: date.toISOString().split('T')[0],
          time: `${hour.toString().padStart(2, '0')}:00`,
          available: Math.random() > 0.3 // 70% de chances d'être disponible
        }
        
        if (timeSlot.available) {
          slots.push(timeSlot)
        }
      }
    }
    
    return Promise.resolve({ data: slots })
  },
}

export const applicationsApi = {
  list: () => api.get('/applications/'),
  get: (id: number) => api.get(`/applications/${id}/`),
  create: (data: any) => api.post('/applications/', data),
  submit: (id: number) => api.post(`/applications/${id}/submit/`),
  cancel: (id: number, data?: any) => api.post(`/applications/${id}/cancel/`, data),
  updateStatus: (id: number, data: any) => api.post(`/applications/${id}/update_status/`, data),
  drafts: () => api.get('/applications/drafts/'),
  inProgress: () => api.get('/applications/in_progress/'),
  completed: () => api.get('/applications/completed/'),
  requestMissingDocuments: (id: number, payload: { missing_documents?: string[]; note?: string }) =>
    api.post(`/applications/${id}/request_missing_documents/`, payload),
}

export const documentsApi = {
  list: () => api.get('/applications/documents/'),
  upload: (data: FormData) => 
    api.post('/applications/documents/', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  delete: (id: number) => api.delete(`/applications/documents/${id}/`),
}

export const paymentsApi = {
  list: () => api.get('/payments/'),
  create: (data: any) => api.post('/payments/', data),
  createIntent: (id: number) => api.post(`/payments/${id}/create_stripe_intent/`),
  confirm: (id: number) => api.post(`/payments/${id}/confirm_payment/`),
  downloadReceipt: (id: number) => api.get(`/payments/${id}/download_receipt/`, {
    responseType: 'blob'
  }),
}

export const announcementsApi = {
  list: () => api.get('/core/announcements/'),
  get: (id: number) => api.get(`/core/announcements/${id}/`),
  create: (data: any) => api.post('/core/announcements/', data),
  update: (id: number, data: any) => api.patch(`/core/announcements/${id}/`, data),
  delete: (id: number) => api.delete(`/core/announcements/${id}/`),
}

export const faqApi = {
  list: (category?: string) => 
    api.get('/core/faq/', { params: category ? { category } : {} }),
}

export const feedbackApi = {
  submit: (data: { page: string; context?: string; rating: string; comment?: string }) =>
    api.post('/core/feedback/', data),
}

export const adminApi = {
  statistics: () => api.get('/core/admin/exports/statistics/'),
  exportAppointmentsCSV: (params?: any) => 
    api.get('/core/admin/exports/appointments_csv/', { params, responseType: 'blob' }),
  exportApplicationsExcel: (params?: any) =>
    api.get('/core/admin/exports/applications_excel/', { params, responseType: 'blob' }),
  exportPaymentsExcel: (params?: any) =>
    api.get('/core/admin/exports/payments_excel/', { params, responseType: 'blob' }),
}

// Service Types API
export const serviceTypesApi = {
  list: () => api.get('/core/service-types/'),
  get: (id: number) => api.get(`/core/service-types/${id}/`),
  create: (data: any) => api.post('/core/service-types/', data),
  update: (id: number, data: any) => api.patch(`/core/service-types/${id}/`, data),
  delete: (id: number) => api.delete(`/core/service-types/${id}/`),
}

// Consular Offices API
export const consularOfficesApi = {
  list: () => api.get('/core/consular-offices/'),
  get: (id: number) => api.get(`/core/consular-offices/${id}/`),
  create: (data: any) => api.post('/core/consular-offices/', data),
  update: (id: number, data: any) => api.patch(`/core/consular-offices/${id}/`, data),
  delete: (id: number) => api.delete(`/core/consular-offices/${id}/`),
}

// Site Settings API (Admin only)
export const siteSettingsApi = {
  get: () => api.get('/core/site-settings/'),
  update: (data: any) => api.patch('/core/site-settings/1/', data),
  getPublic: () => api.get('/core/site-settings/public/'),
}

export const notificationsApi = {
  list: () => api.get('/notifications/notifications/'),
  get: (id: number) => api.get(`/notifications/notifications/${id}/`),
  markAsRead: (id: number) => api.post(`/notifications/notifications/${id}/mark_as_read/`),
  markAllAsRead: () => api.post('/notifications/notifications/mark_all_as_read/'),
  unreadCount: () => api.get('/notifications/notifications/unread_count/'),
}
