import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Cliente con service role key — solo server-side, nunca expuesto al browser
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
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  return data?.role === 'admin' ? user.id : null
}

export async function GET(req: NextRequest) {
  const adminId = await verifyAdmin(req)
  if (!adminId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: { users }, error } = await adminSupabase.auth.admin.listUsers()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: roles } = await adminSupabase
    .from('user_roles')
    .select('user_id, role')

  const rolesMap = new Map(roles?.map((r) => [r.user_id, r.role]) ?? [])

  const result = users.map((u) => ({
    id: u.id,
    email: u.email ?? '',
    role: rolesMap.get(u.id) ?? 'viewer',
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
    confirmed: !!u.confirmed_at,
  }))

  return NextResponse.json(result)
}

function buildInviteEmail(inviteUrl: string, email: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invitación al Archivo Familiar</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0e8;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0e8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#fcf9f0;border-radius:12px;overflow:hidden;border:1px solid #d4c9a8;">

          <!-- Header -->
          <tr>
            <td style="background-color:#33450d;padding:36px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;background-color:rgba(255,255,255,0.15);margin-bottom:16px;">
                <span style="color:#fcf9f0;font-size:22px;font-weight:bold;font-family:'Georgia',serif;">AF</span>
              </div>
              <h1 style="margin:0;color:#fcf9f0;font-size:24px;font-weight:normal;font-family:'Georgia',serif;letter-spacing:0.5px;">Archivo Familiar</h1>
              <p style="margin:6px 0 0;color:rgba(252,249,240,0.7);font-size:13px;font-family:'Georgia',serif;">Familia Garcia · De Simón</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 16px;color:#33450d;font-size:20px;font-weight:normal;font-family:'Georgia',serif;">Fuiste invitado/a</h2>
              <p style="margin:0 0 12px;color:#4a4235;font-size:15px;line-height:1.6;">Hola,</p>
              <p style="margin:0 0 24px;color:#4a4235;font-size:15px;line-height:1.6;">
                Recibiste una invitación para acceder al <strong>Archivo Familiar Garcia - De Simón</strong>, un espacio privado con la historia, fotos y videos de la familia.
              </p>
              <p style="margin:0 0 32px;color:#4a4235;font-size:15px;line-height:1.6;">
                Hacé clic en el botón para crear tu contraseña y acceder al sitio:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" style="display:inline-block;background-color:#33450d;color:#fcf9f0;text-decoration:none;padding:14px 36px;border-radius:8px;font-family:'Georgia',serif;font-size:15px;letter-spacing:0.3px;">
                      Establecer mi contraseña
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:32px 0 0;color:#7a6e5f;font-size:13px;line-height:1.6;">
                Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br/>
                <a href="${inviteUrl}" style="color:#785832;word-break:break-all;">${inviteUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="border-top:1px solid #d4c9a8;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;text-align:center;">
              <p style="margin:0;color:#9e9282;font-size:12px;line-height:1.6;">
                Este enlace es personal e intransferible. Expira en 24 horas.<br/>
                Si no esperabas esta invitación, podés ignorar este mensaje.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  const adminId = await verifyAdmin(req)
  if (!adminId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { email, role } = await req.json()
  if (!email || !role) {
    return NextResponse.json({ error: 'Email y rol son requeridos' }, { status: 400 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'

  // Generate invite link without sending Supabase's default email
  const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { redirectTo: `${siteUrl}/perfil` },
  })
  if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 })

  await adminSupabase.from('user_roles').upsert({ user_id: linkData.user.id, role })

  // Send custom email via Gmail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })

  const inviteUrl = linkData.properties.action_link
  const { error: mailError } = await new Promise<{ error: Error | null }>((resolve) => {
    transporter.sendMail({
      from: `"Archivo Familiar" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Invitación al Archivo Familiar Garcia - De Simón',
      html: buildInviteEmail(inviteUrl, email),
    }, (err) => resolve({ error: err }))
  })

  if (mailError) {
    console.error('Error enviando email:', mailError)
    return NextResponse.json({ error: 'Error al enviar el email de invitación' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest) {
  const adminId = await verifyAdmin(req)
  if (!adminId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { userId, role } = await req.json()
  if (!userId || !role) {
    return NextResponse.json({ error: 'userId y rol son requeridos' }, { status: 400 })
  }

  await adminSupabase.from('user_roles').upsert({ user_id: userId, role })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const adminId = await verifyAdmin(req)
  if (!adminId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId es requerido' }, { status: 400 })

  if (userId === adminId) {
    return NextResponse.json({ error: 'No podés eliminar tu propia cuenta' }, { status: 400 })
  }

  await adminSupabase.from('user_roles').delete().eq('user_id', userId)

  const { error } = await adminSupabase.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
