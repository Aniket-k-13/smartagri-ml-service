import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server runs on :3000 to match the backend's CORS_ALLOWED_ORIGINS
// (see smartagri-backend/.env.example — CORS_ALLOWED_ORIGINS=http://localhost:3000)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
});
