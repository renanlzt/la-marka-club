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
        lamarka: {
          50: '#FAF6F5',
          100: '#F4EAE8',
          200: '#EADBD7',
          300: '#DFC2BC',
          400: '#D2ADA6',
          500: '#C59B94', // Dusty Rose principal da marca
          600: '#A97C75',
          700: '#8A5D57',
          800: '#5F3A36', // Terracotta escuro
          900: '#3D2220',
          champagne: '#DFB76C',
          cream: '#FAF6F5',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Cormorant Garamond', 'Playfair Display', 'serif'],
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'luxury': '0 12px 36px -4px rgba(95, 58, 54, 0.08), 0 4px 12px -2px rgba(95, 58, 54, 0.03)',
        'luxury-lg': '0 20px 48px -6px rgba(95, 58, 54, 0.12), 0 8px 16px -2px rgba(95, 58, 54, 0.05)',
        'card': '0 2px 8px -1px rgba(95, 58, 54, 0.05), 0 1px 4px -1px rgba(95, 58, 54, 0.02)',
        'card-hover': '0 8px 24px -2px rgba(95, 58, 54, 0.08), 0 2px 6px -1px rgba(95, 58, 54, 0.04)',
        'glow-gold': '0 0 24px -2px rgba(223, 183, 108, 0.25)',
      },
      borderColor: {
        'luxury-subtle': 'rgba(95, 58, 54, 0.08)',
        'luxury-gold': 'rgba(223, 183, 108, 0.3)',
      },
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
      },
    },
  },
  plugins: [],
};

export default config;
