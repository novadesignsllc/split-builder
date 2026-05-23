import { useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip as RechartsTooltip,
} from 'recharts'
import type { BarShapeProps } from 'recharts'
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Split, Exercise, ChartEntry } from '@/lib/types'
import {
  computeVolumeChart,
  computePushPullLegs,
  computeFrequencyWarnings,
  FrequencyWarning,
} from '@/lib/analytics'
import { cn } from '@/lib/utils'

interface AnalyticsPanelProps {
  split: Split
  exercises: Exercise[]
}

type VolumeBarShapeProps = BarShapeProps & {
  mev?: number
  mav?: number
}

function CustomVolumeBar(rawProps: VolumeBarShapeProps) {
  const x = rawProps.x ?? 0
  const y = rawProps.y ?? 0
  const width = rawProps.width ?? 0
  const height = rawProps.height ?? 0
  const rawValue = rawProps.value
  const value = typeof rawValue === 'number' ? rawValue : 0
  const mev = rawProps.mev ?? 0
  const mav = rawProps.mav ?? 0

  if (value <= 0 || width <= 0) return null

  const scale = width / value
  const mevPx = mev * scale
  const mavPx = mav * scale
  const color = value < mev ? '#FBBF24' : value <= mav ? '#34D399' : '#FB7185'

  return (
    <g>
      <rect x={x} y={y + 2} width={mavPx} height={height - 4} fill="rgba(52,211,153,0.08)" rx={3} />
      {mev > 0 && (
        <rect
          x={x + mevPx}
          y={y + 2}
          width={Math.max(0, mavPx - mevPx)}
          height={height - 4}
          fill="rgba(52,211,153,0.15)"
          rx={0}
        />
      )}
      <rect x={x} y={y + 2} width={width} height={height - 4} fill={color} rx={3} fillOpacity={0.9} />
      {value > 0 && (
        <text
          x={x + width - 4}
          y={y + height / 2 + 1}
          textAnchor="end"
          dominantBaseline="middle"
          fontSize={11}
          fill="white"
          fontWeight={600}
        >
          {value}
        </text>
      )}
    </g>
  )
}

interface VolumeChartProps {
  data: ChartEntry[]
}

function VolumeChart({ data }: VolumeChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-white/20 italic">
        No volume data yet
      </div>
    )
  }

  const enriched = data.map(d => ({ ...d }))
  const maxVal = Math.max(...data.map(d => Math.max(d.volume, d.mav)), 1)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={enriched}
        layout="vertical"
        margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
      >
        <XAxis
          type="number"
          domain={[0, Math.ceil(maxVal * 1.1)]}
          hide
        />
        <YAxis
          type="category"
          dataKey="muscle"
          width={90}
          tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.30)' }}
          axisLine={false}
          tickLine={false}
        />
        <RechartsTooltip
          cursor={{ fill: 'rgba(0,0,0,0.03)' }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const entry = payload[0].payload as ChartEntry
            return (
              <div className="rounded-xl border border-white/[0.07] px-3 py-2 text-xs" style={{ background: 'rgba(8,8,14,0.95)', backdropFilter: 'blur(24px)' }}>
                <p className="font-medium text-white/80">{entry.muscle}</p>
                <p className="text-white/40">Sets: <span className="font-medium text-white/70">{entry.volume}</span></p>
                <p className="text-white/20 mt-0.5">MEV: {entry.mev} · MAV: {entry.mav}</p>
              </div>
            )
          }}
        />
        <Bar
          dataKey="volume"
          shape={(props: BarShapeProps) => (
            <CustomVolumeBar {...(props as VolumeBarShapeProps)} />
          )}
          isAnimationActive={false}
        >
          {enriched.map(entry => (
            <Cell key={entry.muscle} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

interface PushPullLegsProps {
  split: Split
  exercises: Exercise[]
}

function PushPullLegsSection({ split, exercises }: PushPullLegsProps) {
  const { push, pull, legs } = computePushPullLegs(split, exercises)
  const total = push + pull + legs

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-white/20 italic">No exercises yet</p>
      </div>
    )
  }

  const pct = (n: number) => Math.round((n / total) * 100)

  const segments = [
    { label: 'Push', value: push, pct: pct(push), color: '#8b5cf6' },
    { label: 'Pull', value: pull, pct: pct(pull), color: '#3b82f6' },
    { label: 'Legs', value: legs, pct: pct(legs), color: '#10b981' },
  ]

  return (
    <div className="flex flex-col gap-4 justify-center h-full">
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {segments.map(s =>
          s.value > 0 ? (
            <div
              key={s.label}
              style={{ width: `${s.pct}%`, backgroundColor: s.color }}
              className="rounded-full"
              title={`${s.label}: ${s.pct}%`}
            />
          ) : null
        )}
      </div>

      <div className="flex gap-4 justify-center">
        {segments.map(s => (
          <div key={s.label} className="flex flex-col items-center gap-0.5">
            <span
              className="text-3xl font-bold leading-none"
              style={{ color: s.color }}
            >
              {s.pct}%
            </span>
            <span className="text-xs text-white/50">{s.label}</span>
            <span className="text-[10px] text-white/25">{s.value} sets</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface FrequencyWarningsProps {
  warnings: FrequencyWarning[]
}

function FrequencyWarningsSection({ warnings }: FrequencyWarningsProps) {
  if (warnings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <CheckCircle2 size={22} className="text-emerald-400" />
        <p className="text-sm font-medium text-emerald-300">Looking good!</p>
        <p className="text-xs text-white/25 text-center">No frequency issues detected</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 overflow-y-auto h-full pr-1">
      {warnings.map((w, i) => (
        <div
          key={i}
          className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-amber-950/30 border border-amber-800/30"
        >
          <AlertTriangle size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-300/80 leading-snug">{w.message}</p>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsPanel({ split, exercises }: AnalyticsPanelProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [showPPL, setShowPPL] = useState(false)

  const volumeData = computeVolumeChart(split, exercises, split.cycleDays)
  const warnings = computeFrequencyWarnings(split)

  return (
    <div
      className={cn(
        'flex-shrink-0 border-t border-white/[0.05] transition-all overflow-hidden',
        isOpen ? 'h-[270px]' : 'h-10'
      )}
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
    >
      <div className="h-10 flex items-center gap-3 px-4 border-b border-white/[0.04] flex-shrink-0">
        <span className="text-[9px] font-medium text-white/25 uppercase tracking-[0.15em]">
          Analytics
        </span>

        {!showPPL && (
          <div className="flex items-center gap-3 text-[10px] text-white/25">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-sm bg-amber-400/70" />
              Below MEV
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-sm bg-emerald-400/70" />
              Optimal
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-sm bg-rose-400/70" />
              Above MAV
            </span>
          </div>
        )}

        <button
          onClick={() => setShowPPL(v => !v)}
          className={cn(
            'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] border transition-colors',
            showPPL
              ? 'bg-violet-500/10 border-violet-400/20 text-violet-300/70'
              : 'border-white/[0.06] text-white/30 hover:text-white/50'
          )}
          style={!showPPL ? { background: 'rgba(255,255,255,0.03)' } : undefined}
        >
          {showPPL ? <ToggleRight size={11} /> : <ToggleLeft size={11} />}
          Push/Pull/Legs
        </button>

        <div className="flex-1" />

        {warnings.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-amber-400/70 bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-800/25">
            <AlertTriangle size={9} />
            {warnings.length}
          </span>
        )}

        <button
          onClick={() => setIsOpen(v => !v)}
          className="p-1 text-white/20 hover:text-white/50 hover:bg-white/[0.04] rounded-md transition-colors"
        >
          {isOpen ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        </button>
      </div>

      {isOpen && (
        <div className="flex h-[calc(270px-40px)] divide-x divide-white/[0.04]">
          {showPPL ? (
            <>
              <div className="flex flex-col" style={{ width: '55%' }}>
                <p className="text-[9px] font-medium text-white/20 uppercase tracking-[0.15em] px-4 pt-2 pb-1">
                  Push / Pull / Legs
                </p>
                <div className="flex-1 px-4 pb-3">
                  <PushPullLegsSection split={split} exercises={exercises} />
                </div>
              </div>
              <div className="flex flex-col" style={{ width: '45%' }}>
                <p className="text-[9px] font-medium text-white/20 uppercase tracking-[0.15em] px-4 pt-2 pb-1">
                  Frequency
                </p>
                <div className="flex-1 px-3 pb-3 overflow-hidden">
                  <FrequencyWarningsSection warnings={warnings} />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col" style={{ width: '70%' }}>
                <p className="text-[9px] font-medium text-white/20 uppercase tracking-[0.15em] px-4 pt-2 pb-1">
                  Weekly Volume (sets)
                </p>
                <div className="flex-1 px-2 pb-2">
                  <VolumeChart data={volumeData} />
                </div>
              </div>
              <div className="flex flex-col" style={{ width: '30%' }}>
                <p className="text-[9px] font-medium text-white/20 uppercase tracking-[0.15em] px-4 pt-2 pb-1">
                  Frequency
                </p>
                <div className="flex-1 px-3 pb-3 overflow-hidden">
                  <FrequencyWarningsSection warnings={warnings} />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
