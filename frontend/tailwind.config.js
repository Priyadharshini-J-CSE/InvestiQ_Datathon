/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B0B0B',
        card: '#181818',
        primary: '#FF2D2D',
        accent: '#E53935',
        green: '#00D26A',
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      boxShadow: {
        glow: '0 0 20px rgba(255,45,45,0.4)',
        'glow-sm': '0 0 10px rgba(255,45,45,0.3)',
      }
    }
  },
  plugins: []
}
