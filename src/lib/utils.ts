import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Merge de clases Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Parsear fecha "YYYY-MM-DD" en hora local para evitar el desfase UTC
function parseDateLocal(dateString: string): Date {
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number)
  return new Date(year, month - 1, day)
}

// Formatear fecha en español
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return ''

  const date = parseDateLocal(dateString)
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Formatear año
export function formatYear(dateString: string | null | undefined): string {
  if (!dateString) return ''
  return parseDateLocal(dateString).getFullYear().toString()
}

// Calcular edad
export function calcularEdad(
  fechaNacimiento: string | null | undefined,
  fechaFallecimiento?: string | null
): number | null {
  if (!fechaNacimiento) return null

  const nacimiento = parseDateLocal(fechaNacimiento)
  const fin = fechaFallecimiento ? parseDateLocal(fechaFallecimiento) : new Date()

  let edad = fin.getFullYear() - nacimiento.getFullYear()
  const mes = fin.getMonth() - nacimiento.getMonth()

  if (mes < 0 || (mes === 0 && fin.getDate() < nacimiento.getDate())) {
    edad--
  }

  return edad
}

// Convertir URL de Google Drive a URL directa de imagen
export function getGoogleDriveImageUrl(url: string): string {
  // Si ya es una URL directa, devolverla tal cual
  if (!url.includes('drive.google.com')) {
    return url
  }

  // Extraer el ID del archivo
  let fileId = ''

  // Formato: https://drive.google.com/file/d/FILE_ID/view
  const fileMatch = url.match(/\/file\/d\/([^/]+)/)
  if (fileMatch) {
    fileId = fileMatch[1]
  }

  // Formato: https://drive.google.com/open?id=FILE_ID
  const openMatch = url.match(/[?&]id=([^&]+)/)
  if (openMatch) {
    fileId = openMatch[1]
  }

  if (fileId) {
    // URL directa para mostrar la imagen
    return `https://drive.google.com/uc?export=view&id=${fileId}`
  }

  return url
}

// Extraer ID de archivo de Google Drive desde cualquier formato de URL
export function getDriveFileId(url: string): string | null {
  const fileMatch = url.match(/\/file\/d\/([^/?#]+)/)
  if (fileMatch) return fileMatch[1]

  const openMatch = url.match(/[?&]id=([^&#]+)/)
  if (openMatch) return openMatch[1]

  return null
}

// Convierte cualquier URL de Google Drive en una URL interna del proxy
// URLs no-Drive se devuelven sin cambios (YouTube thumbnails, etc.)
export function getInternalFileUrl(url: string): string {
  if (!url || url.startsWith('/api/drive/')) return url
  if (!url.includes('drive.google.com')) return url
  const fileId = getDriveFileId(url)
  return fileId ? `/api/drive/${fileId}` : url
}

// URL de embed para reproducir video de Drive en iframe
export function getDriveVideoEmbedUrl(url: string): string | null {
  const fileId = getDriveFileId(url)
  if (!fileId) return null
  return `https://drive.google.com/file/d/${fileId}/preview`
}

// Extraer ID de video de YouTube
export function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

// Obtener thumbnail de YouTube (hqdefault siempre existe; maxresdefault puede no estar)
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

// Formatear duración en minutos:segundos
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return ''

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Generar nombre completo
export function getNombreCompleto(
  nombre: string,
  apellido: string,
  apellidoCasada?: string | null
): string {
  if (apellidoCasada) {
    return `${nombre} ${apellido} de ${apellidoCasada}`
  }
  return `${nombre} ${apellido}`
}

// Truncar texto
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}
