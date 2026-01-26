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

// Get images from classified - use actual images, deduplicate
const getClassifiedImages = (classified) => {
    const allImages = []

    // Add images from array first
    if (classified.images && Array.isArray(classified.images)) {
        allImages.push(...classified.images)
    }

    // Add single image only if not already in array
    if (classified.image && !allImages.includes(classified.image)) {
        allImages.unshift(classified.image)
    }

    // Remove duplicates and empty values
    const uniqueImages = [...new Set(allImages)].filter(img => img && img.trim() !== '')

    // Return unique images or placeholder
    return uniqueImages.length > 0
        ? uniqueImages
        : ['https://via.placeholder.com/400x300?text=No+Image']
}

const ClassifiedDetailPage = ({ classified, setCurrentView }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [isFavorite, setIsFavorite] = useState(false)

    if (!classified) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Classified ad not found</p>
                <Button onClick={() => setCurrentView('classifieds')} className="mt-4">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to Classifieds
                </Button>
            </div>
        )
    }

    const images = getClassifiedImages(classified)
    const convertedPrice = convertToINR(classified.price)

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

    // Format date (mock - in real app would use actual date)
    const postedDate = 'Posted 2 days ago'

    return (
        <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => setCurrentView('classifieds')}
                className="mb-3 hover:bg-gray-100"
            >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Classifieds
            </Button>

            <div className="grid lg:grid-cols-5 gap-4">
                {/* Left Column - Images & Details */}
                <div className="lg:col-span-3 space-y-3">

                    {/* ==================== IMAGE CAROUSEL (OLX/AMAZON STYLE) ==================== */}
                    <Card>
                        <CardContent className="p-0">
                            {/* Main Image with Navigation Arrows - COMPACT SIZE */}
                            <div className="relative bg-gray-100 rounded-t-lg">
                                <img
                                    src={images[currentImageIndex]}
                                    alt={classified.title}
                                    className="w-full h-[200px] md:h-[280px] object-contain"
                                />

                                {/* Image Counter Badge */}
                                <Badge className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5">
                                    {currentImageIndex + 1} / {images.length}
                                </Badge>

                                {/* Favorite & Share Buttons */}
                                <div className="absolute top-3 left-3 flex gap-2">
                                    <button
                                        onClick={() => setIsFavorite(!isFavorite)}
                                        className={`p-2 rounded-full ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-700'} shadow-lg transition-all hover:scale-110`}
                                    >
                                        <Heart className={`h-5 w-5 ${isFavorite ? 'fill-white' : ''}`} />
                                    </button>
                                    <button className="p-2 rounded-full bg-white/90 text-gray-700 shadow-lg hover:scale-110 transition-all">
                                        <Share2 className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Previous Button */}
                                {images.length > 1 && (
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all hover:scale-110"
                                    >
                                        <ChevronLeft className="h-6 w-6" />
                                    </button>
                                )}

                                {/* Next Button */}
                                {images.length > 1 && (
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all hover:scale-110"
                                    >
                                        <ChevronRight className="h-6 w-6" />
                                    </button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* ==================== ITEM INFORMATION (OLX STYLE) ==================== */}
                    <Card>
                        <CardContent className="p-5">
                            {/* Category & Condition */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {classified.category}
                                </Badge>
                                <Badge variant="outline" className="text-green-600 border-green-300">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Good Condition
                                </Badge>
                            </div>

                            {/* Title */}
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                                {classified.title}
                            </h1>

                            {/* Price - INR with conversion */}
                            {convertedPrice && (
                                <div className="mb-4">
                                    <p className="text-3xl font-bold text-green-600">
                                        {convertedPrice}
                                    </p>
                                    {classified.price?.includes('$') && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            (Converted from {classified.price} at 1 USD = ₹{USD_TO_INR_RATE})
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Location & Date */}
                            <div className="flex flex-wrap items-center gap-4 text-gray-600 text-sm">
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4" />
                                    <span>{classified.location}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    <span>{postedDate}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ==================== DESCRIPTION SECTION ==================== */}
                    <Card>
                        <CardContent className="p-5">
                            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                                Description
                            </h2>
                            <div className="text-gray-700 leading-relaxed space-y-3">
                                <p>{classified.description}</p>
                                <p className="text-gray-600">
                                    This item is available for immediate purchase. Contact the seller for more details,
                                    negotiation, or to arrange a viewing. All items are as described and in the
                                    condition mentioned above.
                                </p>
                                <p className="text-gray-600">
                                    <strong>Important:</strong> Please verify the item before making any payment.
                                    Meet in a safe public place for transactions.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Seller Contact */}
                <div className="lg:col-span-2">
                    <div className="sticky top-20 space-y-3">

                        {/* ==================== SELLER CONTACT SECTION ==================== */}
                        <Card className="border-2 border-orange-200">
                            <CardContent className="p-5">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <User className="h-5 w-5 text-orange-600" />
                                    Seller Information
                                </h2>

                                {/* Seller Profile */}
                                <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                                    <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
                                        <User className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{classified.postedBy}</p>
                                        <div className="flex items-center gap-1 text-sm text-green-600">
                                            <Shield className="h-3.5 w-3.5" />
                                            <span>Verified Seller</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="flex items-start gap-3 mb-4 pb-4 border-b">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <MapPin className="h-5 w-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Location</p>
                                        <p className="font-medium text-gray-800">{classified.location}</p>
                                    </div>
                                </div>

                                {/* Contact Buttons */}
                                <div className="space-y-3">
                                    {classified.phone ? (
                                        <>
                                            {/* Call Button */}
                                            <a
                                                href={`tel:${formatPhoneLink(classified.phone)}`}
                                                className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-semibold transition-colors"
                                            >
                                                <Phone className="h-5 w-5" />
                                                Call Seller
                                            </a>

                                            {/* WhatsApp Button */}
                                            <a
                                                href={formatWhatsAppLink(classified.phone)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-semibold transition-colors"
                                            >
                                                <MessageCircle className="h-5 w-5" />
                                                WhatsApp
                                            </a>

                                            {/* Phone Display */}
                                            <div className="text-center text-sm text-gray-600 py-2">
                                                <Phone className="h-4 w-4 inline mr-1" />
                                                {classified.phone}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-gray-500">Contact not available</p>
                                            <Button disabled className="w-full mt-2">
                                                <Phone className="h-4 w-4 mr-2" />
                                                Call Seller
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Safety Tips */}
                        <Card className="bg-yellow-50 border-yellow-200">
                            <CardContent className="p-4">
                                <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Safety Tips
                                </h3>
                                <ul className="text-sm text-yellow-700 space-y-1">
                                    <li>• Meet in a safe public place</li>
                                    <li>• Don't pay in advance</li>
                                    <li>• Inspect the item before buying</li>
                                    <li>• Verify seller identity</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* ==================== MOBILE FLOATING CONTACT BAR ==================== */}
            {classified.phone && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-3 lg:hidden z-50">
                    <div className="flex gap-2 max-w-lg mx-auto">
                        <a
                            href={`tel:${formatPhoneLink(classified.phone)}`}
                            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-semibold"
                        >
                            <Phone className="h-5 w-5" />
                            Call
                        </a>
                        <a
                            href={formatWhatsAppLink(classified.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-semibold"
                        >
                            <MessageCircle className="h-5 w-5" />
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
