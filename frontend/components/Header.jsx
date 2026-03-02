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
      {/* --- PREMIUM DESKTOP HEADER --- */}
      <div className="hidden lg:block bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center cursor-pointer group" onClick={() => setCurrentView('home')}>
              <div className="relative h-[80px] w-[200px]">
                <video
                  src="/StarNewsLogo.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-contain transition-transform group-hover:scale-105 pointer-events-none"
                  style={{ filter: 'url(#remove-green)' }}
                />
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center gap-6 text-sm font-medium text-gray-500">
                <div className="flex items-center gap-4 border-r pr-6 border-gray-100">
                  <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-[#1877F2] transition-colors"><FacebookIcon /></a>
                  <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-[#25D366] transition-colors"><WhatsAppIcon /></a>
                  <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-[#E4405F] transition-colors"><InstagramIcon /></a>
                  <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-[#FF0000] transition-colors"><YouTubeIcon /></a>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="font-bold tracking-tight hover:bg-gray-50">
                      <Globe className="h-4 w-4 mr-2" />
                      {languageOptions.find(l => l.code === language)?.label || 'EN'}
                      <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {languageOptions.map((lang) => (
                      <DropdownMenuItem
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`flex items-center justify-between ${language === lang.code ? 'bg-gray-50 font-bold' : ''}`}
                      >
                        <span>{lang.fullName}</span>
                        {language === lang.code && <div className="w-1.5 h-1.5 rounded-full bg-red-600" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <Avatar className="h-8 w-8 ring-2 ring-gray-100"><AvatarImage src={user.profileImage} /><AvatarFallback className="bg-red-600 text-white text-xs">{user.name?.[0]}</AvatarFallback></Avatar>
                        <span className="text-gray-900">{user.name}</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="flex flex-col">
                        <span className="text-sm font-bold">{user.name}</span>
                        <span className="text-xs text-gray-500">{user.email}</span>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {user.role === ROLES.REPORTER && <DropdownMenuItem onClick={() => setCurrentView('reporter-dashboard')}><Newspaper className="mr-2 h-4 w-4" />{t('reporterDashboard')}</DropdownMenuItem>}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600"><LogOut className="mr-2 h-4 w-4" />{t('logout')}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button variant="outline" size="sm" className="font-bold border-2" onClick={() => setCurrentView('login')}>
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <header className="hidden lg:block bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setCurrentView('home')}
                className={`text-sm font-bold px-4 hover:bg-red-50 hover:text-red-600 transition-all ${currentView === 'home' ? 'text-red-600 bg-red-50 shadow-sm' : 'text-gray-600'}`}
              >
                {t('home')}
              </Button>
              <DropdownMenu open={allNewsOpen} onOpenChange={setAllNewsOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`text-sm font-bold px-4 hover:bg-red-50 hover:text-red-600 transition-all ${currentView === 'news' ? 'text-red-600 bg-red-50 shadow-sm' : 'text-gray-600'}`}
                  >
                    {t('news')}<ChevronDown className="ml-1 h-3.5 w-3.5 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuItem onClick={() => { setCurrentView('news'); localStorage.removeItem('selectedCategory'); setAllNewsOpen(false) }}>{t('allNews')}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleCategoryClick('crime')}>{t('crime')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCategoryClick('politics')}>{t('politics')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCategoryClick('education')}>{t('education')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCategoryClick('sports')}>{t('sports')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCategoryClick('entertainment')}>{t('entertainment')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCategoryClick('trending')}>{t('trending')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                onClick={() => setCurrentView('enewspaper')}
                className={`text-sm font-bold px-4 hover:bg-red-50 hover:text-red-600 transition-all ${currentView === 'enewspaper' ? 'text-red-600 bg-red-50 shadow-sm' : 'text-gray-600'}`}
              >
                {t('eNewspaper')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setCurrentView('city')}
                className={`text-sm font-bold px-4 hover:bg-red-50 hover:text-red-600 transition-all ${currentView === 'city' ? 'text-red-600 bg-red-50 shadow-sm' : 'text-gray-600'}`}
              >
                {t('cityNews')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setCurrentView('classifieds')}
                className={`text-sm font-bold px-4 hover:bg-red-50 hover:text-red-600 transition-all ${currentView === 'classifieds' ? 'text-red-600 bg-red-50 shadow-sm' : 'text-gray-600'}`}
              >
                {t('classified')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setCurrentView('businesses')}
                className={`text-sm font-bold px-4 hover:bg-red-50 hover:text-red-600 transition-all ${currentView === 'businesses' ? 'text-red-600 bg-red-50 shadow-sm' : 'text-gray-600'}`}
              >
                {t('businessDirectory')}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Dialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-3 py-1.5 h-8">
                    <Briefcase className="mr-1.5 h-3.5 w-3.5" />{t('promoteYourBusiness')}
                  </Button>
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
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={submittingBusiness}>
                        {submittingBusiness ? 'Submitting...' : t('submit')}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>


              {/* Join as Reporter Dialog (Desktop) */}
              <Dialog open={reporterDialogOpen} onOpenChange={setReporterDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white font-medium text-sm px-3 py-1.5 h-8">
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />{t('joinAsReporter')}
                  </Button>
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
                      <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={submittingReporter}>
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
        {/* Top White Bar: Main Navigation */}
        <div className="bg-white text-gray-900 border-b border-gray-100 flex items-center justify-between px-4 h-16 sticky top-0 z-50">

          {/* Left: Hamburger Menu */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors active:scale-95">
            <Menu className="h-6 w-6 text-gray-900" />
          </button>

          {/* Center: Logo */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer pt-1" onClick={() => setCurrentView('home')}>
            <div className="relative h-10 w-32">
              <video
                src="/StarNewsLogo.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain pointer-events-none"
                style={{ filter: 'url(#remove-green)' }}
              />
            </div>
          </div>

          {/* Right: Search & Language */}
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentView('search')} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
              <Search className="h-5 w-5 text-gray-900" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-[10px] font-black w-8 h-8 flex items-center justify-center rounded-full bg-gray-900 text-white ml-1">
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
            <button onClick={() => setCurrentView('businesses')} className={`text-[13px] font-extrabold pb-2.5 pt-2 border-b-2 transition-all ${currentView === 'businesses' ? 'text-red-600 border-red-600' : 'text-gray-500 border-transparent'}`}>{t('businessDirectory')}</button>
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

                <div className="my-2"></div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-center" onClick={() => { setPromoteDialogOpen(true); setMobileMenuOpen(false) }}>
                  <Briefcase className="mr-2 h-4 w-4" />{t('promoteYourBusiness')}
                </Button>
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white justify-center mt-2" onClick={() => { setReporterDialogOpen(true); setMobileMenuOpen(false) }}>
                  <UserPlus className="mr-2 h-4 w-4" />{t('joinAsReporter')}
                </Button>

                <div className="my-2 border-t border-gray-100"></div>

                {user ? (
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
                ) : (
                  <div className="px-2">
                    <Button variant="default" className="w-full bg-red-600 hover:bg-red-700 text-white shadow-md" onClick={() => { setCurrentView('login'); setMobileMenuOpen(false) }}>
                      Login / Register
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