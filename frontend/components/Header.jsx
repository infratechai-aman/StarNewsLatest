'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Menu, X, Home, Newspaper, Building2, FileText, Tag, Shield, LogOut, Search, ChevronDown, Briefcase, UserPlus, Globe, MapPin, Zap } from 'lucide-react'
import Image from 'next/image'
import VideoLogo from '@/components/VideoLogo'
import { useLanguage } from '@/contexts/LanguageContext'

const ROLES = { REPORTER: 'reporter', SUPER_ADMIN: 'super_admin', ADVERTISER: 'advertiser' }

// Social Media Icons
const FacebookIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
)

const WhatsAppIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
)

const InstagramIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
)

const YouTubeIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
)

const TwitterIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
)

// Star News Social Media Links
const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/share/1Fd1BR94tW/',
  whatsapp: 'https://wa.me/917020873300',
  instagram: 'https://www.instagram.com/star_news__india?igsh=YWE2Z2FkeGV6cXA3',
  youtube: 'https://youtube.com/@starnewsindialive?si=RT7VECpD5H4HiyP2',
  twitter: ''
}

const Header = ({ user, currentView, setCurrentView, handleLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [allNewsOpen, setAllNewsOpen] = useState(false)
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false)

  const [businessForm, setBusinessForm] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    description: ''
  })
  const [submittingBusiness, setSubmittingBusiness] = useState(false)

  const [reporterForm, setReporterForm] = useState({
    name: '',
    phone: '',
    email: '',
    experience: '',
    portfolio: '',
    message: ''
  })

  // Use language context
  const { language, changeLanguage, t, languageOptions } = useLanguage()

  const handleCategoryClick = (category) => {
    setCurrentView('news')
    localStorage.setItem('selectedCategory', category)
    window.dispatchEvent(new Event('categoryChange'))
    setAllNewsOpen(false)
  }

  const handleBusinessSubmit = async (e) => {
    e.preventDefault()
    setSubmittingBusiness(true)
    try {
      const res = await fetch('/api/business-promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessForm)
      })
      const data = await res.json()
      if (res.ok) {
        alert(`Thank you! Your business "${businessForm.businessName}" has been submitted for review. Our team will contact you soon.`)
        setPromoteDialogOpen(false)
        setBusinessForm({ businessName: '', ownerName: '', phone: '', email: '', address: '', description: '' })
      } else {
        alert(data.error || 'Failed to submit request. Please try again.')
      }
    } catch (err) {
      console.error('Business promotion error:', err)
      alert('Something went wrong. Please try again later.')
    } finally {
      setSubmittingBusiness(false)
    }
  }

  const [reporterDialogOpen, setReporterDialogOpen] = useState(false)
  const [submittingReporter, setSubmittingReporter] = useState(false)

  const handleReporterSubmit = async (e) => {
    e.preventDefault()
    if (!reporterForm.name || !reporterForm.phone || !reporterForm.email) {
      alert('Please fill in all required fields.')
      return
    }
    setSubmittingReporter(true)
    try {
      const res = await fetch('/api/reporter-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: reporterForm.name,
          phone: reporterForm.phone,
          email: reporterForm.email,
          experience: reporterForm.experience,
          portfolio: reporterForm.portfolio,
          reason: reporterForm.message
        })
      })
      const data = await res.json()
      if (res.ok) {
        alert('Thank you! Your request has been sent. Our team will contact you soon.')
        setReporterDialogOpen(false)
        setReporterForm({ name: '', phone: '', email: '', experience: '', portfolio: '', message: '' })
      } else {
        alert(data.error || 'Failed to submit application. Please try again.')
      }
    } catch (err) {
      console.error('Reporter application error:', err)
      alert('Something went wrong. Please try again later.')
    } finally {
      setSubmittingReporter(false)
    }
  }

  return (
    <>
      {/* --- ULTRA PREMIUM DESKTOP HEADER --- */}
      <div className="hidden lg:block relative">
        {/* Thin red accent line at the very top */}
        <div className="h-[3px] bg-gradient-to-r from-[#E53935] via-[#FF5252] to-[#E53935]" />

        {/* Clean top banner with subtle gradient */}
        <div style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)' }}>
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between py-3">
              {/* LEFT: Logo + Date */}
              <div className="flex items-center gap-5">
                <div className="flex items-center cursor-pointer group" onClick={() => setCurrentView('home')}>
                  <div className="flex-shrink-0 h-[72px] w-[200px] rounded-lg p-0 group cursor-pointer relative overflow-hidden flex items-center justify-center">
                    <VideoLogo className="h-full w-full scale-[1.75] transition-transform duration-300 group-hover:scale-[1.85]" />
                  </div>
                </div>
                {/* Date display */}
                <div className="hidden xl:flex flex-col pl-5 border-l border-gray-200">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                  </span>
                  <span className="text-[13px] font-bold text-gray-700 tracking-tight">
                    {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* RIGHT: Social Media & Profile — clean & refined */}
              <div className="flex items-center gap-5">
                {/* Social icons in a subtle pill container */}
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5">
                  <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-[#1877F2] transition-all duration-200"><FacebookIcon /></a>
                  <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-[#25D366] transition-all duration-200"><WhatsAppIcon /></a>
                  <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-[#E4405F] transition-all duration-200"><InstagramIcon /></a>
                  <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-[#FF0000] transition-all duration-200"><YouTubeIcon /></a>
                </div>

                <div className="w-px h-8 bg-gray-200" />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="font-semibold tracking-tight text-gray-600 hover:bg-gray-50 rounded-full px-3">
                      <Globe className="h-4 w-4 mr-1.5 text-gray-400" />
                      {languageOptions.find(l => l.code === language)?.label || 'EN'}
                      <ChevronDown className="h-3 w-3 ml-1 opacity-40" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-gray-100">
                    {languageOptions.map((lang) => (
                      <DropdownMenuItem
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`flex items-center justify-between rounded-lg ${language === lang.code ? 'bg-red-50 font-bold text-red-600' : ''}`}
                      >
                        <span>{lang.fullName}</span>
                        {language === lang.code && <div className="w-1.5 h-1.5 rounded-full bg-red-600" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {user && (
                  <>
                    <div className="w-px h-8 bg-gray-200" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                          <Avatar className="h-9 w-9 ring-2 ring-gray-100"><AvatarImage src={user.profileImage} /><AvatarFallback className="bg-red-600 text-white text-xs font-bold">{user.name?.[0]}</AvatarFallback></Avatar>
                          <span className="text-sm font-semibold text-gray-700">{user.name}</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-gray-100">
                        <DropdownMenuLabel className="flex flex-col">
                          <span className="text-sm font-bold">{user.name}</span>
                          <span className="text-xs text-gray-500">{user.email}</span>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {user.role === ROLES.REPORTER && <DropdownMenuItem onClick={() => setCurrentView('reporter-dashboard')} className="rounded-lg"><Newspaper className="mr-2 h-4 w-4" />{t('reporterDashboard')}</DropdownMenuItem>}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 rounded-lg"><LogOut className="mr-2 h-4 w-4" />{t('logout')}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            </div>
          </div>
          {/* Bottom border separator before nav */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>
      </div>

      <header className="hidden lg:block bg-[#E53935] sticky top-0 z-50">
        <div className="container mx-auto px-6">
          <nav className="flex items-center justify-between h-12">
            {/* Left: Navigation Links with subtle dividers */}
            <div className="flex items-center h-full">
              <button
                onClick={() => setCurrentView('home')}
                className={`relative text-[13px] font-semibold tracking-wide px-4 h-full flex items-center text-white/95 hover:text-white transition-all duration-200 ${currentView === 'home' ? 'after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:bg-white after:rounded-full' : 'hover:after:absolute hover:after:bottom-0 hover:after:left-2 hover:after:right-2 hover:after:h-[2px] hover:after:bg-white/40 hover:after:rounded-full'}`}
              >
                {t('home')}
              </button>
              <div className="w-px h-4 bg-white/20" />
              <DropdownMenu open={allNewsOpen} onOpenChange={setAllNewsOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`relative text-[13px] font-semibold tracking-wide px-4 h-full flex items-center gap-1 text-white/95 hover:text-white transition-all duration-200 ${currentView === 'news' ? 'after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:bg-white after:rounded-full' : ''}`}
                  >
                    {t('news')}<ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 rounded-xl shadow-xl border-gray-100 mt-1">
                  <DropdownMenuItem onClick={() => { setCurrentView('news'); localStorage.removeItem('selectedCategory'); setAllNewsOpen(false) }} className="rounded-lg">{t('allNews')}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleCategoryClick('crime')} className="rounded-lg">{t('crime')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCategoryClick('politics')} className="rounded-lg">{t('politics')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCategoryClick('education')} className="rounded-lg">{t('education')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCategoryClick('sports')} className="rounded-lg">{t('sports')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCategoryClick('entertainment')} className="rounded-lg">{t('entertainment')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCategoryClick('trending')} className="rounded-lg">{t('trending')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="w-px h-4 bg-white/20" />
              <button
                onClick={() => setCurrentView('enewspaper')}
                className={`relative text-[13px] font-semibold tracking-wide px-4 h-full flex items-center text-white/95 hover:text-white transition-all duration-200 ${currentView === 'enewspaper' ? 'after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:bg-white after:rounded-full' : ''}`}
              >
                {t('eNewspaper')}
              </button>
              <div className="w-px h-4 bg-white/20" />
              <button
                onClick={() => setCurrentView('city')}
                className={`relative text-[13px] font-semibold tracking-wide px-4 h-full flex items-center text-white/95 hover:text-white transition-all duration-200 ${currentView === 'city' ? 'after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:bg-white after:rounded-full' : ''}`}
              >
                {t('cityNews')}
              </button>
              <div className="w-px h-4 bg-white/20" />
              <button
                onClick={() => setCurrentView('classifieds')}
                className={`relative text-[13px] font-semibold tracking-wide px-4 h-full flex items-center text-white/95 hover:text-white transition-all duration-200 ${currentView === 'classifieds' ? 'after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:bg-white after:rounded-full' : ''}`}
              >
                {t('classified')}
              </button>
              <div className="w-px h-4 bg-white/20" />
              <button
                onClick={() => setCurrentView('businesses')}
                className={`relative text-[13px] font-semibold tracking-wide px-4 h-full flex items-center text-white/95 hover:text-white transition-all duration-200 ${currentView === 'businesses' ? 'after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:bg-white after:rounded-full' : ''}`}
              >
                {t('businessDirectory')}
              </button>
              <div className="w-px h-4 bg-white/20" />
              <button
                onClick={() => { window.history.pushState({ view: 'live-tv' }, '', '?view=live-tv'); setCurrentView('live-tv') }}
                className={`relative text-[13px] font-semibold tracking-wide px-4 h-full flex items-center gap-2 text-white/95 hover:text-white transition-all duration-200 ${currentView === 'live-tv' ? 'after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:bg-white after:rounded-full' : ''}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Live TV
              </button>
            </div>

            {/* Right: Action Buttons — clean white pills */}
            <div className="flex items-center gap-2">
              <Dialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-1.5 bg-white/95 hover:bg-white text-[#E53935] font-bold text-[12px] px-3.5 py-1.5 rounded-full shadow-sm transition-all duration-200 hover:shadow-md">
                    <Briefcase className="h-3.5 w-3.5" />{t('promoteYourBusiness')}
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">{t('promoteYourBusiness')}</DialogTitle>
                    <DialogDescription>Fill out this form to promote your business. We'll contact you within 24 hours.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleBusinessSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2"><Label htmlFor="businessName">Business Name *</Label><Input id="businessName" value={businessForm.businessName} onChange={(e) => setBusinessForm({ ...businessForm, businessName: e.target.value })} placeholder="Enter business name" required /></div>
                      <div className="grid gap-2"><Label htmlFor="ownerName">Owner Name *</Label><Input id="ownerName" value={businessForm.ownerName} onChange={(e) => setBusinessForm({ ...businessForm, ownerName: e.target.value })} placeholder="Enter owner name" required /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2"><Label htmlFor="phone">Phone *</Label><Input id="phone" type="tel" value={businessForm.phone} onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })} placeholder="+91 XXXXX" required /></div>
                        <div className="grid gap-2"><Label htmlFor="email">Email *</Label><Input id="email" type="email" value={businessForm.email} onChange={(e) => setBusinessForm({ ...businessForm, email: e.target.value })} placeholder="email@example.com" required /></div>
                      </div>
                      <div className="grid gap-2"><Label htmlFor="address">Address *</Label><Input id="address" value={businessForm.address} onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })} placeholder="Full address" required /></div>
                      <div className="grid gap-2"><Label htmlFor="description">Description</Label><Textarea id="description" value={businessForm.description} onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })} placeholder="About your business..." rows={3} /></div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setPromoteDialogOpen(false)} disabled={submittingBusiness}>{t('cancel')}</Button>
                      <Button type="submit" className="bg-[#E53935] hover:bg-red-700" disabled={submittingBusiness}>
                        {submittingBusiness ? 'Submitting...' : t('submit')}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Join as Reporter Dialog (Desktop) */}
              <Dialog open={reporterDialogOpen} onOpenChange={setReporterDialogOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-1.5 bg-white/95 hover:bg-white text-[#E53935] font-bold text-[12px] px-3.5 py-1.5 rounded-full shadow-sm transition-all duration-200 hover:shadow-md">
                    <UserPlus className="h-3.5 w-3.5" />{t('joinAsReporter')}
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">{t('joinAsReporter')}</DialogTitle>
                    <DialogDescription>{t('reportJoinDesc')}</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleReporterSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2"><Label htmlFor="reporterName">Full Name *</Label><Input id="reporterName" value={reporterForm.name} onChange={(e) => setReporterForm({ ...reporterForm, name: e.target.value })} placeholder="Enter your full name" required /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2"><Label htmlFor="reporterPhone">Phone *</Label><Input id="reporterPhone" type="tel" value={reporterForm.phone} onChange={(e) => setReporterForm({ ...reporterForm, phone: e.target.value })} placeholder="+91 XXXXX" required /></div>
                        <div className="grid gap-2"><Label htmlFor="reporterEmail">Email *</Label><Input id="reporterEmail" type="email" value={reporterForm.email} onChange={(e) => setReporterForm({ ...reporterForm, email: e.target.value })} placeholder="email@example.com" required /></div>
                      </div>
                      <div className="grid gap-2"><Label htmlFor="experience">Experience (Years)</Label><Input id="experience" value={reporterForm.experience} onChange={(e) => setReporterForm({ ...reporterForm, experience: e.target.value })} placeholder="e.g., 2 years in journalism" /></div>
                      <div className="grid gap-2"><Label htmlFor="portfolio">Portfolio/Social Media Link</Label><Input id="portfolio" value={reporterForm.portfolio} onChange={(e) => setReporterForm({ ...reporterForm, portfolio: e.target.value })} placeholder="https://your-portfolio.com" /></div>
                      <div className="grid gap-2"><Label htmlFor="reporterMessage">Why do you want to join?</Label><Textarea id="reporterMessage" value={reporterForm.message} onChange={(e) => setReporterForm({ ...reporterForm, message: e.target.value })} placeholder="Tell us about yourself..." rows={3} /></div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setReporterDialogOpen(false)} disabled={submittingReporter}>Cancel</Button>
                      <Button type="submit" className="bg-[#E53935] hover:bg-red-700" disabled={submittingReporter}>
                        {submittingReporter ? t('pleaseWait') : t('submitApplication')}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </nav>
        </div>
      </header>

      {/* --- PREMIUM MOBILE HEADER (Small Screens) --- */}
      <div className="lg:hidden">
        {/* Top Red Bar: Main Navigation */}
        <div className="bg-[#E53935] text-white border-b border-red-700 flex items-center justify-between px-4 h-16 sticky top-0 z-50 relative overflow-hidden">
          {/* Glossy shine overlay */}
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ background: 'linear-gradient(180deg, white 0%, transparent 50%, rgba(0,0,0,0.1) 100%)' }} />

          {/* Left: Hamburger Menu */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors active:scale-95 relative z-10">
            <Menu className="h-6 w-6 text-white" />
          </button>

          {/* Center: Logo with tight border */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10" onClick={() => setCurrentView('home')}>
            <div className="flex-shrink-0 w-[130px] h-[52px] rounded-md shadow-md p-0 relative cursor-pointer z-50 border-2 border-white overflow-hidden">
              <VideoLogo className="w-full h-full scale-[1.8]" />
            </div>
          </div>

          {/* Right: Search & Language */}
          <div className="flex items-center gap-1 relative z-10">
            <button onClick={() => setCurrentView('search')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Search className="h-5 w-5 text-white" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-[10px] font-black w-8 h-8 flex items-center justify-center rounded-full bg-white text-red-700 ml-1 shadow-sm">
                  {language.toUpperCase()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {languageOptions.map((lang) => (
                  <DropdownMenuItem key={lang.code} onClick={() => changeLanguage(lang.code)}>
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Scrolling Category Bar */}
        <div className="bg-white border-b border-gray-100 overflow-x-auto scrollbar-hide py-0.5 sticky top-16 z-40">
          <div className="flex items-center px-4 space-x-6 whitespace-nowrap">
            <button onClick={() => setCurrentView('home')} className={`text-[13px] font-extrabold pb-2.5 pt-2 border-b-2 transition-all ${currentView === 'home' ? 'text-red-600 border-red-600' : 'text-gray-500 border-transparent'}`}>{t('home')}</button>
            <button onClick={() => setCurrentView('news')} className={`text-[13px] font-extrabold pb-2.5 pt-2 border-b-2 transition-all ${currentView === 'news' ? 'text-red-600 border-red-600' : 'text-gray-500 border-transparent'}`}>{t('news')}</button>
            <button onClick={() => setCurrentView('enewspaper')} className={`text-[13px] font-extrabold pb-2.5 pt-2 border-b-2 transition-all ${currentView === 'enewspaper' ? 'text-red-600 border-red-600' : 'text-gray-500 border-transparent'}`}>{t('eNewspaper')}</button>
            <button onClick={() => setCurrentView('city')} className={`text-[13px] font-extrabold pb-2.5 pt-2 border-b-2 transition-all ${currentView === 'city' ? 'text-red-600 border-red-600' : 'text-gray-500 border-transparent'}`}>{t('cityNews')}</button>
            <button onClick={() => setCurrentView('classifieds')} className={`text-[13px] font-extrabold pb-2.5 pt-2 border-b-2 transition-all ${currentView === 'classifieds' ? 'text-red-600 border-red-600' : 'text-gray-500 border-transparent'}`}>{t('classified')}</button>
            <button onClick={() => setCurrentView('businesses')} className={`text-[13px] font-extrabold pb-2.5 pt-2 border-b-2 transition-all ${currentView === 'businesses' ? 'text-red-600 border-red-600' : 'text-gray-500 border-transparent'}`}>{t('businessDirectory')}</button>
            <button onClick={() => { window.history.pushState({ view: 'live-tv' }, '', '?view=live-tv'); setCurrentView('live-tv') }} className={`text-[13px] font-extrabold pb-2.5 pt-2 border-b-2 transition-all flex items-center gap-1.5 ${currentView === 'live-tv' ? 'text-red-600 border-red-600' : 'text-gray-500 border-transparent'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />Live TV
            </button>
          </div>
        </div>

        {/* Mobile Sidebar Menu (Drawer) */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[60] flex">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
            <div className="relative bg-white w-[280px] h-full shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-300">
              <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                <img
                  src="/images/logo-icon.png" // Use fallback or icon if ample
                  onError={(e) => e.target.style.display = 'none'}
                  alt="Star"
                  className="h-8 w-auto"
                />
                <span className="font-bold text-lg text-gray-900 absolute left-1/2 -translate-x-1/2">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-full hover:bg-gray-200 transition-colors"><X className="h-5 w-5 text-gray-600" /></button>
              </div>

              <div className="flex flex-col p-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Main</div>
                <Button variant="ghost" className="justify-start text-base font-medium h-12 hover:bg-red-50 hover:text-red-600" onClick={() => { setCurrentView('home'); setMobileMenuOpen(false) }}><Home className="mr-3 h-5 w-5" />{t('home')}</Button>
                <Button variant="ghost" className="justify-start text-base font-medium h-12 hover:bg-red-50 hover:text-red-600" onClick={() => { setCurrentView('news'); setMobileMenuOpen(false) }}><Newspaper className="mr-3 h-5 w-5" />{t('news')}</Button>
                <Button variant="ghost" className="justify-start text-base font-medium h-12 hover:bg-red-50 hover:text-red-600" onClick={() => { setCurrentView('enewspaper'); setMobileMenuOpen(false) }}><FileText className="mr-3 h-5 w-5" />{t('eNewspaper')}</Button>
                <Button variant="ghost" className="justify-start text-base font-medium h-12 hover:bg-red-50 hover:text-red-600" onClick={() => { setCurrentView('city'); setMobileMenuOpen(false) }}><MapPin className="mr-3 h-5 w-5" />City News</Button>

                <div className="my-2 border-t border-gray-100"></div>
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Services</div>

                <Button variant="ghost" className="justify-start text-base font-medium h-12 hover:bg-red-50 hover:text-red-600" onClick={() => { setCurrentView('classifieds'); setMobileMenuOpen(false) }}><Tag className="mr-3 h-5 w-5" />{t('classified')}</Button>
                <Button variant="ghost" className="justify-start text-base font-medium h-12 hover:bg-red-50 hover:text-red-600" onClick={() => { setCurrentView('businesses'); setMobileMenuOpen(false) }}><Building2 className="mr-3 h-5 w-5" />{t('businessDirectory')}</Button>
                <Button variant="ghost" className="justify-start text-base font-medium h-12 hover:bg-red-50 hover:text-red-600" onClick={() => { window.history.pushState({ view: 'live-tv' }, '', '?view=live-tv'); setCurrentView('live-tv'); setMobileMenuOpen(false) }}>
                  <span className="mr-3 flex items-center justify-center h-5 w-5"><span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" /></span>Live TV
                </Button>

                <div className="my-2"></div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-center" onClick={() => { setPromoteDialogOpen(true); setMobileMenuOpen(false) }}>
                  <Briefcase className="mr-2 h-4 w-4" />{t('promoteYourBusiness')}
                </Button>
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white justify-center mt-2" onClick={() => { setReporterDialogOpen(true); setMobileMenuOpen(false) }}>
                  <UserPlus className="mr-2 h-4 w-4" />{t('joinAsReporter')}
                </Button>

                <div className="my-2 border-t border-gray-100"></div>

                {user && (
                  <div className="px-2 py-2 bg-gray-50 rounded-lg mx-2">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10"><AvatarImage src={user.profileImage} /><AvatarFallback className="bg-red-100 text-red-600">{user.name?.[0]?.toUpperCase()}</AvatarFallback></Avatar>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[140px]">{user.email}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full justify-center text-red-600 border-red-200 hover:bg-red-50" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />{t('logout')}
                    </Button>
                  </div>
                )}

                <div className="my-4 px-2">
                  <p className="text-xs text-center text-gray-400 mb-2">{t('language')}</p>
                  <div className="flex justify-center gap-2">
                    {languageOptions.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border ${language === lang.code ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-300 text-gray-600'}`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Header