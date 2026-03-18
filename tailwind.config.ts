import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        surface: { 
          DEFAULT: '#F1F5F9', 
          50: '#F8FAFC', 
          100: '#F1F5F9', 
          200: '#E2E8F0', 
          300: '#CBD5E1',
          400: '#94A3B8'
        },
        ink: { 
          DEFAULT: '#0F172A', 
          200: '#94A3B8', 
          300: '#64748B', 
          400: '#475569', 
          500: '#334155', 
          600: '#1E293B', 
          700: '#0F172A', 
          800: '#020617' 
        },
        accent: { 
          DEFAULT: '#1A2F4A', // Navy from button
          50: '#F0F4F8',
          400: '#2A7FC5', // Lighter blue from button
          500: '#1A2F4A', 
          600: '#1A2F4A', 
          700: '#111E2F',
          900: '#0A121C'
        },
        primary: {
          DEFAULT: '#1A2F4A',
          50: '#F0F4F8',
          100: '#E1E9F0',
          500: '#1A2F4A',
          600: '#14253A',
          700: '#0E1A29',
        }
      },
      backgroundImage: {
        'gradient-premium': 'linear-gradient(135deg, #1A2F4A 0%, #2A7FC5 100%)',
        'gradient-soft': 'linear-gradient(to bottom right, #F8FAFC, #F1F5F9)',
        'gradient-mesh': 'radial-gradient(at 0% 0%, rgba(26, 47, 74, 0.05) 0, transparent 50%), radial-gradient(at 50% 0%, rgba(42, 127, 197, 0.05) 0, transparent 50%), radial-gradient(at 100% 0%, rgba(20, 37, 58, 0.05) 0, transparent 50%)',
      },
      boxShadow: { 
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'premium': '0 0 0 1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}
export default config
