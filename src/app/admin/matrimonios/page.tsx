'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Save, X, Heart } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { cn, getNombreCompleto } from '@/lib/utils'
import { FormField, Select } from '@/components/ui/FormField'
import type { Persona, Matrimonio, MatrimonioInsert } from '@/types'

const motivoFinOptions = [
  { value: 'fallecimiento', label: 'Fallecimiento' },
  { value: 'divorcio', label: 'Divorcio' },
]

const emptyMatrimonio: MatrimonioInsert = {
  persona1_id: '',
  persona2_id: '',
  fecha_matrimonio: null,
  lugar_matrimonio: null,
  fecha_fin: null,
  motivo_fin: null,
}

interface MatrimonioConNombres extends Matrimonio {
  persona1?: Persona
  persona2?: Persona
}

export default function AdminMatrimoniosPage() {
  const router = useRouter()
  const { user, isAdmin, loading: authLoading } = useAuth()

  const [personas, setPersonas] = useState<Persona[]>([])
  const [matrimonios, setMatrimonios] = useState<MatrimonioConNombres[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<MatrimonioInsert>(emptyMatrimonio)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) router.push('/login')
  }, [user, isAdmin, authLoading, router])

  useEffect(() => {
    if (isAdmin) fetchAll()
  }, [isAdmin])

  const fetchAll = async () => {
    setLoading(true)
    const [personasRes, matsRes] = await Promise.all([
      supabase.from('personas').select('*').order('apellido').order('nombre'),
      supabase.from('matrimonios').select('*').order('fecha_matrimonio', { ascending: true }),
    ])

    const ps = personasRes.data ?? []
    const ms = matsRes.data ?? []
    const pMap = new Map(ps.map((p: Persona) => [p.id, p]))

    setPersonas(ps)
    setMatrimonios(
      ms.map((m: Matrimonio) => ({
        ...m,
        persona1: pMap.get(m.persona1_id),
        persona2: pMap.get(m.persona2_id),
      }))
    )
    setLoading(false)
  }

  const handleNew = () => {
    setEditingId('new')
    setFormData(emptyMatrimonio)
    setShowForm(true)
    setError(null)
  }

  const handleEdit = (m: MatrimonioConNombres) => {
    setEditingId(m.id)
    setFormData({
      persona1_id: m.persona1_id,
      persona2_id: m.persona2_id,
      fecha_matrimonio: m.fecha_matrimonio ?? null,
      lugar_matrimonio: m.lugar_matrimonio ?? null,
      fecha_fin: m.fecha_fin ?? null,
      motivo_fin: m.motivo_fin ?? null,
    })
    setShowForm(true)
    setError(null)
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData(emptyMatrimonio)
    setShowForm(false)
    setError(null)
  }

  const handleSave = async () => {
    if (!formData.persona1_id || !formData.persona2_id) {
      setError('Las dos personas son requeridas')
      return
    }
    if (formData.persona1_id === formData.persona2_id) {
      setError('Las dos personas deben ser diferentes')
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (editingId === 'new') {
        const { error } = await supabase.from('matrimonios').insert(formData)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('matrimonios')
          .update(formData)
          .eq('id', editingId)
        if (error) throw error
      }
      await fetchAll()
      handleCancel()
    } catch (err: any) {
      setError(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este matrimonio?')) return
    const { error } = await supabase.from('matrimonios').delete().eq('id', id)
    if (!error) setMatrimonios((prev) => prev.filter((m) => m.id !== id))
  }

  const updateField = (field: keyof MatrimonioInsert, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value || null }))
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-pulse text-on-surface-variant">Cargando...</div>
      </div>
    )
  }

  const personaOptions = personas.map((p) => ({
    value: p.id,
    label: getNombreCompleto(p.nombre, p.apellido, p.apellido_casada),
  }))

  return (
    <div className="py-12 lg:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-full hover:bg-surface-container-high transition-colors">
              <ArrowLeft className="w-5 h-5 text-on-surface-variant" />
            </Link>
            <h1 className="font-serif text-headline-md text-on-surface">Matrimonios</h1>
          </div>
          {!showForm && (
            <button onClick={handleNew} className="btn-primary">
              <Plus className="w-5 h-5" />
              Agregar
            </button>
          )}
        </div>

        <div className="mb-6 p-4 rounded-xl bg-surface-container text-body-md text-on-surface-variant">
          <strong className="text-on-surface">Nota:</strong> El árbol genealógico infiere las parejas automáticamente a partir de los padres de cada persona.
          Esta sección registra datos adicionales (fecha, lugar) y permite registrar parejas sin hijos en el sistema.
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="card p-6 mb-8">
            <h2 className="font-serif text-title-lg text-on-surface mb-6">
              {editingId === 'new' ? 'Nuevo matrimonio' : 'Editar matrimonio'}
            </h2>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-error-container text-error text-body-md">{error}</div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <FormField label="Persona 1" htmlFor="persona1_id" required>
                <Select
                  id="persona1_id"
                  value={formData.persona1_id}
                  onChange={(e) => updateField('persona1_id', e.target.value)}
                  options={personaOptions}
                />
              </FormField>

              <FormField label="Persona 2" htmlFor="persona2_id" required>
                <Select
                  id="persona2_id"
                  value={formData.persona2_id}
                  onChange={(e) => updateField('persona2_id', e.target.value)}
                  options={personaOptions}
                />
              </FormField>

              <FormField label="Fecha del matrimonio" htmlFor="fecha_matrimonio">
                <input
                  id="fecha_matrimonio"
                  type="date"
                  value={formData.fecha_matrimonio || ''}
                  onChange={(e) => updateField('fecha_matrimonio', e.target.value)}
                  className="input"
                />
              </FormField>

              <FormField label="Lugar" htmlFor="lugar_matrimonio">
                <input
                  id="lugar_matrimonio"
                  type="text"
                  value={formData.lugar_matrimonio || ''}
                  onChange={(e) => updateField('lugar_matrimonio', e.target.value)}
                  className="input"
                  placeholder="Ciudad, País"
                />
              </FormField>

              <FormField label="Fecha de fin" htmlFor="fecha_fin">
                <input
                  id="fecha_fin"
                  type="date"
                  value={formData.fecha_fin || ''}
                  onChange={(e) => updateField('fecha_fin', e.target.value)}
                  className="input"
                />
              </FormField>

              <FormField label="Motivo de fin" htmlFor="motivo_fin">
                <Select
                  id="motivo_fin"
                  value={formData.motivo_fin || ''}
                  onChange={(e) => updateField('motivo_fin', e.target.value)}
                  options={motivoFinOptions}
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-3 mt-6">
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
          {matrimonios.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              No hay matrimonios registrados
            </div>
          ) : (
            matrimonios.map((m) => (
              <div key={m.id} className="card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-serif text-title-md text-on-surface truncate">
                      {m.persona1
                        ? getNombreCompleto(m.persona1.nombre, m.persona1.apellido)
                        : m.persona1_id}{' '}
                      <span className="text-on-surface-variant font-sans text-body-md">y</span>{' '}
                      {m.persona2
                        ? getNombreCompleto(m.persona2.nombre, m.persona2.apellido)
                        : m.persona2_id}
                    </p>
                    <div className="flex items-center gap-3 text-body-sm text-outline mt-0.5">
                      {m.fecha_matrimonio && (
                        <span>{new Date(m.fecha_matrimonio).getFullYear()}</span>
                      )}
                      {m.lugar_matrimonio && <span>· {m.lugar_matrimonio}</span>}
                      {m.fecha_fin && (
                        <span className="text-amber-600">
                          · Fin: {m.motivo_fin === 'fallecimiento' ? 'Fallecimiento' : 'Divorcio'} ({new Date(m.fecha_fin).getFullYear()})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(m)}
                    className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
                    title="Editar"
                  >
                    <Save className="w-4 h-4 text-on-surface-variant" />
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-2 rounded-full hover:bg-error-container transition-colors"
                    title="Eliminar"
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
