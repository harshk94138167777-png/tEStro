/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#000000',
          'bg-deep': '#050505',
          panel: '#0a120a',
          'panel-elevated': '#0f1a0f',
          border: '#1a2e1a',
          'border-bright': '#00ff41',
          accent: '#00ff41',
          'accent-bright': '#5fff8a',
          'accent-muted': '#5a8f72',
          'input-bg': '#0d1610',
          'accent-dim': 'rgba(0, 255, 65, 0.16)',
          cyan: '#4dd0e1',
          success: '#00ff41',
          muted: '#6b8f6f',
          danger: '#f87171',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        suite:
          '0 0 0 1px rgba(0, 255, 65, 0.22), 0 0 40px -12px rgba(0, 255, 65, 0.28), inset 0 1px 0 rgba(0, 255, 65, 0.06)',
        'suite-sm':
          '0 0 0 1px rgba(0, 255, 65, 0.3), 0 0 24px -8px rgba(0, 255, 65, 0.35)',
        glow: '0 0 24px rgba(0, 255, 65, 0.45), 0 0 48px -12px rgba(0, 255, 65, 0.25)',
      },
    },
  },
  plugins: [],
};
