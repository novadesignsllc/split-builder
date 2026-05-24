import { Split, DayConfig } from './types'
import { v4 as uuidv4 } from 'uuid'

const PREFIX = 'splitBuilder:'
const CURRENT_KEY = `${PREFIX}current`
const SPLITS_PREFIX = `${PREFIX}splits:`

export function createDefaultSplit(): Split {
  return {
    id: uuidv4(),
    name: 'Untitled split',
    cycleDays: 7,
    startDay: 1,
    days: Array.from({ length: 7 }, () => ({
      id: uuidv4(),
      label: '',
      isRest: false,
      exercises: [],
    })),
    lastModified: new Date().toISOString(),
  }
}

/** Migrate old format (muscleGroups) to new flat exercises format */
function migrateDay(day: DayConfig & { muscleGroups?: unknown }): DayConfig {
  // If already has exercises array, just ensure it exists
  if (Array.isArray(day.exercises)) {
    return { id: day.id, label: day.label ?? '', isRest: day.isRest ?? false, exercises: day.exercises }
  }

  // Old format: flatten muscleGroups[].exercises into a single exercises array
  const oldMgs = (day as { muscleGroups?: Array<{ exercises?: unknown[] }> }).muscleGroups
  const flatExercises = Array.isArray(oldMgs)
    ? oldMgs.flatMap(mg => (Array.isArray(mg.exercises) ? mg.exercises : []))
    : []

  return {
    id: day.id,
    label: day.label ?? '',
    isRest: day.isRest ?? false,
    exercises: flatExercises as DayConfig['exercises'],
  }
}

function migrateSplit(raw: Record<string, unknown>): Split {
  const split = raw as Split & { days: Array<DayConfig & { muscleGroups?: unknown }> }
  return {
    ...split,
    startDay: split.startDay ?? 1,
    days: (split.days ?? []).map(migrateDay),
  }
}

export function loadCurrentSplit(): Split | null {
  try {
    const raw = localStorage.getItem(CURRENT_KEY)
    if (!raw) return null
    return migrateSplit(JSON.parse(raw) as Record<string, unknown>)
  } catch {
    return null
  }
}

export function saveCurrentSplit(split: Split): void {
  localStorage.setItem(CURRENT_KEY, JSON.stringify(split))
}

export function saveSplit(split: Split): Split {
  const updated = { ...split, lastModified: new Date().toISOString() }
  localStorage.setItem(`${SPLITS_PREFIX}${updated.id}`, JSON.stringify(updated))
  return updated
}

export function loadAllSplits(): Split[] {
  const splits: Split[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(SPLITS_PREFIX)) {
      try {
        const raw = localStorage.getItem(key)
        if (raw) splits.push(migrateSplit(JSON.parse(raw) as Record<string, unknown>))
      } catch {
        // ignore corrupt entries
      }
    }
  }
  return splits.sort(
    (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
  )
}

export function updateSplitIcon(id: string, icon: string): void {
  const key = `${SPLITS_PREFIX}${id}`
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return
    const split = JSON.parse(raw) as Split
    localStorage.setItem(key, JSON.stringify({ ...split, icon }))
  } catch {
    // ignore
  }
}

export function deleteSplit(id: string): void {
  localStorage.removeItem(`${SPLITS_PREFIX}${id}`)
}

export function duplicateSplit(split: Split): Split {
  const copy: Split = {
    ...split,
    id: uuidv4(),
    name: `${split.name} (copy)`,
    days: split.days.map(day => ({
      ...day,
      id: uuidv4(),
      exercises: day.exercises.map(ex => ({
        ...ex,
        id: uuidv4(),
        sets: ex.sets.map(s => ({ ...s, id: uuidv4() })),
      })),
    })),
    lastModified: new Date().toISOString(),
  }
  return saveSplit(copy)
}
