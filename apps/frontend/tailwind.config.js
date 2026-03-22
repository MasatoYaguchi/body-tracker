/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media', // システム設定に追従
  theme: {
    extend: {
      colors: {
        // プライマリカラー（CSS変数参照）
        primary: {
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
        },
        // セカンダリカラー
        secondary: {
          500: 'var(--color-secondary-500)',
          600: 'var(--color-secondary-600)',
        },
        // セマンティックカラー（背景・テキスト・ボーダー）
        surface: {
          DEFAULT: 'var(--color-surface)',
          secondary: 'var(--color-surface-secondary)',
          elevated: 'var(--color-surface-elevated)',
        },
        content: {
          DEFAULT: 'var(--color-content)',
          secondary: 'var(--color-content-secondary)',
          muted: 'var(--color-content-muted)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          secondary: 'var(--color-border-secondary)',
        },
        // ステータスカラー
        success: {
          DEFAULT: 'var(--color-success)',
          light: 'var(--color-success-light)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          light: 'var(--color-warning-light)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          light: 'var(--color-danger-light)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          light: 'var(--color-info-light)',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 4px 20px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 6px 25px rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
