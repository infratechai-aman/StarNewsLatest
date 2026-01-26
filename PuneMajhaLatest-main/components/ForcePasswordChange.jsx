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

            // Update token and user
            localStorage.setItem('token', response.token)
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
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="flex items-center gap-2 text-orange-600">
                        <Shield className="h-6 w-6" />
                        <CardTitle className="text-2xl">Password Change Required</CardTitle>
                    </div>
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
                                    className={`pl-10 ${errors.oldPassword ? 'border-red-500' : ''}`}
                                    value={formData.oldPassword}
                                    onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                                    required
                                />
                            </div>
                            {errors.oldPassword && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
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
                                    className={`pl-10 ${errors.newPassword ? 'border-red-500' : ''}`}
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                    required
                                />
                            </div>
                            {errors.newPassword && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.newPassword}
                                </p>
                            )}

                            {/* Password strength indicators */}
                            {formData.newPassword && (
                                <div className="mt-2 space-y-1 text-xs">
                                    <p className="font-medium text-muted-foreground">Password requirements (at least 3):</p>
                                    <div className="grid grid-cols-2 gap-1">
                                        <div className={`flex items-center gap-1 ${passwordChecks.length ? 'text-green-600' : 'text-muted-foreground'}`}>
                                            {passwordChecks.length ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                            8+ characters
                                        </div>
                                        <div className={`flex items-center gap-1 ${passwordChecks.uppercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                                            {passwordChecks.uppercase ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                            Uppercase letter
                                        </div>
                                        <div className={`flex items-center gap-1 ${passwordChecks.lowercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                                            {passwordChecks.lowercase ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                            Lowercase letter
                                        </div>
                                        <div className={`flex items-center gap-1 ${passwordChecks.number ? 'text-green-600' : 'text-muted-foreground'}`}>
                                            {passwordChecks.number ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                            Number
                                        </div>
                                        <div className={`flex items-center gap-1 ${passwordChecks.special ? 'text-green-600' : 'text-muted-foreground'}`}>
                                            {passwordChecks.special ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
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
                                    className={`pl-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                />
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.confirmPassword}
                                </p>
                            )}
                            {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
                                <p className="text-sm text-green-600 flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Passwords match
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading || !isPasswordStrong}
                        >
                            {loading ? 'Changing Password...' : 'Change Password & Continue'}
                        </Button>
                    </form>

                    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-sm text-orange-800">
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
