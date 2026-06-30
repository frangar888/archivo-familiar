'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, User, FileText, MapPin, Calendar, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Foto, CategoriaFoto, Carta } from '@/types'
import { PhotoCard } from './PhotoCard'
import { PhotoModal } from './PhotoModal'
import { CartaCard } from './CartaCard'
import { CartaModal } from './CartaModal'

interface GalleryProps {
  fotos: Foto[]
  cartas?: Carta[]
}

const PAGE_SIZE = 12

const categorias: {
  value: CategoriaFoto | null
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { value: null, label: 'Todas', icon: Home },
  { value: 'retratos', label: 'Retratos', icon: User },
  { value: 'documentos', label: 'Documentos', icon: FileText },
  { value: 'lugares', label: 'Lugares', icon: MapPin },
  { value: 'eventos', label: 'Eventos', icon: Calendar },
  { value: 'vida_cotidiana', label: 'Vida Cotidiana', icon: Home },
]

export function Gallery({ fotos, cartas = [] }: GalleryProps) {
  const [activeFilter, setActiveFilter] = useState<CategoriaFoto | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [selectedFotoIndex, setSelectedFotoIndex] = useState<number | null>(null)
  const [selectedCarta, setSelectedCarta] = useState<Carta | null>(null)

  // Reset pagination when filter or search changes
  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [activeFilter, searchQuery])

  // Cuando el filtro es "documentos" mostramos cartas; resto muestra fotos
  const showingCartas = activeFilter === 'documentos'

  // Filtrar fotos (excluye documentos cuando hay cartas cargadas)
  const filteredFotos = useMemo(() => {
    let result = fotos
    if (activeFilter) {
      result = result.filter((f) => f.categoria === activeFilter)
    } else if (cartas.length > 0) {
      // En "Todas", ocultamos las fotos de categoría documentos si hay cartas
      result = result.filter((f) => f.categoria !== 'documentos')
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (f) =>
          f.titulo.toLowerCase().includes(q) ||
          f.descripcion?.toLowerCase().includes(q) ||
          f.lugar?.toLowerCase().includes(q) ||
          f.fecha_aproximada?.toLowerCase().includes(q)
      )
    }
    return result
  }, [fotos, activeFilter, searchQuery, cartas.length])

  // Filtrar cartas (solo cuando activeFilter === 'documentos')
  const filteredCartas = useMemo(() => {
    if (!showingCartas) return []
    if (!searchQuery.trim()) return cartas
    const q = searchQuery.toLowerCase()
    return cartas.filter(
      (c) =>
        c.titulo.toLowerCase().includes(q) ||
        c.descripcion?.toLowerCase().includes(q) ||
        c.remitente?.toLowerCase().includes(q) ||
        c.destinatario?.toLowerCase().includes(q) ||
        c.fecha?.toLowerCase().includes(q)
    )
  }, [cartas, showingCartas, searchQuery])

  const handlePrev = () => {
    if (selectedFotoIndex !== null && selectedFotoIndex > 0) {
      setSelectedFotoIndex(selectedFotoIndex - 1)
    }
  }

  const handleNext = () => {
    if (selectedFotoIndex !== null && selectedFotoIndex < filteredFotos.length - 1) {
      setSelectedFotoIndex(selectedFotoIndex + 1)
    }
  }

  if (fotos.length === 0) {
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
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="font-serif text-headline-sm text-on-surface mb-2">
          Galería vacía
        </h3>
        <p className="text-body-md text-on-surface-variant max-w-md">
          Aún no hay fotos en la galería. Los administradores pueden agregar
          imágenes desde el panel de administración.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Controles */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Búsqueda */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
          <input
            type="text"
            placeholder="Buscar por título, lugar o fecha..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-12"
          />
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          {categorias.map((cat) => {
            const Icon = cat.icon
            const isActive = activeFilter === cat.value

            return (
              <button
                key={cat.value ?? 'all'}
                onClick={() => setActiveFilter(cat.value)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-full text-label-md transition-all duration-200',
                  isActive
                    ? 'bg-primary text-white'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid */}
      {showingCartas ? (
        /* ── Vista Documentos: cartas ── */
        filteredCartas.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredCartas.map((carta) => (
              <CartaCard key={carta.id} carta={carta} onClick={() => setSelectedCarta(carta)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-body-lg text-on-surface-variant">
              {cartas.length === 0
                ? 'No hay cartas escaneadas todavía'
                : 'No se encontraron cartas con ese criterio'}
            </p>
            {cartas.length > 0 && (
              <button onClick={() => setSearchQuery('')} className="mt-4 text-primary hover:underline">
                Limpiar búsqueda
              </button>
            )}
          </div>
        )
      ) : (
        /* ── Vista otras categorías: fotos ── */
        filteredFotos.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredFotos.slice(0, visibleCount).map((foto, index) => (
                <PhotoCard
                  key={foto.id}
                  foto={foto}
                  onClick={() => setSelectedFotoIndex(index)}
                  featured={index === 0 && foto.destacada}
                />
              ))}
            </div>
            {visibleCount < filteredFotos.length && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                  className="btn-outline"
                >
                  Ver más ({filteredFotos.length - visibleCount} restantes)
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-body-lg text-on-surface-variant">
              No se encontraron fotos con los filtros seleccionados
            </p>
            <button
              onClick={() => { setActiveFilter(null); setSearchQuery('') }}
              className="mt-4 text-primary hover:underline"
            >
              Limpiar filtros
            </button>
          </div>
        )
      )}

      {/* Modal fotos */}
      {selectedFotoIndex !== null && filteredFotos[selectedFotoIndex] && (
        <PhotoModal
          foto={filteredFotos[selectedFotoIndex]}
          onClose={() => setSelectedFotoIndex(null)}
          onPrev={handlePrev}
          onNext={handleNext}
          hasPrev={selectedFotoIndex > 0}
          hasNext={selectedFotoIndex < filteredFotos.length - 1}
        />
      )}

      {/* Modal carta */}
      {selectedCarta && (
        <CartaModal carta={selectedCarta} onClose={() => setSelectedCarta(null)} />
      )}
    </div>
  )
}
