'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Course } from '@/lib/types'
import Link from 'next/link'

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('courses')
      .select('*, course_configs(id, name)')
      .order('name')
      .then(({ data }) => {
        setCourses(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl">Courses</h1>
        <Link href="/courses/new" className="btn-primary">+ Add Course</Link>
      </div>

      {loading ? (
        <p style={{ color: 'rgba(240,237,232,0.5)' }} className="pulse">Loading…</p>
      ) : courses.length === 0 ? (
        <p style={{ color: 'rgba(240,237,232,0.5)' }}>
          No courses yet.{' '}
          <Link href="/courses/new" style={{ color: 'var(--accent)' }}>Add one.</Link>
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {courses.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card" style={{ padding: '1rem 1.25rem', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--net)')}>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{course.name}</div>
                <div style={{ color: 'rgba(240,237,232,0.5)', fontSize: '0.85rem' }}>
                  {course.holes} holes · {course.course_configs?.length ?? 0} config{(course.course_configs?.length ?? 0) !== 1 ? 's' : ''}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
