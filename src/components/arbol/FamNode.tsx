'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'

export const FamNode = memo(function FamNode() {
  return (
    <>
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
    </>
  )
})
