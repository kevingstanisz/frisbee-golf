'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createCourse, createTag } from '@/app/actions'
import { Tag } from '@/lib/types'

type ConfigDraft = { name: string; par: string }

export default function NewCoursePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [holes, setHoles] = useState(18)
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [configs, setConfigs] = useState<ConfigDraft[]>([{ name: '', par: '54' }])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('tags').select('*').order('name').then(({ data }) => setAllTags(data ?? []))
  }, [])

  const toggleTag = (id: string) =>
    setSelectedTagIds((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id])

  const addTag = async () => {
    const trimmed = tagInput.trim().toLowerCase()
    if (!trimmed) return
    const existing = allTags.find((t) => t.name === trimmed)
    if (existing) {
      if (!selectedTagIds.includes(existing.id)) setSelectedTagIds((prev) => [...prev, existing.id])
      setTagInput('')
      return
    }
    try {
      const tag = await createTag(trimmed)
      setAllTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)))
      setSelectedTagIds((prev) => [...prev, tag.id])
      setTagInput('')
    } catch {
      setError('Failed to create tag')
    }
  }

  const updateConfig = (i: number, field: keyof ConfigDraft, val: string) =>
    setConfigs((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c))

  const addConfig = () => setConfigs((prev) => [...prev, { name: '', par: '54' }])
  const removeConfig = (i: number) => setConfigs((prev) => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Course name is required'); return }
    const validConfigs = configs
      .filter((c) => c.name.trim())
      .map((c) => ({ name: c.name.trim(), par: Number(c.par) || 54 }))
    if (validConfigs.length === 0) { setError('Add at least one configuration'); return }
    setSubmitting(true)
    setError('')
    try {
      const course = await createCourse(name, holes, selectedTagIds, validConfigs)
      router.push(`/courses/${course.id}`)
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong')
      setSubmitting(false)
    }
  }

  const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: 'rgba(240,237,232,0.5)',
    marginBottom: '0.5rem',
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
          <label style={labelStyle}>Tags</label>
          {allTags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
              {allTags.map((tag) => {
                const active = selectedTagIds.includes(tag.id)
                return (
                  <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)} style={{
                    padding: '0.25rem 0.75rem', borderRadius: '999px', border: '1px solid',
                    borderColor: active ? 'var(--accent)' : 'var(--net)',
                    background: active ? 'rgba(233,69,96,0.15)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--chalk)', cursor: 'pointer', fontSize: '0.85rem',
                  }}>
                    {tag.name}
                  </button>
                )
              })}
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="New tag…" style={{ flex: 1 }} />
            <button type="button" onClick={addTag} className="btn-ghost">Add</button>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Configurations</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {configs.map((cfg, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input type="text" value={cfg.name} onChange={(e) => updateConfig(i, 'name', e.target.value)}
                  placeholder={`e.g. ${i === 0 ? 'Short tees' : i === 1 ? 'Long tees' : 'Blue pins'}`}
                  style={{ flex: 1 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(240,237,232,0.4)' }}>Par</span>
                  <input type="text" value={cfg.par} onChange={(e) => updateConfig(i, 'par', e.target.value)}
                    style={{ width: '3.5rem', textAlign: 'center' }} />
                </div>
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
