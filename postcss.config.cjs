module.exports = {
  plugins: {
    '@tailwindcss/postcss': {
      // Disable inline CSS for HTML files to fix Vite proxy issue
      inlineCSS: false
    },
    autoprefixer: {}
  }
}
