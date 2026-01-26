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
import { Menu, X, Home, Newspaper, Building2, FileText, Tag, Shield, LogOut, Search, ChevronDown, Briefcase, UserPlus, Globe, MapPin } from 'lucide-react'
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

  // Use language context
  const { language, changeLanguage, t, languageOptions } = useLanguage()


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
      {/* Top Bar with Logo, Social Icons, Login/Register */}
      <div className="bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-[75px]">
            {/* Left: Logo */}
            <div className="flex items-center cursor-pointer" onClick={() => setCurrentView('home')}>
              <img
                src="/images/star-news-india-logo.png"
                alt="Star News India Logo"
                className="h-[50px] md:h-[58px] lg:h-[65px] w-auto min-w-[140px] md:min-w-[170px] lg:min-w-[200px] object-contain"
                style={{ maxHeight: '65px' }}
              />
            </div>

            {/* Right: Follow Us + Login/Register */}
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-3">
                <span className="text-gray-400 text-sm">{t('followUs')}:</span>
                <div className="flex items-center gap-2">
                  {SOCIAL_LINKS.facebook && <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors"><FacebookIcon /></a>}
                  {SOCIAL_LINKS.whatsapp && <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition-colors"><WhatsAppIcon /></a>}
                  {SOCIAL_LINKS.instagram && <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors"><InstagramIcon /></a>}
                  {SOCIAL_LINKS.youtube && <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors"><YouTubeIcon /></a>}
                </div>
              </div>

              {/* Language Switcher */}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800 gap-1">
                      <Globe className="h-4 w-4" />
                      {languageOptions.find(l => l.code === language)?.label || 'EN'}
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {languageOptions.map((lang) => (
                      <DropdownMenuItem
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={language === lang.code ? 'bg-gray-100' : ''}
                      >
                        <span className="font-medium mr-2">{lang.label}</span>
                        <span className="text-gray-500 text-sm">{lang.fullName}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2">
                {user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar><AvatarImage src={user.profileImage} /><AvatarFallback className="bg-gradient-to-r from-red-600 to-purple-600 text-white">{user.name?.[0]?.toUpperCase()}</AvatarFallback></Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel><p className="text-sm font-medium">{user.name}</p><p className="text-xs text-muted-foreground">{user.email}</p><Badge variant="outline" className="w-fit mt-1">{user.role}</Badge></DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {user.role === ROLES.REPORTER && <DropdownMenuItem onClick={() => setCurrentView('reporter-dashboard')}><Newspaper className="mr-2 h-4 w-4" />{t('reporterDashboard')}</DropdownMenuItem>}
                      {user.role === ROLES.ADVERTISER && <DropdownMenuItem onClick={() => setCurrentView('advertiser-dashboard')}><Building2 className="mr-2 h-4 w-4" />Advertiser Dashboard</DropdownMenuItem>}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" />{t('logout')}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <button className="lg:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4">
          <nav className="hidden lg:flex items-center justify-between h-12">
            <div className="flex items-center gap-1">
              <Button variant={currentView === 'home' ? 'default' : 'ghost'} onClick={() => setCurrentView('home')} className={`rounded-md ${currentView === 'home' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}>
                <Home className="mr-2 h-4 w-4" />{t('home')}
              </Button>
              <DropdownMenu open={allNewsOpen} onOpenChange={setAllNewsOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant={currentView === 'news' ? 'default' : 'ghost'} className={`rounded-md ${currentView === 'news' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}>
                    <Newspaper className="mr-2 h-4 w-4" />{t('news')}<ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => { setCurrentView('news'); localStorage.removeItem('selectedCategory'); setAllNewsOpen(false) }}>{t('allNews')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCategoryClick('crime')}>{t('crime')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCategoryClick('politics')}>{t('politics')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCategoryClick('education')}>{t('education')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCategoryClick('sports')}>{t('sports')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCategoryClick('entertainment')}>{t('entertainment')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCategoryClick('trending')}>{t('trending')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant={currentView === 'enewspaper' ? 'default' : 'ghost'} onClick={() => setCurrentView('enewspaper')} className={`rounded-md ${currentView === 'enewspaper' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}>
                <FileText className="mr-2 h-4 w-4" />{t('eNewspaper')}
              </Button>
              <Button variant={currentView === 'city' ? 'default' : 'ghost'} onClick={() => setCurrentView('city')} className={`rounded-md ${currentView === 'city' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}>
                <MapPin className="mr-2 h-4 w-4" />City
              </Button>
              <Button variant={currentView === 'classifieds' ? 'default' : 'ghost'} onClick={() => setCurrentView('classifieds')} className={`rounded-md ${currentView === 'classifieds' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}>
                <Tag className="mr-2 h-4 w-4" />{t('classified')}
              </Button>
              <Button variant={currentView === 'businesses' ? 'default' : 'ghost'} onClick={() => setCurrentView('businesses')} className={`rounded-md ${currentView === 'businesses' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}>
                <Building2 className="mr-2 h-4 w-4" />{t('businessDirectory')}
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


              {/* Join as Reporter Dialog */}
              <Dialog open={reporterDialogOpen} onOpenChange={setReporterDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white font-medium text-sm px-3 py-1.5 h-8">
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />Join as Reporter
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Join as a Reporter</DialogTitle>
                    <DialogDescription>Want to be part of StarNews? Submit your application and our team will review it.</DialogDescription>
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
                        {submittingReporter ? 'Submitting...' : 'Submit Application'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </nav>

          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t">
              <nav className="flex flex-col gap-2">
                <Button variant="ghost" className="justify-start" onClick={() => { setCurrentView('home'); setMobileMenuOpen(false) }}><Home className="mr-2 h-4 w-4" />{t('home')}</Button>
                <Button variant="ghost" className="justify-start" onClick={() => { setCurrentView('news'); setMobileMenuOpen(false) }}><Newspaper className="mr-2 h-4 w-4" />{t('news')}</Button>
                <Button variant="ghost" className="justify-start" onClick={() => { setCurrentView('enewspaper'); setMobileMenuOpen(false) }}><FileText className="mr-2 h-4 w-4" />{t('eNewspaper')}</Button>
                <Button variant="ghost" className="justify-start" onClick={() => { setCurrentView('city'); setMobileMenuOpen(false) }}><MapPin className="mr-2 h-4 w-4" />City</Button>
                <Button variant="ghost" className="justify-start" onClick={() => { setCurrentView('classifieds'); setMobileMenuOpen(false) }}><Tag className="mr-2 h-4 w-4" />{t('classified')}</Button>
                <Button variant="ghost" className="justify-start" onClick={() => { setCurrentView('businesses'); setMobileMenuOpen(false) }}><Building2 className="mr-2 h-4 w-4" />{t('businessDirectory')}</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white justify-start mt-2" onClick={() => { setPromoteDialogOpen(true); setMobileMenuOpen(false) }}>
                  <Briefcase className="mr-2 h-4 w-4" />{t('promoteYourBusiness')}
                </Button>

                <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                  <span className="text-gray-500 text-sm">{t('followUs')}:</span>
                  {SOCIAL_LINKS.facebook && <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600"><FacebookIcon /></a>}
                  {SOCIAL_LINKS.whatsapp && <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="text-green-600"><WhatsAppIcon /></a>}
                  {SOCIAL_LINKS.instagram && <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-600"><InstagramIcon /></a>}
                  {SOCIAL_LINKS.youtube && <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" className="text-red-600"><YouTubeIcon /></a>}
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-500 text-sm">Language:</span>
                  {languageOptions.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`px-2 py-1 rounded text-sm font-medium ${language === lang.code ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>
    </>
  )
}

export default Header