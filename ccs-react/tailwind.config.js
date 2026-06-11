/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        plum:    { DEFAULT: '#3D1C52', dark: '#2A1239', light: '#F5F0FA', mid: '#8B5CA8' },
        gold:    { DEFAULT: '#C9973A', light: '#FDF6E8', mid: '#F5DFA0' },
        rose:    '#B84265',
        cream:   '#FDFAF6',
        ink:     '#1C1611',
        muted:   '#7A6E65',
        hint:    '#B0A89E',
        border:  '#EAE3DA',
        surface: '#FAF7F3',
        og:      { DEFAULT: '#D97706', dark: '#92400E', light: '#FEF3C7' },
        ccs: {
          green:  '#1A7F5A',
          'green-lt': '#E8F7F1',
          red:    '#B5292B',
          'red-lt':   '#FDECEC',
          blue:   '#1A5FA8',
          'blue-lt':  '#EBF2FC',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        cake: '0 4px 20px rgba(60,30,10,.09)',
        modal: '0 24px 80px rgba(0,0,0,.22)',
      },
    },
  },
  plugins: [],
}
