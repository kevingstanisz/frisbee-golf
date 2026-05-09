export type Player = {
  id: string
  name: string
  created_at: string
}

export type Tag = {
  id: string
  name: string
}

export type CourseConfig = {
  id: string
  course_id: string
  name: string
  par: number | null
  created_at: string
}

export type Course = {
  id: string
  name: string
  holes: number
  created_at: string
  tags?: Tag[]
  course_configs?: CourseConfig[]
}

export type Round = {
  id: string
  course_config_id: string
  played_at: string
  course_configs?: CourseConfig & { courses?: Course }
}

export type Score = {
  id: string
  round_id: string
  player_id: string
  strokes: number
  created_at: string
  players?: Player
  rounds?: Round
}
