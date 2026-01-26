'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin, Phone, Globe, Star, Tag, TrendingUp } from 'lucide-react'

const DailyDealsPage = () => {
  const [deals, setDeals] = useState([
    {
      id: '1',
      title: '50% Off on All Italian Cuisine',
      business: 'Bella Italia Restaurant',
      category: 'Restaurant',
      originalPrice: 2000,
      discountPrice: 1000,
      discount: 50,
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600',
      location: 'Koregaon Park, Pune',
      phone: '+91 98765 43210',
      validUntil: new Date(Date.now() + 12 * 3600000).toISOString(),
      description: 'Enjoy authentic Italian dishes with 50% discount. Valid for dine-in only.'
    },
    {
      id: '2',
      title: 'Buy 2 Get 1 Free - Premium Laptop Bags',
      business: 'TechStyle Store',
      category: 'Electronics',
      originalPrice: 3000,
      discountPrice: 2000,
      discount: 33,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600',
      location: 'FC Road, Pune',
      phone: '+91 98765 43211',
      validUntil: new Date(Date.now() + 8 * 3600000).toISOString(),
      description: 'Premium quality laptop bags. Limited stock!'
    },
    {
      id: '3',
      title: 'Flat 40% Off on Spa Services',
      business: 'Serenity Spa & Wellness',
      category: 'Wellness',
      originalPrice: 5000,
      discountPrice: 3000,
      discount: 40,
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600',
      location: 'Viman Nagar, Pune',
      phone: '+91 98765 43212',
      validUntil: new Date(Date.now() + 15 * 3600000).toISOString(),
      description: 'Relaxing spa treatments and therapies. Book your slot now!'
    },
    {
      id: '4',
      title: 'Free Gym Membership for 1 Month',
      business: 'FitZone Gym',
      category: 'Fitness',
      originalPrice: 2500,
      discountPrice: 0,
      discount: 100,
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600',
      location: 'Hinjewadi, Pune',
      phone: '+91 98765 43213',
      validUntil: new Date(Date.now() + 18 * 3600000).toISOString(),
      description: 'Sign up today and get 1 month free! Limited to first 50 members.'
    },
    {
      id: '5',
      title: '30% Off on Home Cleaning Services',
      business: 'CleanPro Services',
      category: 'Services',
      originalPrice: 1500,
      discountPrice: 1050,
      discount: 30,
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600',
      location: 'Baner, Pune',
      phone: '+91 98765 43214',
      validUntil: new Date(Date.now() + 10 * 3600000).toISOString(),
      description: 'Professional home cleaning. Eco-friendly products used.'
    },
    {
      id: '6',
      title: 'Flat ₹500 Off on First Purchase',
      business: 'FreshMart Grocery',
      category: 'Grocery',
      originalPrice: 2000,
      discountPrice: 1500,
      discount: 25,
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600',
      location: 'Wakad, Pune',
      phone: '+91 98765 43215',
      validUntil: new Date(Date.now() + 20 * 3600000).toISOString(),
      description: 'Fresh groceries delivered to your doorstep. Minimum order ₹2000.'
    }
  ])

  const getTimeLeft = (validUntil) => {
    const now = new Date()
    const end = new Date(validUntil)
    const diff = end - now
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return { hours, minutes, isExpiring: hours < 6 }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg">
            <Tag className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Daily Deals</h1>
            <p className="text-muted-foreground">24-Hour Flash Sales & Offers</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg border-2 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-orange-600" />
                Limited Time Offers - Grab Them Fast!
              </h2>
              <p className="text-muted-foreground">
                All deals expire within 24 hours. Don't miss out!
              </p>
            </div>
            <Clock className="h-12 w-12 text-orange-600 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deals.map((deal) => {
          const timeLeft = getTimeLeft(deal.validUntil)
          return (
            <Card key={deal.id} className="overflow-hidden hover:shadow-2xl transition-all border-2 hover:border-orange-600">
              <div className="relative">
                <img
                  src={deal.image}
                  alt={deal.title}
                  className="w-full h-48 object-cover"
                />
                <Badge className="absolute top-3 left-3 bg-gradient-to-r from-orange-600 to-red-600 text-white text-lg px-3 py-1">
                  {deal.discount}% OFF
                </Badge>
                <Badge 
                  variant={timeLeft.isExpiring ? 'destructive' : 'default'}
                  className={`absolute top-3 right-3 ${timeLeft.isExpiring ? 'animate-pulse' : ''}`}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {timeLeft.hours}h {timeLeft.minutes}m left
                </Badge>
              </div>

              <CardContent className="p-5 space-y-4">
                <div>
                  <Badge variant="outline" className="mb-2">{deal.category}</Badge>
                  <h3 className="font-bold text-xl mb-2 line-clamp-2">
                    {deal.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">{deal.business}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {deal.description}
                  </p>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-bold text-orange-600">
                    ₹{deal.discountPrice}
                  </span>
                  <span className="text-lg text-muted-foreground line-through">
                    ₹{deal.originalPrice}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{deal.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{deal.phone}</span>
                  </div>
                </div>

                <Button className="w-full bg-gradient-to-r from-orange-600 to-red-600">
                  Grab This Deal
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

    </div>
  )
}

export default DailyDealsPage
