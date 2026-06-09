'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })

  if (!token) {
    return (
      <Card className="border-border/50 bg-card/40 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <CardHeader className="text-center pb-8 pt-10">
          <CardTitle className="text-2xl font-bold tracking-tight text-destructive">Invalid Link</CardTitle>
          <p className="text-muted-foreground mt-2">No reset token provided.</p>
        </CardHeader>
        <CardFooter className="flex justify-center border-t border-border/50 bg-muted/10 py-4">
          <Link href="/forgot-password" className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">
            Request a new link
          </Link>
        </CardFooter>
      </Card>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword: formData.password,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Reset failed')
      }

      toast.success('Password updated successfully!')
      router.push('/login')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      <CardContent className="pt-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
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
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
            className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center justify-center border-t border-border/50 bg-muted/10 py-5 gap-2 text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Create New Password</h1>
        <p className="text-muted-foreground text-sm">Please enter your new password below.</p>
      </div>

      <Suspense fallback={
        <Card className="border-border/50 bg-card/40 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <CardHeader className="text-center pb-8 pt-10">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          </CardHeader>
        </Card>
      }>
        <ResetForm />
      </Suspense>
    </div>
  )
}
