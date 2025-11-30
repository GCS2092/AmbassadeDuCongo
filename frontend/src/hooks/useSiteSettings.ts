import { useQuery } from '@tanstack/react-query'
import { siteSettingsApi } from '../lib/api'

export interface SiteSettings {
  registration_enabled: boolean
  registration_message: string
  appointments_enabled: boolean
  appointments_message: string
  applications_enabled: boolean
  applications_message: string
  payments_enabled: boolean
  payments_message: string
  site_maintenance_mode: boolean
  maintenance_message: string
}

/**
 * Hook pour récupérer les paramètres publics du site
 */
export function useSiteSettings() {
  return useQuery<SiteSettings>({
    queryKey: ['site-settings-public'],
    queryFn: async () => {
      const response = await siteSettingsApi.getPublic()
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}

