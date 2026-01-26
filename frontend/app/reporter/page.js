'use client'

import { useState, useEffect } from 'react'
import ReporterDashboard from '@/components/ReporterDashboard'

export default function ReporterPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [loginData, setLoginData] = useState({ email: '', password: '' })

    useEffect(() => {
        const token = localStorage.getItem('reporterToken')
        const savedUser = localStorage.getItem('reporterUser')
        if (token && savedUser) {
            setUser(JSON.parse(savedUser))
            setIsLoggedIn(true)
        }
        setLoading(false)
    }, [])

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData)
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error || 'Login failed')
                setLoading(false)
                return
            }
            if (data.user.role !== 'reporter') {
                setError('Access denied. Reporter credentials required.')
                setLoading(false)
                return
            }
            localStorage.setItem('reporterToken', data.token)
            localStorage.setItem('reporterUser', JSON.stringify(data.user))
            setUser(data.user)
            setIsLoggedIn(true)
        } catch (err) {
            setError('Network error. Please try again.')
        }
        setLoading(false)
    }

    const handleLogout = () => {
        localStorage.removeItem('reporterToken')
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
