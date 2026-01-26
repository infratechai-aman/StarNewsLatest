'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Download, Eye, Newspaper, FileText } from 'lucide-react'

const EnewspaperPage = () => {
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
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-red-600 to-purple-600 rounded-lg">
            <Newspaper className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">E-Newspaper</h1>
            <p className="text-muted-foreground">Read today's edition online</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-purple-50 p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Digital Edition Available</h2>
              <p className="text-muted-foreground">
                Read the latest news, download PDF, or browse previous editions
              </p>
            </div>
            <Calendar className="h-12 w-12 text-red-600" />
          </div>
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
                  Download PDF
                </Button>
                <Button variant="outline" onClick={() => setViewingPdf(null)}>
                  Close
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
            <h3 className="text-xl font-semibold text-gray-600">No E-Newspapers Available</h3>
            <p className="text-muted-foreground mt-2">Check back later for new editions</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newspapers.map((newspaper) => (
            <Card key={newspaper.id} className="overflow-hidden hover:shadow-xl transition-shadow">
              <div className="relative">
                <img
                  src={newspaper.thumbnailUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400'}
                  alt={newspaper.title}
                  className="w-full h-64 object-cover"
                />
                <Badge className="absolute top-4 right-4 bg-gradient-to-r from-red-600 to-purple-600">
                  {getDisplayDate(newspaper.editionDate)}
                </Badge>
              </div>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">{newspaper.title}</h3>
                  {newspaper.description && (
                    <p className="text-sm text-muted-foreground mb-2">{newspaper.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Edition: {new Date(newspaper.editionDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-gradient-to-r from-red-600 to-purple-600"
                    onClick={() => setViewingPdf(newspaper)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Read Online
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDownload(newspaper)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg mb-2">Subscribe to Daily E-Paper</h3>
              <p className="text-sm text-muted-foreground">
                Get the newspaper delivered to your email every morning
              </p>
            </div>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
              Subscribe Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default EnewspaperPage
