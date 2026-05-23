import { useDraggable } from '@dnd-kit/core'
import { MUSCLE_GROUPS, MUSCLE_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface DraggableChipProps {
  name: string
}

function DraggableChip({ name }: DraggableChipProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-${name}`,
    data: { type: 'muscleGroup', muscleGroup: name },
  })

  const dotColor = MUSCLE_COLORS[name] ?? '#94a3b8'

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/[0.06]',
        'hover:border-white/[0.12] cursor-grab active:cursor-grabbing',
        'transition-all select-none flex-shrink-0',
        isDragging && 'opacity-25'
      )}
      style={{ background: 'rgba(255,255,255,0.03)' }}
      title={name}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: dotColor }}
      />
      <span className="text-[11px] text-white/50 hover:text-white/70 whitespace-nowrap transition-colors">{name}</span>
    </div>
  )
}

export default function MuscleGroupBar() {
  return (
    <div
      className="border-t border-white/[0.04] px-4 flex items-center gap-1.5 overflow-x-auto flex-shrink-0 h-[48px]"
      style={{ background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
    >
      <span className="text-[9px] font-medium text-white/20 uppercase tracking-[0.15em] flex-shrink-0 mr-2">
        Drag
      </span>
      {MUSCLE_GROUPS.map(name => (
        <DraggableChip key={name} name={name} />
      ))}
    </div>
  )
}
