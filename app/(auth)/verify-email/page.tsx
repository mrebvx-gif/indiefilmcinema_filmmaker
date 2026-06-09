'use client'

import { useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, XCircle } from 'lucide-react'

function VerifyContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const token = searchParams.get('token')

  useEffect(() => {
    if (token && !error) {
      window.location.href = `/api/auth/verify-email/${token}`
    }
  }, [token, error])

  // If there's no error, it means we are either calling the API or waiting for redirect
  // The API route handles the actual verification and redirects to /login?verified=true

  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      <CardHeader className="text-center pb-8 pt-10">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-muted/50">
          {!error ? (
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          ) : (
            <XCircle className="w-8 h-8 text-destructive" />
          )}
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          {!error ? 'Verifying email...' : 'Verification Failed'}
        </CardTitle>
        <CardDescription className="text-base mt-2">
          {error === 'invalid' && 'This verification link is invalid.'}
          {error === 'expired' && 'This link has expired. Please register again.'}
          {error === 'used' && 'This link has already been used.'}
          {error === 'server' && 'Something went wrong. Please try again.'}
          {!error && 'Please wait while we verify your email address.'}
        </CardDescription>
      </CardHeader>
      
      {error && (
        <CardFooter className="flex justify-center border-t border-border/50 bg-muted/10 py-4">
          <Link href="/login" className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">
            Return to login
          </Link>
        </CardFooter>
      )}
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Suspense fallback={
        <Card className="border-border/50 bg-card/40 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <CardHeader className="text-center pb-8 pt-10">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-muted/50">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Verifying email...</CardTitle>
          </CardHeader>
        </Card>
      }>
        <VerifyContent />
      </Suspense>
    </div>
  )
}
