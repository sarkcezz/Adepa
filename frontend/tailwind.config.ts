import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        flame:    { DEFAULT: '#C0281A', 50: '#FCEAE7', 100: '#F9D0CA', 200: '#F3A199', 300: '#EB7367', 400: '#DC4A3B', 500: '#C0281A', 600: '#A02216', 700: '#7F1B11', 800: '#5F140D', 900: '#3F0D08' },
        gold:     { DEFAULT: '#D4920A', 50: '#FBEFD2', 100: '#F7DEA5', 200: '#F0C56B', 300: '#E5AC36', 400: '#DCA01D', 500: '#D4920A', 600: '#A87308', 700: '#7C5506', 800: '#503704', 900: '#241902' },
        night:    { DEFAULT: '#1A1A1A', 50: '#F5F5F5', 100: '#E5E5E5', 200: '#D4D4D4', 300: '#A3A3A3', 400: '#737373', 500: '#525252', 600: '#404040', 700: '#262626', 800: '#171717', 900: '#0A0A0A' },
        cream:    '#FAF6EE',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        pulseSoft: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '.7' } },
      },
      animation: {
        'fade-in':  'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
