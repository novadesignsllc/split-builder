import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { v4 as uuidv4 } from 'uuid'
import {
  GripVertical,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react'
import { MuscleGroupDay, ExerciseEntry, PlannedSet, Exercise } from '@/lib/types'
import { MUSCLE_TO_DB_MUSCLES, MUSCLE_COLORS, EQUIPMENT_OPTIONS } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import SetRow from '@/components/SetRow'
import { cn } from '@/lib/utils'

interface ExercisePanelProps {
  muscleGroupDay: MuscleGroupDay
  exercises: Exercise[]
  dayId: string
  onUpdateMuscleGroupDay: (dayId: string, mgId: string, updated: MuscleGroupDay) => void
  onRemoveMuscleGroup: (dayId: string, mgId: string) => void
  hideHeader?: boolean
}

interface SortableExerciseRowProps {
  entry: ExerciseEntry
  exercises: Exercise[]
  isExpanded: boolean
  onToggle: () => void
  onUpdateSets: (sets: PlannedSet[]) => void
  onRemove: () => void
}

function SortableExerciseRow({
  entry,
  exercises,
  isExpanded,
  onToggle,
  onUpdateSets,
  onRemove,
}: SortableExerciseRowProps) {
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
    opacity: isDragging ? 0.4 : 1,
  }

  const exercise = exercises.find(e => e.id === entry.exerciseId)
  const workingSets = entry.sets.filter(s => s.type !== 'W').length

  function addSet() {
    const newSet: PlannedSet = {
      id: uuidv4(),
      type: 'work',
      repRange: '8–12',
    }
    onUpdateSets([...entry.sets, newSet])
  }

  function updateSet(id: string, field: keyof PlannedSet, value: string) {
    onUpdateSets(
      entry.sets.map(s =>
        s.id === id ? { ...s, [field]: value } : s
      )
    )
  }

  function removeSet(id: string) {
    onUpdateSets(entry.sets.filter(s => s.id !== id))
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden"
    >
      <div className="flex items-center gap-1 px-2 py-1.5 h-9">
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 p-0.5 text-slate-700 hover:text-slate-500 cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>

        <span className="flex-1 min-w-0 text-xs font-medium text-slate-300 truncate">
          {exercise?.name ?? entry.exerciseId}
        </span>

        <span className="text-xs text-slate-600 mr-1">
          {workingSets} set{workingSets !== 1 ? 's' : ''}
        </span>

        <button
          onClick={onToggle}
          className="flex-shrink-0 p-0.5 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <button
          onClick={onRemove}
          className="flex-shrink-0 p-0.5 text-slate-700 hover:text-red-400 transition-colors"
          aria-label="Remove exercise"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-white/[0.05] px-1 pb-1">
          {entry.sets.map(set => (
            <SetRow
              key={set.id}
              set={set}
              onUpdate={updateSet}
              onRemove={removeSet}
            />
          ))}
          <button
            onClick={addSet}
            className="mt-1 ml-1 flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            <Plus size={12} />
            Add set
          </button>
        </div>
      )}
    </div>
  )
}

export default function ExercisePanel({
  muscleGroupDay,
  exercises,
  dayId,
  onUpdateMuscleGroupDay,
  onRemoveMuscleGroup,
  hideHeader = false,
}: ExercisePanelProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [equipment, setEquipment] = useState('All equipment')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 200)
    return () => clearTimeout(timer)
  }, [search])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  const dbMuscles = MUSCLE_TO_DB_MUSCLES[muscleGroupDay.muscleGroup] ?? []
  const plannedIds = new Set(muscleGroupDay.exercises.map(e => e.exerciseId))

  const filteredExercises = exercises
    .filter(ex => {
      const matchesMuscle = ex.primaryMuscles.some(m => dbMuscles.includes(m))
      const matchesSearch =
        debouncedSearch === '' ||
        ex.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      const matchesEquipment =
        equipment === 'All equipment' || ex.equipment === equipment
      return matchesMuscle && matchesSearch && matchesEquipment && !plannedIds.has(ex.id)
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 12)

  function addExercise(exercise: Exercise) {
    const newEntry: ExerciseEntry = {
      id: uuidv4(),
      exerciseId: exercise.id,
      sets: [
        { id: uuidv4(), type: 'work', repRange: '8–12' },
        { id: uuidv4(), type: 'work', repRange: '8–12' },
        { id: uuidv4(), type: 'work', repRange: '8–12' },
      ],
    }
    const updated: MuscleGroupDay = {
      ...muscleGroupDay,
      exercises: [...muscleGroupDay.exercises, newEntry],
    }
    onUpdateMuscleGroupDay(dayId, muscleGroupDay.id, updated)
  }

  function removeExercise(entryId: string) {
    const updated: MuscleGroupDay = {
      ...muscleGroupDay,
      exercises: muscleGroupDay.exercises.filter(e => e.id !== entryId),
    }
    onUpdateMuscleGroupDay(dayId, muscleGroupDay.id, updated)
  }

  const updateEntry = useCallback(
    (entryId: string, sets: PlannedSet[]) => {
      const updated: MuscleGroupDay = {
        ...muscleGroupDay,
        exercises: muscleGroupDay.exercises.map(e =>
          e.id === entryId ? { ...e, sets } : e
        ),
      }
      onUpdateMuscleGroupDay(dayId, muscleGroupDay.id, updated)
    },
    [muscleGroupDay, dayId, onUpdateMuscleGroupDay]
  )

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = muscleGroupDay.exercises.findIndex(e => e.id === active.id)
    const newIndex = muscleGroupDay.exercises.findIndex(e => e.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(muscleGroupDay.exercises, oldIndex, newIndex)
    onUpdateMuscleGroupDay(dayId, muscleGroupDay.id, {
      ...muscleGroupDay,
      exercises: reordered,
    })
  }

  const dotColor = MUSCLE_COLORS[muscleGroupDay.muscleGroup] ?? '#94a3b8'

  return (
    <div className="rounded-xl bg-[#0C1525] border border-white/[0.07] overflow-hidden">
      {!hideHeader && (
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.05]">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: dotColor }}
          />
          <span className="flex-1 text-sm font-semibold text-slate-200">
            {muscleGroupDay.muscleGroup}
          </span>
          <button
            onClick={() => onRemoveMuscleGroup(dayId, muscleGroupDay.id)}
            className="p-1 text-slate-600 hover:text-red-400 hover:bg-red-950/40 rounded-md transition-colors"
            aria-label={`Remove ${muscleGroupDay.muscleGroup}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      <div className="px-3 pt-2.5 pb-2 flex gap-2">
        <div className="relative flex-1">
          <Search
            size={12}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search exercises…"
            className="w-full h-7 pl-6 pr-2 text-xs rounded-md border border-white/[0.08] bg-white/[0.05] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors"
          />
        </div>
        <select
          value={equipment}
          onChange={e => setEquipment(e.target.value)}
          className="h-7 px-1.5 text-xs rounded-md border border-white/[0.08] bg-white/[0.05] text-slate-400 focus:outline-none focus:border-violet-500/50 transition-colors"
        >
          {EQUIPMENT_OPTIONS.map(opt => (
            <option key={opt} value={opt}>
              {opt === 'All equipment' ? 'All' : opt}
            </option>
          ))}
        </select>
      </div>

      {filteredExercises.length > 0 && (
        <div className="px-3 pb-2">
          <ScrollArea className="max-h-36">
            <div className="space-y-0.5">
              {filteredExercises.map(ex => (
                <div
                  key={ex.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] group"
                >
                  <span className="flex-1 min-w-0 text-xs text-slate-400 truncate">
                    {ex.name}
                  </span>
                  {ex.mechanic && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] h-4 px-1.5 flex-shrink-0',
                        ex.mechanic === 'compound'
                          ? 'border-violet-500/30 text-violet-400 bg-violet-950/40'
                          : 'border-white/[0.08] text-slate-500'
                      )}
                    >
                      {ex.mechanic}
                    </Badge>
                  )}
                  <button
                    onClick={() => addExercise(ex)}
                    className="flex-shrink-0 w-5 h-5 rounded-md bg-violet-600/20 text-violet-400 hover:bg-violet-600/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Add ${ex.name}`}
                  >
                    <Plus size={11} />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {filteredExercises.length === 0 && muscleGroupDay.exercises.length === 0 && (
        <p className="px-3 pb-2 text-xs text-slate-600 italic">
          No exercises found for {muscleGroupDay.muscleGroup}
        </p>
      )}

      {muscleGroupDay.exercises.length > 0 && (
        <div className="px-3 pb-3 border-t border-white/[0.05] pt-2">
          <p className="text-[10px] font-medium text-slate-600 uppercase tracking-widest mb-1.5">
            Planned
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={muscleGroupDay.exercises.map(e => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {muscleGroupDay.exercises.map(entry => (
                  <SortableExerciseRow
                    key={entry.id}
                    entry={entry}
                    exercises={exercises}
                    isExpanded={expandedIds.has(entry.id)}
                    onToggle={() => toggleExpand(entry.id)}
                    onUpdateSets={sets => updateEntry(entry.id, sets)}
                    onRemove={() => removeExercise(entry.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  )
}
