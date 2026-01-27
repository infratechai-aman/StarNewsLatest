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
import { Tag, Phone, MapPin, IndianRupee, Plus, X, Upload, ImageIcon, Loader2, CheckCircle } from 'lucide-react'
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
  const { t } = useLanguage()
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
    return <div className="text-center py-12">Loading classifieds...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg"><Tag className="h-8 w-8 text-white" /></div>
            <div>
              <h1 className="text-3xl font-bold">{t('classifiedAds')}</h1>
              <p className="text-muted-foreground">{t('language') === 'भाषा' ? 'खरीदें, बेचें, किराये पर दें और नौकरी पाएं' : t('language') === 'भाषा' ? 'खरेदी करा, विक्री करा, भाड्याने द्या आणि नोकऱ्या शोधा' : 'Buy, Sell, Rent & Find Jobs'}</p>
            </div>
          </div>

          {/* Create Your Listing Button */}
          <Button
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('postClassified')}
          </Button>
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm"><strong>{t('note')}:</strong> {t('classifiedAdminNote')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Classified Ads Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {classifieds.map((ad) => {
          const displayPrice = convertToINR(ad.price)
          return (
            <Card key={ad.id} className="overflow-hidden hover:shadow-xl transition-all group cursor-pointer flex flex-col h-full" onClick={() => handleContactSeller(ad)}>
              {/* Fixed aspect ratio image container for uniform sizing */}
              <div className="relative aspect-video overflow-hidden bg-gray-100">
                <img
                  src={ad.image || ad.images?.[0]}
                  alt={ad.title}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
                <Badge className="absolute top-2 left-2 bg-orange-500">{ad.category}</Badge>
                {ad.condition && (
                  <Badge variant="outline" className="absolute top-2 right-2 bg-white/90 text-gray-700 text-xs">
                    {ad.condition}
                  </Badge>
                )}
              </div>
              <CardContent className="p-4 space-y-2 flex flex-col flex-grow">
                <h3 className="font-bold text-base line-clamp-2 group-hover:text-orange-600 transition-colors min-h-[2.5rem]">{ad.title}</h3>

                {/* Price - INR Display */}
                <div className="flex items-center gap-1.5 text-xl font-bold text-green-600 min-h-[1.75rem]">
                  {displayPrice ? (
                    <>
                      <IndianRupee className="h-5 w-5" />
                      <span>{displayPrice.replace('₹', '')}</span>
                    </>
                  ) : (
                    <span className="text-gray-400 text-sm font-normal">Price on request</span>
                  )}
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 flex-shrink-0" /><span className="truncate">{ad.location}</span></div>
                </div>

                <div className="mt-auto pt-2">
                  <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleContactSeller(ad)
                    }}
                  >
                    {t('contactSeller')}
                  </Button>
                </div>
              </CardContent>
            </Card>
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