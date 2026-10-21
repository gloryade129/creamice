// Tailwind CSS v4 is compiled through its PostCSS plugin. Without this file
// the production webpack build inlines the Tailwind import but never expands
// the utilities, so pages render unstyled.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
