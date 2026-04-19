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
          primary: '#0A0B0D',
          secondary: '#13151A',
          tertiary: '#1C1E26',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#8B8D98',
          tertiary: '#5A5C66',
          disabled: '#3A3C44',
        },
        accent: {
          primary: '#00D4FF',
          hover: '#00B8E6',
          muted: 'rgba(0, 212, 255, 0.15)',
        },
        positive: '#00FF88',
        negative: '#FF3366',
        neutral: '#FFB800',
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          hover: 'rgba(255, 255, 255, 0.12)',
          active: '#00D4FF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Courier New', 'monospace'],
      },
      fontSize: {
        xs: ['10px', { lineHeight: '14px', letterSpacing: '0.01em' }],
        sm: ['12px', { lineHeight: '18px' }],
        base: ['14px', { lineHeight: '20px' }],
        lg: ['16px', { lineHeight: '24px' }],
        xl: ['18px', { lineHeight: '24px' }],
        '2xl': ['20px', { lineHeight: '28px' }],
        '3xl': ['24px', { lineHeight: '32px' }],
        '4xl': ['28px', { lineHeight: '32px' }],
        '5xl': ['32px', { lineHeight: '38px' }],
      },
      spacing: {
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '20px',
        xl: '24px',
        xxl: '32px',
        xxxl: '48px',
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '4px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0, 0, 0, 0.3)',
        DEFAULT: '0 4px 12px rgba(0, 0, 0, 0.3)',
        md: '0 4px 12px rgba(0, 0, 0, 0.3)',
        lg: '0 8px 24px rgba(0, 0, 0, 0.4)',
        xl: '0 16px 48px rgba(0, 0, 0, 0.5)',
        glow: '0 0 20px rgba(0, 212, 255, 0.3)',
      },
      transitionDuration: {
        fast: '200ms',
        DEFAULT: '300ms',
        slow: '500ms',
      },
      transitionTimingFunction: {
        'ease-default': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
