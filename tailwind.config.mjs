/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      
      
      maxWidth: {
        480: "480px",
        "screen-lg": "1280px",
      },
    },
  },
  plugins: [],
};
