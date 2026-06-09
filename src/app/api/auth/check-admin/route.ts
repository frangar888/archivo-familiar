import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Solo server-side — usa service role para evitar el auth lock del cliente browser
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ isAdmin: false })

  const { data: { user } } = await adminSupabase.auth.getUser(token)
  if (!user) return NextResponse.json({ isAdmin: false })

  const { data } = await adminSupabase
    .from('user_roles').select('role').eq('user_id', user.id).single()

  return NextResponse.json({ isAdmin: data?.role === 'admin' })
}
