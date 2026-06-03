/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primaryHover)",
        "primary-light": "var(--color-primaryLight)",
        background: "var(--color-background)",
        "background-secondary": "var(--color-backgroundSecondary)",
        text: "var(--color-text)",
        "text-secondary": "var(--color-textSecondary)",
        // shadcn/ui component tokens
        card: {
          DEFAULT: "var(--color-cardBg)",
          foreground: "var(--color-text)",
        },
        muted: {
          DEFAULT: "var(--color-backgroundTertiary)",
          foreground: "var(--color-textSecondary)",
        },
        accent: {
          DEFAULT: "var(--color-backgroundTertiary)",
          foreground: "var(--color-text)",
        },
        foreground: "var(--color-text)",
        border: "var(--color-border)",
        input: "var(--color-border)",
        // Workspace design tokens
        navy: {
          DEFAULT: "var(--color-navy)",
          light: "var(--color-navy-light)",
        },
        teal: {
          DEFAULT: "var(--color-teal)",
          light: "var(--color-teal-light)",
        },
        "amber-warn": "var(--color-amber-warn)",
        "red-urgent": "var(--color-red-urgent)",
        "green-safe": "var(--color-green-safe)",
        "warm-white": "var(--color-warm-white)",
        "warm-gray": "var(--color-warm-gray)",
      },
      fontFamily: {
        heading: "var(--font-heading)",
        body: "var(--font-body)",
        mono: "var(--font-mono)",
      },
    },
  },
  plugins: [],
};
