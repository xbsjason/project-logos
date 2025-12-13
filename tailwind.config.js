/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic Tokens
        background: 'var(--bg-background)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          highlight: 'var(--bg-surface-highlight)',
        },
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        accent: 'var(--text-accent)',

        cream: {
          50: '#FDFDFB', // Lighter off-white
          100: '#F5F5F0', // Base off-white
          200: '#EBEBE0',
          300: '#D6D6C2',
          DEFAULT: '#F5F5F0'
        },
        gold: {
          DEFAULT: '#D4AF37', // Metallic Gold
          light: '#E5C860',
          dark: '#B39122',
          500: '#D4AF37', // Add standard weight for convenience
        },
        navy: {
          DEFAULT: '#0B1120', // Rich deep navy
          light: '#1a2236',   // Lighter navy for cards/overlays
          dark: '#020617',    // Very dark navy (almost black)
          accent: '#0A84FF',  // Keep the blue accent or adjust slightly
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        blue: {
          // Adding a specific blue palette if needed, otherwise using standard Tailwind blue or navy.accent
          accent: '#3B82F6', // Standard pleasant blue
          500: '#3B82F6',
        },
        zinc: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        }
      },
      textColor: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        accent: 'var(--text-accent)',
        inverse: 'var(--text-inverse)',
        // Inherit others
      },
      borderColor: {
        DEFAULT: 'var(--border-default)',
        highlight: 'var(--border-highlight)',
      },
      fontFamily: {
        sans: ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Inter', 'sans-serif'],
        serif: ['New York', 'Charter', 'Georgia', 'serif'],
      }
    },
  },
  darkMode: 'class',
  plugins: [],
}
