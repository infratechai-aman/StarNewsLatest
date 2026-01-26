'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { auth } from '@/lib/api'
import { Mail, Lock, LogIn } from 'lucide-react'

const LoginPage = ({ setUser, setCurrentView, toast }) => {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await auth.login(formData)
      localStorage.setItem('token', response.token)

      // Check if password change is required
      if (response.requirePasswordChange) {
        setUser({ ...response.user, requirePasswordChange: true })
        toast({
          title: 'Password Change Required',
          description: 'For security, you must change your password on first login.'
        })
        setCurrentView('force-password-change')
      } else {
        setUser(response.user)
        toast({ title: 'Login successful!', description: `Welcome back, ${response.user.name}` })

        // Redirect based on role
        if (response.user.role === 'super_admin') {
          setCurrentView('admin-dashboard')
        } else if (response.user.role === 'reporter') {
          setCurrentView('reporter-dashboard')
        } else if (response.user.role === 'advertiser') {
          setCurrentView('advertiser-dashboard')
        } else {
          setCurrentView('home')
        }
      }
    } catch (error) {
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md shadow-xl border-0 bg-gradient-to-b from-white to-gray-50/50">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center mb-2">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to StarNews</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email / Username</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="text"
                  placeholder="your@email.com or username"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Are you a reporter?{' '}
              <button
                onClick={() => setCurrentView('register')}
                className="text-red-600 hover:underline font-medium"
              >
                Register here
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginPage

