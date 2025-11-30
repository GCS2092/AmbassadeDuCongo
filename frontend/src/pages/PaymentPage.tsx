/**
 * Complete Payment Page with Stripe Integration
 * Page de paiement complète avec Stripe
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import toast from 'react-hot-toast'
import { FiLock, FiCreditCard } from 'react-icons/fi'
import { applicationsApi, paymentsApi } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'

// Load Stripe (will be configured with real key)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder')

export default function PaymentPage() {
  const { applicationId } = useParams<{ applicationId: string }>()
  const navigate = useNavigate()

  const { data: application, isLoading } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: () => applicationsApi.get(Number(applicationId)).then(res => res.data)
  })

  if (isLoading) {
    return <LoadingSpinner text="Chargement..." />
  }

  if (!application) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card text-center">
          <p>Demande non trouvée</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Paiement</h1>
          <p className="text-gray-600">Paiement sécurisé par Stripe</p>
        </div>

        <Elements stripe={stripePromise}>
          <PaymentForm application={application} onSuccess={() => navigate('/applications')} />
        </Elements>
      </div>
    </div>
  )
}

function PaymentForm({ application, onSuccess }: { application: any; onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile'>('card')

  const createPayment = useMutation({
    mutationFn: (method: string) =>
      paymentsApi.create({
        application: application.id,
        payment_method: method === 'card' ? 'STRIPE' : 'ORANGE',
      }),
    onSuccess: (response) => response.data,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    if (paymentMethod === 'card') {
      await handleCardPayment()
    } else {
      await handleMobileMoneyPayment()
    }
  }

  const handleCardPayment = async () => {
    setIsProcessing(true)

    try {
      // Create payment in backend
      const payment = await createPayment.mutateAsync('card')

      // Create Stripe payment intent
      const { data: intentData } = await paymentsApi.createIntent(payment.id)

      // Confirm payment with Stripe
      const cardElement = elements!.getElement(CardElement)
      const { error, paymentIntent } = await stripe!.confirmCardPayment(
        intentData.client_secret,
        {
          payment_method: {
            card: cardElement!,
          },
        }
      )

      if (error) {
        toast.error(error.message || 'Erreur de paiement')
      } else if (paymentIntent.status === 'succeeded') {
        // Confirm in backend
        await paymentsApi.confirm(payment.id)
        toast.success('Paiement réussi !')
        onSuccess()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors du paiement')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMobileMoneyPayment = async () => {
    setIsProcessing(true)

    try {
      const payment = await createPayment.mutateAsync('mobile')
      toast.success('Paiement Mobile Money initié. Suivez les instructions sur votre téléphone.')
      
      // Redirect to applications or show instructions
      setTimeout(() => onSuccess(), 2000)
    } catch (error: any) {
      toast.error('Erreur lors de l\'initialisation du paiement')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Summary */}
      <div className="card bg-primary-50 border-2 border-primary-200">
        <h3 className="font-bold text-lg mb-4">Résumé du paiement</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Demande :</span>
            <span className="font-medium">{application.reference_number}</span>
          </div>
          <div className="flex justify-between">
            <span>Service :</span>
            <span className="font-medium">{application.service_name}</span>
          </div>
          <div className="flex justify-between">
            <span>Frais de base :</span>
            <span>{application.base_fee} XOF</span>
          </div>
          {application.additional_fees > 0 && (
            <div className="flex justify-between">
              <span>Frais additionnels :</span>
              <span>{application.additional_fees} XOF</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold pt-3 border-t-2 border-primary-300">
            <span>TOTAL :</span>
            <span className="text-primary-600">{application.total_fee} XOF</span>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="card">
        <h3 className="font-bold text-lg mb-4">Méthode de paiement</h3>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            className={`p-4 border-2 rounded-lg transition ${
              paymentMethod === 'card'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-primary-300'
            }`}
          >
            <FiCreditCard className="mx-auto mb-2 text-primary-500" size={32} />
            <p className="font-semibold">Carte bancaire</p>
            <p className="text-xs text-gray-600">Visa, Mastercard</p>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('mobile')}
            className={`p-4 border-2 rounded-lg transition ${
              paymentMethod === 'mobile'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-primary-300'
            }`}
          >
            <div className="text-3xl mb-2">📱</div>
            <p className="font-semibold">Mobile Money</p>
            <p className="text-xs text-gray-600">Orange, Wave</p>
          </button>
        </div>

        {/* Card Payment */}
        {paymentMethod === 'card' && (
          <div>
            <label className="label mb-2">Informations de carte</label>
            <div className="border rounded-lg p-4">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
            <div className="flex items-center space-x-2 mt-3 text-sm text-gray-600">
              <FiLock size={16} />
              <span>Paiement 100% sécurisé par Stripe</span>
            </div>
          </div>
        )}

        {/* Mobile Money */}
        {paymentMethod === 'mobile' && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-800 mb-2">
              <strong>Instructions Mobile Money :</strong>
            </p>
            <ol className="text-sm text-yellow-800 space-y-1 ml-4">
              <li>1. Vous recevrez un code de paiement</li>
              <li>2. Composez le code sur votre téléphone</li>
              <li>3. Validez le paiement</li>
              <li>4. Vous recevrez une confirmation</li>
            </ol>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full btn-primary py-4 text-lg"
      >
        {isProcessing ? 'Traitement...' : `Payer ${application.total_fee} XOF`}
      </button>

      <p className="text-xs text-center text-gray-500">
        En confirmant le paiement, vous acceptez nos conditions générales.
        Vos informations sont sécurisées et ne sont jamais stockées sur nos serveurs.
      </p>
    </form>
  )
}

