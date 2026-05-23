import { useState } from 'react'
import { Minus, Plus, Save, PanelLeft } from 'lucide-react'
import { Split } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TopBarProps {
  split: Split
  isNamed: boolean
  onUpdateName: (name: string) => void
  onUpdateCycleDays: (days: number) => void
  onUpdateStartDay: (day: number) => void
  onSave: () => void
  onToggleSidebar: () => void
}

export default function TopBar({
  split,
  isNamed,
  onUpdateName,
  onUpdateCycleDays,
  onUpdateStartDay,
  onSave,
  onToggleSidebar,
}: TopBarProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(split.name)

  function commitName() {
    setIsEditingName(false)
    const trimmed = nameDraft.trim()
    if (trimmed && trimmed !== split.name) {
      onUpdateName(trimmed)
    } else {
      setNameDraft(split.name)
    }
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commitName()
    if (e.key === 'Escape') {
      setNameDraft(split.name)
      setIsEditingName(false)
    }
  }

  function decrementCycle() {
    if (split.cycleDays > 3) onUpdateCycleDays(split.cycleDays - 1)
  }

  function incrementCycle() {
    if (split.cycleDays < 21) onUpdateCycleDays(split.cycleDays + 1)
  }

  return (
    <header
      className="h-14 flex items-center gap-3 px-4 flex-shrink-0 border-b border-white/[0.05]"
      style={{ background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}
    >
      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="flex-shrink-0 text-white/30 hover:text-white/60 transition-colors p-1.5 -ml-1 rounded-lg hover:bg-white/[0.04]"
      >
        <PanelLeft size={15} />
      </button>

      {/* Logo */}
      <div className="flex-shrink-0">
        <span
          className="text-white leading-none tracking-tight"
          style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: '1.35rem' }}
        >
          split
        </span>
      </div>

      {isNamed && (
        <>
          <div className="w-px h-4 bg-white/[0.07] flex-shrink-0" />
          <div className="flex-1 min-w-0 max-w-xs">
            {isEditingName ? (
              <input
                autoFocus
                type="text"
                value={nameDraft}
                onChange={e => setNameDraft(e.target.value)}
                onBlur={commitName}
                onKeyDown={handleNameKeyDown}
                className="w-full text-sm text-white/90 bg-white/[0.05] border border-violet-500/30 rounded-lg px-2.5 py-1 outline-none focus:border-violet-400/50 focus:bg-white/[0.06]"
              />
            ) : (
              <button
                onClick={() => { setNameDraft(split.name); setIsEditingName(true) }}
                className="text-left text-sm text-white/70 hover:text-white/90 truncate max-w-full rounded-lg px-2 py-1 hover:bg-white/[0.04] transition-colors"
                title="Click to rename"
              >
                {split.name}
              </button>
            )}
          </div>
          <div className="w-px h-4 bg-white/[0.07] flex-shrink-0" />
        </>
      )}

      {/* Cycle length stepper */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-[11px] text-white/30 tracking-wide">Cycle</span>
        <div
          className="flex items-center gap-0.5 rounded-lg border border-white/[0.07] overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <button
            onClick={decrementCycle}
            disabled={split.cycleDays <= 3}
            className={cn(
              'w-6 h-6 flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors',
              split.cycleDays <= 3 && 'opacity-25 cursor-not-allowed'
            )}
          >
            <Minus size={11} />
          </button>
          <span className="px-2 text-sm font-medium text-white/80 min-w-[2ch] text-center tabular-nums">
            {split.cycleDays}
          </span>
          <button
            onClick={incrementCycle}
            disabled={split.cycleDays >= 21}
            className={cn(
              'w-6 h-6 flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors',
              split.cycleDays >= 21 && 'opacity-25 cursor-not-allowed'
            )}
          >
            <Plus size={11} />
          </button>
        </div>
        <span className="text-[11px] text-white/30">days</span>
      </div>

      <div className="w-px h-4 bg-white/[0.07] flex-shrink-0" />

      {/* Start day selector */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-[11px] text-white/30 tracking-wide">Starts</span>
        <select
          value={split.startDay}
          onChange={e => onUpdateStartDay(Number(e.target.value))}
          className="rounded-lg text-white/80 text-sm px-2 py-0.5 outline-none border border-white/[0.07] focus:border-violet-400/40"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
            <option key={d} value={i} className="bg-[#0a0a0f]">{d}</option>
          ))}
        </select>
      </div>

      <div className="flex-1" />

      {/* Save */}
      <button
        onClick={onSave}
        className="flex items-center gap-1.5 h-8 px-3.5 text-xs font-medium text-white rounded-lg transition-all flex-shrink-0"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.9), rgba(109,40,217,0.9))',
          boxShadow: '0 0 20px rgba(124,58,237,0.25)',
        }}
      >
        <Save size={12} />
        Save
      </button>
    </header>
  )
}
