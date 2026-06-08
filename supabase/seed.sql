-- ============================================
-- ARCHIVO FAMILIAR - Datos de Ejemplo
-- Ejecutar después del schema.sql
-- ============================================

-- ============================================
-- PERSONAS (Árbol genealógico de ejemplo)
-- ============================================

-- Primera generación (los que emigraron)
INSERT INTO personas (id, nombre, apellido, genero, fecha_nacimiento, lugar_nacimiento, fecha_fallecimiento, lugar_fallecimiento, fecha_emigracion, puerto_salida, puerto_llegada, nombre_barco, biografia)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Antonio', 'Fernández', 'masculino', '1885-03-12', 'Vigo, Galicia, España', '1962-08-20', 'Buenos Aires, Argentina', '1910-04-15', 'Puerto de Vigo', 'Puerto de Buenos Aires', 'SS Principessa Mafalda', 'Antonio llegó a Argentina con apenas 25 años, buscando un futuro mejor. Trabajó en el campo durante sus primeros años y luego se estableció en Buenos Aires donde abrió una pequeña tienda de comestibles. Nunca olvidó su tierra natal y mantuvo correspondencia con su familia en Galicia hasta el final de sus días.'),

  ('22222222-2222-2222-2222-222222222222', 'Carmen', 'López', 'femenino', '1890-07-22', 'Pontevedra, Galicia, España', '1975-12-03', 'Buenos Aires, Argentina', '1912-09-10', 'Puerto de Vigo', 'Puerto de Buenos Aires', 'SS Reina Victoria Eugenia', 'Carmen emigró siguiendo a su prometido Antonio. Se casaron al poco tiempo de su llegada. Fue una mujer fuerte que crió a sus hijos mientras ayudaba en el negocio familiar. Era conocida en el barrio por sus empanadas gallegas.');

-- Segunda generación
INSERT INTO personas (id, nombre, apellido, genero, fecha_nacimiento, lugar_nacimiento, fecha_fallecimiento, lugar_fallecimiento, padre_id, madre_id, biografia)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'José', 'Fernández', 'masculino', '1915-02-28', 'Buenos Aires, Argentina', '1998-05-14', 'Buenos Aires, Argentina', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'José fue el primogénito de Antonio y Carmen. Heredó el negocio familiar y lo expandió. Fue un hombre trabajador que siempre valoró la educación de sus hijos.'),

  ('44444444-4444-4444-4444-444444444444', 'María', 'Fernández', 'femenino', '1918-11-05', 'Buenos Aires, Argentina', '2005-03-22', 'Buenos Aires, Argentina', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'María fue maestra durante más de 40 años. Dedicó su vida a la educación y nunca se casó. Era la guardiana de las historias familiares.');

-- Cónyuge de José
INSERT INTO personas (id, nombre, apellido, apellido_casada, genero, fecha_nacimiento, lugar_nacimiento, fecha_fallecimiento, lugar_fallecimiento, biografia)
VALUES
  ('55555555-5555-5555-5555-555555555555', 'Elena', 'Martínez', 'Fernández', 'femenino', '1920-06-15', 'Rosario, Santa Fe, Argentina', '2010-09-08', 'Buenos Aires, Argentina', 'Elena conoció a José en una fiesta del barrio. Se casaron en 1942 y tuvieron tres hijos. Era una excelente cocinera y mantuvo vivas las tradiciones gallegas en la familia.');

-- Tercera generación
INSERT INTO personas (id, nombre, apellido, genero, fecha_nacimiento, lugar_nacimiento, padre_id, madre_id, biografia)
VALUES
  ('66666666-6666-6666-6666-666666666666', 'Carlos', 'Fernández', 'masculino', '1945-04-20', 'Buenos Aires, Argentina', '33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'Carlos estudió ingeniería y trabajó en la industria automotriz. Viajó a España varias veces para conocer la tierra de sus abuelos.'),

  ('77777777-7777-7777-7777-777777777777', 'Ana', 'Fernández', 'femenino', '1948-12-10', 'Buenos Aires, Argentina', '33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'Ana siguió los pasos de su tía María y se dedicó a la docencia. Fue directora de escuela y escribió varios libros sobre pedagogía.'),

  ('88888888-8888-8888-8888-888888888888', 'Roberto', 'Fernández', 'masculino', '1952-08-03', 'Buenos Aires, Argentina', '33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'Roberto emigró a España en los años 70, cerrando el círculo que sus abuelos habían abierto décadas antes. Vive en Madrid.');

-- ============================================
-- MATRIMONIOS
-- ============================================

INSERT INTO matrimonios (persona1_id, persona2_id, fecha_matrimonio, lugar_matrimonio)
VALUES
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '1913-05-20', 'Parroquia San José, Buenos Aires'),
  ('33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', '1942-11-15', 'Iglesia de la Merced, Buenos Aires');

-- ============================================
-- EVENTOS (Línea de tiempo)
-- ============================================

INSERT INTO eventos (titulo, descripcion, fecha, lugar, categoria, destacado)
VALUES
  -- España
  ('Nacimiento de Antonio Fernández', 'Antonio nace en una pequeña aldea cerca de Vigo, en el seno de una familia de pescadores.', '1885-03-12', 'Vigo, Galicia', 'espana', true),
  ('Nacimiento de Carmen López', 'Carmen nace en Pontevedra, hija de comerciantes locales.', '1890-07-22', 'Pontevedra, Galicia', 'espana', false),
  ('Antonio y Carmen se conocen', 'En la feria de San Roque, Antonio conoce a Carmen. Comienza un noviazgo que durará hasta su emigración.', '1908-08-16', 'Pontevedra, Galicia', 'espana', false),

  -- Travesía
  ('Antonio embarca hacia América', 'Con 25 años y una maleta de cartón, Antonio sube al SS Principessa Mafalda rumbo a Buenos Aires. El viaje dura 21 días.', '1910-04-15', 'Puerto de Vigo', 'travesia', true),
  ('Carmen emprende el viaje', 'Dos años después, Carmen se decide a cruzar el Atlántico para reunirse con Antonio.', '1912-09-10', 'Puerto de Vigo', 'travesia', true),
  ('Llegada de Carmen a Buenos Aires', 'Carmen desembarca en el Puerto de Buenos Aires. Antonio la espera con un ramo de flores.', '1912-10-01', 'Puerto de Buenos Aires', 'travesia', false),

  -- Argentina
  ('Boda de Antonio y Carmen', 'Se casan en una modesta ceremonia en la Parroquia San José. Asisten otros inmigrantes gallegos del barrio.', '1913-05-20', 'Buenos Aires', 'argentina', true),
  ('Apertura de la tienda "El Gallego"', 'Antonio abre su tienda de comestibles en el barrio de San Telmo. Será el sustento de la familia por décadas.', '1920-03-01', 'San Telmo, Buenos Aires', 'argentina', false),
  ('Nacimiento del primer nieto', 'Nace Carlos, el primer nieto de Antonio y Carmen. Gran alegría en la familia.', '1945-04-20', 'Buenos Aires', 'argentina', false),

  -- Familia
  ('Bodas de Oro de Antonio y Carmen', 'La familia celebra los 50 años de casados de los abuelos con una gran fiesta.', '1963-05-20', 'Buenos Aires', 'familia', true),
  ('Roberto viaja a España', 'Roberto, nieto de Antonio, viaja a Galicia para conocer la tierra de sus ancestros. Visita la aldea donde nació su abuelo.', '1978-07-15', 'Vigo, Galicia', 'familia', false),
  ('Reunión familiar del centenario', 'La familia se reúne para conmemorar los 100 años de la llegada de Antonio a Argentina.', '2010-04-15', 'Buenos Aires', 'familia', true);

-- ============================================
-- FOTOS
-- ============================================

-- Nota: Estas URLs son de ejemplo. Reemplazar con URLs reales de Google Drive
INSERT INTO fotos (titulo, descripcion, fecha_aproximada, lugar, categoria, imagen_url, destacada, personas_ids)
VALUES
  ('Antonio joven en Galicia', 'Retrato de Antonio antes de emigrar, con su traje de domingo.', 'circa 1908', 'Vigo, España', 'retratos', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', true, ARRAY['11111111-1111-1111-1111-111111111111']::UUID[]),

  ('Carmen de joven', 'Carmen con 18 años, fotografía tomada en Pontevedra.', 'circa 1908', 'Pontevedra, España', 'retratos', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400', false, ARRAY['22222222-2222-2222-2222-222222222222']::UUID[]),

  ('Boda de Antonio y Carmen', 'Foto oficial de la boda en la Parroquia San José.', '1913', 'Buenos Aires', 'eventos', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400', true, ARRAY['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222']::UUID[]),

  ('La tienda El Gallego', 'Frente de la tienda de comestibles de la familia.', 'años 20', 'San Telmo, Buenos Aires', 'lugares', 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400', false, ARRAY[]::UUID[]),

  ('Familia completa', 'Antonio, Carmen y sus hijos José y María.', 'circa 1925', 'Buenos Aires', 'retratos', 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400', true, ARRAY['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444']::UUID[]),

  ('Pasaporte de Antonio', 'Documento de viaje usado para emigrar a Argentina.', '1910', 'España', 'documentos', 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400', false, ARRAY['11111111-1111-1111-1111-111111111111']::UUID[]),

  ('Bodas de oro', 'Antonio y Carmen celebrando 50 años de casados.', '1963', 'Buenos Aires', 'eventos', 'https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?w=400', true, ARRAY['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222']::UUID[]),

  ('Casa familiar en Galicia', 'La casa donde nació Antonio, fotografiada por Roberto en su viaje de 1978.', '1978', 'Vigo, España', 'lugares', 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400', false, ARRAY[]::UUID[]);

-- ============================================
-- VIDEOS
-- ============================================

-- Nota: Estos son IDs de ejemplo. Reemplazar con videos reales
INSERT INTO videos (titulo, descripcion, tipo_fuente, video_url, video_id, duracion_segundos, fecha_grabacion, destacado, personas_ids)
VALUES
  ('Entrevista a la tía María', 'María Fernández cuenta historias de sus padres y su infancia en Buenos Aires. Grabado en su casa.', 'youtube', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ', 1847, '1995-08-20', true, ARRAY['44444444-4444-4444-4444-444444444444']::UUID[]),

  ('Roberto visita Galicia', 'Video del viaje de Roberto a la tierra de sus abuelos. Incluye imágenes de la aldea natal de Antonio.', 'youtube', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ', 923, '1978-07-20', true, ARRAY['88888888-8888-8888-8888-888888888888']::UUID[]),

  ('Reunión familiar 2010', 'Celebración del centenario de la llegada de Antonio a Argentina.', 'youtube', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ', 2156, '2010-04-15', false, ARRAY['66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888']::UUID[]);

-- ============================================
-- FIN DE DATOS DE EJEMPLO
-- ============================================
