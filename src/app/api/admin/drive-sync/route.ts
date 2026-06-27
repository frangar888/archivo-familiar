import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { syncDriveFotos } from '@/lib/drive-sync'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return false
  const { data: { user } } = await adminSupabase.auth.getUser(token)
  if (!user) return false
  const { data } = await adminSupabase
    .from('user_roles').select('role').eq('user_id', user.id).single()
  return data?.role === 'admin'
}

// POST /api/admin/drive-sync
// Syncs the configured Drive folder to Supabase fotos table, then revalidates the gallery cache.
export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const result = await syncDriveFotos()
    revalidatePath('/galeria')
    revalidatePath('/')
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al sincronizar' }, { status: 500 })
  }
}
