/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: 'var(--g)',
          deep: '#173F35',
          mint: 'var(--mint)',
        },
        sage: {
          DEFAULT: 'var(--sage)',
          light: '#A9BFA8',
        },
        terracotta: {
          DEFAULT: 'var(--terracotta)',
          soft: '#C98268',
        },
        cream: 'var(--cream)',
        skybrand: {
          DEFAULT: 'var(--sky)',
          light: 'var(--skyl)',
        },
        card: 'var(--card)',
        background: 'var(--bg)',
        ink: 'var(--ink)',
        mute: 'var(--mute)',
        line: 'var(--line)',
      },
      boxShadow: {
        subtle: 'var(--sh)',
        editorial: '0 8px 30px rgba(23, 63, 53, 0.06)',
        elevated: '0 14px 36px rgba(23, 63, 53, 0.10)',
      },
      fontFamily: {
        display: ['"DM Sans"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
