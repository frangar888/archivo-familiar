import { Suspense } from 'react'
import { getPersonas, getMatrimonios } from '@/lib/data'
import { FamilyTree } from '@/components/arbol'

export const revalidate = 60

export const metadata = {
  title: 'Árbol Genealógico | Archivo Familiar',
  description: 'Explora las conexiones familiares a través de las generaciones',
}

async function ArbolContent() {
  const [personas, matrimonios] = await Promise.all([
    getPersonas(),
    getMatrimonios(),
  ])
  return <FamilyTree personas={personas} matrimonios={matrimonios} />
}

function ArbolSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-surface-container animate-pulse rounded-card">
      <div className="text-on-surface-variant">Cargando árbol...</div>
    </div>
  )
}

export default function ArbolPage() {
  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Header compacto */}
      <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 pt-8 pb-4 max-w-7xl mx-auto w-full">
        <h1 className="font-serif text-display-sm text-on-surface mb-1">
          Árbol genealogico Familia De Simon-Gonzalez
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Arrastrá para moverte · Scroll para hacer zoom · Click en una persona para ver su historia
        </p>
      </div>

      {/* Canvas del árbol — ocupa el espacio restante */}
      <div className="flex-1 mx-4 sm:mx-6 lg:mx-8 mb-4 rounded-card overflow-hidden border border-surface-container-high min-h-0">
        <Suspense fallback={<ArbolSkeleton />}>
          <ArbolContent />
        </Suspense>
      </div>

      {/* Leyenda */}
      <div className="flex-shrink-0 mx-4 sm:mx-6 lg:mx-8 mb-4 px-4 py-3 rounded-xl bg-surface-container">
        <div className="flex flex-wrap gap-6 text-body-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>Hombre</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-secondary" />
            <span>Mujer</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="24" height="8" viewBox="0 0 24 8">
              <line x1="0" y1="4" x2="24" y2="4" stroke="#b87065" strokeWidth="2" strokeDasharray="6 3" />
            </svg>
            <span>Matrimonio</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="24" height="8" viewBox="0 0 24 8">
              <line x1="0" y1="4" x2="18" y2="4" stroke="#4a6741" strokeWidth="2" />
              <polygon points="18,1 24,4 18,7" fill="#4a6741" />
            </svg>
            <span>Descendencia</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-outline">†</span>
            <span>Fallecido/a</span>
          </div>
        </div>
      </div>
    </div>
  )
}
