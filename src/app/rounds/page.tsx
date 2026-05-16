import { supabase } from '@/lib/supabase'

export const revalidate = 0

const fmt = (n: number) => (n === 0 ? 'E' : n > 0 ? `+${n}` : `${n}`)

type RoundRow = {
  id: string
  played_at: string
  course_configs: {
    id: string
    name: string
    courses: { id: string; name: string } | null
  } | null
  scores: {
    player_id: string
    strokes: number
    players: { id: string; name: string } | null
  }[]
}

export default async function RoundsPage() {
  const { data } = await supabase
    .from('rounds')
    .select('id, played_at, course_configs(id, name, courses(id, name)), scores(player_id, strokes, players(id, name))')
    .order('played_at', { ascending: false })

  const rounds = (data ?? []) as unknown as RoundRow[]

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl">Rounds</h1>
        <span style={{ color: 'rgba(240,237,232,0.4)', fontSize: '0.85rem' }}>
          {rounds.length} round{rounds.length !== 1 ? 's' : ''}
        </span>
      </div>

      {rounds.length === 0 ? (
        <p style={{ color: 'rgba(240,237,232,0.5)' }}>No rounds yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {rounds.map((round) => {
            const courseName = round.course_configs?.courses?.name ?? 'Unknown'
            const configName = round.course_configs?.name ?? ''
            const date = new Date(round.played_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })
            const scores = [...(round.scores ?? [])].sort((a, b) => a.strokes - b.strokes)

            return (
              <div key={round.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{courseName}</div>
                    {configName && configName !== courseName && (
                      <div style={{ fontSize: '0.8rem', color: 'rgba(240,237,232,0.45)' }}>{configName}</div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(240,237,232,0.4)', flexShrink: 0, marginLeft: '1rem' }}>{date}</div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {scores.map((score, i) => {
                      const scoreColor = score.strokes < 0 ? '#4ade80' : score.strokes > 0 ? 'var(--accent)' : 'var(--chalk)'
                      return (
                        <tr key={score.player_id} style={{ borderTop: '1px solid var(--net)' }}>
                          <td style={{ padding: '0.5rem 0', color: 'rgba(240,237,232,0.35)', width: '1.5rem', fontSize: '0.85rem' }}>{i + 1}</td>
                          <td style={{ padding: '0.5rem 0', fontWeight: i === 0 ? 600 : 400 }}>
                            {i === 0 && <span style={{ color: 'var(--gold)', marginRight: '0.3rem' }}>★</span>}
                            {score.players?.name ?? 'Unknown'}
                          </td>
                          <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: i === 0 ? 700 : 500, color: i === 0 ? 'var(--gold)' : scoreColor, fontSize: '0.95rem' }}>
                            {fmt(score.strokes)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
