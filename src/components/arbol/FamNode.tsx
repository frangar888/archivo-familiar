'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'

interface FamNodeData {
  hasChildren?: boolean
  isCollapsed?: boolean
  onToggle?: () => void
}

export const FamNode = memo(function FamNode({ data }: NodeProps) {
  const { hasChildren, isCollapsed, onToggle } = (data ?? {}) as FamNodeData

  return (
    <div className="relative flex items-center justify-center" style={{ width: 10, height: 10 }}>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-1 !h-1 !bg-outline/40 !border-0 !min-w-0 !min-h-0"
      />
      <div className="w-2.5 h-2.5 rounded-full bg-outline/50" />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-1 !h-1 !bg-outline/40 !border-0 !min-w-0 !min-h-0"
      />
      {hasChildren && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggle?.() }}
          style={{ position: 'absolute', left: 14, top: -3, zIndex: 10 }}
          className="w-4 h-4 rounded-full bg-surface-container-lowest border border-outline/50 flex items-center justify-center text-[10px] font-bold text-on-surface-variant hover:bg-primary hover:text-on-primary hover:border-primary transition-colors shadow-sm cursor-pointer"
          title={isCollapsed ? 'Expandir hijos' : 'Contraer hijos'}
        >
          {isCollapsed ? '+' : '−'}
        </button>
      )}
    </div>
  )
})
