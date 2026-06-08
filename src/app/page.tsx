import Link from 'next/link'

export const dynamic = 'force-dynamic'
import { GitBranch, Clock, Image, Video, Users, Calendar, Camera, Film } from 'lucide-react'
import { getEstadisticas, getEventosDestacados, getFotosDestacadas } from '@/lib/data'

const secciones = [
  {
    title: 'Árbol Genealógico',
    description: 'Explora las conexiones familiares a través de las generaciones',
    href: '/arbol',
    icon: GitBranch,
    color: 'bg-primary',
  },
  {
    title: 'Línea de Tiempo',
    description: 'Recorre los momentos que marcaron nuestra historia',
    href: '/timeline',
    icon: Clock,
    color: 'bg-secondary',
  },
  {
    title: 'Galería de Fotos',
    description: 'Imágenes que capturan recuerdos de todas las épocas',
    href: '/galeria',
    icon: Image,
    color: 'bg-tertiary',
  },
  {
    title: 'Videos',
    description: 'Testimonios en video de quienes vivieron la historia',
    href: '/videos',
    icon: Video,
    color: 'bg-primary-container',
  },
]

export default async function HomePage() {
  // Obtener estadísticas (si la conexión a Supabase está configurada)
  let stats = { personas: 0, eventos: 0, fotos: 0, videos: 0 }
  try {
    stats = await getEstadisticas()
  } catch {
    // Si no hay conexión, usar valores por defecto
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-surface-container py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tertiary-fixed text-on-surface mb-8">
              <span className="text-body-sm font-medium">Familia Garcia - De Simón</span>
            </div>

            {/* Título principal */}
            <h1 className="font-serif text-display-md md:text-display-lg text-on-surface mb-6">
              Archivo Familiar
            </h1>

            {/* Subtítulo */}
            <p className="text-body-lg md:text-title-lg text-on-surface-variant max-w-2xl mx-auto mb-10">
              Un viaje a través del tiempo para preservar las historias, los rostros y
              los momentos que forjaron nuestra familia.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/arbol" className="btn-primary">
                <GitBranch className="h-5 w-5" />
                Explorar el Árbol
              </Link>
              <Link href="/timeline" className="btn-outline">
                <Clock className="h-5 w-5" />
                Ver la Historia
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative element */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-surface to-transparent" />
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard icon={Users} value={stats.personas} label="Personas" />
            <StatCard icon={Calendar} value={stats.eventos} label="Eventos" />
            <StatCard icon={Camera} value={stats.fotos} label="Fotos" />
            <StatCard icon={Film} value={stats.videos} label="Videos" />
          </div>
        </div>
      </section>

      {/* Secciones Grid */}
      <section className="py-16 lg:py-24 bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-headline-lg md:text-display-sm text-on-surface mb-4">
              Explora el Archivo
            </h2>
            <p className="text-body-lg text-on-surface-variant max-w-xl mx-auto">
              Cada sección te acerca más a conocer de dónde venimos
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {secciones.map((seccion) => {
              const Icon = seccion.icon
              return (
                <Link
                  key={seccion.href}
                  href={seccion.href}
                  className="card group p-6 flex items-start gap-5 hover:scale-[1.02] transition-transform duration-300"
                >
                  <div
                    className={`flex-shrink-0 w-14 h-14 rounded-2xl ${seccion.color} flex items-center justify-center`}
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-serif text-title-lg text-on-surface mb-2 group-hover:text-primary transition-colors">
                      {seccion.title}
                    </h3>
                    <p className="text-body-md text-on-surface-variant">
                      {seccion.description}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-16 lg:py-24 bg-surface-container">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <blockquote className="font-serif text-headline-md md:text-headline-lg text-on-surface italic">
            "Conocer de dónde venimos nos ayuda a entender quiénes somos
            y hacia dónde vamos."
          </blockquote>
          <div className="mt-6 w-16 h-1 bg-tertiary mx-auto rounded-full" />
        </div>
      </section>
    </div>
  )
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>
  value: number
  label: string
}) {
  return (
    <div className="card p-6 text-center">
      <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
      <p className="font-serif text-headline-md text-on-surface">{value}</p>
      <p className="text-body-sm text-outline">{label}</p>
    </div>
  )
}
