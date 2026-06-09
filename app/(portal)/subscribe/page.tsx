'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { authFetch } from '@/lib/auth-client'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

function SubscribeContent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const cancelled = searchParams.get('cancelled')
  const pastDue = searchParams.get('past_due')

  async function handleSubscribe() {
    setLoading(true)
    setError('')
    try {
      const res = await authFetch('/api/subscriptions/checkout-url')
      if (!res.ok) throw new Error('Failed to get checkout URL')
      const { checkoutUrl } = await res.json()
      window.location.href = checkoutUrl
    } catch {
      setError('Something went wrong connecting to the payment provider. Please try again.')
      setLoading(false)
    }
  }

  async function handleUpdateBilling() {
    setLoading(true)
    try {
      const res = await authFetch('/api/subscriptions/portal-url')
      if (!res.ok) throw new Error('Failed to get portal URL')
      const { portalUrl } = await res.json()
      window.open(portalUrl, '_blank')
    } catch {
      setError('Something went wrong accessing your billing portal. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-border/50 bg-card/40 backdrop-blur-xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
      <CardHeader className="text-center pt-8">
        <CardTitle className="text-3xl font-bold tracking-tight">Filmmaker Access</CardTitle>
        <CardDescription className="text-base mt-2">
          Unlock your portal to submit films and track their status.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {cancelled && (
          <Alert className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            <AlertCircle className="h-4 w-4 !text-yellow-500" />
            <AlertDescription>
              Your subscription was cancelled. You can re-subscribe below to restore access.
            </AlertDescription>
          </Alert>
        )}
        {pastDue && (
          <Alert variant="destructive" className="bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your last payment failed. Please update your billing details to continue.
            </AlertDescription>
          </Alert>
        )}

        <div className="text-center space-y-2 p-6 bg-background/50 rounded-2xl border border-border/50">
          <p className="text-5xl font-bold text-foreground">
            $6.50<span className="text-xl text-muted-foreground font-normal">/mo</span>
          </p>
          <p className="text-sm text-primary font-medium tracking-wide uppercase">Launch Pricing</p>
        </div>

        <ul className="space-y-4 text-sm px-2">
          {[
            'Submit unlimited films to the festival',
            'Direct, high-speed upload via BunnyCDN',
            'Full submission tracking and history',
            'Cancel anytime, no hidden fees',
          ].map((item) => (
            <li key={item} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-accent shrink-0" /> 
              <span className="text-foreground/90">{item}</span>
            </li>
          ))}
        </ul>

        {error && (
          <Alert variant="destructive" className="bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="pt-2">
          {pastDue ? (
            <Button
              className="w-full h-12 text-base font-medium"
              onClick={handleUpdateBilling}
              disabled={loading}
              variant="outline"
            >
              {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
              {loading ? 'Processing...' : 'Update Billing Details'}
            </Button>
          ) : (
            <Button
              className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300"
              onClick={handleSubscribe}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
              {loading ? 'Processing...' : 'Subscribe Now'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function SubscribePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Cinematic background effects */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[30%] -left-[10%] w-[60%] h-[60%] rounded-full bg-brand-light/20 blur-[120px] animate-pulse-slow" />
        <div className="absolute -bottom-[30%] -right-[10%] w-[60%] h-[60%] rounded-full bg-accent/10 blur-[120px]" />
      </div>
      
      <Suspense fallback={
        <div className="w-full max-w-md flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      }>
        <SubscribeContent />
      </Suspense>
    </div>
  )
}
