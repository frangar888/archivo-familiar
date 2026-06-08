import { Suspense } from 'react'
import { getFotos, getCartas } from '@/lib/data'
import { Gallery } from '@/components/galeria'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Galería de Fotos | Archivo Familiar',
  description: 'Imágenes históricas que capturan recuerdos de nuestra familia',
}

async function GalleryContent() {
  const [fotos, cartas] = await Promise.all([getFotos(), getCartas()])
  return <Gallery fotos={fotos} cartas={cartas} />
}

function GallerySkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex gap-4 mb-8">
        <div className="h-12 bg-surface-container-high rounded-xl flex-1 max-w-md" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-10 bg-surface-container-high rounded-full" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="aspect-square bg-surface-container rounded-card" />
        ))}
      </div>
    </div>
  )
}

export default function GaleriaPage() {
  return (
    <div className="py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-serif text-display-sm md:text-display-md text-on-surface mb-4">
            Galería de Fotos
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-2xl">
            Imágenes que capturan momentos, rostros y lugares a través de las
            generaciones. Cada foto cuenta una historia.
          </p>
        </div>

        {/* Gallery */}
        <Suspense fallback={<GallerySkeleton />}>
          <GalleryContent />
        </Suspense>
      </div>
    </div>
  )
}
