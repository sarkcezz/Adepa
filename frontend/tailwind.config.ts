import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        flame:    { DEFAULT: '#C0281A', 50: '#FCEAE7', 100: '#F9D0CA', 200: '#F3A199', 300: '#EB7367', 400: '#DC4A3B', 500: '#C0281A', 600: '#A02216', 700: '#7F1B11', 800: '#5F140D', 900: '#3F0D08' },
        gold:     { DEFAULT: '#D4920A', 50: '#FBEFD2', 100: '#F7DEA5', 200: '#F0C56B', 300: '#E5AC36', 400: '#DCA01D', 500: '#D4920A', 600: '#A87308', 700: '#7C5506', 800: '#503704', 900: '#241902' },
        night:    { DEFAULT: '#1A1A1A', 50: '#F5F5F5', 100: '#E5E5E5', 200: '#D4D4D4', 300: '#9A9A9A', 400: '#6B6B6B', 500: '#525252', 600: '#404040', 700: '#262626', 800: '#171717', 900: '#0A0A0A' },
        cream:    '#FAF6EE',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fadeIn:   { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:  { '0%': { transform: 'translateY(12px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideDown:{ '0%': { transform: 'translateY(-12px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        pulseSoft:{ '0%, 100%': { opacity: '1' }, '50%': { opacity: '.7' } },
        floatY:   { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'float-y':    'floatY 4s ease-in-out infinite',
      },
      backgroundImage: {
        'gradient-warm':   'linear-gradient(135deg, #C0281A 0%, #D4920A 100%)',
        'gradient-flame':  'linear-gradient(180deg, #C0281A 0%, #7F1B11 100%)',
        'gradient-night':  'linear-gradient(180deg, #262626 0%, #0A0A0A 100%)',
      },
    },
  },
  plugins: [],
}

export default config
