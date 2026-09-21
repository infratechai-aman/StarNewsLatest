'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { auth } from '@/lib/api'
import { User, Mail, Lock } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

const ROLES = {
  REGISTERED: 'registered',
  ADVERTISER: 'advertiser'
}

const RegisterPage = ({ setUser, setCurrentView, toast }) => {
  const { t } = useLanguage()
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
      await auth.register(formData)
      
      let message = 'Registration successful! Please login with your new account.'
      if (formData.role === ROLES.ADVERTISER) {
        message = 'Business account created! Your account is pending admin approval. Please login to continue.'
      }
      
      toast({ title: 'Success!', description: message })
      setCurrentView('login')
    } catch (error) {
      toast({ title: 'Registration failed', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md shadow-xl border-0 bg-gradient-to-b from-white to-gray-50/50 rounded-2xl">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center mb-2 shadow-sm">
            <User className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">{t('registerForStarNews') || 'Register for StarNews'}</CardTitle>
          <CardDescription>{t('createAccountDesc') || 'Create your account to get started'}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('fullName') || 'Full Name'}</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="name" 
                  type="text" 
                  placeholder="John Doe" 
                  className="pl-10 h-11 bg-white rounded-xl border-gray-200 focus:ring-red-100" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('email') || 'Email'}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your@email.com" 
                  className="pl-10 h-11 bg-white rounded-xl border-gray-200 focus:ring-red-100" 
                  value={formData.email} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('password') || 'Password'}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 h-11 bg-white rounded-xl border-gray-200 focus:ring-red-100" 
                  value={formData.password} 
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                  required 
                  minLength={8}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">{t('accountType') || 'Account Type'}</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger className="h-11 bg-white rounded-xl border-gray-200 focus:ring-red-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={ROLES.REGISTERED}>{t('regularUserAccount') || 'Regular User Account'}</SelectItem>
                  <SelectItem value={ROLES.ADVERTISER}>{t('businessAccount') || 'Business Account (Post Ads, Deals)'}</SelectItem>
                </SelectContent>
              </Select>
              {formData.role === ROLES.ADVERTISER && (
                <p className="text-[11px] text-gray-500 mt-2 p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                  {t('businessAccountNote') || 'Note: Business accounts require admin approval to post content. You can browse as a regular user immediately.'}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-bold shadow-md shadow-red-600/20" 
              disabled={loading}
            >
              {loading ? (t('creatingAccount') || 'Creating account...') : (t('createAccount') || 'Create Account')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              {t('alreadyHaveAccount') || 'Already have an account?'}{' '}
              <button onClick={() => setCurrentView('login')} className="text-red-600 hover:underline font-medium">
                {t('loginHere') || 'Login here'}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default RegisterPage