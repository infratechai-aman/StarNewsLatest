'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tag, Phone, MapPin, IndianRupee, Plus, X, Upload, ImageIcon, Loader2, CheckCircle, ChevronRight, Zap, ShoppingBag, Sparkles, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { classifieds as classifiedsApi } from '@/lib/api'
import { useLanguage } from '@/contexts/LanguageContext'

// Fixed conversion rate (1 USD = 83 INR)
const USD_TO_INR_RATE = 83

// Helper: Convert USD to INR
const convertToINR = (priceStr) => {
  if (!priceStr) return null

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

const ClassifiedsPage = ({ user, toast, setSelectedClassified, setCurrentView }) => {
  const { t, language } = useLanguage()
  const [classifieds, setClassifieds] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal and Form State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
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
        const data = Array.isArray(response) ? response : (response.classifieds || [])

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

    // Check total images limit
    const totalImages = formData.images.length + files.length
    if (totalImages > 8) {
      toast?.({ title: 'Maximum 8 images allowed', variant: 'destructive' })
      return
    }

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
          body: formDataUpload
        })
        if (response.ok) {
          const data = await response.json()
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, data.url]
          }))
        }
      } catch (error) {
        console.error('Upload failed:', error)
      }
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
    <div className="px-4 md:px-8 max-w-[1920px] mx-auto pb-12">
      {/* Premium Hero Banner */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-orange-950 via-amber-950 to-black text-white mb-10 shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')] opacity-10" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-600/20 to-transparent hidden md:block" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px]" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 p-8 md:p-12 lg:p-16">
          <div className="flex-1">
            <Badge className="bg-orange-600/20 text-orange-400 border border-orange-600/30 mb-6 px-4 py-1.5 font-black uppercase text-[10px] tracking-[0.3em] backdrop-blur-md">
              <Sparkles className="w-3 h-3 mr-2" />
              {t('marketplace') || 'Marketplace'}
            </Badge>
            <h1 className="text-5xl md:text-7xl font-heading font-black leading-[0.9] tracking-tighter mb-6 italic">
              {t('classifiedAds') || 'Classified'} <span className="text-orange-400">Ads</span>
            </h1>
            <p className="text-lg text-gray-400 font-medium leading-relaxed max-w-lg mb-8">
              {language === 'hi' ? 'खरीदें, बेचें, किराये पर दें और नौकरी पाएं — पुणे का प्रीमियम मार्केटप्लेस' : language === 'mr' ? 'खरेदी करा, विक्री करा, भाड्याने द्या आणि नोकऱ्या शोधा — पुण्याचे प्रीमियम मार्केटप्लेस' : 'Buy, sell, rent, and find jobs — Premium marketplace for Pune and beyond.'}
            </p>
            <Button
              className="h-14 rounded-full px-10 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black transition-all shadow-xl shadow-orange-900/30 hover:-translate-y-1 group"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="mr-3 h-5 w-5" /> {t('postClassified') || 'Post Your Ad'}
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="flex flex-row md:flex-col gap-4">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[20px] p-6 text-center min-w-[140px]">
              <div className="text-3xl font-black text-orange-400 mb-1">{classifieds.length}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('activeAds') || 'Active Ads'}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[20px] p-6 text-center min-w-[140px]">
              <div className="text-3xl font-black text-green-400 mb-1">Free</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('toPost') || 'To Post'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-10 flex items-start sm:items-center gap-3">
        <div className="mt-0.5 sm:mt-0 flex-shrink-0">
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-700">{t('note') || 'Note'}:</span> {t('classifiedAdminNote') || 'All classified ads are reviewed by the editorial team before publication.'}
        </p>
      </div>

      {/* Classified Ads Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
        {classifieds.map((ad, idx) => {
          const displayPrice = convertToINR(ad.price)
          return (
            <div
              key={ad.id}
              className={`group rounded-[24px] overflow-hidden cursor-pointer border border-gray-100 bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col h-full ${idx === 0 ? 'md:col-span-2 md:row-span-1' : ''}`}
              onClick={() => handleContactSeller(ad)}
            >
              <div className={`relative overflow-hidden bg-gray-50 ${idx === 0 ? 'aspect-[2/1]' : 'aspect-[4/3]'}`}>
                <Image
                  src={ad.image || ad.images?.[0] || 'https://images.unsplash.com/photo-1572375992501-4b089b9be8ec?w=400'}
                  alt={ad.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-[2000ms]"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Badge className="absolute top-5 left-5 bg-orange-600/90 backdrop-blur-md text-white border-none px-4 py-1.5 font-black uppercase text-[9px] tracking-widest shadow-lg">
                  {ad.category}
                </Badge>
                {ad.condition && (
                  <div className="absolute bottom-5 right-5 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg">
                    <span className="text-[9px] font-black text-gray-900 uppercase tracking-widest">{ad.condition}</span>
                  </div>
                )}
              </div>

              <div className="p-5 md:p-6 flex-1 flex flex-col">
                <h3 className="font-heading font-black text-lg md:text-xl mb-4 leading-tight group-hover:text-orange-600 transition-colors tracking-tight line-clamp-2">
                  {ad.title}
                </h3>

                <div className="flex items-center gap-1.5 text-2xl font-black text-green-600 mb-4 tracking-tighter">
                  {displayPrice ? (
                    <>
                      <IndianRupee className="h-5 w-5" />
                      <span>{displayPrice.replace('₹', '')}</span>
                    </>
                  ) : (
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-widest italic">{t('priceOnRequest') || 'Price on request'}</span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-300" />
                  <span className="truncate">{ad.location}</span>
                </div>

                <div className="pt-4 border-t border-gray-50 mt-auto flex items-center justify-between">
                  <span className="font-black text-[10px] text-orange-600 uppercase tracking-widest">{t('viewDetails') || 'View Details'}</span>
                  <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-orange-600 group-hover:translate-x-2 transition-all" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Listing Modal */}
      <Dialog open={showCreateModal} onOpenChange={closeModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{t('postClassified')}</DialogTitle>
            <DialogDescription>
              Fill in the details below to submit your classified ad for review
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            // Success State
            <div className="py-12 text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-700">{t('submissionSuccess')}</h3>
              <p className="text-muted-foreground">
                Your classified ad has been sent for admin approval. You will be notified once it's live.
              </p>
              <Button onClick={closeModal} className="mt-4">
                {t('close')}
              </Button>
            </div>
          ) : (
            // Form
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter a descriptive title for your ad"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  placeholder="e.g., ₹5,000 or Price on Request"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  required
                />
              </div>

              {/* Images Upload */}
              <div className="space-y-2">
                <Label>Images * (Minimum 1, Maximum 8, Max 1 MB)</Label>
                <p className="text-xs text-muted-foreground mt-1 mb-2">Recommended size: 800x600px (Landscape)</p>
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
                      <span className="text-xs text-gray-500 mt-1">Add Image</span>
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
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your item or service in detail..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location (Area, City) *</Label>
                <Input
                  id="location"
                  placeholder="e.g., Hinjewadi, Pune"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
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
                  This number is on WhatsApp
                </Label>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit for Approval'
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