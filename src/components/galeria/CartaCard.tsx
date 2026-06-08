'use client'

import { FileText, Calendar, User, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Carta } from '@/types'

interface CartaCardProps {
  carta: Carta
  onClick: () => void
}

export function CartaCard({ carta, onClick }: CartaCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group card overflow-hidden text-left w-full',
        'transition-all duration-300 hover:scale-[1.02]'
      )}
    >
      {/* Portada simulada — aspecto documento */}
      <div className="relative bg-[#f5f0e4] border-b border-outline/20 flex flex-col items-center justify-center py-8 px-4 gap-3"
        style={{ minHeight: '160px' }}>
        {/* Icono de documento con "páginas apiladas" */}
        <div className="relative">
          {/* Sombra de páginas */}
          <div className="absolute top-1 left-1 w-12 h-14 rounded bg-outline/20" />
          <div className="absolute top-0.5 left-0.5 w-12 h-14 rounded bg-outline/30" />
          {/* Página principal */}
          <div className="relative w-12 h-14 rounded bg-white border border-outline/30 shadow-card flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Cantidad de páginas */}
        <span className="text-[11px] font-bold uppercase tracking-wide text-outline bg-surface-container px-2 py-0.5 rounded-full">
          {carta.paginas.length} {carta.paginas.length === 1 ? 'página' : 'páginas'}
        </span>

        {/* Badge "Carta" */}
        <span className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-tertiary/90 text-white">
          Carta
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-serif text-title-md text-on-surface mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {carta.titulo}
        </h3>

        <div className="space-y-1 text-body-sm text-outline mb-3">
          {carta.fecha && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              {carta.fecha}
            </span>
          )}
          {carta.remitente && (
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              De: {carta.remitente}
              {carta.destinatario && ` → ${carta.destinatario}`}
            </span>
          )}
        </div>

        {carta.descripcion && (
          <p className="text-body-sm text-on-surface-variant line-clamp-2 mb-3">
            {carta.descripcion}
          </p>
        )}

        <span className="flex items-center gap-1 text-body-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Ver carta <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </button>
  )
}
