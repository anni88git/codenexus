/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        cyan: {
          450: '#22dde4',
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'purple-glow': 'purple-glow 2s ease-in-out infinite',
        'slide-in-up': 'slide-in-up 0.35s ease-out forwards',
        'slide-in-down': 'slide-in-down 0.3s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.35s ease-out forwards',
        'fade-in': 'fade-in 0.45s ease-out forwards',
        'scale-in': 'scale-in 0.3s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
        'spin-slow': 'spin-slow 8s linear infinite',
        'typewriter-cursor': 'typewriter-cursor 1s step-end infinite',
        'node-pulse': 'node-pulse 2s ease-in-out infinite',
        'border-march': 'border-march 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}