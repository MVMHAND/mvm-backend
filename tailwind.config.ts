import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        mvm: {
          blue: '#025fc7',
          yellow: '#ba9309',
        },
      },
      backgroundImage: {
        'gradient-mvm': 'linear-gradient(135deg, #025fc7 0%, #ba9309 100%)',
      },
    },
  },
  plugins: [],
}

export default config
