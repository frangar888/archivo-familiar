'use client'

import type { NodeProps } from '@xyflow/react'

export function GenSepNode({ data }: NodeProps) {
  const { width, label } = data as { width: number; label: string }

  return (
    <div style={{ width, pointerEvents: 'none' }} className="flex items-center gap-3">
      <span className="shrink-0 text-[10px] font-semibold text-outline/40 uppercase tracking-widest whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 border-t border-dashed border-outline/25" />
    </div>
  )
}
