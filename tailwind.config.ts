import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        'sans': ['Google Sans', 'Roboto', 'system-ui', 'sans-serif'],
        'google': ['Google Sans', 'sans-serif'],
        'roboto': ['Roboto', 'sans-serif'],
      },
      fontSize: {
        // Google-style font scale - matches Gmail and Google apps
        'xs': ['0.75rem', { lineHeight: '1.4' }],    // 12px
        'sm': ['0.875rem', { lineHeight: '1.4' }],   // 14px  
        'base': ['1rem', { lineHeight: '1.5' }],     // 16px - minimum for mobile
        'lg': ['1.125rem', { lineHeight: '1.4' }],   // 18px
        'xl': ['1.25rem', { lineHeight: '1.4' }],    // 20px
        '2xl': ['1.5rem', { lineHeight: '1.3' }],    // 24px
        '3xl': ['1.75rem', { lineHeight: '1.3' }],   // 28px
        '4xl': ['2rem', { lineHeight: '1.2' }],      // 32px
      },
      spacing: {
        // Mobile spacing scale - Industry standards
        '11': '2.75rem',  // 44px - minimum touch target
        '13': '3.25rem',  // 52px
        '15': '3.75rem',  // 60px
        '18': '4.5rem',   // 72px
      },
      minHeight: {
        'touch': '2.75rem',      // 44px minimum touch target
        'touch-comfortable': '3rem', // 48px comfortable touch target
      },
      minWidth: {
        'touch': '2.75rem',      // 44px minimum touch target  
        'touch-comfortable': '3rem', // 48px comfortable touch target
      },
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-card': 'var(--gradient-card)',
        'gradient-balance': 'var(--gradient-balance)',
        'gradient-income': 'var(--gradient-income)',
        'gradient-expense': 'var(--gradient-expense)',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'card': 'var(--shadow-card)',
        'elevated': 'var(--shadow-elevated)',
        'large': 'var(--shadow-large)',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          from: {
            opacity: "0",
            transform: "translateY(10px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
