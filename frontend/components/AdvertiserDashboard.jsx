'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const AdvertiserDashboard = ({ user, toast }) => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Advertiser Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {user.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Advertiser dashboard coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdvertiserDashboard
