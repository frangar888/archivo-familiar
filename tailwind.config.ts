import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Paleta Neo-Vintage Heritage (corregida según documento)
      colors: {
        // Colores primarios
        primary: {
          DEFAULT: '#33450d', // Verde oliva oscuro - CTA principal
          container: '#4a5d23',
          'fixed-dim': '#b8cf88',
          fixed: '#d4eca2',
        },
        secondary: {
          DEFAULT: '#785832', // Tierra/marrón
          container: '#fed2a2', // Para botones secondary
        },
        tertiary: {
          DEFAULT: '#523c00', // Dorado oscuro
          fixed: '#ffdf9f', // Para badges de fecha
        },

        // Superficies (fondos) - parchment tones
        surface: {
          DEFAULT: '#fcf9f0', // Parchment - fondo principal
          dim: '#dddad1',
          'container-lowest': '#ffffff', // Cards destacadas
          'container-low': '#f6f3ea', // Cards normales
          'container': '#f1eee5', // Secciones alternadas
          'container-high': '#ebe8df', // Hover states
          'container-highest': '#e5e2da', // Inputs y campos
        },

        // Textos
        'on-surface': {
          DEFAULT: '#1c1c17', // Texto principal (nunca negro puro)
          variant: '#45483c', // Texto secundario
        },

        // Outline
        outline: {
          DEFAULT: '#76786b',
          variant: '#c6c8b8', // Para líneas de timeline
        },

        // Estados de error
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
      },

      // Tipografía - Noto Serif + Manrope
      fontFamily: {
        serif: ['Noto Serif', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        // Escala tipográfica según documento
        'display-lg': ['72px', { lineHeight: '1.1', fontWeight: '900' }],
        'headline-xl': ['60px', { lineHeight: '1.1', fontWeight: '900' }],
        'headline-lg': ['48px', { lineHeight: '1.15', fontWeight: '900' }],
        'headline-md': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'headline-sm': ['28px', { lineHeight: '1.25', fontWeight: '700' }],
        'title-lg': ['24px', { lineHeight: '1.3', fontWeight: '400' }], // italic en uso
        'title-md': ['20px', { lineHeight: '1.4', fontWeight: '500' }],
        'title-sm': ['18px', { lineHeight: '1.4', fontWeight: '500' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'label-lg': ['14px', { lineHeight: '1.4', fontWeight: '600' }],
        'label-md': ['12px', { lineHeight: '1.4', fontWeight: '600' }],
        'label-sm': ['12px', { lineHeight: '1.4', fontWeight: '600' }],
      },

      // Sombras suaves (nunca negras - usar rgba(28,28,23,0.06))
      boxShadow: {
        'card': '0 8px 24px rgba(28, 28, 23, 0.06)',
        'card-hover': '0 12px 32px rgba(28, 28, 23, 0.1)',
        'modal': '0 24px 48px rgba(28, 28, 23, 0.12)',
        'button': '0 4px 12px rgba(28, 28, 23, 0.08)',
      },

      // Border radius
      borderRadius: {
        'card': '0.75rem', // rounded-xl
        'photo': '0.5rem', // rounded-md
        'button': '0.5rem', // rounded-lg
      },

      // Animaciones (300-500ms, sin bounce)
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'card-hover': 'cardHover 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        cardHover: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(-1deg)' },
        },
      },

      // Transiciones
      transitionTimingFunction: {
        'power2': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}

export default config
