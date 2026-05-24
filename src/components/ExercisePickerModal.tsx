import { useState, useEffect, useMemo } from 'react'
import { X, Search, Plus } from 'lucide-react'
import { Exercise, ExerciseEntry, PlannedSet } from '@/lib/types'
import { EQUIPMENT_OPTIONS, MUSCLE_GROUPS, MUSCLE_TO_DB_MUSCLES, MUSCLE_COLORS } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid'
import { getDayNameFull } from '@/lib/days'

interface ExercisePickerModalProps {
  isOpen: boolean
  onClose: () => void
  dayId: string
  dayIndex: number
  startDay: number
  exercises: Exercise[]
  alreadyAdded: Set<string>
  replaceEntryId?: string
  onAddExercise: (dayId: string, entry: ExerciseEntry) => void
}

export default function ExercisePickerModal({
  isOpen,
  onClose,
  dayId,
  dayIndex,
  startDay,
  exercises,
  alreadyAdded,
  replaceEntryId,
  onAddExercise,
}: ExercisePickerModalProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [equipment, setEquipment] = useState('All equipment')
  const [muscleFilter, setMuscleFilter] = useState('All muscles')
  const [addedThisSession, setAddedThisSession] = useState<Set<string>>(new Set())

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 180)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (!isOpen) {
      setSearch('')
      setDebouncedSearch('')
      setEquipment('All equipment')
      setMuscleFilter('All muscles')
      setAddedThisSession(new Set())
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const dbMusclesForFilter = useMemo(() => {
    if (muscleFilter === 'All muscles') return null
    return MUSCLE_TO_DB_MUSCLES[muscleFilter] ?? null
  }, [muscleFilter])

  const filtered = useMemo(() => {
    return exercises
      .filter(ex => {
        if (alreadyAdded.has(ex.id) && !addedThisSession.has(ex.id)) return false
        if (alreadyAdded.has(ex.id)) return false
        const matchSearch = debouncedSearch === '' ||
          ex.name.toLowerCase().includes(debouncedSearch.toLowerCase())
        const matchEquip = equipment === 'All equipment' || ex.equipment === equipment
        const matchMuscle = !dbMusclesForFilter ||
          ex.primaryMuscles.some(m => dbMusclesForFilter.includes(m))
        return matchSearch && matchEquip && matchMuscle
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [exercises, alreadyAdded, addedThisSession, debouncedSearch, equipment, dbMusclesForFilter])

  function handleAdd(ex: Exercise) {
    const entry: ExerciseEntry = {
      id: uuidv4(),
      exerciseId: ex.id,
      sets: [
        { id: uuidv4(), type: 'work', repRange: '8–12' },
        { id: uuidv4(), type: 'work', repRange: '8–12' },
        { id: uuidv4(), type: 'work', repRange: '8–12' },
      ],
    }
    onAddExercise(dayId, entry)
    setAddedThisSession(prev => new Set([...prev, ex.id]))
  }

  if (!isOpen) return null

  const dayName = getDayNameFull(startDay, dayIndex)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-xl mx-4 flex flex-col rounded-2xl border border-white/[0.09] shadow-2xl shadow-black/70 overflow-hidden"
        style={{ background: 'rgba(10,10,18,0.97)', backdropFilter: 'blur(32px)', maxHeight: '82vh' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.07] flex-shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/30 uppercase tracking-widest">{replaceEntryId ? 'Replace in' : 'Add to'}</p>
            <p className="text-sm font-semibold text-white/80">{dayName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/30 hover:text-white/70 hover:bg-white/[0.06] rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filters */}
        <div className="px-4 pt-3 pb-2 flex gap-2 flex-shrink-0">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search exercises…"
              autoFocus
              className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.06] transition-colors"
            />
          </div>

          <select
            value={muscleFilter}
            onChange={e => setMuscleFilter(e.target.value)}
            className="h-8 px-2 text-xs rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/50 focus:outline-none focus:border-violet-500/40 transition-colors"
          >
            <option value="All muscles" className="bg-[#0a0a12]">All muscles</option>
            {MUSCLE_GROUPS.map(mg => (
              <option key={mg} value={mg} className="bg-[#0a0a12]">{mg}</option>
            ))}
          </select>

          <select
            value={equipment}
            onChange={e => setEquipment(e.target.value)}
            className="h-8 px-2 text-xs rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/50 focus:outline-none focus:border-violet-500/40 transition-colors"
          >
            {EQUIPMENT_OPTIONS.map(opt => (
              <option key={opt} value={opt} className="bg-[#0a0a12]">
                {opt === 'All equipment' ? 'All gear' : opt}
              </option>
            ))}
          </select>
        </div>

        {/* Results count */}
        <div className="px-5 pb-1 flex-shrink-0">
          <p className="text-[10px] text-white/20">
            {filtered.length} exercise{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Exercise list */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-sm text-white/20 italic">
              No exercises match
            </div>
          ) : (
            <div className="space-y-0.5">
              {filtered.map(ex => {
                const primaryMuscle = ex.primaryMuscles[0] ?? ''
                const muscleGroup = Object.entries(MUSCLE_TO_DB_MUSCLES).find(
                  ([, dbMs]) => dbMs.includes(primaryMuscle)
                )?.[0]
                const dotColor = muscleGroup ? (MUSCLE_COLORS[muscleGroup] ?? '#7C3AED') : '#7C3AED'

                return (
                  <div
                    key={ex.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.04] group cursor-pointer transition-colors"
                    onClick={() => handleAdd(ex)}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: dotColor }}
                    />
                    <span className="flex-1 min-w-0 text-sm text-white/65 group-hover:text-white/90 truncate transition-colors">
                      {ex.name}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {ex.mechanic && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] h-4 px-1.5',
                            ex.mechanic === 'compound'
                              ? 'border-violet-500/25 text-violet-400/70 bg-violet-950/30'
                              : 'border-white/[0.06] text-white/25'
                          )}
                        >
                          {ex.mechanic}
                        </Badge>
                      )}
                      <span className="w-5 h-5 rounded-md flex items-center justify-center bg-violet-600/20 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus size={11} />
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
