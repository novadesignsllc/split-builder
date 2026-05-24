import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { Split, Exercise } from '@/lib/types'
import {
  computeVolumeChart,
  computeMuscleFrequency,
  computeSplitSummary,
  computeFrequencyWarnings,
} from '@/lib/analytics'
import { MUSCLE_COLORS, VOLUME_TARGETS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface AnalyticsPanelProps {
  split: Split
  exercises: Exercise[]
}

// ─── Volume bar row ────────────────────────────────────────────────────────

function VolumeRow({ muscle, volume, mev, mav }: { muscle: string; volume: number; mev: number; mav: number }) {
  const color = volume < mev ? '#fbbf24' : volume <= mav ? '#34d399' : '#fb7185'
  const targetMax = Math.max(mav, volume, 1)
  const barPct = Math.min((volume / targetMax) * 100, 100)

  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-xs text-white/50 w-24 flex-shrink-0 truncate">{muscle}</span>
      <div className="flex-1 relative h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {/* Target zone background */}
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${(mav / targetMax) * 100}%`,
            background: 'rgba(52,211,153,0.08)',
          }}
        />
        {/* Value bar */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
          style={{ width: `${barPct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums flex-shrink-0" style={{ color, width: '2.5rem', textAlign: 'right' }}>
        {volume}
      </span>
      <span className="text-[10px] text-white/20 flex-shrink-0 w-20 text-right">
        {mev}–{mav} sets
      </span>
    </div>
  )
}

// ─── Frequency badge ──────────────────────────────────────────────────────

function FrequencyBadge({ muscle, daysPerWeek }: { muscle: string; daysPerWeek: number }) {
  const color = MUSCLE_COLORS[muscle] ?? '#7C3AED'
  const isLow = daysPerWeek < 1.5
  const isHigh = daysPerWeek > 3.5

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-xs text-white/50">{muscle}</span>
      </div>
      <span
        className={cn(
          'text-[10px] font-medium px-2 py-0.5 rounded-full border',
          isLow
            ? 'border-amber-700/30 text-amber-400/80 bg-amber-950/30'
            : isHigh
              ? 'border-rose-700/30 text-rose-400/80 bg-rose-950/30'
              : 'border-white/[0.08] text-white/40 bg-white/[0.03]'
        )}
        style={!isLow && !isHigh ? { borderColor: `${color}33`, color, background: `${color}11` } : undefined}
      >
        {daysPerWeek % 1 === 0 ? daysPerWeek : daysPerWeek.toFixed(1)}× per week
      </span>
    </div>
  )
}

// ─── AnalyticsPanel ────────────────────────────────────────────────────────

export default function AnalyticsPanel({ split, exercises }: AnalyticsPanelProps) {
  const [isOpen, setIsOpen] = useState(true)

  const volumeData = computeVolumeChart(split, exercises, split.cycleDays)
  const freqData = computeMuscleFrequency(split, exercises)
  const summary = computeSplitSummary(split, exercises)
  const warnings = computeFrequencyWarnings(split, exercises)

  // Fill volume data with all muscles that have targets, even if volume is 0
  const allVolumeData = volumeData.length > 0
    ? volumeData
    : []

  return (
    <div
      className={cn(
        'flex-shrink-0 border-t border-white/[0.05] transition-all duration-200',
        isOpen ? 'h-[260px]' : 'h-10'
      )}
      style={{ background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(24px)' }}
    >
      {/* Toolbar */}
      <div className="h-10 flex items-center gap-3 px-4 border-b border-white/[0.04] flex-shrink-0">
        <span className="text-[9px] font-semibold text-white/25 uppercase tracking-[0.15em]">Analytics</span>

        {/* Legend */}
        {isOpen && (
          <div className="flex items-center gap-3 text-[10px] text-white/25">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-sm bg-amber-400/60" /> Below target
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-sm bg-emerald-400/60" /> Optimal
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-sm bg-rose-400/60" /> Above max
            </span>
          </div>
        )}

        {warnings.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-amber-400/70 bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-800/25">
            <AlertTriangle size={9} />
            {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
          </span>
        )}

        <div className="flex-1" />

        <button
          onClick={() => setIsOpen(v => !v)}
          className="p-1 text-white/20 hover:text-white/50 hover:bg-white/[0.04] rounded-md transition-colors"
        >
          {isOpen ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        </button>
      </div>

      {isOpen && (
        <div className="flex h-[calc(260px-40px)]">
          {/* ── Volume Overview ── */}
          <div className="flex flex-col border-r border-white/[0.04]" style={{ width: '42%' }}>
            <div className="px-4 pt-2.5 pb-1 flex-shrink-0">
              <p className="text-[9px] font-semibold text-white/25 uppercase tracking-[0.15em]">Volume Overview</p>
              <p className="text-[10px] text-white/15 mt-0.5">Estimated weekly sets per muscle</p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-2 no-scrollbar">
              {allVolumeData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-xs text-white/20 italic">
                  Add exercises to see volume
                </div>
              ) : (
                allVolumeData.map(d => (
                  <VolumeRow key={d.muscle} muscle={d.muscle} volume={d.volume} mev={d.mev} mav={d.mav} />
                ))
              )}
            </div>
          </div>

          {/* ── Frequency ── */}
          <div className="flex flex-col border-r border-white/[0.04]" style={{ width: '33%' }}>
            <div className="px-4 pt-2.5 pb-1 flex-shrink-0">
              <p className="text-[9px] font-semibold text-white/25 uppercase tracking-[0.15em]">Frequency</p>
              <p className="text-[10px] text-white/15 mt-0.5">How often each muscle is trained</p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-2 no-scrollbar">
              {freqData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-xs text-white/20 italic">
                  No data yet
                </div>
              ) : (
                freqData.map(f => (
                  <FrequencyBadge key={f.muscle} muscle={f.muscle} daysPerWeek={f.daysPerWeek} />
                ))
              )}
            </div>
          </div>

          {/* ── Split Summary ── */}
          <div className="flex flex-col flex-1">
            <div className="px-4 pt-2.5 pb-1 flex-shrink-0">
              <p className="text-[9px] font-semibold text-white/25 uppercase tracking-[0.15em]">Split Summary</p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-3 no-scrollbar flex flex-col gap-2.5">
              <SummaryRow label="Days per week" value={String(summary.workoutDays)} />
              <SummaryRow label="Total sets (est.)" value={String(summary.totalSets)} />
              <SummaryRow
                label="Avg. sets per day"
                value={summary.avgSetsPerDay > 0 ? String(summary.avgSetsPerDay) : '—'}
              />

              {/* Balanced indicator */}
              {summary.totalSets > 0 && (
                <div
                  className={cn(
                    'mt-auto flex items-start gap-2 px-3 py-2.5 rounded-xl border',
                    summary.isBalanced
                      ? 'border-emerald-700/30 bg-emerald-950/20'
                      : 'border-amber-700/30 bg-amber-950/20'
                  )}
                >
                  {summary.isBalanced ? (
                    <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Info size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p className={cn('text-xs font-medium', summary.isBalanced ? 'text-emerald-300' : 'text-amber-300')}>
                      {summary.isBalanced ? 'Balanced Split' : 'Needs Attention'}
                    </p>
                    {summary.balanceNote && (
                      <p className="text-[10px] text-white/30 mt-0.5 leading-snug">{summary.balanceNote}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-white/35">{label}</span>
      <span className="text-sm font-semibold text-white/70 tabular-nums">{value}</span>
    </div>
  )
}
