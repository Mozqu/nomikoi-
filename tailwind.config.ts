import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        'neon-blue': '#00f3ff',
        'neon-purple': '#9d00ff',
        'neon-pink': '#ff2e93',
      },
    },
  },
  plugins: [],
} satisfies Config;
