import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { v4 as uuidv4 } from 'uuid'
import { GripVertical } from 'lucide-react'
import { Exercise, Split, DayConfig, MuscleGroupDay } from '@/lib/types'
import {
  createDefaultSplit,
  loadCurrentSplit,
  saveCurrentSplit,
  saveSplit,
  loadAllSplits,
  deleteSplit,
  duplicateSplit,
} from '@/lib/storage'
import TopBar from './TopBar'
import MuscleGroupBar from './MuscleGroupSidebar'
import DayCard from './DayCard'
import AnalyticsPanel from './AnalyticsPanel'
import Dashboard from './Dashboard'
import ExerciseModal from './ExerciseModal'
import { MUSCLE_COLORS } from '@/lib/constants'

interface SplitBuilderProps {
  exercises: Exercise[]
}

export type AppView = 'builder' | 'dashboard'

export function SplitBuilder({ exercises }: SplitBuilderProps) {
  const [split, setSplit] = useState<Split>(createDefaultSplit)
  const [savedSplits, setSavedSplits] = useState<Split[]>([])
  const [activeDragMuscle, setActiveDragMuscle] = useState<string | null>(null)
  const [activeDragType, setActiveDragType] = useState<string | null>(null)
  const [view, setView] = useState<AppView>('builder')
  const [exerciseModal, setExerciseModal] = useState<{
    dayId: string
    mgId: string
  } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = loadCurrentSplit()
    if (stored) setSplit(stored)
    setSavedSplits(loadAllSplits())
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) saveCurrentSplit(split)
  }, [split, mounted])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current
    if (data?.type === 'muscleGroup' || data?.type === 'muscleGroupFromDay') {
      setActiveDragMuscle(data.muscleGroup as string)
      setActiveDragType(data.type as string)
    }
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragMuscle(null)
    setActiveDragType(null)
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current
    const overId = String(over.id)
    if (!overId.startsWith('day-')) return
    const targetDayId = overId.replace('day-', '')

    if (activeData?.type === 'muscleGroup') {
      const muscleGroup = activeData.muscleGroup as string
      setSplit(prev => {
        const day = prev.days.find(d => d.id === targetDayId)
        if (!day || day.isRest) return prev
        if (day.muscleGroups.some(mg => mg.muscleGroup === muscleGroup)) return prev
        return {
          ...prev,
          days: prev.days.map(d =>
            d.id === targetDayId
              ? { ...d, muscleGroups: [...d.muscleGroups, { id: uuidv4(), muscleGroup, exercises: [] }] }
              : d
          ),
        }
      })
    } else if (activeData?.type === 'muscleGroupFromDay') {
      const { fromDayId, mgId, muscleGroup } = activeData as {
        fromDayId: string; mgId: string; muscleGroup: string
      }
      if (targetDayId === fromDayId) return
      setSplit(prev => {
        const sourceMg = prev.days.find(d => d.id === fromDayId)?.muscleGroups.find(mg => mg.id === mgId)
        if (!sourceMg) return prev
        const targetDay = prev.days.find(d => d.id === targetDayId)
        if (!targetDay || targetDay.isRest) return prev
        if (targetDay.muscleGroups.some(mg => mg.muscleGroup === muscleGroup)) return prev
        return {
          ...prev,
          days: prev.days.map(d => {
            if (d.id === fromDayId) return { ...d, muscleGroups: d.muscleGroups.filter(mg => mg.id !== mgId) }
            if (d.id === targetDayId) return { ...d, muscleGroups: [...d.muscleGroups, sourceMg] }
            return d
          }),
        }
      })
    }
  }, [])

  const handleUpdateName = useCallback((name: string) => {
    setSplit(prev => ({ ...prev, name }))
  }, [])

  const handleUpdateCycleDays = useCallback((cycleDays: number) => {
    setSplit(prev => {
      const current = prev.days.length
      if (cycleDays === current) return { ...prev, cycleDays }
      if (cycleDays > current) {
        const extra: DayConfig[] = Array.from({ length: cycleDays - current }, () => ({
          id: uuidv4(), label: '', isRest: false, muscleGroups: [],
        }))
        return { ...prev, cycleDays, days: [...prev.days, ...extra] }
      }
      return { ...prev, cycleDays, days: prev.days.slice(0, cycleDays) }
    })
  }, [])

  const handleUpdateStartDay = useCallback((startDay: number) => {
    setSplit(prev => ({ ...prev, startDay }))
  }, [])

  const handleNew = useCallback(() => {
    setSplit(createDefaultSplit())
    setExerciseModal(null)
  }, [])

  const handleSave = useCallback(() => {
    let name = split.name
    if (!name || name === 'Untitled split') {
      const input = window.prompt('Name this split:', name)
      if (input === null) return
      name = input.trim() || 'Untitled split'
    }
    const toSave = { ...split, name }
    setSplit(toSave)
    const saved = saveSplit(toSave)
    setSavedSplits(loadAllSplits())
    setSplit(saved)
  }, [split])

  const handleLoad = useCallback((loaded: Split) => {
    setSplit(loaded)
    setExerciseModal(null)
    setView('builder')
  }, [])

  const handleDeleteSaved = useCallback((id: string) => {
    deleteSplit(id)
    setSavedSplits(loadAllSplits())
  }, [])

  const handleDuplicateSaved = useCallback((s: Split) => {
    duplicateSplit(s)
    setSavedSplits(loadAllSplits())
  }, [])

  const handleUpdateDay = useCallback((dayId: string, updates: Partial<DayConfig>) => {
    setSplit(prev => ({
      ...prev,
      days: prev.days.map(d => (d.id === dayId ? { ...d, ...updates } : d)),
    }))
  }, [])

  const handleUpdateMuscleGroupDay = useCallback((dayId: string, mgId: string, updated: MuscleGroupDay) => {
    setSplit(prev => ({
      ...prev,
      days: prev.days.map(d =>
        d.id === dayId
          ? { ...d, muscleGroups: d.muscleGroups.map(mg => (mg.id === mgId ? updated : mg)) }
          : d
      ),
    }))
  }, [])

  const handleRemoveMuscleGroup = useCallback((dayId: string, mgId: string) => {
    setSplit(prev => ({
      ...prev,
      days: prev.days.map(d =>
        d.id === dayId ? { ...d, muscleGroups: d.muscleGroups.filter(mg => mg.id !== mgId) } : d
      ),
    }))
    setExerciseModal(prev => (prev?.dayId === dayId && prev?.mgId === mgId ? null : prev))
  }, [])

  const handleOpenExerciseModal = useCallback((dayId: string, mgId: string) => {
    setExerciseModal({ dayId, mgId })
  }, [])

  const exerciseModalMG = exerciseModal
    ? split.days.find(d => d.id === exerciseModal.dayId)?.muscleGroups.find(mg => mg.id === exerciseModal.mgId)
    : null

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-white/20 text-sm tracking-widest uppercase text-xs">Loading</div>
      </div>
    )
  }

  if (view === 'dashboard') {
    return (
      <div className="flex flex-col h-screen bg-black relative">
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-32 -left-32 w-[700px] h-[700px] rounded-full bg-violet-950/60 blur-[140px]" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-amber-950/40 blur-[120px]" />
        </div>
        <TopBar
          split={split}
          savedSplits={savedSplits}
          view={view}
          onUpdateName={handleUpdateName}
          onUpdateCycleDays={handleUpdateCycleDays}
          onUpdateStartDay={handleUpdateStartDay}
          onNew={handleNew}
          onSave={handleSave}
          onLoad={handleLoad}
          onDeleteSaved={handleDeleteSaved}
          onDuplicateSaved={handleDuplicateSaved}
          onToggleView={() => setView('builder')}
        />
        <Dashboard
          savedSplits={savedSplits}
          exercises={exercises}
          onEditSplit={handleLoad}
          onDeleteSplit={handleDeleteSaved}
          onDuplicateSplit={handleDuplicateSaved}
          onNewSplit={handleNew}
        />
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-screen bg-black overflow-hidden">
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-32 -left-32 w-[700px] h-[700px] rounded-full bg-violet-950/60 blur-[140px]" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-amber-950/40 blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-indigo-950/30 blur-[100px]" />
        </div>
        <TopBar
          split={split}
          savedSplits={savedSplits}
          view={view}
          onUpdateName={handleUpdateName}
          onUpdateCycleDays={handleUpdateCycleDays}
          onUpdateStartDay={handleUpdateStartDay}
          onNew={handleNew}
          onSave={handleSave}
          onLoad={handleLoad}
          onDeleteSaved={handleDeleteSaved}
          onDuplicateSaved={handleDuplicateSaved}
          onToggleView={() => setView('dashboard')}
        />

        <div className="flex-1 overflow-auto p-4 min-h-0">
          <div
            className="grid gap-1 h-full"
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
                onUpdateDay={handleUpdateDay}
                onUpdateMuscleGroupDay={handleUpdateMuscleGroupDay}
                onRemoveMuscleGroup={handleRemoveMuscleGroup}
                onOpenExerciseModal={handleOpenExerciseModal}
              />
            ))}
          </div>
        </div>

        <MuscleGroupBar />
        <AnalyticsPanel split={split} exercises={exercises} />
      </div>

      {exerciseModal && exerciseModalMG && (
        <ExerciseModal
          isOpen
          onClose={() => setExerciseModal(null)}
          muscleGroupDay={exerciseModalMG}
          exercises={exercises}
          dayId={exerciseModal.dayId}
          onUpdateMuscleGroupDay={handleUpdateMuscleGroupDay}
          onRemoveMuscleGroup={handleRemoveMuscleGroup}
        />
      )}

      <DragOverlay>
        {activeDragMuscle && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 shadow-2xl text-sm font-medium cursor-grabbing select-none text-white/90"
            style={{
              background: 'rgba(0,0,0,0.80)',
              backdropFilter: 'blur(24px)',
              boxShadow: `0 0 24px ${MUSCLE_COLORS[activeDragMuscle] ?? '#7C3AED'}33`,
            }}
          >
            {activeDragType === 'muscleGroupFromDay' && (
              <GripVertical size={13} className="text-white/30 flex-shrink-0" />
            )}
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: MUSCLE_COLORS[activeDragMuscle] ?? '#7C3AED' }}
            />
            {activeDragMuscle}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
