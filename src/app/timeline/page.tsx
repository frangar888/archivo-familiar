import { Suspense } from 'react'
import { getEventos } from '@/lib/data'
import { Timeline } from '@/components/timeline'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Línea de Tiempo | Archivo Familiar',
  description: 'Recorre los momentos que marcaron la historia de nuestra familia',
}

async function TimelineContent() {
  const eventos = await getEventos()
  return <Timeline eventos={eventos} />
}

function TimelineSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex gap-2 mb-10">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-24 bg-surface-container-high rounded-full" />
        ))}
      </div>
      <div className="space-y-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-end">
            <div className="w-full md:w-1/2 h-64 bg-surface-container rounded-card" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TimelinePage() {
  return (
    <div className="py-12 lg:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="font-serif text-display-sm md:text-display-md text-on-surface mb-4">
            Línea de Tiempo
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            Un recorrido cronológico por los eventos que marcaron la historia
            de nuestra familia, desde España hasta Argentina.
          </p>
        </div>

        {/* Timeline */}
        <Suspense fallback={<TimelineSkeleton />}>
          <TimelineContent />
        </Suspense>
      </div>
    </div>
  )
}
