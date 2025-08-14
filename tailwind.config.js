/**********************
 * TailwindCSS Config  *
 **********************/
export default {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b0f1a',
        card: '#111827',
        accent: '#22d3ee',
        positive: '#10b981',
        negative: '#ef4444'
      }
    }
  },
  plugins: []
};