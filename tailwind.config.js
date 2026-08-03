/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#161221',
        pink: '#ff6ec7',
        peach: '#ffb86b',
        sky: '#6ee7ff',
        lime: '#c6f24e',
        paper: '#fffdf7',
        'paper-dim': '#fff5e8',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        hard: '6px 6px 0 #161221',
        'hard-sm': '4px 4px 0 #161221',
        'hard-white': '6px 6px 0 rgba(255,255,255,0.25)',
      },
      borderRadius: {
        brand: '18px',
      },
    },
  },
  plugins: [],
}
