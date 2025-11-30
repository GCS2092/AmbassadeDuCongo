import { useState } from 'react'
import { FiHelpCircle, FiMail, FiBell, FiBookOpen, FiSend } from 'react-icons/fi'
import { appointmentsApi } from '../lib/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

interface SecretaryHelpDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function SecretaryHelpDrawer({ isOpen, onClose }: SecretaryHelpDrawerProps) {
  const user = useAuthStore((s) => s.user)
  const [refNumber, setRefNumber] = useState('')
  const [newStatus, setNewStatus] = useState('CONFIRMED')

  if (!isOpen) return null
  if (!user || !['AGENT_RDV', 'AGENT_CONSULAIRE', 'ADMIN', 'SUPERADMIN'].includes(user.role)) {
    return null
  }

  const openGuide = (path: string) => {
    window.open(path, '_blank')
  }

  // Contenu spécifique selon le rôle
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN'
  const isAgentRDV = user.role === 'AGENT_RDV'
  const isAgentConsulaire = user.role === 'AGENT_CONSULAIRE'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-xl p-5 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FiHelpCircle className="text-primary-500" />
            <h2 className="text-lg font-semibold">
              {isAdmin ? 'Aide Administration' : isAgentRDV ? 'Aide Agent Rendez-vous' : 'Aide Agent Consulaire'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Fermer</button>
        </div>

        <div className="space-y-4">
          {isAdmin ? (
            <>
              {/* Aide spécifique pour ADMIN */}
              <div className="card p-4">
                <h3 className="font-medium mb-2">Gestion des utilisateurs</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>Consultez la liste des utilisateurs dans "Gestion Utilisateurs"</li>
                  <li>Activez/désactivez les comptes selon les besoins</li>
                  <li>Modifiez les rôles des utilisateurs (CITIZEN, AGENT_RDV, AGENT_CONSULAIRE, VIGILE)</li>
                  <li>Surveillez les logs d'accès pour la sécurité</li>
                </ul>
              </div>

              <div className="card p-4">
                <h3 className="font-medium mb-2">Gestion des demandes</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>Consultez toutes les demandes dans "Gestion Demandes"</li>
                  <li>Filtrez par statut, date, type de service</li>
                  <li>Mettez à jour les statuts des demandes</li>
                  <li>Exportez les données pour analyse</li>
                </ul>
              </div>

              <div className="card p-4">
                <h3 className="font-medium mb-2">Statistiques et rapports</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>Consultez le dashboard admin pour les statistiques globales</li>
                  <li>Exportez les données en CSV/Excel</li>
                  <li>Surveillez les performances du système</li>
                  <li>Analysez les tendances d'utilisation</li>
                </ul>
              </div>

              <div className="card p-4">
                <h3 className="font-medium mb-2">Sécurité et accès</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>Consultez les logs d'accès pour détecter les anomalies</li>
                  <li>Gérez les permissions par rôle</li>
                  <li>Surveillez les tentatives de connexion suspectes</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* Aide pour AGENT_RDV et AGENT_CONSULAIRE */}
              <div className="card p-4">
                <h3 className="font-medium mb-2">Actions rapides</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => toast('Sélectionnez un rendez-vous pour envoyer un rappel depuis sa fiche.')} 
                    className="btn-primary flex items-center justify-center space-x-2"
                  >
                    <FiBell />
                    <span>Envoyer un rappel RDV</span>
                  </button>
                  {isAgentConsulaire && (
                    <button
                      onClick={() => toast('Ouvrez une demande pour demander des pièces manquantes via les outils.')} 
                      className="btn-secondary flex items-center justify-center space-x-2"
                    >
                      <FiMail />
                      <span>Demander des pièces</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="card p-4">
                <h3 className="font-medium mb-2">Changer le statut d'un RDV</h3>
                <div className="space-y-2">
                  <input
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    placeholder="Référence RDV (ex: ABC123)"
                    className="input w-full"
                  />
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="input w-full">
                    <option value="CONFIRMED">Confirmé</option>
                    <option value="CHECKED_IN">Enregistré</option>
                    <option value="IN_PROGRESS">En cours</option>
                    <option value="COMPLETED">Terminé</option>
                    <option value="CANCELLED">Annulé</option>
                    <option value="NO_SHOW">Absent</option>
                  </select>
                  <button
                    onClick={async () => {
                      try {
                        if (!refNumber.trim()) {
                          toast.error('Entrez la référence du RDV')
                          return
                        }
                        // Rechercher le RDV par référence
                        const list = await fetch(`/api/appointments/?reference_number=${encodeURIComponent(refNumber)}`, {
                          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                        }).then(r => r.json())
                        const appt = Array.isArray(list) ? list[0] : list.results?.[0]
                        if (!appt) {
                          toast.error('Rendez-vous introuvable')
                          return
                        }
                        await appointmentsApi.updateStatus(appt.id, newStatus)
                        toast.success('Statut mis à jour et notification envoyée')
                      } catch (e: any) {
                        toast.error(e?.response?.data?.error || 'Erreur lors de la mise à jour')
                      }
                    }}
                    className="btn-primary w-full"
                  >
                    Appliquer
                  </button>
                  <p className="text-xs text-gray-500">Un email est envoyé à l'usager pour l'informer et rappeler de présenter son QR au vigile.</p>
                </div>
              </div>

              {isAgentConsulaire && (
                <div className="card p-4">
                  <h3 className="font-medium mb-2">Gestion des demandes</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    <li>Consultez les demandes dans "Gestion Demandes"</li>
                    <li>Vérifiez les pièces jointes pour chaque demande</li>
                    <li>Demandez des pièces manquantes si nécessaire</li>
                    <li>Mettez à jour le statut des demandes</li>
                    <li>Validez les demandes complètes</li>
                  </ul>
                </div>
              )}

              {isAgentRDV && (
                <div className="card p-4">
                  <h3 className="font-medium mb-2">Gestion des rendez-vous</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    <li>Consultez les rendez-vous du jour dans "Gestion Rendez-vous"</li>
                    <li>Confirmez les rendez-vous à l'avance</li>
                    <li>Enregistrez l'arrivée des usagers</li>
                    <li>Gérez les absences (NO_SHOW)</li>
                    <li>Envoyez des rappels automatiques</li>
                  </ul>
                </div>
              )}

              <div className="card p-4">
                <h3 className="font-medium mb-2">Conseils pratiques</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>Utilisez les statuts RDV pour informer les usagers rapidement.</li>
                  <li>Envoyez un rappel 24-48h avant le RDV (email/SMS si disponible).</li>
                  {isAgentConsulaire && (
                    <li>Pour une demande incomplète, envoyez une liste claire des pièces manquantes.</li>
                  )}
                  <li>Consultez le tableau des RDV du jour pour fluidifier l'accueil.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
