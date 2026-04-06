import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { ToasterProvider } from '@/components/toaster'

import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Productex Scrapper',
  description:
    'Encuentra marcas de ropa en Instagram y analiza su potencial wholesale para Productex.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-50 font-sans antialiased text-zinc-900`}
      >
        {children}
        <ToasterProvider />
      </body>
    </html>
  )
}
