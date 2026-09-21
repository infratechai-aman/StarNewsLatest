'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tag, Phone, MapPin, IndianRupee, Plus, X, Upload, ImageIcon, Loader2, CheckCircle, ChevronRight, Zap, ShoppingBag, Sparkles, ArrowRight, Search, Clock, Heart, LayoutGrid, Home, Car, Briefcase, Laptop, Wrench, GraduationCap, MoreHorizontal, Armchair, Dog } from 'lucide-react'
import Image from 'next/image'
import { classifieds as classifiedsApi, getFreshToken } from '@/lib/api'
import { useLanguage } from '@/contexts/LanguageContext'

// Fixed conversion rate (1 USD = 83 INR)
const USD_TO_INR_RATE = 83

// Category-based fallback images matching ClassifiedDetailPage
const CATEGORY_FALLBACK_IMAGES = {
  'Vehicles': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800',
  'Real Estate': 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
  'Property': 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
  'IT Jobs': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
  'Jobs': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
  'Electronics': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
  'Furniture': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
  'Fashion': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800',
  'Services': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
  'Education': 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800',
  'Pets': 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800',
  'Other': 'https://images.unsplash.com/photo-1572375992501-4b089b9be8ec?w=800',
}

const getAdCardImage = (ad) => {
  if (ad.image && typeof ad.image === 'string' && !ad.image.includes('placehold.co')) return ad.image
  if (Array.isArray(ad.images) && ad.images.length > 0 && typeof ad.images[0] === 'string' && !ad.images[0].includes('placehold.co')) return ad.images[0]
  if (ad.imageUrl && typeof ad.imageUrl === 'string' && !ad.imageUrl.includes('placehold.co')) return ad.imageUrl
  return CATEGORY_FALLBACK_IMAGES[ad.category] || CATEGORY_FALLBACK_IMAGES['Other'] || 'https://images.unsplash.com/photo-1572375992501-4b089b9be8ec?w=400'
}

// Helper: Convert USD to INR
const convertToINR = (price) => {
  if (price === null || price === undefined || price === '') return null
  if (typeof price === 'number') return `₹${price.toLocaleString('en-IN')}`
  const priceStr = String(price)

  // Already INR
  if (priceStr.includes('₹')) {
    return priceStr
  }

  // Check for $ or USD
  const usdMatch = priceStr.match(/\$\s*([\d,]+(?:\.\d{2})?)|USD\s*([\d,]+(?:\.\d{2})?)/i)
  if (usdMatch) {
    const usdAmount = parseFloat((usdMatch[1] || usdMatch[2]).replace(/,/g, ''))
    const inrAmount = Math.round(usdAmount * USD_TO_INR_RATE)
    return `₹${inrAmount.toLocaleString('en-IN')}`
  }

  // Return original if no conversion needed
  return priceStr
}

// Mock classifieds for fallback
const mockClassifieds = [
  { id: '1', title: 'Software Developer - React & Node.js', category: 'IT Jobs', price: 'Salary: ₹8-12 LPA', description: 'Hiring experienced full-stack developers for startup in Hinjewadi. Must have 3+ years experience in React, Node.js and MongoDB.', location: 'Hinjewadi, Pune', phone: '+91 98765 43210', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400', postedBy: 'TechCorp Solutions', condition: 'New' },
  { id: '2', title: 'Flat for Rent - 2BHK Furnished', category: 'Real Estate', price: '₹25,000/month', description: 'Spacious 2BHK flat with all amenities near IT parks. Semi-furnished with modular kitchen, AC in bedrooms.', location: 'Baner, Pune', phone: '+91 98765 43211', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400', postedBy: 'PropertyDeals', condition: 'Good' },
  { id: '3', title: 'Honda City 2020 - Excellent Condition', category: 'Vehicles', price: '$10,240', description: 'Well maintained, single owner, full service history. Petrol variant, 35000 km driven only.', location: 'Kothrud, Pune', phone: '+91 98765 43212', image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400', postedBy: 'Auto Traders', condition: 'Excellent' },
  { id: '4', title: 'MacBook Pro M2 - Like New', category: 'Electronics', price: '$1,500', description: 'Apple MacBook Pro 14" M2 Pro, 16GB RAM, 512GB SSD. With original box and charger. Under warranty.', location: 'Viman Nagar, Pune', phone: '+91 98765 43213', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400', postedBy: 'GadgetStore', condition: 'Like New' },
]

const CLASSIFIED_CATEGORIES = [
  'IT Jobs', 'Real Estate', 'Vehicles', 'Electronics', 'Furniture', 'Fashion', 'Services', 'Other'
]

const ClassifiedsPage = ({ user, toast, setSelectedClassified, setCurrentView }) => {
  const { t, language } = useLanguage()
  const [classifieds, setClassifieds] = useState([])
  const [loading, setLoading] = useState(true)

  const getCategoryLabel = (label) => {
    const map = {
      'All Categories': 'allCategories',
      'Property': 'property',
      'Vehicles': 'vehicles',
      'Jobs': 'jobs',
      'Electronics': 'electronics',
      'Furniture': 'furniture',
      'Services': 'services',
      'Education': 'education',
      'Pets': 'pets',
      'Others': 'others'
    }
    const key = map[label]
    return key ? (t(key) || label) : label
  }

  const getConditionLabel = (c) => {
    if (c === 'New') return t('newCondition') || (language === 'mr' ? 'नवीन' : language === 'hi' ? 'नया' : 'New')
    if (c === 'Used') return t('usedCondition') || (language === 'mr' ? 'वापरलेले' : language === 'hi' ? 'इस्तेमाल किया हुआ' : 'Used')
    if (c === 'Refurbished') return t('refurbishedCondition') || (language === 'mr' ? 'नूतनीकृत' : language === 'hi' ? 'नवीनीकृत' : 'Refurbished')
    return c
  }

  const getPostedByLabel = (p) => {
    if (p === 'Individual') return t('individual') || (language === 'mr' ? 'वैयक्तिक' : language === 'hi' ? 'व्यक्तिगत' : 'Individual')
    if (p === 'Business') return t('business') || (language === 'mr' ? 'व्यवसाय' : language === 'hi' ? 'व्यापार' : 'Business')
    return p
  }

  const getLocalizedClassifiedCategory = (cat) => {
    const map = {
      'IT Jobs': language === 'mr' ? 'आयटी नोकऱ्या' : language === 'hi' ? 'आईटी नौकरियां' : 'IT Jobs',
      'Real Estate': language === 'mr' ? 'रिअल इस्टेट' : language === 'hi' ? 'रियल एस्टेट' : 'Real Estate',
      'Vehicles': language === 'mr' ? 'वाहने' : language === 'hi' ? 'वाहन' : 'Vehicles',
      'Electronics': language === 'mr' ? 'इलेक्ट्रॉनिक्स' : language === 'hi' ? 'इलेक्ट्रॉनिक्स' : 'Electronics',
      'Furniture': language === 'mr' ? 'फर्निचर' : language === 'hi' ? 'फर्नीचर' : 'Furniture',
      'Fashion': language === 'mr' ? 'फॅशन' : language === 'hi' ? 'फैशन' : 'Fashion',
      'Services': language === 'mr' ? 'सेवा' : language === 'hi' ? 'सेवाएं' : 'Services',
      'Other': language === 'mr' ? 'इतर' : language === 'hi' ? 'अन्य' : 'Other'
    }
    return map[cat] || cat
  }

  // Modal and Form State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    category: 'Other',
    price: '',
    description: '',
    location: '',
    phone: '',
    whatsappEnabled: false,
    images: []
  })
  const [imagePreviews, setImagePreviews] = useState([])
  const fileInputRef = useRef(null)

  useEffect(() => {
    const fetchClassifieds = async () => {
      try {
        const response = await classifiedsApi.getAll({})
        const data = Array.isArray(response) ? response : (Array.isArray(response?.classifieds) ? response.classifieds : [])

        if (data.length > 0) {
          setClassifieds(data)
        } else {
          // Fallback to mock data
          setClassifieds(mockClassifieds)
        }
      } catch (error) {
        console.error('Failed to load classifieds:', error)
        setClassifieds(mockClassifieds)
      } finally {
        setLoading(false)
      }
    }
    fetchClassifieds()
  }, [])

  const handleContactSeller = (ad) => {
    if (setSelectedClassified && setCurrentView) {
      setSelectedClassified(ad)
      setCurrentView('classified-detail')
    }
  }

  // Handle image upload
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    // Check total images limit
    const totalImages = formData.images.length + files.length
    if (totalImages > 8) {
      toast?.({ title: 'Maximum 8 images allowed', variant: 'destructive' })
      return
    }

    // Check size limit: 700KB
    const oversizedFiles = files.filter(f => f.size > 700 * 1024)
    if (oversizedFiles.length > 0) {
      toast?.({ title: 'Image must be under 700KB', variant: 'destructive' })
      return
    }

    setUploadingImages(true)
    try {
      const token = await getFreshToken() || (typeof window !== 'undefined' ? localStorage.getItem('token') : null)

      // Create previews and upload
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue

        // Create preview
        const reader = new FileReader()
        reader.onload = (event) => {
          setImagePreviews(prev => [...prev, event.target.result])
        }
        reader.readAsDataURL(file)

        // Upload to server
        try {
          const formDataUpload = new FormData()
          formDataUpload.append('file', file)
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
            body: formDataUpload
          })
          if (response.ok) {
            const data = await response.json()
            setFormData(prev => ({
              ...prev,
              images: [...prev.images, data.url]
            }))
          } else {
            const errData = await response.json().catch(() => ({}))
            toast?.({ title: errData.error || 'Upload failed', variant: 'destructive' })
          }
        } catch (error) {
          console.error('Upload failed:', error)
          toast?.({ title: 'Upload failed. Please try again.', variant: 'destructive' })
        }
      }
    } finally {
      setUploadingImages(false)
    }
  }

  // Remove image
  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate
    if (!formData.title || !formData.price || !formData.description || !formData.location || !formData.phone) {
      toast?.({ title: 'Please fill all required fields', variant: 'destructive' })
      return
    }

    if (uploadingImages) {
      toast?.({ title: 'Please wait for image upload to complete', variant: 'default' })
      return
    }

    if (formData.images.length < 1) {
      toast?.({ title: 'Minimum 1 image required', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      await classifiedsApi.submit(formData)
      setSubmitted(true)
      toast?.({ title: 'Success!', description: 'Your classified ad has been sent for admin approval' })
    } catch (error) {
      toast?.({ title: 'Submission Failed', description: error.message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // Reset form and close modal
  const closeModal = () => {
    setShowCreateModal(false)
    setSubmitted(false)
    setFormData({
      title: '',
      category: 'Other',
      price: '',
      description: '',
      location: '',
      phone: '',
      whatsappEnabled: false,
      images: []
    })
    setImagePreviews([])
  }

  if (loading) {
    return (
      <div className="px-4 md:px-8 max-w-[1920px] mx-auto pb-12 pt-8">
        <div className="animate-pulse">
          {/* Hero Skeleton */}
          <div className="w-full h-[320px] md:h-[400px] bg-slate-100 rounded-[32px] mb-10" />
          {/* Note Banner Skeleton */}
          <div className="w-full h-16 bg-slate-50 rounded-[16px] mb-10" />
          {/* Grid Skeleton */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className={`flex flex-col h-full border border-slate-100 rounded-[24px] overflow-hidden ${i === 1 ? 'md:col-span-2' : ''}`}>
                <div className={`w-full bg-slate-100 ${i === 1 ? 'aspect-[2/1]' : 'aspect-[4/3]'}`} />
                <div className="p-5 md:p-6 bg-white">
                  <div className="w-full h-6 bg-slate-100 rounded mb-2" />
                  <div className="w-2/3 h-6 bg-slate-100 rounded mb-6" />
                  <div className="w-24 h-8 bg-slate-100 rounded mb-4" />
                  <div className="w-32 h-4 bg-slate-100 rounded mb-6" />
                  <div className="flex justify-between pt-4 border-t border-slate-50">
                    <div className="w-20 h-3 bg-slate-100 rounded" />
                    <div className="w-4 h-4 bg-slate-100 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-12">
      {/* ─── HERO BANNER ─── */}
      <div className="relative w-full overflow-hidden h-[160px] md:h-[200px]">
        <Image src="/premium_classifieds_banner_1789523876923.jpg" alt="Classifieds" fill className="absolute inset-0 object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />
        <div className="relative z-10 w-full px-4 md:px-12 flex flex-col justify-center h-full">
          <div>
            <p className="text-gray-400 text-[10px] md:text-xs font-black uppercase tracking-widest mb-1 md:mb-2">{t('classifieds') || 'CLASSIFIEDS'}</p>
            <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-black leading-tight mb-2">
              {t('classifiedHeroTitle') || 'Buy. Sell. Rent. Find Opportunities.'}
            </h1>
            <p className="hidden sm:block text-gray-300 text-xs md:text-sm mb-3 md:mb-5 max-w-lg">{t('classifiedHeroSubtitle') || 'Post your classified ad and reach thousands across Pune and beyond.'}</p>
            <div className="hidden md:flex flex-wrap gap-5">
              {[
                { icon: '📋', title: t('easyPosting') || 'Easy Posting', sub: t('listInMinutes') || 'List in minutes' },
                { icon: '📡', title: t('wideReach') || 'Wide Reach', sub: t('getNoticedLocally') || 'Get noticed locally' },
                { icon: '🛡️', title: t('trustedPlatform') || 'Trusted Platform', sub: t('poweredByStarNews') || 'Powered by StarNews' },
              ].map(f => (
                <div key={f.title} className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg border border-white/20 bg-white/10 flex items-center justify-center text-lg">{f.icon}</div>
                  <div>
                    <p className="text-white text-xs font-black">{f.title}</p>
                    <p className="text-gray-400 text-[10px]">{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── SEARCH BAR ─── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('searchClassifiedsPlaceholder') || 'Search for products, services, jobs, properties and more...'}
                className="h-11 pl-10 rounded-lg border-gray-200 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 text-sm text-gray-600 bg-white">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{language === 'mr' ? 'पुणे, महाराष्ट्र' : language === 'hi' ? 'पुणे, महाराष्ट्र' : 'Pune, Maharashtra'}</span>
            </div>
            <Button className="h-11 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg">
              {t('search') || 'Search'} →
            </Button>
          </div>
        </div>
      </div>

      {/* ─── CATEGORY TABS ─── */}
      <div className="border-b border-gray-100 bg-white shadow-sm pt-5 pb-5">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-start gap-4">
          <div className="flex-1 flex items-center gap-3 overflow-x-auto pb-2 w-full" style={{ scrollbarWidth: 'none' }}>
            {[
              { icon: <LayoutGrid className="w-5 h-5 text-indigo-500" />, label: 'All Categories', color: 'bg-indigo-50' },
              { icon: <Home className="w-5 h-5 text-blue-500" />, label: 'Property', color: 'bg-blue-50' },
              { icon: <Car className="w-5 h-5 text-emerald-500" />, label: 'Vehicles', color: 'bg-emerald-50' },
              { icon: <Briefcase className="w-5 h-5 text-orange-500" />, label: 'Jobs', color: 'bg-orange-50' },
              { icon: <Laptop className="w-5 h-5 text-cyan-500" />, label: 'Electronics', color: 'bg-cyan-50' },
              { icon: <ShoppingBag className="w-5 h-5 text-amber-500" />, label: 'Furniture', color: 'bg-amber-50' },
              { icon: <Wrench className="w-5 h-5 text-rose-500" />, label: 'Services', color: 'bg-rose-50' },
              { icon: <GraduationCap className="w-5 h-5 text-violet-500" />, label: 'Education', color: 'bg-violet-50' },
              { icon: <Heart className="w-5 h-5 text-pink-500" />, label: 'Pets', color: 'bg-pink-50' },
              { icon: <MoreHorizontal className="w-5 h-5 text-gray-500" />, label: 'Others', color: 'bg-gray-100' },
            ].map((cat, i) => {
              const isActive = i === 0
              return (
                <button
                  key={cat.label}
                  className={`shrink-0 flex flex-col items-center justify-center gap-2 min-w-[95px] h-[90px] rounded-[18px] border transition-all duration-300 ${
                    isActive ? 'border-red-500 bg-red-50/50 shadow-sm text-red-600' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md hover:-translate-y-1 text-gray-700'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-white shadow-sm' : cat.color}`}>
                    {isActive ? <LayoutGrid className="w-5 h-5 text-red-500" /> : cat.icon}
                  </div>
                  <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'text-red-600' : 'text-gray-600'}`}>{getCategoryLabel(cat.label)}</span>
                </button>
              )
            })}
          </div>
          <button onClick={() => setShowCreateModal(true)} className="shrink-0 h-[90px] px-8 bg-red-600 hover:bg-red-700 text-white rounded-[18px] shadow-lg shadow-red-200 flex flex-col items-center justify-center gap-1 transition-all hover:-translate-y-1 w-full md:w-auto">
            <span className="font-black text-sm flex items-center gap-1"><Plus className="w-4 h-4"/> {t('postClassifiedAd') || 'Post a Classified Ad'}</span>
            <span className="text-[10px] opacity-80 font-medium">{t('freeAndEasy') || "It's free and easy"}</span>
          </button>
        </div>
      </div>

      {/* ─── MAIN LAYOUT ─── */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] gap-8">
          
          {/* LEFT: Filters */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900">{t('filters') || 'Filters'}</h3>
              <button className="text-red-600 text-[11px] font-bold">{t('clearAll') || 'Clear All'}</button>
            </div>
            
            {/* Location */}
            <div>
              <p className="text-[10px] font-black text-gray-700 mb-2 flex items-center gap-1 tracking-wider uppercase"><MapPin className="w-3 h-3" /> {t('location') || 'Location'}</p>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white">
                <option>{language === 'mr' ? 'पुणे, महाराष्ट्र' : language === 'hi' ? 'पुणे, महाराष्ट्र' : 'Pune, Maharashtra'}</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <p className="text-[10px] font-black text-gray-700 mb-2 flex items-center gap-1 tracking-wider uppercase"><Tag className="w-3 h-3" /> {t('category') || 'Category'}</p>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white">
                <option>{t('allCategories') || 'All Categories'}</option>
              </select>
            </div>

            {/* Price Range */}
            <div>
              <p className="text-[10px] font-black text-gray-700 mb-2 flex items-center gap-1 tracking-wider uppercase"><IndianRupee className="w-3 h-3" /> {t('priceRange') || 'Price Range'}</p>
              <div className="flex gap-2 text-sm">
                <Input placeholder="₹ Min" className="h-9" />
                <span className="text-gray-400 mt-1">-</span>
                <Input placeholder="₹ Max" className="h-9" />
              </div>
            </div>

            {/* Condition */}
            <div>
              <p className="text-[10px] font-black text-gray-700 mb-2 flex items-center gap-1 tracking-wider uppercase"><Sparkles className="w-3 h-3" /> {t('condition') || 'Condition'}</p>
              {['New', 'Used', 'Refurbished'].map(bt => (
                <label key={bt} className="flex items-center gap-2 text-xs text-gray-600 py-1.5 cursor-pointer">
                  <input type="checkbox" className="accent-red-600 w-4 h-4 rounded border-gray-300" /> {getConditionLabel(bt)}
                </label>
              ))}
            </div>

            {/* Posted By */}
            <div>
              <p className="text-[10px] font-black text-gray-700 mb-2 flex items-center gap-1 tracking-wider uppercase"><MapPin className="w-3 h-3" /> {t('postedBy') || 'Posted By'}</p>
              {['Individual', 'Business'].map(bt => (
                <label key={bt} className="flex items-center gap-2 text-xs text-gray-600 py-1.5 cursor-pointer">
                  <input type="checkbox" className="accent-red-600 w-4 h-4 rounded border-gray-300" /> {getPostedByLabel(bt)}
                </label>
              ))}
            </div>
            
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg h-11 text-sm mt-4">{t('applyFilters') || 'Apply Filters'}</Button>
          </div>

          {/* CENTER: Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500 font-medium">{t('showing') || 'Showing'} 1-12 {t('of') || 'of'} {classifieds.length > 0 ? classifieds.length * 370 : 1482} {t('ads') || 'ads'}</p>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">{t('sortBy') || 'Sort by'}</span>
                <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white">
                  <option>{t('latestFirst') || 'Latest First'}</option>
                  <option>{t('priceLowHigh') || 'Price: Low to High'}</option>
                  <option>{t('priceHighLow') || 'Price: High to Low'}</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classifieds.map((ad, idx) => {
                const displayPrice = convertToINR(ad.price)
                const cardImg = getAdCardImage(ad)
                return (
                  <div key={ad.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden group cursor-pointer hover:shadow-lg transition-all flex flex-col" onClick={() => handleContactSeller(ad)}>
                    <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                      <Image src={cardImg} alt={ad.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 33vw" />
                      <Badge className={`absolute top-2 left-2 ${ad.condition === 'New' ? 'bg-green-500 text-white' : ad.condition === 'Urgent' ? 'bg-red-600 text-white' : 'bg-yellow-400 text-yellow-950'} hover:opacity-90 border-none px-2 py-0.5 text-[9px] font-black uppercase shadow-sm`}>
                        {ad.condition === 'New' ? (t('newCondition') || 'NEW') : ad.condition === 'Excellent' ? (language === 'mr' ? 'खास' : language === 'hi' ? 'विशेष' : 'FEATURED') : (language === 'mr' ? 'तातडीचे' : language === 'hi' ? 'तत्काल' : 'URGENT')}
                      </Badge>
                      <button className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors shadow-sm">
                        <Heart className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <h4 className="font-black text-[15px] text-gray-900 leading-tight mb-1">{displayPrice || '₹0'}</h4>
                      <p className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug mb-2 min-h-[32px]">{ad.title}</p>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-1 mt-auto">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{ad.location}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-2">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{language === 'mr' ? `${idx + 1 + (idx * 2)} तासांपूर्वी` : language === 'hi' ? `${idx + 1 + (idx * 2)} घंटे पहले` : `${idx + 1 + (idx * 2)} hours ago`}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-100 mt-auto flex items-center justify-between">
                        <span className="text-xs font-bold text-red-600 group-hover:text-red-700 flex items-center gap-1">
                          {t('viewDetails') || 'View Details'}
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-6">
            {/* Why Post on StarNews */}
            <div className="bg-red-50/30 border border-red-100 rounded-2xl p-5 relative overflow-hidden">
              <h3 className="font-black text-base text-gray-900 mb-4">{t('whyPostOnStarNews') || 'Why Post on StarNews?'}</h3>
              <ul className="space-y-3 relative z-10">
                {[
                  t('whyPostPoint1') || 'Reach genuine buyers & sellers',
                  t('whyPostPoint2') || 'Trusted by the community',
                  t('whyPostPoint3') || 'Free and easy to use',
                  t('whyPostPoint4') || 'Wide local reach across Maharashtra'
                ].map(p => (
                  <li key={p} className="flex gap-2 text-xs text-gray-700 font-bold">
                    <div className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black shadow-sm">✓</div>
                    {p}
                  </li>
                ))}
              </ul>
              <div className="absolute right-[-10px] bottom-4 text-red-500 flex items-end gap-1">
                <div className="w-2 h-4 bg-red-300 rounded-t-sm" />
                <div className="w-2 h-8 bg-red-400 rounded-t-sm" />
                <div className="w-2 h-12 bg-red-500 rounded-t-sm" />
              </div>
            </div>

            {/* Local People Banner */}
            <div className="bg-[#1a1c29] rounded-2xl p-6 relative overflow-hidden text-white shadow-md">
              <img src="https://images.unsplash.com/photo-1596706059432-850f865f1a58?w=400&q=80" alt="Pune" className="absolute inset-0 w-full h-full object-cover opacity-[0.15] mix-blend-overlay" />
              <div className="relative z-10">
                <h3 className="font-black text-xl leading-tight mb-2">{t('localPeople') || 'Local People'}<br/><span className="text-red-400">{t('realOpportunities') || 'Real Opportunities'}</span></h3>
                <p className="text-xs text-gray-300 mb-5 leading-relaxed">{t('classifiedSideDesc') || 'From homes to jobs, find it all on StarNews Classifieds.'}</p>
                <Button size="sm" onClick={() => setShowCreateModal(true)} className="bg-red-600 hover:bg-red-700 text-[11px] font-bold h-8 rounded-lg shadow-sm cursor-pointer active:scale-95 transition-transform">{t('postYourAd') || 'Post Your Ad'} →</Button>
              </div>
            </div>

            {/* Popular Searches */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="font-black text-sm text-gray-900 mb-4">{t('popularSearches') || 'Popular Searches'}</h3>
              <div className="space-y-3">
                {(language === 'mr'
                  ? ['२ बीएचके फ्लॅट', 'वापरलेल्या गाड्या', 'पुण्यात नोकऱ्या', 'लॅपटॉप', 'घरगुती शिकवणी', 'व्यावसायिक जागा', 'फर्निचर', 'रॉयल एनफील्ड', 'एसी विक्रीसाठी', 'पाळीव प्राणी']
                  : language === 'hi'
                  ? ['2 बीएचके फ्लैट', 'पुरानी कारें', 'पुणे में नौकरियां', 'लैपटॉप', 'होम ट्यूशन', 'कमर्शियल स्पेस', 'फर्नीचर', 'रॉयल एनफील्ड', 'बिक्री के लिए एसी', 'पालतू जानवर']
                  : ['2 BHK Flat', 'Used Cars', 'Jobs in Pune', 'Laptop', 'Home Tuition', 'Commercial Space', 'Furniture', 'Royal Enfield', 'AC for Sale', 'Pets']
                ).map(search => (
                  <div key={search} className="flex items-center gap-3 cursor-pointer group">
                    <Search className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-500 transition-colors" />
                    <span className="text-xs font-semibold text-gray-700 group-hover:text-red-600 transition-colors">{search}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Listing Modal */}
      <Dialog open={showCreateModal} onOpenChange={closeModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{t('postClassified') || (language === 'mr' ? 'वर्गीकृत जाहिरात पोस्ट करा' : language === 'hi' ? 'वर्गीकृत विज्ञापन पोस्ट करें' : 'Post Classified')}</DialogTitle>
            <DialogDescription>
              {language === 'mr' ? 'तुमची जाहिरात पुनरावलोकनासाठी पाठवण्यासाठी खालील तपशील भरा' : language === 'hi' ? 'अपनी वर्गीकृत विज्ञापन समीक्षा के लिए सबमिट करने के लिए नीचे विवरण भरें' : 'Fill in the details below to submit your classified ad for review'}
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            // Success State
            <div className="py-12 text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-700">{t('submissionSuccess') || (language === 'mr' ? 'यशस्वीरित्या सबमिट झाले!' : language === 'hi' ? 'सफलतापूर्वक सबमिट किया गया!' : 'Submission Successful!')}</h3>
              <p className="text-muted-foreground">
                {language === 'mr' ? 'तुमची जाहिरात प्रशासक मंजुरीसाठी पाठवली गेली आहे. ती थेट झाल्यावर तुम्हाला सूचित केले जाईल.' : language === 'hi' ? 'आपका विज्ञापन व्यवस्थापक की स्वीकृति के लिए भेज दिया गया है। लाइव होने पर आपको सूचित किया जाएगा।' : "Your classified ad has been sent for admin approval. You will be notified once it's live."}
              </p>
              <Button onClick={closeModal} className="mt-4">
                {t('close') || 'Close'}
              </Button>
            </div>
          ) : (
            // Form
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">{language === 'mr' ? 'शीर्षक *' : language === 'hi' ? 'शीर्षक *' : 'Title *'}</Label>
                <Input
                  id="title"
                  placeholder={language === 'mr' ? 'तुमच्या जाहिरातीसाठी वर्णनात्मक शीर्षक प्रविष्ट करा' : language === 'hi' ? 'अपने विज्ञापन के लिए एक वर्णनात्मक शीर्षक दर्ज करें' : 'Enter a descriptive title for your ad'}
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              {/* Category & Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'mr' ? 'श्रेणी *' : language === 'hi' ? 'श्रेणी *' : 'Category *'}</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder={language === 'mr' ? 'श्रेणी निवडा' : language === 'hi' ? 'श्रेणी चुनें' : 'Select category'} />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASSIFIED_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{getLocalizedClassifiedCategory(cat)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">{language === 'mr' ? 'किंमत *' : language === 'hi' ? 'मूल्य *' : 'Price *'}</Label>
                  <Input
                    id="price"
                    placeholder={language === 'mr' ? 'उदा., ₹५,००० किंवा विनंतीनुसार' : language === 'hi' ? 'उदा., ₹5,000 या अनुरोध पर मूल्य' : 'e.g., ₹5,000 or Price on Request'}
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Images Upload */}
              <div className="space-y-2">
                <Label>{language === 'mr' ? 'छायाचित्रे * (किमान १, कमाल ८, प्रत्येकी जास्तीत जास्त ७००केबी)' : language === 'hi' ? 'छवियां * (न्यूनतम 1, अधिकतम 8, अधिकतम 700KB प्रत्येक)' : 'Images * (Minimum 1, Maximum 8, Max 700KB each)'}</Label>
                <p className="text-xs text-muted-foreground mt-1 mb-2">{language === 'mr' ? 'शिफारस केलेले आकार: ८००x६००px (लँडस्केप)' : language === 'hi' ? 'अनुशंसित आकार: 800x600px (लैंडस्केप)' : 'Recommended size: 800x600px (Landscape)'}</p>
                <div className="grid grid-cols-4 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden border-2 border-gray-200">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  {formData.images.length < 8 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-video rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-orange-500 hover:bg-orange-50 transition-colors"
                    >
                      <Upload className="h-6 w-6 text-gray-400" />
                      <span className="text-xs text-gray-500 mt-1">{language === 'mr' ? 'छायाचित्र जोडा' : language === 'hi' ? 'छवि जोड़ें' : 'Add Image'}</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.images.length}/8 images uploaded ({formData.images.length < 1 ? `${1 - formData.images.length} more required` : 'Ready'})
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">{language === 'mr' ? 'वर्णन *' : language === 'hi' ? 'विवरण *' : 'Description *'}</Label>
                <Textarea
                  id="description"
                  placeholder={language === 'mr' ? 'तुमच्या वस्तू किंवा सेवेचे तपशीलवार वर्णन करा...' : language === 'hi' ? 'अपने उत्पाद या सेवा का विस्तार से वर्णन करें...' : 'Describe your item or service in detail...'}
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">{language === 'mr' ? 'स्थान (परिसर, शहर) *' : language === 'hi' ? 'स्थान (क्षेत्र, शहर) *' : 'Location (Area, City) *'}</Label>
                <Input
                  id="location"
                  placeholder={language === 'mr' ? 'उदा., हिंजवडी, पुणे' : language === 'hi' ? 'उदा., हिंजेवाड़ी, पुणे' : 'e.g., Hinjewadi, Pune'}
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">{language === 'mr' ? 'फोन नंबर *' : language === 'hi' ? 'फ़ोन नंबर *' : 'Phone Number *'}</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>

              {/* WhatsApp Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="whatsapp"
                  checked={formData.whatsappEnabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, whatsappEnabled: checked }))}
                />
                <Label htmlFor="whatsapp" className="text-sm font-normal cursor-pointer">
                  {language === 'mr' ? 'हा नंबर व्हॉट्सअॅपवर आहे' : language === 'hi' ? 'यह नंबर व्हाट्सएप पर है' : 'This number is on WhatsApp'}
                </Label>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                  {t('cancel') || 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  disabled={submitting || uploadingImages}
                >
                  {uploadingImages ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {language === 'mr' ? 'छायाचित्र अपलोड होत आहे...' : language === 'hi' ? 'छवि अपलोड हो रही है...' : 'Uploading Image...'}
                    </>
                  ) : submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {language === 'mr' ? 'सबमिट होत आहे...' : language === 'hi' ? 'सबमिट हो रहा है...' : 'Submitting...'}
                    </>
                  ) : (
                    language === 'mr' ? 'मंजुरीसाठी सबमिट करा' : language === 'hi' ? 'स्वीकृति के लिए सबमिट करें' : 'Submit for Approval'
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ClassifiedsPage