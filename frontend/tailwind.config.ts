import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './features/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F4F0E8',
        surface: '#FFFCF5',
        'surface-muted': '#F7F2EA',
        ink: '#18181B',
        muted: '#71717A',
        line: '#E6DED2',
        accent: '#1F6F5B',
        emerald: {
          450: '#39a66f'
        }
      },
      boxShadow: {
        warm: '0 24px 70px rgba(69, 55, 35, 0.08)',
        'warm-sm': '0 14px 34px rgba(69, 55, 35, 0.055)',
        panel: '0 18px 44px rgba(69, 55, 35, 0.07)'
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular']
      }
    }
  },
  plugins: []
};

export default config;
