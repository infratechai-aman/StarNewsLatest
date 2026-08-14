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
        <meta name="referrer" content="no-referrer" />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
