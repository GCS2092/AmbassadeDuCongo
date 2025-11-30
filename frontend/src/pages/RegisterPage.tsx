import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import PasswordStrengthMeter from '../components/PasswordStrengthMeter'
import toast from 'react-hot-toast'
import { authApi } from '../lib/api'
import FormField, { Input } from '../components/FormField'
import ValidationFeedback, { validationRules } from '../components/ValidationFeedback'
import ResponsiveFormPage from '../components/ResponsiveFormPage'
import useAutoFocus from '../hooks/useAutoFocus'
import RegistrationSuccessModal from '../components/RegistrationSuccessModal'

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  username: z.string().min(3, 'Au moins 3 caractères'),
  first_name: z.string().min(2, 'Au moins 2 caractères'),
  last_name: z.string().min(2, 'Au moins 2 caractères'),
  phone_number: z.string().min(9, 'Numéro invalide'),
  consular_card_number: z.string()
    .optional()
    .refine((val) => !val || /^SN\d{7,9}$/i.test(val), {
      message: "Format invalide. Le numéro doit commencer par 'SN' suivi de 7 à 9 chiffres (ex: SN1234567). Si vous ne connaissez pas votre numéro, laissez ce champ vide."
    }),
  // Champs optionnels pour plusieurs noms et prénoms
  additional_first_names: z.string().optional().transform((val) => {
    if (!val || val.trim() === '') return []
    return val.split(',').map(n => n.trim()).filter(n => n.length > 0)
  }),
  birth_last_name: z.string().optional(),
  used_last_name: z.string().optional(),
  additional_last_names: z.string().optional().transform((val) => {
    if (!val || val.trim() === '') return []
    return val.split(',').map(n => n.trim()).filter(n => n.length > 0)
  }),
  password: z.string()
    .min(8, 'Au moins 8 caractères')
    .regex(/[A-Z]/, 'Au moins une majuscule')
    .regex(/[a-z]/, 'Au moins une minuscule')
    .regex(/\d/, 'Au moins un chiffre')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Au moins un caractère spécial'),
  password_confirm: z.string(),
}).refine((data) => data.password === data.password_confirm, {
  message: "Les mots de passe ne correspondent pas",
  path: ["password_confirm"],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [registrationData, setRegistrationData] = useState<{
    hasValidConsularCard: boolean
    consularCardNumber?: string
  } | null>(null)
  const navigate = useNavigate()
  const formRef = useAutoFocus({ enabled: true, delay: 200 })

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      const response = await authApi.register(data)
      
      // Vérifier le statut du compte et du numéro de carte
      const hasValidConsularCard = response.data?.consular_card_validated || false
      const consularCardNumber = data.consular_card_number?.toUpperCase().trim() || ''
      
      // Si pas de carte consulaire ou carte invalide/vide, rediriger vers la page explicative
      if (!hasValidConsularCard || !consularCardNumber) {
        navigate('/inactive-account', {
          replace: true,
          state: {
            email: data.email,
            reason: 'no_consular_card',
            message: 'Votre compte a été créé avec succès, mais nécessite une carte consulaire valide pour être activé. Veuillez vous rendre au bureau de l\'ambassade avec les documents requis pour obtenir votre carte consulaire.',
            fromRegistration: true
          }
        })
        return
      }
      
      // Si le compte a une carte valide, afficher la modal de succès
      setRegistrationData({
        hasValidConsularCard: true,
        consularCardNumber
      })
      setShowSuccessModal(true)
      
      // Si le compte est valide et vérifié, rediriger vers la vérification email après fermeture de la modal
      if (response.data.needs_verification) {
        // La modal sera fermée par l'utilisateur, puis redirection
      }
    } catch (error: any) {
      // Gestion d'erreurs plus détaillée pour l'inscription
      let errorMsg = 'Erreur lors de l\'inscription'
      let errorTitle = 'Échec de l\'inscription'
      
      const errorData = error.response?.data || {}
      const errorDetail = errorData.error || ''
      const errorMessage = typeof errorDetail === 'string' ? errorDetail.toLowerCase() : ''
      
      // PRIORITÉ 1: Vérifier si c'est un problème de carte consulaire
      // Cela inclut : pas de carte, carte invalide, carte vide, format incorrect
      const consularCardErrors = errorData.consular_card_number || []
      const hasConsularCardError = Array.isArray(consularCardErrors) && consularCardErrors.length > 0
      const isConsularCardRelated = hasConsularCardError || 
                                    errorMessage.includes('carte consulaire') || 
                                    errorMessage.includes('consular card') ||
                                    errorMessage.includes('consular_card') ||
                                    errorData.no_consular_card ||
                                    errorData.consular_card_invalid
      
      if (isConsularCardRelated) {
        // Rediriger vers la page explicative pour les problèmes de carte consulaire
        const consularErrorMsg = hasConsularCardError 
          ? Array.isArray(consularCardErrors) ? consularCardErrors[0] : consularCardErrors
          : errorData.error || 'Votre numéro de carte consulaire est invalide ou manquant. Veuillez vous rendre au bureau de l\'ambassade avec les documents requis pour obtenir votre carte consulaire.'
        
        navigate('/inactive-account', {
          replace: true,
          state: {
            email: data.email,
            reason: 'no_consular_card',
            message: consularErrorMsg,
            fromRegistration: true
          }
        })
        return // Ne pas afficher de toast, la redirection gère l'affichage
      }
      
      if (error.response?.status === 400) {
        // Erreurs de validation des champs (sauf carte consulaire déjà gérée)
        const errors = error.response?.data
        
        if (errors?.email?.[0]) {
          errorTitle = 'Email invalide'
          errorMsg = errors.email[0]
        } else if (errors?.username?.[0]) {
          errorTitle = 'Nom d\'utilisateur invalide'
          errorMsg = errors.username[0]
        } else if (errors?.password?.[0]) {
          errorTitle = 'Mot de passe invalide'
          errorMsg = errors.password[0]
        } else if (errors?.phone_number?.[0]) {
          errorTitle = 'Numéro de téléphone invalide'
          errorMsg = errors.phone_number[0]
        } else if (errors?.first_name?.[0]) {
          errorTitle = 'Prénom invalide'
          errorMsg = errors.first_name[0]
        } else if (errors?.last_name?.[0]) {
          errorTitle = 'Nom invalide'
          errorMsg = errors.last_name[0]
        } else {
          errorMsg = errors?.error || 'Données invalides. Vérifiez tous les champs.'
        }
      } else if (error.response?.status === 409) {
        errorTitle = 'Compte déjà existant'
        errorMsg = 'Un compte avec cet email ou nom d\'utilisateur existe déjà.'
      } else if (error.response?.status === 500) {
        errorTitle = 'Erreur serveur'
        errorMsg = 'Erreur interne du serveur. Veuillez réessayer plus tard.'
      } else if (!error.response) {
        errorTitle = 'Problème de connexion'
        errorMsg = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.'
      } else {
        errorMsg = error.response?.data?.error || 'Erreur lors de l\'inscription'
      }
      
      // Afficher l'erreur avec un titre et un message détaillé
      toast.error(`${errorTitle}: ${errorMsg}`, {
        duration: 6000,
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
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ResponsiveFormPage
      title="Inscription"
      subtitle="Créez votre compte pour accéder aux services consulaires"
      maxWidth="2xl"
    >
      <div ref={formRef}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Prénom"
              error={errors.first_name?.message}
              required
            >
              <Input
                type="text"
                {...register('first_name')}
                placeholder="Prénom"
                error={!!errors.first_name}
                autoComplete="given-name"
              />
            </FormField>

            <FormField
              label="Nom"
              error={errors.last_name?.message}
              required
            >
              <Input
                type="text"
                {...register('last_name')}
                placeholder="Nom"
                error={!!errors.last_name}
                autoComplete="family-name"
              />
            </FormField>
          </div>

          {/* Champs optionnels simplifiés pour plusieurs noms/prénoms */}
          <details className="bg-gray-50 border border-gray-200 rounded-lg">
            <summary className="px-4 py-2 cursor-pointer text-sm text-gray-700 hover:text-gray-900">
              <span className="font-medium">Autres prénoms ou noms (optionnel)</span>
            </summary>
            <div className="px-4 pb-4 pt-2 space-y-3">
              <FormField
                label="Autres prénoms"
                error={errors.additional_first_names?.message}
                helpText="Séparez par des virgules si plusieurs (ex: Marie, Sophie)"
              >
                <Input
                  type="text"
                  {...register('additional_first_names')}
                  placeholder="Marie, Sophie"
                  error={!!errors.additional_first_names}
                  autoComplete="off"
                />
              </FormField>

              <FormField
                label="Autres noms de famille"
                error={errors.additional_last_names?.message}
                helpText="Séparez par des virgules si plusieurs (ex: Dupont, Martin)"
              >
                <Input
                  type="text"
                  {...register('additional_last_names')}
                  placeholder="Dupont, Martin"
                  error={!!errors.additional_last_names}
                  autoComplete="off"
                />
              </FormField>
            </div>
          </details>

          <FormField
            label="Email"
            error={errors.email?.message}
            required
          >
            <Input
              type="email"
              {...register('email')}
              placeholder="votre@email.com"
              error={!!errors.email}
              autoComplete="email"
            />
            <ValidationFeedback
              value={watch('email') || ''}
              rules={[validationRules.email(watch('email') || '')]}
              className="mt-1"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Téléphone"
              error={errors.phone_number?.message}
              required
            >
              <Input
                type="tel"
                {...register('phone_number')}
                placeholder="+221XXXXXXXXX"
                error={!!errors.phone_number}
                autoComplete="tel"
              />
            </FormField>

            <FormField
              label="Nom d'utilisateur"
              error={errors.username?.message}
              required
            >
              <Input
                type="text"
                {...register('username')}
                placeholder="nomutilisateur"
                error={!!errors.username}
                autoComplete="username"
              />
            </FormField>
          </div>

          <FormField
            label="Numéro de carte consulaire"
            error={errors.consular_card_number?.message}
            helpText="Format: SN1234567 (optionnel)"
          >
            <Input
              type="text"
              {...register('consular_card_number')}
              placeholder="SN1234567 (optionnel)"
              error={!!errors.consular_card_number}
              autoComplete="off"
              style={{ textTransform: 'uppercase' }}
              onChange={(e) => {
                const value = e.target.value.toUpperCase()
                e.target.value = value
                register('consular_card_number').onChange(e)
              }}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Mot de passe"
              error={errors.password?.message}
              required
            >
              <Input
                type="password"
                {...register('password')}
                onChange={(e) => {
                  setPassword(e.target.value)
                  register('password').onChange(e)
                }}
                placeholder="••••••••"
                error={!!errors.password}
                autoComplete="new-password"
              />
              <PasswordStrengthMeter password={password} />
            </FormField>

            <FormField
              label="Confirmer mot de passe"
              error={errors.password_confirm?.message}
              required
            >
              <Input
                type="password"
                {...register('password_confirm')}
                placeholder="••••••••"
                error={!!errors.password_confirm}
                autoComplete="new-password"
              />
            </FormField>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3 text-base font-medium"
          >
            {isLoading ? 'Inscription...' : 'S\'inscrire'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-primary-500 hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </div>

      {/* Modal de succès d'inscription */}
      <RegistrationSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          // Rediriger vers la vérification email ou login selon le cas
          if (registrationData?.hasValidConsularCard) {
            navigate('/verify-email', { 
              state: { email: watch('email') }
            })
          } else {
            navigate('/login')
          }
        }}
        hasValidConsularCard={registrationData?.hasValidConsularCard || false}
        consularCardNumber={registrationData?.consularCardNumber}
      />
    </ResponsiveFormPage>
  )
}

