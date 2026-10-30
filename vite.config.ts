import path from "node:path"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: Number(process.env.PORT ?? 8443),
    strictPort: true,
  },
  preview: {
    host: true,
    port: Number(process.env.PORT ?? 8443),
  },
  test: {
    environment: "node",
    // The app talks to the real API by default; tests run against the mock transport.
    env: { VITE_USE_MOCK: "true" },
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
})
