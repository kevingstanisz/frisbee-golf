import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export const revalidate = 0

export default async function PlayersPage() {
  const [{ data: players }, { data: allScores }, { data: courses }] = await Promise.all([
    supabase.from('players').select('id, name').order('name'),
    supabase.from('scores').select('player_id, strokes, rounds(course_config_id)'),
    supabase.from('courses').select('id, course_configs(id, established)'),
  ])

  // Build established config ids
  const configDbEstablished: Record<string, boolean> = {}
  for (const c of courses ?? []) {
    for (const cfg of (c.course_configs as { id: string; established: boolean }[]) ?? []) {
      configDbEstablished[cfg.id] = cfg.established
    }
  }

  const playersByConfig: Record<string, Set<string>> = {}
  const scoreCountByConfig: Record<string, number> = {}
  const playerRoundCount: Record<string, number> = {}

  for (const score of allScores ?? []) {
    playerRoundCount[score.player_id] = (playerRoundCount[score.player_id] ?? 0) + 1
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

  // Compute record points per player from established configs
  const configScores: Record<string, { playerId: string; strokes: number }[]> = {}
  for (const score of allScores ?? []) {
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

  const playerList = (players ?? [])
    .map((p) => ({
      id: p.id,
      name: p.name,
      rounds: playerRoundCount[p.id] ?? 0,
      records: recordPoints[p.id] ?? 0,
    }))
    .sort((a, b) => b.records - a.records || b.rounds - a.rounds || a.name.localeCompare(b.name))

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display text-4xl mb-8">Players</h1>

      <div className="card">
        {playerList.length === 0 ? (
          <p style={{ color: 'rgba(240,237,232,0.5)' }}>No players yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: 'rgba(240,237,232,0.4)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <th style={{ textAlign: 'left', paddingBottom: '0.75rem', width: '2.5rem' }}>#</th>
                <th style={{ textAlign: 'left', paddingBottom: '0.75rem' }}>Player</th>
                <th style={{ textAlign: 'right', paddingBottom: '0.75rem' }}>Rounds</th>
                <th style={{ textAlign: 'right', paddingBottom: '0.75rem' }}>Records</th>
              </tr>
            </thead>
            <tbody>
              {playerList.map((p, i) => (
                <tr key={p.id} style={{ borderTop: '1px solid var(--net)' }}>
                  <td style={{ padding: '0.875rem 0', color: 'rgba(240,237,232,0.4)' }}>{i + 1}</td>
                  <td style={{ padding: '0.875rem 0', fontWeight: i === 0 ? 600 : 400 }}>
                    <Link href={`/players/${p.id}`} style={{ color: 'var(--chalk)', textDecoration: 'none' }}>
                      {p.name}
                    </Link>
                  </td>
                  <td style={{ padding: '0.875rem 0', textAlign: 'right', color: 'rgba(240,237,232,0.5)', fontSize: '0.95rem' }}>
                    {p.rounds}
                  </td>
                  <td style={{ padding: '0.875rem 0', textAlign: 'right', color: p.records > 0 ? 'var(--gold)' : 'rgba(240,237,232,0.25)', fontWeight: 600, fontSize: '1.05rem' }}>
                    {p.records === 0 ? '—' : Number.isInteger(p.records) ? p.records : p.records.toFixed(1)}
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
