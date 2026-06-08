'use client'

import { useState } from 'react'
import { Lock, Check } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { FormField } from '@/components/ui/FormField'

export default function PerfilPage() {
  const { user } = useAuth()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
    }
    setSaving(false)
  }

  return (
    <div className="py-12 lg:py-16">
      <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="font-serif text-display-sm text-on-surface mb-2">Mi perfil</h1>
          <p className="text-body-lg text-on-surface-variant">{user?.email}</p>
        </div>

        {/* Card cambio de contraseña */}
        <div className="card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-serif text-title-lg text-on-surface">Cambiar contraseña</h2>
          </div>

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 text-green-800 text-body-md border border-green-200 flex items-center gap-3">
              <Check className="w-5 h-5 flex-shrink-0" />
              Contraseña actualizada correctamente.
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-error-container text-error text-body-md">
              {error}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-5">
            <FormField label="Nueva contraseña" htmlFor="newPassword" required>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
                className="input"
              />
            </FormField>

            <FormField label="Confirmar contraseña" htmlFor="confirmPassword" required>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetí la nueva contraseña"
                required
                className="input"
              />
            </FormField>

            <button
              type="submit"
              disabled={saving}
              className={cn('btn-primary w-full', saving && 'opacity-70')}
            >
              {saving ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
