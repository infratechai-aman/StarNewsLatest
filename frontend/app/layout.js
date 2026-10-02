import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata = {
  title: 'StarNews India - Breaking News 24x7',
  description: 'Your trusted source for breaking news, local updates, and business directory',
  icons: {
    icon: '/star_news_favicon.jpg',
    apple: '/star_news_favicon.jpg',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="overflow-x-hidden max-w-full" suppressHydrationWarning>
      <head>
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
      </head>
      <body className="font-sans antialiased overflow-x-hidden max-w-full min-h-screen" suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
