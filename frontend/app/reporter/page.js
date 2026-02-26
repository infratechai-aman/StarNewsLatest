'use client'

import { useState, useEffect } from 'react'
import ReporterDashboard from '@/components/ReporterDashboard'

import { auth } from '@/lib/api'

export default function ReporterPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [loginData, setLoginData] = useState({ email: '', password: '' })

    useEffect(() => {
        // Migration: purge old invalid 'reporterToken' from previous sessions
        const legacyToken = localStorage.getItem('reporterToken')
        if (legacyToken) {
            localStorage.removeItem('reporterToken')
            // Don't trust the old token — force re-login
        }

        const token = localStorage.getItem('token')
        const savedUser = localStorage.getItem('reporterUser')

        // Basic JWT validation: a valid Firebase ID token has 3 dot-separated parts
        const isValidJWT = token && token.split('.').length === 3

        if (isValidJWT && savedUser) {
            try {
                setUser(JSON.parse(savedUser))
                setIsLoggedIn(true)
            } catch (e) {
                // Corrupted user data, force re-login
                localStorage.removeItem('token')
                localStorage.removeItem('reporterUser')
            }
        } else if (token && !isValidJWT) {
            // Token is malformed, clear it
            localStorage.removeItem('token')
            localStorage.removeItem('reporterUser')
        }

        setLoading(false)
    }, [])

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const response = await auth.login({
                email: loginData.email,
                password: loginData.password
            })

            if (response.user.role !== 'reporter' && response.user.role !== 'super_admin') {
                setError('Access denied. Reporter credentials required.')
                setLoading(false)
                return
            }

            // Standardize on the 'token' key used by the rest of the app
            localStorage.setItem('token', response.token)
            localStorage.setItem('reporterUser', JSON.stringify(response.user))

            setUser(response.user)
            setIsLoggedIn(true)
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.')
        }
        setLoading(false)
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('reporterUser')
        setUser(null)
        setIsLoggedIn(false)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
        )
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="text-4xl mb-4">📰</div>
                        <h1 className="text-2xl font-bold text-gray-900">Reporter Panel</h1>
                        <p className="text-gray-500 mt-2">StarNews Reporter Login</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={loginData.email}
                                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="aman@reporterStarNews"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                value={loginData.password}
                                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Logging in...' : 'Login to Reporter Panel'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        <p>Only authorized reporters can access this panel.</p>
                    </div>
                </div>
            </div>
        )
    }

    return <ReporterDashboard user={user} onLogout={handleLogout} />
}
