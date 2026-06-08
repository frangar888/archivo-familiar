'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Pencil, Trash2, Save, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { cn, formatDate } from '@/lib/utils'
import { FormField, Select, TextArea } from '@/components/ui/FormField'
import type { Evento, EventoInsert, CategoriaEvento } from '@/types'

const categoriaOptions: { value: CategoriaEvento; label: string }[] = [
  { value: 'espana', label: 'España' },
  { value: 'travesia', label: 'Travesía' },
  { value: 'argentina', label: 'Argentina' },
  { value: 'familia', label: 'Familia' },
]

const emptyEvento: EventoInsert = {
  titulo: '',
  descripcion: null,
  fecha: '',
  fecha_fin: null,
  lugar: null,
  categoria: 'familia',
  imagen_url: null,
  persona_id: null,
  orden: 0,
  destacado: false,
  created_by: null,
}

export default function AdminEventosPage() {
  const router = useRouter()
  const { user, isAdmin, loading: authLoading } = useAuth()

  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<EventoInsert>(emptyEvento)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/login')
    }
  }, [user, isAdmin, authLoading, router])

  useEffect(() => {
    fetchEventos()
  }, [])

  const fetchEventos = async () => {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .order('fecha', { ascending: false })

    if (!error && data) {
      setEventos(data)
    }
    setLoading(false)
  }

  const handleEdit = (evento: Evento) => {
    setEditingId(evento.id)
    setFormData({
      titulo: evento.titulo,
      descripcion: evento.descripcion,
      fecha: evento.fecha,
      fecha_fin: evento.fecha_fin,
      lugar: evento.lugar,
      categoria: evento.categoria,
      imagen_url: evento.imagen_url,
      persona_id: evento.persona_id,
      orden: evento.orden,
      destacado: evento.destacado,
      created_by: evento.created_by,
    })
    setError(null)
  }

  const handleNew = () => {
    setEditingId('new')
    setFormData({ ...emptyEvento, created_by: user?.id || null })
    setError(null)
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData(emptyEvento)
    setError(null)
  }

  const handleSave = async () => {
    if (!formData.titulo.trim() || !formData.fecha) {
      setError('Título y fecha son requeridos')
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (editingId === 'new') {
        const { error } = await supabase.from('eventos').insert(formData)
        if (error) throw new Error(error.message)
      } else {
        const { data: updated, error } = await supabase
          .from('eventos')
          .update(formData)
          .eq('id', editingId)
          .select()
        if (error) throw new Error(error.message)
        if (!updated || updated.length === 0) {
          throw new Error('No se pudo actualizar. Tu sesión puede haber expirado — recargá la página e iniciá sesión nuevamente.')
        }
      }

      await fetchEventos()
      handleCancel()
    } catch (err: any) {
      setError(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este evento?')) return

    const { error } = await supabase.from('eventos').delete().eq('id', id)
    if (error) {
      alert('Error al eliminar: ' + error.message)
    } else {
      setEventos(eventos.filter((e) => e.id !== id))
    }
  }

  const updateField = (field: keyof EventoInsert, value: any) => {
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
              Eventos
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
              {editingId === 'new' ? 'Nuevo evento' : 'Editar evento'}
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

              <FormField label="Categoría" htmlFor="categoria" required>
                <Select
                  id="categoria"
                  value={formData.categoria}
                  onChange={(e) => updateField('categoria', e.target.value)}
                  options={categoriaOptions}
                />
              </FormField>

              <FormField label="Fecha" htmlFor="fecha" required>
                <input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => updateField('fecha', e.target.value)}
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

              <FormField
                label="URL de imagen"
                htmlFor="imagen_url"
                hint="Link de Google Drive"
              >
                <input
                  id="imagen_url"
                  type="url"
                  value={formData.imagen_url || ''}
                  onChange={(e) => updateField('imagen_url', e.target.value)}
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
                  placeholder="Descripción del evento..."
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

        <div className="space-y-3">
          {eventos.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              No hay eventos registrados
            </div>
          ) : (
            eventos.map((evento) => (
              <div
                key={evento.id}
                className="card p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={cn(
                      'px-2 py-1 rounded-full text-[11px] font-medium text-white uppercase',
                      evento.categoria === 'espana' && 'bg-secondary',
                      evento.categoria === 'travesia' && 'bg-tertiary',
                      evento.categoria === 'argentina' && 'bg-primary',
                      evento.categoria === 'familia' && 'bg-primary-container'
                    )}
                  >
                    {evento.categoria}
                  </span>
                  <div>
                    <p className="font-serif text-title-md text-on-surface">
                      {evento.titulo}
                    </p>
                    <p className="text-body-sm text-outline">
                      {formatDate(evento.fecha)}
                      {evento.lugar && ` · ${evento.lugar}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(evento)}
                    className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-on-surface-variant" />
                  </button>
                  <button
                    onClick={() => handleDelete(evento.id)}
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
