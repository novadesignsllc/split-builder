import { PlannedSet, SetType } from '@/lib/types'
import { X } from 'lucide-react'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface SetRowProps {
  set: PlannedSet
  onUpdate: (id: string, field: keyof PlannedSet, value: string) => void
  onRemove: (id: string) => void
}

const SET_TYPE_CYCLE: SetType[] = ['work', 'W', 'F', 'D']

const SET_TYPE_DISPLAY: Record<SetType, string> = {
  work: '•',
  W: 'W',
  F: 'F',
  D: 'D',
}

const SET_TYPE_CLASSES: Record<SetType, string> = {
  work: 'bg-white/[0.06] text-slate-400 hover:bg-white/[0.10]',
  W: 'bg-blue-950/50 text-blue-400 hover:bg-blue-950',
  F: 'bg-red-950/50 text-red-400 hover:bg-red-950',
  D: 'bg-purple-950/50 text-purple-400 hover:bg-purple-950',
}

export default function SetRow({ set, onUpdate, onRemove }: SetRowProps) {
  function cycleType() {
    const idx = SET_TYPE_CYCLE.indexOf(set.type)
    const next = SET_TYPE_CYCLE[(idx + 1) % SET_TYPE_CYCLE.length]
    onUpdate(set.id, 'type', next)
  }

  return (
    <div className="flex items-center gap-1.5 h-9 px-1">
      <TooltipProvider delay={300}>
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={cycleType}
                className={cn(
                  'flex-shrink-0 w-7 h-7 rounded-md text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer',
                  SET_TYPE_CLASSES[set.type]
                )}
                aria-label={`Set type: ${set.type === 'work' ? 'working' : set.type}`}
              />
            }
          >
            {SET_TYPE_DISPLAY[set.type]}
          </TooltipTrigger>
          <TooltipContent side="top">
            W = warmup (not counted toward volume) · F = working set to failure · D = drop set (counts as one working set)
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <input
        type="text"
        value={set.repRange}
        onChange={e => onUpdate(set.id, 'repRange', e.target.value)}
        placeholder="8–12"
        className="flex-1 min-w-0 h-7 px-2 text-xs rounded-md border border-white/[0.07] bg-white/[0.04] text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/15 transition-colors"
      />

      <button
        onClick={() => onRemove(set.id)}
        className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-slate-700 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
        aria-label="Remove set"
      >
        <X size={12} />
      </button>
    </div>
  )
}
