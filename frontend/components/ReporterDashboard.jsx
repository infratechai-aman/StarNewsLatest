'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Radio, Newspaper, LogOut, Edit, Trash2, Clock, X, MessageSquare, AlertTriangle, Check, FileText, Upload, File } from 'lucide-react'
import { INDIAN_CITIES_SORTED } from '@/lib/indianCities'

// Fast auto-compress images to <= 500KB using Canvas API
const compressImage = (file, maxSizeKB = 500, maxWidth = 900) => {
  return new Promise((resolve, reject) => {
    // Use createImageBitmap for faster decoding (no FileReader needed for the image)
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      // Scale down to maxWidth (smaller = faster compression + smaller file)
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // Smart single-pass: estimate quality based on pixel count
      const pixels = width * height
      let quality = 0.7
      if (pixels > 500000) quality = 0.5       // > 500K pixels
      else if (pixels > 200000) quality = 0.6  // > 200K pixels

      const result = canvas.toDataURL('image/jpeg', quality)

      // One retry at lower quality if still too big
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

  // Breaking Ticker State
  const [ticker, setTicker] = useState(null)
  const [tickerText, setTickerText] = useState('')
  const [isEditingTicker, setIsEditingTicker] = useState(false)
  const [savingTicker, setSavingTicker] = useState(false)
  const [tickerSaved, setTickerSaved] = useState(false)

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
    thumbnailUrl: '', // Single thumbnail
    metaDescription: '',
    tags: '',
    featured: false,
    showOnHome: true
  })

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''

  const fetchTicker = async () => {
    try {
      const res = await fetch('/api/reporter/breaking-ticker', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setTicker(data.ticker)
        setTickerText(data.ticker?.text || '')
      } else {
        console.error('Ticker fetch error:', res.status, data)
      }
    } catch (err) {
      console.error('Failed to fetch ticker:', err)
    }
  }

  const fetchMyNews = async () => {
    try {
      const res = await fetch('/api/reporter/news', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
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
      const res = await fetch('/api/reporter/enewspaper', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
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

  const handleSaveTicker = async () => {
    if (!tickerText.trim()) {
      alert('Please enter breaking news text')
      return
    }
    setSavingTicker(true)
    try {
      const res = await fetch('/api/reporter/breaking-ticker', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ text: tickerText })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        await fetchTicker()
        setIsEditingTicker(false)
        setTickerSaved(true)
        setTimeout(() => setTickerSaved(false), 3000)
        const msg = (user?.role === 'super_admin') ? 'Ticker updated successfully!' : 'Ticker submitted for approval!';
        alert(msg)
      } else {
        alert('Failed to save: ' + (data.error || 'Unknown error'))
      }
    } catch (err) {
      // console.error('Failed to save ticker:', err)
      alert('Failed to save ticker: ' + err.message)
    } finally {
      setSavingTicker(false)
    }
  }

  const handleSubmitNews = async (e) => {
    e.preventDefault()
    if (!newsFormData.title.trim() || !newsFormData.content.trim() || !newsFormData.categoryId) return

    setLoading(true) // Reuse loading state for submission
    try {
      const url = editingNewsItem ? `/api/reporter/news/${editingNewsItem.id}` : '/api/reporter/news'
      const method = editingNewsItem ? 'PUT' : 'POST'

      // Helper function to upload image if it's base64
      const uploadIfNeeded = async (imageStr) => {
        if (!imageStr || !imageStr.startsWith('data:image')) return imageStr

        try {
          // Check size - rough estimate from base64 length
          const sizeInBytes = (imageStr.length * 3) / 4;
          if (sizeInBytes > 4.5 * 1024 * 1024) {
            throw new Error("Image too large (max 4.5MB). Please use a smaller image.")
          }

          // Convert base64 to blob
          const base64Part = imageStr.split(',')[1]
          const mimeStr = imageStr.split(',')[0].split(':')[1].split(';')[0]
          const byteChars = atob(base64Part)
          const byteNums = new Array(byteChars.length)
          for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i)
          const byteArray = new Uint8Array(byteNums)
          const blob = new Blob([byteArray], { type: mimeStr })

          const formData = new FormData()
          formData.append('file', blob, `image.${mimeStr.split('/')[1]}`)

          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
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
          console.error('Image Upload Error:', err.message)
          throw err // Re-throw to stop the submission process
        }
      }

      // Upload images first if they are base64 to avoid 413 Payload Too Large
      const [mainImageUrl, secondImageUrl, thumbnailUrl] = await Promise.all([
        uploadIfNeeded(newsFormData.mainImage),
        uploadIfNeeded(newsFormData.secondImage),
        uploadIfNeeded(newsFormData.thumbnailUrl)
      ])

      // Prepare payload with all fields
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
        authorName: newsFormData.authorName || ''
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        alert(editingNewsItem ? 'News updated successfully!' : 'News submitted for review!')
        await fetchMyNews()
        setEditingNewsItem(null)
        setNewsFormData({
          title: '', content: '', categoryId: 'City News', city: '', mainImage: '', secondImage: '',
          youtubeUrl: '', thumbnailUrl: '', metaDescription: '', tags: '',
          featured: false, showOnHome: true, authorName: ''
        })
        setActiveTab('my-news')
      } else {
        const errorData = await res.json()
        alert('Failed to submit: ' + (errorData.error || 'Unknown error'))
      }
    } catch (err) {
      // console.error('Failed to submit news:', err)
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePdfFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Only PDF files are allowed')
      return
    }

    // Validate file size (25MB)
    if (file.size > 25 * 1024 * 1024) {
      alert('File size exceeds 25MB limit')
      return
    }

    setPdfFile(file)
    // Create preview URL
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
      // First upload the PDF file
      setUploadingPdf(true)
      const formData = new FormData()
      formData.append('file', pdfFile)

      const uploadRes = await fetch('/api/upload-large', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      if (!uploadRes.ok) {
        const err = await uploadRes.json()
        throw new Error(err.error || 'Upload failed')
      }

      const uploadData = await uploadRes.json()
      setUploadingPdf(false)

      // Now save the e-newspaper record
      const res = await fetch('/api/reporter/enewspaper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
      // console.error('Failed to upload e-newspaper:', err)
      alert(err.message || 'Failed to upload')
    } finally {
      setSavingPaper(false)
      setUploadingPdf(false)
    }
  }

  const handleDeletePaper = async (id) => {
    if (!confirm('Are you sure you want to delete this E-Newspaper?')) return
    try {
      await fetch(`/api/reporter/enewspaper/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      await fetchMyPapers()
    } catch (err) {
      // console.error('Failed to delete:', err)
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
      authorName: article.authorName || ''
    })
    setActiveTab('submit-news')
  }

  const resetPaperForm = () => {
    setPaperFormData({ title: '', editionDate: '', thumbnailUrl: '', description: '' })
    setPdfFile(null)
    setPdfPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const getArticleTitle = (article) => typeof article.title === 'object' ? article.title.en : article.title
  const getArticleContent = (article) => typeof article.content === 'object' ? article.content.en : article.content

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Header - Matches Admin Style */}
      <header className="bg-white sticky top-0 z-40 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-200">
              <span className="text-xl font-bold">R</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">Reporter Portal</h1>
              <p className="text-xs text-gray-500 font-medium">Welcome, {user?.name || user?.email}</p>
            </div>
          </div>
          
          <Button 
            onClick={onLogout} 
            variant="outline"
            className="hidden sm:flex border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-red-600 rounded-xl h-10 px-4 font-medium transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
          
          <Button 
            onClick={onLogout} 
            variant="ghost"
            className="sm:hidden text-gray-500 hover:text-red-600 h-10 w-10 p-0 rounded-xl"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm mb-8 inline-block overflow-x-auto max-w-full">
            <TabsList className="bg-transparent h-auto p-0 flex space-x-1">
              <TabsTrigger 
                value="submit-news" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <Newspaper className="h-4 w-4" /> {editingNewsItem ? 'Edit News' : 'Submit News'}
              </TabsTrigger>
              <TabsTrigger 
                value="my-news" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <Clock className="h-4 w-4" /> My Submissions
              </TabsTrigger>
            </TabsList>
          </div>

          {/* SUBMIT NEWS TAB */}
          <TabsContent value="submit-news" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardHeader className="border-b border-gray-100 pb-5 bg-gray-50/50">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                    {editingNewsItem ? <Edit className="h-5 w-5" /> : <Newspaper className="h-5 w-5" />}
                  </div>
                  {editingNewsItem ? 'Edit News Article' : 'Submit News Article'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                {editingNewsItem && (
                  <div className="mb-6 p-4 bg-blue-50/80 border border-blue-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                    <span className="text-blue-800 font-semibold flex items-center gap-2">
                      <Edit className="h-4 w-4 text-blue-600" />
                      Editing: <span className="font-bold">{getArticleTitle(editingNewsItem)}</span>
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="bg-white border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg shrink-0"
                      onClick={() => {
                        setEditingNewsItem(null)
                        setNewsFormData({
                          title: '', content: '', categoryId: 'City News', mainImage: '', secondImage: '',
                          youtubeUrl: '', thumbnailUrl: '', metaDescription: '', tags: '',
                          featured: false, showOnHome: true, authorName: ''
                        })
                      }}
                    >
                      <X className="h-4 w-4 mr-1.5" /> Cancel Edit
                    </Button>
                  </div>
                )}
                <form onSubmit={handleSubmitNews} className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Title *</label>
                    <input
                      type="text"
                      value={newsFormData.title}
                      onChange={(e) => setNewsFormData({ ...newsFormData, title: e.target.value })}
                      className="w-full h-12 px-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      placeholder="Enter a compelling article title"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Category */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Category * (Mandatory)</label>
                      <select
                        value={newsFormData.categoryId}
                        onChange={(e) => setNewsFormData({ ...newsFormData, categoryId: e.target.value })}
                        className="w-full h-12 px-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow appearance-none"
                        required
                      >
                        <option value="">Select category</option>
                        <option value="All News">All News</option>
                        <option value="Crime">Crime</option>
                        <option value="Politics">Politics</option>
                        <option value="Education">Education</option>
                        <option value="Murder">Murder</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Trending">Trending</option>
                        <option value="Sports">Sports</option>
                        <option value="Business">Business</option>
                        <option value="Nation">Nation</option>
                        <option value="City News">City News</option>
                        <option value="Health">Health</option>
                        <option value="Jobs">Jobs</option>
                        <option value="Technology">Technology</option>
                      </select>
                    </div>

                    {/* City */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">City (Optional)</label>
                      <select
                        value={newsFormData.city}
                        onChange={(e) => setNewsFormData({ ...newsFormData, city: e.target.value })}
                        className="w-full h-12 px-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow appearance-none"
                      >
                        <option value="">Select city</option>
                        {INDIAN_CITIES_SORTED.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Main Image with Upload */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Main Image</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={newsFormData.mainImage}
                          onChange={(e) => setNewsFormData({ ...newsFormData, mainImage: e.target.value })}
                          className="flex-1 h-12 px-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-shadow"
                          placeholder="https://image-url.jpg"
                        />
                        <label className="cursor-pointer">
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
                          <span className="inline-flex items-center h-12 px-4 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:text-blue-600 transition-colors cursor-pointer shadow-sm">
                            <Upload className="h-4 w-4 mr-2" /> Upload
                          </span>
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 font-medium ml-1">Paste URL or upload an image file</p>
                    </div>

                    {/* Second Image (Optional) */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Second Image (Optional)</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={newsFormData.secondImage}
                          onChange={(e) => setNewsFormData({ ...newsFormData, secondImage: e.target.value })}
                          className="flex-1 h-12 px-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-shadow"
                          placeholder="https://image-url.jpg"
                        />
                        <label className="cursor-pointer">
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
                          <span className="inline-flex items-center h-12 px-4 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:text-blue-600 transition-colors cursor-pointer shadow-sm">
                            <Upload className="h-4 w-4 mr-2" /> Upload
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* YouTube / Video URL */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">YouTube / Video URL</label>
                      <input
                        type="url"
                        value={newsFormData.youtubeUrl}
                        onChange={(e) => setNewsFormData({ ...newsFormData, youtubeUrl: e.target.value })}
                        className="w-full h-12 px-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-shadow"
                        placeholder="https://youtube.com/watch?v=..."
                      />
                      <p className="text-xs text-gray-500 font-medium ml-1">Paste a YouTube URL for video embed</p>
                    </div>

                    {/* Single Thumbnail URL */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Thumbnail Image</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={newsFormData.thumbnailUrl}
                          onChange={(e) => setNewsFormData({ ...newsFormData, thumbnailUrl: e.target.value })}
                          className="flex-1 h-12 px-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-shadow"
                          placeholder="https://thumbnail-url.jpg"
                        />
                        <label className="cursor-pointer">
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
                          <span className="inline-flex items-center h-12 px-4 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:text-blue-600 transition-colors cursor-pointer shadow-sm">
                            <Upload className="h-4 w-4 mr-2" /> Upload
                          </span>
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 font-medium ml-1">Leave blank to use main image</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Author Name */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Author Name</label>
                      <input
                        type="text"
                        value={newsFormData.authorName || ''}
                        onChange={(e) => setNewsFormData({ ...newsFormData, authorName: e.target.value })}
                        className="w-full h-12 px-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-shadow"
                        placeholder="Enter reporter/author name"
                      />
                      <p className="text-xs text-gray-500 font-medium ml-1">This name will appear on the article</p>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Tags</label>
                      <input
                        type="text"
                        value={newsFormData.tags}
                        onChange={(e) => setNewsFormData({ ...newsFormData, tags: e.target.value })}
                        className="w-full h-12 px-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-shadow"
                        placeholder="e.g. politics, pune, breaking (comma separated)"
                      />
                    </div>
                  </div>

                  {/* Short Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Short Description</label>
                    <textarea
                      value={newsFormData.metaDescription}
                      onChange={(e) => setNewsFormData({ ...newsFormData, metaDescription: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-shadow resize-none"
                      placeholder="A brief summary for preview..."
                      rows={2}
                    />
                  </div>

                  {/* Full Content */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex justify-between items-center">
                      <span>Full Content *</span>
                      <Badge variant="outline" className="font-normal text-xs bg-blue-50 text-blue-700 border-blue-200">HTML Supported</Badge>
                    </label>
                    <textarea
                      value={newsFormData.content}
                      onChange={(e) => setNewsFormData({ ...newsFormData, content: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-shadow min-h-[200px]"
                      placeholder="Write the full article content here..."
                      rows={8}
                      required
                    />
                  </div>

                  {/* Toggles: Featured & Show on Home */}
                  <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50/80 border border-gray-100 rounded-xl">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center w-5 h-5">
                        <input
                          type="checkbox"
                          checked={newsFormData.featured}
                          onChange={(e) => setNewsFormData({ ...newsFormData, featured: e.target.checked })}
                          className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded focus:ring-blue-500 checked:bg-blue-600 checked:border-blue-600 transition-colors"
                        />
                        <Check className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100" strokeWidth={3} />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">Featured (Top Section)</span>
                    </label>
                    
                    <div className="hidden sm:block w-px bg-gray-200 h-5"></div>
                    
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center w-5 h-5">
                        <input
                          type="checkbox"
                          checked={newsFormData.showOnHome}
                          onChange={(e) => setNewsFormData({ ...newsFormData, showOnHome: e.target.checked })}
                          className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded focus:ring-blue-500 checked:bg-blue-600 checked:border-blue-600 transition-colors"
                        />
                        <Check className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100" strokeWidth={3} />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">Show on Home Page</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100">
                    <Button 
                      type="submit" 
                      className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 rounded-xl shadow-sm text-base flex-1 sm:flex-none"
                    >
                      <Check className="h-5 w-5 mr-2" />
                      {editingNewsItem ? 'Update Article' : 'Submit for Review'}
                    </Button>
                    
                    {editingNewsItem && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="h-12 px-8 rounded-xl border-gray-200 hover:bg-gray-50 text-gray-700 font-medium flex-1 sm:flex-none"
                        onClick={() => {
                          setEditingNewsItem(null)
                          setNewsFormData({
                            title: '', content: '', categoryId: 'City News', mainImage: '', secondImage: '',
                            youtubeUrl: '', thumbnailUrl: '', metaDescription: '', tags: '',
                            featured: false, showOnHome: true, authorName: ''
                          })
                      }}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>



          {/* MY SUBMISSIONS TAB */}
          <TabsContent value="my-news" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-5 bg-gray-50/50">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                    <Clock className="h-5 w-5" />
                  </div>
                  My Submissions
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchMyNews}
                  className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-xl h-9 px-4 font-medium transition-colors shadow-sm"
                >
                  <Clock className="h-4 w-4 mr-2" /> Refresh List
                </Button>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                {myNews.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Newspaper className="h-8 w-8" />
                    </div>
                    <p className="font-medium text-gray-600 text-lg">No submissions yet</p>
                    <p className="text-sm text-gray-500 mt-1">Submit your first news article using the form above.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myNews.map((article) => (
                      <div 
                        key={article.id} 
                        className="group p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 cursor-pointer transition-all flex flex-col md:flex-row md:items-start justify-between gap-4" 
                        onClick={() => setSelectedSubmission(article)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-200 border-0 shadow-none px-2.5 py-0.5 rounded-lg text-xs font-semibold">
                              {article.categoryId}
                            </Badge>
                            {article.city && (
                              <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-0 shadow-none px-2.5 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                                {article.city}
                              </Badge>
                            )}
                          </div>
                          
                          <h3 className="font-bold text-lg text-gray-800 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                            {getArticleTitle(article)}
                          </h3>
                          
                          <p className="text-xs text-gray-500 font-medium mt-3 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            {new Date(article.createdAt).toLocaleString(undefined, { 
                              year: 'numeric', month: 'short', day: 'numeric', 
                              hour: '2-digit', minute: '2-digit' 
                            })}
                          </p>
                          
                          {article.adminResponse && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm flex items-start gap-2.5 shadow-sm">
                              <MessageSquare className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                              <div className="flex-1 text-red-700 font-medium">
                                <span className="font-bold block mb-0.5">Admin Feedback:</span>
                                {article.adminResponse}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-4 shrink-0 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                          <Badge className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm ${
                            article.approvalStatus === 'approved' 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200 border-0' 
                              : article.approvalStatus === 'rejected' 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200 border-0' 
                                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-0'
                          }`}>
                            {article.approvalStatus === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse mr-1.5 inline-block" />}
                            {article.approvalStatus}
                          </Badge>
                          
                          <div className="flex items-center gap-2">
                            {(article.approvalStatus === 'pending' || article.approvalStatus === 'rejected') && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-9 w-9 p-0 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50" 
                                onClick={(e) => { e.stopPropagation(); handleEditNews(article) }}
                                title="Edit Article"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-9 w-9 p-0 rounded-xl border-red-200 text-red-600 hover:bg-red-50" 
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
                                  await fetch(`/api/reporter/news/${article.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                                  fetchMyNews();
                                }
                              }}
                              title="Delete Article"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* SUBMISSION DETAIL MODAL */}
      {
        selectedSubmission && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6" onClick={() => setSelectedSubmission(null)}>
            <div 
              className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200" 
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 md:p-6 border-b border-gray-100 bg-gray-50/80">
                <div className="flex items-center gap-3">
                  <Badge className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm ${
                    selectedSubmission.approvalStatus === 'approved' 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200 border-0' 
                      : selectedSubmission.approvalStatus === 'rejected' 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200 border-0' 
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-0'
                  }`}>
                    {selectedSubmission.approvalStatus === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse mr-1.5 inline-block" />}
                    {selectedSubmission.approvalStatus}
                  </Badge>
                  <span className="text-sm font-semibold text-gray-500 bg-white px-3 py-1 rounded-lg border border-gray-200">
                    {selectedSubmission.categoryId}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-10 w-10 p-0 rounded-full hover:bg-gray-200 text-gray-500" 
                  onClick={() => setSelectedSubmission(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 leading-tight">
                  {getArticleTitle(selectedSubmission)}
                </h2>
                
                {selectedSubmission.mainImage && (
                  <div className="rounded-2xl overflow-hidden mb-8 border border-gray-100 shadow-sm">
                    <img 
                      src={selectedSubmission.mainImage} 
                      className="w-full max-h-[400px] object-cover" 
                      alt="Article Main" 
                    />
                  </div>
                )}
                
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                    {getArticleContent(selectedSubmission)}
                  </p>
                </div>
                
                <div className="mt-8 flex flex-wrap gap-2">
                  {selectedSubmission.tags && (Array.isArray(selectedSubmission.tags) ? selectedSubmission.tags : selectedSubmission.tags.split(',')).map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 rounded-lg">
                      #{typeof tag === 'string' ? tag.trim() : tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Footer / Actions */}
              <div className="p-5 md:p-6 border-t border-gray-100 bg-gray-50/80 mt-auto">
                {selectedSubmission.adminResponse && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-red-800 text-sm mb-1">Admin Feedback Required</h4>
                      <p className="text-red-700 font-medium text-sm leading-relaxed">{selectedSubmission.adminResponse}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 hidden sm:flex">
                    <Clock className="h-4 w-4" />
                    Submitted on {new Date(selectedSubmission.createdAt).toLocaleDateString()}
                  </p>
                  
                  <div className="flex w-full sm:w-auto gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 sm:flex-none h-12 px-6 rounded-xl border-gray-200 hover:bg-gray-100 font-semibold text-gray-700" 
                      onClick={() => setSelectedSubmission(null)}
                    >
                      Close
                    </Button>
                    
                    {(selectedSubmission.approvalStatus === 'pending' || selectedSubmission.approvalStatus === 'rejected') && (
                      <Button 
                        className="flex-1 sm:flex-none h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm" 
                        onClick={() => { handleEditNews(selectedSubmission); setSelectedSubmission(null) }}
                      >
                        <Edit className="h-4 w-4 mr-2" /> Edit Article
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div>
  )
}

export default ReporterDashboard
