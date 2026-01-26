'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Radio, Newspaper, LogOut, Edit, Trash2, Clock, X, MessageSquare, AlertTriangle, Check, FileText, Upload, File } from 'lucide-react'
import { INDIAN_CITIES_SORTED } from '@/lib/indianCities'

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

  const token = typeof window !== 'undefined' ? localStorage.getItem('reporterToken') : ''

  const fetchTicker = async () => {
    try {
      const res = await fetch('/api/reporter/breaking-ticker', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setTicker(data.ticker)
      setTickerText(data.ticker?.text || '')
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
      setMyNews(data.articles || [])
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
      setMyPapers(data.papers || [])
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
      } else {
        alert('Failed to save: ' + (data.error || 'Unknown error'))
      }
    } catch (err) {
      console.error('Failed to save ticker:', err)
      alert('Failed to save ticker: ' + err.message)
    } finally {
      setSavingTicker(false)
    }
  }

  const handleSubmitNews = async (e) => {
    e.preventDefault()
    if (!newsFormData.title.trim() || !newsFormData.content.trim() || !newsFormData.categoryId) return
    try {
      const url = editingNewsItem ? `/api/reporter/news/${editingNewsItem.id}` : '/api/reporter/news'
      const method = editingNewsItem ? 'PUT' : 'POST'

      // Prepare payload with all fields
      const payload = {
        title: newsFormData.title,
        content: newsFormData.content,
        categoryId: newsFormData.categoryId,
        category: newsFormData.categoryId,
        city: newsFormData.city,
        mainImage: newsFormData.mainImage,
        galleryImages: newsFormData.secondImage ? [newsFormData.secondImage] : [],
        youtubeUrl: newsFormData.youtubeUrl,
        videoUrl: newsFormData.youtubeUrl, // API uses videoUrl
        thumbnailUrl: newsFormData.thumbnailUrl,
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
        await fetchMyNews()
        setEditingNewsItem(null)
        setNewsFormData({
          title: '', content: '', categoryId: 'City News', city: '', mainImage: '', secondImage: '',
          youtubeUrl: '', thumbnailUrl: '', metaDescription: '', tags: '',
          featured: false, showOnHome: true, authorName: ''
        })
        setActiveTab('my-news')
      }
    } catch (err) {
      console.error('Failed to submit news:', err)
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

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
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
      console.error('Failed to upload e-newspaper:', err)
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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">📰</div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Reporter Panel</h1>
              <p className="text-sm text-gray-500">Welcome, {user?.name || user?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={onLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">

            <TabsTrigger value="submit-news" className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" /> {editingNewsItem ? 'Edit News' : 'Submit News'}
            </TabsTrigger>

            <TabsTrigger value="my-news" className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> My Submissions
            </TabsTrigger>
          </TabsList>



          {/* SUBMIT NEWS TAB */}
          <TabsContent value="submit-news">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5" /> {editingNewsItem ? 'Edit News Article' : 'Submit News Article'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editingNewsItem && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                    <span className="text-blue-700">Editing: {getArticleTitle(editingNewsItem)}</span>
                    <Button size="sm" variant="ghost" onClick={() => {
                      setEditingNewsItem(null)
                      setNewsFormData({
                        title: '', content: '', categoryId: 'City News', mainImage: '', secondImage: '',
                        youtubeUrl: '', thumbnailUrl: '', metaDescription: '', tags: '',
                        featured: false, showOnHome: true
                      })
                    }}>
                      <X className="h-4 w-4" /> Cancel
                    </Button>
                  </div>
                )}
                <form onSubmit={handleSubmitNews} className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Title *</label>
                    <input
                      type="text"
                      value={newsFormData.title}
                      onChange={(e) => setNewsFormData({ ...newsFormData, title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Article title"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Category * (Mandatory)</label>
                    <select
                      value={newsFormData.categoryId}
                      onChange={(e) => setNewsFormData({ ...newsFormData, categoryId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <div>
                    <label className="block text-sm font-medium mb-1">City (Select the city this news belongs to)</label>
                    <select
                      value={newsFormData.city}
                      onChange={(e) => setNewsFormData({ ...newsFormData, city: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select city (optional)</option>
                      {INDIAN_CITIES_SORTED.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  {/* Main Image with Upload */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Main Image</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={newsFormData.mainImage}
                        onChange={(e) => setNewsFormData({ ...newsFormData, mainImage: e.target.value })}
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="https://image-url.jpg"
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
                                setNewsFormData({ ...newsFormData, mainImage: event.target.result })
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                        />
                        <span className="inline-flex items-center px-3 py-2 border rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer">
                          <Upload className="h-4 w-4 mr-1" /> Upload
                        </span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Paste URL or upload an image file</p>
                  </div>

                  {/* Second Image (Optional) */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Second Image (Optional)</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={newsFormData.secondImage}
                        onChange={(e) => setNewsFormData({ ...newsFormData, secondImage: e.target.value })}
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="https://image-url.jpg"
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
                                setNewsFormData({ ...newsFormData, secondImage: event.target.result })
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                        />
                        <span className="inline-flex items-center px-3 py-2 border rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer">
                          <Upload className="h-4 w-4 mr-1" /> Upload
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* YouTube / Video URL */}
                  <div>
                    <label className="block text-sm font-medium mb-1">YouTube / Video URL</label>
                    <input
                      type="url"
                      value={newsFormData.youtubeUrl}
                      onChange={(e) => setNewsFormData({ ...newsFormData, youtubeUrl: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="https://youtube.com/watch?v=..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Paste a YouTube URL for video embed (autoplays muted on homepage)</p>
                  </div>

                  {/* Single Thumbnail URL */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Thumbnail Image</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={newsFormData.thumbnailUrl}
                        onChange={(e) => setNewsFormData({ ...newsFormData, thumbnailUrl: e.target.value })}
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="https://thumbnail-url.jpg"
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
                                setNewsFormData({ ...newsFormData, thumbnailUrl: event.target.result })
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                        />
                        <span className="inline-flex items-center px-3 py-2 border rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer">
                          <Upload className="h-4 w-4 mr-1" /> Upload
                        </span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Optional. If blank, main image will be used as thumbnail.</p>
                  </div>

                  {/* Short Description */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Short Description</label>
                    <textarea
                      value={newsFormData.metaDescription}
                      onChange={(e) => setNewsFormData({ ...newsFormData, metaDescription: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Short description for preview"
                      rows={2}
                    />
                  </div>

                  {/* Full Content */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Content * (HTML supported)</label>
                    <textarea
                      value={newsFormData.content}
                      onChange={(e) => setNewsFormData({ ...newsFormData, content: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Full article content..."
                      rows={6}
                      required
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                    <input
                      type="text"
                      value={newsFormData.tags}
                      onChange={(e) => setNewsFormData({ ...newsFormData, tags: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="politics, pune, breaking"
                    />
                  </div>

                  {/* Author Name */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Author Name</label>
                    <input
                      type="text"
                      value={newsFormData.authorName || ''}
                      onChange={(e) => setNewsFormData({ ...newsFormData, authorName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter reporter/author name"
                    />
                    <p className="text-xs text-gray-500 mt-1">This name will appear on the news article</p>
                  </div>

                  {/* Toggles: Featured & Show on Home */}
                  <div className="flex items-center gap-8 py-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newsFormData.featured}
                        onChange={(e) => setNewsFormData({ ...newsFormData, featured: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">Featured (Top 6 Boxes)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newsFormData.showOnHome}
                        onChange={(e) => setNewsFormData({ ...newsFormData, showOnHome: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">Show on Home Page</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-3">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      {editingNewsItem ? 'Update & Resubmit' : 'Submit for Review'}
                    </Button>
                    {editingNewsItem && (
                      <Button type="button" variant="outline" onClick={() => {
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
          <TabsContent value="my-news">
            <Card>
              <CardHeader><CardTitle>My Submissions</CardTitle></CardHeader>
              <CardContent>
                {myNews.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No submissions yet.</p>
                ) : (
                  <div className="space-y-3">
                    {myNews.map((article) => (
                      <div key={article.id} className="p-4 bg-white rounded-lg border hover:border-blue-400 hover:shadow-md cursor-pointer transition-all" onClick={() => setSelectedSubmission(article)}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{getArticleTitle(article)}</h3>
                            <p className="text-sm text-gray-500 mt-1">{article.categoryId}</p>
                            <p className="text-xs text-gray-400 mt-2">{new Date(article.createdAt).toLocaleString()}</p>
                            {article.adminResponse && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                                <MessageSquare className="h-4 w-4 inline mr-1 text-red-600" />
                                <span className="text-red-700">{article.adminResponse}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {(article.approvalStatus === 'pending' || article.approvalStatus === 'rejected') && (
                              <Button size="sm" variant="outline" className="text-blue-600" onClick={(e) => { e.stopPropagation(); handleEditNews(article) }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            <Badge className={article.approvalStatus === 'approved' ? 'bg-green-600' : article.approvalStatus === 'rejected' ? 'bg-red-600' : 'bg-yellow-600'}>
                              {article.approvalStatus}
                            </Badge>
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedSubmission(null)}>
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <Badge className={selectedSubmission.approvalStatus === 'approved' ? 'bg-green-600' : selectedSubmission.approvalStatus === 'rejected' ? 'bg-red-600' : 'bg-yellow-600'}>
                    {selectedSubmission.approvalStatus?.toUpperCase()}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedSubmission(null)}><X className="h-5 w-5" /></Button>
                </div>
                <h2 className="text-2xl font-bold mb-4">{getArticleTitle(selectedSubmission)}</h2>
                {selectedSubmission.mainImage && <img src={selectedSubmission.mainImage} className="w-full h-64 object-cover rounded-lg mb-4" />}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Content</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{getArticleContent(selectedSubmission)}</p>
                </div>
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Admin Feedback</h3>
                  {selectedSubmission.adminResponse ? (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">{selectedSubmission.adminResponse}</div>
                  ) : (
                    <p className="text-gray-400 italic">No admin feedback provided.</p>
                  )}
                </div>
                {(selectedSubmission.approvalStatus === 'pending' || selectedSubmission.approvalStatus === 'rejected') && (
                  <div className="border-t pt-4 mt-4">
                    <Button className="w-full" onClick={() => { handleEditNews(selectedSubmission); setSelectedSubmission(null) }}>
                      <Edit className="h-4 w-4 mr-2" /> Edit & Resubmit
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}

export default ReporterDashboard
