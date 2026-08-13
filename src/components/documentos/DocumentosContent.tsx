'use client'

import { useState } from 'react'
import type { Foto, Carta } from '@/types'
import { PhotoCard } from '@/components/galeria/PhotoCard'
import { PhotoModal } from '@/components/galeria/PhotoModal'
import { CartaCard } from '@/components/galeria/CartaCard'
import { CartaModal } from '@/components/galeria/CartaModal'

interface DocumentosContentProps {
  fotos: Foto[]
  cartas: Carta[]
}

export function DocumentosContent({ fotos, cartas }: DocumentosContentProps) {
  const [selectedFotoIndex, setSelectedFotoIndex] = useState<number | null>(null)
  const [selectedCarta, setSelectedCarta] = useState<Carta | null>(null)

  return (
    <div className="space-y-16">
      {/* Sección: Imágenes de documentos */}
      {fotos.length > 0 && (
        <section>
          <h2 className="font-serif text-headline-md text-on-surface mb-6">
            Imágenes de documentos
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {fotos.map((foto, index) => (
              <PhotoCard
                key={foto.id}
                foto={foto}
                onClick={() => setSelectedFotoIndex(index)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Sección: Cartas y escritos */}
      {cartas.length > 0 && (
        <section>
          <h2 className="font-serif text-headline-md text-on-surface mb-6">
            Cartas y escritos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {cartas.map((carta) => (
              <CartaCard key={carta.id} carta={carta} onClick={() => setSelectedCarta(carta)} />
            ))}
          </div>
        </section>
      )}

      {fotos.length === 0 && cartas.length === 0 && (
        <div className="text-center py-20 text-on-surface-variant">
          <p className="text-body-lg">No hay documentos cargados todavía.</p>
        </div>
      )}

      {/* Modales */}
      {selectedFotoIndex !== null && fotos[selectedFotoIndex] && (
        <PhotoModal
          foto={fotos[selectedFotoIndex]}
          onClose={() => setSelectedFotoIndex(null)}
          onPrev={() => setSelectedFotoIndex((i) => (i !== null && i > 0 ? i - 1 : i))}
          onNext={() => setSelectedFotoIndex((i) => (i !== null && i < fotos.length - 1 ? i + 1 : i))}
          hasPrev={selectedFotoIndex > 0}
          hasNext={selectedFotoIndex < fotos.length - 1}
        />
      )}
      {selectedCarta && (
        <CartaModal carta={selectedCarta} onClose={() => setSelectedCarta(null)} />
      )}
    </div>
  )
}
