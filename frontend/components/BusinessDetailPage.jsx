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
  ChevronRight,
  CheckCircle,
  User
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

const BusinessDetailPage = ({ business, setCurrentView, user, toast }) => {
  const { t } = useLanguage()
  const [mainImage, setMainImage] = useState(0)

  // Use real images if available, otherwise fallback
  const galleryImages = business?.images?.length > 0
    ? business.images
    : (business?.image || business?.cover_image || business?.coverImage)
      ? [business.image || business.cover_image || business.coverImage]
      : ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800']

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

  // Calculate real rating if available (mock logic removed)
  const displayRating = business.rating || 0
  const displayReviews = business.reviewCount || 0

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

      {/* ==================== 1. HERO HEADER ==================== */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl mb-5 bg-gray-900">
        <div className="relative h-56 sm:h-64 md:h-80 w-full">
          <img
            src={galleryImages[0]}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover scale-105"
            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=600&fit=crop' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 md:p-8 flex items-end gap-4 md:gap-6">
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl overflow-hidden ring-4 ring-white/90 shadow-2xl bg-white shrink-0">
              <img
                src={business.logo || business.image || business.coverImage || galleryImages[0]}
                alt={business.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&h=300&fit=crop' }}
              />
            </div>
            <div className="min-w-0 flex-1 text-white">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {business.category && (
                  <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[11px] font-bold uppercase tracking-wider">
                    {business.category}
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-[11px] font-bold flex items-center gap-1">
                  <Shield className="h-3 w-3" /> {t('verifiedBusiness')}
                </span>
                {business.featured && (
                  <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-[11px] font-bold flex items-center gap-1">
                    <Star className="h-3 w-3 fill-white" /> Featured
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-tight drop-shadow-lg break-words">
                {business.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/85">
                {displayReviews > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded-md font-bold tabular-nums">
                      <Star className="h-3.5 w-3.5 fill-white" /> {displayRating}
                    </span>
                    <span className="tabular-nums">{displayReviews} {t('reviews')}</span>
                  </span>
                )}
                {(business.area || business.address) && (
                  <span className="flex items-center gap-1 min-w-0">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate max-w-[60vw] md:max-w-md">{business.area || business.address}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 2. GALLERY ==================== */}
      {galleryImages.length > 1 && (
        <>
          <div className="mb-4">
            <div className="relative rounded-xl overflow-hidden bg-gray-900 group">
              {/* Blurred Background */}
              <div
                className="absolute inset-0 bg-cover bg-center blur-2xl opacity-60"
                style={{
                  backgroundImage: `url(${galleryImages[mainImage]})`
                }}
              />

              {/* Main Image - Contained */}
              <div className="relative h-64 md:h-[500px] w-full flex items-center justify-center">
                <img
                  src={galleryImages[mainImage]}
                  alt={`${business.name} - Image ${mainImage + 1}`}
                  className="max-h-full max-w-full object-contain z-10 shadow-xl"
                />
              </div>

              {/* Image Counter Badge */}
              <Badge className="absolute top-3 right-3 bg-black/60 text-white text-xs z-20">
                {mainImage + 1} / {galleryImages.length}
              </Badge>

              {/* Navigation Buttons (Only if > 1 image) */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMainImage((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 z-20"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMainImage((prev) => (prev + 1) % galleryImages.length)
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 z-20"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </button>
                </>
              )}
            </div>
          </div>

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
      <div className="bg-white rounded-2xl shadow-sm border border-black/[0.06] p-4 mb-6">
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

      {/* ==================== 6. REVIEWS SECTION (CONDITIONAL) ==================== */}
      {business.reviews && business.reviews.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="w-1 h-5 bg-yellow-500 rounded-full"></div>
                {t('customerReviews')}
              </h2>

              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900">{displayRating}</div>
                  <div className="flex items-center gap-0.5 justify-center mt-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                </div>
                <div className="border-l border-gray-300 pl-4">
                  <p className="text-2xl font-bold text-gray-900">{displayReviews}</p>
                  <p className="text-sm text-gray-500">{t('totalReviews')}</p>
                </div>
              </div>
            </div>

            {/* Render Real Reviews Here */}
            <div className="space-y-4">
              {business.reviews.map(review => (
                <div key={review.id} className="border-b border-gray-100 pb-4">
                  {/* Review Item */}
                  <p>{review.comment}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
