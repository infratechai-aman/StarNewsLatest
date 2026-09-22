'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { 
  Radio, Newspaper, LogOut, Edit, Trash2, Clock, X, MessageSquare, 
  AlertTriangle, Check, FileText, Upload, File, Search, Bell, 
  ChevronDown, ChevronRight, Lock, ArrowRight, Zap, BarChart2, 
  HelpCircle, ExternalLink, User, ShieldCheck, Eye, Sparkles, Send
} from 'lucide-react'
import { INDIAN_CITIES_SORTED } from '@/lib/indianCities'
import { getFreshToken, authenticatedFetch } from '@/lib/api'

// Fast auto-compress images to <= 500KB using Canvas API
const compressImage = (file, maxSizeKB = 500, maxWidth = 900) => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      const pixels = width * height
      let quality = 0.7
      if (pixels > 500000) quality = 0.5
      else if (pixels > 200000) quality = 0.6

      const result = canvas.toDataURL('image/jpeg', quality)

      if (result.length > maxSizeKB * 1370) {
        const retry = canvas.toDataURL('image/jpeg', 0.3)
        resolve(retry)
      } else {
        resolve(result)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

const ReporterDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('submit-news')
  const [myNews, setMyNews] = useState([])
  const [myPapers, setMyPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [editingNewsItem, setEditingNewsItem] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  // Breaking Ticker State — per-reporter isolated
  const [ticker, setTicker] = useState(null)
  const [myTickerRequests, setMyTickerRequests] = useState([])
  const [pendingTickerRequest, setPendingTickerRequest] = useState(null)
  const [tickerText, setTickerText] = useState('')
  const [isEditingTicker, setIsEditingTicker] = useState(false)
  const [savingTicker, setSavingTicker] = useState(false)
  const [tickerSaved, setTickerSaved] = useState(false)
  const [tickerSuccessMsg, setTickerSuccessMsg] = useState('')

  // E-Newspaper State
  const [paperFormData, setPaperFormData] = useState({
    title: '',
    editionDate: '',
    thumbnailUrl: '',
    description: ''
  })
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [savingPaper, setSavingPaper] = useState(false)
  const [paperSaved, setPaperSaved] = useState(false)
  const fileInputRef = useRef(null)

  // News form - matching Admin form exactly
  const [newsFormData, setNewsFormData] = useState({
    title: '',
    content: '',
    categoryId: 'City News',
    city: '',
    mainImage: '',
    secondImage: '',
    youtubeUrl: '',
    thumbnailUrl: '',
    metaDescription: '',
    tags: '',
    featured: false,
    showOnHome: true,
    authorName: ''
  })

  const reporterIdDisplay = user?.id ? `REP-${String(user.id).slice(0, 4).toUpperCase()}` : 'REP-1023'

  const fetchTicker = async () => {
    try {
      const res = await authenticatedFetch('/api/reporter/breaking-ticker')
      const data = await res.json()
      if (res.ok) {
        setTicker(data.liveTicker || null)
        setMyTickerRequests(data.myRequests || [])
        setPendingTickerRequest(data.pendingRequest || null)
        if (!tickerText) {
          const preload = data.pendingRequest?.proposedTickerText || data.liveTicker?.text || ''
          setTickerText(preload)
        }
      } else {
        console.error('Ticker fetch error:', res.status, data)
      }
    } catch (err) {
      console.error('Failed to fetch ticker:', err)
    }
  }

  const fetchMyNews = async () => {
    try {
      const res = await authenticatedFetch('/api/reporter/news')
      const data = await res.json()
      if (res.ok) {
        setMyNews(data.articles || [])
      } else {
        console.error('News fetch error:', res.status, data)
      }
    } catch (err) {
      console.error('Failed to fetch news:', err)
    }
  }

  const fetchMyPapers = async () => {
    try {
      const res = await authenticatedFetch('/api/reporter/enewspaper')
      const data = await res.json()
      if (res.ok) {
        setMyPapers(data.papers || [])
      } else {
        console.error('E-newspaper fetch error:', res.status, data)
      }
    } catch (err) {
      console.error('Failed to fetch e-newspapers:', err)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchTicker(), fetchMyNews(), fetchMyPapers()])
      setLoading(false)
    }
    loadData()
  }, [])

  // Auto populate author name if empty
  useEffect(() => {
    if (user?.name && !newsFormData.authorName) {
      setNewsFormData(prev => ({ ...prev, authorName: user.name }))
    }
  }, [user])

  const handleSaveTicker = async (e) => {
    if (e) e.preventDefault()
    if (!tickerText.trim()) {
      alert('Please enter a breaking news headline')
      return
    }
    if (pendingTickerRequest) {
      if (!confirm('You already have a pending submission awaiting admin approval. Submit a new one anyway?')) return
    }
    setSavingTicker(true)
    try {
      const res = await authenticatedFetch('/api/reporter/breaking-ticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: tickerText.trim() })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        await fetchTicker()
        setIsEditingTicker(false)
        setTickerSaved(true)
        setTickerSuccessMsg(
          (user?.role === 'super_admin')
            ? '✅ Breaking ticker published live!'
            : '⏳ Your headline has been submitted for Admin approval!'
        )
        setTimeout(() => { setTickerSaved(false); setTickerSuccessMsg('') }, 5000)
        setTickerText('')
      } else {
        alert('Failed to submit headline: ' + (data.error || 'Unknown error'))
      }
    } catch (err) {
      alert('Failed to save ticker: ' + err.message)
    } finally {
      setSavingTicker(false)
    }
  }

  const handleSubmitNews = async (e) => {
    e.preventDefault()
    if (!newsFormData.title.trim() || !newsFormData.content.trim() || !newsFormData.categoryId) {
      alert('Please fill in Title, Category and Content')
      return
    }

    setLoading(true)
    try {
      const url = editingNewsItem ? `/api/reporter/news/${editingNewsItem.id}` : '/api/reporter/news'
      const method = editingNewsItem ? 'PUT' : 'POST'

      const uploadIfNeeded = async (imageStr) => {
        if (!imageStr || !imageStr.startsWith('data:image')) return imageStr

        try {
          const sizeInBytes = (imageStr.length * 3) / 4
          if (sizeInBytes > 4.5 * 1024 * 1024) {
            throw new Error("Image too large (max 4.5MB). Please use a smaller image.")
          }

          const base64Part = imageStr.split(',')[1]
          const mimeStr = imageStr.split(',')[0].split(':')[1].split(';')[0]
          const byteChars = atob(base64Part)
          const byteNums = new Array(byteChars.length)
          for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i)
          const byteArray = new Uint8Array(byteNums)
          const blob = new Blob([byteArray], { type: mimeStr })

          const formData = new FormData()
          formData.append('file', blob, `image.${mimeStr.split('/')[1]}`)

          const uploadRes = await authenticatedFetch('/api/upload', {
            method: 'POST',
            body: formData
          })

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json()
            return uploadData.url
          } else {
            const errData = await uploadRes.json().catch(() => ({}))
            throw new Error(errData.error || `Upload failed with status ${uploadRes.status}`)
          }
        } catch (err) {
          console.error('Image Upload Error:', err.message)
          throw err
        }
      }

      const [mainImageUrl, secondImageUrl, thumbnailUrl] = await Promise.all([
        uploadIfNeeded(newsFormData.mainImage),
        uploadIfNeeded(newsFormData.secondImage),
        uploadIfNeeded(newsFormData.thumbnailUrl)
      ])

      const payload = {
        title: newsFormData.title,
        content: newsFormData.content,
        categoryId: newsFormData.categoryId,
        category: newsFormData.categoryId,
        city: newsFormData.city,
        mainImage: mainImageUrl,
        galleryImages: secondImageUrl ? [secondImageUrl] : [],
        youtubeUrl: newsFormData.youtubeUrl,
        videoUrl: newsFormData.youtubeUrl,
        thumbnailUrl: thumbnailUrl,
        metaDescription: newsFormData.metaDescription,
        tags: newsFormData.tags ? newsFormData.tags.split(',').map(t => t.trim()) : [],
        featured: newsFormData.featured,
        showOnHome: newsFormData.showOnHome,
        authorName: newsFormData.authorName || user?.name || 'Reporter'
      }

      const res = await authenticatedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        alert(editingNewsItem ? 'News updated successfully!' : 'News submitted for review!')
        await fetchMyNews()
        setEditingNewsItem(null)
        setNewsFormData({
          title: '', content: '', categoryId: 'City News', city: '', mainImage: '', secondImage: '',
          youtubeUrl: '', thumbnailUrl: '', metaDescription: '', tags: '',
          featured: false, showOnHome: true, authorName: user?.name || ''
        })
        setActiveTab('my-news')
      } else {
        const errorData = await res.json()
        alert('Failed to submit: ' + (errorData.error || 'Unknown error'))
      }
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePdfFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Only PDF files are allowed')
      return
    }

    if (file.size > 25 * 1024 * 1024) {
      alert('File size exceeds 25MB limit')
      return
    }

    setPdfFile(file)
    const previewUrl = URL.createObjectURL(file)
    setPdfPreviewUrl(previewUrl)
  }

  const handleSubmitPaper = async (e) => {
    e.preventDefault()
    if (!paperFormData.title.trim() || !paperFormData.editionDate || !pdfFile) {
      alert('Please fill in all required fields and select a PDF file')
      return
    }

    setSavingPaper(true)
    try {
      setUploadingPdf(true)
      const formData = new FormData()
      formData.append('file', pdfFile)

      const uploadRes = await authenticatedFetch('/api/upload-large', {
        method: 'POST',
        body: formData
      })

      if (!uploadRes.ok) {
        const err = await uploadRes.json()
        throw new Error(err.error || 'Upload failed')
      }

      const uploadData = await uploadRes.json()
      setUploadingPdf(false)

      const res = await authenticatedFetch('/api/reporter/enewspaper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: paperFormData.title,
          editionDate: paperFormData.editionDate,
          pdfUrl: uploadData.url,
          thumbnailUrl: paperFormData.thumbnailUrl,
          description: paperFormData.description
        })
      })

      if (res.ok) {
        await fetchMyPapers()
        setPaperFormData({ title: '', editionDate: '', thumbnailUrl: '', description: '' })
        setPdfFile(null)
        setPdfPreviewUrl(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        setPaperSaved(true)
        setTimeout(() => setPaperSaved(false), 3000)
      }
    } catch (err) {
      alert(err.message || 'Failed to upload')
    } finally {
      setSavingPaper(false)
      setUploadingPdf(false)
    }
  }

  const handleDeletePaper = async (id) => {
    if (!confirm('Are you sure you want to delete this E-Newspaper?')) return
    try {
      await authenticatedFetch(`/api/reporter/enewspaper/${id}`, {
        method: 'DELETE'
      })
      await fetchMyPapers()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const handleEditNews = (article) => {
    const title = typeof article.title === 'object' ? article.title.en : article.title
    const content = typeof article.content === 'object' ? article.content.en : article.content
    setEditingNewsItem(article)
    setNewsFormData({
      title: title || '',
      content: content || '',
      categoryId: article.categoryId || article.category || 'City News',
      city: article.city || '',
      mainImage: article.mainImage || '',
      secondImage: (article.galleryImages && article.galleryImages[0]) || '',
      youtubeUrl: article.youtubeUrl || article.videoUrl || '',
      thumbnailUrl: article.thumbnailUrl || (article.thumbnails && article.thumbnails[0]) || '',
      metaDescription: article.metaDescription || '',
      tags: Array.isArray(article.tags) ? article.tags.join(', ') : (article.tags || ''),
      featured: article.featured || false,
      showOnHome: article.showOnHome !== false,
      authorName: article.authorName || user?.name || ''
    })
    setActiveTab('submit-news')
  }

  const resetPaperForm = () => {
    setPaperFormData({ title: '', editionDate: '', thumbnailUrl: '', description: '' })
    setPdfFile(null)
    setPdfPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const getArticleTitle = (article) => typeof article.title === 'object' ? (article.title.en || Object.values(article.title)[0]) : article.title
  const getArticleContent = (article) => typeof article.content === 'object' ? (article.content.en || Object.values(article.content)[0]) : article.content

  // Stats calculation
  const totalSubmissionsCount = myNews.length
  const publishedCount = myNews.filter(n => n.approvalStatus === 'approved').length
  const inReviewCount = myNews.filter(n => n.approvalStatus === 'pending' || !n.approvalStatus).length
  const rejectedCount = myNews.filter(n => n.approvalStatus === 'rejected').length

  // Filtered submissions based on search
  const filteredMyNews = myNews.filter(article => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const t = getArticleTitle(article)?.toLowerCase() || ''
    const cat = (article.categoryId || article.category || '').toLowerCase()
    const city = (article.city || '').toLowerCase()
    return t.includes(q) || cat.includes(q) || city.includes(q)
  })

  if (loading && myNews.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center space-y-4">
          <div className="animate-spin h-10 w-10 border-4 border-red-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-sm font-semibold text-gray-500">Loading Reporter Portal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col antialiased text-gray-900 overflow-hidden">
      
      {/* ─── TOP NAVBAR (Matching Reference Image 3) ─── */}
      <header className="bg-white sticky top-0 z-40 border-b border-gray-200/80 shadow-xs">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Brand & Portal Title */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-sm font-black text-sm">
                ★
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[13px] font-black tracking-wider text-gray-900 uppercase">Star News</span>
                <span className="text-[9px] font-bold tracking-[0.25em] text-red-600 uppercase">India</span>
              </div>
            </div>
            
            <div className="hidden sm:block h-6 w-px bg-gray-200" />
            
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-gray-900 leading-none">Reporter Portal</h1>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">Your Stories. A More Informed World.</p>
            </div>
          </div>

          {/* Center Search Input */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search submissions, news, or help..."
                className="w-full h-10 pl-10 pr-4 bg-gray-50/80 hover:bg-gray-100/60 focus:bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Header Items: Notifications + Reporter Pill */}
          <div className="flex items-center gap-3 shrink-0">
            
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="w-10 h-10 rounded-xl border border-gray-200/80 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors relative cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {pendingTickerRequest && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Alerts & Updates</span>
                    <button onClick={() => setNotificationsOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {pendingTickerRequest ? (
                    <div className="p-2.5 bg-amber-50 rounded-xl text-xs text-amber-800 flex gap-2 items-start">
                      <Clock className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold block">Breaking Ticker Pending</span>
                        <span>Your headline proposal is waiting for editorial approval.</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 py-3 text-center">No pending notifications</p>
                  )}
                </div>
              )}
            </div>

            {/* Reporter Profile Pill */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1 sm:pr-3 rounded-full sm:rounded-xl hover:bg-gray-50 border border-gray-200/80 bg-white transition-all text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'R'}
                </div>
                <div className="hidden sm:flex flex-col leading-tight pr-1">
                  <span className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{user?.name || 'Reporter'}</span>
                  <span className="text-[10px] text-gray-400 font-mono tracking-tight">{reporterIdDisplay}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-gray-100 mb-1">
                    <p className="text-xs font-bold text-gray-900 truncate">{user?.name || 'Reporter'}</p>
                    <p className="text-[11px] text-gray-400 truncate">{user?.email || 'reporter@starnews.in'}</p>
                  </div>
                  <button
                    onClick={() => { setActiveTab('my-profile'); setProfileDropdownOpen(false) }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-xl flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-gray-400" /> My Profile
                  </button>
                  <button
                    onClick={() => { setActiveTab('help-support'); setProfileDropdownOpen(false) }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-xl flex items-center gap-2 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400" /> Help & Support
                  </button>
                  <div className="h-px bg-gray-100 my-1" />
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Logout
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* ─── 3-COLUMN LAYOUT (Left Sidebar | Main Form | Right Sidebar) ─── */}
      <div className="max-w-[1600px] w-full mx-auto flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* ─── LEFT SIDEBAR (No middle scrollbar, sleek hide-scrollbar) ─── */}
        <aside className="w-full lg:w-60 xl:w-64 bg-white lg:border-r border-gray-200/80 shrink-0 flex flex-col justify-between p-4 lg:sticky lg:top-16 lg:h-[calc(100vh-64px)] hide-scrollbar overflow-y-auto">
          
          <div className="space-y-1">
            {/* Primary Menu */}
            <button
              onClick={() => setActiveTab('submit-news')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'submit-news'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/25'
                  : 'text-gray-700 hover:bg-gray-100/70 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{editingNewsItem ? 'Edit Article' : 'Submit News'}</span>
            </button>

            <button
              onClick={() => setActiveTab('my-news')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'my-news'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/25 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100/70 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4" />
                <span>My Submissions</span>
              </div>
              {myNews.length > 0 && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeTab === 'my-news' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {myNews.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('breaking-ticker')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'breaking-ticker'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/25 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100/70 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Radio className="w-4 h-4" />
                <span>Breaking Ticker</span>
              </div>
              {pendingTickerRequest && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('my-papers')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'my-papers'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/25 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100/70 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Newspaper className="w-4 h-4" />
                <span>E-Newspapers</span>
              </div>
              {myPapers.length > 0 && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeTab === 'my-papers' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {myPapers.length}
                </span>
              )}
            </button>

            {/* Secondary Menu */}
            <div className="pt-4 mt-4 border-t border-gray-100 space-y-1">
              <button
                onClick={() => setActiveTab('my-profile')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'my-profile'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/25 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100/70 hover:text-gray-900'
                }`}
              >
                <User className="w-4 h-4" />
                <span>My Profile</span>
              </button>

              <button
                onClick={() => setActiveTab('help-support')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'help-support'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/25 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100/70 hover:text-gray-900'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Help & Support</span>
              </button>
            </div>
          </div>

          {/* Sidebar Footer Quote (From Reference Image 3) */}
          <div className="pt-6 mt-6 border-t border-gray-100/80 hidden lg:block">
            <div className="w-6 h-1 bg-red-600 rounded-full mb-3" />
            <p className="font-serif italic text-[13px] text-gray-700 leading-snug">
              “Real people. Real stories. A more informed India.”
            </p>
            <div className="mt-4 text-[11px] text-gray-400 space-y-0.5 font-medium leading-normal">
              <p>© 2026 StarNews India</p>
              <p>Reporter Portal</p>
              <p className="text-[10px] text-gray-400">Version 1.0.0</p>
            </div>
          </div>

        </aside>

        {/* ─── CENTER CONTENT AREA ─── */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          
          {/* Top Breadcrumb & Heading */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
              <span className="w-4 h-1 bg-red-600 rounded-full inline-block" />
              <span>REPORTER PORTAL</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {activeTab === 'submit-news' && (editingNewsItem ? 'Edit News Article' : 'Submit News Article')}
              {activeTab === 'my-news' && 'My News Submissions'}
              {activeTab === 'breaking-ticker' && 'Breaking News Ticker'}
              {activeTab === 'my-papers' && 'E-Newspapers Edition Manager'}
              {activeTab === 'my-profile' && 'Reporter Profile'}
              {activeTab === 'help-support' && 'Editorial Guidelines & Support'}
            </h2>
            
            <p className="text-sm text-gray-500 mt-1">
              {activeTab === 'submit-news' && "Share what's happening in your city, community or region."}
              {activeTab === 'my-news' && "Track the review and publication status of your submitted stories."}
              {activeTab === 'breaking-ticker' && "Propose instant breaking news headlines for editorial broadcast."}
              {activeTab === 'my-papers' && "Publish electronic editions and digital PDFs for your readers."}
              {activeTab === 'my-profile' && "Manage your account, credentials, and contact details."}
              {activeTab === 'help-support' && "Quick tips, editorial best practices, and support channels."}
            </p>
          </div>

          {/* ─── TAB CONTENT: SUBMIT NEWS ARTICLE (Exact Image 3 Layout) ─── */}
          {activeTab === 'submit-news' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {editingNewsItem && (
                <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-blue-800 text-sm font-semibold">
                    <Edit className="w-4 h-4 text-blue-600" />
                    <span>Editing: <strong className="font-bold">{getArticleTitle(editingNewsItem)}</strong></span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="bg-white border-blue-200 text-blue-700 hover:bg-blue-100 rounded-xl h-8 px-3 font-semibold cursor-pointer"
                    onClick={() => {
                      setEditingNewsItem(null)
                      setNewsFormData({
                        title: '', content: '', categoryId: 'City News', city: '', mainImage: '', secondImage: '',
                        youtubeUrl: '', thumbnailUrl: '', metaDescription: '', tags: '',
                        featured: false, showOnHome: true, authorName: user?.name || ''
                      })
                    }}
                  >
                    <X className="w-3.5 h-3.5 mr-1" /> Cancel Edit
                  </Button>
                </div>
              )}

              {/* Form Card */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 sm:p-8">
                
                {/* Section Header with Red Icon */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-gray-100 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Article Details</h3>
                      <p className="text-xs text-gray-500">Provide accurate and complete information.</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    All fields marked with <span className="text-red-600 font-bold">*</span> are required
                  </span>
                </div>

                <form onSubmit={handleSubmitNews} className="space-y-6">
                  
                  {/* Title * */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                      Title <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={newsFormData.title}
                      onChange={(e) => setNewsFormData({ ...newsFormData, title: e.target.value })}
                      placeholder="Enter a compelling article title"
                      required
                      className="w-full h-11 px-4 bg-gray-50/40 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                    />
                  </div>

                  {/* Category * & City (Optional) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                        Category <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={newsFormData.categoryId}
                        onChange={(e) => setNewsFormData({ ...newsFormData, categoryId: e.target.value })}
                        required
                        className="w-full h-11 px-4 bg-gray-50/40 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                      >
                        <option value="City News">City News</option>
                        <option value="Politics">Politics</option>
                        <option value="Business">Business</option>
                        <option value="Crime">Crime</option>
                        <option value="Nation">Nation</option>
                        <option value="Education">Education</option>
                        <option value="Health">Health</option>
                        <option value="Sports">Sports</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Technology">Technology</option>
                        <option value="Trending">Trending</option>
                        <option value="Jobs">Jobs</option>
                        <option value="General">General</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                        City (Optional)
                      </label>
                      <select
                        value={newsFormData.city}
                        onChange={(e) => setNewsFormData({ ...newsFormData, city: e.target.value })}
                        className="w-full h-11 px-4 bg-gray-50/40 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                      >
                        <option value="">Select city</option>
                        {INDIAN_CITIES_SORTED.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Main Image & Second Image (Optional) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Main Image */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                        Main Image
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={newsFormData.mainImage}
                          onChange={(e) => setNewsFormData({ ...newsFormData, mainImage: e.target.value })}
                          placeholder="https://image-url.jpg"
                          className="flex-1 h-11 px-4 bg-gray-50/40 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                        />
                        <label className="cursor-pointer shrink-0">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                try {
                                  const compressed = await compressImage(file)
                                  setNewsFormData(prev => ({ ...prev, mainImage: compressed }))
                                } catch (err) {
                                  alert('Failed to process image: ' + err.message)
                                }
                              }
                            }}
                          />
                          <span className="inline-flex items-center h-11 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer">
                            <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload
                          </span>
                        </label>
                      </div>
                      <p className="text-[11px] text-gray-400">Paste URL or upload an image file</p>
                    </div>

                    {/* Second Image (Optional) */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                        Second Image (Optional)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={newsFormData.secondImage}
                          onChange={(e) => setNewsFormData({ ...newsFormData, secondImage: e.target.value })}
                          placeholder="https://image-url.jpg"
                          className="flex-1 h-11 px-4 bg-gray-50/40 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                        />
                        <label className="cursor-pointer shrink-0">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                try {
                                  const compressed = await compressImage(file)
                                  setNewsFormData(prev => ({ ...prev, secondImage: compressed }))
                                } catch (err) {
                                  alert('Failed to process image: ' + err.message)
                                }
                              }
                            }}
                          />
                          <span className="inline-flex items-center h-11 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer">
                            <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload
                          </span>
                        </label>
                      </div>
                      <p className="text-[11px] text-gray-400">Paste URL or upload an image file</p>
                    </div>
                  </div>

                  {/* YouTube / Video URL & Thumbnail Image */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                        YouTube / Video URL
                      </label>
                      <input
                        type="url"
                        value={newsFormData.youtubeUrl}
                        onChange={(e) => setNewsFormData({ ...newsFormData, youtubeUrl: e.target.value })}
                        placeholder="https://youtube.com/watch?v=..."
                        className="w-full h-11 px-4 bg-gray-50/40 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                      />
                      <p className="text-[11px] text-gray-400">Paste a YouTube URL for video embed</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                        Thumbnail Image
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={newsFormData.thumbnailUrl}
                          onChange={(e) => setNewsFormData({ ...newsFormData, thumbnailUrl: e.target.value })}
                          placeholder="https://thumbnail-url.jpg"
                          className="flex-1 h-11 px-4 bg-gray-50/40 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                        />
                        <label className="cursor-pointer shrink-0">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                try {
                                  const compressed = await compressImage(file, 300, 800)
                                  setNewsFormData(prev => ({ ...prev, thumbnailUrl: compressed }))
                                } catch (err) {
                                  alert('Failed to process image: ' + err.message)
                                }
                              }
                            }}
                          />
                          <span className="inline-flex items-center h-11 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer">
                            <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload
                          </span>
                        </label>
                      </div>
                      <p className="text-[11px] text-gray-400">Leave blank to use main image</p>
                    </div>
                  </div>

                  {/* Author Name & Tags */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                        Author Name
                      </label>
                      <input
                        type="text"
                        value={newsFormData.authorName}
                        onChange={(e) => setNewsFormData({ ...newsFormData, authorName: e.target.value })}
                        placeholder="Enter your name"
                        className="w-full h-11 px-4 bg-gray-50/40 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                        Tags
                      </label>
                      <input
                        type="text"
                        value={newsFormData.tags}
                        onChange={(e) => setNewsFormData({ ...newsFormData, tags: e.target.value })}
                        placeholder="e.g. education, government, pune"
                        className="w-full h-11 px-4 bg-gray-50/40 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                      />
                      <p className="text-[11px] text-gray-400">Separate tags with commas</p>
                    </div>
                  </div>

                  {/* Short Description / Summary */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                      Short Description / Summary (Optional)
                    </label>
                    <textarea
                      value={newsFormData.metaDescription}
                      onChange={(e) => setNewsFormData({ ...newsFormData, metaDescription: e.target.value })}
                      placeholder="A brief summary for previews and social snippets..."
                      rows={2}
                      className="w-full px-4 py-2.5 bg-gray-50/40 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
                    />
                  </div>

                  {/* Full Content * */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                        Article Content <span className="text-red-600">*</span>
                      </label>
                      <span className="text-[11px] text-gray-400 font-medium">
                        {newsFormData.content.length} characters
                      </span>
                    </div>
                    <textarea
                      value={newsFormData.content}
                      onChange={(e) => setNewsFormData({ ...newsFormData, content: e.target.value })}
                      placeholder="Write the full news story here. Detailed reporting with quotes, verified facts, and context..."
                      rows={8}
                      required
                      className="w-full p-4 bg-gray-50/40 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all min-h-[200px]"
                    />
                  </div>

                  {/* Options: Featured & Show on Home */}
                  <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/80 flex flex-wrap items-center gap-6">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newsFormData.featured}
                        onChange={(e) => setNewsFormData({ ...newsFormData, featured: e.target.checked })}
                        className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-gray-300"
                      />
                      <span className="text-xs font-semibold text-gray-700">Request Featured (Top Story Section)</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newsFormData.showOnHome}
                        onChange={(e) => setNewsFormData({ ...newsFormData, showOnHome: e.target.checked })}
                        className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-gray-300"
                      />
                      <span className="text-xs font-semibold text-gray-700">Show on Home Page</span>
                    </label>
                  </div>

                  {/* Form Action Row (From Reference Image 3) */}
                  <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-semibold rounded-xl px-6 py-3 text-sm flex items-center justify-center gap-2 shadow-md shadow-red-600/20 transition-all cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>{editingNewsItem ? 'Update News Article' : 'Submit News Article'}</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>

                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                      <Lock className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>Your submission will be reviewed by our editorial team.</span>
                    </div>
                  </div>

                </form>

              </div>
            </div>
          )}

          {/* ─── TAB CONTENT: MY SUBMISSIONS ─── */}
          {activeTab === 'my-news' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Submission History</h3>
                    <p className="text-xs text-gray-500">Showing all {filteredMyNews.length} articles you have contributed</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchMyNews}
                      className="rounded-xl border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 h-9 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 mr-1.5" /> Refresh
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => { setEditingNewsItem(null); setActiveTab('submit-news') }}
                      className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold h-9 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1.5" /> New Story
                    </Button>
                  </div>
                </div>

                {filteredMyNews.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-300 flex items-center justify-center mx-auto mb-3">
                      <Newspaper className="w-7 h-7" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-800">No articles found</h4>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                      {searchQuery ? `No articles matching "${searchQuery}"` : "You haven't submitted any news articles yet."}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 mt-2">
                    {filteredMyNews.map((article) => {
                      const title = getArticleTitle(article)
                      const isApproved = article.approvalStatus === 'approved'
                      const isRejected = article.approvalStatus === 'rejected'
                      const isPending = !isApproved && !isRejected

                      return (
                        <div key={article.id} className="py-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group">
                          
                          <div className="flex gap-3.5 min-w-0 flex-1">
                            {article.mainImage ? (
                              <img 
                                src={article.mainImage} 
                                alt="" 
                                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-100" 
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300 shrink-0">
                                <FileText className="w-6 h-6" />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black tracking-wider uppercase text-red-600">
                                  {article.categoryId || article.category || 'City News'}
                                </span>
                                {article.city && (
                                  <>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-[10px] font-semibold text-gray-500">{article.city}</span>
                                  </>
                                )}
                                <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded-md border-none ml-auto sm:ml-0 ${
                                  isApproved ? 'bg-emerald-50 text-emerald-700' :
                                  isRejected ? 'bg-red-50 text-red-700' :
                                  'bg-amber-50 text-amber-700'
                                }`}>
                                  {isPending ? 'In Review' : isApproved ? 'Published' : 'Rejected'}
                                </Badge>
                              </div>

                              <h4 
                                onClick={() => setSelectedSubmission(article)}
                                className="text-sm font-bold text-gray-900 line-clamp-2 cursor-pointer group-hover:text-red-600 transition-colors"
                              >
                                {title}
                              </h4>

                              <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1 font-medium">
                                <span>{new Date(article.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                {article.authorName && (
                                  <>
                                    <span>•</span>
                                    <span>By {article.authorName}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSubmission(article)}
                              className="h-8 px-3 rounded-xl border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" /> View
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditNews(article)}
                              className="h-8 px-3 rounded-xl border-gray-200 text-xs font-semibold text-blue-600 hover:bg-blue-50 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                            </Button>
                          </div>

                        </div>
                      )
                    })}
                  </div>
                )}

              </div>
            </div>
          )}

          {/* ─── TAB CONTENT: BREAKING TICKER ─── */}
          {activeTab === 'breaking-ticker' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Live Ticker Card */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 sm:p-8">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                      <Radio className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Live Breaking Ticker</h3>
                      <p className="text-xs text-gray-500">Active broadcast ticker on StarNews India homepage</p>
                    </div>
                  </div>
                  <Badge className="bg-red-600 text-white border-none text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                    LIVE
                  </Badge>
                </div>

                <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/80">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Current Active Broadcast</p>
                  <p className="text-base font-semibold text-gray-900">
                    {ticker?.text || <span className="italic text-gray-400">No headline currently broadcasting</span>}
                  </p>
                </div>
              </div>

              {/* Propose Headline Form */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 sm:p-8">
                <h3 className="text-base font-bold text-gray-900 mb-1">Propose Breaking Headline</h3>
                <p className="text-xs text-gray-500 mb-5">Submissions go directly to Admin editorial desk for approval before broadcasting.</p>

                {pendingTickerRequest && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6 flex items-start gap-3">
                    <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-900">You already have a submission pending approval:</p>
                      <p className="text-sm font-semibold text-amber-950 mt-1 italic">“{pendingTickerRequest.proposedTickerText}”</p>
                    </div>
                  </div>
                )}

                {tickerSuccessMsg && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-6 text-xs font-semibold text-emerald-800">
                    {tickerSuccessMsg}
                  </div>
                )}

                <form onSubmit={handleSaveTicker} className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Headline Text *
                      </label>
                      <span className="text-[11px] text-gray-400">{tickerText.length} / 500</span>
                    </div>
                    <Textarea
                      value={tickerText}
                      onChange={(e) => setTickerText(e.target.value)}
                      placeholder="e.g. BREAKING: Maharashtra Cabinet announces infrastructure boost • Search operations conclude successfully in coastal belt..."
                      rows={3}
                      maxLength={500}
                      required
                      className="w-full p-3.5 bg-gray-50/40 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={savingTicker || !tickerText.trim()}
                      className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-10 px-6 font-semibold text-xs cursor-pointer"
                    >
                      {savingTicker ? 'Submitting...' : 'Submit Headline for Approval'}
                    </Button>
                    {tickerText && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setTickerText('')}
                        className="rounded-xl h-10 px-4 border-gray-200 text-xs cursor-pointer"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </form>
              </div>

              {/* History Table */}
              {myTickerRequests.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 overflow-hidden">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Your Proposal History</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                          <th className="pb-3">Proposed Headline</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3">Submitted</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {myTickerRequests.map(req => (
                          <tr key={req.id} className="hover:bg-gray-50/50">
                            <td className="py-3 font-semibold text-gray-800 max-w-sm">{req.proposedTickerText}</td>
                            <td className="py-3">
                              <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded-md border-none ${
                                req.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                                req.status === 'rejected' ? 'bg-red-50 text-red-700' :
                                'bg-amber-50 text-amber-700'
                              }`}>
                                {req.status}
                              </Badge>
                            </td>
                            <td className="py-3 text-gray-400">
                              {new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ─── TAB CONTENT: E-NEWSPAPERS ─── */}
          {activeTab === 'my-papers' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 sm:p-8">
                <div className="flex items-center gap-3 pb-4 mb-5 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Newspaper className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Upload E-Newspaper Edition</h3>
                    <p className="text-xs text-gray-500">Publish full PDF print editions directly to the digital newspaper catalog</p>
                  </div>
                </div>

                <form onSubmit={handleSubmitPaper} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Edition Title *</label>
                      <input
                        type="text"
                        value={paperFormData.title}
                        onChange={(e) => setPaperFormData({ ...paperFormData, title: e.target.value })}
                        placeholder="e.g. StarNews - Pune City Morning Edition"
                        required
                        className="w-full h-11 px-4 bg-gray-50/40 border border-gray-200 rounded-xl text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Edition Date *</label>
                      <input
                        type="date"
                        value={paperFormData.editionDate}
                        onChange={(e) => setPaperFormData({ ...paperFormData, editionDate: e.target.value })}
                        required
                        className="w-full h-11 px-4 bg-gray-50/40 border border-gray-200 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  {/* PDF Upload Box */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">PDF File * (Max 25MB)</label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-200 hover:border-red-400 bg-gray-50/50 hover:bg-red-50/20 rounded-2xl p-6 text-center cursor-pointer transition-all"
                    >
                      <input
                        type="file"
                        accept=".pdf"
                        ref={fileInputRef}
                        onChange={handlePdfFileChange}
                        className="hidden"
                      />
                      {pdfFile ? (
                        <div className="flex items-center justify-center gap-3 text-left">
                          <File className="w-8 h-8 text-red-600" />
                          <div>
                            <p className="text-sm font-bold text-gray-800">{pdfFile.name}</p>
                            <p className="text-xs text-gray-400">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                          <p className="text-xs font-bold text-gray-700">Click to select PDF document</p>
                          <p className="text-[11px] text-gray-400">Maximum file size 25MB</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Thumbnail Cover URL (Optional)</label>
                      <input
                        type="url"
                        value={paperFormData.thumbnailUrl}
                        onChange={(e) => setPaperFormData({ ...paperFormData, thumbnailUrl: e.target.value })}
                        placeholder="https://image-url.jpg"
                        className="w-full h-11 px-4 bg-gray-50/40 border border-gray-200 rounded-xl text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Edition Description (Optional)</label>
                      <input
                        type="text"
                        value={paperFormData.description}
                        onChange={(e) => setPaperFormData({ ...paperFormData, description: e.target.value })}
                        placeholder="Short summary of this edition..."
                        className="w-full h-11 px-4 bg-gray-50/40 border border-gray-200 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={savingPaper || !pdfFile}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-11 px-6 font-semibold text-xs cursor-pointer"
                  >
                    {uploadingPdf ? 'Uploading PDF...' : savingPaper ? 'Saving...' : paperSaved ? 'Uploaded!' : 'Publish E-Newspaper Edition'}
                  </Button>
                </form>
              </div>

              {/* Published Editions List */}
              {myPapers.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Your Published Editions ({myPapers.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myPapers.map(paper => (
                      <div key={paper.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col justify-between gap-3">
                        <div>
                          <p className="font-bold text-sm text-gray-800 line-clamp-1">{paper.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{paper.editionDate}</p>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200/60">
                          {paper.pdfUrl && (
                            <a 
                              href={paper.pdfUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> View PDF
                            </a>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePaper(paper.id)}
                            className="h-7 px-2 text-red-600 hover:bg-red-50 text-xs rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ─── TAB CONTENT: MY PROFILE ─── */}
          {activeTab === 'my-profile' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 sm:p-8">
                <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white font-black text-2xl flex items-center justify-center shadow-md">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'R'}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">{user?.name || 'Verified Reporter'}</h3>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{reporterIdDisplay} • Accredited Journalist</p>
                    <Badge className="bg-emerald-50 text-emerald-700 border-none text-[10px] font-bold uppercase mt-2">
                      Active Contributor
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="p-4 rounded-xl bg-gray-50/60 border border-gray-100 space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email Address</span>
                    <p className="text-sm font-semibold text-gray-800">{user?.email || 'reporter@starnews.in'}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50/60 border border-gray-100 space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Platform Role</span>
                    <p className="text-sm font-semibold text-gray-800 capitalize">{user?.role || 'Reporter'}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50/60 border border-gray-100 space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Editorial Desk</span>
                    <p className="text-sm font-semibold text-gray-800">Maharashtra Regional Bureau</p>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50/60 border border-gray-100 space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Account Status</span>
                    <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> Verified & Cleared for Direct Submission
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB CONTENT: HELP & SUPPORT ─── */}
          {activeTab === 'help-support' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 sm:p-8">
                <h3 className="text-lg font-black text-gray-900 mb-2">Editorial Guidelines & Help Center</h3>
                <p className="text-xs text-gray-500 mb-6">Standards and tips for submitting high quality news stories</p>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                    <h4 className="font-bold text-sm text-gray-900 mb-1">1. Fact-Checking & Accuracy</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Always double-check names, dates, city names, and official statements. Never post unverified rumors or unconfirmed claims.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                    <h4 className="font-bold text-sm text-gray-900 mb-1">2. Image Quality & Attribution</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Use clear, high-resolution horizontal images (16:9 or 4:3). Our portal automatically compresses images for lightning-fast loading across mobile networks.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                    <h4 className="font-bold text-sm text-gray-900 mb-1">3. Approval Workflow</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      All submitted stories are forwarded to the Admin editorial queue. Once reviewed and approved, the article is published across StarNews India immediately.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-red-100 bg-red-50/30 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-red-900">Need Immediate Assistance?</p>
                      <p className="text-xs text-red-700 mt-0.5">Contact the central newsdesk for urgent breaking updates.</p>
                    </div>
                    <Button 
                      onClick={() => alert("Editorial Desk Hotline: 7028033763\nEmail: editorial@starnews.in")}
                      className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold h-9 cursor-pointer"
                    >
                      Contact Newsdesk
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* ─── RIGHT SIDEBAR (Matching Reference Image 3) ─── */}
        <aside className="w-full xl:w-80 2xl:w-88 shrink-0 p-4 sm:p-6 lg:p-8 lg:pl-0 space-y-5">
          
          {/* Card 1: Every story matters (With thick red left accent) */}
          <div className="bg-white rounded-2xl border border-gray-200/80 border-l-4 border-l-red-600 p-5 shadow-xs">
            <h4 className="text-sm font-bold text-red-600">Every story matters.</h4>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Help us bring the truth to people, faster.
            </p>
          </div>

          {/* Card 2: Your Contributions / AT A GLANCE (4 Metrics) */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 leading-tight">Your Contributions</h4>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">AT A GLANCE</p>
              </div>
            </div>

            {/* 4 Stat Boxes (4-column grid) */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              
              <div className="text-center p-2 rounded-xl bg-gray-50/80 border border-gray-100">
                <span className="text-lg font-black text-gray-900 block leading-tight">{totalSubmissionsCount}</span>
                <span className="text-[10px] font-semibold text-gray-400 block mt-0.5 leading-tight">Total</span>
              </div>

              <div className="text-center p-2 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-lg font-black text-emerald-700 block leading-tight">{publishedCount}</span>
                <span className="text-[10px] font-semibold text-emerald-600 block mt-0.5 leading-tight">Published</span>
              </div>

              <div className="text-center p-2 rounded-xl bg-amber-50/60 border border-amber-100">
                <span className="text-lg font-black text-amber-700 block leading-tight">{inReviewCount}</span>
                <span className="text-[10px] font-semibold text-amber-600 block mt-0.5 leading-tight">In Review</span>
              </div>

              <div className="text-center p-2 rounded-xl bg-red-50/60 border border-red-100">
                <span className="text-lg font-black text-red-700 block leading-tight">{rejectedCount}</span>
                <span className="text-[10px] font-semibold text-red-600 block mt-0.5 leading-tight">Rejected</span>
              </div>

            </div>
          </div>

          {/* Card 3: Quick Actions (From Reference Image 3) */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-red-600" />
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Quick Actions</h4>
            </div>

            <div className="space-y-1">
              
              <button
                onClick={() => { setEditingNewsItem(null); setActiveTab('submit-news') }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-gray-400 group-hover:text-red-600 transition-colors" />
                  <div>
                    <p className="text-xs font-bold text-gray-800 group-hover:text-red-600 transition-colors">Submit News Article</p>
                    <p className="text-[10px] text-gray-400">Share a new story</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-red-600 transition-colors" />
              </button>

              <button
                onClick={() => setActiveTab('my-news')}
                className="w-full text-left p-2.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-400 group-hover:text-red-600 transition-colors" />
                  <div>
                    <p className="text-xs font-bold text-gray-800 group-hover:text-red-600 transition-colors">View My Submissions</p>
                    <p className="text-[10px] text-gray-400">Track your submitted news</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-red-600 transition-colors" />
              </button>

              <button
                onClick={() => setActiveTab('breaking-ticker')}
                className="w-full text-left p-2.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Radio className="w-4 h-4 text-gray-400 group-hover:text-red-600 transition-colors" />
                  <div>
                    <p className="text-xs font-bold text-gray-800 group-hover:text-red-600 transition-colors">Breaking Ticker</p>
                    <p className="text-[10px] text-gray-400">Check active breaking news</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-red-600 transition-colors" />
              </button>

              <button
                onClick={() => setActiveTab('my-papers')}
                className="w-full text-left p-2.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Newspaper className="w-4 h-4 text-gray-400 group-hover:text-red-600 transition-colors" />
                  <div>
                    <p className="text-xs font-bold text-gray-800 group-hover:text-red-600 transition-colors">E-Newspapers</p>
                    <p className="text-[10px] text-gray-400">View latest editions</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-red-600 transition-colors" />
              </button>

            </div>
          </div>

          {/* Card 4: Need Help? (From Reference Image 3) */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs text-center">
            <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-2 font-bold text-sm">
              ?
            </div>
            <h4 className="text-xs font-bold text-gray-900">Need Help?</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">We're here for you.</p>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('help-support')}
              className="mt-3 w-full rounded-xl border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5 h-9 cursor-pointer"
            >
              <span>Visit Help Center</span>
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>

        </aside>

      </div>

      {/* ─── SUBMISSION DETAIL MODAL ─── */}
      {selectedSubmission && (
        <div 
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 sm:p-6" 
          onClick={() => setSelectedSubmission(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/80">
              <div className="flex items-center gap-2.5">
                <Badge className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border-none ${
                  selectedSubmission.approvalStatus === 'approved' 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : selectedSubmission.approvalStatus === 'rejected' 
                      ? 'bg-red-50 text-red-700' 
                      : 'bg-amber-50 text-amber-700'
                }`}>
                  {selectedSubmission.approvalStatus || 'pending'}
                </Badge>
                <span className="text-xs font-semibold text-gray-500">
                  {selectedSubmission.categoryId || selectedSubmission.category || 'City News'}
                </span>
              </div>
              <button 
                className="h-8 w-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer" 
                onClick={() => setSelectedSubmission(null)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Scroll Area */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-4 leading-snug">
                {getArticleTitle(selectedSubmission)}
              </h3>
              
              {selectedSubmission.mainImage && (
                <div className="rounded-xl overflow-hidden mb-6 border border-gray-100">
                  <img 
                    src={selectedSubmission.mainImage} 
                    className="w-full max-h-[300px] object-cover" 
                    alt="" 
                  />
                </div>
              )}
              
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                {getArticleContent(selectedSubmission)}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between gap-3">
              <span className="text-xs text-gray-400 font-medium">
                Submitted on {new Date(selectedSubmission.createdAt || Date.now()).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="rounded-xl border-gray-200 text-xs font-semibold h-9 cursor-pointer" 
                  onClick={() => setSelectedSubmission(null)}
                >
                  Close
                </Button>
                <Button 
                  size="sm"
                  className="rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold h-9 cursor-pointer" 
                  onClick={() => { handleEditNews(selectedSubmission); setSelectedSubmission(null) }}
                >
                  <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit Story
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default ReporterDashboard
