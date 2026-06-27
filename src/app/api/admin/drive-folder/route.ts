import { GoogleAuth } from 'google-auth-library'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const auth = new GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!),
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
})

const FOLDER_ID_REGEX = /^[A-Za-z0-9_-]{10,}$/

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return false
  const { data: { user } } = await adminSupabase.auth.getUser(token)
  if (!user) return false
  const { data } = await adminSupabase
    .from('user_roles').select('role').eq('user_id', user.id).single()
  return data?.role === 'admin'
}

function extractFolderId(input: string): string | null {
  // Bare ID
  if (FOLDER_ID_REGEX.test(input.trim())) return input.trim()
  // https://drive.google.com/drive/folders/{id}
  const match = input.match(/\/folders\/([A-Za-z0-9_-]{10,})/)
  return match ? match[1] : null
}

// GET /api/admin/drive-folder?folderId=...
// Returns list of image files in the given Drive folder
export async function GET(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const folderInput = req.nextUrl.searchParams.get('folderId') ?? ''
  const folderId = extractFolderId(folderInput)
  if (!folderId) {
    return NextResponse.json({ error: 'Folder ID inválido' }, { status: 400 })
  }

  let token: string
  try {
    const client = await auth.getClient()
    const res = await client.getAccessToken()
    token = res.token!
  } catch {
    return NextResponse.json({ error: 'Error de autenticación con Google' }, { status: 500 })
  }

  // List image files in the folder (paginate up to 500)
  const allFiles: { id: string; name: string; mimeType: string; thumbnailLink?: string }[] = []
  let pageToken: string | undefined

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: 'nextPageToken,files(id,name,mimeType,thumbnailLink)',
      pageSize: '200',
      orderBy: 'name',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    })
    if (pageToken) params.set('pageToken', pageToken)

    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (driveRes.status === 403) {
      return NextResponse.json(
        { error: 'Sin acceso a la carpeta — compartila con la cuenta de servicio' },
        { status: 403 }
      )
    }
    if (!driveRes.ok) {
      return NextResponse.json({ error: `Error de Drive: ${driveRes.status}` }, { status: 502 })
    }

    const json = await driveRes.json()
    allFiles.push(...(json.files ?? []))
    pageToken = json.nextPageToken
  } while (pageToken && allFiles.length < 500)

  // Check which fileIds are already imported (by looking for the ID in imagen_url)
  const { data: existingFotos } = await adminSupabase
    .from('fotos').select('imagen_url')

  const importedIds = new Set(
    (existingFotos ?? []).map((f: { imagen_url: string }) => {
      const m = f.imagen_url.match(/\/d\/([A-Za-z0-9_-]+)/)
      return m ? m[1] : null
    }).filter(Boolean)
  )

  const files = allFiles.map((f) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    // thumbnailLink is a small (~220px) pre-signed URL from Google — no proxy needed
    thumbnailLink: f.thumbnailLink ?? null,
    alreadyImported: importedIds.has(f.id),
  }))

  return NextResponse.json({ files, folderId })
}
