import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { DM_Serif_Display, Manrope } from 'next/font/google'
import './globals.css'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' })
const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-dm-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Kai Lodge Maldives — Your Comfortable Stay in the Heart of Malé',
    template: '%s · Kai Lodge Maldives',
  },
  description:
    'Kai Lodge is a boutique guesthouse on Muranga Magu, Malé. Comfortable rooms, personalised stays and easy access to the city, IGMH and Rasfannu Beach.',
  applicationName: 'Kai Lodge Maldives',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/kai-lodge-icon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/kai-lodge-icon-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/icon-light-32x32.png',
    apple: [{ url: '/apple-icon.png', type: 'image/png', sizes: '180x180' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#111010',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${manrope.variable} ${dmSerif.variable} bg-background`}>
      <body>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
