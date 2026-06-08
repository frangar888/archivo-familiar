'use client'

import Image from 'next/image'
import type { ExtNode } from 'relatives-tree/lib/types'
import { cn, getGoogleDriveImageUrl, formatYear, calcularEdad } from '@/lib/utils'
import type { Persona } from '@/types'
import { User, Focus } from 'lucide-react'

interface TreeNodeProps {
  node: ExtNode
  persona: Persona
  isRoot: boolean
  onClick: () => void
  onSetRoot: () => void
  style: React.CSSProperties
}

export function TreeNode({
  node,
  persona,
  isRoot,
  onClick,
  onSetRoot,
  style,
}: TreeNodeProps) {
  const isFemale = persona.genero === 'femenino'
  const edad = calcularEdad(persona.fecha_nacimiento, persona.fecha_fallecimiento)
  const estaVivo = !persona.fecha_fallecimiento

  return (
    <div
      className="absolute flex flex-col items-center"
      style={style}
    >
      {/* Avatar */}
      <button
        onClick={onClick}
        className={cn(
          'relative w-16 h-16 rounded-full overflow-hidden',
          'border-4 transition-all duration-300',
          'hover:scale-110 hover:shadow-card',
          isRoot ? 'border-tertiary ring-2 ring-tertiary/30' : '',
          isFemale ? 'border-secondary' : 'border-primary',
          !estaVivo && 'opacity-75'
        )}
      >
        {persona.foto_perfil_url ? (
          <Image
            src={getGoogleDriveImageUrl(persona.foto_perfil_url)}
            alt={`${persona.nombre} ${persona.apellido}`}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div
            className={cn(
              'w-full h-full flex items-center justify-center',
              isFemale ? 'bg-secondary/20' : 'bg-primary/20'
            )}
          >
            <User
              className={cn(
                'w-8 h-8',
                isFemale ? 'text-secondary' : 'text-primary'
              )}
            />
          </div>
        )}

        {/* Indicador de fallecido */}
        {!estaVivo && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <span className="text-white text-lg">†</span>
          </div>
        )}
      </button>

      {/* Badge de nodo actual */}
      {isRoot && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-tertiary-fixed text-[10px] font-bold text-on-surface whitespace-nowrap">
          Nodo Actual
        </span>
      )}

      {/* Nombre */}
      <button
        onClick={onClick}
        className="mt-2 text-center group"
      >
        <p className="text-body-sm font-medium text-on-surface group-hover:text-primary transition-colors line-clamp-1">
          {persona.nombre}
        </p>
        <p className="text-body-sm text-on-surface-variant line-clamp-1">
          {persona.apellido}
        </p>
      </button>

      {/* Años */}
      <p className="text-[11px] text-outline">
        {persona.fecha_nacimiento && formatYear(persona.fecha_nacimiento)}
        {persona.fecha_nacimiento && ' - '}
        {persona.fecha_fallecimiento
          ? formatYear(persona.fecha_fallecimiento)
          : persona.fecha_nacimiento
          ? 'presente'
          : ''}
      </p>

      {/* Botón centrar */}
      {!isRoot && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSetRoot()
          }}
          className="mt-1 p-1 rounded-full text-outline hover:text-primary hover:bg-surface-container-high transition-colors"
          title="Centrar árbol aquí"
        >
          <Focus className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
