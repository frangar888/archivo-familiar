import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function verifyAdmin(req: NextRequest): Promise<string | null> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user } } = await adminSupabase.auth.getUser(token)
  if (!user) return null
  const { data } = await adminSupabase
    .from('user_roles').select('role').eq('user_id', user.id).single()
  return data?.role === 'admin' ? user.id : null
}

interface DriveFileInput {
  fileId: string
  name: string
}

// POST /api/admin/drive-import
// Body: { files: DriveFileInput[] }
// Bulk-inserts fotos from Drive, skipping already-imported ones
export async function POST(req: NextRequest) {
  const adminId = await verifyAdmin(req)
  if (!adminId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { files } = await req.json() as { files: DriveFileInput[] }
  if (!Array.isArray(files) || files.length === 0) {
    return NextResponse.json({ error: 'No hay archivos para importar' }, { status: 400 })
  }

  // Check which are already imported
  const { data: existingFotos } = await adminSupabase.from('fotos').select('imagen_url')
  const importedIds = new Set(
    (existingFotos ?? []).map((f: { imagen_url: string }) => {
      const m = f.imagen_url.match(/\/d\/([A-Za-z0-9_-]+)/)
      return m ? m[1] : null
    }).filter(Boolean)
  )

  const toInsert = files
    .filter((f) => !importedIds.has(f.fileId))
    .map((f) => ({
      titulo: f.name.replace(/\.[^.]+$/, ''),  // strip extension
      imagen_url: `https://drive.google.com/file/d/${f.fileId}/view`,
      personas_ids: [],
      orden: 0,
      destacada: false,
      rotacion: 0,
      created_by: adminId,
    }))

  if (toInsert.length === 0) {
    return NextResponse.json({ imported: 0, skipped: files.length })
  }

  const { error } = await adminSupabase.from('fotos').insert(toInsert)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    imported: toInsert.length,
    skipped: files.length - toInsert.length,
  })
}
