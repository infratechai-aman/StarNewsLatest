'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { auth } from '@/lib/api'
import { Lock, Shield, CheckCircle, AlertCircle } from 'lucide-react'

const ForcePasswordChange = ({ user, setUser, setCurrentView, toast }) => {
    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})

    const validatePassword = (password) => {
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        }
        return checks
    }

    const passwordChecks = validatePassword(formData.newPassword)
    const isPasswordStrong = Object.values(passwordChecks).filter(Boolean).length >= 3

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrors({})

        // Validation
        if (!formData.oldPassword) {
            setErrors({ oldPassword: 'Current password is required' })
            return
        }

        if (!formData.newPassword) {
            setErrors({ newPassword: 'New password is required' })
            return
        }

        if (formData.newPassword.length < 8) {
            setErrors({ newPassword: 'Password must be at least 8 characters' })
            return
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setErrors({ confirmPassword: 'Passwords do not match' })
            return
        }

        if (formData.oldPassword === formData.newPassword) {
            setErrors({ newPassword: 'New password must be different from current password' })
            return
        }

        setLoading(true)

        try {
            const response = await auth.changePassword({
                oldPassword: formData.oldPassword,
                newPassword: formData.newPassword,
                confirmPassword: formData.confirmPassword
            })

            // fix(P1-AUTH-03): Backend no longer returns a custom token (P1-AUTH-02 fix).
            // The existing Firebase ID token in localStorage remains valid after
            // a password change. Simply update the user state with the fresh profile
            // returned in the response — no new token to store.
            setUser({ ...response.user, requirePasswordChange: false })

            toast({
                title: 'Password Changed Successfully',
                description: 'Your password has been updated. You can now access the dashboard.'
            })

            // Redirect to appropriate dashboard based on role
            if (user?.role === 'super_admin') {
                setCurrentView('admin-dashboard')
            } else if (user?.role === 'reporter') {
                setCurrentView('reporter-dashboard')
            } else {
                setCurrentView('home')
            }
        } catch (error) {
            toast({
                title: 'Password Change Failed',
                description: error.message || 'Please check your current password and try again.',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <Card className="w-full max-w-md shadow-xl border-0 bg-gradient-to-b from-white to-orange-50/30 rounded-2xl">
                <CardHeader className="space-y-1 text-center pb-6">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-2 shadow-sm">
                        <Shield className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Password Change Required</CardTitle>
                    <CardDescription>
                        For security purposes, you must change your password before continuing.
                        This is your first login.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="oldPassword">Current Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="oldPassword"
                                    type="password"
                                    placeholder="Enter your current password"
                                    className={`pl-10 h-11 bg-white rounded-xl border-gray-200 focus:ring-orange-100 ${errors.oldPassword ? 'border-red-500' : ''}`}
                                    value={formData.oldPassword}
                                    onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                                    required
                                />
                            </div>
                            {errors.oldPassword && (
                                <p className="text-sm text-red-500 flex items-center gap-1 font-medium">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.oldPassword}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="newPassword"
                                    type="password"
                                    placeholder="Enter your new password"
                                    className={`pl-10 h-11 bg-white rounded-xl border-gray-200 focus:ring-orange-100 ${errors.newPassword ? 'border-red-500' : ''}`}
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                    required
                                />
                            </div>
                            {errors.newPassword && (
                                <p className="text-sm text-red-500 flex items-center gap-1 font-medium">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.newPassword}
                                </p>
                            )}

                            {/* Password strength indicators */}
                            {formData.newPassword && (
                                <div className="mt-3 p-3 bg-white rounded-xl border border-gray-100 space-y-2 text-xs shadow-sm">
                                    <p className="font-bold text-gray-700">Password requirements (at least 3):</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className={`flex items-center gap-1.5 font-medium ${passwordChecks.length ? 'text-green-600' : 'text-gray-400'}`}>
                                            {passwordChecks.length ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                                            8+ characters
                                        </div>
                                        <div className={`flex items-center gap-1.5 font-medium ${passwordChecks.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                                            {passwordChecks.uppercase ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                                            Uppercase letter
                                        </div>
                                        <div className={`flex items-center gap-1.5 font-medium ${passwordChecks.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                                            {passwordChecks.lowercase ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                                            Lowercase letter
                                        </div>
                                        <div className={`flex items-center gap-1.5 font-medium ${passwordChecks.number ? 'text-green-600' : 'text-gray-400'}`}>
                                            {passwordChecks.number ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                                            Number
                                        </div>
                                        <div className={`flex items-center gap-1.5 font-medium ${passwordChecks.special ? 'text-green-600' : 'text-gray-400'}`}>
                                            {passwordChecks.special ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                                            Special character
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm your new password"
                                    className={`pl-10 h-11 bg-white rounded-xl border-gray-200 focus:ring-orange-100 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                />
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-sm text-red-500 flex items-center gap-1 font-medium">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.confirmPassword}
                                </p>
                            )}
                            {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
                                <p className="text-sm text-green-600 flex items-center gap-1 font-bold">
                                    <CheckCircle className="h-4 w-4" />
                                    Passwords match
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold shadow-md shadow-orange-500/20"
                            disabled={loading || !isPasswordStrong}
                        >
                            {loading ? 'Changing Password...' : 'Change Password & Continue'}
                        </Button>
                    </form>

                    <div className="mt-6 p-4 bg-orange-50/80 border border-orange-100 rounded-xl">
                        <p className="text-sm text-orange-800 font-medium">
                            <strong>Security Notice:</strong> You are required to change your password because this is your first login.
                            Choose a strong password that you haven't used before.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default ForcePasswordChange
