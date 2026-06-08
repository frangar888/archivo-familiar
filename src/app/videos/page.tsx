import { Suspense } from 'react'
import { getVideos } from '@/lib/data'
import { VideoGallery } from '@/components/entrevistas'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Videos | Archivo Familiar',
  description: 'Testimonios en video de quienes vivieron nuestra historia familiar',
}

async function VideosContent() {
  const videos = await getVideos()
  return <VideoGallery videos={videos} />
}

function VideosSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-card overflow-hidden">
            <div className="aspect-video bg-surface-container" />
            <div className="p-5 bg-surface-container-lowest">
              <div className="h-6 bg-surface-container-high rounded w-3/4 mb-3" />
              <div className="h-4 bg-surface-container-high rounded w-full mb-2" />
              <div className="h-4 bg-surface-container-high rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function VideosPage() {
  return (
    <div className="py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-serif text-display-sm md:text-display-md text-on-surface mb-4">
            Videos
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-2xl">
            Testimonios grabados de quienes vivieron la historia en primera persona.
            Sus voces preservan memorias que no queremos olvidar.
          </p>
        </div>

        {/* Videos */}
        <Suspense fallback={<VideosSkeleton />}>
          <VideosContent />
        </Suspense>
      </div>
    </div>
  )
}
