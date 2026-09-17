'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, MapPin, Phone, Globe, Star, Building2, Filter, Store, ChevronRight, Zap, LayoutGrid, Utensils, HeartPulse, GraduationCap, Home, Car, Laptop, Scissors, Plane, Scale, Hammer, MoreHorizontal } from 'lucide-react'
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
    businessName: '', ownerName: '', category: 'Services', phone: '', whatsapp: '', email: '', address: '', description: ''
  })

  const handlePromotionSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promotionData)
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("Business Submitted!", {
          description: "Your listing has been sent to the Admin queue for approval."
        })
        setPromotionOpen(false)
        setPromotionData({ businessName: '', ownerName: '', category: 'Services', phone: '', whatsapp: '', email: '', address: '', description: '' })
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
        if (Array.isArray(response) && response.length > 0) {
          setBusinessList(response)
          setFilteredBusinesses(response)
        } else if (response?.businesses && Array.isArray(response.businesses) && response.businesses.length > 0) {
          setBusinessList(response.businesses)
          setFilteredBusinesses(response.businesses)
        } else {
          // Fallback to mock businesses so page has rich content
          setBusinessList(mockBusinesses)
          setFilteredBusinesses(mockBusinesses)
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
    <div className="min-h-screen bg-white">

      {/* ─── HERO BANNER ─── */}
      <div className="relative w-full overflow-hidden h-[160px] md:h-[200px]">
        <Image src="/business_dir_banner_1789519372349.jpg" alt="Business Directory" fill className="absolute inset-0 object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />
        <div className="relative z-10 w-full px-4 md:px-12 flex flex-col justify-center h-full">
          <p className="text-gray-400 text-[10px] md:text-xs font-black uppercase tracking-widest mb-1 md:mb-2">BUSINESS DIRECTORY</p>
          <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-black leading-tight mb-2">
            Discover Local <span className="text-red-500">Businesses</span>
          </h1>
          <p className="hidden sm:block text-gray-300 text-xs md:text-sm mb-3 md:mb-5 max-w-lg">Find trusted businesses, services and professionals across Pune and beyond.</p>
          <div className="hidden md:flex flex-wrap gap-6">
            {[
              { icon: '🏢', value: '5,000+', label: 'Listed Businesses' },
              { icon: '📂', value: '100+', label: 'Categories' },
              { icon: '✅', value: 'Verified', label: 'Listings Trusted & Authentic' },
              { icon: '📈', value: 'Local Growth', label: 'Stronger Communities' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="text-xl">{s.icon}</span>
                <div>
                  <p className="text-white text-sm font-black">{s.value}</p>
                  <p className="text-gray-400 text-[10px]">{s.label}</p>
                </div>
              </div>
            ))}
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
                placeholder="Search for business, service or keyword..."
                className="h-11 pl-10 rounded-lg border-gray-200 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>Pune, Maharashtra</span>
            </div>
            <Button className="h-11 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg">
              Search →
            </Button>
          </div>
        </div>
      </div>

      {/* ─── CATEGORY TABS ─── */}
      <div className="border-b border-gray-100 bg-white shadow-sm pt-5 pb-5">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {[
              { icon: <LayoutGrid className="w-5 h-5 text-indigo-500" />, label: 'All Categories', color: 'bg-indigo-50' },
              { icon: <Utensils className="w-5 h-5 text-orange-500" />, label: 'Restaurants & Cafes', color: 'bg-orange-50' },
              { icon: <HeartPulse className="w-5 h-5 text-rose-500" />, label: 'Healthcare', color: 'bg-rose-50' },
              { icon: <GraduationCap className="w-5 h-5 text-violet-500" />, label: 'Education', color: 'bg-violet-50' },
              { icon: <Home className="w-5 h-5 text-blue-500" />, label: 'Real Estate', color: 'bg-blue-50' },
              { icon: <Car className="w-5 h-5 text-emerald-500" />, label: 'Automotive', color: 'bg-emerald-50' },
              { icon: <Laptop className="w-5 h-5 text-cyan-500" />, label: 'Electronics', color: 'bg-cyan-50' },
              { icon: <Scissors className="w-5 h-5 text-pink-500" />, label: 'Beauty & Wellness', color: 'bg-pink-50' },
              { icon: <Plane className="w-5 h-5 text-sky-500" />, label: 'Travel & Tourism', color: 'bg-sky-50' },
              { icon: <Scale className="w-5 h-5 text-amber-500" />, label: 'Professional Services', color: 'bg-amber-50' },
              { icon: <Hammer className="w-5 h-5 text-teal-500" />, label: 'Home Services', color: 'bg-teal-50' },
              { icon: <MoreHorizontal className="w-5 h-5 text-gray-500" />, label: 'More', color: 'bg-gray-100' },
            ].map((cat, i) => {
              const isActive = (i === 0 && selectedCategory === 'All Categories') || (cat.label === selectedCategory)
              return (
                <button
                  key={cat.label}
                  onClick={() => setSelectedCategory(i === 0 ? 'All Categories' : cat.label)}
                  className={`shrink-0 flex flex-col items-center justify-center gap-2 min-w-[105px] h-[90px] rounded-[18px] border transition-all duration-300 ${
                    isActive ? 'border-red-500 bg-red-50/50 shadow-sm text-red-600' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md hover:-translate-y-1 text-gray-700'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-white shadow-sm' : cat.color}`}>
                    {isActive ? <LayoutGrid className="w-5 h-5 text-red-500" /> : cat.icon}
                  </div>
                  <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'text-red-600' : 'text-gray-600'} text-center px-1 leading-tight`}>{cat.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── MAIN LAYOUT ─── */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] gap-8">

          {/* LEFT: Filters */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900">Filters</h3>
              <button className="text-red-600 text-xs font-bold">Clear All</button>
            </div>

            {/* Location */}
            <div>
              <p className="text-xs font-black text-gray-700 mb-2 flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</p>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white">
                <option>Pune, Maharashtra</option>
                <option>Mumbai, Maharashtra</option>
                <option>Nashik, Maharashtra</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <p className="text-xs font-black text-gray-700 mb-2">Category</p>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                {BUSINESS_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Rating */}
            <div>
              <p className="text-xs font-black text-gray-700 mb-2 flex items-center gap-1"><Star className="w-3 h-3" /> Rating</p>
              {['4.5 & above', '4.0 & above', '3.0 & above', 'Any rating'].map(r => (
                <label key={r} className="flex items-center gap-2 text-xs text-gray-600 py-1 cursor-pointer">
                  <input type="radio" name="rating" className="accent-red-600" /> {r}
                </label>
              ))}
            </div>

            {/* Business Type */}
            <div>
              <p className="text-xs font-black text-gray-700 mb-2">Business Type</p>
              {['Verified Business', 'Open Now', 'Offers & Deals', 'Home Delivery', 'Online Booking'].map(bt => (
                <label key={bt} className="flex items-center gap-2 text-xs text-gray-600 py-1 cursor-pointer">
                  <input type="checkbox" className="accent-red-600" /> {bt}
                </label>
              ))}
            </div>

            <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm">Apply Filters</Button>
          </div>

          {/* CENTER: Results Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">Showing 1-12 of {filteredBusinesses.length} businesses</p>
              <div className="flex items-center gap-2">
                <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700">
                  <option>Most Relevant</option>
                  <option>Highest Rated</option>
                  <option>Newest First</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBusinesses.map((business) => (
                <div
                  key={business.id}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden cursor-pointer group hover:shadow-md transition-all duration-300"
                  onClick={() => { setSelectedBusiness(business); setCurrentView('business-detail') }}
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                    <img
                      src={business.cover_image || business.coverImage || business.image || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=250&fit=crop'}
                      alt={business.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=250&fit=crop' }}
                    />
                    {business.isOpen !== false && (
                      <span className="absolute top-2 left-2 text-[9px] font-black bg-green-500 text-white px-2 py-0.5 rounded">Open Now</span>
                    )}
                    {business.verified && (
                      <span className="absolute top-2 left-2 text-[9px] font-black bg-blue-600 text-white px-2 py-0.5 rounded">✓ Verified</span>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between mb-1">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-black text-sm text-gray-900 leading-tight group-hover:text-red-600 transition-colors line-clamp-1">{business.name}</h3>
                        <p className="text-[10px] text-red-500 font-bold mt-0.5">{business.category}</p>
                      </div>
                      {business.logo && (
                        <div className="w-9 h-9 rounded-lg border border-gray-100 overflow-hidden shrink-0 ml-2 bg-white">
                          <img src={business.logo} alt="" className="w-full h-full object-contain" onError={e => e.target.style.display='none'} />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                      <div className="flex">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= Math.round(business.rating || 4) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-gray-700">{business.rating || '4.5'}</span>
                      <span className="text-[10px] text-gray-400">({business.reviewCount || '320'} reviews)</span>
                    </div>
                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="line-clamp-1">{business.area || business.address || 'Pune, Maharashtra'}</span>
                    </p>
                    {business.description && (
                      <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{business.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredBusinesses.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-400 font-bold">No businesses found matching your criteria</p>
              </div>
            )}
          </div>

          {/* RIGHT: Sidebar */}
          <div className="space-y-4">
            {/* List Your Business CTA */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mb-3">
                <Store className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-black text-sm text-gray-900 mb-1">List Your Business</h3>
              <p className="text-[11px] text-gray-500 mb-3">Reach thousands of potential customers across India.</p>
              <ul className="space-y-1 mb-4">
                {['Get discovered locally','Boost your brand visibility','Easy and quick listing','Trusted by the StarNews community'].map(p => (
                  <li key={p} className="flex items-center gap-2 text-[11px] text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />{p}
                  </li>
                ))}
              </ul>
              <Dialog open={promotionOpen} onOpenChange={setPromotionOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg">+ Add Your Business</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] p-8 rounded-2xl shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">Promote Your Business</DialogTitle>
                    <DialogDescription className="text-gray-600">Fill out the form and our team will contact you to help promote your business.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handlePromotionSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2"><Label htmlFor="businessName2">Business Name</Label><Input id="businessName2" placeholder="e.g., My Awesome Restaurant" value={promotionData.businessName} onChange={e => setPromotionData({...promotionData, businessName: e.target.value})} required className="h-11 rounded-lg" /></div>
                    <div className="grid gap-2"><Label htmlFor="ownerName2">Your Name</Label><Input id="ownerName2" placeholder="e.g., John Doe" value={promotionData.ownerName} onChange={e => setPromotionData({...promotionData, ownerName: e.target.value})} required className="h-11 rounded-lg" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2"><Label htmlFor="phone2">Phone</Label><Input id="phone2" type="tel" placeholder="+91 98765 43210" value={promotionData.phone} onChange={e => setPromotionData({...promotionData, phone: e.target.value})} required className="h-11 rounded-lg" /></div>
                      <div className="grid gap-2"><Label htmlFor="email2">Email</Label><Input id="email2" type="email" placeholder="you@example.com" value={promotionData.email} onChange={e => setPromotionData({...promotionData, email: e.target.value})} required className="h-11 rounded-lg" /></div>
                    </div>
                    <div className="grid gap-2"><Label htmlFor="address2">Business Address</Label><Input id="address2" placeholder="123 Main St, Pune" value={promotionData.address} onChange={e => setPromotionData({...promotionData, address: e.target.value})} required className="h-11 rounded-lg" /></div>
                    <div className="grid gap-2"><Label htmlFor="description2">Description</Label><Textarea id="description2" placeholder="Tell us more about your business..." value={promotionData.description} onChange={e => setPromotionData({...promotionData, description: e.target.value})} rows={3} className="rounded-lg" /></div>
                    <Button type="submit" disabled={isSubmitting} className="w-full h-11 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold">
                      {isSubmitting ? 'Submitting...' : 'Submit Request'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Good Businesses Banner */}
            <div className="bg-gray-900 rounded-xl p-4 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Good Businesses</p>
                <h3 className="text-white font-black text-base leading-tight mb-2">Build Great<br/>Cities</h3>
                <p className="text-gray-400 text-[11px] mb-3">Let your business be part of a stronger, informed India.</p>
                <button className="bg-white text-gray-900 text-xs font-black px-4 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">List Now →</button>
              </div>
            </div>

            {/* Businesses Near You */}
            <div className="border border-gray-200 rounded-xl p-4">
              <h3 className="font-black text-sm text-gray-900 mb-3">Businesses Near You</h3>
              <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center mb-3">
                <div className="text-center">
                  <MapPin className="w-6 h-6 text-red-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Map View</p>
                  <div className="flex gap-1 mt-2 justify-center">
                    {['🔴','🔴','🔴'].map((pin, i) => <span key={i}>{pin}</span>)}
                  </div>
                </div>
              </div>
              <button className="w-full border border-gray-200 text-gray-700 text-xs font-bold py-2 rounded-lg hover:bg-gray-50 transition-colors">View on Map →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BusinessesPage
