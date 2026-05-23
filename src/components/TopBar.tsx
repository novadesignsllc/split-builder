import { useState } from 'react'
import { ChevronDown, Plus, Save, Copy, X, Minus, LayoutDashboard, Layers, FolderOpen } from 'lucide-react'
import { Split } from '@/lib/types'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface TopBarProps {
  split: Split
  savedSplits: Split[]
  onUpdateName: (name: string) => void
  onUpdateCycleDays: (days: number) => void
  onNew: () => void
  onSave: () => void
  onLoad: (split: Split) => void
  onDeleteSaved: (id: string) => void
  onDuplicateSaved: (split: Split) => void
  onUpdateStartDay: (day: number) => void
  onToggleView: () => void
  view: 'builder' | 'dashboard'
}

function formatRelativeTime(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = Math.floor((now - then) / 1000)

  if (diff < 60) return 'just now'
  if (diff < 3600) {
    const m = Math.floor(diff / 60)
    return `${m}m ago`
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600)
    return `${h}h ago`
  }
  if (diff < 604800) {
    const d = Math.floor(diff / 86400)
    return `${d}d ago`
  }
  const w = Math.floor(diff / 604800)
  return `${w}w ago`
}

export default function TopBar({
  split,
  savedSplits,
  onUpdateName,
  onUpdateCycleDays,
  onNew,
  onSave,
  onLoad,
  onDeleteSaved,
  onDuplicateSaved,
  onUpdateStartDay,
  onToggleView,
  view,
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
      className="h-14 flex items-center gap-4 px-6 flex-shrink-0 border-b border-white/[0.05]"
      style={{ background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}
    >
      {/* Logo */}
      <div className="flex-shrink-0">
        <span className="text-white leading-none tracking-tight" style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: '1.35rem' }}>
          split
        </span>
      </div>

      <div className="w-px h-4 bg-white/[0.07] flex-shrink-0" />

      {/* Split name */}
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

      {/* Cycle length stepper */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-[11px] text-white/30 tracking-wide">Cycle</span>
        <div className="flex items-center gap-0.5 rounded-lg border border-white/[0.07] overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
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
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => (
            <option key={d} value={i} className="bg-[#0a0a0f]">{d}</option>
          ))}
        </select>
      </div>

      <div className="flex-1" />

      {/* Right-side actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onToggleView}
          className="flex items-center gap-1.5 h-8 px-3 text-xs text-white/40 hover:text-white/70 rounded-lg hover:bg-white/[0.04] transition-colors"
        >
          {view === 'builder'
            ? <><LayoutDashboard size={13} />Dashboard</>
            : <><Layers size={13} />Builder</>}
        </button>

        <button
          onClick={onNew}
          className="flex items-center gap-1.5 h-8 px-3 text-xs text-white/40 hover:text-white/70 rounded-lg hover:bg-white/[0.04] transition-colors"
        >
          <Plus size={13} />
          New
        </button>

        {/* Saved splits dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-1.5 h-8 px-3 text-xs rounded-lg border border-white/[0.07] text-white/50 hover:text-white/75 hover:bg-white/[0.04] transition-colors outline-none" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <FolderOpen size={13} />
            Saved
            <ChevronDown size={11} />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 border border-white/[0.08]"
            style={{ background: 'rgba(8,8,14,0.95)', backdropFilter: 'blur(32px)' }}
          >
            {savedSplits.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-white/25 italic">No saved splits</p>
              </div>
            ) : (
              savedSplits.map((s, idx) => (
                <div key={s.id}>
                  {idx > 0 && <DropdownMenuSeparator className="bg-white/[0.05]" />}
                  <div className="flex items-center gap-1 px-1">
                    <DropdownMenuItem
                      className="flex-1 flex-col items-start gap-0 px-2 py-1.5 text-white/60 hover:bg-white/[0.05] focus:bg-white/[0.05]"
                      onClick={() => onLoad(s)}
                    >
                      <span className="text-sm text-white/80 truncate w-full">{s.name}</span>
                      <span className="text-[10px] text-white/25">{formatRelativeTime(s.lastModified)}</span>
                    </DropdownMenuItem>
                    <button
                      onClick={e => { e.stopPropagation(); onDuplicateSaved(s) }}
                      className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
                    >
                      <Copy size={11} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); onDeleteSaved(s.id) }}
                      className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-white/25 hover:text-red-400/70 hover:bg-red-950/30 transition-colors"
                    >
                      <X size={11} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={onSave}
          className="flex items-center gap-1.5 h-8 px-3.5 text-xs font-medium text-white rounded-lg transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.9), rgba(109,40,217,0.9))',
            boxShadow: '0 0 20px rgba(124,58,237,0.25)',
          }}
        >
          <Save size={12} />
          Save
        </button>
      </div>
    </header>
  )
}
