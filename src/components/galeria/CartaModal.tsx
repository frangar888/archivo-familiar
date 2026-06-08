'use client'

import { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { cn, getDriveVideoEmbedUrl } from '@/lib/utils'
import type { Carta } from '@/types'

interface CartaModalProps {
  carta: Carta
  onClose: () => void
}

export function CartaModal({ carta, onClose }: CartaModalProps) {
  const [page, setPage] = useState(0)
  const total = carta.paginas.length

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setPage((p) => Math.min(p + 1, total - 1))
      if (e.key === 'ArrowLeft')  setPage((p) => Math.max(p - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, total])

  const currentUrl = carta.paginas[page]
  // Convierte link de Drive ("share" o "view") a URL de embed (preview)
  const embedUrl = getDriveVideoEmbedUrl(currentUrl) ?? currentUrl

  return (
    <div className="fixed inset-0 z-50 flex flex-col" onClick={onClose}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/95" />

      {/* Header */}
      <div
        className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <h2 className="font-serif text-white text-title-md truncate">{carta.titulo}</h2>
          <p className="text-white/50 text-body-sm">
            {carta.fecha && `${carta.fecha} · `}
            {carta.remitente && `De: ${carta.remitente}`}
            {carta.destinatario && ` → ${carta.destinatario}`}
          </p>
        </div>
        <button onClick={onClose}
          className="ml-4 flex-shrink-0 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Visor PDF */}
      <div className="relative z-10 flex-1 flex items-stretch overflow-hidden"
        onClick={(e) => e.stopPropagation()}>

        {/* Botón anterior */}
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
          disabled={page === 0}
          className={cn(
            'flex-shrink-0 w-12 flex items-center justify-center text-white transition-colors',
            page === 0 ? 'opacity-20 cursor-default' : 'hover:bg-white/10'
          )}
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        {/* PDF iframe */}
        <div className="flex-1 flex flex-col min-w-0">
          <iframe
            key={embedUrl}
            src={embedUrl}
            title={`${carta.titulo} - página ${page + 1}`}
            className="flex-1 w-full bg-white"
            allow="autoplay"
          />
        </div>

        {/* Botón siguiente */}
        <button
          onClick={() => setPage((p) => Math.min(p + 1, total - 1))}
          disabled={page === total - 1}
          className={cn(
            'flex-shrink-0 w-12 flex items-center justify-center text-white transition-colors',
            page === total - 1 ? 'opacity-20 cursor-default' : 'hover:bg-white/10'
          )}
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      {/* Footer — navegación por miniaturas */}
      <div
        className="relative z-10 border-t border-white/10 px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Contador */}
          <span className="text-white/70 text-body-sm flex-shrink-0">
            Página <strong className="text-white">{page + 1}</strong> de {total}
          </span>

          {/* Miniaturas de página */}
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {carta.paginas.map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={cn(
                  'flex-shrink-0 w-7 h-9 rounded border-2 transition-all text-[10px] font-bold',
                  i === page
                    ? 'border-white bg-white text-on-surface scale-110'
                    : 'border-white/30 bg-white/10 text-white/60 hover:border-white/60'
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {/* Descargar página actual */}
          <a
            href={currentUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-body-sm hover:bg-white/20 transition-colors"
          >
            <Download className="w-4 h-4" />
            Descargar
          </a>
        </div>

        {/* Descripción */}
        {carta.descripcion && (
          <p className="mt-2 text-white/50 text-body-sm line-clamp-2">{carta.descripcion}</p>
        )}
      </div>
    </div>
  )
}
