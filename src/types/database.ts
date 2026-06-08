export type Genero = 'masculino' | 'femenino' | 'otro'

export type CategoriaEvento = 'espana' | 'travesia' | 'argentina' | 'familia'

export type CategoriaFoto = 'retratos' | 'documentos' | 'lugares' | 'eventos' | 'vida_cotidiana'

export type TipoFuenteVideo = 'youtube' | 'drive'
export type CategoriaVideo = 'entrevista' | 'video'

export type MotivoFinMatrimonio = 'fallecimiento' | 'divorcio' | null

export type UserRole = 'admin' | 'viewer'

// Tabla: personas
export interface Persona {
  id: string
  nombre: string
  apellido: string
  apellido_casada?: string | null
  fecha_nacimiento?: string | null
  lugar_nacimiento?: string | null
  fecha_fallecimiento?: string | null
  lugar_fallecimiento?: string | null
  genero?: Genero | null

  // Datos de migración
  fecha_emigracion?: string | null
  puerto_salida?: string | null
  puerto_llegada?: string | null
  nombre_barco?: string | null

  // Relaciones
  padre_id?: string | null
  madre_id?: string | null

  // Contenido
  biografia?: string | null
  foto_perfil_url?: string | null

  // Metadata
  created_at: string
  updated_at: string
  created_by?: string | null
}

// Tabla: matrimonios
export interface Matrimonio {
  id: string
  persona1_id: string
  persona2_id: string
  fecha_matrimonio?: string | null
  lugar_matrimonio?: string | null
  fecha_fin?: string | null
  motivo_fin?: MotivoFinMatrimonio
  created_at: string
  updated_at: string
}

// Tabla: eventos
export interface Evento {
  id: string
  titulo: string
  descripcion?: string | null
  fecha: string
  fecha_fin?: string | null
  lugar?: string | null
  categoria: CategoriaEvento
  imagen_url?: string | null
  persona_id?: string | null
  orden: number
  destacado: boolean
  created_at: string
  updated_at: string
  created_by?: string | null
}

// Tabla: fotos
export interface Foto {
  id: string
  titulo: string
  descripcion?: string | null
  fecha_aproximada?: string | null
  lugar?: string | null
  imagen_url: string
  thumbnail_url?: string | null
  categoria?: CategoriaFoto | null
  personas_ids: string[]
  orden: number
  destacada: boolean
  rotacion: 0 | 90 | 180 | 270
  created_at: string
  updated_at: string
  created_by?: string | null
}

// Tabla: videos
export interface Video {
  id: string
  titulo: string
  descripcion?: string | null
  tipo_fuente: TipoFuenteVideo
  categoria: CategoriaVideo
  video_url: string
  video_id?: string | null
  duracion_segundos?: number | null
  thumbnail_url?: string | null
  fecha_grabacion?: string | null
  personas_ids: string[]
  vistas: number
  orden: number
  destacado: boolean
  created_at: string
  updated_at: string
  created_by?: string | null
}

// Tabla: cartas (documentos multi-página escaneados)
export interface Carta {
  id: string
  titulo: string
  descripcion?: string | null
  fecha?: string | null        // texto libre: "circa 1920", "Marzo 1945"
  remitente?: string | null
  destinatario?: string | null
  personas_ids: string[]
  paginas: string[]            // array de URLs públicas (PDFs en Storage)
  orden: number
  destacada: boolean
  created_at: string
  updated_at: string
  created_by?: string | null
}
export type CartaInsert = Omit<Carta, 'id' | 'created_at' | 'updated_at'>
export type CartaUpdate  = Partial<CartaInsert>

// Tabla: user_roles
export interface UserRoleRecord {
  id: string
  user_id: string
  role: UserRole
  created_at: string
}

// Tipos para formularios (sin campos autogenerados)
export type PersonaInsert = Omit<Persona, 'id' | 'created_at' | 'updated_at'>
export type PersonaUpdate = Partial<PersonaInsert>

export type EventoInsert = Omit<Evento, 'id' | 'created_at' | 'updated_at'>
export type EventoUpdate = Partial<EventoInsert>

export type FotoInsert = Omit<Foto, 'id' | 'created_at' | 'updated_at'>
export type FotoUpdate = Partial<FotoInsert>

export type VideoInsert = Omit<Video, 'id' | 'created_at' | 'updated_at'>
export type VideoUpdate = Partial<VideoInsert>

export type MatrimonioInsert = Omit<Matrimonio, 'id' | 'created_at' | 'updated_at'>
export type MatrimonioUpdate = Partial<MatrimonioInsert>

// Persona con relaciones expandidas (para árbol)
export interface PersonaConRelaciones extends Persona {
  padre?: Persona | null
  madre?: Persona | null
  hijos?: Persona[]
  matrimonios?: MatrimonioConConyuge[]
}

export interface MatrimonioConConyuge extends Matrimonio {
  conyuge: Persona
}

// Evento con persona asociada
export interface EventoConPersona extends Evento {
  persona?: Persona | null
}

// Foto con personas asociadas
export interface FotoConPersonas extends Foto {
  personas: Persona[]
}

// Video con personas asociadas
export interface VideoConPersonas extends Video {
  personas: Persona[]
}
