'use client'

import { useState, useMemo } from 'react'
import type { Evento, CategoriaEvento } from '@/types'
import { TimelineCard } from './TimelineCard'
import { TimelineFilters } from './TimelineFilters'

interface TimelineProps {
  eventos: Evento[]
}

export function Timeline({ eventos }: TimelineProps) {
  const [activeFilter, setActiveFilter] = useState<CategoriaEvento | null>(null)

  // Calcular counts para cada categoría
  const counts = useMemo(() => {
    const result: Record<CategoriaEvento | 'all', number> = {
      all: eventos.length,
      espana: 0,
      travesia: 0,
      argentina: 0,
      familia: 0,
    }

    eventos.forEach((evento) => {
      result[evento.categoria]++
    })

    return result
  }, [eventos])

  // Filtrar eventos
  const filteredEventos = useMemo(() => {
    if (!activeFilter) return eventos
    return eventos.filter((e) => e.categoria === activeFilter)
  }, [eventos, activeFilter])

  if (eventos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-outline"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="font-serif text-headline-sm text-on-surface mb-2">
          Sin eventos aún
        </h3>
        <p className="text-body-md text-on-surface-variant max-w-md">
          La línea de tiempo está vacía. Los administradores pueden agregar
          eventos históricos desde el panel de administración.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Filtros */}
      <div className="mb-10">
        <TimelineFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={counts}
        />
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Línea central */}
        <div className="timeline-line hidden md:block" />

        {/* Línea izquierda (mobile) */}
        <div className="absolute left-[7px] top-0 w-0.5 h-full bg-gradient-to-b from-transparent via-outline-variant to-transparent md:hidden" />

        {/* Eventos */}
        <div className="space-y-8 md:space-y-12">
          {filteredEventos.map((evento, index) => (
            <TimelineCard
              key={evento.id}
              evento={evento}
              position={index % 2 === 0 ? 'left' : 'right'}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Mensaje si no hay resultados con el filtro */}
      {filteredEventos.length === 0 && activeFilter && (
        <div className="text-center py-12">
          <p className="text-body-lg text-on-surface-variant">
            No hay eventos en esta categoría
          </p>
          <button
            onClick={() => setActiveFilter(null)}
            className="mt-4 text-primary hover:underline"
          >
            Ver todos los eventos
          </button>
        </div>
      )}
    </div>
  )
}
