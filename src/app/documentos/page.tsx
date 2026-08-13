import { Suspense } from 'react'
import { getFotosDocumentos, getCartas } from '@/lib/data'
import { DocumentosContent } from '@/components/documentos/DocumentosContent'

export const revalidate = 60

export const metadata = {
  title: 'Documentos | Archivo Familiar',
  description: 'Cartas, escritos e imágenes de documentos históricos de la familia',
}

function DocumentosSkeleton() {
  return (
    <div className="animate-pulse space-y-12">
      <div className="h-8 bg-surface-container-high rounded w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-[3/4] bg-surface-container rounded-card" />
        ))}
      </div>
    </div>
  )
}

async function DocumentosData() {
  const [fotos, cartas] = await Promise.all([getFotosDocumentos(), getCartas()])
  return <DocumentosContent fotos={fotos} cartas={cartas} />
}

export default function DocumentosPage() {
  return (
    <div className="py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="font-serif text-display-sm md:text-display-md text-on-surface mb-4">
            Documentos
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-2xl">
            Cartas, escritos e imágenes de documentos que forman parte de la historia familiar.
          </p>
        </div>

        <Suspense fallback={<DocumentosSkeleton />}>
          <DocumentosData />
        </Suspense>
      </div>
    </div>
  )
}
