import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { DayConfig, MuscleGroupDay, Exercise } from '@/lib/types'
import { Switch } from '@/components/ui/switch'
import MuscleGroupOnDay from '@/components/MuscleGroupOnDay'
import { getDayNameFull } from '@/lib/days'
import { Pencil } from 'lucide-react'
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
  onUpdateDay,
  onUpdateMuscleGroupDay,
  onRemoveMuscleGroup,
  onOpenExerciseModal,
}: DayCardProps) {
  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const [labelDraft, setLabelDraft] = useState(day.label)

  const { setNodeRef, isOver } = useDroppable({
    id: `day-${day.id}`,
    data: { dayId: day.id },
    disabled: day.isRest,
  })

  function commitLabel() {
    setIsEditingLabel(false)
    const trimmed = labelDraft.trim()
    if (trimmed !== day.label) onUpdateDay(day.id, { label: trimmed })
    else setLabelDraft(day.label)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commitLabel()
    if (e.key === 'Escape') { setLabelDraft(day.label); setIsEditingLabel(false) }
  }

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
      <div className="px-3 pt-3 pb-2.5 flex-shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/80 leading-tight tracking-tight">{dayName}</p>
            {isEditingLabel ? (
              <input
                autoFocus
                type="text"
                value={labelDraft}
                onChange={e => setLabelDraft(e.target.value)}
                onBlur={commitLabel}
                onKeyDown={handleKeyDown}
                placeholder="Add label…"
                className="mt-1 text-xs text-white/60 bg-white/[0.05] border border-violet-400/25 rounded-md px-1.5 py-0.5 w-full outline-none"
              />
            ) : (
              <button
                onClick={() => { setLabelDraft(day.label); setIsEditingLabel(true) }}
                className="mt-0.5 flex items-center gap-1 text-[11px] text-white/25 hover:text-white/50 group/label transition-colors"
              >
                <span className={day.label ? 'text-white/40' : 'italic'}>
                  {day.label || 'label…'}
                </span>
                <Pencil size={8} className="opacity-0 group-hover/label:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
            <span className="text-[10px] text-white/20">Rest</span>
            <Switch
              size="sm"
              checked={day.isRest}
              onCheckedChange={(checked: boolean) => onUpdateDay(day.id, { isRest: checked })}
            />
          </div>
        </div>
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
          <div className="flex-1 flex items-center justify-center min-h-[60px]">
            <p className="text-[11px] text-white/15 italic">rest</p>
          </div>
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
