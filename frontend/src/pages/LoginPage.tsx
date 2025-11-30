import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import ProtectedFeatureLink from '../components/ProtectedFeatureLink'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { authApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import FormField, { Input } from '../components/FormField'
import ResponsiveFormPage from '../components/ResponsiveFormPage'
import useAutoFocus from '../hooks/useAutoFocus'
import { getDefaultRoute, UserRole } from '../lib/permissions'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const formRef = useAutoFocus({ enabled: true, delay: 200 })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      
      const response = await authApi.login(data.email, data.password)
      const { access, refresh, user } = response.data
      
      // Debug minimal en dev
      if (process.env.NODE_ENV === 'development') {}
      
      // Vérifier que les données sont complètes
      if (!user || !access || !refresh) {
        throw new Error('Données de connexion incomplètes')
      }
      
      if (process.env.NODE_ENV === 'development') {}
      
      // Normaliser le rôle en majuscules pour s'assurer de la cohérence
      const normalizedUser = {
        ...user,
        role: user.role?.toUpperCase() || user.role
      }
      
      // Store auth data immediately
      setAuth(normalizedUser, access, refresh)
      
      // Si le compte est inactif, rediriger vers la page d'activation
      if (!normalizedUser.is_active) {
        toast.info('Votre compte nécessite une activation', {
          duration: 3000
        })
        navigate('/inactive-account', { replace: true })
        return
      }
      
      // Rediriger selon le rôle immédiatement
      toast.success('Connexion réussie !')
      const defaultRoute = getDefaultRoute(normalizedUser.role as UserRole)
      navigate(defaultRoute, { replace: true })
      
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('🔐 Erreur de connexion:', error)
      }
      
      // Gestion d'erreurs plus détaillée
      let errorMsg = 'Erreur de connexion'
      let errorTitle = 'Échec de la connexion'
      
      // Analyser le message d'erreur du backend pour distinguer les cas
      const errorData = error.response?.data || {}
      
      // Extraire le message d'erreur - peut être un string, un array, ou un objet
      let errorDetail = ''
      if (typeof errorData.error === 'string') {
        errorDetail = errorData.error
      } else if (Array.isArray(errorData.error)) {
        errorDetail = errorData.error[0] || ''
      } else if (errorData.detail) {
        errorDetail = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail)
      }
      
      // Extraire aussi les autres champs d'erreur possibles
      const allErrorMessages = []
      if (errorDetail) allErrorMessages.push(errorDetail)
      if (errorData.invalid_credentials && Array.isArray(errorData.invalid_credentials)) {
        allErrorMessages.push(...errorData.invalid_credentials)
      }
      if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
        allErrorMessages.push(...errorData.non_field_errors)
      }
      
      const errorMessage = allErrorMessages.join(' ').toLowerCase()
      
      // Debug en développement
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Error Data:', errorData)
        console.log('🔍 Error Message:', errorMessage)
        console.log('🔍 no_consular_card:', errorData.no_consular_card)
        console.log('🔍 account_inactive:', errorData.account_inactive)
      }
      
      // PRIORITÉ 1: Vérifier si c'est un problème de carte consulaire (AVANT tout autre traitement)
      // Cette vérification doit être faite en premier car elle peut être dans une erreur 400
      // Gérer le cas où no_consular_card peut être un booléen, un tableau, ou une chaîne
      const hasNoConsularCard = errorData.no_consular_card === true || 
                                 errorData.no_consular_card === 'True' ||
                                 (Array.isArray(errorData.no_consular_card) && 
                                  (errorData.no_consular_card[0] === true || 
                                   errorData.no_consular_card[0] === 'True' ||
                                   String(errorData.no_consular_card[0]).toLowerCase() === 'true'))
      
      const isConsularCardIssue = hasNoConsularCard || 
                                   errorMessage.includes('carte consulaire') || 
                                   errorMessage.includes('consular card') ||
                                   errorMessage.includes('consular_card') ||
                                   errorMessage.includes('nécessite une carte') ||
                                   errorMessage.includes('carte consulaire valide') ||
                                   errorMessage.includes('rendre au bureau de l\'ambassade')
      
      if (isConsularCardIssue) {
        errorTitle = 'Carte consulaire requise'
        errorMsg = errorDetail || errorData.error?.[0] || 'Votre compte nécessite une carte consulaire valide pour être activé. Veuillez vous rendre au bureau de l\'ambassade avec une pièce d\'identité et les documents requis pour obtenir votre carte consulaire et activer votre compte.'
        navigate('/inactive-account', { 
          replace: true, 
          state: { 
            email: data.email,
            reason: 'no_consular_card',
            message: errorMsg
          } 
        })
        return // Prevent toast and further processing
      }
      
      // PRIORITÉ 2: Vérifier si c'est un compte inactif (peut être dans 400 ou 401)
      // Gérer le cas où account_inactive peut être un booléen, un tableau, ou une chaîne
      const hasAccountInactive = errorData.account_inactive === true || 
                                 errorData.account_inactive === 'True' ||
                                 (Array.isArray(errorData.account_inactive) && 
                                  (errorData.account_inactive[0] === true || 
                                   errorData.account_inactive[0] === 'True' ||
                                   String(errorData.account_inactive[0]).toLowerCase() === 'true'))
      
      if (hasAccountInactive || errorMessage.includes('inactif') || errorMessage.includes('inactive')) {
        errorTitle = 'Compte inactif'
        errorMsg = errorDetail || errorData.error?.[0] || 'Votre compte est inactif. Vous serez redirigé vers les instructions d\'activation.'
        navigate('/inactive-account', { 
          replace: true, 
          state: { 
            email: data.email,
            reason: hasNoConsularCard ? 'no_consular_card' : 'inactive',
            message: errorMsg
          } 
        })
        return // Prevent toast and further processing
      }
      
      if (error.response?.status === 401) {
        // Distinguer entre compte inexistant et mauvais mot de passe
        if (errorData.account_not_found || 
            errorMessage.includes('aucun compte') ||
            errorMessage.includes('compte introuvable') ||
            errorMessage.includes('account not found')) {
          errorTitle = 'Compte introuvable'
          errorMsg = 'Aucun compte n\'est associé à cet email. Si vous n\'avez pas encore de compte, veuillez vous rendre à l\'ambassade pour vous enregistrer et obtenir votre carte consulaire.'
        } else if (errorData.invalid_password || 
                   errorData.invalid_credentials ||
                   errorMessage.includes('mot de passe incorrect') ||
                   errorMessage.includes('password') ||
                   errorMessage.includes('invalid')) {
          errorTitle = 'Mot de passe incorrect'
          errorMsg = 'Le mot de passe que vous avez entré est incorrect. Veuillez vérifier votre mot de passe et réessayer.'
        } else {
          errorTitle = 'Identifiants incorrects'
          errorMsg = 'Email ou mot de passe incorrect. Veuillez vérifier vos informations. Si vous n\'avez pas encore de compte, veuillez vous rendre à l\'ambassade pour vous enregistrer.'
        }
      } else if (error.response?.status === 400 && errorData.needs_verification) {
        // Compte non vérifié par email
        errorTitle = 'Email non vérifié'
        errorMsg = errorData.error || 'Veuillez vérifier votre email avant de vous connecter. Consultez votre boîte de réception pour le lien de vérification.'
        toast.error(`${errorTitle}: ${errorMsg}`, {
          duration: 6000,
          style: {
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '14px',
            maxWidth: '400px'
          }
        })
        // Rediriger vers la page de vérification email
        navigate('/verify-email', { 
          replace: true,
          state: { email: data.email }
        })
        return // Prevent further processing
      } else if (error.response?.status === 403 || errorData.account_inactive) {
        // Compte inactif ou suspendu
        if (errorData.account_inactive || 
            errorMessage.includes('inactif') ||
            errorMessage.includes('inactive') ||
            errorMessage.includes('suspendu')) {
          errorTitle = 'Compte inactif'
          errorMsg = errorData.error || 'Votre compte est inactif. Vous serez redirigé vers les instructions d\'activation.'
          navigate('/inactive-account', { 
            replace: true, 
            state: { 
              email: data.email,
              reason: errorData.no_consular_card ? 'no_consular_card' : 'inactive',
              message: errorData.error
            } 
          })
          return // Prevent toast and further processing
        } else {
          errorTitle = 'Compte non autorisé'
          errorMsg = 'Votre compte n\'est pas autorisé à se connecter. Contactez l\'administrateur.'
        }
      } else if (error.response?.status === 400) {
        // Erreur 400 - essayer d'extraire le message d'erreur du backend
        // Le backend peut retourner une erreur 400 avec un message détaillé dans errorData.error
        // errorData.error peut être un array ou un string
        let backendError = ''
        if (Array.isArray(errorData.error)) {
          backendError = errorData.error[0] || ''
        } else if (typeof errorData.error === 'string') {
          backendError = errorData.error
        } else if (errorData.detail) {
          backendError = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail)
        } else if (errorData.message) {
          backendError = typeof errorData.message === 'string' ? errorData.message : JSON.stringify(errorData.message)
        }
        
        // Si on a un message d'erreur du backend, l'utiliser
        if (backendError) {
          errorTitle = 'Erreur de connexion'
          errorMsg = backendError
          
          // Si le message contient des indices sur la carte consulaire ou l'inactivité, rediriger
          const lowerError = backendError.toLowerCase()
          if (lowerError.includes('carte consulaire') || 
              lowerError.includes('consular card') ||
              lowerError.includes('nécessite une carte') ||
              lowerError.includes('carte consulaire valide')) {
            navigate('/inactive-account', { 
              replace: true, 
              state: { 
                email: data.email,
                reason: 'no_consular_card',
                message: backendError
              } 
            })
            return
          }
          if (lowerError.includes('inactif') || lowerError.includes('inactive')) {
            navigate('/inactive-account', { 
              replace: true, 
              state: { 
                email: data.email,
                reason: 'inactive',
                message: backendError
              } 
            })
            return
          }
        } else {
          // Si pas de message spécifique, message générique
          errorTitle = 'Erreur de connexion'
          errorMsg = 'Les informations fournies sont invalides. Veuillez vérifier votre email et votre mot de passe.'
        }
      } else if (error.response?.status === 429) {
        errorTitle = 'Trop de tentatives'
        errorMsg = 'Trop de tentatives de connexion. Veuillez attendre quelques minutes avant de réessayer.'
      } else if (error.response?.status === 500) {
        errorTitle = 'Erreur serveur'
        errorMsg = 'Erreur interne du serveur. Veuillez réessayer plus tard.'
      } else if (!error.response) {
        errorTitle = 'Problème de connexion'
        errorMsg = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.'
      } else {
        errorMsg = typeof errorDetail === 'string' ? errorDetail : error.message || 'Erreur de connexion'
      }
      
      // Afficher l'erreur avec un titre et un message détaillé
      toast.error(`${errorTitle}: ${errorMsg}`, {
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
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ResponsiveFormPage
      title="Connexion"
      subtitle="Accédez à votre espace personnel"
      maxWidth="sm"
    >
      <div ref={formRef}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          <FormField
            label="Email"
            error={errors.email?.message}
            required
            helpText="Entrez votre adresse email"
          >
            <Input
              type="email"
              {...register('email')}
              placeholder="votre@email.com"
              error={!!errors.email}
              autoComplete="email"
            />
          </FormField>

          <FormField
            label="Mot de passe"
            error={errors.password?.message}
            required
            helpText="Entrez votre mot de passe"
          >
            <Input
              type="password"
              {...register('password')}
              placeholder="••••••••"
              error={!!errors.password}
              autoComplete="current-password"
            />
          </FormField>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3 text-base font-medium"
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">
            Pas encore de compte ?{' '}
            <ProtectedFeatureLink to="/register" feature="registration" className="text-primary-500 hover:underline font-medium">
              S'inscrire
            </ProtectedFeatureLink>
          </p>
        </div>
      </div>
    </ResponsiveFormPage>
  )
}

