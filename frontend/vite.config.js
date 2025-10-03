import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["frappe-gantt"], // ✅ frappe-gantt을 사전 번들링
  },
  build: {
    commonjsOptions: {
      include: [/frappe-gantt/, /node_modules/],
    },
  },
});
