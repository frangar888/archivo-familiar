'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { X, MapPin, Calendar, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { getInternalFileUrl } from '@/lib/utils'
import type { Foto } from '@/types'
import { CATEGORIAS_FOTO } from '@/types'

interface PhotoModalProps {
  foto: Foto
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
  hasPrev?: boolean
  hasNext?: boolean
}

const MIN_SCALE = 1
const MAX_SCALE = 4

export function PhotoModal({
  foto,
  onClose,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}: PhotoModalProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const isDragging = useRef(false)
  const hasDragged = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })

  // Reset zoom al cambiar de foto
  useEffect(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [foto.id])

  const resetZoom = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(+(s + 0.75).toFixed(2), MAX_SCALE))
  }, [])

  const zoomOut = useCallback(() => {
    setScale((s) => {
      const next = Math.max(+(s - 0.75).toFixed(2), MIN_SCALE)
      if (next === MIN_SCALE) setPosition({ x: 0, y: 0 })
      return next
    })
  }, [])

  // Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (scale > 1) resetZoom()
        else onClose()
      }
      if (e.key === 'ArrowLeft' && hasPrev && onPrev && scale === 1) onPrev()
      if (e.key === 'ArrowRight' && hasNext && onNext && scale === 1) onNext()
      if (e.key === '+' || e.key === '=') zoomIn()
      if (e.key === '-') zoomOut()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onPrev, onNext, hasPrev, hasNext, scale, resetZoom, zoomIn, zoomOut])

  // Scroll para zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setScale((s) => {
      const delta = e.deltaY < 0 ? 0.25 : -0.25
      const next = Math.min(Math.max(+(s + delta).toFixed(2), MIN_SCALE), MAX_SCALE)
      if (next === MIN_SCALE) setPosition({ x: 0, y: 0 })
      return next
    })
  }, [])

  // Drag para paneo
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return
    e.preventDefault()
    isDragging.current = true
    hasDragged.current = false
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    hasDragged.current = true
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    })
  }

  const handleMouseUp = () => {
    isDragging.current = false
  }

  // Click en la imagen: toggle zoom (solo si no hubo drag)
  const handleImageClick = () => {
    if (hasDragged.current) return
    if (scale === 1) setScale(2)
    else resetZoom()
  }

  const categoriaInfo = foto.categoria ? CATEGORIAS_FOTO[foto.categoria] : null
  const isZoomed = scale > 1

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => { if (!isZoomed) onClose() }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/90" />

      {/* Botón cerrar */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Controles de zoom */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/40 rounded-full px-3 py-1.5">
        <button
          onClick={(e) => { e.stopPropagation(); zoomOut() }}
          disabled={scale <= MIN_SCALE}
          className="p-1 text-white disabled:opacity-30 hover:text-white/70 transition-colors"
          title="Alejar (−)"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <span className="text-white text-body-sm w-10 text-center select-none">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); zoomIn() }}
          disabled={scale >= MAX_SCALE}
          className="p-1 text-white disabled:opacity-30 hover:text-white/70 transition-colors"
          title="Acercar (+)"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
      </div>

      {/* Navegación (solo visible sin zoom) */}
      {!isZoomed && hasPrev && onPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {!isZoomed && hasNext && onNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext() }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Contenido */}
      <div
        className="relative max-w-5xl w-full max-h-[90vh] flex flex-col md:flex-row gap-6 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Imagen con zoom */}
        <div
          className="relative flex-1 min-h-[300px] md:min-h-[500px] rounded-card bg-surface-container-low p-2 overflow-hidden"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isZoomed ? (isDragging.current ? 'grabbing' : 'grab') : 'zoom-in' }}
        >
          <div
            className="relative w-full h-full rounded-photo overflow-hidden"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transformOrigin: 'center',
              transition: isDragging.current ? 'none' : 'transform 0.2s ease',
            }}
            onClick={handleImageClick}
          >
            <Image
              src={getInternalFileUrl(foto.imagen_url)}
              alt={foto.titulo}
              fill
              className="object-contain"
              style={foto.rotacion ? { transform: `rotate(${foto.rotacion}deg)` } : undefined}
              sizes="(max-width: 768px) 100vw, 800px"
              priority
              draggable={false}
            />
          </div>

          {/* Hint zoom (solo cuando scale=1) */}
          {!isZoomed && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/40 text-white/60 text-body-sm pointer-events-none select-none">
              Click o scroll para ampliar
            </div>
          )}
        </div>

        {/* Info */}
        <div className="md:w-80 p-6 rounded-card bg-surface-container-lowest">
          <h2 className="font-serif text-headline-sm text-on-surface mb-4">
            {foto.titulo}
          </h2>

          {foto.descripcion && (
            <p className="text-body-md text-on-surface-variant mb-6 leading-relaxed">
              {foto.descripcion}
            </p>
          )}

          <div className="space-y-3">
            {foto.fecha_aproximada && (
              <div className="flex items-center gap-3 text-body-md text-on-surface-variant">
                <Calendar className="w-5 h-5 text-primary" />
                <span>{foto.fecha_aproximada}</span>
              </div>
            )}

            {foto.lugar && (
              <div className="flex items-center gap-3 text-body-md text-on-surface-variant">
                <MapPin className="w-5 h-5 text-primary" />
                <span>{foto.lugar}</span>
              </div>
            )}

            {categoriaInfo && (
              <div className="pt-3 border-t border-surface-container-high">
                <span className="badge-category">{categoriaInfo.label}</span>
              </div>
            )}
          </div>

          {/* Atajo reset zoom */}
          {isZoomed && (
            <button
              onClick={resetZoom}
              className="mt-6 w-full btn-outline text-body-sm"
            >
              Restablecer zoom
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
