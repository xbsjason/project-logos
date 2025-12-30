/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic Tokens - The Core of the Design System
        background: {
          DEFAULT: 'var(--bg-background)',   // Main app background
          muted: 'var(--bg-muted)',          // Slightly distinct areas
          deep: 'var(--bg-deep)',            // High contrast areas
        },
        surface: {
          DEFAULT: 'var(--bg-surface)',      // Cards, Modals
          highlight: 'var(--bg-surface-highlight)', // Hover states
          muted: 'var(--bg-surface-muted)',  // Secondary surfaces
        },
        text: {
          primary: 'var(--text-primary)',    // Main headings
          secondary: 'var(--text-secondary)',// Body text
          muted: 'var(--text-muted)',        // Meta info
          accent: 'var(--text-accent)',      // Links, highlights
          inverse: 'var(--text-inverse)',    // Text on dark backgrounds
        },
        border: {
          DEFAULT: 'var(--border-default)',
          subtle: 'var(--border-subtle)',
          highlight: 'var(--border-highlight)',
        },
        // Brand Palette (used via variables mostly, but exposed here for utilities)
        cream: {
          50: '#FEFEFA',
          100: '#F5F5F0',
          200: '#EBEBE0',
          300: '#D6D6C2',
        },
        gold: {
          DEFAULT: '#C8A951',
          light: '#E5C860',
          dark: '#B39122',
          500: '#D4AF37',
        },
        navy: {
          DEFAULT: '#0B1120',
          light: '#1a2236',
          dark: '#020617',
        },
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'sans-serif'],
        serif: ['Merriweather', 'Crimson Text', 'serif'],
        ancient: ['Cinzel', 'serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem', // Softer feel
        '4xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 15px rgba(212, 175, 55, 0.15)',
        'deep': '0 10px 30px -5px rgba(0, 0, 0, 0.2)',
      },
      aspectRatio: {
        '4/5': '4 / 5',
        '9/16': '9 / 16',
      }
    },
  },
  darkMode: ['class', '[data-theme="night"]'], // Support class logic if needed, but primary is attribute
  plugins: [],
}
