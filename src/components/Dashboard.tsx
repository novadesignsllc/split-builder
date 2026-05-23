import { useState } from 'react'
import { Plus, Pencil, Copy, Trash2, X, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react'
import { Split, Exercise } from '@/lib/types'
import { MUSCLE_COLORS } from '@/lib/constants'
import { computeFrequencyWarnings, computeVolumeChart } from '@/lib/analytics'
import { getDayName } from '@/lib/days'
import { cn } from '@/lib/utils'

interface DashboardProps {
  savedSplits: Split[]
  exercises: Exercise[]
  onEditSplit: (split: Split) => void
  onDeleteSplit: (id: string) => void
  onDuplicateSplit: (split: Split) => void
  onNewSplit: () => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface SplitDetailModalProps {
  split: Split
  exercises: Exercise[]
  onEdit: () => void
  onClose: () => void
}

function SplitDetailModal({ split, exercises, onEdit, onClose }: SplitDetailModalProps) {
  const warnings = computeFrequencyWarnings(split)
  const volumeData = computeVolumeChart(split, exercises, split.cycleDays)
  const topMuscles = volumeData.slice(0, 8)
  const maxVol = Math.max(...topMuscles.map(d => d.volume), 1)

  const trainingDays = split.days.filter(d => !d.isRest).length
  const restDays = split.days.filter(d => d.isRest).length
  const totalExercises = split.days.reduce(
    (sum, d) => sum + d.muscleGroups.reduce((s, mg) => s + mg.exercises.length, 0),
    0
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] mx-4 flex flex-col rounded-2xl bg-black/90 border border-white/[0.09] shadow-2xl shadow-black/60 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.07] flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white/85 truncate">{split.name}</h2>
            <p className="text-xs text-white/30 mt-0.5">
              {split.cycleDays}-day cycle · {trainingDays} training · {restDays} rest · {totalExercises} exercises
            </p>
          </div>
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-violet-300 bg-violet-600/20 border border-violet-500/30 rounded-lg hover:bg-violet-600/30 transition-colors"
          >
            <Pencil size={13} />
            Edit
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-white/30 hover:text-white/60 hover:bg-white/[0.06] rounded-lg transition-colors ml-1"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">
              Schedule
            </p>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(split.cycleDays, 7)}, 1fr)` }}>
              {split.days.map((day, idx) => (
                <div
                  key={day.id}
                  className={cn(
                    'rounded-xl border px-2 py-2 text-center',
                    day.isRest
                      ? 'border-white/[0.04] bg-white/[0.01] opacity-40'
                      : 'border-white/[0.07] bg-white/[0.03]'
                  )}
                >
                  <p className="text-[10px] font-semibold text-white/30 mb-1">
                    {getDayName(split.startDay, idx)}
                  </p>
                  {day.isRest ? (
                    <p className="text-[9px] text-white/20 italic">Rest</p>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {day.muscleGroups.slice(0, 3).map(mg => (
                        <div key={mg.id} className="flex items-center gap-1 justify-center">
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: MUSCLE_COLORS[mg.muscleGroup] ?? '#7C3AED' }}
                          />
                          <span className="text-[9px] text-white/40 truncate">{mg.muscleGroup}</span>
                        </div>
                      ))}
                      {day.muscleGroups.length > 3 && (
                        <span className="text-[9px] text-white/20">+{day.muscleGroups.length - 3}</span>
                      )}
                      {day.muscleGroups.length === 0 && (
                        <span className="text-[9px] text-slate-700 italic">Empty</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {topMuscles.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">
                Volume (sets / week)
              </p>
              <div className="space-y-2">
                {topMuscles.map(entry => {
                  const pct = Math.round((entry.volume / maxVol) * 100)
                  const color = entry.volume < entry.mev ? '#FBBF24' : entry.volume <= entry.mav ? '#34D399' : '#FB7185'
                  return (
                    <div key={entry.muscle} className="flex items-center gap-3">
                      <span className="text-xs text-white/30 w-24 flex-shrink-0 text-right">{entry.muscle}</span>
                      <div className="flex-1 h-4 bg-white/[0.04] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                      <span className="text-xs font-medium w-6 text-right flex-shrink-0" style={{ color }}>
                        {entry.volume}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">
              Frequency Check
            </p>
            {warnings.length === 0 ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 size={16} />
                <span className="text-sm">No frequency issues detected</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-950/30 border border-amber-800/30">
                    <AlertTriangle size={12} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-300/80">{w.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface SplitCardProps {
  split: Split
  exercises: Exercise[]
  onView: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

function SplitCard({ split, exercises: _exercises, onView, onEdit, onDuplicate, onDelete }: SplitCardProps) {
  const warnings = computeFrequencyWarnings(split)
  const trainingDays = split.days.filter(d => !d.isRest).length
  const allMuscles = Array.from(
    new Set(split.days.flatMap(d => d.muscleGroups.map(mg => mg.muscleGroup)))
  )
  const totalExercises = split.days.reduce(
    (sum, d) => sum + d.muscleGroups.reduce((s, mg) => s + mg.exercises.length, 0),
    0
  )

  return (
    <div
      className="flex flex-col rounded-2xl bg-white/[0.02] border border-white/[0.07] hover:border-white/[0.12] transition-all cursor-pointer group"
      onClick={onView}
    >
      <div className="p-4 flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-sm font-bold text-white/85 truncate leading-tight">{split.name}</h3>
          {warnings.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded-full border border-amber-800/30 flex-shrink-0">
              <AlertTriangle size={9} />
              {warnings.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-white/30 mb-3">
          <Calendar size={10} />
          <span>{split.cycleDays}-day cycle</span>
          <span className="text-slate-700">·</span>
          <span>{trainingDays} training days</span>
          <span className="text-slate-700">·</span>
          <span>{totalExercises} exercises</span>
        </div>

        {allMuscles.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {allMuscles.slice(0, 8).map(mg => (
              <div key={mg} className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06]">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: MUSCLE_COLORS[mg] ?? '#7C3AED' }}
                />
                <span className="text-[10px] text-white/30">{mg}</span>
              </div>
            ))}
            {allMuscles.length > 8 && (
              <span className="text-[10px] text-white/20 px-1 py-0.5">+{allMuscles.length - 8}</span>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-white/[0.05] flex items-center justify-between">
        <span className="text-[10px] text-white/20">{formatDate(split.lastModified)}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); onEdit() }}
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-white/40 hover:text-violet-300 hover:bg-violet-950/30 rounded-md transition-colors"
          >
            <Pencil size={10} />
            Edit
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDuplicate() }}
            className="p-1 text-white/30 hover:text-white/60 hover:bg-white/[0.06] rounded-md transition-colors"
            aria-label="Duplicate"
          >
            <Copy size={11} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="p-1 text-white/30 hover:text-red-400 hover:bg-red-950/30 rounded-md transition-colors"
            aria-label="Delete"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard({
  savedSplits,
  exercises,
  onEditSplit,
  onDeleteSplit,
  onDuplicateSplit,
  onNewSplit,
}: DashboardProps) {
  const [detailSplit, setDetailSplit] = useState<Split | null>(null)

  return (
    <div className="flex-1 overflow-auto p-6 min-h-0">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white/85">Your Splits</h1>
            <p className="text-sm text-white/30 mt-0.5">
              {savedSplits.length} saved split{savedSplits.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onNewSplit}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-xl transition-colors shadow-lg shadow-violet-900/30"
          >
            <Plus size={15} />
            New Split
          </button>
        </div>

        {savedSplits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
              <Calendar size={28} className="text-white/20" />
            </div>
            <p className="text-white/30 text-sm">No splits saved yet</p>
            <button
              onClick={onNewSplit}
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              Create your first split →
            </button>
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {savedSplits.map(split => (
              <SplitCard
                key={split.id}
                split={split}
                exercises={exercises}
                onView={() => setDetailSplit(split)}
                onEdit={() => onEditSplit(split)}
                onDuplicate={() => onDuplicateSplit(split)}
                onDelete={() => onDeleteSplit(split.id)}
              />
            ))}
          </div>
        )}
      </div>

      {detailSplit && (
        <SplitDetailModal
          split={detailSplit}
          exercises={exercises}
          onEdit={() => { onEditSplit(detailSplit); setDetailSplit(null) }}
          onClose={() => setDetailSplit(null)}
        />
      )}
    </div>
  )
}
