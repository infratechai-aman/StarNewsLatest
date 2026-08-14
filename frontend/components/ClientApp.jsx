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
import { LanguageProvider } from '@/contexts/LanguageContext'
import { auth } from '@/lib/api'
import { auth as firebaseClientAuth } from '@/lib/firebase'
import { onIdTokenChanged, signOut } from 'firebase/auth'
import { useToast } from '@/hooks/use-toast'

const ROLES = {
    PUBLIC: 'public',
    REGISTERED: 'registered',
    ADVERTISER: 'advertiser',
    REPORTER: 'reporter',
    SUPER_ADMIN: 'super_admin'
}

const ClientApp = ({ initialNewsData }) => {
    const [user, setUser] = useState(null)

    // No longer blocking the whole app with loading! Only blocks if checking auth.
    // Actually, let's not block rendering for auth check. Default to null, update when fetched.
    const [loading, setLoading] = useState(true)
    const [currentView, setCurrentView] = useState('home')
    const [selectedArticle, setSelectedArticle] = useState(null)
    const [selectedBusiness, setSelectedBusiness] = useState(null)
    const [selectedClassified, setSelectedClassified] = useState(null)

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
            if (event.state?.view) {
                setCurrentView(event.state.view)
                if (event.state.article) {
                    setSelectedArticle(event.state.article)
                } else {
                    setSelectedArticle(null)
                }
            } else {
                // No state means we're going back to initial page (home)
                setCurrentView('home')
                setSelectedArticle(null)
                setSelectedBusiness(null)
                setSelectedClassified(null)
            }
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
            localStorage.removeItem('token')
        } finally {
            // We are done checking auth
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
                        {currentView === 'reporter-dashboard' && <ReporterDashboard user={user} toast={toast} />}
                        {currentView === 'admin-dashboard' && <AdminDashboard user={user} toast={toast} />}
                        {currentView === 'advertiser-dashboard' && <AdvertiserDashboard user={user} toast={toast} />}
                    </div>
                </ErrorBoundary>
            </LanguageProvider>
        )
    }

    return (
        <LanguageProvider>
            <div className="min-h-screen bg-background">
                <Header
                    user={user}
                    currentView={currentView}
                    setCurrentView={setCurrentView}
                    handleLogout={handleLogout}
                />

                <BreakingNewsTicker />

                <ErrorBoundary fallbackMessage="This section failed to load. Please try refreshing.">
                <main className={['home', 'live-tv', 'news', 'classifieds', 'city', 'enewspaper'].includes(currentView) ? "w-full pb-6" : "container py-6"}>
                    {currentView === 'home' && <HomePage setCurrentView={setCurrentView} setSelectedArticle={setSelectedArticle} newsData={newsData} setNewsData={setNewsData} />}
                    {currentView === 'news' && <NewsPage setSelectedArticle={setSelectedArticle} setCurrentView={setCurrentView} newsPageState={newsPageState} setNewsPageState={setNewsPageState} />}
                    {currentView === 'news-detail' && selectedArticle && <NewsDetailPage article={selectedArticle} setCurrentView={setCurrentView} setSelectedArticle={setSelectedArticle} />}
                    {currentView === 'businesses' && <BusinessesPage setSelectedBusiness={setSelectedBusiness} setCurrentView={setCurrentView} />}
                    {currentView === 'business-detail' && selectedBusiness && <BusinessDetailPage business={selectedBusiness} setCurrentView={setCurrentView} user={user} toast={toast} />}
                    {currentView === 'daily-deals' && <DailyDealsPage />}
                    {currentView === 'classifieds' && <ClassifiedsPage user={user} toast={toast} setSelectedClassified={setSelectedClassified} setCurrentView={setCurrentView} />}
                    {currentView === 'classified-detail' && selectedClassified && <ClassifiedDetailPage classified={selectedClassified} setCurrentView={setCurrentView} />}
                    {currentView === 'live-tv' && <LiveTVPage setCurrentView={setCurrentView} />}
                    {currentView === 'enewspaper' && <EnewspaperPage />}
                    {currentView === 'city' && <CityPage setCurrentView={setCurrentView} setSelectedArticle={setSelectedArticle} />}
                    {currentView === 'about' && <AboutUsPage />}
                    {currentView === 'terms' && <TermsConditionsPage />}
                    {currentView === 'privacy' && <PrivacyPolicyPage />}
                    {currentView === 'login' && <LoginPage setUser={setUser} setCurrentView={setCurrentView} toast={toast} />}
                    {currentView === 'register' && <RegisterPage setUser={setUser} setCurrentView={setCurrentView} toast={toast} />}
                    {currentView === 'force-password-change' && user?.requirePasswordChange && <ForcePasswordChange user={user} setUser={setUser} setCurrentView={setCurrentView} toast={toast} />}
                </main>
                </ErrorBoundary>

                <Footer setCurrentView={setCurrentView} />
            </div>
        </LanguageProvider>
    )
}

export default ClientApp
