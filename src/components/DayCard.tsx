import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { DayConfig, MuscleGroupDay, Exercise } from '@/lib/types'
import { MUSCLE_GROUPS, MUSCLE_COLORS } from '@/lib/constants'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
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
  onAddMuscleGroup: (dayId: string, muscleGroup: string) => void
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
  onAddMuscleGroup,
}: DayCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${day.id}`,
    data: { dayId: day.id },
    disabled: day.isRest,
  })

  const showHighlight = isOver && !day.isRest
  const dayName = getDayNameFull(startDay, dayIndex)

  const availableMuscleGroups = MUSCLE_GROUPS.filter(
    mg => !day.muscleGroups.some(existing => existing.muscleGroup === mg)
  )

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
        className="flex-1 px-2 py-2 flex flex-col gap-1.5 rounded-b-2xl transition-colors min-h-[80px]"
      >
        {/* Muscle group chips */}
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

        {/* + button */}
        {!day.isRest && availableMuscleGroups.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                'w-full outline-none transition-all rounded-xl border border-dashed flex items-center justify-center',
                day.muscleGroups.length === 0
                  ? 'flex-1 min-h-[60px] border-white/[0.08] hover:border-white/20 text-white/15 hover:text-white/35'
                  : 'h-7 border-white/[0.06] hover:border-white/15 text-white/10 hover:text-white/30'
              )}
              onPointerDown={e => e.stopPropagation()}
            >
              <Plus size={day.muscleGroups.length === 0 ? 18 : 13} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              side="bottom"
              sideOffset={4}
              className="w-44 border border-white/[0.08] p-1"
              style={{ background: 'rgba(8,8,14,0.96)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}
            >
              {availableMuscleGroups.map(mg => (
                <DropdownMenuItem
                  key={mg}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs text-white/70 hover:text-white hover:bg-white/[0.06] cursor-pointer"
                  onClick={() => onAddMuscleGroup(day.id, mg)}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: MUSCLE_COLORS[mg] ?? '#7C3AED' }}
                  />
                  {mg}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Drag-over drop indicator */}
        {day.muscleGroups.length > 0 && showHighlight && (
          <div className="h-7 rounded-xl border border-dashed border-violet-400/25" />
        )}
      </div>
    </div>
  )
}
