import { GoogleAuth } from 'google-auth-library'
import type { NextRequest } from 'next/server'

// Inicializado una sola vez a nivel de módulo — Vercel reutiliza entre requests en la misma instancia
if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON no está configurado')
}

const auth = new GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
})

// Regex para validar file IDs de Drive (evita SSRF)
const FILE_ID_REGEX = /^[A-Za-z0-9_-]{10,}$/

export async function GET(
  req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  // 1. Auth — verificar cookie de sesión
  if (!req.cookies.has('af_session')) {
    return new Response('No autorizado', { status: 401 })
  }

  // 2. Validar fileId
  const { fileId } = params
  if (!FILE_ID_REGEX.test(fileId)) {
    return new Response('File ID inválido', { status: 400 })
  }

  // 3. Obtener access token
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

  // 4. Fetch el archivo desde Drive
  const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`
  const driveRes = await fetch(driveUrl, {
    headers: { Authorization: `Bearer ${token}` },
  })

  // 5. Manejar errores de Drive
  if (driveRes.status === 404) {
    return new Response('Archivo no encontrado', { status: 404 })
  }
  if (driveRes.status === 403) {
    return new Response('Sin acceso al archivo — compartilo con la cuenta de servicio', { status: 403 })
  }
  if (!driveRes.ok) {
    return new Response(`Error de Drive: ${driveRes.status}`, { status: 502 })
  }

  // 6. Streamear la respuesta directamente (sin bufferear en memoria)
  const contentType = driveRes.headers.get('Content-Type') ?? 'application/octet-stream'
  const contentLength = driveRes.headers.get('Content-Length')

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Cache-Control': 'private, max-age=3600',
  }
  if (contentLength) headers['Content-Length'] = contentLength

  return new Response(driveRes.body, { status: 200, headers })
}
