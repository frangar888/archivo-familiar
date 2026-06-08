-- ============================================
-- ARCHIVO FAMILIAR - Schema de Base de Datos
-- Supabase (PostgreSQL)
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: personas
-- Cada nodo del árbol genealógico
-- ============================================
CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  apellido_casada VARCHAR(100),
  fecha_nacimiento DATE,
  lugar_nacimiento VARCHAR(200),
  fecha_fallecimiento DATE,
  lugar_fallecimiento VARCHAR(200),
  genero VARCHAR(20) CHECK (genero IN ('masculino', 'femenino', 'otro')),

  -- Datos de migración
  fecha_emigracion DATE,
  puerto_salida VARCHAR(100),
  puerto_llegada VARCHAR(100),
  nombre_barco VARCHAR(100),

  -- Relaciones familiares
  padre_id UUID REFERENCES personas(id) ON DELETE SET NULL,
  madre_id UUID REFERENCES personas(id) ON DELETE SET NULL,

  -- Contenido
  biografia TEXT,
  foto_perfil_url TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_personas_apellido ON personas(apellido);
CREATE INDEX idx_personas_padre ON personas(padre_id);
CREATE INDEX idx_personas_madre ON personas(madre_id);

-- ============================================
-- TABLA: matrimonios
-- Vínculos conyugales entre personas
-- ============================================
CREATE TABLE matrimonios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  persona1_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  persona2_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  fecha_matrimonio DATE,
  lugar_matrimonio VARCHAR(200),
  fecha_fin DATE, -- NULL si sigue vigente
  motivo_fin VARCHAR(50) CHECK (motivo_fin IN ('fallecimiento', 'divorcio', NULL)),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Evitar duplicados
  CONSTRAINT unique_matrimonio UNIQUE (persona1_id, persona2_id)
);

CREATE INDEX idx_matrimonios_persona1 ON matrimonios(persona1_id);
CREATE INDEX idx_matrimonios_persona2 ON matrimonios(persona2_id);

-- ============================================
-- TABLA: eventos
-- Hitos de la línea de tiempo familiar
-- ============================================
CREATE TABLE eventos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  fecha DATE NOT NULL,
  fecha_fin DATE, -- Para eventos con duración
  lugar VARCHAR(200),

  -- Categorización
  categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('espana', 'travesia', 'argentina', 'familia')),

  -- Imagen destacada
  imagen_url TEXT,

  -- Relación opcional con persona
  persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,

  -- Metadata
  orden INT DEFAULT 0, -- Para ordenamiento manual
  destacado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_eventos_fecha ON eventos(fecha);
CREATE INDEX idx_eventos_categoria ON eventos(categoria);
CREATE INDEX idx_eventos_persona ON eventos(persona_id);

-- ============================================
-- TABLA: fotos
-- Fotos y documentos históricos
-- ============================================
CREATE TABLE fotos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  fecha_aproximada VARCHAR(50), -- "1920", "circa 1935", "años 40"
  lugar VARCHAR(200),

  -- URL de la imagen (Google Drive o Supabase Storage)
  imagen_url TEXT NOT NULL,
  thumbnail_url TEXT,

  -- Categorización
  categoria VARCHAR(50) CHECK (categoria IN ('retratos', 'documentos', 'lugares', 'eventos', 'vida_cotidiana')),

  -- Personas en la foto
  personas_ids UUID[] DEFAULT '{}',

  -- Metadata
  orden INT DEFAULT 0,
  destacada BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_fotos_categoria ON fotos(categoria);
CREATE INDEX idx_fotos_fecha ON fotos(fecha_aproximada);

-- ============================================
-- TABLA: videos
-- Entrevistas y testimonios grabados
-- ============================================
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,

  -- Fuente del video
  tipo_fuente VARCHAR(20) NOT NULL CHECK (tipo_fuente IN ('youtube', 'drive')),
  video_url TEXT NOT NULL,
  video_id VARCHAR(100), -- ID de YouTube o Drive

  -- Metadata del video
  duracion_segundos INT,
  thumbnail_url TEXT,
  fecha_grabacion DATE,

  -- Personas entrevistadas
  personas_ids UUID[] DEFAULT '{}',

  -- Metadata
  orden INT DEFAULT 0,
  destacado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_videos_tipo ON videos(tipo_fuente);

-- ============================================
-- TABLA: user_roles
-- Roles de usuario (admin/viewer)
-- ============================================
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_role UNIQUE (user_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_personas_updated_at
  BEFORE UPDATE ON personas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matrimonios_updated_at
  BEFORE UPDATE ON matrimonios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_eventos_updated_at
  BEFORE UPDATE ON eventos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fotos_updated_at
  BEFORE UPDATE ON fotos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE matrimonios ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Función para verificar si el usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- POLÍTICAS DE ACCESO
-- ============================================

-- PERSONAS: Lectura pública, escritura solo admins
CREATE POLICY "Personas: lectura pública" ON personas
  FOR SELECT USING (true);

CREATE POLICY "Personas: insertar solo admins" ON personas
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Personas: actualizar solo admins" ON personas
  FOR UPDATE USING (is_admin());

CREATE POLICY "Personas: eliminar solo admins" ON personas
  FOR DELETE USING (is_admin());

-- MATRIMONIOS: Lectura pública, escritura solo admins
CREATE POLICY "Matrimonios: lectura pública" ON matrimonios
  FOR SELECT USING (true);

CREATE POLICY "Matrimonios: insertar solo admins" ON matrimonios
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Matrimonios: actualizar solo admins" ON matrimonios
  FOR UPDATE USING (is_admin());

CREATE POLICY "Matrimonios: eliminar solo admins" ON matrimonios
  FOR DELETE USING (is_admin());

-- EVENTOS: Lectura pública, escritura solo admins
CREATE POLICY "Eventos: lectura pública" ON eventos
  FOR SELECT USING (true);

CREATE POLICY "Eventos: insertar solo admins" ON eventos
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Eventos: actualizar solo admins" ON eventos
  FOR UPDATE USING (is_admin());

CREATE POLICY "Eventos: eliminar solo admins" ON eventos
  FOR DELETE USING (is_admin());

-- FOTOS: Lectura pública, escritura solo admins
CREATE POLICY "Fotos: lectura pública" ON fotos
  FOR SELECT USING (true);

CREATE POLICY "Fotos: insertar solo admins" ON fotos
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Fotos: actualizar solo admins" ON fotos
  FOR UPDATE USING (is_admin());

CREATE POLICY "Fotos: eliminar solo admins" ON fotos
  FOR DELETE USING (is_admin());

-- VIDEOS: Lectura pública, escritura solo admins
CREATE POLICY "Videos: lectura pública" ON videos
  FOR SELECT USING (true);

CREATE POLICY "Videos: insertar solo admins" ON videos
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Videos: actualizar solo admins" ON videos
  FOR UPDATE USING (is_admin());

CREATE POLICY "Videos: eliminar solo admins" ON videos
  FOR DELETE USING (is_admin());

-- USER_ROLES: Solo admins pueden ver y modificar
CREATE POLICY "Roles: usuarios ven su propio rol" ON user_roles
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Roles: solo admins modifican" ON user_roles
  FOR ALL USING (is_admin());

-- ============================================
-- DATOS DE EJEMPLO (opcional)
-- ============================================

-- Descomentar para insertar datos de prueba
/*
INSERT INTO personas (nombre, apellido, genero, fecha_nacimiento, lugar_nacimiento, biografia)
VALUES
  ('José', 'García', 'masculino', '1890-03-15', 'Galicia, España', 'Fundador de la familia en Argentina. Emigró en 1912.'),
  ('María', 'López', 'femenino', '1895-07-22', 'Asturias, España', 'Llegó a Argentina en 1913.');
*/
