'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Eye, EyeOff, Loader2, LogOut } from 'lucide-react'
import { auth, getFreshToken } from '@/lib/api'
import AdminDashboard from '@/components/AdminDashboard'
import { useToast } from '@/hooks/use-toast'

import { auth as firebaseClientAuth } from '@/lib/firebase'
import { onIdTokenChanged } from 'firebase/auth'

export default function AdminLoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [user, setUser] = useState(null)
    const { toast } = useToast()

    // Setup Firebase token refresh listener and periodic refresher
    useEffect(() => {
        if (!firebaseClientAuth) return
        const unsubscribe = onIdTokenChanged(firebaseClientAuth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const freshToken = await firebaseUser.getIdToken()
                    localStorage.setItem('token', freshToken)
                } catch (err) {
                    console.error('Admin token refresh failed:', err)
                }
            }
        })

        // Periodically refresh token (every 30 minutes) to prevent expiration during admin sessions
        const refreshInterval = setInterval(async () => {
            if (firebaseClientAuth.currentUser) {
                try {
                    const freshToken = await firebaseClientAuth.currentUser.getIdToken(true)
                    if (freshToken) localStorage.setItem('token', freshToken)
                } catch (err) {
                    console.warn('Periodic admin token refresh failed:', err)
                }
            }
        }, 30 * 60 * 1000)

        // Refresh token when tab regains focus
        const handleFocus = async () => {
            if (firebaseClientAuth.currentUser) {
                try {
                    const freshToken = await firebaseClientAuth.currentUser.getIdToken()
                    if (freshToken) localStorage.setItem('token', freshToken)
                } catch (err) {
                    console.warn('Focus token refresh failed:', err)
                }
            }
        }
        window.addEventListener('focus', handleFocus)

        return () => {
            unsubscribe()
            clearInterval(refreshInterval)
            window.removeEventListener('focus', handleFocus)
        }
    }, [])

    useEffect(() => {
        // Check if already logged in
        const checkAuth = async () => {
            try {
                if (firebaseClientAuth && typeof firebaseClientAuth.authStateReady === 'function') {
                    await firebaseClientAuth.authStateReady()
                }
                const token = await getFreshToken()
                if (token) {
                    const userData = await auth.getMe()
                    if (userData.role === 'super_admin') {
                        setIsAuthenticated(true)
                        setUser(userData)
                    }
                }
            } catch (error) {
                console.warn('checkAuth error:', error)
                if (!firebaseClientAuth?.currentUser) {
                    localStorage.removeItem('token')
                }
            }
        }
        checkAuth()
    }, [])

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const response = await auth.login({ email, password })

            if (response.user.role !== 'super_admin') {
                setError('Access denied. Admin credentials required.')
                localStorage.removeItem('token')
                setLoading(false)
                return
            }

            // Store the token to localStorage so API calls can use it
            localStorage.setItem('token', response.token)

            setUser(response.user)
            setIsAuthenticated(true)
            toast({ title: 'Login Successful', description: 'Welcome to Admin Dashboard!' })

        } catch (err) {
            setError(err.message || 'Invalid credentials. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        setUser(null)
        setIsAuthenticated(false)
        toast({ title: 'Logged Out', description: 'You have been logged out successfully.' })
    }

    // Show Admin Dashboard if authenticated
    if (isAuthenticated && user) {
        return (
            <div className="h-screen w-full bg-gray-50 overflow-hidden">
                <AdminDashboard user={user} toast={toast} onLogout={handleLogout} />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-gray-700 bg-gray-800/50 backdrop-blur">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4">
                        <img src="/starnews-logo.png" alt="Star News Logo" className="mx-auto mb-2 object-contain pointer-events-none h-[70px] w-auto" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">StarNews Admin</CardTitle>
                    <CardDescription className="text-gray-400">
                        Secure admin access only
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-300">Email / Username</Label>
                            <Input
                                id="email"
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter admin email"
                                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-300">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-5"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Admin Login
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500">
                            This is a restricted area. Unauthorized access is prohibited.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
