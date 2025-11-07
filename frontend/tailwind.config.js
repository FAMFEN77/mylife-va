/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        '2xl': '1240px',
      },
    },
    extend: {
      colors: {
        brand: {
          50: '#f6f2ff',
          100: '#ede2ff',
          200: '#dac7ff',
          300: '#c0a4ff',
          400: '#a37dff',
          500: '#8658ff',
          600: '#6d3de6',
          700: '#542bb5',
          800: '#3c1f82',
          900: '#271355',
        },
        mint: {
          50: '#eafffc',
          100: '#cffff9',
          200: '#a8f8f0',
          300: '#6fe9df',
          400: '#3bd6c9',
          500: '#17bcae',
          600: '#0d9d94',
          700: '#107f77',
          800: '#135f5a',
          900: '#134a45',
        },
        blush: {
          50: '#fff0fb',
          100: '#ffd9f3',
          200: '#ffb3e5',
          300: '#ff8bd6',
          400: '#ff63c3',
          500: '#ef3aa7',
          600: '#d02288',
          700: '#a31868',
          800: '#78124b',
          900: '#510b32',
        },
        pearl: {
          50: '#faf7ff',
          100: '#f1edfd',
          200: '#e4e1fb',
          300: '#d3cff2',
        },
        midnight: {
          50: '#f2f5ff',
          100: '#e6ecff',
          200: '#cad6ff',
          300: '#9fb5ff',
          400: '#708eff',
          500: '#4f63ff',
          600: '#3a41d8',
          700: '#2a2fa8',
          800: '#1f237a',
          900: '#15194f',
        },
        ink: '#1c1a2e',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '1.75rem',
        '4xl': '2.5rem',
      },
      boxShadow: {
        glow: '0 20px 45px -20px rgba(134, 88, 255, 0.45)',
        glass: '0 24px 60px -30px rgba(28, 26, 46, 0.35)',
      },
      backgroundImage: {
        'hero-radial':
          'radial-gradient(circle at 15% 15%, rgba(134,88,255,0.45), transparent 55%), radial-gradient(circle at 80% 0%, rgba(23,188,174,0.35), transparent 60%)',
      },
    },
  },
  plugins: [],
};
