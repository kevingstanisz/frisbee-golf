'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCourse } from '@/app/actions'

export default function NewCoursePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [holes, setHoles] = useState(18)
  const [configs, setConfigs] = useState<string[]>([''])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const updateConfig = (i: number, val: string) =>
    setConfigs((prev) => prev.map((c, idx) => (idx === i ? val : c)))
  const addConfig = () => setConfigs((prev) => [...prev, ''])
  const removeConfig = (i: number) => setConfigs((prev) => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Course name is required'); return }
    const validConfigs = configs.map((c) => c.trim()).filter(Boolean)
    if (validConfigs.length === 0) { setError('Add at least one configuration'); return }
    setSubmitting(true)
    setError('')
    try {
      const course = await createCourse(name, holes, validConfigs)
      router.push(`/courses/${course.id}`)
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong')
      setSubmitting(false)
    }
  }

  const labelStyle = {
    display: 'block', fontSize: '0.8rem', textTransform: 'uppercase' as const,
    letterSpacing: '0.08em', color: 'rgba(240,237,232,0.5)', marginBottom: '0.5rem',
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <div style={{ marginBottom: '0.5rem' }}>
        <a href="/courses" style={{ color: 'rgba(240,237,232,0.4)', fontSize: '0.9rem', textDecoration: 'none' }}>← Courses</a>
      </div>
      <h1 className="font-display text-4xl" style={{ marginBottom: '2rem' }}>Add Course</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={labelStyle}>Course Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Wobbly Pines" />
        </div>

        <div>
          <label style={labelStyle}>Number of Holes</label>
          <input type="text" value={holes} onChange={(e) => setHoles(Number(e.target.value) || 18)} style={{ width: '6rem' }} />
        </div>

        <div>
          <label style={labelStyle}>Configurations</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {configs.map((cfg, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text" value={cfg}
                  onChange={(e) => updateConfig(i, e.target.value)}
                  placeholder={i === 0 ? 'e.g. White tees' : i === 1 ? 'e.g. Blue tees' : 'e.g. Red pins'}
                />
                {configs.length > 1 && (
                  <button type="button" onClick={() => removeConfig(i)}
                    style={{ background: 'none', border: 'none', color: 'rgba(240,237,232,0.4)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, flexShrink: 0 }}>
                    ×
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addConfig} className="btn-ghost" style={{ alignSelf: 'flex-start' }}>
              + Add Config
            </button>
          </div>
        </div>

        {error && <p style={{ color: 'var(--accent)' }}>{error}</p>}

        <button type="button" onClick={handleSubmit} className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Create Course'}
        </button>
      </div>
    </main>
  )
}
