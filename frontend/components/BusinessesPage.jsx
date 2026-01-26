'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, MapPin, Phone, Globe, Star, Building2, Filter, Store } from 'lucide-react'
import { businesses } from '@/lib/api'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

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
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.area.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredBusinesses(filtered)
  }

  if (loading) {
    return <div className="text-center py-12">Loading businesses...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Business Directory</h1>
              <p className="text-muted-foreground">Discover local businesses in Pune</p>
            </div>
          </div>

          <Dialog open={promotionOpen} onOpenChange={setPromotionOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg">
                <Store className="mr-2 h-4 w-4" /> Promote Your Business
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Promote Your Business</DialogTitle>
                <DialogDescription>
                  Submit your business details. Our team will contact you for verification and listing.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handlePromotionSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={promotionData.businessName}
                    onChange={(e) => setPromotionData({ ...promotionData, businessName: e.target.value })}
                    placeholder="e.g. Star Electronics"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Owner Name *</Label>
                    <Input
                      id="ownerName"
                      value={promotionData.ownerName}
                      onChange={(e) => setPromotionData({ ...promotionData, ownerName: e.target.value })}
                      placeholder="Your Name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={promotionData.phone}
                      onChange={(e) => setPromotionData({ ...promotionData, phone: e.target.value })}
                      placeholder="9876543210"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={promotionData.email}
                    onChange={(e) => setPromotionData({ ...promotionData, email: e.target.value })}
                    placeholder="contact@business.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Business Address *</Label>
                  <Textarea
                    id="address"
                    value={promotionData.address}
                    onChange={(e) => setPromotionData({ ...promotionData, address: e.target.value })}
                    placeholder="Shop No, Building, Area, City"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Business Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={promotionData.description}
                    onChange={(e) => setPromotionData({ ...promotionData, description: e.target.value })}
                    placeholder="Briefly describe your services..."
                  />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setPromotionOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-blue-600">
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search businesses, services, or areas..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="md:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBusinesses.map((business) => (
          <Card key={business.id} className="overflow-hidden hover:shadow-2xl transition-all border-2 hover:border-blue-600 cursor-pointer">
            {/* Rectangle Image on Top */}
            <div className="relative">
              <img
                src={business.cover_image || business.coverImage || business.image || business.logo || business.images?.[0]}
                alt={business.name}
                className="w-full h-48 object-cover"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop'; }}
              />
              {business.featured && (
                <Badge className="absolute top-3 right-3 bg-gradient-to-r from-yellow-600 to-orange-600">
                  FEATURED
                </Badge>
              )}
            </div>

            {/* Content Below Image */}
            <CardContent className="p-5 space-y-3">
              {/* Title */}
              <div>
                <h3 className="font-bold text-lg mb-1">{business.name}</h3>
                <Badge variant="outline">{business.category}</Badge>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground line-clamp-2">
                {business.description}
              </p>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{business.rating}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({business.reviewCount} reviews)
                </span>
              </div>

              {/* Address & Phone */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{business.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{business.phone}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedBusiness(business)
                    setCurrentView('business-detail')
                  }}
                >
                  View Details
                </Button>
                <Button variant="outline" asChild>
                  <a href={`tel:${business.phone?.replace(/\s/g, '')}`}>
                    <Phone className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
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
