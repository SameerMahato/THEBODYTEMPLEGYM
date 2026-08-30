import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Body Temple Gym',
  description: 'Member management system for Body Temple Gym',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ height: '100%' }}>
      <body style={{ height: '100%' }}>{children}</body>
    </html>
  )
}
