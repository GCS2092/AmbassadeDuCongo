import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import ProtectedFeatureLink from '../components/ProtectedFeatureLink'
import { FiCalendar, FiFileText, FiCheckCircle, FiClock, FiAlertTriangle, FiUser, FiDownload, FiMail, FiShield } from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'
import { appointmentsApi, applicationsApi, authApi } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'
// QuickActions et FeedbackWidget retirés pour simplifier
import { debugAPI, safeArrayAccess, debugComponent } from '../utils/debugHelper'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import toast from 'react-hot-toast'
import { UserRole } from '../lib/permissions'
import AgentDashboardPage from './AgentDashboardPage'

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const [userQRCode, setUserQRCode] = useState<string>('')
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  
  // Détecter le rôle pour afficher le bon dashboard
  const userRole = user?.role as UserRole
  
  // Redirection pour les rôles qui ne devraient pas être sur /dashboard
  useEffect(() => {
    if (user && userRole) {
      // VIGILE doit aller vers /vigile
      if (userRole === 'VIGILE') {
        navigate('/vigile', { replace: true })
        return
      }
      // ADMIN/SUPERADMIN doivent aller vers /admin
      if (userRole === 'ADMIN' || userRole === 'SUPERADMIN') {
        navigate('/admin', { replace: true })
        return
      }
    }
  }, [user, userRole, navigate])
  
  // Si l'utilisateur n'est pas encore chargé, attendre
  if (!user || !userRole) {
    return <LoadingSpinner text="Chargement..." />
  }
  
  // Pour AGENT_RDV et AGENT_CONSULAIRE, afficher le dashboard spécifique
  if (userRole === 'AGENT_RDV' || userRole === 'AGENT_CONSULAIRE') {
    return <AgentDashboardPage role={userRole} />
  }
  
  // Pour VIGILE, ADMIN, SUPERADMIN - ne devrait jamais arriver ici (redirigé par useEffect)
  // Mais on ajoute une sécurité
  if (userRole === 'VIGILE' || userRole === 'ADMIN' || userRole === 'SUPERADMIN') {
    return <LoadingSpinner text="Redirection..." />
  }
  
  // Pour CITIZEN, on affiche le dashboard normal
  const { data: upcomingAppointments, isLoading: loadingAppointments, refetch: refetchAppointments } = useQuery({
    queryKey: ['appointments', 'upcoming'],
    queryFn: () => {
      debugAPI.logRequest('/appointments/upcoming/', 'GET');
      return appointmentsApi.upcoming().then(res => {
        debugAPI.logResponse('/appointments/upcoming/', res.status, res.data);
        return safeArrayAccess(res.data);
      }).catch(error => {
        debugAPI.logError('/appointments/upcoming/', error);
        throw error;
      });
    },
    refetchInterval: 30000,
    staleTime: 15000,
  })

  const { data: inProgressApps, isLoading: loadingApps, refetch: refetchApps } = useQuery({
    queryKey: ['applications', 'in-progress'],
    queryFn: () => {
      debugAPI.logRequest('/applications/in-progress/', 'GET');
      return applicationsApi.inProgress().then(res => {
        debugAPI.logResponse('/applications/in-progress/', res.status, res.data);
        return safeArrayAccess(res.data);
      }).catch(error => {
        debugAPI.logError('/applications/in-progress/', error);
        throw error;
      });
    },
    refetchInterval: 30000,
    staleTime: 15000,
  })

  const { data: documentReminders, isLoading: loadingReminders, refetch: refetchReminders } = useQuery({
    queryKey: ['document-reminders'],
    queryFn: () => {
      debugAPI.logRequest('/auth/document-reminders/', 'GET');
      return authApi.getDocumentReminders().then(res => {
        debugAPI.logResponse('/auth/document-reminders/', res.status, res.data);
        return res.data;
      }).catch(error => {
        debugAPI.logError('/auth/document-reminders/', error);
        throw error;
      });
    },
    refetchInterval: 60000,
    staleTime: 30000,
  })

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Page visible, refreshing dashboard data...');
        refetchAppointments();
        refetchApps();
        refetchReminders();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetchAppointments, refetchApps, refetchReminders]);

  // Générer le QR code utilisateur
  const generateUserQRCode = async () => {
    // Vérification stricte de l'utilisateur et de ses propriétés
    if (!user || !user.id || !user.first_name || !user.last_name || !user.email || !user.role) {
      console.error('❌ Données utilisateur incomplètes:', user);
      toast.error('Données utilisateur incomplètes');
      return;
    }

    setIsGeneratingQR(true);
    try {
      // Préparer les données du QR code utilisateur
      const userQRData = {
        user: {
          id: String(user.id), // Conversion sécurisée en string
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role: user.role
        },
        embassy: {
          name: "Ambassade de la République du Congo - Sénégal",
          address: "Stèle Mermoz, Pyrotechnie, P.O. Box 5243, Dakar, Sénégal",
          phone: "+221 824 8398",
          email: "contact@ambassade-congo.sn"
        },
        generatedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        purpose: "Identification utilisateur - Accès aux services consulaires"
      };

      // Générer le QR code
      const qrCodeString = JSON.stringify(userQRData, null, 2);
      const qrCodeDataUrl = await QRCode.toDataURL(qrCodeString, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      setUserQRCode(qrCodeDataUrl);
      console.log('✅ QR code généré avec succès');
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération du QR code:', error);
      toast.error('Erreur lors de la génération du QR code');
    } finally {
      setIsGeneratingQR(false);
    }
  };

  // Générer le QR code au chargement si pas déjà généré
  useEffect(() => {
    if (user && !userQRCode && !isGeneratingQR) {
      generateUserQRCode();
    }
  }, [user, userQRCode, isGeneratingQR]);

  const downloadQRCode = () => {
    if (!userQRCode || !user) return;

    const link = document.createElement('a');
    link.download = `qr-code-${user.first_name}-${user.last_name}.png`;
    link.href = userQRCode;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('QR code téléchargé');
  };

  const sendQRCodeByEmail = async () => {
    if (!userQRCode || !user) {
      toast.error('QR code non disponible');
      return;
    }

    try {
      const response = await fetch('/api/notifications/send-user-qr/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          to: user.email,
          subject: 'Votre QR Code personnel - Ambassade du Congo',
          qr_code_data_url: userQRCode,
          user_data: {
            user: {
              name: `${user.first_name} ${user.last_name}`,
              email: user.email,
              role: user.role
            },
            embassy: {
              name: "Ambassade de la République du Congo - Sénégal",
              address: "Stèle Mermoz, Pyrotechnie, P.O. Box 5243, Dakar, Sénégal",
              phone: "+221 824 8398",
              email: "contact@ambassade-congo.sn"
            },
            generatedAt: new Date().toISOString(),
            validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          }
        })
      });

      if (response.ok) {
        toast.success('QR code envoyé par email');
      } else {
        toast.error('Erreur lors de l\'envoi de l\'email');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'envoi de l\'email');
    }
  };

  debugComponent('DashboardPage', { 
    documentReminders, 
    loadingReminders,
    appointmentsCount: upcomingAppointments?.length || 0,
    applicationsCount: inProgressApps?.length || 0,
    userExists: !!user,
    userId: user?.id
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Bonjour, {user?.first_name || 'Utilisateur'} ! 👋
        </h1>
        <p className="text-gray-600">Voici un résumé de vos démarches consulaires</p>
      </div>

      {/* Document Reminders Alert */}
      {documentReminders?.urgent_count > 0 && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-center">
            <FiAlertTriangle className="text-red-500 text-xl mr-3" />
            <div>
              <h3 className="text-red-800 font-semibold">
                ⚠️ Documents urgents à renouveler
              </h3>
              <p className="text-red-700">
                Vous avez {documentReminders.urgent_count} document(s) expiré(s) ou qui expire(nt) bientôt.
              </p>
              <Link 
                to="/reminders" 
                className="inline-block mt-2 text-red-600 hover:text-red-800 font-medium"
              >
                Voir tous les rappels →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions - Simplifié */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <ProtectedFeatureLink
          to="/appointments/book"
          feature="appointments"
          className="bg-white p-6 rounded-lg shadow border hover:shadow-md transition-shadow flex items-center space-x-4"
        >
          <div className="p-3 bg-blue-100 rounded-lg">
            <FiCalendar className="text-blue-600" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Prendre rendez-vous</h3>
            <p className="text-sm text-gray-600">Réserver un créneau</p>
          </div>
        </ProtectedFeatureLink>
        <ProtectedFeatureLink
          to="/applications/new"
          feature="applications"
          className="bg-white p-6 rounded-lg shadow border hover:shadow-md transition-shadow flex items-center space-x-4"
        >
          <div className="p-3 bg-green-100 rounded-lg">
            <FiFileText className="text-green-600" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Nouvelle demande</h3>
            <p className="text-sm text-gray-600">Créer une demande</p>
          </div>
        </ProtectedFeatureLink>
        <Link
          to="/digital-identity"
          className="bg-white p-6 rounded-lg shadow border hover:shadow-md transition-shadow flex items-center space-x-4"
        >
          <div className="p-3 bg-purple-100 rounded-lg">
            <FiUser className="text-purple-600" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Mon identité</h3>
            <p className="text-sm text-gray-600">Gérer mon profil</p>
          </div>
        </Link>
      </div>

      {/* Quick Stats - Simplifié à 3 cartes principales */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={<FiCalendar size={24} />}
          title="Rendez-vous"
          value={upcomingAppointments?.length || 0}
          subtitle="à venir"
          color="bg-blue-500"
          link="/appointments"
        />
        <StatCard
          icon={<FiFileText size={24} />}
          title="Demandes"
          value={inProgressApps?.length || 0}
          subtitle="en cours"
          color="bg-green-500"
          link="/applications"
        />
        <StatCard
          icon={<FiAlertTriangle size={24} />}
          title="Rappels"
          value={documentReminders?.total_count || 0}
          subtitle="documents à renouveler"
          color="bg-red-500"
          link="/reminders"
        />
      </div>

      {/* Mon Ambassade - QR Code Section */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-lg shadow-sm p-6 mb-8 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <FiShield size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Mon Ambassade</h2>
              <p className="text-blue-100">Votre identité numérique pour accéder aux services</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-center">
          {/* QR Code */}
          <div className="text-center">
            {isGeneratingQR ? (
              <div className="py-8">
                <LoadingSpinner text="Génération du QR code..." />
              </div>
            ) : userQRCode ? (
              <div>
                <img
                  src={userQRCode}
                  alt="QR Code personnel"
                  className="mx-auto border-4 border-white border-opacity-30 rounded-lg mb-4"
                />
                <p className="text-sm text-blue-100 mb-4">
                  Présentez ce QR code pour votre identification
                </p>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={downloadQRCode}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all"
                  >
                    <FiDownload size={16} />
                    <span>Télécharger</span>
                  </button>
                  <button
                    onClick={sendQRCodeByEmail}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all"
                  >
                    <FiMail size={16} />
                    <span>Envoyer</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8">
                <button
                  onClick={generateUserQRCode}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all mx-auto"
                >
                  <FiShield size={20} />
                  <span>Générer mon QR code</span>
                </button>
              </div>
            )}
          </div>

          {/* Informations utilisateur */}
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <FiUser className="mr-2" />
              Mes informations
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-100">Nom:</span>
                <span className="font-medium">{user?.first_name} {user?.last_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-100">Email:</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-100">Statut:</span>
                <span className="font-medium text-green-200">✓ Vérifié</span>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions d'utilisation */}
        <div className="mt-6 bg-white bg-opacity-10 rounded-lg p-4">
          <h4 className="font-semibold mb-2 flex items-center">
            <FiShield className="mr-2" />
            Comment utiliser votre QR code
          </h4>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-blue-100">
            <div className="flex items-start space-x-2">
              <span className="text-blue-300">1.</span>
              <span>Présentez ce QR code lors de vos rendez-vous à l'ambassade</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-300">2.</span>
              <span>Utilisez-le pour une vérification d'identité rapide</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-300">3.</span>
              <span>Conservez-le en sécurité, il est valide pendant 1 an</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upcoming Appointments */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Prochains rendez-vous</h2>
            <Link to="/appointments" className="text-primary-500 hover:underline text-sm">
              Voir tout
            </Link>
          </div>

          {loadingAppointments ? (
            <LoadingSpinner size="sm" />
          ) : upcomingAppointments && upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              {upcomingAppointments.slice(0, 3).map((appointment: any) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Aucun rendez-vous à venir</p>
              <Link to="/appointments/book" className="btn-primary mt-4 inline-block">
                Prendre rendez-vous
              </Link>
            </div>
          )}
        </div>

        {/* Applications in Progress */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Demandes en cours</h2>
            <Link to="/applications" className="text-primary-500 hover:underline text-sm">
              Voir tout
            </Link>
          </div>

          {loadingApps ? (
            <LoadingSpinner size="sm" />
          ) : inProgressApps && inProgressApps.length > 0 ? (
            <div className="space-y-4">
              {inProgressApps.slice(0, 3).map((application: any) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Aucune demande en cours</p>
              <Link to="/applications/new" className="btn-primary mt-4 inline-block">
                Nouvelle demande
              </Link>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

function StatCard({ icon, title, value, subtitle, color, link }: any) {
  return (
    <Link to={link} className="card hover:shadow-lg transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold mb-1">{value}</p>
          <p className="text-gray-500 text-xs">{subtitle}</p>
        </div>
        <div className={`${color} text-white p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </Link>
  )
}

function AppointmentCard({ appointment }: any) {
  return (
    <Link
      to={`/appointments`}
      className="block p-4 border rounded-lg hover:border-primary-500 transition"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold mb-1">{appointment.service_name}</p>
          <p className="text-sm text-gray-600 mb-2">{appointment.office_name}</p>
          <p className="text-sm">
            <span className="font-medium">
              {new Date(appointment.appointment_date).toLocaleDateString('fr-FR')}
            </span>
            {' à '}
            <span className="font-medium">{appointment.appointment_time}</span>
          </p>
        </div>
        <span className={`badge badge-info`}>
          {appointment.status_display}
        </span>
      </div>
    </Link>
  )
}

function ApplicationCard({ application }: any) {
  const statusColors: any = {
    SUBMITTED: 'badge-info',
    UNDER_REVIEW: 'badge-warning',
    PROCESSING: 'badge-info',
    READY: 'badge-success',
  }

  return (
    <Link
      to={`/applications/${application.id}`}
      className="block p-4 border rounded-lg hover:border-primary-500 transition"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold mb-1">{application.application_type_display}</p>
          <p className="text-sm text-gray-600 mb-2">Réf: {application.reference_number}</p>
          <p className="text-xs text-gray-500">
            Soumis le {new Date(application.submitted_at).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <span className={`badge ${statusColors[application.status] || 'badge-info'}`}>
          {application.status_display}
        </span>
      </div>
    </Link>
  )
}