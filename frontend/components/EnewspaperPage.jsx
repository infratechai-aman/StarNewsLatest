'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Download, Eye, Newspaper, FileText, ChevronRight, Zap } from 'lucide-react'
import Image from 'next/image'

import { useLanguage } from '@/contexts/LanguageContext'

const EnewspaperPage = () => {
  const { t } = useLanguage()
  const [newspapers, setNewspapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewingPdf, setViewingPdf] = useState(null)

  // Fetch approved E-Newspapers from API
  useEffect(() => {
    const fetchNewspapers = async () => {
      try {
        const res = await fetch('/api/enewspaper')
        const data = await res.json()
        setNewspapers(data.papers || [])
      } catch (err) {
        console.error('Failed to fetch e-newspapers:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchNewspapers()
  }, [])

  const handleDownload = (newspaper) => {
    const link = document.createElement('a')
    link.href = newspaper.pdfUrl
    link.download = `newspaper-${new Date(newspaper.editionDate).toLocaleDateString()}.pdf`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getDisplayDate = (date) => {
    const d = new Date(date)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) {
      return "TODAY'S EDITION"
    }
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-12 w-12 border-4 border-red-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mag-section-header flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-red-600 rounded-[28px] flex items-center justify-center shadow-xl shadow-red-100">
            <Newspaper className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-5xl font-heading font-black tracking-tighter italic">{t('eNewspaper') || 'E-Newspaper'}</h1>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">{t('readOnlineSubtitle') || 'Digital Edition Marketplace'}</p>
          </div>
        </div>
      </div>

      <div className="bg-red-50/50 border border-red-100 rounded-[32px] p-8 mb-12 flex items-center justify-between">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-black italic tracking-tight mb-2">{t('digitalEditionAvailable') || 'Digital Edition Available'}</h2>
          <p className="text-gray-500 font-bold text-sm leading-relaxed">
            {t('digitalEditionDesc') || 'Experience the authentic print experience in high resolution on any device.'}
          </p>
        </div>
        <div className="hidden md:flex w-16 h-16 bg-white rounded-2xl shadow-sm items-center justify-center">
          <Calendar className="h-8 w-8 text-red-600" />
        </div>
      </div>

      {viewingPdf ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{viewingPdf.title}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleDownload(viewingPdf)}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('downloadPdf')}
                </Button>
                <Button variant="outline" onClick={() => setViewingPdf(null)}>
                  {t('close')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[800px] border rounded-lg overflow-hidden">
              <iframe
                src={viewingPdf.pdfUrl}
                className="w-full h-full"
                title="E-Newspaper PDF Viewer"
              />
            </div>
          </CardContent>
        </Card>
      ) : newspapers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-600">{t('noEpapers')}</h3>
            <p className="text-muted-foreground mt-2">{t('checkBackLater')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {newspapers.map((newspaper) => (
            <div
              key={newspaper.id}
              className="premium-card rounded-3xl overflow-hidden cursor-pointer group shadow-lg border border-gray-100 flex flex-col bg-white transition-all duration-500 hover:-translate-y-2 h-full"
              onClick={() => setViewingPdf(newspaper)}
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-gray-50 border-b border-gray-50">
                <Image
                  src={newspaper.thumbnailUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400'}
                  alt={newspaper.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-[2000ms]"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Badge className="absolute top-6 left-6 bg-red-600 text-white border-none px-4 py-1 font-black uppercase text-[10px] tracking-widest shadow-xl">
                  {getDisplayDate(newspaper.editionDate)}
                </Badge>
                <div className="absolute bottom-6 left-6 right-6 z-10 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
                  <Button className="w-full bg-white text-black hover:bg-black hover:text-white font-black rounded-full h-12 shadow-2xl">
                    {t('readOnline') || 'READ NOW'}
                  </Button>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-heading font-black text-2xl mb-4 leading-tight group-hover:text-red-600 transition-colors tracking-tighter italic">
                  {newspaper.title}
                </h3>
                {newspaper.description && (
                  <p className="text-gray-500 text-sm line-clamp-2 mb-8 flex-1 leading-relaxed">
                    {newspaper.description}
                  </p>
                )}
                <div className="pt-8 border-t border-gray-50 mt-auto flex items-center justify-between">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {t('edition') || 'EDITION'}: {new Date(newspaper.editionDate).toLocaleDateString()}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 rounded-full hover:bg-gray-50 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload(newspaper)
                    }}
                  >
                    <Download className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg mb-2">{t('subscribeEpaperTitle')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('subscribeEpaperDesc')}
              </p>
            </div>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
              {t('subscribeNow')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default EnewspaperPage
