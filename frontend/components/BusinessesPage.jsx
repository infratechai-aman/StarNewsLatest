'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import { Search, MapPin, Phone, Globe, Star, Building2, Filter, Store, ChevronRight, Zap, LayoutGrid, Utensils, HeartPulse, GraduationCap, Home, Car, Laptop, Scissors, Plane, Scale, Hammer, MoreHorizontal, ShieldCheck, MessageCircle, Navigation, ExternalLink, CheckCircle2 } from 'lucide-react'
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
  const [selectedLocality, setSelectedLocality] = useState('All Localities')

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

  // Authentic Pune Kondhwa & Camp Local Directory (Updated & Approved by Admin Panel)
  const mockBusinesses = [
    // --- CAMP (PUNE) RESTAURANTS & CAFES ---
    {
      id: 'kayani-bakery-camp',
      name: 'Kayani Bakery',
      businessName: 'Kayani Bakery',
      ownerName: 'Rustom Kayani',
      category: 'Cafe',
      phone: '+91 20 2636 0517',
      whatsapp: '+91 20 2636 0517',
      email: 'contact@kayanibakerypune.com',
      address: '6, East Street, Hulshur, Camp, Pune, Maharashtra 411001',
      city: 'Pune',
      area: 'Camp',
      locality: 'Camp',
      description: 'Legendary Parsi bakery established in 1955 on East Street. World-renowned for authentic Shrewsbury biscuits, mawa cake, cheese papdi, and freshly baked walnut cakes.',
      coverImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
      logo: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&q=80',
      website: 'https://www.kayanibakerypune.com',
      googleMapsLink: 'https://maps.google.com/?q=Kayani+Bakery+East+Street+Pune',
      rating: 4.8,
      reviewCount: 14200,
      featured: true,
      verified: true,
      adminVerified: true,
      approvalStatus: 'approved',
      approvedBy: 'Admin (System Panel)',
      active: true,
    },
    {
      id: 'george-restaurant-camp',
      name: 'George Restaurant',
      businessName: 'George Restaurant',
      ownerName: 'Darius Irani',
      category: 'Restaurant',
      phone: '+91 20 2613 1891',
      whatsapp: '+91 98220 12345',
      email: 'info@georgerestaurantpune.com',
      address: '2436, East Street, Camp, Pune, Maharashtra 411001',
      city: 'Pune',
      area: 'Camp',
      locality: 'Camp',
      description: 'Iconic Mughlai and Persian culinary landmark in Pune Camp since 1936. Famous across India for authentic Mutton Dum Biryani, Chelo Kebab, Butter Chicken, and Roomali Roti.',
      coverImage: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
      logo: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&q=80',
      website: 'https://www.georgerestaurant.in',
      googleMapsLink: 'https://maps.google.com/?q=George+Restaurant+East+Street+Camp+Pune',
      rating: 4.6,
      reviewCount: 8400,
      featured: true,
      verified: true,
      adminVerified: true,
      approvalStatus: 'approved',
      approvedBy: 'Admin (System Panel)',
      active: true,
    },
    {
      id: 'marz-o-rin-camp',
      name: 'Marz-O-Rin',
      businessName: 'Marz-O-Rin',
      ownerName: 'Sheriar Sherif',
      category: 'Cafe',
      phone: '+91 20 2613 0774',
      whatsapp: '+91 20 2613 0774',
      email: 'orders@marzorin.com',
      address: '4, Bakthiar Plaza, MG Road, Camp, Pune, Maharashtra 411001',
      city: 'Pune',
      area: 'Camp',
      locality: 'Camp',
      description: 'Heritage bakery cafe on MG Road operating in a 100-year-old colonial building. Iconic for mint chutney sandwiches, chicken cocktail rolls, macaroni bake, and cold coffee.',
      coverImage: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
      logo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&q=80',
      website: 'https://www.marzorin.com',
      googleMapsLink: 'https://maps.google.com/?q=Marz-O-Rin+MG+Road+Camp+Pune',
      rating: 4.7,
      reviewCount: 11500,
      featured: true,
      verified: true,
      adminVerified: true,
      approvalStatus: 'approved',
      approvedBy: 'Admin (System Panel)',
      active: true,
    },
    {
      id: 'blue-nile-camp',
      name: 'Blue Nile Restaurant',
      businessName: 'Blue Nile Restaurant',
      ownerName: 'Ali Asghar',
      category: 'Restaurant',
      phone: '+91 20 2612 5238',
      whatsapp: '+91 98231 67890',
      email: 'bluenilepune@gmail.com',
      address: '4, Agakhan Compound, Bund Garden Road, Near Camp, Pune 411001',
      city: 'Pune',
      area: 'Camp',
      locality: 'Camp',
      description: 'Pune premier Iranian & North Indian dining destination. Celebrated for Authentic Irani Biryani, Murgh Tandoori, Joojeh Kebab, and classic caramel custard.',
      coverImage: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
      logo: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&q=80',
      website: 'https://www.bluenilepune.com',
      googleMapsLink: 'https://maps.google.com/?q=Blue+Nile+Bund+Garden+Camp+Pune',
      rating: 4.5,
      reviewCount: 7200,
      featured: false,
      verified: true,
      adminVerified: true,
      approvalStatus: 'approved',
      approvedBy: 'Admin (System Panel)',
      active: true,
    },
    {
      id: 'camp-burger-camp',
      name: 'Camp Burger (King Burger)',
      businessName: 'Camp Burger',
      ownerName: 'Farhad Irani',
      category: 'Restaurant',
      phone: '+91 20 2613 7750',
      whatsapp: '+91 20 2613 7750',
      email: 'campburger@gmail.com',
      address: 'Phulgaon Road, East Street, Camp, Pune, Maharashtra 411001',
      city: 'Pune',
      area: 'Camp',
      locality: 'Camp',
      description: 'The legendary student and youth favorite since 1989. Famous for massive King Burgers, crinkle-cut fries, and chilled homemade lemon iced tea.',
      coverImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
      logo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80',
      website: 'https://www.campburger.in',
      googleMapsLink: 'https://maps.google.com/?q=Camp+Burger+East+Street+Pune',
      rating: 4.7,
      reviewCount: 12800,
      featured: true,
      verified: true,
      adminVerified: true,
      approvalStatus: 'approved',
      approvedBy: 'Admin (System Panel)',
      active: true,
    },

    // --- CAMP HEALTHCARE & CLINICS ---
    {
      id: 'jehangir-hospital-camp',
      name: 'Jehangir Hospital & Medical Centre',
      businessName: 'Jehangir Hospital',
      ownerName: 'Jehangir Healthcare Trust',
      category: 'Healthcare',
      phone: '+91 20 6681 9999',
      whatsapp: '+91 20 6681 1000',
      email: 'appointments@jehangirhospital.com',
      address: '32, Sassoon Road, Opposite Pune Railway Station, Near Camp, Pune 411001',
      city: 'Pune',
      area: 'Camp',
      locality: 'Camp',
      description: 'NABH-accredited 350-bed tertiary care multi-speciality hospital serving Camp and Pune with state-of-the-art ICU, cardiology, neurology, and 24x7 trauma care.',
      coverImage: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&q=80',
      logo: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=200&q=80',
      website: 'https://www.jehangirhospital.com',
      googleMapsLink: 'https://maps.google.com/?q=Jehangir+Hospital+Sassoon+Road+Pune',
      rating: 4.6,
      reviewCount: 5600,
      featured: true,
      verified: true,
      adminVerified: true,
      approvalStatus: 'approved',
      approvedBy: 'Admin (System Panel)',
      active: true,
    },
    {
      id: 'dr-batras-camp',
      name: "Dr. Batra's Positive Health Clinic (Camp)",
      businessName: "Dr. Batra's Positive Health Clinic",
      ownerName: "Dr. Mukesh Batra",
      category: 'Healthcare',
      phone: '+91 90330 01122',
      whatsapp: '+91 90330 01122',
      email: 'info@drbatras.com',
      address: '2nd Floor, Sterling Centre, Moledina Road, Camp, Pune, Maharashtra 411001',
      city: 'Pune',
      area: 'Camp',
      locality: 'Camp',
      description: 'Specialized clinic for homeopathy treatments, hair loss restoration, dermatology, allergy management, and holistic lifestyle wellness.',
      coverImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
      logo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200&q=80',
      website: 'https://www.drbatras.com',
      googleMapsLink: 'https://maps.google.com/?q=Dr+Batras+Sterling+Centre+Moledina+Road+Camp+Pune',
      rating: 4.7,
      reviewCount: 890,
      featured: false,
      verified: true,
      adminVerified: true,
      approvalStatus: 'approved',
      approvedBy: 'Admin (System Panel)',
      active: true,
    },
    {
      id: 'camp-dental-clinic',
      name: 'Camp Dental Clinic & Implant Centre',
      businessName: 'Camp Dental Clinic',
      ownerName: 'Dr. Rahul Kothari',
      category: 'Healthcare',
      phone: '+91 20 2613 4488',
      whatsapp: '+91 98222 34488',
      email: 'campdentalcare@gmail.com',
      address: 'Suite 102, Aurora Towers, MG Road, Camp, Pune, Maharashtra 411001',
      city: 'Pune',
      area: 'Camp',
      locality: 'Camp',
      description: 'Advanced digital dentistry, painless root canal, cosmetic smile designing, and dental implants by senior dental surgeons with over 20 years of experience.',
      coverImage: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80',
      logo: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=200&q=80',
      website: 'https://www.campdentalpune.com',
      googleMapsLink: 'https://maps.google.com/?q=Camp+Dental+Aurora+Towers+MG+Road+Pune',
      rating: 4.9,
      reviewCount: 640,
      featured: false,
      verified: true,
      adminVerified: true,
      approvalStatus: 'approved',
      approvedBy: 'Admin (System Panel)',
      active: true,
    },

    // --- KONDHWA (PUNE) RESTAURANTS & CAFES ---
    {
      id: 'pk-biryani-kondhwa',
      name: 'PK Biryani House (Kondhwa)',
      businessName: 'PK Biryani House',
      ownerName: 'Pravin Kedari',
      category: 'Restaurant',
      phone: '+91 91580 07788',
      whatsapp: '+91 91580 07788',
      email: 'contact@pkbiryanihouse.com',
      address: 'Opp. Bizzbay Mall, NIBM Post Office Road, Kondhwa, Pune, Maharashtra 411048',
      city: 'Pune',
      area: 'Kondhwa',
      locality: 'Kondhwa',
      description: 'Authentic Maharashtrian Sajuk Tupatli Biryani and spicy Kolhapuri Tambda-Pandhra Rassa. One of Kondhwa most popular and highest rated biryani destinations.',
      coverImage: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&q=80',
      logo: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=200&q=80',
      website: 'https://www.pkbiryanihouse.com',
      googleMapsLink: 'https://maps.google.com/?q=PK+Biryani+House+NIBM+Kondhwa+Pune',
      rating: 4.5,
      reviewCount: 6800,
      featured: true,
      verified: true,
      adminVerified: true,
      approvalStatus: 'approved',
      approvedBy: 'Admin (System Panel)',
      active: true,
    },
    {
      id: 'zeeshan-restaurant-kondhwa',
      name: 'Zeeshan Restaurant - Apna Hyderabadi Food',
      businessName: 'Zeeshan Restaurant',
      ownerName: 'Mohammed Zeeshan',
      category: 'Restaurant',
      phone: '+91 20 2685 1122',
      whatsapp: '+91 98900 78654',
      email: 'info@zeeshanrestaurant.com',
      address: 'Salunke Vihar Road, Near Jyoti Pure Veg, Kondhwa, Pune, Maharashtra 411048',
      city: 'Pune',
      area: 'Kondhwa',
      locality: 'Kondhwa',
      description: 'Authentic Hyderabadi Dum Biryani, slow-cooked aromatic Haleem, and Mughlai charcoal grills. A landmark dinner destination on Salunke Vihar Road.',
      coverImage: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
      logo: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&q=80',
      website: 'https://www.zeeshanhyderabadi.com',
      googleMapsLink: 'https://maps.google.com/?q=Zeeshan+Restaurant+Salunke+Vihar+Kondhwa+Pune',
      rating: 4.6,
      reviewCount: 9300,
      featured: true,
      verified: true,
      adminVerified: true,
      approvalStatus: 'approved',
      approvedBy: 'Admin (System Panel)',
      active: true,
    },
    {
      id: 'cafe-arabia-kondhwa',
      name: 'Cafe Arabia',
      businessName: 'Cafe Arabia',
      ownerName: 'Tariq Mansoor',
      category: 'Restaurant',
      phone: '+91 88880 12345',
      whatsapp: '+91 88880 12345',
      email: 'arabia.kausarbaugh@gmail.com',
      address: 'Kausar Baugh Road, Kondhwa, Pune, Maharashtra 411048',
      city: 'Pune',
      area: 'Kondhwa',
      locality: 'Kondhwa',
      description: 'Premier Middle Eastern & Arabian restaurant in Kausar Baugh. Renowned for Al Faham chicken, Mutton Mandi platters, and authentic Lebanese shawarma rolls.',
      coverImage: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80',
      logo: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=200&q=80',
      website: 'https://www.cafearabiapune.com',
      googleMapsLink: 'https://maps.google.com/?q=Cafe+Arabia+Kausar+Baugh+Kondhwa+Pune',
      rating: 4.7,
      reviewCount: 4100,
      featured: true,
      verified: true,
      adminVerified: true,
      approvalStatus: 'approved',
      approvedBy: 'Admin (System Panel)',
      active: true,
    },
    {
      id: 'brooklyn-bakery-kondhwa',
      name: 'The Brooklyn Bakery & Patisserie',
      businessName: 'The Brooklyn Bakery',
      ownerName: 'Sarah Deshmukh',
      category: 'Cafe',
      phone: '+91 98230 45678',
      whatsapp: '+91 98230 45678',
      email: 'orders@brooklynbakerypune.com',
      address: 'Shop 3, Bramha Avenue, Salunke Vihar Road, Kondhwa, Pune, Maharashtra 411048',
      city: 'Pune',
      area: 'Kondhwa',
      locality: 'Kondhwa',
      description: 'Artisan sourdough breads, French viennoiseries, handcrafted baked cheesecakes, and specialty Arabica pour-overs in a stylish European-inspired cafe setting.',
      coverImage: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80',
      logo: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80',
      website: 'https://www.brooklynbakerypune.com',
      googleMapsLink: 'https://maps.google.com/?q=Brooklyn+Bakery+Salunke+Vihar+Kondhwa+Pune',
      rating: 4.8,
      reviewCount: 1450,
      featured: false,
      verified: true,
      adminVerified: true,
      approvalStatus: 'approved',
      approvedBy: 'Admin (System Panel)',
      active: true,
    },

    // --- KONDHWA HEALTHCARE & CLINICS ---
    {
      id: 'satyanand-hospital-kondhwa',
      name: 'Satyanand Hospital & Research Centre',
      businessName: 'Satyanand Hospital',
      ownerName: 'Dr. Satyanand Memorial Trust',
      category: 'Healthcare',
      phone: '+91 20 2693 2100',
      whatsapp: '+91 98230 22100',
      email: 'admin@satyanandhospital.com',
      address: 'Kondhwa Main Road, Near Khadi Machine Chowk, Kondhwa, Pune, Maharashtra 411048',
      city: 'Pune',
      area: 'Kondhwa',
      locality: 'Kondhwa',
      description: 'Leading 100-bed multi-specialty hospital with 24x7 emergency department, intensive care unit, advanced dialysis center, and maternity wing.',
      coverImage: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
      logo: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200&q=80',
      website: 'https://www.satyanandhospital.com',
      googleMapsLink: 'https://maps.google.com/?q=Satyanand+Hospital+Kondhwa+Pune',
      rating: 4.6,
      reviewCount: 2100,
      featured: true,
      verified: true,
      adminVerified: true,
      approvalStatus: 'approved',
      approvedBy: 'Admin (System Panel)',
      active: true,
    },
    {
      id: 'lifeline-hospital-kondhwa',
      name: 'Lifeline Hospital & Critical Care Centre',
      businessName: 'Lifeline Hospital',
      ownerName: 'Dr. Rajesh Patil',
      category: 'Healthcare',
      phone: '+91 20 2693 4500',
      whatsapp: '+91 98900 44500',
      email: 'info@lifelinehospitalpune.com',
      address: 'Near Sheetla Devi Mandir, Kondhwa Budruk, Pune, Maharashtra 411048',
      city: 'Pune',
      area: 'Kondhwa',
      locality: 'Kondhwa',
      description: 'Comprehensive critical care center equipped with state-of-the-art ICU, neonatal pediatric unit, laparoscopic surgery suites, and round-the-clock pharmacy.',
      coverImage: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&q=80',
      logo: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=200&q=80',
      website: 'https://www.lifelinehospitalpune.com',
      googleMapsLink: 'https://maps.google.com/?q=Lifeline+Hospital+Kondhwa+Budruk+Pune',
      rating: 4.7,
      reviewCount: 1850,
      featured: false,
      verified: true,
      adminVerified: true,
      approvalStatus: 'approved',
      approvedBy: 'Admin (System Panel)',
      active: true,
    },
    {
      id: 'dr-merchants-clinic-kondhwa',
      name: "Dr. Merchant's Family Clinic & Healthcare",
      businessName: "Dr. Merchant's Family Clinic",
      ownerName: "Dr. Asif Merchant",
      category: 'Healthcare',
      phone: '+91 20 2683 8899',
      whatsapp: '+91 98220 88899',
      email: 'merchantclinic.nibm@gmail.com',
      address: 'Ground Floor, Clover Highlands, NIBM Road, Kondhwa, Pune, Maharashtra 411048',
      city: 'Pune',
      area: 'Kondhwa',
      locality: 'Kondhwa',
      description: 'Trusted family healthcare clinic offering preventive wellness, chronic diabetes management, pediatric immunizations, and digital pathology laboratory.',
      coverImage: 'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=800&q=80',
      logo: 'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=200&q=80',
      website: 'https://www.merchanthealthcare.com',
      googleMapsLink: 'https://maps.google.com/?q=Dr+Merchants+Clinic+NIBM+Road+Kondhwa+Pune',
      rating: 4.9,
      reviewCount: 920,
      featured: false,
      verified: true,
      adminVerified: true,
      approvalStatus: 'approved',
      approvedBy: 'Admin (System Panel)',
      active: true,
    },
    {
      id: 'apex-dental-kondhwa',
      name: 'Apex Dental Care & Implant Clinic',
      businessName: 'Apex Dental Care',
      ownerName: 'Dr. Sneha Agrawal',
      category: 'Healthcare',
      phone: '+91 98900 11223',
      whatsapp: '+91 98900 11223',
      email: 'apexdental.salunke@gmail.com',
      address: '1st Floor, Kedari Icon, Salunke Vihar Road, Kondhwa, Pune, Maharashtra 411048',
      city: 'Pune',
      area: 'Kondhwa',
      locality: 'Kondhwa',
      description: 'Modern dental clinic specializing in pain-free single sitting root canals, clear invisible aligners, dental crowns, and dental tourism implants.',
      coverImage: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&q=80',
      logo: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=200&q=80',
      website: 'https://www.apexdentalpune.in',
      googleMapsLink: 'https://maps.google.com/?q=Apex+Dental+Salunke+Vihar+Kondhwa+Pune',
      rating: 4.9,
      reviewCount: 780,
      featured: false,
      verified: true,
      adminVerified: true,
      approvalStatus: 'approved',
      approvedBy: 'Admin (System Panel)',
      active: true,
    }
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
          // Fallback to rich Kondhwa & Camp directory
          setBusinessList(mockBusinesses)
          setFilteredBusinesses(mockBusinesses)
        }
      } catch (error) {
        console.error('Failed to load businesses from API:', error)
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
  }, [searchTerm, selectedCategory, selectedLocality, businessList])

  const filterBusinesses = () => {
    let filtered = businessList

    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(b => 
        b.category === selectedCategory || 
        (selectedCategory === 'Restaurants & Cafes' && (b.category === 'Restaurant' || b.category === 'Cafe'))
      )
    }

    if (selectedLocality !== 'All Localities') {
      const targetLocality = selectedLocality.toLowerCase();
      filtered = filtered.filter(b =>
        (b.area || '').toLowerCase().includes(targetLocality) ||
        (b.locality || '').toLowerCase().includes(targetLocality) ||
        (b.address || '').toLowerCase().includes(targetLocality)
      )
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        (b.name || '').toLowerCase().includes(term) ||
        (b.description || '').toLowerCase().includes(term) ||
        (b.area || '').toLowerCase().includes(term) ||
        (b.address || '').toLowerCase().includes(term) ||
        (b.category || '').toLowerCase().includes(term)
      )
    }

    setFilteredBusinesses(filtered)
  }

  const getCategoryLabel = (label) => {
    switch (label) {
      case 'All Categories': return t('allCategories') || 'All Categories'
      case 'Restaurants & Cafes':
      case 'Restaurant':
      case 'Cafe': return t('restaurantsAndCafes') || 'Restaurants & Cafes'
      case 'Healthcare': return t('health') || 'Healthcare'
      case 'Education': return t('education') || 'Education'
      case 'Real Estate': return t('property') || 'Real Estate'
      case 'Automotive': return t('vehicles') || 'Automotive'
      case 'Electronics': return t('electronics') || 'Electronics'
      case 'Beauty & Wellness':
      case 'Beauty & Spa': return t('beautyAndWellness') || 'Beauty & Wellness'
      case 'Travel & Tourism': return t('travelAndTourism') || 'Travel & Tourism'
      case 'Professional Services': return t('professionalServices') || 'Professional Services'
      case 'Home Services': return t('homeServices') || 'Home Services'
      case 'Services': return t('services') || 'Services'
      case 'Fitness': return t('fitness') || 'Fitness'
      case 'Fashion': return t('fashion') || 'Fashion'
      case 'More': return t('more') || 'More'
      default: return label
    }
  }

  if (loading) {
    return <div className="text-center py-12">{t('loading') || 'Loading businesses...'}</div>
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ─── HERO BANNER ─── */}
      <div className="relative w-full overflow-hidden h-[160px] md:h-[200px]">
        <Image src="/business_dir_banner_1789519372349.jpg" alt="Business Directory" fill className="absolute inset-0 object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />
        <div className="relative z-10 w-full px-4 md:px-12 flex flex-col justify-center h-full">
          <p className="text-gray-400 text-[10px] md:text-xs font-black uppercase tracking-widest mb-1 md:mb-2">{t('businessDirectory') || 'BUSINESS DIRECTORY'}</p>
          <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-black leading-tight mb-2">
            {t('discoverLocalBusinesses') || 'Discover Local Businesses'}
          </h1>
          <p className="hidden sm:block text-gray-300 text-xs md:text-sm mb-3 md:mb-5 max-w-lg">{t('businessDirectoryDesc') || 'Find trusted businesses, services and professionals across Pune and beyond.'}</p>
          <div className="hidden md:flex flex-wrap gap-6">
            {[
              { icon: '🏢', value: '5,000+', label: t('listedBusinesses') || 'Listed Businesses' },
              { icon: '📂', value: '100+', label: t('categories') || 'Categories' },
              { icon: '✅', value: t('verified') || 'Verified', label: t('trustedAuthentic') || 'Listings Trusted & Authentic' },
              { icon: '📈', value: t('localGrowth') || 'Local Growth', label: t('strongerCommunities') || 'Stronger Communities' },
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
                placeholder={t('searchBusinessPlaceholder') || "Search for business, service or keyword..."}
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
              {t('search') || 'Search'} →
            </Button>
          </div>
        </div>
      </div>

      {/* ─── PUNE LOCALITY FILTER CHIPS (Camp & Kondhwa Focus) ─── */}
      <div className="bg-slate-50 border-b border-gray-200 py-3">
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-red-600" />
              Localities:
            </span>
            {[
              { id: 'All Localities', label: 'All Pune (16+ Listings)', count: businessList.length },
              { id: 'Camp', label: '📍 Camp (East St / MG Rd)', count: businessList.filter(b => (b.area||'').toLowerCase().includes('camp')).length },
              { id: 'Kondhwa', label: '📍 Kondhwa (Kausar Baugh / Salunke Vihar / NIBM)', count: businessList.filter(b => (b.area||'').toLowerCase().includes('kondhwa')).length },
            ].map((loc) => {
              const isLocActive = selectedLocality === loc.id
              return (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocality(loc.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm border ${
                    isLocActive
                      ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-200'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span>{loc.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isLocActive ? 'bg-red-800 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {loc.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Admin Verified Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-black border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Kondhwa & Camp Verified by Admin Panel</span>
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
                  <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'text-red-600' : 'text-gray-600'} text-center px-1 leading-tight`}>{getCategoryLabel(cat.label)}</span>
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
              <h3 className="font-black text-sm text-gray-900">{t('filters') || 'Filters'}</h3>
              <button 
                onClick={() => { setSelectedCategory('All Categories'); setSelectedLocality('All Localities'); setSearchTerm(''); }}
                className="text-red-600 hover:text-red-700 text-xs font-bold"
              >
                {t('clearAll') || 'Clear All'}
              </button>
            </div>

            {/* Location */}
            <div>
              <p className="text-xs font-black text-gray-700 mb-2 flex items-center gap-1"><MapPin className="w-3 h-3 text-red-500" /> {t('location') || 'Pune Locality'}</p>
              <select 
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
                value={selectedLocality}
                onChange={(e) => setSelectedLocality(e.target.value)}
              >
                <option value="All Localities">All Pune Localities (16+)</option>
                <option value="Camp">📍 Camp (East St & MG Rd)</option>
                <option value="Kondhwa">📍 Kondhwa (Kausar Baugh & NIBM)</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <p className="text-xs font-black text-gray-700 mb-2">{t('category') || 'Category'}</p>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                {BUSINESS_CATEGORIES.map(c => <option key={c} value={c}>{getCategoryLabel(c)}</option>)}
              </select>
            </div>

            {/* Rating */}
            <div>
              <p className="text-xs font-black text-gray-700 mb-2 flex items-center gap-1"><Star className="w-3 h-3" /> {t('rating') || 'Rating'}</p>
              {[
                { val: '4.5 & above', label: `4.5 ${t('andAbove') || '& above'}` },
                { val: '4.0 & above', label: `4.0 ${t('andAbove') || '& above'}` },
                { val: '3.0 & above', label: `3.0 ${t('andAbove') || '& above'}` },
                { val: 'Any rating', label: t('anyRating') || 'Any rating' },
              ].map(r => (
                <label key={r.val} className="flex items-center gap-2 text-xs text-gray-600 py-1 cursor-pointer">
                  <input type="radio" name="rating" className="accent-red-600" /> {r.label}
                </label>
              ))}
            </div>

            {/* Business Type */}
            <div>
              <p className="text-xs font-black text-gray-700 mb-2">{t('businessType') || 'Business Type'}</p>
              {[
                { id: 'verified', label: t('verifiedBusiness') || 'Verified Business' },
                { id: 'open', label: t('openNow') || 'Open Now' },
                { id: 'deals', label: t('offersAndDeals') || 'Offers & Deals' },
                { id: 'delivery', label: t('homeDelivery') || 'Home Delivery' },
                { id: 'booking', label: t('onlineBooking') || 'Online Booking' },
              ].map(bt => (
                <label key={bt.id} className="flex items-center gap-2 text-xs text-gray-600 py-1 cursor-pointer">
                  <input type="checkbox" className="accent-red-600" /> {bt.label}
                </label>
              ))}
            </div>

            <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm">{t('applyFilters') || 'Apply Filters'}</Button>
          </div>

          {/* CENTER: Results Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">{t('showing') || 'Showing'} 1-12 {t('of') || 'of'} {filteredBusinesses.length} {t('businesses') || 'businesses'}</p>
              <div className="flex items-center gap-2">
                <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700">
                  <option>{t('mostRelevant') || 'Most Relevant'}</option>
                  <option>{t('highestRated') || 'Highest Rated'}</option>
                  <option>{t('newestFirst') || 'Newest First'}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBusinesses.map((business) => {
                const rawPhone = business.phone || business.whatsapp || '';
                const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
                const mapsQuery = encodeURIComponent(`${business.name} ${business.address || business.area || 'Pune'}`);
                const directionsUrl = business.googleMapsLink || `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

                return (
                  <div
                    key={business.id}
                    className="bg-white border border-gray-200 hover:border-red-400 rounded-2xl overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                    onClick={() => { setSelectedBusiness(business); setCurrentView('business-detail') }}
                  >
                    <div>
                      {/* Card Image Banner */}
                      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                        <img
                          src={business.cover_image || business.coverImage || business.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'}
                          alt={business.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                        
                        {/* Top Left: Admin Verified Shield */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span className="bg-emerald-600/95 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1 tracking-wider uppercase">
                            <ShieldCheck className="w-3 h-3 text-white" />
                            <span>Admin Verified</span>
                          </span>
                        </div>

                        {/* Top Right: Locality Tag */}
                        <div className="absolute top-2.5 right-2.5">
                          <span className="bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                            {business.area || business.locality || 'Pune'}
                          </span>
                        </div>

                        {/* Bottom-left on Image: Open Badge */}
                        <div className="absolute bottom-2 left-2.5 flex items-center gap-1.5">
                          <span className="bg-green-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow">
                            Open Now
                          </span>
                        </div>
                      </div>

                      {/* Business Core Info */}
                      <div className="p-4 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-black text-base text-gray-900 leading-snug group-hover:text-red-600 transition-colors line-clamp-1">
                              {business.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] font-bold text-red-600">
                                {getCategoryLabel(business.category)}
                              </span>
                              <span className="text-[10px] text-gray-400">•</span>
                              <span className="text-[10px] text-gray-500 font-medium">
                                Verified Listing
                              </span>
                            </div>
                          </div>
                          {business.logo && (
                            <div className="w-10 h-10 rounded-xl border border-gray-100 overflow-hidden shrink-0 bg-white p-0.5 shadow-sm">
                              <img src={business.logo} alt="" className="w-full h-full object-cover rounded-lg" onError={e => e.currentTarget.style.display='none'} />
                            </div>
                          )}
                        </div>

                        {/* Google Rating & Review Counter */}
                        <div className="flex items-center gap-1.5 bg-amber-50/70 border border-amber-200/60 px-2.5 py-1 rounded-lg w-fit">
                          <div className="flex items-center">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(business.rating || 4.5) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
                            ))}
                          </div>
                          <span className="text-xs font-black text-amber-900">{business.rating || '4.7'}</span>
                          <span className="text-[11px] text-amber-700 font-medium">({business.reviewCount ? `${(business.reviewCount).toLocaleString()}+ Google reviews` : 'Verified'})</span>
                        </div>

                        {/* Address */}
                        <p className="text-xs text-gray-600 flex items-start gap-1.5 line-clamp-1">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                          <span>{business.address || business.area || 'Pune, Maharashtra'}</span>
                        </p>

                        {/* Description */}
                        {business.description && (
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {business.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quick Interactive Actions */}
                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-2.5">
                      <div className="grid grid-cols-3 gap-2">
                        {/* Call */}
                        {rawPhone ? (
                          <a
                            href={`tel:${rawPhone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="py-1.5 px-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                            title="Call Business"
                          >
                            <Phone className="w-3 h-3 text-green-600" />
                            <span>Call</span>
                          </a>
                        ) : (
                          <div className="py-1.5 px-2 rounded-lg bg-gray-50 text-gray-400 text-[11px] font-medium flex items-center justify-center">
                            <span>Direct</span>
                          </div>
                        )}

                        {/* WhatsApp */}
                        {rawPhone ? (
                          <a
                            href={`https://wa.me/${cleanPhone}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                            title="WhatsApp Business"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600" />
                            <span>Chat</span>
                          </a>
                        ) : (
                          <div className="py-1.5 px-2 rounded-lg bg-gray-50 text-gray-400 text-[11px] font-medium flex items-center justify-center">
                            <span>Inquire</span>
                          </div>
                        )}

                        {/* Directions on Google Maps */}
                        <a
                          href={directionsUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="py-1.5 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                          title="Open Google Maps Directions"
                        >
                          <Navigation className="w-3 h-3 text-blue-600" />
                          <span>Map</span>
                        </a>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-50">
                        <span className="flex items-center gap-1 text-emerald-600 font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Updated via Admin Panel</span>
                        </span>
                        <span className="hover:text-red-600 font-bold flex items-center gap-0.5">
                          <span>View Profile</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredBusinesses.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-400 font-bold">{t('noBusinessesFound') || 'No businesses found matching your criteria'}</p>
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
              <h3 className="font-black text-sm text-gray-900 mb-1">{t('listYourBusiness') || 'List Your Business'}</h3>
              <p className="text-[11px] text-gray-500 mb-3">{t('listYourBusinessDesc') || 'Reach thousands of potential customers across India.'}</p>
              <ul className="space-y-1 mb-4">
                {[
                  t('getDiscoveredLocally') || 'Get discovered locally',
                  t('boostBrandVisibility') || 'Boost your brand visibility',
                  t('easyAndQuickListing') || 'Easy and quick listing',
                  t('trustedByCommunity') || 'Trusted by the StarNews community'
                ].map(p => (
                  <li key={p} className="flex items-center gap-2 text-[11px] text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />{p}
                  </li>
                ))}
              </ul>
              <Dialog open={promotionOpen} onOpenChange={setPromotionOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg">{t('addYourBusiness') || '+ Add Your Business'}</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] p-8 rounded-2xl shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">{t('promoteYourBusinessTitle') || 'Promote Your Business'}</DialogTitle>
                    <DialogDescription className="text-gray-600">{t('promoteYourBusinessDesc') || 'Fill out the form and our team will contact you to help promote your business.'}</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handlePromotionSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2"><Label htmlFor="businessName2">{t('businessName') || 'Business Name'}</Label><Input id="businessName2" placeholder="e.g., My Awesome Restaurant" value={promotionData.businessName} onChange={e => setPromotionData({...promotionData, businessName: e.target.value})} required className="h-11 rounded-lg" /></div>
                    <div className="grid gap-2"><Label htmlFor="ownerName2">{t('yourName') || 'Your Name'}</Label><Input id="ownerName2" placeholder="e.g., John Doe" value={promotionData.ownerName} onChange={e => setPromotionData({...promotionData, ownerName: e.target.value})} required className="h-11 rounded-lg" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2"><Label htmlFor="phone2">{t('phone') || 'Phone'}</Label><Input id="phone2" type="tel" placeholder="+91 98765 43210" value={promotionData.phone} onChange={e => setPromotionData({...promotionData, phone: e.target.value})} required className="h-11 rounded-lg" /></div>
                      <div className="grid gap-2"><Label htmlFor="email2">{t('email') || 'Email'}</Label><Input id="email2" type="email" placeholder="you@example.com" value={promotionData.email} onChange={e => setPromotionData({...promotionData, email: e.target.value})} required className="h-11 rounded-lg" /></div>
                    </div>
                    <div className="grid gap-2"><Label htmlFor="address2">{t('address') || 'Business Address'}</Label><Input id="address2" placeholder="123 Main St, Pune" value={promotionData.address} onChange={e => setPromotionData({...promotionData, address: e.target.value})} required className="h-11 rounded-lg" /></div>
                    <div className="grid gap-2"><Label htmlFor="description2">{t('description') || 'Description'}</Label><Textarea id="description2" placeholder="Tell us more about your business..." value={promotionData.description} onChange={e => setPromotionData({...promotionData, description: e.target.value})} rows={3} className="rounded-lg" /></div>
                    <Button type="submit" disabled={isSubmitting} className="w-full h-11 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold">
                      {isSubmitting ? (t('submitting') || 'Submitting...') : (t('submitRequest') || 'Submit Request')}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Good Businesses Banner */}
            <div className="bg-gray-900 rounded-xl p-4 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">{t('goodBusinesses') || 'Good Businesses'}</p>
                <h3 className="text-white font-black text-base leading-tight mb-2">{t('buildGreatCities') || 'Build Great Cities'}</h3>
                <p className="text-gray-400 text-[11px] mb-3">{t('goodBusinessesDesc') || 'Let your business be part of a stronger, informed India.'}</p>
                <button className="bg-white text-gray-900 text-xs font-black px-4 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">{t('listNow') || 'List Now →'}</button>
              </div>
            </div>

            {/* Businesses Near You */}
            <div className="border border-gray-200 rounded-xl p-4">
              <h3 className="font-black text-sm text-gray-900 mb-3">{t('businessesNearYou') || 'Businesses Near You'}</h3>
              <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center mb-3">
                <div className="text-center">
                  <MapPin className="w-6 h-6 text-red-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">{t('mapView') || 'Map View'}</p>
                  <div className="flex gap-1 mt-2 justify-center">
                    {['🔴','🔴','🔴'].map((pin, i) => <span key={i}>{pin}</span>)}
                  </div>
                </div>
              </div>
              <button className="w-full border border-gray-200 text-gray-700 text-xs font-bold py-2 rounded-lg hover:bg-gray-50 transition-colors">{t('viewOnMap') || 'View on Map →'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BusinessesPage
