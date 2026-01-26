'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const LiveTVPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Pune Majha Live TV</h1>
      <Card>
        <CardHeader>
          <CardTitle>Live Stream</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-black rounded-lg flex items-center justify-center text-white">
            <p>Live TV player coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LiveTVPage
