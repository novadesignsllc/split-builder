export type SetType = 'work' | 'W' | 'F' | 'D'

export interface PlannedSet {
  id: string
  type: SetType
  repRange: string
}

export interface ExerciseEntry {
  id: string
  exerciseId: string
  sets: PlannedSet[]
}

export interface MuscleGroupDay {
  id: string
  muscleGroup: string
  exercises: ExerciseEntry[]
}

export interface DayConfig {
  id: string
  label: string
  isRest: boolean
  muscleGroups: MuscleGroupDay[]
}

export interface Split {
  id: string
  name: string
  cycleDays: number
  startDay: number  // 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
  days: DayConfig[]
  lastModified: string
}

export interface Exercise {
  id: string
  name: string
  force: string | null
  level: string
  mechanic: string | null
  equipment: string | null
  primaryMuscles: string[]
  secondaryMuscles: string[]
  category: string
  images: string[]
}

export interface ChartEntry {
  muscle: string
  volume: number
  mev: number
  mav: number
}
