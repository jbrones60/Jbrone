import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ['frontend-production-1082.up.railway.app'],
    host: true,
    port: process.env.PORT ? parseInt(process.env.PORT) : 4173,
  },
});
