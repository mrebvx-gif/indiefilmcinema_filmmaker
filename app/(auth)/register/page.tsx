'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        if (data.details) {
          const firstError = Object.values(data.details.fieldErrors)[0] as string[]
          throw new Error(firstError[0] || 'Validation failed')
        }
        throw new Error(data.error || 'Registration failed')
      }

      setSuccess(true)
      toast.success('Registration successful! Please check your email.')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="border-border/50 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="text-center pb-8 pt-10">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Check your email</CardTitle>
          <CardDescription className="text-base mt-2">
            We've sent a verification link to <span className="text-foreground font-medium">{formData.email}</span>.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center border-t border-border/50 bg-muted/20 py-4">
          <Link href="/login" className="text-sm text-primary hover:text-primary/80 transition-colors">
            Return to login
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Create an account</h1>
        <p className="text-muted-foreground text-sm">Join Indie Film Cinema to submit your masterpiece.</p>
      </div>

      <Card className="border-border/50 bg-card/40 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
        <CardContent className="pt-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                placeholder="Christopher Nolan" 
                required 
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="bg-background/50 border-border/50 focus-visible:ring-primary/50 transition-all duration-300"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="director@example.com" 
                required 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-background/50 border-border/50 focus-visible:ring-primary/50 transition-all duration-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-background/50 border-border/50 focus-visible:ring-primary/50 transition-all duration-300 pr-10"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                type={showPassword ? 'text' : 'password'} 
                required 
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="bg-background/50 border-border/50 focus-visible:ring-primary/50 transition-all duration-300"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center border-t border-border/50 bg-muted/10 py-5 gap-2 text-sm text-muted-foreground">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
