import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    // nodePolyfills({
    //   include: ['stream', 'util', 'buffer'],
    //   globals: {
    //     Buffer: true,
    //   },
    // }),
    // }),
    // VitePWA({
    //   registerType: 'prompt',
    //   workbox: {
    //     cleanupOutdatedCaches: true,
    //     clientsClaim: true,
    //     skipWaiting: true
    //   },
    //   devOptions: {
    //     enabled: false // DISABLED BY USER REQUEST
    //   },
    //   injectRegister: null // Prevent auto-injection
    // })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          firebase: [
            "firebase/app",
            "firebase/auth",
            "firebase/firestore",
            "firebase/storage",
            "firebase/analytics",
          ],
          ui: ["framer-motion", "lucide-react", "clsx", "tailwind-merge"],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Raise limit slightly since we know we are splitting key chunks
  },
});
