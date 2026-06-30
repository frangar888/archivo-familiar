'use client'

import Image from 'next/image'
import { cn, getInternalFileUrl } from '@/lib/utils'
import type { Foto } from '@/types'
import { MapPin, Calendar } from 'lucide-react'

interface PhotoCardProps {
  foto: Foto
  onClick: () => void
  featured?: boolean
}

export function PhotoCard({ foto, onClick, featured = false }: PhotoCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-card bg-surface-container-low',
        'transition-all duration-300 hover:shadow-card-hover',
        'text-left w-full',
        featured ? 'col-span-full md:col-span-2 aspect-[16/9]' : 'aspect-square'
      )}
    >
      {/* Imagen con efecto marco */}
      <div className="absolute inset-1 rounded-photo overflow-hidden">
        <Image
          src={getInternalFileUrl(foto.imagen_url)}
          alt={foto.titulo}
          fill
          className="object-cover photo-historic transition-transform duration-500 group-hover:scale-105"
          style={foto.rotacion ? { transform: `rotate(${foto.rotacion}deg) scale(1.05)` } : undefined}
          sizes={featured ? '(max-width: 768px) 100vw, 800px' : '(max-width: 768px) 50vw, 300px'}
          loading={featured ? 'eager' : 'lazy'}
          priority={featured}
        />
        <div className="grain-overlay" />

        {/* Overlay con info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="font-serif text-title-md text-white mb-1 line-clamp-1">
            {foto.titulo}
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-body-sm text-white/80">
            {foto.fecha_aproximada && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {foto.fecha_aproximada}
              </span>
            )}
            {foto.lugar && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {foto.lugar}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Badge destacada */}
      {foto.destacada && (
        <span className="absolute top-3 right-3 px-2 py-1 rounded-full bg-tertiary-fixed text-[11px] font-bold text-on-surface z-10">
          Destacada
        </span>
      )}
    </button>
  )
}
