'use client'

import { useState, useMemo } from 'react'
import { ArrowUpDown, Clock, Eye } from 'lucide-react'
import type { Video, CategoriaVideo } from '@/types'
import { VideoCard } from './VideoCard'
import { VideoModal } from './VideoModal'
import { cn } from '@/lib/utils'

type FilterTab = 'todos' | CategoriaVideo
type SortOrder = 'reciente' | 'vistas'

const TABS: { value: FilterTab; label: string }[] = [
  { value: 'todos',       label: 'Todos' },
  { value: 'entrevista',  label: 'Entrevistas' },
  { value: 'video',       label: 'Videos' },
]

const SORTS: { value: SortOrder; label: string; icon: React.ElementType }[] = [
  { value: 'reciente', label: 'Más reciente', icon: Clock },
  { value: 'vistas',   label: 'Más vistas',   icon: Eye   },
]

interface VideoGalleryProps {
  videos: Video[]
}

export function VideoGallery({ videos }: VideoGalleryProps) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [filter, setFilter]   = useState<FilterTab>('todos')
  const [sort, setSort]       = useState<SortOrder>('reciente')

  const filtered = useMemo(() => {
    let list = filter === 'todos' ? videos : videos.filter((v) => v.categoria === filter)

    if (sort === 'reciente') {
      list = [...list].sort((a, b) => {
        const da = a.fecha_grabacion ?? a.created_at
        const db = b.fecha_grabacion ?? b.created_at
        return db.localeCompare(da)
      })
    } else {
      list = [...list].sort((a, b) => (b.vistas ?? 0) - (a.vistas ?? 0))
    }
    return list
  }, [videos, filter, sort])

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="font-serif text-headline-sm text-on-surface mb-2">Sin videos aún</h3>
        <p className="text-body-md text-on-surface-variant max-w-md">
          Los videos aparecerán aquí. Los administradores pueden agregar videos desde el panel de administración.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* ── Controles: filtro + orden ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        {/* Tabs de categoría */}
        <div className="flex items-center gap-1 p-1 bg-surface-container rounded-xl">
          {TABS.map((tab) => {
            const count = tab.value === 'todos'
              ? videos.length
              : videos.filter((v) => v.categoria === tab.value).length
            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={cn(
                  'px-4 py-2 rounded-lg text-body-sm font-medium transition-all duration-200',
                  filter === tab.value
                    ? 'bg-surface-container-lowest shadow-card text-on-surface'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                )}
              >
                {tab.label}
                <span className={cn(
                  'ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full',
                  filter === tab.value ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-outline'
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-outline flex-shrink-0" />
          <div className="flex items-center gap-1 p-1 bg-surface-container rounded-xl">
            {SORTS.map((s) => {
              const Icon = s.icon
              return (
                <button
                  key={s.value}
                  onClick={() => setSort(s.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-body-sm font-medium transition-all duration-200',
                    sort === s.value
                      ? 'bg-surface-container-lowest shadow-card text-on-surface'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Grid de videos ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant text-body-md">
          No hay {filter === 'entrevista' ? 'entrevistas' : 'videos'} todavía.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => setSelectedVideo(video)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  )
}
