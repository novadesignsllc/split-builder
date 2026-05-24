import { useState, useEffect, useCallback, useRef } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { v4 as uuidv4 } from 'uuid'
import { GripVertical } from 'lucide-react'
import { Pencil, Check, X } from 'lucide-react'
import { Exercise, Split, DayConfig, ExerciseEntry } from '@/lib/types'
import {
  createDefaultSplit,
  loadCurrentSplit,
  saveCurrentSplit,
  saveSplit,
  loadAllSplits,
  deleteSplit,
  duplicateSplit,
} from '@/lib/storage'
import { computeDayTypeLabels } from '@/lib/analytics'
import TopBar from './TopBar'
import DayCard, { SortableExerciseRow } from './DayCard'
import AnalyticsPanel from './AnalyticsPanel'
import SplitTabBar from './SplitTabBar'
import ExercisePickerModal from './ExercisePickerModal'
import { cn } from '@/lib/utils'

interface SplitBuilderProps {
  exercises: Exercise[]
}

export function SplitBuilder({ exercises }: SplitBuilderProps) {
  const [split, setSplit] = useState<Split>(createDefaultSplit)
  const [savedSplits, setSavedSplits] = useState<Split[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)  // null = unsaved draft
  const [mounted, setMounted] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [pickerState, setPickerState] = useState<{ dayId: string; dayIndex: number; replaceEntryId?: string } | null>(null)
  const [activeDragEntry, setActiveDragEntry] = useState<{ entry: ExerciseEntry; dayId: string } | null>(null)
  const draftRef = useRef<Split | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  // ─── Boot ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const stored = loadCurrentSplit()
    if (stored) setSplit(stored)
    setSavedSplits(loadAllSplits())
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) saveCurrentSplit(split)
  }, [split, mounted])

  // ─── Computed ────────────────────────────────────────────────────────────

  const dayTypeLabels = computeDayTypeLabels(split, exercises)

  // ─── Navigation ─────────────────────────────────────────────────────────

  const handleNewSplit = useCallback(() => {
    draftRef.current = null
    setSplit(createDefaultSplit())
    setActiveId(null)
    setPickerState(null)
    setIsEditingName(false)
  }, [])

  const handleSelectSplit = useCallback((id: string | null) => {
    if (id === activeId) return
    if (activeId === null) draftRef.current = split
    if (id === null) {
      setSplit(draftRef.current ?? createDefaultSplit())
    } else {
      const found = savedSplits.find(s => s.id === id)
      if (found) setSplit(found)
    }
    setActiveId(id)
    setPickerState(null)
    setIsEditingName(false)
  }, [activeId, split, savedSplits])

  // ─── Name editing ────────────────────────────────────────────────────────

  function startEditingName() {
    setNameDraft(split.name)
    setIsEditingName(true)
  }

  function commitName() {
    setIsEditingName(false)
    const trimmed = nameDraft.trim()
    if (trimmed && trimmed !== split.name) {
      setSplit(prev => ({ ...prev, name: trimmed }))
    }
  }

  function cancelEditName() {
    setIsEditingName(false)
  }

  // ─── Split actions ───────────────────────────────────────────────────────

  const handleSave = useCallback(() => {
    let name = split.name
    if (!name || name === 'Untitled split') {
      const input = window.prompt('Name this split:', name)
      if (input === null) return
      name = input.trim() || 'Untitled split'
    }
    const toSave = { ...split, name }
    const saved = saveSplit(toSave)
    setSplit(saved)
    setSavedSplits(loadAllSplits())
    if (activeId === null) {
      draftRef.current = null
      setActiveId(saved.id)
    }
  }, [split, activeId])

  const handleDeleteSplit = useCallback((id: string) => {
    deleteSplit(id)
    setSavedSplits(loadAllSplits())
    if (activeId === id) {
      setActiveId(null)
      setSplit(draftRef.current ?? createDefaultSplit())
    }
  }, [activeId])

  const handleDuplicateSplit = useCallback((s: Split) => {
    duplicateSplit(s)
    setSavedSplits(loadAllSplits())
  }, [])

  // ─── Cycle/start day ─────────────────────────────────────────────────────

  const handleUpdateCycleDays = useCallback((cycleDays: number) => {
    setSplit(prev => {
      if (cycleDays === prev.days.length) return { ...prev, cycleDays }
      if (cycleDays > prev.days.length) {
        const extra: DayConfig[] = Array.from({ length: cycleDays - prev.days.length }, () => ({
          id: uuidv4(), label: '', isRest: false, exercises: [],
        }))
        return { ...prev, cycleDays, days: [...prev.days, ...extra] }
      }
      return { ...prev, cycleDays, days: prev.days.slice(0, cycleDays) }
    })
  }, [])

  const handleUpdateStartDay = useCallback((startDay: number) => {
    setSplit(prev => ({ ...prev, startDay }))
  }, [])

  const handleRenameSplit = useCallback((id: string, name: string) => {
    const target = savedSplits.find(s => s.id === id)
    if (!target) return
    saveSplit({ ...target, name })
    if (activeId === id) setSplit(prev => ({ ...prev, name }))
    setSavedSplits(loadAllSplits())
  }, [activeId, savedSplits])

  // ─── Day actions ─────────────────────────────────────────────────────────

  const handleUpdateDay = useCallback((dayId: string, updates: Partial<DayConfig>) => {
    setSplit(prev => ({
      ...prev,
      days: prev.days.map(d => d.id === dayId ? { ...d, ...updates } : d),
    }))
  }, [])

  const handleAddExercise = useCallback((dayId: string, entry: ExerciseEntry, replaceEntryId?: string) => {
    setSplit(prev => ({
      ...prev,
      days: prev.days.map(d => {
        if (d.id !== dayId) return d
        if (replaceEntryId) {
          // Swap in place
          return { ...d, exercises: d.exercises.map(e => e.id === replaceEntryId ? { ...entry, id: e.id } : e) }
        }
        return { ...d, exercises: [...d.exercises, entry] }
      }),
    }))
  }, [])

  const handleRemoveExercise = useCallback((dayId: string, entryId: string) => {
    setSplit(prev => ({
      ...prev,
      days: prev.days.map(d =>
        d.id === dayId ? { ...d, exercises: d.exercises.filter(e => e.id !== entryId) } : d
      ),
    }))
  }, [])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current
    if (data?.type !== 'exercise') return
    const sourceDayId = data.dayId as string
    const entryId = data.entryId as string
    const sourceDay = split.days.find(d => d.id === sourceDayId)
    const entry = sourceDay?.exercises.find(e => e.id === entryId)
    if (entry) setActiveDragEntry({ entry, dayId: sourceDayId })
  }, [split.days])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragEntry(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)
    const sourceDayId = active.data.current?.dayId as string | undefined
    const overData = over.data.current as { type?: string; dayId?: string } | undefined
    const targetDayId = overData?.dayId

    if (!sourceDayId || !targetDayId) return

    setSplit(prev => {
      const sourceDay = prev.days.find(d => d.id === sourceDayId)
      if (!sourceDay) return prev

      if (sourceDayId === targetDayId) {
        // ── Reorder within same day ──
        const oldIdx = sourceDay.exercises.findIndex(e => e.id === activeId)
        const newIdx = sourceDay.exercises.findIndex(e => e.id === overId)
        if (oldIdx === -1 || newIdx === -1) return prev
        return {
          ...prev,
          days: prev.days.map(d =>
            d.id === sourceDayId
              ? { ...d, exercises: arrayMove(d.exercises, oldIdx, newIdx) }
              : d
          ),
        }
      } else {
        // ── Move to different day ──
        const movingEntry = sourceDay.exercises.find(e => e.id === activeId)
        if (!movingEntry) return prev
        return {
          ...prev,
          days: prev.days.map(d => {
            if (d.id === sourceDayId) {
              return { ...d, exercises: d.exercises.filter(e => e.id !== activeId) }
            }
            if (d.id === targetDayId) {
              const insertIdx = d.exercises.findIndex(e => e.id === overId)
              const newExs = [...d.exercises]
              if (insertIdx === -1) {
                newExs.push(movingEntry)
              } else {
                newExs.splice(insertIdx, 0, movingEntry)
              }
              return { ...d, exercises: newExs }
            }
            return d
          }),
        }
      }
    })
  }, [])

  // ─── Exercise picker ─────────────────────────────────────────────────────

  const handleOpenPicker = useCallback((dayId: string, dayIndex: number, replaceEntryId?: string) => {
    setPickerState({ dayId, dayIndex, replaceEntryId })
  }, [])

  const pickerDay = pickerState
    ? split.days.find(d => d.id === pickerState.dayId)
    : null

  const alreadyAdded = pickerDay
    ? new Set(pickerDay.exercises.map(e => e.exerciseId))
    : new Set<string>()

  // ─── Render ──────────────────────────────────────────────────────────────

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-white/20 text-sm tracking-widest uppercase text-xs">Loading</div>
      </div>
    )
  }

  const overlayExercise = activeDragEntry
    ? exercises.find(e => e.id === activeDragEntry.entry.exerciseId)
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-32 -left-32 w-[700px] h-[700px] rounded-full bg-violet-950/60 blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-amber-950/35 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-indigo-950/25 blur-[100px]" />
      </div>

      <div className="flex flex-col h-screen bg-black overflow-hidden">
        <TopBar
          split={split}
          onUpdateCycleDays={handleUpdateCycleDays}
          onUpdateStartDay={handleUpdateStartDay}
          onSave={handleSave}
        />

        <div className="flex flex-1 min-h-0">
          {/* Main content */}
          <div className="flex flex-col flex-1 min-w-0">
            {/* Split name header */}
            <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <>
                    <input
                      autoFocus
                      type="text"
                      value={nameDraft}
                      onChange={e => setNameDraft(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitName()
                        if (e.key === 'Escape') cancelEditName()
                      }}
                      className="text-2xl font-bold text-white/90 bg-white/[0.05] border border-violet-500/35 rounded-xl px-3 py-1 outline-none focus:border-violet-400/60 min-w-0 max-w-sm"
                    />
                    <button onClick={commitName} className="p-1.5 text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-950/30 rounded-lg transition-colors">
                      <Check size={15} />
                    </button>
                    <button onClick={cancelEditName} className="p-1.5 text-white/30 hover:text-white/60 hover:bg-white/[0.05] rounded-lg transition-colors">
                      <X size={15} />
                    </button>
                  </>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-white/85 tracking-tight">{split.name}</h1>
                    <button
                      onClick={startEditingName}
                      className="p-1.5 text-white/20 hover:text-white/60 hover:bg-white/[0.05] rounded-lg transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Builder area */}
            <div className="flex-1 overflow-auto p-4 min-h-0">
              {/* Subtitle */}
              <div className="mb-4">
                <p className="text-sm font-medium text-white/60">Arrange your workouts</p>
                <p className="text-xs text-white/25">Add exercises to each day — the type is detected automatically</p>
              </div>

              {/* Day columns */}
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: split.cycleDays <= 7
                    ? `repeat(${split.cycleDays}, 1fr)`
                    : `repeat(${split.cycleDays}, minmax(160px, 1fr))`,
                }}
              >
                {split.days.map((day, index) => (
                  <DayCard
                    key={day.id}
                    day={day}
                    dayIndex={index}
                    startDay={split.startDay}
                    exercises={exercises}
                    dayType={dayTypeLabels[index]?.type ?? null}
                    typeRank={dayTypeLabels[index]?.rank ?? 0}
                    onUpdateDay={handleUpdateDay}
                    onRemoveExercise={handleRemoveExercise}
                    onOpenPicker={handleOpenPicker}
                  />
                ))}
              </div>

            </div>

            <AnalyticsPanel split={split} exercises={exercises} />
            <SplitTabBar
              savedSplits={savedSplits}
              activeId={activeId}
              draftName={split.name}
              onSelectSplit={handleSelectSplit}
              onNewSplit={handleNewSplit}
              onDeleteSplit={handleDeleteSplit}
              onDuplicateSplit={handleDuplicateSplit}
              onRenameSplit={handleRenameSplit}
            />
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {overlayExercise && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.15] shadow-2xl text-xs text-white/80 cursor-grabbing select-none"
            style={{ background: 'rgba(15,15,25,0.95)', backdropFilter: 'blur(24px)', maxWidth: 240 }}
          >
            <GripVertical size={13} className="text-white/30 flex-shrink-0" />
            <span className="leading-snug">{overlayExercise.name}</span>
          </div>
        )}
      </DragOverlay>

      {/* Exercise picker modal */}
      {pickerState && (
        <ExercisePickerModal
          isOpen
          onClose={() => setPickerState(null)}
          dayId={pickerState.dayId}
          dayIndex={pickerState.dayIndex}
          startDay={split.startDay}
          exercises={exercises}
          alreadyAdded={alreadyAdded}
          replaceEntryId={pickerState.replaceEntryId}
          onAddExercise={(dayId, entry) => {
            handleAddExercise(dayId, entry, pickerState.replaceEntryId)
            if (pickerState.replaceEntryId) setPickerState(null)
          }}
        />
      )}
    </DndContext>
  )
}

function TabButton({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      className={cn(
        'px-4 py-2 text-sm font-medium transition-colors rounded-t-lg relative',
        active
          ? 'text-white/85'
          : 'text-white/30 hover:text-white/55'
      )}
    >
      {label}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-400 rounded-t-full" />
      )}
    </button>
  )
}
