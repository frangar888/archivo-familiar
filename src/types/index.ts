export * from './database'

// Constantes para categorías
export const CATEGORIAS_EVENTO = {
  espana: { label: 'España', color: 'bg-secondary' },
  travesia: { label: 'Travesía', color: 'bg-tertiary' },
  argentina: { label: 'Argentina', color: 'bg-primary' },
  familia: { label: 'Familia', color: 'bg-primary-light' },
} as const

export const CATEGORIAS_FOTO = {
  retratos: { label: 'Retratos', icon: 'user' },
  documentos: { label: 'Documentos', icon: 'file-text' },
  lugares: { label: 'Lugares', icon: 'map-pin' },
  eventos: { label: 'Eventos', icon: 'calendar' },
  vida_cotidiana: { label: 'Vida Cotidiana', icon: 'home' },
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
  { label: 'Videos', href: '/videos', icon: 'video' },
]
