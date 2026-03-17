/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          300: '#f5d87a',
          400: '#e8c547',
          500: '#d4a017',
          600: '#b8880f',
          700: '#9a6f09',
        },
        obsidian: {
          50:  '#f2f2f3',
          100: '#e4e4e6',
          200: '#c9c9cd',
          300: '#a0a0a8',
          400: '#6e6e7a',
          500: '#4a4a56',
          600: '#343440',
          700: '#232330',
          800: '#16161f',
          900: '#0d0d14',
          950: '#07070c',
        },
        platinum: {
          100: '#f8f8f8',
          200: '#e8e8ea',
          300: '#c8c8cc',
          400: '#a0a0a8',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'shimmer':      'shimmer 2.5s infinite',
        'pulse-gold':   'pulseGold 2s ease-in-out infinite',
        'cursor-blink': 'cursorBlink 1s step-end infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0'  },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212,160,23,0)'    },
          '50%':      { boxShadow: '0 0 20px 4px rgba(212,160,23,0.25)' },
        },
        cursorBlink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
      },
      boxShadow: {
        'gold-sm': '0 0 12px rgba(212,160,23,0.2)',
        'gold-md': '0 0 30px rgba(212,160,23,0.25)',
        'card':    '0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04) inset',
      },
    },
  },
  plugins: [],
}
