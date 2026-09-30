/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ide: {
          bg: '#FFFFFF',
          activityBar: '#F1F5F9',
          sidebar: '#F8FAFC',
          tabBg: '#F8FAFC',
          tabActive: '#FFFFFF',
          accent: '#3B82F6',
          accentHover: '#2563EB',
          selection: '#DBEAFE',
          hover: '#EFF6FF',
          border: '#E2E8F0',
          textMain: '#1E293B',
          textMuted: '#64748B',
          statusBar: '#2563EB',
          success: '#16A34A',
          warning: '#D97706',
          error: '#DC2626',
          surface: '#FFFFFF',
          surfaceElevated: '#F8FAFC',
          editor: '#FFFFFF',
          terminal: '#0F172A'
        }
      },
      fontFamily: {
        mono: ['Fira Code', 'Cascadia Code', 'Consolas', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      }
    },
  },
  plugins: [],
}
