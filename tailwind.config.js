/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        ink: '#0F172A',
        muted: '#64748B',
        line: '#E2E8F0',
        canvas: '#F8FAFC',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.04)',
        lift: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -8px rgba(15, 23, 42, 0.10)',
        card: '0 1px 1px rgba(15, 23, 42, 0.04), 0 2px 4px rgba(15, 23, 42, 0.04), 0 12px 24px -6px rgba(15, 23, 42, 0.08), 0 32px 64px -16px rgba(30, 64, 175, 0.12)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'sheet-in': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'card-in-right': {
          from: { opacity: '0', transform: 'translateX(40px) rotate(1.5deg)' },
          to: { opacity: '1', transform: 'translateX(0) rotate(0)' },
        },
        'card-in-left': {
          from: { opacity: '0', transform: 'translateX(-40px) rotate(-1.5deg)' },
          to: { opacity: '1', transform: 'translateX(0) rotate(0)' },
        },
        'card-lift': {
          '0%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-6px) scale(1.025)' },
          '100%': { transform: 'translateY(0) scale(1)' },
        },
        'card-lift-alt': {
          '0%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-6px) scale(1.025)' },
          '100%': { transform: 'translateY(0) scale(1)' },
        },
        'check-draw': { from: { strokeDashoffset: '48' }, to: { strokeDashoffset: '0' } },
        'ring-pop': {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.06)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-5px)' },
          '40%, 80%': { transform: 'translateX(5px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out both',
        'fade-up': 'fade-up 360ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'scale-in': 'scale-in 200ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'sheet-in': 'sheet-in 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'card-in-right': 'card-in-right 320ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'card-in-left': 'card-in-left 320ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'card-lift': 'card-lift 560ms cubic-bezier(0.45, 0.05, 0.25, 1)',
        'card-lift-alt': 'card-lift-alt 560ms cubic-bezier(0.45, 0.05, 0.25, 1)',
        'check-draw': 'check-draw 500ms 250ms cubic-bezier(0.65, 0, 0.35, 1) both',
        'ring-pop': 'ring-pop 500ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        shake: 'shake 360ms ease-in-out',
      },
    },
  },
  plugins: [],
};
