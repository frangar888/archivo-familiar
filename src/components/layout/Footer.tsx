import Link from 'next/link'
import { Heart } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-surface-container py-12 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6">
          {/* Logo */}
          <div className="text-center">
            <p className="font-serif text-headline-sm text-on-surface">
              Archivo Familiar
            </p>
            <p className="text-body-md text-outline mt-1">
              Preservando nuestra historia para las futuras generaciones
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-6">
            <Link
              href="/arbol"
              className="text-body-md text-on-surface-variant hover:text-primary transition-colors"
            >
              Árbol Genealógico
            </Link>
            <Link
              href="/timeline"
              className="text-body-md text-on-surface-variant hover:text-primary transition-colors"
            >
              Línea de Tiempo
            </Link>
            <Link
              href="/galeria"
              className="text-body-md text-on-surface-variant hover:text-primary transition-colors"
            >
              Galería
            </Link>
            <Link
              href="/videos"
              className="text-body-md text-on-surface-variant hover:text-primary transition-colors"
            >
              Videos
            </Link>
          </nav>

          {/* Divider */}
          <div className="w-24 h-px bg-outline-variant" />

          {/* Copyright */}
          <div className="flex items-center gap-2 text-body-sm text-outline">
            <span>Hecho con</span>
            <Heart className="h-4 w-4 text-secondary fill-secondary" />
            <span>por la familia</span>
            <span className="mx-2">·</span>
            <span>{currentYear}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
