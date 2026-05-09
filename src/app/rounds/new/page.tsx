'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createRound, createPlayer, createCourseConfig } from '@/app/actions'
import { Course, Player, CourseConfig } from '@/lib/types'

type PlayerScore = { player: Player; score: number }

const fmt = (n: number) => (n === 0 ? 'E' : n > 0 ? `+${n}` : `${n}`)

function ScoreStepper({ score, onChange }: { score: number; onChange: (n: number) => void }) {
  const color = score < 0 ? '#4ade80' : score > 0 ? 'var(--accent)' : 'var(--chalk)'

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    onChange(score + (e.deltaY > 0 ? 1 : -1))
  }

  return (
    <div onWheel={handleWheel} style={{ display: 'flex', alignItems: 'center', userSelect: 'none' }}>
      <button type="button" onClick={() => onChange(score - 1)} style={{
        width: '2.5rem', height: '2.5rem', borderRadius: '50%',
        border: '1px solid var(--net)', background: 'rgba(255,255,255,0.04)',
        color: 'var(--chalk)', fontSize: '1.25rem', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>−</button>
      <div style={{ width: '4.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color, lineHeight: 1 }}>{fmt(score)}</div>
      </div>
      <button type="button" onClick={() => onChange(score + 1)} style={{
        width: '2.5rem', height: '2.5rem', borderRadius: '50%',
        border: '1px solid var(--net)', background: 'rgba(255,255,255,0.04)',
        color: 'var(--chalk)', fontSize: '1.25rem', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>+</button>
    </div>
  )
}

export default function NewRoundPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [configs, setConfigs] = useState<CourseConfig[]>([])
  const [selectedConfig, setSelectedConfig] = useState<CourseConfig | null>(null)
  const [newConfigName, setNewConfigName] = useState('')
  const [addingConfig, setAddingConfig] = useState(false)
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([])
  const [newPlayerName, setNewPlayerName] = useState('')
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      supabase.from('courses').select('*, course_configs(id, name)').order('name'),
      supabase.from('players').select('*').order('name'),
    ]).then(([{ data: c }, { data: p }]) => {
      setCourses(c ?? [])
      setPlayers(p ?? [])
    })
  }, [])

  const selectCourse = (course: Course) => {
    setSelectedCourse(course)
    setConfigs((course.course_configs as CourseConfig[]) ?? [])
    setSelectedConfig(null)
  }

  const handleAddConfig = async () => {
    if (!newConfigName.trim() || !selectedCourse) return
    setAddingConfig(true)
    try {
      const config = await createCourseConfig(selectedCourse.id, newConfigName)
      setConfigs((prev) => [...prev, config])
      setSelectedConfig(config)
      setNewConfigName('')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setAddingConfig(false)
    }
  }

  const togglePlayer = (player: Player) => {
    setPlayerScores((prev) => {
      const exists = prev.find((ps) => ps.player.id === player.id)
      return exists
        ? prev.filter((ps) => ps.player.id !== player.id)
        : [...prev, { player, score: 0 }]
    })
  }

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return
    setAddingPlayer(true)
    try {
      const player = await createPlayer(newPlayerName)
      setPlayers((prev) => [...prev, player].sort((a, b) => a.name.localeCompare(b.name)))
      setPlayerScores((prev) => [...prev, { player, score: 0 }])
      setNewPlayerName('')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setAddingPlayer(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedCourse) { setError('Select a course'); return }
    if (!selectedConfig) { setError('Select a configuration'); return }
    if (playerScores.length === 0) { setError('Add at least one player'); return }
    setSubmitting(true)
    setError('')
    try {
      await createRound(
        selectedConfig.id,
        playerScores.map((ps) => ({ playerId: ps.player.id, strokes: ps.score, playerName: ps.player.name })),
        selectedCourse.name,
        selectedConfig.name
      )
      router.push('/')
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong')
      setSubmitting(false)
    }
  }

  const labelStyle = {
    display: 'block', fontSize: '0.8rem', textTransform: 'uppercase' as const,
    letterSpacing: '0.08em', color: 'rgba(240,237,232,0.5)', marginBottom: '0.5rem',
  }

  const optionBtn = (active: boolean) => ({
    textAlign: 'left' as const, padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid',
    borderColor: active ? 'var(--accent)' : 'var(--net)',
    background: active ? 'rgba(233,69,96,0.12)' : 'rgba(255,255,255,0.02)',
    color: 'var(--chalk)', cursor: 'pointer', fontSize: '0.95rem', width: '100%',
  })

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <div style={{ marginBottom: '0.5rem' }}>
        <a href="/" style={{ color: 'rgba(240,237,232,0.4)', fontSize: '0.9rem', textDecoration: 'none' }}>← Home</a>
      </div>
      <h1 className="font-display text-4xl" style={{ marginBottom: '2rem' }}>Enter Round</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        <div>
          <label style={labelStyle}>Course</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {courses.map((course) => (
              <button key={course.id} type="button" onClick={() => selectCourse(course)}
                style={optionBtn(selectedCourse?.id === course.id)}>
                {course.name}
                <span style={{ color: 'rgba(240,237,232,0.4)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                  {course.holes} holes
                </span>
              </button>
            ))}
          </div>
        </div>

        {selectedCourse && (
          <div>
            <label style={labelStyle}>Configuration</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
              {configs.map((config) => (
                <button key={config.id} type="button"
                  onClick={() => setSelectedConfig(selectedConfig?.id === config.id ? null : config)}
                  style={optionBtn(selectedConfig?.id === config.id)}>
                  {config.name}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" value={newConfigName}
                onChange={(e) => setNewConfigName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddConfig())}
                placeholder="New config…" style={{ flex: 1 }} />
              <button type="button" onClick={handleAddConfig}
                disabled={addingConfig || !newConfigName.trim()} className="btn-ghost">
                Add
              </button>
            </div>
          </div>
        )}

        {selectedConfig && (
          <div>
            <label style={labelStyle}>Players</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
              {players.map((player) => (
                <button key={player.id} type="button" onClick={() => togglePlayer(player)}
                  style={optionBtn(playerScores.some((ps) => ps.player.id === player.id))}>
                  {player.name}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPlayer())}
                placeholder="New player…" style={{ flex: 1 }} />
              <button type="button" onClick={handleAddPlayer}
                disabled={addingPlayer || !newPlayerName.trim()} className="btn-ghost">
                Add
              </button>
            </div>
          </div>
        )}

        {playerScores.length > 0 && (
          <div>
            <label style={labelStyle}>Scores</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {playerScores.map((ps) => (
                <div key={ps.player.id} className="card"
                  style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 500 }}>{ps.player.name}</span>
                  <ScoreStepper score={ps.score}
                    onChange={(n) => setPlayerScores((prev) =>
                      prev.map((p) => p.player.id === ps.player.id ? { ...p, score: n } : p)
                    )} />
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p style={{ color: 'var(--accent)' }}>{error}</p>}

        {playerScores.length > 0 && selectedConfig && (
          <button type="button" onClick={handleSubmit} disabled={submitting} className="btn-primary">
            {submitting ? 'Saving…' : 'Submit Round'}
          </button>
        )}
      </div>
    </main>
  )
}
