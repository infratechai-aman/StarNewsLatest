'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, MapPin, Phone, Globe, Star, Building2, Filter, Store, ChevronRight, Zap } from 'lucide-react'
import Image from 'next/image'
import { businesses } from '@/lib/api'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useLanguage } from '@/contexts/LanguageContext'

const BUSINESS_CATEGORIES = [
  'All Categories',
  'Restaurant',
  'Cafe',
  'Electronics',
  'Fashion',
  'Healthcare',
  'Education',
  'Fitness',
  'Beauty & Spa',
  'Real Estate',
  'Automotive',
  'Services'
]

const BusinessesPage = ({ setSelectedBusiness, setCurrentView }) => {
  const { t, language } = useLanguage()
  const [businessList, setBusinessList] = useState([])
  const [filteredBusinesses, setFilteredBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')

  // Promotion Form State
  const [promotionOpen, setPromotionOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [promotionData, setPromotionData] = useState({
    businessName: '', ownerName: '', phone: '', email: '', address: '', description: ''
  })

  const handlePromotionSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/business-promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promotionData)
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("Request Submitted!", {
          description: "We will contact you shortly to verify your business."
        })
        setPromotionOpen(false)
        setPromotionData({ businessName: '', ownerName: '', phone: '', email: '', address: '', description: '' })
      } else {
        toast.error("Submission Failed", {
          description: data.error || "Please try again later."
        })
      }
    } catch (error) {
      console.error('Promotion submit error:', error)
      toast.error("Error", {
        description: "Something went wrong. Please check your connection."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Mock businesses
  const mockBusinesses = [
    { id: '1', name: 'TechHub Solutions', category: 'Electronics', description: 'Leading electronics and gadgets store in Pune', address: '123 MG Road, Pune', area: 'MG Road', phone: '+91 98765 43210', website: 'www.techhub.com', logo: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=200', coverImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600', rating: 4.5, reviewCount: 156, featured: true },
    { id: '2', name: 'Bella Italia Restaurant', category: 'Restaurant', description: 'Authentic Italian cuisine in the heart of Pune', address: '45 Koregaon Park, Pune', area: 'Koregaon Park', phone: '+91 98765 43211', website: 'www.bellaitalia.com', logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200', coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600', rating: 4.7, reviewCount: 234, featured: true },
    { id: '3', name: 'FitZone Gym', category: 'Fitness', description: 'Modern fitness center with expert trainers', address: '78 Hinjewadi Phase 1, Pune', area: 'Hinjewadi', phone: '+91 98765 43212', website: 'www.fitzone.com', logo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200', coverImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600', rating: 4.6, reviewCount: 189, featured: false },
    { id: '4', name: 'StyleHub Fashion', category: 'Fashion', description: 'Trendy fashion boutique for all ages', address: '90 FC Road, Pune', area: 'FC Road', phone: '+91 98765 43213', website: 'www.stylehub.com', logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200', coverImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600', rating: 4.4, reviewCount: 145, featured: false },
    { id: '5', name: 'Café Aroma', category: 'Cafe', description: 'Cozy café with amazing coffee and snacks', address: '56 Baner Road, Pune', area: 'Baner', phone: '+91 98765 43214', website: 'www.cafearoma.com', logo: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=200', coverImage: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=600', rating: 4.8, reviewCount: 267, featured: true },
    { id: '6', name: 'HealthFirst Clinic', category: 'Healthcare', description: 'Multi-specialty healthcare clinic', address: '34 Viman Nagar, Pune', area: 'Viman Nagar', phone: '+91 98765 43215', website: 'www.healthfirst.com', logo: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200', coverImage: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600', rating: 4.9, reviewCount: 312, featured: false },
    { id: '7', name: 'Spice Garden Restaurant', category: 'Restaurant', description: 'Authentic Indian and Maharashtrian cuisine', address: '25 Shivajinagar, Pune', area: 'Shivajinagar', phone: '+91 98765 43216', website: 'www.spicegarden.com', logo: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=200', coverImage: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600', rating: 4.6, reviewCount: 201, featured: false },
    { id: '8', name: 'AutoCare Service Center', category: 'Automotive', description: 'Complete car servicing and repair solutions', address: '89 Pimpri, Pune', area: 'Pimpri', phone: '+91 98765 43217', website: 'www.autocare.com', logo: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=200', coverImage: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600', rating: 4.3, reviewCount: 178, featured: false },
    { id: '9', name: 'BookWorm Library & Cafe', category: 'Education', description: 'Library, study space, and coffee shop combined', address: '12 Camp Area, Pune', area: 'Camp', phone: '+91 98765 43218', website: 'www.bookworm.com', logo: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=200', coverImage: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600', rating: 4.7, reviewCount: 156, featured: true },
    { id: '10', name: 'GreenLeaf Properties', category: 'Real Estate', description: 'Premium residential and commercial properties', address: '45 Aundh, Pune', area: 'Aundh', phone: '+91 98765 43219', website: 'www.greenleaf.com', logo: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200', coverImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600', rating: 4.5, reviewCount: 134, featured: false },
    { id: '11', name: 'Serenity Spa & Wellness', category: 'Beauty & Spa', description: 'Luxury spa treatments and wellness therapies', address: '67 Wakad, Pune', area: 'Wakad', phone: '+91 98765 43220', website: 'www.serenityspa.com', logo: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200', coverImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600', rating: 4.8, reviewCount: 245, featured: true },
    { id: '12', name: 'The Coffee House', category: 'Cafe', description: 'Artisan coffee and fresh pastries', address: '23 Deccan, Pune', area: 'Deccan', phone: '+91 98765 43221', website: 'www.coffeehouse.com', logo: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200', coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600', rating: 4.6, reviewCount: 189, featured: false },
    { id: '13', name: 'MegaPhone Electronics', category: 'Electronics', description: 'Latest smartphones, laptops and accessories', address: '78 Kothrud, Pune', area: 'Kothrud', phone: '+91 98765 43222', website: 'www.megaphone.com', logo: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=200', coverImage: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600', rating: 4.4, reviewCount: 167, featured: false },
    { id: '14', name: 'Yoga Bliss Studio', category: 'Fitness', description: 'Traditional yoga and meditation center', address: '34 Karve Nagar, Pune', area: 'Karve Nagar', phone: '+91 98765 43223', website: 'www.yogabliss.com', logo: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200', coverImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600', rating: 4.9, reviewCount: 298, featured: true },
    { id: '15', name: 'Fashion Runway', category: 'Fashion', description: 'Designer wear and ethnic collections', address: '56 Phoenix Market City, Pune', area: 'Viman Nagar', phone: '+91 98765 43224', website: 'www.fashionrunway.com', logo: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200', coverImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600', rating: 4.5, reviewCount: 178, featured: false }
  ]

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const response = await businesses.getAll({})
        // API returns array directly
        if (Array.isArray(response)) {
          setBusinessList(response)
          setFilteredBusinesses(response)
        } else if (response.businesses && Array.isArray(response.businesses)) {
          // Handle object format if legacy
          setBusinessList(response.businesses)
          setFilteredBusinesses(response.businesses)
        } else {
          // Fallback only if strictly empty
          setBusinessList([])
          setFilteredBusinesses([])
        }
      } catch (error) {
        console.error('Failed to load businesses from API:', error)
        // Fallback to mock data on error
        setBusinessList(mockBusinesses)
        setFilteredBusinesses(mockBusinesses)
      } finally {
        setLoading(false)
      }
    }
    fetchBusinesses()
  }, [])

  useEffect(() => {
    if (businessList.length > 0) {
      filterBusinesses()
    }
  }, [searchTerm, selectedCategory, businessList])

  const filterBusinesses = () => {
    let filtered = businessList

    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(b => b.category === selectedCategory)
    }

    if (searchTerm) {
      filtered = filtered.filter(b =>
        (b.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.area || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredBusinesses(filtered)
  }

  if (loading) {
    return <div className="text-center py-12">Loading businesses...</div>
  }

  return (
    <div className="space-y-6">
      <div className="mag-section-header flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-blue-600 rounded-[28px] flex items-center justify-center shadow-xl shadow-blue-100">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-5xl font-heading font-black tracking-tighter italic">{t('businessDirectory') || 'Business Directory'}</h1>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">{t('businessDirectoryDesc') || 'Discover elite local enterprises'}</p>
          </div>
        </div>

        <Dialog open={promotionOpen} onOpenChange={setPromotionOpen}>
          <DialogTrigger asChild>
            <Button className="h-14 rounded-full px-10 bg-blue-600 hover:bg-black text-white font-black transition-all shadow-xl hover:-translate-y-1">
              <Store className="mr-3 h-5 w-5" /> {t('promoteYourBusiness') || 'Post your Ad'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] p-8 rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold text-gray-900 mb-2">{t('promoteYourBusiness') || 'Promote Your Business'}</DialogTitle>
              <DialogDescription className="text-gray-600 text-base">
                {t('promotionFormDescription') || 'Fill out the form below and our team will contact you to help promote your business.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePromotionSubmit} className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="businessName" className="text-sm font-medium text-gray-700">{t('businessName') || 'Business Name'}</Label>
                <Input
                  id="businessName"
                  placeholder={t('businessNamePlaceholder') || "e.g., My Awesome Restaurant"}
                  value={promotionData.businessName}
                  onChange={(e) => setPromotionData({ ...promotionData, businessName: e.target.value })}
                  required
                  className="h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ownerName" className="text-sm font-medium text-gray-700">{t('ownerName') || 'Your Name'}</Label>
                <Input
                  id="ownerName"
                  placeholder={t('ownerNamePlaceholder') || "e.g., John Doe"}
                  value={promotionData.ownerName}
                  onChange={(e) => setPromotionData({ ...promotionData, ownerName: e.target.value })}
                  required
                  className="h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">{t('phone') || 'Phone'}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={t('phonePlaceholder') || "+91 98765 43210"}
                    value={promotionData.phone}
                    onChange={(e) => setPromotionData({ ...promotionData, phone: e.target.value })}
                    required
                    className="h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">{t('email') || 'Email'}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('emailPlaceholder') || "you@example.com"}
                    value={promotionData.email}
                    onChange={(e) => setPromotionData({ ...promotionData, email: e.target.value })}
                    required
                    className="h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address" className="text-sm font-medium text-gray-700">{t('address') || 'Business Address'}</Label>
                <Input
                  id="address"
                  placeholder={t('addressPlaceholder') || "123 Main St, Pune"}
                  value={promotionData.address}
                  onChange={(e) => setPromotionData({ ...promotionData, address: e.target.value })}
                  required
                  className="h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">{t('description') || 'Description'}</Label>
                <Textarea
                  id="description"
                  placeholder={t('descriptionPlaceholder') || "Tell us more about your business..."}
                  value={promotionData.description}
                  onChange={(e) => setPromotionData({ ...promotionData, description: e.target.value })}
                  rows={4}
                  className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg transition-all">
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <Zap className="animate-spin mr-2 h-5 w-5" /> {t('submitting') || 'Submitting...'}
                    </span>
                  ) : (
                    t('submitRequest') || 'Submit Request'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter - Magazine Style */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
        <div className="lg:col-span-3 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder={t('searchBusinesses') || "Search elite firms, services, or locations..."}
            className="h-16 pl-16 rounded-[24px] bg-white border-gray-100 shadow-sm font-bold text-lg focus:ring-4 focus:ring-blue-100 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="h-16 rounded-[24px] bg-white border-gray-100 shadow-sm font-black px-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-[24px] border-none shadow-2xl">
            {BUSINESS_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat} className="font-bold py-3">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredBusinesses.map((business) => (
          <div
            key={business.id}
            className="premium-card rounded-3xl overflow-hidden cursor-pointer group shadow-lg border border-gray-100 flex flex-col bg-white transition-all duration-500 hover:-translate-y-2 h-full"
            onClick={() => {
              setSelectedBusiness(business)
              setCurrentView('business-detail')
            }}
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-gray-50 border-b border-gray-50">
              <Image
                src={business.cover_image || business.coverImage || business.image || business.logo || business.images?.[0] || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop'}
                alt={business.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-[2000ms]"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {business.featured && (
                <Badge className="absolute top-6 left-6 bg-blue-600 text-white border-none px-4 py-1 font-black uppercase text-[10px] tracking-widest shadow-xl">
                  {t('featured') || 'PREMIUM'}
                </Badge>
              )}
              <div className="absolute bottom-6 right-6 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-[10px] font-black text-gray-900">{business.rating}</span>
                <span className="w-1 h-1 rounded-full bg-gray-200" />
                <span className="text-[10px] font-bold text-gray-400">{business.reviewCount}</span>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-gray-100 text-blue-600 border-none font-black text-[10px] tracking-widest px-4 py-1">
                  {business.category}
                </Badge>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> {business.area || 'City Area'}
                </div>
              </div>

              <h3 className="font-heading font-black text-2xl mb-4 leading-tight group-hover:text-blue-600 transition-colors tracking-tighter italic">
                {business.name}
              </h3>

              <p className="text-gray-500 text-sm line-clamp-2 mb-6 flex-1 leading-relaxed">
                {business.description || 'Exclusive local partner of StarNews India...'}
              </p>

              <div className="pt-6 border-t border-gray-50 mt-auto flex items-center justify-between">
                <a
                  href={`tel:${business.phone}`}
                  className="flex items-center gap-3 text-blue-600 font-black text-xs group-hover:gap-4 transition-all"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="w-4 h-4" /> {business.phone}
                </a>
                <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-blue-600 group-hover:translate-x-2 transition-all" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBusinesses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No businesses found matching your criteria</p>
          </CardContent>
        </Card>
      )}

    </div>
  )
}

export default BusinessesPage
