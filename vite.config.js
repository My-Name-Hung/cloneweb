import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), "");

  const API_URL = env.VITE_API_URL || "http://localhost:3000";

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Proxy API requests to backend during development
        "/api": {
          target: API_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
        },
      },
    },
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
    define: {
      __API_URL__: JSON.stringify(API_URL),
    },
  };
});
