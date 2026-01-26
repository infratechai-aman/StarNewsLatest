'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { auth } from '@/lib/api'
import { User, Mail, Lock } from 'lucide-react'

const ROLES = {
  REGISTERED: 'registered',
  ADVERTISER: 'advertiser'
}

const RegisterPage = ({ setUser, setCurrentView, toast }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: ROLES.REGISTERED
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await auth.register(formData)
      localStorage.setItem('token', response.token)
      setUser(response.user)
      
      let message = 'Registration successful!'
      if (formData.role === ROLES.ADVERTISER) {
        message = 'Business account created! Your account is pending admin approval to post ads.'
      }
      
      toast({ title: 'Success!', description: message })
      setCurrentView('home')
    } catch (error) {
      toast({ title: 'Registration failed', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Register for Pune Majha</CardTitle>
          <CardDescription>Create your account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="name" type="text" placeholder="John Doe" className="pl-10" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required/>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="your@email.com" className="pl-10" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required/>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" className="pl-10" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6}/>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Account Type</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ROLES.REGISTERED}>Regular User Account</SelectItem>
                  <SelectItem value={ROLES.ADVERTISER}>Business Account (Post Ads, Deals, Directory)</SelectItem>
                </SelectContent>
              </Select>
              {formData.role === ROLES.ADVERTISER && (
                <p className="text-xs text-muted-foreground mt-1">
                  Note: Business accounts require admin approval to post content. You can browse as a regular user immediately.
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <button onClick={() => setCurrentView('login')} className="text-primary hover:underline font-medium">
                Login here
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default RegisterPage