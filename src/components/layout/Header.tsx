'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Home, GitBranch, Clock, Image, Video, Settings, LogOut, UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { label: 'Inicio', href: '/', icon: Home },
  { label: 'Árbol', href: '/arbol', icon: GitBranch },
  { label: 'Línea de Tiempo', href: '/timeline', icon: Clock },
  { label: 'Galería', href: '/galeria', icon: Image },
  { label: 'Videos', href: '/videos', icon: Video },
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, isAdmin, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-sm">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
              <span className="font-serif text-lg font-bold">AF</span>
            </div>
            <div className="hidden sm:block">
              <p className="font-serif text-title-md font-semibold text-on-surface">
                Archivo Familiar
              </p>
              <p className="text-body-sm text-outline">
                Familia Garcia - De Simón
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-label-lg transition-all duration-200',
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Login Button (Desktop) */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-2 rounded-full text-label-lg text-on-surface-variant hover:bg-surface-container-high transition-all duration-200"
              >
                <Settings className="h-4 w-4" />
                <span>Admin</span>
              </Link>
            )}
            {user && (
              <Link
                href="/perfil"
                className="flex items-center gap-2 px-4 py-2 rounded-full text-label-lg text-on-surface-variant hover:bg-surface-container-high transition-all duration-200"
              >
                <UserCircle className="h-4 w-4" />
                <span>Mi perfil</span>
              </Link>
            )}
            {user && (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-label-lg text-on-surface-variant hover:bg-surface-container-high transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span>Salir</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high"
            aria-label="Abrir menú"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-surface-container-high">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-label-lg transition-all duration-200',
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-label-lg text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 mt-2 border-t border-surface-container-high pt-4"
                >
                  <Settings className="h-5 w-5" />
                  <span>Panel Admin</span>
                </Link>
              )}
              {user && (
                <button
                  onClick={() => { handleSignOut(); setIsMenuOpen(false) }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-label-lg text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 w-full text-left"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Cerrar sesión</span>
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
