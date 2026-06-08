import { createServerClient } from './supabase'
import type {
  Persona,
  Evento,
  Foto,
  Video,
  Matrimonio,
  CategoriaEvento,
  CategoriaFoto,
} from '@/types'

// ============================================
// PERSONAS
// ============================================

export async function getPersonas(): Promise<Persona[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('personas')
    .select('*')
    .order('apellido', { ascending: true })
    .order('nombre', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getPersonaById(id: string): Promise<Persona | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('personas')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function getPersonaConRelaciones(id: string) {
  const supabase = createServerClient()

  // Obtener persona principal
  const { data: persona, error } = await supabase
    .from('personas')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !persona) return null

  // Obtener padre y madre
  const [padre, madre] = await Promise.all([
    persona.padre_id ? getPersonaById(persona.padre_id) : null,
    persona.madre_id ? getPersonaById(persona.madre_id) : null,
  ])

  // Obtener hijos
  const { data: hijos } = await supabase
    .from('personas')
    .select('*')
    .or(`padre_id.eq.${id},madre_id.eq.${id}`)

  // Obtener matrimonios
  const { data: matrimoniosData } = await supabase
    .from('matrimonios')
    .select('*')
    .or(`persona1_id.eq.${id},persona2_id.eq.${id}`)

  const matrimonios = await Promise.all(
    (matrimoniosData || []).map(async (m) => {
      const conyugeId = m.persona1_id === id ? m.persona2_id : m.persona1_id
      const conyuge = await getPersonaById(conyugeId)
      return { ...m, conyuge: conyuge! }
    })
  )

  return {
    ...persona,
    padre,
    madre,
    hijos: hijos || [],
    matrimonios,
  }
}

// ============================================
// EVENTOS
// ============================================

export async function getEventos(categoria?: CategoriaEvento): Promise<Evento[]> {
  const supabase = createServerClient()
  let query = supabase
    .from('eventos')
    .select('*')
    .order('fecha', { ascending: true })

  if (categoria) {
    query = query.eq('categoria', categoria)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getEventoById(id: string): Promise<Evento | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('eventos')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function getEventosDestacados(): Promise<Evento[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('eventos')
    .select('*')
    .eq('destacado', true)
    .order('fecha', { ascending: true })
    .limit(5)

  if (error) throw error
  return data || []
}

// ============================================
// FOTOS
// ============================================

export async function getFotos(categoria?: CategoriaFoto): Promise<Foto[]> {
  const supabase = createServerClient()
  let query = supabase
    .from('fotos')
    .select('*')
    .order('orden', { ascending: true })

  if (categoria) {
    query = query.eq('categoria', categoria)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getFotoById(id: string): Promise<Foto | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('fotos')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function getFotosDestacadas(): Promise<Foto[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('fotos')
    .select('*')
    .eq('destacada', true)
    .order('orden', { ascending: true })
    .limit(6)

  if (error) throw error
  return data || []
}

export async function getFotosByPersona(personaId: string): Promise<Foto[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('fotos')
    .select('*')
    .contains('personas_ids', [personaId])
    .order('orden', { ascending: true })

  if (error) throw error
  return data || []
}

// ============================================
// VIDEOS
// ============================================

export async function getVideos(): Promise<Video[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('orden', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getVideoById(id: string): Promise<Video | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function getVideosDestacados(): Promise<Video[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('destacado', true)
    .order('orden', { ascending: true })
    .limit(3)

  if (error) throw error
  return data || []
}

// ============================================
// CARTAS
// ============================================

export async function getCartas(): Promise<import('@/types').Carta[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('cartas')
    .select('*')
    .order('orden', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// ============================================
// MATRIMONIOS
// ============================================

export async function getMatrimonios(): Promise<Matrimonio[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('matrimonios')
    .select('*')

  if (error) throw error
  return data || []
}

// ============================================
// ESTADÍSTICAS
// ============================================

export async function getEstadisticas() {
  const supabase = createServerClient()

  const [personas, eventos, fotos, videos] = await Promise.all([
    supabase.from('personas').select('id', { count: 'exact' }),
    supabase.from('eventos').select('id', { count: 'exact' }),
    supabase.from('fotos').select('id', { count: 'exact' }),
    supabase.from('videos').select('id', { count: 'exact' }),
  ])

  return {
    personas: personas.count || 0,
    eventos: eventos.count || 0,
    fotos: fotos.count || 0,
    videos: videos.count || 0,
  }
}
