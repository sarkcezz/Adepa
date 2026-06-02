import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Butcher's Heritage palette ──────────────────────────────────
        // Token names kept (flame/gold/night/cream) so the swap ripples
        // through every page from one place. Values are tinted toward the
        // brand hue — no pure black or white.
        //
        // flame = oxblood (deep wine-red, quality cuts)
        flame:    { DEFAULT: '#8E2A2B', 50: '#FBF0F0', 100: '#F4DADB', 200: '#E6B1B2', 300: '#D6868A', 400: '#BC5052', 500: '#8E2A2B', 600: '#762122', 700: '#5C1A1B', 800: '#431415', 900: '#2B0D0D' },
        // gold = aged brass (warm metal accent)
        gold:     { DEFAULT: '#B08D3C', 50: '#F8F1DE', 100: '#EFE0B6', 200: '#E0C883', 300: '#CFAE55', 400: '#C09C44', 500: '#B08D3C', 600: '#8C6F2E', 700: '#695322', 800: '#473716', 900: '#261D0B' },
        // sage = heritage butcher green (freshness, the third role)
        sage:     { DEFAULT: '#6B8068', 50: '#EEF2EC', 100: '#D9E1D5', 200: '#B7C5B1', 300: '#93A78B', 400: '#7B9072', 500: '#6B8068', 600: '#556A53', 700: '#425340', 800: '#2F3A2D', 900: '#1D241C' },
        // night = warm charcoal (ink, tinted toward brown not pure black)
        night:    { DEFAULT: '#1A1815', 50: '#F4F2EE', 100: '#E7E2DA', 200: '#D3CCC0', 300: '#9D9488', 400: '#6E665B', 500: '#524B41', 600: '#3D372F', 700: '#292420', 800: '#1F1B17', 900: '#120F0C' },
        // cream = bone (warm off-white base)
        cream:    '#F6F2EA',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans:    ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
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
        'gradient-warm':   'linear-gradient(135deg, #8E2A2B 0%, #B08D3C 100%)',
        'gradient-flame':  'linear-gradient(180deg, #8E2A2B 0%, #5C1A1B 100%)',
        'gradient-night':  'linear-gradient(180deg, #292420 0%, #120F0C 100%)',
      },
    },
  },
  plugins: [],
}

export default config
