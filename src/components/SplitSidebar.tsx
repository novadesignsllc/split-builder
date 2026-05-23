import { Plus, X, Copy } from 'lucide-react'
import { Split } from '@/lib/types'
import { cn } from '@/lib/utils'

interface SplitSidebarProps {
  savedSplits: Split[]
  activeTabId: 'builder' | string
  builderSplitName: string
  onSelectTab: (id: 'builder' | string) => void
  onDeleteSplit: (id: string) => void
  onDuplicateSplit: (split: Split) => void
  onNewSplit: () => void
}

export default function SplitSidebar({
  savedSplits,
  activeTabId,
  builderSplitName,
  onSelectTab,
  onDeleteSplit,
  onDuplicateSplit,
  onNewSplit,
}: SplitSidebarProps) {
  return (
    <div
      className="flex flex-col h-full border-r border-white/[0.05] w-52"
      style={{ background: 'rgba(0,0,0,0.45)' }}
    >
      <nav className="flex-1 overflow-y-auto py-3 no-scrollbar">
        <SidebarTab
          badge="Builder"
          isActive={activeTabId === 'builder'}
          onClick={() => onSelectTab('builder')}
        />

        {savedSplits.length > 0 && (
          <div className="mx-3 my-2 h-px bg-white/[0.05]" />
        )}

        {savedSplits.map(s => (
          <SidebarTab
            key={s.id}
            label={s.name}
            isActive={activeTabId === s.id}
            onClick={() => onSelectTab(s.id)}
            onDelete={() => onDeleteSplit(s.id)}
            onDuplicate={() => onDuplicateSplit(s)}
          />
        ))}
      </nav>

      <div className="px-2 py-2.5 border-t border-white/[0.05] flex-shrink-0">
        <button
          onClick={onNewSplit}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors"
        >
          <Plus size={12} />
          New split
        </button>
      </div>
    </div>
  )
}

function SidebarTab({
  label,
  badge,
  isActive,
  onClick,
  onDelete,
  onDuplicate,
}: {
  label?: string
  badge?: string
  isActive: boolean
  onClick: () => void
  onDelete?: () => void
  onDuplicate?: () => void
}) {
  return (
    <div
      className={cn(
        'group relative mx-2 my-0.5 rounded-lg cursor-pointer transition-colors',
        isActive ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
      )}
      onClick={onClick}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-400/60 rounded-full" />
      )}
      <div className="flex items-center gap-2 px-3 py-2.5 min-w-0">
        <div className="flex-1 min-w-0">
          {badge && (
            <p className="text-[9px] text-white/20 uppercase tracking-widest leading-none mb-0.5">{badge}</p>
          )}
          {label && (
            <p className={cn(
              'text-xs truncate transition-colors leading-snug',
              isActive ? 'text-white/85 font-medium' : 'text-white/40'
            )}>
              {label}
            </p>
          )}
        </div>
        {(onDelete || onDuplicate) && (
          <div className="flex gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {onDuplicate && (
              <button
                onClick={e => { e.stopPropagation(); onDuplicate() }}
                className="w-5 h-5 flex items-center justify-center rounded text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
              >
                <Copy size={10} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={e => { e.stopPropagation(); onDelete() }}
                className="w-5 h-5 flex items-center justify-center rounded text-white/25 hover:text-red-400/70 hover:bg-red-950/30 transition-colors"
              >
                <X size={10} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
