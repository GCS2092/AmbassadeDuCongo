/**
 * Complete Profile Page with editing capability
 * Page de profil complète avec édition
 */
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit2, FiSave, FiX, FiCreditCard, FiFileText } from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)

  const { data: profileData, isLoading, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile().then(res => res.data)
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: profileData?.profile || {}
  })

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => authApi.updateProfile(data),
    onSuccess: (response) => {
      updateUser(response.data)
      toast.success('Profil mis à jour avec succès')
      setIsEditing(false)
      refetch()
    },
    onError: (error: any) => {
      console.error('❌ Erreur mise à jour profil:', error)
      
      let errorTitle = 'Erreur de mise à jour'
      let errorMessage = 'Erreur lors de la mise à jour du profil'
      
      if (error.response?.status === 400) {
        errorTitle = 'Données invalides'
        const errors = error.response?.data
        
        if (errors?.email) {
          errorMessage = 'Adresse email invalide ou déjà utilisée'
        } else if (errors?.phone_number) {
          errorMessage = 'Numéro de téléphone invalide'
        } else if (errors?.passport_number) {
          errorMessage = 'Numéro de passeport invalide'
        } else {
          errorMessage = 'Données invalides. Vérifiez les champs requis.'
        }
      } else if (error.response?.status === 403) {
        errorTitle = 'Accès refusé'
        errorMessage = 'Vous n\'avez pas les permissions pour modifier ce profil.'
      } else if (error.response?.status === 422) {
        errorTitle = 'Validation échouée'
        errorMessage = 'Les données fournies ne respectent pas les règles de validation.'
      } else if (error.response?.status === 500) {
        errorTitle = 'Erreur serveur'
        errorMessage = 'Erreur interne du serveur. Veuillez réessayer plus tard.'
      } else if (!error.response) {
        errorTitle = 'Problème de connexion'
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.'
      } else {
        errorMessage = error.response?.data?.error || 'Erreur lors de la mise à jour'
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
    }
  })

  const onSubmit = (data: any) => {
    updateProfileMutation.mutate(data)
  }

  const handleCancel = () => {
    reset(profileData?.profile)
    setIsEditing(false)
  }

  if (isLoading) {
    return <LoadingSpinner text="Chargement du profil..." />
  }

  const profile = profileData?.profile || {}
  const completionPercentage = calculateCompletion(profile)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Mon Profil</h1>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="btn-primary flex items-center space-x-2">
              <FiEdit2 />
              <span>Modifier</span>
            </button>
          ) : (
            <button onClick={handleCancel} className="btn-secondary flex items-center space-x-2">
              <FiX />
              <span>Annuler</span>
            </button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Summary - Simplifié */}
          <div className="card text-center">
            <div className="w-24 h-24 bg-primary-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
              {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
            </div>
            <h2 className="text-2xl font-bold mb-1">
              {user?.first_name} {user?.last_name}
            </h2>
            <p className="text-gray-600 mb-4">{user?.email}</p>
            <span className={`badge ${user?.is_verified ? 'badge-success' : 'badge-warning'}`}>
              {user?.is_verified ? 'Compte vérifié' : 'En attente'}
            </span>
          </div>

          {/* Personal Information */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="card mb-6">
                <h3 className="text-2xl font-bold mb-6">Informations personnelles</h3>

                {!isEditing ? (
                  <div className="space-y-4">
                    <InfoRow icon={<FiUser />} label="Nom complet" value={`${user?.first_name} ${user?.last_name}`} />
                    <InfoRow icon={<FiMail />} label="Email" value={user?.email || '-'} />
                    <InfoRow icon={<FiPhone />} label="Téléphone" value={user?.phone_number || '-'} />
                    <InfoRow icon={<FiCreditCard />} label="Numéro de carte consulaire" value={user?.consular_card_number || 'Non attribué'} />
                    <InfoRow icon={<FiMapPin />} label="Date de naissance" value={profile.date_of_birth || '-'} />
                    <InfoRow icon={<FiMapPin />} label="Lieu de naissance" value={profile.place_of_birth || '-'} />
                    <InfoRow icon={<FiUser />} label="Nationalité" value={profile.nationality || '-'} />
                    <InfoRow icon={<FiFileText />} label="Numéro de passeport" value={profile.passport_number || '-'} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Date de naissance</label>
                        <input type="date" {...register('date_of_birth')} className="input" />
                      </div>
                      <div>
                        <label className="label">Lieu de naissance</label>
                        <input {...register('place_of_birth')} className="input" />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Nationalité</label>
                        <select {...register('nationality')} className="input">
                          <option value="CG">Congo-Brazzaville</option>
                          <option value="CD">RDC</option>
                          <option value="SN">Sénégal</option>
                          <option value="OTHER">Autre</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Genre</label>
                        <select {...register('gender')} className="input">
                          <option value="">-- Sélectionner --</option>
                          <option value="M">Masculin</option>
                          <option value="F">Féminin</option>
                          <option value="O">Autre</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Numéro de passeport</label>
                        <input {...register('passport_number')} className="input" />
                      </div>
                      <div>
                        <label className="label">Date d'expiration</label>
                        <input type="date" {...register('passport_expiry')} className="input" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Address */}
              <div className="card mb-6">
                <h3 className="text-xl font-bold mb-4">Adresse</h3>

                {!isEditing ? (
                  <div className="space-y-2">
                    <p>{profile.address_line1 || '-'}</p>
                    {profile.address_line2 && <p>{profile.address_line2}</p>}
                    <p>{profile.city} {profile.postal_code}</p>
                    <p>{profile.country}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="label">Adresse ligne 1</label>
                      <input {...register('address_line1')} className="input" />
                    </div>
                    <div>
                      <label className="label">Adresse ligne 2</label>
                      <input {...register('address_line2')} className="input" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Ville</label>
                        <input {...register('city')} className="input" />
                      </div>
                      <div>
                        <label className="label">Code postal</label>
                        <input {...register('postal_code')} className="input" />
                      </div>
                    </div>
                    <div>
                      <label className="label">Pays</label>
                      <input {...register('country')} className="input" defaultValue="Sénégal" />
                    </div>
                  </div>
                )}
              </div>

              {/* Emergency Contact */}
              <div className="card">
                <h3 className="text-xl font-bold mb-4">Contact d'urgence</h3>

                {!isEditing ? (
                  <div className="space-y-2">
                    <p><strong>Nom :</strong> {profile.emergency_contact_name || '-'}</p>
                    <p><strong>Téléphone :</strong> {profile.emergency_contact_phone || '-'}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="label">Nom du contact</label>
                      <input {...register('emergency_contact_name')} className="input" />
                    </div>
                    <div>
                      <label className="label">Téléphone du contact</label>
                      <input {...register('emergency_contact_phone')} className="input" />
                    </div>
                  </div>
                )}
              </div>

              {/* Save Button */}
              {isEditing && (
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="w-full btn-primary py-3 flex items-center justify-center space-x-2"
                  >
                    <FiSave />
                    <span>{updateProfileMutation.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: any) {
  return (
    <div className="flex items-center space-x-4 py-3 border-b last:border-0">
      <div className="text-primary-500">{icon}</div>
      <div className="flex-1">
        <p className="text-sm text-gray-600">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  )
}

function calculateCompletion(profile: any): number {
  const fields = [
    'date_of_birth',
    'place_of_birth',
    'nationality',
    'gender',
    'passport_number',
    'address_line1',
    'city',
    'country',
    'emergency_contact_name',
    'emergency_contact_phone',
  ]

  const completed = fields.filter(field => profile[field]).length
  return Math.round((completed / fields.length) * 100)
}
