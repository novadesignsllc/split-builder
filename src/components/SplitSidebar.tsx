import { useState } from 'react'
import { Plus, MoreHorizontal, Copy, Trash2 } from 'lucide-react'
import { Split } from '@/lib/types'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface SplitSidebarProps {
  savedSplits: Split[]
  activeId: string | null  // null = unsaved draft
  onSelectSplit: (id: string | null) => void
  onNewSplit: () => void
  onDeleteSplit: (id: string) => void
  onDuplicateSplit: (split: Split) => void
}

export default function SplitSidebar({
  savedSplits,
  activeId,
  onSelectSplit,
  onNewSplit,
  onDeleteSplit,
  onDuplicateSplit,
}: SplitSidebarProps) {
  return (
    <div className="flex flex-col h-full w-52" style={{ background: 'rgba(0,0,0,0.50)' }}>
      {/* New Split button */}
      <div className="p-3 flex-shrink-0">
        <button
          onClick={onNewSplit}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border',
            activeId === null
              ? 'bg-violet-500/15 border-violet-500/25 text-violet-300'
              : 'border-white/[0.07] text-white/40 hover:text-white/70 hover:bg-white/[0.04] hover:border-white/[0.10]'
          )}
          style={activeId === null ? {} : { background: 'rgba(255,255,255,0.02)' }}
        >
          <Plus size={14} className="flex-shrink-0" />
          New Split
        </button>
      </div>

      {/* Saved splits */}
      {savedSplits.length > 0 && (
        <div className="flex-1 overflow-y-auto min-h-0 no-scrollbar">
          <p className="px-4 pt-1 pb-2 text-[9px] font-semibold text-white/20 uppercase tracking-[0.18em]">
            My Splits
          </p>
          <nav className="px-2 space-y-0.5 pb-4">
            {savedSplits.map(s => (
              <SplitItem
                key={s.id}
                split={s}
                isActive={activeId === s.id}
                onClick={() => onSelectSplit(s.id)}
                onDelete={() => onDeleteSplit(s.id)}
                onDuplicate={() => onDuplicateSplit(s)}
              />
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}

function SplitItem({
  split,
  isActive,
  onClick,
  onDelete,
  onDuplicate,
}: {
  split: Split
  isActive: boolean
  onClick: () => void
  onDelete: () => void
  onDuplicate: () => void
}) {
  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all',
        isActive
          ? 'bg-white/[0.07] border border-white/[0.10]'
          : 'border border-transparent hover:bg-white/[0.03] hover:border-white/[0.06]'
      )}
      onClick={onClick}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-400/60 rounded-full" />
      )}

      {/* Icon */}
      <span className="text-base leading-none flex-shrink-0">
        {split.icon ?? '💪'}
      </span>

      {/* Name */}
      <span
        className={cn(
          'flex-1 min-w-0 text-xs truncate transition-colors',
          isActive ? 'text-white font-medium' : 'text-white/55'
        )}
      >
        {split.name}
      </span>

      {/* ⋯ menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'flex-shrink-0 p-1 rounded-md transition-colors outline-none',
            'text-white/0 group-hover:text-white/30 hover:!text-white/70 hover:bg-white/[0.06]',
            isActive && 'text-white/20'
          )}
          onClick={e => e.stopPropagation()}
        >
          <MoreHorizontal size={13} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={4}
          className="w-36 border border-white/[0.08] p-1"
          style={{ background: 'rgba(8,8,14,0.97)', backdropFilter: 'blur(32px)' }}
        >
          <DropdownMenuItem
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-white/60 hover:text-white hover:bg-white/[0.06] cursor-pointer"
            onClick={e => { e.stopPropagation(); onDuplicate() }}
          >
            <Copy size={11} /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-red-400/70 hover:text-red-400 hover:bg-red-950/30 cursor-pointer"
            onClick={e => { e.stopPropagation(); onDelete() }}
          >
            <Trash2 size={11} /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
