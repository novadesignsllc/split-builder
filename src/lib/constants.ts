export const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Lats', 'Traps', 'Shoulders',
  'Biceps', 'Triceps', 'Forearms', 'Quads', 'Hamstrings',
  'Glutes', 'Calves', 'Abs', 'Lower Back', 'Neck',
] as const

export type MuscleGroupName = typeof MUSCLE_GROUPS[number]

export const MUSCLE_TO_DB_MUSCLES: Record<string, string[]> = {
  'Chest': ['chest'],
  'Back': ['middle back'],
  'Lats': ['lats'],
  'Traps': ['traps'],
  'Shoulders': ['shoulders'],
  'Biceps': ['biceps'],
  'Triceps': ['triceps'],
  'Forearms': ['forearms'],
  'Quads': ['quadriceps'],
  'Hamstrings': ['hamstrings'],
  'Glutes': ['glutes'],
  'Calves': ['calves'],
  'Abs': ['abdominals'],
  'Lower Back': ['lower back'],
  'Neck': ['neck'],
}

export const VOLUME_TARGETS: Record<string, { mev: number; mav: number }> = {
  'Chest': { mev: 8, mav: 20 },
  'Back': { mev: 10, mav: 22 },
  'Lats': { mev: 10, mav: 22 },
  'Traps': { mev: 6, mav: 16 },
  'Shoulders': { mev: 8, mav: 22 },
  'Biceps': { mev: 8, mav: 20 },
  'Triceps': { mev: 6, mav: 14 },
  'Forearms': { mev: 4, mav: 12 },
  'Quads': { mev: 8, mav: 18 },
  'Hamstrings': { mev: 6, mav: 16 },
  'Glutes': { mev: 4, mav: 12 },
  'Calves': { mev: 8, mav: 16 },
  'Abs': { mev: 0, mav: 20 },
  'Lower Back': { mev: 4, mav: 12 },
  'Neck': { mev: 0, mav: 10 },
}

// Day type detection — which db muscle strings belong to push / pull / legs
export const PUSH_DB_MUSCLES = new Set(['chest', 'shoulders', 'triceps'])
export const PULL_DB_MUSCLES = new Set(['lats', 'middle back', 'upper back', 'biceps', 'traps'])
export const LEG_DB_MUSCLES = new Set(['quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors'])
export const CORE_DB_MUSCLES = new Set(['abdominals', 'lower back'])

export const LEG_MUSCLES = new Set(['Quads', 'Hamstrings', 'Glutes', 'Calves'])

export const EQUIPMENT_OPTIONS = [
  'All equipment',
  'barbell',
  'dumbbell',
  'cable',
  'machine',
  'body only',
  'kettlebells',
  'bands',
  'e-z curl bar',
  'exercise ball',
  'foam roll',
  'medicine ball',
  'other',
]

export const MUSCLE_COLORS: Record<string, string> = {
  'Chest': '#f97316',
  'Back': '#8b5cf6',
  'Lats': '#6366f1',
  'Traps': '#ec4899',
  'Shoulders': '#14b8a6',
  'Biceps': '#3b82f6',
  'Triceps': '#06b6d4',
  'Forearms': '#84cc16',
  'Quads': '#10b981',
  'Hamstrings': '#f59e0b',
  'Glutes': '#ef4444',
  'Calves': '#a855f7',
  'Abs': '#0ea5e9',
  'Lower Back': '#78716c',
  'Neck': '#64748b',
}

export const DAY_TYPE_COLORS: Record<string, string> = {
  'Push': '#f97316',
  'Pull': '#3b82f6',
  'Legs': '#10b981',
  'Upper': '#8b5cf6',
  'Lower': '#22d3ee',
  'Full Body': '#14b8a6',
  'Core': '#f59e0b',
}
