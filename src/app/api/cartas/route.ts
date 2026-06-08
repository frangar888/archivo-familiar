import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Solo server-side — nunca expuesto al browser
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

// GET /api/cartas — lista todas las cartas
export async function GET(req: NextRequest) {
  const adminId = await verifyAdmin(req)
  if (!adminId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data, error } = await adminSupabase
    .from('cartas').select('*')
    .order('orden').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/cartas — crear nueva carta
export async function POST(req: NextRequest) {
  const adminId = await verifyAdmin(req)
  if (!adminId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await adminSupabase
    .from('cartas').insert({ ...body, created_by: adminId }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH /api/cartas — actualizar carta existente
export async function PATCH(req: NextRequest) {
  const adminId = await verifyAdmin(req)
  if (!adminId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id, ...body } = await req.json()
  if (!id) return NextResponse.json({ error: 'id es requerido' }, { status: 400 })

  const { data, error } = await adminSupabase
    .from('cartas').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/cartas — eliminar carta
export async function DELETE(req: NextRequest) {
  const adminId = await verifyAdmin(req)
  if (!adminId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id es requerido' }, { status: 400 })

  const { error } = await adminSupabase.from('cartas').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
