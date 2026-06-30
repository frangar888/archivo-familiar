import { GoogleAuth } from 'google-auth-library'
import sharp from 'sharp'
import type { NextRequest } from 'next/server'

if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON no está configurado')
}

const auth = new GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
})

const FILE_ID_REGEX = /^[A-Za-z0-9_-]{10,}$/

// Thumbnail max dimension (px). Keeps aspect ratio, never upscales.
const THUMB_SIZE = 400

export async function GET(
  req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  if (!req.cookies.has('af_session')) {
    return new Response('No autorizado', { status: 401 })
  }

  const { fileId } = params
  if (!FILE_ID_REGEX.test(fileId)) {
    return new Response('File ID inválido', { status: 400 })
  }

  let token: string | null | undefined
  try {
    const client = await auth.getClient()
    const tokenResponse = await client.getAccessToken()
    token = tokenResponse.token
  } catch {
    return new Response('Error de autenticación con Google', { status: 500 })
  }

  if (!token) {
    return new Response('No se pudo obtener token de Google', { status: 500 })
  }

  const driveRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (driveRes.status === 404) return new Response('Archivo no encontrado', { status: 404 })
  if (driveRes.status === 403) return new Response('Sin acceso al archivo', { status: 403 })
  if (!driveRes.ok) return new Response(`Error de Drive: ${driveRes.status}`, { status: 502 })

  const isThumb = req.nextUrl.searchParams.has('thumb')

  if (isThumb) {
    // Resize server-side so the browser receives a small image (~20-50 KB)
    // instead of the full-resolution file (potentially several MB).
    const buffer = Buffer.from(await driveRes.arrayBuffer())
    const thumb = await sharp(buffer)
      .rotate()  // auto-rotate based on EXIF orientation tag, then strips it
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 72, progressive: true })
      .toBuffer()

    return new Response(thumb as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    })
  }

  // Full resolution — stream directly without buffering
  const contentType = driveRes.headers.get('Content-Type') ?? 'application/octet-stream'
  const contentLength = driveRes.headers.get('Content-Length')
  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
  }
  if (contentLength) headers['Content-Length'] = contentLength

  return new Response(driveRes.body, { status: 200, headers })
}
