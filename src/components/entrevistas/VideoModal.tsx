'use client'

import { useEffect } from 'react'
import { X, ExternalLink, Clock, Calendar, Eye } from 'lucide-react'
import { cn, getYouTubeVideoId, getDriveVideoEmbedUrl, formatDuration, formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Video } from '@/types'

interface VideoModalProps {
  video: Video
  onClose: () => void
}

export function VideoModal({ video, onClose }: VideoModalProps) {
  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Incrementar vistas al abrir
  useEffect(() => {
    supabase
      .from('videos')
      .update({ vistas: (video.vistas ?? 0) + 1 })
      .eq('id', video.id)
      .then(() => {}) // fire and forget
  }, [video.id, video.vistas])

  // Obtener embed URL
  let embedUrl = ''
  if (video.tipo_fuente === 'youtube') {
    const videoId = video.video_id || getYouTubeVideoId(video.video_url)
    if (videoId) {
      embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&iv_load_policy=3&color=white`
    }
  } else if (video.tipo_fuente === 'drive') {
    embedUrl = getDriveVideoEmbedUrl(video.video_url) || ''
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/90" />

      {/* Botón cerrar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Contenido */}
      <div
        className="relative w-full max-w-5xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video embed o link */}
        {embedUrl ? (
          <div className="relative aspect-video rounded-card overflow-hidden bg-black">
            <iframe
              src={embedUrl}
              title={video.titulo}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-card p-8 text-center">
            <p className="text-body-lg text-on-surface-variant mb-6">
              No se pudo generar la vista previa del video.
            </p>
            <a
              href={video.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex"
            >
              <ExternalLink className="w-5 h-5" />
              Abrir enlace original
            </a>
          </div>
        )}

        {/* Info del video */}
        <div className="mt-6 p-6 rounded-card bg-surface-container-lowest">
          <h2 className="font-serif text-headline-sm text-on-surface mb-3">
            {video.titulo}
          </h2>

          {video.descripcion && (
            <p className="text-body-md text-on-surface-variant mb-4 leading-relaxed">
              {video.descripcion}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-6 text-body-md text-outline">
            {video.duracion_segundos && (
              <span className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Duración: {formatDuration(video.duracion_segundos)}
              </span>
            )}
            {video.fecha_grabacion && (
              <span className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Grabado: {formatDate(video.fecha_grabacion)}
              </span>
            )}
            <span className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              {(video.vistas ?? 0) + 1} {(video.vistas ?? 0) + 1 === 1 ? 'vista' : 'vistas'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
