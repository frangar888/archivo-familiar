'use client'

import type { NodeProps } from '@xyflow/react'

export function FamBgNode({ data }: NodeProps) {
  const { width, height, label } = data as { width: number; height: number; label: string }

  return (
    <div
      style={{ width, height, pointerEvents: 'none' }}
      className="rounded-2xl border border-outline/10 bg-surface-container/30"
    >
      {label && (
        <p className="px-3 pt-2 text-[10px] font-medium text-outline/50 text-center leading-tight truncate">
          {label}
        </p>
      )}
    </div>
  )
}
