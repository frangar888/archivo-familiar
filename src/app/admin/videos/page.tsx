'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Youtube, HardDrive } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { cn, formatDuration } from '@/lib/utils'
import { FormField, Select, TextArea } from '@/components/ui/FormField'
import type { Video, VideoInsert, TipoFuenteVideo, CategoriaVideo } from '@/types'

const tipoFuenteOptions: { value: TipoFuenteVideo; label: string }[] = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'drive', label: 'Google Drive' },
]

const categoriaOptions: { value: CategoriaVideo; label: string }[] = [
  { value: 'entrevista', label: 'Entrevista' },
  { value: 'video',      label: 'Video'       },
]

const emptyVideo: VideoInsert = {
  titulo: '',
  descripcion: null,
  tipo_fuente: 'youtube',
  categoria: 'video',
  video_url: '',
  video_id: null,
  duracion_segundos: null,
  thumbnail_url: null,
  fecha_grabacion: null,
  personas_ids: [],
  vistas: 0,
  orden: 0,
  destacado: false,
  created_by: null,
}

export default function AdminVideosPage() {
  const router = useRouter()
  const { user, isAdmin, loading: authLoading } = useAuth()

  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<VideoInsert>(emptyVideo)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/login')
    }
  }, [user, isAdmin, authLoading, router])

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('orden')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setVideos(data)
    }
    setLoading(false)
  }

  const handleEdit = (video: Video) => {
    setEditingId(video.id)
    setFormData({
      titulo: video.titulo,
      descripcion: video.descripcion,
      tipo_fuente: video.tipo_fuente,
      categoria: video.categoria ?? 'video',
      video_url: video.video_url,
      video_id: video.video_id,
      duracion_segundos: video.duracion_segundos,
      thumbnail_url: video.thumbnail_url,
      fecha_grabacion: video.fecha_grabacion,
      personas_ids: video.personas_ids,
      vistas: video.vistas ?? 0,
      orden: video.orden,
      destacado: video.destacado,
      created_by: video.created_by,
    })
    setError(null)
  }

  const handleNew = () => {
    setEditingId('new')
    setFormData({ ...emptyVideo, created_by: user?.id || null })
    setError(null)
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData(emptyVideo)
    setError(null)
  }

  const handleSave = async () => {
    if (!formData.titulo.trim() || !formData.video_url.trim()) {
      setError('Título y URL del video son requeridos')
      return
    }

    setSaving(true)
    setError(null)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    try {
      if (editingId === 'new') {
        const { error } = await supabase
          .from('videos')
          .insert(formData)
          .abortSignal(controller.signal)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('videos')
          .update(formData)
          .eq('id', editingId)
          .select()
          .abortSignal(controller.signal)
        if (error) throw error
        if (!data || data.length === 0) throw new Error('No se pudo actualizar. Sin permisos o registro no encontrado.')
      }

      await fetchVideos()
      handleCancel()
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        setError('La operación tardó demasiado. Verificá la conexión con Supabase.')
      } else {
        setError(err.message || 'Error al guardar')
      }
    } finally {
      clearTimeout(timeoutId)
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este video?')) return

    const { error } = await supabase.from('videos').delete().eq('id', id)
    if (error) {
      setDeleteError(error.message || 'Error al eliminar')
    } else {
      setDeleteError(null)
      setVideos(videos.filter((v) => v.id !== id))
      if (editingId === id) handleCancel()
    }
  }

  const updateField = (field: keyof VideoInsert, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value === '' ? null : value }))
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-pulse text-on-surface-variant">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="py-12 lg:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-on-surface-variant" />
            </Link>
            <h1 className="font-serif text-headline-md text-on-surface">
              Videos
            </h1>
          </div>
          {!editingId && (
            <button onClick={handleNew} className="btn-primary">
              <Plus className="w-5 h-5" />
              Agregar
            </button>
          )}
        </div>

        {editingId && (
          <div className="card p-6 mb-8">
            <h2 className="font-serif text-title-lg text-on-surface mb-6">
              {editingId === 'new' ? 'Nuevo video' : 'Editar video'}
            </h2>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-error-container text-error text-body-md">
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <FormField label="Título" htmlFor="titulo" required>
                <input
                  id="titulo"
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => updateField('titulo', e.target.value)}
                  className="input"
                />
              </FormField>

              <FormField label="Tipo de fuente" htmlFor="tipo_fuente" required>
                <Select
                  id="tipo_fuente"
                  value={formData.tipo_fuente}
                  onChange={(e) => updateField('tipo_fuente', e.target.value)}
                  options={tipoFuenteOptions}
                />
              </FormField>

              <FormField label="Categoría" htmlFor="categoria" required>
                <Select
                  id="categoria"
                  value={formData.categoria}
                  onChange={(e) => updateField('categoria', e.target.value)}
                  options={categoriaOptions}
                />
              </FormField>

              <FormField
                label="URL del video"
                htmlFor="video_url"
                required
                hint={
                  formData.tipo_fuente === 'youtube'
                    ? 'Ej: https://www.youtube.com/watch?v=...'
                    : 'Link de Google Drive'
                }
              >
                <input
                  id="video_url"
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => updateField('video_url', e.target.value)}
                  className="input"
                />
              </FormField>

              <FormField
                label="Duración (segundos)"
                htmlFor="duracion_segundos"
                hint="Ej: 120 para 2 minutos"
              >
                <input
                  id="duracion_segundos"
                  type="number"
                  min="0"
                  value={formData.duracion_segundos || ''}
                  onChange={(e) =>
                    updateField(
                      'duracion_segundos',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="input"
                />
              </FormField>

              <FormField label="Fecha de grabación" htmlFor="fecha_grabacion">
                <input
                  id="fecha_grabacion"
                  type="date"
                  value={formData.fecha_grabacion || ''}
                  onChange={(e) => updateField('fecha_grabacion', e.target.value)}
                  className="input"
                />
              </FormField>

              <FormField label="Destacado" htmlFor="destacado">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    id="destacado"
                    type="checkbox"
                    checked={formData.destacado}
                    onChange={(e) => updateField('destacado', e.target.checked)}
                    className="w-5 h-5 rounded border-outline accent-primary"
                  />
                  <span className="text-body-md text-on-surface-variant">
                    Mostrar como destacado
                  </span>
                </label>
              </FormField>
            </div>

            <div className="mt-6">
              <FormField label="Descripción" htmlFor="descripcion">
                <TextArea
                  id="descripcion"
                  value={formData.descripcion || ''}
                  onChange={(e) => updateField('descripcion', e.target.value)}
                  placeholder="Descripción del video, quién aparece, de qué se habla..."
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={handleCancel} className="btn-outline">
                <X className="w-5 h-5" />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={cn('btn-primary', saving && 'opacity-70')}
              >
                <Save className="w-5 h-5" />
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}

        {deleteError && (
          <div className="mb-4 p-4 rounded-xl bg-error-container text-error text-body-md">
            {deleteError}
          </div>
        )}

        <div className="space-y-3">
          {videos.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              No hay videos registrados
            </div>
          ) : (
            videos.map((video) => (
              <div
                key={video.id}
                className="card p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      video.tipo_fuente === 'youtube'
                        ? 'bg-red-100'
                        : 'bg-tertiary-fixed'
                    )}
                  >
                    {video.tipo_fuente === 'youtube' ? (
                      <Youtube className="w-5 h-5 text-red-600" />
                    ) : (
                      <HardDrive className="w-5 h-5 text-on-surface" />
                    )}
                  </div>
                  <div>
                    <p className="font-serif text-title-md text-on-surface">
                      {video.titulo}
                    </p>
                    <p className="text-body-sm text-outline">
                      <span className={cn(
                        'inline-block mr-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
                        video.categoria === 'entrevista'
                          ? 'bg-secondary/10 text-secondary'
                          : 'bg-primary/10 text-primary'
                      )}>
                        {video.categoria === 'entrevista' ? 'Entrevista' : 'Video'}
                      </span>
                      {video.duracion_segundos
                        ? formatDuration(video.duracion_segundos)
                        : 'Sin duración'}
                      {video.destacado && ' · Destacado'}
                      {(video.vistas ?? 0) > 0 && ` · ${video.vistas} vistas`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(video)}
                    className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-on-surface-variant" />
                  </button>
                  <button
                    onClick={() => handleDelete(video.id)}
                    className="p-2 rounded-full hover:bg-error-container transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-error" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
