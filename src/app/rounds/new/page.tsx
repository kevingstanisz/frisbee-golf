'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createRound, createPlayer, createCourseConfig } from '@/app/actions'
import { Course, Player, CourseConfig } from '@/lib/types'

type PlayerScore = { player: Player; strokes: string }

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
    setNewConfigName('')
    setAddingConfig(false)
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
        : [...prev, { player, strokes: '' }]
    })
  }

  const setStrokes = (playerId: string, val: string) =>
    setPlayerScores((prev) =>
      prev.map((ps) => ps.player.id === playerId ? { ...ps, strokes: val } : ps)
    )

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return
    setAddingPlayer(true)
    try {
      const player = await createPlayer(newPlayerName)
      setPlayers((prev) => [...prev, player].sort((a, b) => a.name.localeCompare(b.name)))
      setPlayerScores((prev) => [...prev, { player, strokes: '' }])
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

    const invalid = playerScores.find((ps) => !ps.strokes || isNaN(Number(ps.strokes)))
    if (invalid) { setError(`Enter strokes for ${invalid.player.name}`); return }

    setSubmitting(true)
    setError('')
    try {
      await createRound(
        selectedConfig.id,
        playerScores.map((ps) => ({
          playerId: ps.player.id,
          strokes: Number(ps.strokes),
          playerName: ps.player.name,
        })),
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
    display: 'block',
    fontSize: '0.8rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: 'rgba(240,237,232,0.5)',
    marginBottom: '0.5rem',
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <div style={{ marginBottom: '0.5rem' }}>
        <a href="/" style={{ color: 'rgba(240,237,232,0.4)', fontSize: '0.9rem', textDecoration: 'none' }}>← Home</a>
      </div>
      <h1 className="font-display text-4xl" style={{ marginBottom: '2rem' }}>Enter Round</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* Course */}
        <div>
          <label style={labelStyle}>Course</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {courses.map((course) => {
              const active = selectedCourse?.id === course.id
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => selectCourse(course)}
                  style={{
                    textAlign: 'left',
                    padding: '0.7rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: active ? 'var(--accent)' : 'var(--net)',
                    background: active ? 'rgba(233,69,96,0.12)' : 'rgba(255,255,255,0.02)',
                    color: 'var(--chalk)',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                  }}
                >
                  {course.name}
                  <span style={{ color: 'rgba(240,237,232,0.4)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                    {course.holes} holes
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Config */}
        {selectedCourse && (
          <div>
            <label style={labelStyle}>Configuration</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
              {configs.map((config) => {
                const active = selectedConfig?.id === config.id
                return (
                  <button
                    key={config.id}
                    type="button"
                    onClick={() => setSelectedConfig(active ? null : config)}
                    style={{
                      textAlign: 'left',
                      padding: '0.7rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: active ? 'var(--accent)' : 'var(--net)',
                      background: active ? 'rgba(233,69,96,0.12)' : 'rgba(255,255,255,0.02)',
                      color: 'var(--chalk)',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                    }}
                  >
                    {config.name}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={newConfigName}
                onChange={(e) => setNewConfigName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddConfig())}
                placeholder="New config…"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleAddConfig}
                disabled={addingConfig || !newConfigName.trim()}
                className="btn-ghost"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Players */}
        {selectedConfig && (
          <div>
            <label style={labelStyle}>Players</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
              {players.map((player) => {
                const active = playerScores.some((ps) => ps.player.id === player.id)
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => togglePlayer(player)}
                    style={{
                      textAlign: 'left',
                      padding: '0.7rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: active ? 'var(--accent)' : 'var(--net)',
                      background: active ? 'rgba(233,69,96,0.12)' : 'rgba(255,255,255,0.02)',
                      color: 'var(--chalk)',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                    }}
                  >
                    {player.name}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPlayer())}
                placeholder="New player…"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleAddPlayer}
                disabled={addingPlayer || !newPlayerName.trim()}
                className="btn-ghost"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Strokes */}
        {playerScores.length > 0 && (
          <div>
            <label style={labelStyle}>Strokes</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {playerScores.map((ps) => (
                <div key={ps.player.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ flex: 1, fontSize: '0.95rem' }}>{ps.player.name}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={ps.strokes}
                    onChange={(e) => setStrokes(ps.player.id, e.target.value)}
                    placeholder="—"
                    style={{ width: '5rem', textAlign: 'center' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p style={{ color: 'var(--accent)' }}>{error}</p>}

        {playerScores.length > 0 && selectedConfig && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? 'Saving…' : 'Submit Round'}
          </button>
        )}
      </div>
    </main>
  )
}
