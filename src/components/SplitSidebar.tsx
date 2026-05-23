import { X, Copy, Pencil } from 'lucide-react'
import { Split } from '@/lib/types'
import { cn } from '@/lib/utils'

interface SplitSidebarProps {
  savedSplits: Split[]
  activeTabId: 'builder' | string
  builderSplitName: string
  onSelectTab: (id: 'builder' | string) => void
  onDeleteSplit: (id: string) => void
  onDuplicateSplit: (split: Split) => void
}

export default function SplitSidebar({
  savedSplits,
  activeTabId,
  onSelectTab,
  onDeleteSplit,
  onDuplicateSplit,
}: SplitSidebarProps) {
  return (
    <div
      className="flex flex-col h-full w-52"
      style={{ background: 'rgba(0,0,0,0.45)' }}
    >
      <nav className="flex-1 overflow-y-auto py-3 no-scrollbar">
        {/* New Split tab */}
        <SidebarTab
          label="New Split"
          isNew
          isActive={activeTabId === 'builder'}
          onClick={() => onSelectTab('builder')}
        />

        {/* Saved Splits section */}
        {savedSplits.length > 0 && (
          <>
            <p className="px-3 pt-4 pb-2 text-[9px] text-white/25 uppercase tracking-widest">
              Saved Splits
            </p>
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
          </>
        )}
      </nav>
    </div>
  )
}

function SidebarTab({
  label,
  isNew,
  isActive,
  onClick,
  onDelete,
  onDuplicate,
}: {
  label: string
  isNew?: boolean
  isActive: boolean
  onClick: () => void
  onDelete?: () => void
  onDuplicate?: () => void
}) {
  return (
    <div
      className={cn(
        'group relative mx-2 rounded-lg cursor-pointer transition-colors',
        isActive ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
      )}
      onClick={onClick}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-400/60 rounded-full" />
      )}
      <div className="flex items-center gap-2 px-3 py-3 min-w-0">
        {isNew && (
          <Pencil
            size={11}
            className={cn('flex-shrink-0 transition-colors', isActive ? 'text-violet-400/80' : 'text-violet-400/40')}
          />
        )}
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-xs truncate transition-colors leading-snug',
            isNew
              ? (isActive ? 'text-white/55' : 'text-white/30')
              : (isActive ? 'text-white font-medium' : 'text-white/60')
          )}>
            {label}
          </p>
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
