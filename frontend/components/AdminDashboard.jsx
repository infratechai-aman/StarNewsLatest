'use client'

import { useState, useEffect, useRef } from 'react'
import AdminShortsPanel from './AdminShortsPanel';
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
import { admin, news, auth, categories, authenticatedFetch, getFreshToken } from '@/lib/api'
import {
  getContentSettings, saveContentSettings, savePremiumAdSettings, saveSidebarAdSettings,
  saveTrendingSettings, markNewsAsTrending, getTrendingNewsIds, saveArticleAdSettings, saveBusinessAdSettings
} from '@/lib/contentStore'
import {
  LayoutDashboard, Newspaper, AlertCircle, Megaphone, Navigation,
  Building2, Tag, Users, FileText, Settings, Eye, EyeOff, Check, X,
  Edit, Trash2, Plus, PlusCircle, GripVertical, RefreshCw, Lock, Bell,
  TrendingUp, TrendingDown, Database, Clock, CheckCircle, XCircle, AlertTriangle, Image, Link, Monitor,
  Phone, MapPin, Globe, MessageCircle, Star, Home, UserPlus, Upload, Video, User, Mail, Calendar, Shield, MoreHorizontal,
  LogOut
} from 'lucide-react'
import { POPULAR_CITIES, INDIAN_CITIES_SORTED } from '@/lib/indianCities'

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

const AdminDashboard = ({ user, toast, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [pendingSubTab, setPendingSubTab] = useState('businesses')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout()
    } else {
      localStorage.removeItem('token')
      localStorage.removeItem('reporterUser')
      window.location.href = '/'
    }
  }

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
  const [reporterAppFilter, setReporterAppFilter] = useState('ALL')

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
    title: '', category: '', city: '', content: '', mainImage: '', metaDescription: '',
    tags: '', genre: 'breaking', featured: false, showOnHome: true,
    youtubeUrl: '', thumbnails: [], authorName: ''
  })
  const [newThumbInput, setNewThumbInput] = useState('')

  const [showEnewspaperForm, setShowEnewspaperForm] = useState(false)
  const [enewspaperForm, setEnewspaperForm] = useState({
    title: '', thumbnailUrl: '', editionDate: '', description: ''
  })
  const [enewspaperPdfFile, setEnewspaperPdfFile] = useState(null)
  const [enewspaperPdfPreview, setEnewspaperPdfPreview] = useState(null)
  const [uploadingEnewspaper, setUploadingEnewspaper] = useState(false)
  const enewspaperFileInputRef = useRef(null)

  // Live TV State
  const [liveTVConfig, setLiveTVConfig] = useState({
    enabled: false, streams: [], primaryStreamId: null
  })
  const [liveTVForm, setLiveTVForm] = useState({ title: '', url: '', isLive: false })
  const [loadingLiveTV, setLoadingLiveTV] = useState(false)
  const [editingStream, setEditingStream] = useState(null)

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
  const loadPendingData = async (fresh = false) => {
    try {
      setRefreshing(true)
      const data = await admin.getPending(fresh)
      setPendingData(data)
    } catch (error) {
      // console.error('Failed to load pending data:', error)
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
      // console.error('Failed to load approved news:', error)
    }
  }

  const DEFAULT_NAV_ITEMS = [
    { id: '1', label: 'Home', path: 'home', order: 1, active: true },
    { id: '2', label: 'News', path: 'news', order: 2, active: true },
    { id: '3', label: 'E-Newspaper', path: 'enewspaper', order: 3, active: true },
    { id: '4', label: 'Classifieds', path: 'classifieds', order: 4, active: true },
    { id: '5', label: 'Business Directory', path: 'businesses', order: 5, active: true },
    { id: '6', label: 'Live TV', path: 'live-tv', order: 6, active: true }
  ]

  const loadNavigation = async () => {
    try {
      const data = await admin.getNavigation()
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        setNavigationItems(data.items)
      } else {
        // Fallback to defaults if API returns nothing
        setNavigationItems(DEFAULT_NAV_ITEMS)
      }
    } catch (error) {
      // Silently fall back to defaults if API fails
      setNavigationItems(DEFAULT_NAV_ITEMS)
    }
  }

  useEffect(() => {
    loadPendingData()
    loadApprovedNews()
    loadNavigation() // Load navigation from API instead of hardcoding
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
      const appItem = pendingData.users?.find(u => u.id === userId && u.isApplication)
      if (appItem) {
        await handleReporterAppAction(userId, action === 'approve' ? 'APPROVED' : 'REJECTED')
        return
      }
      await admin.approveUser(userId, action)
      toast({
        title: action === 'approve' ? 'User Approved' : 'User Rejected',
        description: action === 'approve' ? 'User can now access their dashboard.' : 'User account rejected.'
      })
      await Promise.all([
        loadPendingData(true),
        loadAllReporters(),
        loadReporterApplications()
      ])
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
      // fix(DEFECT-11): Fixed field names to match API contract (oldPassword, not currentPassword)
      await auth.changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
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
      // console.error('Failed to load businesses:', error)
    }
  }

  const loadAllClassifieds = async () => {
    try {
      const data = await admin.getClassifieds()
      setAllClassifieds(data || [])
    } catch (error) {
      // console.error('Failed to load classifieds:', error)
    }
  }

  const loadAllNews = async () => {
    try {
      const data = await admin.getNews()
      setAllNews(data || [])
    } catch (error) {
      // console.error('Failed to load news:', error)
    }
  }

  const loadAllEnewspapers = async () => {
    try {
      const res = await authenticatedFetch('/api/admin/enewspaper')
      const data = await res.json()
      setAllEnewspapers(data.papers || [])
    } catch (error) {
      // console.error('Failed to load e-newspapers:', error)
    }
  }

  const loadSidebarAd = async () => {
    try {
      const data = await admin.getSidebarAd()
      setSidebarAdSettings(data || { enabled: true, imageUrl: '', linkUrl: '', whatsappNumber: '', title: '' })
    } catch (error) {
      // console.error('Failed to load sidebar ad:', error)
    }
  }

  // Load reporter applications
  const loadReporterApplications = async () => {
    try {
      setLoadingReporterApps(true)
      const res = await authenticatedFetch('/api/reporter-applications')
      const data = await res.json()
      setReporterApplications(data.applications || [])
    } catch (error) {
      // console.error('Failed to load reporter applications:', error)
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
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast({
          title: status === 'APPROVED' ? 'Application Approved' : `Application marked as ${status}`,
          description: status === 'APPROVED' ? 'User role updated to Reporter in database.' : undefined
        })
        await Promise.all([
          loadReporterApplications(),
          loadAllReporters(),
          loadPendingData(true)
        ])
      } else {
        throw new Error(data.error || 'Failed to update')
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
      // console.error('Failed to load reporters:', error)
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
      // console.error('Failed to load business promotions:', error)
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
      // console.error('Promotion action error:', error)
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
      const res = await authenticatedFetch('/api/admin/pending-ticker')
      const data = await res.json()
      setPendingTicker(data.ticker)
    } catch (error) {
      // console.error('Failed to load pending ticker:', error)
    } finally {
      setLoadingPendingTicker(false)
    }
  }

  // Approve pending ticker
  const handleApproveTicker = async () => {
    try {
      const res = await authenticatedFetch('/api/admin/pending-ticker/approve', {
        method: 'PUT'
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
      const res = await authenticatedFetch('/api/admin/pending-ticker/reject', {
        method: 'PUT'
      })
      if (res.ok) {
        toast({ title: 'Ticker Rejected', description: 'The pending ticker has been rejected' })
        loadPendingTicker()
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  // Load current live ticker
  const loadBreakingNews = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/breaking-ticker')
      const data = await res.json()
      if (res.ok) {
        setBreakingNews({
          enabled: data.enabled,
          text: data.text || '',
          articleIds: [] // We don't easily know which IDs map to these texts without searching
        })
      }
    } catch (error) {
      // console.error('Failed to load breaking news:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load data on tab change
  useEffect(() => {
    if (activeTab === 'overview') loadPendingTicker()
    if (activeTab === 'pending-approvals') loadPendingData(true)
    if (activeTab === 'breaking') loadBreakingNews()
    if (activeTab === 'businesses') loadAllBusinesses()
    if (activeTab === 'classifieds') loadAllClassifieds()
    if (activeTab === 'manage-news') loadAllNews()
    if (activeTab === 'reporter-apps' || activeTab === 'reporters') {
      loadReporterApplications()
      loadAllReporters()
      loadPendingData(true)
    }
    if (activeTab === 'enewspaper') loadAllEnewspapers()
    if (activeTab === 'content') {
      loadSidebarAd()
      loadBusinessPromotions()
    }
    if (activeTab === 'live-tv') loadLiveTVConfig()
  }, [activeTab])

  // ===== LIVE TV Handlers =====
  const loadLiveTVConfig = async () => {
    try {
      setLoadingLiveTV(true)
      const data = await admin.getLiveTV()
      setLiveTVConfig(data || { enabled: false, streams: [], primaryStreamId: null })
    } catch (error) {
      // console.error('Failed to load live TV config:', error)
    } finally {
      setLoadingLiveTV(false)
    }
  }

  const handleSaveLiveTVConfig = async (config) => {
    try {
      setLoadingLiveTV(true)
      await admin.updateLiveTV(config)
      setLiveTVConfig(config)
      toast({ title: 'Live TV Settings Saved' })
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoadingLiveTV(false)
    }
  }

  const handleAddStream = () => {
    if (!liveTVForm.title || !liveTVForm.url) {
      toast({ title: 'Title and YouTube URL are required', variant: 'destructive' })
      return
    }
    const newStream = {
      id: editingStream ? editingStream.id : crypto.randomUUID(),
      title: liveTVForm.title,
      url: liveTVForm.url,
      isLive: liveTVForm.isLive,
      isActive: true,
      order: editingStream ? editingStream.order : (liveTVConfig.streams?.length || 0) + 1,
      addedAt: editingStream ? editingStream.addedAt : new Date().toISOString()
    }
    let updatedStreams
    if (editingStream) {
      updatedStreams = liveTVConfig.streams.map(s => s.id === editingStream.id ? newStream : s)
    } else {
      updatedStreams = [...(liveTVConfig.streams || []), newStream]
    }
    const newConfig = {
      ...liveTVConfig,
      streams: updatedStreams,
      primaryStreamId: liveTVConfig.primaryStreamId || newStream.id
    }
    handleSaveLiveTVConfig(newConfig)
    setLiveTVForm({ title: '', url: '', isLive: false })
    setEditingStream(null)
  }

  const handleDeleteStream = (streamId) => {
    if (!confirm('Delete this stream?')) return
    const updatedStreams = liveTVConfig.streams.filter(s => s.id !== streamId)
    const newConfig = {
      ...liveTVConfig,
      streams: updatedStreams,
      primaryStreamId: liveTVConfig.primaryStreamId === streamId
        ? (updatedStreams[0]?.id || null)
        : liveTVConfig.primaryStreamId
    }
    handleSaveLiveTVConfig(newConfig)
  }

  const handleToggleStreamLive = (streamId) => {
    const updatedStreams = liveTVConfig.streams.map(s =>
      s.id === streamId ? { ...s, isLive: !s.isLive } : s
    )
    handleSaveLiveTVConfig({ ...liveTVConfig, streams: updatedStreams })
  }

  const handleToggleStreamActive = (streamId) => {
    const updatedStreams = liveTVConfig.streams.map(s =>
      s.id === streamId ? { ...s, isActive: !s.isActive } : s
    )
    handleSaveLiveTVConfig({ ...liveTVConfig, streams: updatedStreams })
  }

  const handleSetPrimaryStream = (streamId) => {
    handleSaveLiveTVConfig({ ...liveTVConfig, primaryStreamId: streamId })
  }

  const handleEditStream = (stream) => {
    setEditingStream(stream)
    setLiveTVForm({ title: stream.title, url: stream.url, isLive: stream.isLive })
  }

  const handleCancelEditStream = () => {
    setEditingStream(null)
    setLiveTVForm({ title: '', url: '', isLive: false })
  }

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
      const cleanedImages = (classifiedForm.images || []).filter(Boolean)
      const payload = {
        ...classifiedForm,
        images: cleanedImages,
        image: cleanedImages[0] || ''
      }
      if (editingClassified) {
        await admin.updateClassified(editingClassified.id, payload)
        toast({ title: 'Classified Updated' })
      } else {
        await admin.createClassified(payload)
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
    const existingImages = Array.isArray(classified.images) && classified.images.length > 0
      ? classified.images
      : (classified.image ? [classified.image] : [])
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
      images: existingImages
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
    // Optimistic update — use `active` field to match API + Firestore
    const previousClassifieds = [...allClassifieds]
    setAllClassifieds(prev => prev.map(c =>
      c.id === id ? { ...c, active: !c.active } : c
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

      // Helper function to upload image if it's base64 or a blob
      const uploadIfNeeded = async (imageStr) => {
        if (!imageStr || !imageStr.startsWith('data:image')) return imageStr

        try {
          // Check size - rough estimate from base64 length
          const sizeInBytes = (imageStr.length * 3) / 4;
          if (sizeInBytes > 4.5 * 1024 * 1024) {
            throw new Error("Image too large (max 4.5MB). Please use a smaller image.")
          }

          // Convert base64 to blob
          const response = await fetch(imageStr)
          const blob = await response.blob()
          const mimeStr = imageStr.split(',')[0].split(':')[1].split(';')[0]

          const formData = new FormData()
          formData.append('file', blob, `image.${mimeStr.split('/')[1]}`)

          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
          })

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json()
            return uploadData.url
          } else {
            const errData = await uploadRes.json().catch(() => ({}));
            throw new Error(errData.error || `Upload failed with status ${uploadRes.status}`)
          }
        } catch (err) {
          toast({ title: 'Image Upload Error', description: err.message, variant: 'destructive' })
          throw err
        }
      }

      // Upload images first if they are base64
      const mainImageUrl = await uploadIfNeeded(newsForm.mainImage)
      const currentThumbs = newsForm.thumbnails || (newsForm.thumbnailUrl ? [newsForm.thumbnailUrl] : [])
      const uploadedThumbs = await Promise.all(currentThumbs.map(thumb => uploadIfNeeded(thumb)))

      // Map form fields to API expected fields
      const payload = {
        title: newsForm.title,
        content: newsForm.content,
        categoryId: newsForm.category,
        category: newsForm.category,
        city: newsForm.city || '',
        mainImage: mainImageUrl || '',
        metaDescription: newsForm.metaDescription || '',
        videoUrl: newsForm.youtubeUrl || '',
        youtubeUrl: newsForm.youtubeUrl || '',
        thumbnails: uploadedThumbs.filter(Boolean),
        thumbnailUrl: uploadedThumbs[0] || '',
        tags: newsForm.tags ? newsForm.tags.split(',').map(t => t.trim()) : [],
        featured: newsForm.featured || false,
        showOnHome: newsForm.showOnHome !== false,
        authorName: newsForm.authorName || 'Admin'
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
      const uploadRes = await fetch('/api/upload-large', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: formData })
      const resText = await uploadRes.text()

      let uploadData;
      try {
        uploadData = JSON.parse(resText)
      } catch (e) {
        // If JSON parse fails, it's likely a Vercel HTML error (413, 504, etc)
        throw new Error(`Server Error (${uploadRes.status}): ${resText.slice(0, 100)}...`)
      }

      if (!uploadRes.ok) {
        // Show detailed error if available
        const errorMsg = uploadData.error || 'Upload failed'
        const errorDetails = uploadData.details ? `\nDetails: ${uploadData.details}` : ''
        throw new Error(`${errorMsg}${errorDetails}`)
      }
      setUploadingEnewspaper(false)

      // Save e-newspaper record via admin endpoint (auto-approved)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/enewspaper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: enewspaperForm.title,
          publishDate: enewspaperForm.editionDate,
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

  const moreTabIds = ['pending-approvals', 'businesses', 'classifieds', 'content', 'breaking', 'reporters', 'enewspaper', 'live-tv', 'navigation', 'settings']
  const isMoreActive = showMoreMenu || moreTabIds.includes(activeTab)
  const morePendingCount = pendingData.businesses.length + pendingData.classifieds.length + pendingData.ads.length + pendingData.users.length

  const moreMenuItems = [
    {
      id: 'pending-approvals',
      label: 'Pending Approvals',
      desc: 'Approve ads, businesses & news',
      icon: Clock,
      iconGradient: 'from-[#F59E0B] via-[#D97706] to-[#B45309]',
      iconShadow: 'shadow-amber-500/35',
      badge: totalPending
    },
    {
      id: 'businesses',
      label: 'Business Directory',
      desc: 'Local businesses & stores',
      icon: Building2,
      iconGradient: 'from-[#34C759] via-[#30B34D] to-[#248A3D]',
      iconShadow: 'shadow-emerald-500/35',
      badge: pendingData.businesses.length
    },
    {
      id: 'classifieds',
      label: 'Classifieds',
      desc: 'Jobs, property & vehicles',
      icon: Tag,
      iconGradient: 'from-[#FF9500] via-[#F57C00] to-[#E07000]',
      iconShadow: 'shadow-orange-500/35',
      badge: pendingData.classifieds.length
    },
    {
      id: 'content',
      label: 'Advertisements',
      desc: 'Sidebar, banners & ads',
      icon: Megaphone,
      iconGradient: 'from-[#AF52DE] via-[#9333EA] to-[#7B2CBF]',
      iconShadow: 'shadow-purple-500/35',
      badge: pendingData.ads.length
    },
    {
      id: 'breaking',
      label: 'Breaking News',
      desc: 'Flash ticker & alerts',
      icon: AlertCircle,
      iconGradient: 'from-[#FF3B30] via-[#E63946] to-[#D70015]',
      iconShadow: 'shadow-red-500/35',
      badge: 0
    },
    {
      id: 'reporters',
      label: 'Reporters & Users',
      desc: 'Applications & team roster',
      icon: Users,
      iconGradient: 'from-[#007AFF] via-[#0284C7] to-[#0055B3]',
      iconShadow: 'shadow-blue-500/35',
      badge: pendingData.users.length
    },
    {
      id: 'enewspaper',
      label: 'E-Paper',
      desc: 'Digital daily editions',
      icon: FileText,
      iconGradient: 'from-[#30B0C7] via-[#0891B2] to-[#00838F]',
      iconShadow: 'shadow-teal-500/35',
      badge: 0
    },
    {
      id: 'live-tv',
      label: 'Live TV',
      desc: 'Broadcast streams',
      icon: Monitor,
      iconGradient: 'from-[#5856D6] via-[#6366F1] to-[#3634A3]',
      iconShadow: 'shadow-indigo-500/35',
      badge: 0
    },
    {
      id: 'navigation',
      label: 'Navigation Bar',
      desc: 'Header links & menu',
      icon: Navigation,
      iconGradient: 'from-[#32ADE6] via-[#0EA5E9] to-[#0071A4]',
      iconShadow: 'shadow-sky-500/35',
      badge: 0
    },
    {
      id: 'settings',
      label: 'Settings',
      desc: 'Admin password & info',
      icon: Settings,
      iconGradient: 'from-[#8E8E93] via-[#6B7280] to-[#48484A]',
      iconShadow: 'shadow-slate-500/35',
      badge: 0
    }
  ]

  return (
    <div className="flex h-screen w-full bg-[#F5F6FA] overflow-hidden admin-glass-panel">
      {/* ─── DARK SIDEBAR (desktop only) ─── */}
      <aside className="hidden lg:flex w-[260px] bg-[#111827] text-gray-300 flex-col h-full shrink-0 shadow-2xl z-20">
        <div className="h-16 flex items-center px-6 bg-[#0B101E] border-b border-gray-800">
          <img src="/starnews-logo.png" alt="StarNews India" className="h-9 w-auto object-contain pointer-events-none drop-shadow-md" />
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          <div className="px-3 mb-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Dashboard</div>
          
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'overview' ? 'bg-red-600 text-white shadow-md shadow-red-900/20' : 'hover:bg-gray-800 hover:text-white'}`}>
            <LayoutDashboard className="w-4 h-4" /> Overview
          </button>
          
          <button onClick={() => { setActiveTab('pending-approvals'); setPendingSubTab('businesses'); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'pending-approvals' ? 'bg-amber-600 text-white shadow-md shadow-amber-900/20' : 'hover:bg-gray-800 hover:text-white'}`}>
            <div className="flex items-center gap-3"><Clock className="w-4 h-4" /> Pending Approvals</div>
            {totalPending > 0 && <span className="bg-amber-500 text-white py-0.5 px-2 rounded-full text-[10px] font-bold animate-pulse">{totalPending}</span>}
          </button>

          <div className="px-3 mt-6 mb-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Content Management</div>
          
          <button onClick={() => setActiveTab('manage-news')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'manage-news' ? 'bg-red-600 text-white shadow-md shadow-red-900/20' : 'hover:bg-gray-800 hover:text-white'}`}>
            <div className="flex items-center gap-3"><Newspaper className="w-4 h-4" /> News</div>
            {pendingData.news.length > 0 && <span className="bg-red-500/20 text-red-400 py-0.5 px-2 rounded-full text-[10px] font-bold">{pendingData.news.length}</span>}
          </button>
          
          <button onClick={() => setActiveTab('breaking')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'breaking' ? 'bg-red-600 text-white shadow-md shadow-red-900/20' : 'hover:bg-gray-800 hover:text-white'}`}>
            <AlertCircle className="w-4 h-4" /> Breaking
          </button>

          <button onClick={() => setActiveTab('businesses')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'businesses' ? 'bg-red-600 text-white shadow-md shadow-red-900/20' : 'hover:bg-gray-800 hover:text-white'}`}>
            <div className="flex items-center gap-3"><Building2 className="w-4 h-4" /> Business Directory</div>
            {pendingData.businesses.length > 0 && <span className="bg-red-500/20 text-red-400 py-0.5 px-2 rounded-full text-[10px] font-bold">{pendingData.businesses.length}</span>}
          </button>

          <button onClick={() => setActiveTab('classifieds')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'classifieds' ? 'bg-red-600 text-white shadow-md shadow-red-900/20' : 'hover:bg-gray-800 hover:text-white'}`}>
            <div className="flex items-center gap-3"><Tag className="w-4 h-4" /> Classifieds</div>
            {pendingData.classifieds.length > 0 && <span className="bg-red-500/20 text-red-400 py-0.5 px-2 rounded-full text-[10px] font-bold">{pendingData.classifieds.length}</span>}
          </button>
          
          <button onClick={() => setActiveTab('reporters')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'reporters' ? 'bg-red-600 text-white shadow-md shadow-red-900/20' : 'hover:bg-gray-800 hover:text-white'}`}>
            <div className="flex items-center gap-3"><Users className="w-4 h-4" /> Reporters & Users</div>
            {pendingData.users.length > 0 && <span className="bg-red-500/20 text-red-400 py-0.5 px-2 rounded-full text-[10px] font-bold">{pendingData.users.length}</span>}
          </button>

          <div className="px-3 mt-6 mb-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Media & Ads</div>

          <button onClick={() => setActiveTab('shorts')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'shorts' ? 'bg-red-600 text-white shadow-md shadow-red-900/20' : 'hover:bg-gray-800 hover:text-white'}`}>
            <Video className="w-4 h-4" /> Shorts
          </button>
          
          <button onClick={() => setActiveTab('enewspaper')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'enewspaper' ? 'bg-red-600 text-white shadow-md shadow-red-900/20' : 'hover:bg-gray-800 hover:text-white'}`}>
            <FileText className="w-4 h-4" /> E-Paper
          </button>

          <button onClick={() => setActiveTab('live-tv')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'live-tv' ? 'bg-red-600 text-white shadow-md shadow-red-900/20' : 'hover:bg-gray-800 hover:text-white'}`}>
            <Monitor className="w-4 h-4" /> Live TV
          </button>

          <button onClick={() => setActiveTab('content')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'content' ? 'bg-red-600 text-white shadow-md shadow-red-900/20' : 'hover:bg-gray-800 hover:text-white'}`}>
            <div className="flex items-center gap-3"><Megaphone className="w-4 h-4" /> Advertisement</div>
            {pendingData.ads.length > 0 && <span className="bg-red-500/20 text-red-400 py-0.5 px-2 rounded-full text-[10px] font-bold">{pendingData.ads.length}</span>}
          </button>

          <div className="px-3 mt-6 mb-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">System</div>

          <button onClick={() => setActiveTab('navigation')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'navigation' ? 'bg-red-600 text-white shadow-md shadow-red-900/20' : 'hover:bg-gray-800 hover:text-white'}`}>
            <Navigation className="w-4 h-4" /> Navigation
          </button>

          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'settings' ? 'bg-red-600 text-white shadow-md shadow-red-900/20' : 'hover:bg-gray-800 hover:text-white'}`}>
            <Settings className="w-4 h-4" /> Settings
          </button>

          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 group"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /> Logout
          </button>

        </div>

        <div className="p-4 border-t border-gray-800 bg-[#0B101E]">
          <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700/50">
            <p className="text-xs font-bold text-gray-300 mb-1 flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> Need Help?</p>
            <p className="text-[10px] text-gray-500 mb-2">Contact support for assistance.</p>
            <Button variant="outline" size="sm" className="w-full text-xs h-7 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
              Contact Support
            </Button>
          </div>
          <p className="text-[10px] text-gray-600 mt-4 text-center">© 2026 StarNews India<br/>v1.0.0</p>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F5F6FA]">

        {/* ─── MOBILE TOP HEADER (mobile only) ─── */}
        <header className="lg:hidden h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-2">
            <img src="/starnews-logo.png" alt="StarNews" className="h-8 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative mr-1">
              <Bell className="w-5 h-5 text-gray-600" />
              {totalPending > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">{totalPending}</span>}
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">A</div>
            <Button
              onClick={handleLogoutClick}
              variant="outline"
              size="sm"
              className="border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 h-8 px-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ml-1"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5 text-red-600" />
              <span>Logout</span>
            </Button>
          </div>
        </header>

        {/* TOP HEADER (desktop only) */}
        <header className="hidden lg:flex h-16 bg-white border-b border-gray-200 items-center justify-between px-8 shrink-0 z-10">
          <div className="flex items-center w-96 relative">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
             </div>
             <Input type="text" placeholder="Search anything (news, users, ads...)" className="w-full pl-9 h-10 bg-gray-50/50 border-gray-200 rounded-xl text-sm focus-visible:ring-red-100" />
             <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-mono border px-1.5 py-0.5 rounded shadow-sm bg-white">Ctrl K</div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-right">
               <div className="hidden md:block text-xs">
                 <p className="text-gray-500 font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
                 <p className="font-bold text-gray-800">{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
               </div>
            </div>
            
            <div className="h-6 w-px bg-gray-200"></div>
            
            <div className="relative cursor-pointer hover:text-red-600 transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">{totalPending}</span>
            </div>

            <div className="flex items-center gap-3 pl-2">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm">
                A
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-gray-900 leading-none">Admin</p>
                <p className="text-[11px] text-gray-500 font-medium">Super Admin</p>
              </div>
            </div>

            <Button
              onClick={handleLogoutClick}
              variant="outline"
              size="sm"
              className="border-gray-200 text-gray-700 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-xl h-9 px-3.5 font-medium transition-all flex items-center gap-2 shadow-sm ml-2"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Logout</span>
            </Button>
          </div>
        </header>

        {/* PAGE SCROLL AREA */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-20 lg:pb-8 custom-scrollbar">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* The TabsList has been moved to the sidebar above! */}

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-0">
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Pending Items Card */}
            <Card onClick={() => { setActiveTab('pending-approvals'); setPendingSubTab('businesses'); }} className="relative overflow-hidden border-0 shadow-lg group hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 opacity-90"></div>
              <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
                <Clock className="w-24 h-24 text-white" />
              </div>
              <CardContent className="relative p-6 z-10 flex flex-col justify-between h-full min-h-[140px]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-1">Total Pending</p>
                    <h3 className="text-white text-4xl font-bold">{totalPending}</h3>
                  </div>
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                </div>
                <p className="text-white/90 text-xs mt-4 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Action required &bull; Click to review
                </p>
              </CardContent>
            </Card>

            {/* Pending News Card */}
            <Card onClick={() => { setActiveTab('pending-approvals'); setPendingSubTab('news'); }} className="relative overflow-hidden border-0 shadow-lg group hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 opacity-90"></div>
              <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
                <Newspaper className="w-24 h-24 text-white" />
              </div>
              <CardContent className="relative p-6 z-10 flex flex-col justify-between h-full min-h-[140px]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-1">Pending News</p>
                    <h3 className="text-white text-4xl font-bold">{pendingData.news.length}</h3>
                  </div>
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                    <Newspaper className="h-6 w-6 text-white" />
                  </div>
                </div>
                <p className="text-white/90 text-xs mt-4 font-medium flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Awaiting review &bull; Click to review
                </p>
              </CardContent>
            </Card>

            {/* Pending Reporters Card */}
            <Card onClick={() => { setActiveTab('pending-approvals'); setPendingSubTab('reporters'); }} className="relative overflow-hidden border-0 shadow-lg group hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600 opacity-90"></div>
              <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
                <Users className="w-24 h-24 text-white" />
              </div>
              <CardContent className="relative p-6 z-10 flex flex-col justify-between h-full min-h-[140px]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-1">Reporters</p>
                    <h3 className="text-white text-4xl font-bold">{pendingData.users.length}</h3>
                  </div>
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
                <p className="text-white/90 text-xs mt-4 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" /> New applications &bull; Click to review
                </p>
              </CardContent>
            </Card>

            {/* Pending Businesses Card */}
            <Card onClick={() => { setActiveTab('pending-approvals'); setPendingSubTab('businesses'); }} className="relative overflow-hidden border-0 shadow-lg group hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-600 opacity-90"></div>
              <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
                <Building2 className="w-24 h-24 text-white" />
              </div>
              <CardContent className="relative p-6 z-10 flex flex-col justify-between h-full min-h-[140px]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-1">Pending Businesses</p>
                    <h3 className="text-white text-4xl font-bold">{pendingData.businesses.length}</h3>
                  </div>
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                </div>
                <p className="text-white/90 text-xs mt-4 font-medium flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Listings to approve &bull; Click to review
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mt-6">
            <div className="md:col-span-2 space-y-6">
              {/* Platform Overview */}
              <Card className="border-0 shadow-sm overflow-hidden rounded-2xl">
                <CardHeader className="bg-white border-b border-gray-100 pb-4">
                  <CardTitle className="text-lg font-bold text-gray-800">Platform Overview</CardTitle>
                </CardHeader>
                <CardContent className="bg-white p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-2 p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-sm font-medium text-gray-500">Total News</span>
                    <span className="text-2xl font-bold text-gray-800">{allNews?.length || 154}</span>
                    <span className="text-xs text-emerald-600 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +12% this week</span>
                  </div>
                  <div className="flex flex-col gap-2 p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-sm font-medium text-gray-500">Reporters</span>
                    <span className="text-2xl font-bold text-gray-800">{allReporters?.length || 24}</span>
                    <span className="text-xs text-emerald-600 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +2 new</span>
                  </div>
                  <div className="flex flex-col gap-2 p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-sm font-medium text-gray-500">Businesses</span>
                    <span className="text-2xl font-bold text-gray-800">{allBusinesses?.length || 89}</span>
                    <span className="text-xs text-emerald-600 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +5% this week</span>
                  </div>
                  <div className="flex flex-col gap-2 p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-sm font-medium text-gray-500">Classifieds</span>
                    <span className="text-2xl font-bold text-gray-800">{allClassifieds?.length || 312}</span>
                    <span className="text-xs text-red-500 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> -2% this week</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-white border-b border-gray-100 pb-4">
                  <CardTitle className="text-lg font-bold text-gray-800">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="bg-white p-6 grid gap-4 md:grid-cols-3">
                  <Button onClick={() => setActiveTab('manage-news')} className="h-auto py-4 flex flex-col gap-3 justify-center items-center bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all rounded-xl">
                    <div className="p-3 bg-blue-600 text-white rounded-full shadow-sm"><Newspaper className="w-5 h-5" /></div>
                    <span className="font-semibold text-sm">Review News</span>
                  </Button>
                  <Button onClick={() => setActiveTab('reporters')} className="h-auto py-4 flex flex-col gap-3 justify-center items-center bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all rounded-xl">
                    <div className="p-3 bg-emerald-600 text-white rounded-full shadow-sm"><Users className="w-5 h-5" /></div>
                    <span className="font-semibold text-sm">Approve Reporters</span>
                  </Button>
                  <Button onClick={() => setActiveTab('breaking')} className="h-auto py-4 flex flex-col gap-3 justify-center items-center bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-all rounded-xl">
                    <div className="p-3 bg-red-600 text-white rounded-full shadow-sm"><AlertCircle className="w-5 h-5" /></div>
                    <span className="font-semibold text-sm">Manage Ticker</span>
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              {/* System Status */}
              <Card className="border-0 shadow-sm rounded-2xl">
                <CardHeader className="bg-white border-b border-gray-100 pb-4">
                  <CardTitle className="text-lg font-bold text-gray-800">System Status</CardTitle>
                </CardHeader>
                <CardContent className="bg-white p-0">
                   <div className="divide-y divide-gray-100">
                     <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600"><Globe className="w-4 h-4" /></div>
                         <span className="font-medium text-sm text-gray-700">Website Frontend</span>
                       </div>
                       <span className="flex items-center gap-1.5 text-xs font-bold text-green-600"><span className="w-2 h-2 rounded-full bg-green-500"></span> Online</span>
                     </div>
                     <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600"><Database className="w-4 h-4" /></div>
                         <span className="font-medium text-sm text-gray-700">Database API</span>
                       </div>
                       <span className="flex items-center gap-1.5 text-xs font-bold text-green-600"><span className="w-2 h-2 rounded-full bg-green-500"></span> Online</span>
                     </div>
                     <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600"><Video className="w-4 h-4" /></div>
                         <span className="font-medium text-sm text-gray-700">Live TV Stream</span>
                       </div>
                       <span className="flex items-center gap-1.5 text-xs font-bold text-green-600"><span className="w-2 h-2 rounded-full bg-green-500"></span> Active</span>
                     </div>
                   </div>
                </CardContent>
              </Card>
            </div>
          </div>

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

        {/* ─── PENDING APPROVALS TAB ─── */}
        <TabsContent value="pending-approvals" className="space-y-6 mt-0">
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-100 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                      <Clock className="h-5 w-5" />
                    </div>
                    Pending Approvals Queue
                    {totalPending > 0 && (
                      <Badge className="bg-amber-500 text-white rounded-full px-2.5 text-xs font-bold">
                        {totalPending} Total
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Review and approve submitted business directory listings, classified ads, news, and reporter requests
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadPendingData(true)}
                  disabled={refreshing}
                  className="rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-2 self-start sm:self-auto"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-500' : ''}`} />
                  Refresh Queue
                </Button>
              </div>

              {/* Sub-Tabs Pills */}
              <div className="flex flex-wrap gap-2 pt-4 mt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPendingSubTab('businesses')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    pendingSubTab === 'businesses'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Pending Businesses</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    pendingSubTab === 'businesses' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-800'
                  }`}>
                    {pendingData.businesses.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPendingSubTab('classifieds')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    pendingSubTab === 'classifieds'
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Tag className="w-4 h-4" />
                  <span>Pending Classifieds</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    pendingSubTab === 'classifieds' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-800'
                  }`}>
                    {pendingData.classifieds.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPendingSubTab('news')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    pendingSubTab === 'news'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Newspaper className="w-4 h-4" />
                  <span>Pending News</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    pendingSubTab === 'news' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-800'
                  }`}>
                    {pendingData.news.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPendingSubTab('reporters')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    pendingSubTab === 'reporters'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Pending Reporters</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    pendingSubTab === 'reporters' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-800'
                  }`}>
                    {pendingData.users.length}
                  </span>
                </button>
              </div>
            </CardHeader>

            <CardContent className="bg-gray-50/50 p-6 min-h-[400px]">
              {/* SUBTAB 1: PENDING BUSINESSES */}
              {pendingSubTab === 'businesses' && (
                <div>
                  {pendingData.businesses.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 p-8 shadow-sm">
                      <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8" />
                      </div>
                      <h4 className="font-bold text-gray-800 text-lg">No Pending Business Listings</h4>
                      <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                        All business submissions are reviewed. When users submit businesses via the "Post Your Ad" button or business directory, they appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingData.businesses.map((business) => (
                        <Card key={business.id} className="border-0 shadow-sm bg-white overflow-hidden ring-1 ring-gray-100 hover:ring-blue-200 transition-all rounded-2xl">
                          <div className="flex flex-col md:flex-row md:items-center p-5 gap-5">
                            <div className="w-24 h-24 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0 ring-1 ring-gray-900/5">
                              <img
                                src={business.coverImage || business.cover_image || business.image || business.images?.[0] || 'https://placehold.co/100?text=Business'}
                                alt={business.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = 'https://placehold.co/100?text=Business'; }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-bold text-lg text-gray-900">{business.name}</h3>
                                <Badge className="bg-blue-50 text-blue-700 border-blue-200">{business.category || 'General'}</Badge>
                                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold">PENDING APPROVAL</Badge>
                              </div>
                              {business.description && (
                                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{business.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                {(business.ownerName || business.contactName) && (
                                  <span className="flex items-center gap-1 font-medium text-gray-700">
                                    <User className="w-3.5 h-3.5 text-gray-400" /> Owner: {business.ownerName || business.contactName}
                                  </span>
                                )}
                                {business.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3.5 h-3.5 text-gray-400" /> {business.phone}
                                  </span>
                                )}
                                {business.whatsapp && (
                                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp: {business.whatsapp}
                                  </span>
                                )}
                                {(business.address || business.area || business.location) && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400" /> {business.address || business.area || business.location}
                                  </span>
                                )}
                              </div>
                              {business.submittedAt && (
                                <p className="text-[11px] text-gray-400 mt-2 font-medium">
                                  Submitted: {new Date(business.submittedAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                              <Button
                                onClick={() => handleBusinessAction(business.id, 'approve')}
                                disabled={loading}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm h-10 px-5 font-semibold"
                              >
                                <Check className="h-4 w-4 mr-1.5" /> Approve Listing
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleBusinessAction(business.id, 'reject')}
                                disabled={loading}
                                className="text-red-600 hover:bg-red-50 border-red-200 rounded-xl h-10 px-4 font-semibold"
                              >
                                <X className="h-4 w-4 mr-1.5" /> Reject
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 2: PENDING CLASSIFIEDS */}
              {pendingSubTab === 'classifieds' && (
                <div>
                  {pendingData.classifieds.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 p-8 shadow-sm">
                      <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8" />
                      </div>
                      <h4 className="font-bold text-gray-800 text-lg">No Pending Classified Ads</h4>
                      <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                        All classified ads are reviewed. When users submit classified ads via "Post Your Ad" or the Classifieds page, they appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingData.classifieds.map((classified) => (
                        <Card key={classified.id} className="border-0 shadow-sm bg-white overflow-hidden ring-1 ring-gray-100 hover:ring-orange-200 transition-all rounded-2xl">
                          <div className="flex flex-col md:flex-row md:items-center p-5 gap-5">
                            <div className="w-24 h-24 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0 ring-1 ring-gray-900/5">
                              <img
                                src={classified.image || classified.images?.[0] || 'https://placehold.co/100?text=Ad'}
                                alt={getTextValue(classified.title)}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = 'https://placehold.co/100?text=Ad'; }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-bold text-lg text-gray-900">{getTextValue(classified.title)}</h3>
                                <Badge className="bg-orange-50 text-orange-700 border-orange-200">{classified.category || 'General'}</Badge>
                                {classified.price && (
                                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
                                    {typeof classified.price === 'number'
                                      ? `₹${classified.price.toLocaleString('en-IN')}`
                                      : String(classified.price).startsWith('₹')
                                      ? classified.price
                                      : `₹${classified.price}`}
                                  </Badge>
                                )}
                                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold">PENDING APPROVAL</Badge>
                              </div>
                              {classified.description && (
                                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{classified.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                {classified.sellerName && (
                                  <span className="flex items-center gap-1 font-medium text-gray-700">
                                    <User className="w-3.5 h-3.5 text-gray-400" /> Seller: {classified.sellerName}
                                  </span>
                                )}
                                {(classified.phone || classified.contactPhone) && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3.5 h-3.5 text-gray-400" /> {classified.phone || classified.contactPhone}
                                  </span>
                                )}
                                {classified.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400" /> {classified.location}
                                  </span>
                                )}
                              </div>
                              {classified.createdAt && (
                                <p className="text-[11px] text-gray-400 mt-2 font-medium">
                                  Submitted: {new Date(classified.createdAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                              <Button
                                onClick={() => handleClassifiedAction(classified.id, 'approve')}
                                disabled={loading}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm h-10 px-5 font-semibold"
                              >
                                <Check className="h-4 w-4 mr-1.5" /> Approve
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleClassifiedAction(classified.id, 'reject')}
                                disabled={loading}
                                className="text-red-600 hover:bg-red-50 border-red-200 rounded-xl h-10 px-4 font-semibold"
                              >
                                <X className="h-4 w-4 mr-1.5" /> Reject
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 3: PENDING NEWS */}
              {pendingSubTab === 'news' && (
                <div>
                  {pendingData.news.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 p-8 shadow-sm">
                      <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8" />
                      </div>
                      <h4 className="font-bold text-gray-800 text-lg">No Pending News Articles</h4>
                      <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                        All reporter articles have been reviewed and published.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingData.news.map((item) => (
                        <Card key={item.id} className="border-0 shadow-sm bg-white overflow-hidden ring-1 ring-gray-100 hover:ring-indigo-200 transition-all rounded-2xl">
                          <div className="flex flex-col md:flex-row md:items-center p-5 gap-5">
                            <div className="w-24 h-24 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0 ring-1 ring-gray-900/5">
                              <img
                                src={item.mainImage || item.image || 'https://placehold.co/100?text=News'}
                                alt={getTextValue(item.title)}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = 'https://placehold.co/100?text=News'; }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-bold text-lg text-gray-900">{getTextValue(item.title)}</h3>
                                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">{item.category}</Badge>
                                {item.city && (
                                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 font-semibold">
                                    <MapPin className="w-3 h-3" /> {item.city}
                                  </Badge>
                                )}
                                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold">PENDING REVIEW</Badge>
                              </div>
                              {item.content && (
                                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{getTextValue(item.content)}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                {item.authorName && (
                                  <span className="flex items-center gap-1 font-medium text-gray-700">
                                    <User className="w-3.5 h-3.5 text-gray-400" /> Reporter: {item.authorName}
                                  </span>
                                )}
                                {item.createdAt && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-gray-400" /> {new Date(item.createdAt).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                              <Button
                                onClick={() => handleNewsAction(item.id, 'approve')}
                                disabled={loading}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm h-10 px-5 font-semibold"
                              >
                                <Check className="h-4 w-4 mr-1.5" /> Approve Article
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleNewsAction(item.id, 'reject')}
                                disabled={loading}
                                className="text-red-600 hover:bg-red-50 border-red-200 rounded-xl h-10 px-4 font-semibold"
                              >
                                <X className="h-4 w-4 mr-1.5" /> Reject
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 4: PENDING REPORTERS */}
              {pendingSubTab === 'reporters' && (
                <div>
                  {pendingData.users.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 p-8 shadow-sm">
                      <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8" />
                      </div>
                      <h4 className="font-bold text-gray-800 text-lg">No Pending Reporter Applications</h4>
                      <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                        All reporter registration applications have been reviewed.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingData.users.map((item) => (
                        <Card key={item.id} className="border-0 shadow-sm bg-white overflow-hidden ring-1 ring-gray-100 hover:ring-purple-200 transition-all rounded-2xl">
                          <div className="flex flex-col md:flex-row md:items-center p-5 gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl font-bold flex-shrink-0">
                              {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-bold text-lg text-gray-900">{item.name || 'Unnamed Reporter'}</h3>
                                <Badge className="bg-purple-50 text-purple-700 border-purple-200">{item.role || 'Reporter'}</Badge>
                                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold">PENDING VERIFICATION</Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                                {item.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-gray-400" /> {item.email}</span>}
                                {item.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-gray-400" /> {item.phone}</span>}
                                {item.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400" /> {item.city}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                              <Button
                                onClick={() => handleUserAction(item.id, 'approve')}
                                disabled={loading}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm h-10 px-5 font-semibold"
                              >
                                <Check className="h-4 w-4 mr-1.5" /> Approve Reporter
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleUserAction(item.id, 'reject')}
                                disabled={loading}
                                className="text-red-600 hover:bg-red-50 border-red-200 rounded-xl h-10 px-4 font-semibold"
                              >
                                <X className="h-4 w-4 mr-1.5" /> Reject
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breaking News Tab */}
        <TabsContent value="breaking" className="space-y-6 mt-0">
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <AlertCircle className="h-4 w-4" />
                </div>
                Breaking News Bar
              </CardTitle>
              <CardDescription>Control the red scrolling ticker at the top of the website</CardDescription>
            </CardHeader>
            <CardContent className="bg-white p-6 space-y-6">
              
              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">Breaking News Ticker</p>
                    <p className="text-sm text-gray-500">Enable or disable the scrolling news bar</p>
                  </div>
                </div>
                <Switch
                  checked={breakingNews.enabled}
                  onCheckedChange={(checked) => setBreakingNews({ ...breakingNews, enabled: checked })}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>

              {breakingNews.enabled && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="space-y-3">
                    <Label className="text-sm font-bold text-gray-700">Custom Breaking News Text (Optional)</Label>
                    <Textarea
                      placeholder="Enter custom breaking news text..."
                      value={breakingNews.text}
                      onChange={(e) => setBreakingNews({ ...breakingNews, text: e.target.value })}
                      className="resize-none min-h-[100px] border-gray-200 focus-visible:ring-red-100 rounded-xl bg-gray-50/50"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-bold text-gray-700">Select Approved Articles for Breaking News</Label>
                    <div className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50/50">
                      <ScrollArea className="h-[300px]">
                        <div className="p-2 space-y-1">
                          {approvedNews.map((article) => (
                            <div
                              key={article.id}
                              className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all ${breakingNews.articleIds.includes(article.id) ? 'bg-red-50 border border-red-100 shadow-sm' : 'hover:bg-white border border-transparent'
                                }`}
                              onClick={() => {
                                const ids = breakingNews.articleIds.includes(article.id)
                                  ? breakingNews.articleIds.filter(id => id !== article.id)
                                  : [...breakingNews.articleIds, article.id]
                                setBreakingNews({ ...breakingNews, articleIds: ids })
                              }}
                            >
                              <div className={`w-5 h-5 rounded border flex items-center justify-center ${breakingNews.articleIds.includes(article.id) ? 'bg-red-600 border-red-600' : 'bg-white border-gray-300'}`}>
                                {breakingNews.articleIds.includes(article.id) && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className={`flex-1 text-sm font-medium ${breakingNews.articleIds.includes(article.id) ? 'text-red-900' : 'text-gray-700'}`}>{getTextValue(article.title)}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>

                  <Button
                    className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-600/20 transition-all"
                    disabled={loading}
                    onClick={async () => {
                      setLoading(true)
                      try {
                        let token = localStorage.getItem('token') || localStorage.getItem('reporterToken')

                        // Safety check for common null/undefined string issues
                        if (!token || token === 'null' || token === 'undefined') {
                          throw new Error('No authentication token found. Please log out and log in again.')
                        }

                        const payload = {
                          enabled: breakingNews.enabled,
                          texts: breakingNews.text
                            ? [breakingNews.text, ...breakingNews.articleIds.map(id => {
                              const article = approvedNews.find(a => a.id === id)
                              return article ? getTextValue(article.title) : null
                            }).filter(Boolean)]
                            : breakingNews.articleIds.map(id => {
                              const article = approvedNews.find(a => a.id === id)
                              return article ? getTextValue(article.title) : null
                            }).filter(Boolean)
                        }

                        // Use the consolidated api utility
                        const res = await fetch('/api/breaking-ticker', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify(payload)
                        })

                        if (res.ok) {
                          toast({ title: 'Breaking News Settings Saved!', description: 'The ticker will update on page refresh.' })
                        } else {
                          const data = await res.json()
                          throw new Error(data.error || 'Failed to save')
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
                  </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>



        {/* Navigation Tab */}
        <TabsContent value="navigation" className="space-y-6 mt-0">
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-white border-b border-gray-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Navigation className="h-4 w-4" />
                </div>
                Navigation Menu Management
              </CardTitle>
              <CardDescription>Add, remove, rename, and reorder navigation items</CardDescription>
            </CardHeader>
            <CardContent className="bg-white p-6 space-y-6">
              {/* Add new item */}
              <div className="flex flex-col sm:flex-row items-end gap-4 p-5 bg-gray-50/80 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex-1 w-full space-y-2">
                  <Label className="text-sm font-bold text-gray-700">Label</Label>
                  <Input
                    placeholder="Menu label (e.g. News)"
                    value={newNavItem.label}
                    onChange={(e) => setNewNavItem({ ...newNavItem, label: e.target.value })}
                    className="h-12 bg-white rounded-xl focus:ring-indigo-500"
                  />
                </div>
                <div className="flex-1 w-full space-y-2">
                  <Label className="text-sm font-bold text-gray-700">Path</Label>
                  <Input
                    placeholder="e.g., news, businesses"
                    value={newNavItem.path}
                    onChange={(e) => setNewNavItem({ ...newNavItem, path: e.target.value })}
                    className="h-12 bg-white rounded-xl focus:ring-indigo-500"
                  />
                </div>
                <Button onClick={addNavigationItem} className="w-full sm:w-auto h-12 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Link
                </Button>
              </div>

              {/* Navigation items list */}
              <div className="space-y-3">
                {navigationItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm transition-all hover:border-indigo-200 ${!item.active ? 'opacity-50 grayscale bg-gray-50/50' : ''}`}
                  >
                    <div className="cursor-grab hover:text-indigo-600 active:cursor-grabbing text-gray-400">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <span className="w-6 font-bold text-gray-300 text-sm text-center">{index + 1}</span>
                    <Input
                      value={item.label}
                      onChange={(e) => {
                        setNavigationItems(navigationItems.map(nav =>
                          nav.id === item.id ? { ...nav, label: e.target.value } : nav
                        ))
                      }}
                      className="flex-1 h-11 bg-gray-50/50 rounded-lg border-gray-200 focus:ring-indigo-500 font-medium"
                    />
                    <Input
                      value={item.path}
                      onChange={(e) => {
                        setNavigationItems(navigationItems.map(nav =>
                          nav.id === item.id ? { ...nav, path: e.target.value } : nav
                        ))
                      }}
                      className="flex-1 h-11 bg-gray-50/50 rounded-lg border-gray-200 focus:ring-indigo-500 font-medium text-gray-500"
                    />
                    <div className="flex items-center gap-2 pl-2 border-l border-gray-100 h-10">
                      <Switch
                        checked={item.active}
                        onCheckedChange={() => toggleNavigationItem(item.id)}
                        className="data-[state=checked]:bg-indigo-600"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeNavigationItem(item.id)}
                        className="h-9 w-9 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <Button
                  className="w-full sm:w-auto h-12 px-8 rounded-xl bg-gray-900 hover:bg-black text-white font-semibold shadow-sm"
                  onClick={async () => {
                    try {
                      await admin.updateNavigation({ items: navigationItems })
                      toast({ title: 'Navigation Saved', description: 'Navigation changes saved successfully.' })
                    } catch (error) {
                      toast({ title: 'Save Failed', description: error.message, variant: 'destructive' })
                    }
                  }}
                >
                  Save Navigation Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Directory Tab */}
        <TabsContent value="businesses" className="space-y-6 mt-0">
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Building2 className="h-4 w-4" />
                </div>
                Business Directory Approvals
              </CardTitle>
              <CardDescription>Manage business listings and approve submissions</CardDescription>
            </CardHeader>
            <CardContent className="bg-white p-6">
              {pendingData.businesses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <p className="font-medium text-gray-600">No pending business listings</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4 pr-4">
                    {pendingData.businesses.map((business) => (
                      <Card key={business.id} className="border-0 shadow-sm bg-white overflow-hidden ring-1 ring-gray-100 hover:ring-blue-100 transition-all rounded-xl">
                        <div className="flex">
                          <div className="w-1.5 bg-blue-500"></div>
                          <CardContent className="p-5 flex-1">
                            <h3 className="font-bold text-lg text-gray-800">{business.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">{business.description || 'No description provided'}</p>
                            <div className="flex items-center gap-2 mt-3">
                              <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-0">{business.category || 'General'}</Badge>
                            </div>
                            <Separator className="my-4" />
                            <div className="flex items-center gap-3">
                              <Button
                                size="sm"
                                onClick={() => handleBusinessAction(business.id, 'approve')}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm"
                              >
                                <Check className="h-4 w-4 mr-1.5" />
                                Approve Listing
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBusinessAction(business.id, 'reject')}
                                disabled={loading}
                                className="text-red-600 hover:bg-red-50 border-red-100 rounded-lg"
                              >
                                <X className="h-4 w-4 mr-1.5" />
                                Reject
                              </Button>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Business Promotions / Leads Section */}
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-blue-100/50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-blue-800 text-lg font-bold">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Megaphone className="h-4 w-4" />
                    </div>
                    Promotion Requests
                  </CardTitle>
                  <CardDescription className="text-blue-600/70 mt-1">Leads from "Promote Your Business" form</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadBusinessPromotions} disabled={loadingPromotions} className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl">
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingPromotions ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="bg-white p-6">
              {businessPromotions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <p className="font-medium text-gray-500">No promotion requests found</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {businessPromotions.map((promo) => (
                    <Card key={promo.id} className={`border-0 shadow-sm ring-1 overflow-hidden transition-all rounded-xl ${promo.status === 'PENDING' ? 'ring-yellow-200 hover:ring-yellow-300' : promo.status === 'CONTACTED' ? 'ring-blue-200 hover:ring-blue-300' : promo.status === 'APPROVED' ? 'ring-green-200 hover:ring-green-300' : 'ring-red-200 hover:ring-red-300'}`}>
                      <div className="flex h-full">
                        <div className={`w-1.5 ${promo.status === 'PENDING' ? 'bg-yellow-500' : promo.status === 'CONTACTED' ? 'bg-blue-500' : promo.status === 'APPROVED' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <CardContent className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-bold text-gray-800 text-lg truncate pr-2">{promo.businessName}</h3>
                              <Badge variant="outline" className={
                                promo.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                  promo.status === 'CONTACTED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    promo.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                              }>
                                {promo.status}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm text-gray-600 line-clamp-2" title={promo.reason}>{promo.reason}</p>
                              <div className="flex flex-col gap-1.5 mt-3 text-sm text-gray-600">
                                <span className="flex items-center gap-2"><UserPlus className="h-4 w-4 text-gray-400" /> {promo.ownerName}</span>
                                <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" /> {promo.phone}</span>
                                <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" /> {promo.address}</span>
                              </div>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-4 font-medium">Submitted: {new Date(promo.submittedAt).toLocaleString()}</p>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-5">
                            {promo.status === 'PENDING' && (
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex-1" onClick={() => handlePromotionAction(promo.id, 'contacted')}>
                                Mark Contacted
                              </Button>
                            )}
                            {promo.status !== 'APPROVED' && (
                              <Button size="sm" variant="outline" className="text-green-700 border-green-200 hover:bg-green-50 rounded-lg flex-1" onClick={() => handlePromotionAction(promo.id, 'approve')}>
                                <Check className="h-3 w-3 mr-1" /> Approve
                              </Button>
                            )}
                            {promo.status !== 'REJECTED' && (
                              <Button size="sm" variant="outline" className="text-red-700 border-red-200 hover:bg-red-50 rounded-lg flex-1" onClick={() => handlePromotionAction(promo.id, 'reject')}>
                                <X className="h-3 w-3 mr-1" /> Reject
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-600 rounded-lg" onClick={() => handlePromotionAction(promo.id, 'delete')}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manage Business Directory Section (Merged) */}
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-100 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Building2 className="h-4 w-4" />
                  </div>
                  Manage Business Directory
                </CardTitle>
                <CardDescription className="mt-1">Add, edit, enable/disable businesses</CardDescription>
              </div>
              <Button onClick={() => { resetBusinessForm(); setShowBusinessForm(true) }} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm h-10 px-4">
                <Plus className="h-4 w-4 mr-2" /> Add Business
              </Button>
            </CardHeader>
            <CardContent className="bg-white p-6">
              {/* Business Form Dialog */}
              <Dialog open={showBusinessForm} onOpenChange={setShowBusinessForm}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">{editingBusiness ? 'Edit Business' : 'Add New Business'}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-5 py-4">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-semibold">Business Name *</Label>
                        <Input value={businessForm.name} onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })} placeholder="Business name" className="bg-gray-50/50 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-semibold">Category *</Label>
                        <Select value={businessForm.category} onValueChange={(val) => setBusinessForm({ ...businessForm, category: val })}>
                          <SelectTrigger className="bg-gray-50/50 rounded-xl"><SelectValue placeholder="Select category" /></SelectTrigger>
                          <SelectContent>
                            {BUSINESS_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-semibold">Description</Label>
                      <Textarea value={businessForm.description} onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })} placeholder="Business description" rows={3} className="bg-gray-50/50 rounded-xl resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-semibold">Phone Number</Label>
                        <Input value={businessForm.phone} onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" className="bg-gray-50/50 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-semibold">WhatsApp Number</Label>
                        <Input value={businessForm.whatsapp} onChange={(e) => setBusinessForm({ ...businessForm, whatsapp: e.target.value })} placeholder="+91 XXXXX XXXXX" className="bg-gray-50/50 rounded-xl" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-semibold">Website</Label>
                        <Input value={businessForm.website} onChange={(e) => setBusinessForm({ ...businessForm, website: e.target.value })} placeholder="www.example.com" className="bg-gray-50/50 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-semibold">Area</Label>
                        <Input value={businessForm.area} onChange={(e) => setBusinessForm({ ...businessForm, area: e.target.value })} placeholder="Koregaon Park, Baner..." className="bg-gray-50/50 rounded-xl" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-semibold">Full Address</Label>
                      <Input value={businessForm.address} onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })} placeholder="Full address" className="bg-gray-50/50 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-semibold">Google Maps Link</Label>
                      <Input value={businessForm.googleMapsLink} onChange={(e) => setBusinessForm({ ...businessForm, googleMapsLink: e.target.value })} placeholder="https://maps.google.com/..." className="bg-gray-50/50 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-semibold">Cover Image <span className="text-xs font-normal text-gray-400 ml-1">(Max size: 700KB)</span></Label>
                      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center bg-gray-50/50 hover:border-emerald-400 transition-colors h-40 relative group">
                        {businessForm.coverImage ? (
                          <>
                            <img src={businessForm.coverImage} alt="Cover" className="w-full h-full object-cover rounded-xl" />
                            <button
                              type="button"
                              className="absolute top-3 right-3 bg-red-500 text-white p-1.5 rounded-full text-xs shadow-sm hover:scale-110 transition-transform"
                              onClick={() => setBusinessForm({ ...businessForm, coverImage: '' })}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-emerald-500">
                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                              <Upload className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-medium">Upload Cover Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                if (file.size > 700 * 1024) {
                                  toast({ title: 'Image must be under 700KB', variant: 'destructive' })
                                  return
                                }
                                try {
                                  const formData = new FormData()
                                  formData.append('file', file)
                                  const res = await fetch('/api/upload', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: formData })
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
                      <Label className="text-gray-700 font-semibold">Gallery Images (up to 8) <span className="text-xs font-normal text-gray-400 ml-1">(Max size: 700KB each)</span></Label>
                      <div className="grid grid-cols-4 gap-3">
                        {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => {
                          const imgUrl = businessForm.images?.[index] || ''
                          return (
                            <div key={index} className="relative border-2 border-dashed border-gray-200 rounded-xl h-24 flex items-center justify-center overflow-hidden bg-gray-50/50 hover:border-emerald-400 transition-colors group">
                              {imgUrl ? (
                                <>
                                  <img src={imgUrl} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs shadow hover:scale-110 transition-transform"
                                    onClick={() => {
                                      const newImages = [...(businessForm.images || [])]
                                      newImages[index] = ''
                                      setBusinessForm({ ...businessForm, images: newImages.filter(Boolean) })
                                    }}
                                  ><X className="w-3 h-3"/></button>
                                </>
                              ) : (
                                <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-emerald-500">
                                  <Upload className="h-4 w-4 mb-1 group-hover:scale-110 transition-transform" />
                                  <span className="text-[10px] font-medium">{index + 1}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0]
                                      if (!file) return
                                      if (file.size > 700 * 1024) {
                                        toast({ title: 'Image must be under 700KB', variant: 'destructive' })
                                        return
                                      }
                                      try {
                                        const formData = new FormData()
                                        formData.append('file', file)
                                        const res = await fetch('/api/upload', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: formData })
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
                      <p className="text-xs text-gray-500">Click each slot to upload an image. Max 5MB per image.</p>
                    </div>
                  </div>
                  <DialogFooter className="border-t border-gray-100 pt-4 mt-2">
                    <Button variant="outline" onClick={() => setShowBusinessForm(false)} className="rounded-xl">Cancel</Button>
                    <Button onClick={handleSaveBusiness} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white">{loading ? 'Saving...' : (editingBusiness ? 'Update Business' : 'Create Business')}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Business List */}
              <div className="space-y-3">
                {allBusinesses.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No businesses found. Add your first business above.</p>
                  </div>
                ) : (
                  allBusinesses.map(business => (
                    <div key={business.id} className={`border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${business.enabled === false ? 'bg-gray-50/80 opacity-60' : 'bg-white'}`}>
                      <div className="flex items-center gap-5 min-w-0 flex-1">
                        <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden ring-1 ring-gray-900/5">
                          <img
                            src={business.coverImage || business.cover_image || business.images?.[0] || business.image || 'https://placehold.co/64?text=Img'}
                            alt={business.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = 'https://placehold.co/64?text=Img'; }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900 truncate text-base">{business.name}</h4>
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-0 hover:bg-gray-200">{business.category}</Badge>
                          </div>
                          <p className="text-sm text-gray-500 truncate flex items-center gap-1.5" title={`${business.area || business.address}`}>
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {business.area || business.address || 'No address provided'}
                          </p>
                          {business.phone && (
                            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                              <Phone className="h-3.5 w-3.5 text-gray-400" />{business.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                          <span className={`text-xs font-semibold ${business.enabled !== false ? 'text-green-600' : 'text-gray-500'}`}>
                            {business.enabled === false ? 'Disabled' : 'Enabled'}
                          </span>
                          <Switch checked={business.enabled !== false} onCheckedChange={() => handleToggleBusiness(business.id)} className="data-[state=checked]:bg-green-500 scale-90" />
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-9 w-9 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg" onClick={() => handleEditBusiness(business)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button size="icon" variant="ghost" className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg" onClick={() => handleDeleteBusiness(business.id)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Classifieds Tab - Pending Approvals */}
        <TabsContent value="classifieds" className="space-y-6 mt-0">
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                  <Tag className="h-4 w-4" />
                </div>
                Pending Classified Ads
                {pendingData.classifieds.length > 0 && (
                  <Badge className="bg-yellow-500 text-white ml-2 rounded-full px-2">{pendingData.classifieds.length} Pending</Badge>
                )}
              </CardTitle>
              <CardDescription>Review and approve user-submitted classified advertisements</CardDescription>
            </CardHeader>
            <CardContent className="bg-white p-6">
              {pendingData.classifieds.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <p className="font-medium text-gray-600">No pending classified ads</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4 pr-4">
                    {pendingData.classifieds.map((classified) => (
                      <Card key={classified.id} className="border-0 shadow-sm bg-white overflow-hidden ring-1 ring-gray-100 hover:ring-yellow-100 transition-all rounded-xl">
                        <div className="flex">
                          <div className="w-1.5 bg-yellow-400"></div>
                          <CardContent className="p-4 flex-1">
                            <div className="flex items-center gap-4">
                              {/* Small Thumbnail */}
                              <div className="w-16 h-16 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden ring-1 ring-gray-900/5">
                                <img
                                  src={classified.image || classified.images?.[0] || 'https://placehold.co/80?text=Ad'}
                                  alt={classified.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              {/* Details - Compact */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <h3 className="font-bold text-gray-800 text-base truncate">{getTextValue(classified.title)}</h3>
                                  <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">PENDING</Badge>
                                </div>
                                <p className="text-sm text-gray-500 truncate mb-2">{classified.description || 'No description provided'}</p>
                                <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{classified.location || 'N/A'}</span>
                                  <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{classified.phone || 'N/A'}</span>
                                </div>
                              </div>

                              {/* Actions - Right */}
                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleClassifiedAction(classified.id, 'approve')}
                                  disabled={loading}
                                  className="bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm h-9"
                                >
                                  <Check className="h-4 w-4 mr-1.5" />Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleClassifiedAction(classified.id, 'reject')}
                                  disabled={loading}
                                  className="text-red-600 border-red-100 hover:bg-red-50 rounded-lg h-9"
                                >
                                  <X className="h-4 w-4 mr-1.5" />Reject
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Manage Classifieds Section (Merged) */}
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden mt-6">
            <CardHeader className="bg-white border-b border-gray-100 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                    <Tag className="h-4 w-4" />
                  </div>
                  Manage Classified Ads
                </CardTitle>
                <CardDescription className="mt-1">Add, edit, enable/disable classified ads</CardDescription>
              </div>
              <Button onClick={() => { resetClassifiedForm(); setShowClassifiedForm(true) }} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm h-10 px-4">
                <Plus className="h-4 w-4 mr-2" /> Add Classified
              </Button>
            </CardHeader>
            <CardContent className="bg-white p-6">
              {/* Classified Form Dialog */}
              <Dialog open={showClassifiedForm} onOpenChange={setShowClassifiedForm}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">{editingClassified ? 'Edit Classified' : 'Add New Classified'}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-5 py-4">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-semibold">Title *</Label>
                        <Input value={classifiedForm.title} onChange={(e) => setClassifiedForm({ ...classifiedForm, title: e.target.value })} placeholder="Ad title" className="bg-gray-50/50 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-semibold">Category *</Label>
                        <Select value={classifiedForm.category} onValueChange={(val) => setClassifiedForm({ ...classifiedForm, category: val })}>
                          <SelectTrigger className="bg-gray-50/50 rounded-xl"><SelectValue placeholder="Select category" /></SelectTrigger>
                          <SelectContent>
                            {CLASSIFIED_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-semibold">Price</Label>
                        <Input value={classifiedForm.price} onChange={(e) => setClassifiedForm({ ...classifiedForm, price: e.target.value })} placeholder="₹ 10,000" className="bg-gray-50/50 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-semibold">Condition</Label>
                        <Select value={classifiedForm.condition} onValueChange={(val) => setClassifiedForm({ ...classifiedForm, condition: val })}>
                          <SelectTrigger className="bg-gray-50/50 rounded-xl"><SelectValue /></SelectTrigger>
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
                      <Label className="text-gray-700 font-semibold">Description</Label>
                      <Textarea value={classifiedForm.description} onChange={(e) => setClassifiedForm({ ...classifiedForm, description: e.target.value })} placeholder="Detailed description" rows={3} className="bg-gray-50/50 rounded-xl resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-semibold">Seller Name</Label>
                        <Input value={classifiedForm.sellerName} onChange={(e) => setClassifiedForm({ ...classifiedForm, sellerName: e.target.value })} placeholder="Seller name" className="bg-gray-50/50 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-semibold">Location</Label>
                        <Input value={classifiedForm.location} onChange={(e) => setClassifiedForm({ ...classifiedForm, location: e.target.value })} placeholder="Pune, Mumbai..." className="bg-gray-50/50 rounded-xl" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-semibold">Phone Number</Label>
                        <Input value={classifiedForm.phone} onChange={(e) => setClassifiedForm({ ...classifiedForm, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" className="bg-gray-50/50 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-semibold">WhatsApp Number</Label>
                        <Input value={classifiedForm.whatsapp} onChange={(e) => setClassifiedForm({ ...classifiedForm, whatsapp: e.target.value })} placeholder="+91 XXXXX XXXXX" className="bg-gray-50/50 rounded-xl" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-semibold">Images (up to 8) <span className="text-xs font-normal text-gray-400 ml-1">(Max size: 700KB each)</span></Label>
                      <div className="grid grid-cols-4 gap-3">
                        {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => {
                          const imgUrl = classifiedForm.images?.[index] || ''
                          return (
                            <div key={index} className="relative border-2 border-dashed border-gray-200 rounded-xl h-24 flex items-center justify-center overflow-hidden bg-gray-50/50 hover:border-orange-400 transition-colors group">
                              {imgUrl ? (
                                <>
                                  <img src={imgUrl} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs shadow hover:scale-110 transition-transform"
                                    onClick={() => {
                                      const newImages = [...(classifiedForm.images || [])]
                                      newImages[index] = ''
                                      setClassifiedForm({ ...classifiedForm, images: newImages.filter(Boolean) })
                                    }}
                                  ><X className="w-3 h-3"/></button>
                                </>
                              ) : (
                                <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-orange-500">
                                  <Upload className="h-4 w-4 mb-1 group-hover:scale-110 transition-transform" />
                                  <span className="text-[10px] font-medium">{index + 1}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0]
                                      if (!file) return
                                      if (file.size > 700 * 1024) {
                                        toast({ title: 'Image must be under 700KB', variant: 'destructive' })
                                        return
                                      }
                                      try {
                                        const formData = new FormData()
                                        formData.append('file', file)
                                        const token = await getFreshToken() || localStorage.getItem('token')
                                        const res = await fetch('/api/upload', { method: 'POST', headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }, body: formData })
                                        const data = await res.json()
                                        if (res.ok) {
                                          const newImages = [...(classifiedForm.images || [])]
                                          newImages[index] = data.url
                                          setClassifiedForm({ ...classifiedForm, images: newImages })
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
                      <p className="text-xs text-gray-500">Click each slot to upload an image. Max 700KB per image.</p>
                    </div>
                  </div>
                  <DialogFooter className="border-t border-gray-100 pt-4 mt-2">
                    <Button variant="outline" onClick={() => setShowClassifiedForm(false)} className="rounded-xl">Cancel</Button>
                    <Button onClick={handleSaveClassified} disabled={loading} className="bg-orange-500 hover:bg-orange-600 rounded-xl text-white">{loading ? 'Saving...' : (editingClassified ? 'Update Ad' : 'Create Ad')}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Classified List */}
              <div className="space-y-4">
                {allClassifieds.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                    <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No classifieds found. Add your first classified above.</p>
                  </div>
                ) : (
                  <>
                    {/* Approved Section */}
                    <div className="mb-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-green-600 flex items-center gap-2 mb-3">
                        Approved Classified Ads
                      </h3>
                      {allClassifieds.filter(c => c.approvalStatus === 'approved').length === 0 ? (
                        <p className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-100 rounded-xl">No approved classifieds yet</p>
                      ) : (
                        <div className="space-y-2">
                          {allClassifieds.filter(c => c.approvalStatus === 'approved').map(classified => (
                            <div key={classified.id} className={`border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 transition-colors bg-white ${classified.active === false ? 'opacity-60' : ''}`}>
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                                  {(classified.images?.[0] || classified.image) ? <img src={classified.images?.[0] || classified.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Tag className="w-6 h-6"/></div>}
                                </div>
                                <div>
                                  <h4 className="font-bold text-gray-800">{getTextValue(classified.title)}</h4>
                                  <p className="text-sm text-gray-500">{classified.category} • {classified.location}</p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">APPROVED</Badge>
                                    {classified.approvedAt && (
                                      <span className="text-xs text-gray-400 font-medium">
                                        Approved: {new Date(classified.approved_at || classified.updated_at).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                  <span className={`text-xs font-semibold ${classified.active !== false ? 'text-green-600' : 'text-gray-500'}`}>
                                    {classified.active === false ? 'Disabled' : 'Enabled'}
                                  </span>
                                  <Switch checked={classified.active !== false} onCheckedChange={() => handleToggleClassified(classified.id)} className="data-[state=checked]:bg-green-500 scale-90" />
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button size="icon" variant="ghost" className="h-9 w-9 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg" onClick={() => handleEditClassified(classified)}><Edit className="h-4 w-4" /></Button>
                                  <Button size="icon" variant="ghost" className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg" onClick={() => handleDeleteClassified(classified.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pending Section */}
                    <div className="mb-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-yellow-600 flex items-center gap-2 mb-3 mt-6">
                        Pending Review
                      </h3>
                      {allClassifieds.filter(c => c.approvalStatus === 'pending' || !c.approvalStatus).length === 0 ? (
                        <p className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-100 rounded-xl">No pending classifieds</p>
                      ) : (
                        <div className="space-y-2">
                          {allClassifieds.filter(c => c.approvalStatus === 'pending' || !c.approvalStatus).map(classified => (
                            <div key={classified.id} className={`border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 transition-colors bg-white ${classified.active === false ? 'opacity-60' : ''}`}>
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                                  {(classified.images?.[0] || classified.image) ? <img src={classified.images?.[0] || classified.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Tag className="w-6 h-6"/></div>}
                                </div>
                                <div>
                                  <h4 className="font-bold text-gray-800">{getTextValue(classified.title)}</h4>
                                  <p className="text-sm text-gray-500">{classified.category} • {classified.location}</p>
                                  <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs mt-1.5">PENDING</Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-9" onClick={() => handleClassifiedAction(classified.id, 'approve')}>
                                  <Check className="h-4 w-4 mr-1.5" />Approve
                                </Button>
                                <Button size="sm" variant="outline" className="text-red-600 border-red-100 hover:bg-red-50 rounded-lg h-9" onClick={() => handleClassifiedAction(classified.id, 'reject')}>
                                  <X className="h-4 w-4 mr-1.5" />Reject
                                </Button>
                                <Button size="icon" variant="ghost" className="h-9 w-9 ml-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg" onClick={() => handleDeleteClassified(classified.id)}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Rejected Section */}
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-red-500 flex items-center gap-2 mb-3 mt-6">
                        Rejected Ads
                      </h3>
                      {allClassifieds.filter(c => c.approvalStatus === 'rejected').length === 0 ? (
                        <p className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-100 rounded-xl">No rejected classifieds</p>
                      ) : (
                        <div className="space-y-2">
                          {allClassifieds.filter(c => c.approvalStatus === 'rejected').map(classified => (
                            <div key={classified.id} className="border border-red-100 rounded-xl p-4 flex items-center justify-between bg-red-50/50 opacity-80">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl bg-white border border-red-100 overflow-hidden flex-shrink-0">
                                  {(classified.images?.[0] || classified.image) ? <img src={classified.images?.[0] || classified.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Tag className="w-6 h-6"/></div>}
                                </div>
                                <div>
                                  <h4 className="font-bold text-gray-800">{getTextValue(classified.title)}</h4>
                                  <p className="text-sm text-gray-600">{classified.category} • {classified.location}</p>
                                  <Badge className="bg-red-100 text-red-700 border-red-200 text-xs mt-1.5">REJECTED</Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button size="icon" variant="ghost" className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-100 rounded-lg" onClick={() => handleDeleteClassified(classified.id)}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reporters Tab */}
        {/* Reporters Tab */}
        <TabsContent value="reporters" className="space-y-6 mt-0">
          {/* Reporter Applications Section (Merged) */}
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                      <UserPlus className="h-4 w-4" />
                    </div>
                    Reporter Applications
                  </CardTitle>
                  <CardDescription className="mt-1">Review and manage reporter join requests</CardDescription>
                </div>
                <Button onClick={loadReporterApplications} variant="outline" size="sm" className="bg-white border-purple-200 text-purple-700 hover:bg-purple-50 rounded-xl">
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingReporterApps ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="bg-white p-6">
              {/* Status Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                {[
                  { id: 'ALL', label: 'All Applications', count: reporterApplications.length },
                  { id: 'PENDING', label: 'Pending', count: reporterApplications.filter(a => a.status === 'PENDING').length },
                  { id: 'CONTACTED', label: 'Contacted', count: reporterApplications.filter(a => a.status === 'CONTACTED').length },
                  { id: 'APPROVED', label: 'Approved', count: reporterApplications.filter(a => a.status === 'APPROVED').length },
                  { id: 'REJECTED', label: 'Rejected', count: reporterApplications.filter(a => a.status === 'REJECTED').length },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setReporterAppFilter(tab.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      reporterAppFilter === tab.id
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      reporterAppFilter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {loadingReporterApps ? (
                <div className="text-center py-12 text-muted-foreground bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <RefreshCw className="h-8 w-8 text-purple-300 mx-auto mb-3 animate-spin" />
                  <p className="font-medium text-gray-500">Loading applications...</p>
                </div>
              ) : reporterApplications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-purple-50 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="h-8 w-8" />
                  </div>
                  <p className="font-medium text-gray-600">No reporter applications found</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {reporterApplications
                    .filter(app => {
                      if (reporterAppFilter === 'ALL') return true
                      return app.status === reporterAppFilter
                    })
                    .sort((a, b) => {
                      const rank = { PENDING: 1, CONTACTED: 2, APPROVED: 3, REJECTED: 4 }
                      return (rank[a.status] || 5) - (rank[b.status] || 5)
                    })
                    .map((app) => (
                    <Card key={app.id} className={`border-0 shadow-sm ring-1 overflow-hidden transition-all rounded-xl ${
                      app.status === 'PENDING' ? 'ring-yellow-200 hover:ring-yellow-300' :
                      app.status === 'CONTACTED' ? 'ring-blue-200 hover:ring-blue-300' :
                      app.status === 'APPROVED' ? 'ring-emerald-200 hover:ring-emerald-300' :
                      'ring-red-200 hover:ring-red-300'
                    }`}>
                      <div className="flex h-full">
                        <div className={`w-1.5 ${
                          app.status === 'PENDING' ? 'bg-yellow-500' :
                          app.status === 'CONTACTED' ? 'bg-blue-500' :
                          app.status === 'APPROVED' ? 'bg-emerald-500' :
                          'bg-red-500'
                        }`}></div>
                        <CardContent className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-bold text-gray-800 text-lg truncate pr-2">{app.fullName}</h3>
                              <Badge variant="outline" className={
                                app.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                app.status === 'CONTACTED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                app.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                'bg-red-50 text-red-700 border-red-200'
                              }>
                                {app.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span className="truncate">{app.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="truncate">{app.email}</span>
                              </div>
                            </div>
                            <div className="space-y-1.5 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                              {app.experience && (
                                <p className="text-sm"><strong className="text-gray-700">Experience:</strong> <span className="text-gray-600">{app.experience}</span></p>
                              )}
                              {app.portfolio && (
                                <p className="text-sm truncate"><strong className="text-gray-700">Portfolio:</strong> <a href={app.portfolio} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{app.portfolio}</a></p>
                              )}
                              {app.reason && (
                                <p className="text-sm line-clamp-2" title={app.reason}><strong className="text-gray-700">Why join:</strong> <span className="text-gray-600">{app.reason}</span></p>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-3 font-medium">Submitted: {new Date(app.submittedAt).toLocaleDateString()}</p>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                            {app.status === 'PENDING' && (
                              <>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex-1 shadow-sm font-semibold transition-colors" onClick={() => handleReporterAppAction(app.id, 'APPROVED')}>
                                  <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                                </Button>
                                <Button size="sm" variant="outline" className="text-blue-700 border-blue-200 hover:bg-blue-50 rounded-lg flex-1 font-semibold transition-colors" onClick={() => handleReporterAppAction(app.id, 'CONTACTED')}>
                                  <Phone className="h-3.5 w-3.5 mr-1" /> Contacted
                                </Button>
                                <Button size="sm" variant="outline" className="text-red-700 border-red-200 hover:bg-red-50 rounded-lg flex-1 font-semibold transition-colors" onClick={() => handleReporterAppAction(app.id, 'REJECTED')}>
                                  <X className="h-3.5 w-3.5 mr-1" /> Reject
                                </Button>
                              </>
                            )}
                            {app.status === 'CONTACTED' && (
                              <>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex-1 shadow-sm font-semibold transition-colors" onClick={() => handleReporterAppAction(app.id, 'APPROVED')}>
                                  <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                                </Button>
                                <Button size="sm" variant="outline" className="text-red-700 border-red-200 hover:bg-red-50 rounded-lg flex-1 font-semibold transition-colors" onClick={() => handleReporterAppAction(app.id, 'REJECTED')}>
                                  <X className="h-3.5 w-3.5 mr-1" /> Reject
                                </Button>
                              </>
                            )}
                            {app.status === 'APPROVED' && (
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 flex-1">
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                <span>Approved Reporter</span>
                              </div>
                            )}
                            {app.status === 'REJECTED' && (
                              <Button size="sm" variant="outline" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 rounded-lg flex-1 font-semibold transition-colors" onClick={() => handleReporterAppAction(app.id, 'APPROVED')}>
                                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Re-approve
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" className="text-gray-400 hover:text-red-600 rounded-lg h-9 w-9 shrink-0" onClick={() => handleDeleteReporterApp(app.id)} title="Delete Application">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden mt-6">
            <CardHeader className="bg-white border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                  <Users className="h-4 w-4" />
                </div>
                Reporter Approvals
              </CardTitle>
              <CardDescription className="mt-1">Approve or reject reporter registrations</CardDescription>
            </CardHeader>
            <CardContent className="bg-white p-6">
              {pendingData.users.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <p className="font-medium text-gray-600">No pending reporter registrations</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3 pr-4">
                    {pendingData.users.map((reporter) => (
                      <Card key={reporter.id} className="border-0 shadow-sm bg-white overflow-hidden ring-1 ring-gray-100 hover:ring-teal-100 transition-all rounded-xl">
                        <div className="flex">
                          <div className="w-1.5 bg-teal-400"></div>
                          <CardContent className="p-4 flex-1 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center font-bold text-lg ring-1 ring-teal-100">
                                {reporter.name?.charAt(0)?.toUpperCase() || 'R'}
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-800">{reporter.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-sm text-gray-500">{reporter.email}</p>
                                  <span className="text-gray-300">•</span>
                                  <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-200 border-0">{reporter.role}</Badge>
                                </div>
                                <p className="text-xs text-gray-400 font-medium mt-1">
                                  Registered: {new Date(reporter.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                size="sm"
                                onClick={() => handleUserAction(reporter.id, 'approve')}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm h-9"
                              >
                                <Check className="h-4 w-4 mr-1.5" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUserAction(reporter.id, 'reject')}
                                disabled={loading}
                                className="text-red-600 border-red-100 hover:bg-red-50 rounded-lg h-9"
                              >
                                <X className="h-4 w-4 mr-1.5" />
                                Reject
                              </Button>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Create Reporter Section */}
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden mt-6">
            <CardHeader className="bg-white border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <UserPlus className="h-4 w-4" />
                    </div>
                    Create Reporter Account
                  </CardTitle>
                  <CardDescription className="mt-1">Directly create a reporter account</CardDescription>
                </div>
                <Button
                  onClick={() => setShowCreateReporterForm(!showCreateReporterForm)}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-sm h-10 px-4"
                >
                  {showCreateReporterForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  {showCreateReporterForm ? 'Cancel' : 'Add Reporter'}
                </Button>
              </div>
            </CardHeader>
            {showCreateReporterForm && (
              <CardContent className="bg-gray-50/50 p-6 border-b border-gray-100">
                <div className="grid gap-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="reporterName" className="text-gray-700 font-semibold">Full Name *</Label>
                      <Input
                        id="reporterName"
                        value={createReporterForm.name}
                        onChange={(e) => setCreateReporterForm({ ...createReporterForm, name: e.target.value })}
                        placeholder="Enter reporter name"
                        className="bg-white rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reporterEmail" className="text-gray-700 font-semibold">Email *</Label>
                      <Input
                        id="reporterEmail"
                        type="email"
                        value={createReporterForm.email}
                        onChange={(e) => setCreateReporterForm({ ...createReporterForm, email: e.target.value })}
                        placeholder="reporter@email.com"
                        className="bg-white rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="reporterPhone" className="text-gray-700 font-semibold">Phone</Label>
                      <Input
                        id="reporterPhone"
                        value={createReporterForm.phone}
                        onChange={(e) => setCreateReporterForm({ ...createReporterForm, phone: e.target.value })}
                        placeholder="+91 XXXXXXXXXX"
                        className="bg-white rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reporterPassword" className="text-gray-700 font-semibold">Password *</Label>
                      <Input
                        id="reporterPassword"
                        type="text"
                        value={createReporterForm.password}
                        onChange={(e) => setCreateReporterForm({ ...createReporterForm, password: e.target.value })}
                        placeholder="Enter password (min 6 characters)"
                        required
                        className="bg-white rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-2">
                    <Button variant="outline" className="rounded-xl" onClick={() => {
                      setShowCreateReporterForm(false)
                      setCreateReporterForm({ name: '', email: '', phone: '', password: '' })
                    }}>
                      Cancel
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-sm px-6"
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
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden mt-6">
            <CardHeader className="bg-white border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Users className="h-4 w-4" />
                    </div>
                    All Reporters <Badge className="ml-2 bg-blue-50 text-blue-700 border-0">{allReporters.length}</Badge>
                  </CardTitle>
                  <CardDescription className="mt-1">Manage all registered reporter accounts</CardDescription>
                </div>
                <Button onClick={loadAllReporters} variant="outline" size="sm" disabled={loadingAllReporters} className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl">
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingAllReporters ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="bg-white p-6">
              {loadingAllReporters ? (
                <div className="text-center py-12 text-muted-foreground bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <RefreshCw className="h-8 w-8 text-blue-300 mx-auto mb-3 animate-spin" />
                  <p className="font-medium text-gray-500">Loading reporters...</p>
                </div>
              ) : allReporters.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8" />
                  </div>
                  <p className="font-medium text-gray-600">No reporters found</p>
                  <p className="text-sm mt-1 text-gray-400">Create a reporter account above</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allReporters.map((reporter) => (
                    <div key={reporter.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors bg-white">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                          {reporter.name?.charAt(0)?.toUpperCase() || 'R'}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800">{reporter.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-gray-500">{reporter.email}</p>
                            {reporter.phone && (
                              <>
                                <span className="text-gray-300">•</span>
                                <p className="text-sm text-gray-500">{reporter.phone}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <p className="text-xs text-gray-400 font-medium hidden sm:block">
                            Joined: {new Date(reporter.createdAt).toLocaleDateString()}
                          </p>
                          <Badge className={reporter.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}>
                            {reporter.status}
                          </Badge>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg h-9 w-9"
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
        </TabsContent>

        {/* Shorts Tab */}
        <TabsContent value="shorts" className="space-y-4">
          <AdminShortsPanel toast={toast} />
        </TabsContent>

        {/* E-Newspaper Tab */}
        <TabsContent value="enewspaper" className="space-y-6 mt-0">
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <FileText className="h-4 w-4" />
                </div>
                E-Newspaper Management
              </CardTitle>
              <CardDescription className="mt-1">Upload and manage PDF e-newspapers</CardDescription>
            </CardHeader>
            <CardContent className="bg-white p-6 space-y-6">
              {/* Upload Form */}
              <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50/50">
                <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
                  <span className="text-xl">📘</span> Upload New E-Newspaper
                </h3>

                <div className="grid md:grid-cols-2 gap-5 mb-5">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold">Newspaper Title *</Label>
                    <Input
                      value={enewspaperForm.title}
                      onChange={(e) => setEnewspaperForm({ ...enewspaperForm, title: e.target.value })}
                      placeholder="e.g., Daily Edition"
                      className="bg-white rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold">Edition Date *</Label>
                    <Input
                      type="date"
                      value={enewspaperForm.editionDate}
                      onChange={(e) => setEnewspaperForm({ ...enewspaperForm, editionDate: e.target.value })}
                      className="bg-white rounded-xl"
                    />
                  </div>
                </div>

                {/* PDF File Upload */}
                <div className="mb-5">
                  <Label className="block mb-2 text-gray-700 font-semibold">Upload PDF File *</Label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-red-400 hover:bg-red-50/30 transition-colors cursor-pointer group bg-white"
                    onClick={() => enewspaperFileInputRef.current?.click()}>
                    <input
                      type="file"
                      ref={enewspaperFileInputRef}
                      accept=".pdf"
                      onChange={handleEnewspaperFileChange}
                      className="hidden"
                    />
                    {enewspaperPdfFile ? (
                      <div className="flex items-center justify-center gap-4">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="font-bold text-gray-800 truncate">{enewspaperPdfFile.name}</p>
                          <p className="text-sm text-gray-500">{(enewspaperPdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-lg flex-shrink-0" onClick={(e) => { e.stopPropagation(); resetEnewspaperForm() }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <FileText className="h-8 w-8 text-gray-400 group-hover:text-red-400 transition-colors" />
                        </div>
                        <p className="text-gray-600 font-bold text-lg">Click to Choose PDF File</p>
                        <p className="text-sm text-gray-400 mt-1 font-medium">Max size: 25MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* PDF Preview */}
                {enewspaperPdfPreview && (
                  <div className="mb-5">
                    <Label className="block mb-2 text-gray-700 font-semibold">PDF Preview</Label>
                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-black/5">
                      <iframe
                        src={enewspaperPdfPreview}
                        className="w-full h-80"
                        title="PDF Preview"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2 mb-5">
                  <Label className="text-gray-700 font-semibold">Thumbnail Image URL (Optional)</Label>
                  <Input
                    value={enewspaperForm.thumbnailUrl}
                    onChange={(e) => setEnewspaperForm({ ...enewspaperForm, thumbnailUrl: e.target.value })}
                    placeholder="https://..."
                    className="bg-white rounded-xl"
                  />
                </div>

                <div className="space-y-2 mb-6">
                  <Label className="text-gray-700 font-semibold">Description (Optional)</Label>
                  <Textarea
                    value={enewspaperForm.description}
                    onChange={(e) => setEnewspaperForm({ ...enewspaperForm, description: e.target.value })}
                    placeholder="Any additional notes..."
                    rows={2}
                    className="bg-white rounded-xl resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveEnewspaper}
                    disabled={loading || !enewspaperPdfFile}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm px-6 h-11 text-base"
                  >
                    {uploadingEnewspaper ? 'Uploading PDF...' : loading ? 'Saving...' : 'Upload E-Newspaper'}
                  </Button>
                  <Button variant="outline" onClick={resetEnewspaperForm} className="rounded-xl h-11 px-6">Cancel</Button>
                </div>
              </div>

              {/* Uploaded Papers List */}
              <div className="pt-2">
                <h4 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-red-500 rounded-full inline-block"></span>
                  Uploaded E-Newspapers
                </h4>
                {allEnewspapers.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-red-50 text-red-300 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8" />
                    </div>
                    <p className="font-medium text-gray-500">No e-newspapers uploaded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allEnewspapers.map((paper) => (
                      <div key={paper.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors bg-white">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-red-100">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div>
                            <h5 className="font-bold text-gray-800">{paper.title}</h5>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm text-gray-500">
                                Edition: {new Date(paper.publishDate || paper.editionDate).toLocaleDateString()}
                              </p>
                              <span className="text-gray-300">•</span>
                              <p className="text-xs text-gray-400 font-medium">
                                Uploaded: {new Date(paper.createdAt || paper.uploadedAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={
                            paper.approvalStatus === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                              paper.approvalStatus === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }>
                            {paper.approvalStatus || 'pending'}
                          </Badge>
                          <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer" className="ml-2">
                            <Button size="sm" variant="outline" className="rounded-lg h-9">View PDF</Button>
                          </a>
                          
                          {(!paper.approvalStatus || paper.approvalStatus === 'pending') && (
                            <div className="flex items-center gap-1.5 border-l border-gray-200 pl-3 ml-1">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-9 w-9 p-0" onClick={async () => {
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
                              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 rounded-lg h-9 w-9 p-0" onClick={async () => {
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
                            </div>
                          )}
                          <Button size="icon" variant="ghost" className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg h-9 w-9 ml-1" onClick={() => handleDeleteEnewspaper(paper.id)}>
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
        </TabsContent>

        {/* Content Management Tab */}
        <TabsContent value="content" className="space-y-6 mt-0">
          {/* Ads Request Section */}
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50/30">
            <CardHeader className="bg-white/50 backdrop-blur-sm border-b border-blue-100/50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Megaphone className="h-4 w-4" />
                    </div>
                    Ads Request
                  </CardTitle>
                  <CardDescription className="mt-1">Requests from 'Promote Your Business/Ad' forms</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadBusinessPromotions} disabled={loadingPromotions} className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl">
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingPromotions ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {businessPromotions.length === 0 ? (
                <div className="text-center py-12 bg-white/50 rounded-2xl border border-dashed border-blue-200">
                  <div className="w-16 h-16 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Megaphone className="h-8 w-8" />
                  </div>
                  <p className="font-medium text-gray-500">No ad requests found</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {businessPromotions.map((promo) => (
                    <Card key={promo.id} className={`border-0 shadow-sm ring-1 overflow-hidden transition-all rounded-xl bg-white ${
                      promo.status === 'PENDING' ? 'ring-yellow-200 hover:ring-yellow-300' : 
                      promo.status === 'CONTACTED' ? 'ring-blue-200 hover:ring-blue-300' : 
                      promo.status === 'APPROVED' ? 'ring-green-200 hover:ring-green-300' : 
                      'ring-red-200 hover:ring-red-300'
                    }`}>
                      <div className="flex h-full">
                        <div className={`w-1.5 ${
                          promo.status === 'PENDING' ? 'bg-yellow-400' : 
                          promo.status === 'CONTACTED' ? 'bg-blue-400' : 
                          promo.status === 'APPROVED' ? 'bg-green-400' : 
                          'bg-red-400'
                        }`}></div>
                        <CardContent className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-bold text-gray-800 text-lg truncate pr-2">{promo.businessName}</h3>
                              <Badge variant="outline" className={
                                promo.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                  promo.status === 'CONTACTED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    promo.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' : 
                                    'bg-red-50 text-red-700 border-red-200'
                              }>
                                {promo.status}
                              </Badge>
                            </div>
                            <div className="space-y-2 mb-4">
                              <p className="text-sm font-medium text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                <span className="text-gray-500">Owner:</span> {promo.ownerName}
                              </p>
                              {promo.reason && (
                                <p className="text-sm font-medium text-gray-800 italic border-l-2 border-blue-200 pl-2">"{promo.reason}"</p>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span className="truncate">{promo.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="truncate">{promo.email}</span>
                              </div>
                            </div>
                            <div className="space-y-1.5 bg-gray-50/50 p-3 rounded-xl border border-gray-100 mt-3">
                              <p className="text-sm break-words"><strong className="text-gray-700">Address:</strong> <span className="text-gray-600">{promo.address}</span></p>
                              {promo.description && (
                                <p className="text-sm text-gray-600 border-t border-gray-200 pt-1.5 mt-1.5 break-words">"{promo.description}"</p>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-3 font-medium flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> Submitted: {new Date(promo.submittedAt).toLocaleString()}
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-4">
                            {promo.status === 'PENDING' && (
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex-1" onClick={() => handlePromotionAction(promo.id, 'contacted')}>
                                <Check className="h-3.5 w-3.5 mr-1" /> Mark Contacted
                              </Button>
                            )}
                            {promo.status !== 'APPROVED' && (
                              <Button size="sm" variant="outline" className="text-green-700 border-green-200 hover:bg-green-50 rounded-lg flex-1" onClick={() => handlePromotionAction(promo.id, 'approve')}>
                                <Check className="h-3.5 w-3.5 mr-1" /> Approve
                              </Button>
                            )}
                            {promo.status !== 'REJECTED' && (
                              <Button size="sm" variant="outline" className="text-red-700 border-red-200 hover:bg-red-50 rounded-lg flex-1" onClick={() => handlePromotionAction(promo.id, 'reject')}>
                                <X className="h-3.5 w-3.5 mr-1" /> Reject
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" className="text-gray-400 hover:text-red-600 rounded-lg h-9 w-9" onClick={() => handlePromotionAction(promo.id, 'delete')}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Premium Advertisement Banner */}
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <Image className="h-4 w-4" />
                </div>
                Header Advertisements
              </CardTitle>
              <CardDescription className="mt-1">Control the main advertisement banner on homepage</CardDescription>
            </CardHeader>
            <CardContent className="bg-white p-6 space-y-6">
              <div className="flex items-center justify-between p-5 bg-purple-50/50 rounded-2xl border border-purple-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-purple-600">
                    <Megaphone className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-lg">Header Ad</p>
                    <p className="text-sm text-gray-500 font-medium">Show/hide the top header advertisement</p>
                  </div>
                </div>
                <Switch
                  checked={contentSettings.premiumAd?.enabled}
                  onCheckedChange={(checked) => {
                    const updated = { ...contentSettings, premiumAd: { ...contentSettings.premiumAd, enabled: checked } }
                    setContentSettings(updated)
                    savePremiumAdSettings(updated.premiumAd)
                    toast({ title: checked ? 'Premium Ad Enabled' : 'Premium Ad Disabled' })
                  }}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>

              {contentSettings.premiumAd?.enabled && (
                <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50/50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="grid gap-6 md:grid-cols-2 mb-6">
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-semibold">Ad Image URL or Upload <span className="text-xs font-normal text-gray-400 ml-1">(Max size: 700KB)</span></Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://example.com/ad-image.jpg"
                          value={contentSettings.premiumAd?.imageUrl || ''}
                          onChange={(e) => setContentSettings({
                            ...contentSettings,
                            premiumAd: { ...contentSettings.premiumAd, imageUrl: e.target.value }
                          })}
                          className="flex-1 bg-white rounded-xl"
                        />
                        <input
                          type="file"
                          ref={premiumAdImageRef}
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            if (file.size > 700 * 1024) {
                              toast({ title: 'Image must be under 700KB', variant: 'destructive' })
                              return
                            }
                            setUploadingPremiumAd(true)
                            try {
                              const formData = new FormData()
                              formData.append('file', file)
                              const res = await fetch('/api/upload', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: formData })
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
                          className="rounded-xl bg-white border-purple-200 hover:bg-purple-50 hover:text-purple-700 text-purple-600 font-medium"
                          onClick={() => premiumAdImageRef.current?.click()}
                          disabled={uploadingPremiumAd}
                        >
                          {uploadingPremiumAd ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                          {uploadingPremiumAd ? 'Uploading...' : 'Upload'}
                        </Button>
                        {contentSettings.premiumAd?.imageUrl && (
                          <Button
                            variant="destructive"
                            size="icon"
                            className="rounded-xl h-10 w-10"
                            onClick={() => setContentSettings({
                              ...contentSettings,
                              premiumAd: { ...contentSettings.premiumAd, imageUrl: '' }
                            })}
                            title="Delete Image"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-semibold">Ad Link URL</Label>
                      <Input
                        placeholder="https://advertiser-website.com"
                        value={contentSettings.premiumAd?.linkUrl || ''}
                        onChange={(e) => setContentSettings({
                          ...contentSettings,
                          premiumAd: { ...contentSettings.premiumAd, linkUrl: e.target.value }
                        })}
                        className="bg-white rounded-xl"
                      />
                    </div>
                  </div>

                  <Button
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm px-6 h-11"
                    onClick={async () => {
                      const success = await savePremiumAdSettings(contentSettings.premiumAd)
                      if (success) {
                        toast({ title: 'Premium Ad Settings Saved to Database' })
                      } else {
                        toast({ title: 'Error saving settings', variant: 'destructive' })
                      }
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Save Premium Ad Settings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sidebar Advertisement - Numbered Images with Individual Destination URLs */}
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden mt-6">
            <CardHeader className="bg-white border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Image className="h-4 w-4" />
                </div>
                Sidebar Advertisements
              </CardTitle>
              <CardDescription className="mt-1">Manage sidebar ad images - each image has its own destination URL (max 4 images)</CardDescription>
            </CardHeader>
            <CardContent className="bg-white p-6 space-y-6">
              <div className="flex items-center justify-between p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600">
                    <Megaphone className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-lg">Sidebar Ad</p>
                    <p className="text-sm text-gray-500 font-medium">Show/hide the sidebar advertisement</p>
                  </div>
                </div>
                <Switch
                  checked={contentSettings.sidebarAd?.enabled}
                  onCheckedChange={(checked) => {
                    const updated = { ...contentSettings, sidebarAd: { ...contentSettings.sidebarAd, enabled: checked } }
                    setContentSettings(updated)
                    saveSidebarAdSettings(updated.sidebarAd)
                    toast({ title: checked ? 'Sidebar Ad Enabled' : 'Sidebar Ad Disabled' })
                  }}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>

              {contentSettings.sidebarAd?.enabled && (
                <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50/50 animate-in fade-in zoom-in-95 duration-200">
                  {/* Numbered Image Cards */}
                  <div className="space-y-5">
                    <div>
                      <Label className="text-lg font-bold text-gray-800">Sidebar Ad Images</Label>
                      <p className="text-sm text-gray-500 mt-1">Each image opens its own destination URL when clicked. Images must be A4 portrait (3:4) or Square (1:1).</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {[0, 1, 2, 3].map((index) => {
                        const item = contentSettings.sidebarAd?.items?.[index] || { imageUrl: '', destinationUrl: '' }
                        const hasImage = item.imageUrl && item.imageUrl.trim() !== ''

                        return (
                          <Card key={index} className={`border-2 rounded-2xl overflow-hidden transition-all ${hasImage ? 'border-blue-200 bg-white shadow-sm ring-1 ring-blue-50' : 'border-dashed border-gray-200 bg-gray-50/50'}`}>
                            <CardContent className="p-5 space-y-4">
                              {/* Image Number Label */}
                              <div className="flex items-center justify-between">
                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0 font-bold px-3 py-1 rounded-lg">Image {index + 1}</Badge>
                                {hasImage && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-3 rounded-lg font-medium"
                                    onClick={() => {
                                      const items = [...(contentSettings.sidebarAd?.items || [])]
                                      items[index] = { imageUrl: '', destinationUrl: '' }
                                      setContentSettings({
                                        ...contentSettings,
                                        sidebarAd: { ...contentSettings.sidebarAd, items }
                                      })
                                    }}
                                  >
                                    <X className="h-4 w-4 mr-1.5" />
                                    Remove
                                  </Button>
                                )}
                              </div>

                              {/* Rectangle Image Preview - Smaller */}
                              <div className="h-32 w-full bg-white rounded-xl overflow-hidden border border-gray-100 relative group">
                                {hasImage ? (
                                  <>
                                    <img
                                      src={item.imageUrl}
                                      alt={`Ad ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <Button variant="secondary" size="sm" className="rounded-lg" onClick={() => window.open(item.imageUrl, '_blank')}>View Full</Button>
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                                      <Image className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <span className="text-sm font-medium">No Image</span>
                                  </div>
                                )}
                              </div>

                              {/* Image URL Input */}
                              <div className="space-y-1.5">
                                <Label className="text-sm font-semibold text-gray-700">Image URL <span className="text-xs font-normal text-gray-400 ml-1">(Max: 700KB)</span></Label>
                                <div className="flex gap-2">
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
                                    className="text-sm bg-white rounded-xl h-10"
                                  />
                                  <input
                                    type="file"
                                    id={`sidebar-upload-${index}`}
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0]
                                      if (!file) return
                                      if (file.size > 700 * 1024) {
                                        toast({ title: 'Image must be under 700KB', variant: 'destructive' })
                                        return
                                      }
                                      try {
                                        const formData = new FormData()
                                        formData.append('file', file)
                                        const res = await fetch('/api/upload', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: formData })
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
                                    className="h-10 px-4 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
                                    onClick={() => document.getElementById(`sidebar-upload-${index}`)?.click()}
                                  >
                                    <Upload className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Destination URL Input */}
                              <div className="space-y-1.5">
                                <Label className="text-sm font-semibold text-gray-700">Destination URL (Click opens this link)</Label>
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
                                  className="text-sm bg-white rounded-xl h-10"
                                />
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>

                  <Button
                    className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm h-11 text-base"
                    onClick={async () => {
                      const success = await saveSidebarAdSettings(contentSettings.sidebarAd)
                      if (success) {
                        toast({ title: 'Sidebar Ad Settings Saved to Database' })
                      } else {
                        toast({ title: 'Error saving settings', variant: 'destructive' })
                      }
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Save Sidebar Ad Settings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inner Page Advertisements */}
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden mt-6">
            <CardHeader className="bg-white border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                  <FileText className="h-4 w-4" />
                </div>
                Inner Page Advertisements
              </CardTitle>
              <CardDescription className="mt-1">Manage ads shown on article/news detail pages</CardDescription>
            </CardHeader>
            <CardContent className="bg-white p-6 space-y-6">
              {/* Article Ad Banner (Pink/Purple - Advertise Your Business) */}
              <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50/50 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                      <span className="w-2 h-6 bg-pink-500 rounded-full inline-block"></span>
                      Article Ad Banner
                    </h4>
                    <p className="text-sm text-gray-500 font-medium mt-1 ml-4">Pink/purple banner (Must be A4 portrait or Square format)</p>
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
                      saveArticleAdSettings(updated.articleAd)
                      toast({ title: checked ? 'Article Ad Banner Enabled' : 'Article Ad Banner Disabled' })
                    }}
                    className="data-[state=checked]:bg-pink-500"
                  />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold">Image URL <span className="text-xs font-normal text-gray-400 ml-1">(Max size: 700KB)</span></Label>
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
                        className="flex-1 bg-white rounded-xl"
                      />
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            if (file.size > 700 * 1024) {
                              toast({ title: 'Image must be under 700KB', variant: 'destructive' })
                              return
                            }
                            try {
                              const formData = new FormData()
                              formData.append('file', file)
                              const res = await fetch('/api/upload', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: formData })
                              const data = await res.json()
                              if (res.ok) {
                                const updated = {
                                  ...contentSettings,
                                  articleAd: {
                                    ...contentSettings.articleAd,
                                    banner: { ...contentSettings.articleAd?.banner, imageUrl: data.url }
                                  }
                                }
                                setContentSettings(updated)
                                toast({ title: 'Article Ad Banner image uploaded!' })
                              } else {
                                toast({ title: 'Upload failed', variant: 'destructive' })
                              }
                            } catch (err) {
                              toast({ title: 'Upload failed', variant: 'destructive' })
                            }
                          }}
                        />
                        <div className="h-10 px-4 rounded-xl border border-pink-200 text-pink-600 bg-white hover:bg-pink-50 flex items-center justify-center font-medium transition-colors">
                          <Upload className="h-4 w-4 mr-2" /> Upload
                        </div>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold">Click/Destination URL</Label>
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
                      className="bg-white rounded-xl"
                    />
                  </div>
                </div>
              </div>
              
              {/* Article Sticky Ad (Bottom sticky - Premium Ad Space) */}
              <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50/50 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                      <span className="w-2 h-6 bg-orange-500 rounded-full inline-block"></span>
                      Article Sticky Ad
                    </h4>
                    <p className="text-sm text-gray-500 font-medium mt-1 ml-4">Bottom sticky "Premium Ad Space" banner (Must be A4 portrait or Square format)</p>
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
                      saveArticleAdSettings(updated.articleAd)
                      toast({ title: checked ? 'Article Sticky Ad Enabled' : 'Article Sticky Ad Disabled' })
                    }}
                    className="data-[state=checked]:bg-orange-500"
                  />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold">Image URL <span className="text-xs font-normal text-gray-400 ml-1">(Max size: 700KB)</span></Label>
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
                        className="flex-1 bg-white rounded-xl"
                      />
                      <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          if (file.size > 700 * 1024) {
                            toast({ title: 'Image must be under 700KB', variant: 'destructive' })
                            return
                          }
                          try {
                            const formData = new FormData()
                            formData.append('file', file)
                            const res = await fetch('/api/upload', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: formData })
                            const data = await res.json()
                            if (res.ok) {
                              const updated = {
                                ...contentSettings,
                                articleAd: {
                                  ...contentSettings.articleAd,
                                  sticky: { ...contentSettings.articleAd?.sticky, imageUrl: data.url }
                                }
                              }
                              setContentSettings(updated)
                              toast({ title: 'Article Sticky Ad image uploaded!' })
                            } else {
                              toast({ title: 'Upload failed', variant: 'destructive' })
                            }
                          } catch (err) {
                            toast({ title: 'Upload failed', variant: 'destructive' })
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
              </div>

              {/* Save Button */}
              <Button
                className="w-full bg-pink-600 hover:bg-pink-700"
                onClick={() => {
                  saveArticleAdSettings(contentSettings.articleAd)
                  saveContentSettings(contentSettings)
                  toast({ title: 'Article Page Ads Saved' })
                }}
              >
                Save Inner Page Ad Settings
              </Button>
            </CardContent>
          </Card>

          {/* Homepage Business Sidebar Ad */}
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden mt-6">
            <CardHeader className="bg-white border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <Building2 className="h-4 w-4" />
                </div>
                Homepage Business Sidebar Ad
              </CardTitle>
              <CardDescription className="mt-1">Manage the "BUSINESS Advertisement" sidebar on homepage</CardDescription>
            </CardHeader>
            <CardContent className="bg-white p-6 space-y-6">
              <div className="flex items-center justify-between p-5 bg-orange-50/50 rounded-2xl border border-orange-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-orange-600">
                    <Megaphone className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-lg">Business Ad Section</p>
                    <p className="text-sm text-gray-500 font-medium">Show/hide the BUSINESS sidebar on homepage</p>
                  </div>
                </div>
                <Switch
                  checked={contentSettings.businessAd?.enabled}
                  onCheckedChange={(checked) => {
                    const updated = {
                      ...contentSettings,
                      businessAd: { ...contentSettings.businessAd, enabled: checked }
                    }
                    setContentSettings(updated)
                    saveBusinessAdSettings(updated.businessAd)
                    toast({ title: checked ? 'Business Ad Section Enabled' : 'Business Ad Section Disabled' })
                  }}
                  className="data-[state=checked]:bg-orange-500"
                />
              </div>

              {contentSettings.businessAd?.enabled && (
                <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50/50 animate-in fade-in zoom-in-95 duration-200 space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-semibold">Title (e.g., BUSINESS)</Label>
                      <Input
                        placeholder="BUSINESS"
                        value={contentSettings.businessAd?.title || ''}
                        onChange={(e) => setContentSettings({
                          ...contentSettings,
                          businessAd: { ...contentSettings.businessAd, title: e.target.value }
                        })}
                        className="bg-white rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-semibold">Subtitle</Label>
                      <Input
                        placeholder="Advertisement"
                        value={contentSettings.businessAd?.subtitle || ''}
                        onChange={(e) => setContentSettings({
                          ...contentSettings,
                          businessAd: { ...contentSettings.businessAd, subtitle: e.target.value }
                        })}
                        className="bg-white rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-semibold">Button Text</Label>
                      <Input
                        placeholder="POST YOUR AD"
                        value={contentSettings.businessAd?.buttonText || ''}
                        onChange={(e) => setContentSettings({
                          ...contentSettings,
                          businessAd: { ...contentSettings.businessAd, buttonText: e.target.value }
                        })}
                        className="bg-white rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-semibold">Button Link URL</Label>
                      <Input
                        placeholder="https://wa.me/91XXXXXXXXXX"
                        value={contentSettings.businessAd?.linkUrl || ''}
                        onChange={(e) => setContentSettings({
                          ...contentSettings,
                          businessAd: { ...contentSettings.businessAd, linkUrl: e.target.value }
                        })}
                        className="bg-white rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold">Custom Image URL (Optional - replaces default gradient) <span className="text-xs font-normal text-gray-400 ml-1">(Max size: 700KB)</span></Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://example.com/business-ad.jpg"
                        value={contentSettings.businessAd?.imageUrl || ''}
                        onChange={(e) => setContentSettings({
                          ...contentSettings,
                          businessAd: { ...contentSettings.businessAd, imageUrl: e.target.value }
                        })}
                        className="flex-1 bg-white rounded-xl"
                      />
                      <input
                        type="file"
                        id="business-ad-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          if (file.size > 700 * 1024) {
                            toast({ title: 'Image must be under 700KB', variant: 'destructive' })
                            return
                          }
                          try {
                            const formData = new FormData()
                            formData.append('file', file)
                            const res = await fetch('/api/upload', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: formData })
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
                        className="h-10 px-4 rounded-xl border-orange-200 text-orange-600 bg-white hover:bg-orange-50 font-medium"
                        onClick={() => document.getElementById('business-ad-upload')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" /> Upload
                      </Button>
                    </div>
                  </div>
                  <Button
                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-sm w-full h-11 text-base mt-2"
                    onClick={() => {
                      saveBusinessAdSettings(contentSettings.businessAd)
                      toast({ title: 'Business Sidebar Ad Settings Saved' })
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Save Business Ad Settings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trending News Section */}
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden mt-6">
            <CardHeader className="bg-white border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <TrendingUp className="h-4 w-4" />
                </div>
                Trending News Section
              </CardTitle>
              <CardDescription className="mt-1">Control the trending news section on homepage</CardDescription>
            </CardHeader>
            <CardContent className="bg-white p-6 space-y-6">
              <div className="flex items-center justify-between p-5 bg-red-50/50 rounded-2xl border border-red-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-red-600">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-lg">Trending Section</p>
                    <p className="text-sm text-gray-500 font-medium">Show/hide the trending news section</p>
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
                  className="data-[state=checked]:bg-red-500"
                />
              </div>

              {contentSettings.trending?.enabled && (
                <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50/50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="space-y-2 mb-4">
                    <Label className="text-lg font-bold text-gray-800">Select Trending News Articles</Label>
                    <p className="text-sm text-gray-500 font-medium">Check articles to mark them as trending</p>
                  </div>
                  <ScrollArea className="h-[350px] border border-gray-200 rounded-xl bg-white p-3 shadow-inner">
                    {approvedNews.length > 0 ? (
                      <div className="space-y-2">
                        {approvedNews.map((article) => {
                          const isTrending = (contentSettings.trending?.newsIds || []).includes(article.id)
                          return (
                            <div
                              key={article.id}
                              className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-colors border ${
                                isTrending 
                                  ? 'bg-red-50/50 border-red-200 shadow-sm' 
                                  : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-100'
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
                              <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                isTrending ? 'bg-red-500 border-red-500 text-white' : 'border-gray-300 bg-white'
                              }`}>
                                {isTrending && <Check className="h-3 w-3" />}
                              </div>
                              <span className="flex-1 text-sm font-medium text-gray-700 leading-tight">{getTextValue(article.title)}</span>
                              {isTrending && <Badge className="bg-gradient-to-r from-red-500 to-orange-500 border-0 shadow-sm font-semibold">Trending</Badge>}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                          <Newspaper className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="font-medium">No approved news articles found</p>
                      </div>
                    )}
                  </ScrollArea>
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm mt-6 h-11 text-base"
                    onClick={() => {
                      saveTrendingSettings(contentSettings.trending)
                      toast({ title: 'Trending Settings Saved', description: `${(contentSettings.trending?.newsIds || []).length} articles marked as trending` })
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Save Trending Settings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Businesses Tab - Full CRUD */}


        {/* Manage Classifieds Tab - Full CRUD */}


        {/* Manage News Tab - Full CRUD */}
        {/* Manage News Tab - Full CRUD */}
        <TabsContent value="manage-news" className="space-y-6 mt-0">
          {/* News Moderation Section (Merged) */}
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-gradient-to-br from-yellow-50 to-orange-50/30">
            <CardHeader className="bg-white/50 backdrop-blur-sm border-b border-yellow-100/50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                      <Newspaper className="h-4 w-4" />
                    </div>
                    News Moderation
                    {pendingData.news.length > 0 && (
                      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white ml-2 rounded-lg px-2 py-0.5 shadow-sm border-0 transition-colors">{pendingData.news.length} Pending</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">Review and approve news articles submitted by reporters</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {pendingData.news.length === 0 ? (
                <div className="text-center py-12 bg-white/50 rounded-2xl border border-dashed border-yellow-200">
                  <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <p className="font-medium text-gray-600 text-lg">You're all caught up!</p>
                  <p className="text-sm text-gray-500 mt-1">No pending news articles require moderation.</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4 -mr-4">
                  <div className="space-y-4">
                    {pendingData.news.map((article) => (
                      <Card key={article.id} className="border-0 shadow-sm ring-1 ring-yellow-200 hover:ring-yellow-300 overflow-hidden transition-all rounded-xl bg-white group">
                        <div className="flex h-full">
                          <div className="w-1.5 bg-yellow-400 group-hover:bg-yellow-500 transition-colors"></div>
                          <CardContent className="p-4 flex-1 flex flex-col md:flex-row items-start md:items-center gap-5">
                            {/* Image - Premium aspect ratio */}
                            <div className="flex-shrink-0 w-full md:w-32 aspect-video md:aspect-[4/3] bg-gray-50 rounded-lg overflow-hidden border border-gray-100 relative">
                              {article.mainImage ? (
                                <img
                                  src={article.mainImage}
                                  alt={getTextValue(article.title)}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                  <Newspaper className="h-6 w-6" />
                                  <span className="text-[10px] font-medium">No Image</span>
                                </div>
                              )}
                              <div className="absolute top-2 right-2 flex gap-1">
                                <Badge className="bg-yellow-500/90 text-white text-[10px] backdrop-blur-sm border-0 shadow-sm px-1.5 py-0">PENDING</Badge>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-800 text-base leading-tight mb-2 line-clamp-2" title={getTextValue(article.title)}>{getTextValue(article.title)}</h3>
                              
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 font-medium">
                                  {getTextValue(article.category) || article.genre || 'Article'}
                                </Badge>
                                {article.city && (
                                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> {article.city}
                                  </Badge>
                                )}
                                <span className="text-xs font-semibold text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded-md border border-blue-100 flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  By: {article.authorName || 'Reporter'}
                                </span>
                              </div>
                              
                              <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" /> 
                                Submitted on {new Date(article.createdAt).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                              </p>
                            </div>

                            {/* Actions - Right */}
                            <div className="flex flex-row md:flex-col items-center justify-end gap-2 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 md:pl-4 md:border-l">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // Load article into news form for editing
                                  setNewsForm({
                                    title: getTextValue(article.title),
                                    content: getTextValue(article.content),
                                    category: article.category || article.categoryId || 'City News',
                                    city: article.city || '',
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
                                className="bg-blue-50/50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 w-full rounded-lg"
                              >
                                <Edit className="h-3.5 w-3.5 mr-1.5" />
                                Review & Edit
                              </Button>
                              <div className="flex gap-2 w-full">
                                <Button
                                  size="sm"
                                  onClick={() => handleNewsAction(article.id, 'approve')}
                                  disabled={loading}
                                  className="bg-green-600 hover:bg-green-700 text-white rounded-lg flex-1 shadow-sm"
                                >
                                  <Check className="h-3.5 w-3.5 md:mr-1" />
                                  <span className="hidden md:inline">Approve</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleNewsAction(article.id, 'reject')}
                                  disabled={loading}
                                  className="text-red-700 border-red-200 hover:bg-red-50 hover:border-red-300 rounded-lg flex-1"
                                >
                                  <X className="h-3.5 w-3.5 md:mr-1" />
                                  <span className="hidden md:inline">Reject</span>
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden mt-6">
            <CardHeader className="bg-white border-b border-gray-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Newspaper className="h-4 w-4" />
                  </div>
                  Manage All News
                </CardTitle>
                <CardDescription className="mt-1">Add, edit, enable/disable, and feature news for the home page</CardDescription>
              </div>
              <Button onClick={() => { resetNewsForm(); setShowNewsForm(true) }} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm h-11 px-5">
                <Plus className="h-4 w-4 mr-2" /> Add News Article
              </Button>
            </CardHeader>
            <CardContent className="p-6 bg-gray-50/30">

              {/* News List */}
              <div className="space-y-4">
                {allNews.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Newspaper className="h-8 w-8" />
                    </div>
                    <p className="font-medium text-gray-600">No news articles found</p>
                    <p className="text-sm text-gray-500 mt-1">Add your first article using the button above.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {allNews.map(article => (
                    <Card key={article.id} className={`border-0 shadow-sm ring-1 overflow-hidden transition-all rounded-xl ${
                      article.enabled === false ? 'ring-gray-200 bg-gray-50 opacity-75' : 
                      article.featured ? 'ring-yellow-200 bg-white hover:shadow-md' : 
                      'ring-blue-100 bg-white hover:shadow-md'
                    }`}>
                      <div className="flex h-full">
                        <div className={`w-1.5 ${
                          article.enabled === false ? 'bg-gray-300' : 
                          article.featured ? 'bg-yellow-400' : 
                          'bg-blue-500'
                        }`}></div>
                        <CardContent className="p-4 flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          {/* Image - Premium aspect ratio */}
                          <div className="flex-shrink-0 w-full sm:w-28 aspect-video sm:aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-100 relative group">
                            {article.mainImage ? (
                              <img src={article.mainImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 gap-1">
                                <Newspaper className="h-5 w-5" />
                                <span className="text-[9px] font-medium">No Image</span>
                              </div>
                            )}
                            {article.featured && (
                              <div className="absolute top-1 left-1">
                                <Badge className="bg-yellow-500 text-white shadow-sm border-0 px-1 py-0 h-5 text-[10px] rounded flex items-center gap-1">
                                  <Star className="h-2.5 w-2.5 fill-current" />
                                </Badge>
                              </div>
                            )}
                          </div>

                          {/* Content - Center */}
                          <div className="flex-1 min-w-0 py-1">
                            <h4 className={`font-bold text-base leading-tight mb-2 line-clamp-2 ${article.enabled === false ? 'text-gray-500' : 'text-gray-800'}`} title={getTextValue(article.title)}>
                              {getTextValue(article.title)}
                            </h4>
                            
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${article.enabled === false ? 'border-gray-200 text-gray-400' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                {getTextValue(article.category) || article.categoryId}
                              </Badge>
                              {article.city && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center gap-1 font-semibold">
                                  <MapPin className="h-2.5 w-2.5" />
                                  {article.city}
                                </Badge>
                              )}
                              
                              <Badge className={`text-[10px] px-1.5 py-0 h-5 shadow-none border-0 ${
                                article.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' : 
                                article.approvalStatus === 'rejected' ? 'bg-red-100 text-red-700' : 
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {article.approvalStatus?.toUpperCase() || 'PENDING'}
                              </Badge>
                              
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                article.enabled === false ? 'bg-gray-100 text-gray-500' : 'text-blue-700 bg-blue-50/80 border border-blue-100'
                              }`}>
                                <Users className="h-2.5 w-2.5" />
                                {article.authorName || 'Admin'}
                              </span>
                            </div>
                            
                            <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1 mt-1.5">
                              <Calendar className="h-3 w-3" />
                              {new Date(article.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                          </div>

                          {/* Actions - Right */}
                          <div className="flex sm:flex-col items-center justify-end gap-1.5 flex-shrink-0 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                            <div className="flex gap-1.5">
                              <Button 
                                size="sm" 
                                variant={article.featured ? "default" : "outline"} 
                                onClick={() => handleToggleNewsFeatured(article.id)} 
                                title={article.featured ? "Remove from Featured" : "Mark as Featured"} 
                                className={`h-8 w-8 p-0 rounded-lg transition-colors ${article.featured ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm border-0' : 'text-gray-500 hover:text-yellow-600 border-gray-200 hover:bg-yellow-50 hover:border-yellow-200'}`}
                              >
                                <Star className={`h-4 w-4 ${article.featured ? 'fill-current' : ''}`} />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleEditNews(article)} 
                                title="Edit Article"
                                className="h-8 w-8 p-0 rounded-lg text-blue-600 border-blue-200 hover:bg-blue-50 transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 w-8 p-0 rounded-lg text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors" 
                                onClick={() => handleDeleteNews(article.id)}
                                title="Delete Article"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 sm:mt-1 bg-gray-50 sm:bg-transparent px-3 py-1 sm:p-0 rounded-lg border sm:border-0 border-gray-100 ml-auto sm:ml-0">
                              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{article.enabled !== false ? 'Live' : 'Hidden'}</span>
                              <Switch 
                                checked={article.enabled !== false} 
                                onCheckedChange={() => handleToggleNews(article.id)} 
                                className="data-[state=checked]:bg-green-500 scale-75 sm:scale-90 transform origin-right"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden mt-6">
              <CardHeader className="bg-white border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    <Lock className="h-4 w-4" />
                  </div>
                  Change Password
                </CardTitle>
                <CardDescription className="mt-1">Update your admin account password</CardDescription>
              </CardHeader>
              <CardContent className="bg-white p-6">
                <form onSubmit={handlePasswordChange} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-gray-700 font-semibold">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordForm.oldPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                      required
                      className="bg-gray-50/50 rounded-xl border-gray-200 h-11 focus-visible:ring-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-gray-700 font-semibold">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      required
                      className="bg-gray-50/50 rounded-xl border-gray-200 h-11 focus-visible:ring-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      required
                      className="bg-gray-50/50 rounded-xl border-gray-200 h-11 focus-visible:ring-slate-500"
                    />
                  </div>
                  <Button type="submit" disabled={passwordLoading} className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-sm h-11 mt-2">
                    {passwordLoading ? 'Changing Password...' : 'Change Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden mt-6">
              <CardHeader className="bg-white border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <User className="h-4 w-4" />
                  </div>
                  Admin Information
                </CardTitle>
                <CardDescription className="mt-1">Details about your account</CardDescription>
              </CardHeader>
              <CardContent className="bg-white p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-xl border border-gray-100">
                    <span className="text-gray-500 font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      Email Address
                    </span>
                    <span className="font-bold text-gray-800 bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm">{user?.email}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                    <span className="text-gray-500 font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-400" />
                      Account Role
                    </span>
                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm border-0 px-3 py-1">{user?.role?.toUpperCase() || 'ADMIN'}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-xl border border-gray-100">
                    <span className="text-gray-500 font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      Member Since
                    </span>
                    <span className="font-semibold text-gray-700">Today</span>
                  </div>
                  <div className="pt-2">
                    <Button
                      onClick={handleLogoutClick}
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl h-11 font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out of Admin Panel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== LIVE TV TAB ===== */}
        <TabsContent value="live-tv" className="space-y-6 mt-0">
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden mt-6">
            <CardHeader className="bg-white border-b border-gray-100 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                      <Video className="h-4 w-4" />
                    </div>
                    Live TV Management
                  </CardTitle>
                  <CardDescription className="mt-1">Manage your live streams and video replays</CardDescription>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                  <span className="text-sm font-semibold text-gray-700">{liveTVConfig.enabled ? 'Live TV Enabled' : 'Live TV Disabled'}</span>
                  <Switch
                    checked={liveTVConfig.enabled}
                    onCheckedChange={(checked) => handleSaveLiveTVConfig({ ...liveTVConfig, enabled: checked })}
                    className="data-[state=checked]:bg-red-500"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="bg-gray-50/30 p-6 space-y-6">
              {/* Add/Edit Stream Form */}
              <Card className="border border-dashed border-red-200 shadow-sm rounded-xl bg-white overflow-hidden">
                <CardHeader className="pb-3 bg-red-50/30 border-b border-red-100/50">
                  <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
                    {editingStream ? (
                      <><Edit className="h-4 w-4 text-red-500" /> Edit Stream Details</>
                    ) : (
                      <><PlusCircle className="h-4 w-4 text-red-500" /> Add New Stream</>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-semibold">Stream Title *</Label>
                      <Input
                        value={liveTVForm.title}
                        onChange={(e) => setLiveTVForm({ ...liveTVForm, title: e.target.value })}
                        placeholder="e.g. Star News 24/7 Live"
                        className="bg-gray-50/50 rounded-xl h-11 border-gray-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-semibold">YouTube URL *</Label>
                      <Input
                        value={liveTVForm.url}
                        onChange={(e) => setLiveTVForm({ ...liveTVForm, url: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="bg-gray-50/50 rounded-xl h-11 border-gray-200"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-3 bg-red-50/50 px-4 py-2.5 rounded-xl border border-red-100 w-full sm:w-auto">
                      <Switch
                        checked={liveTVForm.isLive}
                        onCheckedChange={(checked) => setLiveTVForm({ ...liveTVForm, isLive: checked })}
                        className="data-[state=checked]:bg-red-500"
                      />
                      <Label className="flex items-center gap-2 font-bold text-red-700 m-0 cursor-pointer" onClick={() => setLiveTVForm({ ...liveTVForm, isLive: !liveTVForm.isLive })}>
                        {liveTVForm.isLive && <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-200" />}
                        {liveTVForm.isLive ? 'Currently Broadcasting LIVE' : 'Mark as LIVE'}
                      </Label>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                      {editingStream && (
                        <Button variant="outline" onClick={handleCancelEditStream} className="rounded-xl h-11 flex-1 sm:flex-none border-gray-200 hover:bg-gray-50">Cancel</Button>
                      )}
                      <Button onClick={handleAddStream} disabled={loadingLiveTV} className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm h-11 flex-1 sm:flex-none px-6">
                        {editingStream ? <Check className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                        {editingStream ? 'Update Stream' : 'Add Stream'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Streams List */}
              {loadingLiveTV ? (
                <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
                  <p className="font-medium">Loading streams...</p>
                </div>
              ) : (liveTVConfig.streams || []).length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-red-50 text-red-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Video className="h-8 w-8" />
                  </div>
                  <p className="font-medium text-gray-600 text-lg">No streams added yet</p>
                  <p className="text-sm text-gray-500 mt-1">Add your first YouTube stream using the form above.</p>
                </div>
              ) : (
                <div className="space-y-4 mt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wider">Configured Streams</h3>
                    <Badge variant="secondary" className="rounded-full bg-gray-200 text-gray-700">{liveTVConfig.streams.length}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {(liveTVConfig.streams || []).map((stream) => (
                      <Card key={stream.id} className={`border-0 shadow-sm ring-1 overflow-hidden transition-all rounded-xl ${
                        liveTVConfig.primaryStreamId === stream.id 
                          ? 'ring-red-300 bg-red-50/30' 
                          : !stream.isActive 
                            ? 'ring-gray-200 bg-gray-50/50 opacity-75' 
                            : 'ring-gray-200 bg-white hover:ring-gray-300'
                        }`}>
                        <div className="flex">
                          <div className={`w-1.5 ${
                            liveTVConfig.primaryStreamId === stream.id ? 'bg-red-500' :
                            !stream.isActive ? 'bg-gray-300' : 'bg-gray-400'
                          }`}></div>
                          <CardContent className="p-4 flex-1">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <h4 className={`font-bold text-base truncate ${!stream.isActive ? 'text-gray-500' : 'text-gray-800'}`}>
                                    {stream.title}
                                  </h4>
                                  
                                  {stream.isLive && (
                                    <Badge className="bg-red-500 hover:bg-red-600 text-white text-[10px] px-1.5 py-0 h-5 border-0 shadow-sm flex items-center gap-1.5 rounded">
                                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                      LIVE
                                    </Badge>
                                  )}
                                  
                                  {liveTVConfig.primaryStreamId === stream.id && (
                                    <Badge className="bg-red-50 text-red-700 border border-red-200 text-[10px] px-1.5 py-0 h-5 shadow-none rounded flex items-center gap-1 font-bold">
                                      <Star className="h-2.5 w-2.5 fill-current" /> PRIMARY
                                    </Badge>
                                  )}
                                  
                                  {!stream.isActive && (
                                    <Badge className="bg-gray-100 text-gray-500 border border-gray-200 text-[10px] px-1.5 py-0 h-5 shadow-none rounded">
                                      HIDDEN
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 inline-flex max-w-full">
                                  <Video className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{stream.url}</span>
                                </div>
                                <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1 mt-2">
                                  <Calendar className="h-3 w-3" />
                                  Added: {new Date(stream.addedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-2 shrink-0 bg-white md:bg-transparent p-2 md:p-0 rounded-xl border border-gray-100 md:border-0 w-full md:w-auto">
                                <Button
                                  size="sm"
                                  variant={stream.isLive ? 'default' : 'outline'}
                                  className={`h-8 rounded-lg text-xs font-semibold px-3 ${
                                    stream.isLive 
                                      ? 'bg-red-100 text-red-700 hover:bg-red-200 border-0' 
                                      : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                                  }`}
                                  onClick={() => handleToggleStreamLive(stream.id)}
                                >
                                  {stream.isLive ? <><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-1.5 inline-block" /> Live Now</> : 'Set as Live'}
                                </Button>
                                
                                {liveTVConfig.primaryStreamId !== stream.id && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 rounded-lg text-xs font-semibold text-yellow-700 border-yellow-200 bg-yellow-50 hover:bg-yellow-100 px-3"
                                    onClick={() => handleSetPrimaryStream(stream.id)}
                                  >
                                    <Star className="h-3.5 w-3.5 mr-1" /> Make Primary
                                  </Button>
                                )}
                                
                                <div className="h-6 w-px bg-gray-200 hidden md:block mx-1"></div>
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className={`h-8 w-8 p-0 rounded-lg ${
                                    stream.isActive 
                                      ? 'text-gray-600 border-gray-200 hover:bg-gray-100' 
                                      : 'text-gray-400 border-gray-200 bg-gray-50 hover:bg-gray-100'
                                  }`}
                                  onClick={() => handleToggleStreamActive(stream.id)}
                                  title={stream.isActive ? "Hide Stream" : "Show Stream"}
                                >
                                  {stream.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 rounded-lg text-blue-600 border-blue-200 hover:bg-blue-50"
                                  onClick={() => handleEditStream(stream)}
                                  title="Edit Stream"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 rounded-lg text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                  onClick={() => handleDeleteStream(stream.id)}
                                  title="Delete Stream"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
        </main>
      </div>

      {/* GLOBAL MODALS & DIALOGS */}

      {/* Global News Form Dialog - Works from any tab */}
      {/* Global News Form Dialog - Works from any tab */}
      <Dialog open={showNewsForm} onOpenChange={setShowNewsForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border-0 shadow-2xl p-0">
          <DialogHeader className="p-6 pb-4 border-b border-gray-100 bg-white sticky top-0 z-10">
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Newspaper className="h-5 w-5" />
              </div>
              {editingNews ? 'Edit News Article' : 'Publish New Article'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-bold text-gray-700">Article Title *</Label>
              <Input 
                value={newsForm.title} 
                onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })} 
                placeholder="Enter a catchy headline..." 
                className="h-12 bg-gray-50/50 rounded-xl border-gray-200 text-lg font-medium focus:ring-blue-500" 
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-bold text-gray-700">Category * (Mandatory)</Label>
                <Select value={newsForm.category} onValueChange={(val) => setNewsForm({ ...newsForm, category: val })}>
                  <SelectTrigger className="h-12 bg-gray-50/50 rounded-xl border-gray-200">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                    {['Crime', 'Politics', 'Education', 'Sports', 'Entertainment', 'Trending', 'Business', 'Nation', 'City News', 'Murder', 'General'].map((cat) => (
                      <SelectItem key={cat} value={cat} className="rounded-lg">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-bold text-gray-700 flex items-center justify-between">
                  <span>Assign City</span>
                  <span className="text-[11px] text-gray-400 font-normal">For City News</span>
                </Label>
                <Select value={newsForm.city || 'none'} onValueChange={(val) => setNewsForm({ ...newsForm, city: val === 'none' ? '' : val })}>
                  <SelectTrigger className="h-12 bg-gray-50/50 rounded-xl border-gray-200">
                    <SelectValue placeholder="Select City / National" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-100 shadow-xl max-h-64">
                    <SelectItem value="none" className="rounded-lg font-semibold text-gray-500">None / National News</SelectItem>
                    <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Popular Cities</div>
                    {POPULAR_CITIES.map((city) => (
                      <SelectItem key={`pop-${city}`} value={city} className="rounded-lg font-medium">{city}</SelectItem>
                    ))}
                    <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">All Indian Cities</div>
                    {INDIAN_CITIES_SORTED.filter(c => !POPULAR_CITIES.includes(c)).map((city) => (
                      <SelectItem key={`all-${city}`} value={city} className="rounded-lg">{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-bold text-gray-700">YouTube Video URL (optional)</Label>
                <Input 
                  value={newsForm.youtubeUrl} 
                  onChange={(e) => setNewsForm({ ...newsForm, youtubeUrl: e.target.value })} 
                  placeholder="https://youtube.com/watch?v=..." 
                  className="h-12 bg-gray-50/50 rounded-xl border-gray-200 focus:ring-red-500" 
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-bold text-gray-700">Full Content *</Label>
              <Textarea 
                value={newsForm.content} 
                onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })} 
                placeholder="Write your article content here..." 
                rows={8} 
                className="bg-gray-50/50 rounded-xl border-gray-200 resize-none focus:ring-blue-500 text-base leading-relaxed" 
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-bold text-gray-700">Main Cover Image</Label>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input 
                  value={newsForm.mainImage} 
                  onChange={(e) => setNewsForm({ ...newsForm, mainImage: e.target.value })} 
                  placeholder="Paste image URL or upload ->" 
                  className="h-12 bg-gray-50/50 rounded-xl border-gray-200 flex-1" 
                />
                <label className="cursor-pointer shrink-0">
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
                  <Button type="button" variant="outline" className="h-12 px-6 rounded-xl border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200" asChild>
                    <span><Upload className="h-4 w-4 mr-2" /> Upload Image</span>
                  </Button>
                </label>
              </div>
              {newsForm.mainImage && (
                <div className="mt-3 relative h-48 w-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                  <img src={newsForm.mainImage} alt="Main preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-gray-700">Gallery Thumbnails (Max 3)</Label>
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">For Rotating Effect</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(newsForm.thumbnails || (newsForm.thumbnailUrl ? [newsForm.thumbnailUrl] : [])).map((thumb, idx) => (
                  <div key={idx} className="relative h-24 rounded-xl overflow-hidden border border-gray-200 group bg-gray-50 flex flex-col">
                    <img src={thumb} alt={`Thumb ${idx}`} className="w-full h-full object-cover absolute inset-0 z-0 opacity-40 group-hover:opacity-10 transition-opacity" />
                    <Input
                      value={thumb}
                      onChange={(e) => {
                        const newThumbs = [...(newsForm.thumbnails || [])]
                        newThumbs[idx] = e.target.value
                        setNewsForm({ ...newsForm, thumbnails: newThumbs })
                      }}
                      placeholder={`URL ${idx + 1}`}
                      className="absolute inset-x-2 bottom-2 h-8 text-xs bg-white/80 backdrop-blur-sm border-0 rounded-md z-10 font-medium"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
                      onClick={() => {
                        const newThumbs = (newsForm.thumbnails || []).filter((_, i) => i !== idx)
                        setNewsForm({ ...newsForm, thumbnails: newThumbs, thumbnailUrl: newThumbs[0] || '' })
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}

                {(newsForm.thumbnails?.length || 0) < 3 && (
                  <div className="h-24 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-blue-50/50 hover:border-blue-200 transition-colors">
                    <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center group">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
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
                      <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <Plus className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-xs font-bold text-gray-500">Add Image</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3">
                <Label className="text-sm font-bold text-gray-700">Meta Description (SEO)</Label>
                <Input 
                  value={newsForm.metaDescription} 
                  onChange={(e) => setNewsForm({ ...newsForm, metaDescription: e.target.value })} 
                  placeholder="Brief summary for search engines..." 
                  className="h-11 bg-gray-50/50 rounded-xl border-gray-200" 
                />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-bold text-gray-700">Tags</Label>
                <Input 
                  value={newsForm.tags} 
                  onChange={(e) => setNewsForm({ ...newsForm, tags: e.target.value })} 
                  placeholder="politics, breaking, updates (comma separated)" 
                  className="h-11 bg-gray-50/50 rounded-xl border-gray-200" 
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
              <div className="flex-1 flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col">
                  <Label htmlFor="gfeatured" className="font-bold text-gray-800 text-sm cursor-pointer">Featured Article</Label>
                  <span className="text-[10px] text-gray-500 font-medium">Highlight in top sliders</span>
                </div>
                <Switch id="gfeatured" checked={newsForm.featured} onCheckedChange={(c) => setNewsForm({ ...newsForm, featured: c })} className="data-[state=checked]:bg-blue-600" />
              </div>
              <div className="flex-1 flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col">
                  <Label htmlFor="gshowHome" className="font-bold text-gray-800 text-sm cursor-pointer">Show on Home Page</Label>
                  <span className="text-[10px] text-gray-500 font-medium">Display on main feed</span>
                </div>
                <Switch id="gshowHome" checked={newsForm.showOnHome} onCheckedChange={(c) => setNewsForm({ ...newsForm, showOnHome: c })} className="data-[state=checked]:bg-blue-600" />
              </div>
            </div>
          </div>
          
          <DialogFooter className="p-6 pt-4 border-t border-gray-100 bg-gray-50/50 sticky bottom-0">
            <Button variant="outline" onClick={() => setShowNewsForm(false)} className="h-12 px-6 rounded-xl border-gray-200 font-bold hover:bg-gray-100 text-gray-600">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveNews} 
              disabled={loading} 
              className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20"
            >
              {loading ? 'Processing...' : (editingNews ? 'Update Article' : 'Publish Article')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── MOBILE BOTTOM NAV — Premium iOS Style ─── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(10, 10, 20, 0.72)',
          backdropFilter: 'saturate(180%) blur(28px)',
          WebkitBackdropFilter: 'saturate(180%) blur(28px)',
          borderTop: '1px solid rgba(255,255,255,0.10)',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.45)',
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        }}
      >
        <div className="flex items-end justify-around px-4 pt-3 pb-2">

          {/* Home */}
          <button onClick={() => setActiveTab('overview')} className="flex flex-col items-center gap-1 min-w-[52px] relative">
            <div className={`p-1.5 rounded-2xl transition-all duration-200 ${activeTab === 'overview' ? 'bg-red-600/20' : ''}`}>
              <LayoutDashboard className={`w-[22px] h-[22px] transition-colors ${activeTab === 'overview' ? 'text-red-500' : 'text-gray-400'}`} />
            </div>
            <span className={`text-[10px] font-semibold tracking-tight transition-colors ${activeTab === 'overview' ? 'text-red-400' : 'text-gray-500'}`}>Home</span>
            {activeTab === 'overview' && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-red-500" />}
          </button>

          {/* News */}
          <button onClick={() => setActiveTab('manage-news')} className="flex flex-col items-center gap-1 min-w-[52px] relative">
            <div className={`p-1.5 rounded-2xl transition-all duration-200 ${activeTab === 'manage-news' ? 'bg-red-600/20' : ''}`}>
              <Newspaper className={`w-[22px] h-[22px] transition-colors ${activeTab === 'manage-news' ? 'text-red-500' : 'text-gray-400'}`} />
            </div>
            <span className={`text-[10px] font-semibold tracking-tight transition-colors ${activeTab === 'manage-news' ? 'text-red-400' : 'text-gray-500'}`}>News</span>
            {activeTab === 'manage-news' && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-red-500" />}
          </button>

          {/* Centre FAB — Add */}
          <button 
            onClick={() => { resetNewsForm(); setShowNewsForm(true); }} 
            className="flex flex-col items-center gap-1 min-w-[52px] -mt-5 group"
          >
            <div
              className="w-[52px] h-[52px] rounded-[18px] flex items-center justify-center shadow-2xl relative overflow-hidden transition-all duration-200 group-active:scale-95"
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.96) 0%, rgba(185, 28, 28, 0.94) 100%)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: '0 8px 24px rgba(239,68,68,0.5), inset 0 1px 1.5px rgba(255,255,255,0.45)',
                border: '1px solid rgba(255,255,255,0.3)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/35 via-white/10 to-transparent pointer-events-none rounded-[18px]" />
              <Plus className="w-6 h-6 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] relative z-10" strokeWidth={2.6} />
            </div>
            <span className="text-[10px] font-bold text-gray-400 tracking-tight mt-0.5">Add</span>
          </button>

          {/* Shorts */}
          <button onClick={() => setActiveTab('shorts')} className="flex flex-col items-center gap-1 min-w-[52px] relative">
            <div className={`p-1.5 rounded-2xl transition-all duration-200 ${activeTab === 'shorts' ? 'bg-red-600/20' : ''}`}>
              <Video className={`w-[22px] h-[22px] transition-colors ${activeTab === 'shorts' ? 'text-red-500' : 'text-gray-400'}`} />
            </div>
            <span className={`text-[10px] font-semibold tracking-tight transition-colors ${activeTab === 'shorts' ? 'text-red-400' : 'text-gray-500'}`}>Shorts</span>
            {activeTab === 'shorts' && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-red-500" />}
          </button>

          {/* More — opens mini bottom sheet */}
          <button 
            onClick={() => setShowMoreMenu(prev => !prev)} 
            className="flex flex-col items-center gap-1 min-w-[52px] relative"
          >
            <div className={`p-1.5 rounded-2xl transition-all duration-200 relative ${isMoreActive ? 'bg-red-600/20' : ''}`}>
              <MoreHorizontal className={`w-[22px] h-[22px] transition-colors ${isMoreActive ? 'text-red-500' : 'text-gray-400'}`} />
              {morePendingCount > 0 && !showMoreMenu && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[8px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center shadow">
                  {morePendingCount > 9 ? '9+' : morePendingCount}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-semibold tracking-tight transition-colors ${isMoreActive ? 'text-red-400' : 'text-gray-500'}`}>More</span>
            {isMoreActive && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-red-500" />}
          </button>

        </div>
      </nav>

      {/* ─── MOBILE "MORE" BOTTOM SHEET / MINI WINDOW ─── */}
      {showMoreMenu && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/65 backdrop-blur-sm z-50 transition-opacity animate-in fade-in duration-200"
            onClick={() => setShowMoreMenu(false)}
          />

          {/* Mini Window (Bottom Sheet) */}
          <div
            className="lg:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-[32px] border-t border-white/20 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
            style={{
              background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.92) 0%, rgba(10, 15, 30, 0.98) 100%)',
              backdropFilter: 'saturate(190%) blur(32px)',
              WebkitBackdropFilter: 'saturate(190%) blur(32px)',
              maxHeight: '85vh',
              boxShadow: '0 -16px 48px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            }}
          >
            {/* Pill & Header */}
            <div className="pt-3.5 pb-3 px-5 border-b border-white/10 bg-white/[0.03] backdrop-blur-md">
              <div className="w-10 h-1.5 bg-white/30 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    Admin Sections
                  </h3>
                  <p className="text-xs text-slate-400">Select a section to manage</p>
                </div>
                <button
                  onClick={() => setShowMoreMenu(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 border border-white/15 backdrop-blur-md flex items-center justify-center text-slate-300 hover:text-white transition-all"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Grid of Sections */}
            <div className="p-4 overflow-y-auto space-y-2 max-h-[calc(85vh-150px)] custom-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                {moreMenuItems.map((item) => {
                  const Icon = item.icon
                  const isSelected = activeTab === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id)
                        setShowMoreMenu(false)
                      }}
                      className={`group relative flex flex-col items-start p-3.5 rounded-[22px] border text-left transition-all duration-200 active:scale-[0.96] overflow-hidden ${
                        isSelected
                          ? 'bg-white/[0.14] border-white/30 text-white shadow-xl shadow-black/40 ring-1 ring-red-500/50 backdrop-blur-2xl'
                          : 'bg-white/[0.05] hover:bg-white/[0.09] border-white/[0.08] hover:border-white/20 text-slate-100 backdrop-blur-xl shadow-md'
                      }`}
                    >
                      {/* Specular gloss top highlight */}
                      <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none rounded-t-[22px]" />

                      <div className="flex items-center justify-between w-full mb-2.5 relative z-10">
                        {/* iOS Touch-Style Squircle Icon */}
                        <div
                          className={`w-11 h-11 rounded-[14px] bg-gradient-to-br ${item.iconGradient} flex items-center justify-center shadow-lg ${item.iconShadow} ring-1 ring-white/30 relative overflow-hidden transition-transform duration-200 group-hover:scale-105`}
                        >
                          {/* iOS icon top diagonal gloss reflection */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-transparent pointer-events-none rounded-[14px]" />
                          <Icon className="w-5 h-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] relative z-10" strokeWidth={2.2} />
                        </div>
                        {item.badge > 0 && (
                          <span className="bg-gradient-to-r from-red-500 to-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md shadow-red-500/40 ring-1 ring-white/30 animate-pulse">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[13px] font-bold leading-tight text-white line-clamp-1 relative z-10">{item.label}</span>
                      <span className="text-[10px] text-slate-400 font-medium mt-0.5 line-clamp-1 relative z-10">{item.desc}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Sign Out Footer */}
            <div
              className="p-4 pt-3 border-t border-white/10 bg-slate-950/80 backdrop-blur-xl"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 12px) + 8px)' }}
            >
              <button
                onClick={() => {
                  setShowMoreMenu(false)
                  handleLogoutClick()
                }}
                className="w-full relative overflow-hidden bg-gradient-to-r from-red-500/15 via-red-600/20 to-rose-500/15 hover:from-red-500/25 hover:via-red-600/30 hover:to-rose-500/25 active:scale-[0.98] text-red-300 hover:text-red-200 border border-red-500/30 hover:border-red-500/50 rounded-2xl h-12 text-xs font-bold tracking-wide flex items-center justify-center gap-2.5 backdrop-blur-2xl shadow-lg shadow-red-950/50 transition-all group"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400/40 to-transparent" />
                <LogOut className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                <span>Sign Out of Admin Panel</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div >
  )
}

export default AdminDashboard
