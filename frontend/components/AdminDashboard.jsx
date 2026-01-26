'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { admin, news, auth, categories } from '@/lib/api'
import {
  getContentSettings, saveContentSettings, savePremiumAdSettings, saveSidebarAdSettings,
  saveTrendingSettings, markNewsAsTrending, getTrendingNewsIds, saveArticleAdSettings, saveBusinessAdSettings
} from '@/lib/contentStore'
import {
  LayoutDashboard, Newspaper, AlertCircle, Megaphone, Navigation,
  Building2, Tag, Users, FileText, Settings, Eye, Check, X,
  Edit, Trash2, Plus, GripVertical, RefreshCw, Lock, Bell,
  TrendingUp, Clock, CheckCircle, XCircle, AlertTriangle, Image, Link, Monitor,
  Phone, MapPin, Globe, MessageCircle, Star, Home, UserPlus, Upload
} from 'lucide-react'
import { INDIAN_CITIES_SORTED } from '@/lib/indianCities'

// News categories
const NEWS_CATEGORIES = [
  'All News', 'Crime', 'Politics', 'Education', 'Murder', 'Entertainment', 'Trending', 'Sports',
  'Business', 'Nation', 'City News', 'Health', 'Jobs', 'Technology'
]

// Business categories
const BUSINESS_CATEGORIES = [
  'Restaurant', 'Cafe', 'Electronics', 'Fashion', 'Healthcare', 'Education',
  'Fitness', 'Beauty & Spa', 'Real Estate', 'Automotive', 'Services', 'Other'
]

// Classified categories
const CLASSIFIED_CATEGORIES = [
  'IT Jobs', 'Real Estate', 'Vehicles', 'Electronics', 'Furniture', 'Fashion', 'Services', 'Other'
]

// Helper to safely get text value from string or {en,hi,mr} object
const getTextValue = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    return value.en || value.mr || value.hi || JSON.stringify(value)
  }
  return String(value)
}

const AdminDashboard = ({ user, toast }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Data states
  const [pendingData, setPendingData] = useState({
    news: [],
    businesses: [],
    ads: [],
    classifieds: [],
    users: []
  })
  const [breakingNews, setBreakingNews] = useState({
    enabled: false,
    articleIds: [],
    text: ''
  })
  const [approvedNews, setApprovedNews] = useState([])
  const [navigationItems, setNavigationItems] = useState([])
  const [editingNav, setEditingNav] = useState(null)
  const [newNavItem, setNewNavItem] = useState({ label: '', path: '' })

  // ===== NEW: Full Data States =====
  const [allBusinesses, setAllBusinesses] = useState([])
  const [allClassifieds, setAllClassifieds] = useState([])
  const [allNews, setAllNews] = useState([])
  const [allEnewspapers, setAllEnewspapers] = useState([])
  const [sidebarAdSettings, setSidebarAdSettings] = useState({
    enabled: true, imageUrl: '', linkUrl: '', whatsappNumber: '', title: ''
  })
  const [newsCategories, setNewsCategories] = useState([])
  const [reporterApplications, setReporterApplications] = useState([])
  const [loadingReporterApps, setLoadingReporterApps] = useState(false)

  // Create Reporter Form State
  const [showCreateReporterForm, setShowCreateReporterForm] = useState(false)
  const [createReporterForm, setCreateReporterForm] = useState({
    name: '', email: '', phone: '', password: ''
  })
  const [creatingReporter, setCreatingReporter] = useState(false)
  const [allReporters, setAllReporters] = useState([])
  const [loadingAllReporters, setLoadingAllReporters] = useState(false)

  // Business Promotions State
  const [businessPromotions, setBusinessPromotions] = useState([])
  const [loadingPromotions, setLoadingPromotions] = useState(false)

  // Pending Ticker State
  const [pendingTicker, setPendingTicker] = useState(null)
  const [loadingPendingTicker, setLoadingPendingTicker] = useState(false)

  // Form States
  const [showBusinessForm, setShowBusinessForm] = useState(false)
  const [editingBusiness, setEditingBusiness] = useState(null)
  const [businessForm, setBusinessForm] = useState({
    name: '', category: '', description: '', phone: '', whatsapp: '', website: '',
    location: '', googleMapsLink: '', address: '', area: '', images: []
  })

  const [showClassifiedForm, setShowClassifiedForm] = useState(false)
  const [editingClassified, setEditingClassified] = useState(null)
  const [classifiedForm, setClassifiedForm] = useState({
    title: '', category: '', price: '', description: '', phone: '', whatsapp: '',
    location: '', sellerName: '', condition: 'Good', images: []
  })

  const [showNewsForm, setShowNewsForm] = useState(false)
  const [editingNews, setEditingNews] = useState(null)
  const [newsForm, setNewsForm] = useState({
    title: '', category: '', content: '', mainImage: '', metaDescription: '',
    tags: '', genre: 'breaking', featured: false, showOnHome: true,
    youtubeUrl: '', thumbnails: [], authorName: ''
  })

  const [showEnewspaperForm, setShowEnewspaperForm] = useState(false)
  const [enewspaperForm, setEnewspaperForm] = useState({
    title: '', thumbnailUrl: '', editionDate: '', description: ''
  })
  const [enewspaperPdfFile, setEnewspaperPdfFile] = useState(null)
  const [enewspaperPdfPreview, setEnewspaperPdfPreview] = useState(null)
  const [uploadingEnewspaper, setUploadingEnewspaper] = useState(false)
  const enewspaperFileInputRef = useRef(null)

  // Ad image upload state
  const [uploadingPremiumAd, setUploadingPremiumAd] = useState(false)
  const [uploadingSidebarAd, setUploadingSidebarAd] = useState(false)
  const premiumAdImageRef = useRef(null)
  const sidebarAdImageRef = useRef(null)

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Content settings state
  const [contentSettings, setContentSettings] = useState({
    premiumAd: { enabled: true, imageUrl: '', linkUrl: '', title: 'Premium Advertisement Space' },
    sidebarAd: { enabled: true, items: [] },
    trending: { enabled: true, newsIds: [], maxItems: 6 },
    articleAd: {
      sticky: { enabled: true, imageUrl: '', linkUrl: '', title: 'Premium Ad Space' }
    },
    businessAd: { enabled: true, imageUrl: '', linkUrl: '', title: 'BUSINESS', subtitle: 'Advertisement', buttonText: 'POST YOUR AD' }
  })

  // Load content settings on mount
  useEffect(() => {
    const settings = getContentSettings()
    setContentSettings(settings)
    loadBusinessPromotions() // Load initial promotions data
  }, [])

  // Load pending items
  const loadPendingData = async () => {
    try {
      setRefreshing(true)
      const data = await admin.getPending()
      setPendingData(data)
    } catch (error) {
      console.error('Failed to load pending data:', error)
    } finally {
      setRefreshing(false)
    }
  }

  // Load approved news for breaking news selection
  const loadApprovedNews = async () => {
    try {
      const data = await news.getAll({ limit: 5 })
      setApprovedNews(data.articles || [])
    } catch (error) {
      console.error('Failed to load approved news:', error)
    }
  }

  useEffect(() => {
    loadPendingData()
    loadApprovedNews()
    // Initialize navigation
    setNavigationItems([
      { id: '1', label: 'Home', path: 'home', order: 1, active: true },
      { id: '2', label: 'News', path: 'news', order: 2, active: true },
      { id: '3', label: 'E-Newspaper', path: 'enewspaper', order: 3, active: true },
      { id: '4', label: 'Classifieds', path: 'classifieds', order: 4, active: true },
      { id: '5', label: 'Business Directory', path: 'businesses', order: 5, active: true },
      { id: '6', label: 'Live TV', path: 'live-tv', order: 6, active: true }
    ])
  }, [])

  // Handle news approval/rejection
  const handleNewsAction = async (articleId, action, reason = '') => {
    try {
      setLoading(true)
      await admin.approveNews(articleId, action, reason)
      toast({
        title: action === 'approve' ? 'News Approved' : 'News Rejected',
        description: action === 'approve' ? 'Article is now live on the website.' : 'Article has been rejected.'
      })
      loadPendingData()
      loadApprovedNews()
    } catch (error) {
      toast({ title: 'Action Failed', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Handle user approval
  const handleUserAction = async (userId, action) => {
    try {
      setLoading(true)
      await admin.approveUser(userId, action)
      toast({
        title: action === 'approve' ? 'User Approved' : 'User Rejected',
        description: action === 'approve' ? 'User can now access their dashboard.' : 'User account rejected.'
      })
      loadPendingData()
    } catch (error) {
      toast({ title: 'Action Failed', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Handle business approval
  const handleBusinessAction = async (businessId, action) => {
    try {
      setLoading(true)
      await admin.approveBusiness(businessId, action)
      toast({
        title: action === 'approve' ? 'Business Approved' : 'Business Rejected'
      })
      loadPendingData()
      loadAllBusinesses()
    } catch (error) {
      toast({ title: 'Action Failed', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Handle classified approval
  const handleClassifiedAction = async (classifiedId, action) => {
    try {
      setLoading(true)
      await admin.approveClassified(classifiedId, action)
      toast({
        title: action === 'approve' ? 'Classified Approved' : 'Classified Rejected'
      })
      loadPendingData()
      loadAllClassifieds()
    } catch (error) {
      toast({ title: 'Action Failed', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Handle ad approval
  const handleAdAction = async (adId, action) => {
    try {
      setLoading(true)
      await admin.approveAd(adId, action)
      toast({
        title: action === 'approve' ? 'Ad Approved' : 'Ad Rejected'
      })
      loadPendingData()
    } catch (error) {
      toast({ title: 'Action Failed', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' })
      return
    }
    try {
      setPasswordLoading(true)
      await auth.changePassword({
        currentPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      })
      toast({ title: 'Password Changed', description: 'Your password has been updated successfully.' })
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      toast({ title: 'Password Change Failed', description: error.message, variant: 'destructive' })
    } finally {
      setPasswordLoading(false)
    }
  }

  // Add navigation item
  const addNavigationItem = () => {
    if (!newNavItem.label || !newNavItem.path) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' })
      return
    }
    const newItem = {
      id: Date.now().toString(),
      label: newNavItem.label,
      path: newNavItem.path,
      order: navigationItems.length + 1,
      active: true
    }
    setNavigationItems([...navigationItems, newItem])
    setNewNavItem({ label: '', path: '' })
    toast({ title: 'Navigation item added' })
  }

  // Remove navigation item
  const removeNavigationItem = (id) => {
    setNavigationItems(navigationItems.filter(item => item.id !== id))
    toast({ title: 'Navigation item removed' })
  }

  // Toggle navigation item
  const toggleNavigationItem = (id) => {
    setNavigationItems(navigationItems.map(item =>
      item.id === id ? { ...item, active: !item.active } : item
    ))
  }

  // ===== NEW: Load All Data Functions =====
  const loadAllBusinesses = async () => {
    try {
      const data = await admin.getBusinesses()
      setAllBusinesses(data || [])
    } catch (error) {
      console.error('Failed to load businesses:', error)
    }
  }

  const loadAllClassifieds = async () => {
    try {
      const data = await admin.getClassifieds()
      setAllClassifieds(data || [])
    } catch (error) {
      console.error('Failed to load classifieds:', error)
    }
  }

  const loadAllNews = async () => {
    try {
      const data = await admin.getNews()
      setAllNews(data || [])
    } catch (error) {
      console.error('Failed to load news:', error)
    }
  }

  const loadAllEnewspapers = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/enewspaper', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setAllEnewspapers(data.papers || [])
    } catch (error) {
      console.error('Failed to load e-newspapers:', error)
    }
  }

  const loadSidebarAd = async () => {
    try {
      const data = await admin.getSidebarAd()
      setSidebarAdSettings(data || { enabled: true, imageUrl: '', linkUrl: '', whatsappNumber: '', title: '' })
    } catch (error) {
      console.error('Failed to load sidebar ad:', error)
    }
  }

  // Load reporter applications
  const loadReporterApplications = async () => {
    try {
      setLoadingReporterApps(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/reporter-applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setReporterApplications(data.applications || [])
    } catch (error) {
      console.error('Failed to load reporter applications:', error)
    } finally {
      setLoadingReporterApps(false)
    }
  }

  // Update reporter application status
  const handleReporterAppAction = async (id, status) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/reporter-applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id, status })
      })
      if (res.ok) {
        toast({ title: `Application marked as ${status}` })
        loadReporterApplications()
      } else {
        throw new Error('Failed to update')
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  // Delete reporter application
  const handleDeleteReporterApp = async (id) => {
    if (!confirm('Are you sure you want to delete this application?')) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/reporter-applications?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        toast({ title: 'Application deleted' })
        loadReporterApplications()
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  // Load all reporters
  const loadAllReporters = async () => {
    try {
      setLoadingAllReporters(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/users/reporters', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setAllReporters(data.reporters || [])
    } catch (error) {
      console.error('Failed to load reporters:', error)
    } finally {
      setLoadingAllReporters(false)
    }
  }

  // Load business promotions
  const loadBusinessPromotions = async () => {
    try {
      setLoadingPromotions(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/business-promotions', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) setBusinessPromotions(data.promotions || [])
    } catch (error) {
      console.error('Failed to load business promotions:', error)
    } finally {
      setLoadingPromotions(false)
    }
  }

  // Handle promotion action
  const handlePromotionAction = async (id, action) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      let res

      if (action === 'delete') {
        if (!confirm('Are you sure you want to delete this specific request?')) {
          setLoading(false)
          return
        }
        res = await fetch(`/api/business-promotions?id=${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      } else {
        // Status update (approve/reject/contacted)
        let status = 'PENDING'
        let note = ''
        if (action === 'approve') status = 'APPROVED'
        if (action === 'reject') status = 'REJECTED'
        if (action === 'contacted') status = 'CONTACTED'

        res = await fetch('/api/business-promotions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ id, status, adminNote: note })
        })
      }

      if (res.ok) {
        toast({ title: `Request ${action === 'delete' ? 'deleted' : 'updated'}` })
        loadBusinessPromotions()
      } else {
        toast({ title: 'Operation failed', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Promotion action error:', error)
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Delete reporter
  const handleDeleteReporter = async (id, name) => {
    if (!confirm(`Are you sure you want to delete reporter "${name}"? This cannot be undone.`)) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/users/reporters/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        toast({ title: 'Reporter Deleted', description: `${name} has been removed` })
        loadAllReporters()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  // Load pending ticker
  const loadPendingTicker = async () => {
    try {
      setLoadingPendingTicker(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/pending-ticker', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setPendingTicker(data.ticker)
    } catch (error) {
      console.error('Failed to load pending ticker:', error)
    } finally {
      setLoadingPendingTicker(false)
    }
  }

  // Approve pending ticker
  const handleApproveTicker = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/pending-ticker/approve', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        toast({ title: 'Ticker Approved', description: 'The ticker is now live!' })
        loadPendingTicker()
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  // Reject pending ticker
  const handleRejectTicker = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/pending-ticker/reject', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        toast({ title: 'Ticker Rejected', description: 'The pending ticker has been rejected' })
        loadPendingTicker()
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  // Load data on tab change
  useEffect(() => {
    if (activeTab === 'overview') loadPendingTicker()
    if (activeTab === 'businesses') loadAllBusinesses()
    if (activeTab === 'classifieds') loadAllClassifieds()
    if (activeTab === 'manage-news') loadAllNews()
    if (activeTab === 'reporter-apps') loadReporterApplications()
    if (activeTab === 'reporters') loadAllReporters()
    if (activeTab === 'enewspaper') loadAllEnewspapers()
    if (activeTab === 'content') loadSidebarAd()
  }, [activeTab])

  // ===== BUSINESS CRUD Handlers =====
  const resetBusinessForm = () => {
    setBusinessForm({ name: '', category: '', description: '', phone: '', whatsapp: '', website: '', location: '', googleMapsLink: '', address: '', area: '', images: [], coverImage: '' })
    setEditingBusiness(null)
  }

  const handleSaveBusiness = async () => {
    if (!businessForm.name || !businessForm.category) {
      toast({ title: 'Name and Category are required', variant: 'destructive' })
      return
    }
    try {
      setLoading(true)
      if (editingBusiness) {
        await admin.updateBusiness(editingBusiness.id, businessForm)
        toast({ title: 'Business Updated' })
      } else {
        await admin.createBusiness(businessForm)
        toast({ title: 'Business Created' })
      }
      setShowBusinessForm(false)
      resetBusinessForm()
      loadAllBusinesses()
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleEditBusiness = (business) => {
    setEditingBusiness(business)
    setBusinessForm({
      name: business.name || '',
      category: business.category || '',
      description: business.description || '',
      phone: business.phone || '',
      whatsapp: business.whatsapp || '',
      website: business.website || '',
      location: business.location || '',
      googleMapsLink: business.googleMapsLink || '',
      address: business.address || '',
      area: business.area || '',
      address: business.address || '',
      area: business.area || '',
      images: business.images || [],
      coverImage: business.cover_image || business.coverImage || ''
    })
    setShowBusinessForm(true)
  }

  const handleDeleteBusiness = async (id) => {
    if (!confirm('Are you sure you want to delete this business?')) return
    try {
      setLoading(true)
      await admin.deleteBusiness(id)
      toast({ title: 'Business Deleted' })
      loadAllBusinesses()
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleBusiness = async (id) => {
    const previousBusinesses = [...allBusinesses]
    setAllBusinesses(prev => prev.map(b =>
      b.id === id ? { ...b, enabled: b.enabled === false ? true : false } : b
    ))

    try {
      await admin.toggleBusiness(id)
      toast({ title: 'Business Status Updated' })
    } catch (error) {
      setAllBusinesses(previousBusinesses)
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  // ===== CLASSIFIED CRUD Handlers =====
  const resetClassifiedForm = () => {
    setClassifiedForm({ title: '', category: '', price: '', description: '', phone: '', whatsapp: '', location: '', sellerName: '', condition: 'Good', images: [] })
    setEditingClassified(null)
  }

  const handleSaveClassified = async () => {
    if (!classifiedForm.title || !classifiedForm.category) {
      toast({ title: 'Title and Category are required', variant: 'destructive' })
      return
    }
    try {
      setLoading(true)
      if (editingClassified) {
        await admin.updateClassified(editingClassified.id, classifiedForm)
        toast({ title: 'Classified Updated' })
      } else {
        await admin.createClassified(classifiedForm)
        toast({ title: 'Classified Created' })
      }
      setShowClassifiedForm(false)
      resetClassifiedForm()
      loadAllClassifieds()
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleEditClassified = (classified) => {
    setEditingClassified(classified)
    setClassifiedForm({
      title: classified.title || '',
      category: classified.category || '',
      price: classified.price || '',
      description: classified.description || '',
      phone: classified.phone || '',
      whatsapp: classified.whatsapp || '',
      location: classified.location || '',
      sellerName: classified.sellerName || '',
      condition: classified.condition || 'Good',
      images: classified.images || []
    })
    setShowClassifiedForm(true)
  }

  const handleDeleteClassified = async (id) => {
    if (!confirm('Are you sure you want to delete this classified?')) return
    try {
      setLoading(true)
      await admin.deleteClassified(id)
      toast({ title: 'Classified Deleted' })
      loadAllClassifieds()
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleClassified = async (id) => {
    // Optimistic update
    const previousClassifieds = [...allClassifieds]
    setAllClassifieds(prev => prev.map(c =>
      c.id === id ? { ...c, enabled: c.enabled === false ? true : false } : c
    ))

    try {
      await admin.toggleClassified(id)
      toast({ title: 'Classified Status Updated' })
    } catch (error) {
      // Revert on error
      setAllClassifieds(previousClassifieds)
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  // ===== NEWS CRUD Handlers =====
  const resetNewsForm = () => {
    setNewsForm({ title: '', category: '', city: '', content: '', mainImage: '', metaDescription: '', tags: '', featured: false, showOnHome: true, videoUrl: '', youtubeUrl: '', mediaItems: [], thumbnailUrl: '' })
    setEditingNews(null)
  }

  const handleSaveNews = async () => {
    if (!newsForm.title || !newsForm.category || !newsForm.content) {
      toast({ title: 'Title, Category, and Content are required', variant: 'destructive' })
      return
    }
    try {
      setLoading(true)
      // Map form fields to API expected fields
      const payload = {
        title: newsForm.title,
        content: newsForm.content,
        categoryId: newsForm.category,
        category: newsForm.category,
        city: newsForm.city || '',
        mainImage: newsForm.mainImage || '',
        metaDescription: newsForm.metaDescription || '',
        videoUrl: newsForm.youtubeUrl || '',
        youtubeUrl: newsForm.youtubeUrl || '',
        thumbnails: newsForm.thumbnails || [],
        thumbnailUrl: newsForm.thumbnails?.[0] || '',
        tags: newsForm.tags ? newsForm.tags.split(',').map(t => t.trim()) : [],
        featured: newsForm.featured || false,
        showOnHome: newsForm.showOnHome !== false,
        authorName: newsForm.authorName || ''
      }
      if (editingNews) {
        await admin.updateNews(editingNews.id, payload)
        toast({ title: 'News Updated' })
      } else {
        await admin.createNews(payload)
        toast({ title: 'News Published' })
      }
      setShowNewsForm(false)
      resetNewsForm()
      loadAllNews()
      loadApprovedNews()
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleEditNews = (article) => {
    setEditingNews(article)
    setNewsForm({
      title: article.title || '',
      category: article.category || article.categoryId || '',
      city: article.city || '',
      content: article.content || '',
      mainImage: article.mainImage || '',
      metaDescription: article.metaDescription || '',
      tags: Array.isArray(article.tags) ? article.tags.join(', ') : (article.tags || ''),
      featured: article.featured || false,
      showOnHome: article.showOnHome !== false,
      youtubeUrl: article.youtubeUrl || article.videoUrl || '',
      thumbnails: article.thumbnails || (article.thumbnailUrl ? [article.thumbnailUrl] : []),
      authorName: article.authorName || ''
    })
    setShowNewsForm(true)
  }

  const handleDeleteNews = async (id) => {
    if (!confirm('Are you sure you want to delete this news article?')) return
    try {
      setLoading(true)
      await admin.deleteNews(id)
      toast({ title: 'News Deleted' })
      loadAllNews()
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleNews = async (id) => {
    const previousNews = [...allNews]
    setAllNews(prev => prev.map(n =>
      n.id === id ? { ...n, enabled: n.enabled === false ? true : false } : n
    ))

    try {
      await admin.toggleNews(id)
      toast({ title: 'News Status Updated' })
    } catch (error) {
      setAllNews(previousNews)
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const handleToggleNewsFeatured = async (id) => {
    const previousNews = [...allNews]
    setAllNews(prev => prev.map(n =>
      n.id === id ? { ...n, featured: !n.featured } : n
    ))

    try {
      await admin.toggleNewsFeatured(id)
      toast({ title: 'Featured Status Updated' })
    } catch (error) {
      setAllNews(previousNews)
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  // ===== E-NEWSPAPER Handlers =====
  const handleEnewspaperFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast({ title: 'Only PDF files are allowed', variant: 'destructive' })
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      toast({ title: 'File size exceeds 25MB limit', variant: 'destructive' })
      return
    }
    setEnewspaperPdfFile(file)
    setEnewspaperPdfPreview(URL.createObjectURL(file))
  }

  const resetEnewspaperForm = () => {
    setEnewspaperForm({ title: '', thumbnailUrl: '', editionDate: '', description: '' })
    setEnewspaperPdfFile(null)
    setEnewspaperPdfPreview(null)
    if (enewspaperFileInputRef.current) enewspaperFileInputRef.current.value = ''
    setShowEnewspaperForm(false)
  }

  const handleSaveEnewspaper = async () => {
    if (!enewspaperForm.title || !enewspaperForm.editionDate || !enewspaperPdfFile) {
      toast({ title: 'Title, Edition Date and PDF file are required', variant: 'destructive' })
      return
    }
    try {
      setLoading(true)
      setUploadingEnewspaper(true)

      // Upload PDF first
      const formData = new FormData()
      formData.append('file', enewspaperPdfFile)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!uploadRes.ok) {
        const err = await uploadRes.json()
        throw new Error(err.error || 'Upload failed')
      }
      const uploadData = await uploadRes.json()
      setUploadingEnewspaper(false)

      // Save e-newspaper record
      const token = localStorage.getItem('token')
      const res = await fetch('/api/reporter/enewspaper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: enewspaperForm.title,
          editionDate: enewspaperForm.editionDate,
          pdfUrl: uploadData.url,
          thumbnailUrl: enewspaperForm.thumbnailUrl,
          description: enewspaperForm.description
        })
      })

      if (res.ok) {
        toast({ title: 'E-Newspaper Uploaded Successfully' })
        resetEnewspaperForm()
        loadAllEnewspapers()
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
      setUploadingEnewspaper(false)
    }
  }

  const handleDeleteEnewspaper = async (id) => {
    if (!confirm('Are you sure you want to delete this e-newspaper?')) return
    try {
      setLoading(true)
      await admin.deleteEnewspaper(id)
      toast({ title: 'E-Newspaper Deleted' })
      loadAllEnewspapers()
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleEnewspaper = async (id) => {
    try {
      await admin.toggleEnewspaper(id)
      loadAllEnewspapers()
      toast({ title: 'E-Newspaper Status Updated' })
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  // ===== SIDEBAR AD Handler =====
  const handleSaveSidebarAd = async () => {
    try {
      setLoading(true)
      await admin.updateSidebarAd(sidebarAdSettings)
      toast({ title: 'Sidebar Ad Settings Saved' })
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats
  const totalPending = pendingData.news.length + pendingData.businesses.length +
    pendingData.ads.length + pendingData.classifieds.length +
    pendingData.users.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Welcome back, {user?.name || 'Admin'}</p>
        </div>
        <Button onClick={loadPendingData} variant="outline" disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 lg:grid-cols-10 gap-1 h-auto p-1">
          <TabsTrigger value="overview" className="flex items-center gap-1 text-xs">
            <LayoutDashboard className="h-3 w-3" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>

          <TabsTrigger value="breaking" className="flex items-center gap-1 text-xs">
            <AlertCircle className="h-3 w-3" />
            <span className="hidden sm:inline">Breaking</span>
          </TabsTrigger>


          <TabsTrigger value="businesses" className="flex items-center gap-1 text-xs relative">
            <Building2 className="h-3 w-3" />
            <span className="hidden sm:inline">Business</span>
            {pendingData.businesses.length > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                {pendingData.businesses.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="classifieds" className="flex items-center gap-1 text-xs relative">
            <Tag className="h-3 w-3" />
            <span className="hidden sm:inline">Classifieds</span>
            {pendingData.classifieds.length > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                {pendingData.classifieds.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reporters" className="flex items-center gap-1 text-xs relative">
            <Users className="h-3 w-3" />
            <span className="hidden sm:inline">Reporters</span>
            {pendingData.users.length > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                {pendingData.users.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="enewspaper" className="flex items-center gap-1 text-xs">
            <FileText className="h-3 w-3" />
            <span className="hidden sm:inline">E-Paper</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-1 text-xs">
            <Monitor className="h-3 w-3" />
            <span className="hidden sm:inline">Content</span>
          </TabsTrigger>


          <TabsTrigger value="manage-news" className="flex items-center gap-1 text-xs bg-blue-50 relative">
            <Newspaper className="h-3 w-3 text-blue-600" />
            <span className="hidden sm:inline text-blue-700">Mgmt News</span>
            {pendingData.news.length > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                {pendingData.news.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1 text-xs">
            <Settings className="h-3 w-3" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>

        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Items</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-700">{totalPending}</div>
                <p className="text-xs text-orange-600">Awaiting your review</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending News</CardTitle>
                <Newspaper className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{pendingData.news.length}</div>
                <p className="text-xs text-blue-600">Articles to review</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Reporters</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{pendingData.users.length}</div>
                <p className="text-xs text-green-600">Registrations to approve</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Ads</CardTitle>
                <Megaphone className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700">{pendingData.ads.length}</div>
                <p className="text-xs text-purple-600">Ads to review</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-3">
                <Button variant="outline" onClick={() => setActiveTab('news')} className="justify-start">
                  <Newspaper className="h-4 w-4 mr-2" />
                  Review News ({pendingData.news.length})
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('reporters')} className="justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Approve Reporters ({pendingData.users.length})
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('breaking')} className="justify-start">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Manage Breaking News
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pending Breaking Ticker Approval */}
          {pendingTicker?.pendingText && pendingTicker?.pendingStatus === 'pending' && (
            <Card className="border-2 border-red-300 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-5 w-5 animate-pulse" />
                  Pending Breaking Ticker
                  <Badge className="bg-yellow-500 text-white ml-2">Awaiting Approval</Badge>
                </CardTitle>
                <CardDescription>A reporter has submitted a new breaking ticker for your approval</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Current Live Ticker */}
                  {pendingTicker?.text && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">CURRENT LIVE TICKER:</p>
                      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-3 rounded-lg text-sm">
                        {pendingTicker.text}
                      </div>
                    </div>
                  )}

                  {/* Pending Ticker */}
                  <div>
                    <p className="text-sm font-medium text-yellow-700 mb-2">PENDING FOR APPROVAL:</p>
                    <div className="bg-yellow-100 border-2 border-yellow-400 text-yellow-800 p-4 rounded-lg">
                      <p className="text-base font-medium">{pendingTicker.pendingText}</p>
                      <p className="text-xs text-yellow-600 mt-2">
                        Submitted by: {pendingTicker.pendingBy} on {new Date(pendingTicker.pendingAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleApproveTicker}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve & Go Live
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleRejectTicker}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      onClick={loadPendingTicker}
                      disabled={loadingPendingTicker}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${loadingPendingTicker ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>



        {/* Breaking News Tab */}
        <TabsContent value="breaking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Breaking News Bar
              </CardTitle>
              <CardDescription>Control the red scrolling ticker at the top of the website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium">Breaking News Ticker</p>
                    <p className="text-sm text-muted-foreground">Enable/disable the scrolling news bar</p>
                  </div>
                </div>
                <Switch
                  checked={breakingNews.enabled}
                  onCheckedChange={(checked) => setBreakingNews({ ...breakingNews, enabled: checked })}
                />
              </div>

              {breakingNews.enabled && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Label>Custom Breaking News Text (Optional)</Label>
                    <Textarea
                      placeholder="Enter custom breaking news text..."
                      value={breakingNews.text}
                      onChange={(e) => setBreakingNews({ ...breakingNews, text: e.target.value })}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Or Select Approved Articles for Breaking News</Label>
                    <ScrollArea className="h-[300px] border rounded-lg p-2">
                      {approvedNews.map((article) => (
                        <div
                          key={article.id}
                          className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-muted ${breakingNews.articleIds.includes(article.id) ? 'bg-red-50 border border-red-200' : ''
                            }`}
                          onClick={() => {
                            const ids = breakingNews.articleIds.includes(article.id)
                              ? breakingNews.articleIds.filter(id => id !== article.id)
                              : [...breakingNews.articleIds, article.id]
                            setBreakingNews({ ...breakingNews, articleIds: ids })
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={breakingNews.articleIds.includes(article.id)}
                            onChange={() => { }}
                            className="h-4 w-4"
                          />
                          <span className="flex-1 text-sm">{getTextValue(article.title)}</span>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>

                  <Button
                    className="w-full bg-red-600 hover:bg-red-700"
                    disabled={loading}
                    onClick={async () => {
                      setLoading(true)
                      try {
                        const token = localStorage.getItem('token')
                        const res = await fetch('/api/breaking-ticker', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({
                            enabled: breakingNews.enabled,
                            // Convert articleIds to texts (article titles)
                            texts: breakingNews.text
                              ? [breakingNews.text, ...breakingNews.articleIds.map(id => {
                                const article = approvedNews.find(a => a.id === id)
                                return article ? getTextValue(article.title) : null
                              }).filter(Boolean)]
                              : breakingNews.articleIds.map(id => {
                                const article = approvedNews.find(a => a.id === id)
                                return article ? getTextValue(article.title) : null
                              }).filter(Boolean)
                          })
                        })
                        if (res.ok) {
                          toast({ title: 'Breaking News Settings Saved!', description: 'The ticker will update on page refresh.' })
                        } else {
                          const data = await res.json()
                          toast({ title: 'Save Failed', description: data.error || 'Unknown error', variant: 'destructive' })
                        }
                      } catch (error) {
                        toast({ title: 'Save Failed', description: error.message, variant: 'destructive' })
                      } finally {
                        setLoading(false)
                      }
                    }}
                  >
                    {loading ? 'Saving...' : 'Save Breaking News Settings'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>



        {/* Navigation Tab */}
        <TabsContent value="navigation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Navigation Menu Management
              </CardTitle>
              <CardDescription>Add, remove, rename, and reorder navigation items</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new item */}
              <div className="flex items-end gap-2 p-4 bg-muted rounded-lg">
                <div className="flex-1 space-y-2">
                  <Label>Label</Label>
                  <Input
                    placeholder="Menu label"
                    value={newNavItem.label}
                    onChange={(e) => setNewNavItem({ ...newNavItem, label: e.target.value })}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Path</Label>
                  <Input
                    placeholder="e.g., news, businesses"
                    value={newNavItem.path}
                    onChange={(e) => setNewNavItem({ ...newNavItem, path: e.target.value })}
                  />
                </div>
                <Button onClick={addNavigationItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              <Separator />

              {/* Navigation items list */}
              <div className="space-y-2">
                {navigationItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg ${!item.active ? 'opacity-50' : ''}`}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    <span className="w-8 text-muted-foreground text-sm">{index + 1}</span>
                    <Input
                      value={item.label}
                      onChange={(e) => {
                        setNavigationItems(navigationItems.map(nav =>
                          nav.id === item.id ? { ...nav, label: e.target.value } : nav
                        ))
                      }}
                      className="flex-1"
                    />
                    <Input
                      value={item.path}
                      onChange={(e) => {
                        setNavigationItems(navigationItems.map(nav =>
                          nav.id === item.id ? { ...nav, path: e.target.value } : nav
                        ))
                      }}
                      className="flex-1"
                    />
                    <Switch
                      checked={item.active}
                      onCheckedChange={() => toggleNavigationItem(item.id)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeNavigationItem(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button className="w-full">Save Navigation Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Directory Tab */}
        <TabsContent value="businesses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Directory
              </CardTitle>
              <CardDescription>Manage business listings and approve submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingData.businesses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No pending business listings</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {pendingData.businesses.map((business) => (
                      <Card key={business.id} className="border-l-4 border-l-blue-400">
                        <CardContent className="p-4">
                          <h3 className="font-semibold">{business.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{business.description || 'No description'}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{business.category || 'General'}</Badge>
                          </div>
                          <Separator className="my-4" />
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleBusinessAction(business.id, 'approve')}
                              disabled={loading}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleBusinessAction(business.id, 'reject')}
                              disabled={loading}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Business Promotions / Leads Section */}
          <Card className="mt-6 border-blue-200">
            <CardHeader className="bg-blue-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Megaphone className="h-5 w-5" />
                    Promotion Requests
                  </CardTitle>
                  <CardDescription>Leads from "Promote Your Business" form</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadBusinessPromotions} disabled={loadingPromotions}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingPromotions ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {businessPromotions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No promotion requests found</p>
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  {businessPromotions.map((promo) => (
                    <Card key={promo.id} className={`border-l-4 ${promo.status === 'PENDING' ? 'border-l-yellow-500' : promo.status === 'CONTACTED' ? 'border-l-blue-500' : promo.status === 'APPROVED' ? 'border-l-green-500' : 'border-l-red-500'}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg">{promo.businessName}</h3>
                              <Badge variant={promo.status === 'PENDING' ? 'outline' : 'default'} className={
                                promo.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                  promo.status === 'CONTACTED' ? 'bg-blue-100 text-blue-800' :
                                    promo.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }>
                                {promo.status}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium mt-1 break-words line-clamp-2" title={promo.reason}>{promo.reason}</p>
                            <p className="text-sm font-medium text-gray-700 break-words">Owner: {promo.ownerName}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {promo.phone}</span>
                              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {promo.email}</span>
                            </div>
                            <p className="text-sm mt-2 break-all"><span className="font-semibold">Address:</span> {promo.address}</p>
                            {promo.description && (
                              <p className="text-sm mt-2 text-gray-600 bg-gray-50 p-2 rounded">"{promo.description}"</p>
                            )}
                            <p className="text-xs text-gray-400 mt-2">Submitted: {new Date(promo.submittedAt).toLocaleString()}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            {promo.status === 'PENDING' && (
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 w-full" onClick={() => handlePromotionAction(promo.id, 'contacted')}>
                                Mark Contacted
                              </Button>
                            )}
                            {promo.status !== 'APPROVED' && (
                              <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 w-full" onClick={() => handlePromotionAction(promo.id, 'approve')}>
                                <Check className="h-3 w-3 mr-1" /> Approve
                              </Button>
                            )}
                            {promo.status !== 'REJECTED' && (
                              <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 w-full" onClick={() => handlePromotionAction(promo.id, 'reject')}>
                                <X className="h-3 w-3 mr-1" /> Reject
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-600" onClick={() => handlePromotionAction(promo.id, 'delete')}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manage Business Directory Section (Merged) */}
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-green-600" />
                  Manage Business Directory
                </CardTitle>
                <CardDescription>Add, edit, enable/disable businesses</CardDescription>
              </div>
              <Button onClick={() => { resetBusinessForm(); setShowBusinessForm(true) }} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" /> Add Business
              </Button>
            </CardHeader>
            <CardContent>
              {/* Business Form Dialog */}
              <Dialog open={showBusinessForm} onOpenChange={setShowBusinessForm}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingBusiness ? 'Edit Business' : 'Add New Business'}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Business Name *</Label>
                        <Input value={businessForm.name} onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })} placeholder="Business name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Category *</Label>
                        <Select value={businessForm.category} onValueChange={(val) => setBusinessForm({ ...businessForm, category: val })}>
                          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                          <SelectContent>
                            {BUSINESS_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={businessForm.description} onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })} placeholder="Business description" rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input value={businessForm.phone} onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
                      </div>
                      <div className="space-y-2">
                        <Label>WhatsApp Number</Label>
                        <Input value={businessForm.whatsapp} onChange={(e) => setBusinessForm({ ...businessForm, whatsapp: e.target.value })} placeholder="+91 XXXXX XXXXX" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Website</Label>
                        <Input value={businessForm.website} onChange={(e) => setBusinessForm({ ...businessForm, website: e.target.value })} placeholder="www.example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label>Area</Label>
                        <Input value={businessForm.area} onChange={(e) => setBusinessForm({ ...businessForm, area: e.target.value })} placeholder="Koregaon Park, Baner..." />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Full Address</Label>
                      <Input value={businessForm.address} onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })} placeholder="Full address" />
                    </div>
                    <div className="space-y-2">
                      <Label>Google Maps Link</Label>
                      <Input value={businessForm.googleMapsLink} onChange={(e) => setBusinessForm({ ...businessForm, googleMapsLink: e.target.value })} placeholder="https://maps.google.com/..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Cover Image</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center bg-gray-50 hover:border-blue-400 transition-colors h-40 relative">
                        {businessForm.coverImage ? (
                          <>
                            <img src={businessForm.coverImage} alt="Cover" className="w-full h-full object-cover rounded" />
                            <button
                              type="button"
                              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full text-xs hover:bg-red-600"
                              onClick={() => setBusinessForm({ ...businessForm, coverImage: '' })}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-blue-500">
                            <Upload className="h-8 w-8 mb-2" />
                            <span className="text-sm">Upload Cover Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                if (file.size > 5 * 1024 * 1024) {
                                  toast({ title: 'Image must be under 5MB', variant: 'destructive' })
                                  return
                                }
                                try {
                                  const formData = new FormData()
                                  formData.append('file', file)
                                  const res = await fetch('/api/upload', { method: 'POST', body: formData })
                                  const data = await res.json()
                                  if (res.ok) {
                                    setBusinessForm({ ...businessForm, coverImage: data.url })
                                    toast({ title: 'Cover image uploaded!' })
                                  } else {
                                    toast({ title: 'Upload failed', variant: 'destructive' })
                                  }
                                } catch (err) {
                                  toast({ title: 'Upload failed', variant: 'destructive' })
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Gallery Images (up to 8)</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => {
                          const imgUrl = businessForm.images?.[index] || ''
                          return (
                            <div key={index} className="relative border-2 border-dashed border-gray-300 rounded-lg h-20 flex items-center justify-center overflow-hidden bg-gray-50 hover:border-blue-400 transition-colors">
                              {imgUrl ? (
                                <>
                                  <img src={imgUrl} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-0.5 text-xs hover:bg-red-600"
                                    onClick={() => {
                                      const newImages = [...(businessForm.images || [])]
                                      newImages[index] = ''
                                      setBusinessForm({ ...businessForm, images: newImages.filter(Boolean) })
                                    }}
                                  >✕</button>
                                </>
                              ) : (
                                <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-blue-500">
                                  <Upload className="h-5 w-5 mb-1" />
                                  <span className="text-[10px]">{index + 1}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0]
                                      if (!file) return
                                      if (file.size > 5 * 1024 * 1024) {
                                        toast({ title: 'Image must be under 5MB', variant: 'destructive' })
                                        return
                                      }
                                      try {
                                        const formData = new FormData()
                                        formData.append('file', file)
                                        const res = await fetch('/api/upload', { method: 'POST', body: formData })
                                        const data = await res.json()
                                        if (res.ok) {
                                          const newImages = [...(businessForm.images || [])]
                                          newImages[index] = data.url
                                          setBusinessForm({ ...businessForm, images: newImages })
                                          toast({ title: `Image ${index + 1} uploaded!` })
                                        } else {
                                          toast({ title: 'Upload failed', variant: 'destructive' })
                                        }
                                      } catch (err) {
                                        toast({ title: 'Upload failed', variant: 'destructive' })
                                      }
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">Click each slot to upload an image. Max 5MB per image.</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowBusinessForm(false)}>Cancel</Button>
                    <Button onClick={handleSaveBusiness} disabled={loading} className="bg-green-600">{loading ? 'Saving...' : (editingBusiness ? 'Update' : 'Create')}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Business List */}
              <div className="space-y-3">
                {allBusinesses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No businesses found. Add your first business above.</p>
                ) : (
                  allBusinesses.map(business => (
                    <div key={business.id} className={`border rounded-lg p-4 flex items-center justify-between ${business.enabled === false ? 'bg-gray-100 opacity-60' : ''}`}>
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={business.coverImage || business.cover_image || business.images?.[0] || business.image || 'https://via.placeholder.com/64'}
                            alt={business.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/64?text=Img'; }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-gray-900 truncate">{business.name}</h4>
                          <p className="text-sm text-muted-foreground truncate" title={`${business.category} • ${business.area || business.address}`}>
                            {business.category} • {business.area || business.address || 'No address'}
                          </p>
                          {business.phone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3" />{business.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <Badge variant={business.enabled === false ? 'secondary' : 'default'} className={business.enabled !== false ? 'bg-green-600 hover:bg-green-700' : ''}>
                          {business.enabled === false ? 'Disabled' : 'Enabled'}
                        </Badge>
                        <Switch checked={business.enabled !== false} onCheckedChange={() => handleToggleBusiness(business.id)} />
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEditBusiness(business)}>
                          <Edit className="h-4 w-4 text-blue-600" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteBusiness(business.id)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Classifieds Tab - Pending Approvals */}
        <TabsContent value="classifieds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Pending Classified Ads
                {pendingData.classifieds.length > 0 && (
                  <Badge className="bg-yellow-500 text-white ml-2">{pendingData.classifieds.length} Pending</Badge>
                )}
              </CardTitle>
              <CardDescription>Review and approve user-submitted classified advertisements</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingData.classifieds.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No pending classified ads</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {pendingData.classifieds.map((classified) => (
                      <Card key={classified.id} className="border-l-4 border-l-yellow-400 hover:shadow-md transition-shadow">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            {/* Small Thumbnail */}
                            <img
                              src={classified.image || classified.images?.[0] || 'https://via.placeholder.com/80'}
                              alt={classified.title}
                              style={{ width: 64, height: 64, minWidth: 64, maxWidth: 64 }}
                              className="rounded object-cover flex-shrink-0"
                            />

                            {/* Details - Compact */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="font-semibold text-sm truncate">{getTextValue(classified.title)}</h3>
                                <Badge className="bg-yellow-100 text-yellow-700 text-xs">PENDING</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{classified.description || 'No description'}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{classified.location || 'N/A'}</span>
                                <Phone className="h-3 w-3 ml-2" />
                                <span>{classified.phone || 'N/A'}</span>
                              </div>
                            </div>

                            {/* Actions - Right */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                size="sm"
                                onClick={() => handleClassifiedAction(classified.id, 'approve')}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700 h-8"
                              >
                                <Check className="h-4 w-4 mr-1" />Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleClassifiedAction(classified.id, 'reject')}
                                disabled={loading}
                                className="h-8"
                              >
                                <X className="h-4 w-4 mr-1" />Reject
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Manage Classifieds Section (Merged) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-yellow-600" />
                  Manage Classified Ads
                </CardTitle>
                <CardDescription>Add, edit, enable/disable classified ads</CardDescription>
              </div>
              <Button onClick={() => { resetClassifiedForm(); setShowClassifiedForm(true) }} className="bg-yellow-600 hover:bg-yellow-700">
                <Plus className="h-4 w-4 mr-2" /> Add Classified
              </Button>
            </CardHeader>
            <CardContent>
              {/* Classified Form Dialog */}
              <Dialog open={showClassifiedForm} onOpenChange={setShowClassifiedForm}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingClassified ? 'Edit Classified' : 'Add New Classified'}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input value={classifiedForm.title} onChange={(e) => setClassifiedForm({ ...classifiedForm, title: e.target.value })} placeholder="Ad title" />
                      </div>
                      <div className="space-y-2">
                        <Label>Category *</Label>
                        <Select value={classifiedForm.category} onValueChange={(val) => setClassifiedForm({ ...classifiedForm, category: val })}>
                          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                          <SelectContent>
                            {CLASSIFIED_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Price</Label>
                        <Input value={classifiedForm.price} onChange={(e) => setClassifiedForm({ ...classifiedForm, price: e.target.value })} placeholder="₹ 10,000" />
                      </div>
                      <div className="space-y-2">
                        <Label>Condition</Label>
                        <Select value={classifiedForm.condition} onValueChange={(val) => setClassifiedForm({ ...classifiedForm, condition: val })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="New">New</SelectItem>
                            <SelectItem value="Like New">Like New</SelectItem>
                            <SelectItem value="Excellent">Excellent</SelectItem>
                            <SelectItem value="Good">Good</SelectItem>
                            <SelectItem value="Fair">Fair</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={classifiedForm.description} onChange={(e) => setClassifiedForm({ ...classifiedForm, description: e.target.value })} placeholder="Detailed description" rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Seller Name</Label>
                        <Input value={classifiedForm.sellerName} onChange={(e) => setClassifiedForm({ ...classifiedForm, sellerName: e.target.value })} placeholder="Seller name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input value={classifiedForm.location} onChange={(e) => setClassifiedForm({ ...classifiedForm, location: e.target.value })} placeholder="Pune, Mumbai..." />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input value={classifiedForm.phone} onChange={(e) => setClassifiedForm({ ...classifiedForm, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
                      </div>
                      <div className="space-y-2">
                        <Label>WhatsApp Number</Label>
                        <Input value={classifiedForm.whatsapp} onChange={(e) => setClassifiedForm({ ...classifiedForm, whatsapp: e.target.value })} placeholder="+91 XXXXX XXXXX" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Image URLs (comma separated, up to 8)</Label>
                      <Textarea value={classifiedForm.images?.join(', ') || ''} onChange={(e) => setClassifiedForm({ ...classifiedForm, images: e.target.value.split(',').map(s => s.trim()).filter(Boolean).slice(0, 8) })} placeholder="https://image1.jpg, https://image2.jpg" rows={2} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowClassifiedForm(false)}>Cancel</Button>
                    <Button onClick={handleSaveClassified} disabled={loading} className="bg-yellow-600">{loading ? 'Saving...' : (editingClassified ? 'Update' : 'Create')}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Classified List */}
              <div className="space-y-3">
                {allClassifieds.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No classifieds found. Add your first classified above.</p>
                ) : (
                  <>
                    {/* Approved Section */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                        <Badge className="bg-green-500">Approved</Badge>
                        Approved Classified Ads
                      </h3>
                      {allClassifieds.filter(c => c.approval_status === 'approved' || c.approval_status === 'approved').length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No approved classifieds yet</p>
                      ) : (
                        allClassifieds.filter(c => c.approval_status === 'approved').map(classified => (
                          <div key={classified.id} className={`border rounded-lg p-4 flex items-center justify-between mb-2 border-l-4 border-l-green-500 ${classified.enabled === false ? 'bg-gray-100 opacity-60' : ''}`}>
                            <div className="flex items-center gap-4">
                              {(classified.images?.[0] || classified.image) && <img src={classified.images?.[0] || classified.image} alt="" style={{ width: 64, height: 64, minWidth: 64, maxWidth: 64 }} className="rounded object-cover flex-shrink-0" />}
                              <div>
                                <h4 className="font-semibold">{getTextValue(classified.title)}</h4>
                                <p className="text-sm text-muted-foreground">{classified.category} • {classified.location}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className="bg-green-100 text-green-700 text-xs">APPROVED</Badge>
                                  {classified.approvedAt && (
                                    <span className="text-xs text-muted-foreground">
                                      Approved: {new Date(classified.approved_at || classified.updated_at).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch checked={classified.enabled !== false} onCheckedChange={() => handleToggleClassified(classified.id)} />
                              <Button size="sm" variant="ghost" onClick={() => handleEditClassified(classified)}><Edit className="h-4 w-4" /></Button>
                              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDeleteClassified(classified.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <Separator className="my-6" />

                    {/* Pending Section */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                        <Badge className="bg-yellow-500">Pending</Badge>
                        Pending Review
                      </h3>
                      {allClassifieds.filter(c => c.approval_status === 'pending' || !c.approval_status).length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No pending classifieds</p>
                      ) : (
                        allClassifieds.filter(c => c.approval_status === 'pending' || !c.approval_status).map(classified => (
                          <div key={classified.id} className={`border rounded-lg p-4 flex items-center justify-between mb-2 border-l-4 border-l-yellow-400 ${classified.enabled === false ? 'bg-gray-100 opacity-60' : ''}`}>
                            <div className="flex items-center gap-4">
                              {(classified.images?.[0] || classified.image) && <img src={classified.images?.[0] || classified.image} alt="" style={{ width: 64, height: 64, minWidth: 64, maxWidth: 64 }} className="rounded object-cover flex-shrink-0" />}
                              <div>
                                <h4 className="font-semibold">{getTextValue(classified.title)}</h4>
                                <p className="text-sm text-muted-foreground">{classified.category} • {classified.location}</p>
                                <Badge className="bg-yellow-100 text-yellow-700 text-xs mt-1">PENDING</Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleClassifiedAction(classified.id, 'approve')}>
                                <Check className="h-4 w-4 mr-1" />Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleClassifiedAction(classified.id, 'reject')}>
                                <X className="h-4 w-4 mr-1" />Reject
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDeleteClassified(classified.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <Separator className="my-6" />

                    {/* Rejected Section */}
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                        <Badge className="bg-red-500">Rejected</Badge>
                        Rejected Ads
                      </h3>
                      {allClassifieds.filter(c => c.approval_status === 'rejected').length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No rejected classifieds</p>
                      ) : (
                        allClassifieds.filter(c => c.approval_status === 'rejected').map(classified => (
                          <div key={classified.id} className="border rounded-lg p-4 flex items-center justify-between mb-2 border-l-4 border-l-red-500 bg-red-50 opacity-70">
                            <div className="flex items-center gap-4">
                              {(classified.images?.[0] || classified.image) && <img src={classified.images?.[0] || classified.image} alt="" style={{ width: 64, height: 64, minWidth: 64, maxWidth: 64 }} className="rounded object-cover flex-shrink-0" />}
                              <div>
                                <h4 className="font-semibold">{getTextValue(classified.title)}</h4>
                                <p className="text-sm text-muted-foreground">{classified.category} • {classified.location}</p>
                                <Badge className="bg-red-100 text-red-700 text-xs mt-1">REJECTED</Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDeleteClassified(classified.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reporters Tab */}
        < TabsContent value="reporters" className="space-y-4" >
          {/* Reporter Applications Section (Merged) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-purple-600" />
                    Reporter Applications
                  </CardTitle>
                  <CardDescription>Review and manage reporter join requests</CardDescription>
                </div>
                <Button onClick={loadReporterApplications} variant="outline" size="sm">
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingReporterApps ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingReporterApps ? (
                <div className="text-center py-8 text-muted-foreground">Loading applications...</div>
              ) : reporterApplications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No reporter applications found</div>
              ) : (
                <div className="space-y-4">
                  {reporterApplications.map((app) => (
                    <Card key={app.id} className="border-l-4 border-l-purple-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg">{app.fullName}</h3>
                              <Badge variant={app.status === 'PENDING' ? 'outline' : app.status === 'CONTACTED' ? 'default' : 'destructive'}>
                                {app.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-500" />
                                <span>{app.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">Email:</span>
                                <span>{app.email}</span>
                              </div>
                            </div>
                            {app.experience && (
                              <p className="text-sm"><strong>Experience:</strong> {app.experience}</p>
                            )}
                            {app.portfolio && (
                              <p className="text-sm"><strong>Portfolio:</strong> <a href={app.portfolio} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{app.portfolio}</a></p>
                            )}
                            {app.reason && (
                              <p className="text-sm"><strong>Why join:</strong> {app.reason}</p>
                            )}
                            <p className="text-xs text-gray-500">Submitted: {new Date(app.submittedAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2">
                            {app.status === 'PENDING' && (
                              <>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleReporterAppAction(app.id, 'CONTACTED')}>
                                  <Check className="h-4 w-4 mr-1" /> Contact
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleReporterAppAction(app.id, 'REJECTED')}>
                                  <X className="h-4 w-4 mr-1" /> Reject
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="outline" onClick={() => handleDeleteReporterApp(app.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Reporter Approvals
              </CardTitle>
              <CardDescription>Approve or reject reporter registrations</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingData.users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No pending reporter registrations</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {pendingData.users.map((reporter) => (
                      <Card key={reporter.id} className="border-l-4 border-l-green-400">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{reporter.name}</h3>
                              <p className="text-sm text-muted-foreground">{reporter.email}</p>
                              <Badge variant="outline" className="mt-2">{reporter.role}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Registered: {new Date(reporter.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Separator className="my-4" />
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUserAction(reporter.id, 'approve')}
                              disabled={loading}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUserAction(reporter.id, 'reject')}
                              disabled={loading}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Create Reporter Section */}
          <Card className="border-green-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-green-600" />
                    Create Reporter Account
                  </CardTitle>
                  <CardDescription>Directly create a reporter account</CardDescription>
                </div>
                <Button
                  onClick={() => setShowCreateReporterForm(!showCreateReporterForm)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {showCreateReporterForm ? 'Cancel' : 'Add Reporter'}
                </Button>
              </div>
            </CardHeader>
            {showCreateReporterForm && (
              <CardContent>
                <div className="grid gap-4 p-4 border rounded-lg bg-gray-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reporterName">Full Name *</Label>
                      <Input
                        id="reporterName"
                        value={createReporterForm.name}
                        onChange={(e) => setCreateReporterForm({ ...createReporterForm, name: e.target.value })}
                        placeholder="Enter reporter name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reporterEmail">Email *</Label>
                      <Input
                        id="reporterEmail"
                        type="email"
                        value={createReporterForm.email}
                        onChange={(e) => setCreateReporterForm({ ...createReporterForm, email: e.target.value })}
                        placeholder="reporter@email.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reporterPhone">Phone</Label>
                      <Input
                        id="reporterPhone"
                        value={createReporterForm.phone}
                        onChange={(e) => setCreateReporterForm({ ...createReporterForm, phone: e.target.value })}
                        placeholder="+91 XXXXXXXXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reporterPassword">Password *</Label>
                      <Input
                        id="reporterPassword"
                        type="text"
                        value={createReporterForm.password}
                        onChange={(e) => setCreateReporterForm({ ...createReporterForm, password: e.target.value })}
                        placeholder="Enter password (min 8 characters)"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => {
                      setShowCreateReporterForm(false)
                      setCreateReporterForm({ name: '', email: '', phone: '', password: '' })
                    }}>
                      Cancel
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      disabled={creatingReporter || !createReporterForm.name || !createReporterForm.email || !createReporterForm.password || createReporterForm.password.length < 6}
                      onClick={async () => {
                        setCreatingReporter(true)
                        try {
                          const token = localStorage.getItem('token')
                          const res = await fetch('/api/admin/users/create-reporter', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify(createReporterForm)
                          })
                          const data = await res.json()
                          if (res.ok) {
                            toast({
                              title: 'Reporter Created!',
                              description: `${data.reporter.name} (${data.reporter.email})`
                            })
                            setShowCreateReporterForm(false)
                            setCreateReporterForm({ name: '', email: '', phone: '', password: '' })
                            loadAllReporters() // Refresh list
                          } else {
                            toast({ title: 'Error', description: data.error, variant: 'destructive' })
                          }
                        } catch (error) {
                          toast({ title: 'Error', description: error.message, variant: 'destructive' })
                        } finally {
                          setCreatingReporter(false)
                        }
                      }}
                    >
                      {creatingReporter ? 'Creating...' : 'Create Reporter'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* All Reporters List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    All Reporters ({allReporters.length})
                  </CardTitle>
                  <CardDescription>Manage all registered reporter accounts</CardDescription>
                </div>
                <Button onClick={loadAllReporters} variant="outline" size="sm" disabled={loadingAllReporters}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingAllReporters ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingAllReporters ? (
                <div className="text-center py-8 text-muted-foreground">Loading reporters...</div>
              ) : allReporters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No reporters found</p>
                  <p className="text-sm">Create a reporter account above</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allReporters.map((reporter) => (
                    <div key={reporter.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {reporter.name?.charAt(0)?.toUpperCase() || 'R'}
                        </div>
                        <div>
                          <h4 className="font-semibold">{reporter.name}</h4>
                          <p className="text-sm text-muted-foreground">{reporter.email}</p>
                          {reporter.phone && <p className="text-xs text-gray-500">{reporter.phone}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={reporter.status === 'active' ? 'default' : 'outline'} className={reporter.status === 'active' ? 'bg-green-600' : ''}>
                          {reporter.status}
                        </Badge>
                        <p className="text-xs text-gray-500">
                          Joined: {new Date(reporter.createdAt).toLocaleDateString()}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteReporter(reporter.id, reporter.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent >

        {/* E-Newspaper Tab */}
        < TabsContent value="enewspaper" className="space-y-4" >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                E-Newspaper Management
              </CardTitle>
              <CardDescription>Upload and manage PDF e-newspapers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Form */}
              <div className="border rounded-lg p-6 bg-gray-50">
                <h3 className="font-semibold mb-4">📘 Upload New E-Newspaper</h3>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Newspaper Title *</Label>
                    <Input
                      value={enewspaperForm.title}
                      onChange={(e) => setEnewspaperForm({ ...enewspaperForm, title: e.target.value })}
                      placeholder="e.g., Daily Edition"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Edition Date *</Label>
                    <Input
                      type="date"
                      value={enewspaperForm.editionDate}
                      onChange={(e) => setEnewspaperForm({ ...enewspaperForm, editionDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* PDF File Upload */}
                <div className="mb-4">
                  <Label className="block mb-2">Upload PDF File *</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    onClick={() => enewspaperFileInputRef.current?.click()}>
                    <input
                      type="file"
                      ref={enewspaperFileInputRef}
                      accept=".pdf"
                      onChange={handleEnewspaperFileChange}
                      className="hidden"
                    />
                    {enewspaperPdfFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="h-8 w-8 text-red-600" />
                        <div className="text-left">
                          <p className="font-medium">{enewspaperPdfFile.name}</p>
                          <p className="text-sm text-muted-foreground">{(enewspaperPdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); resetEnewspaperForm() }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-muted-foreground font-medium">Choose PDF File</p>
                        <p className="text-sm text-muted-foreground mt-1">Max size: 25MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* PDF Preview */}
                {enewspaperPdfPreview && (
                  <div className="mb-4">
                    <Label className="block mb-2">PDF Preview</Label>
                    <div className="border rounded-lg overflow-hidden bg-white">
                      <iframe
                        src={enewspaperPdfPreview}
                        className="w-full h-64"
                        title="PDF Preview"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  <Label>Thumbnail Image URL (Optional)</Label>
                  <Input
                    value={enewspaperForm.thumbnailUrl}
                    onChange={(e) => setEnewspaperForm({ ...enewspaperForm, thumbnailUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2 mb-4">
                  <Label>Description (Optional)</Label>
                  <Textarea
                    value={enewspaperForm.description}
                    onChange={(e) => setEnewspaperForm({ ...enewspaperForm, description: e.target.value })}
                    placeholder="Any additional notes..."
                    rows={2}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveEnewspaper}
                    disabled={loading || !enewspaperPdfFile}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {uploadingEnewspaper ? 'Uploading PDF...' : loading ? 'Saving...' : 'Upload E-Newspaper'}
                  </Button>
                  <Button variant="outline" onClick={resetEnewspaperForm}>Cancel</Button>
                </div>
              </div>

              <Separator />

              {/* Uploaded Papers List */}
              <div>
                <h4 className="font-medium mb-4">Uploaded E-Newspapers</h4>
                {allEnewspapers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No e-newspapers uploaded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allEnewspapers.map((paper) => (
                      <div key={paper.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-red-600" />
                          <div>
                            <h5 className="font-semibold">{paper.title}</h5>
                            <p className="text-sm text-muted-foreground">
                              Edition: {new Date(paper.editionDate).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              By: {paper.uploadedBy} | {new Date(paper.uploadedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline">View PDF</Button>
                          </a>
                          <Badge className={paper.approvalStatus === 'approved' ? 'bg-green-600' : paper.approvalStatus === 'rejected' ? 'bg-red-600' : 'bg-yellow-600'}>
                            {paper.approvalStatus}
                          </Badge>
                          {paper.approvalStatus === 'pending' && (
                            <>
                              <Button size="sm" className="bg-green-600" onClick={async () => {
                                const token = localStorage.getItem('token')
                                await fetch(`/api/admin/enewspaper/${paper.id}/approve`, {
                                  method: 'PUT',
                                  headers: { 'Authorization': `Bearer ${token}` }
                                })
                                loadAllEnewspapers()
                                toast({ title: 'E-Newspaper Approved' })
                              }}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={async () => {
                                const reason = prompt('Rejection reason (optional):')
                                const token = localStorage.getItem('token')
                                await fetch(`/api/admin/enewspaper/${paper.id}/reject`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                  body: JSON.stringify({ reason })
                                })
                                loadAllEnewspapers()
                                toast({ title: 'E-Newspaper Rejected' })
                              }}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDeleteEnewspaper(paper.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent >

        {/* Content Management Tab */}
        < TabsContent value="content" className="space-y-4" >
          {/* Premium Advertisement Banner */}
          < Card >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5 text-purple-600" />
                Header Advertisements
              </CardTitle>
              <CardDescription>Control the main advertisement banner on homepage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3">
                  <Megaphone className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Header Ad</p>
                    <p className="text-sm text-muted-foreground">Show/hide the top header advertisement</p>
                  </div>
                </div>
                <Switch
                  checked={contentSettings.premiumAd?.enabled}
                  onCheckedChange={(checked) => {
                    const updated = { ...contentSettings, premiumAd: { ...contentSettings.premiumAd, enabled: checked } }
                    setContentSettings(updated)
                    savePremiumAdSettings({ enabled: checked })
                    toast({ title: checked ? 'Premium Ad Enabled' : 'Premium Ad Disabled' })
                  }}
                />
              </div>

              {contentSettings.premiumAd?.enabled && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Ad Image URL or Upload</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://example.com/ad-image.jpg"
                          value={contentSettings.premiumAd?.imageUrl || ''}
                          onChange={(e) => setContentSettings({
                            ...contentSettings,
                            premiumAd: { ...contentSettings.premiumAd, imageUrl: e.target.value }
                          })}
                          className="flex-1"
                        />
                        <input
                          type="file"
                          ref={premiumAdImageRef}
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            if (file.size > 5 * 1024 * 1024) {
                              toast({ title: 'Image size must be under 5MB', variant: 'destructive' })
                              return
                            }
                            setUploadingPremiumAd(true)
                            try {
                              const formData = new FormData()
                              formData.append('file', file)
                              const res = await fetch('/api/upload', { method: 'POST', body: formData })
                              const data = await res.json()
                              if (res.ok) {
                                setContentSettings({
                                  ...contentSettings,
                                  premiumAd: { ...contentSettings.premiumAd, imageUrl: data.url }
                                })
                                toast({ title: 'Image uploaded!' })
                              }
                            } catch (err) {
                              toast({ title: 'Upload failed', variant: 'destructive' })
                            } finally {
                              setUploadingPremiumAd(false)
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          onClick={() => premiumAdImageRef.current?.click()}
                          disabled={uploadingPremiumAd}
                        >
                          {uploadingPremiumAd ? 'Uploading...' : '📁 Upload'}
                        </Button>
                        {contentSettings.premiumAd?.imageUrl && (
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => setContentSettings({
                              ...contentSettings,
                              premiumAd: { ...contentSettings.premiumAd, imageUrl: '' }
                            })}
                            title="Delete Image"
                          >
                            🗑️
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Ad Link URL</Label>
                      <Input
                        placeholder="https://advertiser-website.com"
                        value={contentSettings.premiumAd?.linkUrl || ''}
                        onChange={(e) => setContentSettings({
                          ...contentSettings,
                          premiumAd: { ...contentSettings.premiumAd, linkUrl: e.target.value }
                        })}
                      />
                    </div>
                  </div>

                  <Button
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={async () => {
                      const success = await savePremiumAdSettings(contentSettings.premiumAd)
                      if (success) {
                        toast({ title: 'Premium Ad Settings Saved to Database' })
                      } else {
                        toast({ title: 'Error saving settings', variant: 'destructive' })
                      }
                    }}
                  >
                    Save Premium Ad Settings
                  </Button>
                </>
              )}
            </CardContent>
          </Card >

          {/* Sidebar Advertisement - Numbered Images with Individual Destination URLs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5 text-blue-600" />
                Sidebar Advertisements
              </CardTitle>
              <CardDescription>Manage sidebar ad images - each image has its own destination URL (max 4 images)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <Megaphone className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Sidebar Ad</p>
                    <p className="text-sm text-muted-foreground">Show/hide the sidebar advertisement</p>
                  </div>
                </div>
                <Switch
                  checked={contentSettings.sidebarAd?.enabled}
                  onCheckedChange={(checked) => {
                    const updated = { ...contentSettings, sidebarAd: { ...contentSettings.sidebarAd, enabled: checked } }
                    setContentSettings(updated)
                    saveSidebarAdSettings({ enabled: checked })
                    toast({ title: checked ? 'Sidebar Ad Enabled' : 'Sidebar Ad Disabled' })
                  }}
                />
              </div>

              {contentSettings.sidebarAd?.enabled && (
                <>
                  {/* Numbered Image Cards */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Sidebar Ad Images (Square • Individual Links)</Label>
                    <p className="text-sm text-muted-foreground">Each image opens its own destination URL when clicked. Images display as 1:1 squares.</p>

                    <div className="grid grid-cols-2 gap-4">
                      {[0, 1, 2, 3].map((index) => {
                        const item = contentSettings.sidebarAd?.items?.[index] || { imageUrl: '', destinationUrl: '' }
                        const hasImage = item.imageUrl && item.imageUrl.trim() !== ''

                        return (
                          <Card key={index} className={`border-2 ${hasImage ? 'border-blue-300 bg-blue-50/50' : 'border-dashed border-gray-300'}`}>
                            <CardContent className="p-4 space-y-3">
                              {/* Image Number Label */}
                              <div className="flex items-center justify-between">
                                <Badge className="bg-blue-600 text-white">Image {index + 1}</Badge>
                                {hasImage && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                                    onClick={() => {
                                      const items = [...(contentSettings.sidebarAd?.items || [])]
                                      items[index] = { imageUrl: '', destinationUrl: '' }
                                      setContentSettings({
                                        ...contentSettings,
                                        sidebarAd: { ...contentSettings.sidebarAd, items }
                                      })
                                    }}
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Remove
                                  </Button>
                                )}
                              </div>

                              {/* Rectangle Image Preview - Smaller */}
                              <div className="h-24 w-full bg-gray-100 rounded-lg overflow-hidden border relative">
                                {hasImage ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={`Ad ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                    <Image className="h-6 w-6 mb-1" />
                                    <span className="text-xs">No Image</span>
                                  </div>
                                )}
                              </div>

                              {/* Image URL Input */}
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Image URL</Label>
                                <div className="flex gap-1">
                                  <Input
                                    placeholder="Paste image URL..."
                                    value={item.imageUrl}
                                    onChange={(e) => {
                                      const items = [...(contentSettings.sidebarAd?.items || [{}, {}, {}, {}].slice(0, 4))]
                                      while (items.length <= index) items.push({ imageUrl: '', destinationUrl: '' })
                                      items[index] = { ...items[index], imageUrl: e.target.value }
                                      setContentSettings({
                                        ...contentSettings,
                                        sidebarAd: { ...contentSettings.sidebarAd, items }
                                      })
                                    }}
                                    className="text-xs h-8"
                                  />
                                  <input
                                    type="file"
                                    id={`sidebar-upload-${index}`}
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0]
                                      if (!file) return
                                      if (file.size > 5 * 1024 * 1024) {
                                        toast({ title: 'Image size must be under 5MB', variant: 'destructive' })
                                        return
                                      }
                                      try {
                                        const formData = new FormData()
                                        formData.append('file', file)
                                        const res = await fetch('/api/upload', { method: 'POST', body: formData })
                                        const data = await res.json()
                                        if (res.ok) {
                                          const items = [...(contentSettings.sidebarAd?.items || [{}, {}, {}, {}].slice(0, 4))]
                                          while (items.length <= index) items.push({ imageUrl: '', destinationUrl: '' })
                                          items[index] = { ...items[index], imageUrl: data.url }
                                          setContentSettings({
                                            ...contentSettings,
                                            sidebarAd: { ...contentSettings.sidebarAd, items }
                                          })
                                          toast({ title: `Image ${index + 1} uploaded!` })
                                        }
                                      } catch (err) {
                                        toast({ title: 'Upload failed', variant: 'destructive' })
                                      }
                                    }}
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={() => document.getElementById(`sidebar-upload-${index}`)?.click()}
                                  >
                                    📁
                                  </Button>
                                </div>
                              </div>

                              {/* Destination URL Input */}
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Destination URL (Click opens this link)</Label>
                                <Input
                                  placeholder="https://advertiser-website.com"
                                  value={item.destinationUrl}
                                  onChange={(e) => {
                                    const items = [...(contentSettings.sidebarAd?.items || [{}, {}, {}, {}].slice(0, 4))]
                                    while (items.length <= index) items.push({ imageUrl: '', destinationUrl: '' })
                                    items[index] = { ...items[index], destinationUrl: e.target.value }
                                    setContentSettings({
                                      ...contentSettings,
                                      sidebarAd: { ...contentSettings.sidebarAd, items }
                                    })
                                  }}
                                  className="text-xs h-8"
                                />
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      saveSidebarAdSettings(contentSettings.sidebarAd)
                      toast({ title: 'Sidebar Ad Settings Saved' })
                    }}
                  >
                    Save Sidebar Ad Settings
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Inner Page Advertisements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-pink-600" />
                Inner Page Advertisements
              </CardTitle>
              <CardDescription>Manage ads shown on article/news detail pages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Article Ad Banner (Pink/Purple - Advertise Your Business) */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Article Ad Banner</h4>
                    <p className="text-sm text-muted-foreground">Pink/purple "Advertise Your Business" banner</p>
                  </div>
                  <Switch
                    checked={contentSettings.articleAd?.banner?.enabled ?? true}
                    onCheckedChange={(checked) => {
                      const updated = {
                        ...contentSettings,
                        articleAd: {
                          ...contentSettings.articleAd,
                          banner: { ...contentSettings.articleAd?.banner, enabled: checked }
                        }
                      }
                      setContentSettings(updated)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com/banner.jpg"
                      value={contentSettings.articleAd?.banner?.imageUrl || ''}
                      onChange={(e) => {
                        const updated = {
                          ...contentSettings,
                          articleAd: {
                            ...contentSettings.articleAd,
                            banner: { ...contentSettings.articleAd?.banner, imageUrl: e.target.value }
                          }
                        }
                        setContentSettings(updated)
                      }}
                      className="flex-1"
                    />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (event) => {
                              const updated = {
                                ...contentSettings,
                                articleAd: {
                                  ...contentSettings.articleAd,
                                  banner: { ...contentSettings.articleAd?.banner, imageUrl: event.target.result }
                                }
                              }
                              setContentSettings(updated)
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span><Upload className="h-4 w-4 mr-1" /> Upload</span>
                      </Button>
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Click/Destination URL</Label>
                  <Input
                    placeholder="https://example.com/advertiser-site"
                    value={contentSettings.articleAd?.banner?.linkUrl || ''}
                    onChange={(e) => {
                      const updated = {
                        ...contentSettings,
                        articleAd: {
                          ...contentSettings.articleAd,
                          banner: { ...contentSettings.articleAd?.banner, linkUrl: e.target.value }
                        }
                      }
                      setContentSettings(updated)
                    }}
                  />
                </div>
              </div>

              {/* Article Sticky Ad (Bottom sticky - Premium Ad Space) */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Article Sticky Ad</h4>
                    <p className="text-sm text-muted-foreground">Bottom sticky "Premium Ad Space" banner (300x400)</p>
                  </div>
                  <Switch
                    checked={contentSettings.articleAd?.sticky?.enabled ?? true}
                    onCheckedChange={(checked) => {
                      const updated = {
                        ...contentSettings,
                        articleAd: {
                          ...contentSettings.articleAd,
                          sticky: { ...contentSettings.articleAd?.sticky, enabled: checked }
                        }
                      }
                      setContentSettings(updated)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com/sticky-ad.jpg"
                      value={contentSettings.articleAd?.sticky?.imageUrl || ''}
                      onChange={(e) => {
                        const updated = {
                          ...contentSettings,
                          articleAd: {
                            ...contentSettings.articleAd,
                            sticky: { ...contentSettings.articleAd?.sticky, imageUrl: e.target.value }
                          }
                        }
                        setContentSettings(updated)
                      }}
                      className="flex-1"
                    />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (event) => {
                              const updated = {
                                ...contentSettings,
                                articleAd: {
                                  ...contentSettings.articleAd,
                                  sticky: { ...contentSettings.articleAd?.sticky, imageUrl: event.target.result }
                                }
                              }
                              setContentSettings(updated)
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span><Upload className="h-4 w-4 mr-1" /> Upload</span>
                      </Button>
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Click/Destination URL</Label>
                  <Input
                    placeholder="https://example.com/advertiser-site"
                    value={contentSettings.articleAd?.sticky?.linkUrl || ''}
                    onChange={(e) => {
                      const updated = {
                        ...contentSettings,
                        articleAd: {
                          ...contentSettings.articleAd,
                          sticky: { ...contentSettings.articleAd?.sticky, linkUrl: e.target.value }
                        }
                      }
                      setContentSettings(updated)
                    }}
                  />
                </div>
              </div>

              {/* Save Button */}
              <Button
                className="w-full bg-pink-600 hover:bg-pink-700"
                onClick={() => {
                  saveContentSettings(contentSettings)
                  toast({ title: 'Article Page Ads Saved' })
                }}
              >
                Save Inner Page Ad Settings
              </Button>
            </CardContent>
          </Card>

          {/* Homepage Business Sidebar Ad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-orange-600" />
                Homepage Business Sidebar Ad
              </CardTitle>
              <CardDescription>Manage the "BUSINESS Advertisement" sidebar on homepage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-3">
                  <Megaphone className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium">Business Ad Section</p>
                    <p className="text-sm text-muted-foreground">Show/hide the BUSINESS sidebar on homepage</p>
                  </div>
                </div>
                <Switch
                  checked={contentSettings.businessAd?.enabled}
                  onCheckedChange={(checked) => {
                    setContentSettings({
                      ...contentSettings,
                      businessAd: { ...contentSettings.businessAd, enabled: checked }
                    })
                  }}
                />
              </div>

              {contentSettings.businessAd?.enabled && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Title (e.g., BUSINESS)</Label>
                      <Input
                        placeholder="BUSINESS"
                        value={contentSettings.businessAd?.title || ''}
                        onChange={(e) => setContentSettings({
                          ...contentSettings,
                          businessAd: { ...contentSettings.businessAd, title: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Subtitle</Label>
                      <Input
                        placeholder="Advertisement"
                        value={contentSettings.businessAd?.subtitle || ''}
                        onChange={(e) => setContentSettings({
                          ...contentSettings,
                          businessAd: { ...contentSettings.businessAd, subtitle: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Button Text</Label>
                      <Input
                        placeholder="POST YOUR AD"
                        value={contentSettings.businessAd?.buttonText || ''}
                        onChange={(e) => setContentSettings({
                          ...contentSettings,
                          businessAd: { ...contentSettings.businessAd, buttonText: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Button Link URL</Label>
                      <Input
                        placeholder="https://wa.me/91XXXXXXXXXX"
                        value={contentSettings.businessAd?.linkUrl || ''}
                        onChange={(e) => setContentSettings({
                          ...contentSettings,
                          businessAd: { ...contentSettings.businessAd, linkUrl: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Custom Image URL (Optional - replaces default gradient)</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://example.com/business-ad.jpg"
                        value={contentSettings.businessAd?.imageUrl || ''}
                        onChange={(e) => setContentSettings({
                          ...contentSettings,
                          businessAd: { ...contentSettings.businessAd, imageUrl: e.target.value }
                        })}
                        className="flex-1"
                      />
                      <input
                        type="file"
                        id="business-ad-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          if (file.size > 5 * 1024 * 1024) {
                            toast({ title: 'Image size must be under 5MB', variant: 'destructive' })
                            return
                          }
                          try {
                            const formData = new FormData()
                            formData.append('file', file)
                            const res = await fetch('/api/upload', { method: 'POST', body: formData })
                            const data = await res.json()
                            if (res.ok) {
                              setContentSettings({
                                ...contentSettings,
                                businessAd: { ...contentSettings.businessAd, imageUrl: data.url }
                              })
                              toast({ title: 'Business Ad Image uploaded!' })
                            }
                          } catch (err) {
                            toast({ title: 'Upload failed', variant: 'destructive' })
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('business-ad-upload')?.click()}
                      >
                        📁 Upload
                      </Button>
                    </div>
                  </div>
                  <Button
                    className="bg-orange-600 hover:bg-orange-700 w-full"
                    onClick={() => {
                      saveBusinessAdSettings(contentSettings.businessAd)
                      toast({ title: 'Business Sidebar Ad Settings Saved' })
                    }}
                  >
                    Save Business Ad Settings
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Trending News Section */}
          < Card >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                Trending News Section
              </CardTitle>
              <CardDescription>Control the trending news section on homepage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium">Trending Section</p>
                    <p className="text-sm text-muted-foreground">Show/hide the trending news section</p>
                  </div>
                </div>
                <Switch
                  checked={contentSettings.trending?.enabled}
                  onCheckedChange={(checked) => {
                    const updated = { ...contentSettings, trending: { ...contentSettings.trending, enabled: checked } }
                    setContentSettings(updated)
                    saveTrendingSettings({ enabled: checked })
                    toast({ title: checked ? 'Trending Section Enabled' : 'Trending Section Disabled' })
                  }}
                />
              </div>

              {contentSettings.trending?.enabled && (
                <>
                  <div className="space-y-2">
                    <Label>Select Trending News Articles</Label>
                    <p className="text-sm text-muted-foreground">Check articles to mark them as trending</p>
                  </div>
                  <ScrollArea className="h-[300px] border rounded-lg p-2">
                    {approvedNews.length > 0 ? approvedNews.map((article) => {
                      const isTrending = (contentSettings.trending?.newsIds || []).includes(article.id)
                      return (
                        <div
                          key={article.id}
                          className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-muted ${isTrending ? 'bg-orange-50 border border-orange-200' : ''
                            }`}
                          onClick={() => {
                            const newsIds = isTrending
                              ? (contentSettings.trending?.newsIds || []).filter(id => id !== article.id)
                              : [...(contentSettings.trending?.newsIds || []), article.id]
                            const updated = { ...contentSettings, trending: { ...contentSettings.trending, newsIds } }
                            setContentSettings(updated)
                            markNewsAsTrending(article.id, !isTrending)
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isTrending}
                            onChange={() => { }}
                            className="h-4 w-4"
                          />
                          <span className="flex-1 text-sm">{getTextValue(article.title)}</span>
                          {isTrending && <Badge className="bg-orange-500">Trending</Badge>}
                        </div>
                      )
                    }) : (
                      <p className="text-center py-4 text-muted-foreground">No approved news articles found</p>
                    )}
                  </ScrollArea>
                  <Button
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    onClick={() => {
                      saveTrendingSettings(contentSettings.trending)
                      toast({ title: 'Trending Settings Saved', description: `${(contentSettings.trending?.newsIds || []).length} articles marked as trending` })
                    }}
                  >
                    Save Trending Settings
                  </Button>
                </>
              )}
            </CardContent>
          </Card >
        </TabsContent >

        {/* Manage Businesses Tab - Full CRUD */}


        {/* Manage Classifieds Tab - Full CRUD */}


        {/* Manage News Tab - Full CRUD */}
        < TabsContent value="manage-news" className="space-y-4" >
          {/* News Moderation Section (Merged) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                News Moderation
                {pendingData.news.length > 0 && (
                  <Badge className="bg-yellow-500 text-white ml-2">{pendingData.news.length} Pending</Badge>
                )}
              </CardTitle>
              <CardDescription>Review and approve news articles submitted by reporters</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingData.news.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No pending news articles</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {pendingData.news.map((article) => (
                      <div key={article.id} className="border rounded-lg p-3 border-l-4 border-l-yellow-400 hover:shadow-md transition-shadow flex items-center gap-4">
                        {/* Image - Fixed 80x60 */}
                        <div className="flex-shrink-0 w-[80px] h-[60px] bg-gray-100 rounded overflow-hidden">
                          {article.mainImage ? (
                            <img
                              src={article.mainImage}
                              alt={getTextValue(article.title)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <Newspaper className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Content - Center */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{getTextValue(article.title)}</h3>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">

                            <Badge variant="outline" className="text-xs">{article.category || article.genre || 'Article'}</Badge>
                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              Posted By: {article.authorName || 'Reporter'}
                            </span>
                            <Badge className="bg-yellow-100 text-yellow-700 text-xs">PENDING</Badge>
                            <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Actions - Right */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Load article into news form for editing
                              setNewsForm({
                                title: getTextValue(article.title),
                                content: getTextValue(article.content),
                                category: article.category || article.categoryId || 'City News',
                                mainImage: article.mainImage || '',
                                youtubeUrl: article.youtubeUrl || article.videoUrl || '',
                                thumbnails: article.thumbnails || (article.thumbnailUrl ? [article.thumbnailUrl] : []),
                                thumbnailUrl: article.thumbnailUrl || '',
                                metaDescription: article.metaDescription || '',
                                tags: Array.isArray(article.tags) ? article.tags.join(', ') : (article.tags || ''),
                                featured: article.featured || false,
                                showOnHome: article.showOnHome !== false
                              })
                              setEditingNews(article)
                              setShowNewsForm(true)
                            }}
                            disabled={loading}
                            className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleNewsAction(article.id, 'approve')}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleNewsAction(article.id, 'reject')}
                            disabled={loading}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-blue-600" />
                  Manage All News
                </CardTitle>
                <CardDescription>Add, edit, enable/disable, feature news for home page</CardDescription>
              </div>
              <Button onClick={() => { resetNewsForm(); setShowNewsForm(true) }} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" /> Add News
              </Button>
            </CardHeader>
            <CardContent>


              {/* News List */}
              <div className="space-y-3">
                {allNews.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No news articles found. Add your first article above.</p>
                ) : (
                  allNews.map(article => (
                    <div key={article.id} className={`border rounded-lg p-3 flex items-center gap-4 h-[80px] ${article.enabled === false ? 'bg-gray-100 opacity-60' : ''} ${article.featured ? 'border-l-4 border-l-yellow-400 bg-yellow-50' : 'border-l-4 border-l-blue-400'}`}>
                      {/* Image - Fixed 80x60 */}
                      <div className="flex-shrink-0 w-[80px] h-[60px] bg-gray-100 rounded overflow-hidden">
                        {article.mainImage ? (
                          <img src={article.mainImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <Newspaper className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Content - Center */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm truncate">{getTextValue(article.title)}</h4>
                          {article.featured && <Badge className="bg-yellow-500 text-xs"><Star className="h-3 w-3 mr-1" />Featured</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">

                          <Badge variant="outline" className="text-xs">{article.category || article.categoryId}</Badge>
                          <Badge className={`text-xs ${article.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' : article.approvalStatus === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {article.approvalStatus?.toUpperCase() || 'PENDING'}
                          </Badge>
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            Posted By: {article.authorName || 'Admin'}
                          </span>
                          <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Actions - Right */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button size="sm" variant={article.featured ? "default" : "outline"} onClick={() => handleToggleNewsFeatured(article.id)} title="Toggle Featured" className="h-8 w-8 p-0">
                          <Star className={`h-4 w-4 ${article.featured ? 'fill-current' : ''}`} />
                        </Button>
                        <Switch checked={article.enabled !== false} onCheckedChange={() => handleToggleNews(article.id)} />
                        <Button size="sm" variant="ghost" onClick={() => handleEditNews(article)} className="h-8 w-8 p-0"><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-red-600 h-8 w-8 p-0" onClick={() => handleDeleteNews(article.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent >

        {/* Settings Tab */}
        < TabsContent value="settings" className="space-y-4" >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your admin account password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Username:</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role:</span>
                  <Badge>{user?.role}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent >


      </Tabs >

      {/* Global News Form Dialog - Works from any tab */}
      < Dialog open={showNewsForm} onOpenChange={setShowNewsForm} >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNews ? 'Edit News Article' : 'Publish New Article'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={newsForm.title} onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })} placeholder="Article title" />
            </div>
            <div className="space-y-2">
              <Label>Category * (Mandatory)</Label>
              <Select value={newsForm.category} onValueChange={(val) => setNewsForm({ ...newsForm, category: val })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {['Crime', 'Politics', 'Education', 'Sports', 'Entertainment', 'Trending', 'Business', 'Nation', 'City News', 'Murder', 'General'].map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea value={newsForm.content} onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })} placeholder="Full article content..." rows={6} />
            </div>
            <div className="space-y-2">
              <Label>Main Image URL</Label>
              <div className="flex gap-2">
                <Input value={newsForm.mainImage} onChange={(e) => setNewsForm({ ...newsForm, mainImage: e.target.value })} placeholder="https://example.com/image.jpg" className="flex-1" />
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (event) => {
                          setNewsForm({ ...newsForm, mainImage: event.target.result })
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span><Upload className="h-4 w-4 mr-1" /> Upload</span>
                  </Button>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Thumbnail URLs (Max 3)</Label>
              <div className="space-y-2">
                {(newsForm.thumbnails || (newsForm.thumbnailUrl ? [newsForm.thumbnailUrl] : [])).map((thumb, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <Input
                      value={thumb}
                      onChange={(e) => {
                        const newThumbs = [...(newsForm.thumbnails || [])]
                        newThumbs[idx] = e.target.value
                        setNewsForm({ ...newsForm, thumbnails: newThumbs })
                      }}
                      placeholder={`Thumbnail URL ${idx + 1}`}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500"
                      onClick={() => {
                        const newThumbs = (newsForm.thumbnails || []).filter((_, i) => i !== idx)
                        setNewsForm({ ...newsForm, thumbnails: newThumbs, thumbnailUrl: newThumbs[0] || '' })
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {(newsForm.thumbnails?.length || 0) < 3 && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add new thumbnail URL"
                      className="flex-1"
                      value=""
                      onChange={(e) => {
                        const val = e.target.value
                        if (val) {
                          const newThumbs = [...(newsForm.thumbnails || []), val]
                          setNewsForm({ ...newsForm, thumbnails: newThumbs, thumbnailUrl: newThumbs[0] })
                        }
                      }}
                    />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (event) => {
                              const newThumbs = [...(newsForm.thumbnails || []), event.target.result]
                              setNewsForm({ ...newsForm, thumbnails: newThumbs, thumbnailUrl: newThumbs[0] })
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span><Upload className="h-4 w-4 mr-1" /> Add</span>
                      </Button>
                    </label>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Add up to 3 images for rotating thumbnail effect</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>YouTube Video URL (optional)</Label>
              <Input value={newsForm.youtubeUrl} onChange={(e) => setNewsForm({ ...newsForm, youtubeUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
            </div>
            <div className="space-y-2">
              <Label>Meta Description</Label>
              <Input value={newsForm.metaDescription} onChange={(e) => setNewsForm({ ...newsForm, metaDescription: e.target.value })} placeholder="Brief description for SEO" />
            </div>
            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input value={newsForm.tags} onChange={(e) => setNewsForm({ ...newsForm, tags: e.target.value })} placeholder="politics, pune, breaking" />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox id="gfeatured" checked={newsForm.featured} onCheckedChange={(c) => setNewsForm({ ...newsForm, featured: c })} />
                <Label htmlFor="gfeatured">Featured Article</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="gshowHome" checked={newsForm.showOnHome} onCheckedChange={(c) => setNewsForm({ ...newsForm, showOnHome: c })} />
                <Label htmlFor="gshowHome">Show on Home Page</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewsForm(false)}>Cancel</Button>
            <Button onClick={handleSaveNews} disabled={loading} className="bg-blue-600">{loading ? 'Saving...' : (editingNews ? 'Update' : 'Publish')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >
    </div >
  )
}

export default AdminDashboard
