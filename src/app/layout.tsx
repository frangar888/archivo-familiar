import type { Metadata } from 'next'
import { Header, Footer } from '@/components/layout'
import { AuthProvider } from '@/contexts/AuthContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'Archivo Familiar | Familia Garcia - De Simón',
  description:
    'Preservando la historia de nuestra familia de inmigrantes españoles en Argentina. Árbol genealógico, línea de tiempo, fotos históricas y videos.',
  keywords: [
    'genealogía',
    'historia familiar',
    'inmigrantes españoles',
    'Argentina',
    'árbol genealógico',
  ],
  authors: [{ name: 'Familia' }],
  openGraph: {
    title: 'Archivo Familiar',
    description: 'Historia de nuestra familia de inmigrantes españoles en Argentina',
    type: 'website',
    locale: 'es_AR',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
