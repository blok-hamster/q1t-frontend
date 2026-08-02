import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#080A0C',
          secondary: '#0F1215',
          tertiary: '#16191E',
        },
        text: {
          primary: '#E1E4E8',
          secondary: '#8B949E',
          tertiary: '#586069',
          disabled: '#373E47',
        },
        accent: {
          primary: '#20B2AA',
          hover: '#1CA099',
          muted: 'rgba(32, 178, 170, 0.12)',
        },
        positive: '#20B2AA',
        negative: '#E55353',
        neutral: '#D99B00',
        border: {
          DEFAULT: '#1B2026',
          hover: '#2A313A',
          active: '#20B2AA',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-syne)', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Courier New', 'monospace'],
      },
      fontSize: {
        xs: ['11px', { lineHeight: '15px' }],
        sm: ['13px', { lineHeight: '18px' }],
        base: ['14px', { lineHeight: '20px' }],
        lg: ['16px', { lineHeight: '22px' }],
        xl: ['18px', { lineHeight: '24px' }],
        '2xl': ['20px', { lineHeight: '26px' }],
        '3xl': ['24px', { lineHeight: '30px' }],
        '4xl': ['28px', { lineHeight: '34px' }],
        '5xl': ['36px', { lineHeight: '42px' }],
      },
      borderRadius: {
        DEFAULT: '2px',
        xs: '1px',
        sm: '2px',
        md: '3px',
        lg: '4px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
        DEFAULT: '0 2px 8px rgba(0, 0, 0, 0.6)',
        md: '0 2px 8px rgba(0, 0, 0, 0.6)',
        lg: '0 4px 16px rgba(0, 0, 0, 0.7)',
        glow: '0 0 12px rgba(32, 178, 170, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
