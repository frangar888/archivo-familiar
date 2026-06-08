'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Pencil, Trash2, Save, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { cn, getNombreCompleto } from '@/lib/utils'
import { FormField, Select, TextArea } from '@/components/ui/FormField'
import type { Persona, PersonaInsert } from '@/types'

const generoOptions = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'otro', label: 'Otro' },
]

const emptyPersona: PersonaInsert = {
  nombre: '',
  apellido: '',
  apellido_casada: null,
  fecha_nacimiento: null,
  lugar_nacimiento: null,
  fecha_fallecimiento: null,
  lugar_fallecimiento: null,
  genero: null,
  fecha_emigracion: null,
  puerto_salida: null,
  puerto_llegada: null,
  nombre_barco: null,
  padre_id: null,
  madre_id: null,
  biografia: null,
  foto_perfil_url: null,
  created_by: null,
}

export default function AdminPersonasPage() {
  const router = useRouter()
  const { user, isAdmin, loading: authLoading } = useAuth()

  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<PersonaInsert>(emptyPersona)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/login')
    }
  }, [user, isAdmin, authLoading, router])

  useEffect(() => {
    fetchPersonas()
  }, [])

  const fetchPersonas = async () => {
    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .order('apellido')
      .order('nombre')

    if (!error && data) {
      setPersonas(data)
    }
    setLoading(false)
  }

  const handleEdit = (persona: Persona) => {
    setEditingId(persona.id)
    setFormData({
      nombre: persona.nombre,
      apellido: persona.apellido,
      apellido_casada: persona.apellido_casada,
      fecha_nacimiento: persona.fecha_nacimiento,
      lugar_nacimiento: persona.lugar_nacimiento,
      fecha_fallecimiento: persona.fecha_fallecimiento,
      lugar_fallecimiento: persona.lugar_fallecimiento,
      genero: persona.genero,
      fecha_emigracion: persona.fecha_emigracion,
      puerto_salida: persona.puerto_salida,
      puerto_llegada: persona.puerto_llegada,
      nombre_barco: persona.nombre_barco,
      padre_id: persona.padre_id,
      madre_id: persona.madre_id,
      biografia: persona.biografia,
      foto_perfil_url: persona.foto_perfil_url,
      created_by: persona.created_by,
    })
    setError(null)
  }

  const handleNew = () => {
    setEditingId('new')
    setFormData({ ...emptyPersona, created_by: user?.id || null })
    setError(null)
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData(emptyPersona)
    setError(null)
  }

  const handleSave = async () => {
    if (!formData.nombre.trim() || !formData.apellido.trim()) {
      setError('Nombre y apellido son requeridos')
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (editingId === 'new') {
        const { error } = await supabase.from('personas').insert(formData)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('personas')
          .update(formData)
          .eq('id', editingId)
        if (error) throw error
      }

      await fetchPersonas()
      handleCancel()
    } catch (err: any) {
      setError(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta persona?')) return

    const { error } = await supabase.from('personas').delete().eq('id', id)
    if (!error) {
      setPersonas(personas.filter((p) => p.id !== id))
    }
  }

  const updateField = (field: keyof PersonaInsert, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value || null }))
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-pulse text-on-surface-variant">Cargando...</div>
      </div>
    )
  }

  const padreOptions = personas
    .filter((p) => p.genero === 'masculino' && p.id !== editingId)
    .map((p) => ({ value: p.id, label: getNombreCompleto(p.nombre, p.apellido) }))

  const madreOptions = personas
    .filter((p) => p.genero === 'femenino' && p.id !== editingId)
    .map((p) => ({ value: p.id, label: getNombreCompleto(p.nombre, p.apellido, p.apellido_casada) }))

  return (
    <div className="py-12 lg:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-on-surface-variant" />
            </Link>
            <h1 className="font-serif text-headline-md text-on-surface">
              Personas
            </h1>
          </div>
          {!editingId && (
            <button onClick={handleNew} className="btn-primary">
              <Plus className="w-5 h-5" />
              Agregar
            </button>
          )}
        </div>

        {/* Formulario */}
        {editingId && (
          <div className="card p-6 mb-8">
            <h2 className="font-serif text-title-lg text-on-surface mb-6">
              {editingId === 'new' ? 'Nueva persona' : 'Editar persona'}
            </h2>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-error-container text-error text-body-md">
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <FormField label="Nombre" htmlFor="nombre" required>
                <input
                  id="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => updateField('nombre', e.target.value)}
                  className="input"
                />
              </FormField>

              <FormField label="Apellido" htmlFor="apellido" required>
                <input
                  id="apellido"
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => updateField('apellido', e.target.value)}
                  className="input"
                />
              </FormField>

              <FormField label="Apellido de casada" htmlFor="apellido_casada">
                <input
                  id="apellido_casada"
                  type="text"
                  value={formData.apellido_casada || ''}
                  onChange={(e) => updateField('apellido_casada', e.target.value)}
                  className="input"
                />
              </FormField>

              <FormField label="Género" htmlFor="genero">
                <Select
                  id="genero"
                  value={formData.genero || ''}
                  onChange={(e) => updateField('genero', e.target.value)}
                  options={generoOptions}
                />
              </FormField>

              <FormField label="Fecha de nacimiento" htmlFor="fecha_nacimiento">
                <input
                  id="fecha_nacimiento"
                  type="date"
                  value={formData.fecha_nacimiento || ''}
                  onChange={(e) => updateField('fecha_nacimiento', e.target.value)}
                  className="input"
                />
              </FormField>

              <FormField label="Lugar de nacimiento" htmlFor="lugar_nacimiento">
                <input
                  id="lugar_nacimiento"
                  type="text"
                  value={formData.lugar_nacimiento || ''}
                  onChange={(e) => updateField('lugar_nacimiento', e.target.value)}
                  className="input"
                />
              </FormField>

              <FormField label="Fecha de fallecimiento" htmlFor="fecha_fallecimiento">
                <input
                  id="fecha_fallecimiento"
                  type="date"
                  value={formData.fecha_fallecimiento || ''}
                  onChange={(e) => updateField('fecha_fallecimiento', e.target.value)}
                  className="input"
                />
              </FormField>

              <FormField label="Lugar de fallecimiento" htmlFor="lugar_fallecimiento">
                <input
                  id="lugar_fallecimiento"
                  type="text"
                  value={formData.lugar_fallecimiento || ''}
                  onChange={(e) => updateField('lugar_fallecimiento', e.target.value)}
                  className="input"
                />
              </FormField>

              <FormField label="Padre" htmlFor="padre_id">
                <Select
                  id="padre_id"
                  value={formData.padre_id || ''}
                  onChange={(e) => updateField('padre_id', e.target.value)}
                  options={padreOptions}
                />
              </FormField>

              <FormField label="Madre" htmlFor="madre_id">
                <Select
                  id="madre_id"
                  value={formData.madre_id || ''}
                  onChange={(e) => updateField('madre_id', e.target.value)}
                  options={madreOptions}
                />
              </FormField>

              <FormField
                label="URL de foto de perfil"
                htmlFor="foto_perfil_url"
                hint="Link de Google Drive (compartido públicamente)"
              >
                <input
                  id="foto_perfil_url"
                  type="url"
                  value={formData.foto_perfil_url || ''}
                  onChange={(e) => updateField('foto_perfil_url', e.target.value)}
                  className="input"
                />
              </FormField>
            </div>

            {/* Datos de migración */}
            <h3 className="font-serif text-title-md text-on-surface mt-8 mb-4">
              Datos de migración
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <FormField label="Fecha de emigración" htmlFor="fecha_emigracion">
                <input
                  id="fecha_emigracion"
                  type="date"
                  value={formData.fecha_emigracion || ''}
                  onChange={(e) => updateField('fecha_emigracion', e.target.value)}
                  className="input"
                />
              </FormField>

              <FormField label="Nombre del barco" htmlFor="nombre_barco">
                <input
                  id="nombre_barco"
                  type="text"
                  value={formData.nombre_barco || ''}
                  onChange={(e) => updateField('nombre_barco', e.target.value)}
                  className="input"
                />
              </FormField>

              <FormField label="Puerto de salida" htmlFor="puerto_salida">
                <input
                  id="puerto_salida"
                  type="text"
                  value={formData.puerto_salida || ''}
                  onChange={(e) => updateField('puerto_salida', e.target.value)}
                  className="input"
                />
              </FormField>

              <FormField label="Puerto de llegada" htmlFor="puerto_llegada">
                <input
                  id="puerto_llegada"
                  type="text"
                  value={formData.puerto_llegada || ''}
                  onChange={(e) => updateField('puerto_llegada', e.target.value)}
                  className="input"
                />
              </FormField>
            </div>

            {/* Biografía */}
            <div className="mt-6">
              <FormField label="Biografía" htmlFor="biografia">
                <TextArea
                  id="biografia"
                  value={formData.biografia || ''}
                  onChange={(e) => updateField('biografia', e.target.value)}
                  placeholder="Historia de vida, anécdotas, recuerdos..."
                />
              </FormField>
            </div>

            {/* Botones */}
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

        {/* Lista */}
        <div className="space-y-3">
          {personas.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              No hay personas registradas
            </div>
          ) : (
            personas.map((persona) => (
              <div
                key={persona.id}
                className="card p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-serif text-title-md text-on-surface">
                    {getNombreCompleto(persona.nombre, persona.apellido, persona.apellido_casada)}
                  </p>
                  <p className="text-body-sm text-outline">
                    {persona.lugar_nacimiento || 'Sin lugar'}
                    {persona.fecha_nacimiento && ` · ${persona.fecha_nacimiento.split('-')[0]}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(persona)}
                    className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-on-surface-variant" />
                  </button>
                  <button
                    onClick={() => handleDelete(persona.id)}
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
