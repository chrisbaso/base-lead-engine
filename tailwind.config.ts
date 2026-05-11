import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config = {
  darkMode: ["class"],
  content: [
    "./apps/**/*.{ts,tsx}",
    "./packages/core/src/**/*.{ts,tsx}",
    "./packages/ui/src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--color-ink)",
        "ink-muted": "var(--color-ink-muted)",
        paper: "var(--color-paper)",
        surface: "var(--color-surface)",
        rule: "var(--color-rule)",
        brand: {
          DEFAULT: "var(--color-brand)",
          soft: "var(--color-brand-soft)"
        },
        background: "var(--color-paper)",
        foreground: "var(--color-ink)",
        muted: "var(--color-surface)",
        "muted-foreground": "var(--color-ink-muted)",
        primary: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-paper)"
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-paper)"
        },
        secondary: {
          DEFAULT: "var(--color-surface)",
          foreground: "var(--color-ink)"
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff"
        },
        border: "var(--color-rule)",
        input: "var(--color-rule)",
        ring: "var(--color-brand)",
        card: {
          DEFAULT: "var(--color-surface)",
          foreground: "var(--color-ink)"
        },
        popover: {
          DEFAULT: "var(--color-surface)",
          foreground: "var(--color-ink)"
        },
        "brand-foreground": "var(--brand-foreground)"
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Fraunces", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter Tight", "Inter", "sans-serif"]
      },
      borderRadius: {
        lg: "4px",
        md: "4px",
        sm: "2px"
      },
      spacing: {
        "section": "128px",
        "section-lg": "160px",
        "section-mobile": "80px"
      }
    }
  },
  plugins: [typography]
} satisfies Config;

export default config;
