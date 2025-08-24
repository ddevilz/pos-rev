import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type UserConfig } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === "production"

  const plugins = [react(), tailwindcss()]

  const resolve: UserConfig["resolve"] = {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  }

  const build: UserConfig["build"] = {
    target: "es2019",
    sourcemap: !isProd,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Function-based chunking: separate lodash and vendor
        manualChunks(id) {
          if (id.includes("node_modules/lodash")) {
            return "lodash"
          }
          if (id.includes("node_modules")) {
            return "vendor"
          }
        },
      },
    },
  }

  const server: UserConfig["server"] = {
    port: 5173,
    open: false,
  }

  const preview: UserConfig["preview"] = {
    port: 4173,
  }

  return {
    plugins,
    resolve,
    build,
    server,
    preview,
  }
})