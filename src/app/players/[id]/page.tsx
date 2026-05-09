import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 0

const fmt = (n: number) => (n === 0 ? 'E' : n > 0 ? `+${n}` : `${n}`)

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [{ data: player }, { data: allScores }, { data: allConfigs }] = await Promise.all([
    supabase.from('players').select('id, name').eq('id', id).single(),
    supabase.from('scores').select('player_id, strokes, rounds(course_config_id, played_at, historical)'),
    supabase.from('course_configs').select('id, name, established, courses(id, name)'),
  ])

  if (!player) notFound()

  // Build config lookup
  const configInfo: Record<string, { name: string; courseName: string; courseId: string; dbEstablished: boolean }> = {}
  for (const cfg of allConfigs ?? []) {
    const course = cfg.courses as unknown as { id: string; name: string } | null
    configInfo[cfg.id] = {
      name: cfg.name,
      courseName: course?.name ?? 'Unknown',
      courseId: course?.id ?? '',
      dbEstablished: cfg.established,
    }
  }

  // Count unique players and scores per config for auto-established
  const playersByConfig: Record<string, Set<string>> = {}
  const scoreCountByConfig: Record<string, number> = {}
  for (const score of allScores ?? []) {
    const configId = (score.rounds as unknown as { course_config_id: string } | null)?.course_config_id
    if (!configId) continue
    if (!playersByConfig[configId]) playersByConfig[configId] = new Set()
    playersByConfig[configId].add(score.player_id)
    scoreCountByConfig[configId] = (scoreCountByConfig[configId] ?? 0) + 1
  }

  const establishedConfigIds = new Set(
    Object.keys(configInfo).filter((cfgId) =>
      configInfo[cfgId].dbEstablished ||
      ((playersByConfig[cfgId]?.size ?? 0) >= 3 && (scoreCountByConfig[cfgId] ?? 0) >= 5)
    )
  )

  // Compute which established configs this player holds the record for
  const configScores: Record<string, { playerId: string; strokes: number }[]> = {}
  for (const score of allScores ?? []) {
    const configId = (score.rounds as unknown as { course_config_id: string } | null)?.course_config_id
    if (!configId || !establishedConfigIds.has(configId)) continue
    if (!configScores[configId]) configScores[configId] = []
    configScores[configId].push({ playerId: score.player_id, strokes: score.strokes })
  }

  type RecordEntry = { configId: string; configName: string; courseName: string; score: number; share: number }
  const myRecords: RecordEntry[] = []
  for (const [configId, entries] of Object.entries(configScores)) {
    const min = Math.min(...entries.map((e) => e.strokes))
    const holders = entries.filter((e) => e.strokes === min)
    if (holders.some((h) => h.playerId === id)) {
      const info = configInfo[configId]
      myRecords.push({
        configId,
        configName: info?.name ?? 'Unknown',
        courseName: info?.courseName ?? 'Unknown',
        score: min,
        share: 1 / holders.length,
      })
    }
  }
  myRecords.sort((a, b) => a.courseName.localeCompare(b.courseName) || a.configName.localeCompare(b.configName))
  const totalRecords = myRecords.reduce((sum, r) => sum + r.share, 0)

  // Round history for this player
  type HistoryEntry = { configName: string; courseName: string; score: number; playedAt: string; historical: boolean }
  const history: HistoryEntry[] = []
  for (const score of allScores ?? []) {
    if (score.player_id !== id) continue
    const round = score.rounds as unknown as { course_config_id: string; played_at: string; historical: boolean } | null
    if (!round) continue
    const info = configInfo[round.course_config_id]
    history.push({
      configName: info?.name ?? 'Unknown',
      courseName: info?.courseName ?? 'Unknown',
      score: score.strokes,
      playedAt: round.played_at,
      historical: round.historical ?? false,
    })
  }
  history.sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div style={{ marginBottom: '0.5rem' }}>
        <Link href="/players" style={{ color: 'rgba(240,237,232,0.4)', fontSize: '0.9rem', textDecoration: 'none' }}>
          ← Players
        </Link>
      </div>

      <h1 className="font-display text-4xl" style={{ marginBottom: '2rem' }}>{player.name}</h1>

      {/* Records */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-2xl">Records</h2>
          {totalRecords > 0 && (
            <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '1.1rem' }}>
              {Number.isInteger(totalRecords) ? totalRecords : totalRecords.toFixed(1)}
            </span>
          )}
        </div>
        {myRecords.length === 0 ? (
          <p style={{ color: 'rgba(240,237,232,0.5)', fontSize: '0.9rem' }}>No records held yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {myRecords.map((r, i) => {
                const scoreColor = r.score < 0 ? '#4ade80' : r.score > 0 ? 'var(--accent)' : 'var(--chalk)'
                return (
                  <tr key={i} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--net)' }}>
                    <td style={{ padding: '0.6rem 0' }}>
                      <span style={{ color: 'var(--gold)', marginRight: '0.5rem' }}>★</span>
                      <span style={{ fontWeight: 500 }}>{r.courseName}</span>
                      <span style={{ color: 'rgba(240,237,232,0.4)', marginLeft: '0.4rem', fontSize: '0.85rem' }}>· {r.configName}</span>
                    </td>
                    <td style={{ padding: '0.6rem 0', textAlign: 'right' }}>
                      {r.share < 1 && (
                        <span style={{ fontSize: '0.75rem', color: 'rgba(240,237,232,0.35)', marginRight: '0.5rem' }}>tied</span>
                      )}
                      <span style={{ fontWeight: 700, color: scoreColor, fontSize: '0.95rem' }}>{fmt(r.score)}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Round History */}
      <div className="card">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-2xl">Round History</h2>
          <span style={{ color: 'rgba(240,237,232,0.4)', fontSize: '0.85rem' }}>
            {history.length} round{history.length !== 1 ? 's' : ''}
          </span>
        </div>
        {history.length === 0 ? (
          <p style={{ color: 'rgba(240,237,232,0.5)', fontSize: '0.9rem' }}>No rounds yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {history.map((entry, i) => {
                const scoreColor = entry.score < 0 ? '#4ade80' : entry.score > 0 ? 'var(--accent)' : 'var(--chalk)'
                return (
                  <tr key={i} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--net)' }}>
                    <td style={{ padding: '0.65rem 0' }}>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{entry.courseName}</div>
                      <div style={{ color: 'rgba(240,237,232,0.4)', fontSize: '0.78rem' }}>{entry.configName}</div>
                    </td>
                    <td style={{ padding: '0.65rem 0', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {entry.historical && (
                        <span style={{ marginRight: '0.5rem', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', color: 'rgba(240,237,232,0.35)', border: '1px solid rgba(240,237,232,0.2)', borderRadius: '3px', padding: '0.05rem 0.3rem', verticalAlign: 'middle' }}>
                          OG
                        </span>
                      )}
                      <span style={{ fontWeight: 700, color: scoreColor, fontSize: '1rem' }}>{fmt(entry.score)}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  )
}
