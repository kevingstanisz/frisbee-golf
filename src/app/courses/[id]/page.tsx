import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 0

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: course } = await supabase
    .from('courses')
    .select('*, course_tags(tags(id, name)), course_configs(id, name, created_at)')
    .eq('id', id)
    .single()

  if (!course) notFound()

  const tags = course.course_tags?.map((ct: any) => ct.tags).filter(Boolean) ?? []
  const configs: { id: string; name: string }[] = course.course_configs ?? []

  // Load all scores for all configs of this course
  const configIds = configs.map((c) => c.id)
  const { data: allScores } = await supabase
    .from('scores')
    .select('player_id, strokes, round_id, players(name), rounds(course_config_id, played_at)')
    .in('rounds.course_config_id', configIds.length > 0 ? configIds : ['none'])

  // Group scores by config
  const scoresByConfig: Record<string, { playerName: string; strokes: number; playedAt: string }[]> = {}
  for (const score of allScores ?? []) {
    const round = score.rounds as unknown as { course_config_id: string; played_at: string } | null
    if (!round) continue
    const cid = round.course_config_id
    if (!scoresByConfig[cid]) scoresByConfig[cid] = []
    scoresByConfig[cid].push({
      playerName: (score.players as unknown as { name: string } | null)?.name ?? 'Unknown',
      strokes: score.strokes,
      playedAt: round.played_at,
    })
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div style={{ marginBottom: '0.5rem' }}>
        <Link href="/courses" style={{ color: 'rgba(240,237,232,0.4)', fontSize: '0.9rem', textDecoration: 'none' }}>
          ← Courses
        </Link>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h1 className="font-display text-4xl" style={{ marginBottom: '0.5rem' }}>{course.name}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ color: 'rgba(240,237,232,0.5)', fontSize: '0.9rem' }}>{course.holes} holes</span>
          {tags.map((tag: { id: string; name: string }) => (
            <span
              key={tag.id}
              style={{
                padding: '0.15rem 0.6rem',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.06)',
                fontSize: '0.8rem',
                color: 'rgba(240,237,232,0.6)',
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      </div>

      {configs.length === 0 ? (
        <div className="card">
          <p style={{ color: 'rgba(240,237,232,0.5)' }}>No configurations yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {configs.map((config) => {
            const entries = scoresByConfig[config.id] ?? []
            const sorted = [...entries].sort((a, b) => a.strokes - b.strokes)
            const min = sorted[0]?.strokes
            return (
              <div key={config.id} className="card">
                <h2 className="font-display text-2xl" style={{ marginBottom: '1rem' }}>{config.name}</h2>
                {sorted.length === 0 ? (
                  <p style={{ color: 'rgba(240,237,232,0.5)', fontSize: '0.9rem' }}>No rounds yet.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ color: 'rgba(240,237,232,0.4)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        <th style={{ textAlign: 'left', paddingBottom: '0.75rem', width: '2.5rem' }}>#</th>
                        <th style={{ textAlign: 'left', paddingBottom: '0.75rem' }}>Player</th>
                        <th style={{ textAlign: 'right', paddingBottom: '0.75rem' }}>Strokes</th>
                        <th style={{ textAlign: 'right', paddingBottom: '0.75rem' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((entry, i) => {
                        const isRecord = entry.strokes === min
                        return (
                          <tr key={i} style={{ borderTop: '1px solid var(--net)' }}>
                            <td style={{ padding: '0.75rem 0', color: 'rgba(240,237,232,0.4)' }}>{i + 1}</td>
                            <td style={{ padding: '0.75rem 0', fontWeight: isRecord ? 600 : 400 }}>
                              {isRecord && <span style={{ color: 'var(--gold)', marginRight: '0.4rem' }}>★</span>}
                              {entry.playerName}
                            </td>
                            <td style={{ padding: '0.75rem 0', textAlign: 'right', color: isRecord ? 'var(--gold)' : 'inherit', fontWeight: isRecord ? 600 : 400 }}>
                              {entry.strokes}
                            </td>
                            <td style={{ padding: '0.75rem 0', textAlign: 'right', color: 'rgba(240,237,232,0.4)', fontSize: '0.85rem' }}>
                              {new Date(entry.playedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Link href="/rounds/new" className="btn-primary">+ Enter Round</Link>
      </div>
    </main>
  )
}
