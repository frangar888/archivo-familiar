import { GoogleAuth } from 'google-auth-library'
import { createClient } from '@supabase/supabase-js'

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

// Handles multiple Drive URL formats:
//   https://drive.google.com/file/d/FILEID/view
//   https://drive.google.com/open?id=FILEID
//   https://drive.google.com/uc?export=view&id=FILEID
function extractFileId(url: string): string | null {
  if (!url) return null
  const m = url.match(/\/d\/([A-Za-z0-9_-]+)/) ?? url.match(/[?&]id=([A-Za-z0-9_-]+)/)
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

export interface SyncResult {
  added: number
  removed: number
  deduplicated: number
  total: number
}

/**
 * Mirrors the configured Drive folder into the Supabase fotos table:
 *  - Inserts records for new Drive files (filename as default title).
 *  - Deletes records whose Drive file no longer exists in the folder.
 *  - Deduplicates records sharing the same Drive fileId, keeping the one
 *    with more metadata (preserves user edits to titulo, descripcion, etc.).
 *  - Never overwrites metadata on existing records.
 *
 * No-op if DRIVE_PHOTOS_FOLDER_ID is not configured.
 */
export async function syncDriveFotos(): Promise<SyncResult> {
  if (!FOLDER_ID || !auth) return { added: 0, removed: 0, deduplicated: 0, total: 0 }

  const client = await auth.getClient()
  const { token } = await client.getAccessToken()
  if (!token) throw new Error('No se pudo obtener token de Google')

  const [driveFiles, { data: existingRaw }] = await Promise.all([
    listFolderImages(FOLDER_ID, token),
    adminSupabase.from('fotos').select('id, imagen_url, titulo, descripcion'),
  ])

  const driveIds = new Set(driveFiles.map((f) => f.id))

  // Group existing Supabase records by Drive fileId
  type Row = { id: string; imagen_url: string; titulo: string; descripcion: string | null }
  const byFileId = new Map<string, Row[]>()

  for (const row of (existingRaw ?? []) as Row[]) {
    const fid = extractFileId(row.imagen_url)
    if (!fid) continue // non-Drive records: leave them alone
    if (!byFileId.has(fid)) byFileId.set(fid, [])
    byFileId.get(fid)!.push(row)
  }

  // Deduplicate: for fileIds with >1 record, keep the richest one
  const fileIdToKeep = new Map<string, string>() // fileId → Supabase record id to keep
  const toDeleteIds: string[] = []

  byFileId.forEach((rows, fid) => {
    if (rows.length === 1) {
      fileIdToKeep.set(fid, rows[0].id)
      return
    }
    // Score records — prefer ones with user-edited data over auto-synced defaults
    const scored = rows.map((r) => ({
      r,
      score:
        (r.descripcion ? 4 : 0) +
        (r.titulo && !r.titulo.match(/^IMG[-_\d]/) ? 2 : 0) + // title looks user-edited
        (r.titulo ? 1 : 0),
    }))
    scored.sort((a, b) => b.score - a.score)
    fileIdToKeep.set(fid, scored[0].r.id)
    for (let i = 1; i < scored.length; i++) toDeleteIds.push(scored[i].r.id)
  })

  // Delete duplicate records
  if (toDeleteIds.length > 0) {
    await adminSupabase.from('fotos').delete().in('id', toDeleteIds)
  }

  // Delete records whose Drive file no longer exists in the folder
  const toRemove: string[] = []
  fileIdToKeep.forEach((recordId, fid) => {
    if (!driveIds.has(fid)) toRemove.push(recordId)
  })
  if (toRemove.length > 0) {
    await adminSupabase.from('fotos').delete().in('id', toRemove)
  }

  // Insert new Drive files (those with no matching Supabase record)
  const toInsert = driveFiles
    .filter((f) => !fileIdToKeep.has(f.id))
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

  return {
    added: toInsert.length,
    removed: toRemove.length,
    deduplicated: toDeleteIds.length,
    total: driveFiles.length,
  }
}

export const driveConfigured = !!FOLDER_ID
