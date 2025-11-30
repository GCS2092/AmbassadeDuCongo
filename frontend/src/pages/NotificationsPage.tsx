import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiBell, FiCheck, FiCheckCircle, FiClock, FiInfo, FiFileText, FiCalendar, FiAlertCircle } from 'react-icons/fi'
import { notificationsApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import Pagination from '../components/Pagination'

export default function NotificationsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Récupérer les notifications avec pagination
  const { data: notificationsResponse, isLoading } = useQuery({
    queryKey: ['notifications', currentPage],
    queryFn: () => notificationsApi.list().then(res => {
      // L'API peut retourner une structure paginée ou directe
      if (res.data && res.data.results) {
        return res.data
      }
      // Si pas de pagination, wrapper dans une structure paginée
      const notifs = Array.isArray(res.data) ? res.data : []
      return { results: notifs, count: notifs.length, next: null, previous: null }
    }),
    enabled: !!user,
  })

  // Récupérer le nombre de notifications non lues
  const { data: unreadCountResponse } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationsApi.unreadCount().then(res => res.data),
    enabled: !!user,
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  })

  const notifications = notificationsResponse?.results || []
  const totalCount = notificationsResponse?.count || notifications.length
  const totalPages = Math.ceil(totalCount / 20) || 1
  const unreadCount = unreadCountResponse?.count || 0

  // Réinitialiser à la page 1 quand le filtre change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  // Filtrer les notifications
  const filteredNotifications = notifications.filter((notif: any) => {
    if (filter === 'unread') return !notif.is_read
    if (filter === 'read') return notif.is_read
    return true
  })

  // Mutation pour marquer comme lu
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })

  // Mutation pour marquer tout comme lu
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: (data) => {
      toast.success(`${data.data.count} notification(s) marquée(s) comme lue(s)`)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })

  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id)
  }

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      markAllAsReadMutation.mutate()
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ACCOUNT_ACTIVATED':
        return <FiCheckCircle className="text-green-500" size={20} />
      case 'APPOINTMENT_CONFIRMED':
      case 'APPOINTMENT_REMINDER':
        return <FiCalendar className="text-blue-500" size={20} />
      case 'APPLICATION_STATUS':
      case 'APPLICATION_RECEIVED':
        return <FiFileText className="text-purple-500" size={20} />
      case 'PAYMENT_RECEIVED':
        return <FiCheckCircle className="text-green-500" size={20} />
      case 'PAYMENT_FAILED':
        return <FiAlertCircle className="text-red-500" size={20} />
      case 'APPOINTMENT_CREATED':
        return <FiCalendar className="text-blue-500" size={20} />
      case 'APPOINTMENT_CANCELLED':
        return <FiAlertCircle className="text-orange-500" size={20} />
      default:
        return <FiInfo className="text-gray-500" size={20} />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ACCOUNT_ACTIVATED':
        return 'bg-green-50 border-green-200'
      case 'APPOINTMENT_CONFIRMED':
      case 'APPOINTMENT_REMINDER':
        return 'bg-blue-50 border-blue-200'
      case 'APPLICATION_STATUS':
      case 'APPLICATION_RECEIVED':
        return 'bg-purple-50 border-purple-200'
      case 'PAYMENT_RECEIVED':
        return 'bg-green-50 border-green-200'
      case 'PAYMENT_FAILED':
        return 'bg-red-50 border-red-200'
      case 'APPOINTMENT_CREATED':
        return 'bg-blue-50 border-blue-200'
      case 'APPOINTMENT_CANCELLED':
        return 'bg-orange-50 border-orange-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  if (isLoading) {
    return <LoadingSpinner text="Chargement des notifications..." />
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center space-x-3">
                <FiBell className="text-primary-500" size={32} />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-sm font-bold px-2.5 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-gray-600">
                Restez informé de toutes vos activités
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
                className="btn-secondary flex items-center space-x-2"
              >
                <FiCheck size={16} />
                <span className="hidden sm:inline">Tout marquer comme lu</span>
              </button>
            )}
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow border p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toutes ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Non lues ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'read'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Lues ({notifications.length - unreadCount})
            </button>
          </div>
        </div>

        {/* Liste des notifications */}
        {filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map((notification: any) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow border-l-4 p-4 md:p-6 hover:shadow-md transition-shadow ${
                  getNotificationColor(notification.notification_type || '')
                } ${!notification.is_read ? 'border-l-4 border-primary-500' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-1">
                      {getNotificationIcon(notification.notification_type || '')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                        {!notification.is_read && (
                          <span className="bg-primary-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            Nouveau
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 mb-3 whitespace-pre-line">
                        {notification.message}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <FiClock size={14} />
                          <span>
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                        </span>
                        <span>
                          {format(new Date(notification.created_at), 'dd/MM/yyyy à HH:mm', {
                            locale: fr,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!notification.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      disabled={markAsReadMutation.isPending}
                      className="ml-4 p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Marquer comme lu"
                    >
                      <FiCheck size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <FiBell className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600">
              {filter === 'unread'
                ? 'Aucune notification non lue'
                : filter === 'read'
                ? 'Aucune notification lue'
                : 'Aucune notification pour le moment'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalCount > 0 && (
          <div className="mt-6 bg-white p-4 rounded-lg shadow border">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={20}
              onPageChange={(page) => {
                setCurrentPage(page)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

