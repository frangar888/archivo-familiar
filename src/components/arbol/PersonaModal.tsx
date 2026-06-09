'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X, MapPin, Ship, Calendar, Heart, Users } from 'lucide-react'
import { cn, getInternalFileUrl, formatDate, calcularEdad, getNombreCompleto } from '@/lib/utils'
import type { Persona, Foto, Matrimonio } from '@/types'
import { supabase } from '@/lib/supabase'

interface PersonaModalProps {
  persona: Persona
  personas: Persona[]
  matrimonios: Matrimonio[]
  onClose: () => void
}

export function PersonaModal({ persona, personas, matrimonios, onClose }: PersonaModalProps) {
  const [fotos, setFotos] = useState<Foto[]>([])
  const [loading, setLoading] = useState(true)

  const padre = persona.padre_id ? (personas.find((p) => p.id === persona.padre_id) ?? null) : null
  const madre = persona.madre_id ? (personas.find((p) => p.id === persona.madre_id) ?? null) : null
  const conyugesData = matrimonios
    .filter((m) => m.persona1_id === persona.id || m.persona2_id === persona.id)
    .map((m) => {
      const cid = m.persona1_id === persona.id ? m.persona2_id : m.persona1_id
      return { m, conyuge: personas.find((p) => p.id === cid) ?? null }
    })
    .filter(({ conyuge }) => conyuge !== null)

  const edad = calcularEdad(persona.fecha_nacimiento, persona.fecha_fallecimiento)
  const estaVivo = !persona.fecha_fallecimiento
  const nombreCompleto = getNombreCompleto(
    persona.nombre,
    persona.apellido,
    persona.apellido_casada
  )

  useEffect(() => {
    async function fetchFotos() {
      const { data } = await supabase
        .from('fotos')
        .select('*')
        .contains('personas_ids', [persona.id])
        .limit(6)

      setFotos(data || [])
      setLoading(false)
    }

    fetchFotos()
  }, [persona.id])

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full max-w-2xl max-h-[90vh] overflow-y-auto',
          'bg-surface-container-lowest rounded-2xl shadow-modal',
          'animate-fade-in'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con foto */}
        <div className="relative h-48 bg-surface-container">
          {persona.foto_perfil_url ? (
            <Image
              src={getInternalFileUrl(persona.foto_perfil_url)}
              alt={nombreCompleto}
              fill
              className="object-cover opacity-30"
            />
          ) : null}

          {/* Avatar */}
          <div className="absolute -bottom-12 left-6">
            <div
              className={cn(
                'w-24 h-24 rounded-full overflow-hidden',
                'border-4 border-surface-container-lowest shadow-card',
                persona.genero === 'femenino' ? 'bg-secondary/20' : 'bg-primary/20'
              )}
            >
              {persona.foto_perfil_url ? (
                <Image
                  src={getInternalFileUrl(persona.foto_perfil_url)}
                  alt={nombreCompleto}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Users
                    className={cn(
                      'w-10 h-10',
                      persona.genero === 'femenino' ? 'text-secondary' : 'text-primary'
                    )}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="pt-16 px-6 pb-6">
          {/* Nombre y estado */}
          <div className="mb-6">
            <h2 className="font-serif text-headline-md text-on-surface">
              {nombreCompleto}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              {persona.fecha_nacimiento && (
                <span className="badge-date">
                  {formatDate(persona.fecha_nacimiento)}
                  {persona.fecha_fallecimiento
                    ? ` - ${formatDate(persona.fecha_fallecimiento)}`
                    : ''}
                </span>
              )}
              {edad !== null && (
                <span className="text-body-sm text-on-surface-variant">
                  {estaVivo ? `${edad} años` : `Vivió ${edad} años`}
                </span>
              )}
            </div>
          </div>

          {/* Familia: padres y cónyuge/s */}
          {(padre || madre || conyugesData.length > 0) && (
            <div className="mb-6 p-4 rounded-xl bg-surface-container">
              <h3 className="font-serif text-title-md text-on-surface mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Familia
              </h3>
              <div className="space-y-1.5">
                {padre && (
                  <div className="flex items-center gap-2 text-body-md">
                    <span className="w-16 text-body-sm text-outline shrink-0">Padre</span>
                    <span className="text-on-surface font-medium">{padre.nombre} {padre.apellido}</span>
                    {padre.fecha_nacimiento && (
                      <span className="text-body-sm text-outline">({padre.fecha_nacimiento.split('-')[0]})</span>
                    )}
                  </div>
                )}
                {madre && (
                  <div className="flex items-center gap-2 text-body-md">
                    <span className="w-16 text-body-sm text-outline shrink-0">Madre</span>
                    <span className="text-on-surface font-medium">{madre.nombre} {madre.apellido}</span>
                    {madre.fecha_nacimiento && (
                      <span className="text-body-sm text-outline">({madre.fecha_nacimiento.split('-')[0]})</span>
                    )}
                  </div>
                )}
                {conyugesData.map(({ m, conyuge: c }) => c && (
                  <div key={m.id} className="flex items-center gap-2 text-body-md">
                    <span className="w-16 text-body-sm text-outline shrink-0">Cónyuge</span>
                    <span className="text-on-surface font-medium">{c.nombre} {c.apellido}</span>
                    {m.fecha_matrimonio && (
                      <span className="text-body-sm text-outline">({m.fecha_matrimonio.split('-')[0]})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Datos de migración */}
          {(persona.fecha_emigracion || persona.puerto_salida || persona.nombre_barco) && (
            <div className="mb-6 p-4 rounded-xl bg-surface-container">
              <h3 className="font-serif text-title-md text-on-surface mb-3 flex items-center gap-2">
                <Ship className="w-5 h-5 text-secondary" />
                Travesía
              </h3>
              <div className="grid gap-2 text-body-md">
                {persona.nombre_barco && (
                  <p className="text-on-surface-variant">
                    <span className="font-medium text-on-surface">Barco:</span>{' '}
                    {persona.nombre_barco}
                  </p>
                )}
                {persona.fecha_emigracion && (
                  <p className="text-on-surface-variant">
                    <span className="font-medium text-on-surface">Fecha:</span>{' '}
                    {formatDate(persona.fecha_emigracion)}
                  </p>
                )}
                {persona.puerto_salida && (
                  <p className="text-on-surface-variant">
                    <span className="font-medium text-on-surface">Desde:</span>{' '}
                    {persona.puerto_salida}
                  </p>
                )}
                {persona.puerto_llegada && (
                  <p className="text-on-surface-variant">
                    <span className="font-medium text-on-surface">Hasta:</span>{' '}
                    {persona.puerto_llegada}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Lugares */}
          {(persona.lugar_nacimiento || persona.lugar_fallecimiento) && (
            <div className="mb-6 flex flex-wrap gap-4">
              {persona.lugar_nacimiento && (
                <div className="flex items-center gap-2 text-body-md text-on-surface-variant">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>Nació en {persona.lugar_nacimiento}</span>
                </div>
              )}
              {persona.lugar_fallecimiento && (
                <div className="flex items-center gap-2 text-body-md text-on-surface-variant">
                  <Heart className="w-4 h-4 text-secondary" />
                  <span>Falleció en {persona.lugar_fallecimiento}</span>
                </div>
              )}
            </div>
          )}

          {/* Biografía */}
          {persona.biografia && (
            <div className="mb-6">
              <h3 className="font-serif text-title-md text-on-surface mb-3">
                Historia
              </h3>
              <p className="text-body-md text-on-surface-variant leading-relaxed whitespace-pre-line">
                {persona.biografia}
              </p>
            </div>
          )}

          {/* Fotos */}
          {fotos.length > 0 && (
            <div>
              <h3 className="font-serif text-title-md text-on-surface mb-3">
                Fotos
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {fotos.map((foto) => (
                  <div
                    key={foto.id}
                    className="relative aspect-square rounded-photo overflow-hidden bg-surface-container"
                  >
                    <Image
                      src={getInternalFileUrl(foto.imagen_url)}
                      alt={foto.titulo}
                      fill
                      className="object-cover photo-historic"
                      sizes="150px"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
