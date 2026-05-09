import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import EstablishedToggle from './EstablishedToggle'

export const revalidate = 0

const fmt = (n: number) => (n === 0 ? 'E' : n > 0 ? `+${n}` : `${n}`)

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: course } = await supabase
    .from('courses')
    .select('*, course_configs(id, name, created_at, established)')
    .eq('id', id)
    .single()

  if (!course) notFound()

  const configs: { id: string; name: string; established: boolean }[] = course.course_configs ?? []
  const configIds = configs.map((c) => c.id)

  const { data: allScores } = await supabase
    .from('scores')
    .select('player_id, strokes, players(name), rounds(course_config_id, played_at, historical)')
    .in('rounds.course_config_id', configIds.length > 0 ? configIds : ['none'])

  const scoresByConfig: Record<string, { playerName: string; score: number; playedAt: string; historical: boolean }[]> = {}
  const playersByConfig: Record<string, Set<string>> = {}

  for (const score of allScores ?? []) {
    const round = score.rounds as unknown as { course_config_id: string; played_at: string; historical: boolean } | null
    if (!round) continue
    const cid = round.course_config_id
    if (!scoresByConfig[cid]) scoresByConfig[cid] = []
    if (!playersByConfig[cid]) playersByConfig[cid] = new Set()
    playersByConfig[cid].add(score.player_id)
    scoresByConfig[cid].push({
      playerName: (score.players as unknown as { name: string } | null)?.name ?? 'Unknown',
      score: score.strokes,
      playedAt: round.played_at,
      historical: round.historical ?? false,
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
        <h1 className="font-display text-4xl" style={{ marginBottom: '0.25rem' }}>{course.name}</h1>
        <span style={{ color: 'rgba(240,237,232,0.5)', fontSize: '0.9rem' }}>{course.holes} holes</span>
      </div>

      {configs.length === 0 ? (
        <div className="card">
          <p style={{ color: 'rgba(240,237,232,0.5)' }}>No configurations yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {configs.map((config) => {
            const entries = scoresByConfig[config.id] ?? []
            const sorted = [...entries].sort((a, b) => a.score - b.score)
            const best = sorted[0]?.score
            const uniquePlayers = playersByConfig[config.id]?.size ?? 0
            const autoEstablished = uniquePlayers >= 3 && entries.length >= 5
            const isEstablished = config.established || autoEstablished

            return (
              <div key={config.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                  <h2 className="font-display text-2xl">{config.name}</h2>
                  {isEstablished && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: '3px', padding: '0.05rem 0.35rem', opacity: 0.85 }}>
                      Established
                    </span>
                  )}
                </div>

                {sorted.length === 0 ? (
                  <p style={{ color: 'rgba(240,237,232,0.5)', fontSize: '0.9rem' }}>No rounds yet.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ color: 'rgba(240,237,232,0.4)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        <th style={{ textAlign: 'left', paddingBottom: '0.75rem', width: '2.5rem' }}>#</th>
                        <th style={{ textAlign: 'left', paddingBottom: '0.75rem' }}>Player</th>
                        <th style={{ textAlign: 'right', paddingBottom: '0.75rem' }}>Score</th>
                        <th style={{ textAlign: 'right', paddingBottom: '0.75rem' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((entry, i) => {
                        const isRecord = entry.score === best
                        const scoreColor = entry.score < 0 ? '#4ade80' : entry.score > 0 ? 'var(--accent)' : 'var(--chalk)'
                        return (
                          <tr key={i} style={{ borderTop: '1px solid var(--net)' }}>
                            <td style={{ padding: '0.75rem 0', color: 'rgba(240,237,232,0.4)' }}>{i + 1}</td>
                            <td style={{ padding: '0.75rem 0', fontWeight: isRecord ? 600 : 400 }}>
                              {isRecord && <span style={{ color: 'var(--gold)', marginRight: '0.4rem' }}>★</span>}
                              {entry.playerName}
                              {entry.historical && (
                                <span style={{ marginLeft: '0.4rem', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', color: 'rgba(240,237,232,0.35)', border: '1px solid rgba(240,237,232,0.2)', borderRadius: '3px', padding: '0.05rem 0.3rem', verticalAlign: 'middle' }}>
                                  OG
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: isRecord ? 700 : 500, color: isRecord ? 'var(--gold)' : scoreColor }}>
                              {fmt(entry.score)}
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

                {!autoEstablished && (
                  <EstablishedToggle configId={config.id} courseId={course.id} established={config.established} />
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
