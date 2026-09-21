'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    ChevronLeft,
    ChevronRight,
    Phone,
    MessageCircle,
    MapPin,
    Calendar,
    Tag,
    User,
    Shield,
    Heart,
    Share2,
    CheckCircle
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

// Fixed conversion rate (1 USD = 83 INR)
const USD_TO_INR_RATE = 83

// Category-based high quality fallback images matching ClassifiedsPage
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

// Robust extractor for classified images supporting all formats and field names
const getClassifiedImages = (classified) => {
    if (!classified) return [CATEGORY_FALLBACK_IMAGES['Other']]
    const allImages = []

    const addImageItem = (item) => {
        if (!item) return
        if (typeof item === 'string') {
            const trimmed = item.trim()
            if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return
            // Check if it's a JSON array string e.g. '["/api/file/..."]'
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                try {
                    const parsed = JSON.parse(trimmed)
                    if (Array.isArray(parsed)) {
                        parsed.forEach(addImageItem)
                        return
                    }
                } catch (e) {}
            }
            // Check if comma-separated list
            if (trimmed.includes(',') && !trimmed.startsWith('data:') && !trimmed.startsWith('http')) {
                trimmed.split(',').map(s => s.trim()).forEach(addImageItem)
                return
            }
            // Filter out placeholder strings like placehold.co "No Image"
            if (trimmed.includes('placehold.co') && trimmed.toLowerCase().includes('no+image')) return
            allImages.push(trimmed)
        } else if (typeof item === 'object') {
            const url = item.url || item.src || item.path || item.imageUrl || item.image
            if (url && typeof url === 'string') {
                addImageItem(url)
            }
        }
    }

    // Check images array or string
    if (Array.isArray(classified.images)) {
        classified.images.forEach(addImageItem)
    } else if (classified.images) {
        addImageItem(classified.images)
    }

    // Check single image fields and variations
    const singleFields = [
        classified.image,
        classified.imageUrl,
        classified.image_url,
        classified.coverImage,
        classified.cover_image,
        classified.mainImage,
        classified.thumbnailUrl,
        classified.thumbnail,
        classified.photo,
        classified.photos
    ]
    singleFields.forEach(f => {
        if (Array.isArray(f)) {
            f.forEach(addImageItem)
        } else {
            addImageItem(f)
        }
    })

    // Deduplicate
    const uniqueImages = [...new Set(allImages)].filter(Boolean)

    if (uniqueImages.length > 0) {
        return uniqueImages
    }

    // High quality category fallback image so we NEVER display an ugly broken placeholder
    const categoryFallback = CATEGORY_FALLBACK_IMAGES[classified.category] || CATEGORY_FALLBACK_IMAGES['Other']
    return [categoryFallback]
}

const ClassifiedDetailPage = ({ classified, setCurrentView }) => {
    const { t, language } = useLanguage()
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [isFavorite, setIsFavorite] = useState(false)
    const [imageErrors, setImageErrors] = useState({})

    if (!classified) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">{t('classifiedNotFound') || 'Classified ad not found'}</p>
                <Button onClick={() => setCurrentView('classifieds')} className="mt-4">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    {t('backToClassifieds') || 'Back to Classifieds'}
                </Button>
            </div>
        )
    }

    const images = getClassifiedImages(classified)
    const convertedPrice = convertToINR(classified.price)

    // Current displayed image with error fallback
    const fallbackImage = CATEGORY_FALLBACK_IMAGES[classified.category] || CATEGORY_FALLBACK_IMAGES['Other']
    const activeImageSrc = imageErrors[currentImageIndex] ? fallbackImage : (images[currentImageIndex] || fallbackImage)

    // Navigate to next image
    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }

    // Navigate to previous image
    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
    }

    // Helper to format phone for tel: link
    const formatPhoneLink = (phone) => phone?.replace(/\s/g, '') || ''

    // Helper to format WhatsApp link
    const formatWhatsAppLink = (phone) => {
        const cleaned = phone?.replace(/[^\d]/g, '') || ''
        return `https://wa.me/${cleaned}`
    }

    // Format date (or fallback)
    const postedDate = classified.createdAt
        ? new Date(classified.createdAt).toLocaleDateString(language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : (t('recentlyPosted') || 'Recently posted')

    const sellerDisplayName = classified.sellerName || classified.postedBy || classified.contactName || 'StarNews User'

    const getTranslatedCategory = (cat) => {
        if (!cat) return ''
        const key = cat.toLowerCase()
        return t(key) || cat
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => setCurrentView('classifieds')}
                className="mb-4 hover:bg-gray-100 -ml-2 text-gray-700 font-semibold"
            >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t('backToClassifieds') || 'Back to Classifieds'}
            </Button>

            <div className="grid lg:grid-cols-5 gap-6">
                {/* Left Column - Images & Details */}
                <div className="lg:col-span-3 space-y-4">

                    {/* ==================== IMAGE CAROUSEL (OLX/AMAZON STYLE) ==================== */}
                    <Card className="overflow-hidden border border-gray-200 shadow-sm rounded-2xl">
                        <CardContent className="p-0">
                            {/* Main Image Container with Navigation Arrows */}
                            <div className="relative bg-gray-950 group overflow-hidden">
                                {/* Blurred Background Effect */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 scale-125"
                                    style={{
                                        backgroundImage: `url(${activeImageSrc})`
                                    }}
                                />

                                {/* Main Image Container - Centered & Contained */}
                                <div className="relative h-[300px] md:h-[420px] flex items-center justify-center p-2">
                                    <img
                                        src={activeImageSrc}
                                        alt={classified.title}
                                        className="max-h-full max-w-full object-contain z-10 drop-shadow-md rounded"
                                        onError={() => {
                                            setImageErrors(prev => ({ ...prev, [currentImageIndex]: true }))
                                        }}
                                    />
                                </div>

                                {/* Image Counter Badge */}
                                <Badge className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white text-xs px-2.5 py-1 z-20 rounded-full font-bold">
                                    {currentImageIndex + 1} / {images.length}
                                </Badge>

                                {/* Favorite & Share Buttons */}
                                <div className="absolute top-3 left-3 flex gap-2 z-20">
                                    <button
                                        onClick={() => setIsFavorite(!isFavorite)}
                                        className={`p-2 rounded-full ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-700'} shadow-lg transition-all hover:scale-110 cursor-pointer`}
                                    >
                                        <Heart className={`h-5 w-5 ${isFavorite ? 'fill-white' : ''}`} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (navigator.share) {
                                                navigator.share({ title: classified.title, text: classified.description, url: window.location.href }).catch(() => {})
                                            } else {
                                                navigator.clipboard?.writeText(window.location.href)
                                            }
                                        }}
                                        className="p-2 rounded-full bg-white/90 text-gray-700 shadow-lg hover:scale-110 transition-all cursor-pointer"
                                    >
                                        <Share2 className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Previous Button */}
                                {images.length > 1 && (
                                    <button
                                        onClick={prevImage}
                                        aria-label="Previous image"
                                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2.5 rounded-full shadow-lg transition-all hover:scale-110 z-20 opacity-0 group-hover:opacity-100"
                                    >
                                        <ChevronLeft className="h-6 w-6" />
                                    </button>
                                )}

                                {/* Next Button */}
                                {images.length > 1 && (
                                    <button
                                        onClick={nextImage}
                                        aria-label="Next image"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2.5 rounded-full shadow-lg transition-all hover:scale-110 z-20 opacity-0 group-hover:opacity-100"
                                    >
                                        <ChevronRight className="h-6 w-6" />
                                    </button>
                                )}
                            </div>

                            {/* Gallery Thumbnails Strip */}
                            {images.length > 1 && (
                                <div className="flex gap-2 p-3 bg-gray-50/80 border-t border-gray-100 overflow-x-auto">
                                    {images.map((img, idx) => {
                                        const thumbSrc = imageErrors[idx] ? fallbackImage : img
                                        const isActive = currentImageIndex === idx
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentImageIndex(idx)}
                                                className={`relative h-16 w-20 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                                                    isActive
                                                        ? 'border-red-600 ring-2 ring-red-200 scale-105'
                                                        : 'border-gray-200 opacity-70 hover:opacity-100'
                                                }`}
                                            >
                                                <img
                                                    src={thumbSrc}
                                                    alt={`Thumbnail ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                    onError={() => setImageErrors(prev => ({ ...prev, [idx]: true }))}
                                                />
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ==================== ITEM INFORMATION ==================== */}
                    <Card className="border border-gray-200 shadow-sm rounded-2xl">
                        <CardContent className="p-5 md:p-6">
                            {/* Category & Condition */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                <Badge className="bg-red-50 text-red-700 border-red-200 font-bold">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {getTranslatedCategory(classified.category)}
                                </Badge>
                                <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 font-bold">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    {classified.condition ? (t(classified.condition.toLowerCase()) || classified.condition) : (t('goodCondition') || 'Good Condition')}
                                </Badge>
                            </div>

                            {/* Title */}
                            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 leading-snug">
                                {classified.title}
                            </h1>

                            {/* Price - INR with conversion */}
                            {convertedPrice && (
                                <div className="mb-4">
                                    <p className="text-3xl font-black text-green-600">
                                        {convertedPrice}
                                    </p>
                                    {classified.price?.includes('$') && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            ({t('convertedFrom') || 'Converted from'} {classified.price} at 1 USD = ₹{USD_TO_INR_RATE})
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Location & Date */}
                            <div className="flex flex-wrap items-center gap-4 text-gray-600 text-sm pt-2 border-t border-gray-100">
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4 text-red-500" />
                                    <span className="font-semibold">{classified.location}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span>{postedDate}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ==================== DESCRIPTION SECTION ==================== */}
                    <Card className="border border-gray-200 shadow-sm rounded-2xl">
                        <CardContent className="p-5 md:p-6">
                            <h2 className="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
                                <div className="w-1 h-5 bg-red-600 rounded-full"></div>
                                {t('description') || 'Description'}
                            </h2>
                            <div className="text-gray-700 leading-relaxed space-y-3 text-sm md:text-base">
                                <p className="whitespace-pre-line font-medium text-gray-800">{classified.description}</p>
                                <p className="text-gray-500 text-xs">
                                    {t('immediatePurchaseNotice') || 'This item is available for immediate purchase. Contact the seller for more details, negotiation, or to arrange a viewing. All items are as described and in the condition mentioned above.'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Seller Contact */}
                <div className="lg:col-span-2">
                    <div className="sticky top-20 space-y-4">

                        {/* ==================== SELLER CONTACT SECTION ==================== */}
                        <Card className="border-2 border-red-200 shadow-sm rounded-2xl overflow-hidden">
                            <CardContent className="p-5">
                                <h2 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
                                    <User className="h-5 w-5 text-red-600" />
                                    {t('sellerInfo') || 'Seller Information'}
                                </h2>

                                {/* Seller Profile */}
                                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                                    <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-orange-500 rounded-full flex items-center justify-center shadow-sm shrink-0">
                                        <User className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-gray-900 truncate">{sellerDisplayName}</p>
                                        <div className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                                            <Shield className="h-3.5 w-3.5" />
                                            <span>{t('verifiedSeller') || 'Verified Seller'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="flex items-start gap-3 mb-4 pb-4 border-b border-gray-100">
                                    <div className="p-2 bg-gray-100 rounded-lg shrink-0">
                                        <MapPin className="h-4 w-4 text-gray-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-gray-500">{t('location') || 'Location'}</p>
                                        <p className="font-semibold text-gray-800 text-sm truncate">{classified.location}</p>
                                    </div>
                                </div>

                                {/* Contact Buttons */}
                                <div className="space-y-2.5">
                                    {classified.phone ? (
                                        <>
                                            {/* Call Button */}
                                            <a
                                                href={`tel:${formatPhoneLink(classified.phone)}`}
                                                className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-sm transition-colors shadow-sm cursor-pointer"
                                            >
                                                <Phone className="h-4 w-4" />
                                                {t('callSeller') || 'Call Seller'}
                                            </a>

                                            {/* WhatsApp Button */}
                                            <a
                                                href={formatWhatsAppLink(classified.phone)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm transition-colors shadow-sm cursor-pointer"
                                            >
                                                <MessageCircle className="h-4 w-4" />
                                                WhatsApp
                                            </a>

                                            {/* Phone Display */}
                                            <div className="text-center text-xs text-gray-500 font-semibold py-1">
                                                <Phone className="h-3 w-3 inline mr-1 text-gray-400" />
                                                {classified.phone}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-3">
                                            <p className="text-xs text-gray-400">{t('contactNotAvailable') || 'Contact not available'}</p>
                                            <Button disabled className="w-full mt-2">
                                                <Phone className="h-4 w-4 mr-2" />
                                                {t('callSeller') || 'Call Seller'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Safety Tips */}
                        <Card className="bg-amber-50/70 border border-amber-200 rounded-2xl">
                            <CardContent className="p-4">
                                <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2 text-xs uppercase tracking-wide">
                                    <Shield className="h-4 w-4 text-amber-700" />
                                    {t('safetyTips') || 'Safety Tips'}
                                </h3>
                                <ul className="text-xs text-amber-800 space-y-1.5 font-medium">
                                    <li>• {t('meetInSafePlace') || 'Meet in a safe public place'}</li>
                                    <li>• {t('dontPayInAdvance') || "Don't pay in advance"}</li>
                                    <li>• {t('inspectItem') || 'Inspect the item before buying'}</li>
                                    <li>• {t('verifySeller') || 'Verify seller identity'}</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* ==================== MOBILE FLOATING CONTACT BAR ==================== */}
            {classified.phone && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl p-3 lg:hidden z-50">
                    <div className="flex gap-2 max-w-lg mx-auto">
                        <a
                            href={`tel:${formatPhoneLink(classified.phone)}`}
                            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-xl font-bold text-sm"
                        >
                            <Phone className="h-4 w-4" />
                            {t('callSeller') || 'Call'}
                        </a>
                        <a
                            href={formatWhatsAppLink(classified.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-sm"
                        >
                            <MessageCircle className="h-4 w-4" />
                            WhatsApp
                        </a>
                    </div>
                </div>
            )}

            {/* Spacer for mobile floating bar */}
            <div className="h-20 lg:hidden"></div>
        </div>
    )
}

export default ClassifiedDetailPage
