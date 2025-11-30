/**
 * Page de gestion des paramètres du site
 * Permet à l'admin/superadmin de désactiver des fonctionnalités
 */
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  FiSettings, FiSave, FiX, FiAlertCircle, FiCheckCircle,
  FiUserPlus, FiCalendar, FiFileText, FiCreditCard, FiTool
} from 'react-icons/fi'
import { siteSettingsApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function AdminSiteSettingsPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  // Vérifier les permissions admin
  React.useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      toast.error('Accès non autorisé. Privilèges administrateur requis.')
      navigate('/admin')
    }
  }, [user, navigate])

  // Récupérer les paramètres actuels
  const { data: settings, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => siteSettingsApi.get().then(res => res.data),
    retry: 1,
  })

  // État local pour les modifications
  const [formData, setFormData] = useState({
    registration_enabled: true,
    registration_message: '',
    appointments_enabled: true,
    appointments_message: '',
    applications_enabled: true,
    applications_message: '',
    payments_enabled: true,
    payments_message: '',
    site_maintenance_mode: false,
    maintenance_message: '',
  })

  // Initialiser avec les données du serveur
  React.useEffect(() => {
    if (settings) {
      setFormData({
        registration_enabled: settings.registration_enabled ?? true,
        registration_message: settings.registration_message || '',
        appointments_enabled: settings.appointments_enabled ?? true,
        appointments_message: settings.appointments_message || '',
        applications_enabled: settings.applications_enabled ?? true,
        applications_message: settings.applications_message || '',
        payments_enabled: settings.payments_enabled ?? true,
        payments_message: settings.payments_message || '',
        site_maintenance_mode: settings.site_maintenance_mode ?? false,
        maintenance_message: settings.maintenance_message || '',
      })
    }
  }, [settings])

  // Mutation pour sauvegarder
  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => siteSettingsApi.update(data),
    onSuccess: () => {
      toast.success('Paramètres mis à jour avec succès !')
      queryClient.invalidateQueries({ queryKey: ['site-settings'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const handleToggle = (field: keyof typeof formData) => {
    if (field.includes('_enabled') || field === 'site_maintenance_mode') {
      setFormData(prev => ({
        ...prev,
        [field]: !prev[field]
      }))
    }
  }

  if (isLoading) {
    return <LoadingSpinner text="Chargement des paramètres..." />
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center space-x-3">
                <FiSettings className="text-blue-500" size={32} />
                <span>Paramètres du Site</span>
              </h1>
              <p className="text-gray-600">
                Gérez l'activation/désactivation des fonctionnalités du site
              </p>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="btn-secondary flex items-center space-x-2"
            >
              <FiX size={16} />
              <span className="hidden sm:inline">Retour</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mode Maintenance */}
          <div className="bg-white rounded-lg shadow border p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FiTool className="text-red-500" size={24} />
                <div>
                  <h3 className="text-lg font-semibold">Mode Maintenance</h3>
                  <p className="text-sm text-gray-600">
                    Désactive toutes les fonctionnalités publiques
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.site_maintenance_mode}
                  onChange={() => handleToggle('site_maintenance_mode')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
            {formData.site_maintenance_mode && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message de maintenance
                </label>
                <textarea
                  value={formData.maintenance_message}
                  onChange={(e) => setFormData(prev => ({ ...prev, maintenance_message: e.target.value }))}
                  className="input w-full"
                  rows={3}
                  placeholder="Le site est actuellement en maintenance. Merci de votre compréhension."
                />
              </div>
            )}
          </div>

          {/* Inscription */}
          <div className="bg-white rounded-lg shadow border p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FiUserPlus className="text-blue-500" size={24} />
                <div>
                  <h3 className="text-lg font-semibold">Inscription</h3>
                  <p className="text-sm text-gray-600">
                    Permet aux nouveaux utilisateurs de s'inscrire
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.registration_enabled}
                  onChange={() => handleToggle('registration_enabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            {!formData.registration_enabled && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message d'inscription désactivée
                </label>
                <textarea
                  value={formData.registration_message}
                  onChange={(e) => setFormData(prev => ({ ...prev, registration_message: e.target.value }))}
                  className="input w-full"
                  rows={3}
                  placeholder="Merci de votre sollicitude. Nous vous prions de passer à l'ambassade pour effectuer cette tâche."
                />
              </div>
            )}
          </div>

          {/* Rendez-vous */}
          <div className="bg-white rounded-lg shadow border p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FiCalendar className="text-green-500" size={24} />
                <div>
                  <h3 className="text-lg font-semibold">Rendez-vous</h3>
                  <p className="text-sm text-gray-600">
                    Permet aux utilisateurs de prendre des rendez-vous
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.appointments_enabled}
                  onChange={() => handleToggle('appointments_enabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            {!formData.appointments_enabled && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message rendez-vous désactivés
                </label>
                <textarea
                  value={formData.appointments_message}
                  onChange={(e) => setFormData(prev => ({ ...prev, appointments_message: e.target.value }))}
                  className="input w-full"
                  rows={3}
                  placeholder="Merci de votre sollicitude. Nous vous prions de passer à l'ambassade pour effectuer cette tâche."
                />
              </div>
            )}
          </div>

          {/* Demandes */}
          <div className="bg-white rounded-lg shadow border p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FiFileText className="text-purple-500" size={24} />
                <div>
                  <h3 className="text-lg font-semibold">Demandes</h3>
                  <p className="text-sm text-gray-600">
                    Permet aux utilisateurs de soumettre des demandes
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.applications_enabled}
                  onChange={() => handleToggle('applications_enabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            {!formData.applications_enabled && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message demandes désactivées
                </label>
                <textarea
                  value={formData.applications_message}
                  onChange={(e) => setFormData(prev => ({ ...prev, applications_message: e.target.value }))}
                  className="input w-full"
                  rows={3}
                  placeholder="Merci de votre sollicitude. Nous vous prions de passer à l'ambassade pour effectuer cette tâche."
                />
              </div>
            )}
          </div>

          {/* Paiements */}
          <div className="bg-white rounded-lg shadow border p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FiCreditCard className="text-orange-500" size={24} />
                <div>
                  <h3 className="text-lg font-semibold">Paiements</h3>
                  <p className="text-sm text-gray-600">
                    Permet aux utilisateurs d'effectuer des paiements en ligne
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.payments_enabled}
                  onChange={() => handleToggle('payments_enabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            {!formData.payments_enabled && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message paiements désactivés
                </label>
                <textarea
                  value={formData.payments_message}
                  onChange={(e) => setFormData(prev => ({ ...prev, payments_message: e.target.value }))}
                  className="input w-full"
                  rows={3}
                  placeholder="Merci de votre sollicitude. Nous vous prions de passer à l'ambassade pour effectuer cette tâche."
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="btn-secondary flex items-center justify-center space-x-2"
            >
              <FiX size={16} />
              <span>Annuler</span>
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="btn-primary flex items-center justify-center space-x-2"
            >
              {updateMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sauvegarde...</span>
                </>
              ) : (
                <>
                  <FiSave size={16} />
                  <span>Sauvegarder</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Avertissement */}
        {formData.site_maintenance_mode && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FiAlertCircle className="text-red-500 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-red-800">Mode Maintenance Activé</h4>
                <p className="text-sm text-red-700 mt-1">
                  Toutes les fonctionnalités publiques sont désactivées. Seuls les administrateurs peuvent se connecter.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

