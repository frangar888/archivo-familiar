'use client'

import Image from 'next/image'
import { Play, Clock, Calendar, Eye, Mic, Video as VideoIcon } from 'lucide-react'
import { cn, getYouTubeVideoId, getYouTubeThumbnail, formatDuration, formatDate } from '@/lib/utils'
import type { Video } from '@/types'

interface VideoCardProps {
  video: Video
  onClick: () => void
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  // Obtener thumbnail
  let thumbnailUrl = video.thumbnail_url

  if (!thumbnailUrl && video.tipo_fuente === 'youtube') {
    const videoId = video.video_id || getYouTubeVideoId(video.video_url)
    if (videoId) {
      thumbnailUrl = getYouTubeThumbnail(videoId)
    }
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'group card overflow-hidden text-left w-full',
        'transition-all duration-300 hover:scale-[1.02]'
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-surface-container">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={video.titulo}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <Play className="w-12 h-12 text-primary" />
          </div>
        )}

        {/* Overlay oscuro */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />

        {/* Botón play */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              'w-16 h-16 rounded-full bg-white/90 flex items-center justify-center',
              'transform transition-transform duration-300',
              'group-hover:scale-110 group-hover:bg-white'
            )}
          >
            <Play className="w-7 h-7 text-primary ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Duración (inferior derecha) */}
        {video.duracion_segundos && (
          <span className="absolute bottom-3 right-3 px-2 py-1 rounded bg-black/70 text-white text-body-sm font-medium">
            {formatDuration(video.duracion_segundos)}
          </span>
        )}

        {/* Vistas (inferior izquierda) */}
        <span className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded bg-black/70 text-white text-body-sm font-medium">
          <Eye className="w-3.5 h-3.5" />
          {video.vistas ?? 0}
        </span>

        {/* Badge categoría */}
        <span
          className={cn(
            'absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase backdrop-blur-sm',
            video.categoria === 'entrevista'
              ? 'bg-secondary/90 text-white'
              : 'bg-primary/90 text-white'
          )}
        >
          {video.categoria === 'entrevista'
            ? <><Mic className="w-3 h-3" /> Entrevista</>
            : <><VideoIcon className="w-3 h-3" /> Video</>
          }
        </span>
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="font-serif text-title-lg text-on-surface mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {video.titulo}
        </h3>

        {video.descripcion && (
          <p className="text-body-md text-on-surface-variant mb-4 line-clamp-2">
            {video.descripcion}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-body-sm text-outline">
          {video.duracion_segundos && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(video.duracion_segundos)}
            </span>
          )}
          {video.fecha_grabacion && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(video.fecha_grabacion)}
            </span>
          )}
          {(video.vistas ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {video.vistas} {video.vistas === 1 ? 'vista' : 'vistas'}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
