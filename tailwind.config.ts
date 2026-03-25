import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Stage colors - must be safelisted for dynamic usage
    'bg-purple-100', 'border-purple-400',
    'bg-violet-100', 'border-violet-400',
    'bg-orange-100', 'border-orange-400',
    'bg-amber-100', 'border-amber-400',
    'bg-yellow-100', 'border-yellow-400',
    'bg-blue-100', 'border-blue-400',
    'bg-cyan-100', 'border-cyan-400',
    'bg-teal-100', 'border-teal-500',
    'bg-emerald-100', 'border-emerald-500',
    'bg-green-100', 'border-green-500',
    'bg-green-200', 'border-green-600',
    'bg-gray-100', 'border-gray-400',
    'bg-gray-50', 'border-gray-300',
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;
