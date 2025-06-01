import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  optimizeDeps: {
    exclude: ["@arcgis/core"],
  },

  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },

  resolve: {
    alias: [
      {
        find: "@arcgis/core",
        replacement: "@arcgis/core",
      },
    ],
  },
});
