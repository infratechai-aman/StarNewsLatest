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
import { LanguageProvider } from '@/contexts/LanguageContext'
import { auth } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

const ROLES = {
  PUBLIC: 'public',
  REGISTERED: 'registered',
  ADVERTISER: 'advertiser',
  REPORTER: 'reporter',
  SUPER_ADMIN: 'super_admin'
}

const App = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState('home')
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [selectedClassified, setSelectedClassified] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    checkAuth()
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
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setCurrentView('home')
    toast({ title: 'Logged out successfully' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading StarNews...</p>
        </div>
      </div>
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

        <main className="container py-6">
          {currentView === 'home' && <HomePage setCurrentView={setCurrentView} setSelectedArticle={setSelectedArticle} />}
          {currentView === 'news' && <NewsPage setSelectedArticle={setSelectedArticle} setCurrentView={setCurrentView} />}
          {currentView === 'news-detail' && selectedArticle && <NewsDetailPage article={selectedArticle} setCurrentView={setCurrentView} setSelectedArticle={setSelectedArticle} />}
          {currentView === 'businesses' && <BusinessesPage setSelectedBusiness={setSelectedBusiness} setCurrentView={setCurrentView} />}
          {currentView === 'business-detail' && selectedBusiness && <BusinessDetailPage business={selectedBusiness} setCurrentView={setCurrentView} user={user} toast={toast} />}
          {currentView === 'daily-deals' && <DailyDealsPage />}
          {currentView === 'classifieds' && <ClassifiedsPage user={user} toast={toast} setSelectedClassified={setSelectedClassified} setCurrentView={setCurrentView} />}
          {currentView === 'classified-detail' && selectedClassified && <ClassifiedDetailPage classified={selectedClassified} setCurrentView={setCurrentView} />}
          {currentView === 'live-tv' && <LiveTVPage />}
          {currentView === 'enewspaper' && <EnewspaperPage />}
          {currentView === 'city' && <CityPage setCurrentView={setCurrentView} setSelectedArticle={setSelectedArticle} />}
          {currentView === 'about' && <AboutUsPage />}
          {currentView === 'terms' && <TermsConditionsPage />}
          {currentView === 'privacy' && <PrivacyPolicyPage />}
          {currentView === 'login' && <LoginPage setUser={setUser} setCurrentView={setCurrentView} toast={toast} />}
          {currentView === 'register' && <RegisterPage setUser={setUser} setCurrentView={setCurrentView} toast={toast} />}
          {currentView === 'force-password-change' && user?.requirePasswordChange && <ForcePasswordChange user={user} setUser={setUser} setCurrentView={setCurrentView} toast={toast} />}
          {currentView === 'reporter-dashboard' && user?.role === ROLES.REPORTER && <ReporterDashboard user={user} toast={toast} />}
          {currentView === 'admin-dashboard' && user?.role === ROLES.SUPER_ADMIN && <AdminDashboard user={user} toast={toast} />}
          {currentView === 'advertiser-dashboard' && user?.role === ROLES.ADVERTISER && <AdvertiserDashboard user={user} toast={toast} />}
        </main>

        <Footer setCurrentView={setCurrentView} />
      </div>
    </LanguageProvider>
  )
}

export default App
