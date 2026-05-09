import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Frisbee Golf',
  description: 'Track scores, leaderboards, and course records',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
