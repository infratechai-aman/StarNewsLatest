import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata = {
  title: 'StarNews - Breaking News 24x7',
  description: 'Your trusted source for breaking news, local updates, and business directory',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
