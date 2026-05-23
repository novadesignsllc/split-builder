import { useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'
import { MuscleGroupDay, Exercise } from '@/lib/types'
import { MUSCLE_COLORS } from '@/lib/constants'
import ExercisePanel from '@/components/ExercisePanel'

interface ExerciseModalProps {
  isOpen: boolean
  onClose: () => void
  muscleGroupDay: MuscleGroupDay
  exercises: Exercise[]
  dayId: string
  onUpdateMuscleGroupDay: (dayId: string, mgId: string, updated: MuscleGroupDay) => void
  onRemoveMuscleGroup: (dayId: string, mgId: string) => void
}

export default function ExerciseModal({
  isOpen,
  onClose,
  muscleGroupDay,
  exercises,
  dayId,
  onUpdateMuscleGroupDay,
  onRemoveMuscleGroup,
}: ExerciseModalProps) {
  useEffect(() => {
    if (!isOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const dotColor = MUSCLE_COLORS[muscleGroupDay.muscleGroup] ?? '#7C3AED'

  function handleRemove() {
    onRemoveMuscleGroup(dayId, muscleGroupDay.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-2xl max-h-[88vh] mx-4 flex flex-col rounded-2xl bg-[#0D1526] border border-white/[0.09] shadow-2xl shadow-black/60 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.07] flex-shrink-0">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: dotColor }}
          />
          <span className="flex-1 text-base font-semibold text-slate-100">
            {muscleGroupDay.muscleGroup}
          </span>
          <span className="text-xs text-slate-500 mr-2">
            {muscleGroupDay.exercises.length} exercise{muscleGroupDay.exercises.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={handleRemove}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg border border-white/[0.06] hover:border-red-800/40 transition-colors mr-1"
            aria-label={`Remove ${muscleGroupDay.muscleGroup}`}
          >
            <Trash2 size={12} />
            Remove
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <ExercisePanel
            muscleGroupDay={muscleGroupDay}
            exercises={exercises}
            dayId={dayId}
            onUpdateMuscleGroupDay={onUpdateMuscleGroupDay}
            onRemoveMuscleGroup={onRemoveMuscleGroup}
            hideHeader
          />
        </div>
      </div>
    </div>
  )
}
