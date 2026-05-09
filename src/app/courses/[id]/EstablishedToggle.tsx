'use client'

import { useState, useTransition } from 'react'
import { toggleEstablished } from '@/app/actions'

export default function EstablishedToggle({ courseId, established }: { courseId: string; established: boolean }) {
  const [isEstablished, setIsEstablished] = useState(established)
  const [pending, startTransition] = useTransition()

  function handleToggle() {
    const next = !isEstablished
    setIsEstablished(next)
    startTransition(() => toggleEstablished(courseId, next))
  }

  return (
    <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        style={{
          fontSize: '0.85rem',
          padding: '0.5rem 1.25rem',
          borderRadius: '6px',
          border: isEstablished ? '1px solid var(--gold)' : '1px solid rgba(240,237,232,0.2)',
          background: isEstablished ? 'rgba(255,200,60,0.08)' : 'transparent',
          color: isEstablished ? 'var(--gold)' : 'rgba(240,237,232,0.5)',
          cursor: pending ? 'wait' : 'pointer',
          fontWeight: 600,
          letterSpacing: '0.04em',
        }}
      >
        {isEstablished ? 'Established' : 'Mark as Established'}
      </button>
      {isEstablished && (
        <button
          type="button"
          onClick={handleToggle}
          disabled={pending}
          style={{ fontSize: '0.75rem', color: 'rgba(240,237,232,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Remove
        </button>
      )}
    </div>
  )
}
