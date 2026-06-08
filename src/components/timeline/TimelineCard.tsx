'use client'

import Image from 'next/image'
import { cn, getGoogleDriveImageUrl, formatDate, formatYear } from '@/lib/utils'
import type { Evento, CategoriaEvento } from '@/types'
import { MapPin } from 'lucide-react'

interface TimelineCardProps {
  evento: Evento
  position: 'left' | 'right'
  index: number
}

const categoriaColors: Record<CategoriaEvento, string> = {
  espana: 'bg-secondary',
  travesia: 'bg-tertiary',
  argentina: 'bg-primary',
  familia: 'bg-primary-container',
}

const categoriaLabels: Record<CategoriaEvento, string> = {
  espana: 'España',
  travesia: 'Travesía',
  argentina: 'Argentina',
  familia: 'Familia',
}

export function TimelineCard({ evento, position, index }: TimelineCardProps) {
  return (
    <div
      className={cn(
        'relative flex w-full',
        position === 'left' ? 'md:justify-start' : 'md:justify-end',
        'justify-end' // Mobile: siempre a la derecha
      )}
    >
      {/* Nodo del timeline */}
      <div
        className={cn(
          'absolute left-0 md:left-1/2 md:-translate-x-1/2',
          'w-3.5 h-3.5 rounded-full border-2 border-surface z-10',
          categoriaColors[evento.categoria]
        )}
        style={{ top: '24px' }}
      />

      {/* Card */}
      <div
        className={cn(
          'ml-8 md:ml-0 w-full md:w-[calc(50%-2rem)]',
          'card p-5 card-tilt-hover',
          position === 'left' ? 'md:mr-8' : 'md:ml-8'
        )}
        style={{
          animationDelay: `${index * 100}ms`,
        }}
      >
        {/* Badge de fecha */}
        <div className="flex items-center gap-3 mb-3">
          <span className="badge-date">{formatYear(evento.fecha)}</span>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[11px] font-medium text-white uppercase tracking-wider',
              categoriaColors[evento.categoria]
            )}
          >
            {categoriaLabels[evento.categoria]}
          </span>
        </div>

        {/* Imagen */}
        {evento.imagen_url && (
          <div className="relative mb-4 rounded-photo overflow-hidden bg-surface-container-low p-1">
            <div className="relative aspect-video rounded-sm overflow-hidden">
              <Image
                src={getGoogleDriveImageUrl(evento.imagen_url)}
                alt={evento.titulo}
                fill
                className="object-cover photo-historic"
                sizes="(max-width: 768px) 100vw, 400px"
              />
              <div className="grain-overlay" />
            </div>
          </div>
        )}

        {/* Contenido */}
        <h3 className="font-serif text-title-lg text-on-surface mb-2">
          {evento.titulo}
        </h3>

        {evento.descripcion && (
          <p className="text-body-md text-on-surface-variant mb-3 line-clamp-3">
            {evento.descripcion}
          </p>
        )}

        {/* Lugar y fecha completa */}
        <div className="flex flex-wrap items-center gap-4 text-body-sm text-outline">
          {evento.lugar && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {evento.lugar}
            </span>
          )}
          <span>{formatDate(evento.fecha)}</span>
        </div>
      </div>
    </div>
  )
}
