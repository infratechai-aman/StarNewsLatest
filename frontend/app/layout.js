// Build Trigger: 2026-02-25
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

import { Toaster } from '@/components/ui/toaster'

export const metadata = {
  title: 'StarNews - Breaking News 24x7',
  description: 'Your trusted source for breaking news, local updates, and business directory',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body className="font-sans antialiased">
        <svg width="0" height="0" className="absolute pointer-events-none">
          <filter id="remove-green" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      1.5 -2.5 1.5 1 0"
            />
          </filter>
        </svg>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
