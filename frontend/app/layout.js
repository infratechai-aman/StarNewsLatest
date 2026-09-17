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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="referrer" content="no-referrer" />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
