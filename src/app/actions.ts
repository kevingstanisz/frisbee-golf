'use server'

import { supabase } from '@/lib/supabase'
import { sendNotification } from '@/lib/ntfy'
import { revalidatePath } from 'next/cache'

export async function createPlayer(name: string) {
  const { data, error } = await supabase
    .from('players')
    .insert({ name: name.trim() })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/')
  return data
}

export async function createCourse(name: string, holes: number, configNames: string[]) {
  const { data: course, error } = await supabase
    .from('courses')
    .insert({ name: name.trim(), holes })
    .select()
    .single()
  if (error) throw new Error(error.message)

  if (configNames.length > 0) {
    const { error: configError } = await supabase
      .from('course_configs')
      .insert(configNames.map((n) => ({ course_id: course.id, name: n.trim() })))
    if (configError) throw new Error(configError.message)
  }

  revalidatePath('/courses')
  return course
}

export async function createCourseConfig(courseId: string, name: string) {
  const { data, error } = await supabase
    .from('course_configs')
    .insert({ course_id: courseId, name: name.trim() })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath(`/courses/${courseId}`)
  return data
}

export async function toggleEstablished(courseId: string, value: boolean) {
  const { error } = await supabase
    .from('courses')
    .update({ established: value })
    .eq('id', courseId)
  if (error) throw new Error(error.message)
  revalidatePath('/courses')
  revalidatePath(`/courses/${courseId}`)
  revalidatePath('/')
}

export async function createRound(
  courseConfigId: string,
  scores: { playerId: string; strokes: number; playerName: string }[],
  courseName: string,
  configName: string
) {
  const { data: round, error: roundError } = await supabase
    .from('rounds')
    .insert({ course_config_id: courseConfigId })
    .select()
    .single()
  if (roundError) throw new Error(roundError.message)

  const { error: scoresError } = await supabase.from('scores').insert(
    scores.map((s) => ({ round_id: round.id, player_id: s.playerId, strokes: s.strokes }))
  )
  if (scoresError) throw new Error(scoresError.message)

  const fmt = (n: number) => (n === 0 ? 'E' : n > 0 ? `+${n}` : `${n}`)
  const scoreStr = [...scores]
    .sort((a, b) => a.strokes - b.strokes)
    .map((s) => `${s.playerName} ${fmt(s.strokes)}`)
    .join(', ')

  await sendNotification('Frisbee Golf', `${courseName} — ${configName}: ${scoreStr}`)

  revalidatePath('/')
  return round
}
