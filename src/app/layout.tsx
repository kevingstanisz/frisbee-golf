import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Frisbee Golf',
  description: 'Track scores, leaderboards, and course records',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav style={{
          borderBottom: '1px solid var(--net)',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          maxWidth: '42rem',
          margin: '0 auto',
        }}>
          <Link href="/" className="font-display" style={{ fontSize: '1.25rem', textDecoration: 'none', color: 'var(--chalk)' }}>
            ⛳ Frisbee Golf
          </Link>
          <Link href="/courses" style={{ fontSize: '0.9rem', color: 'rgba(240,237,232,0.6)', textDecoration: 'none' }}>
            Courses
          </Link>
          <Link href="/rounds/new" style={{ marginLeft: 'auto', textDecoration: 'none' }}>
            <span className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>+ Round</span>
          </Link>
        </nav>
        {children}
      </body>
    </html>
  )
}
