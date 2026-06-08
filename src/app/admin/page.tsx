'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, Calendar, Image, Video, Plus, Settings, UserCog, LogOut, Heart, ScrollText } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const adminSections = [
  {
    title: 'Personas',
    description: 'Gestionar miembros del árbol genealógico',
    href: '/admin/personas',
    icon: Users,
    color: 'bg-primary',
  },
  {
    title: 'Eventos',
    description: 'Administrar la línea de tiempo',
    href: '/admin/eventos',
    icon: Calendar,
    color: 'bg-secondary',
  },
  {
    title: 'Fotos',
    description: 'Subir y organizar imágenes',
    href: '/admin/fotos',
    icon: Image,
    color: 'bg-tertiary',
  },
  {
    title: 'Videos',
    description: 'Agregar y gestionar videos',
    href: '/admin/videos',
    icon: Video,
    color: 'bg-primary-container',
  },
  {
    title: 'Matrimonios',
    description: 'Registrar uniones y fechas de casamiento',
    href: '/admin/matrimonios',
    icon: Heart,
    color: 'bg-tertiary-container',
  },
  {
    title: 'Cartas',
    description: 'Subir cartas escaneadas (PDF multi-página)',
    href: '/admin/cartas',
    icon: ScrollText,
    color: 'bg-tertiary',
  },
  {
    title: 'Usuarios',
    description: 'Invitar y gestionar accesos al sitio',
    href: '/admin/usuarios',
    icon: UserCog,
    color: 'bg-secondary-container',
  },
]

export default function AdminPage() {
  const router = useRouter()
  const { user, isAdmin, loading, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-pulse text-on-surface-variant">Cargando...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-error-container flex items-center justify-center mx-auto mb-6">
            <Settings className="w-10 h-10 text-error" />
          </div>
          <h1 className="font-serif text-headline-md text-on-surface mb-4">
            Acceso restringido
          </h1>
          <p className="text-body-lg text-on-surface-variant mb-6 max-w-md">
            Tu cuenta no tiene permisos de administrador. Contactá al administrador
            del sitio para solicitar acceso.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="btn-outline">
              Volver al inicio
            </Link>
            <button onClick={handleSignOut} className="btn-primary">
              <LogOut className="w-5 h-5" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-12 lg:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-serif text-display-sm text-on-surface mb-2">
            Panel de Administración
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Bienvenido, {user.email}
          </p>
        </div>

        {/* Secciones */}
        <div className="grid sm:grid-cols-2 gap-6">
          {adminSections.map((section) => {
            const Icon = section.icon
            return (
              <Link
                key={section.href}
                href={section.href}
                className={cn(
                  'card p-6 group',
                  'flex items-start gap-5',
                  'hover:scale-[1.02] transition-transform duration-300'
                )}
              >
                <div
                  className={cn(
                    'flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center',
                    section.color
                  )}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="font-serif text-title-lg text-on-surface mb-1 group-hover:text-primary transition-colors">
                    {section.title}
                  </h2>
                  <p className="text-body-md text-on-surface-variant">
                    {section.description}
                  </p>
                </div>
                <Plus className="w-5 h-5 text-outline group-hover:text-primary transition-colors" />
              </Link>
            )
          })}
        </div>

        {/* Info */}
        <div className="mt-10 p-6 rounded-xl bg-surface-container">
          <h3 className="font-serif text-title-md text-on-surface mb-3">
            Guía rápida
          </h3>
          <ul className="space-y-2 text-body-md text-on-surface-variant">
            <li>
              • <strong>Personas:</strong> Agregá miembros al árbol genealógico con sus
              datos y fotos de perfil
            </li>
            <li>
              • <strong>Eventos:</strong> Creá hitos para la línea de tiempo con fechas
              e imágenes
            </li>
            <li>
              • <strong>Fotos:</strong> Subí imágenes históricas usando links de Google
              Drive
            </li>
            <li>
              • <strong>Videos:</strong> Agregá entrevistas de YouTube o Google Drive
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
