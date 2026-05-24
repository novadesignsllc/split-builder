import { Split, Exercise, ChartEntry, DayType, ExerciseEntry } from './types'
import {
  MUSCLE_GROUPS,
  VOLUME_TARGETS,
  LEG_MUSCLES,
  MUSCLE_TO_DB_MUSCLES,
  PUSH_DB_MUSCLES,
  PULL_DB_MUSCLES,
  LEG_DB_MUSCLES,
  CORE_DB_MUSCLES,
} from './constants'

function countWorkingSets(entry: ExerciseEntry): number {
  const nonWarmup = entry.sets.filter(s => s.type !== 'W')
  return nonWarmup.length > 0 ? nonWarmup.length : 3
}

/** Map a db primaryMuscle string → our MUSCLE_GROUPS name */
function dbMuscleToGroup(dbMuscle: string): string | null {
  const entry = Object.entries(MUSCLE_TO_DB_MUSCLES).find(([, dbMs]) =>
    dbMs.includes(dbMuscle)
  )
  return entry ? entry[0] : null
}

/** Get primary muscle group name for an exercise (e.g. "Chest", "Lats") */
function getPrimaryMuscleGroup(exerciseId: string, exercises: Exercise[]): string | null {
  const ex = exercises.find(e => e.id === exerciseId)
  if (!ex || !ex.primaryMuscles[0]) return null
  return dbMuscleToGroup(ex.primaryMuscles[0])
}

// ─── Day type detection ────────────────────────────────────────────────────

export function detectDayType(dayExercises: ExerciseEntry[], exerciseDb: Exercise[]): DayType {
  if (dayExercises.length === 0) return null

  let push = 0, pull = 0, legs = 0, core = 0, other = 0

  for (const entry of dayExercises) {
    const ex = exerciseDb.find(e => e.id === entry.exerciseId)
    if (!ex) { other++; continue }

    const primaryMuscle = ex.primaryMuscles[0] ?? ''

    if (LEG_DB_MUSCLES.has(primaryMuscle)) {
      legs++
    } else if (PUSH_DB_MUSCLES.has(primaryMuscle)) {
      push++
    } else if (PULL_DB_MUSCLES.has(primaryMuscle)) {
      pull++
    } else if (CORE_DB_MUSCLES.has(primaryMuscle)) {
      core++
    } else {
      // fall back to force field
      if (ex.force === 'push') push++
      else if (ex.force === 'pull') pull++
      else other++
    }
  }

  const total = push + pull + legs + core + other
  if (total === 0) return null

  const legsRatio = legs / total
  const pushRatio = push / total
  const pullRatio = pull / total
  const upperRatio = (push + pull) / total

  if (legsRatio >= 0.5) return 'Legs'
  if (pushRatio >= 0.6) return 'Push'
  if (pullRatio >= 0.6) return 'Pull'
  if (upperRatio >= 0.7) return 'Upper'
  if (legsRatio >= 0.3 && upperRatio >= 0.3) return 'Full Body'
  if (core / total >= 0.6) return 'Core'
  if (pushRatio > pullRatio) return 'Push'
  if (pullRatio > pushRatio) return 'Pull'
  return 'Full Body'
}

/**
 * For each day, detect type and assign "Primary" / "Secondary" / "Tertiary"
 * labels within the same type group.
 */
export function computeDayTypeLabels(
  split: Split,
  exercises: Exercise[]
): { type: DayType; rank: number }[] {
  const detected = split.days.map(day =>
    day.isRest ? null : detectDayType(day.exercises, exercises)
  )

  const typeCounts: Record<string, number> = {}
  return detected.map(type => {
    if (!type) return { type: null, rank: 0 }
    typeCounts[type] = (typeCounts[type] ?? 0) + 1
    return { type, rank: typeCounts[type] }
  })
}

// ─── Volume chart ──────────────────────────────────────────────────────────

export function computeVolumeChart(split: Split, exercises: Exercise[], cycleDays: number): ChartEntry[] {
  const volumeMap: Record<string, number> = {}

  for (const day of split.days) {
    if (day.isRest) continue
    for (const ex of day.exercises) {
      const group = getPrimaryMuscleGroup(ex.exerciseId, exercises)
      if (!group) continue
      volumeMap[group] = (volumeMap[group] ?? 0) + countWorkingSets(ex)
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

// ─── Push / Pull / Legs ratio ─────────────────────────────────────────────

export function computePushPullLegs(
  split: Split,
  exercises: Exercise[]
): { push: number; pull: number; legs: number } {
  let push = 0, pull = 0, legs = 0

  for (const day of split.days) {
    if (day.isRest) continue
    for (const ex of day.exercises) {
      const dbExercise = exercises.find(e => e.id === ex.exerciseId)
      if (!dbExercise) continue

      const sets = countWorkingSets(ex)
      const group = getPrimaryMuscleGroup(ex.exerciseId, exercises)

      if (group && LEG_MUSCLES.has(group)) {
        legs += sets
      } else if (dbExercise.force === 'push') {
        push += sets
      } else if (dbExercise.force === 'pull') {
        pull += sets
      }
    }
  }

  return { push, pull, legs }
}

// ─── Frequency per muscle ─────────────────────────────────────────────────

export interface MuscleFrequency {
  muscle: string
  daysPerWeek: number  // scaled to 7-day week
  rawDays: number      // actual days in cycle
}

export function computeMuscleFrequency(split: Split, exercises: Exercise[]): MuscleFrequency[] {
  const muscleDays: Record<string, Set<number>> = {}

  for (let i = 0; i < split.days.length; i++) {
    const day = split.days[i]
    if (day.isRest) continue
    for (const ex of day.exercises) {
      const group = getPrimaryMuscleGroup(ex.exerciseId, exercises)
      if (!group) continue
      if (!muscleDays[group]) muscleDays[group] = new Set()
      muscleDays[group].add(i)
    }
  }

  const scale = 7 / Math.max(split.cycleDays, 1)
  return Object.entries(muscleDays).map(([muscle, days]) => ({
    muscle,
    daysPerWeek: Math.round(days.size * scale * 10) / 10,
    rawDays: days.size,
  })).sort((a, b) => b.daysPerWeek - a.daysPerWeek)
}

// ─── Split summary ────────────────────────────────────────────────────────

export interface SplitSummary {
  workoutDays: number
  totalSets: number
  avgSetsPerDay: number
  isBalanced: boolean
  balanceNote: string
}

export function computeSplitSummary(split: Split, exercises: Exercise[]): SplitSummary {
  const workoutDays = split.days.filter(d => !d.isRest && d.exercises.length > 0).length
  let totalSets = 0

  for (const day of split.days) {
    if (day.isRest) continue
    for (const ex of day.exercises) {
      totalSets += countWorkingSets(ex)
    }
  }

  const avgSetsPerDay = workoutDays > 0 ? Math.round((totalSets / workoutDays) * 10) / 10 : 0
  const { push, pull, legs } = computePushPullLegs(split, exercises)
  const upperSets = push + pull

  const isBalanced =
    totalSets > 0 &&
    Math.abs(push - pull) / Math.max(push + pull, 1) < 0.4 &&
    legs > 0

  let balanceNote = ''
  if (totalSets === 0) balanceNote = 'Add exercises to get started'
  else if (!isBalanced && legs === 0) balanceNote = 'Add leg exercises for balance'
  else if (!isBalanced && push > pull * 1.5) balanceNote = 'Consider more pulling movements'
  else if (!isBalanced && pull > push * 1.5) balanceNote = 'Consider more pushing movements'
  else if (isBalanced) balanceNote = 'Great balance! Keep it up.'
  else balanceNote = ''

  return { workoutDays, totalSets, avgSetsPerDay, isBalanced, balanceNote }
}

// ─── Frequency warnings ───────────────────────────────────────────────────

export interface FrequencyWarning {
  muscle: string
  type: 'low' | 'consecutive'
  message: string
}

export function computeFrequencyWarnings(split: Split, exercises?: Exercise[]): FrequencyWarning[] {
  const warnings: FrequencyWarning[] = []

  // New flat structure
  if (exercises) {
    const muscleDays: Record<string, number[]> = {}
    for (let i = 0; i < split.days.length; i++) {
      const day = split.days[i]
      if (day.isRest) continue
      const seen = new Set<string>()
      for (const ex of day.exercises) {
        const group = exercises.find(e => e.id === ex.exerciseId)?.primaryMuscles[0]
        if (!group) continue
        const mg = Object.entries(MUSCLE_TO_DB_MUSCLES).find(([, dbMs]) => dbMs.includes(group))?.[0]
        if (!mg || seen.has(mg)) continue
        seen.add(mg)
        if (!muscleDays[mg]) muscleDays[mg] = []
        muscleDays[mg].push(i)
      }
    }

    for (const [muscle, dayIndices] of Object.entries(muscleDays)) {
      if (dayIndices.length === 1) {
        warnings.push({ muscle, type: 'low', message: `${muscle} is only trained 1× — consider 2× per week` })
      }
      for (let i = 0; i < dayIndices.length - 1; i++) {
        if (dayIndices[i + 1] - dayIndices[i] === 1) {
          warnings.push({
            muscle,
            type: 'consecutive',
            message: `${muscle} trained on Day ${dayIndices[i] + 1} and Day ${dayIndices[i + 1] + 1} — less than 48h recovery`,
          })
        }
      }
    }
    return warnings
  }

  return warnings
}
