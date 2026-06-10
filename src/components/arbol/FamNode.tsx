'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'

interface FamNodeData {
  hasChildren?: boolean
  isCollapsed?: boolean
}

export const FamNode = memo(function FamNode({ data }: NodeProps) {
  const { hasChildren, isCollapsed } = (data ?? {}) as FamNodeData

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
      {/* Indicador visual — el click se maneja en onNodeClick de ReactFlow */}
      {hasChildren && (
        <div
          style={{ position: 'absolute', left: 13, top: -4, zIndex: 10, pointerEvents: 'none' }}
          className="w-[18px] h-[18px] rounded-full bg-surface-container-lowest border border-outline/60 flex items-center justify-center text-[11px] font-bold text-on-surface-variant shadow-sm select-none"
        >
          {isCollapsed ? '+' : '−'}
        </div>
      )}
    </div>
  )
})
