import { TooltipProvider } from '@/components/ui/tooltip'
import { SplitBuilder } from '@/components/SplitBuilder'
import type { Exercise } from '@/lib/types'
import rawExercises from '@/data/exercises.json'

type RawExercise = {
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
  instructions: string[]
}

const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'

const exercises: Exercise[] = (rawExercises as RawExercise[]).map(
  ({ instructions: _instructions, ...e }) => ({
    ...e,
    images: e.images.map(img => `${IMAGE_BASE}${img}`),
  })
)

export default function App() {
  return (
    <TooltipProvider>
      <SplitBuilder exercises={exercises} />
    </TooltipProvider>
  )
}
