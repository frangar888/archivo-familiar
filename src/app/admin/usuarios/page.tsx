'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Save, X, Mail, Shield, Eye } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { FormField, Select } from '@/components/ui/FormField'

type UserRole = 'admin' | 'viewer'

interface AppUser {
  id: string
  email: string
  role: UserRole
  created_at: string
  last_sign_in_at: string | null
  confirmed: boolean
}

const roleOptions = [
  { value: 'viewer', label: 'Usuario' },
  { value: 'admin', label: 'Administrador' },
]

export default function AdminUsuariosPage() {
  const router = useRouter()
  const { user, isAdmin, loading: authLoading, accessToken } = useAuth()

  const apiRequest = (method: string, body?: object) =>
    fetch('/api/admin/users', {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('viewer')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) router.push('/login')
  }, [user, isAdmin, authLoading, router])

  useEffect(() => {
    if (isAdmin && accessToken) fetchUsers()
  }, [isAdmin, accessToken])

  const fetchUsers = async () => {
    setLoading(true)
    const res = await apiRequest('GET')
    if (res.ok) {
      const data = await res.json()
      setUsers(data)
    }
    setLoading(false)
  }

  const handleInvite = async () => {
    if (!email.trim()) { setError('El email es requerido'); return }
    setSaving(true)
    setError(null)
    setSuccess(null)

    const res = await apiRequest('POST', { email: email.trim(), role })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Error al invitar usuario')
    } else {
      setSuccess(`Invitación enviada a ${email}`)
      setEmail('')
      setRole('viewer')
      setShowForm(false)
      await fetchUsers()
    }
    setSaving(false)
  }

  const handleChangeRole = async (u: AppUser, newRole: UserRole) => {
    const res = await apiRequest('PATCH', { userId: u.id, role: newRole })
    if (res.ok) {
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, role: newRole } : x))
    }
    setEditingUser(null)
  }

  const handleDelete = async (u: AppUser) => {
    if (!confirm(`¿Eliminar a ${u.email}? Esta acción no se puede deshacer.`)) return
    const res = await apiRequest('DELETE', { userId: u.id })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Error al eliminar usuario')
    } else {
      setUsers((prev) => prev.filter((x) => x.id !== u.id))
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
            <h1 className="font-serif text-headline-md text-on-surface">Usuarios</h1>
          </div>
          {!showForm && (
            <button onClick={() => { setShowForm(true); setError(null); setSuccess(null) }} className="btn-primary">
              <Plus className="w-5 h-5" />
              Invitar usuario
            </button>
          )}
        </div>

        {/* Mensajes globales */}
        {success && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 text-green-800 text-body-md border border-green-200">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error-container text-error text-body-md">
            {error}
          </div>
        )}

        {/* Formulario invitación */}
        {showForm && (
          <div className="card p-6 mb-8">
            <h2 className="font-serif text-title-lg text-on-surface mb-6">Invitar nuevo usuario</h2>
            <p className="text-body-md text-on-surface-variant mb-6">
              Se enviará un email con un enlace para que el usuario establezca su contraseña.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <FormField label="Email" htmlFor="email" required>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@email.com"
                  className="input"
                />
              </FormField>
              <FormField label="Rol" htmlFor="role" required>
                <Select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  options={roleOptions}
                />
              </FormField>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowForm(false); setError(null) }} className="btn-outline">
                <X className="w-5 h-5" />
                Cancelar
              </button>
              <button onClick={handleInvite} disabled={saving} className={cn('btn-primary', saving && 'opacity-70')}>
                <Mail className="w-5 h-5" />
                {saving ? 'Enviando...' : 'Enviar invitación'}
              </button>
            </div>
          </div>
        )}

        {/* Lista de usuarios */}
        <div className="space-y-3">
          {users.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">No hay usuarios registrados</div>
          ) : (
            users.map((u) => (
              <div key={u.id} className="card p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                      u.role === 'admin' ? 'bg-primary/10' : 'bg-surface-container'
                    )}>
                      {u.role === 'admin'
                        ? <Shield className="w-5 h-5 text-primary" />
                        : <Eye className="w-5 h-5 text-on-surface-variant" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-serif text-title-md text-on-surface truncate">{u.email}</p>
                      <div className="flex items-center gap-3 text-body-sm text-outline mt-0.5">
                        <span>{u.role === 'admin' ? 'Administrador' : 'Usuario'}</span>
                        {!u.confirmed && <span className="text-amber-600">· Invitación pendiente</span>}
                        {u.last_sign_in_at && (
                          <span>· Último acceso: {new Date(u.last_sign_in_at).toLocaleDateString('es-AR')}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {editingUser?.id === u.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          className="input text-body-sm py-1"
                          defaultValue={u.role}
                          onChange={(e) => handleChangeRole(u, e.target.value as UserRole)}
                        >
                          {roleOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
                        >
                          <X className="w-4 h-4 text-on-surface-variant" />
                        </button>
                      </div>
                    ) : (
                      <>
                        {u.id !== user?.id && (
                          <>
                            <button
                              onClick={() => setEditingUser(u)}
                              className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
                              title="Cambiar rol"
                            >
                              <Save className="w-4 h-4 text-on-surface-variant" />
                            </button>
                            <button
                              onClick={() => handleDelete(u)}
                              className="p-2 rounded-full hover:bg-error-container transition-colors"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-4 h-4 text-error" />
                            </button>
                          </>
                        )}
                        {u.id === user?.id && (
                          <span className="text-body-sm text-outline px-2">(vos)</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
