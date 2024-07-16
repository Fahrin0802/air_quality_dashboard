import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  variants: {
    extend: {
      backgroundColor: ['checked'],
      borderColor: ['checked'],
      translate: ['checked'],
    },
  },
  plugins: [ 
    require('@tailwindcss/forms'),
  ],
} satisfies Config

