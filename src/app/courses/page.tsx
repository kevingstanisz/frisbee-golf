'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type ScoreEntry = { playerName: string; score: number; configName: string }
type CourseData = {
  id: string
  name: string
  holes: number
  configCount: number
  roundCount: number
  established: boolean
  topScores: ScoreEntry[]
}

const fmt = (n: number) => (n === 0 ? 'E' : n > 0 ? `+${n}` : `${n}`)

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseData[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: coursesRaw } = await supabase
        .from('courses')
        .select('id, name, holes, course_configs(id, name, established)')
        .order('name')

      if (!coursesRaw) { setLoading(false); return }

      const allConfigIds = coursesRaw.flatMap((c: any) => c.course_configs.map((cfg: any) => cfg.id))

      const { data: scores } = await supabase
        .from('scores')
        .select('player_id, strokes, players(name), rounds(course_config_id)')
        .in('rounds.course_config_id', allConfigIds.length ? allConfigIds : ['none'])

      // Build config lookup: configId → { courseId, configName, dbEstablished }
      const configMeta: Record<string, { courseId: string; configName: string; dbEstablished: boolean }> = {}
      for (const c of coursesRaw as any[]) {
        for (const cfg of c.course_configs) {
          configMeta[cfg.id] = { courseId: c.id, configName: cfg.name, dbEstablished: cfg.established }
        }
      }

      // Group scores by config
      const byConfig: Record<string, ScoreEntry[]> = {}
      const playersByConfig: Record<string, Set<string>> = {}

      for (const score of scores ?? []) {
        const round = score.rounds as unknown as { course_config_id: string } | null
        if (!round) continue
        const meta = configMeta[round.course_config_id]
        if (!meta) continue
        const cfgId = round.course_config_id
        if (!byConfig[cfgId]) byConfig[cfgId] = []
        if (!playersByConfig[cfgId]) playersByConfig[cfgId] = new Set()
        playersByConfig[cfgId].add(score.player_id)
        byConfig[cfgId].push({
          playerName: (score.players as unknown as { name: string } | null)?.name ?? 'Unknown',
          score: score.strokes,
          configName: meta.configName,
        })
      }

      // Determine effective established per config
      const configEstablished: Record<string, boolean> = {}
      for (const [cfgId, meta] of Object.entries(configMeta)) {
        const uniquePlayers = playersByConfig[cfgId]?.size ?? 0
        const totalScores = byConfig[cfgId]?.length ?? 0
        configEstablished[cfgId] = meta.dbEstablished || (uniquePlayers >= 3 && totalScores >= 5)
      }

      const result: CourseData[] = (coursesRaw as any[]).map((c) => {
        const cfgs: any[] = c.course_configs
        const singleConfig = cfgs.length === 1
        const totalScores = cfgs.reduce((sum: number, cfg: any) => sum + (byConfig[cfg.id]?.length ?? 0), 0)
        const anyEstablished = cfgs.some((cfg: any) => configEstablished[cfg.id])

        // Top scores: all if single config, else established configs only
        const eligibleEntries: ScoreEntry[] = []
        for (const cfg of cfgs) {
          if (singleConfig || configEstablished[cfg.id]) {
            eligibleEntries.push(...(byConfig[cfg.id] ?? []))
          }
        }
        const sorted = [...eligibleEntries].sort((a, b) => a.score - b.score)

        return {
          id: c.id,
          name: c.name,
          holes: c.holes,
          configCount: cfgs.length,
          roundCount: totalScores,
          established: anyEstablished,
          topScores: sorted.slice(0, 5),
        }
      })

      result.sort((a, b) => b.roundCount - a.roundCount)
      setCourses(result)
      setLoading(false)
    }
    load()
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
          No courses yet. <Link href="/courses/new" style={{ color: 'var(--accent)' }}>Add one.</Link>
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {courses.map((course) => {
            const isExpanded = expanded === course.id
            const leader = course.topScores[0]

            return (
              <div key={course.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setExpanded(isExpanded ? null : course.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1rem 1.25rem', background: 'none', border: 'none',
                    color: 'var(--chalk)', cursor: 'pointer', textAlign: 'left', gap: '1rem',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '1rem' }}>{course.name}</span>
                      {course.established && (
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: '3px', padding: '0.05rem 0.35rem', opacity: 0.85 }}>
                          Established
                        </span>
                      )}
                    </div>
                    <div style={{ color: 'rgba(240,237,232,0.45)', fontSize: '0.8rem' }}>
                      {course.holes} holes · {course.configCount} config{course.configCount !== 1 ? 's' : ''} · {course.roundCount} round{course.roundCount !== 1 ? 's' : ''}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                    {leader && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(240,237,232,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Leader</div>
                        <div style={{ fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--gold)', marginRight: '0.35rem' }}>★</span>
                          <span style={{ fontWeight: 600 }}>{leader.playerName}</span>
                          <span style={{ color: leader.score < 0 ? '#4ade80' : leader.score > 0 ? 'var(--accent)' : 'var(--chalk)', marginLeft: '0.4rem', fontWeight: 700 }}>
                            {fmt(leader.score)}
                          </span>
                        </div>
                      </div>
                    )}
                    <span style={{ color: 'rgba(240,237,232,0.3)', fontSize: '0.9rem', transition: 'transform 0.2s', display: 'inline-block', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▾</span>
                  </div>
                </button>

                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--net)', padding: '0.875rem 1.25rem 1rem' }}>
                    {course.topScores.length === 0 ? (
                      <p style={{ color: 'rgba(240,237,232,0.4)', fontSize: '0.9rem' }}>
                        {course.configCount > 1 ? 'No established configurations yet.' : 'No rounds yet.'}
                      </p>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0.875rem' }}>
                        <tbody>
                          {course.topScores.map((entry, i) => {
                            const scoreColor = entry.score < 0 ? '#4ade80' : entry.score > 0 ? 'var(--accent)' : 'var(--chalk)'
                            return (
                              <tr key={i} style={{ borderBottom: '1px solid var(--net)' }}>
                                <td style={{ padding: '0.5rem 0', color: 'rgba(240,237,232,0.35)', width: '1.5rem', fontSize: '0.85rem' }}>{i + 1}</td>
                                <td style={{ padding: '0.5rem 0', fontWeight: i === 0 ? 600 : 400, fontSize: '0.9rem' }}>
                                  {i === 0 && <span style={{ color: 'var(--gold)', marginRight: '0.3rem' }}>★</span>}
                                  {entry.playerName}
                                </td>
                                <td style={{ padding: '0.5rem 0', color: 'rgba(240,237,232,0.4)', fontSize: '0.78rem', textAlign: 'center' }}>
                                  {entry.configName}
                                </td>
                                <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: i === 0 ? 700 : 500, color: i === 0 ? 'var(--gold)' : scoreColor, fontSize: '0.95rem' }}>
                                  {fmt(entry.score)}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                    <Link
                      href={`/courses/${course.id}`}
                      style={{ fontSize: '0.85rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
                    >
                      View full course →
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
