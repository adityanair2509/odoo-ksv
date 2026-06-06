/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background:  '#F8F9FA',
        surface:     '#FFFFFF',
        sidebar:     '#111318',
        border:      '#E4E4E7',
        primary:     '#2563EB',
        success:     '#16A34A',
        warning:     '#D97706',
        danger:      '#DC2626',
        text: {
          primary:   '#18181B',
          secondary: '#52525B',
          muted:     '#A1A1AA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
