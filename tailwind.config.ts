import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        // Design system border radius
        'ds-sm': 'var(--radius-sm)',
        'ds-base': 'var(--radius-base)',
        'ds-md': 'var(--radius-md)',
        'ds-lg': 'var(--radius-lg)',
        'ds-full': 'var(--radius-full)',
      },
      fontFamily: {
        'ds-base': 'var(--font-family-base)',
        'ds-mono': 'var(--font-family-mono)',
      },
      fontSize: {
        'ds-xs': 'var(--font-size-xs)',
        'ds-sm': 'var(--font-size-sm)',
        'ds-base': 'var(--font-size-base)',
        'ds-md': 'var(--font-size-md)',
        'ds-lg': 'var(--font-size-lg)',
        'ds-xl': 'var(--font-size-xl)',
        'ds-2xl': 'var(--font-size-2xl)',
        'ds-3xl': 'var(--font-size-3xl)',
        'ds-4xl': 'var(--font-size-4xl)',
      },
      spacing: {
        'ds-0': 'var(--space-0)',
        'ds-1': 'var(--space-1)',
        'ds-2': 'var(--space-2)',
        'ds-4': 'var(--space-4)',
        'ds-6': 'var(--space-6)',
        'ds-8': 'var(--space-8)',
        'ds-10': 'var(--space-10)',
        'ds-12': 'var(--space-12)',
        'ds-16': 'var(--space-16)',
        'ds-20': 'var(--space-20)',
        'ds-24': 'var(--space-24)',
        'ds-32': 'var(--space-32)',
      },
      colors: {
        // Existing shadcn colors
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        // Design system colors
        'ds-background': 'var(--color-background)',
        'ds-surface': 'var(--color-surface)',
        'ds-text': 'var(--color-text)',
        'ds-text-secondary': 'var(--color-text-secondary)',
        'ds-primary': {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          active: 'var(--color-primary-active)',
        },
        'ds-secondary': {
          DEFAULT: 'var(--color-secondary)',
          hover: 'var(--color-secondary-hover)',
          active: 'var(--color-secondary-active)',
        },
        'ds-border': 'var(--color-border)',
        'ds-error': 'var(--color-error)',
        'ds-success': 'var(--color-success)',
        'ds-warning': 'var(--color-warning)',
        'ds-info': 'var(--color-info)',
        'ds-card-border': 'var(--color-card-border)',
        'ds-btn-primary-text': 'var(--color-btn-primary-text)',
        'ds-focus-ring': 'var(--color-focus-ring)',
        'ds-status-success-bg': 'rgba(var(--color-success-rgb), 0.15)',
        'ds-status-success-border': 'rgba(var(--color-success-rgb), 0.25)',
        'ds-status-error-bg': 'rgba(var(--color-error-rgb), 0.15)',
        'ds-status-error-border': 'rgba(var(--color-error-rgb), 0.25)',
        'ds-status-warning-bg': 'rgba(var(--color-warning-rgb), 0.15)',
        'ds-status-warning-border': 'rgba(var(--color-warning-rgb), 0.25)',
        'ds-status-info-bg': 'rgba(var(--color-info-rgb), 0.15)',
        'ds-status-info-border': 'rgba(var(--color-info-rgb), 0.25)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
      },
      transitionTimingFunction: {
        standard: 'var(--ease-standard)',
      },
      boxShadow: {
        'ds-xs': 'var(--shadow-xs)',
        'ds-sm': 'var(--shadow-sm)',
        'ds-md': 'var(--shadow-md)',
        'ds-lg': 'var(--shadow-lg)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
