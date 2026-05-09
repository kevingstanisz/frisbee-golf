'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Course, Tag } from '@/lib/types'
import Link from 'next/link'

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: coursesData }, { data: tagsData }] = await Promise.all([
        supabase
          .from('courses')
          .select('*, course_tags(tags(id, name)), course_configs(id, name)')
          .order('name'),
        supabase.from('tags').select('*').order('name'),
      ])

      const normalized = (coursesData ?? []).map((c: any) => ({
        ...c,
        tags: c.course_tags?.map((ct: any) => ct.tags).filter(Boolean) ?? [],
      }))

      setCourses(normalized)
      setAllTags(tagsData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered =
    selectedTags.length === 0
      ? courses
      : courses.filter((c) =>
          selectedTags.every((tagId) => c.tags?.some((t) => t.id === tagId))
        )

  const toggleTag = (id: string) =>
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl">Courses</h1>
        <Link href="/courses/new" className="btn-primary">+ Add Course</Link>
      </div>

      {allTags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {allTags.map((tag) => {
            const active = selectedTags.includes(tag.id)
            return (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  border: '1px solid',
                  borderColor: active ? 'var(--accent)' : 'var(--net)',
                  background: active ? 'rgba(233,69,96,0.15)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--chalk)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  transition: 'all 0.15s',
                }}
              >
                {tag.name}
              </button>
            )
          })}
          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem', color: 'rgba(240,237,232,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'rgba(240,237,232,0.5)' }} className="pulse">Loading…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'rgba(240,237,232,0.5)' }}>
          {courses.length === 0 ? (
            <>No courses yet. <Link href="/courses/new" style={{ color: 'var(--accent)' }}>Add one.</Link></>
          ) : (
            'No courses match the selected tags.'
          )}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                className="card"
                style={{ padding: '1rem 1.25rem', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--net)')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{course.name}</div>
                    <div style={{ color: 'rgba(240,237,232,0.5)', fontSize: '0.85rem' }}>
                      {course.holes} holes · {course.course_configs?.length ?? 0} config{(course.course_configs?.length ?? 0) !== 1 ? 's' : ''}
                    </div>
                  </div>
                  {course.tags && course.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '55%' }}>
                      {course.tags.map((tag) => (
                        <span
                          key={tag.id}
                          style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: '999px',
                            background: 'rgba(255,255,255,0.06)',
                            fontSize: '0.75rem',
                            color: 'rgba(240,237,232,0.6)',
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
