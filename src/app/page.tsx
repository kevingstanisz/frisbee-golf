import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export const revalidate = 0

export default async function HomePage() {
  const [{ data: players }, { data: scores }, { data: courses }] = await Promise.all([
    supabase.from('players').select('id, name'),
    supabase.from('scores').select('player_id, strokes, rounds(course_config_id)'),
    supabase.from('courses').select('id, course_configs(id, established)'),
  ])

  // Build configId → DB established flag
  const configDbEstablished: Record<string, boolean> = {}
  for (const c of courses ?? []) {
    for (const cfg of (c.course_configs as { id: string; established: boolean }[]) ?? []) {
      configDbEstablished[cfg.id] = cfg.established
    }
  }

  // Count unique players and scores per config (for auto-established)
  const playersByConfig: Record<string, Set<string>> = {}
  const scoreCountByConfig: Record<string, number> = {}
  for (const score of scores ?? []) {
    const configId = (score.rounds as unknown as { course_config_id: string } | null)?.course_config_id
    if (!configId) continue
    if (!playersByConfig[configId]) playersByConfig[configId] = new Set()
    playersByConfig[configId].add(score.player_id)
    scoreCountByConfig[configId] = (scoreCountByConfig[configId] ?? 0) + 1
  }

  const establishedConfigIds = new Set(
    Object.keys(configDbEstablished).filter((cfgId) =>
      configDbEstablished[cfgId] ||
      ((playersByConfig[cfgId]?.size ?? 0) >= 3 && (scoreCountByConfig[cfgId] ?? 0) >= 5)
    )
  )

  // Compute fractional record points per player — established configs only
  const configScores: Record<string, { playerId: string; strokes: number }[]> = {}
  for (const score of scores ?? []) {
    const configId = (score.rounds as unknown as { course_config_id: string } | null)?.course_config_id
    if (!configId || !establishedConfigIds.has(configId)) continue
    if (!configScores[configId]) configScores[configId] = []
    configScores[configId].push({ playerId: score.player_id, strokes: score.strokes })
  }

  const recordPoints: Record<string, number> = {}
  for (const entries of Object.values(configScores)) {
    const min = Math.min(...entries.map((e) => e.strokes))
    const holders = entries.filter((e) => e.strokes === min)
    const share = 1 / holders.length
    for (const h of holders) {
      recordPoints[h.playerId] = (recordPoints[h.playerId] ?? 0) + share
    }
  }

  const playerMap = Object.fromEntries((players ?? []).map((p) => [p.id, p.name]))
  const leaderboard = Object.entries(recordPoints)
    .map(([playerId, points]) => ({ playerId, points, name: playerMap[playerId] ?? 'Unknown' }))
    .sort((a, b) => b.points - a.points)

  const totalRecords = Object.keys(configScores).length

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl">Frisbee Golf</h1>
        <Link href="/rounds/new" className="btn-primary">+ Enter Round</Link>
      </div>

      <div className="card">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-2xl">Records Leaderboard</h2>
          {totalRecords > 0 && (
            <span style={{ color: 'rgba(240,237,232,0.4)', fontSize: '0.85rem' }}>
              {totalRecords} course config{totalRecords !== 1 ? 's' : ''} played
            </span>
          )}
        </div>

        {leaderboard.length === 0 ? (
          <p style={{ color: 'rgba(240,237,232,0.5)' }}>
            No established courses yet. Visit a course page to mark it as Established.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: 'rgba(240,237,232,0.4)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <th style={{ textAlign: 'left', paddingBottom: '0.75rem', width: '2.5rem' }}>#</th>
                <th style={{ textAlign: 'left', paddingBottom: '0.75rem' }}>Player</th>
                <th style={{ textAlign: 'right', paddingBottom: '0.75rem' }}>Records</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, i) => (
                <tr key={entry.playerId} style={{ borderTop: '1px solid var(--net)' }}>
                  <td style={{ padding: '0.875rem 0', color: 'rgba(240,237,232,0.4)' }}>{i + 1}</td>
                  <td style={{ padding: '0.875rem 0', fontWeight: i === 0 ? 600 : 400 }}>{entry.name}</td>
                  <td style={{ padding: '0.875rem 0', textAlign: 'right', color: 'var(--gold)', fontWeight: 600, fontSize: '1.1rem' }}>
                    {Number.isInteger(entry.points) ? entry.points : entry.points.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  )
}
