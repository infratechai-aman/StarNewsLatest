'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Star,
  MapPin,
  Phone,
  Globe,
  MessageCircle,
  Navigation,
  Clock,
  Shield,
  ChevronLeft,
  CheckCircle,
  User
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

// Sample additional images for gallery (in real app, these would come from business data)
const getGalleryImages = (coverImage) => {
  const baseId = coverImage?.includes('?') ? coverImage.split('?')[0] : coverImage
  return [
    coverImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800',
  ]
}

// Sample reviews (UI only)
const sampleReviews = [
  { id: 1, name: 'Rahul S.', rating: 5, date: '2 days ago', comment: 'Excellent service and quality. Highly recommended!' },
  { id: 2, name: 'Priya M.', rating: 4, date: '1 week ago', comment: 'Good experience overall. Staff was helpful and professional.' },
  { id: 3, name: 'Amit K.', rating: 5, date: '2 weeks ago', comment: 'Been coming here for years. Never disappointed!' },
]

const BusinessDetailPage = ({ business, setCurrentView, user, toast }) => {
  const { t } = useLanguage()
  const [mainImage, setMainImage] = useState(0)
  const galleryImages = getGalleryImages(business?.coverImage)

  if (!business) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Business not found</p>
        <Button onClick={() => setCurrentView('businesses')} className="mt-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          {t('backToDirectory')}
        </Button>
      </div>
    )
  }

  // Helper to format phone for tel: link
  const formatPhoneLink = (phone) => phone?.replace(/\s/g, '') || ''

  // Helper to format WhatsApp link
  const formatWhatsAppLink = (phone) => {
    const cleaned = phone?.replace(/[^\d]/g, '') || ''
    return `https://wa.me/${cleaned}`
  }

  // Helper to format Google Maps link
  const formatMapsLink = (address) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`
  }

  // Helper to format website URL
  const formatWebsiteUrl = (url) => {
    if (!url) return ''
    return url.startsWith('http') ? url : `https://${url}`
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => setCurrentView('businesses')}
        className="mb-4 hover:bg-gray-100"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        {t('backToDirectory')}
      </Button>

      {/* ==================== 1. TOP BUSINESS HEADER (JUSTDIAL STYLE) ==================== */}
      <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6 mb-4">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          {/* Cover Image - Main Display */}
          <img
            src={business.coverImage || business.logo}
            alt={business.name}
            className="w-full md:w-48 h-40 md:h-32 rounded-xl object-cover border-2 border-gray-200 flex-shrink-0"
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop'; }}
          />

          <div className="flex-1">
            {/* Business Name */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {business.name}
            </h1>

            {/* Rating & Reviews */}
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1 rounded-lg">
                <Star className="h-4 w-4 fill-white" />
                <span className="font-bold">{business.rating}</span>
              </div>
              <span className="text-gray-600 text-sm">
                {business.reviewCount} {t('reviews')}
              </span>
              <span className="text-gray-400">|</span>
              <Badge variant="outline" className="text-sm">
                {business.category}
              </Badge>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {business.featured && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                  <Star className="h-3 w-3 mr-1 fill-white" />
                  Featured
                </Badge>
              )}
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Shield className="h-3 w-3 mr-1" />
                {t('verifiedBusiness')}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 2. ADDITIONAL GALLERY IMAGES (if available) ==================== */}
      {business.images && business.images.length > 1 && (
        <>
          <div className="mb-4">
            <div className="relative rounded-xl overflow-hidden bg-gray-100">
              <img
                src={galleryImages[mainImage]}
                alt={`${business.name} - Image ${mainImage + 1}`}
                className="w-full h-64 md:h-96 object-cover transition-all duration-300"
              />
              <Badge className="absolute top-3 right-3 bg-black/60 text-white text-xs">
                {mainImage + 1} / {galleryImages.length}
              </Badge>
            </div>
          </div>

          {/* ==================== 3. IMAGE GALLERY (THUMBNAILS) ==================== */}
          <div className="mb-6 overflow-x-auto">
            <div className="flex gap-2 pb-2">
              {galleryImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setMainImage(index)}
                  className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${mainImage === index
                    ? 'border-blue-600 ring-2 ring-blue-300'
                    : 'border-gray-200 hover:border-gray-400'
                    }`}
                >
                  <img
                    src={img}
                    alt={`Gallery ${index + 1}`}
                    className="w-20 h-16 md:w-24 md:h-20 object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ==================== 4. ACTION BUTTON ROW ==================== */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Call Button */}
          {business.phone && (
            <a
              href={`tel:${formatPhoneLink(business.phone)}`}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors border border-green-200"
            >
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <span className="font-semibold text-green-700 text-sm">{t('callNow')}</span>
            </a>
          )}

          {/* WhatsApp Button */}
          {business.phone && (
            <a
              href={formatWhatsAppLink(business.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-2 p-4 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors border border-emerald-200"
            >
              <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <span className="font-semibold text-emerald-700 text-sm">{t('whatsapp')}</span>
            </a>
          )}

          {/* Website Button */}
          {business.website && (
            <a
              href={formatWebsiteUrl(business.website)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <span className="font-semibold text-blue-700 text-sm">Website</span>
            </a>
          )}

          {/* Directions Button */}
          {business.address && (
            <a
              href={formatMapsLink(business.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-2 p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors border border-orange-200"
            >
              <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                <Navigation className="h-6 w-6 text-white" />
              </div>
              <span className="font-semibold text-orange-700 text-sm">{t('directions')}</span>
            </a>
          )}
        </div>
      </div>

      {/* ==================== 5. BUSINESS DETAILS SECTION ==================== */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* About Business */}
        <Card>
          <CardContent className="p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
              {t('aboutBusiness')}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {business.description || 'No description available.'}
            </p>
          </CardContent>
        </Card>

        {/* Contact Details */}
        <Card>
          <CardContent className="p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-1 h-5 bg-green-600 rounded-full"></div>
              {t('contactDetails')}
            </h2>
            <div className="space-y-4">
              {/* Address */}
              {business.address && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                    <MapPin className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-0.5">{t('address')}</p>
                    <p className="text-gray-800">{business.address}</p>
                    {business.area && (
                      <p className="text-sm text-blue-600">{business.area}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Phone */}
              {business.phone && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                    <Phone className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-0.5">{t('phone')}</p>
                    <a
                      href={`tel:${formatPhoneLink(business.phone)}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {business.phone}
                    </a>
                  </div>
                </div>
              )}

              {/* Website */}
              {business.website && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                    <Globe className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-0.5">Website</p>
                    <a
                      href={formatWebsiteUrl(business.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {business.website}
                    </a>
                  </div>
                </div>
              )}

              {/* Working Hours (Static/Sample) */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                  <Clock className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-0.5">{t('workingHours')}</p>
                  <p className="text-gray-800">Mon - Sat: 9:00 AM - 9:00 PM</p>
                  <p className="text-gray-800">Sunday: 10:00 AM - 6:00 PM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ==================== 6. REVIEWS SECTION (UI ONLY) ==================== */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="w-1 h-5 bg-yellow-500 rounded-full"></div>
              {t('customerReviews')}
            </h2>

            {/* Overall Rating Box */}
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">{business.rating}</div>
                <div className="flex items-center gap-0.5 justify-center mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${star <= Math.round(business.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-200'
                        }`}
                    />
                  ))}
                </div>
              </div>
              <div className="border-l border-gray-300 pl-4">
                <p className="text-2xl font-bold text-gray-900">{business.reviewCount}</p>
                <p className="text-sm text-gray-500">{t('totalReviews')}</p>
              </div>
            </div>
          </div>

          {/* Review List */}
          <div className="space-y-4">
            {sampleReviews.map((review) => (
              <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{review.name}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3.5 w-3.5 ${star <= review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'fill-gray-200 text-gray-200'
                              }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">{review.date}</span>
                    </div>
                    <p className="text-gray-700 text-sm">{review.comment}</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>

          {/* View All Reviews Link (UI only) */}
          <div className="text-center mt-6">
            <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
              {t('viewAllReviews')} ({business.reviewCount})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ==================== FLOATING ACTION BAR (MOBILE) ==================== */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-3 md:hidden z-50">
        <div className="flex gap-2 max-w-lg mx-auto">
          {business.phone && (
            <a
              href={`tel:${formatPhoneLink(business.phone)}`}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-semibold"
            >
              <Phone className="h-5 w-5" />
              Call
            </a>
          )}
          {business.phone && (
            <a
              href={formatWhatsAppLink(business.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-semibold"
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Spacer for mobile floating bar */}
      <div className="h-20 md:hidden"></div>
    </div>
  )
}

export default BusinessDetailPage
