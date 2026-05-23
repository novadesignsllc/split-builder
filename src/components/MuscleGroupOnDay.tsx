import { useDraggable } from '@dnd-kit/core'
import { GripVertical, X } from 'lucide-react'
import { MuscleGroupDay, Exercise } from '@/lib/types'
import { MUSCLE_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface MuscleGroupOnDayProps {
  muscleGroupDay: MuscleGroupDay
  exercises: Exercise[]
  dayId: string
  onOpenExerciseModal: (dayId: string, mgId: string) => void
  onRemoveMuscleGroup: (dayId: string, mgId: string) => void
}

export default function MuscleGroupOnDay({
  muscleGroupDay,
  exercises,
  dayId,
  onOpenExerciseModal,
  onRemoveMuscleGroup,
}: MuscleGroupOnDayProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `daymg-${muscleGroupDay.id}`,
    data: {
      type: 'muscleGroupFromDay',
      muscleGroup: muscleGroupDay.muscleGroup,
      fromDayId: dayId,
      mgId: muscleGroupDay.id,
    },
  })

  const dotColor = MUSCLE_COLORS[muscleGroupDay.muscleGroup] ?? '#7C3AED'
  const exerciseNames = muscleGroupDay.exercises.map(
    e => exercises.find(ex => ex.id === e.exerciseId)?.name ?? 'Unknown'
  )

  return (
    <div ref={setNodeRef} className={cn('w-full', isDragging && 'opacity-30')}>
      <div
        {...attributes}
        {...listeners}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl border border-white/[0.05] hover:border-white/[0.09] group cursor-grab active:cursor-grabbing touch-none select-none transition-colors"
        style={{ background: 'rgba(255,255,255,0.025)' }}
      >
        <span className="flex-shrink-0 text-white/15 p-0.5">
          <GripVertical size={11} />
        </span>

        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: dotColor }}
        />

        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={() => onOpenExerciseModal(dayId, muscleGroupDay.id)}
          className="flex-1 min-w-0 text-xs font-medium text-white/65 hover:text-white/90 text-left truncate transition-colors"
        >
          {muscleGroupDay.muscleGroup}
        </button>

        <span className="text-[10px] text-white/20 flex-shrink-0">
          {muscleGroupDay.exercises.length > 0 ? `${muscleGroupDay.exercises.length} ex` : ''}
        </span>

        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={() => onRemoveMuscleGroup(dayId, muscleGroupDay.id)}
          className="flex-shrink-0 text-white/15 hover:text-red-400/70 opacity-0 group-hover:opacity-100 transition-all p-0.5"
          aria-label={`Remove ${muscleGroupDay.muscleGroup}`}
        >
          <X size={10} />
        </button>
      </div>

      {exerciseNames.length > 0 && (
        <div className="ml-6 mt-0.5">
          {exerciseNames.slice(0, 3).map((name, i) => (
            <p key={i} className="text-[10px] text-white/20 truncate leading-[1.5]">{name}</p>
          ))}
          {exerciseNames.length > 3 && (
            <p className="text-[10px] text-violet-400/40">+{exerciseNames.length - 3} more</p>
          )}
        </div>
      )}
    </div>
  )
}
