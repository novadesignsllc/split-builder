import { useDroppable } from '@dnd-kit/core'
import { DayConfig, MuscleGroupDay, Exercise } from '@/lib/types'
import MuscleGroupOnDay from '@/components/MuscleGroupOnDay'
import { getDayNameFull } from '@/lib/days'
import { cn } from '@/lib/utils'

interface DayCardProps {
  day: DayConfig
  dayIndex: number
  startDay: number
  exercises: Exercise[]
  onUpdateDay: (dayId: string, updates: Partial<DayConfig>) => void
  onUpdateMuscleGroupDay: (dayId: string, mgId: string, updated: MuscleGroupDay) => void
  onRemoveMuscleGroup: (dayId: string, mgId: string) => void
  onOpenExerciseModal: (dayId: string, mgId: string) => void
}

export default function DayCard({
  day,
  dayIndex,
  startDay,
  exercises,
  onUpdateDay: _onUpdateDay,
  onUpdateMuscleGroupDay,
  onRemoveMuscleGroup,
  onOpenExerciseModal,
}: DayCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${day.id}`,
    data: { dayId: day.id },
    disabled: day.isRest,
  })

  const showHighlight = isOver && !day.isRest
  const dayName = getDayNameFull(startDay, dayIndex)

  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl transition-all min-w-0 relative overflow-hidden',
        day.isRest ? 'opacity-30' : '',
        showHighlight ? 'border border-violet-500/25' : 'border-0'
      )}
      style={{
        background: showHighlight
          ? 'rgba(139,92,246,0.05)'
          : 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: showHighlight ? '0 0 30px rgba(139,92,246,0.08) inset' : undefined,
      }}
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-2.5 flex-shrink-0 text-center">
        <p className="text-sm font-medium text-white/80 leading-tight tracking-tight">{dayName}</p>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 px-2 py-2 flex flex-col gap-1.5 rounded-b-2xl transition-colors min-h-[80px]',
        )}
      >
        {day.muscleGroups.length === 0 && !day.isRest && (
          <div className={cn(
            'flex-1 rounded-xl border border-dashed min-h-[60px] transition-all',
            showHighlight ? 'border-violet-400/30' : 'border-transparent'
          )} />
        )}

        {day.muscleGroups.length === 0 && day.isRest && (
          <div className="flex-1 min-h-[60px]" />
        )}

        {day.muscleGroups.map(mg => (
          <MuscleGroupOnDay
            key={mg.id}
            muscleGroupDay={mg}
            exercises={exercises}
            dayId={day.id}
            onOpenExerciseModal={onOpenExerciseModal}
            onRemoveMuscleGroup={onRemoveMuscleGroup}
          />
        ))}

        {day.muscleGroups.length > 0 && !day.isRest && showHighlight && (
          <div className="h-7 rounded-xl border border-dashed border-violet-400/25" />
        )}
      </div>
    </div>
  )
}
