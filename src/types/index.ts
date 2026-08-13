export * from './database'

// Constantes para categorías
export const CATEGORIAS_EVENTO = {
  espana: { label: 'España', color: 'bg-secondary' },
  travesia: { label: 'Travesía', color: 'bg-tertiary' },
  argentina: { label: 'Argentina', color: 'bg-primary' },
  familia: { label: 'Familia', color: 'bg-primary-light' },
} as const

// Navegación
export interface NavItem {
  label: string
  href: string
  icon?: string
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', href: '/', icon: 'home' },
  { label: 'Árbol', href: '/arbol', icon: 'git-branch' },
  { label: 'Línea de Tiempo', href: '/timeline', icon: 'clock' },
  { label: 'Galería', href: '/galeria', icon: 'image' },
  { label: 'Documentos', href: '/documentos', icon: 'file-text' },
  { label: 'Videos', href: '/videos', icon: 'video' },
]
