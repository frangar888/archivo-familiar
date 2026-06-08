'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Pencil, Trash2, Save, X,
  FileText, ChevronUp, ChevronDown, Link as LinkIcon,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { FormField, TextArea } from '@/components/ui/FormField'
import type { Carta, CartaInsert } from '@/types'

const emptyCarta: CartaInsert = {
  titulo: '',
  descripcion: null,
  fecha: null,
  remitente: null,
  destinatario: null,
  personas_ids: [],
  paginas: [],
  orden: 0,
  destacada: false,
  created_by: null,
}

export default function AdminCartasPage() {
  const router = useRouter()
  const { user, isAdmin, loading: authLoading, accessToken } = useAuth()
  const newUrlRef = useRef<HTMLInputElement>(null)

  const [cartas, setCartas]       = useState<Carta[]>([])
  const [loading, setLoading]     = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData]   = useState<CartaInsert>(emptyCarta)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [newUrl, setNewUrl]       = useState('')

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) router.push('/login')
  }, [user, isAdmin, authLoading, router])

  useEffect(() => { fetchCartas() }, [])

  const fetchCartas = async () => {
    const session = accessToken ?? ''
    const res = await fetch('/api/cartas', {
      headers: { Authorization: `Bearer ${session}` },
    })
    const data = res.ok ? await res.json() : []
    setCartas(data)
    setLoading(false)
  }

  const handleNew = () => {
    setEditingId('new')
    setFormData({ ...emptyCarta, created_by: user?.id ?? null })
    setNewUrl('')
    setError(null)
  }

  const handleEdit = (carta: Carta) => {
    setEditingId(carta.id)
    setFormData({
      titulo:       carta.titulo,
      descripcion:  carta.descripcion,
      fecha:        carta.fecha,
      remitente:    carta.remitente,
      destinatario: carta.destinatario,
      personas_ids: carta.personas_ids,
      paginas:      carta.paginas,
      orden:        carta.orden,
      destacada:    carta.destacada,
      created_by:   carta.created_by,
    })
    setNewUrl('')
    setError(null)
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData(emptyCarta)
    setNewUrl('')
    setError(null)
  }

  // ── Gestión de páginas (links de Drive) ───────────────────────────────────
  const addPagina = () => {
    const url = newUrl.trim()
    if (!url) return
    setFormData((prev) => ({ ...prev, paginas: [...prev.paginas, url] }))
    setNewUrl('')
    newUrlRef.current?.focus()
  }

  const removePagina = (i: number) =>
    setFormData((prev) => ({ ...prev, paginas: prev.paginas.filter((_, idx) => idx !== i) }))

  const movePagina = (i: number, dir: 'up' | 'down') => {
    const arr = [...formData.paginas]
    const t = dir === 'up' ? i - 1 : i + 1
    if (t < 0 || t >= arr.length) return
    ;[arr[i], arr[t]] = [arr[t], arr[i]]
    setFormData((prev) => ({ ...prev, paginas: arr }))
  }

  // ── Guardar ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!formData.titulo.trim()) { setError('El título es requerido'); return }
    if (formData.paginas.length === 0) { setError('Agregá al menos una página'); return }

    setSaving(true)
    setError(null)
    try {
      const session = accessToken ?? ''
      const isNew = editingId === 'new'
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      const res = await fetch('/api/cartas', {
        method: isNew ? 'POST' : 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session}`,
        },
        body: JSON.stringify(isNew ? formData : { id: editingId, ...formData }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout))
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || `Error ${res.status}`)
      }
      await fetchCartas()
      handleCancel()
    } catch (err: any) {
      setError(err.name === 'AbortError' ? 'Timeout: el servidor no respondió' : (err.message || 'Error al guardar'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (carta: Carta) => {
    if (!confirm(`¿Eliminar la carta "${carta.titulo}"?`)) return
    const session = accessToken ?? ''
    await fetch('/api/cartas', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session}`,
      },
      body: JSON.stringify({ id: carta.id }),
    })
    setCartas((prev) => prev.filter((c) => c.id !== carta.id))
  }

  const updateField = (field: keyof CartaInsert, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value === '' ? null : value }))

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
            <h1 className="font-serif text-headline-md text-on-surface">Cartas escaneadas</h1>
          </div>
          {!editingId && (
            <button onClick={handleNew} className="btn-primary">
              <Plus className="w-5 h-5" /> Agregar carta
            </button>
          )}
        </div>

        {/* Formulario */}
        {editingId && (
          <div className="card p-6 mb-8">
            <h2 className="font-serif text-title-lg text-on-surface mb-6">
              {editingId === 'new' ? 'Nueva carta' : 'Editar carta'}
            </h2>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-error-container text-error text-body-md">{error}</div>
            )}

            {/* Metadata */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <FormField label="Título" htmlFor="titulo" required>
                <input id="titulo" type="text" value={formData.titulo}
                  onChange={(e) => updateField('titulo', e.target.value)} className="input" />
              </FormField>

              <FormField label="Fecha" htmlFor="fecha" hint='Ej: "Marzo 1945", "circa 1920"'>
                <input id="fecha" type="text" value={formData.fecha || ''}
                  onChange={(e) => updateField('fecha', e.target.value)}
                  className="input" placeholder="Ej: Marzo 1945" />
              </FormField>

              <FormField label="Remitente" htmlFor="remitente">
                <input id="remitente" type="text" value={formData.remitente || ''}
                  onChange={(e) => updateField('remitente', e.target.value)}
                  className="input" placeholder="Quién escribe" />
              </FormField>

              <FormField label="Destinatario" htmlFor="destinatario">
                <input id="destinatario" type="text" value={formData.destinatario || ''}
                  onChange={(e) => updateField('destinatario', e.target.value)}
                  className="input" placeholder="A quién va dirigida" />
              </FormField>
            </div>

            <div className="mb-6">
              <FormField label="Descripción / Contexto" htmlFor="descripcion">
                <TextArea id="descripcion" value={formData.descripcion || ''}
                  onChange={(e) => updateField('descripcion', e.target.value)}
                  placeholder="Resumen del contenido, contexto histórico..." />
              </FormField>
            </div>

            {/* Páginas — links de Google Drive */}
            <div className="mb-6">
              <p className="text-label-md text-on-surface-variant mb-1">
                Páginas <span className="text-error">*</span>
              </p>
              <p className="text-body-sm text-outline mb-3">
                Pegá el link de Google Drive de cada página (una por una, en orden).
                El archivo debe estar compartido como "Cualquier persona con el link puede ver".
              </p>

              {/* Input para agregar */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                  <input
                    ref={newUrlRef}
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPagina() } }}
                    placeholder="https://drive.google.com/file/d/..."
                    className="input pl-9"
                  />
                </div>
                <button
                  onClick={addPagina}
                  disabled={!newUrl.trim()}
                  className="btn-primary flex-shrink-0 disabled:opacity-40"
                >
                  <Plus className="w-5 h-5" />
                  Agregar
                </button>
              </div>

              {/* Lista de páginas */}
              {formData.paginas.length > 0 && (
                <div className="space-y-2">
                  {formData.paginas.map((url, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface-container">
                      <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="font-medium text-outline text-body-sm flex-shrink-0 w-14">
                        Pág {i + 1}
                      </span>
                      <span className="flex-1 text-body-sm text-on-surface-variant truncate" title={url}>
                        {url}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => movePagina(i, 'up')} disabled={i === 0}
                          className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-30"
                          title="Subir">
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button onClick={() => movePagina(i, 'down')} disabled={i === formData.paginas.length - 1}
                          className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-30"
                          title="Bajar">
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button onClick={() => removePagina(i)}
                          className="p-1.5 rounded-lg hover:bg-error-container transition-colors ml-1"
                          title="Eliminar">
                          <X className="w-4 h-4 text-error" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={handleCancel} className="btn-outline">
                <X className="w-5 h-5" /> Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className={cn('btn-primary', saving && 'opacity-70')}>
                <Save className="w-5 h-5" />
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}

        {/* Lista de cartas */}
        <div className="space-y-3">
          {cartas.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              No hay cartas registradas
            </div>
          ) : (
            cartas.map((carta) => (
              <div key={carta.id} className="card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-serif text-title-md text-on-surface truncate">{carta.titulo}</p>
                    <p className="text-body-sm text-outline">
                      {carta.paginas.length} {carta.paginas.length === 1 ? 'página' : 'páginas'}
                      {carta.fecha && ` · ${carta.fecha}`}
                      {carta.remitente && ` · De: ${carta.remitente}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => handleEdit(carta)}
                    className="p-2 rounded-full hover:bg-surface-container-high transition-colors">
                    <Pencil className="w-4 h-4 text-on-surface-variant" />
                  </button>
                  <button onClick={() => handleDelete(carta)}
                    className="p-2 rounded-full hover:bg-error-container transition-colors">
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
