import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Plus, GripVertical, MoreHorizontal, X, Moon, Trash2 } from 'lucide-react'
import { DayConfig, Exercise, ExerciseEntry, DayType } from '@/lib/types'
import { DAY_TYPE_COLORS } from '@/lib/constants'
import { getDayNameFull } from '@/lib/days'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

// ─── Sortable exercise row ────────────────────────────────────────────────

export function SortableExerciseRow({
  entry,
  dayId,
  exercises,
  onRemove,
}: {
  entry: ExerciseEntry
  dayId: string
  exercises: Exercise[]
  onRemove: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: entry.id,
    data: { type: 'exercise', dayId, entryId: entry.id },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.25 : 1,
  }

  const exercise = exercises.find(e => e.id === entry.exerciseId)

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, background: 'rgba(255,255,255,0.03)' }}
      className="flex items-center gap-1.5 group/row px-2 py-2 rounded-xl border border-white/[0.07] hover:border-white/[0.12] transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 p-0.5 text-white/15 group-hover/row:text-white/40 cursor-grab active:cursor-grabbing transition-colors"
        aria-label="Drag to reorder"
      >
        <GripVertical size={13} />
      </button>

      <span className="flex-1 text-xs text-white/75 leading-snug">
        {exercise?.name ?? '—'}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex-shrink-0 p-1 rounded-md text-white/20 hover:text-white/60 hover:bg-white/[0.06] transition-colors outline-none opacity-0 group-hover/row:opacity-100"
          onClick={e => e.stopPropagation()}
        >
          <MoreHorizontal size={13} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={4}
          className="w-32 border border-white/[0.08] p-1"
          style={{ background: 'rgba(8,8,14,0.97)', backdropFilter: 'blur(32px)' }}
        >
          <DropdownMenuItem
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-red-400/70 hover:text-red-400 hover:bg-red-950/30 cursor-pointer"
            onClick={e => { e.stopPropagation(); onRemove() }}
          >
            <Trash2 size={11} /> Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// ─── DayCard ──────────────────────────────────────────────────────────────

interface DayCardProps {
  day: DayConfig
  dayIndex: number
  startDay: number
  exercises: Exercise[]
  dayType: DayType
  typeRank: number
  onUpdateDay: (dayId: string, updates: Partial<DayConfig>) => void
  onRemoveExercise: (dayId: string, entryId: string) => void
  onOpenPicker: (dayId: string, dayIndex: number) => void
}

export default function DayCard({
  day,
  dayIndex,
  startDay,
  exercises,
  dayType,
  onUpdateDay,
  onRemoveExercise,
  onOpenPicker,
}: DayCardProps) {
  const dayName = getDayNameFull(startDay, dayIndex).toUpperCase()
  const typeColor = dayType ? (DAY_TYPE_COLORS[dayType] ?? '#7C3AED') : '#6b7280'

  // Droppable zone covering the whole exercise list area
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `day-drop-${day.id}`,
    data: { type: 'day', dayId: day.id },
    disabled: day.isRest,
  })

  return (
    <div
      className={cn(
        'group flex flex-col rounded-xl min-w-0 overflow-hidden transition-all',
        day.isRest && 'opacity-60'
      )}
      style={{
        background: dayType
          ? `linear-gradient(160deg, ${typeColor}40 0%, ${typeColor}18 100%)`
          : 'rgba(255,255,255,0.025)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Day name header */}
      <div className="px-3 pt-3 pb-2 flex items-center justify-between flex-shrink-0">
        <span className="text-[10px] font-semibold text-white/40 tracking-[0.12em] flex-1 text-center">
          {dayName}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger className="p-1 text-white/20 hover:text-white/60 hover:bg-white/[0.05] rounded-md transition-colors outline-none">
            <MoreHorizontal size={13} />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={4}
            className="w-40 border border-white/[0.08] p-1"
            style={{ background: 'rgba(8,8,14,0.97)', backdropFilter: 'blur(32px)' }}
          >
            <DropdownMenuItem
              className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-white/60 hover:text-white hover:bg-white/[0.06] cursor-pointer"
              onClick={() => onUpdateDay(day.id, { isRest: !day.isRest })}
            >
              <Moon size={12} />
              {day.isRest ? 'Make workout day' : 'Mark as rest day'}
            </DropdownMenuItem>
            {!day.isRest && day.exercises.length > 0 && (
              <DropdownMenuItem
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-red-400/70 hover:text-red-400 hover:bg-red-950/30 cursor-pointer"
                onClick={() => onUpdateDay(day.id, { exercises: [] })}
              >
                <X size={12} />
                Clear all exercises
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Type label */}
      {!day.isRest && dayType && (
        <div className="px-3 pb-2.5 flex-shrink-0">
          <p className="text-sm font-semibold text-white/80 leading-none">{dayType}</p>
        </div>
      )}

      {/* Rest day */}
      {day.isRest && (
        <div className="flex flex-col items-center justify-center gap-2 px-3 pb-4 min-h-[80px]">
          <Moon size={18} className="text-white/15" />
          <p className="text-xs text-white/20">Rest</p>
        </div>
      )}

      {/* Exercise list */}
      {!day.isRest && (
        <div
          ref={setDropRef}
          className={cn(
            'px-2 pb-2 flex flex-col transition-colors rounded-b-xl min-h-[32px]',
            isOver && 'bg-white/[0.04]'
          )}
        >
          <SortableContext
            items={day.exercises.map(e => e.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-0.5 mb-1">
              {day.exercises.map(entry => (
                <SortableExerciseRow
                  key={entry.id}
                  entry={entry}
                  dayId={day.id}
                  exercises={exercises}
                  onRemove={() => onRemoveExercise(day.id, entry.id)}
                />
              ))}
            </div>
          </SortableContext>

          {/* Add workout — visible on hover */}
          <button
            onClick={() => onOpenPicker(day.id, dayIndex)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.05] transition-all w-full opacity-0 group-hover:opacity-100"
          >
            <Plus size={12} className="flex-shrink-0" />
            <span className="text-xs">Add Workout</span>
          </button>
        </div>
      )}
    </div>
  )
}
