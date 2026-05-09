'use client'

import { useState, useTransition } from 'react'
import { toggleConfigEstablished } from '@/app/actions'

export default function EstablishedToggle({
  configId,
  courseId,
  established,
}: {
  configId: string
  courseId: string
  established: boolean
}) {
  const [isEstablished, setIsEstablished] = useState(established)
  const [pending, startTransition] = useTransition()

  function handleToggle() {
    const next = !isEstablished
    setIsEstablished(next)
    startTransition(() => toggleConfigEstablished(configId, courseId, next))
  }

  return (
    <div style={{ marginTop: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        style={{
          fontSize: '0.75rem',
          padding: '0.3rem 0.8rem',
          borderRadius: '4px',
          border: isEstablished ? '1px solid var(--gold)' : '1px solid rgba(240,237,232,0.2)',
          background: isEstablished ? 'rgba(255,200,60,0.08)' : 'transparent',
          color: isEstablished ? 'var(--gold)' : 'rgba(240,237,232,0.4)',
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
          style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.25)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Remove
        </button>
      )}
    </div>
  )
}
