import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { authApi } from '../lib/api'

const verificationSchema = z.object({
  code: z.string().min(6, 'Code de 6 chiffres requis').max(6, 'Code de 6 chiffres requis'),
})

type VerificationFormData = z.infer<typeof verificationSchema>

export default function EmailVerificationPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [timeLeft, setTimeLeft] = useState(900) // 15 minutes in seconds
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get email from location state or use a default
  const email = location.state?.email || ''

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
  })

  // Countdown timer
  React.useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const onSubmit = async (data: VerificationFormData) => {
    setIsLoading(true)
    try {
      const response = await authApi.verifyEmail({ email, code: data.code })
      const responseData = response.data || {}
      
      // Vérifier si l'utilisateur a un avertissement (pas de carte consulaire ou compte inactif)
      if (responseData.warning) {
        // Rediriger vers la page inactive-account avec les détails
        navigate('/inactive-account', {
          replace: true,
          state: {
            email: email,
            reason: responseData.has_consular_card === false ? 'no_consular_card' : 'inactive_account',
            message: responseData.warning.message,
            title: responseData.warning.title,
            required_documents: responseData.warning.required_documents,
            instructions: responseData.warning.instructions,
            embassy_address: responseData.warning.embassy_address,
            fromVerification: true
          }
        })
        return
      }
      
      // Si tout est OK
      if (responseData.email_verified && responseData.account_active) {
        toast.success('Email vérifié avec succès !')
        navigate('/login', { 
          state: { message: 'Votre compte a été vérifié. Vous pouvez maintenant vous connecter.' }
        })
      } else {
        // Cas où l'email est vérifié mais le compte n'est pas actif
        navigate('/inactive-account', {
          replace: true,
          state: {
            email: email,
            reason: 'inactive_account',
            message: responseData.warning?.message || 'Votre compte est en attente d\'activation par l\'ambassade.',
            fromVerification: true
          }
        })
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Erreur lors de la vérification'
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setIsResending(true)
    try {
      await authApi.resendVerificationCode({ email })
      toast.success('Nouveau code envoyé !')
      setTimeLeft(900) // Reset timer
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Erreur lors de l\'envoi du code'
      toast.error(errorMsg)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Vérification Email</h1>
          <p className="text-gray-600">
            Nous avons envoyé un code de vérification à
          </p>
          <p className="font-medium text-gray-900">{email}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="label">Code de vérification</label>
            <input
              type="text"
              {...register('code')}
              className="input text-center text-2xl tracking-widest"
              placeholder="123456"
              maxLength={6}
            />
            {errors.code && (
              <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>
            )}
          </div>

          {/* Timer */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Code expire dans :{' '}
              <span className={`font-mono font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-gray-900'}`}>
                {formatTime(timeLeft)}
              </span>
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || timeLeft === 0}
            className="btn-primary w-full"
          >
            {isLoading ? 'Vérification...' : 'Vérifier'}
          </button>

          {timeLeft === 0 && (
            <div className="text-center">
              <p className="text-red-600 text-sm mb-4">Le code a expiré</p>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isResending}
                className="btn-secondary w-full"
              >
                {isResending ? 'Envoi...' : 'Renvoyer un nouveau code'}
              </button>
            </div>
          )}

          {timeLeft > 0 && (
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isResending}
              className="btn-secondary w-full"
            >
              {isResending ? 'Envoi...' : 'Renvoyer le code'}
            </button>
          )}
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Vous n'avez pas reçu l'email ? Vérifiez vos spams ou{' '}
            <button
              onClick={handleResendCode}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              renvoyez le code
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
