import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, CreditCard, Smartphone, Shield, Lock, MessageCircle, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

// Declare IntaSend types for TypeScript
declare global {
  interface Window {
    IntaSend: any
  }
}

interface PaymentWallProps {
  onPaymentSuccess: () => void
}

const PaymentWall: React.FC<PaymentWallProps> = ({ onPaymentSuccess }) => {
  const { user, profile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'verifying' | 'success' | 'failed'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isIntaSendLoaded, setIsIntaSendLoaded] = useState(false)
  const [intaSendInstance, setIntaSendInstance] = useState<any>(null)
  const [pricingInfo] = useState<{ amount: number; label: string }>({
    amount: 499,
    label: 'Student Subscription',
  })

  useEffect(() => {
    // Check if script is already loaded
    if (window.IntaSend) {
      setIsIntaSendLoaded(true)
      initializeIntaSend()
      return
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="intasend-inlinejs-sdk"]')) {
      const checkIntaSend = () => {
        if (window.IntaSend) {
          setIsIntaSendLoaded(true)
          initializeIntaSend()
        } else {
          setTimeout(checkIntaSend, 100)
        }
      }
      setTimeout(checkIntaSend, 100)
      return
    }

    // Load the script
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/intasend-inlinejs-sdk@4.0.7/build/intasend-inline.js'
    script.async = true
    script.onload = () => {
      setIsIntaSendLoaded(true)
      initializeIntaSend()
    }
    script.onerror = () => {
      console.error('Payment SDK failed to load')
      setError('Failed to load payment system. Please check your internet connection and refresh the page.')
    }
    
    document.head.appendChild(script)
    
    // Set a timeout fallback
    setTimeout(() => {
      if (!window.IntaSend) {
        console.error('Payment SDK loading timed out')
        setError('Failed to load payment system. Please refresh the page.')
      }
    }, 10000) // 10 second timeout
  }, [])

  const initializeIntaSend = () => {
    if (!window.IntaSend) {
      console.error('Payment SDK is unavailable')
      return
    }

    // Prevent multiple initializations
    if ((window as any).intaSendInitialized) {
      return
    }

    try {
      const apiKey = import.meta.env.VITE_INTASEND_PUBLIC_KEY || 'ISPubKey_test_123456789'
      const isLive = import.meta.env.VITE_INTASEND_LIVE === 'true'
      
      
      // Initialize IntaSend for popup mode
      const intaSend = new window.IntaSend({
        publicAPIKey: apiKey,
        live: isLive,
        redirectURL: window.location.origin + '/student' // Redirect after payment
      })
      .on("COMPLETE", (results: any) => {
        handlePaymentSuccess(results)
      })
      .on("FAILED", (results: any) => {
        handlePaymentFailure(results)
      })
      .on("IN-PROGRESS", (results: any) => {
        setPaymentStatus('processing')
      })
      .on("ERROR", (error: any) => {
        console.error('Payment provider error')
        handlePaymentFailure({ message: error.message || 'Payment system error' })
      })
      
      // Store the instance for manual triggering
      setIntaSendInstance(intaSend)
      
      // Mark as initialized
      ;(window as any).intaSendInitialized = true
      
    } catch (err) {
      console.error('Payment SDK initialization failed', err)
      setError('Failed to initialize payment system.')
    }
  }

  const pollForStatusCompletion = async (attempts = 0) => {
    if (attempts >= 15) { // 30 seconds max
      setError('Payment verification is taking longer than expected. Please refresh the page in a moment to check your status.')
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('payment_status')
        .eq('id', user?.id)
        .single()

      if (error) throw error

      if (data?.payment_status === 'completed') {
        setPaymentStatus('success')
        setIsLoading(false)
        
        // Refresh session if needed
        if (typeof (window as any).refreshProfile === 'function') {
           await (window as any).refreshProfile()
        }
        
        setTimeout(() => {
          onPaymentSuccess()
        }, 1500)
      } else {
        // Poll again in 2 seconds
        setTimeout(() => pollForStatusCompletion(attempts + 1), 2000)
      }
    } catch (err) {
      console.error('Payment status polling failed', err)
      setTimeout(() => pollForStatusCompletion(attempts + 1), 2000)
    }
  }

  const handlePaymentSuccess = async (results: any) => {
    try {
      setIsLoading(true)
      setPaymentStatus('verifying')
      
      // Start polling for the webhook completion
      await pollForStatusCompletion()

    } catch (err) {
      console.error('Payment verification failed', err)
      setError('Payment successful but failed to update local profile. Please refresh the page.')
      setIsLoading(false)
    }
  }

  const handlePaymentFailure = (results: any) => {
    setPaymentStatus('failed')
    setError(results.message || 'Payment failed. Please try again.')
    setIsLoading(false)
  }

  const handleRetryPayment = () => {
    setPaymentStatus('idle')
    setError(null)
  }

  const handlePaymentClick = () => {
    if (!intaSendInstance) {
      console.error('Payment SDK is not ready')
      setError('Payment system not ready. Please refresh the page.')
      return
    }

    try {
      // Trigger the payment using IntaSend's run method
      intaSendInstance.run({
        amount: pricingInfo.amount,
        currency: 'KES',
        email: profile?.email || user?.email || '',
        phone_number: profile?.phone || '254700000000',
        api_ref: `PAY_${user?.id}_${Date.now()}`,
        first_name: profile?.full_name?.split(' ')[0] || 'User',
        last_name: profile?.full_name?.split(' ').slice(1).join(' ') || 'Name'
      })
    } catch (err) {
      console.error('Could not open payment window', err)
      setError('Failed to open payment window. Please try again.')
    }
  }

  if (!isIntaSendLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md bg-card border-card-border shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-foreground font-medium">Loading payment system...</span>
              </div>
              <p className="text-sm text-foreground-muted">
                This should only take a few seconds. If it takes longer, please refresh the page.
              </p>
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 w-full">
      <Card className="w-full max-w-2xl bg-card border-card-border shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-green-500" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Book Career Counselor Session
          </CardTitle>
            <CardDescription className="text-base sm:text-lg text-foreground-muted mt-2">
              Unlock term-based platform access and professional career features.
            </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 sm:space-y-8 px-4 sm:px-8 pb-8">
          {/* Payment Status */}
          {paymentStatus === 'success' && (
            <Alert className="border-green-500/20 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-600 font-medium">
                Payment successful! Redirecting to your dashboard...
              </AlertDescription>
            </Alert>
          )}

          {paymentStatus === 'failed' && (
            <Alert variant="destructive" className="bg-destructive/10">
              <XCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="font-medium text-destructive">
                {error || 'Payment failed. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          {paymentStatus === 'processing' && (
            <Alert className="border-primary/20 bg-primary/10">
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
              <AlertDescription className="text-primary font-medium">
                Processing your payment... Please wait.
              </AlertDescription>
            </Alert>
          )}

          {paymentStatus === 'verifying' && (
            <Alert className="border-amber-500/20 bg-amber-500/10">
              <RefreshCw className="h-4 w-4 text-amber-600 animate-spin" />
              <AlertDescription className="text-amber-700 font-medium">
                Verifying payment authenticity... This usually takes 5-10 seconds.
              </AlertDescription>
            </Alert>
          )}

          {/* Payment Details */}
          <div className="bg-muted/30 border border-card-border rounded-xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-foreground">Payment Details</h3>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                One-time Payment
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base text-foreground-muted">{pricingInfo.label}</span>
                <span className="font-extrabold text-primary text-xl sm:text-2xl">KSh {pricingInfo.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm text-foreground-muted">
                <span>Single term access</span>
                <span>Active until end of academic term</span>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-card-border">
              <div className="flex justify-between items-center text-lg sm:text-xl font-black text-foreground">
                <span>Total</span>
                <span className="text-primary">KSh {pricingInfo.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-foreground">What you'll get:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-card border border-card-border shadow-sm">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Counselor Directory & Booking</span>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-card border border-card-border shadow-sm">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">AI Career Assessment</span>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-card border border-card-border shadow-sm">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Personalized Reports</span>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-card border border-card-border shadow-sm">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Academic Tracking</span>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <div className="space-y-4">
            {paymentStatus === 'failed' && (
              <Button 
                onClick={handleRetryPayment}
                variant="outline" 
                className="w-full"
              >
                Try Again
              </Button>
            )}

            {paymentStatus !== 'success' && (
              <Button
                className="w-full h-12 text-base font-bold bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20 transition-all duration-200"
                disabled={isLoading || paymentStatus === 'processing' || !intaSendInstance}
                onClick={handlePaymentClick}
              >
                {isLoading || paymentStatus === 'processing' || paymentStatus === 'verifying' ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {paymentStatus === 'verifying' ? 'Verifying...' : 'Processing...'}
                  </>
                ) : !intaSendInstance ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pay KSh {pricingInfo.amount.toLocaleString()} Now
                  </>
                )}
              </Button>
            )}

            <p className="text-xs text-foreground-muted text-center pt-2">
              Secure payment powered by IntaSend. We accept M-Pesa, Visa, Mastercard, and more.
            </p>
            {import.meta.env.VITE_INTASEND_PUBLIC_KEY === 'your_intasend_public_key_here' && (
              <Alert className="mt-4 border-yellow-200 bg-yellow-50">
                <AlertDescription className="text-yellow-800">
                  <strong>Test Mode:</strong> Please add your IntaSend API key to .env.local to enable real payments.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PaymentWall
