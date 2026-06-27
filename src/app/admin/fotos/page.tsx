'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, Plus, Pencil, Trash2, Save, X, RotateCcw, RotateCw, RefreshCw, Check,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn, getInternalFileUrl } from '@/lib/utils'
import { FormField, Select, TextArea } from '@/components/ui/FormField'
import type { Foto, FotoInsert, CategoriaFoto } from '@/types'

const categoriaOptions: { value: CategoriaFoto; label: string }[] = [
  { value: 'retratos', label: 'Retratos' },
  { value: 'documentos', label: 'Documentos' },
  { value: 'lugares', label: 'Lugares' },
  { value: 'eventos', label: 'Eventos' },
  { value: 'vida_cotidiana', label: 'Vida Cotidiana' },
]

const emptyFoto: FotoInsert = {
  titulo: '',
  descripcion: null,
  fecha_aproximada: null,
  lugar: null,
  imagen_url: '',
  thumbnail_url: null,
  categoria: null,
  personas_ids: [],
  orden: 0,
  destacada: false,
  rotacion: 0,
  created_by: null,
}

export default function AdminFotosPage() {
  const router = useRouter()
  const { user, isAdmin, loading: authLoading, accessToken } = useAuth()

  const [fotos, setFotos] = useState<Foto[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FotoInsert>(emptyFoto)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Drive sync state
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ added: number; removed: number; total: number } | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/login')
    }
  }, [user, isAdmin, authLoading, router])

  const fetchFotos = useCallback(async () => {
    if (!accessToken) return
    try {
      const res = await fetch('/api/fotos', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = res.ok ? await res.json() : []
      setFotos(data)
    } catch {
      // error de red
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (accessToken) fetchFotos()
  }, [accessToken, fetchFotos])

  const handleEdit = (foto: Foto) => {
    setEditingId(foto.id)
    setFormData({
      titulo: foto.titulo,
      descripcion: foto.descripcion,
      fecha_aproximada: foto.fecha_aproximada,
      lugar: foto.lugar,
      imagen_url: foto.imagen_url,
      thumbnail_url: foto.thumbnail_url,
      categoria: foto.categoria,
      personas_ids: foto.personas_ids,
      orden: foto.orden,
      destacada: foto.destacada,
      rotacion: foto.rotacion ?? 0,
      created_by: foto.created_by,
    })
    setError(null)
  }

  const handleNew = () => {
    setEditingId('new')
    setFormData({ ...emptyFoto, created_by: user?.id || null })
    setError(null)
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData(emptyFoto)
    setError(null)
  }

  const handleSave = async () => {
    if (!formData.titulo.trim() || !formData.imagen_url.trim()) {
      setError('Título y URL de imagen son requeridos')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const isNew = editingId === 'new'
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      const res = await fetch('/api/fotos', {
        method: isNew ? 'POST' : 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken ?? ''}`,
        },
        body: JSON.stringify(isNew ? formData : { id: editingId, ...formData }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout))

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || `Error ${res.status}`)
      }
      await fetchFotos()
      handleCancel()
    } catch (err: any) {
      setError(err.name === 'AbortError' ? 'Timeout: el servidor no respondió' : (err.message || 'Error al guardar'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta foto?')) return
    const res = await fetch('/api/fotos', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken ?? ''}`,
      },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setFotos(fotos.filter((f) => f.id !== id))
  }

  const updateField = (field: keyof FotoInsert, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value === '' ? null : value }))
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncError(null)
    setSyncResult(null)
    try {
      const res = await fetch('/api/admin/drive-sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken ?? ''}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`)
      setSyncResult(json)
      await fetchFotos()
    } catch (err: any) {
      setSyncError(err.message || 'Error al sincronizar')
    } finally {
      setSyncing(false)
    }
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

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-full hover:bg-surface-container-high transition-colors">
              <ArrowLeft className="w-5 h-5 text-on-surface-variant" />
            </Link>
            <h1 className="font-serif text-headline-md text-on-surface">Fotos</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className={cn('btn-outline', syncing && 'opacity-70')}
              title="Sincroniza con la carpeta de Drive configurada"
            >
              <RefreshCw className={cn('w-5 h-5', syncing && 'animate-spin')} />
              {syncing ? 'Sincronizando...' : 'Sincronizar Drive'}
            </button>
            <button onClick={handleNew} className="btn-primary">
              <Plus className="w-5 h-5" />
              Agregar
            </button>
          </div>
        </div>

        {/* Resultado de sincronización */}
        {syncResult && (
          <div className="card p-4 mb-6 flex items-center gap-3">
            <Check className="w-5 h-5 text-primary shrink-0" />
            <p className="text-body-md text-on-surface">
              {syncResult.added === 0 && syncResult.removed === 0
                ? `Galería al día — ${syncResult.total} foto${syncResult.total !== 1 ? 's' : ''} en la carpeta`
                : [
                    syncResult.added > 0 && `${syncResult.added} agregada${syncResult.added !== 1 ? 's' : ''}`,
                    syncResult.removed > 0 && `${syncResult.removed} eliminada${syncResult.removed !== 1 ? 's' : ''}`,
                  ].filter(Boolean).join(' · ')
              }
            </p>
          </div>
        )}
        {syncError && (
          <div className="card p-4 mb-6 bg-error-container text-error text-body-md">
            {syncError}
          </div>
        )}

        {/* Grilla de fotos */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {fotos.length === 0 ? (
            <div className="col-span-full text-center py-12 text-on-surface-variant">
              No hay fotos registradas
            </div>
          ) : (
            fotos.map((foto) => (
              <div key={foto.id} className="card overflow-hidden group relative">
                <div className="aspect-square relative bg-surface-container">
                  <Image
                    src={getInternalFileUrl(foto.imagen_url)}
                    alt={foto.titulo}
                    fill
                    className="object-cover"
                    style={foto.rotacion ? { transform: `rotate(${foto.rotacion}deg) scale(1.05)` } : undefined}
                    sizes="200px"
                  />
                </div>
                <div className="p-3">
                  <p className="text-body-sm font-medium text-on-surface line-clamp-1">{foto.titulo}</p>
                  <p className="text-body-sm text-outline">{foto.fecha_aproximada || 'Sin fecha'}</p>
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(foto)}
                    className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-on-surface-variant" />
                  </button>
                  <button
                    onClick={() => handleDelete(foto.id)}
                    className="p-2 rounded-full bg-white/90 hover:bg-error-container transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-error" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de edición — se abre centrado sobre la página */}
      {editingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) handleCancel() }}
        >
          <div className="card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-title-lg text-on-surface">
                {editingId === 'new' ? 'Nueva foto' : 'Editar foto'}
              </h2>
              <button onClick={handleCancel} className="p-2 rounded-full hover:bg-surface-container-high transition-colors">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

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

              <FormField label="Categoría" htmlFor="categoria">
                <Select
                  id="categoria"
                  value={formData.categoria || ''}
                  onChange={(e) => updateField('categoria', e.target.value)}
                  options={categoriaOptions}
                />
              </FormField>

              <FormField
                label="URL de imagen"
                htmlFor="imagen_url"
                required
                hint="Link de Google Drive"
              >
                <input
                  id="imagen_url"
                  type="url"
                  value={formData.imagen_url}
                  onChange={(e) => updateField('imagen_url', e.target.value)}
                  className="input"
                />
              </FormField>

              <FormField
                label="Fecha aproximada"
                htmlFor="fecha_aproximada"
                hint="Ej: 1920, circa 1935, años 40"
              >
                <input
                  id="fecha_aproximada"
                  type="text"
                  value={formData.fecha_aproximada || ''}
                  onChange={(e) => updateField('fecha_aproximada', e.target.value)}
                  className="input"
                />
              </FormField>

              <FormField label="Lugar" htmlFor="lugar">
                <input
                  id="lugar"
                  type="text"
                  value={formData.lugar || ''}
                  onChange={(e) => updateField('lugar', e.target.value)}
                  className="input"
                />
              </FormField>

              <FormField label="Destacada" htmlFor="destacada">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    id="destacada"
                    type="checkbox"
                    checked={formData.destacada}
                    onChange={(e) => updateField('destacada', e.target.checked)}
                    className="w-5 h-5 rounded border-outline accent-primary"
                  />
                  <span className="text-body-md text-on-surface-variant">
                    Mostrar como destacada
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
                  placeholder="Descripción de la foto..."
                />
              </FormField>
            </div>

            {formData.imagen_url && (
              <div className="mt-6">
                <p className="text-label-md text-on-surface-variant mb-2">Vista previa</p>
                <div className="flex items-center gap-4">
                  <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-surface-container flex-shrink-0">
                    <Image
                      src={getInternalFileUrl(formData.imagen_url)}
                      alt="Preview"
                      fill
                      className="object-cover"
                      style={{ transform: `rotate(${formData.rotacion ?? 0}deg)` }}
                      sizes="128px"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-body-sm text-on-surface-variant">Rotar imagen</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const current = formData.rotacion ?? 0
                          const next = ((current - 90 + 360) % 360) as 0 | 90 | 180 | 270
                          updateField('rotacion', next)
                        }}
                        className="btn-outline py-2 px-3"
                        title="Rotar 90° izquierda"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const current = formData.rotacion ?? 0
                          const next = ((current + 90) % 360) as 0 | 90 | 180 | 270
                          updateField('rotacion', next)
                        }}
                        className="btn-outline py-2 px-3"
                        title="Rotar 90° derecha"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
        </div>
      )}
    </div>
  )
}
