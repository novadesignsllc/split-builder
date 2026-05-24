import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragEndEvent,
} from '@dnd-kit/core'
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

// ─── Rank labels ─────────────────────────────────────────────────────────

const RANK_LABELS = ['Primary', 'Secondary', 'Tertiary', 'Quaternary']

function rankLabel(rank: number): string {
  return RANK_LABELS[rank - 1] ?? `Day ${rank}`
}

// ─── Sortable exercise row ────────────────────────────────────────────────

function SortableExerciseRow({
  entry,
  exercises,
  onRemove,
}: {
  entry: ExerciseEntry
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
  } = useSortable({ id: entry.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  }

  const exercise = exercises.find(e => e.id === entry.exerciseId)

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, background: 'rgba(255,255,255,0.03)' }}
      className="flex items-center gap-1.5 group px-2 py-2 rounded-xl border border-white/[0.07] hover:border-white/[0.12] transition-colors"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 p-0.5 text-white/15 group-hover:text-white/40 cursor-grab active:cursor-grabbing transition-colors"
        aria-label="Drag to reorder"
      >
        <GripVertical size={13} />
      </button>

      {/* Name — wraps naturally, no truncation */}
      <span className="flex-1 text-xs text-white/75 leading-snug">
        {exercise?.name ?? '—'}
      </span>

      {/* ⋮ menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex-shrink-0 p-1 rounded-md text-white/20 hover:text-white/60 hover:bg-white/[0.06] transition-colors outline-none opacity-0 group-hover:opacity-100"
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
  onReorderExercises: (dayId: string, exercises: ExerciseEntry[]) => void
  onRemoveExercise: (dayId: string, exerciseId: string) => void
  onOpenPicker: (dayId: string, dayIndex: number) => void
}

export default function DayCard({
  day,
  dayIndex,
  startDay,
  exercises,
  dayType,
  typeRank,
  onUpdateDay,
  onReorderExercises,
  onRemoveExercise,
  onOpenPicker,
}: DayCardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  const dayName = getDayNameFull(startDay, dayIndex).toUpperCase()
  const typeColor = dayType ? (DAY_TYPE_COLORS[dayType] ?? '#7C3AED') : '#6b7280'

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = day.exercises.findIndex(e => e.id === active.id)
    const newIdx = day.exercises.findIndex(e => e.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return
    onReorderExercises(day.id, arrayMove(day.exercises, oldIdx, newIdx))
  }

  // Hex → subtle rgba background tint
  const bgTint = typeColor !== '#6b7280'
    ? `${typeColor}0f`   // ~6% opacity tint from the accent colour
    : undefined

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl min-w-0 overflow-hidden transition-all',
        day.isRest && 'opacity-60'
      )}
      style={{
        background: bgTint
          ? `linear-gradient(160deg, ${typeColor}12 0%, rgba(255,255,255,0.015) 60%)`
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

      {/* Type badge */}
      {!day.isRest && (
        <div className="px-3 pb-2.5 flex-shrink-0">
          {dayType ? (
            <p className="text-sm font-semibold text-white/80 leading-none">{dayType}</p>
          ) : null}
        </div>
      )}

      {/* Rest day content */}
      {day.isRest && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 px-3 pb-4 min-h-[80px]">
          <Moon size={18} className="text-white/15" />
          <p className="text-xs text-white/20">Rest</p>
        </div>
      )}

      {/* Exercise list (workout days) */}
      {!day.isRest && (
        <div className="flex-1 px-2 pb-2 flex flex-col min-h-[60px]">
          {day.exercises.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
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
                      exercises={exercises}
                      onRemove={() => onRemoveExercise(day.id, entry.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Add workout button */}
          <button
            onClick={() => onOpenPicker(day.id, dayIndex)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-white/25 hover:text-white/70 hover:bg-white/[0.05] transition-all w-full mt-auto"
          >
            <Plus size={12} className="flex-shrink-0" />
            <span className="text-xs">Add Workout</span>
          </button>
        </div>
      )}
    </div>
  )
}
