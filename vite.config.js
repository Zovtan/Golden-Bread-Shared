import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';



export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    allowedHosts: ["overlay-unburned-smokeless.ngrok-free.dev"]
  },
  build: {
    rollupOptions: {
      output: {


        manualChunks: (id) => {
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3")) return "recharts";
        }
      }
    }
  }
});