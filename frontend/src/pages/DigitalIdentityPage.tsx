/**
 * Digital Identity Page - Carte d'Identité Numérique Complète
 * Page d'identité numérique avec tous les identifiants et documents
 */
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiEdit2, FiSave, FiX, 
  FiCreditCard, FiCalendar, FiHome, FiBriefcase, FiHeart,
  FiShield, FiFileText, FiCamera, FiDownload
} from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'

export default function DigitalIdentityPage() {
  const [isEditing, setIsEditing] = useState(false)
  const [activeSection, setActiveSection] = useState('personal')
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
      toast.success('Identité numérique mise à jour avec succès')
      setIsEditing(false)
      refetch()
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    }
  })

  const onSubmit = (data: any) => {
    updateProfileMutation.mutate(data)
  }

  const handleCancel = () => {
    reset(profileData?.profile)
    setIsEditing(false)
  }

  const calculateCompletion = () => {
    if (!profileData?.profile) return 0
    const profile = profileData.profile
    const fields = [
      profile.date_of_birth,
      profile.place_of_birth,
      profile.gender,
      profile.nationality,
      profile.passport_number,
      profile.id_card_number,
      profile.profession,
      profile.address_line1,
      profile.city,
      profile.emergency_contact_name,
      profile.emergency_contact_phone
    ]
    const filledFields = fields.filter(field => field && field.toString().trim() !== '').length
    return Math.round((filledFields / fields.length) * 100)
  }

  if (isLoading) return <LoadingSpinner />

  const profile = profileData?.profile || {}
  const completion = calculateCompletion()

  const sections = [
    { id: 'personal', label: 'Informations Personnelles', icon: FiUser },
    { id: 'documents', label: 'Documents Officiels', icon: FiFileText },
    { id: 'professional', label: 'Informations Professionnelles', icon: FiBriefcase },
    { id: 'family', label: 'Informations Familiales', icon: FiHeart },
    { id: 'address', label: 'Adresse', icon: FiMapPin },
    { id: 'emergency', label: 'Contact d\'Urgence', icon: FiPhone }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                {profile.photo ? (
                  <img 
                    src={profile.photo} 
                    alt="Photo de profil" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <FiUser className="w-8 h-8 text-blue-600" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user?.first_name} {user?.last_name}
                </h1>
                <p className="text-gray-600">{user?.email}</p>
                <p className="text-sm text-gray-500">Carte d'Identité Numérique</p>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-0 flex space-x-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiEdit2 className="w-4 h-4 mr-2" />
                  Modifier
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={updateProfileMutation.isPending}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <FiSave className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </button>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <FiX className="w-4 h-4 mr-2" />
                    Annuler
                  </button>
                </div>
              )}
              
            </div>
          </div>

        </div>

        {/* Navigation Sections */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <section.icon className="w-4 h-4 mr-2" />
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Personal Information */}
          {activeSection === 'personal' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FiUser className="w-5 h-5 mr-2" />
                Informations Personnelles
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de naissance
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      {...register('date_of_birth')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.date_of_birth || 'Non renseigné'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lieu de naissance
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      {...register('place_of_birth')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.place_of_birth || 'Non renseigné'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Genre
                  </label>
                  {isEditing ? (
                    <select
                      {...register('gender')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Sélectionner</option>
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                      <option value="O">Autre</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">
                      {profile.gender === 'M' ? 'Masculin' : 
                       profile.gender === 'F' ? 'Féminin' : 
                       profile.gender === 'O' ? 'Autre' : 'Non renseigné'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nationalité
                  </label>
                  {isEditing ? (
                    <select
                      {...register('nationality')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Sélectionner</option>
                      <option value="CG">Congo-Brazzaville</option>
                      <option value="CD">République Démocratique du Congo</option>
                      <option value="SN">Sénégal</option>
                      <option value="OTHER">Autre</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">
                      {profile.nationality === 'CG' ? 'Congo-Brazzaville' :
                       profile.nationality === 'CD' ? 'République Démocratique du Congo' :
                       profile.nationality === 'SN' ? 'Sénégal' :
                       profile.nationality === 'OTHER' ? 'Autre' : 'Non renseigné'}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photo de profil
                  </label>
                  {isEditing ? (
                    <div className="flex items-center space-x-4">
                      <input
                        type="file"
                        accept="image/*"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <FiCamera className="w-5 h-5 text-gray-400" />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4">
                      {profile.photo ? (
                        <img src={profile.photo} alt="Photo" className="w-20 h-20 rounded-lg object-cover" />
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                          <FiCamera className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <p className="text-gray-500">Photo de profil</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Documents Officiels */}
          {activeSection === 'documents' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FiFileText className="w-5 h-5 mr-2" />
                Documents Officiels
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de passeport
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      {...register('passport_number')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.passport_number || 'Non renseigné'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date d'expiration passeport
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      {...register('passport_expiry')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.passport_expiry || 'Non renseigné'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de carte d'identité
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      {...register('id_card_number')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.id_card_number || 'Non renseigné'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date d'expiration carte d'identité
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      {...register('id_card_expiry')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.id_card_expiry || 'Non renseigné'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro d'acte de naissance
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      {...register('birth_certificate_number')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.birth_certificate_number || 'Non renseigné'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de permis de conduire
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      {...register('driving_license_number')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.driving_license_number || 'Non renseigné'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date d'expiration permis
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      {...register('driving_license_expiry')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.driving_license_expiry || 'Non renseigné'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de carte consulaire
                  </label>
                  <p className="text-gray-900 font-mono bg-gray-100 px-3 py-2 rounded-lg text-lg font-semibold">
                    {user?.consular_card_number || profile.consular_number || 'Non attribué'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Attribué automatiquement lors de l'inscription
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Professional Information */}
          {activeSection === 'professional' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FiBriefcase className="w-5 h-5 mr-2" />
                Informations Professionnelles
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profession
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      {...register('profession')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.profession || 'Non renseigné'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employeur
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      {...register('employer')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.employer || 'Non renseigné'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone professionnel
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      {...register('work_phone')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.work_phone || 'Non renseigné'}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Family Information */}
          {activeSection === 'family' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FiHeart className="w-5 h-5 mr-2" />
                Informations Familiales
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut matrimonial
                  </label>
                  {isEditing ? (
                    <select
                      {...register('marital_status')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Sélectionner</option>
                      <option value="single">Célibataire</option>
                      <option value="married">Marié(e)</option>
                      <option value="divorced">Divorcé(e)</option>
                      <option value="widowed">Veuf/Veuve</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">
                      {profile.marital_status === 'single' ? 'Célibataire' :
                       profile.marital_status === 'married' ? 'Marié(e)' :
                       profile.marital_status === 'divorced' ? 'Divorcé(e)' :
                       profile.marital_status === 'widowed' ? 'Veuf/Veuve' : 'Non renseigné'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du conjoint
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      {...register('spouse_name')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.spouse_name || 'Non renseigné'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre d'enfants
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      {...register('children_count')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.children_count || 0}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Address Information */}
          {activeSection === 'address' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FiMapPin className="w-5 h-5 mr-2" />
                Adresse
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse ligne 1
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      {...register('address_line1')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.address_line1 || 'Non renseigné'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse ligne 2
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      {...register('address_line2')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.address_line2 || 'Non renseigné'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      {...register('city')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.city || 'Non renseigné'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code postal
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      {...register('postal_code')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.postal_code || 'Non renseigné'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pays
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      {...register('country')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.country || 'Non renseigné'}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Emergency Contact */}
          {activeSection === 'emergency' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FiPhone className="w-5 h-5 mr-2" />
                Contact d'Urgence
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du contact d'urgence
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      {...register('emergency_contact_name')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.emergency_contact_name || 'Non renseigné'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone d'urgence
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      {...register('emergency_contact_phone')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.emergency_contact_phone || 'Non renseigné'}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <FiShield className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Sécurité de vos données</h3>
              <p className="text-sm text-blue-700 mt-1">
                Toutes vos informations sont chiffrées et stockées de manière sécurisée. 
                Seuls vous et les agents consulaires autorisés pouvez accéder à ces données.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
