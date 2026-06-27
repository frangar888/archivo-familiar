import { GoogleAuth } from 'google-auth-library'
import { createClient } from '@supabase/supabase-js'

// Server-only module — never imported from client components

const FOLDER_ID = process.env.DRIVE_PHOTOS_FOLDER_ID

const auth =
  FOLDER_ID && process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    ? new GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      })
    : null

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function extractFileId(url: string): string | null {
  const m = url.match(/\/d\/([A-Za-z0-9_-]+)/)
  return m ? m[1] : null
}

async function listFolderImages(folderId: string, token: string) {
  const files: { id: string; name: string }[] = []
  let pageToken: string | undefined

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: 'nextPageToken,files(id,name)',
      pageSize: '200',
      orderBy: 'name',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    })
    if (pageToken) params.set('pageToken', pageToken)

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) throw new Error(`Drive API error: ${res.status}`)
    const json = await res.json()
    files.push(...(json.files ?? []))
    pageToken = json.nextPageToken
  } while (pageToken && files.length < 500)

  return files
}

/**
 * Lists Drive folder images and creates Supabase records for any new ones.
 * Existing records (matched by fileId in imagen_url) are left untouched.
 * Returns { synced, total } — synced = new records created, total = files in folder.
 *
 * No-op if DRIVE_PHOTOS_FOLDER_ID is not configured.
 */
/**
 * Lists Drive folder images and creates Supabase records for any new ones.
 * Also deletes Supabase records whose Drive file no longer exists in the folder.
 * Existing records with matching fileId are left untouched (metadata preserved).
 * Returns { added, removed, total }.
 *
 * No-op if DRIVE_PHOTOS_FOLDER_ID is not configured.
 */
export async function syncDriveFotos(): Promise<{ added: number; removed: number; total: number }> {
  if (!FOLDER_ID || !auth) return { added: 0, removed: 0, total: 0 }

  const client = await auth.getClient()
  const { token } = await client.getAccessToken()
  if (!token) throw new Error('No se pudo obtener token de Google')

  const driveFiles = await listFolderImages(FOLDER_ID, token)
  const driveIds = new Set(driveFiles.map((f) => f.id))

  const { data: existing } = await adminSupabase.from('fotos').select('id, imagen_url')
  const existingFotos = existing ?? []

  // Build map: fileId → supabase record id
  const fileIdToRecord = new Map<string, string>()
  for (const row of existingFotos as { id: string; imagen_url: string }[]) {
    const fid = extractFileId(row.imagen_url)
    if (fid) fileIdToRecord.set(fid, row.id)
  }

  // Insert new files (in Drive but not in Supabase)
  const toInsert = driveFiles
    .filter((f) => !fileIdToRecord.has(f.id))
    .map((f) => ({
      titulo: f.name.replace(/\.[^.]+$/, ''),
      imagen_url: `https://drive.google.com/file/d/${f.id}/view`,
      personas_ids: [] as string[],
      orden: 0,
      destacada: false,
      rotacion: 0,
    }))

  if (toInsert.length > 0) {
    await adminSupabase.from('fotos').insert(toInsert)
  }

  // Delete records whose file no longer exists in Drive
  const toDelete: string[] = []
  fileIdToRecord.forEach((recordId, fid) => {
    if (!driveIds.has(fid)) toDelete.push(recordId)
  })

  if (toDelete.length > 0) {
    await adminSupabase.from('fotos').delete().in('id', toDelete)
  }

  return { added: toInsert.length, removed: toDelete.length, total: driveFiles.length }
}

export const driveConfigured = !!FOLDER_ID
