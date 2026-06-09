'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import Image from 'next/image'
import { User } from 'lucide-react'
import { cn, getInternalFileUrl, formatYear } from '@/lib/utils'
import type { Persona } from '@/types'

type PersonaNodeData = {
  persona: Persona
  onClick: (persona: Persona) => void
  isInLaw?: boolean
}

export const PersonaNode = memo(function PersonaNode({
  data,
}: {
  data: PersonaNodeData
}) {
  const { persona, onClick, isInLaw } = data
  const isFemale = persona.genero === 'femenino'
  const estaVivo = !persona.fecha_fallecimiento

  // Color scheme: blood relatives use primary (male) / secondary (female)
  // In-laws use a neutral warm-gray (outline) regardless of gender
  const borderColor = isInLaw
    ? 'border-outline'
    : isFemale ? 'border-secondary' : 'border-primary'
  const avatarBorder = isInLaw
    ? 'border-outline/60'
    : isFemale ? 'border-secondary' : 'border-primary'
  const avatarBg = isInLaw
    ? 'bg-[#76786b]/10'
    : isFemale ? 'bg-secondary/10' : 'bg-primary/10'
  const iconColor = isInLaw
    ? 'text-outline'
    : isFemale ? 'text-secondary' : 'text-primary'

  const anioNac = persona.fecha_nacimiento ? formatYear(persona.fecha_nacimiento) : null
  const anioFal = persona.fecha_fallecimiento ? formatYear(persona.fecha_fallecimiento) : null
  const years = anioNac ? `${anioNac} – ${anioFal ?? 'presente'}` : null

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-outline/40 !border-0"
      />

      <button
        onClick={() => onClick(persona)}
        className={cn(
          'nodrag w-40 rounded-xl border-2 p-3 text-center',
          'bg-surface-container-lowest shadow-card',
          'hover:shadow-card-hover hover:scale-[1.04] transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          borderColor,
          !estaVivo && 'opacity-80'
        )}
      >
        {/* Foto circular */}
        <div className="flex justify-center mb-2">
          <div
            className={cn(
              'relative w-14 h-14 rounded-full overflow-hidden border-2 flex-shrink-0',
              avatarBorder,
              avatarBg,
            )}
          >
            {persona.foto_perfil_url ? (
              <Image
                src={getInternalFileUrl(persona.foto_perfil_url)}
                alt={`${persona.nombre} ${persona.apellido}`}
                fill
                className="object-cover"
                sizes="56px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className={cn('w-7 h-7', iconColor)} />
              </div>
            )}
            {!estaVivo && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <span className="text-white text-sm">†</span>
              </div>
            )}
          </div>
        </div>

        {/* Nombre */}
        <p className="text-[12px] font-semibold text-on-surface leading-tight truncate">
          {persona.nombre}
        </p>
        <p className="text-[11px] text-on-surface-variant leading-tight truncate">
          {persona.apellido}
        </p>

        {/* Años */}
        {years && (
          <p className="text-[10px] text-outline mt-1 truncate">{years}</p>
        )}

        {/* Lugar de origen */}
        {persona.lugar_nacimiento && (
          <p
            className="text-[10px] text-outline mt-0.5 truncate"
            title={persona.lugar_nacimiento}
          >
            {persona.lugar_nacimiento}
          </p>
        )}
      </button>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-outline/40 !border-0"
      />
    </>
  )
})
