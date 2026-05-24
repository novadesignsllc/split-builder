import { useState, useEffect, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Pencil, Check, X, Plus, Moon } from 'lucide-react'
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
import DayCard from './DayCard'
import AnalyticsPanel from './AnalyticsPanel'
import SplitSidebar from './SplitSidebar'
import ExercisePickerModal from './ExercisePickerModal'
import { cn } from '@/lib/utils'

interface SplitBuilderProps {
  exercises: Exercise[]
}

export function SplitBuilder({ exercises }: SplitBuilderProps) {
  const [split, setSplit] = useState<Split>(createDefaultSplit)
  const [savedSplits, setSavedSplits] = useState<Split[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)  // null = unsaved draft
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [pickerState, setPickerState] = useState<{ dayId: string; dayIndex: number } | null>(null)
  const draftRef = useRef<Split | null>(null)

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

  // ─── Day actions ─────────────────────────────────────────────────────────

  const handleUpdateDay = useCallback((dayId: string, updates: Partial<DayConfig>) => {
    setSplit(prev => ({
      ...prev,
      days: prev.days.map(d => d.id === dayId ? { ...d, ...updates } : d),
    }))
  }, [])

  const handleAddExercise = useCallback((dayId: string, entry: ExerciseEntry) => {
    setSplit(prev => ({
      ...prev,
      days: prev.days.map(d =>
        d.id === dayId ? { ...d, exercises: [...d.exercises, entry] } : d
      ),
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

  const handleReorderExercises = useCallback((dayId: string, reordered: ExerciseEntry[]) => {
    setSplit(prev => ({
      ...prev,
      days: prev.days.map(d => d.id === dayId ? { ...d, exercises: reordered } : d),
    }))
  }, [])

  const handleAddRestDay = useCallback(() => {
    if (split.cycleDays >= 21) return
    const newDay: DayConfig = { id: uuidv4(), label: '', isRest: true, exercises: [] }
    setSplit(prev => ({
      ...prev,
      cycleDays: prev.cycleDays + 1,
      days: [...prev.days, newDay],
    }))
  }, [split.cycleDays])

  const handleAddWorkoutDay = useCallback(() => {
    if (split.cycleDays >= 21) return
    const newDay: DayConfig = { id: uuidv4(), label: '', isRest: false, exercises: [] }
    setSplit(prev => ({
      ...prev,
      cycleDays: prev.cycleDays + 1,
      days: [...prev.days, newDay],
    }))
  }, [split.cycleDays])

  // ─── Exercise picker ─────────────────────────────────────────────────────

  const handleOpenPicker = useCallback((dayId: string, dayIndex: number) => {
    setPickerState({ dayId, dayIndex })
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

  return (
    <>
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
          onToggleSidebar={() => setSidebarOpen(o => !o)}
        />

        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div className={cn(
            'flex-shrink-0 overflow-hidden transition-[width] duration-200',
            sidebarOpen ? 'w-52 border-r border-white/[0.07]' : 'w-0'
          )}>
            <SplitSidebar
              savedSplits={savedSplits}
              activeId={activeId}
              onSelectSplit={handleSelectSplit}
              onNewSplit={handleNewSplit}
              onDeleteSplit={handleDeleteSplit}
              onDuplicateSplit={handleDuplicateSplit}
            />
          </div>

          {/* Main content */}
          <div className="flex flex-col flex-1 min-w-0">
            {/* Split name + tabs header */}
            <div className="flex-shrink-0 px-6 pt-5 pb-0 border-b border-white/[0.05]">
              {/* Editable split name */}
              <div className="flex items-center gap-2 mb-3">
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

              {/* Tabs */}
              <div className="flex gap-1">
                <TabButton active label="Split Planner" />
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
                    onReorderExercises={handleReorderExercises}
                    onRemoveExercise={handleRemoveExercise}
                    onOpenPicker={handleOpenPicker}
                  />
                ))}
              </div>

              {/* Add rest / custom day buttons */}
              {split.cycleDays < 21 && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleAddRestDay}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.07] text-sm text-white/40 hover:text-white/70 hover:border-white/[0.14] transition-all"
                    style={{ background: 'rgba(255,255,255,0.02)' }}
                  >
                    <Moon size={14} className="flex-shrink-0" />
                    Add Rest Day
                  </button>
                  <button
                    onClick={handleAddWorkoutDay}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.07] text-sm text-white/40 hover:text-white/70 hover:border-white/[0.14] transition-all"
                    style={{ background: 'rgba(255,255,255,0.02)' }}
                  >
                    <Plus size={14} className="flex-shrink-0" />
                    Add Custom Day
                  </button>
                </div>
              )}
            </div>

            <AnalyticsPanel split={split} exercises={exercises} />
          </div>
        </div>
      </div>

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
          onAddExercise={handleAddExercise}
        />
      )}
    </>
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
