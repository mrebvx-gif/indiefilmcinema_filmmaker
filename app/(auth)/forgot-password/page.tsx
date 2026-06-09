'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Request failed')
      }

      setSuccess(true)
      toast.success('Reset link sent!')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Card className="border-border/50 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden group">
          <CardHeader className="text-center pb-8 pt-10">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Check your email</CardTitle>
            <CardDescription className="text-base mt-2">
              If an account exists for <span className="text-foreground font-medium">{email}</span>, we've sent a password reset link.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center border-t border-border/50 bg-muted/20 py-4">
            <Link href="/login" className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">
              Return to login
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Reset Password</h1>
        <p className="text-muted-foreground text-sm">Enter your email and we'll send you a link.</p>
      </div>

      <Card className="border-border/50 bg-card/40 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <CardContent className="pt-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input 
                id="email" 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50 border-border/50 focus-visible:ring-primary/50 transition-all duration-300"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {loading ? 'Sending link...' : 'Send reset link'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center border-t border-border/50 bg-muted/10 py-5 gap-2 text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
