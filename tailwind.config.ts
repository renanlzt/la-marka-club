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
        serif: ['var(--font-serif)', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
