import { Split, Exercise, ChartEntry } from './types'
import { MUSCLE_GROUPS, VOLUME_TARGETS, LEG_MUSCLES, MUSCLE_TO_DB_MUSCLES } from './constants'

function countWorkingSets(entry: { sets: { type: string }[] }): number {
  const nonWarmup = entry.sets.filter(s => s.type !== 'W')
  return nonWarmup.length > 0 ? nonWarmup.length : 3
}

function getPrimaryMuscle(exerciseId: string, exercises: Exercise[]): string | null {
  const ex = exercises.find(e => e.id === exerciseId)
  if (!ex || !ex.primaryMuscles[0]) return null
  const dbMuscle = ex.primaryMuscles[0]
  const entry = Object.entries(MUSCLE_TO_DB_MUSCLES).find(([, dbMs]) =>
    dbMs.includes(dbMuscle)
  )
  return entry ? entry[0] : null
}

export function computeVolumeChart(split: Split, exercises: Exercise[], cycleDays: number): ChartEntry[] {
  const volumeMap: Record<string, number> = {}

  for (const day of split.days) {
    if (day.isRest) continue
    for (const mg of day.muscleGroups) {
      if (!volumeMap[mg.muscleGroup]) volumeMap[mg.muscleGroup] = 0
      for (const ex of mg.exercises) {
        volumeMap[mg.muscleGroup] += countWorkingSets(ex)
      }
    }
  }

  const result: ChartEntry[] = []
  for (const muscle of MUSCLE_GROUPS) {
    const vol = volumeMap[muscle]
    if (vol === undefined) continue
    const base = VOLUME_TARGETS[muscle]
    const scale = cycleDays / 7
    result.push({
      muscle,
      volume: vol,
      mev: Math.round(base.mev * scale),
      mav: Math.round(base.mav * scale),
    })
  }

  return result.sort((a, b) => b.volume - a.volume)
}

export function computePushPullLegs(
  split: Split,
  exercises: Exercise[]
): { push: number; pull: number; legs: number } {
  let push = 0, pull = 0, legs = 0

  for (const day of split.days) {
    if (day.isRest) continue
    for (const mg of day.muscleGroups) {
      for (const ex of mg.exercises) {
        const dbExercise = exercises.find(e => e.id === ex.exerciseId)
        if (!dbExercise) continue

        const sets = countWorkingSets(ex)
        const primaryMuscle = getPrimaryMuscle(ex.exerciseId, exercises)

        if (primaryMuscle && LEG_MUSCLES.has(primaryMuscle)) {
          legs += sets
        } else if (dbExercise.force === 'push') {
          push += sets
        } else if (dbExercise.force === 'pull') {
          pull += sets
        }
      }
    }
  }

  return { push, pull, legs }
}

export interface FrequencyWarning {
  muscle: string
  type: 'low' | 'consecutive'
  message: string
}

export function computeFrequencyWarnings(split: Split): FrequencyWarning[] {
  const warnings: FrequencyWarning[] = []
  const muscleTodays: Record<string, number[]> = {}

  for (let i = 0; i < split.days.length; i++) {
    const day = split.days[i]
    if (day.isRest) continue
    for (const mg of day.muscleGroups) {
      if (!muscleTodays[mg.muscleGroup]) muscleTodays[mg.muscleGroup] = []
      muscleTodays[mg.muscleGroup].push(i)
    }
  }

  for (const [muscle, dayIndices] of Object.entries(muscleTodays)) {
    if (dayIndices.length === 1) {
      warnings.push({
        muscle,
        type: 'low',
        message: `${muscle} is only trained 1× — consider 2× per week`,
      })
    }

    for (let i = 0; i < dayIndices.length - 1; i++) {
      if (dayIndices[i + 1] - dayIndices[i] === 1) {
        warnings.push({
          muscle,
          type: 'consecutive',
          message: `${muscle} is on Day ${dayIndices[i] + 1} and Day ${dayIndices[i + 1] + 1} — less than 48h recovery`,
        })
      }
    }
  }

  return warnings
}
