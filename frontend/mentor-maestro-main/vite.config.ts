import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3005, // Updated to 3005 to match user workflows
    allowedHosts: ["devmentor.change20.no", "localhost", ".change20.no", "127.0.0.1"],
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "https://devwebinar.change20.no",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
