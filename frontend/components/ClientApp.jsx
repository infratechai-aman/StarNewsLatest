'use client'

import { useState, useEffect } from 'react'
import HomePage from '@/components/HomePage'
import NewsPage from '@/components/NewsPage'
import NewsDetailPage from '@/components/NewsDetailPage'
import BusinessesPage from '@/components/BusinessesPage'
import BusinessDetailPage from '@/components/BusinessDetailPage'
import DailyDealsPage from '@/components/DailyDealsPage'
import ClassifiedsPage from '@/components/ClassifiedsPage'
import ClassifiedDetailPage from '@/components/ClassifiedDetailPage'
import LiveTVPage from '@/components/LiveTVPage'
import EnewspaperPage from '@/components/EnewspaperPage'
import CityPage from '@/components/CityPage'
import AboutUsPage from '@/components/AboutUsPage'
import TermsConditionsPage from '@/components/TermsConditionsPage'
import PrivacyPolicyPage from '@/components/PrivacyPolicyPage'
import LoginPage from '@/components/LoginPage'
import RegisterPage from '@/components/RegisterPage'
import ReporterDashboard from '@/components/ReporterDashboard'
import AdminDashboard from '@/components/AdminDashboard'
import AdvertiserDashboard from '@/components/AdvertiserDashboard'
import ForcePasswordChange from '@/components/ForcePasswordChange'
import BreakingNewsTicker from '@/components/BreakingNewsTicker'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ErrorBoundary from '@/components/ErrorBoundary'
import ShortsPage from '@/components/ShortsPage'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { auth } from '@/lib/api'
import { auth as firebaseClientAuth } from '@/lib/firebase'
import { onIdTokenChanged, signOut } from 'firebase/auth'
import { useToast } from '@/hooks/use-toast'
import { ROLES } from '@/lib/roles'

// fix(P3-FE-02): ROLES imported from lib/auth.js — single source of truth.
// Removed the duplicate local definition that could drift from the backend.

const ClientApp = ({ initialNewsData }) => {
    const [user, setUser] = useState(null)

    // No longer blocking the whole app with loading! Only blocks if checking auth.
    // Actually, let's not block rendering for auth check. Default to null, update when fetched.
    const [loading, setLoading] = useState(true)
    const [currentView, setCurrentView] = useState('home')
    const [selectedArticle, setSelectedArticle] = useState(null)
    const [selectedBusiness, setSelectedBusiness] = useState(null)
    const [selectedClassified, setSelectedClassified] = useState(null)

    // Unified navigation function that changes view, scrolls to top, and updates URL
    const handleSetCurrentView = (view, extraState = {}) => {
        setCurrentView(view)
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'instant' })
            try {
                const url = view === 'home' ? '/' : `?view=${view}`
                window.history.pushState({ view, ...extraState }, '', url)
            } catch (err) {
                // Ignore history errors
            }
        }
    }

    // Scroll to top whenever view changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'instant' })
        }
    }, [currentView])

    // Detect view from URL on initial page load
    useEffect(() => {
        if (typeof window === 'undefined') return
        const params = new URLSearchParams(window.location.search)
        const viewParam = params.get('view')
        const path = window.location.pathname.replace(/^\//, '')
        const validViews = ['home', 'news', 'businesses', 'classifieds', 'live-tv', 'enewspaper', 'city', 'shorts', 'about', 'terms', 'privacy', 'login', 'register', 'daily-deals', 'reporter-dashboard', 'admin-dashboard', 'advertiser-dashboard']
        const aliasMap = {
            'livetv': 'live-tv',
            'business': 'businesses',
            'classified': 'classifieds',
            'epaper': 'enewspaper',
            'e-newspaper': 'enewspaper'
        }
        const resolvedView = viewParam || aliasMap[path] || (validViews.includes(path) ? path : null)
        if (resolvedView && validViews.includes(resolvedView)) {
            setCurrentView(resolvedView)
        }
    }, [])

    // Use the server-fetched data as our initial state
    const [newsData, setNewsData] = useState(initialNewsData || {
        mainNewsBoxes: [],
        trendingNews: [],
        businessNews: [],
        nationNews: [],
        entertainmentNews: [],
        crimeNews: [],
        sportsNews: [],
        educationNews: [],
        healthNews: [],
        technologyNews: [],
        oldNews: [],
        loaded: false
    })

    // Lifted state for News Page
    const [newsPageState, setNewsPageState] = useState({
        articles: [],
        categories: [],
        selectedCategory: 'all',
        loaded: false
    })

    const { toast } = useToast()

    useEffect(() => {
        checkAuth()
    }, [])

    // FIX-06: Auto-refresh Firebase token before it expires (1 hour)
    // onIdTokenChanged fires when the token is refreshed automatically by Firebase SDK
    useEffect(() => {
        if (!firebaseClientAuth) return
        const unsubscribe = onIdTokenChanged(firebaseClientAuth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const freshToken = await firebaseUser.getIdToken()
                    localStorage.setItem('token', freshToken)
                } catch (err) {
                    console.error('Token refresh failed:', err)
                }
            }
        })
        return () => unsubscribe()
    }, [])

    // Handle browser back/forward button
    useEffect(() => {
        const handlePopState = (event) => {
            const params = new URLSearchParams(window.location.search)
            const viewFromUrl = params.get('view')
            const targetView = event.state?.view || viewFromUrl || 'home'
            setCurrentView(targetView)
            if (event.state?.article) {
                setSelectedArticle(event.state.article)
            } else {
                setSelectedArticle(null)
            }
            window.scrollTo({ top: 0, behavior: 'instant' })
        }

        window.addEventListener('popstate', handlePopState)
        return () => window.removeEventListener('popstate', handlePopState)
    }, [])

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('token')
            if (token) {
                const userData = await auth.getMe()
                setUser(userData)
            }
        } catch (error) {
            // fix(P2-FE-03): Notify user on session expiry instead of silently logging them out
            const hadToken = !!localStorage.getItem('token')
            localStorage.removeItem('token')
            if (hadToken) {
                // Small delay so toast system is mounted
                setTimeout(() => {
                    toast({
                        title: 'Session Expired',
                        description: 'Your session has expired. Please log in again.',
                        variant: 'destructive'
                    })
                }, 500)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        // Clear all auth-related localStorage keys
        localStorage.removeItem('token')
        localStorage.removeItem('reporterUser')
        // Sign out from Firebase Auth to stop token refresh
        try {
            if (firebaseClientAuth) await signOut(firebaseClientAuth)
        } catch (err) {
            // Ignore signout errors
        }
        setUser(null)
        setCurrentView('home')
        toast({ title: 'Logged out successfully' })
    }

    // Dashboard views should render without main site chrome
    const isDashboardView = ['admin-dashboard', 'reporter-dashboard', 'advertiser-dashboard'].includes(currentView)

    if (isDashboardView) {
        // If we're navigating to a dashboard, strictly wait for auth to finish loading
        if (loading) return (
            <LanguageProvider>
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="animate-pulse flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-red-100 rounded-2xl" />
                        <div className="w-32 h-4 bg-gray-200 rounded" />
                    </div>
                </div>
            </LanguageProvider>
        );

        // SECURITY: Redirect unauthorized users to login instead of showing empty page
        const isAuthorized = (
            (currentView === 'reporter-dashboard' && user?.role === ROLES.REPORTER) ||
            (currentView === 'admin-dashboard' && user?.role === ROLES.SUPER_ADMIN) ||
            (currentView === 'advertiser-dashboard' && user?.role === ROLES.ADVERTISER)
        );
        if (!isAuthorized) {
            return (
                <LanguageProvider>
                    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
                            <p className="text-gray-600 mb-4">You don't have permission to access this dashboard.</p>
                            <button
                                onClick={() => setCurrentView('login')}
                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Go to Login
                            </button>
                        </div>
                    </div>
                </LanguageProvider>
            );
        }

        return (
            <LanguageProvider>
                <ErrorBoundary fallbackTitle="Dashboard Error" fallbackMessage="The dashboard encountered an error. Please refresh the page.">
                    <div className="min-h-screen bg-background">
                        {currentView === 'reporter-dashboard' && <ReporterDashboard user={user} toast={toast} onLogout={handleLogout} />}
                        {currentView === 'admin-dashboard' && <AdminDashboard user={user} toast={toast} onLogout={handleLogout} />}
                        {currentView === 'advertiser-dashboard' && <AdvertiserDashboard user={user} toast={toast} onLogout={handleLogout} />}
                    </div>
                </ErrorBoundary>
            </LanguageProvider>
        )
    }

    return (
        <LanguageProvider>
            <div className="min-h-screen bg-background w-full max-w-full overflow-x-hidden">
                <Header
                    user={user}
                    currentView={currentView}
                    setCurrentView={handleSetCurrentView}
                    handleLogout={handleLogout}
                    setSelectedArticle={setSelectedArticle}
                />

                <BreakingNewsTicker />

                <ErrorBoundary fallbackMessage="This section failed to load. Please try refreshing.">
                <main className={['home', 'live-tv', 'news', 'news-detail', 'classifieds', 'classified-detail', 'city', 'enewspaper', 'businesses', 'business-detail', 'shorts', 'daily-deals'].includes(currentView) ? "w-full min-w-0 overflow-x-hidden" : "container py-6 min-w-0"}>
                    {currentView === 'home' && <HomePage setCurrentView={handleSetCurrentView} setSelectedArticle={setSelectedArticle} newsData={newsData} setNewsData={setNewsData} />}
                    {currentView === 'news' && <NewsPage setSelectedArticle={setSelectedArticle} setCurrentView={handleSetCurrentView} newsPageState={newsPageState} setNewsPageState={setNewsPageState} />}
                    {currentView === 'news-detail' && selectedArticle && <NewsDetailPage article={selectedArticle} setCurrentView={handleSetCurrentView} setSelectedArticle={setSelectedArticle} />}
                    {currentView === 'businesses' && <BusinessesPage setSelectedBusiness={setSelectedBusiness} setCurrentView={handleSetCurrentView} />}
                    {currentView === 'business-detail' && selectedBusiness && <BusinessDetailPage business={selectedBusiness} setCurrentView={handleSetCurrentView} user={user} toast={toast} />}
                    {currentView === 'daily-deals' && <DailyDealsPage />}
                    {currentView === 'classifieds' && <ClassifiedsPage user={user} toast={toast} setSelectedClassified={setSelectedClassified} setCurrentView={handleSetCurrentView} />}
                    {currentView === 'classified-detail' && selectedClassified && <ClassifiedDetailPage classified={selectedClassified} setCurrentView={handleSetCurrentView} />}
                    {currentView === 'live-tv' && <LiveTVPage setCurrentView={handleSetCurrentView} />}
                    {currentView === 'enewspaper' && <EnewspaperPage />}
                    {currentView === 'city' && <CityPage setCurrentView={handleSetCurrentView} setSelectedArticle={setSelectedArticle} />}
                    {currentView === 'shorts' && <ShortsPage setCurrentView={handleSetCurrentView} />}
                    {currentView === 'about' && <AboutUsPage />}
                    {currentView === 'terms' && <TermsConditionsPage />}
                    {currentView === 'privacy' && <PrivacyPolicyPage />}
                    {currentView === 'login' && <LoginPage setUser={setUser} setCurrentView={handleSetCurrentView} toast={toast} />}
                    {currentView === 'register' && <RegisterPage setUser={setUser} setCurrentView={handleSetCurrentView} toast={toast} />}
                    {currentView === 'force-password-change' && user?.requirePasswordChange && <ForcePasswordChange user={user} setUser={setUser} setCurrentView={handleSetCurrentView} toast={toast} />}
                </main>
                </ErrorBoundary>

                <Footer setCurrentView={handleSetCurrentView} />
            </div>
        </LanguageProvider>
    )
}

export default ClientApp
