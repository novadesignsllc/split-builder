import { useState, useRef, useEffect } from 'react'
import { Plus, ChevronDown, Copy, Trash2, Pencil, Check, X } from 'lucide-react'
import { Split } from '@/lib/types'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface SplitTabBarProps {
  savedSplits: Split[]
  activeId: string | null   // null = unsaved draft
  draftName: string
  onSelectSplit: (id: string | null) => void
  onNewSplit: () => void
  onDeleteSplit: (id: string) => void
  onDuplicateSplit: (split: Split) => void
  onRenameSplit: (id: string, name: string) => void
}

export default function SplitTabBar({
  savedSplits,
  activeId,
  draftName,
  onSelectSplit,
  onNewSplit,
  onDeleteSplit,
  onDuplicateSplit,
  onRenameSplit,
}: SplitTabBarProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId && inputRef.current) inputRef.current.focus()
  }, [editingId])

  function startEdit(split: Split) {
    setEditingId(split.id)
    setEditValue(split.name)
  }

  function commitEdit() {
    if (!editingId) return
    const trimmed = editValue.trim()
    if (trimmed) onRenameSplit(editingId, trimmed)
    setEditingId(null)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  return (
    <div
      className="flex-shrink-0 flex items-stretch border-t border-white/[0.08] overflow-x-auto no-scrollbar"
      style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(24px)', height: 40 }}
    >
      {/* + New split */}
      <button
        onClick={onNewSplit}
        className="flex-shrink-0 flex items-center justify-center w-10 border-r border-white/[0.08] text-white/35 hover:text-white/80 hover:bg-white/[0.05] transition-colors"
        title="New split"
      >
        <Plus size={15} />
      </button>

      {/* Draft tab (only shown when no saved split is active) */}
      {activeId === null && (
        <div
          className="relative flex-shrink-0 flex items-center border-r border-white/[0.06] px-4 cursor-default"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-violet-400 rounded-b" />
          <span className="text-xs font-medium text-white/80 whitespace-nowrap">{draftName || 'New Split'}</span>
        </div>
      )}

      {/* Saved split tabs */}
      {savedSplits.map(split => {
        const isActive = activeId === split.id
        const isEditing = editingId === split.id

        return (
          <div
            key={split.id}
            className={cn(
              'relative flex-shrink-0 flex items-center border-r border-white/[0.06] group cursor-pointer transition-colors',
              isActive ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
            )}
            onClick={() => !isEditing && onSelectSplit(split.id)}
          >
            {/* Active indicator — top edge */}
            {isActive && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-violet-400 rounded-b" />
            )}

            <div className="flex items-center gap-1 pl-3 pr-1">
              {isEditing ? (
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <input
                    ref={inputRef}
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitEdit()
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    className="text-xs text-white/90 bg-white/[0.08] border border-violet-500/40 rounded px-1.5 py-0.5 outline-none w-28"
                  />
                  <button onClick={commitEdit} className="p-0.5 text-emerald-400 hover:text-emerald-300">
                    <Check size={11} />
                  </button>
                  <button onClick={cancelEdit} className="p-0.5 text-white/30 hover:text-white/60">
                    <X size={11} />
                  </button>
                </div>
              ) : (
                <span className={cn(
                  'text-xs whitespace-nowrap transition-colors',
                  isActive ? 'text-white/85 font-medium' : 'text-white/45 group-hover:text-white/70'
                )}>
                  {split.name}
                </span>
              )}

              {/* ▾ dropdown */}
              {!isEditing && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      'p-1 rounded transition-colors outline-none',
                      'text-white/0 group-hover:text-white/35 hover:!text-white/70',
                      isActive && 'text-white/25'
                    )}
                    onClick={e => e.stopPropagation()}
                  >
                    <ChevronDown size={11} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    side="top"
                    sideOffset={4}
                    className="w-36 border border-white/[0.08] p-1"
                    style={{ background: 'rgba(8,8,14,0.97)', backdropFilter: 'blur(32px)' }}
                  >
                    <DropdownMenuItem
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-white/60 hover:text-white hover:bg-white/[0.06] cursor-pointer"
                      onClick={e => { e.stopPropagation(); startEdit(split) }}
                    >
                      <Pencil size={11} /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-white/60 hover:text-white hover:bg-white/[0.06] cursor-pointer"
                      onClick={e => { e.stopPropagation(); onDuplicateSplit(split) }}
                    >
                      <Copy size={11} /> Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-red-400/70 hover:text-red-400 hover:bg-red-950/30 cursor-pointer"
                      onClick={e => { e.stopPropagation(); onDeleteSplit(split.id) }}
                    >
                      <Trash2 size={11} /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
