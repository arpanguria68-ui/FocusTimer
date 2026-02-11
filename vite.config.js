const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react-swc");
const path = require("path");

// https://vitejs.dev/config/
module.exports = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Force deduplication of Clerk packages
      "@clerk/clerk-react": path.resolve(__dirname, "node_modules/@clerk/clerk-react"),
      "@clerk/shared": path.resolve(__dirname, "node_modules/@clerk/shared"),
    },
  },
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        main: "index.html",
        dashboard: "dashboard.html",
        fullapp: "fullapp.html",
        smilePopup: "smile-popup.html",
      },
      output: {
      }
    },
  },
}));
