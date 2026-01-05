/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,24,40,.06), 0 8px 24px rgba(16,24,40,.06)",
        lift: "0 1px 2px rgba(16,24,40,.08), 0 18px 50px rgba(16,24,40,.12)",
      },
      colors: {
        // Token-based theme (change once, updates everywhere)
        bg: "hsl(var(--bg))",
        surface: "hsl(var(--surface))",
        card: "hsl(var(--card))",
        text: "hsl(var(--text))",
        muted: "hsl(var(--muted))",
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",

        primary: {
          DEFAULT: "hsl(var(--primary))",
          fg: "hsl(var(--primary-fg))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          fg: "hsl(var(--secondary-fg))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          fg: "hsl(var(--danger-fg))",
        },
        warn: {
          DEFAULT: "hsl(var(--warn))",
          fg: "hsl(var(--warn-fg))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          fg: "hsl(var(--success-fg))",
        },
      },
    },
  },
  plugins: [],
};

