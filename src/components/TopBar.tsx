import { Minus, Plus, Settings, Save, PanelLeft } from 'lucide-react'
import { Split } from '@/lib/types'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface TopBarProps {
  split: Split
  onUpdateCycleDays: (days: number) => void
  onUpdateStartDay: (day: number) => void
  onSave: () => void
  onToggleSidebar: () => void
}

export default function TopBar({
  split,
  onUpdateCycleDays,
  onUpdateStartDay,
  onSave,
  onToggleSidebar,
}: TopBarProps) {
  function decrement() {
    if (split.cycleDays > 3) onUpdateCycleDays(split.cycleDays - 1)
  }
  function increment() {
    if (split.cycleDays < 21) onUpdateCycleDays(split.cycleDays + 1)
  }

  return (
    <header
      className="h-14 flex items-center gap-3 px-4 flex-shrink-0 border-b border-white/[0.05]"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(32px)' }}
    >
      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="flex-shrink-0 text-white/30 hover:text-white/70 transition-colors p-1.5 -ml-1 rounded-lg hover:bg-white/[0.04]"
      >
        <PanelLeft size={15} />
      </button>

      {/* Logo */}
      <span
        className="text-white leading-none tracking-tight flex-shrink-0"
        style={{ fontFamily: 'var(--font-montserrat), system-ui, sans-serif', fontWeight: 900, fontSize: '1.35rem' }}
      >
        split
      </span>

      <div className="flex-1" />

      {/* Settings gear */}
      <DropdownMenu>
        <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] border border-white/[0.07] transition-colors outline-none">
          <Settings size={14} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 p-3 border border-white/[0.08]"
          style={{ background: 'rgba(8,8,14,0.96)', backdropFilter: 'blur(32px)' }}
        >
          {/* Cycle length */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-white/45">Cycle length</span>
            <div className="flex items-center gap-1.5">
              <div
                className="flex items-center rounded-lg border border-white/[0.07] overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <button
                  onClick={decrement}
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
                  onClick={increment}
                  disabled={split.cycleDays >= 21}
                  className={cn(
                    'w-6 h-6 flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors',
                    split.cycleDays >= 21 && 'opacity-25 cursor-not-allowed'
                  )}
                >
                  <Plus size={11} />
                </button>
              </div>
              <span className="text-xs text-white/25">days</span>
            </div>
          </div>

          {/* Start day */}
          <div className="flex items-center justify-between py-1 mt-1">
            <span className="text-xs text-white/45">Starts on</span>
            <select
              value={split.startDay}
              onChange={e => onUpdateStartDay(Number(e.target.value))}
              className="rounded-lg text-white/80 text-xs px-2 py-1 outline-none border border-white/[0.07] focus:border-violet-400/40"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                <option key={d} value={i} className="bg-[#0a0a0f]">{d}</option>
              ))}
            </select>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save button */}
      <button
        onClick={onSave}
        className="flex items-center gap-1.5 h-8 px-4 text-xs font-semibold text-white rounded-lg transition-all"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.9), rgba(109,40,217,0.9))',
          boxShadow: '0 0 20px rgba(124,58,237,0.3)',
        }}
      >
        <Save size={12} />
        Save Split
      </button>
    </header>
  )
}
