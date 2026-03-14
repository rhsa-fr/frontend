import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        surface: { DEFAULT: '#F7F7F5', 50: '#FAFAF8', 100: '#F7F7F5', 200: '#EFEFEB', 300: '#E4E4DF' },
        ink: { DEFAULT: '#1A1A1A', 200: '#C8C8C8', 300: '#A0A0A0', 400: '#707070', 500: '#505050', 600: '#383838', 700: '#282828', 800: '#1A1A1A' },
        accent: { DEFAULT: '#2563EB', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8' },
      },
      boxShadow: { card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)' },
    },
  },
  plugins: [],
}
export default config
