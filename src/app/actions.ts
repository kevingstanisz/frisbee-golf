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

export async function createTag(name: string) {
  const { data, error } = await supabase
    .from('tags')
    .insert({ name: name.trim().toLowerCase() })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createCourse(
  name: string,
  holes: number,
  tagIds: string[],
  configs: { name: string; par: number }[]
) {
  const { data: course, error } = await supabase
    .from('courses')
    .insert({ name: name.trim(), holes })
    .select()
    .single()
  if (error) throw new Error(error.message)

  if (tagIds.length > 0) {
    const { error: tagError } = await supabase
      .from('course_tags')
      .insert(tagIds.map((tag_id) => ({ course_id: course.id, tag_id })))
    if (tagError) throw new Error(tagError.message)
  }

  if (configs.length > 0) {
    const { error: configError } = await supabase
      .from('course_configs')
      .insert(configs.map((c) => ({ course_id: course.id, name: c.name.trim(), par: c.par })))
    if (configError) throw new Error(configError.message)
  }

  revalidatePath('/courses')
  return course
}

export async function createCourseConfig(courseId: string, name: string, par: number) {
  const { data, error } = await supabase
    .from('course_configs')
    .insert({ course_id: courseId, name: name.trim(), par })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath(`/courses/${courseId}`)
  return data
}

export async function createRound(
  courseConfigId: string,
  scores: { playerId: string; strokes: number; playerName: string }[],
  courseName: string,
  configName: string,
  par: number | null
) {
  const { data: round, error: roundError } = await supabase
    .from('rounds')
    .insert({ course_config_id: courseConfigId })
    .select()
    .single()
  if (roundError) throw new Error(roundError.message)

  const { error: scoresError } = await supabase.from('scores').insert(
    scores.map((s) => ({
      round_id: round.id,
      player_id: s.playerId,
      strokes: s.strokes,
    }))
  )
  if (scoresError) throw new Error(scoresError.message)

  const fmtScore = (strokes: number) => {
    if (par == null) return `${strokes}`
    const d = strokes - par
    return d === 0 ? 'E' : d > 0 ? `+${d}` : `${d}`
  }

  const scoreStr = [...scores]
    .sort((a, b) => a.strokes - b.strokes)
    .map((s) => `${s.playerName} ${fmtScore(s.strokes)}`)
    .join(', ')

  await sendNotification('Frisbee Golf ⛳', `${courseName} — ${configName}: ${scoreStr}`)

  revalidatePath('/')
  return round
}
